// Tests for public/_redirects (Phase 6), read from the build output.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

if (!existsSync(join(dist, "_redirects"))) {
  throw new Error(
    "dist/_redirects not found. Run `npm run build` before `npm test`.",
  );
}

const TOOLS = [
  "tw-palette-generator",
  "favicon-generator",
  "svg-optimizer",
  "password-generator",
];

/** Former URLs and their new URLs (design doc 3.2, and P1-4 for the sitemap). */
const EXPECTED = [
  ["/ja", "/"],
  ["/en", "/"],
  ["/lab/ja", "/lab"],
  ["/lab/ja/*", "/lab/:splat"],
  ["/lab/en", "/en/lab"],
  ["/lab/en/*", "/en/lab/:splat"],
  ["/sitemap.xml", "/sitemap-index.xml"],
];

const isDynamic = (source) => /[*:]/.test(source);

/** Parses Cloudflare `_redirects` into [{ source, destination, code, line }]. */
const parseRedirects = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => {
      const [source, destination, code, ...rest] = line.split(/\s+/);
      return { source, destination, code, rest, line };
    });

const rules = parseRedirects(readFileSync(join(dist, "_redirects"), "utf8"));

/** Source pattern as a RegExp: `*` is greedy, `:name` stops at a slash. */
const sourcePattern = (source) => {
  const names = [];
  const body = source
    .split(/(\*|:[A-Za-z]\w*)/)
    .map((part) => {
      if (part === "*") {
        names.push("splat");
        return "(.*)";
      }
      if (/^:[A-Za-z]\w*$/.test(part)) {
        names.push(part.slice(1));
        return "([^/]+)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return { regexp: new RegExp(`^${body}$`), names };
};

/**
 * Applies the rules the way Workers does: static rules first, then dynamic
 * rules in file order; the first match wins. Returns the destination or null.
 */
const resolve = (path) => {
  const ordered = [
    ...rules.filter((r) => !isDynamic(r.source)),
    ...rules.filter((r) => isDynamic(r.source)),
  ];
  for (const { source, destination } of ordered) {
    const { regexp, names } = sourcePattern(source);
    const match = regexp.exec(path);
    if (!match) continue;
    return names.reduce(
      (dest, name, i) => dest.replace(`:${name}`, match[i + 1]),
      destination,
    );
  }
  return null;
};

/** URL paths of everything served from dist/ (pages without the slash). */
const servedPaths = () =>
  globSync("**/*", { cwd: dist, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      join(entry.parentPath, entry.name)
        .slice(dist.length)
        .split(sep)
        .join("/"),
    )
    .filter((path) => !["/_headers", "/_redirects"].includes(path))
    .map((path) => path.replace(/\/index\.html$/, "") || "/");

/** Whether a new URL path is a page or file in dist/. */
const existsInDist = (path) =>
  path === "/"
    ? existsSync(join(dist, "index.html"))
    : existsSync(join(dist, path, "index.html")) ||
      (/\.\w+$/.test(path) && existsSync(join(dist, path)));

test("G2: every line is a well-formed 301 redirect", () => {
  assert.ok(rules.length > 0);
  for (const { source, destination, code, rest, line } of rules) {
    // Workers ignores malformed lines silently, so check the shape here.
    assert.equal(rest.length, 0, `extra fields: ${line}`);
    assert.match(source, /^\//, `source must be a path: ${line}`);
    assert.match(destination, /^\//, `destination must be a path: ${line}`);
    assert.equal(code, "301", `status must be 301: ${line}`);
  }
});

test("G2: static rules come before dynamic rules, without duplicates", () => {
  const firstDynamic = rules.findIndex((r) => isDynamic(r.source));
  const lastStatic = rules.findLastIndex((r) => !isDynamic(r.source));
  assert.ok(firstDynamic === -1 || lastStatic < firstDynamic);
  const sources = rules.map((r) => r.source);
  assert.deepEqual(sources, [...new Set(sources)]);
});

test("G2: every former URL in design doc 3.2 redirects as listed", () => {
  for (const [source, destination] of EXPECTED) {
    const rule = rules.find((r) => r.source === source);
    assert.ok(rule, `${source} is missing`);
    assert.equal(rule.destination, destination, source);
    assert.equal(rule.code, "301", source);
  }
});

test("G2: former URLs reach the new URL in one hop, with or without a trailing slash", () => {
  const cases = [
    ["/ja", "/"],
    ["/en", "/"],
    ["/lab/ja", "/lab"],
    ["/lab/en", "/en/lab"],
    ...TOOLS.flatMap((tool) => [
      [`/lab/ja/${tool}`, `/lab/${tool}`],
      [`/lab/en/${tool}`, `/en/lab/${tool}`],
    ]),
  ];
  for (const [from, to] of cases) {
    assert.equal(resolve(from), to, from);
    assert.equal(resolve(`${from}/`), to, `${from}/`);
  }
  assert.equal(resolve("/sitemap.xml"), "/sitemap-index.xml");
});

test("G2: redirect destinations exist in the build output", () => {
  for (const { source, destination } of rules) {
    // For a splat or placeholder, the part before it must exist (/lab, /en/lab).
    const base = destination.split(/\/(?=\*|:[A-Za-z])/)[0] || "/";
    assert.ok(existsInDist(base), `${source} -> ${destination}: ${base}`);
  }
  for (const tool of TOOLS) {
    for (const from of [`/lab/ja/${tool}`, `/lab/en/${tool}`]) {
      assert.ok(existsInDist(resolve(from)), `${from} -> ${resolve(from)}`);
    }
  }
});

test("G2: the removed Iromide is forwarded by the bulk rules to a missing page", () => {
  // Design doc 3.2: no rule of its own; 301 by the bulk rule, then 404.
  assert.ok(!rules.some((r) => r.source.includes("iromide")));
  assert.equal(resolve("/lab/ja/iromide"), "/lab/iromide");
  assert.equal(resolve("/lab/en/iromide"), "/en/lab/iromide");
  assert.equal(existsInDist("/lab/iromide"), false);
  assert.equal(existsInDist("/en/lab/iromide"), false);
});

test("G2: no redirect shadows a page or file of the new site", () => {
  const paths = servedPaths();
  assert.ok(paths.includes("/lab/svg-optimizer"), "self-check of servedPaths");
  for (const path of paths) {
    for (const candidate of new Set([path, `${path}/`.replace("//", "/")])) {
      assert.equal(resolve(candidate), null, `${candidate} is redirected`);
    }
  }
});
