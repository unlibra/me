import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const disableRobots = process.env.DISABLE_ROBOTS === "true";
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || "https://unlibra.com";

  const robotsTxt = disableRobots
    ? `User-agent: *
Disallow: /`
    : `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
