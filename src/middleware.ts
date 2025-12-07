import { defineMiddleware } from "astro/middleware";
import { create } from "@i18n-tiny/astro/middleware";
import { locales, defaultLocale, fallbackLocale } from "@/i18n";

const middleware = create({
  locales,
  defaultLocale,
  fallbackLocale,
  excludePaths: ["/privacy"]
});

export const onRequest = defineMiddleware(middleware);
