const FONT_SIZE_KEY = 'app_font_size';
const FONT_SIZES = ['small', 'medium', 'large'];
const DEFAULT_FONT_SIZE = 'medium';

const isValidFontSize = (value) => FONT_SIZES.includes(value);

export const readStoredFontSize = () => {
  if (typeof window === 'undefined') return DEFAULT_FONT_SIZE;

  const stored = localStorage.getItem(FONT_SIZE_KEY);
  return isValidFontSize(stored) ? stored : DEFAULT_FONT_SIZE;
};

export const applyFontSizePreference = (value = DEFAULT_FONT_SIZE) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return DEFAULT_FONT_SIZE;

  const normalized = isValidFontSize(value) ? value : DEFAULT_FONT_SIZE;
  document.documentElement.dataset.fontSize = normalized;
  localStorage.setItem(FONT_SIZE_KEY, normalized);
  return normalized;
};

export const initFontSizePreference = () => applyFontSizePreference(readStoredFontSize());

