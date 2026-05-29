<script setup>
import { ref, onMounted, computed } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Pagination, EffectFade, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import { addDays } from 'date-fns';
import { Star, CirclePlay, ChevronRight, BadgeInfo, Tag, ClockFading, MessageCircle, ChevronLeft, BellRing, ChevronsDown } from '@lucide/vue';
import { useRouter } from 'vue-router';

// Import other hooks and components
import { useMovies } from '@/hook/useMovies';
import { getGenreName } from '@/utils/genre';
import { getCertImage } from '@/utils/AgeRating';
import { getExperienceStyle } from '@/utils/experience';
import { useShowtimes } from '@/hook/useShowtimes';
import FooterView from '@/components/FooterView.vue';
import { useExperience } from '@/hook/useExperience';
import TicketLeft from '@/components/TicketLeft.vue';
import TicketCenter from '@/components/TicketCenter.vue';
import TicketRight from '@/components/TicketRight.vue';

const { featuredMovies, fetchHeroMovies, getImageURL, isLoading, getLanguageName, getCertificate, comingSoonMovies, fetchComingSoonMovies } = useMovies();
const { cinemas, allSessions, loadInitialData, fetchAllShowtimes } = useShowtimes();
const { items: experienceData, loading: expLoading, loadExperiences, loadAllExperiences } = useExperience(); 
const router = useRouter();

const showTrailer = ref(false);
const currentVideoKey = ref(null);
const swiperInstance = ref(null);
const activeTab = ref(0);

const experienceCategories = ref([]);
const activeExperienceIndex = ref(0);

const hasScrolledExperiences = ref(false);

const handleExperienceScroll = (event) => {
    hasScrolledExperiences.value = event.target.scrollTop > 10;
};
const onSwiper = (swiper) => {
    swiperInstance.value = swiper;
};

const playVideo = async (movie) => {
    const url = movie.trailer;
    if (!url) {
        return;
    }
    const key = url.split('v=')[1];
    currentVideoKey.value = key;
    showTrailer.value = true;
    swiperInstance.value?.autoplay?.stop();
};

const getDisplayExperience = (movie) => {
    if (!movie?.experiences || movie.experiences.length === 0) {
        return null;
    }
    const expKey = movie.experiences[0];
    const style = getExperienceStyle(expKey);

    return {
        name: expKey,
        color: style.color,
        textColor: style.textColor
    };
};

const gotoMovieDetails = (movieId) => {
    router.push({
        name: 'MovieDetails',
        params: { id: movieId },
    });
}

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

const getTabClass = (index) => {
    if (activeTab.value === index) {
        return 'text-red-accent-3 fs-5';
    }
    
    return 'theme-tab-inactive';
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

const closeTrailer = () => {
    showTrailer.value = false;
    currentVideoKey.value = null;
    if (swiperInstance.value) {
        swiperInstance.value.autoplay.start();
    }
};

const displayMovies = computed(() => {
    const today = new Date();

    if (activeTab.value === 0) {
        return featuredMovies.value.filter(movie =>
            new Date(movie?.release_date) <= today
        );
    }

    if (activeTab.value === 1) {
        return featuredMovies.value.filter(movie => {
            const genres = movie?.genres || [];
            const isKid = genres.includes('16') || genres.includes('10751');
            const isReleased = new Date(movie?.release_date) <= today;
            return isKid && isReleased;
        });
    }

    if (activeTab.value === 2) {
        return comingSoonMovies.value;
    }

    return featuredMovies.value;
});

const selectExperience = async (index) => {
    activeExperienceIndex.value = index;
    const selectedKey = experienceCategories.value[index].key;
    await loadExperiences(selectedKey);
};

const viewMoreExperiences = () => {
    const selectedExpKey = experienceCategories.value[activeExperienceIndex.value].key;
    router.push({ 
        path: '/movies', 
        query: { exp: selectedExpKey } 
    }); 
};


onMounted(async () => {
    if (featuredMovies.value.length === 0) {
        await fetchHeroMovies();
    }

    if (comingSoonMovies.value.length === 0) {
        await fetchComingSoonMovies();
    }
    try {
        await loadInitialData();
    } catch (err) {
        console.error("Failed to sync showtimes sessions map cache:", err);
    }

    const allExperiences = await loadAllExperiences();
    if (allExperiences && allExperiences.length > 0) {
        const uniqueCategories = [];
        const seenKeys = new Set();

        allExperiences.forEach(exp => {
            if (!seenKeys.has(exp.exp_key)) {
                seenKeys.add(exp.exp_key);
                uniqueCategories.push({
                    key: exp.exp_key,
                    name: exp.exp_key, 
                    desc: exp.subtitle || exp.description 
                });
            }
        });

        experienceCategories.value = uniqueCategories;

        if (experienceCategories.value.length > 0) {
            await selectExperience(0);
        }
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('h2, .scroll-animate').forEach((el) => observer.observe(el));
});
</script>

<template>
    <template v-if="isLoading">
        <div class="loading-wrapper">
            <div class="loader-content">
                <v-progress-circular indeterminate color="red-accent-3" size="70" width="4">
                    <v-icon icon="mdi-movie-roll" class="icon-color" size="24"></v-icon>
                </v-progress-circular>

                <p class="mt-6 loading-text">Loading...</p>
                <div class="loading-bar"></div>
            </div>
        </div>
    </template>
    <v-app v-else-if="featuredMovies" full-height class="container-fluid m-0 p-0">
        <section class="hero_section" v-show="featuredMovies.length > 0">
            <Swiper :key="featuredMovies.length" @swiper="onSwiper" :modules="[Autoplay, Pagination, EffectFade]"
                effect="fade" :slides-per-view="1" :loop="true" :autoplay="{ delay: 3000, pauseOnMouseEnter: true }"
                :pagination="{ clickable: true }" class="mySwiper p-0 m-0">
                <SwiperSlide v-for="movie in featuredMovies.slice(0, 10)" :key="movie?.id" class="slider_img">
                    <div class="overlay-gradient"></div>
                    <div class="bottom-fade"></div>
                    <v-img :src="getImageURL(movie?.backdrop)" :alt="movie?.title" class="hero_bg" cover height="100%" />
                    <v-container fluid class="overlay-elements fill-height">
                        <v-row align="end" class="fill-height hero-row">
                            <v-col class="hero_content" cols="12" md="6">
                                <div class="d-flex align-center gap-3 mb-2">
                                    <v-img :src="getCertImage(getCertificate(movie))" contain width="45px" height="45px"
                                        class="flex-grow-0 cert"></v-img>
                                    <v-divider vertical class="mx-2" thickness="2" color="white"></v-divider>
                                    <v-chip variant="tonal" color="white" size="small"
                                        class="text-uppercase font-weight-bold">
                                        {{ getLanguageName(movie?.language) }}
                                    </v-chip>
                                </div>
                                <h1 class="fw-bold">{{ movie?.title }}</h1>
                                <div class="d-flex align-items-center gap-4">
                                    <p>
                                        <Star id="rate_icon" fill="#f5c518" color="#f5c518" /> <span class="fs-1">{{
                                            movie?.vote_average?.toFixed?.(1) || 0.0 }}</span> /10
                                    </p>
                                    <p class="text-muted" id="details">{{ movie?.runtime }} &bull; <span
                                            v-for="(genreId, index) in movie?.genres" :key="genreId">{{
                                                getGenreName(genreId) }}<span v-if="index < movie?.genres.length - 1">,
                                            </span></span> &bull; <span>{{ movie?.release_date ? new
                                                Date(movie?.release_date).getFullYear() : 'N/A' }}</span></p>

                                </div>
                                <p class="fs-6 text-wrap">{{ movie?.overview }}</p>

                                <v-row>
                                    <v-btn variant="flat" class="trailer-btn py-4 fs-6 rounded-2"
                                        @click="playVideo(movie)">
                                        <CirclePlay class="me-2" />Watch Trailer
                                    </v-btn>
                                    <v-btn variant="flat" elevation="3" class="movie-btn py-4 fs-6 rounded-2"
                                        @click="handleBuyNowRedirect(movie)">
                                        Buy Now
                                    </v-btn>
                                </v-row>
                            </v-col>
                            <v-col cols="12" md="6" class="hero-visual-col">
                                <v-row class="fill-height d-flex align-items-center" id="poster_section">
                                    <v-col cols="3" class="poster-thumb d-flex align-items-center"
                                        v-for="(backdrop, index) in movie?.backdrops?.slice(0, 3)" :key="index">
                                        <img :src="getImageURL(backdrop)" alt="Poster Image">
                                    </v-col>
                                </v-row>
                                <div class="d-flex mb-3 Movjustify-content-center">

                                    <div v-for="actor in (movie?.actors?.slice(0, 5) || [])" :key="actor.name"
                                        class="actors me-4">
                                        <v-avatar size="60" class="mb-1 ms-1 border-white">
                                            <v-img :src="getImageURL(actor?.profile)" alt="Actor Image" />
                                        </v-avatar>
                                        <div class="text-center small lh-1">{{ actor?.name }}</div>
                                    </div>
                                    <div v-if="movie?.actors?.length > 5" class="col-auto d-flex align-items-center">
                                        <button class="btn view-btn mb-5" @click="gotoMovieDetails(movie.id)">VIEW
                                            ALL</button>
                                    </div>
                                </div>
                            </v-col>
                        </v-row>
                    </v-container>
                </SwiperSlide>
            </Swiper>
            <v-dialog v-model="showTrailer" max-width="1000" max-height="600" persistent scrim="#0a0e17" :opacity="0.8"
                :retain-focus="false">
                <v-card color="transparent" elevation="0" rounded="4">
                    <v-card-title class="d-flex justify-end p-0">
                        <v-btn icon="mdi-close" color="white" variant="text" @click="closeTrailer"></v-btn>
                    </v-card-title>
                    <div>
                        <iframe v-if="currentVideoKey" width="1000px" height="500"
                            :src="`https://www.youtube.com/embed/${currentVideoKey}?autoplay=1&`" frameborder="0"
                            allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen>
                        </iframe>
                    </div>
                </v-card>
            </v-dialog>
            <div class="section-connector"></div>
        </section>
        <section id="now-showing" class="pt-2">
            <v-container v-if="!isLoading" class="reveal-on-load" fluid>
                <h2>Movie Showtime</h2>
                <div class="now-showing-toolbar mt-4 mx-5 mb-8">
                    <v-tabs v-model="activeTab" bg-color="transparent" class="now-showing-tabs">
                        <v-tab v-for="(tab, index) in ['Now Showing', 'Kids', 'Coming Soon']" :key="index"
                            :value="index" :class="getTabClass(index)">
                            {{ tab }}
                        </v-tab>
                    </v-tabs>
                    <RouterLink to="/movies" class="now-showing-link">
                        <v-btn variant="text" class="hidden-sm-and-down rounded theme-tab-inactive">See More
                            <ChevronRight />
                        </v-btn>
                    </RouterLink>
                </div>
                <v-window v-model="activeTab" class="mx-3">
                    <v-window-item v-for="n in 3" :key="n" :value="n - 1">
                        <div class="swiper-wrapper-relative">
                            <Swiper :key="activeTab" :modules="[Navigation]" :slides-per-view="2.2" :space-between="12"
                                :navigation="{ nextEl: '.swiper-wrapper-relative .custom-next', prevEl: '.swiper-wrapper-relative .custom-prev' }"
                                :breakpoints="{ '500': { slidesPerView: 3.0, spaceBetween: 10 }, '640': { slidesPerView: 3.2, spaceBetween: 6 }, '1224': { slidesPerView: 4.5, spaceBetween: 20 } }"
                                class="movie-swiper mt-4" :pagination="false">
                                <SwiperSlide v-for="movie in displayMovies" :key="movie?.id">
                                    <v-hover v-slot="{ isHovering, props }">
                                        <v-card v-bind="props" class="movie-booking-card rounded-x1"
                                            :elevation="isHovering ? 12 : 2">
                                            <v-img :src="getImageURL(movie?.poster)" cover class="now-showing-poster">
                                                <v-chip v-if="getDisplayExperience(movie)"
                                                    :key="getDisplayExperience(movie).name" :style="{
                                                        backgroundColor: getDisplayExperience(movie).color,
                                                        color: getDisplayExperience(movie).textColor
                                                    }"
                                                    class=" text-uppercase cinema-badge d-flex justify-center m-2 experience-font">
                                                    {{ getDisplayExperience(movie).name }}
                                                </v-chip>
                                                <!-- Cert Icon -->
                                                <v-img :src="getCertImage(getCertificate(movie))"
                                                    class="certification-badge position-absolute bottom-0 left-0 m-2"></v-img>

                                                <div class="card-action-overlay d-flex flex-column pa-4">
                                                    <v-btn variant="flat" class="info p-0"
                                                        @click="gotoMovieDetails(movie?.id)">
                                                        <BadgeInfo color="white" class="mb-2 info-icon" />
                                                        <span class="text-white info-text ms-2 mb-2">More Info</span>
                                                    </v-btn>


                                                    <div class="position-absolute bottom-0 overlay-container">
                                                        <h3 class="text-white mb-1 title">{{ movie?.title }}</h3>
                                                        <div class="d-flex align-center mb-1">
                                                            <Star size="14" fill="#f5c518" color="#f5c518"
                                                                class="me-1" />
                                                            <span class="text-white text-caption">{{
                                                                movie?.vote_average?.toFixed(1) }}</span>
                                                        </div>
                                                        <div class="text-grey-lighten-2 text-caption">
                                                            <Tag size="14" class="me-1" /> {{
                                                                getGenreName(movie?.genres[0])
                                                            }}
                                                        </div>
                                                        <div class="text-grey-lighten-2 text-caption">
                                                            <ClockFading size="14" class="me-1" />{{ movie?.runtime }}
                                                        </div>
                                                        <div class="text-grey-lighten-2 text-caption">
                                                            <MessageCircle size="14" class="me-1" /> {{
                                                                getLanguageName(movie?.language) }}
                                                        </div>
                                                        <v-btn :color="activeTab === 2 ? 'white' : 'red-accent-3'"
                                                            :variant="activeTab === 2 ? 'outlined' : 'flat'"
                                                            :class="['rounded-2', activeTab == 2 ? '' : 'movie-btn', 'mb-4 d-block mx-auto mt-2']"
                                                            @click="activeTab === 2 ? null : handleBuyNowRedirect(movie)">
                                                            <BellRing size="16" class="me-1" v-if="activeTab === 2" />{{
                                                                activeTab === 2 ? 'Remind Me' : 'Buy Now' }}
                                                        </v-btn>
                                                    </div>
                                                </div>
                                            </v-img>
                                        </v-card>
                                    </v-hover>
                                </SwiperSlide>
                            </Swiper>
                            <button class="custom-nav-btn custom-prev">
                                <ChevronLeft size="32" />
                            </button>
                            <button class="custom-nav-btn custom-next">
                                <ChevronRight size="32" />
                            </button>
                        </div>
                    </v-window-item>
                </v-window>
            </v-container>
        </section>
        <section id="custom-ticket-cta" class=" position-relative">
            
            <v-container fluid class="text-center position-relative z-index-2" width="100vw">
                
                <div class="ticket-animation-stage scroll-animate">
                    
                    <div class="animated-ticket ticket-left">
                        <div class="svg-ticket-wrapper">
                            <TicketLeft />
                        </div>
                    </div>
                    
                    <div class="animated-ticket ticket-center">
                        <div class="svg-ticket-wrapper">
                            <TicketCenter />
                        </div>
                    </div>

                    <div class="animated-ticket ticket-right">
                        <div class="svg-ticket-wrapper">
                            <TicketRight />
                        </div>
                    </div>
                    
                </div>

                <h2 class="text-h3 font-weight-black mb-4" style="letter-spacing: -1px;">
                    Craft Your Cinematic Keepsake
                </h2>
                <p class="text-h6 text-color font-weight-regular mx-auto w-75" >
                    Don't just watch the movie, own the memory. After booking your showtime, unlock the ability to customize and design your own unique digital ticket to share and collect!
                </p>
                
                <v-btn 
                    to="/customize-list"    
                    color="red-accent-3" 
                    variant="flat"
                    height="48"
                    class="movie-btn px-8 font-weight-bold text-white text-none"
                >
                    Learn More
                </v-btn>

            </v-container>
        </section>
        <section id="experiences" >
            <v-container fluid class="px-5 px-md-10">
                <div class="text-center mb-5">
                    <h2 class="text-h3 font-weight-black mx-auto">
                        Immersive ways <br/> to watch your movie.
                    </h2>
                </div>

                <v-row class="align-stretch">
                    <v-col cols="12" md="4" lg="3" class="position-relative">
                        <div class="experience-list-container" @scroll="handleExperienceScroll">
                            <div 
                                v-for="(cat, index) in experienceCategories" 
                                :key="cat.key"
                                class="experience-item"
                                :class="{ 'active': activeExperienceIndex === index }"
                                @click="selectExperience(index)"
                            >
                                <div class="exp-text">
                                    <h4 class="text-uppercase font-weight-bold mb-1 title-text">
                                        {{ cat.name }}
                                    </h4>
                                    <p class="text-caption mb-0 desc-text ">
                                        {{ cat.desc }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <v-fade-transition>
                            <div
                                v-if="!hasScrolledExperiences && experienceCategories.length > 5"
                                class="scroll-indicator"
                            >
                                <div class="modern-scroll-indicator">
                                    <ChevronsDown size="25" class="scroll-icon" />
                                </div>
                            </div>
                        </v-fade-transition>
                    </v-col>

                    <v-col cols="12" md="8" lg="9">
                        <div v-if="expLoading" class="fill-height w-100 d-flex justify-center align-center" style="min-height: 400px;">
                            <v-progress-circular indeterminate color="red-accent-3" size="50"></v-progress-circular>
                        </div>
                        
                        <v-fade-transition mode="out-in">
                            <div v-if="!expLoading && experienceData.length > 0" class="w-100 custom-feature-layout">
                                
                                <div class="d-flex flex-column feature-col-small">
                                    <div v-if="experienceData[0]" class="feature-card rounded-xl overflow-hidden position-relative">
                                        <v-img :src="experienceData[0].image_url" cover class="h-100 w-100 feature-img">
                                            <div class="fill-height bottom-gradient"></div>
                                            <div class="position-absolute bottom-0 pa-4 text-white z-index-2">
                                                <h3 class="font-weight-bold mb-1 text-h6">{{ experienceData[0].title }}</h3>
                                                <p class="text-caption text-grey-lighten-1 mb-0 text-truncate">{{ experienceData[0].subtitle || experienceData[0].description }}</p>
                                            </div>
                                        </v-img>
                                    </div>
                                    
                                    <v-btn 
                                        color="red-accent-3" 
                                        variant="flat"
                                        height="60"
                                        class="rounded-xl font-weight-bold text-white text-subtitle-1 text-none mt-4 shadow-md view-all-btn"
                                        @click="viewMoreExperiences"
                                    >
                                        View All Experiences
                                        <ChevronRight size="20" class="ms-1" />
                                    </v-btn>
                                </div>

                                <div class="feature-col-large" v-if="experienceData[1]">
                                    <div class="feature-card rounded-xl overflow-hidden position-relative h-100">
                                        <v-img :src="experienceData[1].image_url" cover class="h-100 w-100 feature-img">
                                            <div class="fill-height bottom-gradient"></div>
                                            <div class="position-absolute bottom-0 pa-6 text-white w-100 z-index-2">
                                                <h3 class="font-weight-bold mb-2 text-h4" style="letter-spacing: -0.5px;">{{ experienceData[1].title }}</h3>
                                                <p class="text-body-1 text-grey-lighten-1 mb-0" style="line-height: 1.4;">{{ experienceData[1].description }}</p>
                                            </div>
                                        </v-img>
                                    </div>
                                </div>

                            </div>
                        </v-fade-transition>
                    </v-col>
                </v-row>
            </v-container>
        </section>
        
        <FooterView />
    </v-app>
    
</template>

<style>
.hero_section {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 10;
}

.mySwiper,
.swiper,
.swiper-slide {
    width: 100%;
    height: 100%;
    
}

.slider_img {
    position: relative;
    width: 100%;
    height: min(700px, 90vh);
    overflow: hidden;
}

.hero_bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.hero_bg img,
.poster-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 5;
    
}

.overlay-elements {
    position: absolute;
    inset: 0;
    z-index: 12;
    color: white;
    font-family: 'Roboto', sans-serif;
    width: 100% !important;
    padding: 0 4rem 2rem;
}

.hero_content {
    padding: 2rem;
    font-size: 1.5rem;
    user-select: none;
    max-width: 700px;
}

.overlay-gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--hero-gradient);
    z-index: 8;
    transition: background 0.5s ease;
}

.hero_content h1 {
    color: white !important;
}
#rate_icon {
    color: #f5c518;
    width: 30px;
    height: 30px;
}

#details {
    color: #dadada !important;
    font-size: 16px;
    max-width: 75%;
    font-weight: 700;
}

#poster_section {
    height: 30vh !important;
    justify-content: center;
}

.poster-thumb {
    width: 15vw !important;
    
}

.poster-thumb img {
    height: auto;
    object-fit: contain;
    border-radius: 12px;
}

.actors img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    object-position: center;
}

.actors {
    max-width: 70px;
    max-height: 100px;
}

.view-btn {
    color: white;
    background-color: rgba(212, 212, 212, 0.297);
    backdrop-filter: blur(15px);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    font-size: 11px;
}

.trailer-btn {
    background-color: rgba(212, 212, 212, 0.297);
    backdrop-filter: blur(10px);
    width: 165px;
    transition: color 0.3s ease;
}

.trailer-btn:hover {
    color: rgb(255, 61, 61);
}

.bottom-fade {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 40vh;
    background: linear-gradient(to top, #0a0e17 0%, transparent 100%);
    z-index: 9;
}

#now-showing {
    position: relative;
    z-index: 21;
    padding: 2rem 3rem 0 3rem !important;
    overflow: hidden;
}

.now-showing-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.now-showing-tabs {
    flex: 1 1 0;
    min-width: 0;
}

.now-showing-link {
    flex: 0 0 auto;
}

.v-tab {
    width: 150px;
}

.reveal-on-load {
    animation: professionalReveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.v-card:hover {
    transform: scale(1.05);
}

.v-card:hover .card-action-overlay {
    opacity: 1;
}

.v-card:hover .certification-badge {
    opacity: 0;
}

.swiper-wrapper-relative {
    position: relative;
    padding: 0 55px;
    width: 100%;
    box-sizing: border-box;
}

.custom-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 50;
    width: 45px;
    height: 45px;
    background: var(--btn-bg);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    color:var(--btn-color);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.custom-prev {
    left: 0;
}

.custom-next {
    right: 0;
}

.custom-nav-btn:hover {
    background-color: rgba(255, 82, 82, 0.2);
    border-color: #ff5252;
    color: #ff5252
}

.swiper-button-disabled {
    opacity: 0.2;
    cursor: not-allowed;
    pointer-events: none;
}

.info {
    cursor: pointer;
    display: flex;
    width: fit-content;
    min-width: unset;
    justify-content: flex-start;
    background-color: transparent !important;
    transition: all 0.3s ease;
}

.info-icon {
    width: 28px;
    height: 28px;
    transition: all 0.3s ease;
}

.info-text {
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.info:hover {
    color: red !important;
}

.certification-badge {
    width: 40px;
    height: 40px;
}

.movie-booking-card {
    overflow: hidden;
}

.now-showing-poster {
    width: 100%;
    min-height: 360px;
    position:relative;
}

.now-showing-poster :deep(img) {
    object-fit: cover;
}

.card-action-overlay {
    width: 100%;
    max-width: 250px;
    position:absolute;
    top:0;
    left:0;
}

.overlay-container {
    width: 100%;
    max-width: 280px;
}

.theme-tab-inactive {
    color: var(--tab-inactive-color) !important;
    transition: color 0.3s ease;
}
.section-connector {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background: linear-gradient(to bottom, transparent, var(--bg-color));
    z-index: 20;
    opacity: 1;
    pointer-events: none; 
}

#experiences {
    background-color: transparent;
    padding:0 7rem
}

.experience-list-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    max-height: 520px; 
    overflow-y: auto;
    padding-right: 8px;
    -ms-overflow-style: none;
    scrollbar-width: none;
}
.experience-list-container::-webkit-scrollbar {
    display: none;
}

.experience-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background-color: none; 
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-left: 4px solid transparent; 
    
}

.experience-item:hover {
    background-color: rgba(255, 255, 255, 0.06);
}

.experience-item.active {
    background: var(--active-date-bg);
    transform: translateX(4px);
}

.title-text {
    color: var(--text-color, #ffffff);
    transition: color 0.3s;
}

.desc-text {
    color: var(--text-color);
    transition: color 0.3s;
}

.experience-item.active .title-text {
    color: #ffffff !important;
}

.experience-item.active .desc-text {
    color: rgba(255,255,255,0.8);
}

.active-arrow {
    color: #fffefe;
}

.custom-feature-layout {
    display: grid;
    grid-template-columns: 1fr 1.3fr; 
    gap: 24px;
    min-height: 520px;
}

.feature-col-small {
    display: flex;
    flex-direction: column;
}

.feature-col-small .feature-card {
    min-height: 440px;
    width: 350px;
    align-self: center;
}

.feature-col-large {
    height: 100%;
    width: 450px;
}

.feature-card {
    border: 1px solid rgba(255,255,255,0.1);
    transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.feature-img {
    transition: transform 0.7s ease;
}
.bottom-gradient {
    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
    width: 100vw !important;
    bottom: 0;
}

.z-index-2 {
    z-index: 2;
}

.view-all-btn {
    transition: background-color 0.3s, transform 0.3s;
    width: 330px;
    align-self: center;
    background: var(--movie-btn);
}

.view-all-btn:hover {
    background-color: #d32f2f !important;
    transform: translateY(-2px);
}

.title{
    font-size:20px
}

@media (max-width: 960px) {
    .slider_img {
        height: min(640px, 82vh);
    }

    .overlay-elements {
        padding: 0 1.5rem 1.5rem;
    }

    .hero_content {
        padding: 1rem;
        font-size: 1.1rem;
        max-width: 100%;
    }

    .hero_content h1 {
        font-size: clamp(2rem, 5vw, 3.25rem);
        line-height: 1.05;
    }

    #details {
        max-width: 100%;
        font-size: 14px;
    }

    .trailer-btn,
    .movie-btn {
        width: 100%;
        max-width: 220px;
    }

    .hero-visual-col {
        display: none !important;
    }

    .overlay-elements .v-row {
        margin-left: 0;
        margin-right: 0;
    }

    .custom-feature-layout {
        grid-template-columns: 1fr;
        min-height: auto;
    }
    .feature-col-large {
        min-height: 400px;
        margin-top: 16px;
    }
    .experience-list-container {
        max-height: 300px;
        margin-bottom: 24px;
    }

    #now-showing {
        padding: 1.5rem 1rem 0 1rem !important;
    }

    .now-showing-toolbar {
        margin-left: 0 !important;
        margin-right: 0 !important;
        align-items: flex-start;
    }

    .now-showing-tabs {
        width: 100%;
        order: 2;
        overflow-x: auto;
    }

    .now-showing-link {
        order: 1;
        margin-left: auto;
    }

    .swiper-wrapper-relative {
        padding: 0 38px;
    }

    .custom-nav-btn {
        width: 38px;
        height: 38px;
    }

    .now-showing-poster {
        min-height: 240px;
    }

    .card-action-overlay {
        max-width: 100%;
        padding: 1rem;
    }

    .overlay-container {
        max-width: 100%;
        
    }

    .overlay-container h3 {
        font-size: 1rem;
    }

    .overlay-container .text-caption,
    .overlay-container .text-grey-lighten-2 {
        font-size: 0.72rem;
        line-height: 1.2;
    }

    .movie-btn {
        width: 100%;
        max-width: 150px;
        font-size: 0.75rem;
        height: 34px;
    }

    

    .info {
        width: auto;
    }
    .info-icon {
        width: 22px;
        height: 22px;
    }

    .info-text {
        font-size: 0.8rem;
    }
}

@media (max-width: 600px) {
    .slider_img {
        height: 620px;
    }

    .overlay-elements {
        padding: 0 1.5rem 1.5rem;
    }

    .hero_content {
        padding: 0.5rem;
    }

    .hero_content h1 {
        font-size: 1.9rem;
    }

    #rate_icon {
        width: 22px;
        height: 22px;
    }

    .trailer-btn,
    .movie-btn {
        max-width: 200px !important;
    }

    .movie-btn{
        margin-bottom: 2rem;
    }

    .overlay-elements .v-col {
        padding: 0;
    }

    .bottom-fade {
        height: 30vh;
    }

    .title{
        font-size:12px !important;
    }
    .overlay-gradient {
        background:
            linear-gradient(
                to top,
                rgba(0, 0, 0, 0.92) 0%,
                rgba(0, 0, 0, 0.75) 40%,
                rgba(0, 0, 0, 0.45) 70%,
                rgba(0, 0, 0, 0.35) 100%
            );
    }

    .now-showing-toolbar {
        gap: 0.75rem;
        margin-bottom: 1rem !important;
    }

    .v-tab {
        width: auto;
        min-width: 96px;
        padding: 0 14px;
    }

    .swiper-wrapper-relative {
        padding: 0 30px;
    }

    .movie-booking-card {
        margin: 0 2px;
    }

    .now-showing-poster {
        min-height: 210px;
    }

    .card-action-overlay {
        padding: 0.65rem;
    }

    .overlay-container h3 {
        font-size: 0.95rem;
    }

    .overlay-container .d-flex.align-center.mb-1,
    .overlay-container .text-grey-lighten-2 {
        margin-bottom: 0.15rem !important;
    }

    .movie-btn {
        height: 32px;
        font-size: 0.72rem;
    }

    .custom-nav-btn {
        top: 46%;
    }

    .info-icon {
        width: 18px;
        height: 18px;
    }

    .info-text {
        font-size: 0.7rem;
    }

    .info {
        gap: 2px;
    }
}
#movie-matchmaker {
    background-color: var(--bg-color); 
    overflow: hidden;
}

.ticket-animation-stage {
    position: relative;
    height: 300px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.animated-ticket {
    position: absolute;
    transition: all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0;
    transform: translateY(50px) translateX(0) rotate(0deg) scale(0.8);
}

.scroll-animate.is-visible .ticket-left {
    opacity: 1;
    transform: translateY(20px) translateX(-180px) rotate(-15deg) scale(1);
    z-index: 1;
}

.scroll-animate.is-visible .ticket-center {
    opacity: 1;
    transform: translateY(-20px) translateX(0) rotate(0deg) scale(1.1);
    z-index: 3;
}

.scroll-animate.is-visible .ticket-right {
    opacity: 1;
    transform: translateY(20px) translateX(140px) rotate(15deg) scale(1);
    z-index: 1;
}

.placeholder-ticket {
    width: 160px;
    height: 240px;
    background: #ffffff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed rgba(0,0,0,0.1); 
    background-clip: padding-box;
}

.placeholder-ticket.main-ticket {
    background: #f5f5f5;
    border: 2px dashed #ff5252;
}

@media (max-width: 600px) {
    .scroll-animate.is-visible .ticket-left {
        transform: translateY(10px) translateX(-80px) rotate(-15deg) scale(0.8);
    }
    .scroll-animate.is-visible .ticket-center {
        transform: translateY(-10px) translateX(0) rotate(0deg) scale(0.9);
    }
    .scroll-animate.is-visible .ticket-right {
        transform: translateY(10px) translateX(80px) rotate(15deg) scale(0.8);
    }
    .ticket-animation-stage {
        height: 250px;
    }
}
.svg-ticket-wrapper {
    width: 350px;   
    height: 400px; 
    display: flex;
    justify-content: center;
    align-items: center;
}

.svg-ticket-wrapper svg {
    width: 100%;
    height: 100%;
}

#custom-ticket-cta{
    margin-top:4.5rem;
    justify-content: center;
}

.scroll-indicator {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    pointer-events: none;
    transition: opacity 0.3s ease;
}

.modern-scroll-indicator {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--movie-btn);
}

.scroll-icon {
    animation: arrowMove 2s infinite;
}

@keyframes arrowMove {
    0%, 100% {
        transform: translateY(0);
        opacity: 0.7;
    }
    50% {
        transform: translateY(4px);
        opacity: 1;
    }
}
</style>
