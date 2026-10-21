// Spec tests of the Tailwind palette generator's options (I1): the forms of
// the input color, the three sliders, the reset and the history entries.
// tests/tw-palette-generator.test.js checks the port against the former
// tool's output. Saving, loading and deleting the history in localStorage
// happen in the component and are checked by the E2E tests.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createHistoryItem,
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
  // Not listed: hex digits followed by other characters ("12345g"), which
  // are read as a color today (reported to the parent).
  for (const input of [
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

test("I1 palette: reset puts the sliders back to the input's values and restores its palette", () => {
  const palette = paletteOf("3ba0be");
  const values = {
    hue: Math.round(base.h),
    lightness: Math.round(base.l),
    saturation: Math.round(base.c),
    palette,
  };
  for (const input of ["3ba0be", "#3ba0be"]) {
    assert.deepEqual(getResetState(input, values), {
      targetHue: 221,
      targetLightness: 66,
      targetSaturation: 13,
      palette,
      baseColor: "#3ba0be",
    });
  }
  // Before any palette is generated there is none to restore.
  assert.equal(
    getResetState("#3ba0be", { ...values, palette: null }).palette,
    null,
  );
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
