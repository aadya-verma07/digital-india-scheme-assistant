"""English / Hindi text used by the assistant: interview questions, quick-reply options,
condition labels and response templates."""
import re

YN = [{"label": "Yes", "label_hi": "हाँ", "value": True}, {"label": "No", "label_hi": "नहीं", "value": False}]
SKIP_OPT = {"label": "Skip", "label_hi": "छोड़ें", "value": "__skip__"}

QUESTIONS = {
    "age": ("How old are you?", "आपकी उम्र कितनी है?", [
        {"label": "Under 18", "label_hi": "18 से कम", "value": 16},
        {"label": "18–40", "label_hi": "18–40", "value": 30},
        {"label": "41–59", "label_hi": "41–59", "value": 50},
        {"label": "60–69", "label_hi": "60–69", "value": 65},
        {"label": "70+", "label_hi": "70+", "value": 72}]),
    "gender": ("Are you a woman or a man?", "आप महिला हैं या पुरुष?", [
        {"label": "Woman", "label_hi": "महिला", "value": "female"},
        {"label": "Man", "label_hi": "पुरुष", "value": "male"},
        {"label": "Other", "label_hi": "अन्य", "value": "other"}]),
    "occupation": ("What do you do for a living?", "आप क्या काम करते हैं?", [
        {"label": "Farmer", "label_hi": "किसान", "value": "farmer"},
        {"label": "Student", "label_hi": "छात्र", "value": "student"},
        {"label": "Own business", "label_hi": "अपना व्यवसाय", "value": "self_employed"},
        {"label": "Artisan / craft", "label_hi": "कारीगर", "value": "artisan"},
        {"label": "Private job", "label_hi": "प्राइवेट नौकरी", "value": "salaried"},
        {"label": "Govt job", "label_hi": "सरकारी नौकरी", "value": "govt_employee"},
        {"label": "Homemaker", "label_hi": "गृहिणी", "value": "homemaker"},
        {"label": "No work", "label_hi": "बेरोज़गार", "value": "unemployed"},
        {"label": "Retired", "label_hi": "सेवानिवृत्त", "value": "retired"}]),
    "income": ("Roughly what is your family's income in a year?", "आपके परिवार की सालाना आय लगभग कितनी है?", [
        {"label": "Under ₹1 lakh", "label_hi": "₹1 लाख से कम", "value": 80000},
        {"label": "₹1–2.5 lakh", "label_hi": "₹1–2.5 लाख", "value": 200000},
        {"label": "₹2.5–6 lakh", "label_hi": "₹2.5–6 लाख", "value": 450000},
        {"label": "₹6–9 lakh", "label_hi": "₹6–9 लाख", "value": 750000},
        {"label": "Above ₹9 lakh", "label_hi": "₹9 लाख से ज़्यादा", "value": 1200000}]),
    "area": ("Do you live in a village or a town/city?", "आप गाँव में रहते हैं या शहर में?", [
        {"label": "Village", "label_hi": "गाँव", "value": "rural"},
        {"label": "Town / city", "label_hi": "शहर", "value": "urban"}]),
    "category": ("Which social category do you belong to?", "आपकी सामाजिक श्रेणी क्या है?", [
        {"label": "General", "label_hi": "सामान्य", "value": "General"},
        {"label": "OBC", "label_hi": "ओबीसी", "value": "OBC"},
        {"label": "SC", "label_hi": "अनुसूचित जाति", "value": "SC"},
        {"label": "ST", "label_hi": "अनुसूचित जनजाति", "value": "ST"}]),
    "education": ("What are you studying, or how far did you study?", "आप क्या पढ़ रहे हैं या कहाँ तक पढ़े हैं?", [
        {"label": "Up to Class 10", "label_hi": "कक्षा 10 तक", "value": "school"},
        {"label": "Class 11–12 / diploma", "label_hi": "कक्षा 11–12 / डिप्लोमा", "value": "post_matric"},
        {"label": "Graduation", "label_hi": "स्नातक", "value": "graduate"},
        {"label": "Post-graduation", "label_hi": "स्नातकोत्तर", "value": "postgraduate"}]),
    "bpl": ("Is your family below the poverty line (BPL card or ration card)?", "क्या आपका परिवार गरीबी रेखा से नीचे (बीपीएल/राशन कार्ड) है?", YN),
    "has_bank_account": ("Do you have a bank account?", "क्या आपका बैंक खाता है?", YN),
    "income_tax_payer": ("Did anyone in your family pay income tax last year?", "क्या पिछले साल परिवार में किसी ने आयकर भरा?", YN),
    "owns_land": ("Does your family own farm land?", "क्या आपके परिवार के पास खेती की ज़मीन है?", YN),
    "owns_pucca_house": ("Does your family own a pucca house anywhere in India?", "क्या आपके परिवार का भारत में कहीं पक्का घर है?", YN),
    "has_lpg": ("Does your household already have an LPG gas connection?", "क्या आपके घर में पहले से एलपीजी गैस कनेक्शन है?", YN),
    "has_girl_child_under_10": ("Do you have a daughter younger than 10?", "क्या आपकी 10 साल से छोटी बेटी है?", YN),
    "pregnant_or_lactating": ("Are you pregnant or a new mother?", "क्या आप गर्भवती हैं या हाल ही में माँ बनी हैं?", YN),
}

# order used when the assistant interviews someone from scratch
GENERAL_ORDER = ["age", "gender", "occupation", "income", "area", "bpl", "has_bank_account", "income_tax_payer"]

FIELD_NAMES = {
    "age": ("age", "उम्र"), "gender": ("gender", "लिंग"), "occupation": ("work", "काम"),
    "income": ("family income", "पारिवारिक आय"), "area": ("area", "क्षेत्र"), "state": ("state", "राज्य"),
    "category": ("category", "श्रेणी"), "education": ("education", "शिक्षा"), "bpl": ("BPL", "बीपीएल"),
    "has_bank_account": ("bank account", "बैंक खाता"), "income_tax_payer": ("income tax", "आयकर"),
    "owns_land": ("farm land", "खेती की ज़मीन"), "owns_pucca_house": ("pucca house", "पक्का घर"),
    "has_lpg": ("LPG connection", "एलपीजी कनेक्शन"), "has_girl_child_under_10": ("daughter under 10", "10 साल से छोटी बेटी"),
    "pregnant_or_lactating": ("pregnant / new mother", "गर्भवती / नई माँ"),
}

VALUE_NAMES = {
    "female": ("woman", "महिला"), "male": ("man", "पुरुष"), "other": ("other", "अन्य"),
    "rural": ("village", "गाँव"), "urban": ("town/city", "शहर"),
    "farmer": ("farmer", "किसान"), "student": ("student", "छात्र"), "self_employed": ("own business", "अपना व्यवसाय"),
    "artisan": ("artisan", "कारीगर"), "salaried": ("private job", "प्राइवेट नौकरी"), "govt_employee": ("govt job", "सरकारी नौकरी"),
    "homemaker": ("homemaker", "गृहिणी"), "unemployed": ("looking for work", "बेरोज़गार"), "retired": ("retired", "सेवानिवृत्त"),
    "street_vendor": ("street vendor", "रेहड़ी-पटरी विक्रेता"), "school": ("up to Class 10", "कक्षा 10 तक"),
    "post_matric": ("Class 11–12", "कक्षा 11–12"), "graduate": ("graduation", "स्नातक"), "postgraduate": ("post-graduation", "स्नातकोत्तर"),
}


def fmt_inr(n: int) -> str:
    if n >= 10000000:
        v = n / 10000000
        return f"₹{v:g} crore"
    if n >= 100000:
        v = round(n / 100000, 2)
        return f"₹{v:g} lakh"
    s = str(int(n))
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        head = re.sub(r"(\d)(?=(\d\d)+$)", r"\1,", head)
        s = head + "," + tail
    return "₹" + s


def describe_update(field: str, value, lang: str) -> str:
    i = 1 if lang == "hi" else 0
    name = FIELD_NAMES.get(field, (field, field))[i]
    if isinstance(value, bool):
        v = ("हाँ" if value else "नहीं") if lang == "hi" else ("yes" if value else "no")
    elif field == "income":
        v = fmt_inr(value)
    elif isinstance(value, str) and value in VALUE_NAMES:
        v = VALUE_NAMES[value][i]
    else:
        v = str(value)
    return f"{name}: {v}"


def label_hi(field: str, op: str, value) -> str:
    """Hindi version of an eligibility condition, generated from the rule itself."""
    if field == "age":
        if op == "gte":
            return f"आपकी उम्र {value} वर्ष या उससे अधिक है"
        if op == "between":
            return f"आपकी उम्र {value[0]} से {value[1]} वर्ष के बीच है"
        if op == "lte":
            return f"आपकी उम्र {value} वर्ष या उससे कम है"
    if field == "income" and op == "lte":
        return f"परिवार की सालाना आय {fmt_inr(value)} या उससे कम है"
    if field == "gender":
        return "आप महिला हैं" if value == "female" else "आप पुरुष हैं"
    if field == "area":
        return "आप शहरी क्षेत्र में रहते हैं" if value == "urban" else "आप ग्रामीण क्षेत्र में रहते हैं"
    if field == "category":
        vals = value if isinstance(value, list) else [value]
        names = {"SC": "अनुसूचित जाति", "ST": "अनुसूचित जनजाति", "OBC": "ओबीसी", "General": "सामान्य"}
        return "आप " + " या ".join(names.get(v, v) for v in vals) + " वर्ग से हैं"
    if field == "occupation":
        vals = value if isinstance(value, list) else [value]
        if vals == ["student"]:
            return "आप अभी पढ़ाई कर रहे हैं"
        if vals == ["farmer"]:
            return "आप किसान हैं"
        if vals == ["artisan"]:
            return "आप पारंपरिक कारीगरी या शिल्प का काम करते हैं"
        return "आप अपना व्यवसाय चलाते हैं या शुरू करना चाहते हैं"
    if field == "education":
        return "आप कक्षा 11 या उससे ऊपर पढ़ रहे हैं"
    bool_labels = {
        "bpl": ("आपका परिवार गरीबी रेखा से नीचे (बीपीएल) है", "आपका परिवार बीपीएल नहीं है"),
        "has_bank_account": ("आपका बैंक खाता है", "आपका बैंक खाता नहीं है"),
        "income_tax_payer": ("परिवार में कोई आयकर भरता है", "परिवार में किसी ने पिछले साल आयकर नहीं भरा"),
        "owns_land": ("परिवार के पास खेती की ज़मीन है", "परिवार के पास खेती की ज़मीन नहीं है"),
        "owns_pucca_house": ("परिवार का पक्का घर है", "परिवार का भारत में कहीं पक्का घर नहीं है"),
        "has_lpg": ("घर में एलपीजी कनेक्शन है", "घर में किसी के पास एलपीजी कनेक्शन नहीं है"),
        "has_girl_child_under_10": ("आपकी 10 साल से छोटी बेटी है", "आपकी 10 साल से छोटी बेटी नहीं है"),
        "pregnant_or_lactating": ("आप गर्भवती हैं या हाल ही में माँ बनी हैं", "आप गर्भवती या नई माँ नहीं हैं"),
    }
    if field in bool_labels:
        return bool_labels[field][0 if value else 1]
    return ""


DOC_HI = {
    "Aadhaar card": "आधार कार्ड", "Land ownership records": "ज़मीन के कागज़ (खतौनी)", "Bank account details": "बैंक खाते का विवरण",
    "Mobile number": "मोबाइल नंबर", "Ration card or PM letter": "राशन कार्ड या पीएम पत्र", "Income certificate": "आय प्रमाण पत्र",
    "Land / property documents": "ज़मीन/संपत्ति के कागज़", "Ration card": "राशन कार्ड", "Poverty status declaration": "गरीबी स्थिति घोषणा पत्र",
    "Birth certificate of the girl child": "बेटी का जन्म प्रमाण पत्र", "Aadhaar / ID of parent or guardian": "माता-पिता/अभिभावक का आधार/पहचान पत्र",
    "Address proof": "पते का प्रमाण", "Savings bank account": "बचत बैंक खाता", "Nominee details": "नामांकित व्यक्ति (नॉमिनी) का विवरण",
    "Bank account": "बैंक खाता", "Caste certificate": "जाति प्रमाण पत्र", "Previous marksheet": "पिछली मार्कशीट", "Fee receipt": "फ़ीस की रसीद",
    "Aadhaar-linked bank account": "आधार से जुड़ा बैंक खाता", "Identity and address proof": "पहचान और पते का प्रमाण",
    "Business plan or proof of business": "व्यवसाय योजना या व्यवसाय का प्रमाण", "Bank statements": "बैंक स्टेटमेंट",
    "Passport-size photographs": "पासपोर्ट साइज़ फ़ोटो", "Project report": "प्रोजेक्ट रिपोर्ट", "Business address proof": "व्यवसाय के पते का प्रमाण",
    "MCP card": "एमसीपी कार्ड (माँ-बच्चा सुरक्षा कार्ड)", "Bank or post office account": "बैंक या डाकघर खाता",
    "Birth registration": "बच्चे का जन्म पंजीकरण", "Age proof": "उम्र का प्रमाण", "BPL card": "बीपीएल कार्ड",
}

T = {
    "welcome": ("Namaste! I can find schemes for you, check if you qualify, list documents, and explain how to apply. You can type or speak, in English or Hindi.",
                "नमस्ते! मैं आपके लिए योजनाएँ ढूँढ सकता हूँ, पात्रता जाँच सकता हूँ, ज़रूरी दस्तावेज़ बता सकता हूँ और आवेदन का तरीका समझा सकता हूँ। आप हिंदी या अंग्रेज़ी में लिखकर या बोलकर पूछ सकते हैं।"),
    "thanks": ("You're welcome! Ask me anything else about schemes whenever you like.", "आपका स्वागत है! योजनाओं के बारे में और कुछ भी पूछिए।"),
    "noted": ("Got it, I've noted", "ठीक है, मैंने नोट किया"),
    "start_general": ("Let's find the schemes for you. I'll ask a few quick questions — tap an answer or type it.",
                      "चलिए आपके लिए योजनाएँ ढूँढते हैं। मैं कुछ छोटे सवाल पूछूँगा — जवाब चुनें या लिखें।"),
    "start_scheme": ("Let's check {name}. I need a few details.", "{name} के लिए जाँच करते हैं। मुझे कुछ जानकारी चाहिए।"),
    "verdict_likely": ("Good news: you appear to meet all the conditions for {name}.", "अच्छी खबर: आप {name} की सभी शर्तें पूरी करते दिख रहे हैं।"),
    "verdict_check": ("You may qualify for {name}, but some details are still missing.", "आप {name} के पात्र हो सकते हैं, लेकिन कुछ जानकारी अभी बाकी है।"),
    "verdict_no": ("You don't appear to meet all the conditions for {name}.", "आप {name} की सभी शर्तें पूरी करते नहीं दिख रहे।"),
    "final_note": ("Final eligibility is always decided by the scheme authority.", "अंतिम पात्रता का फ़ैसला योजना का संबंधित विभाग ही करता है।"),
    "discover_head": ("Based on your details, you appear to qualify for {n}:", "आपकी जानकारी के आधार पर आप {n} के पात्र दिखते हैं:"),
    "discover_check": ("You may also qualify for {n} more if you answer a few questions.", "कुछ और सवालों के जवाब देने पर आप {n} और योजनाओं के पात्र हो सकते हैं।"),
    "q_more": ("Answer the remaining questions", "बाकी सवालों के जवाब दें"),
    "more_intro": ("A few more questions to check the remaining schemes.", "बाकी योजनाएँ जाँचने के लिए कुछ और सवाल।"),
    "few_more": ("A few more quick questions.", "बस कुछ और छोटे सवाल।"),
    "discover_none": ("None of the schemes in my database match your details yet. Try adding more details to your profile.",
                      "अभी मेरे डेटाबेस की कोई योजना आपकी जानकारी से मेल नहीं खाती। अपनी प्रोफ़ाइल में और जानकारी जोड़कर देखें।"),
    "value_line": ("Together that could mean {parts}.", "कुल मिलाकर इसका मतलब हो सकता है: {parts}।"),
    "docs_head": ("Documents usually needed for {name}:", "{name} के लिए आमतौर पर ज़रूरी दस्तावेज़:"),
    "if_applicable": (" (if applicable)", " (यदि लागू हो)"),
    "apply_head": ("How to apply for {name} ({mode}):", "{name} के लिए आवेदन कैसे करें ({mode}):"),
    "helpline": ("Helpline", "हेल्पलाइन"),
    "benefits_head": ("What you get from {name}:", "{name} से आपको क्या मिलता है:"),
    "elig_head": ("To be eligible for {name}:", "{name} की पात्रता की शर्तें:"),
    "elig_alt": ("Or, alternatively:", "या फिर:"),
    "elig_tip": ("Tell me a bit about yourself and I'll check these for you.", "अपने बारे में थोड़ा बताइए, मैं ये शर्तें आपके लिए जाँच दूँगा।"),
    "who": ("Who it's for", "किसके लिए"),
    "benefits": ("Benefits", "लाभ"),
    "source": ("Official website", "आधिकारिक वेबसाइट"),
    "related": ("Related schemes", "संबंधित योजनाएँ"),
    "no_match": ("I couldn't find a scheme for that in my database. Try a need like 'pension', 'scholarship', 'housing', 'loan' or 'health', or ask 'Which schemes can I apply for?'",
                 "मुझे इसके लिए कोई योजना नहीं मिली। 'पेंशन', 'छात्रवृत्ति', 'घर', 'लोन' या 'इलाज' जैसा कुछ लिखें, या पूछें 'मैं किन योजनाओं के लिए आवेदन कर सकता हूँ?'"),
    "out_of_scope": ("I can only help with government schemes and citizen services. Ask me which schemes you qualify for, or about documents, benefits or how to apply.",
                     "मैं केवल सरकारी योजनाओं और नागरिक सेवाओं में मदद कर सकता हूँ। पूछिए कि आप किन योजनाओं के पात्र हैं, या दस्तावेज़, लाभ और आवेदन के बारे में।"),
    "which_scheme": ("Which scheme would you like me to check? You can name one, or I can check all of them for you.",
                     "आप किस योजना की जाँच करवाना चाहते हैं? किसी योजना का नाम लिखें, या मैं सभी योजनाएँ जाँच दूँ।"),
    "compare_head": ("Here's how they compare:", "दोनों की तुलना:"),
    "compare_need2": ("Name two schemes to compare, for example 'Compare PMJJBY and PMSBY'.", "तुलना के लिए दो योजनाओं के नाम लिखें, जैसे 'PMJJBY और PMSBY की तुलना करें'।"),
    "skipped": ("No problem, skipping that.", "कोई बात नहीं, इसे छोड़ते हैं।"),
    "didnt_get": ("Sorry, I didn't catch that. Please pick one of the options or type your answer.", "माफ़ कीजिए, मैं समझ नहीं पाया। कृपया कोई विकल्प चुनें या जवाब लिखें।"),
    "met": ("✓", "✓"), "not_met": ("✗", "✗"), "unknown": ("?", "?"),
    "q_all": ("Check all schemes for me", "मेरे लिए सभी योजनाएँ जाँचें"),
    "q_docs": ("What documents do I need?", "कौन से दस्तावेज़ चाहिए?"),
    "q_apply": ("How do I apply?", "आवेदन कैसे करें?"),
    "q_benefits": ("What are the benefits?", "क्या लाभ मिलेगा?"),
    "q_elig": ("Am I eligible?", "क्या मैं पात्र हूँ?"),
}


def t(key: str, lang: str, **kw) -> str:
    s = T[key][1 if lang == "hi" else 0]
    return s.format(**kw) if kw else s
