export const site = {
  title: "unlibra.com",
  url: "https://unlibra.com",
  ogImage: "/ogp.png",
} as const;

/** Site-relative path, always starting with "/". */
export type SitePath = `/${string}`;

/**
 * Absolute URL for a site path, without a trailing slash.
 * The top page ("/") becomes the bare origin.
 */
export const absoluteUrl = (path: SitePath): string =>
  site.url + path.replace(/\/+$/, "");
