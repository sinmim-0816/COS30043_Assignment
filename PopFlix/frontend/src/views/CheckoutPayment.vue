<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Sofa, CheckCircle2 } from 'lucide-vue-next';

// Import other hook and components
import { useBookingStore } from '../stores/booking';
import { useAuthStore } from '../stores/auth';
import { useMovieDetails } from '../hook/useMovieDetails';
import { useShowtimes } from '../hook/useShowtimes';
import FooterView from '@/components/FooterView.vue';

const { fetchShowtimeById } = useShowtimes();

const router = useRouter();
const route = useRoute();
const bookingStore = useBookingStore();
const authStore = useAuthStore();
const { movie, loadMovieDetails, getImageURL, isLoading } = useMovieDetails();
const currentStage = ref(2);
const generatedTxnId = ref('');

const paymentMethod = ref('stripe');
const saveInfo = ref(true);
const isMovieLoading = ref(true);
const isDarkTheme = ref(false);
const themeObserver = ref(null);

const syncThemeState = () => {
    isDarkTheme.value =
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark';
};

// Mock form data bindings
const cardName = ref('');
const cardNumber = ref('');
const cardExpiry = ref('');
const cardCvc = ref('');

// Map reactive computation pipelines directly out of the booking store loop
const currentBooking = computed(() => bookingStore.currentBooking);
const countdownText = computed(() => bookingStore.countdownText);
const apiError = computed(() => bookingStore.errorMessages);
const isStoreLoading = computed(() => bookingStore.isLoading);

// Compute membership discount based on user tier
const membershipTier = computed(() => authStore.user?.tier || 'Bronze');
const discountPercentage = computed(() => {
  if (membershipTier.value === 'Gold') return 20;
  if (membershipTier.value === 'Silver') return 10;
  return 0;
});
const originalPrice = computed(() => {
  const finalPrice = Number(currentBooking.value?.totalPrice || 0);
  if (discountPercentage.value === 0) return finalPrice;
  return finalPrice / (1 - discountPercentage.value / 100);
});
const discountAmount = computed(() => {
  return originalPrice.value - subtotalPrice.value;
});

const navigateHome=()=>{
    bookingStore.stopGlobalTimer();
    localStorage.removeItem('timerDeadline');
    localStorage.removeItem('completedBookingBackup');
    localStorage.removeItem('completedTxnIdBackup');
    router.push({ name: 'MyTickets' });
}

// Load movie details based on current booking instance on mount
onMounted(async () => {
    syncThemeState();

    themeObserver.value = new MutationObserver(() => {
        syncThemeState();
    });

    themeObserver.value.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });

    if (route.query.stage === 'payment') {
        localStorage.removeItem('completedBookingBackup');
        localStorage.removeItem('completedTxnIdBackup');
    }

    const completedSessionStr = localStorage.getItem('completedBookingBackup');
    if (completedSessionStr) {
        const completedData = JSON.parse(completedSessionStr);
        currentStage.value = 3;
        generatedTxnId.value = localStorage.getItem('completedTxnIdBackup') || 'TXN_SECURED';
        isMovieLoading.value = true;

        if (completedData.showtimeId) {
            const showtimeData = await fetchShowtimeById(completedData.showtimeId);
            const targetMovieId = showtimeData?.movieId || showtimeData?.movie_id;
            if (targetMovieId) await loadMovieDetails(targetMovieId);
        }
        isMovieLoading.value = false;
        return;
    }
    if (currentBooking.value) {
        if (currentBooking.value.status === 'PAID' && route.query.stage !== 'payment') {
            currentStage.value = 3;
            bookingStore.stopGlobalTimer();
            localStorage.removeItem('timerDeadline');
            isMovieLoading.value = false;
            return;
        }
        currentStage.value = 2;

        try {
            isMovieLoading.value = true;
            const targetShowtimeId = currentBooking.value.showtimeId;
            if (targetShowtimeId) {
                const showtimeData = await fetchShowtimeById(targetShowtimeId);
                const targetMovieId = showtimeData?.movieId || showtimeData?.movie_id;

                if (targetMovieId) {
                    await loadMovieDetails(targetMovieId);
                } else {
                    console.error("Could not find a movie relation key inside showtime response:", showtimeData);
                }
            } else {
                console.warn("No showtimeId found inside the currentBooking state wrapper.");
            }
        } catch (err) {
            console.error("Failed to populate movie details chain:", err);
        } finally {
            isMovieLoading.value = false;
        }

        const savedDeadline = localStorage.getItem('timerDeadline');
        const now = Date.now();
        let remainingSeconds = 480;

        if (savedDeadline) {
            remainingSeconds = Math.floor((Number(savedDeadline) - now) / 1000);
        } else if (currentBooking.value.expiresAt) {
            const deadline = new Date(currentBooking.value.expiresAt).getTime();
            localStorage.setItem('timerDeadline', deadline.toString());
            remainingSeconds = Math.floor((deadline - now) / 1000);
        }
        if (remainingSeconds > 0) {
            bookingStore.startGlobalTimer(remainingSeconds, () => {
                localStorage.removeItem('timerDeadline');
                if (currentStage.value !== 3) {
                    router.push({ path: '/movies' });
                }
            });
        } else {
            cleanupAndExit();
        }

    } else {
        router.push({ path: '/movies' });
    }
});

onUnmounted(() => {
    themeObserver.value?.disconnect();
});

watch(currentBooking, (newVal, oldVal) => {
    if (!newVal && oldVal && currentStage.value !== 3) {
        alert("The 8-minute reservation timeout window expired. Your locked items have been freed.");
        cleanupAndExit();
    }
});

const subtotalPrice = computed(() => Number(currentBooking.value?.totalPrice || 0));


const cleanupAndExit = () => {
    localStorage.removeItem('timerDeadline');
    bookingStore.clearBookingSession();
    router.push({ path: '/movies' });
};

const goBack = () => {
    cleanupAndExit();
};

const handlePaymentExecution = async () => {
    if (paymentMethod.value === 'stripe') {
        const cleanCard = cardNumber.value.replace(/\s+/g, '');
        if (cleanCard.length < 16) {
            bookingStore.errorMessages = "Invalid card configuration layout. Please use a standard 16-digit number string.";
            return;
        }
    }

    try {
        generatedTxnId.value = 'TXN_STRIPE_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        localStorage.setItem('completedBookingBackup', JSON.stringify(currentBooking.value));
        localStorage.setItem('completedTxnIdBackup', generatedTxnId.value);
        await bookingStore.confirmPayment(generatedTxnId.value, subtotalPrice.value, paymentMethod.value);

        bookingStore.stopGlobalTimer();
        localStorage.removeItem('timerDeadline');

        currentStage.value = 3;
    } catch (err) {
        console.error("Gateway pipeline rejected settlement routing:", err);
        localStorage.removeItem('completedBookingBackup');
        localStorage.removeItem('completedTxnIdBackup');
    }
};

// Form Input Auto-Mask Helper Filters
const formatCardNumber = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    cardNumber.value = formatted.substring(0, 19);
};

const formatExpiry = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        cardExpiry.value = value.substring(0, 2) + '/' + value.substring(2, 4);
    } else {
        cardExpiry.value = value;
    }
};

const formattedSeats = computed(() => {
    if (!currentBooking.value || !currentBooking.value.tickets || currentBooking.value.tickets.length === 0) {
        return 'No Seats Selected';
    }

    return currentBooking.value.tickets.map(ticket => {
        const parts = ticket.seatNumber.split('-');
        return parts.length >= 2 ? parts.slice(-2).join('') : ticket.seatNumber;
    }).join(', ');
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
    <v-app v-else>
    <v-container
        width="100vw"
        fluid
        class="fill-height bg-dark-theater checkout-shell"
        :class="isDarkTheme ? 'theme-dark' : 'theme-light'"
        :theme="isDarkTheme ? 'dark' : 'light'"
    >
        <h2>Checkout Payment</h2>
        <v-row no-gutters class="fill-height pt-5">
            <v-col cols="12" md="5" class="d-flex flex-column align-end">
                <div class="w-100 max-width-left p-3">
                    <v-btn
                        icon
                        variant="tonal"
                        :color="isDarkTheme ? 'white' : 'grey-darken-4'"
                        class="back-btn"
                        @click="goBack"
                    >
                        <ArrowLeft />
                    </v-btn>

                    <h4 class=" text-white mb-4">
                        {{ movie?.title || 'Loading Selection...' }}
                    </h4>

                    <v-row no-gutters>
                        <v-col cols="6" class="pe-4 mb-3">
                            <v-img :src="getImageURL(movie?.poster)" cover
                                class=" border-glass rounded shadow-cinematic">
                                <template v-slot:placeholder>
                                    <v-row class="fill-height ma-0" align="center" justify="center">
                                        <v-progress-circular indeterminate color="red-accent-3"
                                            size="20"></v-progress-circular>
                                    </v-row>
                                </template>
                            </v-img>
                        </v-col>

                        <v-col cols="6" class="d-flex flex-column justify-space-between py-1">

                            <div class="meta-sidebar-stack">
                                <div class="d-flex align-center mb-3">
                                    <v-avatar size="32" class="bg-glass border-glass-soft me-3" rounded="lg">
                                        <Sofa color="#ffc400" />
                                    </v-avatar>
                                    <div>
                                        <span
                                            class="text-caption text-grey d-block tracking-wide-soft lh-1 mb-1">Seats</span>
                                        <span class="text-body-2 font-weight-black text-white text-glow-red">{{
                                            formattedSeats }}</span>
                                    </div>
                                </div>

                                <div class="d-flex align-center">
                                    <v-avatar size="32" class="bg-glass border-glass-soft me-3" rounded="lg">
                                        <v-icon size="14" color="amber-accent-3">mdi-ticket-confirmation</v-icon>
                                    </v-avatar>
                                    <div>
                                        <span
                                            class="text-caption text-grey d-block tracking-wide-soft lh-1 mb-1">Booking
                                            ID</span>
                                        <span class="text-body-2 font-weight-bold text-amber-accent-3">#{{
                                            currentBooking?.id }}</span>
                                    </div>
                                </div>
                                <div v-if="currentBooking?.parkingSpot" class="d-flex align-center fade-in-content">
                                    <v-avatar size="32" class="bg-glass border-glass-soft me-3" rounded="lg">
                                        <v-icon size="16" color="amber-accent-3">mdi-car-connected</v-icon>
                                    </v-avatar>
                                    <div>
                                        <span class="text-caption text-grey d-block tracking-wide-soft mt-2">Parking
                                            Spot</span>
                                        <span class=" text-uppercase">{{ currentBooking?.parkingSpot }}</span>
                                    </div>
                                </div>
                            </div>
                        </v-col>
                    </v-row>

                    <v-divider class="my-4 divider-opacity-soft"></v-divider>

                    <div class="pricing-rows px-2">
                        <div class="d-flex justify-space-between text-body-2 text-grey-lighten-2 mb-2">
                            <span>Subtotal Cost</span>
                            <span class="font-weight-bold text-white">RM {{ originalPrice.toFixed(2) }}</span>
                        </div>
                        <div v-if="discountPercentage > 0" class="d-flex justify-space-between text-body-2 text-green-accent-2 mb-2">
                            <span>{{ membershipTier }} Member Discount (-{{ discountPercentage }}%)</span>
                            <span class="font-weight-bold text-green-accent-2">-RM {{ discountAmount.toFixed(2) }}</span>
                        </div>
                        <div class="d-flex justify-space-between text-body-2 text-grey-lighten-2 mb-2">
                            <span>Booking Service Fee</span>
                            <span
                                class="text-red-accent-3 font-weight-bold tracking-wider text-caption text-uppercase">FREE</span>
                        </div>
                        <div class="d-flex justify-space-between text-body-2 text-grey-lighten-2 mb-2">
                            <span>Smart Parking Stall</span>
                            <span
                                class="text-blue-accent-2 font-weight-bold tracking-wider text-caption text-uppercase">INCLUSIVE</span>
                        </div>

                        <v-divider class="my-4 divider-opacity-soft"></v-divider>

                        <div class="d-flex justify-space-between align-end pt-2">
                            <div>
                                <span class="text-h6 font-weight-bold text-white d-block ">Total</span>
                                <span class="text-caption text-grey-lighten-1">GST (10%) Inclusive Mapping</span>
                            </div>
                            <span class="text-h3 font-weight-black text-white text-glow-red">
                                RM {{ subtotalPrice.toFixed(2) }}
                            </span>
                        </div>
                    </div>

                </div>
            </v-col>

            <v-col cols="12" md="7"
                class="d-flex flex-column align-start justify-center px-12 bg-deep-charcoal rounded">
                <div class="max-width-right">

                    <div class="d-flex justify-space-between align-center mb-2 mt-5 w-100 ms-3">
                        <div class="step-tracker-pill d-flex mx-auto gap-2">

                            <span class="step-badge checked-green">1</span>
                            <span class="text-body-2 ms-1 text-white font-weight-medium">Information</span>
                            <span class="step-line line-active-green"></span>

                            <span class="step-badge" :class="currentStage === 2 ? 'active' : 'checked-green'">2</span>
                            <span class="text-body-2 ms-1 text-white"
                                :class="{ 'font-weight-bold': currentStage === 2 }">Payment</span>
                            <span class="step-line"
                                :class="currentStage === 3 ? 'line-active-red' : 'line-pending'"></span>

                            <span class="step-badge"
                                :class="{ 'active': currentStage === 3, 'pending': currentStage < 3 }">3</span>
                            <span class="text-body-2 ms-1"
                                :class="currentStage === 3 ? 'text-white font-weight-bold' : 'text-grey'">Confirmation</span>
                        </div>

                    </div>

                    <div class="d-flex justify-content-end align-center mb-3 w-100 mt-3">

                        <v-chip color="red-accent-3" class="text-white font-weight-black px-4" variant="flat"
                            v-if="currentStage !== 3">
                            <v-icon start size="16" class="pulse-slow me-2">mdi-clock-outline</v-icon>
                            Timer Left: {{ countdownText }}
                        </v-chip>
                    </div>
                    <div v-if="currentStage === 2" class="fade-in-content">
                        <h3 class="text-white mb-2 tracking-wide">Enter Payment Details</h3>
                        <p class="text-body-2 text-grey-lighten-1 mb-6">Select a routing transaction pipeline method to
                            proceed.</p>

                        <v-alert v-if="apiError" type="error" variant="tonal"
                            class="mb-6 rounded-xl border-red text-red-lighten-3 font-weight-bold">
                            {{ apiError }}
                        </v-alert>

                        <v-form @submit.prevent="handlePaymentExecution" class="w-100">

                            <span class=" text-grey-lighten-1 d-block mb-3">Select
                                Method:</span>
                            <v-row class="mb-4">
                                <v-col cols="6" class="pe-2">
                                    <div class="method-selector pa-4 text-center cursor-pointer"
                                        :class="{ 'active': paymentMethod === 'stripe' }"
                                        @click="paymentMethod = 'stripe'">
                                        <v-icon size="24" class="mb-1"
                                            :color="paymentMethod === 'stripe' ? '#ff1744' : '#616161'">mdi-credit-card</v-icon>
                                        <div class="text-body-2 font-weight-bold text-white mt-1">Debit / Credit Card
                                        </div>
                                    </div>
                                </v-col>
                                <v-col cols="6" class="ps-2">
                                    <div class="method-selector pa-4 text-center cursor-pointer"
                                        :class="{ 'active': paymentMethod === 'virtual_account' }"
                                        @click="paymentMethod = 'virtual_account'">
                                        <v-icon size="24" class="mb-1"
                                            :color="paymentMethod === 'virtual_account' ? '#ff1744' : '#616161'">mdi-bank-transfer</v-icon>
                                        <div class="text-body-2 font-weight-bold text-white mt-1">Virtual Account</div>
                                    </div>
                                </v-col>
                            </v-row>

                            <div v-if="paymentMethod === 'stripe'" class="fade-in-content">
                                <v-label class=" text-grey-lighten-1 mb-1">Card
                                    Information *</v-label>
                                <v-text-field v-model="cardNumber" placeholder="4242 4242 4242 4242"
                                    prepend-inner-icon="mdi-credit-card-outline" variant="solo" flat rounded="lg"
                                    density="comfortable" class="mb-2 text-white v-input-dark" required
                                    @input="formatCardNumber"></v-text-field>

                                <v-row>
                                    <v-col cols="6" class="py-0 pe-2">
                                        <v-label class="text-grey-lighten-1 mb-1">Expiry
                                            Date *</v-label>
                                        <v-text-field v-model="cardExpiry" placeholder="MM/YY" variant="solo" flat
                                            rounded="lg" density="comfortable" class="mb-2 text-white v-input-dark"
                                            required @input="formatExpiry"></v-text-field>
                                    </v-col>
                                    <v-col cols="6" class="py-0 ps-2">
                                        <v-label
                                            class="text-caption font-weight-bold text-grey-lighten-1 mb-1 text-uppercase tracking-wide">CVC
                                            / CVV *</v-label>
                                        <v-text-field v-model="cardCvc" placeholder="123" maxlength="3" type="password"
                                            variant="solo" flat rounded="lg" density="comfortable"
                                            class="mb-2 text-white v-input-dark" required></v-text-field>
                                    </v-col>
                                </v-row>

                                <v-label class="text-grey-lighten-1 mb-1 mt-2">Cardholder
                                    Name *</v-label>
                                <v-text-field v-model="cardName" placeholder="John Doe" variant="solo" flat rounded="lg"
                                    density="comfortable" class="mb-4 text-white v-input-dark" required></v-text-field>
                            </div>

                            <div v-else class="pa-6 border-glass rounded-xl mb-5 bg-glass text-center fade-in-content">
                                <v-icon size="40" color="red-accent-3" class="mb-2">mdi-bank-outline</v-icon>
                                <p class="text-body-2 font-weight-bold text-white text-uppercase tracking-wider">FPX
                                    Automated Online Banking System</p>
                                <p class="text-caption text-grey-lighten-1">A secure multi-bank gateway redirect
                                    authorization routing node will initialize upon submission confirmation step.</p>
                            </div>

                            <v-checkbox v-model="saveInfo" color="red-accent-3" hide-details
                                class="mb-6 checkbox-custom text-white">
                                <template v-slot:label>
                                    <div class="text-caption text-grey-lighten-2 font-weight-medium">
                                        Securely save my information for 1-click checkout via Stripe Elements
                                        encryption.<br />
                                        <span class="text-grey-darken-1 text-xsmall">Tokenize account hashes across
                                            local
                                            session instances securely.</span>
                                    </div>
                                </template>
                            </v-checkbox>

                            <v-btn block type="submit" color="red-accent-3" height="54" rounded="lg"
                                class="text-white btn-pay-now mt-3" :loading="isStoreLoading"
                                :disabled="!currentBooking">
                                Pay Now
                            </v-btn>

                            <div class="d-flex justify-center align-center mt-3 mb-2 text-caption text-grey">
                                <v-icon size="14" color="grey">mdi-lock-outline</v-icon> Secured & Protected by
                                <span class="text-white ms-1">stripe</span>
                            </div>

                        </v-form>
                    </div>
                    <div v-else class="fade-in-content ms-md-5">
                        <div class="text-center ms-md-5">
                            <v-avatar size="76" class="confirmation-icon-wrap mb-4">
                                <CheckCircle2 :size="42" color="#4caf50" />
                            </v-avatar>
                            <h4 class="text-white mb-2 tracking-wide d-flex align-center justify-center gap-2">
                                Booking Confirmed
                                <Sparkles :size="22" color="#ffc400" />
                            </h4>
                            <p class=" text-grey-lighten-1 mb-2">Payment received and seats are now secured.</p>
                        </div>

                        <v-card class="confirmation-ticket mb-5 ms-4" variant="flat">
                            <div class="confirmation-ticket-top">
                                <div>
                                    <span class="ticket-label d-block">Official Ticket Receipt</span>
                                    <span class="ticket-movie d-block mt-1">{{ movie?.title }}</span>
                                </div>
                                <v-chip color="green" size="small" class="font-weight-bold text-white"
                                    variant="flat">Paid</v-chip>
                            </div>

                            <v-divider class="my-4 divider-opacity-soft"></v-divider>

                            <div class="confirmation-grid">
                                <div class="confirmation-item">
                                    <span class="item-label">Booking Reference</span>
                                    <span class="item-value text-amber-accent-3">#{{ currentBooking?.id }}</span>
                                </div>
                                <div class="confirmation-item">
                                    <span class="item-label">Seats</span>
                                    <span class="item-value">{{ formattedSeats }}</span>
                                </div>
                                <div class="confirmation-item">
                                    <span class="item-label">Payment Method</span>
                                    <span class="item-value">{{ paymentMethod === 'stripe' ? 'Card (Stripe)' : 'Virtual Account'}}</span>
                                </div>
                                <div class="confirmation-item">
                                    <span class="item-label">Total Paid</span>
                                    <span class="item-value">RM {{ originalPrice }}</span>
                                </div>
                                <div v-if="currentBooking?.parkingSpot"
                                    class="confirmation-item confirmation-item-full">
                                    <span class="item-label">Parking Spot</span>
                                    <span class="item-value text-blue-accent-2 text-uppercase">{{
                                        currentBooking?.parkingSpot
                                        }}</span>
                                </div>
                            </div>

                            <v-divider class="my-4 divider-opacity-soft"></v-divider>

                            <div class="txn-row">
                                <span class="item-label">Transaction ID</span>
                                <span class="txn-pill">{{ generatedTxnId }}</span>
                            </div>
                        </v-card>

                        <v-btn color="red-accent-3" height="54"
                            class="text-white font-weight-black letter-spacing-2 ms-md-3 px-8 w-100 movie-btn mb-2" @click="navigateHome">
                            View Ticket
                        </v-btn>
                    </div>
                </div>
            </v-col>

        </v-row>
    </v-container>
    <FooterView/>
    </v-app>
</template>

<style scoped>
.bg-dark-theater {
    background-color: var(--bg-color);
    min-height: 100vh;
    color: var(--checkout-text);
}

.bg-matte-black {
    background-color: var(--checkout-surface);
}

.bg-deep-charcoal {
    background: var(--checkout-summary-bg);
    border: 1px solid var(--checkout-border);
    box-shadow: var(--checkout-summary-shadow);
    max-width: 650px;
}

.max-width-left {
    max-width: 440px;
}

.max-width-right {
    max-width: 540px;
}

/* Glass Panels and Glowing Containers Layouts */
.bg-glass {
    background: var(--checkout-surface-soft) !important;
}

.bg-glass-dark {
    background: var(--checkout-surface-soft);
}

.border-glass {
    border: 1px solid var(--checkout-border-soft) !important;
}

.border-glass-soft {
    border: 1px solid var(--checkout-border) !important;
}

.bg-red-gradient {
    background: linear-gradient(135deg, #ff1744 0%, #b30022 100%) !important;
}

.bg-blue-gradient {
    background: linear-gradient(135deg, #2979ff 0%, #1565c0 100%) !important;
}

.text-glow-red {
    text-shadow: 0 0 15px rgba(255, 23, 68, 0.6);
}

.text-shadow-heavy {
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.85);
}

.shadow-red-glow {
    box-shadow: 0 4px 20px rgba(255, 23, 68, 0.4) !important;
}

.divider-opacity-soft {
    border-color: rgba(255, 255, 255, 0.06) !important;
}

.backdrop-scrim-overlay {
    background: linear-gradient(180deg, rgba(14, 17, 24, 0) 20%, rgba(14, 17, 24, 0.9) 100%);
}

.italic-quote {
    font-style: italic;
    font-weight: 300;
}

.step-tracker-pill {
    display: flex;
    align-items: center;
}

.step-badge {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 800;
    transition: all 0.3s ease;
    background-color: var(--checkout-chip-bg);
    color: var(--checkout-text-muted);
}

.step-badge.checked-green {
    background-color: #4caf50;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.5);
}

.step-line.line-active-green {
    background-color: #4caf50;
}

.step-badge.active {
    background-color: var(--checkout-accent);
    color: #ffffff;
    box-shadow: 0 0 12px rgba(255, 23, 68, 0.35);
}

.step-line.line-active-red {
    background-color: var(--checkout-accent);
}

.step-badge.pending {
    background-color: var(--checkout-chip-bg);
    color: var(--checkout-text-muted);
}

.step-line.line-pending {
    background-color: var(--checkout-chip-bg);
}

.step-line {
    width: 30px;
    height: 2px;
    margin: 0 8px;
    transition: background-color 0.3s ease;
}

.step-line.line-active {
    background-color: #4caf50;
}

/* Payment Gateway Selector Items */
.method-selector {
    border: 1px solid var(--checkout-border-soft);
    background-color: var(--checkout-surface-soft);
    transition: all 0.25s ease-in-out;
}

.method-selector:hover {
    border-color: var(--checkout-border);
    background-color: var(--checkout-accent-soft);
}

.method-selector.active {
    border-color: var(--checkout-accent) !important;
    background-color: var(--checkout-accent-soft) !important;
    box-shadow: 0 0 12px rgba(255, 23, 68, 0.15);
}

.stripe-info-alert {
    background-color: rgba(255, 23, 68, 0.03);
    border: 1px solid rgba(255, 23, 68, 0.15) !important;
}

/* Custom Vuetify Input Fields Overrides */
:deep(.v-input-dark .v-field) {
    background-color: var(--checkout-input-bg) !important;
    border: 1px solid var(--checkout-input-border) !important;
    color: var(--checkout-text) !important;
    border-radius: 10px !important;
    transition: border-color 0.2s;
}

:deep(.v-input-dark .v-field--focused) {
    border-color: var(--checkout-accent) !important;
}

.checkbox-custom :deep(.v-selection-control) {
    min-height: auto;
    align-items: flex-start;
    padding-top: 2px;
}

.btn-pay-now {
    background: var(--movie-btn);
}

/* Text and Animations Utilities */
.pulse-slow {
    animation: slow-pulse 2s infinite ease-in-out;
}

.animate-pulse-slow {
    animation: slow-pulse 2.5s infinite ease-in-out;
}

.fade-in-content {
    animation: fadeIn 0.3s ease-in-out forwards;
}

.uppercase-tracking {
    text-transform: uppercase;
    letter-spacing: 1.5px;
}


.letter-spacing-2 {
    letter-spacing: 2px;
}

.text-xsmall {
    font-size: 0.7rem;
}

.confirmation-icon-wrap {
    background: radial-gradient(circle at center, var(--checkout-accent-soft) 0%, rgba(76, 175, 80, 0.08) 65%, rgba(76, 175, 80, 0.02) 100%);
}

.confirmation-ticket {
    background: var(--checkout-ticket-bg) !important;
    border: 1px solid var(--checkout-ticket-border) !important;
    border-radius: 16px !important;
    padding: 24px;
}

.confirmation-ticket-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.ticket-label {
    letter-spacing: 1.6px;
    color: var(--checkout-accent);
    font-weight: 800;
}

.ticket-movie {
    color: var(--checkout-text);
}

.confirmation-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.confirmation-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.confirmation-item-full {
    grid-column: 1 / -1;
}

.item-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 1.3px;
    color: var(--checkout-text-muted);
    font-weight: 700;
}

.item-value {
    font-size: 0.98rem;
    color: var(--checkout-text);
    font-weight: 700;
}

.txn-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.txn-pill {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.78rem;
    color: var(--checkout-chip-text);
    background: var(--checkout-chip-bg);
    border: 1px solid var(--checkout-chip-border);
    border-radius: 999px;
    padding: 6px 10px;
    max-width: 68%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.checkout-shell.theme-light :deep(.text-white) {
    color: var(--checkout-text) !important;
}

.checkout-shell.theme-light :deep(.text-grey),
.checkout-shell.theme-light :deep(.text-grey-lighten-1),
.checkout-shell.theme-light :deep(.text-grey-lighten-2),
.checkout-shell.theme-light :deep(.text-grey-darken-1),
.checkout-shell.theme-light :deep(.text-grey-darken-2) {
    color: var(--checkout-text-soft) !important;
}

.checkout-shell.theme-light :deep(.text-body-2),
.checkout-shell.theme-light :deep(.text-caption) {
    color: var(--checkout-text-soft);
}

.checkout-shell.theme-light :deep(.v-chip.text-white) {
    color: #ffffff !important;
}

.checkout-shell.theme-light :deep(.v-divider) {
    opacity: 1;
    border-color: var(--checkout-divider);
}

.gap-2 {
    gap: 8px;
}

.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

@keyframes slow-pulse {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.5;
        transform: scale(0.96);
    }
}



@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(4px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 700px) {
    .confirmation-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 960px) {
    .bg-deep-charcoal {
        max-width: 100%;
        width: 100%;
        padding-left: 20px !important;
        padding-right: 20px !important;
    }

    .max-width-left,
    .max-width-right {
        max-width: 100%;
        width: 100%;
    }

    .max-width-right {
        padding-left: 0;
        padding-right: 0;
    }

    .step-tracker-pill {
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
    }

    .step-line {
        width: 18px;
        margin: 0 4px;
    }

    .confirmation-ticket,
    .v-btn.w-100 {
        width: 100%;
    }

    .confirmation-ticket {
        margin-left: 0 !important;
        padding: 18px;
    }

    .confirmation-ticket-top {
        flex-direction: column;
        align-items: flex-start;
    }

    .txn-row {
        flex-direction: column;
        align-items: flex-start;
    }

    .txn-pill {
        max-width: 100%;
    }
}

@media (max-width: 600px) {
    .bg-dark-theater {
        padding-bottom: 24px;
    }

    .bg-deep-charcoal {
        padding-left: 16px !important;
        padding-right: 16px !important;
    }

    .max-width-left,
    .max-width-right {
        padding-left: 0 !important;
        padding-right: 0 !important;
    }

    .max-width-right {
        margin-top: 8px;
    }

    .step-tracker-pill {
        width: 100%;
        justify-content: flex-start;
    }

    .step-badge {
        width: 24px;
        height: 24px;
        font-size: 0.7rem;
    }

    .step-line {
        width: 12px;
    }

    .confirmation-ticket {
        padding: 16px;
        border-radius: 14px !important;
    }

    .confirmation-grid {
        gap: 12px;
    }
}

</style>
<!-- Add Loading -->
