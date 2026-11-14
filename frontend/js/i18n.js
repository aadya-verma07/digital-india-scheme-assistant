// All interface text in English and Hindi. L(key, vars) returns the string for the current language.
import { state } from "./state.js";

const S = {
  // shell
  skip: ["Skip to content", "मुख्य सामग्री पर जाएँ"],
  brand: ["Scheme Assistant", "योजना सहायक"], brand_sub: ["Digital India citizen services", "डिजिटल इंडिया नागरिक सेवाएँ"],
  nav_home: ["Home", "होम"], nav_check: ["Eligibility check", "पात्रता जाँच"], nav_results: ["My results", "मेरे नतीजे"],
  nav_ask: ["Assistant", "सहायक"], nav_schemes: ["All schemes", "सभी योजनाएँ"], nav_insights: ["Insights", "आँकड़े"],
  cta_check: ["Check eligibility", "पात्रता जाँचें"], api_docs: ["API documentation", "एपीआई दस्तावेज़"],
  footer: ["Academic prototype, Minor Project, Department of ECE, MAIT. Guidance only: final eligibility is decided by the issuing authority, so always confirm on the official website before applying.",
           "शैक्षणिक प्रोटोटाइप, माइनर प्रोजेक्ट, ईसीई विभाग, एमएआईटी। केवल मार्गदर्शन के लिए: अंतिम पात्रता संबंधित विभाग तय करता है, इसलिए आवेदन से पहले आधिकारिक वेबसाइट पर ज़रूर जाँचें।"],
  server_err: ["Couldn't reach the server. Check your connection and try again.", "सर्वर से संपर्क नहीं हो पाया। इंटरनेट जाँचें और फिर कोशिश करें।"],

  // home
  hero_title: ["Find every government scheme you're entitled to", "जानिए कौन सी सरकारी योजनाएँ आपके लिए हैं"],
  hero_lede: ["Describe yourself in a sentence, in English or Hindi. We check you against every scheme's official conditions and show what you could receive, what to keep ready and where to apply.",
              "हिंदी या अंग्रेज़ी में एक वाक्य में अपने बारे में बताइए। हम हर योजना की आधिकारिक शर्तों से मिलान करके बताएँगे कि आपको क्या मिल सकता है, कौन से दस्तावेज़ तैयार रखें और कहाँ आवेदन करें।"],
  ai_label: ["Describe yourself or ask a question", "अपने बारे में बताइए या सवाल पूछिए"],
  ai_ph: ["e.g. I'm a 45 year old farmer from Bihar, we earn about 1 lakh a year and have a BPL card", "जैसे: मैं बिहार का 45 साल का किसान हूँ, सालाना आय 1 लाख है और बीपीएल कार्ड है"],
  ai_go: ["Find my schemes", "मेरी योजनाएँ खोजें"], speak: ["Speak", "बोलें"], try: ["Try", "आज़माएँ"],
  ai_working: ["Reading your details and checking every scheme…", "आपकी जानकारी पढ़कर हर योजना जाँची जा रही है…"],
  ai_routed: ["That sounds like a question, so the assistant will answer it.", "यह एक सवाल लगता है, इसलिए सहायक इसका जवाब देगा।"],
  ai_empty: ["Type a sentence about yourself, or tap an example.", "अपने बारे में एक वाक्य लिखें, या कोई उदाहरण चुनें।"],
  link_check: ["Check step by step instead", "एक-एक करके जाँचें"], link_ask: ["Chat with the assistant", "सहायक से बात करें"],
  stat_schemes: ["central schemes", "केंद्रीय योजनाएँ"], stat_cats: ["categories", "श्रेणियाँ"], stat_lang: ["English and हिंदी", "हिंदी और English"], stat_lang_b: ["2 languages", "2 भाषाएँ"],
  cats_title: ["Browse by category", "श्रेणी के अनुसार देखें"], cats_sub: ["Every scheme is grouped by the need it serves.", "हर योजना उस ज़रूरत के अनुसार है जिसे वह पूरा करती है।"],
  n_schemes: ["{n} schemes", "{n} योजनाएँ"], n_scheme: ["1 scheme", "1 योजना"],
  feat_title: ["Most-used schemes", "सबसे ज़्यादा उपयोग होने वाली योजनाएँ"], feat_sub: ["Large central programmes most families should check first.", "बड़ी केंद्रीय योजनाएँ, जिन्हें ज़्यादातर परिवारों को पहले जाँचना चाहिए।"],
  view_all: ["View all schemes", "सभी योजनाएँ देखें"], details: ["Details", "विवरण"],
  how_title: ["How it works", "यह कैसे काम करता है"],
  how1_t: ["Tell us about yourself", "अपने बारे में बताइए"], how1_b: ["Type or speak a sentence, use the step-by-step check, or chat. Skip anything you'd rather not share.", "एक वाक्य लिखें या बोलें, एक-एक करके जाँच करें, या बातचीत करें। जो बताना न चाहें, छोड़ दें।"],
  how2_t: ["Every condition is checked", "हर शर्त जाँची जाती है"], how2_b: ["Each scheme's official conditions are compared with your answers. A strip shows one block per condition.", "हर योजना की आधिकारिक शर्तों का आपके जवाबों से मिलान होता है। पट्टी में हर शर्त का एक खाना है।"],
  how3_t: ["Get your plan", "अपनी योजना पाएँ"], how3_b: ["See what you could receive, which documents to collect and where to apply, then save it as a report.", "देखें कि आपको क्या मिल सकता है, कौन से दस्तावेज़ जुटाने हैं और कहाँ आवेदन करना है, फिर रिपोर्ट सेव करें।"],
  lg_met: ["meets", "पूरी"], lg_not: ["doesn't meet", "पूरी नहीं"], lg_unk: ["not answered", "जवाब बाकी"],
  path_check_t: ["Eligibility check", "पात्रता जाँच"], path_check_b: ["Five short steps. Covers every condition across all schemes, and takes about two minutes.", "पाँच छोटे चरण। सभी योजनाओं की हर शर्त शामिल, लगभग दो मिनट।"],
  path_check_go: ["Start the check", "जाँच शुरू करें"],
  path_ask_t: ["Ask the assistant", "सहायक से पूछें"], path_ask_b: ["Ask about any scheme's benefits, documents or how to apply, in English or Hindi, by voice or text.", "किसी भी योजना के लाभ, दस्तावेज़ या आवेदन के बारे में हिंदी या अंग्रेज़ी में, बोलकर या लिखकर पूछें।"],
  path_ask_go: ["Open the assistant", "सहायक खोलें"],

  // checker
  check_title: ["Eligibility check", "पात्रता जाँच"],
  step_of: ["Step {n} of {m}", "चरण {n} / {m}"],
  s1_t: ["About you", "आपके बारे में"], s1_i: ["Basic details used by almost every scheme.", "लगभग हर योजना में इस्तेमाल होने वाली बुनियादी जानकारी।"],
  s2_t: ["Where you live", "आप कहाँ रहते हैं"], s2_i: ["Some schemes are only for villages or only for towns and cities.", "कुछ योजनाएँ केवल गाँवों या केवल शहरों के लिए हैं।"],
  s3_t: ["Work and income", "काम और आय"], s3_i: ["Used for income limits, occupation-based schemes and scholarships.", "आय सीमा, काम आधारित योजनाओं और छात्रवृत्तियों के लिए।"],
  s4_t: ["Your household", "आपका परिवार"], s4_i: ["Quick yes or no questions. Skip any that don't apply.", "छोटे हाँ या नहीं वाले सवाल। जो लागू न हों, छोड़ दें।"],
  s5_t: ["Review your answers", "अपने जवाब जाँचें"], s5_i: ["Check everything is right. You can change any answer later and results update instantly.", "देखें कि सब सही है। आप बाद में कोई भी जवाब बदल सकते हैं, नतीजे तुरंत बदलेंगे।"],
  back: ["Back", "पीछे"], next: ["Continue", "आगे बढ़ें"], skip_step: ["Skip this step", "यह चरण छोड़ें"],
  see_results: ["See my results", "मेरे नतीजे देखें"], edit: ["Edit", "बदलें"], not_answered: ["Not answered", "जवाब नहीं दिया"],
  sample: ["Use a sample profile", "नमूना प्रोफ़ाइल भरें"], clear_all: ["Clear answers", "जवाब मिटाएँ"],
  so_far: ["So far", "अब तक"], live_likely: ["schemes you appear to qualify for", "योजनाएँ जिनके आप पात्र दिखते हैं"],
  live_check: ["{n} more need answers", "{n} और के लिए जवाब चाहिए"],
  yes: ["Yes", "हाँ"], no: ["No", "नहीं"], choose: ["Choose", "चुनें"], years: ["years", "वर्ष"],
  income_hint: ["Total yearly income of everyone in the family. An estimate is fine.", "परिवार के सभी सदस्यों की कुल सालाना आय। अनुमान भी ठीक है।"],
  optional: ["optional", "वैकल्पिक"],

  // fields
  f_name: ["Your name", "आपका नाम"], f_age: ["Age", "उम्र"], f_gender: ["Gender", "लिंग"], f_state: ["State or UT", "राज्य या केंद्र शासित प्रदेश"],
  f_area: ["Area", "क्षेत्र"], f_occupation: ["What do you do?", "आप क्या करते हैं?"], f_income: ["Annual family income", "परिवार की सालाना आय"],
  f_education: ["Education", "शिक्षा"], f_category: ["Social category", "सामाजिक श्रेणी"],
  o_female: ["Woman", "महिला"], o_male: ["Man", "पुरुष"], o_other: ["Other", "अन्य"],
  o_rural: ["Village / rural", "गाँव / ग्रामीण"], o_urban: ["Town or city", "शहर / कस्बा"],
  o_student: ["Student", "छात्र"], o_farmer: ["Farmer", "किसान"], o_salaried: ["Private job", "प्राइवेट नौकरी"], o_govt: ["Government job", "सरकारी नौकरी"],
  o_self: ["Own business", "अपना व्यवसाय"], o_artisan: ["Artisan / craftsperson", "कारीगर / शिल्पकार"], o_vendor: ["Street vendor", "रेहड़ी-पटरी विक्रेता"],
  o_home: ["Homemaker", "गृहिणी"], o_unemp: ["Looking for work", "काम की तलाश में"], o_retired: ["Retired", "सेवानिवृत्त"],
  o_none: ["No formal schooling", "औपचारिक शिक्षा नहीं"], o_school: ["Up to Class 10", "कक्षा 10 तक"], o_pm: ["Class 11–12 / diploma", "कक्षा 11–12 / डिप्लोमा"],
  o_grad: ["Graduation", "स्नातक"], o_pg: ["Post-graduation", "स्नातकोत्तर"], o_general: ["General", "सामान्य"],
  q_bank: ["Do you have a bank account?", "क्या आपका बैंक खाता है?"], q_bank_h: ["Savings, Jan Dhan or post office account", "बचत, जन धन या डाकघर खाता"],
  q_bpl: ["Is your family below the poverty line?", "क्या आपका परिवार गरीबी रेखा से नीचे है?"], q_bpl_h: ["BPL card, Antyodaya or priority ration card", "बीपीएल कार्ड, अंत्योदय या प्राथमिकता राशन कार्ड"],
  q_tax: ["Did anyone in your family pay income tax last year?", "क्या पिछले साल परिवार में किसी ने आयकर भरा?"],
  q_land: ["Does your family own farm land?", "क्या परिवार के पास खेती की ज़मीन है?"],
  q_house: ["Does your family own a pucca house?", "क्या परिवार का पक्का घर है?"], q_house_h: ["Anywhere in India", "भारत में कहीं भी"],
  q_lpg: ["Does your household have an LPG connection?", "क्या घर में एलपीजी गैस कनेक्शन है?"],
  q_girl: ["Do you have a daughter under 10?", "क्या आपकी 10 साल से छोटी बेटी है?"],
  q_preg: ["Are you pregnant or a new mother?", "क्या आप गर्भवती हैं या हाल ही में माँ बनी हैं?"],
  fl_age: ["Age", "उम्र"], fl_gender: ["Gender", "लिंग"], fl_occupation: ["Work", "काम"], fl_income: ["Family income", "पारिवारिक आय"],
  fl_area: ["Area", "क्षेत्र"], fl_state: ["State", "राज्य"], fl_category: ["Category", "श्रेणी"], fl_education: ["Education", "शिक्षा"], fl_name: ["Name", "नाम"],
  fl_bpl: ["Below poverty line", "गरीबी रेखा से नीचे"], fl_has_bank_account: ["Bank account", "बैंक खाता"], fl_income_tax_payer: ["Pays income tax", "आयकर भरते हैं"],
  fl_owns_land: ["Owns farm land", "खेती की ज़मीन"], fl_owns_pucca_house: ["Owns pucca house", "पक्का घर"], fl_has_lpg: ["LPG connection", "एलपीजी कनेक्शन"],
  fl_has_girl_child_under_10: ["Daughter under 10", "10 साल से छोटी बेटी"], fl_pregnant_or_lactating: ["Pregnant / new mother", "गर्भवती / नई माँ"],

  // results
  res_title: ["Your scheme results", "आपकी योजनाओं के नतीजे"],
  res_sub: ["Based on {n} details you shared. Results update the moment you change an answer.", "आपकी {n} जानकारियों के आधार पर। कोई जवाब बदलते ही नतीजे तुरंत बदलते हैं।"],
  res_empty_t: ["No results yet", "अभी कोई नतीजा नहीं"], res_empty_b: ["Tell us a little about yourself to see which schemes you appear to qualify for.", "यह देखने के लिए कि आप किन योजनाओं के पात्र दिखते हैं, अपने बारे में थोड़ा बताइए।"],
  k_eligible: ["Schemes you qualify for", "पात्र योजनाएँ"], k_more: ["{n} more need answers", "{n} और के लिए जवाब चाहिए"],
  k_cash: ["Cash support per year", "हर साल नकद सहायता"], k_one: ["One-time support", "एकमुश्त सहायता"], k_cover: ["Insurance and health cover", "बीमा और स्वास्थ्य कवर"],
  k_loan: ["Loans you can apply for", "लोन, जिनके लिए आवेदन कर सकते हैं"], k_loan_sub: ["Maximum available", "अधिकतम उपलब्ध"], k_est: ["Estimated, before verification", "अनुमानित, सत्यापन से पहले"],
  tab_likely: ["Eligible", "पात्र"], tab_check: ["Needs answers", "जवाब चाहिए"], tab_not: ["Not eligible", "पात्र नहीं"],
  st_likely: ["Likely eligible", "पात्र दिखते हैं"], st_check: ["Needs answers", "जवाब चाहिए"], st_not_eligible: ["Not eligible", "पात्र नहीं"],
  conditions: ["Conditions", "शर्तें"], view_conditions: ["Conditions", "शर्तें"], details_apply: ["Details and apply", "विवरण और आवेदन"],
  unk: ["not answered yet", "जवाब बाकी"], why_not: ["Not met: {x}", "पूरी नहीं: {x}"],
  meets_all: ["Meets all {n} conditions", "सभी {n} शर्तें पूरी"], meets_one: ["Meets the only condition", "एकमात्र शर्त पूरी"],
  meets_some: ["{a} of {n} met, {u} unanswered", "{n} में से {a} पूरी, {u} का जवाब बाकी"], fails: ["{f} not met", "{f} पूरी नहीं"],
  tab_empty_likely: ["No scheme is a clear match yet. Answering the missing questions often changes this.", "अभी कोई योजना पूरी तरह मेल नहीं खाती। बाकी सवालों के जवाब देने से अक्सर यह बदल जाता है।"],
  tab_empty_check: ["Nothing waiting on answers. Every scheme has been fully checked.", "किसी योजना के लिए जवाब बाकी नहीं। हर योजना पूरी तरह जाँची गई।"],
  tab_empty_not: ["You haven't been ruled out of any scheme.", "आप किसी योजना से बाहर नहीं हुए हैं।"],
  profile_t: ["Your details", "आपकी जानकारी"], edit_answers: ["Edit answers", "जवाब बदलें"], start_over: ["Start over", "फिर से शुरू करें"],
  missing_t: ["Missing information", "बाकी जानकारी"], missing_b: ["Answering these could confirm more schemes.", "इनका जवाब देने से और योजनाएँ पक्की हो सकती हैं।"],
  unlocks: ["Affects {n} schemes", "{n} योजनाओं पर असर"], unlocks_one: ["Affects 1 scheme", "1 योजना पर असर"], answer: ["Answer", "जवाब दें"],
  docs_t: ["Documents to keep ready", "तैयार रखने वाले दस्तावेज़"], docs_b: ["{a} of {n} collected", "{n} में से {a} तैयार"], needed_for: ["Needed for", "इनके लिए"],
  report_btn: ["Download report", "रिपोर्ट डाउनलोड करें"], ask_btn: ["Ask the assistant", "सहायक से पूछें"],
  also: ["Also", "साथ ही"],

  // detail
  who: ["Who it's for", "किसके लिए"], benefits: ["Benefits", "लाभ"], eligibility: ["Eligibility", "पात्रता"], docs_needed: ["Documents", "दस्तावेज़"],
  how_apply: ["How to apply", "आवेदन कैसे करें"], helpline: ["Helpline", "हेल्पलाइन"], official: ["Open official website", "आधिकारिक वेबसाइट खोलें"],
  ask_about: ["Ask about this scheme", "इस योजना के बारे में पूछें"], scheme_page: ["Scheme page", "योजना पेज"], apply_at: ["Apply at", "आवेदन"],
  v_likely: ["You appear to meet all the conditions", "आप सभी शर्तें पूरी करते दिखते हैं"],
  v_check: ["You may qualify. Some answers are missing", "आप पात्र हो सकते हैं। कुछ जवाब बाकी हैं"],
  v_not_eligible: ["You don't appear to meet all the conditions", "आप सभी शर्तें पूरी करते नहीं दिखते"],
  qualify_if: ["You qualify if", "आप पात्र हैं अगर"], or_if: ["Or, if", "या फिर, अगर"],
  routes: ["This scheme has more than one way to qualify. The route closest to your profile is shown.", "इस योजना में पात्र होने के एक से ज़्यादा रास्ते हैं। आपकी प्रोफ़ाइल के सबसे करीब वाला दिखाया गया है।"],
  fill_tip: ["Complete the eligibility check to see which of these you meet.", "इनमें से कौन सी शर्तें आप पूरी करते हैं, यह देखने के लिए पात्रता जाँच पूरी करें।"],
  if_applicable: ["if applicable", "यदि लागू हो"], close: ["Close", "बंद करें"],
  link_help: ["Government websites can be slow or blocked on some networks. If the link doesn't open, call the helpline, visit your bank or nearest Common Service Centre (CSC), or search the scheme on myScheme.gov.in.",
              "सरकारी वेबसाइटें कभी-कभी धीमी होती हैं या कुछ नेटवर्क पर नहीं खुलतीं। लिंक न खुले तो हेल्पलाइन पर कॉल करें, अपने बैंक या नज़दीकी कॉमन सर्विस सेंटर (CSC) जाएँ, या myScheme.gov.in पर योजना खोजें।"],

  // assistant
  ask_title: ["Assistant", "सहायक"], ask_sub: ["Ask in English or Hindi, by typing or speaking. Answers come only from official scheme records.", "हिंदी या अंग्रेज़ी में लिखकर या बोलकर पूछें। जवाब केवल आधिकारिक योजना रिकॉर्ड से आते हैं।"],
  bot_name: ["Scheme Assistant", "योजना सहायक"], bot_status: ["Online", "ऑनलाइन"], clear_chat: ["New conversation", "नई बातचीत"],
  chat_ph: ["Ask about a scheme or describe yourself…", "किसी योजना के बारे में पूछें या अपने बारे में बताइए…"], send: ["Send", "भेजें"],
  thinking: ["Looking through the scheme records…", "योजनाओं के रिकॉर्ड देखे जा रहे हैं…"],
  suggest_t: ["Suggested questions", "सुझाए गए सवाल"], g_find: ["Find schemes", "योजनाएँ खोजें"], g_elig: ["Eligibility", "पात्रता"],
  g_docs: ["Documents and applying", "दस्तावेज़ और आवेदन"], g_compare: ["Compare", "तुलना"],
  known_t: ["What the assistant knows", "सहायक को क्या पता है"], known_empty: ["Nothing yet. Details you mention in the chat appear here and are used for your results.", "अभी कुछ नहीं। बातचीत में बताई गई जानकारी यहाँ दिखेगी और आपके नतीजों में इस्तेमाल होगी।"],
  open_results: ["Open my results", "मेरे नतीजे खोलें"], settings_t: ["Settings", "सेटिंग्स"], read_aloud: ["Read answers aloud", "जवाब सुनाएँ"],
  mode_rules: ["Answers from rule engine and scheme database", "जवाब नियम इंजन और योजना डेटाबेस से"], mode_llm: ["Answers written by AI model: {m}", "जवाब एआई मॉडल द्वारा: {m}"],
  saved_profile: ["Saved to your details", "आपकी जानकारी में जोड़ा गया"], sources: ["Sources", "स्रोत"],
  welcome: ["Namaste! I can find government schemes you qualify for, check your eligibility, list the documents you need and explain how to apply. Tell me about yourself, or ask about any scheme.",
            "नमस्ते! मैं आपकी पात्रता के हिसाब से सरकारी योजनाएँ ढूँढ सकता हूँ, ज़रूरी दस्तावेज़ बता सकता हूँ और आवेदन का तरीका समझा सकता हूँ। अपने बारे में बताइए, या किसी भी योजना के बारे में पूछिए।"],
  listening: ["Listening… speak now", "सुन रहा हूँ… बोलिए"], no_voice: ["Voice input isn't supported in this browser. Try Chrome or Edge.", "इस ब्राउज़र में आवाज़ इनपुट उपलब्ध नहीं है। Chrome या Edge आज़माएँ।"],
  read: ["Read aloud", "सुनाएँ"],

  // directory
  dir_title: ["All schemes", "सभी योजनाएँ"], dir_sub: ["Central government schemes in this assistant, with official links.", "इस सहायक में शामिल केंद्रीय योजनाएँ, आधिकारिक लिंक के साथ।"],
  search_ph: ["Search by name or need, like pension or housing", "नाम या ज़रूरत से खोजें, जैसे पेंशन या घर"],
  categories: ["Category", "श्रेणी"], all: ["All schemes", "सभी योजनाएँ"], sort: ["Sort", "क्रम"], sort_name: ["Name (A–Z)", "नाम (अ–ज्ञ)"],
  sort_cat: ["Category", "श्रेणी"], sort_fit: ["Best match for me", "मेरे लिए सबसे उपयुक्त"], only_mine: ["Only schemes I qualify for", "केवल पात्र योजनाएँ"],
  showing: ["Showing {n} of {m}", "{m} में से {n}"], no_results: ['No schemes match "{q}". Try a broader word like loan, pension or student.', '"{q}" से कोई योजना नहीं मिली। लोन, पेंशन या छात्र जैसा शब्द आज़माएँ।'],
  compare: ["Compare", "तुलना करें"], compare_n: ["{n} selected", "{n} चुनी गईं"], compare_go: ["Compare", "तुलना करें"], clear: ["Clear", "हटाएँ"],
  compare_t: ["Compare schemes", "योजनाओं की तुलना"], compare_max: ["You can compare up to 3 schemes", "आप अधिकतम 3 योजनाओं की तुलना कर सकते हैं"],
  your_status: ["Your status", "आपकी स्थिति"],

  // insights
  ins_title: ["Insights", "आँकड़े"], ins_sub: ["Demand and gaps across every citizen profile checked in the assistant. For department planning and outreach.", "सहायक में जाँची गई हर नागरिक प्रोफ़ाइल से माँग और कमियाँ। विभागीय योजना और जागरूकता के लिए।"],
  flt_occ: ["Occupation", "काम"], flt_area: ["Area", "क्षेत्र"], flt_gender: ["Gender", "लिंग"], flt_sector: ["Scheme category", "योजना श्रेणी"], flt_all: ["All", "सभी"], flt_reset: ["Reset", "रीसेट"],
  ik_profiles: ["Profiles checked", "जाँची गई प्रोफ़ाइल"], ik_reach: ["Qualify for at least one", "कम से कम एक के पात्र"], ik_avg: ["Schemes per citizen", "प्रति नागरिक योजनाएँ"],
  ik_cash: ["Cash support identified", "पहचानी गई नकद सहायता"], ik_cover: ["Cover identified", "पहचाना गया कवर"], ik_avg_sub: ["Average, likely eligible", "औसत, पात्र"],
  ic_demand: ["Demand by scheme", "योजना-वार माँग"], ic_demand_b: ["Citizens who appear to qualify, and those who might with more information.", "जो नागरिक पात्र दिखते हैं, और जो और जानकारी मिलने पर हो सकते हैं।"],
  ic_likely: ["Appear to qualify", "पात्र दिखते हैं"], ic_check: ["Might qualify", "पात्र हो सकते हैं"],
  ic_near: ["Near misses", "बस एक शर्त से चूके"], ic_near_b: ["Citizens who meet every condition but one. Where outreach or a policy change would reach more people.", "वे नागरिक जो एक को छोड़कर सभी शर्तें पूरी करते हैं। यहाँ जागरूकता या नीति बदलाव से ज़्यादा लोगों तक पहुँचा जा सकता है।"],
  ic_gaps: ["Information gaps", "जानकारी की कमी"], ic_gaps_b: ["Questions citizens most often leave unanswered.", "सवाल जिनका नागरिक अक्सर जवाब नहीं देते।"],
  ic_who: ["Who is using the service", "सेवा का उपयोग कौन कर रहा है"], ic_area: ["Rural and urban split", "ग्रामीण और शहरी हिस्सा"],
  table_view: ["Show as table", "तालिका के रूप में देखें"], scheme: ["Scheme", "योजना"], citizens: ["citizens", "नागरिक"], profiles_word: ["profiles", "प्रोफ़ाइल"],
  ins_note: ["Includes 120 synthetic demo profiles generated with a fixed seed so the dashboard has data in a demo, plus every real profile checked.", "डेमो के लिए 120 कृत्रिम प्रोफ़ाइल (निश्चित सीड से बनी) और हर वास्तविक जाँची गई प्रोफ़ाइल शामिल।"],
  no_data: ["No profiles match these filters.", "इन फ़िल्टर से कोई प्रोफ़ाइल मेल नहीं खाती।"],

  // report
  report_title: ["My Government Scheme Report", "मेरी सरकारी योजना रिपोर्ट"], your_details: ["Your details", "आपकी जानकारी"], est_value: ["Estimated value", "अनुमानित लाभ"],
};

export const hi = () => state.lang === "hi";
export function L(key, vars = {}) {
  let s = (S[key] || [key, key])[hi() ? 1 : 0];
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}
export function applyStaticText(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = L(el.dataset.i18n)));
  root.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = L(el.dataset.i18nPh)));
  document.documentElement.lang = state.lang;
}
