// Checks a deployed copy of the site over HTTP.
//
//   npm run check:prod -- <base URL>
//   npm run check:prod -- https://unlibra-com.example.workers.dev
//   npm run check:prod -- https://unlibra.com
//
// Checks (docs/deploy.md, sections 2 and 4):
// - every page in the sitemap answers 200
// - every rule of public/_redirects answers 301 with its destination
// - the headers of public/_headers are sent
// - robots.txt and sitemap-index.xml
// - no response comes from the former host (no x-vercel-id header)
// - the Cloudflare Web Analytics beacon in the HTML: shown as a warning only,
//   since it is inserted by Cloudflare's proxy, not by the site (P1-1)
//
// Prints one line per check and exits with 1 if any check failed.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { site } from "../src/config/site.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const BEACON = "static.cloudflareinsights.com/beacon.min.js";

/** Lines of a Cloudflare `_redirects` file: [source, destination, code]. */
export const parseRedirects = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => line.split(/\s+/));

/** Rules of a Cloudflare `_headers` file: [{ path, headers: [[name, value]] }]. */
export const parseHeaders = (text) => {
  const rules = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      rules.push({ path: line.trim(), headers: [] });
      continue;
    }
    // A header line before any path belongs to no rule: skipped.
    if (rules.length === 0) continue;
    const index = line.indexOf(":");
    rules
      .at(-1)
      .headers.push([
        line.slice(0, index).trim().toLowerCase(),
        line.slice(index + 1).trim(),
      ]);
  }
  return rules;
};

/** A URL to try for a redirect rule, and where it should lead. */
export const redirectSample = (source, destination) => {
  if (source.endsWith("/*")) {
    return [
      source.replace("*", "svg-optimizer"),
      destination.replace(":splat", "svg-optimizer"),
    ];
  }
  const placeholder = source.match(/:[A-Za-z]\w*/)?.[0];
  if (placeholder) {
    return [
      source.replace(placeholder, "favicon-generator"),
      destination.replace(placeholder, "favicon-generator"),
    ];
  }
  return [source, destination];
};

/**
 * Hints printed under a failed check: settings of the Cloudflare zone that
 * can change what the site sends (docs/deploy.md, 2.5). The checks
 * themselves stay exact.
 */
export const HINTS = {
  robots:
    "Cloudflare's managed robots.txt adds its lines before the site's; see docs/deploy.md 2.5",
  hsts: "the zone's HSTS / No-Sniff settings (Edge Certificates) also send these headers; see docs/deploy.md 2.5",
  cache:
    "the zone's Browser Cache TTL rewrites shorter Cache-Control values unless it is Respect Existing Headers; see docs/deploy.md 2.5",
  blocked:
    "403: bot protection (such as Bot Fight Mode) may be challenging this script; see docs/deploy.md 2.5",
};

/** Hints for the headers that differ from `_headers`. */
const headerHints = (names) => [
  ...(names.some(
    (n) => n === "strict-transport-security" || n === "x-content-type-options",
  )
    ? [HINTS.hsts]
    : []),
  ...(names.includes("cache-control") ? [HINTS.cache] : []),
];

const locs = (xml) =>
  [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);

/**
 * Runs every check against `base` and reports each through
 * `report(status, name, detail, hints)`.
 */
export async function checkSite(base, report) {
  const origin = new URL(base).origin;
  const fetched = [];
  const get = async (path) => {
    const response = await fetch(new URL(path, origin), {
      redirect: "manual",
    });
    fetched.push([path, response.headers.get("x-vercel-id")]);
    return response;
  };
  /**
   * Reports a check. On failure, `hints` and the bot protection hint (when
   * one of `responses` was 403) are reported with it.
   */
  const check = (ok, name, detail = "", { hints = [], responses = [] } = {}) =>
    ok
      ? report("ok", name, "", [])
      : report("fail", name, detail, [
          ...hints,
          ...(responses.some((r) => r?.status === 403) ? [HINTS.blocked] : []),
        ]);

  // robots.txt and the sitemap
  const robots = await get("/robots.txt");
  const robotsText = await robots.text();
  check(
    robots.status === 200 &&
      robotsText ===
        `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap-index.xml\n`,
    "robots.txt",
    `${robots.status}: ${JSON.stringify(robotsText)}`,
    {
      hints: robots.status === 200 ? [HINTS.robots] : [],
      responses: [robots],
    },
  );
  const index = await get("/sitemap-index.xml");
  const sitemaps = locs(await index.text());
  check(
    index.status === 200 &&
      sitemaps.length > 0 &&
      sitemaps.every((url) => url.startsWith(`${site.url}/`)),
    "sitemap-index.xml",
    `${index.status}: ${sitemaps.join(", ") || "no sitemaps"}`,
    { responses: [index] },
  );
  const pages = [];
  for (const sitemap of sitemaps) {
    const path = new URL(sitemap).pathname;
    const response = await get(path);
    const urls = locs(await response.text());
    check(
      response.status === 200 && urls.length > 0,
      path,
      `${response.status}, ${urls.length} pages`,
      { responses: [response] },
    );
    pages.push(...urls);
  }

  // Every page in the sitemap: on the site's URL, and 200 at `base`
  for (const url of pages) {
    const path = new URL(url).pathname;
    const response = await get(path);
    check(
      url.startsWith(`${site.url}/`) && response.status === 200,
      `page ${path}`,
      `${url}: ${response.status}`,
      { responses: [response] },
    );
  }

  // Redirects
  const redirects = parseRedirects(
    readFileSync(join(root, "public/_redirects"), "utf8"),
  );
  for (const [source, destination, code] of redirects) {
    const [from, to] = redirectSample(source, destination);
    const response = await get(from);
    const location = response.headers.get("location");
    const target = location && new URL(location, new URL(from, origin));
    const landing = await get(to);
    check(
      response.status === Number(code) &&
        target?.origin === origin &&
        target.pathname + target.hash === to &&
        landing.status === 200,
      `redirect ${from} -> ${to}`,
      `${response.status} ${location}, then ${landing.status}`,
      { responses: [response, landing] },
    );
  }

  // Headers
  const home = await get("/");
  const html = await home.text();
  const asset = html.match(/\/_astro\/[^"'\s)]+/)?.[0];
  for (const { path, headers } of parseHeaders(
    readFileSync(join(root, "public/_headers"), "utf8"),
  )) {
    let url = path;
    if (path === "/*") url = "/";
    else if (path === "/_astro/*") url = asset;
    if (!url || url.includes("*")) {
      check(false, `headers ${path}`, "no URL to check this rule with");
      continue;
    }
    const response = await get(url);
    const wrong = headers.filter(
      ([name, value]) => response.headers.get(name) !== value,
    );
    check(
      response.status === 200 && wrong.length === 0,
      `headers ${path} (${url})`,
      `${response.status}; ${wrong
        .map(([name]) => `${name}: ${response.headers.get(name)}`)
        .join("; ")}`,
      {
        hints: headerHints(wrong.map(([name]) => name)),
        responses: [response],
      },
    );
  }

  // Not served by the former host
  const fromFormerHost = fetched.filter(([, id]) => id !== null);
  check(
    fromFormerHost.length === 0,
    `no x-vercel-id (${fetched.length} responses)`,
    fromFormerHost.map(([path]) => path).join(", "),
  );

  // Web Analytics: a warning only
  report(
    html.includes(BEACON) ? "ok" : "warn",
    "Web Analytics beacon in /",
    html.includes(BEACON) ? "" : `${BEACON} is not in the HTML`,
    [],
  );
}

const main = async () => {
  const base = process.argv[2];
  if (!base || !/^https?:\/\//.test(base)) {
    console.error("Usage: npm run check:prod -- <base URL (http or https)>");
    process.exit(2);
  }
  let failed = 0;
  let warned = 0;
  await checkSite(base, (status, name, detail, hints) => {
    if (status === "fail") failed++;
    if (status === "warn") warned++;
    const label = { ok: "OK  ", fail: "FAIL", warn: "WARN" }[status];
    console.log(`${label} ${name}${detail ? ` — ${detail}` : ""}`);
    for (const hint of hints) console.log(`     hint: ${hint}`);
  });
  console.log(`\n${failed} failed, ${warned} warnings`);
  process.exit(failed > 0 ? 1 : 0);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
