// E2E: the top page's cards and their detail dialogs, the footer's Links
// group, the brand font and the page width (ui-revise2 2, 3, 4).
import { expect, test } from "@playwright/test";

import { chooseTheme, hasHorizontalScroll, open } from "./helpers.js";

/** A work's card on the top page. */
const card = (page, id) => page.locator(`article[data-work="${id}"]`);
/** A work's detail dialog. */
const dialog = (page, name) => page.getByRole("dialog", { name, exact: true });
/** A card's title control: the details button or the link (ui-revise4 2). */
const titleControl = (item) => item.locator("[data-work-title] :is(a, button)");

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
    const button = card(page, "botsu").getByRole("button", {
      name: "没キーボード",
    });
    await expect(button).toHaveAttribute("aria-haspopup", "dialog");
    const details = dialog(page, "没キーボード");

    await button.focus();
    await page.keyboard.press("Enter");
    await expect(details).toBeVisible();
    // A click inside the details keeps them open.
    await details
      .getByText("数々のプロトタイプキーボード", { exact: false })
      .click();
    await expect(details).toBeVisible();
    // A click on the backdrop (the corner of the window) closes them.
    await page.mouse.click(5, 5);
    await expect(details).toBeHidden();

    await button.focus();
    await page.keyboard.press("Enter");
    await details.getByRole("button", { name: "閉じる" }).click();
    await expect(details).toBeHidden();
  });

  test("ui-revise4 2: every card is clickable as a whole; only DIY Keyboards say 詳しく見る", async ({
    page,
  }) => {
    await open(page, "/");
    const cards = page.locator("article[data-work]");
    await expect(cards).toHaveCount(12);
    for (const article of await cards.all()) {
      const id = await article.getAttribute("data-work");
      const keyboard = (await article.locator("button").count()) > 0;
      const more = article.locator("[data-work-more]");
      if (keyboard) {
        await expect(more, id).toHaveText("詳しく見る");
        await expect(more.locator("svg"), id).toHaveCount(0);
      } else {
        await expect(more, id).toHaveCount(0);
      }
      // The title control's overlay takes clicks on the whole card.
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
          target?.closest("[data-work-open], [data-work-link]") !== null,
          target ? getComputedStyle(target).cursor : null,
        ];
      });
      expect(hit, id).toEqual([true, true, "pointer"]);
    }
    await expect(page.locator("dialog[data-work-dialog]")).toHaveCount(4);
    await expect(page.locator("#keyboards button[data-work-open]")).toHaveCount(
      4,
    );
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

test.describe("ui-revise4 3: the footer's grid", () => {
  /**
   * The footer's grid tracks and, for each cell (brand, Links, support),
   * its box and the left edges and text alignment of what it contains.
   */
  const layoutOf = (page) =>
    page.locator("footer [data-footer-brand]").evaluate((brand) => {
      const grid = brand.parentElement;
      const style = getComputedStyle(grid);
      const box = grid.getBoundingClientRect();
      const cells = [
        brand,
        grid.querySelector("[data-footer-links]"),
        grid.querySelector("[data-footer-support]"),
      ].map((cell) => {
        const b = cell.getBoundingClientRect();
        return {
          x: b.x,
          y: b.y,
          width: b.width,
          textAlign: getComputedStyle(cell).textAlign,
          // The left edges of the cell's children (logo, heading, list).
          lefts: [...cell.children].map((c) => c.getBoundingClientRect().x),
        };
      });
      return {
        left: box.x + parseFloat(style.paddingLeft),
        tracks: style.gridTemplateColumns.split(" ").map(parseFloat),
        gap: parseFloat(style.columnGap),
        cells,
      };
    });

  test("1280px: four equal columns; the brand takes two, Links and support one each; left-aligned", async ({
    page,
  }) => {
    await open(page, "/");
    const { left, tracks, gap, cells } = await layoutOf(page);
    expect(tracks.length).toBe(4);
    for (const track of tracks)
      expect(Math.abs(track - tracks[0])).toBeLessThan(1);
    const start = (i) => left + i * (tracks[0] + gap);
    const [brand, links, support] = cells;
    // 2:1:1: the brand spans two tracks (and the gap between them).
    expect(Math.abs(brand.x - start(0))).toBeLessThan(1);
    expect(Math.abs(brand.width - (2 * tracks[0] + gap))).toBeLessThan(1);
    expect(Math.abs(links.x - start(2))).toBeLessThan(1);
    expect(Math.abs(links.width - tracks[0])).toBeLessThan(1);
    expect(Math.abs(support.x - start(3))).toBeLessThan(1);
    expect(Math.abs(support.width - tracks[0])).toBeLessThan(1);
    expect(new Set(cells.map((cell) => Math.round(cell.y))).size).toBe(1);
    // Left-aligned in each cell.
    for (const cell of cells) {
      expect(["left", "start"]).toContain(cell.textAlign);
      for (const x of cell.lefts) expect(Math.abs(x - cell.x)).toBeLessThan(1);
    }
  });

  test("375px: one column, stacked as on the former tool site, left-aligned", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page, "/");
    const { left, tracks, cells } = await layoutOf(page);
    expect(tracks.length).toBe(1);
    const [brand, links, support] = cells;
    expect(links.y).toBeGreaterThan(brand.y);
    expect(support.y).toBeGreaterThan(links.y);
    for (const cell of cells) {
      expect(Math.abs(cell.x - left)).toBeLessThan(1);
      for (const x of cell.lefts) expect(Math.abs(x - cell.x)).toBeLessThan(1);
    }
  });
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
          ["mira-zero", "mira zero"],
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
 * Moves the mouse over an element of a card. The title's overlay covers the
 * card, so the pointer is on the overlay there, as for a user.
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
  "frame (VR & 3D)": "mururu-blink-lipsync",
  "list (Libraries)": "i18n-tiny-astro",
  "list (Apps)": "svg-optimizer",
};

test.describe("ui-revise3 3, ui-revise4 2: the cards", () => {
  for (const scheme of ["light", "dark"]) {
    test(`${scheme}: every card fades in the former tool site's background on hover and keyboard focus, without moving or zooming`, async ({
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
      const transitions = {};
      for (const [kind, id] of Object.entries(SAMPLES)) {
        const item = card(page, id);
        await page.mouse.move(0, 0);
        await item.scrollIntoViewIfNeeded();
        await expect
          .poll(async () => sameColor(await background(item), [0, 0, 0, 0]))
          .toBe(true);
        const style = await item.evaluate((element) => {
          const s = getComputedStyle(element);
          return {
            property: s.transitionProperty.split(", "),
            duration: s.transitionDuration.split(", ")[0],
            timing: s.transitionTimingFunction,
            radius: s.borderRadius,
          };
        });
        transitions[kind] = style;
        // Tailwind's transition-colors: 150ms, cubic-bezier(0.4, 0, 0.2, 1).
        expect(style.property, kind).toContain("background-color");
        expect(style.property, kind).not.toContain("translate");
        expect(style.property, kind).not.toContain("box-shadow");
        expect(style.duration, kind).toBe("0.15s");
        expect(style.timing, kind).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
        expect(style.radius, kind).toBe("8px");
        const border = await item.evaluate(
          (e) => getComputedStyle(e).borderTopColor,
        );
        // The image's scale and transform (the logos have a static crop).
        const images = () =>
          item.locator("img").evaluateAll((elements) =>
            elements.map((e) => {
              const s = getComputedStyle(e);
              return [s.scale, s.transform, s.transitionDuration];
            }),
          );
        const before = await images();
        for (const [, , duration] of before) expect(duration, kind).toBe("0s");

        await hoverOver(page, item.locator("[data-work-summary]"));
        await expect
          .poll(async () => sameColor(await background(item), hoverColor), kind)
          .toBe(true);
        // Past the transition: nothing else changed.
        await page.waitForTimeout(400);
        await expect(item).toHaveCSS("translate", "none");
        await expect(item).toHaveCSS("box-shadow", "none");
        await expect(item).toHaveCSS("border-top-color", border);
        expect(await images(), kind).toEqual(before);
        await page.mouse.move(0, 0);
        await expect.poll(async () => (await background(item))[3]).toBe(0);

        // Keyboard focus on the title shows the same background.
        const control = titleControl(item);
        await control.focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        await expect(control).toBeFocused();
        await expect
          .poll(async () => sameColor(await background(item), hoverColor), kind)
          .toBe(true);
      }
      // The same transition on every card.
      const [first, ...rest] = Object.values(transitions);
      for (const style of rest) expect(style).toEqual(first);
    });

    test(`${scheme}: the photo cards and the list items share the title, summary, link, radius and focus styles`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page, "/");
      await chooseTheme(page, "ja", scheme);
      const styles = {};
      const linkStyle = async (locator) => [
        await srgb(locator, "color"),
        await locator.evaluate((e) => getComputedStyle(e).fontSize),
      ];
      for (const [kind, id] of Object.entries(SAMPLES)) {
        const item = card(page, id);
        const title = item.locator("[data-work-title]");
        const summary = item.locator("[data-work-summary]");
        const control = titleControl(item);
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
          radius: await item.evaluate((element) => {
            const icon = element.querySelector("div:has(> img)");
            return [
              getComputedStyle(element).borderRadius,
              element.dataset.card === "tool"
                ? getComputedStyle(icon).borderRadius
                : "8px",
            ];
          }),
          focus: await control.evaluate((e) => {
            const s = getComputedStyle(e, "::after");
            return [s.outlineStyle, s.outlineWidth, s.outlineOffset];
          }),
          focusColor: await srgb(control, "outlineColor", "::after"),
        };
        // "詳しく見る" and the actions: one link style.
        const links = [
          ...(await item.locator("[data-work-more]").all()),
          ...(await item.locator("[data-work-action]").all()),
        ];
        styles[kind].links = await Promise.all(links.map(linkStyle));
      }
      const [first, ...rest] = Object.values(styles);
      const linkStyles = Object.values(styles).flatMap((s) => s.links);
      expect(linkStyles.length).toBeGreaterThan(2);
      for (const style of linkStyles) expect(style).toEqual(linkStyles[0]);
      for (const [kind, style] of Object.entries(styles)) {
        expect(style.title, `${kind}: title`).toEqual(first.title);
        expect(style.summary, `${kind}: summary`).toEqual(first.summary);
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

  test("ui-revise4 2: the links' up-right arrow moves on hover: an action's on its own hover, the title's on the card's; 詳しく見る underlines", async ({
    page,
  }) => {
    await open(page, "/");
    const arrow = (locator) =>
      locator
        .locator('svg[data-icon="arrow-up-right"]')
        .evaluate((e) => getComputedStyle(e).translate);
    for (const id of Object.values(SAMPLES)) {
      const item = card(page, id);
      await item.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const link = item.locator("[data-work-link]");
      const more = item.locator("[data-work-more]");
      if ((await link.count()) > 0) {
        await expect.poll(() => arrow(link)).toBe("none");
      } else {
        await expect(more).toHaveCSS("text-decoration-line", "none");
      }
      await hoverOver(page, item.locator("[data-work-summary]"));
      if ((await link.count()) > 0) {
        await expect.poll(() => arrow(link), id).not.toBe("none");
      } else {
        await expect(more).toHaveCSS("text-decoration-line", "underline");
      }
      for (const action of await item.locator("[data-work-action]").all()) {
        await page.mouse.move(0, 0);
        await expect.poll(() => arrow(action)).toBe("none");
        await expect(action).toHaveCSS("text-decoration-line", "none");
        await action.hover();
        await expect.poll(() => arrow(action), id).not.toBe("none");
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

  test("ui-revise4 2: a click on a card goes to its place; an action goes to its own", async ({
    page,
    context,
  }) => {
    await open(page, "/");
    // Every action is in front of the title link's overlay.
    const actions = page.locator("[data-work-action]");
    await expect(actions).toHaveCount(6);
    await expect(page.locator("#apps [data-work-action]")).toHaveCount(0);
    await expect(page.locator("#vr-3d [data-work-action]")).toHaveCount(0);
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

    // External places open in a new tab: the npm action, and the card of
    // a library (its documentation) and of the BOOTH item.
    for (const pattern of [
      "https://www.npmjs.com/**",
      "https://docs.unlibra.com/**",
      "https://unlibra-twin.booth.pm/**",
    ]) {
      await context.route(pattern, (route) =>
        route.fulfill({ contentType: "text/html", body: "ok" }),
      );
    }
    const newTab = async (click, url) => {
      const opened = context.waitForEvent("page");
      await click();
      const tab = await opened;
      await tab.waitForLoadState();
      expect(tab.url()).toBe(url);
      await tab.close();
      await expect(page).toHaveURL("/");
    };
    await newTab(
      () =>
        card(page, "i18n-tiny-astro")
          .getByRole("link", { name: "npm" })
          .click(),
      "https://www.npmjs.com/package/@i18n-tiny/astro",
    );
    await newTab(
      () => hoverClick(page, card(page, "i18n-tiny-astro")),
      "https://docs.unlibra.com/i18n-tiny/astro/introduction",
    );
    await newTab(
      () => hoverClick(page, card(page, "mururu-blink-lipsync")),
      "https://unlibra-twin.booth.pm/items/9009879",
    );

    // The action's name is its label, described by the work's title.
    await expect(
      card(page, "tkinter-unblur").getByRole("link", { name: "ドキュメント" }),
    ).toHaveAccessibleDescription("tkinter-unblur");
    // The card link's name is the title.
    await expect(
      card(page, "svg-optimizer").getByRole("link", {
        name: "SVG最適化",
        exact: true,
      }),
    ).toHaveAttribute("href", "/lab/svg-optimizer");

    // An app's card opens the tool page in the same tab, without details.
    await hoverClick(page, card(page, "svg-optimizer"));
    await expect(page).toHaveURL("/lab/svg-optimizer");
  });
});

/** Clicks a card at its summary (on the title's overlay), as a user would. */
const hoverClick = async (page, item) => {
  const summary = item.locator("[data-work-summary]");
  await summary.scrollIntoViewIfNeeded();
  const box = await summary.boundingBox();
  await page.mouse.click(box.x + 5, box.y + box.height / 2);
};

test.describe("ui-revise3 1, ui-revise4 1: the hero", () => {
  for (const width of [375, 1280]) {
    test(`${width}px: the h1 is one line in text-2xl, with the GitHub and BOOTH text buttons side by side below it`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await open(page, "/");
      // No brand symbol (ui-revise4 1).
      await expect(page.locator("[data-hero] svg")).toHaveCount(3);
      await expect(
        page.locator('[data-hero] svg[data-icon="arrow-up-right"]'),
      ).toHaveCount(2);
      const heading = page.locator("[data-hero] h1");
      // text-2xl: 24px at every width.
      await expect(heading).toHaveCSS("font-size", "24px");
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
      // Text buttons: no background or ring; the text and the arrow.
      for (const link of await links.all()) {
        await expect(link).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await expect(link).toHaveCSS("box-shadow", "none");
        await expect(link.locator("svg")).toBeVisible();
      }
    });
  }
});
