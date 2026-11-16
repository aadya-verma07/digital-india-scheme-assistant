# =====================================================================================
# FILE: matching.py  -  THE ELIGIBILITY ENGINE (heart of the project)
# -------------------------------------------------------------------------------------
# Decides, for every scheme, whether a citizen is "likely eligible", "needs answers"
# or "not eligible", and explains each condition. Used by the results page, the checker's
# live counter, the scheme detail panel, the chatbot and the Insights page - so they always agree.
# Functions:
#   check()          - tests ONE condition against the profile   -> met / not_met / unknown
#   evaluate()       - tests ONE scheme (all its condition groups) -> status + explanation
#   match()          - tests ALL schemes and sorts them (eligible first)
#   value_summary()  - adds up the estimated money/cover from eligible schemes
#   documents_plan() - builds one combined, de-duplicated document checklist
# =====================================================================================

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

# The three possible results of a condition (three-valued logic).
MET, NOT_MET, UNKNOWN = "met", "not_met", "unknown"


# check(profile, c): compare the citizen's value for c.criterion with the rule.
# Example: rule age between [18, 40], profile age 34 -> "met".
# If the citizen has not answered that question, the result is "unknown" (not "fail"),
# so partial profiles still give useful results.
def check(profile: dict, c: Eligibility) -> str:
    actual = profile.get(c.criterion)
    if actual is None or actual == "":
        return UNKNOWN
    expected, op = c.value, c.operator
    # Compare text without caring about capital letters ('Female' == 'female').
    if isinstance(actual, str):
        actual_cmp = actual.lower()
        expected = expected.lower() if isinstance(expected, str) else (
            [e.lower() for e in expected] if isinstance(expected, list) else expected)
    else:
        actual_cmp = actual
    # One small function per operator; the one named by `op` is picked and run:
    #   eq = equal, neq = not equal, gte = at least, lte = at most, between = in a range, in = one of a list
    ok = {
        "eq": lambda: actual_cmp == expected,
        "neq": lambda: actual_cmp != expected,
        "gte": lambda: actual_cmp >= expected,
        "lte": lambda: actual_cmp <= expected,
        "between": lambda: expected[0] <= actual_cmp <= expected[1],
        "in": lambda: actual_cmp in expected,
    }[op]()
    return MET if ok else NOT_MET


# evaluate(profile, scheme): decide the status of one scheme.
# A scheme may have several "groups" of conditions (group_no). Inside a group ALL conditions must hold
# (AND); any ONE group is enough (OR). Example - Ayushman Bharat: group 1 = BPL family, group 2 = age 70+.
# Returns: status ("likely" / "check" / "not_eligible"), a summary sentence, a score (share of conditions met),
# the conditions of the best group with their results, and how many alternative routes exist.
def evaluate(profile: dict, scheme: Scheme) -> dict:
    # Step 1: check every condition and put the results into their groups.
    groups: dict[int, list] = {}
    for c in scheme.criteria:
        groups.setdefault(c.group_no, []).append({"label": c.label, "label_hi": label_hi(c.criterion, c.operator, c.value),
                                                   "field": c.criterion, "result": check(profile, c)})
    # Step 2: pick the group that fits this citizen best. Python compares the key tuples item by item:
    #   1st: a group with no failed condition beats any group with a failure,
    #   2nd: then the higher share of conditions met,
    #   3rd: then fewer failures (shows the route the citizen is closest to).
    best, best_key = None, None
    for g in groups.values():
        met = sum(r["result"] == MET for r in g)
        failed = sum(r["result"] == NOT_MET for r in g)
        key = (failed == 0, met / len(g), -failed)
        if best_key is None or key > best_key:
            best, best_key = g, key
    # Step 3: the status comes from the best group only.
    met = sum(r["result"] == MET for r in best)
    failed = sum(r["result"] == NOT_MET for r in best)
    unknown = len(best) - met - failed
    # any condition failed      -> "not_eligible"
    # none failed, some unknown -> "check" (shown as "Needs answers")
    # all met                   -> "likely" (shown as "Likely eligible")
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


# match(profile, schemes): run evaluate() on every scheme and return the list sorted:
# likely first, then needs answers, then not eligible; within each, higher score first, then by name.
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


# value_summary(results): total estimated benefits of the schemes the citizen is LIKELY eligible for.
# Yearly cash, one-time amounts and insurance cover are added up; for loans only the largest is kept
# (a person would not take every loan at once).
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


# documents_plan(results, schemes): one checklist for all schemes that are likely or need answers.
# Each document appears once, with the list of schemes that need it, most-needed first.
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
            # Different schemes word the same document differently - merge them under one name.
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
