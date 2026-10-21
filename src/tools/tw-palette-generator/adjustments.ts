/**
 * State helpers of the palette generator that do not need React, so that
 * they can be unit tested.
 */
import { hexToOklch } from "./color.ts";
import { generatePalette, type ColorPalette } from "./palette.ts";

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

/** The input color's values: where the sliders start and reset to. */
export type BaseState = {
  hue: number;
  lightness: number;
  saturation: number;
  palette: ColorPalette;
  /** The input color with the `#` prefix. */
  baseColor: string;
};

/**
 * The input field's color as the sliders' starting point: its OKLCh values
 * rounded to the slider steps, and the palette generated from it. `null`
 * when the input is not a color.
 */
export function getBaseState(inputColor: string): BaseState | null {
  const baseColor = normalizeInputColor(inputColor);
  const palette = generatePalette(baseColor);
  const oklch = hexToOklch(baseColor);
  if (!palette || !oklch) return null;
  return {
    hue: Math.round(oklch.h),
    lightness: Math.round(oklch.l),
    saturation: Math.round(oklch.c),
    palette,
    baseColor,
  };
}

/**
 * What the component keeps of the last input color that was a color.
 * `palette` is `null` until the first palette is generated.
 */
export type SliderBase = Pick<BaseState, "hue" | "lightness" | "saturation"> & {
  palette: ColorPalette | null;
};

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
  base: SliderBase,
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
