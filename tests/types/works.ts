// Type-level tests for the works data, checked by `astro check` (part of
// `npm run build`). Each @ts-expect-error fails the check if the line it marks
// stops being an error. The valid works below show that the errors come only
// from the subcategory or the docs URL.
import type { ImageMetadata } from "astro";
import type { Work } from "@/config/works";

declare const image: ImageMetadata;

export const valid: Work[] = [
  { id: "botsu", category: "keyboard", year: "2024", image },
  { id: "tkinter-unblur", category: "software", year: "2020", image },
  { id: "svg-optimizer", category: "web", year: "2025", image },
  {
    id: "dummy-avatar",
    category: "vrchat",
    subcategory: "avatar",
    year: "2026",
    image,
  },
  {
    id: "tkinter-unblur",
    category: "software",
    year: "2020",
    image,
    docs: "https://docs.unlibra.com/tkinter-unblur/",
  },
];

export const withSubcategoryOutsideVrchat: Work[] = [
  {
    id: "botsu",
    category: "keyboard",
    // @ts-expect-error Works outside VRChat have no subcategory.
    subcategory: "avatar",
    year: "2024",
    image,
  },
  {
    id: "tkinter-unblur",
    category: "software",
    // @ts-expect-error Works outside VRChat have no subcategory.
    subcategory: "asset",
    year: "2020",
    image,
  },
  {
    id: "svg-optimizer",
    category: "web",
    // @ts-expect-error Works outside VRChat have no subcategory.
    subcategory: "unity-tool",
    year: "2025",
    image,
  },
];

export const vrchatWithoutSubcategory: Work[] = [
  // @ts-expect-error A VRChat work must have a subcategory.
  { id: "dummy-avatar", category: "vrchat", year: "2026", image },
];

export const unknownSubcategory: Work[] = [
  {
    id: "dummy-avatar",
    category: "vrchat",
    // @ts-expect-error The subcategory is one of the three VRChat kinds.
    subcategory: "shader",
    year: "2026",
    image,
  },
];

export const oldDocsHost: Work[] = [
  {
    id: "tkinter-unblur",
    category: "software",
    year: "2020",
    image,
    // @ts-expect-error Documentation links point to docs.unlibra.com.
    docs: "https://unlibra.github.io/tkinter-unblur/",
  },
];
