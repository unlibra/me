// E2E: the whole site: theme, language switch, page width and the redirects
// of the former URLs (served by wrangler dev from dist/_redirects).
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { layoutMessages } from "../../src/messages/layout.ts";
import en from "../../src/tools/messages/en.ts";
import ja from "../../src/tools/messages/ja.ts";
import {
  chooseTheme,
  hasHorizontalScroll,
  luminance,
  open,
} from "./helpers.js";

const TOOLS = [
  "tw-palette-generator",
  "favicon-generator",
  "svg-optimizer",
  "password-generator",
];
const PAGES = [
  "/",
  "/privacy",
  "/credits",
  ...TOOLS.flatMap((tool) => [`/lab/${tool}`, `/en/lab/${tool}`]),
];

/** The name of a tool page's folded options button, if it has one. */
const foldedOptions = (path) => {
  const t = path.startsWith("/en/") ? en : ja;
  if (path.endsWith("/svg-optimizer")) return t.svgOptimizer.options;
  if (path.endsWith("/favicon-generator"))
    return t.faviconGenerator.outputOptions;
  return null;
};

const isDark = (page) =>
  page.evaluate(() => document.documentElement.classList.contains("dark"));

test.describe("theme", () => {
  const choose = chooseTheme;

  test("light and dark are applied and kept on the next page", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await open(page, "/");
    await expect.poll(() => isDark(page)).toBe(false);

    await choose(page, "ja", "dark");
    await expect.poll(() => isDark(page)).toBe(true);
    await open(page, "/en/lab/svg-optimizer");
    await expect.poll(() => isDark(page)).toBe(true);
    await page.goto("/privacy");
    await expect.poll(() => isDark(page)).toBe(true);

    await choose(page, "ja", "light");
    await expect.poll(() => isDark(page)).toBe(false);
    await page.emulateMedia({ colorScheme: "dark" });
    await open(page, "/lab/password-generator");
    await expect.poll(() => isDark(page)).toBe(false);
  });

  test("system follows the OS setting, also while the page is open", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await open(page, "/en/lab/password-generator");
    await choose(page, "en", "dark");
    await choose(page, "en", "system");
    await expect.poll(() => isDark(page)).toBe(true);
    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => isDark(page)).toBe(false);
    await page.goto("/privacy");
    await expect.poll(() => isDark(page)).toBe(false);
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(() => isDark(page)).toBe(true);
  });

  /**
   * Representative parts of each kind of page: the page background and
   * text, and the tools' panels and fields. Dark means darker backgrounds
   * and lighter text.
   */
  const COLOR_TARGETS = [
    ["/", "body", "backgroundColor", "background"],
    ["/", "body", "color", "text"],
    ["/", "article p.text-sm", "color", "text"],
    ["/", "footer", "backgroundColor", "background"],
    [
      "/lab/password-generator",
      "div.relative.overflow-hidden.rounded-lg.border",
      "backgroundColor",
      "background",
    ],
    ["/lab/password-generator", "div.font-mono", "color", "text"],
    [
      "/lab/favicon-generator",
      "div.rounded-lg.border.border-sky-200",
      "backgroundColor",
      "background",
    ],
    [
      "/en/lab/svg-optimizer",
      "div.rounded-lg.border.border-sky-200",
      "backgroundColor",
      "background",
    ],
    [
      "/en/lab/tw-palette-generator",
      'input[name="hex-input"]',
      "backgroundColor",
      "background",
    ],
  ];

  for (const path of new Set(COLOR_TARGETS.map(([p]) => p))) {
    test(`${path}: the theme button switches the colors`, async ({ page }) => {
      const lang = path.startsWith("/en/") ? "en" : "ja";
      const targets = COLOR_TARGETS.filter(([p]) => p === path);
      const read = () =>
        Promise.all(
          targets.map(([, selector, property]) =>
            luminance(page.locator(selector).first(), property),
          ),
        );
      await page.emulateMedia({ colorScheme: "light" });
      await open(page, path);
      await chooseTheme(page, lang, "light");
      const light = await read();
      await chooseTheme(page, lang, "dark");
      await expect
        .poll(async () => {
          const dark = await read();
          return targets.map(([, selector, , kind], i) => [
            selector,
            kind === "background" ? dark[i] < light[i] : dark[i] > light[i],
          ]);
        })
        .toEqual(targets.map(([, selector]) => [selector, true]));
    });
  }

  test("the chosen option is shown as pressed", async ({ page }) => {
    await open(page, "/");
    const t = layoutMessages.ja.theme;
    await choose(page, "ja", "dark");
    await page.getByRole("button", { name: t.toggle }).click();
    await expect(
      page.getByRole("button", { name: t.dark, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: t.system, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("language switch", () => {
  for (const path of TOOLS.map((tool) => `/lab/${tool}`)) {
    test(`${path} switches to English and back`, async ({ page }) => {
      await open(page, path);
      await expect(page.locator("html")).toHaveAttribute("lang", "ja");
      await page
        .getByRole("button", { name: layoutMessages.ja.language.toggle })
        .click();
      await page.getByRole("link", { name: "English" }).click();
      await expect(page).toHaveURL(`/en${path}`);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");

      await page
        .getByRole("button", { name: layoutMessages.en.language.toggle })
        .click();
      await page.getByRole("link", { name: "日本語" }).click();
      await expect(page).toHaveURL(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    });
  }

  test("the Japanese-only pages have no language switch", async ({ page }) => {
    for (const path of ["/", "/privacy", "/credits"]) {
      await open(page, path);
      await expect(
        page.getByRole("button", { name: layoutMessages.ja.language.toggle }),
      ).toHaveCount(0);
    }
  });
});

test.describe("page width", () => {
  for (const [width, scheme] of [
    [375, "dark"],
    [1280, "light"],
  ]) {
    test(`no page is wider than ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ colorScheme: scheme });
      for (const path of [...PAGES, "/no-such-page"]) {
        await open(page, path);
        expect(await hasHorizontalScroll(page), path).toBe(false);
        // The tools' options, folded on narrow screens: opened.
        const folded = foldedOptions(path);
        if (folded && width < 1024) {
          await page.getByRole("button", { name: folded }).click();
          await expect(
            page.getByRole("button", { name: folded }),
          ).toHaveAttribute("aria-expanded", "true");
          expect(
            await hasHorizontalScroll(page),
            `${path} (options open)`,
          ).toBe(false);
        }
      }
    });
  }
});

test.describe("former URLs", () => {
  /** Every rule of _redirects, with a sample URL for the dynamic ones. */
  const rules = readFileSync(
    new URL("../../dist/_redirects", import.meta.url),
    "utf8",
  )
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/\s+/));
  const sample = (source, destination) => {
    if (source.endsWith("/*")) {
      return [
        source.replace("*", "svg-optimizer"),
        destination.replace(":splat", "svg-optimizer"),
      ];
    }
    if (source.includes(":tool")) {
      return [
        source.replace(":tool", "favicon-generator"),
        destination.replace(":tool", "favicon-generator"),
      ];
    }
    return [source, destination];
  };

  test("every rule of _redirects is a 301 to a page that exists", async ({
    request,
  }) => {
    expect(rules.length).toBeGreaterThan(0);
    for (const [source, destination, code] of rules) {
      expect(code, source).toBe("301");
      const [from, to] = sample(source, destination);
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(301);
      const location = new URL(response.headers().location, "http://x");
      expect(location.pathname + location.hash, from).toBe(to);
      const target = await request.get(to);
      expect(target.status(), to).toBe(200);
    }
  });

  test("the removed Iromide is forwarded and ends in 404", async ({
    request,
  }) => {
    for (const [from, to] of [
      ["/lab/ja/iromide", "/lab/iromide"],
      ["/lab/en/iromide", "/en/lab/iromide"],
    ]) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(response.headers().location).toBe(to);
      expect((await request.get(to)).status()).toBe(404);
    }
  });

  test("the former tool URLs land on the new pages in a browser", async ({
    page,
  }) => {
    await page.goto("/lab/en/tw-palette-generator/");
    await expect(page).toHaveURL("/en/lab/tw-palette-generator");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.goto("/ja");
    await expect(page).toHaveURL("/");
  });

  test("the tool list URLs land on the apps section", async ({ page }) => {
    for (const path of ["/lab/ja", "/lab/en/", "/lab", "/en/lab"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL("/#apps");
      await expect(
        page.getByRole("heading", { level: 2, name: "Apps" }),
      ).toBeInViewport();
    }
  });
});

test.describe("final-review 7: the links of the privacy policy and credits", () => {
  for (const scheme of ["light", "dark"]) {
    test(`${scheme}: are at least 4.5:1 with the page, at rest and on hover`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      for (const path of ["/privacy", "/credits"]) {
        await open(page, path);
        await chooseTheme(page, "ja", scheme);
        const back = await luminance(page.locator("body"), "backgroundColor");
        const ratio = (l) =>
          (Math.max(l, back) + 0.05) / (Math.min(l, back) + 0.05);
        const links = page.locator("main.prose a");
        expect(await links.count()).toBeGreaterThan(0);
        const link = links.first();
        await page.mouse.move(0, 0);
        const rest = ratio(await luminance(link, "color"));
        await link.hover();
        const hover = ratio(await luminance(link, "color"));
        expect(rest, `${path} at rest`).toBeGreaterThanOrEqual(4.5);
        expect(hover, `${path} on hover`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
