<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Film, MapPin, X, Loader2 } from 'lucide-vue-next';
import backendClient from '@/api/backendClient'; 

const props = defineProps({
    modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);
const router = useRouter();

// Computed property to seamlessly handle v-model with the drawer
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

// State
const searchQuery = ref('');
const activeCategory = ref('All');
const categories = ['All', 'Movies', 'Cinemas', 'Experiences'];
const isLoading = ref(false);
const results = ref({ movies: [], cinemas: [] });

// Debounce logic
let searchTimeout;
const handleSearch = () => {
    clearTimeout(searchTimeout);
    
    if (!searchQuery.value.trim()) {
        results.value = { movies: [], cinemas: [] };
        return;
    }

    isLoading.value = true;
    searchTimeout = setTimeout(async () => {
        try {
            const response = await backendClient.get(`/search`, {
                params: { 
                    q: searchQuery.value, 
                    category: activeCategory.value 
                }
            });
            results.value = response.data;
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            isLoading.value = false;
        }
    }, 400); 
};

watch(activeCategory, () => {
    if (searchQuery.value) handleSearch();
});

const closeSearch = () => {
    isOpen.value = false;
    // Optional: Clear search when closed, or leave it so they can resume searching
    setTimeout(() => {
        searchQuery.value = '';
        results.value = { movies: [], cinemas: [] };
        activeCategory.value = 'All';
    }, 300); // Wait for slide-out animation to finish
};

const goToResult = (item) => {
    closeSearch();
    if (item.type === 'Movie') router.push(`/movies/${item.id}`);
    if (item.type === 'Cinema') router.push(`/cinemas?id=${item.id}`);
};
</script>

<template>
    <v-dialog
        v-model="isOpen"
        class="global-search-dialog"
        transition="slide-y-transition"
        scroll-strategy="none"
        persistent
    >
        <v-sheet class="search-panel d-flex flex-column">
            
            <div class="search-header px-6 py-6 d-flex align-center border-bottom">
                <Search class="text-red-accent-3 me-4" size="28" />
                <input 
                    v-model="searchQuery" 
                    @input="handleSearch"
                    type="text" 
                    class="search-input text-h5 font-weight-medium" 
                    placeholder="Search Popflix..." 
                    autofocus
                />
                <v-btn icon="mdi-close" variant="tonal" size="small" color="grey-lighten-1" @click="closeSearch"></v-btn>
            </div>

            <div class="px-6 py-4 border-bottom bg-subtle">
                <v-chip-group v-model="activeCategory" selected-class="text-white bg-red-accent-3" mandatory>
                    <v-chip 
                        v-for="cat in categories" 
                        :key="cat" 
                        :value="cat"
                        variant="outlined" 
                        color="grey-lighten-1"
                        class="font-weight-bold px-5"
                        size="large"
                    >
                        {{ cat }}
                    </v-chip>
                </v-chip-group>
            </div>

            <div class="results-container flex-grow-1 overflow-y-auto px-4 py-2">
                
                <div v-if="!searchQuery" class="d-flex flex-column align-center justify-center h-100 text-grey-darken-1 py-16">
                    <Search size="64" class="mb-4 opacity-50" />
                    <h3 class="font-weight-medium">What are you looking for?</h3>
                    <p class="text-caption mt-1">Find your favorite movies and cinemas instantly.</p>
                </div>

                <div v-else-if="isLoading" class="d-flex flex-column align-center justify-center py-16">
                    <Loader2 class="spin text-red-accent-3 mb-4" size="48" />
                    <span class="text-grey">Searching...</span>
                </div>

                <v-list v-else class="bg-transparent" lines="two">
                    
                    <template v-if="results.movies.length > 0">
                        <div class="d-flex align-center px-3 mb-2 mt-4">
                            <h4 class="text-uppercase text-caption font-weight-black text-red-accent-3 tracking-widest">Movies</h4>
                            <v-divider class="ms-3 border-opacity-25"></v-divider>
                        </div>

                        <v-list-item 
                            v-for="movie in results.movies" 
                            :key="'m-'+movie.id"
                            class="result-item rounded-xl mb-2 py-3 px-4"
                            @click="goToResult(movie)"
                        >
                            <template v-slot:prepend>
                                <v-img 
                                    :src="`https://image.tmdb.org/t/p/w200${movie.image}`" 
                                    cover 
                                    class="result-poster rounded-lg me-4 shadow-sm"
                                ></v-img>
                            </template>
                            <v-list-item-title class="font-weight-bold text-body-1">{{ movie.title }}</v-list-item-title>
                            <v-list-item-subtitle class="d-flex align-center mt-2 text-grey-lighten-1">
                                <Film size="14" class="me-1" /> Movie
                            </v-list-item-subtitle>
                        </v-list-item>
                    </template>

                    <template v-if="results.cinemas.length > 0">
                        <div class="d-flex align-center px-3 mb-2 mt-6">
                            <h4 class="text-uppercase text-caption font-weight-black text-red-accent-3 tracking-widest">Cinemas</h4>
                            <v-divider class="ms-3 border-opacity-25"></v-divider>
                        </div>

                        <v-list-item 
                            v-for="cinema in results.cinemas" 
                            :key="'c-'+cinema.id"
                            class="result-item rounded-xl mb-2 py-3 px-4"
                            @click="goToResult(cinema)"
                        >
                            <template v-slot:prepend>
                                <div class="icon-box me-4 shadow-sm">
                                    <MapPin size="24" class="text-red-accent-3"/>
                                </div>
                            </template>
                            <v-list-item-title class="font-weight-bold text-body-1">{{ cinema.title }}</v-list-item-title>
                            <v-list-item-subtitle class="text-truncate mt-1 text-grey-lighten-1">{{ cinema.subtitle }}</v-list-item-subtitle>
                        </v-list-item>
                    </template>

                    <div v-if="results.movies.length === 0 && results.cinemas.length === 0" class="text-center py-16 text-grey">
                        <X size="48" class="mb-4 opacity-50 mx-auto" />
                        <h4 class="font-weight-medium">No results found for "{{ searchQuery }}"</h4>
                        <p class="text-caption mt-1">Check your spelling or try a different term.</p>
                    </div>
                </v-list>
            </div>
        </v-sheet>
    </v-dialog>
</template>

<style scoped>
.global-search-dialog :deep(.v-overlay__content) {
    top: 65px !important; 
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    max-width: 100vw;
    height: calc(100vh - 65px);
    margin: 0 !important;
    border-radius: 0;
    align-self: flex-start;
}

.global-search-dialog :deep(.v-overlay__scrim) {
    top: 65px !important;
    height: calc(100vh - 65px);
}

.search-panel {
    width: 100%;
    height: 100%;
    background: var(--bg-color);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 0;
    overflow: hidden;
    border-top: 1px solid var(--border-color);
}

/* Light / Dark support */
.border-bottom {
    border-bottom: 1px solid var(--border-color);
}

.bg-subtle {
    background: var(--card-bg);
}

.search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-color);
    outline: none;
}

.search-input::placeholder {
    color: var(--text-muted);
}

.result-item {
    transition: all 0.3s ease;
    border: 1px solid transparent;
    cursor: pointer;
}

.result-item:hover {
    background: var(--hover-bg);
    border-color: var(--border-color);
    transform: translateX(6px);
}

.result-poster {
    width: 60px;
    height: 90px;
}

.icon-box {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background: rgba(255, 82, 82, 0.08);
    border: 1px solid rgba(255, 82, 82, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
}

.shadow-sm {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tracking-widest {
    letter-spacing: 0.1em;
}

/* Scrollbar */
.results-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 82, 82, 0.5) transparent;
}

.results-container::-webkit-scrollbar {
    width: 6px;
}

.results-container::-webkit-scrollbar-thumb {
    background-color: rgba(255, 82, 82, 0.5);
    border-radius: 10px;
}

/* Loading spinner */
.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    100% {
        transform: rotate(360deg);
    }
}
</style>
