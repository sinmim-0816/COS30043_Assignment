const FONT_SIZE_KEY = 'app_font_size';
const FONT_SIZES = ['small', 'medium', 'large'];
const DEFAULT_FONT_SIZE = 'medium';
const CONTRAST_THEME_KEY = 'app_contrast_theme';

export const CONTRAST_THEMES = [
  {
    value: 'desert',
    mode: 'light',
    swatches: ['#faf7f2', '#ffffff', '#041435', '#ff5252'],
  },
  {
    value: 'alpine',
    mode: 'light',
    swatches: ['#f6fbff', '#ffffff', '#0f2a43', '#2563eb'],
  },
  {
    value: 'navy',
    mode: 'dark',
    swatches: ['#0a0e17', '#121826', '#ffffff', '#ff4d4d'],
  },
  {
    value: 'dusk',
    mode: 'dark',
    swatches: ['#1e2430', '#2d3442', '#f8fafc', '#74d3ae'],
  },
  {
    value: 'night-sky',
    mode: 'dark',
    swatches: ['#020617', '#111827', '#f8fafc', '#a78bfa'],
  },
];
const DEFAULT_CONTRAST_THEME = 'desert';
const DEFAULT_LIGHT_CONTRAST_THEME = 'desert';
const DEFAULT_DARK_CONTRAST_THEME = 'navy';

const isValidFontSize = (value) => FONT_SIZES.includes(value);
const isValidContrastTheme = (value) => CONTRAST_THEMES.some((theme) => theme.value === value);

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

export const readStoredContrastTheme = () => {
  if (typeof window === 'undefined') return DEFAULT_CONTRAST_THEME;

  const stored = localStorage.getItem(CONTRAST_THEME_KEY);
  return isValidContrastTheme(stored) ? stored : DEFAULT_CONTRAST_THEME;
};

export const applyContrastThemePreference = (value = DEFAULT_CONTRAST_THEME) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return DEFAULT_CONTRAST_THEME;
  }

  const normalized = isValidContrastTheme(value) ? value : DEFAULT_CONTRAST_THEME;
  const option = CONTRAST_THEMES.find((theme) => theme.value === normalized);
  const shouldUseDarkMode = option?.mode === 'dark';

  document.documentElement.dataset.contrastTheme = normalized;
  document.documentElement.classList.toggle('dark', shouldUseDarkMode);
  localStorage.setItem(CONTRAST_THEME_KEY, normalized);
  localStorage.setItem('theme', shouldUseDarkMode ? 'dark' : 'light');

  return normalized;
};

export const applyModeContrastThemePreference = (mode = 'light') => {
  const normalizedMode = mode === 'dark' ? 'dark' : 'light';
  return applyContrastThemePreference(
    normalizedMode === 'dark' ? DEFAULT_DARK_CONTRAST_THEME : DEFAULT_LIGHT_CONTRAST_THEME,
  );
};

export const initContrastThemePreference = () => {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return DEFAULT_CONTRAST_THEME;
  }

  const stored = readStoredContrastTheme();
  const savedMode = localStorage.getItem('theme');

  document.documentElement.dataset.contrastTheme = stored;

  if (!savedMode) {
    applyContrastThemePreference(stored);
  }

  return stored;
};
