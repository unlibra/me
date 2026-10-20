import "./palette-slider.css";

import { useCallback, useMemo, type ChangeEvent } from "react";

import { hexToOklch, oklchToHex } from "./color";
import { getColorNames, tailwindColors } from "./tailwind-colors";

export type HueSliderProps = {
  label?: string;
  value: number;
  min: number;
  max: number;
  inputColor: string; // Input color as hex
  onChange: (value: number) => void;
  onReset?: () => void;
  className?: string;
};

export function HueSlider({
  label,
  value,
  min,
  max,
  onChange,
  className = "",
}: HueSliderProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  // Generate gradient using Tailwind colors for visual consistency
  // Shows absolute hue values from 0° to 360°
  const gradientBackground = useMemo(() => {
    // Get all chromatic Tailwind colors with their hues
    const colorNames = getColorNames().filter(
      (name) => !["slate", "gray", "zinc", "neutral", "stone"].includes(name),
    );

    const colorHues = colorNames.map((name) => {
      const hex = tailwindColors[name][500];
      const colorOklch = hexToOklch(hex);
      return {
        name,
        hue: colorOklch?.h ?? 0,
        hex,
      };
    });

    const stops = [];

    // Create 13 color stops evenly distributed from 0° to 360°
    for (let i = 0; i <= 12; i++) {
      // Calculate the position percentage (0% to 100%)
      const position = (i / 12) * 100;

      // Calculate absolute hue at this position (0° to 360°)
      const targetHue = (position / 100) * 360;

      // Find the closest Tailwind color by hue
      let closestColor = colorHues[0];
      let minDistance = Math.abs(targetHue - colorHues[0].hue);

      for (const color of colorHues) {
        // Calculate hue distance (accounting for circular nature of hue)
        const distance1 = Math.abs(targetHue - color.hue);
        const distance2 = 360 - distance1;
        const distance = Math.min(distance1, distance2);

        if (distance < minDistance) {
          minDistance = distance;
          closestColor = color;
        }
      }

      stops.push(`${closestColor.hex} ${position}%`);
    }

    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {value}°
          </span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          style={{
            background: gradientBackground,
          }}
          className="palette-slider h-2 w-full cursor-pointer appearance-none rounded-full outline-hidden"
          aria-label={label || "色相を調整"}
        />
      </div>
    </div>
  );
}

export type LightnessSliderProps = {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
};

export function LightnessSlider({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
  className = "",
}: LightnessSliderProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  // Grayscale gradient from black to white
  const gradientBackground = "linear-gradient(to right, #000000, #ffffff)";

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {value}
          </span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          style={{
            background: gradientBackground,
          }}
          className="palette-slider h-2 w-full cursor-pointer appearance-none rounded-full outline-hidden"
          aria-label={label || "明度を調整"}
        />
      </div>
    </div>
  );
}

export type SaturationSliderProps = {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  inputColor: string; // Input color as hex to determine hue
  onChange: (value: number) => void;
  className?: string;
};

export function SaturationSlider({
  label,
  value,
  min = 0,
  max = 50,
  inputColor,
  onChange,
  className = "",
}: SaturationSliderProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  // Generate gradient from gray to saturated color based on input color's hue
  const gradientBackground = useMemo(() => {
    const oklch = hexToOklch(inputColor);
    if (!oklch) return "linear-gradient(to right, #888, #888)";

    // Use middle lightness for the gradient
    const midLightness = 55;

    // Create stops from 0 saturation (gray) to max saturation
    const stops = [];
    const numStops = 5;

    for (let i = 0; i <= numStops; i++) {
      const position = (i / numStops) * 100;
      const chroma = (position / 100) * max;

      const hex = oklchToHex({
        l: midLightness,
        c: chroma,
        h: oklch.h,
      });

      stops.push(`${hex} ${position}%`);
    }

    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, [inputColor, max]);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {value}
          </span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          style={{
            background: gradientBackground,
          }}
          className="palette-slider h-2 w-full cursor-pointer appearance-none rounded-full outline-hidden"
          aria-label={label || "彩度を調整"}
        />
      </div>
    </div>
  );
}
