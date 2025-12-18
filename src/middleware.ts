/**
 * Middleware for i18n routing (development only)
 *
 * This middleware handles language detection and routing during development.
 * In production (SSG), this file is NOT used - edge middleware handles routing:
 * - Vercel: /middleware.ts
 * - Cloudflare Pages: /functions/_middleware.ts
 */
import { defineMiddleware } from "astro/middleware";
import { create } from "@i18n-tiny/astro/middleware";
import { locales, defaultLocale } from "@/i18n";

const middleware = create({
  locales,
  defaultLocale,
  excludePaths: ["/privacy"],
});

export const onRequest = defineMiddleware(middleware);
