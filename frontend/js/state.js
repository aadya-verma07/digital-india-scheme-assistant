// Shared application state. Views read from it; profile changes go through setProfile().
export const state = {
  lang: "en",
  profile: {},             // the citizen's answers (same shape as the backend Profile model)
  match: null,             // last /api/match response
  view: "home",
  aiMode: "rules",
  schemes: null,           // cached /api/schemes list
  sectors: null,           // cached /api/sectors list
  chat: { pending_field: null, interview: null, scheme_id: null, history: [], started: false },
  check: { step: 0 },
  results: { tab: "likely", open: new Set() },
  dir: { sector: null, q: "", sort: "name", onlyMine: false, compare: new Set() },
  ins: { occupation: "", area: "", gender: "", sector: "" },
};

const listeners = new Set();
export const onProfileChange = (fn) => listeners.add(fn);

export function setProfile(updates, { replace = false } = {}) {
  const next = replace ? {} : { ...state.profile };
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === undefined || v === "") delete next[k];
    else next[k] = v;
  }
  state.profile = next;
  try { sessionStorage.setItem("profile", JSON.stringify(next)); } catch {}
  listeners.forEach((fn) => fn());
}

export function restore() {
  try {
    state.lang = localStorage.getItem("lang") || "en";
    state.profile = JSON.parse(sessionStorage.getItem("profile") || "{}");
  } catch {}
}

export const hasProfile = () => Object.keys(state.profile).filter((k) => k !== "name").length > 0;
