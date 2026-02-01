// Internationalization helper using the browser's chrome.i18n API.
// Automatically uses browser's UI language with fallback to English.

// Get a localized message by key.
export function t(key: string, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

// Get the browser's UI language (e.g., "en", "nl", "de").
export function getUILanguage(): string {
  return chrome.i18n.getUILanguage();
}
