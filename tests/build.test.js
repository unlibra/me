// Integration tests against the build output (dist/) and repository files.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = "https://unlibra.com";

const readDist = (path) => readFileSync(join(dist, path), "utf8");

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

/** Text files in dist/ (posix-style paths relative to dist/). */
const distTextFiles = () =>
  globSync("**/*.{html,xml,txt,js,css,json}", { cwd: dist })
    .concat(["_headers"])
    .map((p) => p.split(sep).join("/"));

/**
 * Source files: tracked and untracked-but-not-ignored files in the repository.
 * Excluded:
 * - docs/: design documents describe what is being removed
 * - tests/: these tests must name the strings they look for
 * - package-lock.json: generated; lists optional peer dependencies of
 *   third-party packages that we do not control
 * - binary files
 */
const sourceTextFiles = () =>
  execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .filter((p) => existsSync(join(root, p)))
    .filter((p) => !p.startsWith("docs/") && !p.startsWith("tests/"))
    .filter((p) => p !== "package-lock.json")
    .filter((p) => !/\.(png|webp|jpe?g|gif|ico|woff2?)$/i.test(p));

const findOccurrences = (baseDir, files, pattern) =>
  files.filter((p) => pattern.test(readFileSync(join(baseDir, p), "utf8")));

/** Parses Cloudflare `_headers` into { path: { headerName: value } }. */
const parseHeaders = (text) => {
  const rules = {};
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    if (/^\s/.test(line)) {
      assert.ok(current, `header line without a path: ${line}`);
      const index = line.indexOf(":");
      const name = line.slice(0, index).trim().toLowerCase();
      rules[current][name] = line.slice(index + 1).trim();
    } else {
      current = line.trim();
      rules[current] ??= {};
    }
  }
  return rules;
};

/** Parses JSONC (comments and trailing commas), respecting string literals. */
const parseJsonc = (text) => {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      let j = i + 1;
      while (text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (text.startsWith("//", i)) {
      while (i < text.length && text[i] !== "\n") i++;
    } else if (text.startsWith("/*", i)) {
      i = text.indexOf("*/", i + 2) + 2;
    } else {
      out += ch;
      i++;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
};

const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

test("A2: build output has the expected pages and files", () => {
  for (const path of [
    "index.html",
    "404.html",
    "privacy/index.html",
    "robots.txt",
    "sitemap-index.xml",
    "_headers",
  ]) {
    assert.ok(existsSync(join(dist, path)), `dist/${path} is missing`);
  }
});

test("A3: build output has no locale-prefixed pages", () => {
  for (const locale of ["ja", "en"]) {
    assert.equal(existsSync(join(dist, locale)), false, `dist/${locale}/`);
    assert.equal(existsSync(join(dist, `${locale}.html`)), false);
  }
  const sitemap = readDist("sitemap-0.xml");
  assert.doesNotMatch(sitemap, /unlibra\.com\/(ja|en)\b/);
});

test("A4: no Vercel references in build output and source", () => {
  const pattern = /vercel/i;
  assert.deepEqual(findOccurrences(dist, distTextFiles(), pattern), []);
  assert.deepEqual(findOccurrences(root, sourceTextFiles(), pattern), []);

  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  for (const field of ["dependencies", "devDependencies"]) {
    assert.equal(pkg[field]?.["@vercel/analytics"], undefined, field);
  }
});

test("A5: no mirror-site environment variables are referenced", () => {
  const pattern =
    /PUBLIC_SITE_URL|PUBLIC_SITE_TITLE|PUBLIC_PROFILE_NAME|PUBLIC_PROFILE_USERNAME|DISABLE_ROBOTS/;
  assert.deepEqual(findOccurrences(dist, distTextFiles(), pattern), []);
  assert.deepEqual(findOccurrences(root, sourceTextFiles(), pattern), []);
});

test("A6: robots.txt allows all and points to sitemap-index.xml", () => {
  const lines = readDist("robots.txt")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  assert.deepEqual(lines, [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${SITE}/sitemap-index.xml`,
  ]);
});

test("A6: sitemap lists the top page and privacy only", () => {
  assert.match(
    readDist("sitemap-index.xml"),
    new RegExp(`<loc>${SITE}/sitemap-0\\.xml</loc>`),
  );
  const locs = [...readDist("sitemap-0.xml").matchAll(/<loc>([^<]*)<\/loc>/g)]
    .map((m) => m[1])
    .sort();
  // @astrojs/sitemap 3.7.4+ writes the origin-only URL with "/", which is
  // the same resource as the canonical URL without it.
  assert.deepEqual(locs, [`${SITE}/`, `${SITE}/privacy`]);
});

test("A7: index.html canonical and og:url point to the site root, no hreflang", () => {
  const html = readDist("index.html");

  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*>/g) ?? [];
  assert.equal(canonical.length, 1);
  assert.equal(attr(canonical[0], "href"), SITE);

  const ogUrl = html.match(/<meta[^>]*property="og:url"[^>]*>/g) ?? [];
  assert.equal(ogUrl.length, 1);
  assert.equal(attr(ogUrl[0], "content"), SITE);

  assert.doesNotMatch(html, /hreflang/i);
  assert.match(html, /<html[^>]*lang="ja"/);
});

test("A8: _headers has the security headers and immutable cache for /_astro/*", () => {
  const text = readDist("_headers");
  const rules = parseHeaders(text);

  assert.deepEqual(rules["/*"], {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "x-xss-protection": "1; mode=block",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  });
  assert.equal(
    rules["/_astro/*"]?.["cache-control"],
    "public, max-age=31536000, immutable",
  );
  assert.doesNotMatch(text, /no-transform/i);
});

test("A9: wrangler.jsonc serves dist/ as static assets without a Worker script", () => {
  const config = parseJsonc(readFileSync(join(root, "wrangler.jsonc"), "utf8"));

  assert.equal(config.name, "unlibra-com");
  assert.equal(config.main, undefined);
  assert.deepEqual(config.assets, {
    directory: "./dist",
    html_handling: "drop-trailing-slash",
    not_found_handling: "404-page",
  });

  // The latest date the installed runtime supports is encoded in the
  // workerd version (1.YYYYMMDD.x).
  assert.match(config.compatibility_date, /^\d{4}-\d{2}-\d{2}$/);
  const workerd = JSON.parse(
    readFileSync(join(root, "node_modules/workerd/package.json"), "utf8"),
  );
  const [, ymd] = workerd.version.split(".");
  const supported = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
  assert.ok(
    config.compatibility_date <= supported,
    `${config.compatibility_date} is newer than ${supported}`,
  );

  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.ok(
    Object.values(pkg.scripts).some((s) => /^wrangler dev\b/.test(s)),
    "package.json has no script running `wrangler dev`",
  );
});

test("index.html footer keeps the space between the year and the name", () => {
  // Astro 7 compresses whitespace between expressions (compressHTML: "jsx").
  assert.match(readDist("index.html"), /(?:&copy;|©) \d{4} unlibra</);
});

test("404 page links back to the top page in Japanese and English", () => {
  const html = readDist("404.html");
  assert.match(html, /ページが見つかりません/);
  assert.match(html, /Page not found/);
  assert.match(html, /<a[^>]*href="\/"/);
});
