// Type-level tests, checked by `astro check` (part of `npm run build`).
// Each @ts-expect-error fails the check if the line it marks stops being an
// error, so these prove that ja and en must have exactly the same keys.
import type { LayoutMessages } from "@/messages/layout";

declare const messages: LayoutMessages;

declare const footerWithoutDonate: Omit<LayoutMessages["footer"], "donate">;

export const missingKey: LayoutMessages = {
  ...messages,
  // @ts-expect-error A language that lacks a key is rejected.
  footer: footerWithoutDonate,
};

export const extraKey: LayoutMessages = {
  ...messages,
  // @ts-expect-error A language with an extra key is rejected.
  footer: { ...messages.footer, extra: "extra" },
};

export const nonString: LayoutMessages = {
  ...messages,
  // @ts-expect-error Every text is a string.
  theme: { ...messages.theme, light: 1 },
};
