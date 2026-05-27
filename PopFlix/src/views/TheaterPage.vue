<script setup>
import { ref, watch, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCinemas } from '@/hook/useCinemas';

// Fix for Leaflet marker icons not showing up
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const { cinemas, isLoading } = useCinemas();
const mapContainer = ref(null);

// Watch for data arrival
watch(cinemas, async (newVal) => {
    if (newVal.length > 0) {
        await nextTick(); // Wait for DOM to render the div
        initMap();
    }
});

const initMap = () => {
    if (!mapContainer.value) return;
    
    const map = L.map(mapContainer.value).setView([1.5303, 110.3653], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    cinemas.value.forEach(cinema => {
        L.marker([cinema.latitude, cinema.longitude]).addTo(map)
            .bindPopup(`<b>${cinema.name}</b><br>${cinema.location_address}`);
    });
};
</script>

<template>
    <v-container fluid class="theater-page pa-0" width="100vw">
        <!-- Hero Section -->
        <section class="theater-hero" width="100vw">
            <h1 class="text-h2 font-weight-black">Our Locations</h1>
            <p class="text-subtitle-1 text-grey">Experience Popflix at any of our premium sites.</p>
        </section>

        <!-- Interactive Map -->
        <v-container width="100vw">
            <div ref="mapContainer" class="map-box elevation-12"></div>
        </v-container>

        <!-- Cinema List -->
        <v-container class="mt-10" width="100vw">
            <h2 class="mb-6">Find a Cinema</h2>
            <v-row>
                <v-col v-for="c in cinemas" :key="c.id" cols="12" md="6" lg="3">
                    <v-card class="cinema-card pa-4" variant="outlined">
                        <h3>{{ c.name }}</h3>
                        <p class="text-caption text-grey">{{ c.location_address }}</p>
                        <v-btn variant="text" color="red" class="mt-4">View Showtimes
                            <ArrowRight size="16" class="ms-1" />
                        </v-btn>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>

        <!-- Premium Experiences -->
        <section class="experience-section py-15">
            <v-container>
                <h2 class="text-center mb-10">Premium Experiences</h2>
                <v-row>
                    <v-col cols="12" md="4" class="text-center">
                        <Zap size="48" color="#ff5252" />
                        <h3>4DX Immersion</h3>
                        <p>Motion seats and environmental effects.</p>
                    </v-col>
                    <v-col cols="12" md="4" class="text-center">
                        <Sofa size="48" color="#ff5252" />
                        <h3>Luxe Recliner</h3>
                        <p>Full-recline leather luxury seating.</p>
                    </v-col>
                    <v-col cols="12" md="4" class="text-center">
                        <Coffee size="48" color="#ff5252" />
                        <h3>Indulge Dining</h3>
                        <p>Gourmet meals delivered to your seat.</p>
                    </v-col>
                </v-row>
            </v-container>
        </section>

        <!-- FAQ Section -->
        <v-container class="py-15">
            <h2 class="mb-6">Frequently Asked Questions</h2>
            <v-expansion-panels variant="accordion">
                <v-expansion-panel title="How do I book tickets online?">
                    <v-expansion-panel-text>Select your preferred cinema, choose your movie, and proceed to the payment
                        gateway.</v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel title="Are there parking facilities?">
                    <v-expansion-panel-text>Yes, all our locations offer secure underground parking with direct mall
                        access.</v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </v-container>
    </v-container>
</template>

<style>
.map-box { height: 400px; width: 100%; border-radius: 16px; z-index: 1; }
.theater-page {
    background: #0e111b;
    color: white;
}

.map-box {
    height: 400px;
    width: 100%;
    border-radius: 16px;
    border: 2px solid #333;
}

.cinema-card {
    background: rgba(255, 255, 255, 0.03);
    transition: 0.3s;
}

.cinema-card:hover {
    border-color: #ff5252;
}

.experience-section {
    background: rgba(255, 255, 255, 0.02);
}
</style>