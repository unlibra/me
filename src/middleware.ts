/**
 * Middleware for i18n routing (development only)
 *
 * This middleware handles language detection and routing during development.
 * In production (SSG), this file is NOT used - Cloudflare Pages Functions
 * handles the routing instead (see /functions/index.ts).
 *
 * - Dev server: This middleware processes requests
 * - Production: /functions/index.ts handles / → /ja/ or /en/ redirect
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
