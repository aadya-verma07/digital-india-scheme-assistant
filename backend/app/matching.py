"""Scheme Discovery & Eligibility Assistance engine (Modules 6.3 and 6.4).

Each criterion is checked against the user's profile and returns one of:
  met      – the profile satisfies the condition
  not_met  – the profile clearly fails it
  unknown  – the user hasn't given that information yet
Criteria are grouped: all conditions in a group must hold; any one group is enough.
This is guidance only — it never makes an official eligibility decision.
"""
from .i18n import label_hi
from .models import Eligibility, Scheme

MET, NOT_MET, UNKNOWN = "met", "not_met", "unknown"


def check(profile: dict, c: Eligibility) -> str:
    actual = profile.get(c.criterion)
    if actual is None or actual == "":
        return UNKNOWN
    expected, op = c.value, c.operator
    if isinstance(actual, str):
        actual_cmp = actual.lower()
        expected = expected.lower() if isinstance(expected, str) else (
            [e.lower() for e in expected] if isinstance(expected, list) else expected)
    else:
        actual_cmp = actual
    ok = {
        "eq": lambda: actual_cmp == expected,
        "neq": lambda: actual_cmp != expected,
        "gte": lambda: actual_cmp >= expected,
        "lte": lambda: actual_cmp <= expected,
        "between": lambda: expected[0] <= actual_cmp <= expected[1],
        "in": lambda: actual_cmp in expected,
    }[op]()
    return MET if ok else NOT_MET


def evaluate(profile: dict, scheme: Scheme) -> dict:
    groups: dict[int, list] = {}
    for c in scheme.criteria:
        groups.setdefault(c.group_no, []).append({"label": c.label, "label_hi": label_hi(c.criterion, c.operator, c.value),
                                                   "field": c.criterion, "result": check(profile, c)})
    best, best_key = None, None
    for g in groups.values():
        met = sum(r["result"] == MET for r in g)
        failed = sum(r["result"] == NOT_MET for r in g)
        key = (failed == 0, met / len(g), -failed)
        if best_key is None or key > best_key:
            best, best_key = g, key
    met = sum(r["result"] == MET for r in best)
    failed = sum(r["result"] == NOT_MET for r in best)
    unknown = len(best) - met - failed
    if failed:
        status, summary = "not_eligible", f"{failed} condition{'s' if failed > 1 else ''} not met"
    elif unknown:
        status, summary = "check", f"{met} of {len(best)} conditions met; answer {unknown} more to confirm"
    else:
        status, summary = "likely", "Meets the only condition" if len(best) == 1 else f"Meets all {len(best)} conditions"
    return {
        "status": status,
        "summary": summary,
        "score": round(met / len(best), 3),
        "conditions": best,
        "alternative_routes": len(groups) - 1,
    }


def match(profile: dict, schemes: list[Scheme]) -> list[dict]:
    order = {"likely": 0, "check": 1, "not_eligible": 2}
    results = []
    for s in schemes:
        ev = evaluate(profile, s)
        results.append({"scheme_id": s.scheme_id, "scheme_name": s.scheme_name, "name_hi": s.name_hi,
                        "sector": s.sector, "description": s.description, "benefits": s.benefits,
                        "benefits_hi": s.benefits_hi, "values": s.values, **ev})
    results.sort(key=lambda r: (order[r["status"]], -r["score"], r["scheme_name"]))
    return results


def value_summary(results: list[dict]) -> dict:
    """Add up the estimated value of benefits across schemes the user appears to qualify for."""
    out = {"annual_cash": 0, "one_time": 0, "cover": 0, "loan": 0, "other": []}
    for r in results:
        if r["status"] != "likely":
            continue
        for v in r["values"]:
            if v["type"] in ("annual_cash", "one_time", "cover"):
                out[v["type"]] += v["amount"]
            elif v["type"] == "loan":
                out["loan"] = max(out["loan"], v["amount"])
            else:
                out["other"].append(v["label"])
    return out


def documents_plan(results: list[dict], schemes: list[Scheme]) -> list[dict]:
    """One combined checklist: each document once, with the schemes that need it."""
    by_id = {s.scheme_id: s for s in schemes}
    docs: dict[str, dict] = {}
    for r in results:
        if r["status"] == "not_eligible":
            continue
        for d in by_id[r["scheme_id"]].documents:
            name = d.document_name
            low = name.lower()
            if "bank" in low and "statement" not in low:
                name = "Bank / post office account (Aadhaar-linked)"
            elif low.startswith("aadhaar card"):
                name = "Aadhaar card"
            key = name.lower()
            entry = docs.setdefault(key, {"name": name, "schemes": [], "mandatory": False})
            short = r["scheme_name"].split(" (")[0]
            if short not in entry["schemes"]:
                entry["schemes"].append(short)
            entry["mandatory"] = entry["mandatory"] or d.mandatory
    return sorted(docs.values(), key=lambda d: (-len(d["schemes"]), d["name"]))
