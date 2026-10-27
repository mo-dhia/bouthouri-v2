import assert from "node:assert/strict";

const base = new URL(process.argv[2] || "http://localhost:3000");
const root = await fetch(base, { redirect: "manual" });
assert.equal(root.status, 307, "The root should redirect to the default locale.");
assert.equal(new URL(root.headers.get("location")!, base).pathname, "/en");
const assets = new Set<string>();

for (const locale of ["en", "ar"]) {
  const response = await fetch(new URL(`/${locale}`, base));
  assert.equal(response.status, 200);
  const html = await response.text();
  const markup = html.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  assert.match(markup, new RegExp(`<html[^>]*lang="${locale}"[^>]*dir="${locale === "ar" ? "rtl" : "ltr"}"`));
  assert.match(markup, /<main\b/);
  assert.match(markup, /<h1[^>]*id="hero-name"/);
  assert.match(markup, /id="beyond"/);
  assert.match(markup, /id="work-wujhat-title"/);
  assert.match(markup, /id="work-8returns-title"/);
  assert.match(markup, /systems-human-copy/);
  assert.match(markup, /systems-ending/);
  assert.doesNotMatch(markup, /Create Next App|To get started|Deploy Now/);
  assert.doesNotMatch(markup, /Bouthouri|البوثوري/);
  assert.match(markup, /<img[^>]*src="\/assets\/images\/hero-portrait\.webp"/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /type="application\/ld\+json"/);
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll("&amp;", "&"), base);
    if (url.origin === base.origin && url.pathname.startsWith("/_next/static/")) assets.add(url.href);
  }
}

for (const path of ["/fr", "/en/not-a-page"]) {
  assert.equal((await fetch(new URL(path, base))).status, 404, path);
}
for (const path of ["/robots.txt", "/sitemap.xml", "/icon.svg", "/assets/images/hero-portrait.webp", "/assets/images/gazzar-logo.svg", "/assets/fonts/questrial-regular.woff2", "/assets/fonts/cairo-variable.woff2"]) {
  assert.equal((await fetch(new URL(path, base))).status, 200, path);
}
await Promise.all([...assets].map(async (url) => {
  assert.equal((await fetch(url)).status, 200, url);
}));
process.stdout.write(`SSR audit passed: both locales, RTL, metadata, redirects, 404s, and ${assets.size} static assets.\n`);
