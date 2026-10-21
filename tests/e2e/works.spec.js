// E2E: the top page's cards and their detail dialogs, the footer's Links
// group, the brand font and the page width (ui-revise2 2, 3, 4).
import { expect, test } from "@playwright/test";

import { chooseTheme, hasHorizontalScroll, open } from "./helpers.js";

/** A work's card on the top page. */
const card = (page, id) => page.locator(`article[data-work="${id}"]`);
/** A work's detail dialog. */
const dialog = (page, name) => page.getByRole("dialog", { name, exact: true });

test.describe("detail dialog", () => {
  test("a click anywhere on a card opens its details; Escape closes them", async ({
    page,
  }) => {
    await open(page, "/");
    const details = dialog(page, "fosty dark");
    await expect(details).toBeHidden();
    // Not on the title: on the summary (the title button's overlay covers
    // the card, so this is a click at the summary's place).
    const summaryText = card(page, "fosty-dark").locator("[data-work-summary]");
    await summaryText.scrollIntoViewIfNeeded();
    const summary = await summaryText.boundingBox();
    await page.mouse.click(summary.x + 5, summary.y + summary.height / 2);
    await expect(details).toBeVisible();
    await expect(details).toContainText("fosty natural の兄弟モデル");
    // The page behind does not scroll while the dialog is open.
    await expect
      .poll(() =>
        page.evaluate(
          () => getComputedStyle(document.documentElement).overflow,
        ),
      )
      .toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();
    // Focus goes back to the card's button.
    await expect(
      card(page, "fosty-dark").getByRole("button", { name: "fosty dark" }),
    ).toBeFocused();
  });

  test("Enter on the focused title opens the details; the backdrop and the close button close them", async ({
    page,
  }) => {
    await open(page, "/");
    const button = card(page, "svg-optimizer").getByRole("button", {
      name: "SVG最適化",
    });
    await expect(button).toHaveAttribute("aria-haspopup", "dialog");
    const details = dialog(page, "SVG最適化");

    await button.focus();
    await page.keyboard.press("Enter");
    await expect(details).toBeVisible();
    // A click inside the details keeps them open.
    await details
      .getByText("無料のSVG最適化・圧縮ツール", { exact: false })
      .click();
    await expect(details).toBeVisible();
    // A click on the backdrop (the corner of the window) closes them.
    await page.mouse.click(5, 5);
    await expect(details).toBeHidden();

    await button.focus();
    await page.keyboard.press("Enter");
    await details.getByRole("button", { name: "閉じる" }).click();
    await expect(details).toBeHidden();

    // The link in the details opens the tool.
    await button.click();
    await details.getByRole("link", { name: "ツールを開く" }).click();
    await expect(page).toHaveURL("/lab/svg-optimizer");
  });

  test("every card says it opens details, and lifts on hover", async ({
    page,
  }) => {
    await open(page, "/");
    const cards = page.locator("article[data-work]");
    await expect(cards).toHaveCount(14);
    for (const article of await cards.all()) {
      await expect(article.locator("[data-work-more]")).toBeVisible();
      await expect(article.locator("[data-work-more]")).toHaveText(
        "詳しく見る",
      );
      // The title button's overlay takes clicks on the whole card.
      const hit = await article.evaluate((element) => {
        const box = element.getBoundingClientRect();
        element.scrollIntoView({ block: "center" });
        const after = element.getBoundingClientRect();
        const target = document.elementFromPoint(
          after.x + after.width / 2,
          after.y + after.height - 4,
        );
        return [
          box.width > 0,
          target?.closest("[data-work-open]") !== null,
          target ? getComputedStyle(target).cursor : null,
        ];
      });
      expect(hit).toEqual([true, true, "pointer"]);
    }
    const frame = card(page, "botsu");
    // Tailwind's translate-* set the `translate` property.
    await expect(frame).toHaveCSS("translate", "none");
    await frame.hover();
    await expect
      .poll(() => frame.evaluate((e) => getComputedStyle(e).translate))
      .not.toBe("none");
    await expect
      .poll(() => frame.evaluate((e) => getComputedStyle(e).boxShadow))
      .not.toBe("none");
  });

  test("the featured card spans the width; the others are in columns", async ({
    page,
  }) => {
    await open(page, "/");
    const list = page.locator("#keyboards [data-work-list]");
    const width = (await list.boundingBox()).width;
    const featured = await card(page, "fosty-natural").boundingBox();
    expect(Math.abs(featured.width - width)).toBeLessThan(1);
    // Image and summary side by side.
    const image = await card(page, "fosty-natural")
      .locator("img")
      .boundingBox();
    const summary = await card(page, "fosty-natural")
      .locator("[data-work-summary]")
      .boundingBox();
    expect(summary.x).toBeGreaterThan(image.x + image.width - 1);
    // Three frame cards in a row at 1280px.
    const rest = await Promise.all(
      ["fosty-dark", "botsu", "mira-zero"].map((id) =>
        card(page, id).boundingBox(),
      ),
    );
    expect(new Set(rest.map((box) => Math.round(box.y))).size).toBe(1);
    expect(rest[0].width).toBeLessThan(width / 2);
  });
});

test("ui-revise2 2: the footer's Links group is in the right half of the center column", async ({
  page,
}) => {
  await open(page, "/");
  const links = page.locator("footer [data-footer-links]");
  const column = links.locator("xpath=..");
  const box = await links.boundingBox();
  const center = await column.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(center.x + center.width / 2 - 1);
});

test("ui-revise2 4: the site name and the hero's name are in LINE Seed JP", async ({
  page,
}) => {
  await open(page, "/");
  await page.evaluate(() => document.fonts.ready);
  for (const locator of [
    page.locator("header [data-site-name]"),
    page.locator("[data-hero] h1"),
  ]) {
    await expect(locator).toHaveText("unlibra");
    const { family, weight, loaded } = await locator.evaluate(
      async (element) => {
        const style = getComputedStyle(element);
        await document.fonts.load(
          `${style.fontWeight} 16px "LINE Seed JP"`,
          element.textContent,
        );
        return {
          family: style.fontFamily,
          weight: style.fontWeight,
          loaded: document.fonts.check(
            `${style.fontWeight} 16px "LINE Seed JP"`,
            element.textContent,
          ),
        };
      },
    );
    expect(family).toMatch(/^"LINE Seed JP"/);
    expect(weight).toBe("700");
    expect(loaded).toBe(true);
  }
  // The rest of the page keeps the body font.
  await expect(page.locator("footer span").first()).not.toHaveCSS(
    "font-family",
    /LINE Seed JP/,
  );
});

test.describe("page width of the top page", () => {
  for (const width of [375, 1280]) {
    for (const scheme of ["light", "dark"]) {
      test(`${width}px, ${scheme}: no horizontal scroll, with and without a dialog`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.emulateMedia({ colorScheme: scheme });
        await open(page, "/");
        await chooseTheme(page, "ja", scheme);
        expect(await hasHorizontalScroll(page)).toBe(false);
        for (const [id, name] of [
          ["fosty-natural", "fosty natural"],
          ["i18n-tiny-next", "@i18n-tiny/next"],
        ]) {
          await card(page, id).getByRole("button", { name }).click();
          const details = dialog(page, name);
          await expect(details).toBeVisible();
          const box = await details.boundingBox();
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
          expect(await hasHorizontalScroll(page)).toBe(false);
          await page.keyboard.press("Escape");
          await expect(details).toBeHidden();
        }
      });
    }
  }
});
