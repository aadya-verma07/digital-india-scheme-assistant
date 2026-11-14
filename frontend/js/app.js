// Entry point: wires the shell (navigation, language, menu, sheets) to the views.
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

restore();

// logo chakra: 24 spokes
$("#logo-spokes").innerHTML = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15 * Math.PI) / 180;
  return `<line x1="${20 + 2.6 * Math.cos(a)}" y1="${20 + 2.6 * Math.sin(a)}" x2="${20 + 11 * Math.cos(a)}" y2="${20 + 11 * Math.sin(a)}"/>`;
}).join("");

register("home", renderHome);
register("check", renderCheck);
register("results", renderResults);
register("ask", renderAsk);
register("schemes", renderSchemes);
register("insights", renderInsights);

function setLang(lang) {
  state.lang = lang;
  try { localStorage.setItem("lang", lang); } catch {}
  $$(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  applyStaticText();
  render();
}
$$(".lang-switch button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

// mobile menu
const nav = $("#nav"), menuBtn = $("#menu-btn");
menuBtn.addEventListener("click", () => { const open = !nav.classList.contains("open"); nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open)); });
$$("#nav a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }));

// sheets
$("#backdrop").addEventListener("click", closeSheet);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

// any profile change: keep results, checker counter and assistant panel in sync ("live what-if")
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

window.addEventListener("hashchange", () => { closeSheet(); window.scrollTo({ top: 0 }); render(); $("#main").focus({ preventScroll: true }); });

api.health().then((h) => { state.aiMode = h.ai_mode; }).catch(() => {});
$$(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
applyStaticText();
render();
