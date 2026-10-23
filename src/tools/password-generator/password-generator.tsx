import { Field, Label, Switch } from "@headlessui/react";
import {
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";

import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/toast";
import { TogglePill } from "@/components/ui/toggle-pill";
import { useMessages } from "@/tools/i18n";
import type { ToolLocale } from "@/tools/messages";
import { ToolRoot } from "@/tools/tool-root";

import { generatePassword, type PasswordOptions } from "./password";

/** Island entry: the tool body of the password generator page. */
export default function PasswordGeneratorIsland({
  locale,
}: {
  locale: ToolLocale;
}) {
  return (
    <ToolRoot locale={locale}>
      <PasswordGenerator />
    </ToolRoot>
  );
}

function PasswordGenerator() {
  const { common, passwordGenerator: t } = useMessages();
  const toast = useToast();

  // Password options
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
    avoidAmbiguous: true,
  });

  // Generated password
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate password on mount and when options change
  const regenerate = useCallback(() => {
    const newPassword = generatePassword(options);
    setPassword(newPassword);
  }, [options]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      toast.success(common.copied);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t.errors.copyFailed);
      console.error("Failed to copy:", err);
    }
  }, [password, toast, common, t]);

  // Update option helper
  const updateOption = <K extends keyof PasswordOptions>(
    key: K,
    value: PasswordOptions[K],
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  // Check if at least one character type is selected
  const hasCharset =
    options.uppercase ||
    options.lowercase ||
    options.numbers ||
    options.symbols;

  return (
    <>
      {/* Password Display */}
      <div className="mb-8 space-y-3">
        <div className="dark:bg-atom-one-dark-light relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-600">
          <div className="w-full truncate bg-transparent py-3 pr-28 pl-4 font-mono text-base text-gray-900 outline-hidden dark:text-gray-100">
            {password || (
              <span className="text-gray-400 dark:text-gray-500">
                {t.selectCharacterTypes}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            disabled={!password}
            className="dark:focus-visible:ring-offset-atom-one-dark absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1.5 rounded-md bg-sky-500 px-3 py-1.5 text-base font-medium text-white transition-colors hover:bg-sky-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
            aria-label={t.copyToClipboard}
          >
            {copied ? (
              <ClipboardDocumentCheckIcon className="size-5" />
            ) : (
              <ClipboardDocumentIcon className="size-5" />
            )}
            {common.copy}
          </button>
        </div>
        <button
          onClick={regenerate}
          disabled={!hasCharset}
          className="dark:bg-atom-one-dark-light dark:hover:bg-atom-one-dark-lighter dark:focus-visible:ring-offset-atom-one-dark flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-base font-medium text-gray-600 transition-colors hover:bg-gray-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 dark:text-gray-400"
        >
          <ArrowPathIcon className="size-5" />
          {common.regenerate}
        </button>
      </div>

      {/* Options */}
      <div className="space-y-8">
        {/* Length Slider */}
        <Slider
          label={t.length}
          value={options.length}
          min={8}
          max={64}
          onChange={(value) => updateOption("length", value)}
        />

        {/* Character Type Toggles */}
        <div>
          <label className="mb-2 block text-base font-semibold">
            {t.characterTypes}
          </label>
          <p className="mb-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t.characterTypesHint}
          </p>
          <div className="flex flex-wrap gap-2">
            <TogglePill
              pressed={options.uppercase}
              onClick={() => updateOption("uppercase", !options.uppercase)}
              ariaLabel="Toggle uppercase"
            >
              {t.uppercase}
            </TogglePill>
            <TogglePill
              pressed={options.lowercase}
              onClick={() => updateOption("lowercase", !options.lowercase)}
              ariaLabel="Toggle lowercase"
            >
              {t.lowercase}
            </TogglePill>
            <TogglePill
              pressed={options.numbers}
              onClick={() => updateOption("numbers", !options.numbers)}
              ariaLabel="Toggle numbers"
            >
              {t.numbers}
            </TogglePill>
            <TogglePill
              pressed={options.symbols}
              onClick={() => updateOption("symbols", !options.symbols)}
              ariaLabel="Toggle symbols"
            >
              {t.symbols}
            </TogglePill>
          </div>
        </div>

        {/* Avoid Ambiguous Toggle */}
        <div>
          <Field as="div" className="flex items-center justify-between gap-4">
            <Label className="flex-1 cursor-pointer text-base font-semibold text-gray-700 dark:text-gray-300">
              {t.avoidAmbiguous}
            </Label>
            <Switch
              checked={options.avoidAmbiguous}
              onChange={(v) => updateOption("avoidAmbiguous", v)}
              className={`${
                options.avoidAmbiguous
                  ? "bg-sky-500 dark:bg-sky-600"
                  : "bg-gray-300 dark:bg-gray-600"
              } dark:focus-visible:ring-offset-atom-one-dark relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
            >
              <span
                aria-hidden="true"
                className={`${
                  options.avoidAmbiguous ? "translate-x-4" : "translate-x-0"
                } pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
          </Field>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t.avoidAmbiguousHint}
          </p>
        </div>
      </div>
    </>
  );
}
