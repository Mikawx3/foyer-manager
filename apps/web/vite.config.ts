import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { resolveApiPort } from "./vite-api-port";

function htmlAppName(mode: string): Plugin {
  return {
    name: "html-app-name",
    transformIndexHtml(html) {
      const env = loadEnv(mode, process.cwd(), "VITE_");
      const configured = process.env.VITE_APP_NAME?.trim() || env.VITE_APP_NAME?.trim();
      const appName = configured && configured.length > 0 ? configured : "Foyer Manager";
      const safeName = appName
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
      return html.replaceAll("Foyer Manager", safeName);
    },
  };
}

export default defineConfig(({ mode }) => {
  const apiPort = resolveApiPort(mode);

  return {
    plugins: [htmlAppName(mode), react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: ["foyer", "foyer.local", "localhost"],
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
