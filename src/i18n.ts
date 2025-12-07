import { define } from "@i18n-tiny/astro";
import enMessages from "@/messages/en";
import jaMessages from "@/messages/ja";

export const locales = ["en", "ja"] as const;
export const defaultLocale = "ja";

export type Locale = (typeof locales)[number];

export const { getMessages, getTranslations } = define({
  locales,
  defaultLocale,
  messages: { en: enMessages, ja: jaMessages },
});

export const localeNames: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
};
