// How the top page shows each work. Kept apart from works.ts (which imports
// the images) so that the tests can import it.
import type { Category, Work } from "@/config/works";

/**
 * Each category's card: "tool" is the former tool site's card (an icon on a
 * circle, the name and the summary), "frame" a card with a 4:3 photo.
 */
export const cardStyles = {
  keyboards: "frame",
  libraries: "tool",
  apps: "tool",
  "vr-3d": "frame",
} as const satisfies Record<Category, "tool" | "frame">;

export type CardStyle = (typeof cardStyles)[Category];

/** Whether a category's works are photos (or else icons and logos). */
export const isPhoto = (category: Category): boolean =>
  cardStyles[category] === "frame";

/**
 * The card of a work: a featured work (`featured: true`) is a large,
 * full-width card in any category; the others take their category's card.
 */
export const cardKind = (
  work: Pick<Work, "category" | "featured">,
): CardStyle | "featured" =>
  work.featured ? "featured" : cardStyles[work.category];

/** How a work's photo is cropped to its frame (`imagePosition`). */
export const photoPosition = (
  work: Pick<Work, "imagePosition">,
): "object-top" | "object-center" =>
  work.imagePosition === "top" ? "object-top" : "object-center";

/**
 * The photo's zoom on hover: none for images with other creators' material
 * (`thirdPartyImage`), which are shown as they are.
 */
export const photoHover = (
  work: Pick<Work, "thirdPartyImage">,
): "group-hover:scale-[1.03]" | null =>
  work.thirdPartyImage ? null : "group-hover:scale-[1.03]";
