/**
 * A text with its `{name}` placeholders replaced with the values. Throws if
 * the text has a placeholder that is not given, so that a missing value is
 * not shown as "{name}".
 */
export function formatMessage(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    if (!Object.hasOwn(values, name)) {
      throw new Error(`No value for {${name}} in "${template}"`);
    }
    return String(values[name]);
  });
}
