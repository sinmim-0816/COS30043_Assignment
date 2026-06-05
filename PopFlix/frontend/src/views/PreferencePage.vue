<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Check, Languages, Moon, Palette, Settings, Sun, Type } from '@lucide/vue';
import FooterView from '@/components/FooterView.vue';
import {
  applyContrastThemePreference,
  applyFontSizePreference,
  CONTRAST_THEMES,
  readStoredContrastTheme,
  readStoredFontSize,
} from '../utils/appPreferences';
import { useAppI18n } from '../utils/i18n';

const { locale, t, setLocale, getLocaleLabel, supportedLocales } = useAppI18n();
const selectedFontSize = ref(readStoredFontSize());
const selectedContrastTheme = ref(readStoredContrastTheme());
const isDarkTheme = ref(false);
let themeObserver = null;

const fontSizeOptions = [
  { value: 'small', label: 'Small', preview: 'Aa' },
  { value: 'medium', label: 'Medium', preview: 'Aa' },
  { value: 'large', label: 'Large', preview: 'Aa' },
];

const languageOptions = computed(() =>
  supportedLocales.map((value) => ({
    value,
    label: getLocaleLabel(value),
  })),
);

const contrastThemeOptions = computed(() =>
  CONTRAST_THEMES.map((theme) => ({
    ...theme,
    label: t(`profile.contrastThemeOptions.${theme.value}`),
  })),
);

const syncThemeState = () => {
  isDarkTheme.value =
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark';
  selectedContrastTheme.value = readStoredContrastTheme();
};

const setFontSize = (size) => {
  selectedFontSize.value = size;
};

const setLanguage = (value) => {
  setLocale(value);
};

const setContrastTheme = (value) => {
  selectedContrastTheme.value = applyContrastThemePreference(value);
  syncThemeState();
};

watch(
  selectedFontSize,
  (newValue) => {
    applyFontSizePreference(newValue);
  },
  { immediate: true },
);

onMounted(() => {
  syncThemeState();
  themeObserver = new MutationObserver(syncThemeState);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-contrast-theme'],
  });
});

onUnmounted(() => {
  themeObserver?.disconnect();
});
</script>

<template>
  <v-app>
    <main :class="['preferences-page', isDarkTheme ? 'theme-dark' : 'theme-light']">
      <section class="preferences-hero">
        <div class="preferences-eyebrow">
          <Settings size="18" />
          <span>{{ t('topbar.preferences') }}</span>
        </div>

        <div class="preferences-hero-content">
          <div>
            <h1>{{ t('profile.displaySettings') }}</h1>
            <p>{{ t('profile.contrastThemeDescription') }}</p>
          </div>

          <div class="preferences-mode-pill">
            <component :is="isDarkTheme ? Moon : Sun" size="18" />
            <span>{{ isDarkTheme ? t('profile.contrastThemeOptions.navy') : t('profile.contrastThemeOptions.desert') }}</span>
          </div>
        </div>
      </section>

      <section class="preferences-layout">
        <article class="preference-panel">
          <div class="panel-heading">
            <span class="panel-icon"><Type size="20" /></span>
            <div>
              <h2>{{ t('profile.displaySettings') }}</h2>
              <p>{{ t('profile.textSizeDescription') }}</p>
            </div>
          </div>

          <div class="option-grid">
            <button
              v-for="option in fontSizeOptions"
              :key="option.value"
              type="button"
              class="preference-option"
              :class="{ active: selectedFontSize === option.value }"
              @click="setFontSize(option.value)"
            >
              <div>
                <span class="option-label">{{ option.label }}</span>
                <strong>{{ option.preview }}</strong>
              </div>
              <Check v-if="selectedFontSize === option.value" size="18" />
            </button>
          </div>
        </article>

        <article class="preference-panel">
          <div class="panel-heading">
            <span class="panel-icon"><Languages size="20" /></span>
            <div>
              <h2>{{ t('profile.appLanguage') }}</h2>
              <p>{{ t('profile.languageDescription') }}</p>
            </div>
          </div>

          <div class="option-grid">
            <button
              v-for="option in languageOptions"
              :key="option.value"
              type="button"
              class="preference-option"
              :class="{ active: locale === option.value }"
              @click="setLanguage(option.value)"
            >
              <div>
                <span class="option-label">{{ option.label }}</span>
                <strong>{{ option.value.toUpperCase() }}</strong>
              </div>
              <Check v-if="locale === option.value" size="18" />
            </button>
          </div>
        </article>

        <article class="preference-panel preference-panel-wide">
          <div class="panel-heading">
            <span class="panel-icon"><Palette size="20" /></span>
            <div>
              <h2>{{ t('profile.contrastTheme') }}</h2>
              <p>{{ t('profile.contrastThemeDescription') }}</p>
            </div>
          </div>

          <div class="contrast-theme-grid">
            <button
              v-for="option in contrastThemeOptions"
              :key="option.value"
              type="button"
              class="contrast-theme-option"
              :class="{ active: selectedContrastTheme === option.value }"
              @click="setContrastTheme(option.value)"
            >
              <div class="contrast-theme-preview" :data-preview-theme="option.value">
                <span class="preview-aa">Aa</span>
                <span class="preview-lines">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
                <span class="preview-mini-card"></span>
                <span class="preview-swatches">
                  <i
                    v-for="swatch in option.swatches"
                    :key="swatch"
                    :style="{ background: swatch }"
                  ></i>
                </span>
              </div>

              <div class="contrast-theme-meta">
                <span>{{ option.label }}</span>
                <Check v-if="selectedContrastTheme === option.value" size="18" />
              </div>
            </button>
          </div>
        </article>
      </section>
    </main>

    <FooterView />
  </v-app>
</template>

<style scoped>
.preferences-page {
  min-height: 100vh;
  padding: 112px clamp(18px, 5vw, 72px) 64px;
  background:
    radial-gradient(circle at 15% 12%, rgba(255, 82, 82, 0.16), transparent 28%),
    radial-gradient(circle at 86% 10%, rgba(70, 130, 180, 0.16), transparent 30%),
    var(--bg-color);
  color: var(--text-color);
}

.preferences-hero {
  max-width: 1120px;
  margin: 0 auto 28px;
  padding: clamp(22px, 4vw, 36px);
  border: 1px solid var(--border-color);
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.58)),
    var(--hero-gradient);
  box-shadow: 0 24px 55px rgba(15, 23, 42, 0.09);
}

.preferences-eyebrow,
.preferences-mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  font-weight: 800;
}

.preferences-eyebrow {
  padding: 8px 12px;
  background: rgba(255, 82, 82, 0.12);
  color: #d92d2d;
  margin-bottom: 18px;
}

.preferences-hero-content {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 22px;
}

.preferences-hero h1 {
  margin: 0;
  color: var(--header-color);
  font-size: clamp(2rem, 5vw, 4.4rem);
  font-weight: 950;
  letter-spacing: -0.06em;
}

.preferences-hero p {
  max-width: 650px;
  margin: 12px 0 0;
  color: var(--muted-text-color);
  line-height: 1.7;
}

.preferences-mode-pill {
  flex: 0 0 auto;
  padding: 10px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.preferences-layout {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.preference-panel {
  padding: clamp(20px, 3vw, 28px);
  border: 1px solid var(--border-color);
  border-radius: 26px;
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.preference-panel-wide {
  grid-column: 1 / -1;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
}

.panel-icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(255, 82, 82, 0.12);
  color: #ff5252;
}

.panel-heading h2 {
  margin: 0;
  color: var(--header-color);
  font-size: 1.18rem;
  font-weight: 900;
}

.panel-heading p {
  margin: 5px 0 0;
  color: var(--muted-text-color);
  line-height: 1.55;
  font-size: 0.92rem;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.preference-option,
.contrast-theme-option {
  width: 100%;
  border: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--card-bg) 94%, transparent);
  color: var(--text-color);
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.preference-option {
  min-height: 92px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-radius: 20px;
}

.preference-option:hover,
.contrast-theme-option:hover {
  transform: translateY(-2px);
}

.preference-option.active,
.contrast-theme-option.active {
  border-color: #ff5252;
  box-shadow: 0 14px 26px rgba(255, 82, 82, 0.14);
}

.option-label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted-text-color);
  font-size: 0.82rem;
  font-weight: 700;
}

.preference-option strong {
  color: var(--header-color);
  font-size: 1.35rem;
  line-height: 1;
}

.contrast-theme-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.contrast-theme-option {
  padding: 10px;
  border-radius: 20px;
}

.contrast-theme-preview {
  position: relative;
  min-height: 106px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 14px;
  overflow: hidden;
  padding: 14px;
}

.contrast-theme-preview[data-preview-theme="desert"] {
  background: #faf7f2;
  color: #041435;
}

.contrast-theme-preview[data-preview-theme="alpine"] {
  background: #f6fbff;
  color: #0f2a43;
}

.contrast-theme-preview[data-preview-theme="navy"] {
  background: #0a0e17;
  color: #ffffff;
}

.contrast-theme-preview[data-preview-theme="dusk"] {
  background: #1e2430;
  color: #f8fafc;
}

.contrast-theme-preview[data-preview-theme="night-sky"] {
  background: #020617;
  color: #f8fafc;
}

.preview-aa {
  font-size: 2rem;
  font-weight: 950;
  line-height: 1;
}

.preview-lines {
  position: absolute;
  top: 18px;
  right: 16px;
  width: 42px;
  display: grid;
  gap: 5px;
}

.preview-lines i {
  height: 3px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.7;
}

.preview-mini-card {
  position: absolute;
  right: 14px;
  bottom: 14px;
  width: 42px;
  height: 26px;
  border: 1px solid currentColor;
  border-radius: 5px;
  opacity: 0.72;
}

.preview-swatches {
  position: absolute;
  left: 14px;
  bottom: 14px;
  display: flex;
  gap: 5px;
}

.preview-swatches i {
  width: 8px;
  height: 8px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 50%;
}

.contrast-theme-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  color: var(--header-color);
  font-size: 0.86rem;
  font-weight: 800;
}

.theme-dark .preferences-hero {
  background:
    linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(10, 14, 23, 0.72)),
    var(--hero-gradient);
  box-shadow: 0 24px 55px rgba(0, 0, 0, 0.22);
}

.theme-dark .preference-panel {
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
}

@media (max-width: 980px) {
  .preferences-layout,
  .contrast-theme-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .preferences-hero-content {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .preferences-page {
    padding: 92px 14px 42px;
  }

  .preferences-hero,
  .preference-panel {
    border-radius: 22px;
  }

  .option-grid,
  .contrast-theme-grid {
    grid-template-columns: 1fr;
  }

  .preference-option {
    min-height: 78px;
  }
}
</style>
