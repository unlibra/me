import {
  IconClipboard,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconX,
} from "@/components/ui/icons";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";

import { useToast } from "@/components/ui/toast";
import { useMessages } from "@/tools/i18n";
import { formatMessage, type ToolLocale } from "@/tools/messages";
import { ToolRoot } from "@/tools/tool-root";

import {
  createHistoryItem,
  getAdjustedState,
  getBaseState,
  getResetState,
  normalizeInputColor,
  parsePaletteHistory,
  type BaseState,
  type SliderBase,
  type SliderValues,
  type PaletteHistoryItem,
} from "./adjustments";
import { getShadeLabels, type ColorPalette } from "./palette";
import { HueSlider, LightnessSlider, SaturationSlider } from "./sliders";
import {
  getColorNames,
  getShades,
  isGrayScale,
  tailwindColors,
  type TailwindColorName,
  type TailwindShade,
} from "./tailwind-colors";

/**
 * `localStorage` key of the palette history. The same key as before the
 * move, so that history saved on the same origin carries over.
 */
export const PALETTE_HISTORY_KEY = "tw-palette-history";

/** The input color when the page opens: Tailwind's sky-500. */
const DEFAULT_INPUT_COLOR = "#0ea5e9";

/** The default input color's palette and slider values. */
const INITIAL_BASE: BaseState = (() => {
  const state = getBaseState(DEFAULT_INPUT_COLOR);
  if (!state) throw new Error("The default input color is not a color");
  return state;
})();

/** Island entry: the tool body of the Tailwind palette generator page. */
export default function TwPaletteGeneratorIsland({
  locale,
}: {
  locale: ToolLocale;
}) {
  return (
    <ToolRoot locale={locale}>
      <TailwindPaletteGenerator />
    </ToolRoot>
  );
}

function TailwindPaletteGenerator() {
  const { twPaletteGenerator: t } = useMessages();
  const toast = useToast();

  // State: from the start, the default color's palette and slider values, as
  // the palette made after the input wait sets them, so that what is shown
  // (and saved) before that wait ends is the input color's
  const [inputColor, setInputColor] = useState(DEFAULT_INPUT_COLOR);
  const [baseColor, setBaseColor] = useState(INITIAL_BASE.baseColor);
  const [palette, setPalette] = useState<ColorPalette>(INITIAL_BASE.palette);
  // The input color's values (H, L, C) and palette: where the sliders reset to
  const [base, setBase] = useState<SliderBase>(INITIAL_BASE);
  const [targetHue, setTargetHue] = useState(INITIAL_BASE.hue); // Current slider value
  const [targetLightness, setTargetLightness] = useState(
    INITIAL_BASE.lightness,
  ); // Current slider value
  const [targetSaturation, setTargetSaturation] = useState(
    INITIAL_BASE.saturation,
  ); // Current slider value
  const [paletteHistory, setPaletteHistory] = useState<PaletteHistoryItem[]>(
    [],
  );

  // Normalize color: add # prefix if missing
  const normalizedInputColor = normalizeInputColor(inputColor);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PALETTE_HISTORY_KEY);
      if (saved) {
        setPaletteHistory(parsePaletteHistory(JSON.parse(saved)));
      }
    } catch (err) {
      console.error("Failed to load palette history:", err);
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(PALETTE_HISTORY_KEY, JSON.stringify(paletteHistory));
    } catch (err) {
      console.error("Failed to save palette history:", err);
    }
  }, [paletteHistory]);

  // Auto-generate palette with debounce when inputColor changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const inputBase = getBaseState(normalizedInputColor);
      if (inputBase) {
        setBaseColor(inputBase.baseColor);
        setBase(inputBase);
        setPalette(inputBase.palette);
        // Set target to input color's actual values
        setTargetHue(inputBase.hue);
        setTargetLightness(inputBase.lightness);
        setTargetSaturation(inputBase.saturation);
      }
    }, 100); // 100ms debounce (optimized for responsive UX)

    return () => clearTimeout(timer);
  }, [normalizedInputColor]);

  // Handle color input change
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputColor(e.target.value);
  }, []);

  // Select Tailwind color
  const handleTailwindColorSelect = useCallback(
    (name: TailwindColorName, shade: TailwindShade) => {
      const hex = tailwindColors[name][shade];
      setInputColor(hex);
    },
    [],
  );

  // Apply the sliders' values to BASE and the palette
  const applySliders = useCallback(
    (target: SliderValues) => {
      const adjusted = getAdjustedState(inputColor, base, target);
      if (adjusted) {
        setBaseColor(adjusted.baseColor);
        setPalette(adjusted.palette);
      }
    },
    [inputColor, base],
  );

  // Adjust hue
  const handleHueChange = useCallback(
    (sliderValue: number) => {
      setTargetHue(sliderValue);
      applySliders({
        hue: sliderValue,
        lightness: targetLightness,
        saturation: targetSaturation,
      });
    },
    [applySliders, targetLightness, targetSaturation],
  );

  // Adjust lightness
  const handleLightnessChange = useCallback(
    (sliderValue: number) => {
      setTargetLightness(sliderValue);
      applySliders({
        hue: targetHue,
        lightness: sliderValue,
        saturation: targetSaturation,
      });
    },
    [applySliders, targetHue, targetSaturation],
  );

  // Adjust saturation
  const handleSaturationChange = useCallback(
    (sliderValue: number) => {
      setTargetSaturation(sliderValue);
      applySliders({
        hue: targetHue,
        lightness: targetLightness,
        saturation: sliderValue,
      });
    },
    [applySliders, targetHue, targetLightness],
  );

  // Reset adjustments to base values
  const handleReset = useCallback(() => {
    const reset = getResetState(inputColor, base);
    setTargetHue(reset.targetHue);
    setTargetLightness(reset.targetLightness);
    setTargetSaturation(reset.targetSaturation);
    if (reset.palette) {
      setPalette(reset.palette);
    }
    setBaseColor(reset.baseColor);
  }, [base, inputColor]);

  // Copy color to clipboard
  const handleCopyColor = useCallback(
    async (hex: string) => {
      try {
        await navigator.clipboard.writeText(hex.toUpperCase());
        toast.success(t.errors.colorCodeCopied);
      } catch (err) {
        toast.error(t.errors.colorCodeCopyFailed);
        console.error("Failed to copy:", err);
      }
    },
    [toast, t],
  );

  // Copy as Tailwind Config
  const handleCopyAsTailwind = useCallback(async () => {
    if (!palette) return;
    try {
      const tailwindConfig = `colors: {\n  custom: {\n${getShadeLabels()
        .map((shade) => `    ${shade}: '${palette[shade]}',`)
        .join("\n")}\n  }\n}`;
      await navigator.clipboard.writeText(tailwindConfig);
      toast.success(t.errors.configCopied);
    } catch (err) {
      toast.error(t.errors.configCopyFailed);
      console.error(err);
    }
  }, [palette, toast, t]);

  // Add current palette to history
  const handleAddToHistory = useCallback(() => {
    const MAX_HISTORY = 30;
    const newItem = createHistoryItem(baseColor, palette, Date.now());
    setPaletteHistory((prev) => {
      const updated = [...prev, newItem];
      // Keep only the latest MAX_HISTORY items (remove oldest)
      return updated.slice(-MAX_HISTORY);
    });
    toast.success(t.errors.addedToHistory);
  }, [baseColor, palette, toast, t]);

  // Remove palette from history
  const handleRemoveFromHistory = useCallback((id: string) => {
    setPaletteHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Remove All palette from history
  const handleClearHistory = useCallback(() => {
    setPaletteHistory([]);
  }, []);

  return (
    <>
      {/* Two Column Layout */}
      <div className="flex flex-col gap-12 lg:grid lg:grid-cols-2">
        {/* Left Column - Input */}
        <div className="space-y-8">
          {/* HEX Input */}
          <section>
            <h2 className="mb-4 text-base font-semibold">
              {t.baseColorSelection}
            </h2>
            <div className="flex gap-3">
              <input
                type="color"
                value={normalizedInputColor}
                onChange={handleInputChange}
                className="size-10 cursor-pointer bg-transparent outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500"
                aria-label={t.baseColorSelection}
              />
              <input
                type="text"
                name="hex-input"
                value={inputColor}
                onChange={handleInputChange}
                placeholder="#3b82f6"
                className="dark:bg-atom-one-dark-light flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono outline-hidden transition-colors focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-gray-600"
                aria-label={t.colorCode}
              />
            </div>
          </section>

          {/* Tailwind Color Picker */}
          <section>
            {/* Shade Header */}
            <div className="mb-3 flex gap-1 md:ml-20">
              {getShades().map((shade) => (
                <div
                  key={shade}
                  className="flex flex-1 shrink-0 items-center justify-center font-mono text-sm leading-6 font-medium text-gray-600 max-sm:-rotate-90 dark:text-gray-400"
                >
                  {shade}
                </div>
              ))}
            </div>
            {/* Chromatic Colors */}
            <div className="space-y-3">
              {getColorNames()
                .filter((name) => !isGrayScale(name))
                .map((colorName) => (
                  <div
                    key={colorName}
                    className="md:flex md:items-center md:gap-2"
                  >
                    <div className="mb-1 text-sm font-medium text-gray-600 uppercase md:mb-0 md:w-[72px] md:shrink-0 dark:text-gray-400">
                      {colorName}
                    </div>
                    <div className="flex w-full gap-1">
                      {getShades().map((shade) => {
                        const hex = tailwindColors[colorName][shade];

                        return (
                          <button
                            key={shade}
                            onClick={() =>
                              handleTailwindColorSelect(colorName, shade)
                            }
                            className="group relative aspect-square h-full flex-1 shrink-0 rounded-sm transition-transform hover:scale-110 focus:outline-hidden focus-visible:scale-110 active:scale-95"
                            style={{ backgroundColor: hex }}
                            title={`${colorName}-${shade}`}
                          >
                            <span className="sr-only">
                              {colorName}-{shade}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>

            {/* Grayscale Colors */}
            <div className="mt-6 space-y-3 border-t border-gray-200 pt-6 dark:border-gray-700">
              {getColorNames()
                .filter((name) => isGrayScale(name))
                .map((colorName) => (
                  <div
                    key={colorName}
                    className="md:flex md:items-center md:gap-2"
                  >
                    <div className="mb-1 text-sm font-medium text-gray-600 uppercase md:mb-0 md:w-16 md:shrink-0 dark:text-gray-400">
                      {colorName}
                    </div>
                    <div className="flex w-full gap-1">
                      {getShades().map((shade) => {
                        const hex = tailwindColors[colorName][shade];

                        return (
                          <button
                            key={shade}
                            onClick={() =>
                              handleTailwindColorSelect(colorName, shade)
                            }
                            className="group relative aspect-square h-full flex-1 shrink-0 rounded-sm transition-transform hover:scale-110 focus:outline-hidden focus-visible:scale-110 active:scale-95"
                            style={{ backgroundColor: hex }}
                            title={`${colorName}-${shade}`}
                          >
                            <span className="sr-only">
                              {colorName}-{shade}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>

        {/* Right Column - Output */}
        <div className="space-y-10">
          {/* Adjustments */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{t.adjustment}</h2>
              <button
                onClick={handleReset}
                className="dark:hover:bg-atom-one-dark-lighter dark:focus-visible:bg-atom-one-dark-lighter rounded-lg p-1.5 outline-hidden transition-colors hover:bg-gray-100 focus-visible:bg-gray-100"
                title={t.resetAdjustment}
                aria-label={t.resetAdjustment}
              >
                <IconRefresh className="size-5" />
              </button>
            </div>
            <div className="space-y-4 px-4">
              {/* Hue */}
              <HueSlider
                label={t.hue}
                value={targetHue}
                min={0}
                max={360}
                inputColor={normalizedInputColor}
                onChange={handleHueChange}
              />
              {/* Lightness */}
              <LightnessSlider
                label={t.lightness}
                value={targetLightness}
                onChange={handleLightnessChange}
              />
              {/* Saturation */}
              <SaturationSlider
                label={t.saturation}
                value={targetSaturation}
                inputColor={normalizedInputColor}
                onChange={handleSaturationChange}
              />
            </div>
          </section>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{t.generatedPalette}</h2>
              <button
                onClick={handleAddToHistory}
                className="dark:hover:bg-atom-one-dark-lighter dark:focus-visible:bg-atom-one-dark-lighter rounded-lg p-1.5 outline-hidden transition-colors hover:bg-gray-100 focus-visible:bg-gray-100"
                title={t.saveToHistory}
                aria-label={t.saveToHistory}
              >
                <IconPlus className="size-5" />
              </button>
            </div>

            {/* Color Swatches - Horizontal Layout. Below 640px the 14px
                labels are vertical (read from the bottom, like the shades
                above the picker): the 12 columns are narrower than "BASE"
                (ui-revise7). */}
            <div className="flex items-center gap-1">
              {/* BASE Color */}
              <div className="flex flex-1 flex-col items-center gap-1 truncate">
                <button
                  onClick={() => handleCopyColor(baseColor)}
                  className="aspect-square w-full cursor-pointer rounded-sm transition-transform hover:scale-110 focus:outline-hidden focus-visible:scale-110 active:scale-95"
                  style={{ backgroundColor: baseColor }}
                  title={`BASE - ${baseColor.toUpperCase()}`}
                  aria-label={formatMessage(t.copyColor, {
                    color: `BASE ${baseColor.toUpperCase()}`,
                  })}
                >
                  <span className="sr-only">BASE</span>
                </button>
                <div className="font-mono text-sm leading-6 font-medium text-gray-600 max-sm:h-10 max-sm:rotate-180 max-sm:[writing-mode:vertical-rl] dark:text-gray-400">
                  BASE
                </div>
              </div>
              {/* Palette Colors */}
              {getShadeLabels().map((shade) => {
                const hex = palette[shade];
                return (
                  <div
                    key={shade}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <button
                      onClick={() => handleCopyColor(hex)}
                      className="aspect-square w-full cursor-pointer rounded-sm transition-transform hover:scale-110 focus:outline-hidden focus-visible:scale-110 active:scale-95"
                      style={{ backgroundColor: hex }}
                      title={`${shade} - ${hex.toUpperCase()}`}
                      aria-label={formatMessage(t.copyColor, {
                        color: `${shade} ${hex.toUpperCase()}`,
                      })}
                    >
                      <span className="sr-only">{shade}</span>
                    </button>
                    <div className="font-mono text-sm leading-6 font-medium text-gray-600 max-sm:h-10 max-sm:rotate-180 max-sm:[writing-mode:vertical-rl] dark:text-gray-400">
                      {shade}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Palette History */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{t.paletteHistory}</h2>
              <button
                onClick={handleClearHistory}
                className="dark:hover:bg-atom-one-dark-lighter dark:focus-visible:bg-atom-one-dark-lighter rounded-lg p-1.5 outline-hidden transition-colors hover:bg-gray-100 focus-visible:bg-gray-100"
                title={t.deleteAllHistory}
                aria-label={t.deleteAllHistory}
              >
                <IconTrash className="size-5" />
              </button>
            </div>
            {paletteHistory.length > 0 ? (
              <div className="flex flex-col-reverse gap-4">
                {paletteHistory.map((item) => (
                  <div key={item.id} className="flex items-center gap-1">
                    {/* BASE Color */}
                    <button
                      onClick={() => handleCopyColor(item.baseColor)}
                      className="aspect-square w-full cursor-pointer rounded-sm transition-transform hover:scale-110 focus:outline-hidden focus-visible:scale-110 active:scale-95"
                      style={{ backgroundColor: item.baseColor }}
                      title={`BASE - ${item.baseColor}`}
                      aria-label={formatMessage(t.copyColor, {
                        color: `BASE ${item.baseColor}`,
                      })}
                    >
                      <span className="sr-only">BASE</span>
                    </button>
                    <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />
                    {/* Palette Colors */}
                    {getShadeLabels().map((shade) => {
                      const hex = item.palette[shade];
                      return (
                        <button
                          key={shade}
                          onClick={() => handleCopyColor(hex)}
                          className="aspect-square w-full cursor-pointer rounded-sm transition-transform hover:scale-110 focus:outline-hidden focus-visible:scale-110 active:scale-95"
                          style={{ backgroundColor: hex }}
                          title={`${shade} - ${hex}`}
                          aria-label={formatMessage(t.copyColor, {
                            color: `${shade} ${hex}`,
                          })}
                        >
                          <span className="sr-only">{shade}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handleRemoveFromHistory(item.id)}
                      className="rounded-sm p-1 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600"
                      title={t.deleteFromHistory}
                      aria-label={t.deleteFromHistory}
                    >
                      <IconX className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm leading-6 text-gray-600 dark:text-gray-400">
                {t.historyEmptyMessage}
              </p>
            )}
          </section>

          {/* Tailwind Config Snippet */}
          <section>
            <h2 className="mb-4 text-base font-semibold">{t.tailwindConfig}</h2>
            <div className="relative">
              <pre className="bg-atom-one-dark dark:bg-atom-one-dark-light overflow-x-auto rounded-lg p-3 font-mono text-sm leading-6 text-gray-300 dark:text-gray-300">
                {`colors: {
  custom: {
${getShadeLabels()
  .map((shade) => `    ${shade}: '${palette[shade]}',`)
  .join("\n")}
  }
}`}
              </pre>
              <button
                onClick={handleCopyAsTailwind}
                className="absolute top-2 right-2 rounded-lg p-1 text-gray-300 transition-colors hover:bg-white/10 dark:text-gray-300"
                title={t.copyConfig}
                aria-label={t.copyConfig}
              >
                <IconClipboard className="size-5" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
