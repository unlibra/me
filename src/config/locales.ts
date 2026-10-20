export const locales = ["ja", "en"] as const;

export type Locale = (typeof locales)[number];

/** Locale used for `x-default` and pages without an English version. */
export const defaultLocale = "ja" satisfies Locale;

export const ogLocales = {
  ja: "ja_JP",
  en: "en_US",
} as const satisfies Record<Locale, string>;
