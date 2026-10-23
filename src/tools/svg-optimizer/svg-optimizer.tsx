import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  IconChevronDown,
  IconPhoto,
  IconPlus,
  IconShieldCheck,
} from "@/components/ui/icons";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { CheckerboardPreview } from "@/components/ui/checkerboard-preview";
import { FullPageDropZone } from "@/components/ui/full-page-drop-zone";
import { useToast } from "@/components/ui/toast";
import { useMessages } from "@/tools/i18n";
import { validateSvgFile } from "@/tools/lib/file";
import { downloadBlob } from "@/tools/lib/image";
import type { ToolLocale } from "@/tools/messages";
import { ToolRoot } from "@/tools/tool-root";

import { SvgOptionsPanel } from "./svg-options-panel";
import { optimizeSvg, type SvgoOptions } from "./svgo";
import { DEFAULT_SVGO_OPTIONS, PRESETS, type PresetId } from "./svgo-presets";

/** Island entry: the tool body of the SVG optimizer page. */
export default function SvgOptimizerIsland({ locale }: { locale: ToolLocale }) {
  return (
    <ToolRoot locale={locale}>
      <SvgOptimizer />
    </ToolRoot>
  );
}

function SvgOptimizer() {
  const { common, svgOptimizer: t } = useMessages();
  const toast = useToast();
  const [originalSvg, setOriginalSvg] = useState<string | null>(null);
  const [previewOptimizedSvg, setPreviewOptimizedSvg] = useState<string | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [previewOptimizedSize, setPreviewOptimizedSize] = useState<number>(0);
  const [fileName, setFileName] = useState<string>("");
  const [options, setOptions] = useState<SvgoOptions>(DEFAULT_SVGO_OPTIONS);
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>("safe");
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate SVG file (type + size)
      const validationError = validateSvgFile(file, common.fileErrors, {
        maxSize: 10 * 1024 * 1024,
      });
      if (validationError) {
        toast.error(validationError);
        return;
      }

      try {
        const text = await file.text();
        setOriginalSvg(text);
        setOriginalSize(file.size);
        setFileName(file.name);
      } catch (err) {
        toast.error(t.errors.svgLoadFailed);
        console.error(err);
      }
    },
    [toast, t, common],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePresetChange = useCallback((presetId: PresetId) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setOptions(preset.options);
      setSelectedPreset(presetId);
    }
  }, []);

  const handleOptionsChange = useCallback((newOptions: SvgoOptions) => {
    setOptions(newOptions);
    // Clear preset selection when manually changing options
    setSelectedPreset(null);
  }, []);

  // Auto-optimize in background for preview when file or options change
  useEffect(() => {
    if (!originalSvg) {
      setPreviewOptimizedSvg(null);
      setPreviewOptimizedSize(0);
      setPreviewUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    const optimize = async () => {
      try {
        const optimized = await optimizeSvg(originalSvg, options);
        if (cancelled) return;

        const blob = new Blob([optimized], { type: "image/svg+xml" });
        objectUrl = URL.createObjectURL(blob);

        setPreviewOptimizedSvg(optimized);
        setPreviewOptimizedSize(blob.size);
        setPreviewUrl(objectUrl);
      } catch (err) {
        if (cancelled) return;
        console.error("Preview optimization failed:", err);
        setPreviewOptimizedSvg(null);
        setPreviewOptimizedSize(0);
        setPreviewUrl(null);
      }
    };

    optimize();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [originalSvg, options]);

  const handleDownload = useCallback(async () => {
    if (!originalSvg) {
      toast.error(t.errors.selectSvg);
      return;
    }

    setIsDownloading(true);

    try {
      const optimized = await optimizeSvg(originalSvg, options);
      const blob = new Blob([optimized], { type: "image/svg+xml" });
      downloadBlob(blob, fileName.replace(/\.svg$/i, "") + "-optimized.svg");
    } catch (err) {
      toast.error(t.errors.optimizeFailed);
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  }, [originalSvg, options, fileName, toast, t]);

  const compressionRatio =
    originalSize && previewOptimizedSize
      ? ((1 - previewOptimizedSize / originalSize) * 100).toFixed(1)
      : "0";

  return (
    <FullPageDropZone onFileDrop={handleFileSelect} accept="image/svg+xml">
      {/* Main Content Layout */}
      <div className="mb-8 flex flex-col gap-12 lg:flex-row">
        {/* Left Column */}
        <div className="flex-1 space-y-8">
          {/* File Upload */}
          <div className="space-y-2">
            <h2 className="block text-base font-semibold">
              {common.selectImage}
            </h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/svg+xml,.svg"
              onChange={handleInputChange}
              className="hidden"
            />
            <button
              onClick={handleFileButtonClick}
              className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-base font-medium text-white outline-hidden transition-colors hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-sky-600 dark:hover:bg-sky-500"
            >
              <IconPlus className="size-5 stroke-2" />
              {common.selectImage}
            </button>
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
              {t.uploadHint}
              <br />
              {common.dragDropAnywhere}
            </p>
            {/* Privacy Notice */}
            <div className="flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-950 dark:bg-sky-950">
              <IconShieldCheck className="size-5 shrink-0" />
              <div className="text-sm leading-6">{common.privacyNotice}</div>
            </div>
          </div>

          {/* Options Panel (Mobile Only) */}
          <Disclosure defaultOpen={false} as="div" className="lg:hidden">
            {({ open }) => (
              <div className="dark:bg-atom-one-dark-light overflow-hidden rounded-lg bg-gray-100">
                {/* The heading holds the button (a heading inside a button
                    is not exposed as a heading; ui-revise12 5). */}
                <h2>
                  <DisclosureButton className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-medium outline-hidden transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                    <span className="text-base font-semibold">{t.options}</span>
                    <IconChevronDown
                      className={`h-5 w-5 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </DisclosureButton>
                </h2>
                <DisclosurePanel className="p-4">
                  <SvgOptionsPanel
                    options={options}
                    onOptionsChange={handleOptionsChange}
                    selectedPreset={selectedPreset}
                    onPresetChange={handlePresetChange}
                  />
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>

          {/* Preview */}
          <div className="flex flex-col">
            <h2 className="mb-2 block text-base font-semibold">
              {common.preview}
            </h2>
            <div className="space-y-4">
              <CheckerboardPreview
                emptyState={
                  <div className="text-center text-sm leading-6 text-gray-600 dark:text-gray-400">
                    <IconPhoto className="mx-auto mb-2 h-12 w-12" />
                    <p>{t.previewPlaceholder.line1}</p>
                    <p>{t.previewPlaceholder.line2}</p>
                  </div>
                }
              >
                {previewUrl && (
                  <div className="flex size-full items-center justify-center">
                    <img
                      src={previewUrl}
                      alt={t.optimizedPreviewAlt}
                      className="h-auto max-h-full w-auto max-w-full"
                    />
                  </div>
                )}
              </CheckerboardPreview>

              {/* File Size Info: its place is kept (hidden) from the file's
                  selection until the first preview, so that the Download
                  button does not move when the sizes appear (TS-10). */}
              {originalSvg && (
                <div
                  data-svg-sizes
                  aria-hidden={previewOptimizedSvg ? undefined : true}
                  className={`dark:bg-atom-one-dark-light space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-base dark:border-gray-700 ${
                    previewOptimizedSvg ? "" : "invisible"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t.original}:
                    </span>
                    <span className="font-medium">
                      {(originalSize / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t.optimized}:
                    </span>
                    <span className="font-medium">
                      {(previewOptimizedSize / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t.compressionRatio}:
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {compressionRatio}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download Button */}
          <div className="flex justify-center">
            <button
              onClick={handleDownload}
              disabled={!originalSvg || isDownloading}
              className="dark:disabled:bg-atom-one-dark-light rounded-full bg-amber-500 px-8 py-3 font-medium text-white outline-hidden transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 enabled:hover:bg-amber-600 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-amber-600 dark:enabled:hover:bg-amber-500"
            >
              {common.download}
            </button>
          </div>
        </div>

        {/* Right Column - Options Panel (Desktop Only) */}
        <div className="hidden lg:block lg:flex-1">
          <h2 className="mb-4 text-base font-semibold">{t.options}</h2>
          <SvgOptionsPanel
            options={options}
            onOptionsChange={handleOptionsChange}
            selectedPreset={selectedPreset}
            onPresetChange={handlePresetChange}
          />
        </div>
      </div>
    </FullPageDropZone>
  );
}
