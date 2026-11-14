// Thin wrappers over the FastAPI backend. Every call the old frontend made is still made here.
import { state } from "./state.js";

const BASE = "/api";

export async function get(path) {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
  return r.json();
}
export async function post(path, body) {
  const r = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}`);
  return r.json();
}

export const health = () => get("/health");
export const scheme = (id) => get(`/schemes/${id}`);
export const extract = (text) => post("/extract", { text });
export const eligibility = (id, profile) => post(`/eligibility/${id}`, profile);
export const chat = (body) => post("/chat", body);
export function insights(filters = {}) {
  const p = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
  return get(`/insights${p.toString() ? "?" + p : ""}`);
}

export async function schemes() {
  if (!state.schemes) state.schemes = await get("/schemes");
  return state.schemes;
}
export async function sectors() {
  if (!state.sectors) state.sectors = await get("/sectors");
  return state.sectors;
}

/** Run the eligibility engine for the current profile. save=true stores the profile (feeds Insights). */
let seq = 0;
export async function runMatch({ save = false } = {}) {
  const mine = ++seq;
  const data = await post("/match", { profile: state.profile, save });
  if (mine === seq) state.match = data;      // ignore stale responses from fast typing
  return data;
}
