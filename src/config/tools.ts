import type { ImageMetadata } from "astro";
import twPaletteGeneratorIcon from "@/assets/tools/tw-palette-generator.svg";
import faviconGeneratorIcon from "@/assets/tools/favicon-generator.svg";
import svgOptimizerIcon from "@/assets/tools/svg-optimizer.svg";
import passwordGeneratorIcon from "@/assets/tools/password-generator.svg";
import type { Locale } from "@/config/locales";
import { paths, type SitePath } from "@/config/site";

/** Web tools served under /lab (design doc 3.2), in display order. */
export const toolIds = [
  "tw-palette-generator",
  "favicon-generator",
  "svg-optimizer",
  "password-generator",
] as const;

export type ToolId = (typeof toolIds)[number];

/** Path of a tool page: `/lab/{tool}` (Japanese) or `/en/lab/{tool}`. */
export const toolPath = (id: ToolId, lang: Locale): SitePath =>
  `${paths.tools[lang]}/${id}`;

/** Tool icons (square SVGs drawn on a colored circle). */
export const toolIcons: Record<ToolId, ImageMetadata> = {
  "tw-palette-generator": twPaletteGeneratorIcon,
  "favicon-generator": faviconGeneratorIcon,
  "svg-optimizer": svgOptimizerIcon,
  "password-generator": passwordGeneratorIcon,
};
