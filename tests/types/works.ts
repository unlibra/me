// Type-level tests for the works data, checked by `astro check` (part of
// `npm run build`). Each @ts-expect-error fails the check if the line it marks
// stops being an error. The valid works below show that the errors come only
// from the subcategory or the docs URL.
import type { ImageMetadata } from "astro";
import type { Work } from "@/config/works";

declare const image: ImageMetadata;

export const valid: Work[] = [
  { id: "botsu", category: "keyboards", year: "2024", image },
  { id: "tkinter-unblur", category: "libraries", year: "2020", image },
  { id: "svg-optimizer", category: "apps", year: "2025", image },
  {
    id: "dummy-avatar",
    category: "vr-3d",
    subcategory: "avatar",
    year: "2026",
    image,
  },
  {
    id: "tkinter-unblur",
    category: "libraries",
    year: "2020",
    image,
    docs: "https://docs.unlibra.com/tkinter-unblur/",
  },
];

export const withSubcategoryOutsideVr3d: Work[] = [
  {
    id: "botsu",
    category: "keyboards",
    // @ts-expect-error Works outside VR & 3D have no subcategory.
    subcategory: "avatar",
    year: "2024",
    image,
  },
  {
    id: "tkinter-unblur",
    category: "libraries",
    // @ts-expect-error Works outside VR & 3D have no subcategory.
    subcategory: "asset",
    year: "2020",
    image,
  },
  {
    id: "svg-optimizer",
    category: "apps",
    // @ts-expect-error Works outside VR & 3D have no subcategory.
    subcategory: "unity-tool",
    year: "2025",
    image,
  },
];

export const vr3dWithoutSubcategory: Work[] = [
  // @ts-expect-error A VR & 3D work must have a subcategory.
  { id: "dummy-avatar", category: "vr-3d", year: "2026", image },
];

export const unknownSubcategory: Work[] = [
  {
    id: "dummy-avatar",
    category: "vr-3d",
    // @ts-expect-error The subcategory is one of the three VR & 3D kinds.
    subcategory: "shader",
    year: "2026",
    image,
  },
];

export const oldDocsHost: Work[] = [
  {
    id: "tkinter-unblur",
    category: "libraries",
    year: "2020",
    image,
    // @ts-expect-error Documentation links point to docs.unlibra.com.
    docs: "https://unlibra.github.io/tkinter-unblur/",
  },
];
