import { IconClipboard, IconClipboardCheck } from "@/components/ui/icons";
import { useCallback, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useMessages } from "@/tools/i18n";

/**
 * The copy button at the right end of a value's field (the password
 * generator, the donate page): copies `text()` and says so in a toast. The
 * field is `relative` with room on the right (pr-28).
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
  /** The error toast when copying fails. */
  failed: string;
  disabled?: boolean;
}) {
  const { common } = useMessages();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const value = text();
      if (!value) throw new Error("Nothing to copy");
      await navigator.clipboard.writeText(value);
      toast.success(common.copied);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(failed);
      console.error("Failed to copy:", err);
    }
  }, [text, failed, toast, common]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      className="dark:focus-visible:ring-offset-atom-one-dark absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1.5 rounded-md bg-sky-500 px-3 py-1.5 text-base font-medium text-white transition-colors hover:bg-sky-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
      aria-label={label}
    >
      {copied ? (
        <IconClipboardCheck className="size-5" />
      ) : (
        <IconClipboard className="size-5" />
      )}
      {common.copy}
    </button>
  );
}
