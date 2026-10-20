// Inputs for the palette generator tests. The same cases are run against the
// former tool's source to record the expected outputs.

/** Base colors: every Tailwind v3 500 shade, grays, edge cases, bad input. */
export const baseColors = (tailwindV3Colors) => [
  ...Object.values(tailwindV3Colors).map((scale) => scale["500"]),
  "#000000",
  "#ffffff",
  "#808080",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#abc",
  "#ABCDEF",
  "#0ea5e9",
  "#123456",
  "#fedcba",
  "#7f3fbf",
  "#f88c49",
  "#3ba0be",
  "xyz",
  "#12345",
  "",
];

/** [hueShift, lightnessShift, saturationShift] for the adjust functions. */
export const shifts = [
  [0, 0, 0],
  [30, 0, 0],
  [-200, 0, 0],
  [0, 15, 0],
  [0, -40, 0],
  [0, 0, 10],
  [0, 0, -30],
  [120, -10, 5],
  [359, 100, 100],
];

/** Runs every case and returns plain data. */
export const runCases = (
  { generatePalette, adjustColor, adjustPalette, hexToOklch },
  tailwindV3Colors,
) => {
  const results = {};
  for (const hex of baseColors(tailwindV3Colors)) {
    const palette = generatePalette(hex);
    results[hex] = {
      oklch: hexToOklch(hex),
      palette,
      adjusted: shifts.map((shift) => [
        adjustColor(hex, ...shift),
        palette ? adjustPalette(palette, ...shift) : null,
      ]),
    };
  }
  return results;
};
