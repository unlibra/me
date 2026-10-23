import "./slider.css";

import {
  useCallback,
  useMemo,
  type ChangeEvent,
  type CSSProperties,
} from "react";

import { useIsDark } from "./use-is-dark";

/**
 * A slider has a name: the visible `label`, or `ariaLabel` when the label is
 * shown by the caller (such as a heading above the slider).
 */
type SliderName =
  { label: string; ariaLabel?: never } | { label?: never; ariaLabel: string };

export type SliderProps = SliderName & {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  description?: string;
  className?: string;
};

export function Slider({
  label,
  ariaLabel,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  description,
  className = "",
}: SliderProps) {
  const isDark = useIsDark();

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  const percentage = useMemo(
    () => ((value - min) / (max - min)) * 100,
    [value, min, max],
  );

  const trackColor = useMemo(
    () => (isDark ? "rgb(75, 85, 99)" : "rgb(226, 232, 240)"),
    [isDark],
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-base font-medium">{label}</label>
          <span className="text-base text-gray-600 dark:text-gray-400">
            {value}
            {unit}
          </span>
        </div>
      )}
      {!label && (
        <div className="flex items-center justify-end">
          <span className="text-base text-gray-600 dark:text-gray-400">
            {value}
            {unit}
          </span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          // The track is drawn in slider.css from these: the input itself is
          // 44px high, the whole of it a target (DESIGN.md 5.4).
          style={
            {
              "--slider-fill": `${percentage}%`,
              "--slider-track": trackColor,
            } as CSSProperties
          }
          className="ui-slider h-11 w-full cursor-pointer appearance-none bg-transparent outline-hidden"
          aria-label={label ?? ariaLabel}
        />
      </div>
      {description && (
        <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}
