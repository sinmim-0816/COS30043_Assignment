<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const showBackToTop = ref(false);

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 600;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <transition name="fade-scale">
    <button 
      v-show="showBackToTop" 
      @click="scrollToTop" 
      class="back-to-top-fab"
      aria-label="Scroll back to top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="arrow-icon">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  </transition>
</template>

<style scoped>
.back-to-top-fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #74adf7;
  color: #ffffff;
  border: none;
  box-shadow: 0 4px 16px rgba(75, 157, 245, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.back-to-top-fab:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 22px  rgba(75, 157, 245, 0.25);
}

.back-to-top-fab:active {
  transform: translateY(-1px);
}

.arrow-icon {
  width: 18px;
  height: 18px;
  /* Ensures crisp rendering of the thin chevron path */
  stroke-width: 3.5; 
}

/* Global Transition Animations */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.6) translateY(10px);
}

@media (max-width: 768px) {
  .back-to-top-fab {
    bottom: 24px;
    right: 24px;
    width: 44px;
    height: 44px;
  }
}
</style>