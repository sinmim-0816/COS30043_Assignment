<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { format, addDays } from 'date-fns';

// Import other components, hook
import { useMovies } from '../hook/useMovies';
import { useShowtimes } from '../hook/useShowtimes';
import { getGenreName } from '../utils/genre';
import { getCertImage } from '../utils/AgeRating';
import { getExperienceStyle, getExpButtonStyle } from '../utils/experience';
import FilterSideBar from '@/components/FilterSideBar.vue';
import FooterView from '@/components/FooterView.vue';
import { useAppI18n } from '../utils/i18n';

const { featuredMovies = featuredMovies, getImageURL = getImageURL, fetchHeroMovies, getLanguageName, getCertificate } = useMovies();
const { cinemas, allSessions, isLoading, loadInitialData, fetchAllShowtimes, filterSessions } = useShowtimes();
const { t } = useAppI18n();

const selectedCinemaId = ref(null);
const selectedDate = ref(new Date());
const activeExperiences = ref({});
const router=useRouter();
const route = useRoute();
const showFilterDrawer=ref(false);
const sidebarFilters=ref({
    genre: [],
    language: [],
    rating:[],
    ratingRange: [0,10],
    sortBy: 'default',
});

const handleApplyFilters=(newFilters)=>{
    sidebarFilters.value=newFilters;
};

const finalFilteredMovies = computed(() => {
    const sourceMovies = featuredMovies.value || [];
    let filtered = sourceMovies.filter(movie => {
        const matchGenre =
            !sidebarFilters.value.genre?.length ||
            sidebarFilters.value.genre.some(id =>
                movie.genres.includes(String(id))
            );

        const matchLang =
            !sidebarFilters.value.language?.length ||
            sidebarFilters.value.language.includes(movie.language);

        const movieCert = getCertificate(movie);
        const matchCert =
            !sidebarFilters.value.rating?.length ||
            sidebarFilters.value.rating.includes(movieCert);

        const [minRange, maxRange] = sidebarFilters.value.ratingRange || [0, 10];
        const matchStars =
            movie.vote_average >= minRange &&
            movie.vote_average <= maxRange;

        return (
            matchGenre &&
            matchLang &&
            matchCert &&
            matchStars
        );
    });

    const sortType = sidebarFilters.value.sortBy;

    if (sortType === 'latest') {
        filtered.sort(
            (a, b) => new Date(b.release_date) - new Date(a.release_date)
        );
    } else if (sortType === 'rating') {
        filtered.sort((a, b) => b.vote_average - a.vote_average);
    } else if (sortType === 'popularity') {
        filtered.sort((a, b) => b.popularity - a.popularity);
    }

    return filtered;
});

const processedMovies = computed(() => {
    if (!selectedCinemaId.value || allSessions.value.length === 0) return [];

    const now = new Date();

    return finalFilteredMovies.value
        .map(movie => {
            const sessions = filterSessions(movie.id, selectedCinemaId.value)
                .filter(session => new Date(session.start_time) > now);

            const groups = sessions.reduce((acc, session) => {
                const key = session.experience.exp_key;

                if (!acc[key]) {
                    acc[key] = {
                        info: session.experience,
                        times: []
                    };
                }

                acc[key].times.push(session);

                return acc;
            }, {});

            return {
                ...movie,
                groups,
                totalSessions: sessions.length
            };
        })
        .filter(movie => movie.totalSessions > 0);
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

const dateOptions = computed(() => {
    return Array.from({ length: 8 }, (_, i) => addDays(new Date(), i));
});

const gotoMovieDetails=(movieId)=>{
    router.push({
        name: 'MovieDetails',
        params: {id: movieId},
    });
}

const selectSession=(movie, session)=>{
    router.push({
        name:'TicketBooking',
        params:{
            movieId: movie.id,
            showtimeId: session.id
        },
        query:{
            exp:session.experience.exp_key
        }
    })
};

watch([selectedCinemaId, selectedDate], async () => {
    if (selectedCinemaId.value && selectedDate.value) {
        await fetchAllShowtimes(selectedCinemaId.value, selectedDate.value);
    }
});

onMounted(async () => {
    if (featuredMovies.value.length === 0) {
        await fetchHeroMovies();
    }
    const cinemaList = await loadInitialData();

    if (cinemaList.length > 0) {
        if (route.query.cinema) {
            const passedCinemaId = Number(route.query.cinema);
            const cinemaExists = cinemaList.some(c => c.id === passedCinemaId);
            selectedCinemaId.value = cinemaExists ? passedCinemaId : cinemaList[0].id;
        } else {
            selectedCinemaId.value = cinemaList[0].id;
        }

        await fetchAllShowtimes(selectedCinemaId.value, selectedDate.value);
    }
});
</script>

<template>
    <template v-if="featuredMovies?.length===0">
        <div class="loading-wrapper">
            <div class="loader-content">
            <v-progress-circular
                indeterminate
                color="red-accent-3"
                size="70"
                width="4"
            >
                <v-icon icon="mdi-movie-roll" size="24"></v-icon>
            </v-progress-circular>
            
            <p class="mt-6 loading-text">{{ t('allShowtimes.loading') }}</p>
            <div class="loading-bar"></div>
            </div>
        </div>
    </template>
    <v-app v-else full-height class="mt-2 ms-md-5">
        <h2>{{ t('allShowtimes.title') }}</h2>
        <v-container fluid width="100vw">
            <v-row class="align-center mx-auto mt-2 selection">
                <v-col cols="12" md="4">
                    <p class="text-subtitle-2 text-color mb-4 mx-2">{{ t('allShowtimes.selectTheatre') }}</p>
                    <v-menu offset-y transition="scale-transition">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" class="theatre-selector-btn text-none px-6" block height="50"
                                rounded="pill">
                                <span class="text-truncate">{{cinemas.find(c => c.id === selectedCinemaId)?.name ||
                                    t('allShowtimes.selectCinema') }}</span>
                                <v-spacer></v-spacer>
                                <v-icon icon="mdi-chevron-down" color="grey"></v-icon>
                            </v-btn>
                        </template>
                        <v-list class="list-bg" >
                            <v-list-item v-for="cinema in cinemas" :key="cinema.id"
                                @click="selectedCinemaId = cinema.id" :active="selectedCinemaId === cinema.id"
                                color="red-accent-3">
                                <v-list-item-title>{{ cinema.name }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-col>

                <v-col cols="6" md="8" >
                    <p class="text-subtitle-2 text-color mb-4 mx-md-4">{{ t('allShowtimes.selectDate') }}</p>
                    <div class="date-scroll-container px-md-4">
                        <v-card v-for="date in dateOptions" :key="date" @click="selectedDate = date"
                            :class="['date-pill', { 'active-date': format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') }]"
                            elevation="0">
                            <div class="text-caption text-uppercase date-day">{{ format(date, 'EE') }}</div>
                            <div class="fs-5 font-weight-bold">{{ format(date, 'dd') }}</div>
                        </v-card>
                    </div>
                </v-col>
                <v-col cols="12" class="pe-5">
                    <div class="d-flex justify-space-between align-center ">
                        <div class="pills d-flex align-center flex-wrap ms-0">
                        <v-expand-transition>
                            <div v-if="activeFilterPills?.length">
                            <v-chip
                                v-for="pill in activeFilterPills"
                                :key="pill.type + pill.id"
                                closable
                                variant="outlined"
                                color="white filter-pill"
                                @click:close="removePill(pill)"
                                class="me-3 gap-2"
                            >
                                {{ pill.label }}
                            </v-chip>
                            </div>
                        </v-expand-transition>
                        </div>

                        <v-btn
                            variant="outlined"
                            prepend-icon="mdi-filter-variant"
                            @click="showFilterDrawer = true"
                            class="me-md-3"
                            >
                            {{ t('allShowtimes.filterBy') }}
                        </v-btn>
                    </div>

                    <FilterSideBar 
                        v-model="showFilterDrawer"
                        :filters="sidebarFilters"
                        :movies="featuredMovies"
                        :initial-movies="featuredMovies"
                        @close="showFilterDrawer = false"
                        @apply-filters="handleApplyFilters"
                        class="me-md-5"
                    />
                    </v-col>
            </v-row>
        </v-container>
        <v-container fluid>
            <v-row v-if="isLoading" justify="center" align="center" class="mt-16">
                <v-col cols="12" class="text-center">
                    <v-progress-circular
                        indeterminate
                        color="red-accent-3"
                        size="70"
                        width="4"
                        class="mt-5"
                    >
                        <v-icon icon="mdi-movie-roll" color="white" size="24"></v-icon>
                    </v-progress-circular>
                </v-col>
            </v-row>

            <v-row v-else-if="processedMovies.length > 0">
                <v-col cols="12" v-for="movie in processedMovies" :key="movie.id">
                    <div class="showtime-movie-card">
                        <v-row no-gutters>
                            <v-col cols="12" sm="3" md="2">
                                <v-img :src="getImageURL(movie.poster)" cover height="100%"
                                    class="rounded-l-lg position-relative movie-poster ">
                                    <v-img :src="getCertImage(getCertificate(movie))" width="45" height="45" contain
                                        class="position-absolute bottom-0 left-0 m-2"></v-img>
                                </v-img>
                            </v-col>

                            <v-col cols="12" sm="9" md="10" class="pa-6">
                                <div class="d-flex align-center justify-space-between mb-4">
                                    <div>
                                        <h3 class="text-h4 font-weight-bold mb-1">{{ movie.title }}</h3>
                                        <div class="text-caption text-color">
                                            {{ movie.runtime }} &bull; {{ getLanguageName(movie.language) }}
                                        </div>
                                        <div class="d-flex gap-2 mt-3 genres">
                                            <v-chip v-for="id in movie?.genres" :key="id" variant="tonal"
                                                class="font-weight-bold">
                                                {{ getGenreName(id) }}
                                            </v-chip>
                                        </div>
                                    </div>
                                    <v-btn variant="outlined" @click="gotoMovieDetails(movie.id)">
                                        {{ t('allShowtimes.movieInfo') }}
                                    </v-btn>
                                </div>

                                <v-divider color="grey-darken-3"></v-divider>

                                <div v-if="!activeExperiences[movie.id]" class="animate__animated animate__fadeIn">
                                    <p class="text-subtitle-2 text-color mb-4">{{ t('allShowtimes.selectExperience') }}</p>

                                    <div class="d-flex flex-wrap gap-3">
                                        <v-btn v-for="(group, name) in movie.groups" :key="name"
                                            class="experience-font exp-btn" rounded="pill"
                                            :variant="activeExperiences[movie.id] === name ? 'flat' : 'outlined'"
                                            :color="activeExperiences[movie.id] === name
                                                ? getExperienceStyle(name).color
                                                : 'grey-lighten-1'" @click="activeExperiences[movie.id] = name"
                                            :style="getExpButtonStyle(name)">
                                            {{ name }}
                                            <v-fade-transition>
                                                <v-btn v-show="activeExperiences==name" variant="plain" min-width="0" width="auto" height="auto" :ripple="false" class="p-0 ms-2 m-0" @click="openExperienceModal(name)">
                                                    <Info size="20" />
                                                </v-btn>
                                            </v-fade-transition>
                                        </v-btn>
                                    </div>
                                </div>
                                <div v-else class="animate__animated animate__fadeIn">
                                    <v-chip :style="{
                                            backgroundColor: getExperienceStyle(activeExperiences[movie.id]).color,
                                            color: getExperienceStyle(activeExperiences[movie.id]).textColor
                                        }">
                                            {{ activeExperiences[movie.id] }}
                                        </v-chip>
                                    <div class="d-flex align-center mb-6">
                                        <v-btn icon="mdi-arrow-left" variant="text" color="grey" class="mr-2"
                                            @click="activeExperiences[movie.id] = null" />
                                        <span class="ml-3 text-grey">{{ t('allShowtimes.selectTime') }}</span>
                                    </div>

                                    <div class="d-flex flex-wrap gap-3 ms-5">
                                        <v-btn v-for="session in movie.groups[activeExperiences[movie.id]].times"
                                            :key="session.id" variant="tonal" color="white" class="session-time-btn" @click="selectSession(movie, session)">
                                            {{ format(new Date(session.start_time), 'hh:mm a') }}
                                        </v-btn>
                                    </div>
                                </div>
                            </v-col>
                        </v-row>
                    </div>
                </v-col>
            </v-row>

            <v-row v-else justify="center" class="mt-16">
                <v-col cols="12" class="text-center text-grey-darken-1">
                    <v-icon size="80" class="mb-4">mdi-movie-off-outline</v-icon>
                    <p class="text-h5">{{ t('allShowtimes.noShowtimesFound') }}</p>
                    <p>{{ t('allShowtimes.noShowtimesHint') }}</p>
                </v-col>
            </v-row>
        </v-container>
        <FooterView/>
    </v-app>
</template>

<style>
h2 {
    margin-top: 9vh;
}

.bg-main {
    background-color: #0a0e17 !important;
}

.theatre-selector-btn {
    background-color: var(--cinema-btn-bg);
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: var(--cinema-btn-color);
    font-size: 1rem !important;
}

.v-spacer {
    width: 20px
}

.date-scroll-container {
    display: flex;
    scrollbar-width: none;
    max-width: 750px;
    justify-content: space-between;
}

.date-scroll-container::-webkit-scrollbar {
    display: none;
}

.date-pill {
    min-width: 70px;
    height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: var(--pill-color);
    border: 1px solid var(--pill-border);
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--pill-text);
}

.date-day {
    margin-bottom: 4px;
    font-size: 0.7rem !important;
    letter-spacing: 1px;
}

.active-date {
    background: var(--active-date-bg);
    border: none !important;
    color: white !important;
    transform: translateY(-5px);
}

.active-date .date-day {
    color: rgba(255, 255, 255, 0.8) !important;
    font-weight: 800;
}

.tracking-tight {
    letter-spacing: -1.5px !important;
}

.showtime-movie-card {
    border: 1px solid rgba(16, 0, 89, 0.303);
    border-radius: 12px;
    overflow: hidden;
    max-width: 80vw;
    background-color: var(--showtime-bg);
    margin-left: 7vw;
}

.session-time-btn {
    min-width: 100px;
    height: 45px !important;
    border: 1px solid rgb(75, 73, 73);
    font-weight: bold;
    letter-spacing: 0.5px;
    transition: all 0.2s ease;
    color: var(--text-color) !important;
}

.gap-3 {
    gap: 12px;
}

.selection {
    max-width: 85vw;
}

.movie-poster{
    height:100%;
}

.session-time-btn:hover {
    background-color: #ff5252 !important;
    border-color: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 82, 82, 0.3);
}

.gap-3 {
    gap: 12px;
}

.text-tiny {
    line-height: 1;
    margin-top: 2px;
}
.list-bg{
    background-color: var(--dropdown-bg);
    color: var(--text-color);
}

.filter-pill {
    background-color: var(--pill-bg);
    color: var(--text-color ) !important;
    border: 1px solid var(--text-color);
    transition: all 0.3s ease;
}



@media (max-width: 600px) {
    .date-scroll-container {
        flex-wrap: wrap;
        gap: 8px;
        width:400px;
        justify-content: flex-start;
    }

    .date-pill {
        width: 60px;
        min-width: 60px;
        height: 90px;
    }

    .movie-poster{
        max-height: 190px;
    }

    .genres{
        max-width:200px;
        flex-wrap: wrap;
    }
}
</style>
