import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { resolveApiPort } from "./vite-api-port";

const PUBLIC_SITE_ORIGIN = "https://allotwe.com";

function htmlAppName(mode: string): Plugin {
  return {
    name: "html-app-name",
    transformIndexHtml(html, ctx) {
      const env = loadEnv(mode, process.cwd(), "VITE_");
      const configured = process.env.VITE_APP_NAME?.trim() || env.VITE_APP_NAME?.trim();
      const appName = configured && configured.length > 0 ? configured : "Foyer Manager";
      const safeName = appName
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
      const named = html.replaceAll("Foyer Manager", safeName);
      if (ctx.server) {
        return named;
      }
      const tags = [
        `<link rel="canonical" href="${PUBLIC_SITE_ORIGIN}/" />`,
        `<meta property="og:url" content="${PUBLIC_SITE_ORIGIN}/" />`,
        `<meta property="og:image" content="${PUBLIC_SITE_ORIGIN}/og.png" />`,
        `<meta name="twitter:image" content="${PUBLIC_SITE_ORIGIN}/og.png" />`,
      ].join("\n    ");
      return named.replace("</head>", `    ${tags}\n  </head>`);
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
