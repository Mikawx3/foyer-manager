import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { resolveApiPort } from "./vite-api-port";
import { resolveBuildSiteOrigin } from "./vite-site-origin";

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Finishes the HTML shell: app name, Search Console verification and the
 * `og:image` of the public site. Public pages get their own head from
 * scripts/prerender.mjs; the shell stays `noindex` for app routes.
 */
function htmlShell(mode: string): Plugin {
  return {
    name: "html-shell",
    transformIndexHtml(html, ctx) {
      const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
      const appName = env.VITE_APP_NAME?.trim() || "Foyer Manager";
      const named = html.replaceAll("Foyer Manager", escapeAttribute(appName));

      const verification = env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
      const verificationTag = verification
        ? `<meta name="google-site-verification" content="${escapeAttribute(verification)}" />`
        : "";
      const withVerification = named.replace("<!--site-verification-->", verificationTag);

      if (ctx.server) {
        return withVerification;
      }
      const siteOrigin = resolveBuildSiteOrigin(env);
      const imageTags = siteOrigin
        ? [
            `<meta property="og:image" content="${siteOrigin}/og.png" />`,
            `<meta name="twitter:image" content="${siteOrigin}/og.png" />`,
          ].join("\n    ")
        : "";
      return withVerification.replace("<!--seo-end-->", `${imageTags}\n    <!--seo-end-->`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const apiPort = resolveApiPort(mode);

  return {
    plugins: [htmlShell(mode), react(), tailwindcss()],
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
