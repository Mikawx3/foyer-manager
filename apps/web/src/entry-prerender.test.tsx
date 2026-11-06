import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prerenderTargets, renderPublicPage } from "./entry-prerender.tsx";

const SITE_ORIGIN = "https://allotwe.com";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("renderPublicPage", () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

  beforeAll(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: memoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  afterAll(() => {
    if (previousStorage) {
      Object.defineProperty(globalThis, "localStorage", previousStorage);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  it("renders the French home with its head", async () => {
    const page = await renderPublicPage({ locale: "fr", path: "/", url: "/" }, SITE_ORIGIN);
    expect(page.lang).toBe("fr");
    expect(page.title).toContain("Dépenses partagées");
    expect(page.html).toContain("Voir qui a payé, et qui doit quoi.");
    expect(page.html).toContain('href="/households/new"');
    expect(page.headHtml).toContain('<link rel="canonical" href="https://allotwe.com/" />');
    expect(page.headHtml).toContain('hreflang="en" href="https://allotwe.com/en"');
    expect(page.headHtml).toContain('"@type":"SoftwareApplication"');
  });

  it("renders the English use case under /en with localized links", async () => {
    const page = await renderPublicPage(
      { locale: "en", path: "/use/couple", url: "/en/use/couple" },
      SITE_ORIGIN,
    );
    expect(page.lang).toBe("en");
    expect(page.html).toContain("For a couple");
    expect(page.html).toContain('href="/en/compare"');
    expect(page.html).toContain('href="/en/privacy"');
    expect(page.headHtml).toContain('<link rel="canonical" href="https://allotwe.com/en/use/couple" />');
    expect(page.headHtml).toContain('<meta property="og:locale" content="en_US" />');
  });

  it("adds FAQPage structured data on the help page", async () => {
    const page = await renderPublicPage({ locale: "fr", path: "/help", url: "/help" }, SITE_ORIGIN);
    expect(page.headHtml).toContain('"@type":"FAQPage"');
    expect(page.headHtml).toContain("Qui peut voir un foyer");
  });

  it("omits canonical and hreflang without a site origin", async () => {
    const page = await renderPublicPage({ locale: "fr", path: "/", url: "/" }, null);
    expect(page.headHtml).not.toContain('rel="canonical"');
    expect(page.headHtml).not.toContain("hreflang");
    expect(page.html).toContain("Voir qui a payé");
  });

  it("renders every prerender target with real content", async () => {
    for (const target of prerenderTargets()) {
      const page = await renderPublicPage(target, SITE_ORIGIN);
      expect(page.html.length, target.url).toBeGreaterThan(500);
      expect(page.html, target.url).toContain("<h1");
      expect(page.headHtml, target.url).toContain(`<link rel="canonical" href="${SITE_ORIGIN}${target.url}" />`);
    }
  });
});
