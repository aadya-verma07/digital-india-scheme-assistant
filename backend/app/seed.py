"""Create tables and load the scheme data. Run directly with:  python -m app.seed --reset"""
import hashlib
import json
import sys
from .database import Base, SessionLocal, engine
import random
from .models import AppMeta, ApplicationInfo, Document, Eligibility, Scheme, User
from sqlalchemy import inspect
from .seed_data import EXTRA, SCHEMES


def seed(reset: bool = False) -> int:
    insp = inspect(engine)
    if insp.has_table("schemes") and "value_json" not in {c["name"] for c in insp.get_columns("schemes")}:
        reset = True  # database from an older version of the app — rebuild it
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            seed_demo_citizens(db)
        version = hashlib.sha1(json.dumps([SCHEMES, EXTRA], sort_keys=True, default=str).encode()).hexdigest()[:16]
        meta = db.get(AppMeta, "data_version")
        if db.query(Scheme).count() > 0:
            if meta and meta.value == version:
                return 0
            for old in db.query(Scheme).all():   # scheme data was updated: reload it, keep user profiles
                db.delete(old)
            db.commit()
        for s in SCHEMES:
            scheme = Scheme(**{k: s[k] for k in (
                "slug", "scheme_name", "ministry", "sector", "description",
                "target_beneficiaries", "benefits", "official_source")})
            x = EXTRA.get(s["slug"], {})
            scheme.name_hi, scheme.summary_hi, scheme.benefits_hi = x.get("name_hi"), x.get("summary_hi"), x.get("benefits_hi")
            scheme.value_json = json.dumps(x.get("values", []), ensure_ascii=False)
            for group, field, op, value, label in s["criteria"]:
                scheme.criteria.append(Eligibility(group_no=group, criterion=field, operator=op,
                                                   condition_value=json.dumps(value), label=label))
            for name, desc, mandatory in s["documents"]:
                scheme.documents.append(Document(document_name=name, description=desc, mandatory=mandatory))
            a = s["application"]
            scheme.application = ApplicationInfo(mode=a["mode"], steps=json.dumps(a["steps"]),
                                                 apply_url=a["apply_url"], helpline=a["helpline"])
            db.add(scheme)
        if meta:
            meta.value = version
        else:
            db.add(AppMeta(key="data_version", value=version))
        db.commit()
        return len(SCHEMES)
    finally:
        db.close()


def seed_demo_citizens(db, n: int = 120) -> None:
    """Synthetic citizen profiles so the Insights dashboard has data to show in a demo.
    Real profiles submitted through the app are added on top of these."""
    rng = random.Random(42)
    occupations = ["farmer"] * 6 + ["student"] * 4 + ["self_employed"] * 3 + ["artisan"] * 2 + ["salaried"] * 3 + \
                  ["homemaker"] * 3 + ["unemployed"] * 2 + ["retired"] * 2 + ["street_vendor"]
    states = ["Uttar Pradesh", "Bihar", "Rajasthan", "Madhya Pradesh", "Maharashtra", "West Bengal", "Delhi", "Odisha"]
    for _ in range(n):
        occ = rng.choice(occupations)
        age = {"student": rng.randint(16, 25), "retired": rng.randint(60, 82)}.get(occ, rng.randint(19, 72))
        gender = "female" if occ == "homemaker" or rng.random() < 0.45 else "male"
        area = "rural" if occ == "farmer" or rng.random() < 0.55 else "urban"
        income = rng.choice([60000, 90000, 140000, 200000, 240000, 350000, 480000, 700000, 1100000])
        extra = {
            "bpl": income <= 140000 and rng.random() < 0.8,
            "has_bank_account": rng.random() < 0.9,
            "income_tax_payer": income >= 700000,
            "owns_land": occ == "farmer" and rng.random() < 0.85,
            "owns_pucca_house": rng.random() < (0.3 if income < 250000 else 0.7),
            "has_lpg": rng.random() < (0.45 if income < 150000 else 0.9),
        }
        extra["pregnant_or_lactating"] = gender == "female" and 20 <= age <= 35 and rng.random() < 0.15
        extra["has_girl_child_under_10"] = 22 <= age <= 45 and rng.random() < 0.25
        for k in list(extra):           # leave some answers blank, like real users do
            if rng.random() < 0.12:
                extra.pop(k)
        db.add(User(name=None, age=age, gender=gender, occupation=occ, income=income, location=rng.choice(states),
                    area=area, category=rng.choice(["General", "OBC", "OBC", "SC", "ST"]),
                    education={"student": rng.choice(["post_matric", "graduate"])}.get(occ, rng.choice(["school", "post_matric", "graduate", None])),
                    extra=json.dumps(extra)))
    db.commit()


if __name__ == "__main__":
    n = seed(reset="--reset" in sys.argv)
    print(f"Seeded {n} schemes." if n else "Database already has schemes (use --reset to reload).")
