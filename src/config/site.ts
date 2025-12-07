export const site = {
  title: import.meta.env.PUBLIC_SITE_TITLE || "unlibra.com",
  url: import.meta.env.PUBLIC_SITE_URL || "https://unlibra.com",
  canonicalUrl: "https://unlibra.com",
  ogImage: "/ogp.png",
} as const;
