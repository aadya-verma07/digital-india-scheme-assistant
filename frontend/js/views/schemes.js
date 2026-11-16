// Scheme directory: search, category filter, sort, "only mine", cards, side-by-side comparison.
// FILE: js/views/schemes.js - the SCHEME DIRECTORY (#schemes).
// Lists all schemes with search, category filter, sorting and "only schemes I qualify for", and lets the user
// tick up to 3 schemes to compare side by side. Filtering happens in the browser (the list is small).

import { state, hasProfile } from "../state.js";
import { L, hi } from "../i18n.js";
import * as api from "../api.js";
import { $, $$, esc, icon, sectorIcon, sectorName, sShort, sName, sSummary, sBenefits, badge, table, openSheet, sheetClose, toast, valueLabel } from "../ui.js";
import { openScheme } from "./detail.js";

// statusOf(id): this user's status for a scheme from the last results (if any).
const statusOf = (id) => state.match?.results.find((r) => r.scheme_id === id)?.status;
// Sort order for 'best fit': likely, then needs answers, then not eligible, then unknown.
const RANK = { likely: 0, check: 1, not_eligible: 2, undefined: 3 };

// filtered(all): apply category, search text (English and Hindi fields), 'only mine' and the chosen sort order.
function filtered(all) {
  const q = state.dir.q.trim().toLowerCase();
  let list = all.filter((s) => !state.dir.sector || s.sector === state.dir.sector);
  if (q) list = list.filter((s) => [s.scheme_name, s.name_hi, s.description, s.summary_hi, s.benefits, s.sector, s.ministry].join(" ").toLowerCase().includes(q));
  if (state.dir.onlyMine) list = list.filter((s) => statusOf(s.scheme_id) === "likely");
  const by = state.dir.sort;
  list = [...list].sort((a, b) => by === "fit" ? RANK[statusOf(a.scheme_id)] - RANK[statusOf(b.scheme_id)] || sName(a).localeCompare(sName(b))
    : by === "sector" ? a.sector.localeCompare(b.sector) || sName(a).localeCompare(sName(b)) : sName(a).localeCompare(sName(b)));
  return list;
}

// card(s): one scheme card - category, ministry, name, headline benefit, summary, status badge, compare tick box, Details.
function card(s) {
  const st = statusOf(s.scheme_id);
  return `<article class="card sc">
    <div class="top">${sectorIcon(s.sector, "sm")}<div><b>${esc(sectorName(s.sector))}</b><small>${esc(s.ministry)}</small></div></div>
    <h3>${esc(sShort(s))}</h3>
    ${s.values?.[0] ? `<div class="value">${esc(valueLabel(s))}</div>` : ""}
    <p>${esc(sSummary(s))}</p>
    ${st ? `<div>${badge(st)}</div>` : ""}
    <div class="foot">
      <label class="cmp-check"><input type="checkbox" data-cmp="${s.scheme_id}" ${state.dir.compare.has(s.scheme_id) ? "checked" : ""}/>${L("compare")}</label>
      <button type="button" class="btn btn-secondary btn-sm" data-open="${s.scheme_id}">${L("details")}${icon("arrow")}</button>
    </div></article>`;
}

// renderList(all): draw the filtered cards and the 'Showing X of Y' count; compare ticks are limited to 3.
function renderList(all) {
  const list = filtered(all);
  $("#dir-count").textContent = L("showing", { n: list.length, m: all.length });
  $("#dir-grid").innerHTML = list.length ? list.map(card).join("")
    : `<div class="card empty-state" style="grid-column:1/-1"><p>${esc(L("no_results", { q: state.dir.q || sectorName(state.dir.sector || "") }))}</p></div>`;
  $$("#dir-grid [data-open]").forEach((b) => b.addEventListener("click", () => openScheme(Number(b.dataset.open))));
  $$("#dir-grid [data-cmp]").forEach((b) => b.addEventListener("change", () => {
    const id = Number(b.dataset.cmp);
    if (b.checked) { if (state.dir.compare.size >= 3) { b.checked = false; toast(L("compare_max")); return; } state.dir.compare.add(id); }
    else state.dir.compare.delete(id);
    compareBar();
  }));
  compareBar();
}

// compareBar(): floating bar 'N selected - Compare' shown when 2-3 schemes are ticked (only on this page).
function compareBar() {
  let bar = $("#compare-bar");
  const n = state.dir.compare.size;
  if (n < 2 || location.hash !== "#schemes") { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement("div"); bar.id = "compare-bar"; bar.className = "compare-bar"; bar.setAttribute("role", "region");
    document.body.appendChild(bar);
  }
  bar.innerHTML = `<span>${L("compare_n", { n })}</span><button type="button" class="btn btn-ghost btn-sm" id="cmp-clear">${L("clear")}</button>
    <button type="button" class="btn btn-accent btn-sm" id="cmp-go">${L("compare_go")}</button>`;
  $("#cmp-clear").onclick = () => { state.dir.compare.clear(); renderSchemes(); };
  $("#cmp-go").onclick = openCompare;
}
// Remove the compare bar when leaving the directory.
window.addEventListener("hashchange", () => { if (location.hash !== "#schemes") $("#compare-bar")?.remove(); });

// openCompare(): load the ticked schemes' details and show a comparison table in the side panel (adds 'Your status' if known).
async function openCompare() {
  const items = await Promise.all([...state.dir.compare].map((id) => api.scheme(id)));
  const rows = [
    [L("benefits"), (s) => sBenefits(s)], [L("who"), (s) => s.target_beneficiaries],
    [L("eligibility"), (s) => s.eligibility[0].conditions.join("; ")], [L("docs_needed"), (s) => s.documents.map((d) => d.name).join(", ")],
    [L("how_apply"), (s) => s.application.mode], [L("helpline"), (s) => s.application.helpline || "—"], [L("scheme_page"), (s) => s.official_source],
  ];
  if (state.match) rows.unshift([L("your_status"), (s) => L("st_" + (statusOf(s.scheme_id) || "check"))]);
  openSheet(`<div class="sheet-head"><div class="grow"><h2 id="sheet-title">${L("compare_t")}</h2></div>${sheetClose()}</div>
    <div class="sheet-body">${table(["", ...items.map((s) => sShort(s))], rows.map(([h, f]) => [h, ...items.map(f)]))}</div>`);
  $("#sheet").style.width = "min(980px, 100%)";
}

// renderSchemes(): draw the page - category list with counts, 'only mine' switch (if results exist), search box
// and sort menu. Search waits 150 ms after typing stops before filtering (debounce).
export async function renderSchemes() {
  const root = $("#view-schemes");
  const [all, sectors] = await Promise.all([api.schemes(), api.sectors()]);
  if (hasProfile() && !state.match) { try { await api.runMatch(); } catch {} }
  const counts = Object.fromEntries(sectors.map((s) => [s, all.filter((x) => x.sector === s).length]));
  root.innerHTML = `<div class="container page">
    <div class="page-head"><div><h1>${L("dir_title")}</h1><p>${L("dir_sub")}</p></div></div>
    <div class="dir">
      <aside class="filters" aria-label="${L("categories")}">
        <div class="group"><h3>${L("categories")}</h3>
          <ul class="cat-filter">
            <li><button type="button" data-sector="" aria-pressed="${!state.dir.sector}">${icon("grid")}<span>${L("all")}</span><span class="c">${all.length}</span></button></li>
            ${sectors.map((s) => `<li><button type="button" data-sector="${esc(s)}" aria-pressed="${state.dir.sector === s}">${esc(sectorName(s))}<span class="c">${counts[s]}</span></button></li>`).join("")}
          </ul></div>
        ${state.match ? `<div class="group"><label class="toggle"><span>${L("only_mine")}</span><span class="switch"><input type="checkbox" id="only-mine" ${state.dir.onlyMine ? "checked" : ""}/><i></i></span></label></div>` : ""}
      </aside>
      <div>
        <div class="dir-toolbar">
          <div class="search-box">${icon("search")}<label for="dir-q" class="sr-only">${L("search_ph")}</label>
            <input class="input" id="dir-q" type="search" placeholder="${esc(L("search_ph"))}" value="${esc(state.dir.q)}"/></div>
          <label class="sr-only" for="dir-sort">${L("sort")}</label>
          <select class="select" id="dir-sort">
            <option value="name" ${state.dir.sort === "name" ? "selected" : ""}>${L("sort")}: ${L("sort_name")}</option>
            <option value="sector" ${state.dir.sort === "sector" ? "selected" : ""}>${L("sort")}: ${L("sort_cat")}</option>
            ${state.match ? `<option value="fit" ${state.dir.sort === "fit" ? "selected" : ""}>${L("sort")}: ${L("sort_fit")}</option>` : ""}
          </select>
        </div>
        <p class="result-count" id="dir-count" aria-live="polite"></p>
        <div class="dir-grid" id="dir-grid"></div>
      </div>
    </div></div>`;
  renderList(all);
  $$(".cat-filter button", root).forEach((b) => b.addEventListener("click", () => { state.dir.sector = b.dataset.sector || null; renderSchemes(); }));
  let t;
  $("#dir-q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { state.dir.q = e.target.value; renderList(all); }, 150); });
  $("#dir-sort").addEventListener("change", (e) => { state.dir.sort = e.target.value; renderList(all); });
  $("#only-mine")?.addEventListener("change", (e) => { state.dir.onlyMine = e.target.checked; renderList(all); });
}
