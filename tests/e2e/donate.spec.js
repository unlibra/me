// E2E: the donate page: the copy button (the password generator's) puts the
// address on the clipboard and shows a toast, and the Amazon button's text
// is at least 4.5:1 with its background in both themes, at rest and on
// hover.
import { expect, test } from "@playwright/test";

import { site } from "../../src/config/site.ts";
import ja from "../../src/tools/messages/ja.ts";
import {
  chooseTheme,
  grantClipboard,
  luminance,
  open,
  readClipboard,
  toast,
} from "./helpers.js";

const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const copyButton = (page) =>
  page.getByRole("button", { name: "メールアドレスをクリップボードにコピー" });

test("the copy button copies the address and shows a toast", async ({
  page,
  context,
  baseURL,
}) => {
  await grantClipboard(context, baseURL);
  await open(page, "/donate");
  await expect(
    page.getByText(site.donation.email, { exact: true }),
  ).toBeVisible();
  await copyButton(page).click();
  await expect(toast(page, ja.common.copied)).toBeVisible();
  expect(await readClipboard(page)).toBe(site.donation.email);
});

test("before the address is decoded, the button copies nothing and says so", async ({
  page,
  context,
  baseURL,
}) => {
  await grantClipboard(context, baseURL);
  await open(page, "/donate");
  // What Cloudflare's Email Address Obfuscation leaves until its script runs.
  await page
    .locator("[data-donate-email]")
    .evaluate((e) => (e.textContent = "[email protected]"));
  await page.evaluate(() => navigator.clipboard.writeText("before"));
  await copyButton(page).click();
  await expect(toast(page, "コピーに失敗しました")).toBeVisible();
  expect(await readClipboard(page)).toBe("before");
});

test("the Amazon link opens the gift card in a new tab", async ({ page }) => {
  await open(page, "/donate");
  const link = page.getByRole("link", { name: "Amazonギフトカードを贈る" });
  await expect(link).toHaveAttribute("href", site.donation.amazonGift);
  await expect(link).toHaveAttribute("target", "_blank");
});

for (const scheme of ["light", "dark"]) {
  test(`${scheme}: the Amazon button's text is at least 4.5:1, at rest and on hover`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await open(page, "/donate");
    await chooseTheme(page, "ja", scheme);
    const button = page.getByRole("link", { name: "Amazonギフトカードを贈る" });
    for (const state of ["rest", "hover"]) {
      if (state === "hover") await button.hover();
      else await page.mouse.move(0, 0);
      const text = await luminance(button, "color");
      const back = await luminance(button, "backgroundColor");
      expect(ratio(text, back), state).toBeGreaterThanOrEqual(4.5);
    }
  });
}
