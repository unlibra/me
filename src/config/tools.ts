import { paths, type SitePath } from "@/config/site";

/** Web tools served under /lab (design doc 3.2). */
export const toolIds = [
  "tw-palette-generator",
  "favicon-generator",
  "svg-optimizer",
  "password-generator",
] as const;

export type ToolId = (typeof toolIds)[number];

/** Path of a tool page in the default language (Japanese). */
export const toolPath = (id: ToolId): SitePath => `${paths.tools.ja}/${id}`;
