// Frontend for the Digital India Scheme Assistant. Talks to the FastAPI backend over REST.
const API = "/api";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const linkify = (html) => html.replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

/* ================= text in both languages ================= */
const I18N = {
  brand: ["Scheme Assistant", "योजना सहायक"], brand_sub: ["Digital India citizen services", "डिजिटल इंडिया नागरिक सेवाएँ"],
  tab_find: ["Find schemes", "योजनाएँ खोजें"], tab_ask: ["Ask the assistant", "सहायक से पूछें"],
  tab_browse: ["All schemes", "सभी योजनाएँ"], tab_insights: ["Insights", "आँकड़े"],
  find_title: ["Or answer step by step", "या एक-एक करके जवाब दें"],
  form_note: ["Skip anything you'd rather not share. Results update as you go.", "जो बताना न चाहें, उसे छोड़ दें। नतीजे साथ-साथ बदलते रहेंगे।"],
  hero_title: ["Find the government schemes made for you", "आपके लिए बनी सरकारी योजनाएँ खोजें"],
  hero_sub: ["Tell us about yourself in your own words. We check you against every scheme's conditions and show what you can get, what to keep ready, and where to apply.",
             "अपने बारे में अपने शब्दों में बताइए। हम हर योजना की शर्तों से मिलान करके बताएँगे कि आपको क्या मिल सकता है, कौन से दस्तावेज़ तैयार रखें और कहाँ आवेदन करें।"],
  pill_1: ["14 central schemes", "14 केंद्रीय योजनाएँ"], pill_2: ["English and हिंदी", "हिंदी और English"], pill_3: ["Speak or type", "बोलें या लिखें"],
  describe_label: ["Describe yourself in a sentence", "एक वाक्य में अपने बारे में बताइए"],
  how1_t: ["Tell us about yourself", "अपने बारे में बताइए"], how1_b: ["Describe yourself above, or answer the questions. Skip anything you like.", "ऊपर अपने बारे में लिखें, या सवालों के जवाब दें। जो चाहें छोड़ दें।"],
  how2_t: ["See every condition checked", "हर शर्त की जाँच देखें"], how2_b: ["Each scheme gets a strip, one block per condition.", "हर योजना की एक पट्टी होती है, हर शर्त के लिए एक खाना।"],
  lg_met: ["you meet it", "पूरी"], lg_not: ["you don't", "पूरी नहीं"], lg_unk: ["not answered yet", "जवाब बाकी"],
  how3_t: ["Get your plan", "अपनी योजना पाएँ"], how3_b: ["What you could receive, the documents to collect, and where to apply, as a report you can save.", "आपको क्या मिल सकता है, कौन से दस्तावेज़ जुटाने हैं और कहाँ आवेदन करना है — एक रिपोर्ट के रूप में।"],
  ex_title: ["Try:", "आज़माएँ:"],
  st_likely: ["Likely eligible", "पात्र दिखते हैं"], st_check: ["Needs answers", "जवाब चाहिए"], st_not_eligible: ["Not a match", "मेल नहीं"],
  link_help: ["Government websites are sometimes slow or don't open on some networks. If the link doesn't work, call the helpline, visit your bank or nearest Common Service Centre (CSC), or look the scheme up on", "सरकारी वेबसाइटें कभी-कभी धीमी होती हैं या कुछ नेटवर्क पर नहीं खुलतीं। लिंक न खुले तो हेल्पलाइन पर कॉल करें, अपने बैंक या नज़दीकी कॉमन सर्विस सेंटर (CSC) जाएँ, या योजना यहाँ खोजें:"],
  apply_site: ["Apply / official site", "आवेदन / आधिकारिक साइट"], scheme_page: ["Scheme page", "योजना पेज"],
  toast_saved: ["Saved to your profile", "आपकी प्रोफ़ाइल में जोड़ा गया"],
  describe_ph: ["e.g. I'm a 45 year old farmer from Bihar, we earn about 1 lakh a year and have a BPL card",
                "जैसे: मैं बिहार का 45 साल का किसान हूँ, सालाना आय 1 लाख है और बीपीएल कार्ड है"],
  describe_go: ["Find my schemes", "मेरी योजनाएँ खोजें"],
  basics: ["Basics", "बुनियादी जानकारी"], background: ["Background", "पृष्ठभूमि"], household: ["Your household", "आपका परिवार"],
  f_name: ["Name (optional)", "नाम (वैकल्पिक)"], f_age: ["Age", "उम्र"], f_gender: ["Gender", "लिंग"], f_area: ["Where you live", "आप कहाँ रहते हैं"],
  f_state: ["State", "राज्य"], f_category: ["Social category", "सामाजिक श्रेणी"], f_income: ["Annual family income (₹)", "परिवार की सालाना आय (₹)"],
  f_occupation: ["What you do", "आप क्या करते हैं"], f_education: ["Education", "शिक्षा"], choose: ["Choose", "चुनें"],
  o_female: ["Female", "महिला"], o_male: ["Male", "पुरुष"], o_other: ["Other", "अन्य"], o_rural: ["Village / rural", "गाँव / ग्रामीण"],
  o_urban: ["Town or city", "शहर / कस्बा"], o_general: ["General", "सामान्य"], o_student: ["Student", "छात्र"], o_farmer: ["Farmer", "किसान"],
  o_salaried: ["Salaried (private job)", "प्राइवेट नौकरी"], o_govt: ["Government employee", "सरकारी कर्मचारी"],
  o_self: ["Own business / self-employed", "अपना व्यवसाय"], o_artisan: ["Artisan or craftsperson", "कारीगर / शिल्पकार"],
  o_vendor: ["Street vendor", "रेहड़ी-पटरी विक्रेता"], o_home: ["Homemaker", "गृहिणी"], o_unemp: ["Looking for work", "काम की तलाश में"],
  o_retired: ["Retired", "सेवानिवृत्त"], o_none: ["No formal schooling", "औपचारिक शिक्षा नहीं"], o_school: ["Up to Class 10", "कक्षा 10 तक"],
  o_pm: ["Class 11–12 / diploma", "कक्षा 11–12 / डिप्लोमा"], o_grad: ["Graduation", "स्नातक"], o_pg: ["Post-graduation", "स्नातकोत्तर"],
  show_btn: ["Show my schemes", "मेरी योजनाएँ दिखाएँ"], sample_btn: ["Sample profile", "नमूना प्रोफ़ाइल"], clear_btn: ["Clear", "साफ़ करें"],
  empty_title: ["Your matches will appear here", "आपकी योजनाएँ यहाँ दिखेंगी"],
  empty_body: ["Each scheme shows a row of its conditions. Green means you meet it, red means you don't, and grey means we still need an answer from you. Results update as you change any answer.",
               "हर योजना की शर्तें एक पट्टी में दिखती हैं। हरा मतलब शर्त पूरी, लाल मतलब पूरी नहीं, और धूसर मतलब जवाब बाकी है। कोई भी जवाब बदलते ही नतीजे तुरंत बदल जाते हैं।"],
  ask_title: ["Ask the assistant", "सहायक से पूछें"],
  ask_lede: ["Type or speak in English or Hindi. Describe yourself and I'll find your schemes, or ask about any scheme.",
             "हिंदी या अंग्रेज़ी में लिखें या बोलें। अपने बारे में बताइए, मैं आपकी योजनाएँ ढूँढ दूँगा, या किसी भी योजना के बारे में पूछें।"],
  read_aloud: ["Read answers aloud", "जवाब सुनाएँ"], send: ["Send", "भेजें"],
  chat_ph: ["e.g. I'm a 60 year old widow, which schemes can I get?", "जैसे: मैं 60 साल की विधवा हूँ, मुझे कौन सी योजनाएँ मिल सकती हैं?"],
  browse_title: ["All schemes in this prototype", "इस प्रोटोटाइप की सभी योजनाएँ"],
  search_ph: ["Search by name or need, e.g. pension, housing", "नाम या ज़रूरत से खोजें, जैसे पेंशन, घर"],
  compare_btn: ["Compare side by side", "साथ-साथ तुलना करें"],
  ins_title: ["Insights for administrators", "प्रशासकों के लिए आँकड़े"],
  ins_lede: ["What citizens using the assistant need, computed live from every profile checked. Helps departments see which schemes are under-used and which conditions shut people out.",
             "सहायक का उपयोग करने वाले नागरिकों की ज़रूरतें, हर जाँची गई प्रोफ़ाइल से तुरंत गणना। विभाग देख सकते हैं कि कौन सी योजनाएँ कम उपयोग हो रही हैं और कौन सी शर्तें लोगों को बाहर कर रही हैं।"],
  footer: ["Academic prototype, Minor Project, Department of ECE, MAIT. Guidance only — final eligibility is decided by the issuing authority. Always confirm on the official website before applying.",
           "शैक्षणिक प्रोटोटाइप, माइनर प्रोजेक्ट, ईसीई विभाग, एमएआईटी। केवल मार्गदर्शन के लिए — अंतिम पात्रता संबंधित विभाग तय करता है। आवेदन से पहले आधिकारिक वेबसाइट पर ज़रूर जाँचें।"],
  // dynamic text
  view: ["View details", "विवरण देखें"], qualify: ["You appear to qualify", "आप पात्र दिखते हैं"],
  more_q: ["Answer a few more questions", "कुछ और सवालों के जवाब दें"], not_match: ["Not a match right now", "अभी मेल नहीं खाती"],
  failed: ["Not met", "पूरी नहीं हुई"], could_get: ["you could be getting", "आपको मिल सकता है"], you: ["You", "आप"],
  t_cash: ["a year in cash support", "हर साल नकद सहायता"], t_one: ["in one-time support", "एकमुश्त सहायता"],
  t_cover: ["of insurance & health cover", "बीमा और स्वास्थ्य कवर"], t_loan: ["in loans you can access", "तक का लोन"],
  also: ["Also:", "साथ ही:"], report_btn: ["Download my report", "मेरी रिपोर्ट डाउनलोड करें"],
  ask_btn: ["Ask the assistant about these", "सहायक से इनके बारे में पूछें"],
  plan_title: ["Your document checklist", "आपकी दस्तावेज़ सूची"],
  plan_body: ["Everything you need for the schemes above, in one list. Tick each one as you collect it.",
              "ऊपर की सभी योजनाओं के लिए ज़रूरी दस्तावेज़ एक सूची में। जो दस्तावेज़ तैयार हो, उस पर निशान लगाएँ।"],
  needed_for: ["Needed for", "इनके लिए ज़रूरी"], checking: ["Checking schemes…", "योजनाएँ जाँची जा रही हैं…"],
  status_likely: ["You appear to meet all the conditions", "आप सभी शर्तें पूरी करते दिखते हैं"],
  status_check: ["You may qualify — some answers are missing", "आप पात्र हो सकते हैं — कुछ जवाब बाकी हैं"],
  status_not_eligible: ["You don't appear to meet all the conditions", "आप सभी शर्तें पूरी करते नहीं दिखते"],
  who: ["Who it's for", "किसके लिए"], benefits: ["Benefits", "लाभ"], eligibility: ["Eligibility", "पात्रता"],
  docs_ready: ["Documents to keep ready", "तैयार रखने वाले दस्तावेज़"], how_apply: ["How to apply", "आवेदन कैसे करें"],
  helpline: ["Helpline", "हेल्पलाइन"], official: ["Open official website", "आधिकारिक वेबसाइट खोलें"],
  ask_about: ["Ask about this scheme", "इस योजना के बारे में पूछें"], source: ["Source", "स्रोत"],
  fill_profile_tip: ["Fill in your profile on the Find schemes page to check these automatically.", "इन्हें अपने-आप जाँचने के लिए 'योजनाएँ खोजें' पेज पर अपनी जानकारी भरें।"],
  qualify_if: ["You qualify if", "आप पात्र हैं अगर"], or_if: ["Or, if", "या फिर, अगर"],
  routes: ["This scheme has more than one way to qualify. The route closest to your profile is shown.", "इस योजना में पात्र होने के एक से ज़्यादा रास्ते हैं। आपकी प्रोफ़ाइल के सबसे करीब वाला दिखाया गया है।"],
  have_n: ["You have {n} of {m} ready.", "आपके पास {m} में से {n} तैयार हैं।"],
  filled: ["Filled from your words:", "आपकी बात से भरा गया:"], nothing_found: ["I couldn't pick out any details. Try mentioning your age, work, income or where you live.", "कोई जानकारी नहीं मिली। अपनी उम्र, काम, आय या आप कहाँ रहते हैं, यह लिखकर देखें।"],
  listening: ["Listening… speak now", "सुन रहा हूँ… बोलिए"], no_voice: ["Voice input isn't supported in this browser. Try Chrome or Edge.", "इस ब्राउज़र में आवाज़ इनपुट उपलब्ध नहीं है। Chrome या Edge आज़माएँ।"],
  thinking: ["Looking through the scheme records…", "योजनाओं के रिकॉर्ड देखे जा रहे हैं…"],
  server_err: ["The assistant couldn't reach the server. Check that the backend is running and try again.", "सर्वर से संपर्क नहीं हो पाया। जाँचें कि बैकएंड चल रहा है और फिर कोशिश करें।"],
  mode_rules: ["Rule engine + scheme database", "नियम इंजन + योजना डेटाबेस"], mode_llm: ["AI model", "एआई मॉडल"],
  noted: ["Saved to your profile", "आपकी प्रोफ़ाइल में जोड़ा गया"], sources: ["Sources", "स्रोत"],
  selected: ["{n} selected", "{n} चुनी गईं"], compare_pick: ["Compare", "तुलना"],
  no_results: ['No schemes match "{q}". Try a broader word like "loan", "pension" or "student".', '"{q}" से कोई योजना नहीं मिली। "लोन", "पेंशन" या "छात्र" जैसा शब्द आज़माएँ।'],
  all: ["All", "सभी"],
  k_profiles: ["citizen profiles checked", "नागरिक प्रोफ़ाइल जाँची गईं"], k_avg: ["schemes per citizen on average", "प्रति नागरिक औसत योजनाएँ"],
  k_cash: ["cash support identified", "पहचानी गई नकद सहायता"], k_cover: ["insurance & health cover identified", "पहचाना गया बीमा व स्वास्थ्य कवर"],
  i_demand: ["Demand by scheme", "योजना-वार माँग"], i_demand_p: ["How many citizens appear to qualify, and how many might with more information.", "कितने नागरिक पात्र दिखते हैं, और और जानकारी मिलने पर कितने हो सकते हैं।"],
  i_likely: ["Appear to qualify", "पात्र दिखते हैं"], i_check: ["Might qualify", "पात्र हो सकते हैं"],
  i_block: ["Near misses: one condition away", "बस एक शर्त से चूके"],
  i_block_p: ["Citizens who meet every condition of a scheme except one. Where outreach or a policy tweak could reach more people.", "वे नागरिक जो किसी योजना की एक को छोड़कर सभी शर्तें पूरी करते हैं। यहाँ जागरूकता या नीति में छोटे बदलाव से ज़्यादा लोगों तक पहुँचा जा सकता है।"],
  i_unans: ["Questions citizens most often leave blank", "सवाल जिनका नागरिक अक्सर जवाब नहीं देते"],
  i_unans_p: ["Information gaps worth addressing in the form or in awareness drives.", "जानकारी की कमी, जिसे फ़ॉर्म या जागरूकता अभियान में दूर किया जा सकता है।"],
  i_occ: ["Who is using the assistant", "सहायक का उपयोग कौन कर रहा है"],
  report_title: ["My Government Scheme Report", "मेरी सरकारी योजना रिपोर्ट"],
};
const FIELD_LABELS = {
  age: ["Age", "उम्र"], gender: ["Gender", "लिंग"], occupation: ["Work", "काम"], income: ["Family income", "पारिवारिक आय"],
  area: ["Area", "क्षेत्र"], state: ["State", "राज्य"], category: ["Category", "श्रेणी"], education: ["Education", "शिक्षा"],
  bpl: ["BPL status", "बीपीएल स्थिति"], has_bank_account: ["Bank account", "बैंक खाता"], income_tax_payer: ["Income tax", "आयकर"],
  owns_land: ["Farm land", "खेती की ज़मीन"], owns_pucca_house: ["Pucca house", "पक्का घर"], has_lpg: ["LPG connection", "एलपीजी कनेक्शन"],
  has_girl_child_under_10: ["Daughter under 10", "10 साल से छोटी बेटी"], pregnant_or_lactating: ["Pregnant / new mother", "गर्भवती / नई माँ"],
};
const OCC_LABELS = { farmer: "o_farmer", student: "o_student", salaried: "o_salaried", govt_employee: "o_govt", self_employed: "o_self",
  artisan: "o_artisan", street_vendor: "o_vendor", homemaker: "o_home", unemployed: "o_unemp", retired: "o_retired" };

const SECTORS = {
  "Agriculture": ["#e6f2e2", "#3b7a2a", '<path d="M12 21v-8"/><path d="M12 13c0-4 3-7 7-7 0 4-3 7-7 7Z"/><path d="M12 15c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5Z"/>'],
  "Health": ["#fde8e8", "#b23a2e", '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/><path d="M12 9v5M9.5 11.5h5"/>'],
  "Housing": ["#e7eefc", "#2b5bb5", '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>'],
  "Social welfare": ["#fff1dc", "#c06a00", '<path d="M12 21c-3.3 0-6-2.4-6-5.6 0-3.3 3-5 3.6-8.4C12 9 13 11 13 12.5c1-1 1.4-2.3 1.5-3.5C16.6 10.6 18 12.8 18 15.4 18 18.6 15.3 21 12 21Z"/>'],
  "Women & child": ["#fbe7f1", "#a8326e", '<circle cx="9" cy="7" r="2.5"/><path d="M5 20v-4a4 4 0 0 1 8 0v4"/><circle cx="17" cy="11" r="2"/><path d="M14.5 20v-2.5a2.5 2.5 0 0 1 5 0V20"/>'],
  "Pension": ["#efe9fb", "#5b3fa8", '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2.5"/>'],
  "Insurance": ["#e3f3f4", "#1f7a7f", '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>'],
  "Education": ["#fff6d6", "#8a6a00", '<path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z"/><path d="M7 11.5V16c1.5 1.5 3 2 5 2s3.5-.5 5-2v-4.5"/><path d="M21 9.5V14"/>'],
  "Employment & skills": ["#f1ebe4", "#7a4e24", '<path d="M14.5 6.5a3.5 3.5 0 0 0-4.8 4.3L4 16.5 7.5 20l5.7-5.7a3.5 3.5 0 0 0 4.3-4.8l-2.3 2.3-2.4-.6-.6-2.4 2.3-2.3Z"/>'],
  "Discover": ["#eef1fb", "#2b3f7a", '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>'],
  "Business & credit": ["#e8f0ea", "#2d6b4f", '<path d="M4 9h16l-1-4H5L4 9Z"/><path d="M5 9v11h14V9"/><path d="M9 13h6M10 16h4"/>'],
};
function sicon(sector, size = "") {
  const [tint, tone, path] = SECTORS[sector] || ["#eef1f7", "#1d2d5c", '<circle cx="12" cy="12" r="7"/>'];
  return `<span class="sicon ${size}" style="--tint:${tint};--tone:${tone}" aria-hidden="true"><svg viewBox="0 0 24 24">${path}</svg></span>`;
}
const EXAMPLES = [
  ["Farmer, Bihar", "I'm a 45 year old man, a farmer from a village in Bihar. We earn about 1 lakh a year, have a BPL card and 2 acres of land. I have a bank account and we don't pay income tax", "मैं बिहार के गाँव का 45 साल का किसान हूँ, गाँव में रहता हूँ, सालाना आय 1 लाख, बीपीएल कार्ड, 2 एकड़ ज़मीन और बैंक खाता है, आयकर नहीं भरते"],
  ["Student, SC", "I am a 19 year old SC student in class 12, family income 1.5 lakh, I live in Lucknow", "मैं 19 साल का अनुसूचित जाति का छात्र हूँ, कक्षा 12 में, परिवार की आय 1.5 लाख, लखनऊ में रहता हूँ"],
  ["Widow, 62", "I'm a 62 year old widow living in a village, BPL card, no gas connection, I have a bank account", "मैं 62 साल की विधवा हूँ, गाँव में रहती हूँ, बीपीएल कार्ड है, गैस कनेक्शन नहीं है, बैंक खाता है"],
  ["Tailor, Jaipur", "I'm a 35 year old woman tailor in Jaipur, I want a loan for my shop, income 2 lakh, no income tax", "मैं जयपुर की 35 साल की दर्ज़ी हूँ, दुकान के लिए लोन चाहिए, आय 2 लाख, आयकर नहीं भरती"],
];
const EX_HI = { "Farmer, Bihar": "किसान, बिहार", "Student, SC": "छात्र, अनुसूचित जाति", "Widow, 62": "विधवा, 62", "Tailor, Jaipur": "दर्ज़ी, जयपुर" };
function renderExamples() {
  $("#examples").innerHTML = `<span class="example-lead" style="font-size:.85rem;color:var(--slate);align-self:center">${L("ex_title")}</span>` +
    EXAMPLES.map(([k], i) => `<button type="button" class="example" data-ex="${i}">${hi() ? EX_HI[k] : k}</button>`).join("");
  $$("#examples .example").forEach((b) => b.addEventListener("click", () => {
    const ex = EXAMPLES[Number(b.dataset.ex)];
    $("#describe-input").value = hi() ? ex[2] : ex[1];
    describeFill();
  }));
}
let toastTimer;
function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu & Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Other UT"];
const YES_NO = [
  ["has_bank_account", "Do you have a bank account?", "क्या आपका बैंक खाता है?"],
  ["bpl", "Is your family below the poverty line (BPL / ration card)?", "क्या आपका परिवार गरीबी रेखा से नीचे (बीपीएल / राशन कार्ड) है?"],
  ["income_tax_payer", "Did anyone in your family pay income tax last year?", "क्या पिछले साल परिवार में किसी ने आयकर भरा?"],
  ["owns_land", "Does your family own farm land?", "क्या परिवार के पास खेती की ज़मीन है?"],
  ["owns_pucca_house", "Does your family own a pucca house?", "क्या परिवार का पक्का घर है?"],
  ["has_lpg", "Does your household have an LPG gas connection?", "क्या घर में एलपीजी गैस कनेक्शन है?"],
  ["has_girl_child_under_10", "Do you have a daughter under 10?", "क्या आपकी 10 साल से छोटी बेटी है?"],
  ["pregnant_or_lactating", "Are you pregnant or a new mother?", "क्या आप गर्भवती हैं या हाल ही में माँ बनी हैं?"],
];

const state = {
  lang: "en", profile: {}, lastMatch: null, sectors: [], activeSector: null, compare: new Set(),
  chat: { pending_field: null, interview: null, scheme_id: null, history: [] }, speaking: false, aiMode: "rules",
};
const L = (key, vars = {}) => {
  let s = (I18N[key] || [key, key])[state.lang === "hi" ? 1 : 0];
  Object.entries(vars).forEach(([k, v]) => (s = s.replace(`{${k}}`, v)));
  return s;
};
const hi = () => state.lang === "hi";
const sName = (s) => (hi() && s.name_hi) || s.scheme_name || s.name;
const sSummary = (s) => (hi() && s.summary_hi) || s.description || s.summary;
const sBenefits = (s) => (hi() && s.benefits_hi) || s.benefits;
const cLabel = (c) => (hi() && c.label_hi) || c.label;

function inr(n) {
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)} ${hi() ? "करोड़" : "crore"}`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(2)} ${hi() ? "लाख" : "lakh"}`;
  return "₹" + Number(n).toLocaleString("en-IN");
}

/* ================= language ================= */
function applyLang() {
  document.documentElement.lang = state.lang;
  $$("[data-i18n]").forEach((el) => (el.textContent = L(el.dataset.i18n)));
  $$("[data-i18n-ph]").forEach((el) => (el.placeholder = L(el.dataset.i18nPh)));
  $("#lang-toggle").textContent = hi() ? "English" : "हिंदी";
  $$(".yn").forEach((row) => {
    const q = YES_NO.find(([k]) => k === row.dataset.key);
    $("span[id]", row).textContent = hi() ? q[2] : q[1];
    $$(".seg button", row).forEach((b) => (b.textContent = b.dataset.v === "true" ? (hi() ? "हाँ" : "Yes") : (hi() ? "नहीं" : "No")));
  });
  $("#ai-mode").textContent = state.aiMode === "rules" ? L("mode_rules") : `${L("mode_llm")}: ${state.aiMode}`;
  renderExamples();
  if (state.lastMatch) renderResults(state.lastMatch);
  if (!$("#view-browse").hidden) renderBrowse();
  if (!$("#view-insights").hidden) loadInsights();
}
$("#lang-toggle").addEventListener("click", () => {
  state.lang = hi() ? "en" : "hi";
  try { localStorage.setItem("lang", state.lang); } catch {}
  applyLang();
});

/* ================= navigation ================= */
function show(view) {
  $$(".view").forEach((v) => (v.hidden = v.id !== `view-${view}`));
  $$(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === view));
  history.replaceState(null, "", `#${view}`);
  window.scrollTo({ top: 0 });
  if (view === "browse") loadBrowse();
  if (view === "insights") loadInsights();
  if (view === "ask") $("#chat-input").focus();
}
$$(".tab").forEach((t) => t.addEventListener("click", () => show(t.dataset.view)));

/* ================= profile form ================= */
function buildForm() {
  $("#state-select").insertAdjacentHTML("beforeend", STATES.map((s) => `<option>${s}</option>`).join(""));
  $("#yesno").innerHTML = YES_NO.map(([key, q]) => `
    <div class="yn" data-key="${key}">
      <span id="q-${key}">${q}</span>
      <span class="seg" role="group" aria-labelledby="q-${key}">
        <button type="button" data-v="true" aria-pressed="false">Yes</button>
        <button type="button" data-v="false" aria-pressed="false">No</button>
      </span>
    </div>`).join("");
  $$(".yn .seg button").forEach((b) => b.addEventListener("click", () => {
    const pressed = b.getAttribute("aria-pressed") === "true";
    $$("button", b.parentElement).forEach((x) => x.setAttribute("aria-pressed", "false"));
    if (!pressed) b.setAttribute("aria-pressed", "true");
    liveUpdate();
  }));
}

function readProfile() {
  const f = $("#profile-form");
  const p = {};
  ["name", "gender", "area", "state", "category", "occupation", "education"].forEach((k) => { const v = f.elements[k].value.trim(); if (v) p[k] = v; });
  ["age", "income"].forEach((k) => { const v = f.elements[k].value; if (v !== "") p[k] = Number(v); });
  $$(".yn").forEach((row) => { const on = $('button[aria-pressed="true"]', row); if (on) p[row.dataset.key] = on.dataset.v === "true"; });
  return p;
}

function setField(k, v, flash) {
  const f = $("#profile-form");
  const el = f.elements[k];
  if (el && !(el instanceof RadioNodeList)) {
    if (el.tagName === "SELECT" && ![...el.options].some((o) => o.value === String(v))) return;
    el.value = v;
    if (flash) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  }
  const row = $(`.yn[data-key="${k}"]`);
  if (row) {
    $$("button", row).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === String(v))));
    if (flash) { row.classList.remove("flash"); void row.offsetWidth; row.classList.add("flash"); }
  }
}

function writeProfile(p, { merge = false, flash = false } = {}) {
  if (!merge) {
    $$("#profile-form input, #profile-form select").forEach((el) => (el.value = ""));
    $$(".yn button").forEach((b) => b.setAttribute("aria-pressed", "false"));
  }
  Object.entries(p).forEach(([k, v]) => setField(k, v, flash));
}

$("#fill-demo").addEventListener("click", () => {
  writeProfile({ name: "Sunita", age: 34, gender: "female", area: "rural", state: "Uttar Pradesh", category: "OBC",
    income: 120000, occupation: "farmer", education: "school", has_bank_account: true, bpl: true, income_tax_payer: false,
    owns_land: true, owns_pucca_house: false, has_lpg: false, has_girl_child_under_10: true, pregnant_or_lactating: false }, { flash: true });
  runMatch({ save: true });
});

$("#profile-form").addEventListener("reset", () => setTimeout(() => {
  $$(".yn button").forEach((b) => b.setAttribute("aria-pressed", "false"));
  state.profile = {}; state.lastMatch = null;
  $("#results").innerHTML = ""; $("#results-empty").hidden = false; $("#describe-note").textContent = "";
}));

$("#profile-form").addEventListener("submit", (e) => { e.preventDefault(); runMatch({ save: true }); });

let liveTimer;
function liveUpdate() {
  if (!state.lastMatch) return;               // live updates start after the first search
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => runMatch({ save: false, quiet: true }), 350);
}
$("#profile-form").addEventListener("input", (e) => { if (e.target.id !== "describe-input") liveUpdate(); });
$("#profile-form").addEventListener("change", (e) => { if (e.target.id !== "describe-input") liveUpdate(); });

async function runMatch({ save = false, quiet = false } = {}) {
  state.profile = readProfile();
  const btn = $('#profile-form button[type="submit"]');
  if (!quiet) { btn.disabled = true; btn.textContent = L("checking"); }
  try {
    const data = await post("/match", { profile: state.profile, save });
    state.lastMatch = data;
    renderResults(data);
    if (!quiet && window.innerWidth < 880) $("#results-area").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    $("#results").innerHTML = `<p class="empty">${L("server_err")}</p>`;
  } finally {
    btn.disabled = false; btn.textContent = L("show_btn");
  }
}

/* ================= describe yourself (natural language → form) ================= */
async function describeFill() {
  const text = $("#describe-input").value.trim();
  if (!text) { $("#describe-input").focus(); return; }
  const res = await post("/extract", { text });
  const fields = res.profile || {};
  const keys = Object.keys(fields);
  if (!keys.length) { $("#describe-note").textContent = L("nothing_found"); $("#describe-note").classList.add("warn"); return; }
  $("#describe-note").classList.remove("warn");
  writeProfile(fields, { merge: true, flash: true });
  $("#describe-note").textContent = `${L("filled")} ${keys.map((k) => describeField(k, fields[k])).join(", ")}`;
  await runMatch({ save: true });
  const target = window.innerWidth < 880 ? $("#results-area") : $(".find-grid");
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}
$("#describe-go").addEventListener("click", describeFill);
$("#describe-input").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); describeFill(); } });

function describeField(k, v) {
  const name = (FIELD_LABELS[k] || [k, k])[hi() ? 1 : 0];
  let val = v;
  if (typeof v === "boolean") val = v ? (hi() ? "हाँ" : "yes") : (hi() ? "नहीं" : "no");
  else if (k === "income") val = inr(v);
  else if (k === "occupation" && OCC_LABELS[v]) val = L(OCC_LABELS[v]);
  else if (k === "gender") val = L(v === "female" ? "o_female" : v === "male" ? "o_male" : "o_other");
  else if (k === "area") val = L(v === "rural" ? "o_rural" : "o_urban");
  return `${name}: ${val}`;
}

/* ================= voice (Web Speech API) ================= */
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let activeRec = null;
function listen(btn, onText, onDone) {
  if (!Recognition) { alert(L("no_voice")); return; }
  if (activeRec) { activeRec.stop(); return; }
  const rec = new Recognition();
  rec.lang = hi() ? "hi-IN" : "en-IN";
  rec.interimResults = true;
  rec.continuous = false;
  let finalText = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    onText((finalText + interim).trim());
  };
  rec.onend = () => { btn.classList.remove("listening"); activeRec = null; if (finalText.trim()) onDone(finalText.trim()); };
  rec.onerror = () => { btn.classList.remove("listening"); activeRec = null; };
  activeRec = rec;
  btn.classList.add("listening");
  rec.start();
}
$("#describe-mic").addEventListener("click", () => {
  $("#describe-note").textContent = L("listening");
  listen($("#describe-mic"), (t) => ($("#describe-input").value = t), () => describeFill());
});
$("#chat-mic").addEventListener("click", () => {
  listen($("#chat-mic"), (t) => ($("#chat-input").value = t), (t) => { $("#chat-input").value = ""; sendChat(t); });
});

function speak(text, lang) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const clean = text.replace(/https?:\/\/\S+/g, "").replace(/[•✓✗?]/g, (m) => (m === "✓" ? (lang === "hi" ? "हाँ, " : "yes, ") : m === "✗" ? (lang === "hi" ? "नहीं, " : "no, ") : m === "•" ? "" : m));
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = lang === "hi" ? "hi-IN" : "en-IN";
  const voice = speechSynthesis.getVoices().find((v) => v.lang === u.lang) || speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang));
  if (voice) u.voice = voice;
  u.rate = 0.95;
  speechSynthesis.speak(u);
}
try { $("#auto-speak").checked = localStorage.getItem("autoSpeak") === "1"; } catch {}
$("#auto-speak").addEventListener("change", (e) => { try { localStorage.setItem("autoSpeak", e.target.checked ? "1" : "0"); } catch {} });

/* ================= results ================= */
function strip(conditions) {
  const met = conditions.filter((c) => c.result === "met").length;
  return `<div class="strip" aria-label="${met} / ${conditions.length}">${conditions.map((c) => `<span class="seg-bar ${c.result}" title="${esc(cLabel(c))}"></span>`).join("")}</div>`;
}

function summaryText(r) {
  const total = r.conditions.length;
  const met = r.conditions.filter((c) => c.result === "met").length;
  const failed = r.conditions.filter((c) => c.result === "not_met").length;
  if (!hi()) return r.summary;
  if (failed) return `${failed} शर्त पूरी नहीं हुई`;
  if (met < total) return `${total} में से ${met} शर्तें पूरी; पुष्टि के लिए ${total - met} और जवाब दें`;
  return `सभी ${total} शर्तें पूरी`;
}

function card(r) {
  const failed = r.conditions.filter((c) => c.result === "not_met");
  const val = r.values && r.values[0] && r.status !== "not_eligible" ? `<span class="pill value">${esc(r.values[0].label)}</span>` : "";
  return `<article class="card ${r.status}">
    ${sicon(r.sector)}
    <h3>${esc(sName(r))}</h3>
    <button class="btn btn-ghost" data-open="${r.scheme_id}">${L("view")}</button>
    <div class="meta"><span class="pill ${r.status}">${L("st_" + r.status)}</span>${val}<span class="sector">${esc(r.sector)}</span></div>
    ${strip(r.conditions)}
    <p class="strip-note">${esc(summaryText(r))}</p>
    ${r.status === "not_eligible" && failed.length ? `<p class="why-not">${L("failed")}: ${failed.map((c) => esc(cLabel(c))).join("; ")}</p>` : ""}
    ${r.status !== "not_eligible" ? `<p class="benefit">${esc(sBenefits(r))}</p>` : ""}
  </article>`;
}

function valueHero(counts, v) {
  const tiles = [];
  if (v.annual_cash) tiles.push([inr(v.annual_cash), L("t_cash")]);
  if (v.one_time) tiles.push([inr(v.one_time), L("t_one")]);
  if (v.cover) tiles.push([inr(v.cover), L("t_cover")]);
  if (v.loan) tiles.push([inr(v.loan), L("t_loan")]);
  const name = state.profile.name ? esc(state.profile.name) + ", " : "";
  const head = hi()
    ? `${name}आप <b>${counts.likely}</b> योजनाओं के पात्र दिखते हैं${counts.check ? ` और <b>${counts.check}</b> और के हो सकते हैं` : ""}।${tiles.length ? " " + L("could_get") + ":" : ""}`
    : `${name}${name ? "you" : "You"} appear to qualify for <b>${counts.likely}</b> scheme${counts.likely === 1 ? "" : "s"}${counts.check ? `, and may qualify for <b>${counts.check}</b> more` : ""}.${tiles.length ? " Together, " + L("could_get") + ":" : ""}`;
  return `<div class="value-hero">
    <p>${head}</p>
    ${tiles.length ? `<div class="value-tiles">${tiles.map(([n, l]) => `<div class="value-tile"><strong>${n}</strong><span>${l}</span></div>`).join("")}</div>` : ""}
    ${v.other.length ? `<div class="value-extra">${L("also")} ${v.other.map(esc).join(" · ")}</div>` : ""}
    <div class="value-actions">
      <button class="btn btn-primary btn-small" id="print-report">${L("report_btn")}</button>
      <button class="btn btn-ghost btn-small" id="ask-these">${L("ask_btn")}</button>
    </div>
  </div>`;
}

function planHtml(docs) {
  if (!docs.length) return "";
  const done = new Set(JSON.parse(sessionStorage.getItem("plan-docs") || "[]"));
  return `<div class="plan"><h2>${L("plan_title")}</h2><p>${L("plan_body")}</p>
    <ul>${docs.map((d) => `<li><input type="checkbox" data-plan="${esc(d.name)}" ${done.has(d.name) ? "checked" : ""} aria-label="${esc(d.name)}"/>
      <span>${esc(d.name)}<small>${L("needed_for")}: ${d.schemes.map(esc).join(", ")}</small></span></li>`).join("")}</ul></div>`;
}

function renderResults(data) {
  const { counts, results, value, documents } = data;
  $("#results-empty").hidden = true;
  const by = (s) => results.filter((r) => r.status === s);
  let html = valueHero(counts, value);
  if (counts.likely) html += `<h2 class="group-title">${L("qualify")} <span class="count">${counts.likely}</span></h2>` + by("likely").map(card).join("");
  if (counts.check) html += `<h2 class="group-title">${L("more_q")} <span class="count">${counts.check}</span></h2>` + by("check").map(card).join("");
  html += planHtml(documents);
  if (counts.not_eligible) {
    const open = $("details.not-match")?.open ? "open" : "";
    html += `<details class="not-match" ${open}><summary>${L("not_match")} (${counts.not_eligible})</summary>${by("not_eligible").map(card).join("")}</details>`;
  }
  $("#results").innerHTML = html;
  $("#print-report").addEventListener("click", printReport);
  $("#ask-these").addEventListener("click", () => { show("ask"); sendChat(hi() ? "मेरे लिए कौन सी योजनाएँ हैं?" : "Which schemes can I apply for?"); });
  $$("[data-plan]").forEach((b) => b.addEventListener("change", () => {
    const done = new Set(JSON.parse(sessionStorage.getItem("plan-docs") || "[]"));
    b.checked ? done.add(b.dataset.plan) : done.delete(b.dataset.plan);
    try { sessionStorage.setItem("plan-docs", JSON.stringify([...done])); } catch {}
  }));
}

/* ================= printable report ================= */
async function printReport() {
  const data = state.lastMatch; if (!data) return;
  const likely = data.results.filter((r) => r.status === "likely");
  const check = data.results.filter((r) => r.status === "check");
  const details = await Promise.all(likely.map((r) => get(`/schemes/${r.scheme_id}`)));
  const p = state.profile;
  const profileRows = Object.entries(p).filter(([k]) => k !== "name").map(([k, v]) => `<tr><th>${esc((FIELD_LABELS[k] || [k, k])[hi() ? 1 : 0])}</th><td>${esc(describeField(k, v).split(": ").slice(1).join(": "))}</td></tr>`).join("");
  const v = data.value;
  const valueLine = [v.annual_cash && `${inr(v.annual_cash)} ${L("t_cash")}`, v.one_time && `${inr(v.one_time)} ${L("t_one")}`,
    v.cover && `${inr(v.cover)} ${L("t_cover")}`, v.loan && `${inr(v.loan)} ${L("t_loan")}`].filter(Boolean).join("; ");
  $("#report").innerHTML = `
    <h1>${L("report_title")}</h1>
    <p class="muted">${p.name ? esc(p.name) + " — " : ""}${new Date().toLocaleDateString(hi() ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
    <h2>${hi() ? "आपकी जानकारी" : "Your details"}</h2><table>${profileRows}</table>
    <h2>${L("qualify")} (${likely.length})</h2>
    ${valueLine ? `<p><b>${hi() ? "अनुमानित लाभ" : "Estimated value"}:</b> ${valueLine}</p>` : ""}
    <table><tr><th>${hi() ? "योजना" : "Scheme"}</th><th>${L("benefits")}</th><th>${L("how_apply")}</th></tr>
    ${details.map((s) => `<tr><td><b>${esc(sName(s))}</b></td><td>${esc(sBenefits(s))}</td><td>${esc(s.application.mode)}<br>${esc(s.application.apply_url || s.official_source)}${s.application.helpline ? `<br>${L("helpline")}: ${esc(s.application.helpline)}` : ""}</td></tr>`).join("")}</table>
    ${check.length ? `<h2>${L("more_q")} (${check.length})</h2><p>${check.map((r) => esc(sName(r))).join(", ")}</p>` : ""}
    <h2>${L("plan_title")}</h2>
    ${data.documents.map((d) => `<p><span class="box"></span>${esc(d.name)} <span class="muted">— ${d.schemes.map(esc).join(", ")}</span></p>`).join("")}
    <p class="muted" style="margin-top:18pt">${L("footer")}</p>`;
  window.print();
}

document.addEventListener("click", (e) => {
  const open = e.target.closest("[data-open]");
  if (open) openDetail(Number(open.dataset.open));
});

/* ================= detail drawer ================= */
async function openDetail(id) {
  const [s, ev] = await Promise.all([
    get(`/schemes/${id}`),
    Object.keys(state.profile).length ? post(`/eligibility/${id}`, state.profile) : Promise.resolve(null),
  ]);
  const doneKey = `docs-${id}`;
  const done = new Set(JSON.parse(sessionStorage.getItem(doneKey) || "[]"));
  const marks = { met: "✓", not_met: "✗", unknown: "?" };
  let elig;
  if (ev) {
    elig = `<div class="status-banner ${ev.status}">${L("status_" + ev.status)}</div>
      <ul class="cond-list">${ev.conditions.map((c) => `<li><span class="mark ${c.result}">${marks[c.result]}</span>${esc(cLabel(c))}</li>`).join("")}</ul>
      ${ev.alternative_routes ? `<p class="route-label">${L("routes")}</p>` : ""}`;
  } else {
    elig = s.eligibility.map((g, i) => `${s.eligibility.length > 1 ? `<p class="route-label">${i === 0 ? L("qualify_if") : L("or_if")}</p>` : ""}
      <ul class="cond-list">${g.conditions.map((c) => `<li><span class="mark">•</span>${esc(c)}</li>`).join("")}</ul>`).join("") +
      `<p class="route-label">${L("fill_profile_tip")}</p>`;
  }
  const [tint] = SECTORS[s.sector] || ["#f5f7fb"];
  const app = s.application || {};
  $("#drawer-body").innerHTML = `
    <div class="drawer-head" style="--tint:${tint}">
      ${sicon(s.sector)}
      <div><h2 id="drawer-title">${esc(sName(s))}</h2><p class="ministry">${esc(s.ministry)}</p>
      ${ev ? `<span class="pill ${ev.status}">${L("st_" + ev.status)}</span>` : ""}
      ${s.values && s.values[0] ? `<span class="pill value">${esc(s.values[0].label)}</span>` : ""}</div>
    </div>
    <div class="drawer-body-inner">
    <p style="margin-top:1.2rem">${esc(sSummary(s))}</p>
    <section><h3>${L("who")}</h3><p>${esc(s.target_beneficiaries)}</p></section>
    <section><h3>${L("benefits")}</h3><p>${esc(sBenefits(s))}</p></section>
    <section><h3>${L("eligibility")}</h3>${elig}</section>
    <section><h3>${L("docs_ready")}</h3>
      <p class="route-label" id="doc-progress"></p>
      <ul class="doc-list">${s.documents.map((d, i) => `<li><label><input type="checkbox" data-doc="${i}" ${done.has(i) ? "checked" : ""}/>
        <span>${esc(d.name)}${d.mandatory ? "" : (hi() ? " (यदि लागू हो)" : " (if applicable)")}${d.description ? `<small>${esc(d.description)}</small>` : ""}</span></label></li>`).join("")}</ul>
    </section>
    ${s.application ? `<section><h3>${L("how_apply")} · ${esc(app.mode)}</h3>
      <ol class="steps">${app.steps.map((st) => `<li>${esc(st)}</li>`).join("")}</ol>
      ${app.helpline ? `<p>${L("helpline")}: <a class="helpline" href="tel:${esc(app.helpline.split("/")[0].replace(/[^0-9+]/g, ""))}">☎ ${esc(app.helpline)}</a></p>` : ""}
      <p class="route-label">${L("apply_site")}: <a href="${esc(app.apply_url || s.official_source)}" target="_blank" rel="noopener">${esc((app.apply_url || s.official_source).replace(/^https?:\/\//, ""))}</a>
      ${app.apply_url && app.apply_url !== s.official_source ? `<br>${L("scheme_page")}: <a href="${esc(s.official_source)}" target="_blank" rel="noopener">${esc(s.official_source.replace(/^https?:\/\//, ""))}</a>` : ""}</p>
      <div class="link-help">${L("link_help")} <a href="https://www.myscheme.gov.in" target="_blank" rel="noopener">myScheme.gov.in</a>.</div>
      </section>` : ""}
    </div>
    <div class="drawer-actions">
      <a class="btn btn-primary" href="${esc(app.apply_url || s.official_source)}" target="_blank" rel="noopener">${L("official")}</a>
      <button class="btn btn-ghost" id="ask-about">${L("ask_about")}</button>
    </div>`;
  const updateProgress = () => {
    const boxes = $$("[data-doc]", $("#drawer-body"));
    $("#doc-progress").textContent = L("have_n", { n: boxes.filter((b) => b.checked).length, m: boxes.length });
  };
  $$("[data-doc]", $("#drawer-body")).forEach((b) => b.addEventListener("change", () => {
    b.checked ? done.add(Number(b.dataset.doc)) : done.delete(Number(b.dataset.doc));
    try { sessionStorage.setItem(doneKey, JSON.stringify([...done])); } catch {}
    updateProgress();
  }));
  updateProgress();
  $("#ask-about").addEventListener("click", () => {
    closeDrawer(); show("ask");
    state.chat.scheme_id = id;
    sendChat(hi() ? `${sName(s)} के बारे में बताइए` : `Tell me about ${s.scheme_name.split(" (")[0]}`);
  });
  $("#drawer").hidden = false; $("#drawer-backdrop").hidden = false;
  $("#drawer-close").focus();
}
function closeDrawer() { $("#drawer").hidden = true; $("#drawer-backdrop").hidden = true; }
$("#drawer-close").addEventListener("click", closeDrawer);
$("#drawer-backdrop").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

/* ================= browse + compare ================= */
async function loadBrowse() {
  if (!state.sectors.length) state.sectors = await get("/sectors");
  $("#sector-chips").innerHTML = [`<button class="chip" data-sector="" aria-pressed="${!state.activeSector}">${L("all")}</button>`]
    .concat(state.sectors.map((s) => `<button class="chip" data-sector="${esc(s)}" aria-pressed="${state.activeSector === s}">${esc(s)}</button>`)).join("");
  $$(".chip", $("#sector-chips")).forEach((c) => c.addEventListener("click", () => {
    state.activeSector = c.dataset.sector || null; loadBrowse();
  }));
  renderBrowse();
}
let searchTimer;
$("#search").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(renderBrowse, 200); });
async function renderBrowse() {
  const q = $("#search").value.trim();
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (state.activeSector) params.set("sector", state.activeSector);
  const list = await get(`/schemes?${params}`);
  $("#browse-list").innerHTML = list.length ? list.map((s) => `
    <article class="browse-item">
      <div class="browse-top">${sicon(s.sector, "sm")}<span class="ministry">${esc(s.sector)}<br>${esc(s.ministry)}</span></div>
      <h3>${esc(sName(s))}</h3>
      ${s.values && s.values[0] ? `<span class="pill value">${esc(s.values[0].label)}</span>` : ""}
      <p>${esc(sSummary(s))}</p>
      <div class="browse-actions">
        <button class="btn btn-ghost btn-small" data-open="${s.scheme_id}">${L("view")}</button>
        <label><input type="checkbox" data-cmp="${s.scheme_id}" ${state.compare.has(s.scheme_id) ? "checked" : ""}/> ${L("compare_pick")}</label>
      </div>
    </article>`).join("") : `<p>${L("no_results", { q: esc(q) })}</p>`;
  $$("[data-cmp]").forEach((b) => b.addEventListener("change", () => {
    const id = Number(b.dataset.cmp);
    if (b.checked) { if (state.compare.size >= 3) { b.checked = false; return; } state.compare.add(id); } else state.compare.delete(id);
    updateCompareBar();
  }));
  updateCompareBar();
}
function updateCompareBar() {
  $("#compare-bar").hidden = state.compare.size < 2;
  $("#compare-count").textContent = L("selected", { n: state.compare.size });
}
$("#compare-clear").addEventListener("click", () => { state.compare.clear(); $("#compare-table").innerHTML = ""; renderBrowse(); });
$("#compare-go").addEventListener("click", async () => {
  const items = await Promise.all([...state.compare].map((id) => get(`/schemes/${id}`)));
  const rows = [
    [L("benefits"), (s) => sBenefits(s)], [L("who"), (s) => s.target_beneficiaries],
    [L("eligibility"), (s) => s.eligibility[0].conditions.join("; ")], [L("docs_ready"), (s) => s.documents.map((d) => d.name).join(", ")],
    [L("how_apply"), (s) => s.application.mode], [L("source"), (s) => s.official_source],
  ];
  $("#compare-table").innerHTML = tableHtml(["", ...items.map((s) => sName(s))], rows.map(([h, f]) => [h, ...items.map(f)]));
  $("#compare-table").scrollIntoView({ behavior: "smooth", block: "start" });
});
function tableHtml(headers, rows) {
  return `<div class="table-wrap"><table class="cmp"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr><th>${esc(r[0])}</th>${r.slice(1).map((c) => `<td>${linkify(esc(c))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

/* ================= chat ================= */
const SPEAK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h4l5 5V5L7 10H3Zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4ZM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6Z"/></svg>';

function addUser(text) {
  const div = document.createElement("div");
  div.className = "msg user"; div.textContent = text;
  $("#chat-log").appendChild(div); scrollChat();
}
function scrollChat() { $("#chat-log").scrollTop = $("#chat-log").scrollHeight; }

function addBot(res) {
  const div = document.createElement("div");
  div.className = "msg bot";
  const noted = res.noted?.length && Object.keys(res.profile_updates || {}).length
    ? `<div class="noted" title="${L("noted")}">${res.noted.map((n) => `<span>✓ ${esc(n)}</span>`).join("")}</div>` : "";
  const cards = res.cards?.length ? `<div class="mini-cards">${res.cards.slice(0, 8).map((c) => `
    <div class="mini-card ${c.status || ""}">${sicon(c.sector, "sm")}<div class="info"><b>${esc((hi() && c.name_hi) || c.name)}${c.status ? `<span class="pill ${c.status}">${L("st_" + c.status)}</span>` : ""}</b><small>${esc((hi() && c.summary_hi) || c.summary)}</small></div>
    <button class="btn btn-ghost btn-small" data-open="${c.scheme_id}">${L("view")}</button></div>`).join("")}</div>` : "";
  if (res.noted?.length && Object.keys(res.profile_updates || {}).length) toast(`${L("toast_saved")}: ${res.noted.slice(0, 3).join(", ")}${res.noted.length > 3 ? "…" : ""}`);
  const table = res.table ? tableHtml(res.table.headers, res.table.rows) : "";
  const src = res.sources?.length ? `<div class="sources">${L("sources")}: ${res.sources.map((s) => `<a href="${esc(s.official_source)}" target="_blank" rel="noopener">${esc(s.scheme_name.split(" (")[0])}</a>`).join("")}</div>` : "";
  div.innerHTML = `<button class="speak" aria-label="Read aloud" title="Read aloud">${SPEAK_ICON}</button>${noted}<div class="text">${linkify(esc(res.answer))}</div>${table}${cards}${src}`;
  $(".speak", div).addEventListener("click", () => speak(res.answer, res.lang));
  const row = document.createElement("div");
  row.className = "msg-row";
  row.innerHTML = '<span class="avatar" aria-hidden="true"></span>';
  row.appendChild(div);
  $("#chat-log").appendChild(row); scrollChat();
  if ($("#auto-speak").checked) speak(res.answer, res.lang);
}

function renderQuickReplies(list) {
  $("#quick-replies").innerHTML = (list || []).map((q, i) => `<button class="qr" type="button" data-i="${i}">${esc(q.label)}</button>`).join("");
  $$("#quick-replies .qr").forEach((b) => b.addEventListener("click", () => {
    const q = list[Number(b.dataset.i)];
    if ("value" in q) sendChat(q.label, { answerValue: q.value });
    else sendChat(q.send || q.label);
  }));
}

function syncProfileFromChat(updates) {
  if (!updates || !Object.keys(updates).length) return;
  Object.assign(state.profile, updates);
  writeProfile(updates, { merge: true });
  if (state.lastMatch) runMatch({ save: false, quiet: true });
}

async function sendChat(text, { answerValue = null } = {}) {
  text = String(text).trim(); if (!text) return;
  addUser(text);
  renderQuickReplies([]);
  const typing = document.createElement("div");
  typing.className = "msg-row";
  typing.innerHTML = `<span class="avatar" aria-hidden="true"></span><div class="msg bot typing" aria-label="${L("thinking")}"><span class="typing-dots"><i></i><i></i><i></i></span></div>`;
  $("#chat-log").appendChild(typing); scrollChat();
  try {
    const c = state.chat;
    const res = await post("/chat", {
      message: text, answer_value: answerValue, pending_field: c.pending_field, interview: c.interview, scheme_id: c.scheme_id,
      profile: Object.keys(state.profile).length ? state.profile : null, history: c.history.slice(-6), lang: state.lang,
    });
    typing.remove();
    syncProfileFromChat(res.profile_updates);
    c.pending_field = res.pending_field; c.interview = res.interview;
    if (res.context_scheme_id) c.scheme_id = res.context_scheme_id;
    c.history.push({ role: "user", content: text }, { role: "assistant", content: res.answer });
    addBot(res);
    renderQuickReplies(res.quick_replies);
    if (res.show_results) runMatch({ save: true, quiet: true });
  } catch (err) {
    typing.remove();
    addBot({ answer: L("server_err"), lang: state.lang });
  }
}
$("#chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("#chat-input").value; $("#chat-input").value = "";
  sendChat(v);
});

function chatWelcome() {
  addBot({ answer: hi()
    ? "नमस्ते! मैं आपकी पात्रता के हिसाब से सरकारी योजनाएँ ढूँढ सकता हूँ। अपने बारे में बताइए, जैसे: \"मैं 35 साल की महिला हूँ, गाँव में रहती हूँ, बीपीएल कार्ड है\" — या कोई भी सवाल पूछिए।"
    : "Namaste! I can find government schemes you qualify for. Tell me about yourself, like \"I'm a 35 year old woman from a village with a BPL card\", or ask anything about a scheme.", lang: state.lang });
  const tiles = hi() ? [
    ["Discover", "मेरे लिए योजनाएँ ढूँढें", "मेरे लिए कौन सी योजनाएँ हैं?"],
    ["Agriculture", "पीएम किसान के दस्तावेज़", "पीएम किसान के लिए कौन से दस्तावेज़ चाहिए?"],
    ["Social welfare", "क्या मुझे उज्ज्वला मिलेगी?", "क्या मैं उज्ज्वला के लिए पात्र हूँ?"],
    ["Insurance", "PMJJBY और PMSBY की तुलना", "PMJJBY और PMSBY की तुलना करें"],
  ] : [
    ["Discover", "Find schemes for me", "Which schemes can I apply for?"],
    ["Social welfare", "Am I eligible for Ujjwala?", "Am I eligible for Ujjwala?"],
    ["Insurance", "Compare PMJJBY and PMSBY", "Compare PMJJBY and PMSBY"],
    ["Business & credit", "Loan for my shop", "I need a loan for my small shop"],
  ];
  const wrap = document.createElement("div");
  wrap.className = "welcome-tiles";
  wrap.innerHTML = tiles.map(([sec, label], i) => `<button class="wtile" type="button" data-w="${i}">${sicon(sec, "sm")}<span>${esc(label)}</span></button>`).join("");
  $$(".wtile", wrap).forEach((b) => b.addEventListener("click", () => { wrap.remove(); sendChat(tiles[Number(b.dataset.w)][2]); }));
  $("#chat-log").appendChild(wrap);
}

/* ================= insights ================= */
async function loadInsights() {
  const d = await get("/insights");
  const max = Math.max(1, ...d.schemes.map((s) => s.likely + s.check));
  const maxB = Math.max(1, ...d.top_blockers.map((b) => b.count));
  const maxU = Math.max(1, ...d.most_unanswered.map((b) => b.count));
  const occTotal = d.occupations.reduce((a, b) => a + b.count, 0) || 1;
  $("#insights").innerHTML = `
    <div class="kpis">
      <div class="kpi"><strong>${d.profiles}</strong><span>${L("k_profiles")}</span></div>
      <div class="kpi"><strong>${d.avg_schemes_per_citizen}</strong><span>${L("k_avg")}</span></div>
      <div class="kpi"><strong>${inr(d.cash_support_identified)}</strong><span>${L("k_cash")}</span></div>
      <div class="kpi"><strong>${inr(d.cover_identified)}</strong><span>${L("k_cover")}</span></div>
    </div>
    <div class="ins-grid">
      <div class="ins-panel">
        <h2>${L("i_demand")}</h2><p>${L("i_demand_p")}</p>
        <div class="legend"><span><i style="background:var(--leaf)"></i>${L("i_likely")}</span><span><i style="background:var(--marigold)"></i>${L("i_check")}</span></div>
        ${d.schemes.map((s) => `<div class="bar-row"><span class="name" title="${esc(s.scheme_name)}">${esc(s.scheme_name.split(" (")[0])}</span>
          <span class="bar"><i class="l" style="width:${(s.likely / max) * 100}%"></i><i class="c" style="width:${(s.check / max) * 100}%"></i></span>
          <span class="num">${s.likely} + ${s.check}</span></div>`).join("")}
      </div>
      <div>
        <div class="ins-panel"><h2>${L("i_block")}</h2><p>${L("i_block_p")}</p>
          ${d.top_blockers.map((b) => `<div class="bar-row"><span class="name" title="${esc(cLabel(b))} — ${esc(b.scheme)}">${esc(b.scheme)}: ${esc(cLabel(b))}</span><span class="bar"><i class="b" style="width:${(b.count / maxB) * 100}%"></i></span><span class="num">${b.count}</span></div>`).join("")}
        </div>
        <div class="ins-panel"><h2>${L("i_unans")}</h2><p>${L("i_unans_p")}</p>
          ${d.most_unanswered.map((b) => `<div class="bar-row"><span class="name">${esc((FIELD_LABELS[b.field] || [b.field, b.field])[hi() ? 1 : 0])}</span><span class="bar"><i class="c" style="width:${(b.count / maxU) * 100}%"></i></span><span class="num">${b.count}</span></div>`).join("")}
        </div>
        <div class="ins-panel"><h2>${L("i_occ")}</h2>
          ${d.occupations.map((o) => `<div class="bar-row"><span class="name">${esc(OCC_LABELS[o.occupation] ? L(OCC_LABELS[o.occupation]) : o.occupation)}</span><span class="bar"><i class="l" style="width:${(o.count / occTotal) * 100}%"></i></span><span class="num">${Math.round((o.count / occTotal) * 100)}%</span></div>`).join("")}
        </div>
      </div>
    </div>`;
}

/* ================= api helpers ================= */
async function get(path) { const r = await fetch(API + path); if (!r.ok) throw new Error(r.status); return r.json(); }
async function post(path, body) {
  const r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status}`); return r.json();
}

/* ================= init ================= */
buildForm();
try { state.lang = localStorage.getItem("lang") || "en"; } catch {}
get("/health").then((h) => { state.aiMode = h.ai_mode; applyLang(); }).catch(() => {});
applyLang();
chatWelcome();
const start = (location.hash || "").slice(1);
show(["find", "ask", "browse", "insights"].includes(start) ? start : "find");
if ("speechSynthesis" in window) speechSynthesis.getVoices();
