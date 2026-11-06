// Prerenders the public pages into static HTML after `vite build`.
//
// Input:  dist/index.html (SPA shell), dist-ssr/entry-prerender.js (SSR build)
// Output: dist/app.html (shell, noindex, served for app routes)
//         dist/<path>/index.html and dist/en/<path>/index.html for each public page
//         dist/sitemap.xml and dist/robots.txt
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

// React and react-router pick their production builds from NODE_ENV.
process.env.NODE_ENV ??= "production";

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(webRoot, "dist");
const ssrEntry = path.join(webRoot, "dist-ssr", "entry-prerender.js");

const SEO_BLOCK = /<!--seo-start-->[\s\S]*?<!--seo-end-->/;
const ROOT_TAG = '<div id="root"></div>';
const MIN_PAGE_HTML_LENGTH = 500;

/** Same rule as vite-site-origin.ts (kept in sync by hand: this file runs without TypeScript). */
function resolveBuildSiteOrigin(env) {
  const configured = env.VITE_PUBLIC_SITE_ORIGIN?.trim();
  if (configured && /^https?:\/\//.test(configured)) {
    return configured.replace(/\/+$/, "");
  }
  const vercelDomain = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelDomain) {
    return `https://${vercelDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }
  return null;
}

/** The app reads localStorage at module scope; Node has none. */
function installLocalStorageStub() {
  const data = new Map();
  const stub = {
    getItem: (key) => data.get(String(key)) ?? null,
    setItem: (key, value) => {
      data.set(String(key), String(value));
    },
    removeItem: (key) => {
      data.delete(String(key));
    },
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: stub, configurable: true, writable: true });
}

function escapeText(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeText(value).replaceAll('"', "&quot;");
}

function outputDirFor(url) {
  return url === "/" ? dist : path.join(dist, ...url.slice(1).split("/"));
}

function sitemapXml(targets, siteOrigin, alternatesFor) {
  const urls = targets.map((target) => {
    const alternates = alternatesFor(target.path);
    const links = [
      ["fr", alternates.fr],
      ["en", alternates.en],
      ["x-default", alternates.xDefault],
    ]
      .map(
        ([lang, href]) =>
          `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeAttribute(href)}" />`,
      )
      .join("\n");
    return `  <url>\n    <loc>${escapeText(`${siteOrigin}${target.url}`)}</loc>\n${links}\n  </url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

function robotsTxt(siteOrigin) {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /households/",
    "Disallow: /login",
    "Disallow: /register",
    "Disallow: /invite/",
    "Disallow: /app.html",
    "Disallow: /api/",
  ];
  if (siteOrigin) {
    lines.push("", `Sitemap: ${siteOrigin}/sitemap.xml`);
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  installLocalStorageStub();
  const siteOrigin = resolveBuildSiteOrigin(process.env);

  const shell = await readFile(path.join(dist, "index.html"), "utf8");
  if (!SEO_BLOCK.test(shell) || !shell.includes(ROOT_TAG)) {
    throw new Error("dist/index.html is missing the <!--seo-start--> block or the #root element");
  }

  const { renderPublicPage, prerenderTargets, alternateUrls } = await import(pathToFileURL(ssrEntry).href);
  const targets = prerenderTargets();

  // The shell becomes the SPA fallback; the prerendered home takes index.html.
  await rename(path.join(dist, "index.html"), path.join(dist, "app.html"));

  for (const target of targets) {
    const page = await renderPublicPage(target, siteOrigin);
    if (page.html.trim().length < MIN_PAGE_HTML_LENGTH) {
      throw new Error(`Prerender of ${target.url} produced almost no markup (${page.html.length} chars)`);
    }
    const html = shell
      .replace(/<html lang="[a-zA-Z-]*"/, `<html lang="${page.lang}"`)
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeText(page.title)}</title>`)
      .replace(SEO_BLOCK, page.headHtml)
      .replace(ROOT_TAG, `<div id="root" data-prerendered="${escapeAttribute(target.url)}">${page.html}</div>`);
    if (html.includes('name="robots"')) {
      throw new Error(`Prerendered page ${target.url} still carries a robots meta tag`);
    }
    const outDir = outputDirFor(target.url);
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "index.html"), html);
  }

  await writeFile(path.join(dist, "robots.txt"), robotsTxt(siteOrigin));
  if (siteOrigin) {
    await writeFile(
      path.join(dist, "sitemap.xml"),
      sitemapXml(targets, siteOrigin, (publicPath) => alternateUrls(publicPath, siteOrigin)),
    );
  }

  console.log(
    `Prerendered ${targets.length} pages${siteOrigin ? ` for ${siteOrigin}` : " (no site origin: canonical, hreflang and sitemap skipped)"}.`,
  );
}

await main();
