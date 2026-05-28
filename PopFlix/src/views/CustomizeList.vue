<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTickets } from '@/hook/useTickets';
import { MapPin, ArrowRight } from 'lucide-vue-next';
import FooterView from '@/components/FooterView.vue';

const router = useRouter();
const { ticketsList: tickets, isTicketsLoading, fetchTickets } = useTickets();

onMounted(fetchTickets);

const goToCustomize = (ticket) => {
    router.push({
        name: 'CustomizeTickets',
        params: { movieId: ticket.movie_id, bookingId: ticket.bookingId }
    });
};
</script>

<template>
    <template v-if="isTicketsLoading">
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
        <v-container fluid class="customization-dashboard" width="100vw">
            <h2>Customize Tickets</h2>
            <v-row v-if="!isTicketsLoading" class="mt-4">
                <v-col v-for="t in tickets" :key="t.id" cols="12" md="6" lg="3">
                    <div class="movie-card">
                        <div class="poster-container">
                            <v-img :src="t.poster" cover height="180" class="rounded-t-lg"></v-img>
                            <div class="poster-overlay"></div>
                            <div class="movie-meta">


                                <button class="design-pill fs-6" @click="t.showDialog = true">
                                    <span class="icon">🎨</span> View Designs
                                </button>
                            </div>

                        </div>

                        <div class="card-body">
                            <h3>{{ t.title }}</h3>
                            <div class="info-group">
                                <div class="info-item">
                                    <MapPin size="14" /> {{ t.cinema }}
                                </div>
                                <div class="info-item">
                                    <span>{{ new Date(t.startTime).toLocaleDateString() }}</span>
                                    <Clock size="14" /> {{ new Date(t.startTime).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) }}
                                </div>
                            </div>
                            <div class="seats-pill">Seats: {{ t.seats.join(', ') }}</div>

                            <button class="custom-btn" @click="goToCustomize(t)">
                                Customize Now
                                <ArrowRight size="16" />
                            </button>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </v-container>
        <FooterView />
    </v-app>
</template>

<style scoped>
.customization-dashboard {
    background: var(--bg-color);
    min-height: 100vh;
    padding-left: 75px;
    padding-right: 75px;
}

.movie-card {
     background: var(--card-bg);
    border-radius: 16px;
    border: 1px solid rgba(14, 14, 14, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    width: 300px;
    height: 400px;
}

.poster-container {
    position: relative;
}

.poster-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, #151926 0%, transparent 60%);
}

.movie-meta {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    width: 93%;
    justify-content: flex-end;
    height: 25px;
}

.card-body {
    padding: 16px;
}

.card-body h3 {
    color: var(--text-color);
    margin-bottom: 12px;
    font-size: 1.2rem;
}

.info-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: #94a3b8;
}

.seats-pill {
    display: inline-block;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    color: #527aff;
    font-weight: bold;
    margin-bottom: 16px;
}

.custom-btn {
    width: 100%;
    padding: 12px;
    background: transparent;
    border: 1px solid #e53935;
    color: #e53935;
    border-radius: 8px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: 0.3s;
}

.design-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 10px;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.design-pill:hover {
    background: rgba(229, 57, 53, 0.8);
    border-color: rgba(229, 57, 53, 0.5);
}

.design-pill .icon {
    font-size: 0.8rem;
}

.custom-btn:hover {
    background: #e53935;
    color: white;
}
</style>