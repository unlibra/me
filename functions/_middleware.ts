/**
 * Cloudflare Pages Middleware for i18n routing
 *
 * Handles language detection and routing for all non-locale-prefixed paths:
 * - Japanese (Accept-Language: ja): Internal rewrite to /ja/* content
 * - Other languages: Redirect to /en/*
 *
 * Excluded paths (passed through directly):
 * - /_astro/* (static assets)
 * - /_image/* (image optimization)
 * - /ja* (Japanese locale - includes /ja and /ja/*)
 * - /en* (English locale - includes /en and /en/*)
 * - /privacy* (language-neutral pages)
 */

interface Env {
  ASSETS: {
    fetch: (request: Request | URL | string) => Promise<Response>;
  };
}

interface EventContext {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}

export const onRequest = async ({ request, env, next }: EventContext): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Excluded paths - pass through to static assets
  // Note: /ja and /en (without trailing slash) are included for language switcher links
  if (
    path.startsWith("/_astro/") ||
    path.startsWith("/_image/") ||
    path.startsWith("/ja") ||
    path.startsWith("/en") ||
    path.startsWith("/privacy")
  ) {
    return next();
  }

  // Language detection from Accept-Language header (respect priority order)
  const acceptLang = request.headers.get("Accept-Language") ?? "";
  // Parse Accept-Language and get the primary (highest priority) language
  const primaryLang = acceptLang.split(",")[0]?.trim().toLowerCase() ?? "";
  const preferJa = primaryLang.startsWith("ja");

  if (preferJa) {
    // Japanese: Internal rewrite (URL stays the same, content from /ja/*)
    const rewritePath = path === "/" ? "/ja/" : `/ja${path}`;
    return env.ASSETS.fetch(new URL(rewritePath, url.origin));
  }

  // Other languages: Redirect to /en/*
  const redirectPath = path === "/" ? "/en/" : `/en${path}`;
  return Response.redirect(new URL(redirectPath, url.origin), 302);
};
