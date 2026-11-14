"""AI-Based Assistance Module (6.6).

A conversational agent built in layers:

  1. Language detection   English / Hindi / Hinglish (replies in the user's language)
  2. Understanding        intent detection + profile extraction from free text (extract.py)
                          + fuzzy scheme-name recognition (handles typos like "ujwala", "ayushmaan")
  3. Dialogue manager     multi-turn eligibility interviews: asks only for the missing facts,
                          one question at a time, with tap-to-answer options
  4. Retrieval            TF-IDF-style ranking of scheme records (+ English/Hindi synonyms)
  5. Decision             eligibility verdicts always come from the rule engine (matching.py),
                          never from the LLM, so they are deterministic and explainable
  6. Generation           an LLM (Gemini / OpenAI / Claude) writes explanations grounded ONLY in the
                          retrieved records (RAG); if no LLM is configured, templates are used, so
                          the assistant always works offline.
"""
import difflib
import json
import math
import os
import re

import httpx

from .extract import answer_for_field, extract
from .i18n import DOC_HI, GENERAL_ORDER, QUESTIONS, SKIP_OPT, describe_update, fmt_inr, label_hi, t
from .matching import evaluate, match, value_summary
from .models import Scheme

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "none").lower()   # gemini | openai | anthropic | none
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "")
DEFAULT_MODELS = {"gemini": "gemini-2.5-flash", "openai": "gpt-4o-mini", "anthropic": "claude-haiku-5-5"}


def llm_enabled() -> bool:
    return LLM_PROVIDER != "none" and bool(LLM_API_KEY)


# ------------------------------------------------------------------ language & intent
HINGLISH = {"kya", "mujhe", "mera", "meri", "mere", "kaise", "kaun", "kaunsi", "chahiye", "hai", "hain", "kitna",
            "milega", "milegi", "batao", "bataiye", "karna", "karu", "sakta", "sakti", "hoon", "hu", "kare", "liye",
            "ke", "ki", "ka", "aur", "nahi", "kaha", "kahan", "paisa", "yojna"}


def detect_lang(text: str, preferred: str | None = None) -> str:
    if re.search(r"[\u0900-\u097f]", text):
        return "hi"
    words = set(re.findall(r"[a-z]+", text.lower()))
    if len(words & HINGLISH) >= 2:
        return "hi"
    if preferred == "hi" and len(words) <= 3:   # short replies like "yes" keep the chosen language
        return "hi"
    return "en"


INTENTS = [
    ("greeting", [r"^\s*(hi|hii+|hello|hey|namaste|namaskar|नमस्ते|नमस्कार|good (morning|evening|afternoon))\b[\s!.]*$"]),
    ("thanks", [r"^\s*(thanks|thank you|thx|dhanyavad|dhanyawad|shukriya|धन्यवाद|शुक्रिया|ok thanks)\b"]),
    ("more", [r"more questions", r"remaining questions", r"ask me more", r"check the rest", r"बाकी सवाल", r"और सवाल"]),
    ("compare", [r"\bcompare\b", r"\bvs\.?\b", r"\bversus\b", r"difference between", r"which is better", r"तुलना", r"अंतर", r"फ़र्क|फर्क"]),
    ("discover", [r"which schemes?", r"what schemes?", r"schemes? for me", r"suggest", r"recommend", r"can i apply for\??$",
                  r"all schemes", r"eligible for which", r"what can i get", r"kaun ?si yojna", r"kaun ?si yojana",
                  r"कौन सी योजना", r"कौन-सी योजना", r"मेरे लिए कौन", r"किन योजनाओं", r"check all", r"सभी योजनाएँ"]),
    ("documents", [r"document", r"papers?\b", r"certificate", r"proof", r"kagaz", r"kagzat", r"दस्तावेज़", r"दस्तावेज", r"कागज़", r"कागज", r"कागजात"]),
    ("apply", [r"\bapply\b", r"application", r"register", r"how to get", r"how can i get", r"where to", r"helpline",
               r"process", r"kaise kare", r"aavedan", r"आवेदन", r"अप्लाई", r"कैसे करें", r"कैसे मिलेगा", r"रजिस्ट्रेशन"]),
    ("eligibility", [r"eligib", r"qualify", r"criteria", r"am i\b", r"can i get", r"\bpatra\b", r"mil sakta", r"mil sakti", r"milega kya", r"milegi kya", r"पात्र", r"योग्य", r"पात्रता", r"मिल सकता", r"मिल सकती"]),
    ("benefits", [r"benefit", r"how much", r"amount", r"money", r"what do i get", r"what will i get", r"\blabh\b",
                  r"kitna", r"लाभ", r"फायदा", r"फ़ायदा", r"कितना", r"कितने पैसे", r"क्या मिलेगा"]),
]


def detect_intent(q: str) -> str:
    ql = q.lower()
    for name, pats in INTENTS:
        if any(re.search(p, ql) for p in pats):
            return name
    return "general"


# ------------------------------------------------------------------ scheme recognition & retrieval
ALIASES = {
    "pm-kisan": ["pm kisan", "pm-kisan", "pmkisan", "kisan samman", "samman nidhi", "किसान सम्मान", "पीएम किसान"],
    "pm-jay": ["ayushman", "ayushman bharat", "pmjay", "pm-jay", "pm jay", "jan arogya", "ayushman card", "golden card", "आयुष्मान"],
    "pmay-urban": ["pmay", "awas yojana", "pradhan mantri awas", "housing scheme", "आवास योजना"],
    "ujjwala": ["ujjwala", "pmuy", "उज्ज्वला"],
    "sukanya-samriddhi": ["sukanya", "ssy", "sukanya samriddhi", "सुकन्या"],
    "atal-pension": ["atal pension", "apy", "अटल पेंशन"],
    "pmjjby": ["pmjjby", "jeevan jyoti", "जीवन ज्योति"],
    "pmsby": ["pmsby", "suraksha bima", "सुरक्षा बीमा"],
    "post-matric-sc": ["post matric", "post-matric", "sc scholarship", "पोस्ट मैट्रिक"],
    "pm-vishwakarma": ["vishwakarma", "विश्वकर्मा"],
    "mudra": ["mudra", "pmmy", "मुद्रा"],
    "stand-up-india": ["stand up india", "standup india", "stand-up india", "स्टैंड अप"],
    "pmmvy": ["matru vandana", "pmmvy", "मातृ वंदना"],
    "ignoaps": ["old age pension", "ignoaps", "vridha pension", "vridhavastha", "वृद्धावस्था पेंशन", "वृद्धा पेंशन"],
}

STOP = set("""a an the is are am i me my we our you your to of for in on at by with and or what which how can do does
did be it this that these those any some about from as was were will would should could there their them they he she
his her get give tell please want need know scheme schemes yojana yojna pm pradhan mantri document documents required
benefit benefits apply application eligible eligibility qualify details information info much many
yes no not ok okay sure haan nahi done right
के की का में है हैं मैं मुझे क्या कौन से लिए और को पर यह वह हूँ कैसे करें योजना योजनाएँ मेरे मेरी""".split())

SYNONYMS = {
    "farmer": ["kisan", "agriculture", "farming", "crop", "land", "किसान", "खेती"],
    "health": ["hospital", "treatment", "medical", "ayushman", "illness", "operation", "इलाज", "अस्पताल", "स्वास्थ्य", "बीमारी"],
    "house": ["housing", "home", "awas", "pucca", "ghar", "घर", "आवास", "मकान"],
    "gas": ["lpg", "cylinder", "ujjwala", "cooking", "chulha", "गैस", "सिलेंडर", "चूल्हा"],
    "girl": ["daughter", "sukanya", "beti", "बेटी", "बच्ची"],
    "pension": ["old", "elderly", "retirement", "senior", "budhapa", "पेंशन", "बुढ़ापा", "बुज़ुर्ग"],
    "loan": ["credit", "business", "mudra", "startup", "enterprise", "shop", "karz", "लोन", "ऋण", "कर्ज़", "व्यवसाय", "दुकान"],
    "scholarship": ["student", "education", "study", "college", "fees", "chhatravritti", "छात्रवृत्ति", "पढ़ाई", "फ़ीस"],
    "pregnant": ["maternity", "pregnancy", "garbhvati", "गर्भवती", "प्रसव"],
    "artisan": ["carpenter", "potter", "tailor", "craft", "vishwakarma", "blacksmith", "कारीगर", "दर्जी", "कुम्हार"],
    "insurance": ["accident", "life", "cover", "bima", "बीमा", "दुर्घटना"],
}


def _tokens(text: str) -> list[str]:
    out = []
    for w in re.findall(r"[a-z0-9\u0900-\u097f]+", text.lower()):
        if w in STOP or len(w) < 2:
            continue
        out.append(w)
        for root, syns in SYNONYMS.items():
            if w == root or w in syns:
                out.append(root)
    return out


def named_schemes(question: str, schemes: list[Scheme]) -> list[Scheme]:
    """Schemes the user mentions by name, tolerant of typos ("ujwala", "ayushmaan", "vishvakarma")."""
    q = question.lower()
    by_slug = {s.slug: s for s in schemes}
    found: list[tuple[int, Scheme]] = []
    words = re.findall(r"[a-z\u0900-\u097f]+", q)
    for slug, aliases in ALIASES.items():
        s = by_slug.get(slug)
        if not s:
            continue
        pos = -1
        for a in aliases:
            m = re.search(r"(?<![a-z])" + re.escape(a) + r"(?![a-z])", q)
            if m and (pos == -1 or m.start() < pos):
                pos = m.start()
        if pos == -1:  # fuzzy match on distinctive single words
            for a in aliases:
                if " " in a or len(a) < 5:
                    continue
                for w in words:
                    if len(w) >= 5 and difflib.SequenceMatcher(None, w, a).ratio() >= 0.8:
                        pos = q.find(w)
                        break
                if pos != -1:
                    break
        if pos != -1:
            found.append((pos, s))
    found.sort(key=lambda x: x[0])
    seen, out = set(), []
    for _, s in found:
        if s.scheme_id not in seen:
            seen.add(s.scheme_id)
            out.append(s)
    return out


KEYWORDS = {
    "mudra": "shop small business kirana tailoring boutique salon dhaba workshop micro loan self employed",
    "pm-vishwakarma": "tailor tailoring carpenter potter blacksmith cobbler weaver barber goldsmith mason toolkit craft",
    "pm-jay": "hospital treatment surgery operation illness free treatment health card",
    "pmay-urban": "house home flat rent housing city",
    "ujjwala": "gas cylinder cooking lpg smoke",
    "sukanya-samriddhi": "daughter girl savings future marriage education",
    "atal-pension": "pension old age retirement savings worker",
    "ignoaps": "pension old elderly widow poor senior",
    "post-matric-sc": "scholarship college fees student dalit",
    "pmmvy": "pregnant pregnancy baby mother maternity delivery",
    "pm-kisan": "farmer crop farming land kisan money",
    "pmjjby": "life insurance death family",
    "pmsby": "accident insurance disability",
    "stand-up-india": "women entrepreneur sc st new business startup factory",
}


def _scheme_text(s: Scheme) -> str:
    return " ".join([KEYWORDS.get(s.slug, ""), s.scheme_name, s.slug.replace("-", " "), s.sector, s.description, s.target_beneficiaries,
                     s.benefits, s.name_hi or "", s.summary_hi or "", " ".join(c.label for c in s.criteria)])


def retrieve(question: str, schemes: list[Scheme], k: int = 3, profile: dict | None = None) -> list[tuple[Scheme, float]]:
    docs = {s.scheme_id: _tokens(_scheme_text(s)) for s in schemes}
    n = len(schemes)
    df: dict[str, int] = {}
    for toks in docs.values():
        for tok in set(toks):
            df[tok] = df.get(tok, 0) + 1
    q = set(_tokens(question))
    named = {s.scheme_id for s in named_schemes(question, schemes)}
    scored = []
    for s in schemes:
        toks = docs[s.scheme_id]
        score = sum((toks.count(w) ** 0.5) * math.log(1 + n / df[w]) for w in q if w in df and w in toks)
        if s.scheme_id in named:
            score += 20
        if score > 0 and profile:   # personalise: prefer schemes this user can actually use
            status = evaluate(profile, s)["status"]
            score *= {"likely": 1.4, "check": 1.0, "not_eligible": 0.6}[status]
        if score > 0:
            scored.append((s, score))
    scored.sort(key=lambda x: -x[1])
    if scored:
        top = scored[0][1]
        scored = [(s, sc) for s, sc in scored if sc >= 0.4 * top]
    return scored[:k]


# ------------------------------------------------------------------ helpers
def sname(s: Scheme, lang: str) -> str:
    return (s.name_hi or s.scheme_name) if lang == "hi" else s.scheme_name


def short(s: Scheme) -> str:
    return s.scheme_name.split(" (")[0]


def card(s: Scheme, status: str | None = None) -> dict:
    return {"scheme_id": s.scheme_id, "name": s.scheme_name, "name_hi": s.name_hi, "summary": s.description,
            "summary_hi": s.summary_hi, "status": status, "sector": s.sector,
            "value": s.values[0]["label"] if s.values else None}


def source(s: Scheme) -> dict:
    return {"scheme_id": s.scheme_id, "scheme_name": s.scheme_name, "official_source": s.official_source}


def scheme_followups(s: Scheme, lang: str, skip: str) -> list[dict]:
    nm = short(s)
    opts = {
        "eligibility": (t("q_elig", lang), f"Am I eligible for {nm}?"),
        "documents": (t("q_docs", lang), f"What documents are required for {nm}?"),
        "apply": (t("q_apply", lang), f"How do I apply for {nm}?"),
        "benefits": (t("q_benefits", lang), f"What are the benefits of {nm}?"),
    }
    return [{"label": lbl, "send": send} for key, (lbl, send) in opts.items() if key != skip]


def value_parts(v: dict, lang: str) -> list[str]:
    hi = lang == "hi"
    parts = []
    if v["annual_cash"]:
        parts.append(f"{fmt_inr(v['annual_cash'])} " + ("हर साल नकद सहायता" if hi else "a year in cash support"))
    if v["one_time"]:
        parts.append(f"{fmt_inr(v['one_time'])} " + ("एकमुश्त सहायता" if hi else "in one-time support"))
    if v["cover"]:
        parts.append(f"{fmt_inr(v['cover'])} " + ("का बीमा और स्वास्थ्य कवर" if hi else "of insurance and health cover"))
    if v["loan"]:
        parts.append((fmt_inr(v["loan"]) + " तक का लोन") if hi else ("access to loans up to " + fmt_inr(v["loan"])))
    return parts


# ------------------------------------------------------------------ LLM
SYSTEM_PROMPT = """You are the Digital India Scheme Assistant, helping Indian citizens understand government schemes.
Rules:
- Answer ONLY from the CONTEXT. If the answer isn't there, say you don't have that information and point to the official website.
- Simple, friendly words a first-time user can follow. Under 130 words. Short bullet lists (using •) for documents or steps. No markdown headings, no bold, no asterisks.
- Never say the user is officially eligible or approved; say they "appear to meet" the conditions and that the authority verifies.
- End with the official website of the scheme you discussed.
- Reply in {language}."""


async def call_llm(question: str, context: str, history: list[dict], lang: str) -> str | None:
    if not llm_enabled():
        return None
    model = LLM_MODEL or DEFAULT_MODELS.get(LLM_PROVIDER, "")
    system = SYSTEM_PROMPT.format(language="Hindi (Devanagari script)" if lang == "hi" else "English")
    msgs = [{"role": h["role"], "content": h["content"]} for h in history[-6:] if h.get("content")]
    msgs.append({"role": "user", "content": f"CONTEXT:\n{context}\n\nQUESTION: {question}"})
    while msgs and msgs[0]["role"] != "user":   # providers expect the first turn to be the user's
        msgs.pop(0)
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            if LLM_PROVIDER == "gemini":
                contents = [{"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]} for m in msgs]
                r = await client.post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                                      params={"key": LLM_API_KEY},
                                      json={"systemInstruction": {"parts": [{"text": system}]}, "contents": contents,
                                            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 700}})
                r.raise_for_status()
                return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            if LLM_PROVIDER == "openai":
                r = await client.post("https://api.openai.com/v1/chat/completions",
                                      headers={"Authorization": f"Bearer {LLM_API_KEY}"},
                                      json={"model": model, "temperature": 0.2, "max_tokens": 700,
                                            "messages": [{"role": "system", "content": system}] + msgs})
                r.raise_for_status()
                return r.json()["choices"][0]["message"]["content"].strip()
            if LLM_PROVIDER == "anthropic":
                r = await client.post("https://api.anthropic.com/v1/messages",
                                      headers={"x-api-key": LLM_API_KEY, "anthropic-version": "2023-06-01"},
                                      json={"model": model, "max_tokens": 700, "system": system, "messages": msgs})
                r.raise_for_status()
                return "".join(b.get("text", "") for b in r.json()["content"]).strip()
    except Exception as e:  # network error, bad key, quota: fall back to template answer
        print(f"[ai] LLM call failed, using template answer: {e}")
    return None


def context_for(s: Scheme, profile: dict | None) -> str:
    app = s.application
    lines = [f"SCHEME: {s.scheme_name}", f"Hindi name: {s.name_hi}", f"Ministry: {s.ministry}",
             f"About: {s.description}", f"Who it's for: {s.target_beneficiaries}", f"Benefits: {s.benefits}",
             "Eligibility conditions: " + "; ".join(c.label + (" [alternative route]" if c.group_no > 1 else "") for c in s.criteria),
             "Documents: " + "; ".join(d.document_name + ("" if d.mandatory else " (if applicable)") for d in s.documents),
             f"How to apply ({app.mode}): " + " ".join(f"{i+1}. {st}" for i, st in enumerate(json.loads(app.steps))),
             f"Apply at: {app.apply_url}; Helpline: {app.helpline or 'n/a'}", f"Official website: {s.official_source}"]
    if profile:
        ev = evaluate(profile, s)
        lines.append(f"User's eligibility (from rule engine): {ev['summary']} — " +
                     "; ".join(f"{c['label']}: {c['result']}" for c in ev["conditions"]))
    return "\n".join(lines)


# ------------------------------------------------------------------ response builders
def new_response(lang: str, intent: str) -> dict:
    return {"answer": "", "lang": lang, "intent": intent, "mode": "rules", "sources": [], "cards": [],
            "quick_replies": [], "pending_field": None, "interview": None, "profile_updates": {}, "noted": [],
            "table": None, "context_scheme_id": None, "show_results": False}


def ask(resp: dict, field: str, interview: dict, lang: str, prefix: str = "") -> dict:
    q_en, q_hi, options = QUESTIONS[field]
    resp["answer"] = (prefix + "\n\n" if prefix else "") + (q_hi if lang == "hi" else q_en)
    resp["quick_replies"] = [{"label": o["label_hi"] if lang == "hi" else o["label"], "value": o["value"]}
                             for o in options + [SKIP_OPT]]
    resp["pending_field"] = field
    resp["interview"] = {**interview, "lang": lang}   # remember the conversation's language for short replies
    resp["intent"] = "interview"
    return resp


def condition_lines(ev: dict, lang: str) -> str:
    marks = {"met": "✓", "not_met": "✗", "unknown": "?"}
    return "\n".join(f"{marks[c['result']]} {c['label_hi'] if lang == 'hi' and c.get('label_hi') else c['label']}"
                     for c in ev["conditions"])


def verdict(resp: dict, s: Scheme, profile: dict, lang: str) -> dict:
    ev = evaluate(profile, s)
    key = {"likely": "verdict_likely", "check": "verdict_check", "not_eligible": "verdict_no"}[ev["status"]]
    resp["answer"] = (t(key, lang, name=sname(s, lang)) + "\n" + condition_lines(ev, lang) + "\n\n" +
                      t("final_note", lang) + f"\n{t('source', lang)}: {s.official_source}")
    resp["cards"] = [card(s, ev["status"])]
    resp["sources"] = [source(s)]
    resp["quick_replies"] = scheme_followups(s, lang, "eligibility") if ev["status"] != "not_eligible" else \
        [{"label": t("q_all", lang), "send": "Which schemes can I apply for?"}]
    resp["context_scheme_id"] = s.scheme_id
    resp["intent"] = "eligibility"
    resp["pending_field"] = None
    resp["interview"] = None
    return resp


def discover(resp: dict, schemes: list[Scheme], profile: dict, lang: str, prefix: str = "") -> dict:
    res = match(profile, schemes)
    likely = [r for r in res if r["status"] == "likely"]
    check = [r for r in res if r["status"] == "check"]
    by_id = {s.scheme_id: s for s in schemes}
    lines = [prefix, ""] if prefix else []
    if likely:
        n_txt = (f"{len(likely)} योजनाओं" if len(likely) > 1 else "1 योजना") if lang == "hi" else \
            (f"{len(likely)} schemes" if len(likely) > 1 else "1 scheme")
        lines.append(t("discover_head", lang, n=n_txt))
        for r in likely:
            s = by_id[r["scheme_id"]]
            lines.append(f"• {sname(s, lang)} – {s.benefits_hi if lang == 'hi' and s.benefits_hi else s.benefits}")
        parts = value_parts(value_summary(res), lang)
        if parts:
            lines.append("\n" + t("value_line", lang, parts=", ".join(parts)))
    else:
        lines.append(t("discover_none", lang))
    if check:
        lines.append(t("discover_check", lang, n=len(check)))
    lines.append(t("final_note", lang))
    resp["answer"] = "\n".join(lines)
    resp["cards"] = [card(by_id[r["scheme_id"]], r["status"]) for r in likely + check[:3]]
    resp["sources"] = [source(by_id[r["scheme_id"]]) for r in likely]
    resp["intent"] = "discover"
    resp["show_results"] = True
    if check:
        resp["quick_replies"] = [{"label": t("q_more", lang), "send": "Ask me the remaining questions"}]
    resp["pending_field"] = None
    resp["interview"] = None
    return resp


def continue_interview(resp: dict, interview: dict, schemes: list[Scheme], profile: dict, lang: str, prefix: str = "") -> dict:
    skipped = set(interview.get("skipped", []))
    if interview.get("mode") == "scheme":
        s = next((x for x in schemes if x.scheme_id == interview.get("scheme_id")), None)
        if s:
            ev = evaluate(profile, s)
            if ev["status"] != "not_eligible":
                missing = [c["field"] for c in ev["conditions"] if c["result"] == "unknown" and c["field"] not in skipped]
                if missing:
                    out = ask(resp, missing[0], {**interview, "skipped": sorted(skipped)}, lang, prefix)
                    out["context_scheme_id"] = s.scheme_id
                    return out
            out = verdict(resp, s, profile, lang)
            if prefix:
                out["answer"] = prefix + "\n\n" + out["answer"]
            return out
    if interview.get("mode") == "deep":
        counts: dict[str, int] = {}
        for r in match(profile, schemes):
            if r["status"] == "check":
                for c in r["conditions"]:
                    if c["result"] == "unknown" and c["field"] not in skipped and c["field"] in QUESTIONS:
                        counts[c["field"]] = counts.get(c["field"], 0) + 1
        if counts:
            nxt = max(counts, key=counts.get)
            return ask(resp, nxt, {"mode": "deep", "skipped": sorted(skipped)}, lang, prefix)
        return discover(resp, schemes, profile, lang, prefix)
    for f in GENERAL_ORDER:
        if profile.get(f) is None and f not in skipped:
            return ask(resp, f, {"mode": "general", "skipped": sorted(skipped)}, lang, prefix)
    return discover(resp, schemes, profile, lang, prefix)


def template_answer(intent: str, s: Scheme, lang: str, related: list[Scheme]) -> str:
    app = s.application
    nm = sname(s, lang)
    if intent == "documents":
        docs = "\n".join(f"• {DOC_HI.get(d.document_name, d.document_name) if lang == 'hi' else d.document_name}"
                         + ("" if lang == "hi" or not d.description else f" – {d.description}")
                         + ("" if d.mandatory else t("if_applicable", lang)) for d in s.documents)
        body = t("docs_head", lang, name=nm) + "\n" + docs
    elif intent == "benefits":
        body = t("benefits_head", lang, name=nm) + "\n" + (s.benefits_hi if lang == "hi" and s.benefits_hi else s.benefits)
    elif intent == "apply":
        steps = "\n".join(f"{i+1}. {st}" for i, st in enumerate(json.loads(app.steps)))
        body = t("apply_head", lang, name=nm, mode=app.mode) + "\n" + steps
        if app.helpline:
            body += f"\n{t('helpline', lang)}: {app.helpline}"
    elif intent == "eligibility":
        groups: dict[int, list] = {}
        for c in s.criteria:
            groups.setdefault(c.group_no, []).append(c)
        parts = []
        for i, (_, cs) in enumerate(sorted(groups.items())):
            if i:
                parts.append(t("elig_alt", lang))
            parts += [f"• {label_hi(c.criterion, c.operator, c.value) if lang == 'hi' else c.label}" for c in cs]
        body = t("elig_head", lang, name=nm) + "\n" + "\n".join(parts) + "\n\n" + t("elig_tip", lang)
    else:
        summary = s.summary_hi if lang == "hi" and s.summary_hi else s.description
        ben = s.benefits_hi if lang == "hi" and s.benefits_hi else s.benefits
        who = "" if lang == "hi" else f"\n{t('who', lang)}: {s.target_beneficiaries}"
        body = f"{nm}\n{summary}{who}\n{t('benefits', lang)}: {ben}"
    body += f"\n\n{t('source', lang)}: {s.official_source}"
    if related:
        body += f"\n{t('related', lang)}: " + ", ".join(short(r) for r in related)
    return body


def compare_table(items: list[Scheme], lang: str) -> dict:
    hi = lang == "hi"
    rows = [
        ["लाभ" if hi else "Benefits"] + [(s.benefits_hi if hi and s.benefits_hi else s.benefits) for s in items],
        ["किसके लिए" if hi else "Who it's for"] + [s.target_beneficiaries for s in items],
        ["मुख्य शर्तें" if hi else "Key conditions"] + ["; ".join(c.label for c in s.criteria if c.group_no == 1) for s in items],
        ["दस्तावेज़" if hi else "Documents"] + [", ".join(d.document_name for d in s.documents) for s in items],
        ["आवेदन" if hi else "How to apply"] + [s.application.mode for s in items],
        ["वेबसाइट" if hi else "Website"] + [s.official_source for s in items],
    ]
    return {"headers": [""] + [short(s) for s in items], "rows": rows}


# ------------------------------------------------------------------ main entry point
async def answer(message: str, schemes: list[Scheme], profile: dict | None = None, focus_id: int | None = None,
                 history: list[dict] | None = None, pending_field: str | None = None, answer_value=None,
                 interview: dict | None = None, lang_pref: str | None = None) -> dict:
    history = history or []
    lang = detect_lang(message, lang_pref)
    # Mid-interview, a short reply like "28", "mahila" or "ha" carries no clear language signal:
    # keep answering in the language the conversation is already in.
    if interview and interview.get("lang") and pending_field:
        words = set(re.findall(r"[a-z]+", message.lower()))
        strong = re.search(r"[\u0900-\u097f]", message) or len(words & HINGLISH) >= 2
        if not strong and len(message.split()) <= 3:
            lang = interview["lang"]
    profile = {k: v for k, v in (profile or {}).items() if v not in (None, "")}
    by_id = {s.scheme_id: s for s in schemes}
    intent = detect_intent(message)
    resp = new_response(lang, intent)

    # 1. Understand: the answer to a pending question, plus any facts in free text
    updates: dict = {}
    skipped_now, answered = None, False
    if pending_field:
        val = answer_value if answer_value is not None else answer_for_field(pending_field, message)
        if val == "__skip__":
            skipped_now, answered = pending_field, True
        elif val is not None:
            updates[pending_field], answered = val, True
    if answer_value is None:
        clean = message.lower()
        for aliases in ALIASES.values():   # scheme names like "PM Kisan" shouldn't count as facts about the user
            for a in sorted(aliases, key=len, reverse=True):
                clean = clean.replace(a, " ")
        for k, v in extract(clean).items():
            if k not in updates:
                updates[k] = v
                answered = answered or bool(pending_field)

    profile.update(updates)
    resp["profile_updates"] = updates
    resp["noted"] = [describe_update(k, v, lang) for k, v in updates.items()]
    show_noted = len(updates) >= 2 or (updates and not pending_field)
    noted_line = (t("noted", lang) + " — " + ", ".join(resp["noted"]) + ".") if show_noted else ""

    # 2. Dialogue: continue an interview in progress
    if interview and pending_field:
        if answered:
            iv = {**interview, "skipped": sorted(set(interview.get("skipped", [])) | ({skipped_now} if skipped_now else set()))}
            prefix = t("skipped", lang) if skipped_now else noted_line
            return continue_interview(resp, iv, schemes, profile, lang, prefix)
        if intent == "general" and not named_schemes(message, schemes):
            return ask(resp, pending_field, interview, lang, t("didnt_get", lang))
        # otherwise the user changed topic: drop the interview and handle the new question

    # 3. Route by intent
    named = named_schemes(message, schemes)
    if intent == "greeting":
        resp["answer"] = t("welcome", lang)
        resp["quick_replies"] = [{"label": t("q_all", lang), "send": "Which schemes can I apply for?"},
                                 {"label": "Ayushman Bharat", "send": "Tell me about Ayushman Bharat"},
                                 {"label": "PM Kisan", "send": "What documents are required for PM Kisan?"}]
        return resp
    if intent == "thanks":
        resp["answer"] = t("thanks", lang)
        return resp

    if intent == "compare":
        items = named[:3]
        if len(items) < 2:
            items += [s for s, _ in retrieve(message, schemes, 3) if s not in items]
        items = items[:3]
        if len(items) < 2:
            resp["answer"] = t("compare_need2", lang)
            return resp
        resp["answer"] = t("compare_head", lang)
        resp["table"] = compare_table(items, lang)
        resp["cards"] = [card(s) for s in items]
        resp["sources"] = [source(s) for s in items]
        return resp

    if intent == "more":
        return continue_interview(resp, {"mode": "deep", "skipped": []}, schemes, profile, lang, t("more_intro", lang))

    known = sum(profile.get(f) is not None for f in GENERAL_ORDER)
    described_self = len(updates) >= 2 and intent in ("general", "discover") and not named
    if intent == "discover" or described_self:
        if known == len(GENERAL_ORDER):
            return discover(resp, schemes, profile, lang, noted_line)
        intro = (noted_line + " " + t("few_more", lang)) if noted_line else t("start_general", lang)
        return continue_interview(resp, {"mode": "general", "skipped": []}, schemes, profile, lang, intro)

    # the scheme being talked about: named > retrieved > previous context (follow-up questions)
    hits = [s for s, _ in retrieve(message, schemes, profile=profile)]
    focus = by_id.get(focus_id) if focus_id else None
    refers_back = intent != "general" or re.search(r"\b(it|this|that|its|same|above|ye|yeh|is|isme)\b|इस|इसके|यह|उस", message.lower())
    target = named[0] if named else (hits[0] if hits else (focus if refers_back else None))

    if intent == "eligibility":
        if not target:
            resp["answer"] = t("which_scheme", lang)
            resp["quick_replies"] = [{"label": t("q_all", lang), "send": "Which schemes can I apply for?"}]
            return resp
        ev = evaluate(profile, target)
        missing = [c["field"] for c in ev["conditions"] if c["result"] == "unknown"]
        if ev["status"] == "check" and missing:
            iv = {"mode": "scheme", "scheme_id": target.scheme_id, "skipped": []}
            start = t("start_scheme", lang, name=sname(target, lang))
            out = ask(resp, missing[0], iv, lang, (noted_line + "\n" if noted_line else "") + start)
            out["context_scheme_id"] = target.scheme_id
            out["cards"] = [card(target)]
            return out
        return verdict(resp, target, profile, lang)

    if not target and intent in ("documents", "apply", "benefits"):
        resp["answer"] = t("which_scheme", lang)
        resp["quick_replies"] = [{"label": t("q_all", lang), "send": "Which schemes can I apply for?"}]
        return resp
    if not target:
        off_topic = re.search(r"weather|cricket|movie|film|joke|news|song|recipe|score|ipl|मौसम|गाना|फ़िल्म", message.lower())
        key = "out_of_scope" if off_topic else "no_match"
        resp["answer"] = (noted_line + "\n\n" if noted_line else "") + t(key, lang)
        resp["quick_replies"] = [{"label": t("q_all", lang), "send": "Which schemes can I apply for?"}]
        return resp

    related = [s for s in (named[1:] + hits) if s is not target][:2]
    ctx = "\n\n".join(context_for(s, profile) for s in [target] + related)
    text = await call_llm(message, ctx, history, lang)
    if text:
        resp["mode"] = f"llm:{LLM_PROVIDER}"
    else:
        text = template_answer(intent, target, lang, related)
    resp["answer"] = (noted_line + "\n\n" if noted_line else "") + text
    resp["cards"] = [card(target)]
    resp["sources"] = [source(target)]
    resp["quick_replies"] = scheme_followups(target, lang, intent)
    resp["context_scheme_id"] = target.scheme_id
    return resp
