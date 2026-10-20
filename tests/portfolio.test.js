// Integration tests for the portfolio top page (Phase 3) against dist/.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, globSync, readFileSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const readDist = (path) => readFileSync(join(dist, path), "utf8");
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*>/g)].map((m) => attr(m[0], "href"));
/** Text content with tags removed. */
const text = (html) => html.replace(/<[^>]*>/g, "").trim();

const SHOP = "https://unlibra-twin.booth.pm/";
const CATEGORIES = [
  ["keyboard", "自作キーボード"],
  ["software", "ソフトウェア"],
  ["web", "WEBツール"],
  ["vrchat", "VRChat"],
];
const TOOLS = [
  "tw-palette-generator",
  "favicon-generator",
  "svg-optimizer",
  "password-generator",
];

const top = readDist("index.html");

/** The <section id="..."> of a category on the top page. */
const sectionOf = (id) => {
  const sections = top.match(
    new RegExp(`<section[^>]*\\sid="${id}"[\\s\\S]*?</section>`, "g"),
  );
  assert.equal(sections?.length, 1, `section #${id} count`);
  return sections[0];
};

/** Work cards (<article>) in a piece of HTML. */
const cardsOf = (html) =>
  [...html.matchAll(/<article\s[^>]*>[\s\S]*?<\/article>/g)].map((m) => m[0]);

test("D2: the top page has the four category sections in order", () => {
  const ids = [...top.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(
    ids,
    CATEGORIES.map(([id]) => id),
  );
  for (const [id, label] of CATEGORIES) {
    const heading = sectionOf(id).match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    assert.equal(text(heading[1]), label, `#${id} heading`);
    assert.ok(cardsOf(sectionOf(id)).length > 0, `#${id} has works`);
  }
});

test("D2: the top page links to each category section", () => {
  const navs = [...top.matchAll(/<nav\s[^>]*>[\s\S]*?<\/nav>/g)]
    .map((m) => m[0])
    .filter((nav) => /href="#/.test(nav));
  assert.equal(navs.length, 1, "category navigation count");
  const anchors = [...navs[0].matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map(
    (m) => [attr(m[0], "href"), text(m[1])],
  );
  assert.deepEqual(
    anchors,
    CATEGORIES.map(([id, label]) => [`#${id}`, label]),
  );
});

test("D3: the web tools section links to the four tools under /lab", () => {
  const cards = cardsOf(sectionOf("web"));
  assert.equal(cards.length, TOOLS.length);
  assert.deepEqual(
    cards.map((card) => hrefs(card)),
    TOOLS.map((tool) => [`/lab/${tool}`]),
  );
  // Internal links open in the same tab.
  for (const card of cards) assert.doesNotMatch(card, /target="_blank"/);
});

test("D4: the VRChat section has one dummy work per subcategory and the shop link", () => {
  const section = sectionOf("vrchat");
  const cards = cardsOf(section);
  assert.deepEqual(
    cards.map((card) => attr(card, "data-subcategory")),
    ["avatar", "asset", "unity-tool"],
  );
  const labels = {
    avatar: "アバター",
    asset: "アセット",
    "unity-tool": "Unityツール",
  };
  for (const card of cards) {
    const subcategory = attr(card, "data-subcategory");
    assert.ok(
      text(card).includes(labels[subcategory]),
      `${subcategory}: label`,
    );
    const title = text(card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]);
    assert.match(title, /ダミー/, `${subcategory}: title`);
    assert.deepEqual(hrefs(card), [SHOP], `${subcategory}: link`);
  }
  // The shop link outside the cards.
  const outside = cardsOf(section).reduce(
    (s, card) => s.replace(card, ""),
    section,
  );
  assert.ok(hrefs(outside).includes(SHOP), "shop link in the section");
});

test("D4: only VRChat works have a subcategory", () => {
  const all = cardsOf(top);
  assert.ok(all.length > 0);
  const vrchat = new Set(cardsOf(sectionOf("vrchat")));
  for (const card of all) {
    if (vrchat.has(card)) continue;
    assert.equal(
      attr(card, "data-subcategory"),
      undefined,
      attr(card, "data-work"),
    );
  }
});

test("D5: the three documentation links point to docs.unlibra.com", () => {
  const docs = hrefs(top).filter((href) => /docs|github\.io/.test(href));
  assert.deepEqual(docs.sort(), [
    "https://docs.unlibra.com/i18n-tiny/astro/introduction",
    "https://docs.unlibra.com/i18n-tiny/next/introduction",
    "https://docs.unlibra.com/tkinter-unblur/",
  ]);
});

/** Source files tracked or untracked-but-not-ignored, outside docs/ and tests/. */
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
    .filter((p) => !/\.(png|webp|jpe?g|gif|ico|woff2?)$/i.test(p));

const distTextFiles = () =>
  globSync("**/*.{html,xml,txt,js,css,json,svg}", { cwd: dist })
    .concat(["_headers"])
    .map((p) => p.split(sep).join("/"));

test("D5: no unlibra.github.io URLs remain in the source and dist/", () => {
  const pattern = /unlibra\.github\.io/;
  const found = (base, files) =>
    files.filter((p) => pattern.test(readFileSync(join(base, p), "utf8")));
  assert.deepEqual(found(dist, distTextFiles()), []);
  assert.deepEqual(found(root, sourceTextFiles()), []);
});

/** All files under a directory as posix-style relative paths. */
const allFiles = (base, dir) =>
  globSync(`${dir}/**/*`, { cwd: base })
    .filter((p) => statSync(join(base, p)).isFile())
    .map((p) => p.split(sep).join("/"));

const isText = (p) =>
  p === "_headers" ||
  /\.(astro|ts|js|mjs|css|md|html|xml|txt|json|svg)$/i.test(p);

test("D6: the removed works and X-style wording do not remain in src/ and dist/", () => {
  // `/lab` links and tool IDs contain none of these.
  const pattern = /liblab|lib lab|iromide|イロマイド|Xオマージュ|パロディ/i;
  const found = [
    ...allFiles(root, "src").map((p) => [root, p]),
    ...allFiles(dist, ".").map((p) => [dist, p]),
  ].filter(
    ([base, p]) =>
      pattern.test(p) ||
      (isText(p) && pattern.test(readFileSync(join(base, p), "utf8"))),
  );
  assert.deepEqual(
    found.map(([base, p]) => (base === dist ? `dist/${p}` : p)),
    [],
  );
});

test("D6: the X-style page parts and tokens are removed", () => {
  for (const marker of [
    /id="share-btn"/,
    /role="tablist"/,
    /end-of-timeline/,
    /pinned/,
    /Updated/,
  ]) {
    assert.doesNotMatch(top, marker);
  }

  const css = globSync("_astro/*.css", { cwd: dist })
    .map((p) => readDist(p))
    .join("\n");
  assert.ok(css.length > 0, "no CSS in dist/_astro");
  assert.doesNotMatch(
    css,
    /--color-(base|accent)-|--text-x-|\.pinned-label|pinned-mode/,
  );

  for (const path of [
    "src/assets/icon.svg",
    "src/components/icons/ShareIcon.astro",
    "src/components/icons/ParodyIcon.astro",
    "src/components/icons/PinIcon.astro",
    "src/components/icons/CalendarIcon.astro",
    "src/components/icons/LocationIcon.astro",
  ]) {
    assert.equal(existsSync(join(root, path)), false, path);
  }
});
