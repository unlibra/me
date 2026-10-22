// E2E: the 404 page (not-found): the planet in a screen of stars, the
// heading and the capsule button to the top, without the header and the
// footer, dark in either theme.
import { expect, test } from "@playwright/test";

import { hasHorizontalScroll } from "./helpers.js";

const MISSING = "/no-such-page";

for (const [width, height] of [
  [375, 667],
  [1280, 800],
]) {
  for (const scheme of ["light", "dark"]) {
    test(`${width}px, ${scheme}: a missing path returns 404 with the full-screen page`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme: scheme });
      const response = await page.goto(MISSING);
      expect(response.status()).toBe(404);
      await page.evaluate(() => document.fonts.ready);

      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toHaveText("ページが見つかりません");
      const back = page.getByRole("link", { name: "トップに戻る" });
      await expect(back).toHaveAttribute("href", "/");
      // A capsule: the radius is at least half the height.
      const capsule = await back.evaluate((e) => {
        const s = getComputedStyle(e);
        return parseFloat(s.borderTopLeftRadius) >= e.offsetHeight / 2;
      });
      expect(capsule).toBe(true);

      // No header and no footer.
      await expect(page.locator("header, footer")).toHaveCount(0);

      // The background: #282c34 over the whole screen, in either theme, with
      // the stars over all of it.
      const main = page.locator("[data-not-found]");
      await expect(main).toHaveCSS("background-color", "rgb(40, 44, 52)");
      const box = await main.boundingBox();
      expect(box.x).toBe(0);
      expect(box.y).toBe(0);
      expect(Math.round(box.width)).toBe(width);
      expect(Math.round(box.height)).toBe(height);
      // The stars: the tile repeated over the background, one tile the size
      // of the planet's box (the original SVG's 100×100), centered.
      const tile = await main.evaluate((e) => {
        const s = getComputedStyle(e);
        return [
          s.backgroundImage,
          s.backgroundRepeat,
          s.backgroundSize,
          s.backgroundPosition,
        ];
      });
      const planetSize = await page
        .locator("[data-planet]")
        .evaluate((e) => e.getBoundingClientRect().width);
      expect(tile[0]).toMatch(/stars\.[\w-]+\.svg/);
      expect(tile[1]).toBe("repeat");
      const [tw, th] = tile[2].split(" ").map(parseFloat);
      expect(Math.abs(tw - planetSize)).toBeLessThan(1);
      expect(Math.abs(th - planetSize)).toBeLessThan(1);
      expect(tile[3]).toBe("50% 50%");

      // The planet: in the middle, about half of the short side, on the
      // screen; the heading and the button below it, also on the screen.
      const planet = await page.locator("[data-planet]").boundingBox();
      const short = Math.min(width, height);
      expect(planet.width).toBeGreaterThanOrEqual(short * 0.4);
      expect(planet.width).toBeLessThanOrEqual(short * 0.5 + 1);
      expect(
        Math.abs(planet.x + planet.width / 2 - width / 2),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(planet.y + planet.height / 2 - height / 2),
      ).toBeLessThanOrEqual(1);
      const h1 = await heading.boundingBox();
      const button = await back.boundingBox();
      expect(h1.y).toBeGreaterThanOrEqual(planet.y + planet.height);
      expect(button.y).toBeGreaterThanOrEqual(h1.y + h1.height);
      for (const b of [planet, h1, button]) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(width);
        expect(b.y + b.height).toBeLessThanOrEqual(height);
      }
      // One screen: no scroll either way.
      expect(await hasHorizontalScroll(page)).toBe(false);
      const scroll = await page.evaluate(() => {
        window.scrollTo(100, 100);
        return [scrollX, scrollY];
      });
      expect(scroll).toEqual([0, 0]);
    });
  }
}

test("the planet turns, and stops under prefers-reduced-motion: reduce", async ({
  page,
}) => {
  const animations = () =>
    page
      .locator("[data-planet] .dbpa-surface, [data-planet] .dbpa-moons")
      .evaluateAll((elements) =>
        elements.map((e) => getComputedStyle(e).animationName),
      );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(MISSING);
  expect(await animations()).toEqual(["dbpaSpin", "dbpaSpin"]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await animations()).toEqual(["none", "none"]);
});

test("the button goes back to the top page", async ({ page }) => {
  await page.goto(MISSING);
  await page.getByRole("link", { name: "トップに戻る" }).click();
  await expect(page).toHaveURL("/");
});
