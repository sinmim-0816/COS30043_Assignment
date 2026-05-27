<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Sofa, CheckCircle2 } from 'lucide-vue-next';

// Import other hook and components
import { useBookingStore } from '@/stores/booking';
import { useMovieDetails } from '@/hook/useMovieDetails';
import { useShowtimes } from '@/hook/useShowtimes';
import FooterView from '@/components/FooterView.vue';

const { fetchShowtimeById } = useShowtimes();

const router = useRouter();
const route = useRoute();
const bookingStore = useBookingStore();
const { movie, loadMovieDetails, getImageURL } = useMovieDetails();
const currentStage = ref(2);
const generatedTxnId = ref('');
// DUMMY VOUCHER
const selectedVoucherId = ref(null);
const dummyVouchers = ref([
    { id: 'VCH_5', label: '🍿 Popcorn Bundle Deal (5% OFF)', title: 'Popcorn Bundle Deal', discount: 5, description: 'Code: CINEMA5 • Standard discount apply hold items' },
    { id: 'VCH_10', label: '🎬 Tixly Launch Celebration (10% OFF)', title: 'Tixly Launch Celebration', discount: 10, description: 'Code: POPCORN10 • Active launch window tier reward' },
    { id: 'VCH_15', label: '💎 VIP Diamond Membership Tier (15% OFF)', title: 'VIP Diamond Member Reward', discount: 15, description: 'Code: TIXLY15 • Premium loyalty club tier settlement deduction' }
]);
const handleDropdownVoucher = (id) => {
    if (!id) {
        clearActiveVoucher();
        return;
    }

    // Scan matching instance attributes out of collection
    const match = dummyVouchers.value.find(v => v.id === id);
    if (match) {
        activeDiscount.value = match.discount;
        appliedVoucher.value = match.id;
        voucherCode.value = match.id; // Links cleanly into backend payment expectations
    }
};

// ⚡ NEW: Direct reset cleanup anchor triggers
const clearActiveVoucher = () => {
    selectedVoucherId.value = null;
    activeDiscount.value = 0;
    appliedVoucher.value = '';
    voucherCode.value = '';
};
// DUMMY END

const paymentMethod = ref('stripe');
const saveInfo = ref(true);
const isMovieLoading = ref(true);

// Voucher & Discount Properties
const voucherCode = ref('');
const activeDiscount = ref(0); // Percentage value (e.g., 5, 10, 15)
const appliedVoucher = ref('');

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

const navigateHome=()=>{
    bookingStore.stopGlobalTimer();
    localStorage.removeItem('timerDeadline');
    localStorage.removeItem('completedBookingBackup');
    localStorage.removeItem('completedTxnIdBackup');
    router.push({ name: 'MyTickets' });
}

// Load movie details based on current booking instance on mount
onMounted(async () => {
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

watch(currentBooking, (newVal, oldVal) => {
    if (!newVal && oldVal && currentStage.value !== 3) {
        alert("The 8-minute reservation timeout window expired. Your locked items have been freed.");
        cleanupAndExit();
    }
});

// Dynamic Price Computations based on Voucher state logic
const subtotalPrice = computed(() => Number(currentBooking.value?.totalPrice || 0));
const discountAmount = computed(() => (subtotalPrice.value * (activeDiscount.value / 100)));
const finalTotalPrice = computed(() => Math.max(0, subtotalPrice.value - discountAmount.value).toFixed(2));


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
        await bookingStore.confirmPayment(generatedTxnId.value, finalTotalPrice.value, paymentMethod.value);

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
    <v-app>
    <v-container width="100vw" fluid class="fill-height bg-dark-theater" theme="dark">
        <h2>Checkout</h2>
        <v-row no-gutters class="fill-height pt-5">
            <v-col cols="12" md="5" class="d-flex flex-column align-end">
                <div class="w-100 max-width-left p-3">
                    <v-btn icon variant="tonal" color="white" class="back-btn" @click="goBack">
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


                    <v-card class="pa-4 mb-4 bg-glass border-glass shadow-cinematic" variant="flat">
                        <v-label class="text-grey-lighten-1 d-block mb-2 ">
                            Select Available Voucher
                        </v-label>

                        <v-select v-model="selectedVoucherId" :items="dummyVouchers" item-title="label" item-value="id"
                            placeholder="Choose a voucher or promo code" variant="solo" flat rounded="lg"
                            density="comfortable" hide-details clearable
                            class="text-white v-input-dark custom-select-dropdown"
                            @update:model-value="handleDropdownVoucher" @click:clear="clearActiveVoucher">
                            <template v-slot:item="{ props, item }">
                                <v-list-item v-bind="props" class="py-2 custom-dropdown-item" bg-color="#121620">
                                    <template v-slot:title>
                                        <div class="d-flex justify-space-between align-center">
                                            <span class="font-weight-bold text-white">{{ item.raw.title }}</span>
                                            <v-chip size="x-small" color="red-accent-3" variant="flat"
                                                class="font-weight-black">
                                                {{ item.raw.discount }}% OFF
                                            </v-chip>
                                        </div>
                                    </template>
                                    <template v-slot:subtitle>
                                        <span class="text-grey-darken-1 text-xsmall d-block mt-1">{{
                                            item.raw.description }}</span>
                                    </template>
                                </v-list-item>
                            </template>
                        </v-select>
                    </v-card>

                    <v-divider class="my-4 divider-opacity-soft"></v-divider>

                    <div class="pricing-rows px-2">
                        <div class="d-flex justify-space-between text-body-2 text-grey-lighten-2 mb-2">
                            <span>Subtotal Cost</span>
                            <span class="font-weight-bold text-white">RM {{ subtotalPrice.toFixed(2) }}</span>
                        </div>
                        <div v-if="activeDiscount > 0"
                            class="d-flex justify-space-between text-body-2 text-red-lighten-3 mb-2 animate-pulse-slow">
                            <span>Voucher Promo Discount ({{ activeDiscount }}%)</span>
                            <span class="font-weight-bold">- RM {{ discountAmount.toFixed(2) }}</span>
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
                                RM {{ finalTotalPrice }}
                            </span>
                        </div>
                    </div>

                </div>
            </v-col>

            <v-col cols="12" md="7"
                class="d-flex flex-column align-start justify-center px-12 bg-deep-charcoal rounded">
                <div class="max-width-right">

                    <div class="d-flex justify-space-between align-center mb-2 w-100 ms-3">
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

                            <div class="d-flex justify-center align-center mt-3 text-caption text-grey">
                                <v-icon size="14" color="grey">mdi-lock-outline</v-icon> Secured & Protected by
                                <span class="text-white ms-1">stripe</span>
                            </div>

                        </v-form>
                    </div>
                    <div v-else class="fade-in-content ms-5">
                        <div class="text-center ms-5">
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
                                    <span class="item-value">RM {{ finalTotalPrice }}</span>
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
                            class="text-white font-weight-black letter-spacing-2 ms-3 px-8 w-100" @click="navigateHome">
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
    background-color: #0b0d12;
    min-height: 100vh;
}

.bg-matte-black {
    background-color: #0e1118;
}

.bg-deep-charcoal {
    background-color: #121620;
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
    background: rgba(255, 255, 255, 0.02) !important;
}

.bg-glass-dark {
    background: rgba(0, 0, 0, 0.25);
}

.border-glass {
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.border-glass-soft {
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
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
    background-color: rgba(255, 255, 255, 0.05);
    color: #616161;
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
    background-color: #ff1744;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(255, 23, 68, 0.6);
}

.step-line.line-active-red {
    background-color: #ff1744;
}

.step-badge.pending {
    background-color: rgba(255, 255, 255, 0.05);
    color: #616161;
}

.step-line.line-pending {
    background-color: rgba(255, 255, 255, 0.05);
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
    border: 1px solid rgba(255, 255, 255, 0.06);
    background-color: rgba(255, 255, 255, 0.02);
    transition: all 0.25s ease-in-out;
}

.method-selector:hover {
    border-color: rgba(255, 255, 255, 0.15);
    background-color: rgba(255, 255, 255, 0.04);
}

.method-selector.active {
    border-color: #ff1744 !important;
    background-color: rgba(255, 23, 68, 0.04) !important;
    box-shadow: 0 0 12px rgba(255, 23, 68, 0.2);
}

.stripe-info-alert {
    background-color: rgba(255, 23, 68, 0.03);
    border: 1px solid rgba(255, 23, 68, 0.15) !important;
}

/* Custom Vuetify Input Fields Overrides */
:deep(.v-input-dark .v-field) {
    background-color: rgba(0, 0, 0, 0.3) !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    color: #ffffff !important;
    border-radius: 10px !important;
    transition: border-color 0.2s;
}

:deep(.v-input-dark .v-field--focused) {
    border-color: #ff1744 !important;
}

.checkbox-custom :deep(.v-selection-control) {
    min-height: auto;
    align-items: flex-start;
    padding-top: 2px;
}

.btn-pay-now {
    background: linear-gradient(135deg, #ff1744 0%, #d50000 100%) !important;
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
    background: radial-gradient(circle at center, rgba(76, 175, 80, 0.22) 0%, rgba(76, 175, 80, 0.08) 65%, rgba(76, 175, 80, 0.02) 100%);
}

.confirmation-ticket {
    background: linear-gradient(155deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
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
    color: #ff5252;
    font-weight: 800;
}

.ticket-movie {
    color: #ffffff;
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
    color: #8e95a3;
    font-weight: 700;
}

.item-value {
    font-size: 0.98rem;
    color: #ffffff;
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
    color: #ffffff;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    padding: 6px 10px;
    max-width: 68%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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


/* DUMMY VOUCHER */
:deep(.v-select__selection-text) {
    color: #ffffff !important;
    font-size: 0.9rem;
    font-weight: 500;
}

:deep(.v-list) {
    background-color: #121620 !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    padding: 4px !important;
    border-radius: 12px !important;
}

.custom-dropdown-item {
    border-radius: 8px;
    margin-bottom: 2px;
    transition: all 0.2s ease;
}

.custom-dropdown-item:hover {
    background-color: rgba(255, 23, 68, 0.05) !important;
}

:deep(.v-field__append-inner .v-icon) {
    color: rgba(255, 255, 255, 0.5) !important;
    font-size: 20px;
}

:deep(.v-field__clearable .v-icon) {
    color: rgba(255, 255, 255, 0.4) !important;
    font-size: 16px;
    margin-right: 4px;
}
</style>
<!-- Add Loading -->
