// Type-level tests, checked by `astro check` (part of `npm run build`).
// Each @ts-expect-error fails the check if the line it marks stops being an
// error, so these prove that ja and en tool texts must have the same keys.
import type { ToolMessages } from "@/tools/messages";

declare const messages: ToolMessages;

declare const commonWithoutCopy: Omit<ToolMessages["common"], "copy">;

export const missingKey: ToolMessages = {
  ...messages,
  // @ts-expect-error A language that lacks a key is rejected.
  common: commonWithoutCopy,
};

export const extraKey: ToolMessages = {
  ...messages,
  // @ts-expect-error A language with an extra key is rejected.
  common: { ...messages.common, extra: "extra" },
};

export const nonString: ToolMessages = {
  ...messages,
  // @ts-expect-error Every text is a string.
  common: { ...messages.common, copy: 1 },
};

declare const toolsWithoutOne: Omit<
  ToolMessages["tools"],
  "password-generator"
>;

export const missingTool: ToolMessages = {
  ...messages,
  // @ts-expect-error Every tool has texts in every language.
  tools: toolsWithoutOne,
};
