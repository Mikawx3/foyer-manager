import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import { getAppName } from "./lib/app-name.ts";
import { getGuestResumeToken, getToken } from "./lib/auth-storage.ts";
import { localizePath, parsePublicPath } from "./lib/public-routes.ts";
import i18n from "./i18n.ts";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

if (!root.hasChildNodes()) {
  document.title = getAppName();
}
document.documentElement.lang = i18n.language.startsWith("fr") ? "fr" : "en";
document.documentElement.setAttribute("translate", "no");

/**
 * Public pages arrive prerendered. They are hydrated only when the markup is
 * for this URL and nothing stored in the browser (a session, a parked guest
 * visit) would change the first render.
 */
function canHydrate(container: HTMLElement): boolean {
  if (!container.hasChildNodes()) {
    return false;
  }
  const parsed = parsePublicPath(window.location.pathname);
  const prerenderedUrl = container.dataset.prerendered;
  if (!parsed || !prerenderedUrl || localizePath(parsed.path, parsed.locale) !== prerenderedUrl) {
    return false;
  }
  return getToken() === null && getGuestResumeToken() === null;
}

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (canHydrate(root)) {
  hydrateRoot(root, app);
} else {
  root.replaceChildren();
  createRoot(root).render(app);
}
