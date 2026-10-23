import "./slider.css";

import { useCallback, useMemo, type ChangeEvent } from "react";

import { useIsDark } from "./use-is-dark";

export type SliderProps = {
  label?: string;
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
          style={{
            background: `linear-gradient(to right, rgb(0, 166, 244) 0%, rgb(0, 166, 244) ${percentage}%, ${trackColor} ${percentage}%, ${trackColor} 100%)`,
          }}
          className="ui-slider h-2 w-full cursor-pointer appearance-none rounded-full outline-hidden"
          aria-label={label || "値を調整"}
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
