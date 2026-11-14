"""FastAPI backend — Digital India Citizen Services & Government Scheme Assistant.

Run from the backend/ folder:   uvicorn app.main:app --reload
Then open http://127.0.0.1:8000   (API docs at /docs)
"""
import json
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from . import ai
from .database import get_db
from .extract import extract
from .i18n import describe_update
from .matching import documents_plan, evaluate, match, value_summary
from .models import Scheme, User
from .schemas import ChatRequest, ExtractRequest, MatchRequest, Profile
from .seed import seed

app = FastAPI(title="Digital India Scheme Assistant API", version="1.0.0",
              description="Scheme discovery, eligibility assistance, document guidance and an AI assistant.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

FRONTEND = Path(__file__).resolve().parents[2] / "frontend"


@app.on_event("startup")
def startup():
    n = seed()
    if n:
        print(f"Seeded {n} schemes into the database.")


def load_schemes(db: Session) -> list[Scheme]:
    return (db.query(Scheme)
            .options(selectinload(Scheme.criteria), selectinload(Scheme.documents), selectinload(Scheme.application))
            .order_by(Scheme.scheme_name).all())


def scheme_detail(s: Scheme) -> dict:
    groups: dict[int, list] = {}
    for c in s.criteria:
        groups.setdefault(c.group_no, []).append(c.label)
    return {
        "scheme_id": s.scheme_id, "slug": s.slug, "scheme_name": s.scheme_name, "ministry": s.ministry,
        "sector": s.sector, "description": s.description, "target_beneficiaries": s.target_beneficiaries,
        "benefits": s.benefits, "official_source": s.official_source,
        "name_hi": s.name_hi, "summary_hi": s.summary_hi, "benefits_hi": s.benefits_hi, "values": s.values,
        "eligibility": [{"route": g, "conditions": labels} for g, labels in sorted(groups.items())],
        "documents": [{"name": d.document_name, "description": d.description, "mandatory": d.mandatory} for d in s.documents],
        "application": {"mode": s.application.mode, "steps": json.loads(s.application.steps),
                        "apply_url": s.application.apply_url, "helpline": s.application.helpline} if s.application else None,
    }


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    return {"status": "ok", "schemes": db.query(Scheme).count(), "ai_mode": ai.LLM_PROVIDER if ai.llm_enabled() else "rules"}


@app.get("/api/sectors")
def sectors(db: Session = Depends(get_db)):
    return sorted({s for (s,) in db.query(Scheme.sector).all()})


@app.get("/api/schemes")
def list_schemes(q: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Scheme)
    if sector:
        query = query.filter(Scheme.sector == sector)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Scheme.scheme_name.ilike(like), Scheme.description.ilike(like),
                                 Scheme.target_beneficiaries.ilike(like), Scheme.benefits.ilike(like)))
    return [{"scheme_id": s.scheme_id, "slug": s.slug, "scheme_name": s.scheme_name, "name_hi": s.name_hi, "sector": s.sector,
             "ministry": s.ministry, "description": s.description, "summary_hi": s.summary_hi, "benefits": s.benefits,
             "values": s.values}
            for s in query.order_by(Scheme.scheme_name)]


@app.get("/api/schemes/{scheme_id}")
def get_scheme(scheme_id: int, db: Session = Depends(get_db)):
    s = db.get(Scheme, scheme_id)
    if not s:
        raise HTTPException(404, "Scheme not found")
    return scheme_detail(s)


@app.post("/api/match")
def match_schemes(req: MatchRequest, db: Session = Depends(get_db)):
    profile = req.profile.model_dump()
    user_id = None
    if req.save:
        extra = {k: v for k, v in profile.items() if isinstance(v, bool)}
        u = User(name=profile["name"], age=profile["age"], gender=profile["gender"], education=profile["education"],
                 occupation=profile["occupation"], income=profile["income"], location=profile["state"],
                 area=profile["area"], category=profile["category"], extra=json.dumps(extra))
        db.add(u)
        db.commit()
        user_id = u.user_id
    schemes = load_schemes(db)
    results = match(profile, schemes)
    counts = {k: sum(r["status"] == k for r in results) for k in ("likely", "check", "not_eligible")}
    return {"user_id": user_id, "counts": counts, "results": results,
            "value": value_summary(results), "documents": documents_plan(results, schemes)}


@app.post("/api/extract")
def extract_profile(req: ExtractRequest):
    """Natural-language profile filling: 'I am a 45 year old farmer from Bihar...' -> profile fields."""
    fields = extract(req.text)
    return {"profile": fields, "noted": [describe_update(k, v, "en") for k, v in fields.items()]}


@app.get("/api/insights")
def insights(occupation: str | None = None, area: str | None = None, gender: str | None = None,
             state: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    """Aggregate demand analytics for administrators, computed from saved profiles.
    Optional filters narrow the citizens (occupation, area, gender, state) or the schemes (sector)."""
    schemes = load_schemes(db)
    if sector:
        schemes = [s for s in schemes if s.sector == sector]
    query = db.query(User)
    if occupation:
        query = query.filter(User.occupation == occupation)
    if area:
        query = query.filter(User.area == area)
    if gender:
        query = query.filter(User.gender == gender)
    if state:
        query = query.filter(User.location == state)
    users = query.all()
    per_scheme = {s.scheme_id: {"scheme_name": s.scheme_name, "sector": s.sector, "likely": 0, "check": 0} for s in schemes}
    blockers: dict[str, int] = {}
    unanswered: dict[str, int] = {}
    total_likely, cash, cover = 0, 0, 0
    occupations: dict[str, int] = {}
    areas: dict[str, int] = {}
    reached = 0
    for u in users:
        p = {"age": u.age, "gender": u.gender, "education": u.education, "occupation": u.occupation, "income": u.income,
             "state": u.location, "area": u.area, "category": u.category, **json.loads(u.extra or "{}")}
        res = match(p, schemes)
        missing_fields = set()
        for r in res:
            if r["status"] in ("likely", "check"):
                per_scheme[r["scheme_id"]][r["status"]] += 1
            failed = [c for c in r["conditions"] if c["result"] == "not_met"]
            # near miss: shut out by exactly one condition that outreach or policy could act on
            if len(failed) == 1 and failed[0]["field"] in ("income", "age", "bpl", "has_bank_account", "owns_land", "area"):
                key = (failed[0]["label"], failed[0]["label_hi"], r["scheme_name"].split(" (")[0])
                blockers[key] = blockers.get(key, 0) + 1
            missing_fields |= {c["field"] for c in r["conditions"] if c["result"] == "unknown"}
        for f in missing_fields:
            unanswered[f] = unanswered.get(f, 0) + 1
        n_likely = sum(r["status"] == "likely" for r in res)
        total_likely += n_likely
        reached += n_likely > 0
        if u.area:
            areas[u.area] = areas.get(u.area, 0) + 1
        v = value_summary(res)
        cash += v["annual_cash"] + v["one_time"]
        cover += v["cover"]
        if u.occupation:
            occupations[u.occupation] = occupations.get(u.occupation, 0) + 1
    n = len(users)
    return {
        "profiles": n,
        "avg_schemes_per_citizen": round(total_likely / n, 1) if n else 0,
        "cash_support_identified": cash,
        "cover_identified": cover,
        "schemes": sorted(per_scheme.values(), key=lambda x: (-x["likely"], -x["check"])),
        "top_blockers": sorted(({"label": k[0], "label_hi": k[1], "scheme": k[2], "count": v} for k, v in blockers.items()),
                              key=lambda x: -x["count"])[:6],
        "most_unanswered": sorted(({"field": k, "count": v} for k, v in unanswered.items()), key=lambda x: -x["count"])[:6],
        "occupations": sorted(({"occupation": k, "count": v} for k, v in occupations.items()), key=lambda x: -x["count"]),
        "share_with_a_scheme": round(reached / n, 3) if n else 0,
        "areas": sorted(({"area": k, "count": v} for k, v in areas.items()), key=lambda x: -x["count"]),
        "filters": {"occupation": occupation, "area": area, "gender": gender, "state": state, "sector": sector},
    }


@app.post("/api/eligibility/{scheme_id}")
def check_eligibility(scheme_id: int, profile: Profile, db: Session = Depends(get_db)):
    s = db.get(Scheme, scheme_id)
    if not s:
        raise HTTPException(404, "Scheme not found")
    return {"scheme_id": scheme_id, "scheme_name": s.scheme_name, **evaluate(profile.model_dump(), s)}


@app.post("/api/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    schemes = load_schemes(db)
    profile = req.profile.model_dump() if req.profile else None
    return await ai.answer(req.message, schemes, profile, req.scheme_id, [h.model_dump() for h in req.history],
                           req.pending_field, req.answer_value, req.interview, req.lang)


# Serve the frontend from the same server
app.mount("/static", StaticFiles(directory=FRONTEND), name="static")


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(FRONTEND / "index.html")
