import { describe, expect, it } from "vitest";
import { buildSeoHead, renderSeoHeadHtml, serializeJsonLd } from "./seo-head.ts";

const base = {
  title: "Pour un couple — Allotwe",
  description: "Un foyer pour deux.",
  appName: "Allotwe",
  siteOrigin: "https://allotwe.com",
} as const;

describe("buildSeoHead", () => {
  it("builds a localized canonical and hreflang set", () => {
    const head = buildSeoHead({ ...base, locale: "en", path: "/use/couple" });
    expect(head.lang).toBe("en");
    expect(head.canonical).toBe("https://allotwe.com/en/use/couple");
    expect(head.alternates).toEqual([
      { hrefLang: "fr", href: "https://allotwe.com/use/couple" },
      { hrefLang: "en", href: "https://allotwe.com/en/use/couple" },
      { hrefLang: "x-default", href: "https://allotwe.com/en/use/couple" },
    ]);
    expect(head.meta).toContainEqual({ attribute: "property", key: "og:url", content: head.canonical });
    expect(head.meta).toContainEqual({ attribute: "property", key: "og:locale", content: "en_US" });
    expect(head.meta).toContainEqual({
      attribute: "property",
      key: "og:locale:alternate",
      content: "fr_FR",
    });
    expect(head.meta).toContainEqual({
      attribute: "property",
      key: "og:image",
      content: "https://allotwe.com/og.png",
    });
  });

  it("omits canonical, hreflang and og:url without a site origin", () => {
    const head = buildSeoHead({ ...base, siteOrigin: null, locale: "fr", path: "/help" });
    expect(head.canonical).toBeNull();
    expect(head.alternates).toEqual([]);
    expect(head.meta.find((tag) => tag.key === "og:url")).toBeUndefined();
    expect(head.meta.find((tag) => tag.key === "og:image")).toBeUndefined();
    expect(head.meta).toContainEqual({ attribute: "name", key: "description", content: base.description });
  });

  it("adds SoftwareApplication structured data on the home page only", () => {
    const home = buildSeoHead({ ...base, locale: "fr", path: "/" });
    expect(home.jsonLd).toHaveLength(1);
    expect(home.jsonLd[0]).toMatchObject({
      "@type": "SoftwareApplication",
      url: "https://allotwe.com/",
      inLanguage: "fr",
    });
    const privacy = buildSeoHead({ ...base, locale: "fr", path: "/privacy" });
    expect(privacy.jsonLd).toEqual([]);
  });

  it("adds FAQPage structured data when questions are given", () => {
    const head = buildSeoHead({
      ...base,
      locale: "fr",
      path: "/help",
      faq: [{ question: "Qui voit un foyer ?", answer: "Les personnes invitées." }],
    });
    expect(head.jsonLd).toHaveLength(1);
    expect(head.jsonLd[0]).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Qui voit un foyer ?",
          acceptedAnswer: { "@type": "Answer", text: "Les personnes invitées." },
        },
      ],
    });
  });
});

describe("renderSeoHeadHtml", () => {
  it("escapes attribute values and inlines JSON-LD safely", () => {
    const head = buildSeoHead({
      ...base,
      title: 'A "quoted" <title>',
      description: "Tom & Jerry",
      locale: "fr",
      path: "/",
    });
    const html = renderSeoHeadHtml(head);
    expect(html).toContain('content="A &quot;quoted&quot; &lt;title&gt;"');
    expect(html).toContain('content="Tom &amp; Jerry"');
    expect(html).toContain('<link rel="canonical" href="https://allotwe.com/" />');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://allotwe.com/en" />');
    expect(html).toContain('<script type="application/ld+json" data-seo="1">');
    expect(html).not.toContain("</script><");
  });

  it("neutralizes closing tags inside JSON-LD", () => {
    expect(serializeJsonLd({ text: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
