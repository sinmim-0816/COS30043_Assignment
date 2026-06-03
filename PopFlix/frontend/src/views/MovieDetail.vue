<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Star, Calendar, ArrowLeft, CirclePlay, Timer, ChevronLeft, ChevronRight, Bell, CheckCircle, Info } from 'lucide-vue-next';

// Import other hook and components
import { useMovieDetails } from '../hook/useMovieDetails';
import { useReviews } from '../hook/useReviews';
import { useReminders } from '../hook/useReminder';
import { movieRepository } from '../services/movieRepository';
import { getGenreName } from '../utils/genre';
import { getCertImage } from '../utils/AgeRating';
import { useAppI18n } from '../utils/i18n';
import { useAuthStore } from '../stores/auth';
import FooterView from '@/components/FooterView.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const {
    movie,
    isLoading,
    writers,
    director,
    formattedBudget,
    formattedRevenue,
    productionCountries,
    status,
    loadMovieDetails,
    getImageURL,
    getLanguageName,
    getCertificate
} = useMovieDetails();
const { t, locale } = useAppI18n();

const { reviews, fetchReviews } = useReviews();
const { isProcessing, hasReminder, checkReminderStatus, setReminder } = useReminders();

const activeVideoIdx = ref(null);
const castTrack = ref(null);
const isAtStart = ref(true);
const isAtEnd = ref(false);
const fontSizeMode = ref(localStorage.getItem('app_font_size') || document.documentElement.dataset.fontSize || 'medium');
const fontSizeObserver = ref(null);
const dateLocale = computed(() => {
    if (locale.value === 'zh') return 'zh-CN';
    if (locale.value === 'ms') return 'ms-MY';
    return 'en-GB';
});

const syncFontSizeState = () => {
    fontSizeMode.value = localStorage.getItem('app_font_size') || document.documentElement.dataset.fontSize || 'medium';
};

const heroBackdropHeight = computed(() => {
    if (fontSizeMode.value === 'large') return '620px';
    if (fontSizeMode.value === 'small') return '540px';
    return '570px';
});
const formattedReleaseDate = computed(() => {
    if (!movie.value?.release_date) return t('common.nA');

    return new Intl.DateTimeFormat(dateLocale.value, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(movie.value.release_date));
});
const showStickyBuy = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const isSuccess = ref(true);

const handleScroll = () => {
    showStickyBuy.value = window.scrollY > 500;
};

const updateScrollButtons = () => {
    if (!castTrack.value) {
        return;
    }
    const el = castTrack.value;
    isAtStart.value = el.scrollLeft <= 5;
    isAtEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
};

const scrollCast = (direction) => {
    if (castTrack.value) {
        const scrollAmount = direction === 'left' ? -600 : 600;
        castTrack.value.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
};

const isReleased = computed(() => {
    if (!movie.value?.release_date) return false;
    return new Date(movie.value.release_date) <= new Date();
});

const handleBuyOrRemind = async () => {
    if (isReleased.value) {
        const response = await movieRepository.getMovieShowtimes(route.params.id);
        const showtimes = response?.data ?? [];
        const firstShowtime = Array.isArray(showtimes) ? showtimes[0] : null;

        if (!firstShowtime?.id) {
            console.warn('No showtimes available for this movie yet.');
            return;
        }

        router.push({
            name: 'TicketBooking',
            params: {
                movieId: route.params.id,
                showtimeId: firstShowtime.id,
            },
            query: {
                exp: firstShowtime.experience?.exp_key || 'DOLBY',
            },
        });
    } else {
        if (!authStore.user) {
            router.push({
                name: 'Login',
                query: { redirect: route.fullPath }
            });
            return;
        }

        try {
            await setReminder(route.params.id);
            toastMessage.value = "Reminder set! We will email you 1 day before release.";
            isSuccess.value = true;
            showToast.value = true;
        } catch (error) {
            console.log("Error sending reminder: ",error);
            toastMessage.value = "Failed to set reminder. Please try again.";
            isSuccess.value = false;
            showToast.value = true;
        }
    }
};

const activeVideo = computed(() => {
    if (activeVideoIdx.value === null || !movie.value?.allVideos) {
        return null;
    }
    return movie.value.allVideos[activeVideoIdx.value];
});

const selectVideo = (index) => {
    activeVideoIdx.value = index;
};

const closePlayer = () => {
    activeVideoIdx.value = null;
};

const sectionRef = ref(null);
const isVisible = ref(false);

const initObserver = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                isVisible.value = true;
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    if (sectionRef.value) {
        observer.observe(sectionRef.value);
    }
};

onMounted(async () => {
      syncFontSizeState();
      fontSizeObserver.value = new MutationObserver(() => {
          syncFontSizeState();
      });
      fontSizeObserver.value.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-font-size'],
      });

      const id = route.params.id;
      await loadMovieDetails(id);
      await fetchReviews(id);
      await checkReminderStatus(id);
    setTimeout(() => {
        initObserver();
        updateScrollButtons();

        if (castTrack.value) {
            castTrack.value.addEventListener('scroll', updateScrollButtons);
        }
    }, 500);
    window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
    fontSizeObserver.value?.disconnect();
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
})

watch(
    () => route.params.id,
    async (newId) => {
        if (newId) {
            activeVideoIdx.value = null;
            isVisible.value = false;
            await loadMovieDetails(newId);
            await fetchReviews(newId);
            await checkReminderStatus(newId);
            setTimeout(() => {
                initObserver();
            }, 100);
        }
    }
)

const playFirstTrailer = () => {
    if (movie.value?.allVideos?.length > 0) {
        selectVideo(0);
        isVisible.value = true;

        setTimeout(() => {
            const playerElement = document.querySelector('.player-area');
            if (playerElement) {
                playerElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 300);
    }
};



const getClipClass = (index) => {
    const classes = ['clip-1', 'clip-2', 'clip-3', 'clip-4'];
    return classes[index % 4];
};
</script>

<template>
    <v-snackbar 
        v-model="showToast" 
        location="top" 
        :timeout="3000" 
        color="transparent" 
        elevation="0" 
        variant="flat"
        class="mt-4"
    >
        <div class="d-flex justify-center w-100">
            <div class="premium-toast-badge d-flex align-center gap-2" :class="isSuccess ? 'success' : 'not-success'">
                <component :is="isSuccess ? CheckCircle : Info" size="20" class="text-white" />
                <span class="badge-text">{{ toastMessage }}</span>
            </div>
        </div>
    </v-snackbar>
    <template v-if="isLoading">
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
    <v-app v-else-if="movie" full-height class="container-fluid m-0 p-0">
        <v-btn icon variant="tonal" color="white" class="back-btn mt-md-3 mt-1" @click="router.back()">
            <ArrowLeft />
        </v-btn>
        <v-fade-transition>
            <v-btn 
                v-if="showStickyBuy" 
                variant="flat" 
                class="movie-btn sticky-btn py-4 fs-6 mt-3 rounded-2"
                @click="handleBuyOrRemind"
                :disabled="(!isReleased && hasReminder) || isProcessing"
            >
                <Bell v-if="!isReleased" class="me-2"/>
                {{ isReleased ? t('movieDetail.buyNow') : (hasReminder ? t('movieDetail.reminderSet') : t('movieDetail.remindMe')) }}
            </v-btn>
        </v-fade-transition>
        <v-main>
            <section class="hero-section">
                <v-img :src="getImageURL(movie?.backdrop, 'original')" :height="heroBackdropHeight" cover>
                    <div class="overlay-gradient"></div>
                    <div class="hero-overlay-bottom"></div>
                    <div class="hero-overlay-left"></div>

                    <v-container class="relative-z container-fluid overlay-content" width="100vw">
                        <v-row align="end" class="mb-5 hero-row">
                            <v-col cols="12" md="4" lg="3" class="hero-poster-col flex-start">
                                <div class="position-relative d-inline-block hero-poster-wrap">
                                    <v-img :src="getImageURL(movie?.poster)" class="rounded-4 elevation-24 hero-poster"
                                        :aspect-ratio="2 / 3" width="250"></v-img>
                                    <v-btn icon color="transparent" size="large" class="floating-play-btn"
                                        elevation="12" @click="playFirstTrailer" :disabled="!movie?.allVideos?.length">
                                        <CirclePlay size="45" color="red" />
                                        <v-tooltip activator="parent" location="top">{{ t('movieDetail.watchTrailer') }}</v-tooltip>
                                    </v-btn>
                                </div>
                            </v-col>
                            <v-col cols="12" md="8" lg="9" class="hero-details-col">
                                <div class="ps-md-8">
                                    <div class="d-flex align-center gap-3 mb-2">
                                        <v-img :src="getCertImage(getCertificate(movie))" width="45" height="45" contain
                                            class="flex-grow-0"></v-img>
                                        <v-divider vertical class="mx-2" thickness="2" color="white"></v-divider>
                                        <v-chip variant="tonal" color="white" size="small"
                                            class="text-uppercase font-weight-bold">
                                            {{ getLanguageName(movie?.language) }}
                                        </v-chip>
                                    </div>
                                    <h1 class="text-h2 font-weight-black text-white mb-2">{{ movie?.title }}</h1>
                                    <h4 class="fs-6 font-italic text-white ps-2 italic-quote tagline">
                                        "{{ movie?.tagline || movie?.overview.split('.')[0] + '.' }}"
                                    </h4>
                                    <div class="d-flex align-center gap-2 mb-8 text-white">
                                        <span>
                                            <Timer size="20" />
                                        </span>
                                        <span>{{ movie?.runtime }}</span>
                                        <span>•</span>
                                        <span>
                                            <Calendar size="20" />
                                        </span>
                                        <span>{{ formattedReleaseDate }}</span>
                                    </div>
                                    <div class="d-flex flex-wrap gap-2 my-3">
                                        <v-chip v-for="id in movie?.genres" :key="id" variant="tonal"
                                            class="font-weight-bold">
                                            {{ getGenreName(id) }}
                                        </v-chip>
                                    </div>
                                    <div class="d-flex align-center gap-6 mb-8 mt-6">
                                        <div class="d-flex flex-column">
                                            <span class="text-overline text-color fw-bold mb-n1">{{ t('movieDetail.rating') }}</span>
                                            <div class="d-flex align-center">
                                                <Star size="28" fill="#f5c518" color="#f5c518" class="me-2" />
                                                <span class=" fs-2 font-weight-black text-white">{{
                                                    movie?.vote_average.toFixed(1) }}</span>
                                                <span class="text-h6 text-grey-darken-1 ms-1 mt-2">/10</span>
                                            </div>
                                        </div>

                                        <v-divider vertical class="mx-4" thickness="1" color="grey"></v-divider>

                                        <div class="d-flex flex-column">
                                            <span class="text-overline text-color mb-1 fw-bold">{{ t('movieDetail.popularity') }}</span>
                                            <div class="d-flex align-center">
                                                <v-icon size="28" color="red-accent-3" class="me-2">mdi-fire</v-icon>
                                                <span class="fs-2 font-weight-bold text-white">{{
                                                    Math.round(movie?.popularity) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="d-flex gap-4 mt-3">
                                        <v-row>
                                            <v-btn 
                                                variant="flat" 
                                                class="movie-btn py-4 fs-6 rounded-2" 
                                                @click="handleBuyOrRemind"
                                                :disabled="(!isReleased && hasReminder) || isProcessing"
                                            >
                                                <Bell v-if="!isReleased" class="me-2"/>
                                                {{ isReleased ? t('movieDetail.buyNow') : (hasReminder ? t('movieDetail.reminderSet') : t('movieDetail.remindMe')) }}
                                            </v-btn>
                                        </v-row>
                                    </div>
                                </div>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-img>
            </section>
            <section>
                <v-container fluid>
                    <h2 class="mb-3">{{ t('movieDetail.overview') }}</h2>
                    <v-row class="synopsis">
                        <v-col cols="12" lg="8" class="pe-lg-12">
                            <div class="synopsis-card pa-1">
                                <p class="text-body-1 text-grey-lighten-1 overview-text">
                                    {{ movie?.overview }}
                                </p>
                            </div>
                        </v-col>
                    </v-row>
                </v-container>
            </section>
            <section v-if="movie?.allVideos?.length" ref="sectionRef" class="film-strip-section reveal-on-scroll"
                :class="{ 'is-visible': isVisible }">
                <div class="text-center mb-4">
                    <h2>{{ t('movieDetail.trailersAndClips') }}</h2>
                </div>

                <div class="filmstrip-outer" :class="{ 'is-projecting': activeVideoIdx !== null }">
                    <div class="sprocket-row top ">
                        <div class="sprocket-track">
                            <div v-for="n in 90" :key="'t' + n" class="sprocket-hole"></div>
                        </div>
                    </div>

                    <div class="frames-track" :class="{ 'has-active': activeVideoIdx !== null }">
                        <div v-for="(video, index) in movie.allVideos" :key="index" class="frame"
                            :class="{ 'active': activeVideoIdx === index }" @click="selectVideo(index)">
                            <div class="frame-inner">
                                <div class="frame-bg" :style="{ backgroundImage: `url(${video.thumbnail})` }"></div>
                                <div class="frame-overlay"></div>

                                <div v-if="video.isOfficial" class="top-pick-badge">Official</div>

                                <div class="play-overlay">
                                    <div class="play-circle">
                                        <v-icon color="white" size="25">mdi-play</v-icon>
                                    </div>
                                </div>

                                <div class="frame-info mb-2">
                                    <p class="fw-bold mb-0">{{ String(index + 1).padStart(2, '0') }}</p>
                                    <p class="frame-title">{{ video.name }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="sprocket-row bottom">
                        <div class="sprocket-track">
                            <div v-for="n in 90" :key="'b' + n" class="sprocket-hole"></div>
                        </div>
                    </div>
                </div>

                <v-expand-transition>
                    <div v-if="activeVideo" class="player-area visible px-4">
                        <v-container>
                            <div class="player-header">
                                <div class="player-now">
                                    <div class="now-dot"></div>
                                    <span class="now-label">{{ t('movieDetail.nowProjecting') }}</span>
                                    <span class="now-title">{{ activeVideo.name }}</span>
                                </div>
                                <v-btn icon variant="text" color="grey-lighten-1" @click="closePlayer">
                                    <v-icon>mdi-close</v-icon>
                                </v-btn>
                            </div>
                            <div class="player-frame elevation-24">
                                <iframe :src="`https://www.youtube.com/embed/${activeVideo.key}?autoplay=1&rel=0`"
                                    allow="autoplay; encrypted-media" allowfullscreen></iframe>
                            </div>
                        </v-container>
                    </div>
                </v-expand-transition>
            </section>
            <section v-if="movie">
                <h2>{{ t('movieDetail.topBilledCast') }}</h2>
                <v-container>
                    <v-row justify="center">
                        <v-col cols="12" lg="10">
                            <div class="carousel-main-row">
                                <v-btn icon variant="tonal"  @click="scrollCast('left')"
                                    class="nav-btn-side" :disabled="isAtStart">
                                    <ChevronLeft size="24" />
                                </v-btn>

                                <div class="cast-carousel-wrapper" ref="castTrack">
                                    <div v-for="actor in movie?.actors" :key="actor.name" class="cast-card">
                                        <v-avatar size="120" class="mb-4 cast-avatar">
                                            <v-img
                                                :src="getImageURL(actor.profile) || 'https://via.placeholder.com/150'"
                                                cover></v-img>
                                        </v-avatar>
                                        <div class="text-center px-2">
                                            <div class="text-subtitle-1 font-weight-bold lh-1 actor-name">{{
                                                actor.name }}</div>
                                            <div class="text-caption text-color character-name">{{
                                                actor.character
                                                }}</div>
                                        </div>
                                    </div>
                                </div>

                                <v-btn icon variant="tonal" @click="scrollCast('right')"
                                    class="nav-btn-side" :disabled="isAtEnd">
                                    <ChevronRight size="24" />
                                </v-btn>
                            </div>
                        </v-col>
                    </v-row>
                </v-container>
            </section>
            <section v-if="movie?.backdrops?.length">
                <div class="text-center mb-3">
                    <h2 class="section-title">{{ t('movieDetail.officialPosters') }}</h2>
                </div>
                <v-container fluid>
                    <div class="dynamic-poster-flex" :class="{ 'center-justify': movie.backdrops.length <= 3 }">
                        <div v-for="(url, index) in movie.backdrops" :key="index" class="poster-wrapper">
                            <div class="poster-card">
                                <v-img
                                    :src="getImageURL(url)"
                                    cover
                                    width="400px"
                                    class="poster-image rounded-lg shadow-24"
                                />
                            </div>
                        </div>
                    </div>
                </v-container>
            </section>
            <section v-if="movie" class="production-section">
                <v-container fluid>
                    <h2 class="mb-4">{{ t('movieDetail.productionDetails') }}</h2>
                    <v-row class="ledger-container">
                        <v-col cols="12" md="6">
                            <table class="ledger-table">
                                <tbody>
                                    <tr>
                                        <th class="px-2">{{ t('movieDetail.director') }}</th>
                                        <td class="px-2">{{ director || t('common.nA') }}</td>
                                    </tr>
                                    <tr>
                                        <th class="px-2">{{ t('movieDetail.writers') }}</th>
                                        <td class="px-2">{{ writers }}</td>
                                    </tr>
                                    <tr>
                                        <th class="px-2">{{ t('movieDetail.originalLanguage') }}</th>
                                        <td class="px-2">{{ getLanguageName(movie.language) }}</td>
                                    </tr>
                                    <tr>
                                        <th class="px-2">{{ t('movieDetail.productionCountries') }}</th>
                                        <td class="px-2">{{ productionCountries || t('common.nA') }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </v-col>

                        <v-col cols="12" md="6" class="ps-md-10">
                            <table class="ledger-table">
                                <tbody>
                                    <tr>
                                        <th class="px-2">{{ t('movieDetail.budget') }}</th>
                                        <td class="px-2">{{ formattedBudget }}</td>
                                    </tr>
                                    <tr>
                                        <th class="px-2">{{ t('movieDetail.revenue') }}</th>
                                        <td class="px-2">{{ formattedRevenue }}</td>
                                    </tr>
                                    <tr>
                                        <th class="px-2">{{ t('movieDetail.status') }}</th>
                                        <td><v-chip size="small" color="red" variant="flat"
                                                class="font-weight-bold me-2">{{
                                                    status }}</v-chip></td>
                                    </tr>
                                    <tr>
                                        <th class="px-2">{{ t('movieDetail.studios') }}</th>
                                        <td>
                                            <div class="d-flex flex-wrap gap-2 justify-end me-2">
                                                <span v-for="studio in movie.production_companies" :key="studio.id"
                                                    class="studio-tag">
                                                    {{ studio.name }}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </v-col>
                    </v-row>
                </v-container>
            </section>

            <section v-if="movie && reviews && reviews.length > 0" class="press-section">
                <div class="text-center">
                    <h2>{{ t('movieDetail.cinephileReviews') }}</h2>
                </div>

                <v-container fluid>
                    <div class="news-wrap">
                        <div v-for="(review, index) in reviews" :key="review.id" class="clipping"
                            :class="getClipClass(index)">

                            <div class="clip-tape" :class="index % 2 !== 0 ? 't-alt' : ''"></div>
                            <h3 class="clip-headline">{{ review.title }}</h3>
                            <p class="clip-byline d-flex align-center gap-1">
                                {{ review.user.firstName }} •
                                <span class="d-flex">
                                    <Star v-for="n in 5" :key="n" size="16"
                                        :fill="n <= review.rating ? '#f5c518' : 'transparent'"
                                        :color="n <= review.rating ? '#f5c518' : '#ccc'" />
                                </span>
                            </p>
                            <p class="clip-body">"{{ review.comment }}"</p>
                            <div class="clip-stamp" :class="review.rating >= 4 ? 'stamp-green' : 'stamp-red'">
                                {{ review.rating >= 4 ? t('movieDetail.recommended') : t('movieDetail.reviewed') }}
                            </div>
                        </div>
                    </div>
                </v-container>
            </section>
        </v-main>
        <FooterView/>
    </v-app>
</template>

<style scoped>
.hero-overlay-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to top, var(--bg-color) 0%, transparent 50%);
}

.hero-overlay-left {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:var(--overlay-details);

}

.hero-poster {
    border: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateX(90px);
}

.relative-z {
    position: relative;
    z-index: 5;
}

.overlay-gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom right, rgba(10, 14, 23, 0.219) 0%, rgba(10, 14, 23, 0.4) 100%);
    z-index: 2;
}

.certification-badge {
    width: 40px;
    height: 40px;
}

.overlay-content {
    transform: translateY(145px);
}

.hero-row {
    align-items: flex-end;
}

.hero-poster-col {
    display: flex;
    justify-content: flex-start;
}

.hero-poster-wrap {
    width: 100%;
    max-width: 250px;
}

.tagline {
    width: 600px;
}

.position-relative {
    position: relative !important;
}

.floating-play-btn {
    position: absolute !important;
    bottom: -20px;
    left: 50%;
    transform: translateX(100%);
    z-index: 10;
    transition: all 0.3s ease;
    border-radius: 50%;
}

.floating-play-btn:hover {
    transform: translateX(100%) scale(1.1);

}

.floating-play-btn::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: inherit;
    animation: pulse-red 2s infinite;
    z-index: -1;
}

@keyframes pulse-red {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
    }

    70% {
        transform: scale(1.2);
        box-shadow: 0 0 0 10px rgba(255, 82, 82, 0);
    }

    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
    }
}

.synopsis {
    align-self: center;
    justify-content: center;
}

.synopsis-section {
    background: linear-gradient(to bottom, #121212, #0a0a0a);
}

.overview-text {
    line-height: 1.6 !important;
    letter-spacing: 0.5px;
    font-size: 1.1rem !important;
    text-align: justify;
    color:var(--text-color);
}

.sprocket-row {
    display: flex;
    background: #363636;
    padding: 6px 0;
    gap: 20px;
    overflow: hidden;
    margin: 0px 95px
}

.sprocket-hole {
    width: 16px;
    height: 12px;
    border-radius: 3px;
    background: var(--hole-color);
    flex-shrink: 0;
}

.frames-track {
    display: flex;
    gap: 6px;
    background: var(--frame-bg);
    padding: 12px 0;
    overflow-x: auto;
    scroll-behavior: smooth;
    margin: 0px 95px;
    justify-content: center;
}

.frames-track::-webkit-scrollbar {
    display: none;
    min-width: 100%;
}

.frame {
    flex-shrink: 0;
    width: 239px;
    cursor: pointer;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.frame.active {
    width: 340px;
}

.frame-inner {
    height: 240px;
    position: relative;
    overflow: hidden;
}

.frame-bg {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    transition: all 0.5s ease;
    transition: 0.4s;
    filter: brightness(1) grayscale(0);
}

.frame:hover .frame-bg {
    filter: brightness(0.9);
    transform: scale(1.05);
}

.frames-track.has-active .frame .frame-bg {
    filter: brightness(0.3) blur(1px) !important;
}

.frames-track.has-active .frame.active .frame-bg {
    filter: brightness(1.2) blur(0px) grayscale(0) !important;
    transform: scale(1.02);
    box-shadow: 0 0 40px rgba(229, 57, 53, 0.3);
}

.frame-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 20%, transparent);
}

.top-pick-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #c9a84c;
    color: #0d0d12;
    font-size: 9px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 2px;
    text-transform: uppercase;
}

.play-circle {
    width: 35px;
    height: 35px;
    background: rgba(229, 57, 53, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: 0.3s;
    position: absolute;
    bottom: 10px;
    left: 15px;
    right: 15px;
}

.frame:hover .play-circle,
.frame.active .play-circle {
    opacity: 1;
    transform: scale(1.1);
}

.frame-info {
    position: absolute;
    bottom: 35px;
    left: 15px;
    right: 15px;
}

.frame-title {
    font-size: 14px;
    color: #fff;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.player-area {
    margin-top: 2rem;
    background: var(--player-bg);
    margin: 0px 95px;
    display: flex;
    justify-content: center;
}

.player-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
}

.player-now {
    display: flex;
    align-items: center;
    gap: 10px;
}

.now-dot {
    width: 8px;
    height: 8px;
    background: #e53935;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
}

.now-label {
    font-size: 11px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.now-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
    margin-left: 5px;
}

.player-frame {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #222;
}

.player-frame iframe {
    width: 100%;
    height: 450px;
    border: 0;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0.3;
    }

    100% {
        opacity: 1;
    }
}

@keyframes filmEntrance {
    from {
        opacity: 0;
        transform: translateY(50px) scale(0.95);
        filter: blur(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }
}

.reveal-on-scroll {
    opacity: 0;
    transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.reveal-on-scroll.is-visible {
    animation: filmEntrance 1s forwards;
}

.is-visible .frame {
    animation: framePop 0.6s backwards;
}

.is-visible .frame:nth-child(1) {
    animation-delay: 0.2s;
}

.is-visible .frame:nth-child(2) {
    animation-delay: 0.3s;
}

.is-visible .frame:nth-child(3) {
    animation-delay: 0.4s;
}

.is-visible .frame:nth-child(4) {
    animation-delay: 0.5s;
}

.is-visible .frame:nth-child(5) {
    animation-delay: 0.6s;
}

@keyframes framePop {
    from {
        opacity: 0;
        transform: translateX(20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.dynamic-poster-flex {
    display: flex;
    flex-wrap: wrap;
    gap: 25px;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    justify-content: center;
}

.center-justify {
    justify-content: center;
}

.poster-wrapper {
    flex: 1 300px;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    justify-content: center;
}

.poster-card {
    border-radius: 5px;
    display: flex;
    width: 100%;
}

.poster-card:hover .poster-overlay {
    opacity: 1;
}

.poster-card .v-img {
    width: 100% !important;
    max-width: 100% !important;
    flex:1;
    display: block;
    margin: 0 auto;
}

@media (max-width: 600px) {
    .poster-wrapper {
        flex: 1 1 100%;
        max-width: 100%;
    }

    .dynamic-poster-flex {
        gap: 15px;
        justify-content: center;
    }

    .poster-card {
        max-width: 100%;
    }

    .poster-card .v-img {
        width: 100% !important;
        max-width: 100% !important;
    }
}

.sprocket-track {
    display: flex;
    gap: 20px;
    width: max-content;
}

@keyframes project-film {
    0% {
        transform: translateX(0);
    }

    100% {
        transform: translateX(-50%);
    }
}

.is-projecting .sprocket-track {
    animation: project-film 10s linear infinite;
}

.is-projecting .sprocket-row {
    border-color: #e53935;
    transition: border-color 0.5s ease;
}

.sprocket-track {
    will-change: transform;
    transition: transform 0.5s ease-out;
}

.carousel-main-row {
    display: flex;
    align-items: center;
    gap: 20px;
    width: 85vw;
    
}

.carousel-main-row img {
    user-select: none;
}

.nav-btn-side {
    flex-shrink: 0;
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transition: 0.3s;
    z-index: 10;
}

.nav-btn-side:hover {
    background-color: rgba(255, 82, 82, 0.2);
    border-color: #ff5252;
    color: #ff5252
}

.cast-carousel-wrapper {
    flex-grow: 1;
    display: flex;
    gap: 24px;
    overflow-x: auto;
    scroll-behavior: smooth;
    padding: 20px 0;
    scrollbar-width: none;
    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
}

.cast-carousel-wrapper::-webkit-scrollbar {
    display: none;
}

.cast-card {
    flex: 0 0 140px;
    transition: transform 0.3s ease;
}

.cast-card .v-avatar .v-img {
    user-select: none;
}

.production-section {
    background: var(--bg-color);
    margin: 0px 95px
}

.ledger-table {
    width: 100%;
    border-collapse: collapse;
}

.ledger-table tr {
    border-bottom: 1px solid var(--tr-color);
    transition: background 0.3s ease;
}

.ledger-table th {
    text-align: left;
    padding: 20px 0;
    color: var(--th-color);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 700;
}

.ledger-table td {
    padding: 20px 0;
    color: var(--td-color);
    font-size: 0.95rem;
    font-weight: 500;
    text-align: right;
}

.studio-tag {
    font-size: 0.75rem;
    color: #888;
    background: var(--studio-color);
    padding: 2px 8px;
    border-radius: 4px;
    display: inline-block;
}

@media (min-width: 960px) {
    .ledger-container {
        position: relative;
    }

    .ledger-container::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 10%;
        bottom: 10%;
        width: 1px;
        background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1), transparent);
    }
}

@media (max-width: 959px) {
    .ledger-table th {
        width: 40%;
    }
}

@media (max-width: 1264px) {
    .overlay-content {
        transform: translateY(110px);
    }

    .hero-poster {
        transform: translateX(40px);
    }

    .tagline {
        width: 100%;
    }

    .frames-track,
    .sprocket-row,
    .player-area,
    .production-section,
    .news-wrap {
        margin-left: 48px;
        margin-right: 48px;
    }
}

@media (max-width: 960px) {

    .overlay-content {
        transform: translateY(78px);
    }

    .hero-overlay-left,
    .overlay-gradient {
        background: linear-gradient(to bottom, rgba(10, 14, 23, 0.08) 0%, rgba(10, 14, 23, 0.45) 100%);
    }

    .frames-track,
    .sprocket-row,
    .player-area,
    .production-section,
    .news-wrap {
        margin-left: 24px;
        margin-right: 24px;
    }

    .carousel-main-row {
        width: 100%;
        gap: 12px;
    }

    .cast-carousel-wrapper {
        gap: 16px;
        padding: 16px 0;
        mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
    }

    .cast-card {
        flex: 0 0 120px;
    }

    .nav-btn-side {
        width: 40px;
        height: 40px;
    }

    .sticky-btn {
        right: 16px;
        top: 72px;
        width: 132px;
    }

    .hero-poster-col {
        margin-bottom: 20px;
    }

    .hero-poster-wrap {
        max-width: 220px;
        margin: 0 auto;
    }

    .hero-poster {
        display: none;
    }

    .floating-play-btn{
        display:none;
    }
}

@media (max-width: 600px) {
    .hero-section :deep(.v-img) {
        height: auto !important;
        padding:30px
    }

    .overlay-content {
        transform: translateY(54px);
    }

    .hero-row {
        align-items: flex-start;
    }

    .hero-poster-col {
        justify-content: center;
        margin-bottom: 16px;
    }

    .hero-poster-wrap {
        max-width: 180px;
    }

    .overlay-content h1 {
        font-size: 2rem !important;
        line-height: 1.08;
    }

    .tagline {
        font-size: 0.80rem !important;
        width: 90%;
        padding-left: 0 !important;
    }

    .overlay-content .d-flex.align-center.gap-6 {
        gap: 16px !important;
        flex-wrap: wrap;
    }

    .overlay-content .d-flex.gap-4.mt-3 {
        width: 100%;
    }

    .hero-details-col {
        text-align: left;
    }

    .overlay-content .movie-btn {
        width: 100%;
    }

    .frames-track {
        margin-left: 16px;
        margin-right: 16px;
        padding: 10px 0;
        justify-content: flex-start;
    }

    .sprocket-row {
        margin-left: 16px;
        margin-right: 16px;
        gap: 10px;
    }

    .frame {
        width: 180px;
    }

    .frame.active {
        width: 240px;
    }

    .frame-inner {
        height: 210px;
    }

    .player-area {
        margin-left: 16px;
        margin-right: 16px;
    }

    .player-frame iframe {
        height: 240px;
    }

    .carousel-main-row {
        align-items: stretch;
        gap: 12px;
        width: 100%;
    }

    .nav-btn-side {
        align-self: center;
    }

    .cast-carousel-wrapper {
        width: 100%;
        gap: 12px;
        padding: 10px 0;
    }

    .cast-card {
        flex: 0 0 104px;
    }

    .cast-card .v-avatar {
        width: 88px !important;
        height: 88px !important;
    }

    .production-section {
        margin-left: 16px;
        margin-right: 16px;
    }

    .ledger-table th,
    .ledger-table td {
        padding: 14px 0;
        font-size: 0.85rem;
    }

    .news-wrap {
        margin-left: 16px;
        margin-right: 16px;
        padding: 24px 0;
        gap: 18px;
    }

    .clipping {
        width: 100%;
        max-width: 320px;
        min-height: auto;
    }

    .clip-headline {
        font-size: 1.05rem;
    }

    .clip-body {
        font-size: 0.8rem;
    }

    .sticky-btn {
        top: 16px;
        right: 16px;
        width: auto;
        min-width: 120px;
        padding-inline: 16px;
    }
}

.press-section {
    background: #0d0d12;
    overflow: hidden;
}

.news-wrap {
    position: relative;
    min-height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    flex-wrap: wrap;
    padding: 40px 0;
    margin: 0 95px;
}

.clipping {
    background: #f5f0e0f2;
    border: 0.5px solid #ddd;
    padding: 20px;
    width: 280px;
    min-height: 280px;
    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    position: relative;
}

.clip-1 {
    transform: rotate(-3deg) translateY(10px);
}

.clip-2 {
    transform: rotate(2deg) translateY(-15px);
}

.clip-3 {
    transform: rotate(-1deg) translateY(5px);
}

.clip-4 {
    transform: rotate(4deg) translateY(-5px);
}

.clipping:hover {
    transform: rotate(0deg) scale(1.01) translateY(-20px);
    z-index: 50;
    box-shadow: 15px 25px 40px rgba(0, 0, 0, 0.7);
}

.clip-headline {
    font-family: 'Times New Roman', serif;
    font-size: 1.2rem;
    font-weight: 900;
    color: #111;
    line-height: 1.1;
    margin-bottom: 10px;
    border-bottom: 2px solid #111;
    padding-bottom: 8px;
}

.clip-byline {
    font-size: 0.65rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
}

.clip-body {
    font-family: Georgia, serif;
    font-size: 0.85rem;
    color: #333;
    line-height: 1.5;
    font-style: italic;
}

.clip-rating {
    font-size: 0.7rem;
    color: #c9a84c;
    margin-top: 15px;
    font-weight: bold;
}

.clip-tape {
    position: absolute;
    top: -10px;
    left: 40%;
    width: 60px;
    height: 20px;
    background: rgba(255, 54, 54, 0.3);
    backdrop-filter: blur(2px);
    transform: rotate(-2deg);
}

.t-alt {
    transform: rotate(4deg);
    left: 30%;
}

.clip-stamp {
    position: absolute;
    bottom: 15px;
    right: 10px;
    font-size: 0.8rem;
    font-weight: 900;
    padding: 2px 6px;
    border: 2px solid;
    border-radius: 4px;
    text-transform: uppercase;
    opacity: 0.6;
    transform: rotate(-15deg);
}

.stamp-green {
    color: #2a9d5c;
    border-color: #2a9d5c;
}

.stamp-red {
    color: #e53935;
    border-color: #e53935;
}

.eyebrow {
    font-size: 0.8rem;
    letter-spacing: 3px;
    color: #c9a84c;
    text-transform: uppercase;
}

.big-title span {
    color: #e53935;
}

@media (max-width: 960px) {
    .news-wrap {
        flex-direction: column;
        align-items: center;
    }

    .clipping {
        transform: none !important;
        margin-bottom: 30px;
    }
}

.sticky-btn {
    position: fixed;
    top: 60px;
    right: 30px;
    z-index: 100;
    width: 150px
}

</style>
