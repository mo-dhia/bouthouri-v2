import assert from "node:assert/strict";
import experiments from "../src/sections/projects/2-experiment/experiments.json";
import { brand } from "../src/config/brand";

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
  const visible = markup.replace(/<[^>]*>/g, " ");
  assert.doesNotMatch(visible, /gazzar|elgazzar|محمد الجزار/i);
  assert.ok(visible.includes(locale === "ar" ? brand.arabicName : brand.name));
  assert.ok(visible.includes(brand.wordmark));
  assert.ok(markup.includes(`mailto:${brand.email}`));
  assert.ok(markup.includes(brand.linkedIn));
  assert.doesNotMatch(visible, /cairo|egypt|القاهرة|مصر/i);
  assert.ok(visible.includes(locale === "ar" ? brand.location.arabicCountry : brand.location.country.toUpperCase()));
  assert.ok(visible.includes(locale === "ar" ? brand.location.arabicCity : brand.location.city.toUpperCase()));
  assert.ok(markup.includes(`data-shell-clock="${brand.location.timeZone}"`));
  assert.ok(markup.includes(`data-footer-clock="${brand.location.timeZone}"`));
  assert.ok(html.includes(brand.name), "Metadata/schema should identify the new owner");
  assert.match(markup, /<h1[^>]*id="hero-name"/);
  assert.match(markup, /id="beyond"/);
  assert.match(markup, /id="work-wujhat-title"/);
  assert.match(markup, /id="work-8returns-title"/);
  assert.match(markup, /systems-human-copy/);
  assert.match(markup, /systems-ending/);
  assert.doesNotMatch(markup, /Create Next App|To get started|Deploy Now/);
  assert.match(markup, /<img[^>]*src="\/assets\/images\/hero-portrait-rebrand\.webp"/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /type="application\/ld\+json"/);
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll("&amp;", "&"), base);
    if (url.origin === base.origin && url.pathname.startsWith("/_next/static/")) assets.add(url.href);
  }
}

for (const locale of ["en", "ar"]) {
  for (const page of ["vision", "services", "contact", "projects"]) {
    const path = `/${locale}/${page}`;
    const response = await fetch(new URL(path, base));
    assert.equal(response.status, 200, path);
    const html = await response.text();
    const markup = html.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
    const visible = markup.replace(/<[^>]*>/g, " ");
    assert.match(markup, /<h1\b/, `${path}: SSR heading`);
    assert.match(markup, /<main\b/, `${path}: SSR main`);
    assert.ok(markup.includes(`data-page="${page}"`), `${path}: page identity`);
    assert.ok(markup.includes(`href="/${locale === "en" ? "ar" : "en"}/${page}"`), `${path}: locale retains route`);
    assert.ok(markup.includes(`mailto:${brand.email}`), `${path}: branded contact`);
    assert.ok(visible.includes(page === "projects" ? locale === "ar" ? brand.arabicName : brand.owner : brand.wordmark), `${path}: branded shell`);
    assert.doesNotMatch(visible, /gazzar|elgazzar|محمد الجزار/i, path);
    assert.match(html, new RegExp(`<link[^>]+rel="canonical"[^>]+href="[^"]*${path}"`), `${path}: canonical`);
    assert.ok(visible.length > (page === "projects" ? 600 : page === "contact" ? 1000 : 1800), `${path}: server copy`);
    if (page === "vision") { assert.equal((markup.match(/data-chapter-moment/g) || []).length, 3, `${path}: all three narrative moments`); assert.ok((markup.match(/<h2\b/g) || []).length >= 10, `${path}: all narrative headings`); }
    if (page === "services") assert.equal((markup.match(/class="[^"]*service-index-row[^"]*"/g) || []).length, 11, `${path}: all eleven complete service rows`);
    if (page === "contact") { assert.match(markup, /<form\b/); for (const name of ["name", "email", "message"]) assert.ok(markup.includes(`name="${name}"`), `${path}: SSR ${name}`); }
    if (page === "projects") {
      assert.match(markup, /data-projects-root/);
      assert.equal((markup.match(/data-grid-item/g) || []).length, 9, `${path}: all nine cards are server content`);
      assert.equal((markup.match(/data-reel="\/assets\/projects\/lab\//g) || []).length, 9, `${path}: deferred local reels`);
      assert.match(visible, /Carter Ogunsola/, `${path}: reference experiment attribution`);
      assert.doesNotMatch(markup, /lab__mode|lenis/, `${path}: excluded source controls/runtime`);
    }
    for (const match of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g)) {
      const url = new URL(match[1].replaceAll("&amp;", "&"), base);
      if (url.origin === base.origin && url.pathname.startsWith("/_next/static/")) assets.add(url.href);
    }
  }
}

for (const locale of ["en", "ar"]) for (const item of experiments) {
  const path = `/${locale}/projects/${item.slug}`, response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, path);
  const html = await response.text(), markup = html.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  assert.match(markup, /<h1[^>]*id="experiment-heading"/);
  assert.ok(markup.includes(`data-experiment="${item.slug}"`), path);
  assert.ok(markup.includes(item.name), `${path}: SSR experiment title`);
  assert.ok(markup.includes(`href="/${locale === "en" ? "ar" : "en"}/projects/${item.slug}"`), `${path}: locale retains the exact study`);
  assert.ok(markup.includes(`src="${item.poster}"`), `${path}: useful failure poster`);
  assert.match(markup, /data-config-controls/); assert.match(markup, /<details/);
  assert.ok(markup.includes(`href="/${locale}/projects"`), `${path}: grid navigation`);
  assert.match(html, new RegExp(`<link[^>]+rel="canonical"[^>]+href="[^"]*${path}"`));
  assert.ok(html.includes(brand.name), `${path}: branded metadata`);
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll("&amp;", "&"), base);
    if (url.origin === base.origin && url.pathname.startsWith("/_next/static/")) assets.add(url.href);
  }
}
for (const path of ["/en/projects/not-a-study", "/en/services/vocal-orb"]) assert.equal((await fetch(new URL(path, base))).status, 404, path);

for (const path of ["/fr", "/en/not-a-page"]) {
  assert.equal((await fetch(new URL(path, base))).status, 404, path);
}
for (const path of ["/robots.txt", "/sitemap.xml", "/icon.svg", "/assets/images/hero-portrait-rebrand.webp", "/assets/images/identity-logo.svg", "/assets/fonts/questrial-regular.woff2", "/assets/fonts/cairo-variable.woff2", "/assets/fonts/bouthouri-wordmark.woff"]) {
  assert.equal((await fetch(new URL(path, base))).status, 200, path);
}
await Promise.all([...assets].map(async (url) => {
  assert.equal((await fetch(url)).status, 200, url);
}));
process.stdout.write(`SSR audit passed: HOME, four editorial pages and nine experiment details in both locales, RTL, metadata, redirects, 404s, and ${assets.size} static assets.\n`);
