// E2E: the donate page: the copy button puts the address on the clipboard
// and says so, and the buttons' text is at least 4.5:1 with their
// background in both themes, at rest and on hover.
import { expect, test } from "@playwright/test";

import { site } from "../../src/config/site.ts";
import {
  chooseTheme,
  grantClipboard,
  luminance,
  open,
  readClipboard,
} from "./helpers.js";

const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

test("the copy button copies the address and announces it", async ({
  page,
  context,
  baseURL,
}) => {
  await grantClipboard(context, baseURL);
  await open(page, "/donate");
  await expect(
    page.getByText(site.donation.email, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "コピー", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("コピーしました");
  expect(await readClipboard(page)).toBe(site.donation.email);
});

test("the Amazon link opens the e-gift card in a new tab", async ({ page }) => {
  await open(page, "/donate");
  const link = page.getByRole("link", { name: "Amazon eギフトカードを贈る" });
  await expect(link).toHaveAttribute("href", site.donation.amazonGift);
  await expect(link).toHaveAttribute("target", "_blank");
});

for (const scheme of ["light", "dark"]) {
  test(`${scheme}: the buttons' text is at least 4.5:1, at rest and on hover`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await open(page, "/donate");
    await chooseTheme(page, "ja", scheme);
    for (const button of [
      page.getByRole("button", { name: "コピー", exact: true }),
      page.getByRole("link", { name: "Amazon eギフトカードを贈る" }),
    ]) {
      for (const state of ["rest", "hover"]) {
        if (state === "hover") await button.hover();
        else await page.mouse.move(0, 0);
        const text = await luminance(button, "color");
        const back = await luminance(button, "backgroundColor");
        expect(ratio(text, back), state).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
}
