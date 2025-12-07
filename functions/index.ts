/**
 * Cloudflare Pages Function for language detection and redirect
 *
 * Production only - handles requests to / and redirects to the appropriate locale
 * based on Accept-Language header.
 *
 * - Production (SSG): This function handles / → /ja/ or /en/ redirect
 * - Dev server: /src/middleware.ts handles routing instead
 */

interface EventContext {
  request: Request
}

export const onRequest = ({ request }: EventContext): Response => {
  const acceptLanguage = request.headers.get('Accept-Language') ?? ''

  // Check if Japanese is preferred
  const preferJa = acceptLanguage.toLowerCase().includes('ja')

  const url = new URL(request.url)
  const redirectUrl = preferJa ? '/ja/' : '/en/'

  return Response.redirect(new URL(redirectUrl, url.origin), 302)
}
