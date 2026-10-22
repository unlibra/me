// Classes shared by the cards. The photo cards (frame, featured) and the list
// items (Apps, Libraries) differ in layout, but follow the same rules for the
// title, the summary, the links, the corner radius and the focus ring
// (ui-revise3 3).

/** The corner radius of the photo cards, the list items and the icons. */
export const cardRadius = "rounded-card";

/** Titles: the same weight and color on every card (the size may differ). */
export const cardTitle = "font-semibold text-gray-900 dark:text-white";

/** One-line summaries: the same size, line height and color on every card. */
export const cardSummary = "text-base text-gray-600 dark:text-gray-400";

/**
 * Links on the cards (the work's actions and "詳しく見る"): the same color,
 * chevron and hover. The chevron moves right on hover; `cardLinkChevron`
 * (for the actions) and `moreChevron` (for "詳しく見る", which moves with the
 * card) are the two triggers of the same motion.
 */
export const cardLink =
  "inline-flex items-center gap-0.5 text-sm font-medium text-logo-dark dark:text-logo-light";
const chevron = "size-4 transition-transform motion-reduce:transition-none";
export const cardLinkChevron = `${chevron} group-hover/link:translate-x-0.5`;
export const moreChevron = `${chevron} group-hover:translate-x-0.5`;

/** The keyboard focus ring of the cards and their links. */
export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500";

/**
 * The photo cards: hover and keyboard focus lift the card a little and give
 * it a shadow, so that it reads as something to click (the details open in
 * a dialog).
 */
export const liftOnHover =
  "transition duration-200 hover:shadow-md has-[button:focus-visible]:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:has-[button:focus-visible]:-translate-y-0.5 motion-reduce:transition-none";

/**
 * The list items: the former tool site's card hover (the background fades
 * in, `transition-colors`), on keyboard focus too.
 */
export const listHover =
  "transition-colors hover:bg-gray-100 has-[button:focus-visible]:bg-gray-100 dark:hover:bg-atom-one-dark-light dark:has-[button:focus-visible]:bg-atom-one-dark-light";

/** The VR & 3D subcategory label. */
export const subcategoryChip =
  "w-fit rounded-full bg-logo-accent/15 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:text-orange-200";
