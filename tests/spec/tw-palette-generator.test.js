// Spec tests of the Tailwind palette generator's options (I1): the forms of
// the input color, the three sliders, the reset and the history entries.
// The sliders' starting values and the reset state are computed in
// adjustments.ts; the component only applies them.
// tests/tw-palette-generator.test.js checks the port against the former
// tool's output. Saving, loading and deleting the history in localStorage
// happen in the component and are checked by the E2E tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createHistoryItem,
  getAdjustedState,
  getBaseState,
  getResetState,
  normalizeInputColor,
} from "../../src/tools/tw-palette-generator/adjustments.ts";
import { hexToOklch } from "../../src/tools/tw-palette-generator/color.ts";
import {
  adjustColor,
  adjustPalette,
  generatePalette,
  getShadeLabels,
} from "../../src/tools/tw-palette-generator/palette.ts";
import { tailwindColors } from "../../src/tools/tw-palette-generator/tailwind-colors.ts";

const formerOutput = JSON.parse(
  readFileSync(
    new URL("../fixtures/tw-palette-generator/expected.json", import.meta.url),
    "utf8",
  ),
);

/** What the tool does with the input field's text. */
const paletteOf = (input) => generatePalette(normalizeInputColor(input));

test("I1 palette: the input works with or without #, in either case", () => {
  const expected = generatePalette("#3ba0be");
  assert.ok(expected);
  for (const input of ["#3ba0be", "3ba0be", "#3BA0BE", "3BA0BE", "#3bA0Be"]) {
    assert.deepEqual(paletteOf(input), expected, input);
    assert.deepEqual(
      hexToOklch(normalizeInputColor(input)),
      hexToOklch("#3ba0be"),
    );
  }
});

test("I1 palette: a three-digit input is the six-digit color with each digit doubled", () => {
  for (const [short, long] of [
    ["#abc", "#aabbcc"],
    ["abc", "#aabbcc"],
    ["#F0A", "#ff00aa"],
    ["000", "#000000"],
  ]) {
    assert.deepEqual(paletteOf(short), generatePalette(long), short);
  }
});

test("I1 palette: input that is not a color gives no palette", () => {
  for (const input of [
    // Hex digits mixed with other characters (fixes2.md).
    "12345g",
    "#12345g",
    "0x1234",
    "#0x1234",
    "12g",
    "#1 2",
    "12345 ",
    " 12345",
    "+12345",
    "-12345",
    "",
    "#",
    "#1",
    "#12",
    "#1234",
    "#12345",
    "#1234567",
    "zzzzzz",
    "#ggg",
    "red",
  ]) {
    assert.equal(paletteOf(input), null, JSON.stringify(input));
    assert.equal(hexToOklch(normalizeInputColor(input)), null);
  }
});

test("I1 palette: a palette has the eleven shades, each a hex color", () => {
  for (const input of ["#3ba0be", "#ff0000", "#000000", "#ffffff", "#808080"]) {
    const palette = paletteOf(input);
    assert.deepEqual(Object.keys(palette).map(Number), getShadeLabels(), input);
    for (const hex of Object.values(palette)) {
      assert.match(hex, /^#[0-9A-F]{6}$/);
    }
    // Lighter to darker.
    const lightness = getShadeLabels().map(
      (shade) => hexToOklch(palette[shade]).l,
    );
    for (let i = 1; i < lightness.length; i++) {
      assert.ok(lightness[i] < lightness[i - 1], `${input} ${i}`);
    }
  }
});

test("I1 palette: a Tailwind color gives back its own hue", () => {
  for (const name of ["red", "green", "sky", "violet"]) {
    const input = tailwindColors[name][500];
    const palette = paletteOf(input);
    const hue = hexToOklch(palette[500]).h;
    const inputHue = hexToOklch(input).h;
    assert.ok(Math.abs(hue - inputHue) < 15, `${name}: ${hue} ${inputHue}`);
  }
});

const BASE = "#3ba0be";
const base = hexToOklch(BASE);
const hueDistance = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

test("I1 palette: with every slider at the input's values, colors are unchanged", () => {
  for (const shades of Object.values(tailwindColors)) {
    for (const hex of Object.values(shades)) {
      assert.equal(adjustColor(hex, 0, 0, 0), hex.toUpperCase());
    }
  }
});

test("I1 palette: the hue slider turns the hue by the difference", () => {
  for (const shift of [-180, -30, 30, 90, 180]) {
    const { h, l } = hexToOklch(adjustColor(BASE, shift, 0, 0));
    assert.ok(hueDistance(h, base.h + shift) < 1, `${shift}: ${h}`);
    assert.ok(Math.abs(l - base.l) < 1, `${shift}: ${l}`);
  }
  // A full turn is no change.
  assert.equal(adjustColor(BASE, 360, 0, 0), BASE.toUpperCase());
  assert.equal(adjustColor(BASE, -330, 0, 0), adjustColor(BASE, 30, 0, 0));
});

test("I1 palette: the lightness slider moves the lightness by the difference", () => {
  for (const shift of [-20, -10, 10, 20]) {
    const { l, h } = hexToOklch(adjustColor(BASE, 0, shift, 0));
    assert.ok(Math.abs(l - (base.l + shift)) < 1, `${shift}: ${l}`);
    assert.ok(hueDistance(h, base.h) < 1, `${shift}: ${h}`);
  }
  // Clamped at the ends.
  assert.equal(adjustColor(BASE, 0, 100, 0), "#FFFFFF");
  const darkest = adjustColor(BASE, 0, -100, 0);
  assert.ok(hexToOklch(darkest).l < hexToOklch(adjustColor(BASE, 0, -60, 0)).l);
});

// fixes2.md: at lightness 0 the chroma goes too, so the color is black.
test("I1 palette: at lightness 0 the color is black", () => {
  for (const hex of ["#3ba0be", "#ef4444", "#f88c49", "#0ea5e9", "#ffffff"]) {
    for (const [hue, saturation] of [
      [0, 0],
      [40, 10],
      [-90, -5],
    ]) {
      assert.equal(
        adjustColor(hex, hue, -100, saturation),
        "#000000",
        `${hex} ${hue} ${saturation}`,
      );
    }
  }
  // #ef4444's lightness is 63.68: 64 down reaches 0.
  assert.equal(adjustColor("#ef4444", 0, -64, 0), "#000000");
});

// Above 0 nothing changes: the values the tool gave before the fix above.
test("I1 palette: above lightness 0 the lightness slider works as before", () => {
  for (const [hex, hue, lightness, saturation, expected] of [
    ["#3ba0be", 0, -30, 0, "#004556"],
    ["#3ba0be", 0, -64, 0, "#010008"], // lightness 2
    ["#3ba0be", 20, -50, 5, "#000F1F"],
    ["#ef4444", 0, -30, 0, "#6D010C"],
    ["#ef4444", 20, -50, 5, "#1C0000"],
    ["#f88c49", 0, -30, 0, "#853C02"],
    ["#f88c49", 0, -64, 0, "#150000"],
    ["#f88c49", 20, -50, 5, "#311B00"],
  ]) {
    assert.equal(
      adjustColor(hex, hue, lightness, saturation),
      expected,
      `${hex} ${hue} ${lightness} ${saturation}`,
    );
  }
});

test("I1 palette: the saturation slider raises and lowers the chroma", () => {
  for (const shift of [-10, -5]) {
    const { c, l, h } = hexToOklch(adjustColor(BASE, 0, 0, shift));
    assert.ok(Math.abs(c - (base.c + shift)) < 0.5, `${shift}: ${c}`);
    assert.ok(Math.abs(l - base.l) < 1);
    assert.ok(hueDistance(h, base.h) < 5); // 8-bit rounding at low chroma
  }
  // Raising it stops at what sRGB can show.
  const raised = hexToOklch(adjustColor(BASE, 0, 0, 20)).c;
  assert.ok(raised > base.c, `${raised}`);
  // Lowering it all the way gives a gray.
  const gray = adjustColor(BASE, 0, 0, -100);
  assert.equal(gray.slice(1, 3), gray.slice(3, 5));
  assert.equal(gray.slice(3, 5), gray.slice(5, 7));
});

test("I1 palette: the sliders apply the same change to every shade", () => {
  const palette = paletteOf(BASE);
  for (const shifts of [
    [40, 0, 0],
    [0, -15, 0],
    [0, 0, -8],
    [-60, 10, 5],
  ]) {
    const adjusted = adjustPalette(palette, ...shifts);
    for (const shade of getShadeLabels()) {
      assert.equal(
        adjusted[shade],
        adjustColor(palette[shade], ...shifts),
        `${shifts} ${shade}`,
      );
    }
  }
  assert.deepEqual(
    adjustPalette(palette, 0, 0, 0),
    Object.fromEntries(
      Object.entries(palette).map(([shade, hex]) => [shade, hex.toUpperCase()]),
    ),
  );
});

// Expected values from outside the code under test: the slider values the
// former tool showed for #3ba0be (phase-4/tools.md, E7) and for its default
// color #0ea5e9 (its initial state), and the former tool's palettes
// (tests/fixtures/tw-palette-generator/expected.json).
const formerPalette = (hex) => formerOutput[hex].palette;

test("I1 palette: the input color sets where the sliders start", () => {
  for (const input of ["3ba0be", "#3ba0be", "#3BA0BE"]) {
    assert.deepEqual(getBaseState(input), {
      hue: 221,
      lightness: 66,
      saturation: 13,
      palette: formerPalette("#3ba0be"),
      baseColor: normalizeInputColor(input),
    });
  }
  assert.deepEqual(getBaseState("#0ea5e9"), {
    hue: 237,
    lightness: 68,
    saturation: 19,
    palette: formerPalette("#0ea5e9"),
    baseColor: "#0ea5e9",
  });
  for (const input of ["", "xyz", "#12345"]) {
    assert.equal(getBaseState(input), null, JSON.stringify(input));
  }
});

test("I1 palette: reset puts the sliders back to the input's values and restores its palette", () => {
  for (const input of ["3ba0be", "#3ba0be"]) {
    assert.deepEqual(getResetState(input, getBaseState(input)), {
      targetHue: 221,
      targetLightness: 66,
      targetSaturation: 13,
      palette: formerPalette("#3ba0be"),
      baseColor: "#3ba0be",
    });
  }
  // Each slider goes back to its own value.
  assert.deepEqual(
    getResetState("#3ba0be", {
      hue: 1,
      lightness: 2,
      saturation: 3,
      palette: null,
    }),
    {
      targetHue: 1,
      targetLightness: 2,
      targetSaturation: 3,
      palette: null, // none generated yet: the current one is kept
      baseColor: "#3ba0be",
    },
  );
});

test("I1 palette: the sliders adjust BASE and the palette by the difference from the input's values", () => {
  const base = getBaseState("#3ba0be");
  for (const input of ["3ba0be", "#3ba0be"]) {
    assert.deepEqual(
      getAdjustedState(input, base, {
        hue: 221,
        lightness: 66,
        saturation: 13,
      }),
      { baseColor: "#3BA0BE", palette: adjustPalette(base.palette, 0, 0, 0) },
    );
    assert.deepEqual(
      getAdjustedState(input, base, {
        hue: 120,
        lightness: 50,
        saturation: 20,
      }),
      {
        baseColor: adjustColor("#3ba0be", -101, -16, 7),
        palette: adjustPalette(base.palette, -101, -16, 7),
      },
    );
  }
  // Nothing to adjust before the first palette is generated.
  assert.equal(
    getAdjustedState(
      "#3ba0be",
      { hue: 221, lightness: 66, saturation: 13, palette: null },
      { hue: 120, lightness: 50, saturation: 20 },
    ),
    null,
  );
});

// fixes2.md: when the input field no longer holds a color, the sliders still
// adjust the last palette, and BASE is the input with the # prefix.
test("I1 palette: with an input that is not a color, BASE is the input with #", () => {
  const base = getBaseState("#3ba0be");
  const target = { hue: 120, lightness: 50, saturation: 20 };
  for (const [input, baseColor] of [
    ["3ba0bz", "#3ba0bz"],
    ["#3ba0bz", "#3ba0bz"],
    ["", "#"],
  ]) {
    assert.deepEqual(getAdjustedState(input, base, target), {
      baseColor,
      palette: adjustPalette(base.palette, -101, -16, 7),
    });
  }
});

// fixes2.md: the lightness slider at 0 makes BASE black, whichever way the
// input's lightness was rounded for the slider.
test("I1 palette: the lightness slider at 0 makes BASE black", () => {
  for (const shades of Object.values(tailwindColors)) {
    for (const hex of Object.values(shades)) {
      const base = getBaseState(hex);
      const target = { hue: base.hue + 30, lightness: 0, saturation: 5 };
      const adjusted = getAdjustedState(hex, base, target);
      assert.equal(adjusted.baseColor, "#000000", hex);
      assert.deepEqual(
        adjusted.palette,
        adjustPalette(base.palette, 30, -base.lightness, 5 - base.saturation),
        hex,
      );
    }
  }
});

test("I1 palette: a history entry keeps the BASE color, the palette and the time", () => {
  const palette = paletteOf(BASE);
  const item = createHistoryItem("#6296CE", palette, 1760000000123);
  assert.deepEqual(item, {
    id: "1760000000123",
    baseColor: "#6296CE",
    palette,
    timestamp: 1760000000123,
  });
  // Stored as JSON, in the same form as the former tool's history.
  assert.deepEqual(JSON.parse(JSON.stringify([item])), [item]);
  assert.deepEqual(Object.keys(item), [
    "id",
    "baseColor",
    "palette",
    "timestamp",
  ]);
});
