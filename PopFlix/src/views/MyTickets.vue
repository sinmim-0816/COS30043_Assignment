<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
    Calendar, MapPin, Instagram, MessageCircle,
    Clock, Copy, Check, X, Sofa, Pencil, Star
} from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';

// Import other hooks and components
import { useTickets } from '@/hook/useTickets';
import { useReviews } from '@/hook/useReviews';
import { useAuthStore } from '@/stores/auth';

const { ticketsList: tickets, isTicketsLoading, ticketsError, fetchTickets } = useTickets();
const { submitReview: postReview } = useReviews();
const authStore = useAuthStore();
const currentUser = computed(() => authStore.user);
const selectedTicketIndex = ref(0);
const isOverlayOpen = ref(false);
const isFlipped = ref(false);
const copySuccess = ref(false);
const currentTime = ref(new Date());

const isReviewDialogOpen = ref(false);
const reviewSubmitting = ref(false);
const reviewError = ref('');
const reviewSuccess = ref('');
const reviewTicket = ref(null);
const newReview = ref({
    rating: 0,
    title: '',
    comment: ''
});

const activeTicket = computed(() => tickets.value[selectedTicketIndex.value]);

const countdowns = computed(() => {
    return tickets.value.map(t => {
        const diff = new Date(t.startTime) - currentTime.value;
        if (diff <= 0) return { expired: true, text: 'Completed', hrs: '00', mins: '00', secs: '00', critical: false };

        const totalSecs = Math.floor(diff / 1000);
        const totalMins = Math.floor(totalSecs / 60);
        const totalHrs = Math.floor(totalMins / 60);

        const hrs = String(totalHrs).padStart(2, '0');
        const mins = String(totalMins % 60).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');

        return {
            expired: false,
            text: totalHrs < 4 ? `${hrs}h ${mins}m left` : `${Math.ceil(totalHrs / 24)} Days Away`,
            hrs, mins, secs,
            critical: totalHrs < 4
        };
    });
});

let timerInstance = null;
onMounted(async () => {
    await fetchTickets();
    timerInstance = setInterval(() => { currentTime.value = new Date(); }, 1000);
});

onUnmounted(() => {
    if (timerInstance) clearInterval(timerInstance);
});

const handleOpenTicketOverlay = (ticket) => {
    const index = tickets.value.findIndex(t => t.id === ticket.id);
    selectedTicketIndex.value = index;
    isFlipped.value = false;
    isOverlayOpen.value = true;

    setTimeout(() => {
        isFlipped.value = true;
    }, 150);
};

const handleCloseOverlay = () => {
    isFlipped.value = false;

    setTimeout(() => {
        isOverlayOpen.value = false;
        selectedTicketIndex.value = null;
    }, 550);
};

const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    copySuccess.value = true;
    setTimeout(() => { copySuccess.value = false; }, 2000);
};

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getHallLabel = (hall) => {
    return String(hall || 'Hall unavailable').split('—')[0].split('-')[0].trim();
};

const getParkingLabel = (parkingSpot) => {
    if (!parkingSpot || parkingSpot === 'None') return 'None';
    return String(parkingSpot).split('·').pop().trim();
};

const sortedTickets = computed(() => {
    return [...tickets.value].sort((a, b) => {
        return new Date(b.startTime) - new Date(a.startTime);
    });
});

const setRating = (value) => {
    newReview.value.rating = value;
};

const openReviewDialog = (ticket) => {
    reviewTicket.value = ticket;
    reviewError.value = '';
    reviewSuccess.value = '';
    newReview.value = { rating: 0, title: '', comment: '' };
    isReviewDialogOpen.value = true;
};

const submitReview = async () => {
    reviewError.value = '';
    reviewSuccess.value = '';

    if (!reviewTicket.value?.bookingId) {
        reviewError.value = 'Unable to identify booking for this ticket.';
        return;
    }
    const userId = currentUser.value?.id;
    if (!userId) {
        reviewError.value = 'Please login again before posting review.';
        return;
    }
    if (!newReview.value.rating || newReview.value.rating < 1) {
        reviewError.value = 'Please select a star rating.';
        return;
    }
    if (!newReview.value.comment?.trim()) {
        reviewError.value = 'Please enter your comment.';
        return;
    }

    reviewSubmitting.value = true;
    try {
        await postReview({
            title: newReview.value.title?.trim() || 'Review',
            comment: newReview.value.comment.trim(),
            rating: Number(newReview.value.rating),
            booking: { id: Number(reviewTicket.value.bookingId) },
            user: { id: Number(userId) }
        });
        reviewSuccess.value = 'Review posted successfully.';
        newReview.value = { rating: 0, title: '', comment: '' };
        setTimeout(() => {
            isReviewDialogOpen.value = false;
            reviewTicket.value = null;
            reviewSuccess.value = '';
        }, 900);
    } catch (err) {
        reviewError.value = err?.response?.data?.message || 'Failed to post review.';
    } finally {
        reviewSubmitting.value = false;
    }
};
</script>

<template>
    <v-layout class="cinematic-dashboard fill-height align-start pa-6" fluid width="100vw">
        <v-row class="mt-3 w-100 ma-0">
            <h2>My Bookings</h2>

            <v-col cols="12" class="px-0">
                <div v-if="isTicketsLoading" class="tickets-state-panel">
                    <v-progress-circular indeterminate color="red-accent-3" size="46"></v-progress-circular>
                    <p class="mt-4 text-grey-lighten-1">Loading your confirmed tickets...</p>
                </div>

                <v-alert v-else-if="ticketsError" type="error" variant="tonal" class="mb-5 rounded-lg">
                    {{ ticketsError }}
                </v-alert>

                <div v-else-if="tickets.length === 0" class="tickets-state-panel">
                    <v-icon size="58" color="grey-darken-1" class="mb-3">mdi-ticket-confirmation-outline</v-icon>
                    <h3 class="text-white">No confirmed tickets yet</h3>
                    <p class="text-grey-lighten-1">Paid bookings will appear here automatically.</p>
                </div>

                <div v-else class="cyber-ticket-stack-container" :class="{ 'overlay-active': isOverlayOpen }">
                    <div v-for="(t, idx) in sortedTickets" :key="t.id"
                        class="horizontal-ticket-stub-card position-relative mb-3" :class="{
                            'selected-card': isOverlayOpen && selectedTicketIndex === tickets.indexOf(t),

                            'hidden-card': isOverlayOpen && selectedTicketIndex !== tickets.indexOf(t),
                        }" @click="handleOpenTicketOverlay(t)"
                        :style="{ '--ticket-accent': t.themeColor, '--ticket-glow': t.glassGlow }">
                        <div class="stub-silhouette" :style="{ backgroundImage: `url(${t.backdrop})` }"></div>
                        <div class="stub-darkener-gradient"></div>

                        <div class="stub-inner-layout">
                            <div class="neon-identity-stripe"></div>

                            <div class="stub-poster-dock d-none d-sm-flex align-center justify-center">
                                <v-img :src="t.poster" cover width="100%" height="100%" />
                            </div>

                            <div class="stub-center-body d-flex flex-column justify-space-between pa-4 ">
                                <div>
                                    <div class="d-flex align-center gap-2 mb-1">
                                        <span class="experience-pill" :style="{ background: t.themeColor }">{{
                                            t.experience }}</span>
                                        <span class="text-caption text-grey-lighten-1 font-weight-medium">{{ t.runtime
                                        }} • {{ t.certificate }}</span>
                                    </div>
                                    <h4 class="text-white font-weight-bold tracking-tight mb-2">{{ t.title }}</h4>
                                    <div class="d-flex align-center gap-1 mb-2">
                                        <Armchair size="12" class="text-grey-lighten-1" />
                                        <span class="text-caption font-weight-bold" style="color: var(--ticket-accent)">
                                            <Sofa size="18" /> {{ t.seats.join(', ') }}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    class="d-flex justify-space-between align-center flex-wrap gap-2 pt-2 border-top-dashed">
                                    <div class="metadata-rows-group">
                                        <div
                                            class="d-flex align-center text-caption text-grey-lighten-2 mb-1 font-weight-medium">
                                            <Calendar size="13" class="me-1" /> {{ formatDate(t.startTime) }} &bull; {{
                                                formatTime(t.startTime) }}
                                        </div>
                                        <div
                                            class="d-flex align-center text-caption text-grey-darken-1 font-weight-medium">
                                            <MapPin size="13" class="me-1" /> {{ t.cinema }}
                                        </div>
                                    </div>

                                    <span class="status-badge-pill"
                                        :class="[countdowns[idx].expired ? 'expired' : (countdowns[idx].critical ? 'flash' : 'active')]">
                                        <Clock size="12" class="me-1" /> {{ countdowns[idx].text }}
                                    </span>
                                </div>
                            </div>

                            <div class="skeuo-perforation-gate-vertical">
                                <div class="notch-cuttop-horizontal"></div>
                                <div class="stitch-bead-line-vertical"></div>
                                <div class="notch-cutbottom-horizontal"></div>
                            </div>

                            <div
                                class="stub-qr-dock pa-4 text-center d-none d-md-flex flex-column align-center justify-center">
                                <div class="qr-code-canvas-container rounded-lg bg-white pa-2 mb-1">
                                    <div class="qr-code-canvas-container rounded-lg bg-white pa-2 mb-1">
                                        <qrcode-vue :value="t.id.toString()" :size="52" level="H" />
                                    </div>
                                </div>
                                <span class="text-uppercase tracking-widest text-grey font-weight-black"
                                    style="font-size: 8px;">FAST PASS</span>
                                <div class="d-flex justify-center mt-3">
                                    <v-btn class=" review-btn rounded-pill" @click.stop="openReviewDialog(t)">
                                        <span>
                                            <Pencil size="16" class="me-2" />
                                        </span>Leave a Review
                                    </v-btn>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </v-col>
        </v-row>
        <v-dialog v-model="isReviewDialogOpen" max-width="320">

            <v-card class="clipping clip-1 pa-6">
                <div class="clip-tape"></div>

                <v-card-title class="clip-headline fw-bold text-center">Leave a Comment</v-card-title>

                <v-card-text class="px-0">
                    <p class="clip-byline d-flex align-center gap-1">
                        {{ currentUser ? currentUser.firstName : 'Anonymous' }} •

                        <span class="d-flex">
                            <Star v-for="n in 5" :key="n" size="20" :fill="n <= newReview.rating ? '#f5c518' : 'none'"
                                :color="n <= newReview.rating ? '#f5c518' : '#ccc'" stroke-width="1.5"
                                class="star-picker" @click="setRating(n)" />
                        </span>
                    </p>

                    <v-text-field v-model="newReview.title" placeholder="Headline Title" variant="plain"
                        class="clip-headline-input"></v-text-field>

                    <v-textarea v-model="newReview.comment" placeholder="Your review..." variant="plain"
                        class="clip-body-input" rows="3"></v-textarea>
                </v-card-text>

                <v-card-actions class="px-0">
                    <v-btn block class="submit-review-btn" :loading="reviewSubmitting" @click="submitReview">Post
                        Review</v-btn>
                </v-card-actions>
                <p v-if="reviewError" class="review-error mt-2">{{ reviewError }}</p>
                <p v-if="reviewSuccess" class="review-success mt-2">{{ reviewSuccess }}</p>
            </v-card>
        </v-dialog>

        <v-dialog v-model="isOverlayOpen" fullscreen transition="dialog-fade-transition">
            <div v-if="activeTicket" class="holographic-overlay-stage"
                :style="{ '--t-color': activeTicket.themeColor, '--t-glow': activeTicket.glassGlow }">

                <div class="ambient-screen-backdrop-blur" :style="{ backgroundImage: `url(${activeTicket.poster})` }">
                </div>

                <div class="viewport-3d-axis">

                    <v-btn icon class="close-overlay-floating-btn" color="white" variant="tonal"
                        @click="handleCloseOverlay">
                        <X size="20" />
                    </v-btn>

                    <div class="ticket-3d-rotator-chassis" :class="{ 'perform-3d-flip': isFlipped }">

                        <div class="face horizontal-dummy-front">
                            <div class="horizontal-ticket-stub-card position-relative"
                                style="width: 100%; height: 155px;">
                                <div class="stub-silhouette"
                                    :style="{ backgroundImage: `url(${activeTicket.backdrop})` }"></div>
                                <div class="stub-inner-layout">
                                    <div class="neon-identity-stripe"></div>
                                    <div class="stub-center-body">
                                        <h4 class="text-white">{{ activeTicket.title }}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="face vertical-ticket-back">
                            <div class="physical-stub-card scrollable-ticket-body">

                                <div class="stub-top-poster-frame">
                                    <v-img :src="activeTicket.poster" cover class="poster-image-render" />
                                    <div
                                        class="poster-floating-headers d-flex justify-space-between w-100 pa-4 position-absolute top-0 left-0">
                                        <span class="popflix-tag font-weight-black">POP<span
                                                class="text-red">FLIX</span></span>
                                        <span class="secure-token-pill-badge">{{ activeTicket.status }}</span>
                                    </div>
                                </div>

                                <div class="skeuomorphic-tear-divider">
                                    <div class="left-hollow-notch"></div>
                                    <div class="perforated-stitch-line"></div>
                                    <div class="right-hollow-notch"></div>
                                </div>

                                <div class="stub-bottom-info-deck pa-6 text-center">
                                    <div class="d-flex align-center justify-center gap-2 mb-1 flex-wrap">
                                        <h4 class="stub-movie-title">{{ activeTicket.title }}</h4>
                                        <span class="stub-experience-badge"
                                            :style="{ background: activeTicket.themeColor }">
                                            {{ activeTicket.experience }}
                                        </span>
                                    </div>

                                    <p class="stub-datetime-row mb-4">
                                        {{ formatDate(activeTicket.startTime) }}, {{ formatTime(activeTicket.startTime)
                                        }}
                                    </p>

                                    <div class="stub-details-inline-grid mb-5">
                                        <div class="detail-cell">
                                            <span class="lbl">Hall</span>
                                            <span class="val">{{ getHallLabel(activeTicket.hall) }}</span>
                                        </div>
                                        <v-divider vertical class="mx-3 border-opacity-20" color="#111" />
                                        <div class="detail-cell">
                                            <span class="lbl">Seats</span>
                                            <span class="val font-mono font-weight-black">{{
                                                activeTicket.seats.join(', ') }}</span>
                                        </div>
                                        <v-divider vertical class="mx-3 border-opacity-20" color="#111" />
                                        <div class="detail-cell">
                                            <span class="lbl">Parking</span>
                                            <span class="val text-blue-darken-2 font-weight-bold">
                                                {{ getParkingLabel(activeTicket.parkingSpot) }}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="d-flex justify-center mb-5">
                                        <div class="qr-code-holder pa-2 rounded-xl bg-grey-lighten-4">
                                            <div class="qr-code-canvas-container rounded-lg bg-white pa-2">
                                                <qrcode-vue :value="activeTicket.id.toString()" :size="100" level="H" />
                                            </div>
                                        </div>
                                    </div>

                                    <div class="stub-barcode-area mb-4">
                                        <div class="barcode-lines-flex-deck mb-1">
                                            <span v-for="n in 48" :key="n" class="barcode-tick-line"
                                                :style="{ width: `${(n % 4 === 0 ? 3.5 : (n % 2 === 0 ? 1.5 : 2.5))}px`, opacity: n % 11 === 0 ? 0 : 1 }"></span>
                                        </div>
                                        <div class="d-flex align-center justify-center gap-2 mt-2">
                                            <span
                                                class="barcode-reference-string font-mono tracking-widest text-uppercase">{{
                                                    activeTicket.id }}</span>
                                            <v-btn icon size="x-small" variant="plain" color="grey-darken-1"
                                                class="rounded-lg mt-1" @click="handleCopyToClipboard(activeTicket.id)">
                                                <Check v-if="copySuccess" size="14" color="#00e676" />
                                                <Copy v-else size="14" />
                                            </v-btn>
                                        </div>
                                    </div>

                                    <div class="d-flex justify-center gap-2 mt-4 button-pills-row">
                                        <a href="https://www.instagram.com/" target="_blank"
                                            class="luxury-sharing-pill-btn instagram text-none font-weight-black text-caption px-5 py-2 rounded-pill">
                                            <Instagram size="14" class="me-1" /> Story
                                        </a>
                                        <a :href="`https://api.whatsapp.com/send?text=Catching ${encodeURIComponent(activeTicket.title)}! Seats: ${activeTicket.seats.join(', ')}.`"
                                            target="_blank"
                                            class="luxury-sharing-pill-btn whatsapp text-none font-weight-black text-caption px-5 py-2 rounded-pill">
                                            <MessageCircle size="14" class="me-1" /> Send
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </v-dialog>
    </v-layout>
</template>

<style scoped>
.cinematic-dashboard {
    background: #0e111b;
    min-height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
    position: relative;
    overflow-x: hidden;
}

h2 {
    font-weight: 800;
    margin-bottom: 20px;
}

.cyber-ticket-stack-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 840px;
    margin: 0 auto;
}

.tickets-state-panel {
    min-height: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.horizontal-ticket-stub-card {
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
    cursor: pointer;
    transition: scale 0.2s ease;
}

.horizontal-ticket-stub-card:hover {
    scale: 1.05
}

.stub-inner-layout {
    display: flex;
    min-height: 155px;
    position: relative;
    z-index: 1;
}

.stub-silhouette {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: 0.07;
    pointer-events: none;
}

.stub-darkener-gradient {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.neon-identity-stripe {
    width: 5px;
    background: linear-gradient(to bottom, var(--ticket-accent), transparent);
    flex-shrink: 0;
}

.stub-poster-dock {
    width: 130px;
    height: 200px;
    background: rgba(0, 0, 0, 0.3);
}

.notch-track-gate {
    position: relative;
    width: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 3;
}

.interior-void-notch-left {
    width: 24px;
    height: 24px;
    background: #06080f;
    border-radius: 50%;
    position: absolute;
    left: -12px;
}

.stub-center-body {
    border-left: 1px dashed rgba(255, 255, 255, 0.05);
    min-width: 500px !important;
    justify-content: center;
}

.experience-pill {
    font-size: 9px;
    font-weight: 900;
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    letter-spacing: 1px;
}

.border-top-dashed {
    border-top: 1px dashed rgba(255, 255, 255, 0.08);
}

.meta-genres-tag {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
}

.movie-title-header {
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
    margin-top: 1px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.cert-pill-box {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 1px 6px;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
}

.ticket-footer-alignment-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px dashed rgba(255, 255, 255, 0.06);
}

.log-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
}

.opacity-6 {
    opacity: 0.45;
}

.countdown-capsule {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    color: #00e676;
    display: flex;
    align-items: center;
    gap: 6px;
}

.capsule-beacon {
    width: 6px;
    height: 6px;
    background: #00e676;
    border-radius: 50%;
    box-shadow: 0 0 8px #00e676;
}

.skeuo-perforation-gate-vertical {
    position: relative;
    width: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    z-index: 4;
}

.notch-cuttop-horizontal,
.notch-cutbottom-horizontal {
    width: 24px;
    height: 12px;
    background: #06080f;
    position: absolute;
}

.notch-cuttop-horizontal {
    border-radius: 0 0 12px 12px;
    top: -1px;
}

.notch-cutbottom-horizontal {
    border-radius: 12px 12px 0 0;
    bottom: -1px;
}

.stitch-bead-line-vertical {
    flex: 1;
    border-left: 2px dashed rgba(255, 255, 255, 0.1);
    margin: 14px 0;
}

.stub-qr-dock {
    width: 180px;
    border-left: 1px solid rgba(255, 255, 255, 0.02);
    background: rgba(255, 255, 255, 0.005);
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
    display: flex;
    align-content: center;
}

.qr-code-canvas-container {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

.holographic-overlay-stage {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    position: fixed;
    overflow: hidden;
    justify-content: center;
}

.ambient-screen-backdrop-blur {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: blur(60px) brightness(0.2) saturate(1.5);
    opacity: 0.85;
    z-index: 0;
}

.viewport-3d-axis {
    position: relative;
    perspective: 2000px;
    z-index: 1;
}

.close-overlay-floating-btn {
    z-index: 10;
    margin-left: auto;
    display: block;
    border-radius: 50%;
}


.ticket-3d-rotator-chassis {
    width: 375px;
    height: 650px;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.125);
    transform: rotateY(0deg);
}

.ticket-3d-rotator-chassis.perform-3d-flip {
    transform: rotateY(180deg);
}

.face {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    overflow: visible;
}

.vertical-ticket-back {
    transform: rotateY(180deg);
    z-index: 1;
    height: 100%;
}

.physical-stub-card {
    max-width: 375px;
    border-radius: 28px;
    overflow: hidden;
    position: relative;
    z-index: 1;
    max-height: 100%;
}

.scrollable-ticket-body {
    overflow-y: auto;
}

.scrollable-ticket-body::-webkit-scrollbar {
    width: 4px;
}

.scrollable-ticket-body::-webkit-scrollbar-track {
    background: transparent;
}

.scrollable-ticket-body::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 10px;
}

.stub-top-poster-frame {
    width: 100%;
    height: 400px;
    position: relative;
    background: #000;
    flex-shrink: 0;
}

.poster-image-render {
    width: 100%;
    height: 100%;
}

.popflix-tag {
    font-size: 14px;
    letter-spacing: 2.5px;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.secure-token-pill-badge {
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 3px 12px;
    font-size: 9px;
    font-weight: 800;
    border-radius: 20px;
    color: #fff;
    letter-spacing: 1px;
}

.skeuomorphic-tear-divider {
    display: flex;
    align-items: center;
    background: #ffffff;
    margin: 0 -12px;
    position: relative;
    height: 24px;
    flex-shrink: 0;
}

.left-hollow-notch,
.right-hollow-notch {
    width: 24px;
    height: 24px;
    background: rgba(6, 8, 15, 0.96);
    border-radius: 50%;
    flex-shrink: 0;
}

.left-hollow-notch {
    margin-right: -4px;
}

.right-hollow-notch {
    margin-left: -4px;
}

.perforated-stitch-line {
    flex: 1;
    border-top: 2px dashed #cbd5e1;
    margin: 0 6px;
}

.stub-bottom-info-deck {
    background: #ffffff;
    color: #1e293b;
}

.stub-movie-title {
    font-size: 25px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.6px;
    line-height: 1.15;
}

.stub-experience-badge {
    color: #ffffff;
    font-size: 10px;
    font-weight: 900;
    padding: 2px 8px;
    border-radius: 5px;
    letter-spacing: 0.5px;
}

.stub-datetime-row {
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
}

.stub-details-inline-grid {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #d1e8ff9e;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid #f1f5f9;
}

.detail-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.detail-cell .lbl {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #6daaff;
    font-weight: bold;
}

.detail-cell .val {
    font-size: 14px;
    font-weight: 800;
    color: #334155;
    margin-top: 2px;
}

.qr-code-holder {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
}

.stub-barcode-area {
    padding: 0 5px;
}

.barcode-lines-flex-deck {
    display: flex;
    justify-content: center;
    align-items: stretch;
    height: 42px;
    gap: 2.2px;
}

.barcode-tick-line {
    background: #111111;
    border-radius: 0.5px;
}

.barcode-reference-string {
    font-size: 9.5px;
    font-weight: bold;
    letter-spacing: 2px;
    color: #64748b;
    display: block;
}

.luxury-sharing-pill-btn {
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition: all 0.25s ease;
}

.luxury-sharing-pill-btn.instagram {
    border: 1px solid rgba(225, 48, 108, 0.15);
    background: rgba(225, 48, 108, 0.03);
    color: #e1306c;
}

.luxury-sharing-pill-btn.whatsapp {
    border: 1px solid rgba(37, 211, 102, 0.15);
    background: rgba(37, 211, 102, 0.03);
    color: #25d366;
}

@keyframes heartPulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(0.85);
        opacity: 0.4;
    }
}

.review-btn {
    border: 1px solid rgba(245, 197, 24, 0.25);
    background: rgba(245, 197, 24, 0.05);
    color: #f5c518;
    cursor: pointer;
    transition: all 0.3s ease;
}

.review-btn:hover {
    background: #f5c518;
    color: #000;
}

.clipping.v-card {
    background: #f5f0e0;
    border: 0.5px solid #ddd;
    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.5);
    color: #111;
    overflow: visible;
    width: 380px;
    min-height: 280px;
}

.clip-headline-input :deep(input) {
    font-family: Georgia, serif;
    font-weight: 900;
    color: #111;
    line-height: 1.1;
    border-bottom: 2px solid #111;
}

.clip-body-input {
    font-family: Georgia, serif;
    color: #333;
    font-style: italic;
    line-height: 1.5;
    border-bottom: 2px solid #111;
    padding-top: 5px
}

.submit-review-btn {
    background: #7f1d1d;
    color: #fef2f2;
    border: none;
    border-radius: 4px;
    font-weight: 700;
    letter-spacing: 2px;
}

.clip-tape {
    position: absolute;
    top: -10px;
    left: 40%;
    width: 100px;
    height: 30px;
    background: rgba(255, 54, 54, 0.3);
    backdrop-filter: blur(2px);
    transform: rotate(-2deg);
}
.clip-byline {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px; 
}

.v-rating {
    pointer-events: auto !important;
    position: relative;
    z-index: 10 !important;
}

.clipping.v-card :deep(.v-card-text) {
    pointer-events: auto !important;
}

.star-picker {
    cursor: pointer;
    transition: transform 0.15s ease;
}

.star-picker:hover {
    transform: scale(1.1);
}

.review-error {
    color: #b91c1c;
    font-size: 12px;
    font-weight: 600;
}

.review-success {
    color: #15803d;
    font-size: 12px;
    font-weight: 600;
}
</style>

