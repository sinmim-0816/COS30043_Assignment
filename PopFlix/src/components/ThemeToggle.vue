<script setup>
import { ref, onMounted } from 'vue';
import { Sun, Moon } from 'lucide-vue-next';

// State to track current theme
const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }
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