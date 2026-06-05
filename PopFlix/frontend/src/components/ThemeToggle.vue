<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Sun, Moon } from 'lucide-vue-next';
import { applyModeContrastThemePreference } from '../utils/appPreferences';

const isDark = ref(false);
let themeObserver = null;

const syncThemeState = () => {
  isDark.value =
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark';
};

const toggleTheme = () => {
  const nextMode = isDark.value ? 'light' : 'dark';
  applyModeContrastThemePreference(nextMode);
  syncThemeState();
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    applyModeContrastThemePreference('dark');
  }

  syncThemeState();

  themeObserver = new MutationObserver(() => {
    syncThemeState();
  });

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
  <button 
    @click="toggleTheme" 
    class="theme-toggler"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <transition name="fade" mode="out-in">
      <component 
        :is="isDark ? Moon : Sun" 
        :key="isDark ? 'moon' : 'sun'" 
        size="24" class="icon"
      />
    </transition>
  </button>
</template>

<style scoped>
.theme-toggler {
  cursor: pointer;
  border: none;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, opacity 0.2s;
  border-radius: 50%;
  background: var(--glass-btn);
}
.icon{
  color:var(--topbar-link);
}

.icon:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: #ff5252;
}

.theme-toggler:active {
  transform: rotate(180deg);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
