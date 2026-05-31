<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Import your 4 images here
import img1 from '@/assets/login.jpg';
import img2 from '@/assets/login2.jpg';
import img3 from '@/assets/login3.jpg';
import img4 from '@/assets/login4.jpg';

const activeIndex = ref(0);
let interval = null;

const slides = [
    { image: img1, text: 'Book premium seats, discover blockbuster premieres, and experience cinema the way it was meant to be.' },
    { image: img2, text: 'Experience the excitement of movies the way they’re meant to be—filled with laughter, thrills, and unforgettable moments shared with others.' },
    { image: img3, text: 'Discover cinema on the grandest scale with IMAX—unparalleled clarity, immersive audio, and a screen that surrounds your senses.' },
    { image: img4, text: 'Elevate your night at the movies with LUXURIES—premium seats, elegant design, and an atmosphere crafted for relaxation and style.' },
];

onMounted(() => {
    interval = setInterval(() => {
        activeIndex.value = (activeIndex.value + 1) % slides.length;
    }, 5000);
});

onUnmounted(() => {
    clearInterval(interval);
});
</script>

<template>
    <v-container fluid class="fill-height pa-0 auth-layout-container" width="100vw">
        <v-row no-gutters class="fill-height">
            <v-col cols="12" md="6" class="relative overflow-hidden d-none d-md-block sidebar-col">
                <div class="carousel-container">
                    <transition name="fade" mode="out-in">
                        <div :key="activeIndex" class="slide-content">
                            <v-img :src="slides[activeIndex].image" cover class="fill-height cinematic-img" />

                            <div class="cinematic-overlay"></div>

                            <div class="hover-overlay d-flex flex-column justify-end pa-12">
                                <div class="indicator-wrapper">
                                    <div v-for="(_, idx) in slides" :key="idx" class="indicator-bar"
                                        :class="{ 'active': idx === activeIndex }"></div>
                                </div>
                                <h3 class="fs-2 text-white fw-bold mb-4">The World of <span
                                        class="text-red-accent-3">WATCHER</span>
                                </h3>
                                <p class="text-white font-weight-light description-text">{{ slides[activeIndex].text }}</p>
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
    border-radius:20px;
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
</style>