/**
 * Hover and keyboard focus lift a card a little and give it a shadow, so
 * that it reads as something to click (the details open in a dialog).
 */
export const liftOnHover =
  "transition duration-200 hover:shadow-md has-[button:focus-visible]:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:has-[button:focus-visible]:-translate-y-0.5 motion-reduce:transition-none";

/** The VR & 3D subcategory label. */
export const subcategoryChip =
  "w-fit rounded-full bg-logo-accent/15 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:text-orange-200";
