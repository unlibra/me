/** `localStorage` key holding the theme preference. */
export const themeStorageKey = "theme";

export const themePreferences = ["light", "dark", "system"] as const;

export type ThemePreference = (typeof themePreferences)[number];
