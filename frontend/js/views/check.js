// Multi-step eligibility checker with progress, live match count and a review step.
// FILE: js/views/check.js - the ELIGIBILITY CHECKER (#check): a 5-step form.
// Steps: 1 about you, 2 where you live, 3 work/income/education/category, 4 household yes/no questions, 5 review.
// Every answer is saved immediately (setProfile) and the "schemes so far" counter updates live.

import { state, setProfile, hasProfile } from "../state.js";
import { L, hi } from "../i18n.js";
import * as api from "../api.js";
import { $, $$, esc, icon, inr, toast } from "../ui.js";
import { STEPS, CHOICES, YES_NO, STATES, INCOME_PRESETS, SAMPLE, fieldLabel, fieldValue } from "../profile.js";
import { go } from "../router.js";

// Text key of each field's question.
const FIELD_TITLE = { name: "f_name", age: "f_age", gender: "f_gender", state: "f_state", area: "f_area",
  occupation: "f_occupation", income: "f_income", education: "f_education", category: "f_category" };

// choiceField(k): a question answered by picking one option (radio buttons styled as cards).
function choiceField(k) {
  const v = state.profile[k];
  return `<fieldset class="field"><legend>${L(FIELD_TITLE[k])}</legend>
    <div class="options">${CHOICES[k].map(([val, key]) => `<label class="option"><input type="radio" name="${k}" value="${esc(val)}" ${v === val ? "checked" : ""}/><span>${key ? L(key) : esc(val)}</span></label>`).join("")}</div>
  </fieldset>`;
}

// renderField(k): the right input for each field - text (name), number (age), dropdown (state), amount + preset buttons (income), or options.
function renderField(k) {
  const p = state.profile;
  if (k === "name") return `<div class="field"><label for="f-name">${L("f_name")} <span class="muted small">(${L("optional")})</span></label>
    <input class="input w-md" id="f-name" data-field="name" autocomplete="given-name" value="${esc(p.name || "")}"/></div>`;
  if (k === "age") return `<div class="field"><label for="f-age">${L("f_age")}</label>
    <input class="input w-sm" id="f-age" data-field="age" type="number" inputmode="numeric" min="0" max="120" value="${p.age ?? ""}"/></div>`;
  if (k === "state") return `<div class="field"><label for="f-state">${L("f_state")}</label>
    <select class="select w-md" id="f-state" data-field="state"><option value="">${L("choose")}</option>${STATES.map((s) => `<option ${p.state === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>`;
  if (k === "income") return `<div class="field"><label for="f-income">${L("f_income")}</label><p class="hint">${L("income_hint")}</p>
    <div class="input-affix"><span class="prefix">₹</span><input class="input" id="f-income" data-field="income" type="number" inputmode="numeric" min="0" step="1000" value="${p.income ?? ""}"/></div>
    <span class="formatted" id="income-fmt">${p.income ? inr(p.income) : ""}</span>
    <div class="presets">${INCOME_PRESETS.map(([v, lbl]) => `<button type="button" class="chip" data-income="${v}" aria-pressed="${p.income === v}">${lbl[hi() ? 1 : 0]}</button>`).join("")}</div></div>`;
  if (CHOICES[k]) return choiceField(k);
  return "";
}

// renderHousehold(): step 4 - every yes/no question with Yes / No toggle buttons.
function renderHousehold() {
  return `<div class="yn-list">${YES_NO.map(([k, q, h]) => `<div class="yn"><div><p id="q-${k}">${L(q)}</p>${h ? `<small>${L(h)}</small>` : ""}</div>
    <div class="seg" role="group" aria-labelledby="q-${k}">
      <button type="button" data-yn="${k}" data-v="true" aria-pressed="${state.profile[k] === true}">${L("yes")}</button>
      <button type="button" data-yn="${k}" data-v="false" aria-pressed="${state.profile[k] === false}">${L("no")}</button>
    </div></div>`).join("")}</div>`;
}

// renderReview(): step 5 - all answers grouped by step, each group with an Edit button; unanswered ones are marked.
function renderReview() {
  return `<div class="review">${STEPS.slice(0, 4).map((st, i) => `<section>
    <div class="rh"><h3>${L(st.title)}</h3><button type="button" class="btn btn-ghost btn-sm" data-goto="${i}">${icon("edit")}${L("edit")}</button></div>
    <dl>${st.fields.map((f) => { const v = fieldValue(f, state.profile[f]);
      return `<div><dt>${fieldLabel(f)}</dt><dd class="${v ? "" : "empty"}">${v ? esc(v) : L("not_answered")}</dd></div>`; }).join("")}</dl>
  </section>`).join("")}</div>`;
}

// liveCount(): the side box 'X schemes so far' (+ how many need answers), from the latest match result.
function liveCount() {
  const m = state.match;
  if (!m || !hasProfile()) return `<p class="lbl">${L("so_far")}</p><b>0</b><p>${L("live_likely")}</p>`;
  return `<p class="lbl">${L("so_far")}</p><b class="num">${m.counts.likely}</b><p>${L("live_likely")}</p>${m.counts.check ? `<p>${L("live_check", { n: m.counts.check })}</p>` : ""}`;
}

// refreshLive(): re-run the eligibility check 300 ms after the last change (so typing doesn't send a request
// per key) and update the counter. save=false: these in-between checks are NOT stored in the database.
let liveTimer;
export function refreshLive() {
  clearTimeout(liveTimer);
  liveTimer = setTimeout(async () => {
    if (!hasProfile()) { state.match = null; }
    else { try { await api.runMatch({ save: false }); } catch {} }
    const box = $("#live-count");
    if (box) box.innerHTML = liveCount();
  }, 300);
}

// renderCheck(): draw the current step - progress bar, the step's questions, the live counter and Back/Next buttons.
export function renderCheck() {
  const root = $("#view-check");
  const step = state.check.step;
  const st = STEPS[step];
  const last = step === STEPS.length - 1;
  const body = step === 3 ? renderHousehold() : last ? renderReview() : st.fields.map(renderField).join("");

  root.innerHTML = `<div class="container page">
    <div class="page-head"><div><h1>${L("check_title")}</h1></div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button type="button" class="btn btn-ghost btn-sm" id="use-sample">${L("sample")}</button>
        ${hasProfile() ? `<button type="button" class="btn btn-ghost btn-sm" id="clear-all">${icon("refresh")}${L("clear_all")}</button>` : ""}
      </div></div>
    <div class="checker">
      <div class="stepper">
        <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${step + 1}" aria-label="${L("step_of", { n: step + 1, m: STEPS.length })}"><i style="width:${((step + 1) / STEPS.length) * 100}%"></i></div>
        <ol>${STEPS.map((s, i) => `<li class="${i < step ? "done" : i === step ? "current" : ""}"><button type="button" data-goto="${i}" ${i === step ? 'aria-current="step"' : ""}>
          <span class="n">${i < step ? icon("check") : i + 1}</span><span class="lbl">${L(s.title)}</span></button></li>`).join("")}</ol>
        <div class="card live-count" id="live-count" aria-live="polite">${liveCount()}</div>
      </div>
      <form class="card step-panel" id="step-form" novalidate>
        <p class="step-of">${L("step_of", { n: step + 1, m: STEPS.length })}</p>
        <h2 id="step-title" tabindex="-1">${L(st.title)}</h2>
        <p class="intro">${L(st.intro)}</p>
        ${body}
        <div class="step-nav">
          ${step > 0 ? `<button type="button" class="btn btn-secondary" id="prev">${icon("back")}${L("back")}</button>` : "<span></span>"}
          <div class="right">
            ${!last ? `<button type="button" class="btn btn-ghost" id="skip">${L("skip_step")}</button>` : ""}
            ${last ? `<button type="submit" class="btn btn-accent" id="finish">${L("see_results")}${icon("arrow")}</button>`
                   : `<button type="submit" class="btn btn-primary">${L("next")}${icon("arrow")}</button>`}
          </div>
        </div>
      </form>
    </div></div>`;

  bind(root);
  refreshLive();
}

// goStep(i): move to step i (kept between 0 and 4), redraw, scroll up and move keyboard focus to the step title.
function goStep(i) {
  state.check.step = Math.max(0, Math.min(STEPS.length - 1, i));
  renderCheck();
  window.scrollTo({ top: 0, behavior: "smooth" });
  $("#step-title")?.focus({ preventScroll: true });
}

// bind(root): connect every button and input of the step to its action:
function bind(root) {
  $$("[data-goto]", root).forEach((b) => b.addEventListener("click", () => goStep(Number(b.dataset.goto))));
  $("#prev")?.addEventListener("click", () => goStep(state.check.step - 1));
  $("#skip")?.addEventListener("click", () => goStep(state.check.step + 1));
  // Next / Finish: on the last step, run the check with save=true (stored for Insights) and open the results.
  $("#step-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (state.check.step < STEPS.length - 1) return goStep(state.check.step + 1);
    const btn = $("#finish"); btn.disabled = true;
    try { await api.runMatch({ save: true }); go("results"); }
    catch { toast(L("server_err")); btn.disabled = false; }
  });
  // 'Use a sample profile' fills every answer (for demos); 'Clear answers' empties the profile.
  $("#use-sample")?.addEventListener("click", () => { setProfile(SAMPLE, { replace: true }); goStep(STEPS.length - 1); });
  $("#clear-all")?.addEventListener("click", () => { setProfile({}, { replace: true }); state.match = null; goStep(0); });

  // text & number & select inputs
  // Typed answers (name, age, state, income) are saved as you type; numbers are converted from text.
  $$("[data-field]", root).forEach((el) => el.addEventListener("input", () => {
    const k = el.dataset.field;
    let v = el.value.trim();
    if (el.type === "number") v = v === "" ? null : Number(v);
    setProfile({ [k]: v });
    if (k === "income") {
      $("#income-fmt").textContent = v ? inr(v) : "";
      $$("[data-income]", root).forEach((c) => c.setAttribute("aria-pressed", String(Number(c.dataset.income) === v)));
    }
  }));
  // radio options
  // Option cards, income presets and Yes/No buttons save their value immediately.
  $$(".option input", root).forEach((el) => el.addEventListener("change", () => setProfile({ [el.name]: el.value })));
  // income presets
  $$("[data-income]", root).forEach((c) => c.addEventListener("click", () => {
    const v = Number(c.dataset.income);
    $("#f-income").value = v; setProfile({ income: v });
    $("#income-fmt").textContent = inr(v);
    $$("[data-income]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
  }));
  // yes / no (tap again to clear)
  $$("[data-yn]", root).forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.yn, v = b.dataset.v === "true";
    const clear = state.profile[k] === v;
    setProfile({ [k]: clear ? null : v });
    $$(`[data-yn="${k}"]`, root).forEach((x) => x.setAttribute("aria-pressed", String(!clear && (x.dataset.v === "true") === v)));
  }));
}

/** Open the checker at the step that asks a given field. */
// editField(field): used by 'Answer' / 'Edit' links elsewhere - opens the checker at the step that asks that field.
export function editField(field) {
  const i = STEPS.findIndex((s) => s.fields.includes(field));
  state.check.step = i < 0 ? 0 : i;
  go("check");
}
