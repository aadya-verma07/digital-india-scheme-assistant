// Entry point: wires the shell (navigation, language, menu, sheets) to the views.
// FILE: js/app.js - the starting point of the website (loaded by index.html).
// Connects everything: registers each page with the router, sets up the language switch,
// mobile menu and side panel, keeps all pages in sync when the profile changes, then draws the first page.

import { state, restore, onProfileChange, hasProfile } from "./state.js";
import { applyStaticText } from "./i18n.js";
import * as api from "./api.js";
import { $, $$, closeSheet } from "./ui.js";
import { register, render, current } from "./router.js";
import { renderHome } from "./views/home.js";
import { renderCheck, refreshLive } from "./views/check.js";
import { renderResults } from "./views/results.js";
import { renderAsk, refreshKnown } from "./views/ask.js";
import { renderSchemes } from "./views/schemes.js";
import { renderInsights } from "./views/insights.js";

// Bring back the saved language and profile (state.js).
restore();

// logo chakra: 24 spokes
// Draw the 24 spokes of the Ashoka Chakra in the logo with a little trigonometry (SVG lines around a circle).
$("#logo-spokes").innerHTML = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15 * Math.PI) / 180;
  return `<line x1="${20 + 2.6 * Math.cos(a)}" y1="${20 + 2.6 * Math.sin(a)}" x2="${20 + 11 * Math.cos(a)}" y2="${20 + 11 * Math.sin(a)}"/>`;
}).join("");

// Tell the router which function draws which page.
register("home", renderHome);
register("check", renderCheck);
register("results", renderResults);
register("ask", renderAsk);
register("schemes", renderSchemes);
register("insights", renderInsights);

// setLang(lang): switch English/Hindi - remember it, update the buttons and fixed texts, and redraw the page.
function setLang(lang) {
  state.lang = lang;
  try { localStorage.setItem("lang", lang); } catch {}
  $$(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  applyStaticText();
  render();
}
$$(".lang-switch button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

// mobile menu
// Mobile menu: the ☰ button opens/closes the navigation; choosing a link closes it.
const nav = $("#nav"), menuBtn = $("#menu-btn");
menuBtn.addEventListener("click", () => { const open = !nav.classList.contains("open"); nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open)); });
$$("#nav a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }));

// sheets
// Side panel (scheme details / comparison): closes when clicking outside it or pressing Escape.
$("#backdrop").addEventListener("click", closeSheet);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

// any profile change: keep results, checker counter and assistant panel in sync ("live what-if")
// LIVE SYNC: whenever the profile changes anywhere (checker, chat, search), refresh what is on screen:
// the checker's live counter, the chat's "what I know" panel, or the results (after a 250 ms pause, so fast clicking
// causes only one request). Old results are cleared on other pages so they are recomputed when needed.
let t;
onProfileChange(() => {
  const view = current();
  if (view === "check") refreshLive();
  if (view === "ask") refreshKnown();
  if (view === "results") {
    clearTimeout(t);
    t = setTimeout(async () => { if (hasProfile()) { try { await api.runMatch(); } catch {} } renderResults(); }, 250);
  } else state.match = view === "check" ? state.match : null;
});

// When the page changes: close panels, scroll to top, draw the new page, move keyboard focus to the main area.
window.addEventListener("hashchange", () => { closeSheet(); window.scrollTo({ top: 0 }); render(); $("#main").focus({ preventScroll: true }); });

// Ask the server whether an LLM is connected (shown in the assistant), set the language buttons, translate fixed texts, draw the first page.
api.health().then((h) => { state.aiMode = h.ai_mode; }).catch(() => {});
$$(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
applyStaticText();
render();
