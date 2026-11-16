// Shared application state. Views read from it; profile changes go through setProfile().
// FILE: js/state.js - the website's shared memory.
// One `state` object holds everything the pages need to share. The citizen's profile is saved in
// sessionStorage (survives a page refresh, cleared when the tab closes) and the language in localStorage.

// state fields: lang (en/hi), profile (answers), match (last eligibility results), cached scheme/sector lists,
// chat (conversation state sent back to /api/chat), and the remembered settings of each page (checker step,
// results tab, directory filters, insights filters).
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

// onProfileChange(fn): register a function to run whenever the profile changes (used by app.js to keep pages in sync).
const listeners = new Set();
export const onProfileChange = (fn) => listeners.add(fn);

// setProfile(updates, {replace}): the ONLY way the profile is changed.
// Merges the new answers (an empty value removes that answer), saves the profile to sessionStorage,
// then notifies every listener so the results, checker counter and chat panel update immediately.
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

// restore(): on page load, bring back the saved language and profile. try/catch because storage can be blocked.
export function restore() {
  try {
    state.lang = localStorage.getItem("lang") || "en";
    state.profile = JSON.parse(sessionStorage.getItem("profile") || "{}");
  } catch {}
}

// hasProfile(): true if the user has answered at least one question (the name alone doesn't count).
export const hasProfile = () => Object.keys(state.profile).filter((k) => k !== "name").length > 0;
