<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { MasonryWall } from '@yeger/vue-masonry-wall';
import { Star, Tag, ClockFading, MessageCircle, BellRing, BadgeInfo, Info, ChevronUp, ChevronDown } from '@lucide/vue';
import { useRouter, useRoute } from 'vue-router';

// Import other components, hook
import { useMovies } from '@/hook/useMovies';
import { useExperience } from '@/hook/useExperience';
import { getGenreName } from '@/utils/genre';
import FilterSideBar from '@/components/FilterSideBar.vue';
import { EXPERIENCE_NAMES, getExperienceStyle, getExpButtonStyle } from '@/utils/experience';
import { useShowtimes } from '@/hook/useShowtimes';
import { addDays } from 'date-fns';
import FooterView from '@/components/FooterView.vue';

const { featuredMovies = featuredMovies, getImageURL = getImageURL, getLanguageName = getLanguageName, getCertificate = getCertificate, fetchHeroMovies, comingSoonMovies, fetchComingSoonMovies } = useMovies();
const { items: experiences, loading, loadExperiences } = useExperience();
const { cinemas, allSessions, loadInitialData, fetchAllShowtimes } = useShowtimes();
const router = useRouter();
const route = useRoute();

const activeExp = ref('All');
const activeSchedule = ref('Now Showing');
const showModal = ref(false);
const currentIndex = ref(0);
const showFilterDrawer = ref(false);

const findSessionForMovie = (movieId) => {
    const now = new Date();
    const futureSessions = allSessions.value
        .filter((s) =>
            String(s.movie_id || s.movieId) === String(movieId) &&
            new Date(s.start_time) > now
        )
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    return futureSessions[0] || null;
};

const ensureShowtimesLoadedForMovie = async (movieId) => {
    let matched = findSessionForMovie(movieId);
    if (matched) {
        return matched;
    }

    if (!cinemas.value.length) {
        await loadInitialData();
    }

    const searchDays = 8;
    for (let dayOffset = 0; dayOffset < searchDays; dayOffset++) {
        const targetDate = addDays(new Date(), dayOffset);
        for (const cinema of cinemas.value) {
            await fetchAllShowtimes(cinema.id, targetDate);
            matched = findSessionForMovie(movieId);
            if (matched) {
                return matched;
            }
        }
    }

    return null;
};

const handleBuyNowRedirect = async (movie) => {
    if (!movie) return;

    const matchedSession = await ensureShowtimesLoadedForMovie(movie.id);
    const dynamicShowtimeId = matchedSession?.id
        || (movie.showtimes && movie.showtimes.length > 0 ? movie.showtimes[0].id : null);

    if (!dynamicShowtimeId) {
        gotoMovieDetails(movie.id);
        return;
    }
    router.push({
        name: 'TicketBooking',
        params: {
            movieId: movie.id,
            showtimeId: dynamicShowtimeId
        },
        query: {
            exp: matchedSession?.experience?.exp_key || movie?.experiences?.[0] || 'DOLBY'
        },
    });
};

const sidebarFilters = ref({
    genre: [],
    language: [],
    rating: [],
    ratingRange: [0, 10],
    sortBy: 'default',
});

const gotoMovieDetails = (movieId) => {
    router.push({
        name: 'MovieDetails',
        params: { id: movieId },
    });
}

const handleApplyFilters = (newFilters) => {
    sidebarFilters.value = newFilters;
};

const setPageScrollLocked = (locked) => {
    if (typeof document === 'undefined') return;

    document.body.style.overflow = locked ? 'hidden' : '';
    document.documentElement.style.overflow = locked ? 'hidden' : '';
    document.body.style.width = locked ? '100%' : '';
};

const openExperienceModal = async (expKey) => {
    showModal.value = true;
    await loadExperiences(expKey);
    currentIndex.value = 0;
};

const getDisplayExperience = (movie) => {
    if (!movie.experiences || movie.experiences.length === 0) {
        return null;
    }

    let expKey = movie.experiences[0];
    if (activeExp.value !== "All") {
        const found = movie.experiences.find(e => e === activeExp.value);
        if (found) expKey = found;
    }

    const style = getExperienceStyle(expKey);

    return {
        name: expKey,
        color: style.color,
        textColor: style.textColor
    };
};

const getTabClass = (tabName) => {
    if (activeSchedule.value === tabName) {
        return 'text-red-accent-3 fs-5';
    }

    return 'theme-tab-inactive';
};

const finalFilteredMovies = computed(() => {
    const now = new Date();

    const sourceMovies = activeSchedule.value === "Coming Soon"
        ? comingSoonMovies.value
        : featuredMovies.value;

    let filtered = sourceMovies.filter(movie => {
        const matchExp = activeExp.value === 'All' ||
            movie.experiences?.some(e => e.toUpperCase() === activeExp.value.toUpperCase());

        let matchSchedule = false;
        const releaseDate = new Date(movie.release_date);

        if (activeSchedule.value === "Now Showing") {
            matchSchedule = releaseDate <= now;
        } else if (activeSchedule.value === "Kids") {
            const isKids = movie.genres.includes('16') || movie.genres.includes('10751');
            matchSchedule = isKids && releaseDate <= now;
        } else if (activeSchedule.value === "Coming Soon") {
            matchSchedule = releaseDate > now;
        }

        const matchGenre = !sidebarFilters.value.genre?.length ||
            sidebarFilters.value.genre.some(id => movie.genres.includes(String(id)));

        const matchLang = !sidebarFilters.value.language?.length ||
            sidebarFilters.value.language.includes(movie.language);

        const movieCert = getCertificate(movie);
        const matchCert = !sidebarFilters.value.rating?.length ||
            sidebarFilters.value.rating.includes(movieCert);

        const [minRange, maxRange] = sidebarFilters.value.ratingRange || [0, 10];
        const matchStars = movie.vote_average >= minRange && movie.vote_average <= maxRange;

        return matchExp && matchSchedule && matchGenre && matchLang && matchCert && matchStars;
    });

    const sortType = sidebarFilters.value.sortBy;
    if (sortType === 'latest') {
        filtered.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    } else if (sortType === 'rating') {
        filtered.sort((a, b) => b.vote_average - a.vote_average);
    } else if (sortType === 'popularity') {
        filtered.sort((a, b) => b.popularity - a.popularity);
    }

    return filtered;
});

const activeFilterPills = computed(() => {
    const pills = [];
    const filters = sidebarFilters.value;

    if (filters.genre?.length) {
        filters.genre.forEach(id => pills.push({ type: 'genre', id, label: getGenreName(id) }));
    }
    if (filters.language?.length) {
        filters.language.forEach(lang => pills.push({ type: 'language', id: lang, label: getLanguageName(lang) }));
    }
    if (filters.rating?.length) {
        filters.rating.forEach(r => pills.push({ type: 'rating', id: r, label: r }));
    }
    if (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10) {
        pills.push({
            type: 'range',
            id: filters.ratingRange,
            label: `${filters.ratingRange[0]}-${filters.ratingRange[1]} Stars`
        });
    }
    return pills;
});

const removePill = (pill) => {
    if (pill.type === 'genre') {
        sidebarFilters.value.genre = sidebarFilters.value.genre.filter(id => id !== pill.id);
    } else if (pill.type === 'language') {
        sidebarFilters.value.language = sidebarFilters.value.language.filter(l => l !== pill.id);
    } else if (pill.type === 'rating') {
        sidebarFilters.value.rating = sidebarFilters.value.rating.filter(r => r !== pill.id);
    } else if (pill.type === 'range') {
        sidebarFilters.value.ratingRange = [0, 10];
    }
};

onMounted(async () => {
    if (featuredMovies.value.length === 0) {
        await fetchHeroMovies();
    }
    if (comingSoonMovies.value.length === 0) {
        await fetchComingSoonMovies();
    }
    if (route.query.exp) {
        const passedExp = String(route.query.exp).toUpperCase();
        
        if (EXPERIENCE_NAMES.includes(passedExp)) {
            activeExp.value = passedExp;
        }
    }
})

watch(showFilterDrawer, (open) => {
    setPageScrollLocked(open);
}, { immediate: true });

onBeforeUnmount(() => {
    setPageScrollLocked(false);
});

</script>

<template >
    <template v-if="featuredMovies.length === 0 && comingSoonMovies.length === 0">
        <div class="loading-wrapper">
            <div class="loader-content">
                <v-progress-circular indeterminate color="red-accent-3" size="70" width="4">
                    <v-icon icon="mdi-movie-roll" size="24"></v-icon>
                </v-progress-circular>

                <p class="mt-6 loading-text">Loading...</p>
                <div class="loading-bar"></div>
            </div>
        </div>
    </template>
    <v-app v-else>
    <v-layout>
        <v-container fluid class="container-fluid">
            <h2>Explore Big Screens</h2>
            <v-row class="ms-5">
                <div class="d-flex flex-wrap gap-3 mx-auto mt-5 align-center">
                    <v-btn rounded="pill" :variant="activeExp === 'All' ? 'flat' : 'outlined'"
                        :color="activeExp === 'All' ? 'white' : 'grey-lighten-1'" @click="activeExp = 'All'"
                        class="experience-font all-btn">
                        ALL
                    </v-btn>

                    <v-btn v-for="name in EXPERIENCE_NAMES" :key="name" class="experience-font exp-btn" rounded="pill"
                        :variant="activeExp == name ? 'flat' : 'outlined'"
                        :color="activeExp == name ? getExperienceStyle(name).color : 'grey-lighten-1'"
                        @click="activeExp = name"
                        :class="activeExp === name ? `exp-text-${getExperienceStyle(name).textColor}` : ''"
                        :style="getExpButtonStyle(name)">
                        {{ name }}
                        <v-fade-transition>
                            <v-btn v-show="activeExp == name" variant="plain" min-width="0" width="auto" height="auto"
                                :ripple="false" class="p-0 ms-2 m-0" @click="openExperienceModal(name)">
                                <Info size="20" />
                            </v-btn>
                        </v-fade-transition>
                    </v-btn>
                </div>
                <v-col cols="10">
                    <v-tabs v-model="activeSchedule" bg-color="transparent" color="red-accent-4" align-tabs="start"
                        class="custom-tabs">
                        <v-tab v-for="tab in ['Now Showing', 'Kids', 'Coming Soon']" :key="tab" :value="tab"
                            :class="getTabClass(tab)">
                            {{ tab }}
                        </v-tab>
                    </v-tabs>
                </v-col>
                <v-col cols="2">
                    <v-btn variant="outlined" prepend-icon="mdi-filter-variant"
                        @click="showFilterDrawer = true">Filter-By</v-btn>
                    <FilterSideBar v-model="showFilterDrawer" :filters="sidebarFilters" :movies="featuredMovies"
                        @close="showFilterDrawer = false" @apply-filters="handleApplyFilters" />
                </v-col>
            </v-row>

            <v-expand-transition>
                <div v-if="activeFilterPills.length" class=" mt-2 pills mb-4 d-flex align-center flex-wrap gap-2">
                    <v-chip v-for="pill in activeFilterPills" :key="pill.type + pill.id" closable variant="outlined"
                        color="white gap-2" @click:close="removePill(pill)">
                        {{ pill.label }}
                    </v-chip>
                </div>
            </v-expand-transition>
            <div v-if="finalFilteredMovies.length === 0"
                class="d-flex flex-column align-center justify-center py-16 text-center">
                <v-icon size="64" color="grey-darken-1" class="mb-4">mdi-movie-off-outline</v-icon>
                <h3 class="text-h5 text-grey-lighten-1">No movies found</h3>
                <p class="text-grey-darken-1">Try adjusting your filters or checking a different experience.</p>
            </div>
            <div v-else class="masonry-wrapper">
                <masonry-wall :items="finalFilteredMovies" :column-width="230" :gap="30" class="mt-4">
                    <template #default="slotProps">
                        <v-hover v-slot="{ isHovering, props }">
                            <v-card v-if="slotProps && slotProps?.item && slotProps?.item?.id"
                                class="bg-transparent movie-booking-card border-0" v-bind="props"
                                :elevation="isHovering ? 12 : 0">
                                <v-img :src="getImageURL(slotProps?.item.poster)"
                                    class="rounded-lg shadow-lg position-relative" cover :aspect-ratio="2 / 3">
                                    <div>
                                        <v-chip v-if="slotProps?.item.experiences.length"
                                            :key="getDisplayExperience(slotProps.item)"
                                            :style="{ backgroundColor: getDisplayExperience(slotProps.item).color, color: getDisplayExperience(slotProps.item).textColor }"
                                            class="experience-font cinema-badge m-2">
                                            {{ getDisplayExperience(slotProps.item).name }}
                                        </v-chip>
                                        <!-- Cert Icon -->
                                        <v-img :src="'/img/universal_logo.png'"
                                            class="certification-badge position-absolute bottom-0 left-0 m-2"
                                            v-if="getCertificate(slotProps.item) === 'U'" />
                                        <v-img :src="'/img/p13_logo.png'"
                                            class="certification-badge position-absolute bottom-0 left-0 m-2"
                                            v-if="getCertificate(slotProps.item) === 'P13'" />
                                        <v-img :src="'/img/p18_logo.png'"
                                            class="certification-badge position-absolute bottom-0 left-0 m-2"
                                            v-if="getCertificate(slotProps.item) === 'P18'" />
                                    </div>
                                    <div class="card-action-overlay">
                                        <v-btn variant="flat" class="info p-0 m-2"
                                            @click="gotoMovieDetails(slotProps.item.id)">
                                            <BadgeInfo size="28" color="white" class="mb-2" />
                                            <span class="text-white ms-2 mb-2">More Info</span>
                                        </v-btn>
                                        <div class="position-absolute bottom-0 overlay-container p-3">
                                            <h3 class="text-white mb-1 fs-5">{{ slotProps.item.title }}</h3>
                                            <div class="d-flex align-center mb-1">
                                                <Star size="14" fill="#f5c518" color="#f5c518" class="me-1" />
                                                <span class="text-white text-caption">{{
                                                    slotProps.item.vote_average.toFixed(1) }}</span>
                                            </div>
                                            <div class="text-grey-lighten-2 text-caption">
                                                <Tag size="14" class="me-1" /> {{ getGenreName(slotProps.item.genres[0])
                                                }}
                                            </div>
                                            <div class="text-grey-lighten-2 text-caption">
                                                <ClockFading size="14" class="me-1" />{{ slotProps.item.runtime }}
                                            </div>
                                            <div class="text-grey-lighten-2 text-caption">
                                                <MessageCircle size="14" class="me-1" /> {{
                                                    getLanguageName(slotProps.item.language) }}
                                            </div>
                                        </div>
                                    </div>
                                </v-img>
                                <div class="btn-container">
                                    <v-btn v-if="isHovering"
                                        :color="activeSchedule === 'Coming Soon' ? 'white' : 'red-accent-3'"
                                        :variant="activeSchedule === 'Coming Soon' ? 'outlined' : 'flat'"
                                        :class="['rounded-2', activeSchedule === 'Coming Soon' ? '' : 'movie-btn', 'd-block mx-auto mt-2']"
                                        @click="activeSchedule === 'Coming Soon' ? null : handleBuyNowRedirect(slotProps.item)">
                                        <BellRing size="16" class="me-1" v-if="activeSchedule === 'Coming Soon'" />{{
                                            activeSchedule === 'Coming Soon' ? 'Remind Me' : 'Buy Now' }}
                                    </v-btn>
                                </div>
                            </v-card>
                        </v-hover>
                    </template>
                </masonry-wall>
            </div>
            <v-dialog v-model="showModal" max-width="750" persistent class="overflow-hidden" scrim="#0a0e17"
                :opacity="0.8" :retain-focus="false">
                <v-card-title class="d-flex justify-space-between align-center experience-font">
                    <span>{{ activeExp }}</span>
                    <v-btn icon="mdi-close" variant="text" @click="showModal = false"></v-btn>
                </v-card-title>
                <v-defaults-provider :defaults="{ VBtn: { variant: 'outlined', color: '#eee' } }">
                    <v-sheet class="overflow-hidden" v-if="!loading && experiences">
                        <v-carousel v-model="currentIndex" direction="vertical" height="450" progress="blue"
                            vertical-arrows="left" vertical-delimiters="right" hide-delimiter-background>
                            <template #prev="{ props }">
                                <v-btn v-bind="props" rounded="circle" variant="tonal">
                                    <ChevronUp />
                                </v-btn>
                            </template>

                            <template #next="{ props }">
                                <v-btn v-bind="props" rounded="circle" variant="tonal">
                                    <ChevronDown />
                                </v-btn>
                            </template>
                            <v-carousel-item v-for="(exp, i) in experiences" :key="i" :src="exp.image_url" cover>
                                <div
                                    class="d-flex flex-column justify-end overlay position-absolute botom-0 w-100 h-100 left-0 px-5 pb-2">
                                    <h3 class="text-white">{{ exp.title }}</h3>
                                    <p class="text-grey-lighten-1">{{ exp.subtitle }}</p>
                                    <p class="text-grey-lighten-1">{{ exp.description }}</p>
                                </div>
                            </v-carousel-item>
                        </v-carousel>
                    </v-sheet>
                    <v-sheet v-else height="450" class="d-flex" align-center justify-center>
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    </v-sheet>
                </v-defaults-provider>
            </v-dialog>
        </v-container>
        
    </v-layout>
    <FooterView />
</v-app>
</template>


<style>
h2 {
    margin-top: 11vh !important;
}

.custom-tabs {
    padding: 0rem 3rem;
}

.masonry-wrapper {
    width: 100%;
    height: auto;
}

.masonry-wall {
    margin-left: 7rem !important;
    margin-right: 7rem !important;
}

.btn-container {
    height: 40px;
}

.exp-btn:not(.v-btn--variant-flat):hover {
    background-color: var(--exp-hover-bg) !important;
    border-color: var(--exp-color) !important;
    color: var(--exp-color) !important;
}

.experience-font {
    border: 1px solid var(--text-color);
    color: var(--movie-exp-color);
}

.overlay {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 30%, rgba(0, 0, 0, 0.4) 40%, transparent 100%);
}

.pills {
    margin-left: 100px;
}

.all-btn {
    color: rgba(26, 38, 63, 0.8) !important;
}

.theme-tab-inactive {
    color: var(--tab-inactive-color) !important;
    transition: color 0.3s ease;
}
</style>
