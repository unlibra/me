/**
 * Serializes structured data for a `<script type="application/ld+json">`.
 * `<` is escaped so that a value can never close the script element.
 */
export const serializeJsonLd = (data: Record<string, unknown>): string =>
  JSON.stringify(data).replace(/</g, "\\u003c");
