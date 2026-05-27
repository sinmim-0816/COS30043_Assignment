<script setup>
import { ref, watch, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, MapPin, Copy, Ticket, Car, Accessibility, Coffee, Tv, Wifi, Utensils, Baby } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

// Imports
import { useCinemas } from '@/hook/useCinemas';
import FooterView from '@/components/FooterView.vue';

const { cinemas, isLoading } = useCinemas();
const router = useRouter();

const mapContainer = ref(null);
const map = ref(null);
const markers = ref({});

const activeIndex = ref(0);

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

const initMap = () => {
    if (!mapContainer.value || map.value) return;
    
    map.value = L.map(mapContainer.value).setView([1.5303, 110.3653], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map.value);

    const dummyImage = 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=400&h=200';

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
                <img src="${dummyImage}" alt="${cinema.name}" class="popup-img" />
                <div class="popup-info">
                    <h4 class="popup-title">${cinema.name}</h4>
                    <p class="popup-subtitle">${cinema.location_address.split(',')[0]}</p>
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

watch(cinemas, async (newVal) => {
    if (newVal.length > 0) {
        await nextTick();
        initMap();
    }
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
    alert('Address copied to clipboard!');
};

const bookNow = (id) => {
    router.push({ name: 'TicketBooking', params: { movieId: 'all', showtimeId: 'all' } });
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
</script>

<template>
<v-app class="app-wrapper">
  <div class="page-container pb-15">
    <v-container fluid width="100vw">
        <div v-if="isLoading || cinemas.length === 0" class="d-flex justify-center py-15">
            <v-progress-circular indeterminate color="red-accent-3"></v-progress-circular>
        </div>

        <div v-else>
            <div class="hero w-100" >
                <h1 class="hero-title text-center mt-2">Our <span>Cinemas</span> Locations</h1>
                <p class="hero-sub text-center">Premium cinema locations — pick your nearest and book your seat.</p>
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
                                {{ checkIsOpen(c.operating_hours) ? 'Open' : 'Closed' }}
                            </span>
                        </div>
                        
                        <p class="cc-dist mt-3">
                            {{c.hall}} Halls
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
                                    <Copy size="13" /> Copy
                                </button>
                                <button class="dp-btn primary" @click="bookNow(cinemas[activeIndex].id)">
                                    <Ticket size="13" /> Book Now
                                </button>
                            </div>
                        </div>

                        <p class="dp-addr">
                            <MapPin :color="getThemeColor(activeIndex)" size="15" />
                            {{ cinemas[activeIndex].location_address }}
                        </p>

                        <p class="sec-label mt-5 d-flex align-center gap-2">
                            <Clock size="14" /> Opening Hours
                        </p>
                        <div class="premium-hours-list" v-if="cinemas[activeIndex].operating_hours">
                            <div class="hour-row">
                                <span class="day">Weekdays (Mon – Fri)</span>
                                <span class="time">{{ cinemas[activeIndex].operating_hours.weekday }}</span>
                            </div>
                            <div class="hour-row">
                                <span class="day">Weekends (Sat – Sun)</span>
                                <span class="time">{{ cinemas[activeIndex].operating_hours.weekend }}</span>
                            </div>
                            <div class="hour-row">
                                <span class="day">Public Holidays</span>
                                <span class="time">{{ cinemas[activeIndex].operating_hours.ph }}</span>
                            </div>
                        </div>

                        <!-- Dynamic Amenities -->
                        <p class="sec-label mt-5">Available Amenities</p>
                        <div class="amenities-row" v-if="cinemas[activeIndex].amenities">
                            <!-- Vue uses <component :is="..."> to dynamically render imported icons -->
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
.cc-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cc-info { flex: 1; }
.cc-name { font-size: 14px; font-weight: 700; color: var(--text-color); }
.cc-status { font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 700; }
.cc-status.open { background: rgba(0,168,107,0.1); color: #00a86b; border: 1px solid rgba(0,168,107,0.2); }
.cc-dist { font-size: 12px; color: var(--text-color); opacity: 0.7; display: flex; align-items: center; }

/* Map Panel */
.map-panel { display: flex; flex-direction: column; gap: 16px; }
.map-box {
    background: var(--card-bg);
    border: 1px solid rgba(128,128,128,0.2);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    padding: 4px;
}
.leaflet-wrapper { width: 100%; height: 350px; border-radius: 8px; z-index: 1; }

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

/* The little triangle arrow pointing down */
:deep(.premium-popup .leaflet-popup-tip) {
    background: var(--card-bg, #1a1a2e);
    border: 1px solid rgba(128,128,128,0.2);
    border-top: none;
    border-left: none;
}

/* Custom internal layout */
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
    color: rgba(255,255,255,0.6);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>