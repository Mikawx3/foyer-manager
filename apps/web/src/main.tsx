import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { getAppName } from "./lib/app-name.ts";
import i18n from "./i18n.ts";
import "./index.css";

document.title = getAppName();
document.documentElement.lang = i18n.language.startsWith("fr") ? "fr" : "en";
document.documentElement.setAttribute("translate", "no");

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
