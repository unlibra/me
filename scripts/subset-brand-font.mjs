// Makes the brand font: LINE Seed JP Bold (from @fontsource/line-seed-jp)
// cut down to the letters of the logotype "unlibra". Run once with
// `npm run generate:brand-font` after changing the letters or upgrading the
// package; the output is kept in the repository (the build does not run
// this).
//
// LINE Seed JP is under the SIL Open Font License 1.1 with no Reserved Font
// Name, so the subset keeps the family name. The subset keeps the font's
// copyright notice and license URL (name table). The license text is in
// LICENSES/OFL-1.1.txt. The license is listed in
// /third-party-licenses.txt (DERIVED_ASSETS in scripts/third-party-licenses.mjs).
import { readFileSync, writeFileSync } from "node:fs";
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

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
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
  writeFileSync(join(root, BRAND_FONT_FILE), subset);
  console.log(
    `Wrote ${BRAND_FONT_FILE}: ${subset.length} bytes (from ${source.length} bytes)`,
  );
}
