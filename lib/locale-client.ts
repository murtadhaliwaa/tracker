export const LOCALE_STORAGE_KEY = "preferred-locale";

export function persistLocaleToStorage(locale: string) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore storage errors
  }
}
