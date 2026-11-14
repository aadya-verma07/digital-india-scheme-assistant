// Hash routing: #home, #check, #results, #ask, #schemes, #insights.
export const ROUTES = ["home", "check", "results", "ask", "schemes", "insights"];
const renderers = {};
export const register = (name, fn) => (renderers[name] = fn);

export function current() {
  const h = (location.hash || "").slice(1);
  return ROUTES.includes(h) ? h : "home";
}
export function go(view) {
  if (current() === view) render();
  else location.hash = view;
}
export function render() {
  const view = current();
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== `view-${view}`));
  document.querySelectorAll("[data-route]").forEach((a) => (a.dataset.route === view ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  renderers[view]?.();
}
