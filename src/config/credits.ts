// The credits page (/credits, ui-revise6 4). The materials by other authors
// are those of section 2 of LICENSE, which is the source of truth: each entry
// has the name, the copyright holder, the license and the URL written there
// (tests/credits.test.js finds a source in LICENSE that is missing here).

/** One credit: the material's name, its author, its license and its page. */
export interface Credit {
  name: string;
  author: string;
  license: string;
  url: `https://${string}`;
}

/** The characters in the site's images. */
export const characters = [{ name: "ムルル", rights: "©Lethal Cats" }] as const;

/** The material by other authors listed in section 2 of LICENSE, in its order. */
export const materials: readonly Credit[] = [
  {
    name: "Tabler Icons 3.49.0",
    author: "Paweł Kuna",
    license: "MIT License",
    url: "https://tabler.io/icons",
  },
  {
    name: "Tailwind CSS v3 color palette",
    author: "Tailwind Labs, Inc.",
    license: "MIT License",
    url: "https://tailwindcss.com",
  },
  {
    name: 'DiceBear "Shapes" and "Planets"',
    author: "DiceBear",
    license: "CC0 1.0 Universal",
    url: "https://www.dicebear.com",
  },
];

/**
 * The fonts the site ships (LICENSE, section 4). The author is the copyright
 * holder in the font files; the URL is the npm package's page.
 */
export const fonts: readonly (Credit & { package: string })[] = [
  {
    name: "Noto Sans JP",
    package: "@fontsource-variable/noto-sans-jp",
    author: "Adobe",
    license: "SIL Open Font License 1.1",
    url: "https://fontsource.org/fonts/noto-sans-jp",
  },
  {
    name: "LINE Seed JP",
    package: "@fontsource/line-seed-jp",
    author: "LY Corporation",
    license: "SIL Open Font License 1.1",
    url: "https://fontsource.org/fonts/line-seed-jp",
  },
  {
    name: "Geist Mono",
    package: "@fontsource/geist-mono",
    author: "The Geist Project Authors",
    license: "SIL Open Font License 1.1",
    url: "https://fontsource.org/fonts/geist-mono",
  },
];

/** The list of the npm packages in the build output, with their licenses. */
export const thirdPartyLicensesPath = "/third-party-licenses.txt";
