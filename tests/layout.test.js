// Integration tests for the common layout (Phase 2) against dist/.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import {
  cmapCharacters,
  glyphCount,
  nameOf,
  woff2Tables,
} from "./helpers/woff2.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = "https://unlibra.com";

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const readDist = (path) => readFileSync(join(dist, path), "utf8");
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

/** HTML files in dist/ as posix-style paths relative to dist/. */
const htmlPages = () =>
  globSync("**/*.html", { cwd: dist })
    .map((p) => p.split(sep).join("/"))
    .sort();

/** "index.html" -> "/", "privacy/index.html" -> "/privacy". */
const pathOf = (file) => "/" + file.replace(/(^|\/)index\.html$/, "");

const head = (html) => {
  const match = html.match(/<head>([\s\S]*?)<\/head>/);
  assert.ok(match, "no <head>");
  return match[1];
};

/** Inline <script> bodies (no src attribute) in the order they appear. */
const inlineScripts = (html) =>
  [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => ({ index: m.index, tag: m[0], body: m[1] }),
  );

const isThemeInit = (body) =>
  body.includes("localStorage") && /classList\.toggle\("dark"/.test(body);

test("the build has the pages this test suite expects", () => {
  // Guards against the checks below passing on an empty page list.
  const tools = [
    "favicon-generator",
    "password-generator",
    "svg-optimizer",
    "tw-palette-generator",
  ];
  assert.deepEqual(
    htmlPages(),
    [
      "404.html",
      ...tools.map((tool) => `en/lab/${tool}/index.html`),
      "index.html",
      ...tools.map((tool) => `lab/${tool}/index.html`),
      "privacy/index.html",
    ].sort(),
  );
});

/**
 * The pages with the header and the footer: all but the 404 page, which
 * fills the screen by itself (not-found).
 */
const BARE_PAGES = ["404.html"];
const chromePages = () =>
  htmlPages().filter((file) => !BARE_PAGES.includes(file));

test("not-found: the 404 page has no header, no footer and no logotype", () => {
  const html = readDist("404.html");
  assert.doesNotMatch(html, /<header[\s>]|<footer[\s>]|id="mobile-menu"/);
  assert.doesNotMatch(html, /data-logotype|font-brand|data-theme-option/);
  assert.equal(chromePages().length, htmlPages().length - 1, "self-check");
});

/** Language of a page: English under /en (the tool pages), otherwise ja. */
const langOf = (file) => (file.startsWith("en/") ? "en" : "ja");

/** Pages that exist in one language only. */
const singleLanguagePages = ["404.html", "index.html", "privacy/index.html"];

test("C2: pages other than 404 have exactly one canonical and a matching og:url", () => {
  for (const file of htmlPages().filter((f) => f !== "404.html")) {
    const html = head(readDist(file));
    const expected = SITE + pathOf(file).replace(/\/$/, "");
    assert.doesNotMatch(expected, /\/$/);

    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*>/g) ?? [];
    assert.equal(canonical.length, 1, `${file}: canonical count`);
    assert.equal(attr(canonical[0], "href"), expected, `${file}: canonical`);

    const ogUrl = html.match(/<meta[^>]*property="og:url"[^>]*>/g) ?? [];
    assert.equal(ogUrl.length, 1, `${file}: og:url count`);
    assert.equal(attr(ogUrl[0], "content"), expected, `${file}: og:url`);
  }
});

test("C2: the 404 page has neither canonical nor og:url", () => {
  const html = readDist("404.html");
  assert.doesNotMatch(html, /rel="canonical"/);
  assert.doesNotMatch(html, /property="og:url"/);
});

test("pages have title, description, OGP and Twitter card metadata", () => {
  for (const file of htmlPages()) {
    const html = head(readDist(file));
    assert.match(html, /<title>[^<]+<\/title>/, file);
    for (const [key, name] of [
      ["name", "description"],
      ["property", "og:title"],
      ["property", "og:description"],
      ["property", "og:image"],
      ["property", "og:site_name"],
      ["name", "twitter:card"],
      ["name", "twitter:image"],
    ]) {
      const tags = html.match(
        new RegExp(`<meta[^>]*${key}="${name}"[^>]*>`, "g"),
      );
      assert.equal(tags?.length, 1, `${file}: ${name}`);
      assert.ok(attr(tags[0], "content"), `${file}: ${name} is empty`);
    }
    const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*>/)[0];
    assert.equal(attr(ogImage, "content"), `${SITE}/ogp.png`, file);
    assert.match(
      readDist(file),
      new RegExp(`<html[^>]*lang="${langOf(file)}"`),
      file,
    );
  }
});

test("C3: the theme init script comes before any stylesheet in <head>", () => {
  for (const file of htmlPages()) {
    const html = head(readDist(file));
    const scripts = inlineScripts(html).filter((s) => isThemeInit(s.body));
    assert.equal(scripts.length, 1, `${file}: theme init script count`);
    assert.doesNotMatch(scripts[0].tag, /type="module"/, file);

    const styles = [
      html.search(/<link[^>]*rel="stylesheet"/),
      html.search(/<style[\s>]/),
    ].filter((i) => i >= 0);
    assert.ok(styles.length > 0, `${file}: no stylesheet in <head>`);
    assert.ok(
      scripts[0].index < Math.min(...styles),
      `${file}: theme init script is after a stylesheet`,
    );
  }
});

/** Runs the theme init script with a fake browser environment. */
const runThemeInit = ({ stored, systemDark, storageThrows = false }) => {
  const script = inlineScripts(head(readDist("index.html"))).find((s) =>
    isThemeInit(s.body),
  ).body;
  const classes = new Set();
  const context = {
    matchMedia: (query) => ({
      matches: query === "(prefers-color-scheme: dark)" && systemDark,
    }),
    document: {
      documentElement: {
        classList: {
          toggle: (name, force) => {
            if (force) classes.add(name);
            else classes.delete(name);
          },
        },
      },
    },
  };
  context.window = context;
  Object.defineProperty(context, "localStorage", {
    get() {
      if (storageThrows) throw new Error("SecurityError: storage is disabled");
      return { getItem: (key) => (key === "theme" ? stored : null) };
    },
  });
  vm.runInNewContext(script, context);
  return classes.has("dark");
};

test("theme init: an explicit choice wins over the system setting", () => {
  assert.equal(runThemeInit({ stored: "dark", systemDark: false }), true);
  assert.equal(runThemeInit({ stored: "light", systemDark: true }), false);
});

test("theme init: system (or no choice) follows prefers-color-scheme", () => {
  for (const stored of ["system", null, "unexpected"]) {
    assert.equal(runThemeInit({ stored, systemDark: true }), true, stored);
    assert.equal(runThemeInit({ stored, systemDark: false }), false, stored);
  }
});

test("theme init: unavailable localStorage does not throw and follows the system", () => {
  assert.equal(
    runThemeInit({ stored: "light", systemDark: true, storageThrows: true }),
    true,
  );
  assert.equal(
    runThemeInit({ stored: "dark", systemDark: false, storageThrows: true }),
    false,
  );
});

/** CSS files linked from an HTML page, plus inline <style> contents. */
const pageCss = (html) => {
  const linked = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map(
    (m) => readDist(attr(m[0], "href").replace(/^\//, "")),
  );
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
    (m) => m[1],
  );
  return linked.concat(inline).join("\n");
};

test("C6: body text uses Noto Sans JP and its font files are in dist/", () => {
  for (const file of htmlPages()) {
    const css = pageCss(readDist(file));
    assert.match(css, /--font-sans:\s*"Noto Sans JP Variable"/, file);
    assert.match(css, /--default-font-family:\s*var\(--font-sans\)/, file);

    const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)]
      .map((m) => m[1])
      .filter((face) => /font-family:\s*"?Noto Sans JP Variable/.test(face));
    assert.ok(faces.length > 0, `${file}: no @font-face for Noto Sans JP`);
    for (const face of faces) {
      for (const [, url] of face.matchAll(/url\(([^)]+)\)/g)) {
        const path = url.replace(/^["']|["']$/g, "").replace(/^\//, "");
        assert.ok(existsSync(join(dist, path)), `${file}: ${path} is missing`);
      }
    }
  }
});

test("C6: no IBM Plex references remain", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  for (const field of ["dependencies", "devDependencies"]) {
    assert.equal(pkg[field]?.["@fontsource/ibm-plex-sans-jp"], undefined);
  }

  const pattern = /ibm[ -]plex/i;
  const distFiles = globSync("**/*.{html,css,js}", { cwd: dist }).concat(
    globSync("**/*ibm*", { cwd: dist }),
  );
  assert.deepEqual(
    distFiles.filter(
      (p) =>
        /ibm/i.test(p) || pattern.test(readFileSync(join(dist, p), "utf8")),
    ),
    [],
  );

  const sources = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .filter((p) => existsSync(join(root, p)))
    .filter((p) => !p.startsWith("docs/") && !p.startsWith("tests/"))
    .filter((p) => !/\.(png|webp|jpe?g|gif|ico|woff2?)$/i.test(p));
  assert.deepEqual(
    sources.filter((p) => pattern.test(readFileSync(join(root, p), "utf8"))),
    [],
  );
});

/**
 * JavaScript a page loads: inline module scripts, external scripts and
 * modulepreloads, and the dist/_astro/*.js files they reference (recursively).
 */
const pageJavaScript = (html) => {
  const sources = inlineScripts(html).map((s) => s.body);
  const pending = [
    ...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g),
    ...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g),
  ].map((m) => m[1]);
  const seen = new Set();
  const referenced = (code) =>
    [...code.matchAll(/([\w.-]+\.js)\b/g)]
      .map((m) => `/_astro/${m[1]}`)
      .filter((p) => existsSync(join(dist, p)));
  for (const code of sources) pending.push(...referenced(code));
  while (pending.length > 0) {
    const path = pending.pop();
    if (seen.has(path)) continue;
    seen.add(path);
    const code = readDist(path.replace(/^\//, ""));
    sources.push(code);
    pending.push(...referenced(code));
  }
  return sources;
};

test("C7: the top page and privacy do not load the React runtime", () => {
  // Symbols every React runtime build defines.
  const reactMarker = /react\.(transitional\.)?element/;
  for (const file of ["index.html", "privacy/index.html"]) {
    const html = readDist(file);
    assert.doesNotMatch(html, /<astro-island/, file);
    for (const code of pageJavaScript(html)) {
      assert.doesNotMatch(code, reactMarker, file);
    }
  }
});

const sectionOf = (html, tag) => {
  const sections = html.match(
    new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, "g"),
  );
  assert.equal(sections?.length, 1, `<${tag}> count`);
  return sections[0];
};

const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*>/g)].map((m) => attr(m[0], "href"));

/** Category IDs (the section anchors) and names, the same in both languages. */
const CATEGORIES = [
  ["keyboards", "DIY Keyboards"],
  ["libraries", "Libraries"],
  ["apps", "Apps"],
  ["vr-3d", "VR &amp; 3D"],
];

/** Links (href and text) in a piece of HTML, in order. */
const anchors = (html) =>
  [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
    href: attr(m[0], "href"),
    text: m[1]
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  }));

test("ui-revise2 1, 6: the header links to the category sections, without menus", async () => {
  const { layoutMessages } = await import("../src/messages/layout.ts");
  const expected = CATEGORIES.map(([id, name]) => ({
    href: `/#${id}`,
    text: name,
  }));
  for (const file of chromePages()) {
    const t = layoutMessages[langOf(file)].header;
    const header = sectionOf(readDist(file), "header");

    // Desktop: the four categories as plain links, in both languages.
    const nav = header.match(/<ul[^>]*data-category-nav[\s\S]*?<\/ul>/);
    assert.ok(nav, `${file}: no category navigation`);
    assert.deepEqual(anchors(nav[0]), expected, file);
    assert.doesNotMatch(nav[0], /<button[\s>]|data-popover/, file);
    assert.doesNotMatch(header, /category-web-menu|data-category-menu/, file);

    // Mobile: the same links in a dialog opened by a menu button.
    assert.match(
      header,
      new RegExp(
        `<button[^>]*aria-label="${t.openMenu}"[^>]*aria-controls="mobile-menu"`,
      ),
      file,
    );
    const dialog = header.match(
      /<dialog[^>]*id="mobile-menu"[\s\S]*?<\/dialog>/,
    );
    assert.ok(dialog, `${file}: no mobile menu`);
    // Closed: no `open` attribute (`open:` in the class is a Tailwind variant).
    assert.doesNotMatch(
      dialog[0].match(/<dialog[^>]*>/)[0],
      /\sopen(?=[\s=>])/,
    );
    assert.match(dialog[0], new RegExp(`aria-label="${t.closeMenu}"`));
    assert.deepEqual(
      anchors(dialog[0]).slice(1),
      expected,
      `${file}: mobile menu links after the home link`,
    );
    assert.equal(anchors(dialog[0])[0].href, "/", file);
    // No tool pages in the header (the former web tools menu), except the
    // language switcher's link to this page in the other language.
    const withoutSwitcher = header.replace(
      /<div[^>]*data-language-switcher[\s\S]*?<\/div>\s*<\/div>/,
      "",
    );
    assert.ok(
      !hrefs(withoutSwitcher).some((href) => /\/lab\//.test(href)),
      file,
    );
  }
});

test("ui-revise 1: the header has no GitHub button and no link to a tool list", () => {
  for (const file of chromePages()) {
    const links = hrefs(sectionOf(readDist(file), "header"));
    assert.ok(!links.includes("https://github.com/unlibra"), file);
    assert.ok(!links.includes("/lab") && !links.includes("/en/lab"), file);
  }
});

test("C4: every page has the common header", () => {
  for (const file of chromePages()) {
    const header = sectionOf(readDist(file), "header");
    const links = hrefs(header);
    assert.ok(links.includes("/"), `${file}: home link`);
    const lang = langOf(file);
    assert.match(
      header,
      /data-site-name data-logotype>unlibra</,
      `${file}: site name`,
    );
    assert.match(header, /<svg[^>]*viewBox="0 0 512 512"/, `${file}: logo`);

    // Theme toggle: a button controlling a hidden panel of three choices.
    const toggleLabel = lang === "en" ? "Toggle theme" : "テーマを切り替え";
    assert.match(
      header,
      new RegExp(
        `<button[^>]*aria-label="${toggleLabel}"[^>]*aria-expanded="false"[^>]*aria-controls="theme-menu"`,
      ),
      file,
    );
    assert.match(header, /<div[^>]*id="theme-menu"[^>]*hidden/, file);
    const options = [...header.matchAll(/data-theme-option="([^"]+)"/g)].map(
      (m) => m[1],
    );
    assert.deepEqual(options, ["light", "dark", "system"], file);
  }
});

test("pages without another language version have no language switcher", () => {
  for (const file of singleLanguagePages) {
    const html = readDist(file);
    assert.doesNotMatch(html, /data-language-switcher/, file);
    assert.doesNotMatch(html, /hreflang/, file);
  }
});

test("C4: every page has the common footer with the required links", () => {
  for (const file of chromePages()) {
    const footer = sectionOf(readDist(file), "footer");
    // The build year ends the notice (ui-revise 7).
    const year = new Date().getFullYear();
    const notice = year === 2025 ? "© 2025 unlibra" : `© 2025–${year} unlibra`;
    assert.ok(footer.includes(`>${notice}<`), `${file}: copyright`);
    const links = hrefs(footer);
    for (const href of [
      "/",
      "https://github.com/unlibra",
      "https://ofuse.me/unlibra",
      "/privacy",
    ]) {
      assert.ok(links.includes(href), `${file}: footer link to ${href}`);
    }
  }
});

test("ui-revise 6: the footer has the GitHub, docs and BOOTH links in place of the tools", async () => {
  const { layoutMessages } = await import("../src/messages/layout.ts");
  for (const file of chromePages()) {
    const t = layoutMessages[langOf(file)].footer;
    const footer = sectionOf(readDist(file), "footer");
    const group = footer.match(/<div[^>]*data-footer-links[\s\S]*?<\/ul>/);
    assert.ok(group, `${file}: no link group`);
    assert.match(group[0], new RegExp(`<h2[^>]*>${t.links}</h2>`), file);
    assert.deepEqual(
      anchors(group[0]),
      [
        { href: "https://github.com/unlibra", text: t.github },
        { href: "https://docs.unlibra.com/", text: t.docs },
        { href: "https://unlibra-twin.booth.pm/", text: t.shop },
      ],
      file,
    );
    for (const tag of group[0].match(/<a\s[^>]*>/g)) {
      assert.match(tag, /target="_blank"/, file);
      assert.match(tag, /rel="noopener noreferrer"/, file);
    }
    // GitHub only in this group (not under the logo as well).
    assert.equal(
      hrefs(footer).filter((href) => href === "https://github.com/unlibra")
        .length,
      1,
      `${file}: GitHub links in the footer`,
    );
    // The former TOOLS column is gone.
    assert.ok(!hrefs(footer).some((href) => /\/lab\b/.test(href)), file);
    assert.doesNotMatch(footer, />Tools</, file);
  }
});

test("ui-revise 7: the copyright notice runs from 2025 to the build year", async () => {
  const { copyrightNotice } = await import("../src/config/site.ts");
  assert.equal(copyrightNotice(2025), "© 2025 unlibra");
  assert.equal(copyrightNotice(2026), "© 2025–2026 unlibra");
  assert.equal(copyrightNotice(2031), "© 2025–2031 unlibra");
  for (const year of [2024, 2025.5, Number.NaN]) {
    assert.throws(() => copyrightNotice(year), /2025 or later/, String(year));
  }
});

test("ui-revise4 3: the footer is a grid of four columns, 2:1:1, with the cells left-aligned", () => {
  for (const file of chromePages()) {
    const footer = sectionOf(readDist(file), "footer");
    const classesOf = (marker) =>
      (
        attr(
          footer.match(new RegExp(`<div[^>]*${marker}[^>]*>`))[0],
          "class",
        ) ?? ""
      )
        .split(/\s+/)
        .filter(Boolean);
    const brand = footer.match(/<div[^>]*data-footer-brand[^>]*>/)[0];
    // The grid is the brand's parent: the <div> just before it.
    const before = footer.slice(0, footer.indexOf(brand));
    const grid = attr(before.match(/<div[^>]*>(?![\s\S]*<div)/)[0], "class");
    const gridClasses = grid.split(/\s+/);
    // One column when narrow (as on the former tool site), four from md.
    assert.ok(gridClasses.includes("grid-cols-1"), file);
    assert.ok(gridClasses.includes("md:grid-cols-4"), file);
    assert.ok(!gridClasses.some((name) => /grid-cols-\[/.test(name)), file);
    // The brand and the description take two columns, the others one.
    assert.deepEqual(
      classesOf("data-footer-brand").filter((n) => /col-span/.test(n)),
      ["md:col-span-2"],
      file,
    );
    for (const marker of ["data-footer-links", "data-footer-support"]) {
      const cls = classesOf(marker);
      assert.ok(
        !cls.some((n) => /col-span|justify-self|text-(right|center)/.test(n)),
        `${file}: ${marker}`,
      );
    }
  }
});

test("ui-revise2 8, ui-revise3 2: the footer's description and link labels", () => {
  const expected = {
    ja: "個人開発のプロダクトを掲載しているサイトです。昼は本業のビルダー、夜は自作キーボード、ライブラリ、アプリ、VR &amp; 3Dなどの個人開発をしています。",
    en: "A site that collects my personal products. By day a builder at my job; by night I make DIY keyboards, libraries, apps, VR &amp; 3D and more.",
  };
  for (const file of chromePages()) {
    const footer = sectionOf(readDist(file), "footer");
    assert.ok(footer.includes(`>${expected[langOf(file)]}</p>`), file);
    const group = footer.match(/<div[^>]*data-footer-links[\s\S]*?<\/ul>/)[0];
    assert.deepEqual(
      anchors(group).map((a) => a.text),
      ["GitHub", "Docs", "BOOTH"],
      file,
    );
  }
});

test("ui-revise2 4: the site name is unlibra; the domain stays unlibra.com", () => {
  for (const file of htmlPages()) {
    const html = readDist(file);
    const meta = (key, name) =>
      attr(
        html.match(new RegExp(`<meta[^>]*${key}="${name}"[^>]*>`))[0],
        "content",
      );
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    if (file === "index.html") {
      assert.equal(title, "unlibra");
    } else {
      assert.match(title, /^.+ - unlibra$/, file);
    }
    assert.equal(meta("property", "og:title"), title, file);
    assert.equal(meta("name", "twitter:title"), title, file);
    assert.equal(meta("property", "og:site_name"), "unlibra", file);

    // The logotypes (header, mobile menu, footer, hero): see the LINE Seed JP
    // test below.
    // The domain as text is gone; URLs keep it.
    assert.doesNotMatch(
      html.replace(/<script[\s\S]*?<\/script>/g, ""),
      />[^<]*\bunlibra\.com\b[^<]*</,
      file,
    );
    if (file !== "404.html") {
      const canonical = html.match(/<link[^>]*rel="canonical"[^>]*>/)[0];
      assert.match(attr(canonical, "href"), /^https:\/\/unlibra\.com(\/|$)/);
    }
  }
  // The OGP image is generated with the site name (scripts/generate-icons.mjs).
  const script = readFileSync(join(root, "scripts/generate-icons.mjs"), "utf8");
  assert.match(script, />unlibra<\/span>`/);
  assert.doesNotMatch(script, />unlibra\.com</);
});

/** Where the logotype "unlibra" is shown, in LINE Seed JP (ui-revise2 4). */
const LOGOTYPES = {
  header:
    /<header[\s\S]*?<span class="font-brand [^"]*" data-site-name data-logotype>unlibra<\/span>/,
  "mobile menu":
    /<dialog[^>]*id="mobile-menu"[\s\S]*?<span class="font-brand [^"]*" data-logotype>unlibra<\/span>/,
  footer:
    /<footer[\s\S]*?<span class="font-brand [^"]*" data-logotype>unlibra<\/span>/,
};
test("ui-revise2 4, ui-revise3 1: the logotype is in LINE Seed JP in the header, the mobile menu and the footer, and only there", () => {
  for (const file of chromePages()) {
    const html = readDist(file);
    for (const [place, pattern] of Object.entries(LOGOTYPES)) {
      assert.match(html, pattern, `${file}: ${place}`);
    }
    // The hero's h1 is no longer a logotype (ui-revise3 1).
    assert.doesNotMatch(html, /<h1[^>]*(font-brand|data-logotype)/, file);
    // The font-brand class is on the logotypes only.
    const count = Object.keys(LOGOTYPES).length;
    assert.equal(
      (html.match(/class="[^"]*\bfont-brand\b/g) ?? []).length,
      count,
      file,
    );
    assert.equal(
      (html.match(/\sdata-logotype[\s>]/g) ?? []).length,
      count,
      file,
    );
  }
});

test("ui-revise2 4: LINE Seed JP is one font file with the letters of unlibra only", async () => {
  const { BRAND_FONT_FILE, BRAND_FONT_TEXT } =
    await import("../scripts/subset-brand-font.mjs");
  assert.equal(BRAND_FONT_TEXT, "unlibra");

  // One @font-face, bold, limited to the seven letters, pointing to one file.
  const css = globSync("_astro/*.css", { cwd: dist })
    .map((p) => readDist(p))
    .join("\n");
  const faces = [...css.matchAll(/@font-face\{[^}]*\}/g)]
    .map((m) => m[0])
    .filter((face) => /LINE Seed JP/.test(face));
  assert.equal(faces.length, 1, "LINE Seed JP font faces");
  assert.match(faces[0], /font-weight:700/);
  assert.match(
    faces[0],
    /unicode-range:U\+61-62,U\+69,U\+6C,U\+6E,U\+72,U\+75[;}]/,
  );
  const url = faces[0].match(/url\(([^)]+)\)format\("woff2"\)/)[1];
  assert.match(url, /^\/_astro\/line-seed-jp-unlibra-700\.[\w-]+\.woff2$/);
  assert.match(css, /\.font-brand\{font-family:var\(--font-brand\)\}/);
  assert.match(css, /--font-brand:"LINE Seed JP",/);

  // The only LINE Seed JP file in the output, the same as the generated one.
  const files = globSync("**/*line-seed*", { cwd: dist });
  assert.deepEqual(
    files.map((p) => p.split(sep).join("/")),
    [url.slice(1)],
  );
  const font = readFileSync(join(dist, url.slice(1)));
  assert.ok(font.equals(readFileSync(join(root, BRAND_FONT_FILE))));

  // Its characters: the seven letters, nothing else.
  const tables = woff2Tables(font);
  const characters = cmapCharacters(tables.cmap);
  assert.deepEqual([...characters].sort(), [..."abilnru"]);
  for (const other of [".", "c", "o", "m", "U", "あ", "漢"]) {
    assert.equal(characters.has(other), false, other);
  }
  assert.equal(glyphCount(tables.maxp), 8, ".notdef and the seven letters");
  // The family name and the copyright notice of the original are kept.
  assert.equal(nameOf(tables.name, 1), "LINE Seed JP");
  assert.equal(nameOf(tables.name, 0), "© LY Corporation");
  // The license description and URL (IDs 13 and 14) as in the original
  // (OFL condition 2); LINE Seed JP has the URL only.
  const { BRAND_FONT_SOURCE } =
    await import("../scripts/subset-brand-font.mjs");
  const source = woff2Tables(readFileSync(join(root, BRAND_FONT_SOURCE)));
  assert.equal(nameOf(tables.name, 14), "https://openfontlicense.org");
  for (const id of [13, 14]) {
    assert.equal(
      nameOf(tables.name, id),
      nameOf(source.name, id),
      `name ${id}`,
    );
  }
});

/** Lists every key path of a nested object, e.g. "footer.github". */
const keyPaths = (object, prefix = "") =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === "object"
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

test("C8: header and footer texts have the same keys in ja and en", async () => {
  // The type check (tests/types/layout-messages.ts) is the guarantee; this
  // checks the actual values as well.
  const { layoutMessages } = await import("../src/messages/layout.ts");
  assert.deepEqual(Object.keys(layoutMessages).sort(), ["en", "ja"]);
  assert.deepEqual(
    keyPaths(layoutMessages.en).sort(),
    keyPaths(layoutMessages.ja).sort(),
  );
  for (const locale of ["ja", "en"]) {
    for (const path of keyPaths(layoutMessages[locale])) {
      const value = path
        .split(".")
        .reduce((object, key) => object[key], layoutMessages[locale]);
      assert.equal(typeof value, "string", `${locale}.${path}`);
      assert.notEqual(value.trim(), "", `${locale}.${path}`);
    }
  }
});

/** Width and height from a PNG's IHDR chunk. */
const pngSize = (buffer) => {
  assert.equal(
    buffer.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
    "not a PNG",
  );
  assert.equal(buffer.subarray(12, 16).toString("latin1"), "IHDR");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

const readDistBuffer = (path) => readFileSync(join(dist, path));

test("C5: icon files are in dist/ with the expected sizes", () => {
  assert.deepEqual(pngSize(readDistBuffer("ogp.png")), {
    width: 1200,
    height: 630,
  });
  assert.deepEqual(pngSize(readDistBuffer("apple-touch-icon.png")), {
    width: 180,
    height: 180,
  });

  // favicon.ico: a directory of PNG images, one of them 32x32.
  const ico = readDistBuffer("favicon.ico");
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1, "not an icon");
  const sizes = [];
  for (let i = 0; i < ico.readUInt16LE(4); i++) {
    const entry = 6 + 16 * i;
    const size = ico.readUInt8(entry) || 256;
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    const image = ico.subarray(offset, offset + length);
    assert.deepEqual(pngSize(image), { width: size, height: size });
    sizes.push(size);
  }
  assert.ok(sizes.includes(32), `favicon.ico sizes: ${sizes}`);
});

test("C5: icon.svg is the brand symbol", () => {
  const symbol = readFileSync(
    join(root, "src/assets/brand/symbol.svg"),
    "utf8",
  );
  const icon = readDist("icon.svg");
  assert.match(icon, /^<svg width="512" height="512" /);
  assert.equal(
    icon.replace(' width="512" height="512"', "").trim(),
    symbol.trim(),
  );
});

test("C5: every page references the icons and the OGP image", () => {
  for (const file of htmlPages()) {
    const html = head(readDist(file));
    const links = [...html.matchAll(/<link\s[^>]*>/g)].map((m) => ({
      rel: attr(m[0], "rel"),
      href: attr(m[0], "href"),
    }));
    for (const [rel, href] of [
      ["icon", "/favicon.ico"],
      ["icon", "/icon.svg"],
      ["apple-touch-icon", "/apple-touch-icon.png"],
    ]) {
      assert.ok(
        links.some((l) => l.rel === rel && l.href === href),
        `${file}: <link rel="${rel}" href="${href}">`,
      );
      assert.ok(existsSync(join(dist, href.slice(1))), `dist${href}`);
    }
    const twitterImage = html.match(/<meta[^>]*name="twitter:image"[^>]*>/)[0];
    assert.equal(attr(twitterImage, "content"), `${SITE}/ogp.png`, file);
  }
});

test("C5: the old OGP frame image is removed", () => {
  assert.equal(existsSync(join(root, "assets/ogp-frame.png")), false);
});
