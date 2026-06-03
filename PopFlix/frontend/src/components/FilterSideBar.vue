<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useDisplay } from 'vuetify';
import { GENRE_MAP } from '../utils/genre';
import { useMovies } from '../hook/useMovies';

const {getLanguageName}=useMovies();
const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);
const isDarkTheme = ref(false);
let themeObserver = null;

const syncThemeState = () => {
    if (typeof document === 'undefined') return;
    isDarkTheme.value =
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark';
};

const themeClass = computed(() => (isDarkTheme.value ? 'theme-dark' : 'theme-light'));

const props = defineProps({
    modelValue:Boolean,
    movies:{
        type:Array,
        default:()=>[]
    },
    languages:{
        type:Array,
        default:()=>[]
    },
    filters:Object
});
const emit = defineEmits(['update:modelValue', 'apply-filters','close']);

const availableLanguages=computed(()=>{
    if(props.languages && props.languages.length){
        return [...new Set(props.languages)].filter(Boolean);
    }

    const source = props.movies;
    if(!source || !source.length){
        return [];
    }

    const codes=[...new Set(source.map(m=>m.language))].filter(Boolean);
    return [...codes];
})

const genreOptions=Object.entries(GENRE_MAP).map(([id,name])=>({
    id:parseInt(id),
    name:name
}));

const defaultFilters = () => ({
    genre: [],
    language: [],
    rating: [],
    ratingRange: [0, 10],
    sortBy: 'default',
});

const localFilters = ref(defaultFilters());
const openedPanel = ref(0);
const openedAge=ref(0);

const availableRatings=[
    {value:'U', img: 'img/universal_logo.png'},
    {value:'P13', img: 'img/p13_logo.png'},
    {value:'P18', img: 'img/p18_logo.png'}
]

const toggleRating = (val) => {
    const index = localFilters.value.rating.indexOf(val);
    if (index === -1) {
        localFilters.value.rating.push(val);
    } else {
        localFilters.value.rating.splice(index, 1);
    }
};

const reset=()=>{
    localFilters.value={
        genre: [],
        language: [],
        rating:[],
        ratingRange: [0,10],
        sortBy: 'default',
    };
    emit('apply-filters', { ...localFilters.value });
    emit('close');
   
};

const apply=()=>{
    emit('apply-filters',{...localFilters.value});
    emit('update:modelValue', false);
    emit('close');
}

watch(()=>props.filters, (newFilters)=>{
    if(newFilters){
        localFilters.value=JSON.parse(JSON.stringify(newFilters));
    }
},{deep:true});

onMounted(() => {
    syncThemeState();

    themeObserver = new MutationObserver(() => {
        syncThemeState();
    });

    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });
});

onBeforeUnmount(() => {
    themeObserver?.disconnect();
});

</script>

<template>
    <template v-if="isMobile">
        <v-dialog
            :model-value="modelValue"
            fullscreen
            scrollable
            transition="dialog-bottom-transition"
            scrim="#00000099"
            :theme="isDarkTheme ? 'dark' : 'light'"
            @update:model-value="val => $emit('update:modelValue', val)"
        >
            <v-card :class="['filter-shell', 'filter-sheet-shell', themeClass]">
                <div class="d-flex flex-column drawer-inner">
                    <div class="d-flex justify-space-between align-center mb-3">
                        <h3 class="text-color">
                            Filters
                        </h3>
                        <v-btn color="text-color" icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
                    </div>
                    <div class="filter-scroll-area">
                        <div class="mb-4">
                            <p class="text-overline text-color mb-2">Genre</p>
                            <v-chip-group 
                                v-model="localFilters.genre" 
                                column 
                                multiple
                                selected-class="genre-chip-selected"
                            >
                                <v-chip
                                    v-for="g in genreOptions"
                                    :key="g.id"
                                    :value="g.id"
                                    :filter="false"
                                    class="m-1 genre-chip"
                                >
                                    {{ g.name }}
                                </v-chip>
                            </v-chip-group>
                        </div>

                        <v-divider class="mb-3" color="grey-lighten-1"></v-divider>

                        <!-- Languages -->
                        <div class="mb-4">
                            <v-expansion-panels 
                            v-model="openedPanel"
                            variants="accordion" class="filter-expansion">
                                <v-expansion-panel bg-color="transparent">
                                    <v-expansion-panel-title>
                                        <div class="d-flex flex-column">
                                            <p class="text-overline text-color m-0">Languages</p>
                                            <span class="text-caption text-grey">
                                                {{ localFilters.language.length > 0 ? `${localFilters.language.length} Selected` : '' }}
                                            </span>
                                        </div>
                                    </v-expansion-panel-title>
                                    <v-expansion-panel-text class="p-0 m-0">
                                        <v-row no-gutters class="m-0">
                                            <v-col cols="6" v-for="(lang) in availableLanguages" :key="lang">
                                            <v-checkbox
                                                v-model="localFilters.language"
                                                :value="lang"
                                                color="red-accent-3"
                                                density="compact"
                                                hide-details
                                                multiple
                                                class="language-checkbox"
                                            >
                                                <template v-slot:label>
                                                    <span class="language-label">
                                                        {{ lang === 'All' ? 'All Languages' : getLanguageName(lang) }}
                                                    </span>
                                                </template>
                                            </v-checkbox>
                                            </v-col>
                                        </v-row>
                                    </v-expansion-panel-text>
                                </v-expansion-panel>
                            </v-expansion-panels>
                        </div>

                        <v-divider class="mb-3" color="grey-lighten-1"></v-divider>
                        
                        <!-- Movie Age Filter -->
                        <div class="mb-4">
                            <v-expansion-panels 
                            v-model="openedAge" variant="accordion" class="filter-expansion">
                                <v-expansion-panel bg-color="transparent">
                                <v-expansion-panel-title>
                                    <div class="d-flex flex-column">
                                    <p class="text-overline text-color m-0">Age Rating</p>
                                    <span class="text-caption text-grey">
                                        {{ localFilters.rating.length > 0 ? `${localFilters.rating.length} Selected` : '' }}
                                    </span>
                                    </div>
                                </v-expansion-panel-title>

                                <v-expansion-panel-text>
                                    <div class="d-flex flex-wrap gap-3 py-2">
                                    <div
                                        v-for="rating in availableRatings"
                                        :key="rating.value"
                                        class="rating-item"
                                        :class="{ 'rating-active': localFilters.rating.includes(rating.value) }"
                                        @click="toggleRating(rating.value)"
                                    >
                                        <v-img
                                            :src="rating.img"
                                            width="50"
                                            height="50"
                                            contain
                                            class="rounded-sm cursor-pointer transition-swing"
                                            :style="{ opacity: localFilters.rating.includes(rating.value) ? '1' : '0.4' }"
                                        ></v-img>
                                    </div>
                                    </div>
                                </v-expansion-panel-text>
                                </v-expansion-panel>
                            </v-expansion-panels>
                        </div>

                        <v-divider class="mb-3" color="grey-lighten-1"></v-divider>
                        <!-- Star Rating -->
                        <div class="mb-4">
                            <div class="d-flex justify-space-between align-center mb-2">
                                <p class="text-overline text-color m-0">Rating Range</p>
                                <span class="text-caption text-red-accent-3 font-weight-bold">
                                    {{ localFilters.ratingRange[0].toFixed(1) }} - {{ localFilters.ratingRange[1].toFixed(1) }}
                                </span>
                            </div>

                            <v-range-slider
                                v-model="localFilters.ratingRange"
                                min="0"
                                max="10"
                                step="0.5"
                                color="red-accent-3"
                                thumb-label
                                hide-details
                                strict
                                class="me-3"
                            >
                                <template v-slot:prepend>
                                    <v-icon color="yellow-darken-2" class="me-3">mdi-star</v-icon>
                                </template>
                            </v-range-slider>
                        </div>

                        <v-divider class="mb-6" color="grey-lighten-1"></v-divider>

                        <!-- SortBy -->
                        <div class="mb-6">
                            <p class="text-overline text-color mb-2">Sort By</p>
                            <v-chip-group
                                v-model="localFilters.sortBy"
                                mandatory
                                column
                                selected-class="sort-chip-selected"
                                class="sort-pills flex-wrap"
                            >
                                <v-chip value="default" :filter="false" class="m-1 sort-chip">
                                    Default
                                </v-chip>

                                <v-chip value="latest" :filter="false" class="m-1 sort-chip">
                                    Latest Release
                                </v-chip>

                                <v-chip value="rating" :filter="false" class="m-1 sort-chip">
                                    Highest Rating
                                </v-chip>

                                <v-chip value="popularity" :filter="false" class="m-1 sort-chip">
                                    Popularity
                                </v-chip>
                            </v-chip-group>
                        </div>
                    </div>
                    <div class="d-flex gap-2 mt-4 justify-space-between filter-actions">
                        <v-btn variant="outlined" height="48" width="140" color="grey" @click="reset" class="rounded-3">Clear All</v-btn>
                        <v-btn color="red-accent-3" height="48" width="140" @click="apply" class="font-weight-bold rounded-3 movie-btn">
                            Apply Filters
                        </v-btn>
                    </div>
                </div>
            </v-card>
        </v-dialog>
    </template>
    <v-navigation-drawer
        v-else
        location="right"
        temporary
        width="400"
        :theme="isDarkTheme ? 'dark' : 'light'"
        :class="['filter-shell', 'filter-drawer-shell', themeClass]"
        :model-value="modelValue"
        @update:model-value="val => $emit('update:modelValue', val)"
    >
        <div class="d-flex flex-column drawer-inner">
            <div class="d-flex justify-space-between align-center mb-3">
                <h3 class="text-color">
                    Filters
                </h3>
                <v-btn color="text-color" icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
            </div>
            <div class="filter-scroll-area">
                <div class="mb-4">
                    <p class="text-overline text-color mb-2">Genre</p>
                    <v-chip-group 
                        v-model="localFilters.genre" 
                        column 
                        multiple
                        selected-class="genre-chip-selected"
                    >
                        <v-chip
                            v-for="g in genreOptions"
                            :key="g.id"
                            :value="g.id"
                            :filter="false"
                            class="m-1 genre-chip"
                        >
                            {{ g.name }}
                        </v-chip>
                    </v-chip-group>
                </div>

                <v-divider class="mb-3" color="grey-lighten-1"></v-divider>

                <!-- Languages -->
            <div class="mb-4">
                <v-expansion-panels 
                 v-model="openedPanel"
                variants="accordion" class="filter-expansion">
                    <v-expansion-panel bg-color="transparent">
                        <v-expansion-panel-title>
                            <div class="d-flex flex-column">
                                <p class="text-overline text-color m-0">Languages</p>
                                <span class="text-caption text-grey">
                                    {{ localFilters.language.length > 0 ? `${localFilters.language.length} Selected` : '' }}
                                </span>
                            </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text class="p-0 m-0">
                            <v-row no-gutters class="m-0">
                                <v-col cols="6" v-for="(lang) in availableLanguages" :key="lang">
                                <v-checkbox
                                    v-model="localFilters.language"
                                    :value="lang"
                                    color="red-accent-3"
                                    density="compact"
                                    hide-details
                                    multiple
                                    class="language-checkbox"
                                >
                                    <template v-slot:label>
                                        <span class="language-label">
                                            {{ lang === 'All' ? 'All Languages' : getLanguageName(lang) }}
                                        </span>
                                    </template>
                                </v-checkbox>
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>

                <v-divider class="mb-3" color="grey-lighten-1"></v-divider>
                
                <!-- Movie Age Filter -->
                <div class="mb-4">
                    <v-expansion-panels 
                    v-model="openedAge" variant="accordion" class="filter-expansion">
                        <v-expansion-panel bg-color="transparent">
                        <v-expansion-panel-title>
                            <div class="d-flex flex-column">
                            <p class="text-overline text-color m-0">Age Rating</p>
                            <span class="text-caption text-grey">
                                {{ localFilters.rating.length > 0 ? `${localFilters.rating.length} Selected` : '' }}
                            </span>
                            </div>
                        </v-expansion-panel-title>

                        <v-expansion-panel-text>
                            <div class="d-flex flex-wrap gap-3 py-2">
                            <div
                                v-for="rating in availableRatings"
                                :key="rating.value"
                                class="rating-item"
                                :class="{ 'rating-active': localFilters.rating.includes(rating.value) }"
                                @click="toggleRating(rating.value)"
                            >
                                <v-img
                                    :src="rating.img"
                                    width="50"
                                    height="50"
                                    contain
                                    class="rounded-sm cursor-pointer transition-swing"
                                    :style="{ opacity: localFilters.rating.includes(rating.value) ? '1' : '0.4' }"
                                ></v-img>
                            </div>
                            </div>
                        </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                    </div>

                <v-divider class="mb-3" color="grey-lighten-1"></v-divider>
                <!-- Star Rating -->
                <div class="mb-4">
                    <div class="d-flex justify-space-between align-center mb-2">
                        <p class="text-overline text-color m-0">Rating Range</p>
                        <span class="text-caption text-red-accent-3 font-weight-bold">
                            {{ localFilters.ratingRange[0].toFixed(1) }} - {{ localFilters.ratingRange[1].toFixed(1) }}
                        </span>
                    </div>

                    <v-range-slider
                        v-model="localFilters.ratingRange"
                        min="0"
                        max="10"
                        step="0.5"
                        color="red-accent-3"
                        thumb-label
                        hide-details
                        strict
                        class="me-3"
                    >
                        <template v-slot:prepend>
                            <v-icon color="yellow-darken-2" class="me-3">mdi-star</v-icon>
                        </template>
                    </v-range-slider>
                </div>

                <v-divider class="mb-6" color="grey-lighten-1"></v-divider>

                <!-- SortBy -->
                <div class="mb-6">
                    <p class="text-overline text-color mb-2">Sort By</p>
                    <v-chip-group
                        v-model="localFilters.sortBy"
                        mandatory
                        column
                        selected-class="sort-chip-selected"
                        class="sort-pills flex-wrap"
                    >
                        <v-chip value="default" :filter="false" class="m-1 sort-chip">
                            Default
                        </v-chip>

                        <v-chip value="latest" :filter="false" class="m-1 sort-chip">
                            Latest Release
                        </v-chip>

                        <v-chip value="rating" :filter="false" class="m-1 sort-chip">
                            Highest Rating
                        </v-chip>

                        <v-chip value="popularity" :filter="false" class="m-1 sort-chip">
                            Popularity
                        </v-chip>
                    </v-chip-group>
                </div>
            </div>
            <div class="d-flex gap-2 mt-4 justify-space-between filter-actions">
                <v-btn variant="outlined" height="48" width="140" color="grey" @click="reset" class="rounded-3">Clear All</v-btn>
                <v-btn color="red-accent-3" height="48" width="140" @click="apply" class="font-weight-bold rounded-3 movie-btn">
                    Apply Filters
                </v-btn>
            </div>
        </div>
    </v-navigation-drawer>
</template>

<style scoped>
.rating-item{
    cursor:pointer;
    transition:all 0.2s ease-out;
    padding:4px;
    border:2px solid transparent;
    border-radius: 8px;
}
.rating-active{
    border-color:#ff5252;
    background-color: rgba(255,82,82,0.1);
}
.cursor-pointer{
    cursor:pointer;
}
.transition-swing{
    transition:0.3s cubic-bezier(0.25, 0.8,0.5,1);
}
.filter-drawer-shell :deep(.v-navigation-drawer__content) {
    height: 100%;
    overflow: hidden;
}

.filter-shell{
    color: var(--text-color);
    background: var(--bg-color);
}

.filter-drawer-shell{
    padding-top:3rem;
    padding-bottom:2rem;
    border-left: 1px solid var(--border-color);
}

@media (max-width: 600px) {
    .filter-sheet-shell {
        width: 100vw;
        max-width: 100vw;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
        overflow: hidden;
    }

    .filter-drawer-shell {
        padding-top: 1rem;
        padding-bottom: 1rem;
    }

    .drawer-inner {
        padding: 12px 12px 16px;
    }

    .filter-actions {
        margin-bottom: 0;
        padding: 0 0.5rem;
    }
}

.drawer-inner {
    height: 100%;
    max-height: 100vh;
    padding: 16px 16px 20px;
    overflow: hidden;
    box-sizing: border-box;
}

.filter-scroll-area {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 6px;
}

.filter-actions {
    flex: 0 0 auto;
    padding-top: 8px;
    margin-bottom:3rem;
    padding: 0 1rem;
}

.filter-scroll-area::-webkit-scrollbar {
    width: 6px;
}

.filter-scroll-area::-webkit-scrollbar-track {
    background: transparent;
}

.filter-scroll-area::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 10px;
}

.genre-chip {
    background: var(--chip-bg);
    color: var(--chip-text);
    border: 1px solid var(--chip-border);
    transition: all 0.2s ease;
}

.genre-chip:hover {
    border-color: var(--chip-hover-border);
    background: var(--chip-hover-bg);
}

.genre-chip-selected {
    background: var(--chip-selected-bg) !important;
    color: var(--chip-selected-text) !important;
    border-color: var(--chip-selected-border) !important;
}
.language-checkbox {
    padding: 6px 10px;
    border-radius: 10px;
    transition: all 0.2s ease;
    color:var(--lang-bg);
}
.language-checkbox:hover {
    background: var(--lang-hover-bg);
    border-color: var(--lang-hover-border);
}
.filter-expansion :deep(.v-expansion-panel-title__icon .v-icon) {
    color: var(--text-color) !important;
    transition: color 0.25s ease;
}
.language-label {
    color: var(--lang-text);
    font-size: 0.92rem;
}

.sort-chip {
    background: var(--sort-chip-bg);
    color: var(--sort-chip-text);
    border: 1px solid var(--sort-chip-border);
    transition: all 0.2s ease;
    font-weight: 500;
}

.sort-chip:hover {
    background: var(--sort-chip-hover-bg);
    border-color: var(--sort-chip-hover-border);
}

.sort-chip-selected {
    background: var(--sort-chip-selected-bg) !important;
    color: var(--sort-chip-selected-text) !important;
    border-color: var(--sort-chip-selected-border) !important;
    box-shadow: 0 0 10px rgba(255, 82, 82, 0.25);
}

</style>
