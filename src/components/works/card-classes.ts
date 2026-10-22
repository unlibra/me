// Classes shared by the cards. The photo cards (frame, featured) and the list
// items (Apps, Libraries) differ in layout, but follow the same rules for the
// title, the summary, the links, the corner radius, the focus ring
// (ui-revise3 3) and the hover (ui-revise4 2).

/** The corner radius of the photo cards, the list items and the icons. */
export const cardRadius = "rounded-card";

/** Titles: the same weight and color on every card (the size may differ). */
export const cardTitle = "font-semibold text-gray-900 dark:text-white";

/** One-line summaries: the same size, line height and color on every card. */
export const cardSummary = "text-base text-gray-600 dark:text-gray-400";

/**
 * Links on the cards (the work's actions and "詳しく見る"): the same color
 * and size. The links have the up-right arrow, which moves on hover;
 * "詳しく見る" opens the details and has none (ui-revise4 2).
 */
export const cardLink =
  "inline-flex items-center gap-0.5 text-sm font-medium text-logo-dark dark:text-logo-light";
/**
 * The arrow of an action: the size of the text (14px), centered on the line
 * by `cardLink` (ui-revise5 8); moves on the action's own hover.
 */
export const actionArrow =
  "size-3.5 shrink-0 transition-transform motion-reduce:transition-none group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5";

/**
 * The card's first link (where a click on the card goes; "詳しく見る" on
 * the cards that open their details): underlined on the card's hover, but
 * not while the pointer is on another of the card's links (ui-revise5 11).
 */
export const primaryLink =
  "group-hover:underline group-has-[[data-work-action=secondary]:hover]:no-underline";

/** The keyboard focus ring of the cards and their links. */
export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500";

/**
 * Every card's hover: the former tool site's card hover (the background
 * fades in, `transition-colors`, 150ms), on keyboard focus on the title
 * too. The photo is not zoomed and the card does not lift (ui-revise4 2).
 */
export const cardHover =
  "transition-colors hover:bg-gray-100 has-[h3_:focus-visible]:bg-gray-100 dark:hover:bg-atom-one-dark-light dark:has-[h3_:focus-visible]:bg-atom-one-dark-light";
