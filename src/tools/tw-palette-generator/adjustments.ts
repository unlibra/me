/**
 * State helpers of the palette generator that do not need React, so that
 * they can be unit tested.
 */
import { hexToOklch } from "./color.ts";
import {
  adjustColor,
  adjustPalette,
  generatePalette,
  getShadeLabels,
  type ColorPalette,
} from "./palette.ts";

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

/** Where the three sliders are. */
export type SliderValues = Pick<BaseState, "hue" | "lightness" | "saturation">;

/** BASE and the palette for the sliders' values. */
export type AdjustedState = {
  baseColor: string;
  palette: ColorPalette;
};

/**
 * BASE and the palette after moving a slider: the input color and its
 * palette, shifted by the difference between the sliders and the input
 * color's values. `null` while no palette has been generated.
 */
export function getAdjustedState(
  inputColor: string,
  base: SliderBase,
  target: SliderValues,
): AdjustedState | null {
  if (!base.palette) return null;
  const hueShift = target.hue - base.hue;
  const lightnessShift = target.lightness - base.lightness;
  const saturationShift = target.saturation - base.saturation;
  // The slider at 0 is lightness 0 for BASE (then black), also when the
  // input's lightness was rounded down for the slider and the difference
  // would leave a fraction of it. Lightness is 0 to 100.
  const baseLightnessShift = target.lightness === 0 ? -100 : lightnessShift;
  const adjustedColor = adjustColor(
    inputColor,
    hueShift,
    baseLightnessShift,
    saturationShift,
  );
  return {
    // Not a color (the input field changed since the palette was made)
    baseColor: adjustedColor ?? normalizeInputColor(inputColor),
    palette: adjustPalette(
      base.palette,
      hueShift,
      lightnessShift,
      saturationShift,
    ),
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

/**
 * The palette history read from `localStorage` (the parsed JSON), keeping
 * only the entries of the right shape: an `id` and a `baseColor` that are
 * strings, a `timestamp` that is a number, and a `palette` with every shade
 * as a string. Anything else (edited by hand, or saved by another version)
 * would break the drawing of the history, so it is dropped.
 */
export function parsePaletteHistory(saved: unknown): PaletteHistoryItem[] {
  if (!Array.isArray(saved)) return [];
  return saved.filter(isPaletteHistoryItem);
}

function isPaletteHistoryItem(item: unknown): item is PaletteHistoryItem {
  if (typeof item !== "object" || item === null) return false;
  const { id, baseColor, palette, timestamp } = item as Record<string, unknown>;
  return (
    typeof id === "string" &&
    typeof baseColor === "string" &&
    typeof timestamp === "number" &&
    typeof palette === "object" &&
    palette !== null &&
    getShadeLabels().every(
      (shade) =>
        typeof (palette as Record<string, unknown>)[shade] === "string",
    )
  );
}
