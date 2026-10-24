// Makes the brand font: LINE Seed JP Bold (from @fontsource/line-seed-jp)
// cut down to the letters of the logotype "unlibra". Astro integration: the
// file is made when the build (or the dev server) starts, from the
// installed package, and is not kept in the repository (.gitignore).
// scripts/generate-icons.mjs makes it the same way.
//
// LINE Seed JP is under the SIL Open Font License 1.1 with no Reserved Font
// Name, so the subset keeps the family name. The subset keeps the font's
// copyright notice and license URL (name table). The license text is in
// LICENSES/OFL-1.1.txt. The license is listed in
// /third-party-licenses.txt (DERIVED_ASSETS in scripts/third-party-licenses.mjs).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import subsetFont from "subset-font";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The letters the subset has (the logotype). */
export const BRAND_FONT_TEXT = "unlibra";

/** The source file: the latin range of the bold weight. */
export const BRAND_FONT_SOURCE =
  "node_modules/@fontsource/line-seed-jp/files/line-seed-jp-latin-700-normal.woff2";

/** The generated file, imported by src/styles/global.css. */
export const BRAND_FONT_FILE =
  "src/assets/fonts/line-seed-jp-unlibra-700.woff2";

/** Makes the subset from the installed package and writes BRAND_FONT_FILE. */
export async function writeBrandFont() {
  const source = readFileSync(join(root, BRAND_FONT_SOURCE));
  const subset = await subsetFont(source, BRAND_FONT_TEXT, {
    targetFormat: "woff2",
    // Only the glyphs of the letters (no alternates reached through layout
    // features); kerning between them is kept.
    noLayoutClosure: true,
    // Besides the default names (IDs 0-6: copyright, family and so on),
    // the license description and URL, where the original has them (OFL
    // condition 2). LINE Seed JP has ID 14 only.
    preserveNameIds: [13, 14],
  });
  const file = join(root, BRAND_FONT_FILE);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, subset);
  return { file, bytes: subset.length, sourceBytes: source.length };
}

export default function brandFont() {
  return {
    name: "brand-font",
    hooks: {
      "astro:config:setup": async ({ logger }) => {
        const { bytes, sourceBytes } = await writeBrandFont();
        logger.info(
          `${BRAND_FONT_FILE}: ${bytes} bytes (from ${sourceBytes} bytes)`,
        );
      },
    },
  };
}
