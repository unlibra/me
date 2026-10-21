/**
 * State helpers of the palette generator that do not need React, so that
 * they can be unit tested.
 */
import type { ColorPalette } from "./palette.ts";

/** A palette saved in the history (`localStorage`). */
export type PaletteHistoryItem = {
  id: string;
  baseColor: string;
  palette: ColorPalette;
  timestamp: number;
};

/** The input field's text as a color: adds the `#` prefix if missing. */
export function normalizeInputColor(inputColor: string): string {
  return inputColor.startsWith("#") ? inputColor : `#${inputColor}`;
}

/** What "Reset adjustments" goes back to. */
export type ResetState = {
  targetHue: number;
  targetLightness: number;
  targetSaturation: number;
  /** `null` while no palette has been generated: keep the current one. */
  palette: ColorPalette | null;
  baseColor: string;
};

/**
 * The state after "Reset adjustments": the sliders at the input color's
 * values, the palette generated from it, and BASE as the input color (with
 * the `#` prefix, as when the palette is generated from the input).
 */
export function getResetState(
  inputColor: string,
  base: {
    hue: number;
    lightness: number;
    saturation: number;
    palette: ColorPalette | null;
  },
): ResetState {
  return {
    targetHue: base.hue,
    targetLightness: base.lightness,
    targetSaturation: base.saturation,
    palette: base.palette,
    baseColor: normalizeInputColor(inputColor),
  };
}

/** A history entry for the current BASE color and palette. */
export function createHistoryItem(
  baseColor: string,
  palette: ColorPalette,
  now: number,
): PaletteHistoryItem {
  return { id: now.toString(), baseColor, palette, timestamp: now };
}
