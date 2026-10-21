// E2E: the header's category links, the web tools menu and the mobile menu
// (ui-revise 1 and 4).
import { expect, test } from "@playwright/test";

import { layoutMessages } from "../../src/messages/layout.ts";
import en from "../../src/tools/messages/en.ts";
import ja from "../../src/tools/messages/ja.ts";
import { chooseTheme, hasHorizontalScroll, open } from "./helpers.js";

const t = layoutMessages.ja.header;

test.describe("desktop", () => {
  test("the category links scroll to their sections of the top page", async ({
    page,
  }) => {
    await open(page, "/lab/svg-optimizer");
    const header = page.locator("header");
    await header.getByRole("link", { name: t.categories.vrchat }).click();
    await expect(page).toHaveURL("/#vrchat");
    await expect(
      page.getByRole("heading", { level: 2, name: "VRChat" }),
    ).toBeInViewport();

    await header.getByRole("link", { name: t.categories.keyboard }).click();
    await expect(page).toHaveURL("/#keyboard");
    await expect(
      page.getByRole("heading", { level: 2, name: t.categories.keyboard }),
    ).toBeInViewport();
  });

  test("the web tools menu lists the section and the four tools", async ({
    page,
  }) => {
    await open(page, "/");
    const button = page.getByRole("button", { name: t.categories.web });
    const menu = page.locator("#category-web-menu");
    await expect(menu).toBeHidden();

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link")).toHaveText([
      t.allWebTools,
      ...Object.values(ja.tools).map((tool) => new RegExp(`^${tool.name}`)),
    ]);
    // Focus moves into the menu; Escape closes it and returns focus.
    await expect(menu.getByRole("link").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();

    // A link to the section on the same page closes the menu.
    await button.click();
    await menu.getByRole("link", { name: t.allWebTools }).click();
    await expect(page).toHaveURL("/#web");
    await expect(menu).toBeHidden();

    await button.click();
    await menu
      .getByRole("link", { name: ja.tools["svg-optimizer"].name })
      .click();
    await expect(page).toHaveURL("/lab/svg-optimizer");
  });

  test("on an English tool page the menu is in English", async ({ page }) => {
    await open(page, "/en/lab/favicon-generator");
    const t = layoutMessages.en.header;
    await page.getByRole("button", { name: t.categories.web }).click();
    await page
      .locator("#category-web-menu")
      .getByRole("link", { name: en.tools["password-generator"].name })
      .click();
    await expect(page).toHaveURL("/en/lab/password-generator");
  });

  test("the mobile menu button is not shown", async ({ page }) => {
    await open(page, "/");
    await expect(page.getByRole("button", { name: t.openMenu })).toBeHidden();
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the menu opens, links to sections and tools, and closes", async ({
    page,
  }) => {
    await open(page, "/");
    // The desktop links are not shown.
    await expect(
      page.locator("header [data-category-nav]").getByRole("link").first(),
    ).toBeHidden();

    const openButton = page.getByRole("button", { name: t.openMenu });
    const menu = page.getByRole("dialog", { name: t.menu });
    await expect(menu).toBeHidden();
    await openButton.click();
    await expect(menu).toBeVisible();
    await expect(openButton).toHaveAttribute("aria-expanded", "true");
    expect(await hasHorizontalScroll(page)).toBe(false);

    // Escape and the close button close it.
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(openButton).toHaveAttribute("aria-expanded", "false");
    await openButton.click();
    await menu.getByRole("button", { name: t.closeMenu }).click();
    await expect(menu).toBeHidden();

    // A section link closes the menu and scrolls to the section.
    await openButton.click();
    await menu.getByRole("link", { name: t.categories.vrchat }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL("/#vrchat");
    await expect(
      page.getByRole("heading", { level: 2, name: "VRChat" }),
    ).toBeInViewport();

    await openButton.click();
    await menu
      .getByRole("link", { name: ja.tools["tw-palette-generator"].name })
      .click();
    await expect(page).toHaveURL("/lab/tw-palette-generator");
  });

  test("a click outside the panel closes the menu", async ({ page }) => {
    await open(page, "/privacy");
    await page.getByRole("button", { name: t.openMenu }).click();
    const menu = page.getByRole("dialog", { name: t.menu });
    await expect(menu).toBeVisible();
    // Inside the panel (an empty part of it) the menu stays open.
    await page.mouse.click(150, 780);
    await expect(menu).toBeVisible();
    // The backdrop on the right closes it.
    await page.mouse.click(360, 400);
    await expect(menu).toBeHidden();
  });
});

test.describe("brand symbol", () => {
  const DARK = "rgb(39, 39, 42)"; // #27272a
  const LIGHT = "rgb(245, 245, 244)"; // #f5f5f4

  /** [circle fill, mark fill] of every brand symbol on the page. */
  const fills = (page) =>
    page
      .locator("[data-brand-symbol]")
      .evaluateAll((symbols) =>
        symbols.map((svg) => [
          getComputedStyle(svg.querySelector("circle")).fill,
          getComputedStyle(svg.querySelector("path")).fill,
        ]),
      );

  for (const path of ["/", "/en/lab/svg-optimizer"]) {
    test(`${path}: the circle and the mark swap colors in dark mode`, async ({
      page,
    }) => {
      const lang = path.startsWith("/en/") ? "en" : "ja";
      await page.emulateMedia({ colorScheme: "light" });
      await open(page, path);
      // Header, mobile menu and footer (and the hero on the top page).
      const count = path === "/" ? 4 : 3;
      await chooseTheme(page, lang, "light");
      await expect
        .poll(() => fills(page))
        .toEqual(Array(count).fill([DARK, LIGHT]));
      await chooseTheme(page, lang, "dark");
      await expect
        .poll(() => fills(page))
        .toEqual(Array(count).fill([LIGHT, DARK]));
    });
  }
});
