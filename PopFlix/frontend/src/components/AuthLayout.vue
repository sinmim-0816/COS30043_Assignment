<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { Globe } from 'lucide-vue-next';
import { useAppI18n } from '@/utils/i18n';

import img1 from '@/assets/login.jpg';
import img2 from '@/assets/login2.jpg';
import img3 from '@/assets/login3.jpg';
import img4 from '@/assets/login4.jpg';

const { t, locale, setLocale, getLocaleLabel, supportedLocales } = useAppI18n();
const activeIndex = ref(0);
let interval = null;

const carouselBrand = 'WATCHER';
const slides = computed(() => [
  { image: img1, text: t('auth.carouselSlide1') },
  { image: img2, text: t('auth.carouselSlide2') },
  { image: img3, text: t('auth.carouselSlide3') },
  { image: img4, text: t('auth.carouselSlide4') },
]);
const carouselTitleHtml = computed(() =>
  t('auth.carouselTitle', { brand: carouselBrand }).replace(
    carouselBrand,
    `<span class="text-red-accent-3">${carouselBrand}</span>`
  )
);
const currentLanguageLabel = computed(() => getLocaleLabel(locale.value));
const languageOptions = computed(() =>
  supportedLocales.map((value) => ({
    value,
    label: getLocaleLabel(value),
  }))
);

const changeLanguage = (value) => {
  setLocale(value);
};

onMounted(() => {
  interval = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % slides.value.length;
  }, 5000);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<template>
  <v-container fluid class="fill-height pa-0 auth-layout-container" width="100vw">
    <div class="auth-language-switcher">
      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="tonal" color="red-accent-3" class="language-toggle-btn">
            <Globe size="16" />
            <span>{{ currentLanguageLabel }}</span>
          </v-btn>
        </template>
        <v-list class="language-menu">
          <v-list-item
            v-for="option in languageOptions"
            :key="option.value"
            :active="option.value === locale"
            @click="changeLanguage(option.value)"
          >
            <v-list-item-title>{{ option.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <v-row no-gutters class="fill-height">
      <v-col cols="12" md="6" class="relative overflow-hidden d-none d-md-block sidebar-col">
        <div class="carousel-container">
          <transition name="fade" mode="out-in">
            <div :key="activeIndex" class="slide-content">
              <v-img :src="slides[activeIndex].image" cover class="fill-height cinematic-img" />

              <div class="cinematic-overlay"></div>

              <div class="hover-overlay d-flex flex-column justify-end pa-12">
                <div class="indicator-wrapper">
                  <div
                    v-for="(_, idx) in slides"
                    :key="idx"
                    class="indicator-bar"
                    :class="{ active: idx === activeIndex }"
                  ></div>
                </div>
                <h3 class="fs-2 text-white fw-bold mb-4" v-html="carouselTitleHtml"></h3>
                <p class="text-white font-weight-light description-text">
                  {{ slides[activeIndex].text }}
                </p>
              </div>
            </div>
          </transition>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="d-flex align-center justify-center bg-form-dark">
        <slot />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.auth-layout-container {
  height: 100%;
  background-color: var(--bg-color);
  position: relative;
}

.carousel-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.slide-content {
  position: absolute;
  inset: 0;
  margin: 20px;
  max-width: 60vw;
  background-color: var(--bg-color);
  overflow: hidden;
  border-radius: 20px;
}

.slide-content .v-img {
  border-radius: 20px;
}

.indicator-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.indicator-bar {
  width: 30px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  transition: background 0.3s ease;
}

.indicator-bar.active {
  background: #ffffff;
}

.cinematic-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(circle at 70% 30%, rgba(255, 77, 77, 0.15), transparent 50%);
  animation: moveGradient 15s ease infinite alternate;
  pointer-events: none;
}

.hover-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(to top, rgba(5, 5, 7, 0.95) 10%, rgba(5, 5, 7, 0) 60%);
}

@keyframes moveGradient {
  0% {
    transform: scale(1) translate(0, 0);
  }

  50% {
    transform: scale(1.2) translate(-50px, -50px);
  }

  100% {
    transform: scale(1) translate(0, 0);
  }
}

.bg-form-dark {
  background-color: var(--bg-color);
}

.cinematic-img {
  transition: none !important;
}

.auth-language-switcher {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.language-toggle-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  border-radius: 999px;
  min-width: 0;
  padding-inline: 14px;
}

.language-toggle-btn span {
  margin-left: 6px;
}

.language-menu {
  min-width: 170px;
}

@media (max-width: 600px) {
  .auth-language-switcher {
    top: 12px;
    right: 12px;
  }

  .language-toggle-btn {
    padding-inline: 12px;
  }
}
</style>
