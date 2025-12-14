/**
 * Vercel Edge Middleware for i18n routing
 *
 * NOTE: This file is ONLY used by Vercel. Vercel requires middleware.ts at project root.
 * For Cloudflare Pages, see functions/_middleware.ts (equivalent functionality).
 *
 * Handles language detection and routing for all non-locale-prefixed paths:
 * - Japanese (Accept-Language: ja): Internal rewrite to /ja/* content
 * - Other languages: Redirect to /en/*
 */
export default function middleware(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Excluded paths - pass through to static assets
  if (
    path.startsWith("/_astro/") ||
    path.startsWith("/_image/") ||
    path.startsWith("/ja") ||
    path.startsWith("/en") ||
    path.startsWith("/privacy") ||
    path.startsWith("/lab") ||
    path.includes(".")
  ) {
    return;
  }

  // Language detection from Accept-Language header
  const acceptLang = request.headers.get("Accept-Language") ?? "";
  const primaryLang = acceptLang.split(",")[0]?.trim().toLowerCase() ?? "";
  const preferJa = primaryLang.startsWith("ja");

  if (preferJa) {
    // Japanese: Internal rewrite (URL stays the same, content from /ja/*)
    const rewritePath = path === "/" ? "/ja/" : `/ja${path}`;
    return fetch(new URL(rewritePath, url.origin), {
      headers: request.headers,
    });
  }

  // Other languages: Redirect to /en/*
  const redirectPath = path === "/" ? "/en/" : `/en${path}`;
  return Response.redirect(new URL(redirectPath, url.origin), 302);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
