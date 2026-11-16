// Reusable UI building blocks: icons, badges, condition strips, money formatting, sheet, toast, tooltip.
// FILE: js/ui.js - small reusable building blocks shared by all pages (so each looks and behaves the same everywhere).
// Most functions return an HTML string that the pages insert into the screen.

import { L, hi } from "./i18n.js";

// $(selector) / $$(selector): shortcuts to find one / all elements on the page.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
// esc(text): escape <, >, &, quotes so text from the server is shown as text, never run as HTML (prevents XSS).
export const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// linkify(html): turn web addresses into clickable links that open in a new tab.
export const linkify = (html) => html.replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

/* ---------------- icons (24px line icons) ---------------- */
// ICONS: the SVG drawing for each icon name; icon(name) returns a ready <svg> element.
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  send: '<path d="M4 12 20 4l-6 16-3-7z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
};
export const icon = (name, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

// Which icon belongs to each scheme category.
const SECTOR_ICONS = {
  "Agriculture": '<path d="M12 21v-8"/><path d="M12 13c0-4 3-7 7-7 0 4-3 7-7 7Z"/><path d="M12 15c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5Z"/>',
  "Health": '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/><path d="M12 9v5M9.5 11.5h5"/>',
  "Housing": '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
  "Social welfare": '<path d="M12 21c-3.3 0-6-2.4-6-5.6 0-3.3 3-5 3.6-8.4C12 9 13 11 13 12.5c1-1 1.4-2.3 1.5-3.5C16.6 10.6 18 12.8 18 15.4 18 18.6 15.3 21 12 21Z"/>',
  "Women & child": '<circle cx="9" cy="7" r="2.5"/><path d="M5 20v-4a4 4 0 0 1 8 0v4"/><circle cx="17" cy="11" r="2"/><path d="M14.5 20v-2.5a2.5 2.5 0 0 1 5 0V20"/>',
  "Pension": '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2.5"/>',
  "Insurance": '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  "Education": '<path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z"/><path d="M7 11.5V16c1.5 1.5 3 2 5 2s3.5-.5 5-2v-4.5"/><path d="M21 9.5V14"/>',
  "Employment & skills": '<path d="M14.5 6.5a3.5 3.5 0 0 0-4.8 4.3L4 16.5 7.5 20l5.7-5.7a3.5 3.5 0 0 0 4.3-4.8l-2.3 2.3-2.4-.6-.6-2.4 2.3-2.3Z"/>',
  "Business & credit": '<path d="M4 9h16l-1-4H5L4 9Z"/><path d="M5 9v11h14V9"/><path d="M9 13h6M10 16h4"/>',
};
// Hindi names of categories; sectorName() / sectorIcon() return the right name and icon for the current language.
const SECTOR_HI = {
  "Agriculture": "कृषि", "Health": "स्वास्थ्य", "Housing": "आवास", "Social welfare": "समाज कल्याण", "Women & child": "महिला और बाल",
  "Pension": "पेंशन", "Insurance": "बीमा", "Education": "शिक्षा", "Employment & skills": "रोज़गार और कौशल", "Business & credit": "व्यवसाय और ऋण",
};
export const sectorName = (s) => (hi() && SECTOR_HI[s]) || s;
export const sectorIcon = (sector, size = "") =>
  `<span class="sicon ${size}" aria-hidden="true"><svg class="i" viewBox="0 0 24 24">${SECTOR_ICONS[sector] || '<circle cx="12" cy="12" r="7"/>'}</svg></span>`;

/* ---------------- scheme text in the current language ---------------- */
// Scheme text in the current language (Hindi if available): full name, short name, summary, benefits, condition label.
export const sName = (s) => (hi() && s.name_hi) || s.scheme_name || s.name;
export const sShort = (s) => (hi() && s.name_hi) ? s.name_hi : (s.scheme_name || s.name || "").split(" (")[0];
export const sSummary = (s) => (hi() && s.summary_hi) || s.description || s.summary;
export const sBenefits = (s) => (hi() && s.benefits_hi) || s.benefits;
export const cLabel = (c) => (hi() && c.label_hi) || c.label;

// Hindi versions of benefit labels; valueLabel(s) = the scheme's headline benefit (e.g. '₹6,000 a year').
const VALUE_HI = {
  "₹6,000 a year": "₹6,000 प्रति वर्ष", "₹5 lakh health cover a year": "हर साल ₹5 लाख स्वास्थ्य कवर",
  "Up to ₹2.5 lakh housing assistance": "₹2.5 लाख तक आवास सहायता", "Free LPG connection": "मुफ़्त एलपीजी कनेक्शन",
  "Tax-free savings for your daughter": "बेटी के लिए कर-मुक्त बचत", "Pension up to ₹5,000 a month from 60": "60 के बाद ₹5,000 तक मासिक पेंशन",
  "₹2 lakh life cover": "₹2 लाख जीवन बीमा", "₹2 lakh accident cover": "₹2 लाख दुर्घटना बीमा",
  "Fees reimbursed + yearly allowance": "फ़ीस वापसी + सालाना भत्ता", "₹15,000 toolkit support": "₹15,000 टूलकिट सहायता",
  "Loans up to ₹3 lakh": "₹3 लाख तक लोन", "Business loans up to ₹20 lakh": "₹20 लाख तक व्यवसाय लोन",
  "Loans from ₹10 lakh to ₹1 crore": "₹10 लाख से ₹1 करोड़ तक लोन", "₹5,000 maternity benefit": "₹5,000 मातृत्व लाभ",
  "₹200–500 a month pension": "₹200–500 मासिक पेंशन",
};
/** The headline benefit of a scheme, in the current language. */
export const valueLabel = (s) => { const l = s?.values?.[0]?.label; return l ? ((hi() && VALUE_HI[l]) || l) : ""; };

/* ---------------- status & conditions ---------------- */
// badge(status): the coloured status pill - Likely eligible / Needs answers / Not eligible.
export const badge = (status) => status ? `<span class="badge badge-${status}"><span class="dot"></span>${L("st_" + status)}</span>` : "";
// strip(conditions): the row of small coloured bars (one per condition: met / not met / unknown) shown on results.
export function strip(conditions) {
  const met = conditions.filter((c) => c.result === "met").length;
  return `<span class="strip" role="img" aria-label="${met} / ${conditions.length}">${conditions.map((c) => `<i class="seg-bar ${c.result}"></i>`).join("")}</span>`;
}
// conditionSummary(r): short sentence such as 'Meets all 4 conditions' or '1 condition not met'.
export function conditionSummary(r) {
  const n = r.conditions.length;
  const met = r.conditions.filter((c) => c.result === "met").length;
  const failed = r.conditions.filter((c) => c.result === "not_met").length;
  if (failed) return L("fails", { f: failed });
  if (met < n) return L("meets_some", { a: met, n, u: n - met });
  return n === 1 ? L("meets_one") : L("meets_all", { n });
}
// conditionList(conds): list of conditions with a ✓, ✗ or ? mark each, used in result rows and the detail panel.
export const MARK = { met: icon("check"), not_met: icon("x"), unknown: "?" };
export const conditionList = (conds) => `<ul class="cond-list">${conds.map((c) =>
  `<li><span class="mark ${c.result}" aria-label="${c.result}">${MARK[c.result]}</span><span>${esc(cLabel(c))}${c.result === "unknown" ? `<span class="unk">· ${L("unk")}</span>` : ""}</span></li>`).join("")}</ul>`;

/* ---------------- money ---------------- */
// inr(n): money in Indian style - ₹1.5 lakh, ₹2 crore, ₹45,000.
export function inr(n) {
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)} ${hi() ? "करोड़" : "crore"}`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(2)} ${hi() ? "लाख" : "lakh"}`;
  return "₹" + Number(n).toLocaleString("en-IN");
}

/* ---------------- toast ---------------- */
// toast(msg): a small message that appears at the bottom for 2.8 seconds (e.g. 'Listening...').
let toastT;
export function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2800);
}

/* ---------------- side sheet (one at a time) ---------------- */
// openSheet(html): open the side panel (scheme details / comparison) with the given content, lock page scrolling,
// and move keyboard focus into it. closeSheet(): close it and put focus back where the user was (accessibility).
let lastFocus = null;
export function openSheet(html, { onClose } = {}) {
  const sheet = $("#sheet");
  lastFocus = document.activeElement;
  sheet.innerHTML = html;
  sheet.style.width = "";
  sheet.hidden = false; $("#backdrop").hidden = false;
  document.body.style.overflow = "hidden";
  sheet._onClose = onClose;
  $$("[data-close]", sheet).forEach((b) => b.addEventListener("click", closeSheet));
  (sheet.querySelector("[data-close]") || sheet).focus();
  return sheet;
}
export function closeSheet() {
  const sheet = $("#sheet");
  if (sheet.hidden) return;
  sheet.hidden = true; $("#backdrop").hidden = true; sheet.innerHTML = "";
  document.body.style.overflow = "";
  sheet._onClose?.();
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
// sheetClose(): the ✕ close button used at the top of every side panel.
export const sheetClose = () => `<button class="icon-btn" data-close aria-label="${L("close")}">${icon("x")}</button>`;

/* ---------------- tooltip for charts ---------------- */
// bindTooltips(root): show a tooltip next to the mouse for chart bars that have a data-tip attribute.
export function bindTooltips(root) {
  const tip = $("#tooltip");
  $$("[data-tip]", root).forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      tip.innerHTML = el.dataset.tip; tip.hidden = false;
      const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
      tip.style.left = x + "px"; tip.style.top = e.clientY + 14 + "px";
    });
    el.addEventListener("mouseleave", () => (tip.hidden = true));
  });
}

/* ---------------- tables ---------------- */
// table(headers, rows): an accessible HTML table (used for scheme comparison and chart table views).
export function table(headers, rows) {
  return `<div class="table-wrap"><table class="cmp"><thead><tr>${headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map((c) => `<td>${linkify(esc(c))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
