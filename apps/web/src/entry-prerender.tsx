import type { AppConfig } from "@foyer/types";
import { renderToString } from "react-dom/server";
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router-dom";
import { AppProviders, createAppQueryClient } from "./AppProviders.tsx";
import { SeoHeadCollectorContext, type SeoHeadCollector } from "./hooks/usePageMeta.ts";
import i18n from "./i18n.ts";
import {
  alternateUrls,
  prerenderTargets,
  type PrerenderTarget,
  type PublicLocale,
} from "./lib/public-routes.ts";
import { queryKeys } from "./lib/query-keys.ts";
import { renderSeoHeadHtml } from "./lib/seo-head.ts";
import { routes } from "./routes.tsx";

export { alternateUrls, prerenderTargets };
export type { PrerenderTarget };

export interface PrerenderedPage {
  /** Markup for `#root`. */
  html: string;
  /** `<meta>`, `<link>` and JSON-LD tags for `<head>` (title excluded). */
  headHtml: string;
  title: string;
  lang: PublicLocale;
}

/** The public site is the hosted (cloud) deployment: sign-in and "create a household" links are shown. */
const PRERENDER_CONFIG: AppConfig = { deploymentMode: "cloud", googleClientId: null };

/**
 * Renders one public page to static HTML. The prerender script calls this for
 * every entry of `prerenderTargets()` and writes the result into `dist/`.
 */
export async function renderPublicPage(
  target: PrerenderTarget,
  siteOrigin: string | null,
): Promise<PrerenderedPage> {
  await i18n.changeLanguage(target.locale);

  const handler = createStaticHandler(routes);
  const context = await handler.query(new Request(`http://prerender.local${target.url}`));
  if (context instanceof Response) {
    throw new Error(`Unexpected response while prerendering ${target.url}: ${context.status}`);
  }
  const router = createStaticRouter(handler.dataRoutes, context);

  const queryClient = createAppQueryClient();
  queryClient.setQueryData(queryKeys.config, PRERENDER_CONFIG);

  const collector: SeoHeadCollector = { head: null, siteOrigin };
  const html = renderToString(
    <SeoHeadCollectorContext.Provider value={collector}>
      <AppProviders queryClient={queryClient}>
        <StaticRouterProvider router={router} context={context} hydrate={false} />
      </AppProviders>
    </SeoHeadCollectorContext.Provider>,
  );
  queryClient.clear();

  if (!collector.head) {
    throw new Error(`Page ${target.url} did not publish its head (usePageMeta missing?)`);
  }

  return {
    html,
    headHtml: renderSeoHeadHtml(collector.head),
    title: collector.head.title,
    lang: collector.head.lang,
  };
}
