import en, { type ToolMessages } from "./en";
import ja from "./ja";

export type { ToolMessages };

/** Languages the web tools are available in. */
export const toolLocales = ["ja", "en"] as const;

export type ToolLocale = (typeof toolLocales)[number];

export const toolMessages: Record<ToolLocale, ToolMessages> = { ja, en };

/** IDs of the tools that have texts. */
export type ToolMessageId = keyof ToolMessages["tools"];
