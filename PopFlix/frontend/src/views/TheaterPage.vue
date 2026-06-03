<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, MapPin, Copy, Ticket, Car, Accessibility, Coffee, Tv, Wifi, Utensils, Baby, ChevronDown } from 'lucide-vue-next';
import { useRouter, useRoute } from 'vue-router';

// Imports other hook and components
import { useCinemas } from '../hook/useCinemas';
import FooterView from '@/components/FooterView.vue';
import { useFaqs } from '../hook/useFaqs';
import { resolveBackendAssetPath } from '../utils/FormatPicture';
import { useAppI18n } from '../utils/i18n';

const { cinemas, isLoading } = useCinemas();
const { t } = useAppI18n();
const router = useRouter();
const route=useRoute();

console.log(cinemas.value);
const mapContainer = ref(null);
const map = ref(null);
const markers = ref({});
const tileLayer = ref(null);
const themeObserver = ref(null);
const activeIndex = ref(0);
const { allFaqs, faqCategories, isLoadingFaqs } = useFaqs();
const activeFaqCategory = ref('');
const scrollToFaq = ref(false);
const expandedFaqId = ref(null);

const scrollToFaqSection = async () => {
    await nextTick();

    requestAnimationFrame(() => {
        const el = document.getElementById('faq-section');
        if (!el) return;

        const top = el.getBoundingClientRect().top + window.scrollY - 80;

        window.scrollTo({
            top,
            behavior: 'smooth',
        });
    });
};

const getAmenityIcon = (label) => {
  const icons = {
    'Free Parking': Car, 'Parking': Car,
    'Accessible': Accessibility,
    'Café': Coffee, 'Snack Bar': Coffee, 'Food Court': Utensils,
    'Lounge': Tv,
    'Family Zone': Baby,
    'Free WiFi': Wifi
  };
  return icons[label] || MapPin;
};

const getIsDarkTheme = () => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
};

watch(
  () => route.query,
  async (query) => {
    if (query.faqId) {
      expandedFaqId.value = Number(query.faqId);

      if (query.category) {
        activeFaqCategory.value = query.category;
      }

      scrollToFaq.value = true;
    }
  },
  { immediate: true }
);

const getTileUrl = () => {
    return getIsDarkTheme()
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
};

const syncMapTheme = () => {
    if (!map.value) return;

    const nextUrl = getTileUrl();
    const currentUrl = tileLayer.value?.options?.url;
    if (currentUrl === nextUrl) return;

    if (tileLayer.value) {
        map.value.removeLayer(tileLayer.value);
    }

    tileLayer.value = L.tileLayer(nextUrl, {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map.value);
};

const initMap = () => {
    if (!mapContainer.value || map.value) return;
    
    map.value = L.map(mapContainer.value).setView([1.5303, 110.3653], 12);
    
    tileLayer.value = L.tileLayer(getTileUrl(), {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map.value);

    cinemas.value.forEach((cinema, index) => {
        const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<div class="marker-pulse" style="background-color: ${getThemeColor(index)}"></div>
                   <div class="marker-dot" style="background-color: ${getThemeColor(index)}"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const popupContent = `
            <div class="custom-leaflet-popup">
                <img src="${resolveBackendAssetPath(cinema.image_path)}" alt="${cinema.name}" class="popup-img" />
                <div class="popup-info">
                    <h4 class="popup-title">${cinema.name}</h4>
                    <p class="popup-subtitle">${cinema.location_address?.split(',')[0] ?? ''}</p>
                </div>
            </div>
        `;

        const marker = L.marker([cinema.latitude, cinema.longitude], { icon: customIcon })
            .addTo(map.value)
            .bindPopup(popupContent, {
                className: 'premium-popup',
                minWidth: 220,
                closeButton: false, 
                offset: [0, -10] 
            })
            .on('click', () => selectCinema(index));
            
        markers.value[index] = marker;
    });

    if (cinemas.value.length > 0) {
        selectCinema(0);
    }
};


watch([cinemas, isLoading, isLoadingFaqs], async ([newCinemas, loadingCinemas, loadingFaqs]) => {
    if (newCinemas.length > 0 && !loadingCinemas && !loadingFaqs) {
        await nextTick();

        initMap();

        const cinemaId = route.query.cinema;

        if (cinemaId) {
            const index = newCinemas.findIndex(
                c => String(c.id) === String(cinemaId)
            );

            if (index !== -1) {
                selectCinema(index);
            }
        }

        if (scrollToFaq.value && route.query.faqId) {
            scrollToFaq.value = false;
            await scrollToFaqSection();
        }
    }
}, { immediate: true });

onMounted(() => {
    themeObserver.value = new MutationObserver(() => {
        syncMapTheme();
    });

    themeObserver.value.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });

    window.addEventListener('storage', syncMapTheme);
});

onUnmounted(() => {
    themeObserver.value?.disconnect();
    window.removeEventListener('storage', syncMapTheme);
});

const selectCinema = (index) => {
    activeIndex.value = index;
    const cinema = cinemas.value[index];
    
    if (map.value) {
        const targetZoom = 15;

        const targetPoint = map.value.project([cinema.latitude, cinema.longitude], targetZoom);
        
        targetPoint.y -= 100;
        
        const targetLatLng = map.value.unproject(targetPoint, targetZoom);
        
        map.value.flyTo(targetLatLng, targetZoom, {
            animate: true,
            duration: 1.5
        });

        if (markers.value[index]) {
            markers.value[index].openPopup();
        }

        Object.keys(markers.value).forEach(key => {
            const el = markers.value[key].getElement();
            if (el) {
                if (parseInt(key) === index) {
                    el.classList.add('marker-active');
                    el.style.zIndex = 1000;
                } else {
                    el.classList.remove('marker-active');
                    el.style.zIndex = 400;
                }
            }
        });
    }
};

const copyAddr = (addr) => {
    navigator.clipboard.writeText(addr);
    alert(t('theaterPage.addressCopied'));
};

const bookNow = (id) => {
    router.push({ 
        path: '/showtimes',
        query: { cinema: id } 
    });
};

const openGoogleMaps = (cinema) => {
    if (!cinema) return;

    const locationQuery = cinema.latitude && cinema.longitude
        ? `${cinema.latitude},${cinema.longitude}`
        : cinema.location_address || cinema.name;

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
    window.open(mapsUrl, '_blank', 'noreferrer');
};

const getThemeColor = (index) => {
    const colors = ['#3b82f6', '#e53935', '#d97706', '#0d9488'];
    return colors[index % colors.length];
};
const getThemeBg = (index) => {
    const bgs = ['rgba(37,99,235,0.08)', 'rgba(229,57,53,0.08)', 'rgba(217,119,6,0.08)', 'rgba(13,148,136,0.08)'];
    return bgs[index % bgs.length];
};

const checkIsOpen = (operatingHours) => {
    if (!operatingHours) return false;
    const now = new Date();
    const currentDay = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const getSchedule = (dayOffset) => {
        const targetDay = (currentDay + dayOffset + 7) % 7;
        const isWeekend = targetDay === 0 || targetDay === 6;
        const timeString = isWeekend ? operatingHours.weekend : operatingHours.weekday;

        const times = timeString.split(/[-–]/);
        if (times.length !== 2) return { open: 0, close: 0 };

        const [open, close] = times.map(t => {
            const [h, m] = t.trim().split(':').map(Number);
            return h * 60 + (m || 0);
        });

        return { open, close };
    };

    const today = getSchedule(0);
    let todayClose = today.close;
    
    if (todayClose <= today.open) todayClose += 1440; 

    if (nowMinutes >= today.open && nowMinutes < todayClose) return true;

    const yesterday = getSchedule(-1);
    let yesterdayClose = yesterday.close;
    
    if (yesterdayClose <= yesterday.open) {
        yesterdayClose += 1440;
        if ((nowMinutes + 1440) < yesterdayClose) return true;
    }

    return false;
};

watch(faqCategories, (newCategories) => {
    if (newCategories.length > 0 && !activeFaqCategory.value) {
        activeFaqCategory.value = newCategories[0];
    }
}, { immediate: true });

const filteredFaqs = computed(() => {
    if (!allFaqs.value || allFaqs.value.length === 0) return [];
    return allFaqs.value.filter(faq => faq.category === activeFaqCategory.value);
});
</script>

<template>
    <template v-if="isLoading || isLoadingFaqs">
        <div class="loading-wrapper">
            <div class="loader-content">
                <v-progress-circular indeterminate color="red-accent-3" size="70" width="4">
                    <v-icon icon="mdi-movie-roll" class="icon-color" size="24"></v-icon>
                </v-progress-circular>

                <p class="mt-6 loading-text">{{ t('common.loading') }}</p>
                <div class="loading-bar"></div>
            </div>
        </div>
    </template>
<v-app class="app-wrapper" v-else>
  <div class="page-container">
    <v-container fluid width="100vw">
        <div v-if="isLoading || cinemas.length === 0" class="d-flex justify-center">
            <v-progress-circular indeterminate color="red-accent-3"></v-progress-circular>
        </div>

        <div v-else>
            <div class="hero w-100" >
                <h1 class="hero-title text-center mt-2">{{ t('theaterPage.heroTitle') }}</h1>
                <p class="hero-sub text-center">{{ t('theaterPage.heroSubtitle') }}</p>
            </div>

            <div class="custom-layout">
                <div class="cinema-list">
                    <div 
                        v-for="(c, i) in cinemas" :key="c.id"
                        class="custom-cinema-card"
                        :class="{ 'active': activeIndex === i }"
                        @click="selectCinema(i)"
                    >
                        <div class="cc-top">
                            <div class="cc-icon" :style="{ background: getThemeBg(i) }">
                                <MapPin :color="getThemeColor(i)" size="18" />
                            </div>
                            <div class="cc-info">
                                <p class="cc-name">{{ c.name }}</p>
                            </div>
                            <span 
                                class="cc-status" 
                                :class="checkIsOpen(c.operating_hours) ? 'open' : 'closed'"
                            >
                                {{ checkIsOpen(c.operating_hours) ? t('theaterPage.open') : t('theaterPage.closed') }}
                            </span>
                        </div>
                        
                        <p class="cc-dist mt-3">
                            {{ c.hall }} {{ t('theaterPage.halls') }}
                        </p>
                    </div>
                </div>

                <div class="map-panel">
                    <div class="map-box">
                        <div ref="mapContainer" class="leaflet-wrapper"></div>
                    </div>

                    <div v-if="cinemas[activeIndex]" class="detail-panel">
                        <div class="dp-top">
                            <div class="dp-info">
                                <p class="dp-name">{{ cinemas[activeIndex].name }}</p>
                            </div>
                            <div class="dp-actions">
                                <button class="dp-btn" @click="copyAddr(cinemas[activeIndex].location_address)">
                                    <Copy size="13" /> {{ t('theaterPage.copyAddress') }}
                                </button>
                                <button class="dp-btn" @click="openGoogleMaps(cinemas[activeIndex])">
                                    <MapPin size="13" /> {{ t('theaterPage.openGoogleMaps') }}
                                </button>
                                <button class="dp-btn primary" @click="bookNow(cinemas[activeIndex].id)">
                                    <Ticket size="13" /> {{ t('theaterPage.bookNow') }}
                                </button>
                            </div>
                        </div>

                        <p class="dp-addr">
                            <MapPin :color="getThemeColor(activeIndex)" size="15" />
                            {{ cinemas[activeIndex].location_address }}
                        </p>

                        <p class="sec-label mt-5 d-flex align-center gap-2">
                            <Clock size="14" /> {{ t('theaterPage.openingHours') }}
                        </p>
                        <div class="premium-hours-list" v-if="cinemas[activeIndex].operating_hours">
                            <div class="hour-row">
                                <span class="day">{{ t('theaterPage.weekdays') }}</span>
                                <span class="time">{{ cinemas[activeIndex].operating_hours.weekday }}</span>
                            </div>
                            <div class="hour-row">
                                <span class="day">{{ t('theaterPage.weekends') }}</span>
                                <span class="time">{{ cinemas[activeIndex].operating_hours.weekend }}</span>
                            </div>
                            <div class="hour-row">
                                <span class="day">{{ t('theaterPage.publicHolidays') }}</span>
                                <span class="time">{{ cinemas[activeIndex].operating_hours.ph }}</span>
                            </div>
                        </div>

                        <!-- Dynamic Amenities -->
                        <p class="sec-label mt-5">{{ t('theaterPage.availableAmenities') }}</p>
                        <div class="amenities-row" v-if="cinemas[activeIndex].amenities">
                            <span v-for="am in cinemas[activeIndex].amenities" :key="am.label" class="am-chip">
                                <component :is="getAmenityIcon(am.label)" size="14" />
                                {{ am.label }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </v-container>
  </div>
  <section id="faq-section">
        <v-container fluid width="100vw">
            <div class="faq-header text-center mb-10">
                <h2 class="faq-title mb-4">{{ t('theaterPage.faqTitle') }}</h2>
                <p class="faq-desc mx-auto">
                    {{ t('theaterPage.faqDescription') }}
                </p>
            </div>

            <div>
                <div class=" mb-3 d-flex justify-center">
                    <div class="faq-toggle-pill">
                        <button
                            v-for="cat in faqCategories"
                            :key="cat"
                            class="faq-toggle-btn"
                            :class="{ 'active': activeFaqCategory === cat }"
                            @click="activeFaqCategory = cat"
                        >
                            {{ cat }}
                        </button>
                    </div>
                </div>

                <v-expansion-panels
                    v-model="expandedFaqId"
                    variant="accordion"
                    class="custom-faq-panels"
                >
                    <v-expansion-panel
                        v-for="faq in filteredFaqs"
                        :key="faq.id"
                        :value="faq.id"
                        class="faq-panel"
                    >
                        <v-expansion-panel-title class="faq-panel-title">
                            <span class=" fs-6">{{ faq.question }}</span>
                            
                            <template v-slot:actions="{ expanded }">
                                <div class="faq-chevron-box">
                                    <ChevronDown 
                                        size="18" 
                                        class="chevron-icon" 
                                        :class="{ 'rotate-180': expanded }" 
                                    />
                                </div>
                            </template>
                        </v-expansion-panel-title>
                        
                        <v-expansion-panel-text class="faq-panel-text px-2 pb-4 pt-1">
                            {{ faq.answer }}
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </div>
        </v-container>
    </section>
  <FooterView />
</v-app>
</template>

<style scoped>
.app-wrapper {
    background: var(--bg-color);
    min-height: 100vh;
    padding:0 5rem;
}
.page-container {
    padding-top: 50px;
}

.hero { 
    margin-bottom: 2rem; 
}
.hero-title { 
    font-size: 32px; 
    color: var(--text-color); 
    letter-spacing: -0.5px;
    
 }
.hero-title span { 
    color: #ff5252;
    font-weight: 700;
}
.hero-sub { 
    font-size: 14px; 
    color: var(--text-color); 
    opacity: 0.7; 
    margin-top: 4px; 
}

.custom-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 20px;
    align-items: start;
}

@media (max-width: 900px) {
    .custom-layout { 
        grid-template-columns: 1fr; 
    }
}

.cinema-list { 
    display: flex; 
    flex-direction: column; 
    gap: 10px; 
}
.custom-cinema-card {
    background: var(--card-bg);
    border: 1px solid rgba(128,128,128,0.2);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}
.custom-cinema-card:hover { 
    border-color: rgba(128,128,128,0.5); 
}
.custom-cinema-card.active {
    border-color: var(--text-color);
}
.custom-cinema-card.active::before { 
    background: #ff5252; 
}

.cc-top { 
    display: flex; 
    align-items: flex-start; 
    gap: 12px; 
}
.cc-icon { 
    width: 40px; 
    height: 40px; 
    border-radius: 8px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    flex-shrink: 0; 
}
.cc-info { 
    flex: 1; 
}
.cc-name { 
    font-size: 14px; 
    font-weight: 700; 
    color: var(--text-color); 
}
.cc-status { 
    font-size: 10px; 
    padding: 2px 8px; 
    border-radius: 20px; 
    font-weight: 700; 
}
.cc-status.open { 
    background: rgba(0,168,107,0.1); 
    color: #00a86b; 
    border: 1px solid rgba(0,168,107,0.2); 
}
.cc-dist { 
    font-size: 12px; 
    color: var(--text-color); 
    opacity: 0.7; 
    display: flex; 
    align-items: center; 
}

/* Map Panel */
.map-panel { 
    display: flex; 
    flex-direction: column; 
    gap: 16px; 
}
.map-box {
    background: var(--card-bg);
    border: 1px solid rgba(128,128,128,0.2);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    padding: 4px;
}
.leaflet-wrapper { 
    width: 100%; 
    height: 350px; 
    border-radius: 8px; 
    z-index: 1; 
}

/* Detail Panel */
.detail-panel {
    background: var(--card-bg);
    border: 1px solid rgba(128,128,128,0.2);
    border-radius: 12px;
    padding: 20px;
}
.dp-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
.dp-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dp-info { flex: 1; }
.dp-name { font-size: 18px; font-weight: 700; color: var(--text-color); }
.dp-actions { display: flex; gap: 8px; }

.dp-btn {
    height: 36px; padding: 0 16px; border-radius: 20px;
    border: 1px solid rgba(128,128,128,0.4); background: transparent;
    font-size: 12px; font-weight: 600; color: var(--text-color);
    cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.dp-btn:hover { border-color: #ff5252; color: #ff5252; }
.dp-btn.primary { background: #ff5252; border-color: #ff5252; color: #fff; }
.dp-btn.primary:hover { background: #d32f2f; color: #fff; }

.dp-addr { font-size: 14px; color: var(--text-color); opacity: 0.8; display: flex; align-items: flex-start; gap: 8px; margin-bottom: 16px; line-height: 1.5; }
.dp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.dp-field { background: rgba(128,128,128,0.05); border-radius: 8px; padding: 12px; border: 1px solid rgba(128,128,128,0.1); }
.dp-fl { 
    font-size: 12px; 
    letter-spacing: 1px; 
    color: var(--text-color); 
    opacity: 0.6; 
    margin-bottom: 4px; 
    font-weight: 600;
}
.dp-fv { font-size: 14px; font-weight: 700; color: var(--text-color); }
.font-mono { font-family: monospace; font-size: 12px; }

.sec-label { 
    font-size: 13px; 
    letter-spacing: 1px; 
    color: var(--text-color);
    opacity: 0.6; 
    margin-bottom: 10px; 
    font-weight: 700;
}
.amenities-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.am-chip {
    display: flex; align-items: center; gap: 6px; padding: 6px 12px;
    border-radius: 20px; border: 1px solid rgba(128,128,128,0.2);
    background: rgba(128,128,128,0.05); font-size: 12px; font-weight: 500; color: var(--text-color);
}

:deep(.custom-leaflet-marker) { 
    display: flex; 
    justify-content: center;
    align-items: center; 
}
:deep(.marker-dot) { 
    width: 12px; 
    height: 12px; 
    border-radius: 50%; 
    border: 2px solid white;
    z-index: 2; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.3); 
    transition: transform 0.3s; 
}
:deep(.marker-pulse) { 
    position: absolute; 
    width: 30px; 
    height: 30px; 
    border-radius: 50%; 
    opacity: 0.4; 
    animation: pulse 2s infinite; 
    z-index: 1; 
}
:deep(.marker-active .marker-dot) { 
    transform: scale(1.5); 
}
:deep(.marker-active .marker-pulse) { 
    width: 50px; 
    height: 50px; 
    opacity: 0.6; 
    animation: pulse-fast 1s infinite; 
}

@keyframes pulse { 
    0% { 
        transform: scale(0.5); 
        opacity: 0.8; 
    } 
    100% { 
        transform: scale(1.5); 
        opacity: 0; 
    } 
}
@keyframes pulse-fast { 
    0% { 
        transform: scale(0.5); 
        opacity: 1; 
    } 
    100% { 
        transform: scale(1.2); 
        opacity: 0; 
    } 
}

.premium-hours-list {
    background: rgba(128, 128, 128, 0.05);
    border: 1px solid rgba(128, 128, 128, 0.1);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 20px;
}

.hour-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px dashed rgba(128, 128, 128, 0.2);
}

.hour-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.hour-row:first-child {
    padding-top: 0;
}

.hour-row .day {
    font-size: 13px;
    color: var(--text-color);
    opacity: 0.7;
    font-weight: 600;
}

.hour-row .time {
    font-size: 14px;
    color: var(--text-color);
    font-weight: 700;
}

:deep(.premium-popup .leaflet-popup-content-wrapper) {
    background: var(--card-bg, #1a1a2e); 
    padding: 0;
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid rgba(128,128,128,0.2);
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
}

:deep(.premium-popup .leaflet-popup-content) {
    margin: 0;
    width: 240px !important;
}

:deep(.premium-popup .leaflet-popup-tip) {
    background: var(--card-bg, #1a1a2e);
    border: 1px solid rgba(128,128,128,0.2);
    border-top: none;
    border-left: none;
}

:deep(.custom-leaflet-popup) {
    display: flex;
    flex-direction: column;
}

:deep(.custom-leaflet-popup .popup-img) {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-bottom: 1px solid rgba(128,128,128,0.2);
}

:deep(.custom-leaflet-popup .popup-info) {
    padding: 12px 16px;
    text-align: center;
}

:deep(.custom-leaflet-popup .popup-title) {
    font-size: 14px;
    margin: 0 0 4px 0;
    color: var(--text-color, #ffffff);
    font-weight: 700;
}

:deep(.custom-leaflet-popup .popup-subtitle) {
    font-size: 11px;
    color: var(--muted-text-color);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.faq-title {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 42px;
    color: var(--text-color);
    letter-spacing: -0.5px;
}

.faq-desc {
    color: #6b7280;
    font-size: 16px;
    line-height: 1.6;
    max-width: 600px;
}

.faq-toggle-pill {
    display: inline-flex;
    background: transparent;
    border: 1px solid #d4e3dc; 
    border-radius: 50px;
    padding: 6px;
}

.faq-toggle-btn {
    padding: 10px 32px;
    border-radius: 50px;
    font-size: 15px;
    font-weight: 500;
    color: #24584b;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
}

.faq-toggle-btn.active {
    background-color: #24584b; 
    color: #ffffff;
}

:deep(.custom-faq-panels) {
    background: transparent !important;
    max-width: 1000px;
    margin:0 auto;
    box-shadow: none !;
}

:deep(.faq-panel) {
    background: var(--card-bg) !important;
    border-radius: 8px !important;
    overflow: hidden;
}

:deep(.faq-panel::before), 
:deep(.faq-panel::after) {
    display: none !important;
}

:deep(.faq-panel-title) {
    color: var(--text-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

:deep(.faq-panel-text) {
    color: #6b7280;
    line-height: 1.6;
}

.faq-chevron-box {
    background: rgba(128, 128, 128, 0.08); 
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color);
    transition: transform 0.3s ease;
}

.chevron-icon {
    transition: transform 0.3s ease;
}

.rotate-180 {
    transform: rotate(180deg);
}

@media (max-width: 600px) {
    .app-wrapper{
        padding:0;
    }
}
</style>
