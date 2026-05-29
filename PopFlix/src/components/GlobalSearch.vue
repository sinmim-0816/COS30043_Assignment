<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Film, MapPin, X, Loader2 } from 'lucide-vue-next';
import backendClient from '@/api/backendClient'; 
import { getGenreName } from '@/utils/genre';

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
const categories = ['All', 'Movies', 'Cinemas', 'FAQs'];
const isLoading = ref(false);
const results = ref({ movies: [], cinemas: [], faqs: [] });

// Debounce logic
let searchTimeout;
const handleSearch = () => {
    clearTimeout(searchTimeout);
    
    if (!searchQuery.value.trim()) {
        results.value = { movies: [], cinemas: [], faqs: [] };
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
    setTimeout(() => {
        searchQuery.value = '';
        results.value = { movies: [], cinemas: [], faqs: [] };
        activeCategory.value = 'All';
    }, 300);
};

const goToResult = (item) => {
    closeSearch();
    if (item.type === 'Movie') router.push(`/movie/${item.id}`);
    if (item.type === 'Cinema') router.push(`/showtimes?cinema=${item.id}`);
    if (item.type === 'FAQ') router.push('/faq');
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
            
            <div class="search-header px-4 py-2 d-flex align-center border-bottom">
                <Search class="text-red-accent-3 me-4" size="25" />
                <input 
                    v-model="searchQuery" 
                    @input="handleSearch"
                    type="text" 
                    class="search-input" 
                    placeholder="Search Popflix..." 
                    autofocus
                />
                <v-btn variant="plain" class="text-color" @click="closeSearch">
                    <X/>
                </v-btn>
            </div>

            <div class="px-6 py-2 border-bottom bg-subtle">
                <v-chip-group
                    v-model="activeCategory"
                    selected-class="selected-search-chip"
                    mandatory
                >
                    <v-chip
                        v-for="cat in categories"
                        :key="cat"
                        :value="cat"
                        variant="outlined"
                        class="search-chip font-weight-bold px-4 me-3"
                        size="large"
                    >
                        {{ cat }}
                    </v-chip>
                </v-chip-group>
            </div>

            <div class="results-container overflow-y-auto px-4">
                
                <div v-if="!searchQuery" class="d-flex flex-column align-center justify-center h-100 text-grey-darken-1 py-16">
                    <Search size="64" class="mb-4 opacity-50" />
                    <h3 class="font-weight-medium">What are you looking for?</h3>
                    <p class="text-caption mt-1">Find your favorite movies and cinemas instantly.</p>
                </div>

                <div v-else-if="isLoading" class="d-flex flex-column align-center justify-center py-16">
                    <Loader2 class="spin text-red-accent-3 mb-4" size="48" />
                    <span class="text-grey">Searching...</span>
                </div>

                <v-list v-else class="bg-transparent px-4" lines="two">
                    
                    <template v-if="results.movies.length > 0">
                        <div class="d-flex align-center px-3 mb-3 mt-3">
                            <h4 class="text-uppercase text-caption tracking-widest">Movies</h4>
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
                                    class="result-poster me-4"
                                ></v-img>
                            </template>
                            <v-list-item-title class="font-weight-bold ">{{ movie.title }}</v-list-item-title>
                            <v-list-item-subtitle class="d-flex align-center mt-2 text-grey-lighten-1">
                                <Film size="14" class="me-1" />

                                <span class="text-truncate">
                                    <span
                                        v-for="(genreId, index) in movie.genres"
                                        :key="genreId"
                                    >
                                        {{ getGenreName(genreId) }}<span v-if="index < movie.genres.length - 1">, </span>
                                    </span>
                                </span>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </template>

                    <template v-if="results.cinemas.length > 0">
                        <div class="d-flex align-center px-3 mb-2 mt-6">
                            <h4 class="text-uppercase text-caption  tracking-widest">Cinemas</h4>
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
                            <v-list-item-title>{{ cinema.title }}</v-list-item-title>
                            <v-list-item-subtitle class="text-truncate mt-1 text-color">{{ cinema.subtitle }}</v-list-item-subtitle>
                        </v-list-item>
                    </template>

                    <template v-if="results.faqs.length > 0">
                        <div class="d-flex align-center px-3 mb-2 mt-6">
                            <h4 class="text-uppercase text-caption tracking-widest">FAQs</h4>
                            <v-divider class="ms-3 border-opacity-25"></v-divider>
                        </div>

                        <v-list-item 
                            v-for="faq in results.faqs" 
                            :key="'f-'+faq.id"
                            class="result-item rounded-xl mb-2 py-3 px-4"
                            @click="goToResult(faq)"
                        >
                            <template v-slot:prepend>
                                <div class="icon-box me-4">
                                    <Search size="24" class="text-red-accent-3"/>
                                </div>
                            </template>
                            <v-list-item-title >{{ faq.title }}</v-list-item-title>
                            <v-list-item-subtitle class="d-flex align-center mt-2 text-color">
                                <span class="text-truncate">{{ faq.answer }}</span>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </template>

                    <div v-if="results.movies.length === 0 && results.cinemas.length === 0 && results.faqs.length === 0" class="text-center py-16 text-grey">
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

.search-chip {
    transition: all 0.25s ease;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    background: transparent;
}

.search-chip:hover {
    background: var(--hover-bg);
}

.selected-search-chip {
    background: #ff3d3d;
    color: white;
    border-color: #ff5252;
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
    height: 50px;
}
.result-item {
    transition: all 0.3s ease;
    border: 1px solid transparent;
    cursor: pointer;
}

.result-item:hover {
    background: var(--hover-bg);
    border-color: var(--border-color);
}

.result-poster {
    width: 60px;
    height: 90px;
}

.icon-box {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background:white;
    border: 1px solid rgba(255, 82, 82, 0.423);
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
.search-input::placeholder {
  color: #868484; 
  opacity: 1;
}

@keyframes spin {
    100% {
        transform: rotate(360deg);
    }
}
</style>
