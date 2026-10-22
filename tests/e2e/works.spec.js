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
    await details.getByRole("link", { name: "ツールを使う" }).click();
    await expect(page).toHaveURL("/lab/svg-optimizer");
  });

  test("every card says it opens details; the photo cards lift on hover", async ({
    page,
  }) => {
    await open(page, "/");
    const cards = page.locator("article[data-work]");
    await expect(cards).toHaveCount(15);
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

test("ui-revise3 2: the footer's Links group is at the right end of the center column", async ({
  page,
}) => {
  await open(page, "/");
  const links = page.locator("footer [data-footer-links]");
  // The center column's right end: the grid's second track.
  const end = await links.evaluate((element) => {
    const grid = element.parentElement;
    const style = getComputedStyle(grid);
    const tracks = style.gridTemplateColumns.split(" ").map(parseFloat);
    const gap = parseFloat(style.columnGap);
    const box = grid.getBoundingClientRect();
    return box.x + parseFloat(style.paddingLeft) + tracks[0] + gap + tracks[1];
  });
  const box = await links.boundingBox();
  expect(Math.abs(box.x + box.width - end)).toBeLessThan(1);
  // Next to Support, with only the column gap between them.
  const support = await links
    .locator("xpath=following-sibling::div[1]")
    .boundingBox();
  expect(support.x).toBeGreaterThan(box.x + box.width);
});

test.describe("the logotype in LINE Seed JP", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("ui-revise2 4, ui-revise3 1: the header, the mobile menu and the footer show unlibra in LINE Seed JP; the hero's h1 is in the body font", async ({
    page,
  }) => {
    await open(page, "/");
    // The mobile menu is open, so that every logotype is rendered.
    await page.getByRole("button", { name: "メニューを開く" }).click();
    await page.evaluate(() => document.fonts.ready);
    const places = {
      header: page.locator("header nav > a [data-logotype]"),
      "mobile menu": page.locator("#mobile-menu [data-logotype]"),
      footer: page.locator("footer [data-logotype]"),
    };
    await expect(page.locator("[data-logotype]")).toHaveCount(3);
    for (const [place, locator] of Object.entries(places)) {
      await expect(locator, place).toHaveText("unlibra");
      const { family, weight, loaded } = await locator.evaluate(
        async (element) => {
          const style = getComputedStyle(element);
          const font = `${style.fontWeight} 16px "LINE Seed JP"`;
          await document.fonts.load(font, element.textContent);
          return {
            family: style.fontFamily,
            weight: style.fontWeight,
            loaded: document.fonts.check(font, element.textContent),
          };
        },
      );
      expect(family, place).toMatch(/^"LINE Seed JP"/);
      expect(weight, place).toBe("700");
      expect(loaded, place).toBe(true);
    }
    // The one font file of LINE Seed JP is the one loaded.
    const loadedFaces = await page.evaluate(() =>
      [...document.fonts]
        .filter((face) => face.family.replace(/"/g, "") === "LINE Seed JP")
        .map((face) => [face.weight, face.status]),
    );
    expect(loadedFaces).toEqual([["700", "loaded"]]);
    // Text that is not the logotype keeps the body font, the hero's h1
    // too (ui-revise3 1).
    await expect(page.locator("footer p").first()).not.toHaveCSS(
      "font-family",
      /LINE Seed JP/,
    );
    await expect(page.locator("[data-hero] h1")).toHaveText(
      "昼はカフェ。夜はバー。",
    );
    await expect(page.locator("[data-hero] h1")).toHaveCSS(
      "font-family",
      /^"Noto Sans JP Variable"/,
    );
  });
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

test.describe("detail dialog on a phone", () => {
  // Short enough that the long description scrolls.
  test.use({ viewport: { width: 375, height: 560 } });

  test("the close button stays in view when the details are scrolled to the end", async ({
    page,
  }) => {
    await open(page, "/");
    await card(page, "fosty-natural")
      .getByRole("button", { name: "fosty natural" })
      .click();
    const details = dialog(page, "fosty natural");
    await expect(details).toBeVisible();
    // The long description scrolls inside the dialog.
    const scrolled = await details.evaluate((element) => {
      const area = [...element.querySelectorAll("div")].find(
        (div) => getComputedStyle(div).overflowY === "auto",
      );
      area.scrollTop = area.scrollHeight;
      return area.scrollTop > 0;
    });
    expect(scrolled).toBe(true);
    const close = details.getByRole("button", { name: "閉じる" });
    await expect(close).toBeInViewport();
    await close.click();
    await expect(details).toBeHidden();
  });
});

test("the card button's name has the visible 詳しく見る (for voice control)", async ({
  page,
}) => {
  await open(page, "/");
  const button = card(page, "fosty-dark").getByRole("button", {
    name: "fosty dark 詳しく見る",
    exact: true,
  });
  await button.click();
  await expect(dialog(page, "fosty dark")).toBeVisible();
});

/**
 * A computed CSS color as sRGB [r, g, b, a] (0-255, a 0-1): Tailwind 4
 * writes oklch(), the former tool site (Tailwind 3) wrote hex.
 */
const srgb = (locator, property, pseudo = null) =>
  locator.evaluate(
    (element, [property, pseudo]) => {
      const value = getComputedStyle(element, pseudo)[property];
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return [r, g, b, Math.round((a / 255) * 100) / 100];
    },
    [property, pseudo],
  );

/** Whether two sRGB colors are the same, allowing 1 for rounding. */
const sameColor = (actual, expected) =>
  actual[3] === expected[3] &&
  [0, 1, 2].every((i) => Math.abs(actual[i] - expected[i]) <= 1);

/**
 * Moves the mouse over an element of a card. The title button's overlay
 * covers the card, so the pointer is on the overlay there, as for a user.
 */
const hoverOver = async (page, locator) => {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
};

/** One card of each kind: featured, frame (both photo categories), list. */
const SAMPLES = {
  featured: "fosty-natural",
  frame: "botsu",
  "frame (VR & 3D)": "dummy-asset",
  "list (Libraries)": "i18n-tiny-astro",
  "list (Apps)": "svg-optimizer",
};

test.describe("ui-revise3 3: the cards", () => {
  for (const scheme of ["light", "dark"]) {
    test(`${scheme}: the list items fade in the former tool site's background on hover and keyboard focus, without moving`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page, "/");
      await chooseTheme(page, "ja", scheme);
      // tool-card.tsx: hover:bg-gray-100 (#f3f4f6 in Tailwind 3) and
      // dark:hover:bg-atom-one-dark-light (#333842), transition-colors.
      const hoverColor =
        scheme === "light" ? [243, 244, 246, 1] : [0x33, 0x38, 0x42, 1];
      const background = (item) => srgb(item, "backgroundColor");
      for (const id of ["svg-optimizer", "tkinter-unblur"]) {
        const item = card(page, id);
        await item.scrollIntoViewIfNeeded();
        expect(sameColor(await background(item), [0, 0, 0, 0]), id).toBe(true);
        const style = await item.evaluate((element) => {
          const s = getComputedStyle(element);
          return {
            property: s.transitionProperty.split(", "),
            duration: s.transitionDuration.split(", ")[0],
            timing: s.transitionTimingFunction,
            padding: s.padding,
            radius: s.borderRadius,
          };
        });
        // Tailwind's transition-colors: 150ms, cubic-bezier(0.4, 0, 0.2, 1).
        expect(style.property).toContain("background-color");
        expect(style.property).not.toContain("translate");
        expect(style.duration).toBe("0.15s");
        expect(style.timing).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
        expect(style.padding).toBe("16px");
        expect(style.radius).toBe("8px");

        await hoverOver(page, item.locator("[data-work-summary]"));
        await expect
          .poll(async () => sameColor(await background(item), hoverColor), id)
          .toBe(true);
        await expect(item).toHaveCSS("translate", "none");
        await expect(item).toHaveCSS("box-shadow", "none");
        await page.mouse.move(0, 0);
        await expect.poll(async () => (await background(item))[3]).toBe(0);

        // Keyboard focus on the title shows the same background.
        await item.locator("[data-work-open]").focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        await expect(item.locator("[data-work-open]")).toBeFocused();
        await expect
          .poll(async () => sameColor(await background(item), hoverColor), id)
          .toBe(true);
      }
    });

    test(`${scheme}: the photo cards and the list items share the title, summary, link, radius and focus styles`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page, "/");
      await chooseTheme(page, "ja", scheme);
      const styles = {};
      for (const [kind, id] of Object.entries(SAMPLES)) {
        const item = card(page, id);
        const title = item.locator("[data-work-title]");
        const summary = item.locator("[data-work-summary]");
        const more = item.locator("[data-work-more]");
        const button = item.locator("[data-work-open]");
        styles[kind] = {
          title: [
            await title.evaluate((e) => getComputedStyle(e).fontWeight),
            await srgb(title, "color"),
          ],
          summary: [
            await summary.evaluate((e) => {
              const s = getComputedStyle(e);
              return [s.fontSize, s.lineHeight];
            }),
            await srgb(summary, "color"),
          ],
          link: [
            await srgb(more, "color"),
            await more.evaluate((e) => getComputedStyle(e).fontSize),
            await more.locator("svg").count(),
          ],
          radius: await item.evaluate((element) => {
            const icon = element.querySelector("div:has(> img)");
            return [
              getComputedStyle(element).borderRadius,
              element.dataset.card === "tool"
                ? getComputedStyle(icon).borderRadius
                : "8px",
            ];
          }),
          focus: await button.evaluate((e) => {
            const s = getComputedStyle(e, "::after");
            return [s.outlineStyle, s.outlineWidth, s.outlineOffset];
          }),
          focusColor: await srgb(button, "outlineColor", "::after"),
        };
        // The actions look like "詳しく見る".
        for (const action of await item.locator("[data-work-action]").all()) {
          expect(await srgb(action, "color"), `${kind} action`).toEqual(
            styles[kind].link[0],
          );
          expect(await action.locator("svg").count()).toBe(1);
          await expect(action).toHaveCSS("font-size", styles[kind].link[1]);
        }
      }
      const [first, ...rest] = Object.values(styles);
      for (const [kind, style] of Object.entries(styles)) {
        expect(style.title, `${kind}: title`).toEqual(first.title);
        expect(style.summary, `${kind}: summary`).toEqual(first.summary);
        expect(style.link, `${kind}: link`).toEqual(first.link);
        // One radius for the photo cards, the list items and the icons.
        expect(style.radius, `${kind}: radius`).toEqual(["8px", "8px"]);
        expect(style.focus, `${kind}: focus`).toEqual(first.focus);
        expect(style.focusColor, `${kind}: focus`).toEqual(first.focusColor);
      }
      expect(rest.length).toBe(4);
      // The summaries are a little larger than the former tool cards' 14px.
      expect(first.summary[0]).toEqual(["16px", "24px"]);
    });
  }

  test("the links move their chevron on hover: an action on its own hover, 詳しく見る on the card's", async ({
    page,
  }) => {
    await open(page, "/");
    const chevron = (locator) =>
      locator.locator("svg").evaluate((e) => getComputedStyle(e).translate);
    for (const id of Object.values(SAMPLES)) {
      const item = card(page, id);
      const more = item.locator("[data-work-more]");
      await item.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await expect.poll(() => chevron(more)).toBe("none");
      await hoverOver(page, item.locator("[data-work-summary]"));
      await expect.poll(() => chevron(more), id).not.toBe("none");
      await expect(more).toHaveCSS("text-decoration-line", "underline");
      for (const action of await item.locator("[data-work-action]").all()) {
        await page.mouse.move(0, 0);
        await expect.poll(() => chevron(action)).toBe("none");
        await expect(action).toHaveCSS("text-decoration-line", "none");
        await action.hover();
        await expect.poll(() => chevron(action), id).not.toBe("none");
        await expect(action).toHaveCSS("text-decoration-line", "underline");
      }
    }
  });

  test("spacing in the cards is on the 8px grid", async ({ page }) => {
    await open(page, "/");
    const offGrid = await page.evaluate(() => {
      const found = [];
      const check = (element, what) => {
        const s = getComputedStyle(element);
        for (const property of [
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
          "rowGap",
          "columnGap",
        ]) {
          const value = s[property];
          if (value === "normal") continue;
          if (parseFloat(value) % 8 !== 0) {
            found.push(`${what}: ${property} ${value}`);
          }
        }
      };
      for (const list of document.querySelectorAll("[data-work-list]")) {
        check(list, list.dataset.workList);
      }
      for (const article of document.querySelectorAll("article[data-work]")) {
        check(article, article.dataset.work);
        for (const div of article.querySelectorAll("div")) {
          check(div, `${article.dataset.work} div`);
        }
      }
      return found;
    });
    expect(offGrid).toEqual([]);
  });

  test("an action goes to its place directly; elsewhere the card opens the details", async ({
    page,
    context,
  }) => {
    await open(page, "/");
    // Every action is in front of the title button's overlay.
    const actions = page.locator("[data-work-action]");
    await expect(actions).toHaveCount(14);
    for (const action of await actions.all()) {
      await action.scrollIntoViewIfNeeded();
      const onTop = await action.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.x + box.width / 2,
          box.y + box.height / 2,
        );
        return hit === element || element.contains(hit);
      });
      expect(onTop, await action.textContent()).toBe(true);
    }
    // DIY Keyboards: no action, "詳しく見る" only.
    await expect(page.locator("#keyboards [data-work-action]")).toHaveCount(0);

    // The external actions open in a new tab, without the details.
    await context.route("https://www.npmjs.com/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "npm" }),
    );
    const newPage = context.waitForEvent("page");
    await card(page, "i18n-tiny-astro")
      .getByRole("link", { name: "npm" })
      .click();
    const tab = await newPage;
    await tab.waitForLoadState();
    expect(tab.url()).toBe("https://www.npmjs.com/package/@i18n-tiny/astro");
    await tab.close();
    await expect(dialog(page, "@i18n-tiny/astro")).toBeHidden();

    // The action's name is its label, described by the work's title.
    await expect(
      card(page, "tkinter-unblur").getByRole("link", { name: "ドキュメント" }),
    ).toHaveAccessibleDescription("tkinter-unblur");

    // The tool page opens without the details.
    await card(page, "svg-optimizer")
      .getByRole("link", { name: "ツールを使う" })
      .click();
    await expect(page).toHaveURL("/lab/svg-optimizer");
  });
});

test.describe("ui-revise3 1: the hero", () => {
  for (const width of [375, 1280]) {
    test(`${width}px: the h1 is one line, with the GitHub and BOOTH buttons side by side below it`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await open(page, "/");
      const heading = page.locator("[data-hero] h1");
      const h1 = await heading.boundingBox();
      const lineHeight = await heading.evaluate((e) =>
        parseFloat(getComputedStyle(e).lineHeight),
      );
      expect(h1.height).toBeLessThan(lineHeight * 1.5);
      const links = page.locator("[data-hero-links] a");
      await expect(links).toHaveText(["GitHub", "BOOTH"]);
      const github = await links.nth(0).boundingBox();
      const booth = await links.nth(1).boundingBox();
      expect(github.y).toBeGreaterThan(h1.y + h1.height);
      expect(Math.round(booth.y)).toBe(Math.round(github.y));
      expect(booth.x).toBeGreaterThan(github.x + github.width);
    });
  }
});
