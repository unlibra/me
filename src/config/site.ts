import type { Locale } from "@/config/locales";

export const site = {
  title: "unlibra.com",
  url: "https://unlibra.com",
  ogImage: "/ogp.png",
  /** Fixed year (first publication), not the build year. */
  copyright: "© 2025 unlibra",
  links: {
    github: "https://github.com/unlibra",
    sponsor: "https://ofuse.me/unlibra",
  },
} as const;

/** Site-relative path, always starting with "/". */
export type SitePath = `/${string}`;

export const paths = {
  privacy: "/privacy",
  /** Tool list for each language. */
  tools: { ja: "/lab", en: "/en/lab" },
} as const satisfies {
  privacy: SitePath;
  tools: Record<Locale, SitePath>;
};

/**
 * Absolute URL for a site path, without a trailing slash.
 * The top page ("/") becomes the bare origin.
 */
export const absoluteUrl = (path: SitePath): string =>
  site.url + path.replace(/\/+$/, "");
