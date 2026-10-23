import { IconCheck, IconClipboard } from "@/components/ui/icons";
import { useCallback, useEffect, useState } from "react";

import { useMessages } from "@/tools/i18n";

/**
 * The copy button at the right end of a value's field (the password
 * generator, the donate page): copies `text()`, then reads "完了" with a check
 * for 2 seconds in place of "コピー" (no toast). The two labels share one
 * grid cell, so the button keeps the width of the longer one. The field is
 * `relative` with room on the right for it (pr-44). The button is 36px
 * high; its ::before reaches 4px above and below, a 44px target (DESIGN.md
 * 5.4), inside the field's 50px.
 */
export function CopyButton({
  text,
  label,
  failed,
  disabled = false,
}: {
  /** The value to copy, read when the button is pressed. */
  text: () => string;
  /** The button's name (it contains the visible "コピー"). */
  label: string;
  /** Read out when copying fails (the label stays "コピー"). */
  failed: string;
  disabled?: boolean;
}) {
  const { common } = useMessages();
  const [result, setResult] = useState<"copied" | "failed" | null>(null);
  const copied = result === "copied";

  // Back to "コピー" after 2 seconds; a new press restarts the wait.
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), 2000);
    return () => clearTimeout(timer);
  }, [result]);

  const handleCopy = useCallback(async () => {
    setResult(null);
    try {
      const value = text();
      if (!value) throw new Error("Nothing to copy");
      await navigator.clipboard.writeText(value);
      setResult("copied");
    } catch (err) {
      setResult("failed");
      console.error("Failed to copy:", err);
    }
  }, [text]);

  const shown = "col-start-1 row-start-1";
  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        disabled={disabled}
        className="dark:focus-visible:ring-offset-atom-one-dark bg-primary hover:bg-primary-dark focus-visible:ring-primary absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1.5 rounded-md px-3 py-1.5 text-base font-medium text-white transition-colors before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
        aria-label={label}
        data-copied={copied || undefined}
      >
        {copied ? (
          <IconCheck className="size-5" />
        ) : (
          <IconClipboard className="size-5" />
        )}
        <span className="grid justify-items-center" aria-hidden="true">
          <span className={`${shown} ${copied ? "invisible" : ""}`}>
            {common.copy}
          </span>
          <span className={`${shown} ${copied ? "" : "invisible"}`}>
            {common.copied}
          </span>
        </span>
      </button>
      {/* The button's name stays the same, so the result is read out here. */}
      <span className="sr-only" role="status">
        {result === "copied"
          ? common.copied
          : result === "failed"
            ? failed
            : ""}
      </span>
    </>
  );
}
