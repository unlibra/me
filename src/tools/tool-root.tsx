import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/tools/i18n";
import type { ToolLocale } from "@/tools/messages";

/**
 * Wraps the root of each tool island. Every island is a separate React root,
 * so each one gets its own texts and toast container.
 */
export function ToolRoot({
  locale,
  children,
}: {
  locale: ToolLocale;
  children: ReactNode;
}) {
  return (
    <I18nProvider locale={locale}>
      <ToastProvider>{children}</ToastProvider>
    </I18nProvider>
  );
}
