// E2E: the header's category links and the mobile menu (ui-revise 1 and 4,
// ui-revise2 1 and 6).
import { expect, test } from "@playwright/test";

import { layoutMessages } from "../../src/messages/layout.ts";
import { chooseTheme, hasHorizontalScroll, open } from "./helpers.js";

const t = layoutMessages.ja.header;
const SECTIONS = [
  ["keyboards", "DIY Keyboards"],
  ["libraries", "Libraries"],
  ["apps", "Apps"],
  ["vr-3d", "VR & 3D"],
];

test.describe("desktop", () => {
  test("the category links scroll to their sections of the top page", async ({
    page,
  }) => {
    await open(page, "/lab/svg-optimizer");
    const header = page.locator("header");
    for (const [id, name] of SECTIONS) {
      await header.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(`/#${id}`);
      await expect(
        page.getByRole("heading", { level: 2, name, exact: true }),
      ).toBeInViewport();
    }
  });

  test("the categories are links only, with no menu to open", async ({
    page,
  }) => {
    for (const path of ["/", "/en/lab/favicon-generator"]) {
      await open(page, path);
      const nav = page.locator("header [data-category-nav]");
      await expect(nav.getByRole("link")).toHaveText(
        SECTIONS.map(([, name]) => name),
      );
      await expect(nav.getByRole("button")).toHaveCount(0);
      await expect(page.locator("#category-web-menu")).toHaveCount(0);
    }
  });

  test("the mobile menu button is not shown", async ({ page }) => {
    await open(page, "/");
    await expect(page.getByRole("button", { name: t.openMenu })).toBeHidden();
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the menu opens, links to the sections, and closes", async ({
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
    // The home link, then the four categories; no tools.
    await expect(menu.getByRole("link")).toHaveText([
      "unlibra",
      ...SECTIONS.map(([, name]) => name),
    ]);

    // Escape and the close button close it.
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(openButton).toHaveAttribute("aria-expanded", "false");
    await openButton.click();
    await menu.getByRole("button", { name: t.closeMenu }).click();
    await expect(menu).toBeHidden();

    // A section link closes the menu and scrolls to the section.
    for (const [id, name] of [SECTIONS[3], SECTIONS[2]]) {
      await openButton.click();
      await menu.getByRole("link", { name, exact: true }).click();
      await expect(menu).toBeHidden();
      await expect(page).toHaveURL(`/#${id}`);
      await expect(
        page.getByRole("heading", { level: 2, name, exact: true }),
      ).toBeInViewport();
    }
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
      // Header, mobile menu and footer (the hero's was removed in
      // ui-revise4 1).
      const count = 3;
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
