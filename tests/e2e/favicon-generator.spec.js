// E2E: Favicon Generator (replaces the Phase 4 E7 checks). The downloaded
// files are read back: ICO entries, ZIP contents, PNG sizes and pixels.
import { expect, test } from "@playwright/test";
import JSZip from "jszip";

import {
  chooseFile,
  download,
  dropFile,
  LOCALES,
  open,
  pngFile,
  readIco,
  readPng,
  setRange,
  svgFile,
  toast,
  toolUrl,
} from "./helpers.js";

const VIEWBOX_SVG = svgFile(
  "wide.svg",
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect width="120" height="60" fill="#36c"/></svg>',
);

for (const locale of LOCALES) {
  const { t } = locale;
  const m = t.faviconGenerator;

  test.describe(`favicon generator (${locale.lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, toolUrl(locale, "favicon-generator"));
    });

    const downloadButton = (page) =>
      page.getByRole("button", { name: t.common.download, exact: true });
    /** Output format or size button ("favicon.ico", "Apple Touch Icon", "48x48"). */
    const toggle = (page, label) =>
      page.getByRole("button", {
        name: new RegExp(`^(Select|Deselect) ${label}$`),
      });
    const preview = (page) => page.getByAltText("プレビュー");

    const loadPng = async (page) => {
      await chooseFile(page, await pngFile("logo.png", 300, 200));
      await expect(preview(page)).toBeVisible();
    };

    test("a selected image is previewed as a square of its shorter side", async ({
      page,
    }) => {
      await expect(downloadButton(page)).toBeDisabled();
      await loadPng(page);
      await expect
        .poll(() =>
          preview(page).evaluate((img) => [
            img.naturalWidth,
            img.naturalHeight,
          ]),
        )
        .toEqual([200, 200]);
    });

    test("an SVG with only a viewBox takes its size from the viewBox", async ({
      page,
    }) => {
      await chooseFile(page, VIEWBOX_SVG);
      await expect(preview(page)).toBeVisible();
      await expect
        .poll(() =>
          preview(page).evaluate((img) => [
            img.naturalWidth,
            img.naturalHeight,
          ]),
        )
        .toEqual([60, 60]);
    });

    test("by default one favicon.ico with 16 and 32 pixel images is downloaded", async ({
      page,
    }) => {
      await loadPng(page);
      const file = await download(page, downloadButton(page));
      expect(file.name).toBe("favicon.ico");
      const images = readIco(file.buffer);
      expect(images.map((image) => image.size)).toEqual([16, 32]);
      for (const { size, png } of images) {
        const { format, width, height } = await readPng(png);
        expect([format, width, height]).toEqual(["png", size, size]);
      }
    });

    test("several files are downloaded as one ZIP, sizes in order", async ({
      page,
    }) => {
      await loadPng(page);
      await toggle(page, "Apple Touch Icon").click();
      await toggle(page, "Android Icon").click();
      // Selected out of order: 48, then 16 off and on again.
      await toggle(page, "48x48").click();
      await toggle(page, "16x16").click();
      await toggle(page, "16x16").click();
      const file = await download(page, downloadButton(page));
      expect(file.name).toBe("favicons.zip");
      const zip = await JSZip.loadAsync(file.buffer);
      expect(Object.keys(zip.files).sort()).toEqual([
        "apple-touch-icon.png",
        "favicon.ico",
        "icon-192.png",
        "icon-512.png",
      ]);
      const ico = readIco(await zip.file("favicon.ico").async("nodebuffer"));
      expect(ico.map((image) => image.size)).toEqual([16, 32, 48]);
      for (const [name, size] of [
        ["apple-touch-icon.png", 180],
        ["icon-192.png", 192],
        ["icon-512.png", 512],
      ]) {
        const png = await readPng(await zip.file(name).async("nodebuffer"));
        expect([png.width, png.height], name).toEqual([size, size]);
      }
    });

    test("only the selected formats are output", async ({ page }) => {
      await loadPng(page);
      await toggle(page, "favicon.ico").click();
      await toggle(page, "Apple Touch Icon").click();
      const apple = await download(page, downloadButton(page));
      expect(apple.name).toBe("apple-touch-icon.png");
      const png = await readPng(apple.buffer);
      expect([png.width, png.height]).toEqual([180, 180]);
      // Always on a white background.
      expect(png.pixel).toEqual([255, 255, 255, 255]);

      await toggle(page, "Apple Touch Icon").click();
      await toggle(page, "Android Icon").click();
      const android = await download(page, downloadButton(page));
      expect(android.name).toBe("favicons.zip");
      const zip = await JSZip.loadAsync(android.buffer);
      expect(Object.keys(zip.files).sort()).toEqual([
        "icon-192.png",
        "icon-512.png",
      ]);
    });

    test("the corner radius and the background color reach the files", async ({
      page,
    }) => {
      await loadPng(page);
      await toggle(page, "favicon.ico").click();
      await toggle(page, "Android Icon").click();
      const corner = async () => {
        const file = await download(page, downloadButton(page));
        const zip = await JSZip.loadAsync(file.buffer);
        return (
          await readPng(await zip.file("icon-192.png").async("nodebuffer"))
        ).pixel;
      };
      // The image's corners are transparent.
      expect(await corner()).toEqual([0, 0, 0, 0]);

      await page.getByLabel(m.addBackgroundColor).check();
      const code = page.getByRole("textbox", { name: m.backgroundColorCode });
      await code.fill("#00ff00");
      expect(await corner()).toEqual([0, 255, 0, 255]);

      // Fully rounded: the corner is outside the circle, background or not.
      await setRange(page.getByRole("slider", { name: "値を調整" }), 100);
      expect((await corner())[3]).toBe(0);
    });

    test("without an output format the download button is disabled", async ({
      page,
    }) => {
      await loadPng(page);
      await expect(toggle(page, "16x16")).toBeVisible();
      await toggle(page, "favicon.ico").click();
      await expect(downloadButton(page)).toBeDisabled();
      // The sizes are only for favicon.ico.
      await expect(toggle(page, "16x16")).toHaveCount(0);
    });

    test("favicon.ico without sizes asks for a size", async ({ page }) => {
      await loadPng(page);
      await toggle(page, "16x16").click();
      await toggle(page, "32x32").click();
      await downloadButton(page).click();
      await expect(toast(page, m.errors.selectSize)).toBeVisible();
    });

    test("a file that is not an image, or too large an image, is refused", async ({
      page,
    }) => {
      await chooseFile(page, {
        name: "notes.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("hello"),
      });
      await expect(toast(page, "画像ファイルを選択してください")).toBeVisible();
      await chooseFile(page, await pngFile("huge.png", 5000, 10));
      await expect(
        toast(page, "画像サイズが大きすぎます（最大4096×4096px）"),
      ).toBeVisible();
      await expect(downloadButton(page)).toBeDisabled();
    });

    test("an image can be dropped anywhere on the page", async ({ page }) => {
      await dropFile(page, VIEWBOX_SVG, t.common.dropToUpload);
      await expect(preview(page)).toBeVisible();
      const file = await download(page, downloadButton(page));
      expect(file.name).toBe("favicon.ico");
      expect(readIco(file.buffer).map((image) => image.size)).toEqual([16, 32]);
    });
  });
}
