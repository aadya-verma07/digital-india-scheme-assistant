# =====================================================================================
# FILE: extract.py  -  reads a citizen's details out of a sentence (rule-based NLP)
# -------------------------------------------------------------------------------------
# Example:  "main 45 saal ka kisan hoon, Bihar se, 1 lakh income, BPL card hai"
#       ->  {"age": 45, "occupation": "farmer", "state": "Bihar", "income": 100000, "bpl": True}
# Works in English, Hindi (Devanagari) and Hinglish using regular expressions (text patterns)
# and word lists - no AI model, so it is fast, free, works offline and every decision can be explained.
# Used by: POST /api/extract (homepage search) and the chatbot (ai.py).
# Functions:
#   parse_amount()     - "1.5 lakh" / "80k" / "2 crore" / "250000" -> rupees as a number
#   _negated()         - is a word preceded/followed by "no", "not", "nahi"... ?
#   _flag()            - yes/no fact (True / False / not mentioned) for a list of patterns
#   answer_for_field() - understands a short reply to ONE question the chatbot asked
#   extract()          - finds EVERY profile fact in a sentence
# =====================================================================================

"""Natural-language understanding for citizen profiles.

Turns free text like
    "I'm a 45 year old farmer from Bihar, we earn about 1.2 lakh, no gas connection"
    "मैं 62 साल की विधवा हूँ, गाँव में रहती हूँ, बीपीएल कार्ड है"
into structured profile fields the eligibility engine understands.

Rule-based (regex + keyword lexicons, English, Hindi and Hinglish) so it works offline
and is fully explainable in a viva.
"""
import re

# Word lists (lexicons). All 28 states + UTs written in lowercase so matching ignores capital letters.
STATES = ["andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh", "delhi", "goa", "gujarat",
          "haryana", "himachal pradesh", "jammu & kashmir", "jharkhand", "karnataka", "kerala", "ladakh",
          "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "puducherry",
          "punjab", "rajasthan", "sikkim", "tamil nadu", "telangana", "tripura", "uttar pradesh", "uttarakhand",
          "west bengal"]
# Short forms and Hindi names that map to a state ('up' -> uttar pradesh, 'बिहार' -> bihar).
STATE_ALIASES = {"up": "uttar pradesh", "mp": "madhya pradesh", "jammu and kashmir": "jammu & kashmir",
                 "j&k": "jammu & kashmir", "orissa": "odisha", "bengal": "west bengal", "tn": "tamil nadu",
                 "बिहार": "bihar", "उत्तर प्रदेश": "uttar pradesh", "राजस्थान": "rajasthan", "दिल्ली": "delhi",
                 "मध्य प्रदेश": "madhya pradesh", "महाराष्ट्र": "maharashtra", "हरियाणा": "haryana",
                 "पंजाब": "punjab", "गुजरात": "gujarat", "झारखंड": "jharkhand", "उत्तराखंड": "uttarakhand"}

# Big cities: mentioning one tells us the state AND that the person lives in an urban area.
CITIES = {"mumbai": "Maharashtra", "pune": "Maharashtra", "nagpur": "Maharashtra", "new delhi": "Delhi",
          "bangalore": "Karnataka", "bengaluru": "Karnataka", "chennai": "Tamil Nadu", "kolkata": "West Bengal",
          "hyderabad": "Telangana", "lucknow": "Uttar Pradesh", "kanpur": "Uttar Pradesh", "noida": "Uttar Pradesh",
          "ghaziabad": "Uttar Pradesh", "varanasi": "Uttar Pradesh", "agra": "Uttar Pradesh", "patna": "Bihar",
          "jaipur": "Rajasthan", "gurgaon": "Haryana", "gurugram": "Haryana", "faridabad": "Haryana", "bhopal": "Madhya Pradesh",
          "indore": "Madhya Pradesh", "ahmedabad": "Gujarat", "surat": "Gujarat", "chandigarh": "Punjab", "ranchi": "Jharkhand",
          "dehradun": "Uttarakhand", "bhubaneswar": "Odisha", "guwahati": "Assam", "kochi": "Kerala", "raipur": "Chhattisgarh"}

# Keywords for each occupation value used by the eligibility rules (English, Hinglish and Hindi).
OCCUPATIONS = {
    "farmer": ["farmer", "farming", "kisan", "kheti", "agriculture", "cultivat", "किसान", "खेती"],
    "student": ["student", "studying", "college", "padhai", "छात्र", "छात्रा", "पढ़ाई", "पढ़ रहा", "पढ़ रही"],
    "artisan": ["artisan", "carpenter", "blacksmith", "potter", "tailor", "cobbler", "weaver", "goldsmith",
                "barber", "washerman", "mason", "sculptor", "basket", "toy maker", "boat maker", "locksmith",
                "darzi", "kumhar", "lohar", "badhai", "कारीगर", "दर्ज़ी", "दर्जी", "कुम्हार", "लोहार", "बढ़ई"],
    "street_vendor": ["street vendor", "vendor", "hawker", "thela", "rehri", "ठेला", "रेहड़ी", "फेरीवाला"],
    "self_employed": ["business", "shop", "dukaan", "dukan", "self employed", "self-employed", "entrepreneur",
                      "startup", "own work", "दुकान", "व्यवसाय", "व्यापार", "कारोबार"],
    "govt_employee": ["government employee", "govt employee", "government job", "sarkari naukri", "सरकारी नौकरी"],
    "salaried": ["private job", "salaried", "salary", "office job", "naukri", "नौकरी"],
    "homemaker": ["homemaker", "housewife", "house wife", "grihini", "गृहिणी"],
    "unemployed": ["unemployed", "no job", "jobless", "looking for work", "berozgar", "बेरोज़गार", "बेरोजगार"],
    "retired": ["retired", "pensioner", "सेवानिवृत्त", "रिटायर"],
}

# Words meaning yes / no / skip, used to understand short chat replies.
YES = {"yes", "y", "yeah", "yep", "haan", "han", "ha", "haa", "ji", "sure", "correct", "right", "हाँ", "हां", "जी"}
NO = {"no", "n", "nope", "nahi", "nahin", "na", "nai", "नहीं", "ना", "नही"}
SKIP = {"skip", "don't know", "dont know", "not sure", "pata nahi", "पता नहीं", "__skip__"}

# Regular expression for negation words. 'no gas connection' must give has_lpg = False, not True.
NEG = r"(?:no|not|don't|dont|do not|does not|doesn't|without|never|nahi|nahin|नहीं|नही|ना|बिना)"


# _num(s): '1,50,000' -> 150000.0 (removes commas, converts text to a number).
def _num(s: str) -> float:
    return float(s.replace(",", ""))


# parse_amount(text): find a money amount and convert it to rupees.
# Checks, in order: lakh (x 1,00,000), thousand/k (x 1,000), crore (x 1,00,00,000), then a plain number
# of 4 or more digits. Returns None if no amount is found.
def parse_amount(text: str) -> int | None:
    t = text.lower().replace("₹", " ").replace("rs.", " ").replace("rs", " ")
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l\b|लाख)", t)
    if m:
        return int(_num(m.group(1)) * 100000)
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:k\b|thousand|हज़ार|हजार)", t)
    if m:
        return int(_num(m.group(1)) * 1000)
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:crore|cr\b|करोड़)", t)
    if m:
        return int(_num(m.group(1)) * 10000000)
    m = re.search(r"\b(\d{1,3}(?:,\d{2,3})+|\d{4,8})\b", t)
    if m:
        return int(_num(m.group(1)))
    return None


# _negated(text, start): True if the word at position `start` is negated.
# Looks up to 28 characters BEFORE it for "no/not/nahi..." ("no gas connection")
# and up to 40 characters AFTER it for Hindi "नहीं" ("गैस कनेक्शन नहीं है").
def _negated(text: str, start: int) -> bool:
    window = text[max(0, start - 28):start]
    after = text[start:start + 40]
    return bool(re.search(NEG + r"\b[\w\s']*$", window)) or bool(re.search(r"^[^.,;।]*?(?:नहीं|नही)", after))


# _flag(text, patterns): for a yes/no fact. Returns True if a pattern is found and not negated,
# False if found but negated, None if the fact is not mentioned at all.
def _flag(text: str, patterns: list[str]) -> bool | None:
    for p in patterns:
        m = re.search(p, text)
        if m:
            return not _negated(text, m.start())
    return None


# answer_for_field(field, text): the chatbot asked about `field` (e.g. "Do you have a bank account?");
# interpret the reply. Returns the value, "__skip__" if the user skipped, or None if not understood.
def answer_for_field(field: str, text: str):
    """Interpret a short reply to a question the assistant asked about `field`."""
    t = text.strip().lower()
    if t in SKIP or any(s in t for s in SKIP if len(s) > 3):
        return "__skip__"
    # Yes/no questions: look for a yes-word or no-word ('haan', 'nahi', 'हाँ', 'नहीं'...).
    bools = {"bpl", "owns_land", "owns_pucca_house", "has_lpg", "has_bank_account", "income_tax_payer",
             "has_girl_child_under_10", "pregnant_or_lactating"}
    if field in bools:
        words = set(re.findall(r"[\w\u0900-\u097f]+", t))
        if words & NO:
            return False
        if words & YES:
            return True
        return None
    # Age question: any number between 1 and 119.
    if field == "age":
        m = re.search(r"\d{1,3}", t)
        return int(m.group()) if m and 0 < int(m.group()) < 120 else None
    if field == "income":
        return parse_amount(t)
    # Anything else (state, occupation, category...): run the full extractor on the reply.
    found = extract(text)
    return found.get(field)


# extract(text): find every profile fact in free text. Each block below handles one field.
# The text is lowercased and padded with spaces so patterns at the start/end also match.
def extract(text: str) -> dict:
    """Pull every profile fact we can find out of free text."""
    t = " " + text.lower().replace("’", "'") + " "
    out: dict = {}

    # age
    # AGE: "45 years old", "45 saal", "45 साल", "age is 45", "I am 45".
    # Skipped if the number is about a child ("my daughter is 6 years").
    m = (re.search(r"(\d{1,3})\s*(?:-|\s)?\s*(?:years?|yrs?|yr|saal|sal|varsh|वर्ष|साल)(?:\s*old|\s*ki|\s*ka|\s*की|\s*का)?", t)
         or re.search(r"\bage\s*(?:is|:)?\s*(\d{1,3})\b", t)
         or re.search(r"\bi(?:'m| am)\s+(\d{1,3})\b(?!\s*(?:lakh|k\b|thousand|acre))", t))
    if m and 0 < int(m.group(1)) < 120:
        child_ctx = t[max(0, m.start() - 25):m.start()]
        if not re.search(r"daughter|son|beti|beta|बेटी|बेटा|child|bachch", child_ctx):
            out["age"] = int(m.group(1))

    # income
    # INCOME: an amount within 40 characters after words like income / earn / kamai / आय.
    im = re.search(r"(income|earn|kamai|kamaate|kamate|salary|aay|आय|कमाई|कमाते)(?:[^.]|\.(?=\d)){0,40}", t)
    if im:
        amt = parse_amount(im.group(0))
        if amt:
            out["income"] = amt
    # Or an amount in lakh followed by 'a year' / 'saal' / 'सालाना'.
    if "income" not in out:
        m = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख)[^.]{0,20}(?:a year|per year|yearly|annual|saal|सालाना|income|salary|kamai|आय|कमाई)", t)
        if m:
            out["income"] = int(_num(m.group(1)) * 100000)

    # gender
    # GENDER: words like woman/mahila/widow -> female; man/purush/aadmi -> male.
    # Also Hindi/Hinglish verb endings: "rehti/karti" (feminine) vs "rehta/karta" (masculine).
    if re.search(r"\b(woman|female|lady|girl|mother|widow|wife|mahila|aurat|stri|stree|ladki|vidhwa|vidhva|housewife)\b|\b(?:rehti|rahti|karti|chalati)\b|महिला|विधवा|औरत|माँ|रहती|करती", t) \
            or re.search(r"\b(?:i am|i'm) a (?:\w+ )?(?:mother|widow)\b", t):
        out["gender"] = "female"
    elif re.search(r"\b(man|male|boy|husband|gentleman|aadmi|purush|purus|mard|ladka)\b|\b(?:rehta|rahta|karta|chalata)\b|पुरुष|आदमी|रहता|करता", t):
        out["gender"] = "male"
    # Pregnancy (for maternity schemes) also means the user is female.
    if re.search(r"\b(pregnant|expecting|garbhvati)\b|गर्भवती|new mother|newborn|just had a baby", t):
        out["pregnant_or_lactating"] = True
        out["gender"] = "female"

    # occupation (first match wins, order matters)
    # OCCUPATION: first keyword found wins. The order matters: specific jobs are checked before general ones
    # (e.g. "street vendor" before "self employed"), and negated mentions ("not a farmer") are ignored.
    for occ in ["govt_employee", "street_vendor", "artisan", "farmer", "student", "homemaker", "unemployed",
                "retired", "self_employed", "salaried"]:
        for kw in OCCUPATIONS[occ]:
            idx = t.find(kw)
            if idx != -1 and not _negated(t, idx):
                out["occupation"] = occ
                break
        if "occupation" in out:
            break

    # state
    # STATE: aliases first, then full state names (a full name overrides an alias).
    for alias, state in STATE_ALIASES.items():
        if re.search(r"(?<![\w\u0900-\u097f])" + re.escape(alias) + r"(?![\w\u0900-\u097f])", t):
            out["state"] = state.title() if state != "jammu & kashmir" else "Jammu & Kashmir"
    for s in STATES:
        if s in t:
            out["state"] = s.title() if s != "jammu & kashmir" else "Jammu & Kashmir"

    # big cities imply state + urban
    # CITY -> state (only if no state was named) + urban area.
    for city, state in CITIES.items():
        if re.search(r"(?<![a-z])" + city + r"(?![a-z])", t):
            out.setdefault("state", state)
            out["area"] = "urban"
            break

    # area
    # AREA: village/gaon/गाँव -> rural; city/town/shahar -> urban.
    if re.search(r"\b(village|rural|gaon|gaanv|gram)\b|गाँव|गांव|ग्रामीण", t):
        out["area"] = "rural"
    elif re.search(r"\b(city|town|urban|shahar|metro)\b|शहर|कस्बा", t):
        out["area"] = "urban"

    # category
    # SOCIAL CATEGORY: SC / ST / OBC / General.
    if re.search(r"\b(sc|scheduled caste|dalit)\b|अनुसूचित जाति", t):
        out["category"] = "SC"
    elif re.search(r"\b(st|scheduled tribe|adivasi|tribal)\b|अनुसूचित जनजाति|आदिवासी", t):
        out["category"] = "ST"
    elif re.search(r"\bobc\b|पिछड़ा वर्ग|ओबीसी", t):
        out["category"] = "OBC"
    elif re.search(r"\bgeneral (?:category|caste)\b|सामान्य वर्ग", t):
        out["category"] = "General"

    # education
    # EDUCATION: highest level mentioned (postgraduate > graduate > class 11-12 > school).
    if re.search(r"post ?grad|\bm\.?a\b|\bm\.?sc\b|\bmba\b|\bm\.?tech\b|masters", t):
        out["education"] = "postgraduate"
    elif re.search(r"graduat|college|b\.?tech|\bb\.?a\b|b\.?sc|b\.?com|degree|university|स्नातक|कॉलेज", t):
        out["education"] = "graduate"
    elif re.search(r"class (?:11|12|eleven|twelve)|\b1[12]th\b|diploma|iti\b|polytechnic|intermediate|कक्षा 1[12]", t):
        out["education"] = "post_matric"
    elif re.search(r"class (?:[5-9]|10)\b|\b(?:[5-9]|10)th\b|matric|high school", t):
        out["education"] = "school"

    # yes/no facts
    # YES/NO FACTS: patterns for each fact; _flag() handles negation.
    # e.g. "I have a BPL card" -> bpl=True;  "no bank account" -> has_bank_account=False.
    flags = {
        "bpl": [r"\bbpl\b", r"below (?:the )?poverty", r"ration card", r"antyodaya", r"\bgarib\b", r"बीपीएल", r"गरीबी रेखा", r"राशन कार्ड"],
        "has_bank_account": [r"bank account", r"bank khata", r"jan dhan", r"बैंक खाता", r"बैंक अकाउंट"],
        "owns_land": [r"own (?:farm |agricultural )?land", r"\d+(?:\.\d+)? ?(?:acre|bigha|hectare|बीघा|एकड़)", r"zameen", r"ज़मीन", r"जमीन", r"खेत"],
        "has_lpg": [r"\blpg\b", r"gas connection", r"gas cylinder", r"गैस कनेक्शन", r"गैस सिलेंडर"],
        "owns_pucca_house": [r"pucca house", r"pakka (?:house|ghar)", r"own (?:a )?house", r"own home", r"पक्का घर", r"अपना घर"],
        "income_tax_payer": [r"pay (?:income )?tax", r"income ?tax payer", r"file itr", r"tax bharte", r"टैक्स भरते", r"आयकर", r"income tax"],
    }
    for field, pats in flags.items():
        v = _flag(t, pats)
        if v is not None:
            out[field] = v
    # Extra negative clues: kutcha/kachcha house or homeless -> no pucca house; landless -> no land.
    if re.search(r"\b(?:no|without|don't have a|do not have a)\s+(?:a\s+)?(?:house|home|ghar)\b|kutcha|kachcha|homeless|बेघर|कच्चा", t):
        out["owns_pucca_house"] = False
    if re.search(r"\blandless\b|भूमिहीन", t):
        out["owns_land"] = False

    # daughter under 10
    # DAUGHTER UNDER 10 (Sukanya Samriddhi): age of a daughter mentioned near the word daughter/beti/बेटी.
    m = re.search(r"(?:daughter|beti|बेटी)[^.]{0,30}?(\d{1,2})\s*(?:years?|yrs?|saal|साल|month)", t) \
        or re.search(r"(\d{1,2})[\s-]*(?:years?|yrs?|year-old|saal|साल)[^.]{0,15}(?:old )?(?:daughter|beti|बेटी)", t)
    if m:
        out["has_girl_child_under_10"] = int(m.group(1)) < 10
    elif re.search(r"baby girl|newborn daughter|infant daughter|छोटी बेटी", t):
        out["has_girl_child_under_10"] = True
    elif re.search(r"\b(?:no|without)\s+(?:a\s+)?daughter|no children|बेटी नहीं", t):
        out["has_girl_child_under_10"] = False

    # "my wife is pregnant", "pension for my mother": facts about someone else, not the user
    # Facts about SOMEONE ELSE: if the sentence talks about "my wife / my mother / meri maa...", the age, gender and
    # pregnancy found probably belong to that person, so they are removed rather than wrongly saved as the user's.
    if re.search(r"\b(?:my|meri|mera|mere|our)\s+(?:\w+\s+){0,2}(?:wife|mother|mom|mum|husband|father|dad|parents?|sister|brother|son|patni|maa|mummy|papa|pati)\b"
                 r"|(?:मेरी|मेरे|मेरा)\s+(?:\S+\s+){0,2}(?:पत्नी|माँ|मां|माता|पति|पिता|बहन|भाई|बेटा)", t):
        for k in ("gender", "pregnant_or_lactating", "age"):
            out.pop(k, None)
    # A farmer who mentions 'my farm/field' owns land.
    if out.get("occupation") == "farmer" and "owns_land" not in out and re.search(r"my (?:own )?(?:farm|field|land)|apne khet", t):
        out["owns_land"] = True
    return out
