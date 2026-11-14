// Results dashboard: summary figures, tabs by status, expandable conditions, missing info, documents, report.
import { state, hasProfile, setProfile } from "../state.js";
import { L, hi } from "../i18n.js";
import * as api from "../api.js";
import { $, $$, esc, icon, inr, sectorIcon, sectorName, sName, sBenefits, badge, strip, conditionSummary, conditionList, cLabel, toast, valueLabel } from "../ui.js";
import { FACT_ORDER, factText, fieldLabel, fieldValue } from "../profile.js";
import { go } from "../router.js";
import { openScheme } from "./detail.js";
import { editField } from "./check.js";
import { sendToAssistant } from "./ask.js";

const TABS = [["likely", "tab_likely"], ["check", "tab_check"], ["not_eligible", "tab_not"]];

function schemeRow(r) {
  const open = state.results.open.has(r.scheme_id);
  const failed = r.conditions.filter((c) => c.result === "not_met");
  const value = r.values?.[0] && r.status !== "not_eligible" ? valueLabel(r) : "";
  return `<article class="scheme-row" data-id="${r.scheme_id}">
    <div class="sr-main">
      ${sectorIcon(r.sector)}
      <div>
        <div class="sr-title"><h3>${esc(sName(r))}</h3>${badge(r.status)}</div>
        <p class="sr-benefit">${esc(sBenefits(r))}</p>
        <div class="sr-meta">${strip(r.conditions)}<span>${esc(conditionSummary(r))}</span><span aria-hidden="true">·</span><span>${esc(sectorName(r.sector))}</span></div>
        <div class="sr-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-open="${r.scheme_id}">${L("details_apply")}</button>
          <button type="button" class="btn btn-ghost btn-sm sr-toggle" aria-expanded="${open}" aria-controls="cond-${r.scheme_id}">${L("view_conditions")}${icon("chevron")}</button>
        </div>
      </div>
      ${value ? `<span class="sr-value">${esc(value)}</span>` : "<span></span>"}
    </div>
    <div class="sr-detail" id="cond-${r.scheme_id}" ${open ? "" : "hidden"}>
      ${failed.length ? `<p class="why">${esc(L("why_not", { x: failed.map(cLabel).join("; ") }))}</p>` : ""}
      ${conditionList(r.conditions)}
    </div>
  </article>`;
}

function kpis(m) {
  const v = m.value;
  const tiles = [`<div class="kpi"><div class="label">${L("k_eligible")}</div><div class="val teal">${m.counts.likely}</div>
    <div class="sub">${m.counts.check ? L("k_more", { n: m.counts.check }) : "&nbsp;"}</div></div>`];
  if (v.annual_cash) tiles.push(`<div class="kpi"><div class="label">${L("k_cash")}</div><div class="val">${inr(v.annual_cash)}</div><div class="sub">${L("k_est")}</div></div>`);
  if (v.one_time) tiles.push(`<div class="kpi"><div class="label">${L("k_one")}</div><div class="val">${inr(v.one_time)}</div><div class="sub">${L("k_est")}</div></div>`);
  if (v.cover) tiles.push(`<div class="kpi"><div class="label">${L("k_cover")}</div><div class="val">${inr(v.cover)}</div><div class="sub">${L("k_est")}</div></div>`);
  if (v.loan) tiles.push(`<div class="kpi"><div class="label">${L("k_loan")}</div><div class="val">${inr(v.loan)}</div><div class="sub">${L("k_loan_sub")}</div></div>`);
  return `<div class="kpis">${tiles.join("")}</div>`;
}

function missingCard(m) {
  const fields = {};
  m.results.filter((r) => r.status === "check").forEach((r) => r.conditions.forEach((c) => {
    if (c.result === "unknown") fields[c.field] = (fields[c.field] || 0) + 1;
  }));
  const list = Object.entries(fields).sort((a, b) => b[1] - a[1]);
  if (!list.length) return "";
  return `<section class="card"><div class="card-head"><div><h2>${L("missing_t")}</h2><p>${L("missing_b")}</p></div></div>
    <div class="card-pad"><ul class="plain missing">${list.map(([f, n]) => `<li><div><b>${esc(fieldLabel(f))}</b><small>${n === 1 ? L("unlocks_one") : L("unlocks", { n })}</small></div>
      <button type="button" class="btn btn-secondary btn-sm" data-answer="${f}">${L("answer")}</button></li>`).join("")}</ul></div></section>`;
}

function docsCard(m) {
  if (!m.documents.length) return "";
  let done;
  try { done = new Set(JSON.parse(sessionStorage.getItem("plan-docs") || "[]")); } catch { done = new Set(); }
  const n = m.documents.filter((d) => done.has(d.name)).length;
  return `<section class="card"><div class="card-head"><div><h2>${L("docs_t")}</h2><p id="plan-count">${L("docs_b", { a: n, n: m.documents.length })}</p></div></div>
    <div class="card-pad"><ul class="plain docs">${m.documents.map((d, i) => `<li><input type="checkbox" id="plan-${i}" data-plan="${esc(d.name)}" ${done.has(d.name) ? "checked" : ""}/>
      <label for="plan-${i}"><b>${esc(d.name)}</b><small>${L("needed_for")}: ${d.schemes.map(esc).join(", ")}</small></label></li>`).join("")}</ul>
      <div class="meter" aria-hidden="true"><i id="plan-meter" style="width:${(n / m.documents.length) * 100}%"></i></div></div></section>`;
}

function profileCard() {
  const p = state.profile;
  const facts = FACT_ORDER.filter((k) => p[k] !== undefined).map((k) => `<span class="tag ${p[k] === false ? "no" : ""}">${esc(factText(k, p[k]))}</span>`).join("");
  return `<section class="card"><div class="card-head"><div><h2>${p.name ? esc(p.name) : L("profile_t")}</h2></div>
      <button type="button" class="btn btn-ghost btn-sm" id="edit-answers">${icon("edit")}${L("edit_answers")}</button></div>
    <div class="card-pad"><div class="facts">${facts}</div>
      <button type="button" class="btn-link small" id="start-over" style="margin-top:1rem">${L("start_over")}</button></div></section>`;
}

export async function renderResults() {
  const root = $("#view-results");
  if (!hasProfile()) {
    root.innerHTML = `<div class="container page"><div class="card empty-state"><span class="sicon">${icon("clipboard")}</span>
      <h3>${L("res_empty_t")}</h3><p>${L("res_empty_b")}</p>
      <div class="btns"><a class="btn btn-primary" href="#check">${L("path_check_go")}</a><a class="btn btn-secondary" href="#home">${L("ai_go")}</a></div></div></div>`;
    return;
  }
  if (!state.match) {
    root.innerHTML = `<div class="container page"><p class="muted">${L("ai_working")}</p></div>`;
    try { await api.runMatch({ save: false }); } catch { root.innerHTML = `<div class="container page"><p>${L("server_err")}</p></div>`; return; }
  }
  const m = state.match;
  const tab = state.results.tab;
  const list = m.results.filter((r) => r.status === tab);
  const nFacts = Object.keys(state.profile).filter((k) => k !== "name").length;

  root.innerHTML = `<div class="container page">
    <div class="results-head">
      <div><h1>${L("res_title")}</h1><p>${L("res_sub", { n: nFacts })}</p></div>
      <div class="actions">
        <button type="button" class="btn btn-secondary" id="ask-these">${icon("chat")}${L("ask_btn")}</button>
        <button type="button" class="btn btn-primary" id="print-report">${icon("download")}${L("report_btn")}</button>
      </div>
    </div>
    ${kpis(m)}
    <div class="results-grid">
      <section class="card" aria-label="${L("res_title")}">
        <div class="tabs" role="tablist">${TABS.map(([k, lbl]) => `<button type="button" role="tab" id="tab-${k}" aria-selected="${tab === k}" aria-controls="tabpanel" data-tab="${k}">
          ${L(lbl)}<span class="count">${m.counts[k]}</span></button>`).join("")}</div>
        <div id="tabpanel" role="tabpanel" aria-labelledby="tab-${tab}">
          ${list.length ? list.map(schemeRow).join("") : `<div class="empty-state"><p>${L("tab_empty_" + (tab === "not_eligible" ? "not" : tab))}</p></div>`}
        </div>
      </section>
      <aside class="side">${profileCard()}${missingCard(m)}${docsCard(m)}</aside>
    </div></div>`;

  $$("[data-tab]", root).forEach((b) => b.addEventListener("click", () => { state.results.tab = b.dataset.tab; renderResults(); $(`#tab-${b.dataset.tab}`)?.focus(); }));
  $$(".tabs [role=tab]", root).forEach((b, i, all) => b.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const n = all[(i + (e.key === "ArrowRight" ? 1 : all.length - 1)) % all.length]; n.click(); }
  }));
  $$(".sr-toggle", root).forEach((b) => b.addEventListener("click", () => {
    const row = b.closest(".scheme-row"); const id = Number(row.dataset.id);
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open)); $(".sr-detail", row).hidden = !open;
    open ? state.results.open.add(id) : state.results.open.delete(id);
  }));
  $$("[data-open]", root).forEach((b) => b.addEventListener("click", () => openScheme(Number(b.dataset.open))));
  $$("[data-answer]", root).forEach((b) => b.addEventListener("click", () => editField(b.dataset.answer)));
  $("#edit-answers").addEventListener("click", () => { state.check.step = 4; go("check"); });
  $("#start-over").addEventListener("click", () => { setProfile({}, { replace: true }); state.match = null; state.check.step = 0; go("home"); });
  $("#ask-these").addEventListener("click", () => sendToAssistant(hi() ? "मेरे लिए कौन सी योजनाएँ हैं?" : "Which schemes can I apply for?"));
  $("#print-report").addEventListener("click", printReport);
  $$("[data-plan]", root).forEach((b) => b.addEventListener("change", () => {
    let done; try { done = new Set(JSON.parse(sessionStorage.getItem("plan-docs") || "[]")); } catch { done = new Set(); }
    b.checked ? done.add(b.dataset.plan) : done.delete(b.dataset.plan);
    try { sessionStorage.setItem("plan-docs", JSON.stringify([...done])); } catch {}
    const n = m.documents.filter((d) => done.has(d.name)).length;
    $("#plan-count").textContent = L("docs_b", { a: n, n: m.documents.length });
    $("#plan-meter").style.width = `${(n / m.documents.length) * 100}%`;
  }));
}

/* ---------------- printable / save-as-PDF report ---------------- */
async function printReport() {
  const m = state.match; if (!m) return;
  const likely = m.results.filter((r) => r.status === "likely");
  const check = m.results.filter((r) => r.status === "check");
  let details;
  try { details = await Promise.all(likely.map((r) => api.scheme(r.scheme_id))); } catch { toast(L("server_err")); return; }
  const p = state.profile, v = m.value;
  const rows = FACT_ORDER.filter((k) => p[k] !== undefined).map((k) => `<tr><th>${esc(fieldLabel(k))}</th><td>${esc(fieldValue(k, p[k]))}</td></tr>`).join("");
  const val = [v.annual_cash && `${inr(v.annual_cash)} (${L("k_cash")})`, v.one_time && `${inr(v.one_time)} (${L("k_one")})`,
    v.cover && `${inr(v.cover)} (${L("k_cover")})`, v.loan && `${inr(v.loan)} (${L("k_loan")})`].filter(Boolean).join("; ");
  $("#report").innerHTML = `
    <h1>${L("report_title")}</h1>
    <p class="muted">${p.name ? esc(p.name) + " · " : ""}${new Date().toLocaleDateString(hi() ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
    <h2>${L("your_details")}</h2><table>${rows}</table>
    <h2>${L("tab_likely")} (${likely.length})</h2>
    ${val ? `<p><b>${L("est_value")}:</b> ${val}</p>` : ""}
    <table><tr><th>${L("scheme")}</th><th>${L("benefits")}</th><th>${L("how_apply")}</th></tr>
    ${details.map((s) => `<tr><td><b>${esc(sName(s))}</b></td><td>${esc(sBenefits(s))}</td><td>${esc(s.application.mode)}<br>${esc(s.application.apply_url || s.official_source)}${s.application.helpline ? `<br>${L("helpline")}: ${esc(s.application.helpline)}` : ""}</td></tr>`).join("")}</table>
    ${check.length ? `<h2>${L("tab_check")} (${check.length})</h2><p>${check.map((r) => esc(sName(r))).join(", ")}</p>` : ""}
    <h2>${L("docs_t")}</h2>
    ${m.documents.map((d) => `<p><span class="box"></span>${esc(d.name)} <span class="muted">(${d.schemes.map(esc).join(", ")})</span></p>`).join("")}
    <p class="muted" style="margin-top:18pt">${L("footer")}</p>`;
  window.print();
}
