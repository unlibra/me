import { Slider } from "@/components/ui/slider";
import { TogglePill } from "@/components/ui/toggle-pill";
import { useMessages } from "@/tools/i18n";

import { AVAILABLE_SIZES, type FaviconSize } from "./favicon";
import {
  DEFAULT_SIZES,
  OUTPUT_SETS,
  type OutputSetId,
} from "./favicon-presets";

export interface FaviconOptionsPanelProps {
  selectedSets: Set<OutputSetId>;
  selectedSizes: Set<FaviconSize>;
  borderRadius: number;
  backgroundColor: string;
  useBackground: boolean;
  onSetToggle: (setId: OutputSetId) => void;
  onSizeToggle: (size: FaviconSize) => void;
  onBorderRadiusChange: (value: number) => void;
  onBackgroundColorChange: (color: string) => void;
  onUseBackgroundChange: (use: boolean) => void;
  checkboxIdSuffix?: string;
}

export function FaviconOptionsPanel({
  selectedSets,
  selectedSizes,
  borderRadius,
  backgroundColor,
  useBackground,
  onSetToggle,
  onSizeToggle,
  onBorderRadiusChange,
  onBackgroundColorChange,
  onUseBackgroundChange,
  checkboxIdSuffix = "",
}: FaviconOptionsPanelProps) {
  const { faviconGenerator: t } = useMessages();
  const checkboxId = `use-background${checkboxIdSuffix}`;

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <div className="mb-3">
          <span className="block text-base font-semibold">{t.fileFormat}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {OUTPUT_SETS.map((outputSet) => (
            <TogglePill
              key={outputSet.id}
              pressed={selectedSets.has(outputSet.id)}
              onClick={() => onSetToggle(outputSet.id)}
            >
              {outputSet.label}
            </TogglePill>
          ))}
        </div>
        <div className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
          {OUTPUT_SETS.map((set) => (
            <div key={set.id}>
              <strong>{set.label}:</strong> {t.formatDescriptions[set.id]}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Size Selection - Only show if favicon is selected */}
      {selectedSets.has("favicon") && (
        <>
          <div>
            <div className="mb-3">
              <span className="block text-base font-semibold">
                {t.faviconSizes}
              </span>
            </div>

            <div className="space-y-4">
              {/* Recommended sizes */}
              <div>
                <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.recommendedSizes}
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SIZES.map((size) => (
                    <TogglePill
                      key={size}
                      pressed={selectedSizes.has(size)}
                      onClick={() => onSizeToggle(size)}
                    >
                      {size}×{size}
                    </TogglePill>
                  ))}
                </div>
              </div>

              {/* Other sizes */}
              <div>
                <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t.otherSizes}
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.filter(
                    (s) => !DEFAULT_SIZES.includes(s),
                  ).map((size) => (
                    <TogglePill
                      key={size}
                      pressed={selectedSizes.has(size)}
                      onClick={() => onSizeToggle(size)}
                    >
                      {size}×{size}
                    </TogglePill>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />
        </>
      )}

      {/* Border Radius */}
      <div>
        <div className="mb-3">
          <span className="block text-base font-semibold">
            {t.borderRadius}
          </span>
          <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t.borderRadiusHint}
          </p>
        </div>
        <Slider
          ariaLabel={t.borderRadius}
          value={borderRadius}
          min={0}
          max={100}
          unit="%"
          onChange={onBorderRadiusChange}
        />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Background Color */}
      <div>
        <div className="mb-3">
          <span className="block text-base font-semibold">
            {t.backgroundColorSetting}
          </span>
          <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t.backgroundColorHint}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={checkboxId}
              checked={useBackground}
              onChange={(e) => onUseBackgroundChange(e.target.checked)}
              className="size-4 accent-sky-600 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            />
            <label htmlFor={checkboxId} className="text-base font-medium">
              {t.addBackgroundColor}
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              disabled={!useBackground}
              className="size-10 cursor-pointer bg-transparent outline-hidden transition-opacity focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-default disabled:opacity-20"
              aria-label={t.selectBackgroundColor}
            />
            <input
              type="text"
              name="hex-input"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              disabled={!useBackground}
              placeholder="#000000"
              className="dark:bg-atom-one-dark-light flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono outline-hidden transition-colors focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 dark:border-gray-600"
              aria-label={t.backgroundColorCode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
