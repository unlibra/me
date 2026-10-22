// Integration tests for the web tool pages (Phase 4) against dist/, and the
// license boundary lint rule. Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

import ja from "../src/tools/messages/ja.ts";
import en from "../src/tools/messages/en.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = "https://unlibra.com";

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const readDist = (path) => readFileSync(join(dist, path), "utf8");
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*>/g)].map((m) => attr(m[0], "href"));

const TOOLS = [
  "tw-palette-generator",
  "favicon-generator",
  "svg-optimizer",
  "password-generator",
];
const messages = { ja, en };
const prefix = { ja: "", en: "/en" };
const other = { ja: "en", en: "ja" };

/** Site path of a tool page. */
const pathOf = (lang, tool) => `${prefix[lang]}/lab/${tool}`;
const fileOf = (path) => `${path.slice(1)}/index.html`;

/** The eight tool pages as { lang, tool, path }. */
const pages = ["ja", "en"].flatMap((lang) =>
  TOOLS.map((tool) => ({
    lang,
    tool,
    path: pathOf(lang, tool),
  })),
);

const head = (html) => html.match(/<head>([\s\S]*?)<\/head>/)[1];

/** Parsed JSON-LD blocks of a page. */
const jsonLd = (html) =>
  [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => JSON.parse(m[1]));

test("E2: the eight tool pages exist with lang, canonical and hreflang", () => {
  assert.equal(pages.length, 8);
  for (const { lang, tool, path } of pages) {
    const html = readDist(fileOf(path));
    assert.match(html, new RegExp(`<html[^>]*lang="${lang}"`), path);

    const h = head(html);
    const canonical = h.match(/<link[^>]*rel="canonical"[^>]*>/g) ?? [];
    assert.equal(canonical.length, 1, `${path}: canonical count`);
    assert.equal(attr(canonical[0], "href"), SITE + path, path);

    const alternates = Object.fromEntries(
      [...h.matchAll(/<link[^>]*rel="alternate"[^>]*>/g)].map((m) => [
        attr(m[0], "hreflang"),
        attr(m[0], "href"),
      ]),
    );
    assert.deepEqual(
      alternates,
      {
        ja: SITE + pathOf("ja", tool),
        en: SITE + pathOf("en", tool),
        "x-default": SITE + pathOf("ja", tool),
      },
      path,
    );
  }
});

test("E2: the language switcher links to the same page in the other language", () => {
  for (const { lang, tool, path } of pages) {
    const html = readDist(fileOf(path));
    const switcher = html.match(
      /<div[^>]*data-language-switcher[\s\S]*?<\/div>\s*<\/div>/,
    );
    assert.ok(switcher, `${path}: no language switcher`);
    const links = hrefs(switcher[0]);
    assert.ok(links.includes(pathOf(other[lang], tool)), path);
  }
});

test("tool pages use the tool's name and description as title and description", () => {
  for (const { lang, tool, path } of pages) {
    const h = head(readDist(fileOf(path)));
    const { name, description } = messages[lang].tools[tool];
    // The site name is "unlibra" (ui-revise2 4).
    assert.match(h, new RegExp(`<title>${name} - unlibra</title>`));
    const meta = h.match(/<meta[^>]*name="description"[^>]*>/)[0];
    const decoded = attr(meta, "content").replace(/&#39;/g, "'");
    assert.equal(decoded, description.replace(/\r?\n/g, ""), path);
  }
});

test("E3: tool pages have WebApplication and BreadcrumbList structured data", () => {
  for (const { lang, tool, path } of pages) {
    const html = readDist(fileOf(path));
    const data = jsonLd(html);
    const { name, description } = messages[lang].tools[tool];

    const app = data.filter((d) => d["@type"] === "WebApplication");
    assert.equal(app.length, 1, `${path}: WebApplication count`);
    assert.deepEqual(app[0], {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name,
      description: description.replace(/\r?\n/g, " "),
      url: SITE + path,
      applicationCategory: "DesignApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      author: { "@type": "Person", name: "unlibra" },
      inLanguage: lang === "ja" ? "ja-JP" : "en-US",
    });

    const breadcrumbs = data.filter((d) => d["@type"] === "BreadcrumbList");
    assert.equal(breadcrumbs.length, 1, `${path}: BreadcrumbList count`);
    // The first item is the top page (ui-revise: there is no tool list).
    const homeLabel = lang === "ja" ? "ホーム" : "Home (Japanese)";
    assert.deepEqual(breadcrumbs[0].itemListElement, [
      {
        "@type": "ListItem",
        position: 1,
        name: homeLabel,
        item: `${SITE}/`,
      },
      { "@type": "ListItem", position: 2, name },
    ]);

    // Visible breadcrumb: a link to the top page, then the current page.
    const nav = html.match(/<nav[^>]*aria-label="Breadcrumb"[\s\S]*?<\/nav>/);
    assert.ok(nav, `${path}: no breadcrumb`);
    assert.deepEqual(hrefs(nav[0]), ["/"]);
    assert.ok(nav[0].includes(`>${homeLabel}<`), `${path}: home label`);
    assert.match(nav[0], new RegExp(`aria-current="page">${name}<`));

    assert.match(html, new RegExp(`<h1[^>]*>${name}</h1>`), path);
  }
});

/** The page's islands as { component, client, props }. */
const islands = (html) =>
  [...html.matchAll(/<astro-island\s[^>]*>/g)].map((m) => ({
    component: attr(m[0], "component-url"),
    client: attr(m[0], "client"),
    props: JSON.parse(attr(m[0], "props").replace(/&quot;/g, '"')),
  }));

test("E3: each tool page has its own island, loaded on page load", () => {
  for (const { lang, tool, path } of pages) {
    const found = islands(readDist(fileOf(path)));
    assert.equal(found.length, 1, `${path}: island count`);
    const [island] = found;
    assert.match(
      island.component,
      new RegExp(`^/_astro/${tool}\\.[\\w-]+\\.js$`),
      path,
    );
    assert.ok(existsSync(join(dist, island.component.slice(1))), path);
    assert.equal(island.client, "load", path);
    // Astro serializes each prop as [type, value]; 0 is a plain value.
    assert.deepEqual(island.props, { locale: [0, lang] }, path);
  }
});

test("ui-revise 2: there are no tool list pages", () => {
  for (const lang of ["ja", "en"]) {
    const dir = `${prefix[lang]}/lab`.slice(1);
    assert.equal(existsSync(join(dist, dir, "index.html")), false, lang);
    assert.equal(existsSync(join(dist, `${dir}.html`)), false, lang);
  }
});

test("E8: the tools are linked from the top page in Japanese, not from the header", () => {
  // The footer listed the tools until ui-revise, the header's web tools
  // menu until ui-revise2 (1). The apps section's details link to them now;
  // the top page is in Japanese only.
  const files = [
    "index.html",
    "privacy/index.html",
    // Not 404.html: it has no header since not-found.
    ...pages.map((p) => fileOf(p.path)),
  ];
  for (const file of files) {
    // Without the language switcher, which links to the other language.
    const header = readDist(file)
      .match(/<header[\s\S]*?<\/header>/)[0]
      .replace(/<div[^>]*data-language-switcher[\s\S]*?<\/div>\s*<\/div>/, "");
    for (const tool of TOOLS) {
      for (const lang of ["ja", "en"]) {
        assert.ok(!hrefs(header).includes(pathOf(lang, tool)), file);
      }
    }
  }
  // Twice: the tool's card links to it, with its title and its
  // "アプリを開く" (ui-revise4 2, ui-revise5 9).
  const main = readDist("index.html").match(/<main[\s\S]*?<\/main>/)[0];
  for (const tool of TOOLS) {
    assert.equal(
      hrefs(main).filter((href) => href === pathOf("ja", tool)).length,
      2,
      tool,
    );
    assert.ok(!hrefs(main).includes(pathOf("en", tool)), tool);
  }
});

/** Lists every key path of a nested object, e.g. "common.copy". */
const keyPaths = (object, prefix = "") =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === "object"
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

test("E5: tool texts have the same keys in ja and en", () => {
  // The type check (tests/types/tool-messages.ts) is the guarantee; this
  // checks the actual values as well.
  assert.deepEqual(keyPaths(en).sort(), keyPaths(ja).sort());
  assert.deepEqual(Object.keys(ja.tools).sort(), [...TOOLS].sort());
  for (const [locale, texts] of Object.entries(messages)) {
    for (const path of keyPaths(texts)) {
      const value = path.split(".").reduce((object, key) => object[key], texts);
      assert.equal(typeof value, "string", `${locale}.${path}`);
      assert.notEqual(value.trim(), "", `${locale}.${path}`);
    }
  }
});

// E4: the license boundary (decision P4-1).
const eslint = new ESLint({ cwd: root });

/** Messages of the license boundary rule for some code at a path. */
const boundaryErrors = async (file, code) => {
  const [result] = await eslint.lintText(code, {
    filePath: join(root, file),
  });
  const fatal = result.messages.filter((m) => m.fatal);
  assert.deepEqual(fatal, [], `${file}: parse error`);
  return result.messages.filter((m) => m.ruleId === "local/license-boundary");
};

test("E4: MIT code cannot import All-rights-reserved files", async () => {
  const cases = [
    ["src/tools/probe.ts", 'import { site } from "@/config/site";'],
    ["src/tools/probe.ts", 'import { site } from "../config/site";'],
    ["src/tools/a/probe.ts", 'import x from "../../assets/tools/x.svg";'],
    ["src/tools/probe.ts", 'export { site } from "@/config/site";'],
    ["src/tools/probe.ts", 'export * from "@/messages/layout";'],
    ["src/tools/probe.ts", 'const m = import("@/config/site");'],
    ["src/tools/probe.ts", "const m = import(`@/config/${name}`);"],
    ["src/tools/probe.ts", 'import "/src/styles/global.css";'],
    // Specifiers that start with a top-level directory of the repository
    // (resolved from the project root, e.g. through a tsconfig baseUrl).
    ["src/tools/probe.ts", 'import { site } from "src/config/site";'],
    ["src/tools/probe.ts", 'import type { SitePath } from "src/config/site";'],
    ["src/tools/probe.ts", 'export { site } from "src/config/site";'],
    ["src/tools/probe.ts", 'export type S = import("@/config/site").SitePath;'],
    ["src/tools/probe.ts", 'import site = require("@/config/site");'],
    [
      "src/components/ui/probe.tsx",
      'import Header from "../layout/Header.astro";',
    ],
    [
      "src/components/ui/Probe.astro",
      '---\nimport { site } from "@/config/site";\n---\n<p>{site.title}</p>\n',
    ],
    [
      "src/components/ui/Probe.astro",
      '<p></p>\n<script>\n  import { setupPopover } from "../../scripts/popover";\n  setupPopover(document.body);\n</script>\n',
    ],
  ];
  for (const [file, code] of cases) {
    const errors = await boundaryErrors(file, code);
    assert.equal(errors.length, 1, `${file}: ${code}`);
    assert.equal(errors[0].severity, 2, `${file}: ${code}`);
  }
});

test("E4: MIT code may import MIT files and packages; other code may import MIT code", async () => {
  const cases = [
    ["src/tools/probe.ts", 'import { useToast } from "@/components/ui/toast";'],
    ["src/tools/a/probe.ts", 'import { toolMessages } from "../messages";'],
    [
      "src/components/ui/probe.ts",
      'import { useMessages } from "@/tools/i18n";',
    ],
    ["src/components/ui/probe.ts", 'import { useState } from "react";'],
    [
      "src/components/ui/Probe.astro",
      '---\nimport { Image } from "astro:assets";\n---\n',
    ],
    ["src/pages/probe.ts", 'import { toolMessages } from "@/tools/messages";'],
    ["src/pages/probe.ts", 'import { site } from "@/config/site";'],
  ];
  for (const [file, code] of cases) {
    assert.deepEqual(await boundaryErrors(file, code), [], `${file}: ${code}`);
  }
});

test("E4: the repository's MIT code passes the license boundary rule", async () => {
  const results = await eslint.lintFiles([
    "src/tools/**/*",
    "src/components/ui/**/*",
  ]);
  assert.ok(results.length > 0, "no MIT files linted");
  const errors = results.flatMap((r) =>
    r.messages
      .filter((m) => m.ruleId === "local/license-boundary")
      .map((m) => `${r.filePath}:${m.line} ${m.message}`),
  );
  assert.deepEqual(errors, []);
});

test("the palette history is stored under the former tool's localStorage key", () => {
  // Same origin and the same key, so history saved before the move carries
  // over (plan item 8). The behavior itself is checked by hand (E7).
  const html = readDist(fileOf(pathOf("ja", "tw-palette-generator")));
  const [island] = islands(html);
  const code = readDist(island.component.slice(1));
  assert.match(code, /["'`]tw-palette-history["'`]/);
  const source = readFileSync(
    join(root, "src/tools/tw-palette-generator/tw-palette-generator.tsx"),
    "utf8",
  );
  assert.match(source, /PALETTE_HISTORY_KEY = "tw-palette-history";/);
  assert.equal(
    source.match(/localStorage\.\w+Item\(PALETTE_HISTORY_KEY/g)?.length,
    2,
  );
});
