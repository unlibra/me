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
 * and size. The actions end with the up-right arrow (Lucide "move-up-right"),
 * the size of the text (14px) and centered on the line (ui-revise5 6, 8);
 * "詳しく見る" opens the details and has none (ui-revise4 2).
 */
export const cardLink =
  "inline-flex items-center gap-0.5 text-sm font-medium text-logo-dark dark:text-logo-light";
/** The arrow of an action. It does not move (ui-revise5 5). */
export const actionArrow = "size-3.5 shrink-0";

/**
 * The text of a card's link, with its underline: a 1px line under the text
 * that grows from the left on hover (200ms), and appears at once under
 * prefers-reduced-motion: reduce (ui-revise5 5).
 */
export const linkText =
  "bg-linear-to-r from-current to-current bg-size-[0%_1px] bg-position-[0_100%] bg-no-repeat transition-[background-size] duration-200 ease-out motion-reduce:transition-none";
/** The underline of an action's text: on the action's own hover. */
export const actionText = "group-hover/link:bg-size-[100%_1px]";
/**
 * The underline of the card's first link (where a click on the card goes;
 * "詳しく見る" on the cards that open their details): on the card's hover
 * too, but not while the pointer is on another of the card's links
 * (ui-revise5 11).
 */
export const primaryText =
  "group-hover:bg-size-[100%_1px] group-has-[[data-work-action=secondary]:hover]:bg-size-[0%_1px]";

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

/**
 * The large card's surface and hover (ui-revise5, design 4 of the mock in
 * light gray): a light gray surface (gray-50, so that the links and
 * SPOTLIGHT keep a 4.5:1 contrast) that is one step darker on hover and on
 * keyboard focus on the title (gray-100, the other cards' hover); in dark
 * mode one step lighter than the page, and lighter again on hover. The same
 * transition as the other cards.
 */
export const featuredSurface =
  "bg-gray-50 transition-colors hover:bg-gray-100 has-[h3_:focus-visible]:bg-gray-100 dark:bg-atom-one-dark-light dark:hover:bg-atom-one-dark-lighter dark:has-[h3_:focus-visible]:bg-atom-one-dark-lighter";
