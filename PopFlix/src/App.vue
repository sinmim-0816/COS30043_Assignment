<script setup>
import TopBar from '@/components/TopBar.vue';
import FooterView from '@/components/FooterView.vue';
</script>

<template>
    <TopBar />
    <router-view />
    
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
