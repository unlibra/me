// E2E: Password Generator (replaces the Phase 4 E7 checks).
import { expect, test } from "@playwright/test";

import {
  grantClipboard,
  LOCALES,
  open,
  readClipboard,
  setRange,
  toast,
  toolUrl,
} from "./helpers.js";

const AMBIGUOUS = /[0O1lI]/;

for (const locale of LOCALES) {
  const { t } = locale;
  const m = t.passwordGenerator;

  test.describe(`password generator (${locale.lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, toolUrl(locale, "password-generator"));
    });

    const passwordText = (page) => page.locator("div.font-mono").first();

    test("shows a password on opening, and the length slider sets its length", async ({
      page,
    }) => {
      await expect(passwordText(page)).toHaveText(/^\S{16}$/);
      const slider = page.getByRole("slider", { name: m.length });
      for (const length of [8, 32, 64]) {
        await setRange(slider, length);
        await expect(passwordText(page)).toHaveText(
          new RegExp(`^\\S{${length}}$`),
        );
      }
    });

    test("the character types decide which characters are used", async ({
      page,
    }) => {
      const pill = (name) => page.getByRole("button", { name });
      await setRange(page.getByRole("slider", { name: m.length }), 64);
      // Defaults: uppercase, lowercase and numbers on, symbols off.
      for (const [name, pressed] of [
        ["Toggle uppercase", "true"],
        ["Toggle lowercase", "true"],
        ["Toggle numbers", "true"],
        ["Toggle symbols", "false"],
      ]) {
        await expect(pill(name)).toHaveAttribute("aria-pressed", pressed);
      }
      await expect(passwordText(page)).toHaveText(/^[A-Za-z0-9]{64}$/);

      await pill("Toggle uppercase").click();
      await pill("Toggle lowercase").click();
      await expect(passwordText(page)).toHaveText(/^[0-9]{64}$/);
      await pill("Toggle numbers").click();
      await pill("Toggle symbols").click();
      await expect(passwordText(page)).toHaveText(/^[!@#$%^&*\-_+=?]{64}$/);
    });

    test("with no character type, it asks for one and cannot copy or regenerate", async ({
      page,
    }) => {
      for (const name of [
        "Toggle uppercase",
        "Toggle lowercase",
        "Toggle numbers",
      ]) {
        await page.getByRole("button", { name }).click();
      }
      await expect(passwordText(page)).toHaveText(m.selectCharacterTypes);
      await expect(
        page.getByRole("button", { name: m.copyToClipboard }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: t.common.regenerate }),
      ).toBeDisabled();
    });

    test("regenerate gives a new password", async ({ page }) => {
      const first = await passwordText(page).textContent();
      await page.getByRole("button", { name: t.common.regenerate }).click();
      await expect(passwordText(page)).not.toHaveText(first);
      await expect(passwordText(page)).toHaveText(/^\S{16}$/);
    });

    test("ambiguous characters are left out unless the switch is off", async ({
      page,
    }) => {
      await setRange(page.getByRole("slider", { name: m.length }), 64);
      const regenerate = page.getByRole("button", {
        name: t.common.regenerate,
      });
      const seen = async () => {
        let all = "";
        for (let i = 0; i < 20; i++) {
          await regenerate.click();
          all += await passwordText(page).textContent();
        }
        return all;
      };
      const avoid = page.getByRole("switch", { name: m.avoidAmbiguous });
      await expect(avoid).toBeChecked();
      expect(await seen()).not.toMatch(AMBIGUOUS);
      await avoid.click();
      await expect(avoid).not.toBeChecked();
      expect(await seen()).toMatch(AMBIGUOUS);
    });

    test("the slider's track follows the theme", async ({ page }) => {
      const slider = page.getByRole("slider", { name: m.length });
      const track = () => slider.evaluate((input) => input.style.background);
      await page.evaluate(() =>
        document.documentElement.classList.remove("dark"),
      );
      await expect.poll(track).toContain("rgb(226, 232, 240)");
      await page.evaluate(() => document.documentElement.classList.add("dark"));
      await expect.poll(track).toContain("rgb(75, 85, 99)");
    });

    test("copy puts the password on the clipboard and shows a toast", async ({
      page,
      context,
      baseURL,
    }) => {
      await grantClipboard(context, baseURL);
      const password = await passwordText(page).textContent();
      await page.getByRole("button", { name: m.copyToClipboard }).click();
      await expect(toast(page, t.common.copied)).toBeVisible();
      expect(await readClipboard(page)).toBe(password);
    });
  });
}
