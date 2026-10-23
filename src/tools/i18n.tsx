import { createContext, useContext, type ReactNode } from "react";

import {
  toolMessages,
  type ToolLocale,
  type ToolMessages,
} from "@/tools/messages";

const MessagesContext = createContext<ToolMessages | null>(null);

/** Provides the texts of one language to the components of a tool. */
export function I18nProvider({
  locale,
  children,
}: {
  locale: ToolLocale;
  children: ReactNode;
}) {
  return (
    <MessagesContext.Provider value={toolMessages[locale]}>
      {children}
    </MessagesContext.Provider>
  );
}

/** Texts in the language of the page. */
export function useMessages(): ToolMessages {
  const messages = useContext(MessagesContext);
  if (!messages) {
    throw new Error("useMessages must be used within I18nProvider");
  }
  return messages;
}
