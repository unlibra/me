import type { Locale } from "@/config/locales";

export const site = {
  title: "unlibra.com",
  url: "https://unlibra.com",
  ogImage: "/ogp.png",
  links: {
    github: "https://github.com/unlibra",
    sponsor: "https://ofuse.me/unlibra",
    docs: "https://docs.unlibra.com/",
    /** BOOTH shop (provisional; replaced before release, design doc 3.6). */
    booth: "https://unlibra-twin.booth.pm/",
  },
} as const;

/** First publication of the former sites: the start of the copyright notice. */
export const firstYear = 2025;

/**
 * Copyright notice for the footer (design doc 3.7): "© 2025–{year} unlibra",
 * or "© 2025 unlibra" when `year` is the first year. `year` is the build year.
 */
export const copyrightNotice = (year: number): string => {
  if (!Number.isInteger(year) || year < firstYear) {
    throw new Error(`copyright year must be ${firstYear} or later: ${year}`);
  }
  const years = year === firstYear ? `${firstYear}` : `${firstYear}–${year}`;
  return `© ${years} unlibra`;
};

/** Site-relative path, always starting with "/". */
export type SitePath = `/${string}`;

export const paths = {
  privacy: "/privacy",
  /** Where the tool pages live in each language (there is no page here). */
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
