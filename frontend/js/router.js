/** Simple hash-based router. */
export function initRouter() {
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.slice(1) || "/";
    handleRoute(hash);
  });
  handleRoute(window.location.hash.slice(1) || "/");
}

function handleRoute(route) {
  // Route handling for future expansion (e.g., /model/:id, /settings)
  console.log("Route:", route);
}