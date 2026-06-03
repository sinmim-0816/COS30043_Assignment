<script setup>
import TopBar from '@/components/TopBar.vue';
import BackToTop from './components/BackToTop.vue';
import { useAppI18n } from '@/utils/i18n';
import { watch } from 'vue';

// Ensure locale is properly synced
const { locale } = useAppI18n();

// Watch for locale changes and sync with document
watch(locale, (newLocale) => {
  if (typeof document !== 'undefined') {
    const htmlLocale = newLocale === 'zh' ? 'zh-CN' : newLocale === 'ms' ? 'ms-MY' : 'en';
    document.documentElement.lang = htmlLocale;
  }
});
</script>

<template>
    <v-app>
        <TopBar />
        <router-view />
        <BackToTop/>
    </v-app>
</template>

<style scoped>
*{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

}
</style>
