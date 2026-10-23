// Theme switching after the first paint. The inline script in BaseLayout
// applies the stored preference before the first paint with the same rules.
import {
  themePreferences,
  themeStorageKey,
  type ThemePreference,
} from "@/config/theme";

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

const isPreference = (value: unknown): value is ThemePreference =>
  themePreferences.includes(value as ThemePreference);

/** The stored preference; "system" when none is stored or storage fails. */
export function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(themeStorageKey);
    return isPreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

/** Saves the preference. Returns false when storage is unavailable. */
export function savePreference(preference: ThemePreference): boolean {
  try {
    localStorage.setItem(themeStorageKey, preference);
    return true;
  } catch {
    return false;
  }
}

export function applyPreference(preference: ThemePreference): void {
  const dark =
    preference === "dark" || (preference === "system" && systemDark.matches);
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * Keeps the page in sync with the current preference: follows the OS
 * setting while it is "system", and choices made in other tabs.
 */
export function watchPreference(
  current: () => ThemePreference,
  onExternalChange: (preference: ThemePreference) => void,
): void {
  systemDark.addEventListener("change", () => applyPreference(current()));
  window.addEventListener("storage", (event) => {
    if (event.key !== themeStorageKey) return;
    onExternalChange(isPreference(event.newValue) ? event.newValue : "system");
  });
}
