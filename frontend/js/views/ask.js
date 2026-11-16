// AI assistant: conversation with interview quick-replies, cards, comparison tables, voice; side panel with suggestions and known facts.
// FILE: js/views/ask.js - the AI ASSISTANT page (#ask): the chat screen.
// Sends each message to POST /api/chat (backend ai.py) together with the conversation state, then draws the
// reply: text, scheme cards, comparison table, sources, quick-reply buttons and a read-aloud button.
// Side panel: suggested questions, "What I know about you" (profile facts), auto read-aloud switch, new chat.

import { state, setProfile } from "../state.js";
import { L, hi } from "../i18n.js";
import * as api from "../api.js";
import { $, $$, esc, icon, linkify, sectorIcon, badge, table, toast } from "../ui.js";
import { FACT_ORDER, factText } from "../profile.js";
import { listen, speak } from "../voice.js";
import { go } from "../router.js";
import { openScheme } from "./detail.js";

// The assistant's avatar (small SVG).
const BOT = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="11" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="20" cy="20" r="2.4" fill="#eba94b"/></svg>';
// A message waiting to be sent once the page is ready; whether auto read-aloud is on; whether the chat layout is built (and in which language).
let pending = null;
const autoSpeakOn = () => { try { return localStorage.getItem("autoSpeak") === "1"; } catch { return false; } };
let built = false;
let builtLang = null;

/** Open the assistant and send a message (used by the homepage search, results page and scheme sheets). */
export function sendToAssistant(text) {
  pending = text;
  if (location.hash === "#ask") renderAsk(); else go("ask");
}

// Suggested questions in the side panel (English or Hindi).
const SUGGEST = () => hi() ? [
  ["g_find", ["मेरे लिए कौन सी योजनाएँ हैं?", "मैं 60 साल की विधवा हूँ, गाँव में रहती हूँ"]],
  ["g_elig", ["क्या मैं उज्ज्वला के लिए पात्र हूँ?", "क्या मुझे आयुष्मान कार्ड मिल सकता है?"]],
  ["g_docs", ["पीएम किसान के लिए कौन से दस्तावेज़ चाहिए?", "अटल पेंशन के लिए आवेदन कैसे करें?"]],
  ["g_compare", ["PMJJBY और PMSBY की तुलना करें"]],
] : [
  ["g_find", ["Which schemes can I apply for?", "I'm a 35 year old woman tailor and need a loan for my shop"]],
  ["g_elig", ["Am I eligible for Ujjwala?", "Can I get an Ayushman card?"]],
  ["g_docs", ["What documents are required for PM Kisan?", "How do I apply for Atal Pension Yojana?"]],
  ["g_compare", ["Compare PMJJBY and PMSBY", "Mudra vs Stand-Up India"]],
];

// knownFacts(): chips of everything the assistant knows about the user (same profile as the checker).
function knownFacts() {
  const p = state.profile;
  const facts = FACT_ORDER.filter((k) => p[k] !== undefined);
  return facts.length
    ? `<div class="facts">${facts.map((k) => `<span class="tag ${p[k] === false ? "no" : ""}">${esc(factText(k, p[k]))}</span>`).join("")}</div>
       <a class="btn btn-secondary btn-sm" href="#results" style="margin-top:.9rem">${L("open_results")}${icon("arrow")}</a>`
    : `<p class="small muted">${L("known_empty")}</p>`;
}
// refreshKnown(): redraw those chips (called by app.js whenever the profile changes).
export function refreshKnown() { const k = $("#known"); if (k) k.innerHTML = knownFacts(); }

// buildShell(): build the chat layout once (log, input box, mic, side panel) and connect its buttons:
// send, mic (voice input), suggestions, auto read-aloud switch, and 'New chat' (clears the conversation state).
function buildShell() {
  const root = $("#view-ask");
  const oldLog = $("#chat-log")?.innerHTML;
  root.innerHTML = `<div class="container page">
    <div class="page-head"><div><h1>${L("ask_title")}</h1><p>${L("ask_sub")}</p></div></div>
    <div class="assistant">
      <section class="card chat-card" aria-label="${L("ask_title")}">
        <div class="chat-top">
          <div class="who"><span class="avatar">${BOT}</span><div><b>${L("bot_name")}</b><small>${state.aiMode === "rules" ? L("mode_rules") : L("mode_llm", { m: state.aiMode })}</small></div></div>
          <button type="button" class="btn btn-ghost btn-sm" id="new-chat">${icon("refresh")}${L("clear_chat")}</button>
        </div>
        <div class="chat-log" id="chat-log" aria-live="polite"></div>
        <div class="quick-replies" id="quick-replies"></div>
        <form class="composer" id="composer">
          <button type="button" class="icon-btn" id="chat-mic" aria-label="${L("speak")}" aria-pressed="false" title="${L("speak")}">${icon("mic")}</button>
          <label for="chat-input" class="sr-only">${L("chat_ph")}</label>
          <input class="input" id="chat-input" autocomplete="off" placeholder="${esc(L("chat_ph"))}"/>
          <button type="submit" class="btn btn-primary">${icon("send")}<span>${L("send")}</span></button>
        </form>
      </section>
      <aside>
        <section class="card"><div class="card-head"><h2>${L("suggest_t")}</h2></div><div class="card-pad">
          ${SUGGEST().map(([g, qs]) => `<div class="suggest-group"><h4>${L(g)}</h4>${qs.map((q) => `<button type="button" class="suggest">${esc(q)}</button>`).join("")}</div>`).join("")}
        </div></section>
        <section class="card"><div class="card-head"><h2>${L("known_t")}</h2></div><div class="card-pad" id="known">${knownFacts()}</div></section>
        <section class="card card-pad">
          <label class="toggle"><span>${L("read_aloud")}</span><span class="switch"><input type="checkbox" id="auto-speak" ${autoSpeakOn() ? "checked" : ""}/><i></i></span></label>
        </section>
      </aside>
    </div></div>`;

  if (oldLog) $("#chat-log").innerHTML = oldLog;
  rebindLog();
  $("#composer").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#chat-input").value; $("#chat-input").value = ""; send(v); });
  $("#chat-mic").addEventListener("click", (e) => listen(e.currentTarget, (t) => ($("#chat-input").value = t), (t) => { $("#chat-input").value = ""; send(t); }));
  $$(".suggest", root).forEach((b) => b.addEventListener("click", () => send(b.textContent)));
  $("#auto-speak").addEventListener("change", (e) => { try { localStorage.setItem("autoSpeak", e.target.checked ? "1" : "0"); } catch {} });
  $("#new-chat").addEventListener("click", () => {
    state.chat = { pending_field: null, interview: null, scheme_id: null, history: [], started: false };
    $("#chat-log").innerHTML = ""; $("#quick-replies").innerHTML = ""; welcome();
  });
  built = true; builtLang = state.lang;
}

// rebindLog(): reconnect buttons inside old messages after the log is rebuilt.
function rebindLog() {
  $$("#chat-log [data-open]").forEach((b) => b.addEventListener("click", () => openScheme(Number(b.dataset.open))));
  $$("#chat-log .speak").forEach((b) => b.addEventListener("click", () => speak(b.dataset.text, b.dataset.lang)));
}

// scroll(): keep the newest message in view.
function scroll() { const log = $("#chat-log"); log.scrollTop = log.scrollHeight; }

// addUser(text): add the user's message bubble.
function addUser(text) {
  const row = document.createElement("div");
  row.className = "msg-row user";
  row.innerHTML = `<div class="bubble">${esc(text)}</div>`;
  $("#chat-log").appendChild(row); scroll();
}

// addBot(res): add the assistant's reply bubble from the server's reply object: text (links made clickable),
// 'I noted: ...' chips, comparison table, scheme cards, sources and a 🔊 button; reads it aloud if auto-speak is on.
function addBot(res) {
  const row = document.createElement("div");
  row.className = "msg-row bot";
  const updates = res.profile_updates || {};
  const noted = res.noted?.length && Object.keys(updates).length ? `<div class="noted">${res.noted.map((n) => `<span>✓ ${esc(n)}</span>`).join("")}</div>` : "";
  const cards = res.cards?.length ? `<div class="mini-cards">${res.cards.slice(0, 8).map((c) => `<div class="mini-card">${sectorIcon(c.sector, "sm")}
      <div class="info"><b>${esc((hi() && c.name_hi) || c.name)}</b><small>${esc((hi() && c.summary_hi) || c.summary)}</small>${badge(c.status)}</div>
      <button type="button" class="btn btn-secondary btn-sm" data-open="${c.scheme_id}">${L("details")}</button></div>`).join("")}</div>` : "";
  const tbl = res.table ? table(res.table.headers, res.table.rows) : "";
  const src = res.sources?.length ? `<div class="sources">${L("sources")}: ${res.sources.map((s) => `<a href="${esc(s.official_source)}" target="_blank" rel="noopener">${esc(s.scheme_name.split(" (")[0])}</a>`).join("")}</div>` : "";
  row.innerHTML = `<span class="avatar">${BOT}</span><div class="bubble">
    <button type="button" class="speak" data-text="${esc(res.answer)}" data-lang="${res.lang || state.lang}" aria-label="${L("read")}" title="${L("read")}">${icon("speaker")}</button>
    ${noted}<div class="text">${linkify(esc(res.answer))}</div>${tbl}${cards}${src}</div>`;
  $("#chat-log").appendChild(row);
  $$("[data-open]", row).forEach((b) => b.addEventListener("click", () => openScheme(Number(b.dataset.open))));
  $(".speak", row).addEventListener("click", () => speak(res.answer, res.lang));
  scroll();
  if ($("#auto-speak")?.checked) speak(res.answer, res.lang);
}

// quickReplies(list): tap buttons under the last answer. Interview answers send their value (answer_value)
// so the server doesn't have to interpret text; other buttons send a ready-made question.
function quickReplies(list) {
  const box = $("#quick-replies");
  box.innerHTML = (list || []).map((q, i) => `<button type="button" class="qr" data-i="${i}">${esc(q.label)}</button>`).join("");
  $$(".qr", box).forEach((b) => b.addEventListener("click", () => {
    const q = list[Number(b.dataset.i)];
    if ("value" in q) send(q.label, { answerValue: q.value }); else send(q.send || q.label);
  }));
}

// send(text, {answerValue}): the core of the chat.
// 1. Show the user's bubble and a typing indicator.
// 2. POST /api/chat with the message + conversation state (pending question, interview, scheme being discussed,
//    history, language) + the profile.
// 3. Facts the assistant learned (profile_updates) are saved to the shared profile -> results and checker update too.
// 4. Remember the new conversation state from the reply, show the reply, and keep the last messages as history.
async function send(text, { answerValue = null } = {}) {
  text = String(text).trim(); if (!text) return;
  state.chat.started = true;
  addUser(text); quickReplies([]);
  const typing = document.createElement("div");
  typing.className = "msg-row bot";
  typing.innerHTML = `<span class="avatar">${BOT}</span><div class="bubble" aria-label="${L("thinking")}"><span class="typing"><i></i><i></i><i></i></span></div>`;
  $("#chat-log").appendChild(typing); scroll();
  const c = state.chat;
  try {
    const res = await api.chat({
      message: text, answer_value: answerValue, pending_field: c.pending_field, interview: c.interview, scheme_id: c.scheme_id,
      profile: Object.keys(state.profile).length ? state.profile : null, history: c.history.slice(-6), lang: state.lang,
    });
    typing.remove();
    if (res.profile_updates && Object.keys(res.profile_updates).length) {
      setProfile(res.profile_updates);
      toast(`${L("saved_profile")}: ${res.noted.slice(0, 3).join(", ")}${res.noted.length > 3 ? "…" : ""}`);
    }
    c.pending_field = res.pending_field; c.interview = res.interview;
    if (res.context_scheme_id) c.scheme_id = res.context_scheme_id;
    c.history.push({ role: "user", content: text }, { role: "assistant", content: res.answer });
    addBot(res); quickReplies(res.quick_replies); refreshKnown();
    if (res.show_results) api.runMatch({ save: true }).catch(() => {});
  } catch {
    typing.remove();
    addBot({ answer: L("server_err"), lang: state.lang });
  }
}

// welcome(): the first greeting with starter buttons.
function welcome() {
  addBot({ answer: L("welcome"), lang: state.lang });
  quickReplies(hi()
    ? [{ label: "मेरे लिए योजनाएँ ढूँढें", send: "मेरे लिए कौन सी योजनाएँ हैं?" }, { label: "पीएम किसान के दस्तावेज़", send: "पीएम किसान के लिए कौन से दस्तावेज़ चाहिए?" }]
    : [{ label: "Find schemes for me", send: "Which schemes can I apply for?" }, { label: "Am I eligible for Ujjwala?", send: "Am I eligible for Ujjwala?" }]);
}

// renderAsk(): draw the page; rebuild the layout if the language changed; send any message waiting from another page.
export function renderAsk() {
  if (!built || builtLang !== state.lang) buildShell();
  else refreshKnown();
  if (!state.chat.started && !$("#chat-log").children.length) welcome();
  if (pending) { const t = pending; pending = null; send(t); }
  else setTimeout(() => $("#chat-input")?.focus(), 50);
}
