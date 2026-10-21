// E2E: TW Palette Generator (replaces the Phase 4 E7 checks): the input,
// the sliders and reset as shown on the page, copying, and the history in
// localStorage. Expected palettes come from the former tool's output
// (tests/fixtures/tw-palette-generator/expected.json); the adjusted ones are
// computed with the palette functions (unit tested in tests/spec/).
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import {
  adjustColor,
  adjustPalette,
} from "../../src/tools/tw-palette-generator/palette.ts";
import {
  grantClipboard,
  LOCALES,
  open,
  readClipboard,
  setRange,
  toast,
  toolUrl,
} from "./helpers.js";

const former = JSON.parse(
  readFileSync(
    new URL("../fixtures/tw-palette-generator/expected.json", import.meta.url),
  ),
);
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const HISTORY_KEY = "tw-palette-history";

const upper = (palette) => SHADES.map((shade) => palette[shade].toUpperCase());

/** A history entry as the former tool saved it. */
const formerItem = (hex, time) => ({
  id: String(time),
  baseColor: hex,
  palette: former[hex].palette,
  timestamp: time,
});

for (const locale of LOCALES) {
  const { t } = locale;
  const m = t.twPaletteGenerator;

  test.describe(`tw palette generator (${locale.lang})`, () => {
    const url = toolUrl(locale, "tw-palette-generator");
    test.beforeEach(async ({ page }) => {
      await open(page, url);
    });

    const input = (page) => page.getByRole("textbox", { name: m.colorCode });
    const slider = (page, name) => page.getByRole("slider", { name });
    const sliders = (page) =>
      Promise.all(
        [m.hue, m.lightness, m.saturation].map((name) =>
          slider(page, name).inputValue(),
        ),
      );
    /** BASE and the eleven shades of the generated palette, as shown. */
    const shown = async (page) => {
      const label = async (pattern) =>
        (
          await page
            .getByRole("button", { name: pattern })
            .first()
            .getAttribute("aria-label")
        ).split(" ")[1];
      return {
        base: await label(/^BASE #/),
        palette: await Promise.all(
          SHADES.map((shade) => label(new RegExp(`^${shade} #`))),
        ),
      };
    };
    const history = (page) =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
        HISTORY_KEY,
      );
    const historyRows = (page) =>
      page.getByRole("button", { name: m.deleteFromHistory });

    test("opens with the sky palette of #0ea5e9", async ({ page }) => {
      await expect(input(page)).toHaveValue("#0ea5e9");
      expect(await sliders(page)).toEqual(["237", "68", "19"]);
      await expect
        .poll(() => shown(page))
        .toEqual({
          base: "#0EA5E9",
          palette: upper(former["#0ea5e9"].palette),
        });
    });

    test("typing a color, with or without #, makes its palette", async ({
      page,
    }) => {
      for (const typed of ["3ba0be", "#3BA0BE", "#f88c49"]) {
        await input(page).fill(typed);
        const hex = typed.startsWith("#") ? typed.toLowerCase() : `#${typed}`;
        await expect
          .poll(() => shown(page))
          .toEqual({
            base: hex.toUpperCase(),
            palette: upper(former[hex].palette),
          });
      }
      await input(page).fill("3ba0be");
      await expect.poll(() => sliders(page)).toEqual(["221", "66", "13"]);
    });

    test("a Tailwind swatch sets the input", async ({ page }) => {
      await page.getByRole("button", { name: "red-500", exact: true }).click();
      await expect(input(page)).toHaveValue("#ef4444");
      await expect(page.getByLabel(m.baseColorSelection)).toHaveValue(
        "#ef4444",
      );
      await expect
        .poll(() => shown(page))
        .toEqual({
          base: "#EF4444",
          palette: upper(former["#ef4444"].palette),
        });
    });

    test("the sliders adjust BASE and the palette by the difference from the input", async ({
      page,
    }) => {
      await input(page).fill("3ba0be");
      await expect.poll(() => sliders(page)).toEqual(["221", "66", "13"]);
      const base = former["#3ba0be"].palette;

      await setRange(slider(page, m.hue), 120);
      await setRange(slider(page, m.lightness), 50);
      await setRange(slider(page, m.saturation), 20);
      const shifts = [120 - 221, 50 - 66, 20 - 13];
      await expect
        .poll(() => shown(page))
        .toEqual({
          base: adjustColor("#3ba0be", ...shifts),
          palette: upper(adjustPalette(base, ...shifts)),
        });
    });

    test("reset puts the sliders, BASE and the palette back to the input's", async ({
      page,
    }) => {
      await input(page).fill("3ba0be");
      await expect.poll(() => sliders(page)).toEqual(["221", "66", "13"]);
      await setRange(slider(page, m.hue), 120);
      await setRange(slider(page, m.lightness), 30);
      await setRange(slider(page, m.saturation), 40);
      await expect
        .poll(async () => (await shown(page)).base)
        .not.toBe("#3BA0BE");

      await page.getByRole("button", { name: m.resetAdjustment }).click();
      await expect.poll(() => sliders(page)).toEqual(["221", "66", "13"]);
      await expect
        .poll(() => shown(page))
        .toEqual({
          base: "#3BA0BE",
          palette: upper(former["#3ba0be"].palette),
        });
    });

    test("swatches and the Tailwind config are copied with a toast", async ({
      page,
      context,
      baseURL,
    }) => {
      await grantClipboard(context, baseURL);
      const palette = former["#0ea5e9"].palette;
      await expect
        .poll(async () => (await shown(page)).palette)
        .toEqual(upper(palette));
      await page
        .getByRole("button", { name: /^500 #/ })
        .first()
        .click();
      await expect(toast(page, m.errors.colorCodeCopied)).toBeVisible();
      expect(await readClipboard(page)).toBe(palette[500].toUpperCase());

      await page
        .getByRole("button", { name: /^BASE #/ })
        .first()
        .click();
      expect(await readClipboard(page)).toBe("#0EA5E9");

      await page.getByRole("button", { name: m.copyConfig }).click();
      await expect(toast(page, m.errors.configCopied)).toBeVisible();
      // Windows' clipboard gives the line breaks back as CRLF.
      const config = (await readClipboard(page)).replace(/\r\n/g, "\n");
      expect(config).toBe(
        `colors: {\n  custom: {\n${SHADES.map(
          (shade) => `    ${shade}: '${palette[shade]}',`,
        ).join("\n")}\n  }\n}`,
      );
      await expect(page.locator("pre")).toHaveText(config);
    });

    test("saving adds the palette to the history in localStorage", async ({
      page,
    }) => {
      await expect(page.getByText(m.historyEmptyMessage)).toBeVisible();
      // The palette shown before the first one is generated is Tailwind's
      // sky; wait for the generated one.
      await expect
        .poll(async () => (await shown(page)).palette)
        .toEqual(upper(former["#0ea5e9"].palette));
      await page.getByRole("button", { name: m.saveToHistory }).click();
      await expect(toast(page, m.errors.addedToHistory)).toBeVisible();
      await input(page).fill("#f88c49");
      await expect.poll(async () => (await shown(page)).base).toBe("#F88C49");
      await page.getByRole("button", { name: m.saveToHistory }).click();

      await expect(historyRows(page)).toHaveCount(2);
      const saved = await history(page);
      expect(saved.map((item) => item.baseColor)).toEqual([
        "#0ea5e9",
        "#f88c49",
      ]);
      for (const item of saved) {
        expect(Object.keys(item)).toEqual([
          "id",
          "baseColor",
          "palette",
          "timestamp",
        ]);
        expect(item.id).toBe(String(item.timestamp));
        expect(item.palette).toEqual(former[item.baseColor].palette);
      }
      // Kept after a reload.
      await open(page, url);
      await expect(historyRows(page)).toHaveCount(2);
    });

    test("history saved by the former tool is shown, and can be deleted", async ({
      page,
    }) => {
      const items = [
        formerItem("#f88c49", 1700000000000),
        formerItem("#3ba0be", 1700000001000),
      ];
      await page.evaluate(
        ([key, value]) => localStorage.setItem(key, value),
        [HISTORY_KEY, JSON.stringify(items)],
      );
      await open(page, url);
      await expect(historyRows(page)).toHaveCount(2);
      // Shown newest first (top to bottom).
      const bases = await page
        .getByRole("button", { name: /^BASE #[0-9a-f]{6} / })
        .evaluateAll((buttons) =>
          buttons
            .map((b) => [
              b.getBoundingClientRect().top,
              b.getAttribute("aria-label").split(" ")[1],
            ])
            .sort((a, b) => a[0] - b[0])
            .map(([, hex]) => hex),
        );
      expect(bases).toEqual(["#3ba0be", "#f88c49"]);

      // Deleting the top row (the newest) leaves the older one.
      const deleteButtons = await historyRows(page).all();
      const tops = await Promise.all(
        deleteButtons.map(async (b) => (await b.boundingBox()).y),
      );
      await deleteButtons[tops.indexOf(Math.min(...tops))].click();
      await expect(historyRows(page)).toHaveCount(1);
      expect((await history(page)).map((item) => item.id)).toEqual([
        "1700000000000",
      ]);

      await page.getByRole("button", { name: m.deleteAllHistory }).click();
      await expect(historyRows(page)).toHaveCount(0);
      await expect(page.getByText(m.historyEmptyMessage)).toBeVisible();
      expect(await history(page)).toEqual([]);
    });

    test("on a phone the shade headings turn sideways", async ({ page }) => {
      const heading = page.getByText("950", { exact: true }).first();
      const rotation = () =>
        heading.evaluate((element) => getComputedStyle(element).rotate);
      expect(await rotation()).toBe("none");
      await page.setViewportSize({ width: 375, height: 800 });
      await expect.poll(rotation).toBe("-90deg");
    });

    test("the history keeps the newest 30 palettes", async ({ page }) => {
      const items = Array.from({ length: 30 }, (_, i) =>
        formerItem("#f88c49", 1700000000000 + i),
      );
      await page.evaluate(
        ([key, value]) => localStorage.setItem(key, value),
        [HISTORY_KEY, JSON.stringify(items)],
      );
      await open(page, url);
      await expect(historyRows(page)).toHaveCount(30);
      await page.getByRole("button", { name: m.saveToHistory }).click();
      await expect(historyRows(page)).toHaveCount(30);
      const saved = await history(page);
      expect(saved).toHaveLength(30);
      expect(saved[0].id).toBe("1700000000001"); // the oldest is dropped
      expect(saved[29].baseColor).toBe("#0ea5e9");
    });
  });
}
