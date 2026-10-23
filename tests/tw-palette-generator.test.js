// Unit tests for the Tailwind palette generator logic (E6).
//
// tests/fixtures/tw-palette-generator/expected.json holds the output of the
// former tool site's palette generator source for the cases in
// tests/helpers/palette-cases.js; the ported code must give the same output.
// The exception: the 41 adjusted colors whose lightness reaches 0 were remade
// with this code, as black (docs/decisions/fixes2/fixes2.md). The former tool
// left a trace of the hue in them.
// tailwind-v3-colors.json is the palette of tailwindcss 3.4.18 (the version
// in the former tool's lock file), read from `tailwindcss/colors`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runCases } from "./helpers/palette-cases.js";
import {
  createHistoryItem,
  getResetState,
  normalizeInputColor,
  parsePaletteHistory,
} from "../src/tools/tw-palette-generator/adjustments.ts";
import { hexToOklch } from "../src/tools/tw-palette-generator/color.ts";
import {
  adjustColor,
  adjustPalette,
  generatePalette,
  getShadeLabels,
} from "../src/tools/tw-palette-generator/palette.ts";
import {
  getColorNames,
  getShades,
  isGrayScale,
  tailwindColors,
} from "../src/tools/tw-palette-generator/tailwind-colors.ts";

const fixtures = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/tw-palette-generator",
);
const readJson = (name) =>
  JSON.parse(readFileSync(join(fixtures, name), "utf8"));
const tailwindV3Colors = readJson("tailwind-v3-colors.json");
const expected = readJson("expected.json");

test("E6: generated and adjusted palettes match the former tool's output", () => {
  const actual = runCases(
    { generatePalette, adjustColor, adjustPalette, hexToOklch },
    tailwindV3Colors,
  );
  assert.equal(Object.keys(actual).length, 38);
  assert.deepEqual(actual, expected);
});

test("E6: the color picker uses the Tailwind CSS v3 palette", () => {
  // Tailwind v4 (which this site uses) defines its palette in OKLCH, so the
  // tool keeps its own copy of the v3 hex values.
  assert.deepEqual(
    JSON.parse(JSON.stringify(tailwindColors)),
    tailwindV3Colors,
  );
  assert.deepEqual(getColorNames(), Object.keys(tailwindV3Colors));
  assert.deepEqual(
    getShades(),
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  );
  assert.deepEqual(getShadeLabels(), getShades());
  assert.deepEqual(
    getColorNames().filter((name) => isGrayScale(name)),
    ["slate", "gray", "zinc", "neutral", "stone"],
  );
});

test("E6: a generated palette has every shade as a hex color", () => {
  const palette = generatePalette("#0ea5e9");
  assert.deepEqual(
    Object.keys(palette).map(Number),
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  );
  for (const hex of Object.values(palette)) {
    assert.match(hex, /^#[0-9A-F]{6}$/);
  }
  assert.equal(generatePalette("not a color"), null);
});

test("H3: resetting the adjustments after input without # puts # on BASE and the history", () => {
  const basePalette = generatePalette("#3ba0be");
  const reset = getResetState("3ba0be", {
    hue: 221,
    lightness: 66,
    saturation: 13,
    palette: basePalette,
  });
  assert.deepEqual(reset, {
    targetHue: 221,
    targetLightness: 66,
    targetSaturation: 13,
    palette: basePalette,
    baseColor: "#3ba0be",
  });
  // The history saves the BASE color as it is.
  const item = createHistoryItem(reset.baseColor, basePalette, 1700000000000);
  assert.deepEqual(item, {
    id: "1700000000000",
    baseColor: "#3ba0be",
    palette: basePalette,
    timestamp: 1700000000000,
  });
  // Input that already has # stays as it is.
  assert.equal(
    getResetState("#3ba0be", {
      hue: 221,
      lightness: 66,
      saturation: 13,
      palette: basePalette,
    }).baseColor,
    "#3ba0be",
  );
});

test("H3: the input color gets # only when it is missing", () => {
  assert.equal(normalizeInputColor("3ba0be"), "#3ba0be");
  assert.equal(normalizeInputColor("#3ba0be"), "#3ba0be");
  assert.equal(normalizeInputColor(""), "#");
});

test("final-review 6: the history read from localStorage keeps only entries of the right shape", () => {
  const palette = generatePalette("#0ea5e9");
  const good = createHistoryItem("#0ea5e9", palette, 1700000000000);
  const noShade = { ...palette };
  delete noShade[500];
  assert.deepEqual(parsePaletteHistory([good]), [good]);
  assert.deepEqual(
    parsePaletteHistory([
      null,
      "x",
      1,
      [],
      {},
      { ...good, id: 1 },
      { ...good, baseColor: null },
      { ...good, timestamp: "1700000000000" },
      { ...good, palette: null },
      { ...good, palette: "x" },
      { ...good, palette: noShade },
      { ...good, palette: { ...palette, 950: 950 } },
      good,
    ]),
    [good],
  );
  // Not a list at all.
  for (const saved of [null, {}, "[]", 1, { 0: good, length: 1 }]) {
    assert.deepEqual(parsePaletteHistory(saved), []);
  }
});
