<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { MasonryWall } from '@yeger/vue-masonry-wall';
import { Star, Tag, ClockFading, MessageCircle, BellRing, BadgeInfo, Info, ChevronUp, ChevronDown } from '@lucide/vue';
import { useRouter, useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

// Import other components, hook
import { useMovies } from '@/hook/useMovies';
import { useExperience } from '@/hook/useExperience';
import { getGenreName } from '@/utils/genre';
import FilterSideBar from '@/components/FilterSideBar.vue';
import { EXPERIENCE_NAMES, getExperienceStyle, getExpButtonStyle } from '@/utils/experience';
import { useShowtimes } from '@/hook/useShowtimes';
import { addDays } from 'date-fns';
import FooterView from '@/components/FooterView.vue';

const {
    allMovies,
    allMoviesMeta,
    allMoviesLoading,
    fetchAllMoviesPage,
    getImageURL = getImageURL,
    getLanguageName = getLanguageName,
    getCertificate = getCertificate,
} = useMovies();
const { xs, sm, md, lg } = useDisplay()
const { items: experiences, loading, loadExperiences } = useExperience();
const { cinemas, allSessions, loadInitialData, fetchAllShowtimes } = useShowtimes();
const router = useRouter();
const route = useRoute();
const initialExp = route.query.exp && EXPERIENCE_NAMES.includes(String(route.query.exp).toUpperCase())
    ? String(route.query.exp).toUpperCase()
    : 'All';
const activeExp = ref(initialExp);
const activeSchedule = ref('Now Showing');
const showModal = ref(false);
const currentIndex = ref(0);
const showFilterDrawer = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(25);
const isPageLoading = computed(() => allMoviesLoading.value);
const allMoviesBase = ref([]);
const baseCaptured = ref(false);

const masonryColumnWidth = computed(() => {
    if (xs.value) return 140
    if (sm.value) return 180
    if (md.value) return 200
    if (lg.value) return 220
    return 230
})

const masonryGap = computed(() => {
    if (xs.value) return 12
    if (sm.value) return 16
    return 30
})

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
    currentPage.value = 1;
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

const finalFilteredMovies = computed(() => allMovies.value);

const loadMoviesPage = async (page = 1) => {
    const schedule = activeSchedule.value === 'Kids'
        ? 'kids'
        : activeSchedule.value === 'Coming Soon'
            ? 'coming_soon'
            : 'now_showing';

    await fetchAllMoviesPage({
        page,
        limit: pageSize.value,
        search: searchQuery?.value?.trim(),
        schedule,
        experience: activeExp.value,
        genres: sidebarFilters.value.genre,
        languages: sidebarFilters.value.language,
        ratings: sidebarFilters.value.rating,
        minRating: sidebarFilters.value.ratingRange?.[0],
        maxRating: sidebarFilters.value.ratingRange?.[1],
        sortBy: sidebarFilters.value.sortBy,
    });
    if (!baseCaptured.value) {
        try {
            allMoviesBase.value = Array.isArray(allMovies.value) ? allMovies.value.slice() : [];
            baseCaptured.value = true;
        } catch (e) {
            console.error('Failed to capture base movies snapshot:', e);
        }
    }

    currentPage.value = allMoviesMeta.value.page || page;
};

const handlePageChange = async (page) => {
    currentPage.value = page;
    await loadMoviesPage(page);
};

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
    currentPage.value = 1;
};

onMounted(async () => {
    await loadMoviesPage(1);
})

watch([activeSchedule, searchQuery, activeExp], async () => {
    currentPage.value = 1;
    await loadMoviesPage(1);
});

watch(
    () => JSON.stringify(sidebarFilters.value),
    async () => {
        currentPage.value = 1;
        await loadMoviesPage(1);
    },
);

watch(showFilterDrawer, (open) => {
    setPageScrollLocked(open);
}, { immediate: true });

onBeforeUnmount(() => {
    setPageScrollLocked(false);
});

</script>

<template >
    <template v-if="isPageLoading && allMovies.length === 0">
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
            <h2 class="mt-2">Explore Big Screens</h2>
            <v-row class="ms-5">
                <div class="d-flex flex-wrap gap-3 mx-auto mt-3 mb-3 align-center">
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
                </v-row>
                <div class="d-flex justify-space-between flex-row my-3 tool gap-3">
                    <v-text-field
                        v-model="searchQuery"
                        placeholder="Search movies..."
                        prepend-inner-icon="mdi-magnify"
                        variant="plain"
                        density="compact"
                        hide-details
                        clearable
                        class="custom-search px-2 py-0"
                    ></v-text-field>
                <v-btn variant="outlined" prepend-icon="mdi-filter-variant"
                            @click="showFilterDrawer = true">Filter-By
                        </v-btn>
                        <FilterSideBar v-model="showFilterDrawer" :filters="sidebarFilters" :movies="allMovies" :languages="allMoviesMeta.availableLanguages"
                            @close="showFilterDrawer = false" @apply-filters="handleApplyFilters" />
                </div>
                        
                <v-row class="ms-3">
                    <v-col cols="12">
                        <v-tabs v-model="activeSchedule" bg-color="transparent" color="red-accent-4" align-tabs="start"
                            class="custom-tabs">
                            <v-tab v-for="tab in ['Now Showing', 'Kids', 'Coming Soon']" :key="tab" :value="tab"
                                :class="getTabClass(tab)">
                                {{ tab }}
                            </v-tab>
                        </v-tabs>
                    </v-col>
                </v-row>
                

            <v-expand-transition>
                <div v-if="activeFilterPills.length" class=" mt-2 pills mb-4 d-flex align-center flex-wrap gap-2">
                    <v-chip
                        v-for="pill in activeFilterPills"
                        :key="pill.type + pill.id"
                        closable
                        variant="outlined"
                        class="filter-pill"
                        @click:close="removePill(pill)"
                    >
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
                <masonry-wall :items="finalFilteredMovies"
                    :column-width="masonryColumnWidth"
                    :gap="masonryGap" class="mt-4">
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
                                            <BadgeInfo size="28" color="white" class="mb-2 info-icon" />
                                            <span class="text-white info-text ms-2 mb-2">More Info</span>
                                        </v-btn>
                                        <div class="position-absolute bottom-0 overlay-container p-3">
                                            <h3 class="title text-white mb-1 fs-5">{{ slotProps.item.title }}</h3>
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
            <div
                v-if="allMoviesMeta.totalPages > 1"
                class="pagination-shell d-flex flex-column align-center mt-10 mb-6"
            >
                <v-pagination
                    :model-value="currentPage"
                    :length="allMoviesMeta.totalPages"
                    :total-visible="7"
                    rounded="circle"
                    class="movie-pagination"
                    @update:model-value="handlePageChange"
                />
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


<style scoped>
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

.movie-pagination :deep(.v-btn) {
    min-width: 42px;
    width: 42px;
    height: 42px;
    border-radius: 999px !important;
    background: var(--card-bg-color);
    color: var(--text-color);
    border: 1px solid rgba(255,255,255,0.08);
    transition: all 0.25s ease;
    margin-right: 8px;
}

.movie-pagination :deep(.v-btn:hover) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

.movie-pagination :deep(.v-btn--active) {
    background: linear-gradient(
        135deg,
        rgb(var(--v-theme-red-accent-3)),
        rgb(var(--v-theme-red-accent-4))
    ) !important;

    color: white !important;
    border: none;
    box-shadow: 0 8px 20px rgba(255, 82, 82, 0.35);
}

.movie-pagination :deep(.v-pagination__prev .v-btn),
.movie-pagination :deep(.v-pagination__next .v-btn) {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.12);
}

.v-theme--light .movie-pagination :deep(.v-btn) {
    border-color: rgba(0,0,0,0.08);
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.movie-pagination :deep(.v-btn--disabled) {
    opacity: 0.4;
}
.filter-pill {
    background-color: var(--pill-bg);
    color: var(--text-color ) !important;
    border: 1px solid var(--text-color);
    transition: all 0.3s ease;
}


@media (max-width: 768px) {
    h2 {
        margin-top: 9vh !important;
        font-size: 1.6rem;
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .custom-tabs {
        padding: 0 1rem;
    }


    .pills {
        margin-left: 1rem;
        margin-right: 1rem;
    }

    .masonry-wall {
        margin-left: 1rem !important;
        margin-right: 1rem !important;
    }

    .pagination-shell {
        padding: 0 1rem 1rem;
    }

    .tool{
        padding: 0 !important;
    }
}

</style>
