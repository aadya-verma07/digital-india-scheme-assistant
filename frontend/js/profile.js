// Profile fields: how each one is asked, shown and summarised. Field names match the backend Profile model.
import { L, hi } from "./i18n.js";
import { inr } from "./ui.js";

export const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu & Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Other UT"];

export const CHOICES = {
  gender: [["female", "o_female"], ["male", "o_male"], ["other", "o_other"]],
  area: [["rural", "o_rural"], ["urban", "o_urban"]],
  occupation: [["farmer", "o_farmer"], ["student", "o_student"], ["self_employed", "o_self"], ["artisan", "o_artisan"], ["salaried", "o_salaried"],
    ["govt_employee", "o_govt"], ["street_vendor", "o_vendor"], ["homemaker", "o_home"], ["unemployed", "o_unemp"], ["retired", "o_retired"]],
  education: [["none", "o_none"], ["school", "o_school"], ["post_matric", "o_pm"], ["graduate", "o_grad"], ["postgraduate", "o_pg"]],
  category: [["General", "o_general"], ["OBC", null], ["SC", null], ["ST", null]],
};

export const YES_NO = [
  ["has_bank_account", "q_bank", "q_bank_h"], ["bpl", "q_bpl", "q_bpl_h"], ["income_tax_payer", "q_tax"], ["owns_land", "q_land"],
  ["owns_pucca_house", "q_house", "q_house_h"], ["has_lpg", "q_lpg"], ["has_girl_child_under_10", "q_girl"], ["pregnant_or_lactating", "q_preg"],
];

export const INCOME_PRESETS = [[80000, ["Under ₹1 lakh", "₹1 लाख से कम"]], [200000, ["₹1–2.5 lakh", "₹1–2.5 लाख"]], [450000, ["₹2.5–6 lakh", "₹2.5–6 लाख"]],
  [750000, ["₹6–9 lakh", "₹6–9 लाख"]], [1200000, ["Above ₹9 lakh", "₹9 लाख से ज़्यादा"]]];

/** Checker steps, and which fields each one asks. */
export const STEPS = [
  { title: "s1_t", intro: "s1_i", fields: ["name", "age", "gender"] },
  { title: "s2_t", intro: "s2_i", fields: ["state", "area"] },
  { title: "s3_t", intro: "s3_i", fields: ["occupation", "income", "education", "category"] },
  { title: "s4_t", intro: "s4_i", fields: YES_NO.map((y) => y[0]) },
  { title: "s5_t", intro: "s5_i", fields: [] },
];
export const stepOfField = (f) => Math.max(0, STEPS.findIndex((s) => s.fields.includes(f)));

export const FACT_ORDER = ["age", "gender", "occupation", "state", "area", "income", "category", "education", "bpl", "has_bank_account",
  "income_tax_payer", "owns_land", "owns_pucca_house", "has_lpg", "has_girl_child_under_10", "pregnant_or_lactating"];

export const fieldLabel = (k) => L("fl_" + k);

/** Human-readable value of one field. */
export function fieldValue(k, v) {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "boolean") return v ? L("yes") : L("no");
  if (k === "income") return inr(v);
  if (k === "age") return `${v} ${L("years")}`;
  const opt = (CHOICES[k] || []).find(([val]) => val === v);
  if (opt) return opt[1] ? L(opt[1]) : opt[0];
  return String(v);
}

/** Short chip text, e.g. "45 years", "Farmer", "Bank account: yes". */
export function factText(k, v) {
  if (typeof v === "boolean") return `${fieldLabel(k)}: ${fieldValue(k, v)}`;
  return fieldValue(k, v);
}

export const SAMPLE = { name: "Sunita", age: 34, gender: "female", area: "rural", state: "Uttar Pradesh", category: "OBC", income: 120000,
  occupation: "farmer", education: "school", has_bank_account: true, bpl: true, income_tax_payer: false, owns_land: true,
  owns_pucca_house: false, has_lpg: false, has_girl_child_under_10: true, pregnant_or_lactating: false };

export const EXAMPLES = [
  ["Farmer, Bihar", "किसान, बिहार", "I'm a 45 year old man, a farmer from a village in Bihar. We earn about 1 lakh a year, have a BPL card and 2 acres of land. I have a bank account and we don't pay income tax",
    "मैं बिहार के गाँव का 45 साल का किसान हूँ, गाँव में रहता हूँ, सालाना आय 1 लाख, बीपीएल कार्ड, 2 एकड़ ज़मीन और बैंक खाता है, आयकर नहीं भरते"],
  ["Student, SC", "छात्र, अनुसूचित जाति", "I am a 19 year old SC student in class 12, family income 1.5 lakh, I live in Lucknow",
    "मैं 19 साल का अनुसूचित जाति का छात्र हूँ, कक्षा 12 में, परिवार की आय 1.5 लाख, लखनऊ में रहता हूँ"],
  ["Widow, 62", "विधवा, 62", "I'm a 62 year old widow living in a village, BPL card, no gas connection, I have a bank account",
    "मैं 62 साल की विधवा हूँ, गाँव में रहती हूँ, बीपीएल कार्ड है, गैस कनेक्शन नहीं है, बैंक खाता है"],
  ["Tailor, Jaipur", "दर्ज़ी, जयपुर", "I'm a 35 year old woman tailor in Jaipur, I want a loan for my shop, income 2 lakh, no income tax",
    "मैं जयपुर की 35 साल की दर्ज़ी हूँ, दुकान के लिए लोन चाहिए, आय 2 लाख, आयकर नहीं भरती"],
];
export const exampleLabel = (e) => (hi() ? e[1] : e[0]);
export const exampleText = (e) => (hi() ? e[3] : e[2]);
