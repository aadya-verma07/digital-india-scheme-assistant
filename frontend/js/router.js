// Hash routing: #home, #check, #results, #ask, #schemes, #insights.
// FILE: js/router.js - switches between the six pages without reloading (single-page application).
// The part of the URL after # decides the page: /#check shows the eligibility checker, /#ask the assistant, etc.
// Each page's section already exists in index.html; the router shows one and hides the others.

// The six pages, and a table of the function that draws each one (filled by register() in app.js).
export const ROUTES = ["home", "check", "results", "ask", "schemes", "insights"];
const renderers = {};
export const register = (name, fn) => (renderers[name] = fn);

// current(): the page named in the URL, or 'home' if the URL names no valid page.
export function current() {
  const h = (location.hash || "").slice(1);
  return ROUTES.includes(h) ? h : "home";
}
// go(view): open a page (changing location.hash triggers 'hashchange' -> render). Same page = just redraw.
export function go(view) {
  if (current() === view) render();
  else location.hash = view;
}
// render(): show the current page's <section>, hide the rest, mark the active menu link
// (aria-current helps screen readers), then call that page's draw function.
export function render() {
  const view = current();
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== `view-${view}`));
  document.querySelectorAll("[data-route]").forEach((a) => (a.dataset.route === view ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  renderers[view]?.();
}
