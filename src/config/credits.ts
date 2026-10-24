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
    name: "Tabler Icons",
    author: "Paweł Kuna",
    license: "MIT License",
    url: "https://tabler.io/icons",
  },
  {
    name: 'DiceBear "Shapes" and "Planets"',
    author: "DiceBear",
    license: "CC0 1.0 Universal",
    url: "https://www.dicebear.com",
  },
];

/** The list of the npm packages in the build output, with their licenses. */
export const thirdPartyLicensesPath = "/third-party-licenses.txt";
