// Thin wrappers over the FastAPI backend. Every call the old frontend made is still made here.
// FILE: js/api.js - every call from the website to the backend goes through this file.
// fetch() sends an HTTP request to the FastAPI server (main.py) and returns the JSON reply.

import { state } from "./state.js";

// All backend URLs start with /api (same server that serves the website, so no full address is needed).
const BASE = "/api";

// get(path): HTTP GET request; throws an error if the server replies with an error code.
export async function get(path) {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
  return r.json();
}
// post(path, body): HTTP POST request sending `body` as JSON.
export async function post(path, body) {
  const r = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}`);
  return r.json();
}

// One small function per endpoint:
// health() -> GET /api/health, scheme(id) -> one scheme's details, extract(text) -> profile from a sentence,
// eligibility(id, profile) -> one scheme's verdict, chat(body) -> the AI assistant.
export const health = () => get("/health");
export const scheme = (id) => get(`/schemes/${id}`);
export const extract = (text) => post("/extract", { text });
export const eligibility = (id, profile) => post(`/eligibility/${id}`, profile);
export const chat = (body) => post("/chat", body);
// insights(filters): GET /api/insights, adding only the filters that have a value (?occupation=farmer&area=rural).
export function insights(filters = {}) {
  const p = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
  return get(`/insights${p.toString() ? "?" + p : ""}`);
}

// schemes() / sectors(): downloaded once, then kept in state (cache) so other pages don't download them again.
export async function schemes() {
  if (!state.schemes) state.schemes = await get("/schemes");
  return state.schemes;
}
export async function sectors() {
  if (!state.sectors) state.sectors = await get("/sectors");
  return state.sectors;
}

/** Run the eligibility engine for the current profile. save=true stores the profile (feeds Insights). */
// runMatch({save}): send the current profile to POST /api/match and keep the result in state.match.
// Every call gets a number (seq). If the user changes answers quickly, an older reply may arrive after a newer one;
// only the reply to the LATEST request is kept, so the screen never shows outdated results.
let seq = 0;
export async function runMatch({ save = false } = {}) {
  const mine = ++seq;
  const data = await post("/match", { profile: state.profile, save });
  if (mine === seq) state.match = data;      // ignore stale responses from fast typing
  return data;
}
