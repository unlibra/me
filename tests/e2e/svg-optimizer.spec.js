// E2E: SVG Optimizer (replaces the Phase 4 E7 checks).
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import {
  chooseFile,
  download,
  dropFile,
  LOCALES,
  open,
  pngFile,
  setRange,
  svgFile,
  toast,
  toolUrl,
} from "./helpers.js";

const fixture = (name) =>
  readFileSync(new URL(`../fixtures/svg-optimizer/${name}`, import.meta.url));
const expected = JSON.parse(fixture("expected.json"));
const ICON = {
  name: "icon.svg",
  mimeType: "image/svg+xml",
  buffer: fixture("icon.svg"),
};
const EDITOR = {
  name: "editor.svg",
  mimeType: "image/svg+xml",
  buffer: fixture("editor.svg"),
};

for (const locale of LOCALES) {
  const { t } = locale;
  const m = t.svgOptimizer;

  test.describe(`svg optimizer (${locale.lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, toolUrl(locale, "svg-optimizer"));
    });

    const downloadButton = (page) =>
      page.getByRole("button", { name: t.common.download, exact: true });
    const preset = (page, id) =>
      page.getByRole("button", { name: `Select preset: ${m[id]}` });
    const preview = (page) => page.getByAltText("最適化後プレビュー");
    /**
     * Selects an SVG and waits for its first preview. SVGO is a lazy chunk,
     * and when the preview and the sizes appear they push the Download button
     * down (126px): a click pressed before that releases off the button and
     * is lost (tests.md TS-10).
     */
    const chooseSvg = async (page, file) => {
      await chooseFile(page, file);
      await expect(preview(page)).toBeVisible();
    };

    test("a selected file is previewed with its sizes and downloaded optimized", async ({
      page,
    }) => {
      await expect(downloadButton(page)).toBeDisabled();
      await expect(page.getByText(m.previewPlaceholder.line1)).toBeVisible();
      await chooseSvg(page, EDITOR);
      const optimized = Buffer.byteLength(expected["editor.svg"].safe);
      await expect(
        page.getByText(`${(EDITOR.buffer.length / 1024).toFixed(2)} KB`),
      ).toBeVisible();
      await expect(
        page.getByText(`${(optimized / 1024).toFixed(2)} KB`),
      ).toBeVisible();
      await expect(
        page.getByText(
          `${((1 - optimized / EDITOR.buffer.length) * 100).toFixed(1)}%`,
        ),
      ).toBeVisible();

      // The default preset is "recommended".
      await expect(preset(page, "safe")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      const file = await download(page, downloadButton(page));
      expect(file.name).toBe("editor-optimized.svg");
      expect(file.buffer.toString()).toBe(expected["editor.svg"].safe);
    });

    test("each preset sets the output", async ({ page }) => {
      await chooseSvg(page, ICON);
      for (const id of ["maximum", "svgo-default", "safe"]) {
        await preset(page, id).click();
        await expect(preset(page, id)).toHaveAttribute("aria-pressed", "true");
        const file = await download(page, downloadButton(page));
        expect(file.buffer.toString(), id).toBe(expected["icon.svg"][id]);
      }
    });

    test("changing a switch by hand clears the preset and changes the output", async ({
      page,
    }) => {
      await chooseSvg(page, ICON);
      const removeTitle = page.getByRole("switch", { name: "removeTitle" });
      await expect(removeTitle).not.toBeChecked();
      await removeTitle.click();
      await expect(removeTitle).toBeChecked();
      for (const id of ["safe", "svgo-default", "maximum"]) {
        await expect(preset(page, id)).toHaveAttribute("aria-pressed", "false");
      }
      const file = await download(page, downloadButton(page));
      expect(expected["icon.svg"].safe).toContain("<title>");
      expect(file.buffer.toString()).toBe(
        expected["icon.svg"].safe.replace("<title>Check</title>", ""),
      );
    });

    test("the dangerous switches keep scripts", async ({ page }) => {
      await chooseSvg(
        page,
        svgFile(
          "script.svg",
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script><path d="M0 0h10v10z"/></svg>',
        ),
      );
      const without = await download(page, downloadButton(page));
      expect(without.buffer.toString()).not.toContain("<script");
      await page.getByRole("switch", { name: "keepScripts" }).click();
      const kept = await download(page, downloadButton(page));
      expect(kept.buffer.toString()).toContain("<script>alert(1)</script>");
    });

    test("the precision sliders set the digits of the output", async ({
      page,
    }) => {
      await chooseSvg(
        page,
        svgFile(
          "numbers.svg",
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="1.123456"/><text transform="translate(1.123456 2)">a</text><text transform="rotate(10.123456)">b</text><path d="M0 0L1.123456 2.123456L3 0z"/></svg>',
        ),
      );
      await setRange(page.getByRole("slider", { name: m.floatPrecision }), 1);
      await setRange(
        page.getByRole("slider", { name: m.transformPrecision }),
        2,
      );
      const file = (
        await download(page, downloadButton(page))
      ).buffer.toString();
      expect(file).toContain('r="1.1"');
      expect(file).toContain("translate(1.12 2)");
      // Angles and path data too (fixes2.md).
      expect(file).toContain("rotate(10.12)");
      const d = file.match(/ d="([^"]*)"/)[1];
      expect(d).toContain("1.1");
      expect(d).not.toMatch(/\.\d\d/);
    });

    test("a file that is not an SVG is refused with a message", async ({
      page,
    }) => {
      await chooseFile(page, await pngFile("image.png", 10, 10));
      await expect(
        toast(page, "SVGファイルのみアップロードできます"),
      ).toBeVisible();
      await expect(downloadButton(page)).toBeDisabled();
    });

    test("files can be dropped anywhere: an SVG is loaded, other files are refused", async ({
      page,
    }) => {
      await dropFile(
        page,
        await pngFile("image.png", 10, 10),
        t.common.dropToUpload,
      );
      await expect(toast(page, t.common.unsupportedFileType)).toBeVisible();
      await expect(downloadButton(page)).toBeDisabled();

      await dropFile(page, ICON, t.common.dropToUpload);
      await expect(preview(page)).toBeVisible();
      const file = await download(page, downloadButton(page));
      expect(file.name).toBe("icon-optimized.svg");
      expect(file.buffer.toString()).toBe(expected["icon.svg"].safe);
    });

    test("on a phone the options are folded and open on tap", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await chooseSvg(page, ICON);
      const removeTitle = page.getByRole("switch", { name: "removeTitle" });
      await expect(removeTitle).toBeHidden();
      await page.getByRole("button", { name: m.options }).click();
      await removeTitle.click();
      await expect(removeTitle).toBeChecked();
      const file = await download(page, downloadButton(page));
      expect(file.buffer.toString()).not.toContain("<title>");
    });
  });
}
