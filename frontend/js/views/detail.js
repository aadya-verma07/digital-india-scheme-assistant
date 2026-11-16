// Scheme detail side sheet: eligibility for this citizen, benefits, documents checklist, how to apply, official links.
// FILE: js/views/detail.js - the SCHEME DETAIL side panel (opens from any page when you click "Details").
// Shows the verdict for this citizen, benefits, who it's for, conditions (with alternative routes), a document
// checklist with progress, application steps, official links and helpline, and an "Ask the assistant" button.

import { state, hasProfile } from "../state.js";
import { L, hi } from "../i18n.js";
import * as api from "../api.js";
import { $$, esc, icon, sectorIcon, sectorName, sName, sSummary, sBenefits, badge, conditionList, openSheet, closeSheet, sheetClose, valueLabel } from "../ui.js";
import { sendToAssistant } from "./ask.js";

// openScheme(id): load the scheme's full details and - if the user has answered anything - their verdict for it
// (both requests run at the same time with Promise.all), then open the side panel.
export async function openScheme(id) {
  const [s, ev] = await Promise.all([api.scheme(id), hasProfile() ? api.eligibility(id, state.profile) : Promise.resolve(null)]);
  // Ticked documents are remembered per scheme in sessionStorage (until the tab is closed).
  const doneKey = `docs-${id}`;
  let done;
  try { done = new Set(JSON.parse(sessionStorage.getItem(doneKey) || "[]")); } catch { done = new Set(); }
  // Application link (falls back to the official site), phone number for a tap-to-call link, and a short display form of URLs.
  const app = s.application || {};
  const applyUrl = app.apply_url || s.official_source;
  const tel = app.helpline ? app.helpline.split("/")[0].replace(/[^0-9+]/g, "") : "";
  const host = (u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const elig = ev
    ? `<div class="verdict ${ev.status}">${icon(ev.status === "likely" ? "check" : ev.status === "check" ? "info" : "x")}${L("v_" + ev.status)}</div>
       ${conditionList(ev.conditions)}${ev.alternative_routes ? `<p class="note">${L("routes")}</p>` : ""}`
    : s.eligibility.map((g, i) => `${s.eligibility.length > 1 ? `<p class="small muted" style="margin:.5rem 0 .2rem">${i ? L("or_if") : L("qualify_if")}</p>` : ""}
       <ul class="cond-list">${g.conditions.map((c) => `<li><span class="mark">•</span><span>${esc(c)}</span></li>`).join("")}</ul>`).join("") +
      `<p class="note">${L("fill_tip")} <a href="#check" data-close>${L("cta_check")}</a></p>`;

  const sheet = openSheet(`
    <div class="sheet-head">
      ${sectorIcon(s.sector)}
      <div class="grow"><h2 id="sheet-title">${esc(sName(s))}</h2><p>${esc(s.ministry)}</p>
        <div class="badges">${ev ? badge(ev.status) : ""}<span class="badge badge-neutral">${esc(sectorName(s.sector))}</span>${s.values?.[0] ? `<span class="badge badge-neutral">${esc(valueLabel(s))}</span>` : ""}</div></div>
      ${sheetClose()}
    </div>
    <div class="sheet-body">
      <section><p class="lead">${esc(sSummary(s))}</p></section>
      <section><h3>${L("benefits")}</h3><p>${esc(sBenefits(s))}</p></section>
      <section><h3>${L("who")}</h3><p>${esc(s.target_beneficiaries)}</p></section>
      <section><h3>${L("eligibility")}</h3>${elig}</section>
      <section><h3>${L("docs_needed")}</h3>
        <ul class="plain docs">${s.documents.map((d, i) => `<li><input type="checkbox" id="doc-${i}" data-doc="${i}" ${done.has(i) ? "checked" : ""}/>
          <label for="doc-${i}"><b>${esc(d.name)}</b>${d.mandatory ? "" : ` <span class="muted small">(${L("if_applicable")})</span>`}${d.description ? `<small>${esc(d.description)}</small>` : ""}</label></li>`).join("")}</ul>
        <div class="meter" aria-hidden="true"><i id="doc-meter"></i></div>
        <p class="small muted" id="doc-count" style="margin-top:.35rem"></p>
      </section>
      ${s.application ? `<section><h3>${L("how_apply")} · ${esc(app.mode)}</h3>
        <ol class="steps">${app.steps.map((st) => `<li>${esc(st)}</li>`).join("")}</ol>
        <div class="contact">
          ${app.helpline ? `<a class="btn btn-secondary btn-sm" href="tel:${esc(tel)}">${icon("phone")}${L("helpline")}: ${esc(app.helpline)}</a>` : ""}
          <a class="btn btn-secondary btn-sm" href="${esc(applyUrl)}" target="_blank" rel="noopener">${icon("external")}${esc(host(applyUrl))}</a>
          ${app.apply_url && app.apply_url !== s.official_source ? `<a class="btn btn-secondary btn-sm" href="${esc(s.official_source)}" target="_blank" rel="noopener">${icon("external")}${L("scheme_page")}</a>` : ""}
        </div>
        <p class="note">${L("link_help")}</p>
      </section>` : ""}
    </div>
    <div class="sheet-foot">
      <a class="btn btn-primary" href="${esc(applyUrl)}" target="_blank" rel="noopener">${L("official")}${icon("external")}</a>
      <button type="button" class="btn btn-secondary" id="ask-about">${icon("chat")}${L("ask_about")}</button>
    </div>`);

  const update = () => {
    const boxes = $$("[data-doc]", sheet);
    const n = boxes.filter((b) => b.checked).length;
    sheet.querySelector("#doc-meter").style.width = `${(n / boxes.length) * 100}%`;
    sheet.querySelector("#doc-count").textContent = L("docs_b", { a: n, n: boxes.length });
  };
  // Ticking a document updates the progress bar ('2 of 4 ready') and saves the ticks.
  $$("[data-doc]", sheet).forEach((b) => b.addEventListener("change", () => {
    b.checked ? done.add(Number(b.dataset.doc)) : done.delete(Number(b.dataset.doc));
    try { sessionStorage.setItem(doneKey, JSON.stringify([...done])); } catch {}
    update();
  }));
  update();
  // 'Ask the assistant about this': close the panel and start a chat about this scheme.
  sheet.querySelector("#ask-about").addEventListener("click", () => {
    closeSheet();
    state.chat.scheme_id = id;
    sendToAssistant(hi() ? `${sName(s)} के बारे में बताइए` : `Tell me about ${s.scheme_name.split(" (")[0]}`);
  });
}
