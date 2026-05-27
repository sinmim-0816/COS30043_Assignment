<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    ChevronLeft, Armchair, Star, Gem, Zap, Coffee, Baby, Timer,
    Plus, X
} from 'lucide-vue-next';
import { format, addDays, isSameDay, subMinutes, addMinutes } from 'date-fns';

// Import other hook and components
import { LAYOUT_CONFIG } from '@/utils/SeatLayout';
import { getCertImage } from '@/utils/AgeRating';
import { getGenreName } from '@/utils/genre';
import { useMovieDetails } from '@/hook/useMovieDetails';
import { useShowtimes } from '@/hook/useShowtimes';
import { PARKING_CONFIG } from '@/utils/ParkingLayout';
import { useBookingStore } from '@/stores/booking';
import SeatPreview3D from '@/components/SeatPreview3D.vue';
import { useVehicles } from '@/hook/useVehicles';

const route = useRoute();
const router = useRouter();
const bookingStore = useBookingStore();
const is3DPreviewOpen = ref(false);
const lastSelectedSeat = computed(() => {
    if (selectedSeats.value && selectedSeats.value.length > 0) {
        return selectedSeats.value[selectedSeats.value.length - 1];
    }
    return 'A-1';
});

const { movie, loadMovieDetails, getImageURL, getCertificate } = useMovieDetails();
const { allSessions, fetchAllShowtimes, currentSession, fetchShowtimeById, loadInitialData } = useShowtimes();
const { userVehicles, loadUserVehicles, createNewVehicle, deleteVehicleInstance } = useVehicles();

const experienceType = ref(route.query.exp || 'DOLBY');
const selectedTime = ref(null);
const selectedType = ref(experienceType.value);
const selectedCinema = ref(null);
const selectedCinemaId = ref(null);
const selectedDate = ref(new Date());
const dateOptions = computed(() => {
    return Array.from({ length: 8 }, (_, i) => addDays(new Date(), i));
});
const cinemaList = ref([]);
const isVehicleModalOpen = ref(false);
const serverLockedSeats = computed(() => bookingStore.lockedSeats);
const serverLockedParkingSpots = computed(() => bookingStore.lockedParkingSpots);
const activeVehicleTab = ref('new');

const getSeatStatus = (row, col) => {
    const currentSeatId = `${experienceType.value}-${row}-${col}`.trim().toUpperCase();
    const exactMatch = serverLockedSeats.value.find((s) => (s.seatNumber || '').trim().toUpperCase() === currentSeatId);
    if (exactMatch) {
        return exactMatch.status;
    }

    // Fallback to row-col matching if stored seat prefix differs in formatting.
    const targetSuffix = `${row}-${col}`.toUpperCase();
    const suffixMatch = serverLockedSeats.value.find((s) => {
        const rawSeat = (s.seatNumber || '').trim().toUpperCase();
        const parts = rawSeat.split('-');
        return parts.length >= 3 && `${parts[parts.length - 2]}-${parts[parts.length - 1]}` === targetSuffix;
    });
    return suffixMatch ? suffixMatch.status : null;
}

const isSeatPaid = (row, col) => getSeatStatus(row, col) == 'PAID';
const isSeatPending = (row, col) => getSeatStatus(row, col) == 'PENDING';

const isSeatTaken = (row, col) => {
    const status = getSeatStatus(row, col);
    return status === 'PAID' || status === 'PENDING';
};

const refreshSeatingMap = async () => {
    const targetShowtimeId = selectedSession.value?.id || route.params.showtimeId;
    if (targetShowtimeId) {
        await bookingStore.fetchLockedSeats(Number(targetShowtimeId));
        await bookingStore.fetchLockedParking(Number(targetShowtimeId));
    }
};

const getParkingStatus = (zone, spotNum) => {
    const spotId = `${zone} ${spotNum}`.trim().toUpperCase();
    const match = serverLockedParkingSpots.value.find((s) => (s.parkingSpot || '').trim().toUpperCase() === spotId);
    return match ? match.status : null;
};

const isParkingPaid = (zone, spotNum) => getParkingStatus(zone, spotNum) === 'PAID';
const isParkingPending = (zone, spotNum) => getParkingStatus(zone, spotNum) === 'PENDING';
const isParkingTaken = (zone, spotNum) => {
    const status = getParkingStatus(zone, spotNum);
    return status === 'PAID' || status === 'PENDING';
};

const selectedSession = computed(() => {
    return allSessions.value.find(s =>
        String(s.movie_id) === String(route.params.movieId) &&
        s.cinema?.id === selectedCinemaId.value &&
        s.experience?.exp_key === selectedType.value &&
        format(new Date(s.start_time), 'HH:mm') === selectedTime.value &&
        isSameDay(new Date(s.start_time), selectedDate.value)
    );
});

const resetSelection = () => {
    selectedSeats.value = [];
    selectedSpot.value = null;
    isParkingSelected.value = false;
    bookingStore.clearBookingSession();
};

onMounted(async () => {
    const movieId = route.params.movieId;
    const showtimeId = route.params.showtimeId;

    if (movieId) {
        loadMovieDetails(movieId);
    }

    const data = await loadInitialData();
    cinemaList.value = data;

    if (showtimeId) {
        fetchShowtimeById(showtimeId);
    }

    await refreshSeatingMap();
    await loadUserVehicles();
});

watch(selectedSession, async (newSession) => {
    if (newSession?.id) {
        await bookingStore.fetchLockedSeats(newSession.id);
    }
})

watch(currentSession, (newVal) => {
    if (newVal) {
        selectedTime.value = format(new Date(newVal.start_time), 'HH:mm');
        selectedCinema.value = newVal.cinema?.name;
        selectedCinemaId.value = newVal.cinema?.id;
        selectedType.value = newVal.experience?.exp_key;
        selectedDate.value = new Date(newVal.start_time);
    }
}, { once: true });

watch([selectedDate, selectedCinemaId], async ([newDate, newCinemaId]) => {
    if (newCinemaId && newDate) {
        resetSelection();
        await fetchAllShowtimes(newCinemaId, newDate);
    }
});

function capitalizeFirst(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const availableTimes = computed(() => {
    return allSessions.value.filter(s => String(s.movie_id) === String(route.params.movieId) && s.experience?.exp_key === selectedType.value).map(s => format(new Date(s.start_time), 'HH:mm')).sort();
});

const availableTypes = computed(() => {
    const types = allSessions.value.filter(s => String(s.movie_id) === String(route.params.movieId)).map(s => s.experience?.exp_key);
    return [...new Set(types)];
});

const parseRuntimeToMinutes = (runtimeStr) => {
    if (!runtimeStr) {
        return 0;
    }
    const hMatch = runtimeStr.match(/(\d+)h/);
    const mMatch = runtimeStr.match(/(\d+)m/);
    const hours = hMatch ? parseInt(hMatch[1]) : 0;
    const minutes = mMatch ? parseInt(mMatch[1]) : 0;

    return (hours * 60) + minutes;
}

const parkingTimeWindow = computed(() => {
    if (!selectedSession.value || !movie.value?.runtime) {
        return null;
    }
    const startTime = new Date(selectedSession.value.start_time);
    const movieRuntime = parseRuntimeToMinutes(movie.value.runtime);
    const parkingEntry = subMinutes(startTime, 30);
    const movieEnd = addMinutes(startTime, movieRuntime);
    const parkingExit = addMinutes(movieEnd, 30);

    return {
        start: format(parkingEntry, 'HH:mm'),
        end: format(parkingExit, 'HH:mm'),
        duration: Math.ceil((movieRuntime + 60) / 60)
    }
});

watch(availableTimes, (newTimes) => {
    if (newTimes && newTimes.length > 0) {
        if (!newTimes.includes(selectedTime.value)) {
            selectedTime.value = newTimes[0];
        }
    } else {
        selectedTime.value = null;
    }
})

watch(selectedType, (newVal) => {
    if (newVal) {
        resetSelection();
        experienceType.value = newVal;
    }
});

watch(availableTypes, (newTypes) => {
    if (newTypes && newTypes.length > 0) {
        if (!newTypes.includes(selectedType.value)) {
            selectedType.value = newTypes[0];
        }
    } else {
        selectedType.value = null;
    }
})

const selectedSeats = ref([]);
const seatPrice = computed(() => {
    if (!selectedSession.value) {
        return 0;
    }
    const base = parseFloat(selectedSession.value.cinema?.base_price || 0);
    const premium = parseFloat(selectedSession.value.experience?.price_premium || 0);

    return base + premium;
});

const config = computed(() => LAYOUT_CONFIG[experienceType.value]);
const rows = computed(() => Array.from({ length: config.value.rows }, (_, i) => String.fromCharCode(65 + i)));

const toggleSeat = (row, col) => {
    if (isSeatTaken(row, col) || isSeatPending(row, col)) {
        return;
    }

    const seatId = `${experienceType.value}-${row}-${col}`;
    const idx = selectedSeats.value.indexOf(seatId);
    idx > -1 ? selectedSeats.value.splice(idx, 1) : selectedSeats.value.push(seatId);
};

const parkingSection = ref(null);
const selectedLevel = ref(1);
const userCar = ref({
    model: 'Select Vehicle',
    plateNumber: '------',
    color: '#757575'
});
const isParkingSelected = ref(false);
const selectedSpot = ref(null);

const vehicleForm = ref({
    model: '',
    plateNumber: '',
    color: '#448aff'
});

const adjustHexGlow = (hex, amt) => {
    try {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.max(0, Math.min(255, r + amt));
        g = Math.max(0, Math.min(255, g + amt));
        b = Math.max(0, Math.min(255, b + amt));
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        return { e, hex };
    }
};

const openVehicleModal = () => {
    vehicleForm.value = { model: '', plateNumber: '', color: '#448aff' };
    activeVehicleTab.value = 'new';
    isVehicleModalOpen.value = true;
};

const saveVehicle = async () => {
    if (vehicleForm.value.model && vehicleForm.value.plateNumber) {
        try {
            const payload = {
                model: vehicleForm.value.model,
                plateNumber: vehicleForm.value.plateNumber,
                color: vehicleForm.value.color
            };
            const savedInstance = await createNewVehicle(payload);

            userCar.value = { ...savedInstance };
            isVehicleModalOpen.value = false;
        } catch (err) {
            console.error("Failed to save vehicle through hook pipeline:", err);
        }
    }
};

watch(isParkingSelected, (newVal) => {
    if (newVal) {
        setTimeout(() => {
            parkingSection.value?.$el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
});

watch(userVehicles, (newVehicles) => {
    if (newVehicles && newVehicles.length > 0) {
        if (userCar.value.model === 'Select Vehicle' || userCar.value.plateNumber === '------') {
            userCar.value = { ...newVehicles[0] };
        }
    } else {
        userCar.value = { model: 'No Car Registered', plateNumber: '------', color: '#757575' };
    }
}, { immediate: true, deep: true });

const currentParking = computed(() => {
    const slug = selectedSession.value?.cinema?.slug || 'vivacity-mall';
    return PARKING_CONFIG[slug] || PARKING_CONFIG['vivacity-mall'];
});

const selectSpot = (zone, spotNum) => {
    if (isParkingTaken(zone, spotNum)) {
        return;
    }
    selectedSpot.value = `${zone} ${spotNum}`;
}

const subtotal = computed(() => selectedSeats.value.length * seatPrice.value);

const getSeatIcon = () => {
    const map = { 'INDULGE': Coffee, 'JUNIOR': Baby, '4DX': Zap, 'LUXE': Gem };
    return map[experienceType.value] || Armchair;
};

const isReserved = computed(() => bookingStore.isReserved);
const apiError = computed(() => bookingStore.errorMessages);
const isStoreLoading = computed(() => bookingStore.isLoading);

const handleCheckoutStep = async () => {
    const targetShowtimeId = selectedSession.value?.id || route.params.showtimeId;
    if (!targetShowtimeId) {
        bookingStore.errorMessages = "Session configuration error. Please re-select a showtime option.";
        return;
    }
    try {
        const dto = {
            showtimeId: Number(targetShowtimeId),
            seats: selectedSeats.value,
            seatPrice: Number(seatPrice.value),
            subtotal: Number(subtotal.value),
            usePoints: false,
            pointsToUse: 0,
            parkingSpot: isParkingSelected.value ? selectedSpot.value : null
        };

        await bookingStore.reserveSeats(dto, () => {
            selectedSeats.value = [];
            selectedSpot.value = null;
            isParkingSelected.value = false;
        });

        router.push({ path: '/checkout-payment', query: { stage: 'payment' } });
    } catch (err) {
        console.error("Lock sequence failed:", err);
    }
};
</script>

<template>
    <v-app full-height class="ms-4">
        <v-main>
            <v-btn icon variant="tonal" color="white" class="back-btn" @click="router.back()">
                <ChevronLeft />
            </v-btn>
            <h2 class="mb-2">Reserve Booking</h2>

            <v-transition-slide-y>
                <v-alert v-if="apiError" type="error" variant="tonal" closable class="mb-4 rounded-xl mx-auto"
                    max-width="95vw">
                    {{ apiError }}
                </v-alert>
            </v-transition-slide-y>

            <section ref="selectionSection" class="booking-section">
                <v-container fluid width="100vw">
                    <v-row class="info-section">
                        <v-col cols="2">
                            <v-img :src="getImageURL(movie?.poster)" class="rounded-lg shadow-xl"
                                width="200px position-relative">
                                <v-img :src="getCertImage(getCertificate(movie))" width="45" height="45" contain
                                    class=" position-absolute bottom-0 left-0 m-2"></v-img>
                            </v-img>
                        </v-col>
                        <v-col cols="10" class="ps-4">
                            <h3>{{ movie?.title }}</h3>
                            <p class="text-h6 text-red-accent-3">{{ experienceType }} EXPERIENCE</p>
                            <v-chip v-for="id in movie?.genres" :key="id" variant="tonal" class="font-weight-bold me-2">
                                {{ getGenreName(id) }}
                            </v-chip>
                            <div class="d-flex">
                                <div class="d-flex align-center mt-2">
                                    <Star size="20" color="#f5c518" fill="#f5c518" class="me-2" />
                                    <span class="fs-5 font-weight-black text-white">{{ movie?.vote_average.toFixed(1)
                                        }}</span>
                                    <span class="fs-6 text-grey-darken-1 ms-1 mt-1">/10</span>
                                </div>
                                <div class="d-flex align-center gap-2 mt-2 text-grey-lighten-1 ms-3">
                                    <span>
                                        <Timer size="20" color="#42A5F5" />
                                    </span>
                                    <span>{{ movie?.runtime }}</span>
                                </div>
                            </div>
                            <h4 class="fs-6 font-italic  text-grey-lighten-2 ps-2 italic-quote mt-3">
                                "{{ movie?.tagline || movie?.overview.split('.')[0] + '.' }}"
                            </h4>
                            <p class="mt-4 fw-bold">Check your Details:</p>
                            <div v-if="selectedSession"
                                class="session-info-bar  pa-4 rounded-xl d-flex align-center flex-wrap gap-6">

                                <div class="d-flex align-center">
                                    <v-icon color="red-accent-3" class="me-2">mdi-map-marker</v-icon>
                                    <div>
                                        <p class="info-label">Cinema</p>
                                        <p class="info-value">{{ selectedSession.cinema?.name }}</p>
                                    </div>
                                </div>

                                <v-divider vertical class="mx-2 hidden-sm-and-down"></v-divider>

                                <div class="d-flex align-center">
                                    <v-icon color="blue-lighten-1" class="me-2">mdi-door-open</v-icon>
                                    <div>
                                        <p class="info-label">Hall</p>
                                        <p class="info-value">{{ selectedSession.hall_name }}</p>
                                    </div>
                                </div>

                                <v-divider vertical class="mx-2 hidden-sm-and-down"></v-divider>

                                <div class="d-flex align-center">
                                    <v-icon color="green-accent-3" class="me-2">mdi-calendar-clock</v-icon>
                                    <div>
                                        <p class="info-label">Schedule</p>
                                        <p class="info-value">
                                            {{ format(new Date(selectedSession.start_time), 'EEE, dd MMM') }} •
                                            <span>{{ format(new Date(selectedSession.start_time), 'HH:mm') }}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </v-col>
                    </v-row>
                </v-container>
            </section>

            <section class="quick-selector-wrapper mt-4">
                <v-container width="85vw" class="mx-auto" fluid>
                    <div class="selector-glass-panel d-flex align-center justify-space-between px-8 py-3">

                        <div class="selector-item date-group d-flex align-center">
                            <span class="label-tiny me-4">Date</span>
                            <v-icon size="14" color="blue" class="me-2">mdi-chevron-left</v-icon>
                            <div class="mini-date-track d-flex gap-2">
                                <div v-for="date in dateOptions" :key="date.toString()" class="mini-date-pill"
                                    :class="{ 'active': isSameDay(date, selectedDate) }" @click="selectedDate = date">
                                    <span class="d-block text-center day">{{ format(date, 'EEE') }}</span>
                                    <span class="d-block text-center num">{{ format(date, 'dd') }}</span>
                                </div>
                            </div>
                            <v-icon size="14" color="blue" class="ms-2">mdi-chevron-right</v-icon>
                        </div>

                        <v-divider vertical class="mx-6 opacity-10" height="40"></v-divider>

                        <div class="selector-item">
                            <p class="label-tiny">Experience</p>
                            <v-menu>
                                <template v-slot:activator="{ props }">
                                    <div v-bind="props" class="d-flex align-center cursor-pointer">
                                        <span class="val-text">{{ capitalizeFirst(selectedType) }}</span>
                                        <v-icon size="16" class="ms-2" color="blue-lighten-1">mdi-chevron-down</v-icon>
                                    </div>
                                </template>
                                <v-list bg-color="#1a1a1f" theme="dark">
                                    <v-list-item v-for="type in availableTypes" :key="type"
                                        @click="selectedType = type">
                                        {{ type }}
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </div>

                        <v-divider vertical class="mx-6 opacity-10" height="40"></v-divider>

                        <div class="selector-item">
                            <p class="label-tiny">Time</p>
                            <v-menu>
                                <template v-slot:activator="{ props }">
                                    <div v-bind="props" class="d-flex align-center cursor-pointer">
                                        <span class="val-text">{{ selectedTime || 'Select Time' }}</span>
                                        <v-icon size="16" class="ms-2" color="blue-lighten-1">mdi-chevron-down</v-icon>
                                    </div>
                                </template>
                                <v-list bg-color="#1a1a1f" theme="dark">
                                    <v-list-item v-for="t in availableTimes" :key="t" @click="selectedTime = t">
                                        {{ t }}
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </div>

                        <v-divider vertical class="mx-6 opacity-10" height="40"></v-divider>

                        <div class="selector-item">
                            <p class="label-tiny text-blue">Cinema</p>
                            <v-menu>
                                <template v-slot:activator="{ props }">
                                    <div v-bind="props" class="d-flex align-center cursor-pointer">
                                        <span class="val-text">{{ selectedCinema || 'Select Cinema' }}</span>
                                        <v-icon size="16" class="ms-2" color="blue-lighten-1">mdi-chevron-down</v-icon>
                                    </div>
                                </template>
                                <v-list bg-color="#1a1a1f" theme="dark">
                                    <v-list-item v-for="c in cinemaList" :key="c.id" @click="selectedCinema = c.name;
                                    selectedCinemaId = c.id">
                                        {{ c.name }}
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </div>
                    </div>
                </v-container>
            </section>

            <section class="seating-area-wrapper mt-3">
                <v-container fluid class="px-5" width="97vw">
                    <v-row class="d-flex justify-center">
                        <v-col cols="12" md="4" lg="3">
                            <v-expand-transition>
                                <div v-if="isReserved" class="mb-4">
                                    <v-chip color="orange-accent-3" size="large" block
                                        class="font-weight-black tracking-wide w-100 justify-center text-white"
                                        elevation="2">
                                        <v-icon start class="me-2 animate-pulse-slow">mdi-clock-outline</v-icon>
                                        Seats Held: {{ bookingStore.countdownText }}
                                    </v-chip>
                                    <p class="text-caption text-center text-orange-lighten-3 mt-1">
                                        Complete your order before this timer runs out!
                                    </p>
                                </div>
                            </v-expand-transition>
                            <div class="checkout-sidebar pa-6 rounded-xl">
                                <h3 class="font-weight-bold mb-2">Select Your Seats</h3>
                                <div>{{ selectedSeats.length }} Seats</div>
                                <div class=" gap-2 mb-8 text-grey seats">

                                    <span v-for="(seat, index) in selectedSeats" :key="seat">
                                        {{ seat.split('-').slice(-2).join('') }}{{ index < selectedSeats.length - 1
                                            ? ',' : '' }} </span>
                                </div>
                            </div>

                            <div class="ticket-details mb-10">
                                <div class="d-flex justify-space-between align-center mb-4">
                                    <span class="text-overline letter-spacing-1">Movie Tickets Details:</span>
                                </div>
                                <div class="summary-row d-flex justify-space-between mb-2">
                                    <span class="text-grey">Date & Time</span>
                                    <span> {{ new Date(selectedDate).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    }) }}, {{ selectedTime }}</span>
                                </div>
                                <div class="summary-row d-flex justify-space-between mb-2">
                                    <span class="text-grey">Ticket ({{ capitalizeFirst(selectedType) }})</span>
                                    <span>{{ selectedSeats.length }} x {{ seatPrice }}</span>
                                </div>
                                <div class="summary-row d-flex justify-space-between font-weight-bold border-top pt-2">
                                    <span>Total</span>
                                    <span>RM {{ subtotal }}</span>
                                </div>
                            </div>

                            <div class="payment-card p-3 rounded-xl mt-3">
                                <div class="d-flex justify-space-between mb-2">
                                    <span class="text-grey-darken-3">Tickets</span>
                                    <span class="font-weight-bold">{{ selectedSeats.length }}</span>
                                </div>
                                <div class="d-flex justify-space-between mb-4">
                                    <span class="text-grey-darken-3">Type</span>
                                    <span class="font-weight-bold">{{ capitalizeFirst(selectedType) }}</span>
                                </div>

                                <div class="d-flex justify-space-between align-center ">
                                    <span class="text-h6 fw-bold">Total Price</span>
                                    <span class="text-h5 font-weight-black">RM {{ subtotal }}</span>
                                </div>

                                <v-btn block variant="outlined" rounded="pill" height="50" class="mb-3 mt-3 text-none"
                                    :disabled="selectedSeats.length === 0"
                                    @click="isParkingSelected = !isParkingSelected">
                                    <span v-if="!isParkingSelected">
                                        <Plus size="18" class="me-2" />
                                    </span>
                                    {{ isParkingSelected ? 'Parking Added' : 'Add Parking' }}
                                </v-btn>

                                <v-btn v-if="!isParkingSelected" block color="grey-darken-4" rounded="pill" height="50"
                                    class="font-weight-bold" :disabled="selectedSeats.length === 0"
                                    :loading="isStoreLoading" @click="handleCheckoutStep">
                                    BUY
                                </v-btn>
                            </div>
                        </v-col>

                        <v-col cols="12" md="8" lg="8">
                            <div class="map-container pa-10 rounded-xl ms-5">
                                <div class="screen-wrapper">
                                    <div class="curved-screen"></div>
                                    <p class="screen-text">SCREEN</p>
                                </div>
                                <div class="d-flex justify-end mb-4">
                                    <v-btn variant="tonal" color="blue-lighten-3" prepend-icon="mdi-cube-outline"
                                    @click="is3DPreviewOpen = true" :disabled="selectedSeats.length === 0" class="ar_btn">
                                        View from Seat
                                    </v-btn>
                                </div>
                                
                                <div class="seats-layout">
                                    <div v-for="row in rows" :key="row" class="d-flex justify-center align-center mb-4">
                                        <span class="row-label mr-6">{{ row }}</span>
                                        <div v-for="col in config.cols" :key="col" class="d-flex align-center">
                                            <div class="seat-pill d-flex align-center justify-center mx-1" :class="{
                                                'active': selectedSeats.includes(`${experienceType}-${row}-${col}`),
                                                'paid-taken': isSeatPaid(row, col),
                                                'pending-locked': isSeatPending(row, col)
                                            }" @click="toggleSeat(row, col)">

                                                <div v-if="isSeatPaid(row, col)" class="sold-out-slash"></div>

                                                <component :is="getSeatIcon()" :size="14" :stroke-width="2.5"
                                                    :color="isSeatPaid(row, col) ? '#2a2f3a' : (isSeatPending(row, col) ? '#ff9100' : (selectedSeats.includes(`${experienceType}-${row}-${col}`) ? '#0d0d12' : 'rgba(255,255,255,0.4)'))" />
                                            </div>

                                            <div v-if="config.aisleAfter?.includes(col)" class="aisle-space"></div>
                                        </div>
                                        <span class="row-label ml-6">{{ row }}</span>
                                    </div>
                                </div>

                                <div class="d-flex justify-center gap-4 mt-12 flex-wrap">
                                    <div class="d-flex align-center">
                                        <div class="dot available"></div> <small
                                            class="text-grey-lighten-1">Available</small>
                                    </div>
                                    <div class="d-flex align-center">
                                        <div class="dot selected"></div> <small
                                            class="text-grey-lighten-1">Selected</small>
                                    </div>
                                    <div class="d-flex align-center">
                                        <div class="dot pending-hold"></div> <small class="text-orange-accent-2">Holding
                                            (Checking
                                            Out)</small>
                                    </div>
                                    <div class="d-flex align-center">
                                        <div class="dot sold-out"></div> <small class="text-grey-darken-1">Sold
                                            Out</small>
                                    </div>
                                </div>
                            </div>
                        </v-col>
                    </v-row>
                </v-container>
            </section>

            <section v-if="isParkingSelected && selectedSeats.length >= 1"
                class="parking-area-wrapper mt-5 d-flex justify-center">
                <v-container fluid class="px-5" width="92vw">
                    <v-row class="d-flex justify-center">
                        <v-col cols="12" md="8">
                            <div class="map-container pa-8 rounded-xl">
                                <div class="d-flex align-center gap-4 mb-10">
                                    <div class="car-info-pill pa-3 px-6 rounded-xl d-flex align-center cursor-pointer">
                                        <v-img src="https://img.icons8.com/color/48/car--v1.png" width="40"
                                            class="me-4" />

                                        <div>
                                            <div class="text-caption text-grey">Your Car</div>
                                            <v-menu activator="parent" transition="slide-y-transition">
                                                <template v-slot:activator="{ props }">
                                                    <div v-bind="props"
                                                        class="d-flex align-center font-weight-bold text-white">
                                                        {{ userCar.model }} ({{ userCar.plateNumber }})
                                                        <v-icon size="16" class="ms-1"
                                                            color="blue-lighten-2">mdi-chevron-down</v-icon>
                                                    </div>
                                                </template>

                                                <v-list bg-color="#1a1a24" theme="dark"
                                                    class="border-glass rounded-xl pa-2 mt-1" min-width="200px">
                                                    <v-list-item v-if="userVehicles.length === 0" disabled>
                                                        <v-list-item-title class="text-caption text-grey">No vehicles
                                                            saved
                                                            yet</v-list-item-title>
                                                    </v-list-item>

                                                    <v-list-item v-for="(v, idx) in userVehicles"
                                                        :key="v.plateNumber || idx" @click="userCar = { ...v }"
                                                        class="rounded-lg custom-dropdown-item py-2">
                                                        <template v-slot:prepend>
                                                            <v-icon size="12" :color="v.color || '#448aff'"
                                                                class="me-2">mdi-circle</v-icon>
                                                        </template>
                                                        <v-list-item-title class="font-weight-bold text-body-2">{{
                                                            v.model
                                                            }}</v-list-item-title>
                                                        <v-list-item-subtitle class="font-mono text-xsmall text-grey">{{
                                                            v.plateNumber }}</v-list-item-subtitle>
                                                    </v-list-item>
                                                </v-list>
                                            </v-menu>
                                        </div>
                                    </div>
                                    <div class="spot-info-pill pa-3 px-6 rounded-xl">
                                        <div class="text-caption text-grey">Your Spot</div>
                                        <div class="font-weight-bold text-blue">{{ selectedSpot || 'Not Selected' }}
                                        </div>
                                    </div>
                                    <div v-if="parkingTimeWindow" class="spot-info-pill pa-3 px-6 rounded-xl">
                                        <div class="text-caption text-grey">Free Parking Duration</div>
                                        <div class="font-weight-bold text-green-accent-3">
                                            {{ parkingTimeWindow.start }} - {{ parkingTimeWindow.end }}
                                        </div>
                                    </div>
                                </div>

                                <div class="d-flex align-center gap-4 my-3">
                                    <span class="text-grey me-4">Level</span>
                                    <v-btn v-for="lvl in currentParking.levels" :key="lvl"
                                        :color="selectedLevel === lvl ? 'blue-lighten-3' : 'grey-darken-3'"
                                        variant="flat" size="small" rounded="lg" class="px-4"
                                        @click="selectedLevel = lvl">
                                        {{ lvl }}
                                    </v-btn>
                                </div>

                                <div class="d-flex justify-space-between">
                                    <div v-for="(zone, zIdx) in currentParking.zones" :key="zone"
                                        class="parking-zone text-center">
                                        <span class="text-overline text-grey d-block mb-4">{{ zone }}</span>
                                        <div class="spots-container">
                                            <div v-for="n in currentParking.spotsPerZone" :key="n"
                                                class="parking-spot d-flex align-center justify-center mb-2" :class="{
                                                    'selected': selectedSpot === `${zone} ${110 + n}`,
                                                    'parking-paid-taken': isParkingPaid(zone, 110 + n),
                                                    'parking-pending-locked': isParkingPending(zone, 110 + n)
                                                }" @click="selectSpot(zone, 110 + n)">
                                                <span class="spot-num">{{ 110 + n }}</span>
                                                <v-icon v-if="selectedSpot === `${zone} ${110 + n}`" color="white"
                                                    size="18">mdi-car</v-icon>
                                            </div>
                                        </div>
                                        <div v-if="currentParking.aisleAfter.includes(zIdx)" class="parking-road"></div>
                                    </div>
                                </div>
                                <div class="d-flex justify-center gap-4 mt-3 flex-wrap">
                                    <div class="d-flex align-center">
                                        <div class="dot parking-available"></div>
                                        <small class="text-grey-lighten-1">Available Bay</small>
                                    </div>
                                    <div class="d-flex align-center">
                                        <div class="dot parking-selected"></div>
                                        <small class="text-grey-lighten-1">Your Selection</small>
                                    </div>
                                    <div class="d-flex align-center">
                                        <div class="dot parking-hold-legend"></div>
                                        <small class="text-orange-accent-2">Reserved Lock (Holding)</small>
                                    </div>
                                    <div class="d-flex align-center">
                                        <div class="dot parking-sold-legend"></div>
                                        <small class="text-grey-darken-1">Occupied Bay</small>
                                    </div>
                                </div>
                            </div>
                        </v-col>

                        <v-col cols="12" md="4">
                            <div class="order-sidebar pa-8">
                                <h4 class="text-h4 mb-8">Checkout</h4>

                                <div class="order-group mb-8">
                                    <div class="d-flex justify-space-between align-center mb-2">
                                        <span class="text-overline">Movie Ticket Details: </span>
                                    </div>
                                    <div class="d-flex justify-space-between text-caption text-grey">
                                        <span>{{ selectedSeats.length }} Seats</span>
                                        <span>{{selectedSeats.map(s => s.split('-').slice(-2).join('')).join(' ')
                                            }}</span>
                                    </div>
                                    <div class="d-flex justify-space-between text-caption text-grey">
                                        <span>Total:</span>
                                        <span>RM {{ subtotal }}</span>
                                    </div>
                                </div>

                                <div class="order-group mt-4">
                                    <div class="d-flex justify-space-between align-center mb-2">
                                        <span>Parking Details:</span>
                                    </div>
                                    <div class="d-flex justify-space-between text-caption text-grey">
                                        <span>Spot</span>
                                        <span class="text-blue">{{ selectedSpot || 'Not selected' }}</span>
                                    </div>
                                </div>

                                <div class="total-card-final pa-6 mt-3 rounded-xl">
                                    <div class="d-flex justify-space-between mb-2">
                                        <span class="fw-bold">Movie Tickets</span>
                                        <span>RM {{ subtotal }}</span>
                                    </div>
                                    <div class="d-flex justify-space-between mb-4">
                                        <span class=" fw-bold">Free Parking</span>
                                        <span>
                                            {{ parkingTimeWindow.start }} - {{ parkingTimeWindow.end }}
                                        </span>
                                    </div>
                                    <div class="d-flex justify-space-between align-center border-top pt-4">
                                        <span class="text-h6 font-weight-bold">Total Price</span>
                                        <span class="text-h5 font-weight-black">RM {{ subtotal }}</span>
                                    </div>
                                    <v-btn block variant="outlined" rounded="pill" height="50"
                                        class="mb-3 mt-3 text-none" @click="openVehicleModal">
                                        <span>
                                            <Plus size="18" class="me-2" />
                                        </span>
                                        Add Vehicles
                                    </v-btn>
                                    <v-btn :disabled="selectedSpot === null" block color="grey-darken-4" rounded="pill"
                                        height="55" class="font-weight-bold mt-3" :loading="isStoreLoading"
                                        @click="handleCheckoutStep">To
                                        Pay</v-btn>
                                </div>
                            </div>
                        </v-col>
                    </v-row>
                </v-container>
            </section>
            <v-dialog v-model="is3DPreviewOpen" fullscreen transition="dialog-bottom-transition">
                <v-card class="seat-preview-dialog" theme="dark">
                    <v-card-title class="d-flex justify-space-between align-center seat-preview-header">
                        <span>Seat View: {{ lastSelectedSeat.split('-').slice(-2).join('') }}</span>
                        <v-btn icon variant="text" @click="is3DPreviewOpen = false">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>

                    <v-card-text class="pa-0 seat-preview-body">
                        <SeatPreview3D v-if="is3DPreviewOpen" :selected-seat="lastSelectedSeat"
                            :experience-type="experienceType" :trailer-url="movie?.trailer" />
                    </v-card-text>
                </v-card>
            </v-dialog>
        </v-main>
        <v-dialog v-model="isVehicleModalOpen" max-width="480px" persistent theme="dark">
            <v-card class="rounded-xl overflow-hidden vehicle_modal">
                <v-card-item class="pa-5 border-bottom  bg-matte-black">
                    <div class="d-flex justify-space-between align-center">
                        <div>
                            <v-card-title class="text-h5 font-weight-black text-white pa-0">Manage
                                Vehicles</v-card-title>
                        </div>
                        <v-btn icon size="small" variant="tonal" color="grey-lighten-1" class="closeBtn"
                            @click="isVehicleModalOpen = false">
                            <X />
                        </v-btn>
                    </div>
                </v-card-item>

                <v-card-text class="pa-5">
                    <v-tabs v-model="activeVehicleTab" bg-color="transparent" color="blue-lighten-2" grow
                        slider-color="blue-lighten-2" class="
                        
                        -soft border-bottom mb-4">
                        <v-tab value="new">New Vehicle</v-tab>
                        <v-tab value="saved">
                            Saved Vehicles ({{ userVehicles.length }})
                        </v-tab>
                    </v-tabs>

                    <v-window v-model="activeVehicleTab">
                        <v-window-item value="new" class="fade-in-content">
                            <div class="d-flex align-center pa-4 mb-4 rounded-lg bg-glass 
                            gap-3 position-relative overflow-hidden">
                                <div class="vector-car-canvas">
                                    <svg width="72" height="44" viewBox="0 0 72 44" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <rect x="8" y="18" width="56" height="18" rx="4" :fill="vehicleForm.color" />
                                        <path d="M18 18 L24 8 L48 8 L54 18Z"
                                            :fill="adjustHexGlow(vehicleForm.color, -25)" />
                                        <circle cx="20" cy="36" r="6" fill="#0b0d12" stroke="rgba(255,255,255,0.15)"
                                            stroke-width="1" />
                                        <circle cx="20" cy="36" r="3" fill="#444" />
                                        <circle cx="52" cy="36" r="6" fill="#0b0d12" stroke="rgba(255,255,255,0.15)"
                                            stroke-width="1" />
                                        <circle cx="52" cy="36" r="3" fill="#444" />
                                        <rect x="25" y="10" width="10" height="7" rx="1"
                                            fill="rgba(164,197,255,0.25)" />
                                        <rect x="37" y="10" width="10" height="7" rx="1"
                                            fill="rgba(164,197,255,0.25)" />
                                        <rect x="9" y="22" width="7" height="4" rx="1" fill="rgba(255,220,80,0.7)" />
                                        <rect x="56" y="22" width="7" height="4" rx="1" fill="rgba(255,80,80,0.6)" />
                                    </svg>
                                </div>
                                <div class="min-width-0">
                                    <div
                                        class="live-plate-badge text-glow-blue tracking-widest font-weight-bold font-mono px-3 py-1 text-caption inline-block mb-1">
                                        {{ vehicleForm.plateNumber || 'QAA 1234 A' }}
                                    </div>
                                    <div class="text-caption text-grey truncate d-block"> {{ vehicleForm.model }}</div>
                                </div>
                            </div>

                            <v-label class=" text-grey-lighten-1 mb-1 ">Car Model Specification</v-label>
                            <v-text-field v-model="vehicleForm.model" placeholder="e.g. Proton X50, Honda Civic"
                                prepend-inner-icon="mdi-car-info" variant="solo" flat rounded="lg" density="comfortable"
                                class=" text-white"></v-text-field>

                            <v-label class="text-grey-lighten-1 mb-1 ">Plate
                                Reference String</v-label>
                            <v-text-field v-model="vehicleForm.plateNumber" placeholder="e.g. QAA 1234 A"
                                prepend-inner-icon="mdi-card-text-outline" variant="solo" flat rounded="lg"
                                density="comfortable" class="text-white"
                                @update:model-value="val => vehicleForm.plateNumber = val.toUpperCase()"></v-text-field>

                            <v-label class="text-grey-lighten-1 mb-2">Select
                                Shell Aesthetic Tone</v-label>
                            <div class="d-flex gap-2 flex-wrap mb-2">
                                <div v-for="color in ['#448aff', '#ff5252', '#00e676', '#fb8c00', '#ffffff', '#212121', '#ce93d8', '#80cbc4']"
                                    :key="color" class="color-swatch-pill cursor-pointer"
                                    :style="{ backgroundColor: color, borderColor: color === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'transparent' }"
                                    :class="{ 'active': vehicleForm.color === color }"
                                    @click="vehicleForm.color = color">
                                    <v-icon v-if="vehicleForm.color === color" size="14"
                                        :color="color === '#ffffff' ? '#111' : '#fff'">mdi-check</v-icon>
                                </div>
                            </div>
                        </v-window-item>

                        <v-window-item value="saved" class="fade-in-content">
                            <span class="text-grey-lighten-1 d-block mb-3">Your
                                Registered Vehicles Fleet</span>

                            <div v-if="userVehicles.length === 0" class="text-center py-8 bg-glass  rounded-xl px-4">
                                <v-icon size="36" color="grey-darken-2" class="mb-2">mdi-car-off</v-icon>
                                <p class="text-body-2 text-grey">No vehicles registered in storage memory cache loops
                                    yet.</p>
                            </div>

                            <div v-else
                                class="saved-fleet-scroller d-flex flex-column gap-2 max-height-saved overflow-y-auto pr-1">
                                <div v-for="(v, idx) in userVehicles" :key="v.plateNumber"
                                    class="fleet-row-item d-flex align-center justify-space-between pa-3 rounded-lg cursor-pointer transition-all">
                                    <div class="d-flex align-center gap-3">
                                        <div class="fleet-status-dot" :style="{ backgroundColor: v.color }"></div>
                                        <div class="min-width-0">
                                            <div class="text-body-2 font-weight-bold text-white truncate">{{ v.model }}
                                            </div>
                                            <div class="text-caption font-mono tracking-wider text-grey-lighten-1">{{
                                                v.plateNumber }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="d-flex align-center gap-2" @click.stop>
                                        <v-btn icon="mdi-trash-can-outline" variant="text" size="small"
                                            color="red-lighten-2" class="delete-fleet-btn hover-bg-red"
                                            title="Purge vehicle metadata"
                                            @click="deleteVehicleInstance(v.id, idx)"></v-btn>
                                    </div>
                                </div>
                            </div>
                        </v-window-item>
                    </v-window>
                </v-card-text>

                <v-card-actions class="pa-4 border-top bg-matte-black d-flex gap-2">
                    <v-btn class="btn-cancel text-none font-weight-bold flex-1" variant="outlined" rounded="lg"
                        height="40" @click="isVehicleModalOpen = false">Cancel</v-btn>

                    <v-btn v-if="activeVehicleTab === 'new'" class="btn-save text-none font-weight-bold flex-2"
                        color="#448aff" rounded="lg" height="40" variant="flat"
                        :disabled="!vehicleForm.model || !vehicleForm.plateNumber" @click="saveVehicle">
                        <v-icon start size="16">mdi-content-save-move</v-icon> Save Vehicle
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<style scoped>
.info-section {
    margin: 0 8vw;
}

.session-info-bar {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    width: fit-content;
    display: flex;
    gap: 24px;
}

.info-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    color: #777;
    margin-bottom: 2px;
    letter-spacing: 1px;
    line-height: 1;
}

.info-value {
    font-weight: 700;
    margin-bottom: 0;
    font-size: 0.95rem;
    color: #eee;
}

.quick-selector-wrapper {
    width: 95vw !important
}

.selector-glass-panel {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    backdrop-filter: blur(20px);
}

.label-tiny {
    font-size: 0.65rem;
    color: #5c6b89;
    text-transform: capitalize;
    margin-bottom: 2px;
}

.val-text {
    font-size: 1.1rem;
    font-weight: 500;
    color: #ffffff;
    letter-spacing: 0.5px;
}

.mini-date-pill {
    width: 45px;
    height: 70px;
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: transparent;
    transition: 0.3s ease;
    opacity: 0.4;
    cursor: pointer;
}

.mini-date-pill .day {
    font-size: 0.6rem;
    text-transform: uppercase;
}

.mini-date-pill .num {
    font-size: 1rem;
    font-weight: 700;
}

.mini-date-pill.active {
    background: #a4c5ff;
    color: #0d0d12 !important;
    opacity: 1;
    box-shadow: 0 4px 15px rgba(164, 197, 255, 0.3);
}

.mini-date-pill:hover:not(.active) {
    opacity: 0.8;
    background: rgba(255, 255, 255, 0.05);
}

.cursor-pointer {
    cursor: pointer;
}

.text-blue {
    color: #448aff !important;
}

.gap-2 {
    gap: 8px;
}

.step-item.active .step-outer-circle {
    background: rgba(255, 82, 82, 0.15);
    border-color: #ff5252;
    box-shadow: 0 0 15px rgba(255, 82, 82, 0.3);
}

.step-item.active .step-inner-circle {
    background: #ff5252;
    color: white;
}

.step-item.active .step-label-text {
    color: white;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.step-item.completed .step-outer-circle {
    border-color: #ff5252;
}

.step-item.completed .step-inner-circle {
    background: rgba(255, 82, 82, 0.2);
    color: #ff5252;
}

.step-item:hover:not(.active) .step-outer-circle {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.4);
}

.checkout-sidebar {
    background: transparent;
}

.payment-card {
    background: #a4c5ff;
    color: #0d0d12;
}

.border-top {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.map-container {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.screen-wrapper {
    width: 100%;
    margin: 0 auto 80px auto;
    perspective: 1400px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.curved-screen {
    width: 85%;
    height: 8px;
    background: #a4c5ff;
    border-radius: 50% / 100%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow:
        0 -12px 35px rgba(164, 197, 255, 0.7),
        0 -5px 15px rgba(164, 197, 255, 0.4),
        0 2px 5px rgba(255, 255, 255, 0.3);

    transform: rotateX(-35deg) scaleX(1.1);
}

.screen-text {
    font-size: 1rem;
    letter-spacing: 0.5rem;
    color: rgba(164, 197, 255, 0.5);
    text-transform: uppercase;
    font-weight: 800;
    margin-top: 15px;
}

.seat-pill {
    width: 32px;
    height: 26px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.seat-pill:hover:not(.taken) {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
}

.seat-pill.active {
    background: #a4c5ff;
    box-shadow: 0 0 12px rgba(164, 197, 255, 0.8);
}

.seat-pill.spacer {
    margin-right: 40px;
}

.aisle-space {
    width: 42px;
    height: 26px;
    background: transparent;
    pointer-events: none;
}

.row-label {
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.8rem;
    font-weight: bold;
    width: 20px;
}

.seat-pill.paid-taken {
    background: #151821 !important;
    border: 1px solid rgba(255, 255, 255, 0.03) !important;
    cursor: not-allowed !important;
    pointer-events: none;
    position: relative;
    overflow: hidden;
    opacity: 0.5;
}


.dot.sold-out {
    background: #151821;
    border: 1px solid rgba(255, 23, 68, 0.4);
    position: relative;
    overflow: hidden;
}

.seat-pill.pending-locked {
    background: rgba(255, 145, 0, 0.05) !important;
    border: 1px solid rgba(255, 145, 0, 0.3) !important;
    cursor: not-allowed !important;
    pointer-events: none;
    opacity: 0.6;
    animation: breathing-orange 2.5s infinite ease-in-out;
}

.dot.available {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.dot.selected {
    background: #a4c5ff;
}

.dot.pending-hold {
    background: rgba(255, 145, 0, 0.2);
    border: 1px solid #ff9100;
}

.dot.sold-out {
    background: #161920;
    opacity: 0.3;
}

@keyframes breathing-orange {

    0%,
    100% {
        border-color: rgba(255, 145, 0, 0.2);
        box-shadow: none;
    }

    50% {
        border-color: rgba(255, 145, 0, 0.6);
        box-shadow: 0 0 8px rgba(255, 145, 0, 0.2);
    }
}

.seats {
    width: 300px;
    display: flex;
    flex-wrap: wrap;
}

.dot {
    width: 12px;
    height: 12px;
    border-radius: 4px;
    margin-right: 8px;
}

.dot.available {
    background: rgba(255, 255, 255, 0.1);
}

.dot.selected {
    background: #a4c5ff;
}

.dot.taken {
    background: #1a1a24;
}

.letter-spacing-1 {
    letter-spacing: 1px;
}

.letter-spacing-2 {
    letter-spacing: 2px;
}

.car-info-pill,
.spot-info-pill {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    min-width: 180px;
}

.parking-spot {
    width: 90%;
    height: 40px;
    background: transparent;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    position: relative;
    transition: 0.3s;
}

.parking-spot:hover {
    background: rgba(68, 138, 255, 0.1);
}

.parking-spot.selected {
    background: #448aff;
    border-color: #448aff;
}

.parking-spot.parking-paid-taken {
    background: #151821;
    border-color: rgba(255, 23, 68, 0.35);
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
}

.parking-spot.parking-pending-locked {
    background: rgba(255, 145, 0, 0.08);
    border-color: rgba(255, 145, 0, 0.45);
    pointer-events: none;
    cursor: not-allowed;
    animation: breathing-orange 2.5s infinite ease-in-out;
}

.spot-num {
    position: absolute;
    left: 10px;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
}

.parking-zone {
    flex: 1;
    position: relative;
}

.parking-road {
    position: absolute;
    right: -5px;
    top: 40px;
    bottom: 0;
    width: 40px;
    background: repeating-linear-gradient(0deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.1) 10px,
            rgba(255, 255, 255, 0.1) 20px);
}

.total-card-final {
    background: #a4c5ff;
    color: #0d0d12;
}

.text-blue {
    color: #a4c5ff !important;
}

.color-pill {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.color-pill.active {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.5);
}

.save-btn {
    letter-spacing: 2px;
    font-size: 0.9rem;
    box-shadow: 0 4px 15px rgba(68, 138, 255, 0.3);
}

.save-btn:disabled {
    background: rgba(255, 255, 255, 0.05) !important;
    color: rgba(255, 255, 255, 0.2) !important;
}

:deep(.v-field--variant-outlined) {
    --v-field-border-opacity: 0.15;
    background: rgba(255, 255, 255, 0.02);
}

:deep(.v-field--focused) {
    background: rgba(68, 138, 255, 0.05);
}

.animate-pulse-slow {
    animation: pulseKey 2s infinite ease-in-out;
}

.dot.parking-available {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
}

.dot.parking-selected {
    background: #448aff;
    border: 1px solid rgba(68, 138, 255, 0.5);
}

.dot.parking-hold-legend {
    background: rgba(255, 145, 0, 0.15);
    border: 1px solid #ff9100;
}

.dot.parking-sold-legend {
    background: #151821;
    border: 1px solid rgba(255, 23, 68, 0.35);
}

@keyframes pulseKey {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.5;
        transform: scale(0.95);
    }
}

.border-bottom {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.inline-block {
    display: inline-block;
}

.live-plate-badge {
    background: #141d17;
    border: 1px solid rgba(0, 230, 118, 0.25);
    border-radius: 6px;
    color: #00e676;
    font-family: monospace;
}

.text-glow-blue {
    text-shadow: 0 0 8px rgba(68, 138, 255, 0.4);
}

.color-ring-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid transparent;
    transition: all 0.2s ease;
}

/* Shell Aesthetic Colour Grid Toggles */
.color-swatch-pill {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-in-out;
    border: 2px solid transparent;
}

.color-swatch-pill.active {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    border-color: #448aff !important;
}

.max-height-saved {
    max-height: 260px;
}

.fleet-row-item {
    background: rgba(255, 255, 255, 0.02);
    transition: all 0.2s ease;
}

.selected-active-row {
    background: rgba(68, 138, 255, 0.06) !important;
    border-color: #448aff !important;
}

.fleet-status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.delete-fleet-btn {
    opacity: 0.4;
    transition: opacity 0.2s ease, background 0.2s;
}

.fleet-row-item:hover .delete-fleet-btn {
    opacity: 1;
}

.delete-fleet-btn:hover {
    background: rgba(255, 82, 82, 0.1) !important;
}

.closeBtn {
    border-radius: 50%;
}

.vehicle_modal {
    background-color: #1a1a24;
}

.seat-preview-dialog {
    background: #050508 !important;
}

.seat-preview-header {
    min-height: 58px;
    background: rgba(5, 5, 8, 0.96);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.seat-preview-body {
    height: calc(100vh - 58px);
    overflow: hidden;
}
</style>
<!-- Add Loading -->
