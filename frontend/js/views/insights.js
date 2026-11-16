// Admin insights: filters, headline figures, demand chart, near misses, information gaps, users.
// FILE: js/views/insights.js - the ADMIN INSIGHTS page (#insights).
// Aggregate statistics from every saved profile (GET /api/insights): headline numbers, demand per scheme chart,
// near misses (people missing a scheme by ONE condition), most-unanswered questions, occupation and area mix.
// Filters (occupation, area, gender, scheme category) re-request the numbers from the server.
// Every chart has a "table view" for screen readers and exact values; colours were checked for colour-blindness.

import { state } from "../state.js";
import { L, hi } from "../i18n.js";
import * as api from "../api.js";
import { $, $$, esc, inr, cLabel, sectorName, bindTooltips } from "../ui.js";
import { CHOICES, fieldLabel } from "../profile.js";

// pct(a, b): a as a percentage of b (for bar widths). opt(k, v): readable name of an option value.
const pct = (a, b) => (b ? (a / b) * 100 : 0);
const opt = (k, v) => { const o = (CHOICES[k] || []).find(([x]) => x === v); return o ? (o[1] ? L(o[1]) : o[0]) : v; };

// demandChart(d): horizontal bars per scheme - likely eligible + may qualify - with tooltips and a table view.
function demandChart(d) {
  const max = Math.max(1, ...d.schemes.map((s) => s.likely + s.check));
  const short = (n) => n.split(" (")[0];
  return `<section class="card"><div class="card-head"><div><h2>${L("ic_demand")}</h2><p>${L("ic_demand_b")}</p></div></div>
    <div class="chart">
      <div class="chart-legend"><span><i style="background:var(--series-1)"></i>${L("ic_likely")}</span><span><i style="background:var(--series-2)"></i>${L("ic_check")}</span></div>
      ${d.schemes.map((s) => `<div class="hbar" data-tip="<b>${esc(short(s.scheme_name))}</b>${L("ic_likely")}: ${s.likely}<br>${L("ic_check")}: ${s.check}">
        <span class="name">${esc(short(s.scheme_name))}</span>
        <span class="track">${s.likely ? `<i style="width:${pct(s.likely, max)}%;background:var(--series-1)"></i>` : ""}${s.check ? `<i style="width:${pct(s.check, max)}%;background:var(--series-2)"></i>` : ""}</span>
        <span class="val">${s.likely} + ${s.check}</span></div>`).join("")}
      <details class="table-view"><summary>${L("table_view")}</summary>
        <div class="table-wrap"><table class="cmp"><thead><tr><th>${L("scheme")}</th><th>${L("ic_likely")}</th><th>${L("ic_check")}</th></tr></thead>
        <tbody>${d.schemes.map((s) => `<tr><td>${esc(short(s.scheme_name))}</td><td class="num">${s.likely}</td><td class="num">${s.check}</td></tr>`).join("")}</tbody></table></div>
      </details>
    </div></section>`;
}

// singleBars(...): a simple one-colour bar chart (used for occupations, areas, unanswered questions).
function singleBars(title, sub, rows, color) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return `<section class="card"><div class="card-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div></div>
    <div class="chart">${rows.length ? rows.map((r) => `<div class="hbar ${r.sub ? "two-line" : ""}" data-tip="<b>${esc(r.name)}</b>${r.sub ? esc(r.sub) + "<br>" : ""}${r.n} ${L("citizens")}">
      <span class="name">${esc(r.name)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span>
      <span class="track"><i style="width:${pct(r.n, max)}%;background:${color}"></i></span><span class="val">${r.label ?? r.n}</span></div>`).join("")
      : `<p class="small muted">${L("no_data")}</p>`}</div></section>`;
}

// renderInsights(): load the statistics for the current filters and draw the filter bar, headline figures and charts.
export async function renderInsights() {
  const root = $("#view-insights");
  const f = state.ins;
  const [d, sectors] = await Promise.all([api.insights(f), api.sectors()]);
  const occTotal = d.occupations.reduce((a, b) => a + b.count, 0) || 1;
  const areaTotal = d.areas.reduce((a, b) => a + b.count, 0) || 1;
  const sel = (id, key, options) => `<div class="field"><label for="${id}">${L(key)}</label><select class="select" id="${id}">
    <option value="">${L("flt_all")}</option>${options.map(([v, t]) => `<option value="${esc(v)}" ${f[id.slice(4)] === v ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div>`;

  root.innerHTML = `<div class="container page">
    <div class="page-head"><div><h1>${L("ins_title")}</h1><p>${L("ins_sub")}</p></div></div>
    <form class="card ins-filters" id="ins-form" aria-label="Filters">
      ${sel("flt-occupation", "flt_occ", CHOICES.occupation.map(([v, k]) => [v, L(k)]))}
      ${sel("flt-area", "flt_area", CHOICES.area.map(([v, k]) => [v, L(k)]))}
      ${sel("flt-gender", "flt_gender", CHOICES.gender.map(([v, k]) => [v, L(k)]))}
      ${sel("flt-sector", "flt_sector", sectors.map((s) => [s, sectorName(s)]))}
      <button type="reset" class="btn btn-ghost">${L("flt_reset")}</button>
    </form>
    <div class="kpis">
      <div class="kpi"><div class="label">${L("ik_profiles")}</div><div class="val">${d.profiles}</div></div>
      <div class="kpi"><div class="label">${L("ik_reach")}</div><div class="val teal">${Math.round(d.share_with_a_scheme * 100)}%</div></div>
      <div class="kpi"><div class="label">${L("ik_avg")}</div><div class="val">${d.avg_schemes_per_citizen}</div><div class="sub">${L("ik_avg_sub")}</div></div>
      <div class="kpi"><div class="label">${L("ik_cash")}</div><div class="val">${inr(d.cash_support_identified)}</div></div>
      <div class="kpi"><div class="label">${L("ik_cover")}</div><div class="val">${inr(d.cover_identified)}</div></div>
    </div>
    ${d.profiles ? `<div class="ins-grid">
      <div class="stack">
        ${demandChart(d)}
        <section class="card"><div class="card-head"><h2>${L("ic_area")}</h2></div><div class="chart">
          <div class="split" role="img" aria-label="${d.areas.map((a) => `${opt("area", a.area)} ${Math.round(pct(a.count, areaTotal))}%`).join(", ")}">
            ${d.areas.map((a, i) => `<i style="width:${pct(a.count, areaTotal)}%;background:${i ? "var(--series-2)" : "var(--navy)"}"></i>`).join("")}</div>
          <div class="split-legend">${d.areas.map((a, i) => `<span><i style="background:${i ? "var(--series-2)" : "var(--navy)"}"></i>${esc(opt("area", a.area))}: <b class="num">${Math.round(pct(a.count, areaTotal))}%</b></span>`).join("")}</div>
        </div></section>
      </div>
      <div class="stack">
        ${singleBars(L("ic_near"), L("ic_near_b"), d.top_blockers.map((b) => ({ name: b.scheme, sub: cLabel(b), n: b.count })), "var(--navy)")}
        ${singleBars(L("ic_gaps"), L("ic_gaps_b"), d.most_unanswered.map((u) => ({ name: fieldLabel(u.field), n: u.count })), "var(--series-2)")}
        ${singleBars(L("ic_who"), "", d.occupations.map((o) => ({ name: opt("occupation", o.occupation), n: o.count, label: Math.round(pct(o.count, occTotal)) + "%" })), "var(--series-1)")}
      </div>
    </div>` : `<div class="card empty-state"><p>${L("no_data")}</p></div>`}
    <p class="data-note">${L("ins_note")}</p>
  </div>`;

  bindTooltips(root);
  // Changing a filter reloads the statistics; Reset clears all filters.
  $$("#ins-form select").forEach((s) => s.addEventListener("change", () => { state.ins[s.id.slice(4)] = s.value; renderInsights(); }));
  $("#ins-form").addEventListener("reset", () => { setTimeout(() => { state.ins = { occupation: "", area: "", gender: "", sector: "" }; renderInsights(); }); });
}
