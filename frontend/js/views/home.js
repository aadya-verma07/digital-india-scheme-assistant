// Homepage: hero with AI search, categories, featured schemes, how it works, two paths.
import { state, setProfile } from "../state.js";
import { L } from "../i18n.js";
import * as api from "../api.js";
import { $, $$, esc, icon, sectorIcon, sectorName, sShort, sSummary, strip, valueLabel } from "../ui.js";
import { EXAMPLES, exampleLabel, exampleText } from "../profile.js";
import { listen } from "../voice.js";
import { go } from "../router.js";
import { openScheme } from "./detail.js";
import { sendToAssistant } from "./ask.js";

const FEATURED = ["pm-kisan", "pm-jay", "atal-pension", "mudra"];
const QUESTION = /\?|^(what|how|which|who|where|when|why|is|are|can|does|do|tell|explain|compare|क्या|कैसे|कौन|कहाँ|कब|क्यों|बताइए|बताओ)\b|kya |kaise |kaun /i;

/** One search box for everything: descriptions fill the profile and open results; questions go to the assistant. */
export async function smartSearch(text) {
  text = text.trim();
  const status = $("#ai-status");
  if (!text) { status.textContent = L("ai_empty"); status.classList.add("err"); return; }
  status.classList.remove("err");
  status.textContent = L("ai_working");
  try {
    const { profile } = await api.extract(text);
    const facts = Object.keys(profile || {});
    if (facts.length === 0 || (facts.length === 1 && QUESTION.test(text))) {
      status.textContent = L("ai_routed");
      sendToAssistant(text);
      return;
    }
    setProfile(profile);
    await api.runMatch({ save: true });
    go("results");
  } catch {
    status.textContent = L("server_err"); status.classList.add("err");
  }
}

export async function renderHome() {
  const root = $("#view-home");
  const [schemes, sectors] = await Promise.all([api.schemes(), api.sectors()]).catch(() => [[], []]);
  const counts = Object.fromEntries(sectors.map((s) => [s, schemes.filter((x) => x.sector === s).length]));
  const featured = FEATURED.map((slug) => schemes.find((s) => s.slug === slug)).filter(Boolean);
  const kept = $("#ai-input")?.value || "";

  root.innerHTML = `
  <div class="hero">
    <div class="container"><div class="hero-inner">
      <h1 id="home-title">${L("hero_title")}</h1>
      <p class="hero-lede">${L("hero_lede")}</p>
      <form class="ai-search" id="ai-form" role="search">
        <label for="ai-input" class="sr-only">${L("ai_label")}</label>
        <div class="row">
          <textarea id="ai-input" rows="2" placeholder="${esc(L("ai_ph"))}">${esc(kept)}</textarea>
          <div class="actions">
            <button type="button" class="icon-btn" id="ai-mic" aria-label="${L("speak")}" aria-pressed="false" title="${L("speak")}">${icon("mic")}</button>
            <button type="submit" class="btn btn-accent btn-lg">${icon("search")}${L("ai_go")}</button>
          </div>
        </div>
        <div class="ai-foot"><span>${L("try")}</span>${EXAMPLES.map((e, i) => `<button type="button" class="chip" data-ex="${i}">${esc(exampleLabel(e))}</button>`).join("")}</div>
      </form>
      <p class="ai-status" id="ai-status" aria-live="polite"></p>
      <div class="hero-links">
        <a href="#check">${icon("clipboard")}${L("link_check")}</a>
        <a href="#ask">${icon("chat")}${L("link_ask")}</a>
      </div>
      <div class="hero-stats">
        <div><b>${schemes.length || 14}</b><span>${L("stat_schemes")}</span></div>
        <div><b>${sectors.length || 10}</b><span>${L("stat_cats")}</span></div>
        <div><b>${L("stat_lang_b")}</b><span>${L("stat_lang")}</span></div>
      </div>
    </div></div>
  </div>

  <div class="container">
    <section class="section" aria-labelledby="cats-h">
      <div class="section-head"><div><h2 id="cats-h">${L("cats_title")}</h2><p>${L("cats_sub")}</p></div>
        <a class="btn btn-secondary btn-sm" href="#schemes">${L("view_all")}${icon("arrow")}</a></div>
      <div class="cat-grid">
        ${sectors.map((s) => `<button type="button" class="cat" data-sector="${esc(s)}">${sectorIcon(s)}<b>${esc(sectorName(s))}</b>
          <small>${counts[s] === 1 ? L("n_scheme") : L("n_schemes", { n: counts[s] })}</small></button>`).join("")}
      </div>
    </section>

    <section class="section" aria-labelledby="feat-h">
      <div class="section-head"><div><h2 id="feat-h">${L("feat_title")}</h2><p>${L("feat_sub")}</p></div></div>
      <div class="feat-grid">
        ${featured.map((s) => `<article class="card feat">
          <div class="top">${sectorIcon(s.sector)}<span class="badge badge-neutral">${esc(sectorName(s.sector))}</span></div>
          <h3>${esc(sShort(s))}</h3>
          ${s.values?.[0] ? `<div class="value">${esc(valueLabel(s))}</div>` : ""}
          <p>${esc(sSummary(s))}</p>
          <button type="button" class="btn btn-secondary btn-sm" data-open="${s.scheme_id}">${L("details")}${icon("arrow")}</button>
        </article>`).join("")}
      </div>
    </section>

    <section class="section" aria-labelledby="how-h">
      <div class="section-head"><h2 id="how-h">${L("how_title")}</h2></div>
      <div class="steps-grid">
        <div class="card step-card"><h3>${L("how1_t")}</h3><p>${L("how1_b")}</p></div>
        <div class="card step-card"><h3>${L("how2_t")}</h3><p>${L("how2_b")}</p>
          <div class="legend-strip">${strip([{ result: "met" }])}<small>${L("lg_met")}</small>${strip([{ result: "not_met" }])}<small>${L("lg_not")}</small>${strip([{ result: "unknown" }])}<small>${L("lg_unk")}</small></div></div>
        <div class="card step-card"><h3>${L("how3_t")}</h3><p>${L("how3_b")}</p></div>
      </div>
    </section>

    <section class="section paths" aria-label="${L("how_title")}">
      <div class="card path">${`<span class="sicon">${icon("clipboard")}</span>`}<div><h3>${L("path_check_t")}</h3><p>${L("path_check_b")}</p>
        <a class="btn btn-primary" href="#check">${L("path_check_go")}${icon("arrow")}</a></div></div>
      <div class="card path">${`<span class="sicon">${icon("chat")}</span>`}<div><h3>${L("path_ask_t")}</h3><p>${L("path_ask_b")}</p>
        <a class="btn btn-secondary" href="#ask">${L("path_ask_go")}${icon("arrow")}</a></div></div>
    </section>
  </div>`;

  const input = $("#ai-input");
  $("#ai-form").addEventListener("submit", (e) => { e.preventDefault(); smartSearch(input.value); });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); smartSearch(input.value); } });
  $("#ai-mic").addEventListener("click", (e) => listen(e.currentTarget, (t) => (input.value = t), (t) => smartSearch(t)));
  $$("[data-ex]", root).forEach((b) => b.addEventListener("click", () => {
    const ex = EXAMPLES[Number(b.dataset.ex)];
    input.value = exampleText(ex);
    smartSearch(input.value);
  }));
  $$(".cat", root).forEach((b) => b.addEventListener("click", () => { state.dir.sector = b.dataset.sector; go("schemes"); }));
  $$("[data-open]", root).forEach((b) => b.addEventListener("click", () => openScheme(Number(b.dataset.open))));
}
