<script setup>
import { ref, onMounted, onUnmounted, shallowRef, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import * as htmlToImage from 'html-to-image';
import VueDraggableResizable from 'vue-draggable-resizable-vue3';
import QrcodeVue from 'qrcode.vue';
import { ExternalLink, X, Menu, WandSparkles } from 'lucide-vue-next';
import { useAppI18n } from '@/utils/i18n';

// Import other hook and components
import { useMovies } from '../hook/useMovies';
import { useTickets } from '../hook/useTickets';
import { getGenreName } from '../utils/genre';
import { useTicketDesign } from '../hook/useTicketDesign';
import { useAiDesign } from '../hook/useAiDesign';
import FooterView from '@/components/FooterView.vue';

// Import your SVG shapes
import TicketShape1 from '@/components/TicketShape1.vue';
import TicketShape2 from '@/components/TicketShape2.vue';
import TicketShape3 from '@/components/TicketShape3.vue';
import TicketShape4 from '@/components/TicketShape4.vue';
import TicketShape5 from '@/components/TicketShape5.vue';
import TicketShape6 from '@/components/TicketShape6.vue';
import TicketShape7 from '@/components/TicketShape7.vue';
import TicketShape8 from '@/components/TicketShape8.vue';
import TicketShape9 from '@/components/TicketShape9.vue';
import TicketShape10 from '@/components/TicketShape10.vue';
import TicketShape11 from '@/components/TicketShape11.vue';
import TicketShape12 from '@/components/TicketShape12.vue';
import TicketShape13 from '@/components/TicketShape13.vue';
import TicketShape14 from '@/components/TicketShape14.vue';

const route = useRoute();
const { fetchMovieDetails, isLoading } = useMovies();
const { fetchTicketDetails, isTicketsLoading } = useTickets();
const { t, locale } = useAppI18n();
const activeTicket = ref(null);

const shapes = [TicketShape1, TicketShape2, TicketShape3, TicketShape4, TicketShape5, TicketShape6,TicketShape7,TicketShape8,TicketShape9,TicketShape10,TicketShape11,TicketShape12,TicketShape13,TicketShape14];
const currentShape = shallowRef(TicketShape1);
const tabs = ['shape', 'picture', 'components'];
const activeTab = ref('shape');
const isModalOpen = ref(false);
const isAiPromptModalOpen = ref(false);
const previewImageUrl = ref('');
const isSidebarOpen = ref(true);
const isMobileLayout = ref(false);
const windowWidth = ref(window.innerWidth);

const ticketRef = ref(null);
const movieTitle = ref('');
const accentColor = ref('#ffffff');
const moviePosters = ref([]);
const movieBackdrops = ref([]);
const movieBackdrop = ref('');
const backdropOpacity = ref(1);
const rotation = ref(0);
const selectedBgIndex = ref(-1);
const colorMode = ref('solid');
const accentColor2 = ref('#ff0000');
const gradientAngle = ref(90);
const textElements = ref([]);
const selectedText = ref(null);
const { save, isLoading: isSaving } = useTicketDesign();
const { generateTicketDesign, isAiDesigning } = useAiDesign();
const ticketDescription = ref('');
const aiDesignPrompt = ref('');
const aiDesignNotice = ref('');
const aiDesignRunCount = ref(0);
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

const normalizeImageUrl = (path) => {
    if (!path) return '';
    if (typeof path !== 'string') return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }
    return `${TMDB_IMAGE_BASE_URL}${path}`;
};

const loadTicketResources = async () => {
    const movieId = route.params.movieId;
    activeTicket.value = await fetchTicketDetails(route.params.bookingId);

    if (!movieId) return;

    const oldBackdrops = [...movieBackdrops.value];
    const oldPosters = [...moviePosters.value];
    const fallbackBackdrops = [activeTicket.value?.backdrop].filter(Boolean).map(normalizeImageUrl);
    const fallbackPosters = [activeTicket.value?.poster].filter(Boolean).map(normalizeImageUrl);

    const movie = await fetchMovieDetails(movieId);
    if (!movie) return;

    movieTitle.value = activeTicket.value?.title || movie.title;

    const nextPosters = (movie.posters || [movie.poster])
        .filter(Boolean)
        .map(normalizeImageUrl);

    const nextBackdrops = (movie.backdrops || [movie.backdrop])
        .filter(Boolean)
        .map(normalizeImageUrl);

    moviePosters.value = nextPosters.length > 0 ? nextPosters : (fallbackPosters.length > 0 ? fallbackPosters : oldPosters);
    movieBackdrops.value = nextBackdrops.length > 0 ? nextBackdrops : (fallbackBackdrops.length > 0 ? fallbackBackdrops : oldBackdrops);
};

const syncLayoutMode = () => {
    windowWidth.value = window.innerWidth;
    const mobile = window.innerWidth <= 992;
    isMobileLayout.value = mobile;
    isSidebarOpen.value = !mobile;
};

const ticketDisplayWidth = computed(() => {
    const maxWidth = isMobileLayout.value
        ? Math.max(260, windowWidth.value - 24)
        : 650;

    return Math.min(650, maxWidth);
});

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
    isSidebarOpen.value = false;
};

const openAiPromptModal = () => {
    aiDesignNotice.value = '';
    isAiPromptModalOpen.value = true;
};

const openPreview = async () => {
    try {
        const dataUrl = await captureTicket();
        previewImageUrl.value = dataUrl;
        isModalOpen.value = true;
    } catch (err) {
        alert(t('ticketCustomizer.previewFailed'));
        console.error(err);
    }
};

const confirmSave = async () => {
    if (!activeTicket.value) return;
    try {
        const imageToSave = previewImageUrl.value || await captureTicket();
        previewImageUrl.value = imageToSave;
        await save(activeTicket.value.bookingId, imageToSave, ticketDescription.value);
        alert(t('ticketCustomizer.saveSuccess'));
        isModalOpen.value = false;
    } catch (err) {
        console.error(err);
        alert(t('ticketCustomizer.saveFailed'));
    }
};

const getTicketInfoValue = (infoKey) => {
    if (!activeTicket.value) return 'N/A';

    const valueMap = {
        title: activeTicket.value.title,
        runtime: activeTicket.value.runtime,
        genres: (activeTicket.value.genres || [])
            .map(id => getGenreName(id))
            .join(', '),
        cinema: activeTicket.value.cinema,
        hall: activeTicket.value.hall,
        startTime: new Date(activeTicket.value.startTime).toLocaleString(),
        seats: (activeTicket.value.seats || []).join(', '),
        id: activeTicket.value.id,
        qr: activeTicket.value.bookingId,
        barcode: activeTicket.value.bookingId,
    };

    return valueMap[infoKey] || 'N/A';
};

const addInfo = (infoKey) => {

    textElements.value.push({
        id: Date.now(),
        text: getTicketInfoValue(infoKey),
        type: infoKey,
        x: 50, y: 50, w: 200, h: 40,
        fontSize: 16,
        rotation: 0,
        color: '#ffffff'
    });
};

const selectText = (el) => {
    selectedText.value = el;
    activeTab.value = 'components';
};

const formatFontFamily = (fontFamily) => {
    if (!fontFamily) return "'Montserrat', sans-serif";
    if (fontFamily.includes(',')) return fontFamily;

    const serifFonts = new Set(['Playfair Display', 'Lora']);
    const cursiveFonts = new Set(['Pacifico']);
    const monospaceFonts = new Set(['Courier Prime']);

    if (serifFonts.has(fontFamily)) return `'${fontFamily}', serif`;
    if (cursiveFonts.has(fontFamily)) return `'${fontFamily}', cursive`;
    if (monospaceFonts.has(fontFamily)) return `'${fontFamily}', monospace`;
    return `'${fontFamily}', sans-serif`;
};

const clampNumber = (value, min, max) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return min;
    return Math.min(max, Math.max(min, numberValue));
};

const fitFontSizeToBox = (text, boxWidth, boxHeight, requestedSize, type) => {
    if (type === 'qr' || type === 'barcode') {
        return Number(requestedSize || 16);
    }

    const value = String(text || '');
    const longestWordLength = value
        .split(/\s+/)
        .reduce((max, word) => Math.max(max, word.length), 1);
    const totalLength = Math.max(value.length, 1);
    const byTotalLength = (boxWidth * 1.65) / totalLength;
    const byLongestWord = (boxWidth * 0.95) / longestWordLength;
    const byHeight = boxHeight * 0.72;
    const maxByType = type === 'title' ? 30 : 24;

    return Math.floor(clampNumber(
        Math.min(Number(requestedSize || maxByType), byTotalLength, byLongestWord, byHeight),
        10,
        maxByType
    ));
};

const isLightHexColor = (value) => {
    if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) {
        return false;
    }

    const r = parseInt(value.slice(1, 3), 16);
    const g = parseInt(value.slice(3, 5), 16);
    const b = parseInt(value.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 180;
};

const getReadableTextColor = (el, hasBackdrop) => {
    if (el.type === 'qr' || el.type === 'barcode') return '#000000';
    if (!hasBackdrop && el.color && /^#[0-9a-fA-F]{6}$/.test(el.color)) return el.color;
    return isLightHexColor(el.color) ? el.color : '#ffffff';
};

const getAiSafeBox = (type) => {
    const width = ticketRef.value?.getBoundingClientRect()?.width || ticketDisplayWidth.value || 650;
    const height = ticketRef.value?.getBoundingClientRect()?.height || 430;
    const scaleX = width / 650;
    const scaleY = height / 430;

    if (type === 'qr' || type === 'barcode') {
        return {
            minX: 470 * scaleX,
            maxX: 585 * scaleX,
            minY: 72 * scaleY,
            maxY: 235 * scaleY,
            minW: 72 * scaleX,
            maxW: 92 * scaleX,
            minH: 72 * scaleY,
            maxH: 92 * scaleY,
        };
    }

    if (type === 'seats') {
        return {
            minX: 395 * scaleX,
            maxX: 570 * scaleX,
            minY: 235 * scaleY,
            maxY: 330 * scaleY,
            minW: 80 * scaleX,
            maxW: 160 * scaleX,
            minH: 32 * scaleY,
            maxH: 56 * scaleY,
        };
    }

    return {
        minX: 185 * scaleX,
        maxX: 555 * scaleX,
        minY: 72 * scaleY,
        maxY: 245 * scaleY,
        minW: 100 * scaleX,
        maxW: 290 * scaleX,
        minH: 28 * scaleY,
        maxH: 58 * scaleY,
    };
};

const normalizeAiElement = (el, index) => {
    const safe = getAiSafeBox(el.type);
    const w = clampNumber(el.w, safe.minW, Math.min(safe.maxW, safe.maxX - safe.minX));
    const h = clampNumber(el.h, safe.minH, Math.min(safe.maxH, safe.maxY - safe.minY));
    const text = getTicketInfoValue(el.type);
    const hasBackdrop = Boolean(movieBackdrop.value);

    return {
        id: Date.now() + index,
        text,
        type: el.type,
        x: clampNumber(el.x, safe.minX, safe.maxX - w),
        y: clampNumber(el.y, safe.minY, safe.maxY - h),
        w,
        h,
        fontSize: fitFontSizeToBox(text, w, h, el.fontSize, el.type),
        rotation: clampNumber(el.rotation || 0, -8, 8),
        color: getReadableTextColor(el, hasBackdrop),
        fontFamily: formatFontFamily(el.fontFamily),
    };
};

const applyAiDesign = async (design) => {
    if (!design) return;

    colorMode.value = design.colorMode === 'solid' ? 'solid' : 'gradient';
    accentColor.value = design.accentColor || accentColor.value;
    accentColor2.value = design.accentColor2 || accentColor2.value;
    gradientAngle.value = Number(design.gradientAngle ?? gradientAngle.value);
    backdropOpacity.value = movieBackdrops.value.length > 0
        ? clampNumber(design.backdropOpacity ?? 0.42, 0.28, 0.5)
        : Number(design.backdropOpacity ?? backdropOpacity.value);

    const hasBackdrops = movieBackdrops.value.length > 0;
    const requestedBackgroundIndex = Number(design.backgroundIndex ?? 0);
    const backgroundIndex = hasBackdrops
        ? (Math.max(0, requestedBackgroundIndex) + aiDesignRunCount.value - 1) % movieBackdrops.value.length
        : -1;

    if (backgroundIndex >= 0 && movieBackdrops.value[backgroundIndex]) {
        await selectBackground(movieBackdrops.value[backgroundIndex], backgroundIndex);
    } else {
        await selectBackground('', -1);
    }

    textElements.value = (design.textElements || []).map(normalizeAiElement);

    selectedText.value = null;
    if (design.description) {
        ticketDescription.value = design.description;
    }
};

const autoDesignTicket = async () => {
    if (!activeTicket.value) return;
    aiDesignNotice.value = '';
    aiDesignRunCount.value += 1;

    try {
        const rect = ticketRef.value?.getBoundingClientRect();
        const design = await generateTicketDesign({
            movieTitle: activeTicket.value.title || movieTitle.value,
            runtime: activeTicket.value.runtime,
            genres: (activeTicket.value.genres || []).map(id => getGenreName(id)),
            cinema: activeTicket.value.cinema,
            hall: activeTicket.value.hall,
            startTime: activeTicket.value.startTime,
            seats: activeTicket.value.seats || [],
            bookingId: String(activeTicket.value.bookingId || activeTicket.value.id || ''),
            backdrops: movieBackdrops.value,
            currentBackdropIndex: selectedBgIndex.value,
            canvasWidth: Math.round(rect?.width || ticketDisplayWidth.value),
            canvasHeight: Math.round(rect?.height || 430),
            userPrompt: aiDesignPrompt.value.trim(),
            variationSeed: Date.now() + aiDesignRunCount.value,
        });

        await applyAiDesign(design);
        aiDesignNotice.value = design.source === 'fallback'
            ? (design.notice || t('ticketCustomizer.aiFallbackNotice'))
            : '';
        isAiPromptModalOpen.value = false;
        activeTab.value = 'picture';
    } catch (err) {
        console.error(err);
        alert(t('ticketCustomizer.aiDesignFailed'));
    }
};

const deleteSelectedText = () => {
    if (!selectedText.value) return;

    textElements.value = textElements.value.filter(
        (el) => el.id !== selectedText.value.id
    );

    selectedText.value = null;
};

const toNum = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const normalizeResizePayload = (x, y, width, height) => {
    if (x && typeof x === 'object') {
        return {
            x: toNum(x.x ?? x.left, 0),
            y: toNum(x.y ?? x.top, 0),
            w: toNum(x.width ?? x.w ?? width, 120),
            h: toNum(x.height ?? x.h ?? height, 32)
        };
    }
    return {
        x: toNum(x, 0),
        y: toNum(y, 0),
        w: toNum(width, 120),
        h: toNum(height, 32)
    };
};

const handleResize = (el, x, y, width, height) => {
    const target = textElements.value.find(item => item.id === el.id);
    if (target) {
        const next = normalizeResizePayload(x, y, width, height);
        target.x = next.x;
        target.y = next.y;
        target.w = next.w;
        target.h = next.h;
    }
};

onMounted(async () => {
    syncLayoutMode();
    window.addEventListener('resize', syncLayoutMode);
    await loadTicketResources();
});

watch(locale, async () => {
    await loadTicketResources();
});

onUnmounted(() => {
    window.removeEventListener('resize', syncLayoutMode);
});

watch(currentShape, () => {
    movieBackdrop.value = "";
    bg.value.src = "";
    accentColor.value="#fefefe";
    accentColor2.value="";
    selectedBgIndex.value = -1;
})

const bg = ref({ x: 0, y: 0, width: 700, height: 430, src: '' });

const selectBackground = (url, index) => {
    selectedBgIndex.value = index;

    if (!url) {
        movieBackdrop.value = '';
        bg.value.src = '';
        return;
    }

    movieBackdrop.value = url;
    bg.value.src = url;
};

const captureTicket = async () => {
    try {
        const node = ticketRef.value;

        if (!node) {
            throw new Error('Ticket node missing');
        }

        // 1. Get the EXACT dimensions of the ticket card in pixels
        const rect = node.getBoundingClientRect();
        const exactWidth = rect.width;
        const exactHeight = rect.height;

        // Save original styles to restore them after the capture
        const originalBg = node.style.background;

        // Apply background customizations
        if (colorMode.value === 'solid') {
            node.style.background = accentColor.value;
        } else {
            node.style.background = `
                linear-gradient(
                    ${gradientAngle.value}deg,
                    ${accentColor.value},
                    ${accentColor2.value}
                )
            `;
        }

        
        const canvas = await htmlToImage.toCanvas(node, {
            cacheBust: true,
            pixelRatio: 2,
            skipFonts: true,
            useCORS: true,
            backgroundColor: null, 
            
            width: exactWidth,
            height: exactHeight, 
            style: {
                transform: 'scale(1)', 
                left: '0',
                top: '0',
                margin: '0',
                padding: node.style.padding, 
            },

            filter: (domNode) => {
                return !domNode.classList?.contains('share-btn');
            }
        });

        node.style.background = originalBg;

        return canvas.toDataURL('image/png');

    } catch (err) {
        console.error('Capture failed:', err);
        throw err;
    }
};
const triggerShare = async () => {
    try {
        const response = await fetch(previewImageUrl.value);
        const blob = await response.blob();
        const file = new File([blob], 'my-popflix-ticket.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: t('ticketCustomizer.shareTitle'),
                text: ticketDescription.value || t('ticketCustomizer.shareText')
            });
        } else {
            const link = document.createElement('a');
            link.href = previewImageUrl.value;
            link.download = 'my-popflix-ticket.png';
            link.click();
        }
    } catch (err) {
        console.error(err);
        alert(t('ticketCustomizer.shareUnsupported'));
    }
};

</script>

<template>
    <v-app>
    <v-container fluid class="customizer-layout" :class="{ 'sidebar-open': isSidebarOpen }" width="100vw">
        <button
            v-if="isMobileLayout"
            class="sidebar-toggle-fab"
            type="button"
            :aria-label="isSidebarOpen ? t('ticketCustomizer.closeControls') : t('ticketCustomizer.openControls')"
            @click="toggleSidebar"
        >
            <component :is="isSidebarOpen ? X : Menu" size="20" />
        </button>

        <div
            v-if="isMobileLayout && isSidebarOpen"
            class="sidebar-backdrop"
            @click="closeSidebar"
        ></div>

        <aside class="sidebar-scrollable" :class="{ 'is-open': isSidebarOpen, 'is-mobile': isMobileLayout }">
            <div class="sidebar-topbar pt-md-0 pt-4">
                <h4 class="mt-5">{{ t('ticketCustomizer.header') }}</h4>
                <button
                    v-if="isMobileLayout"
                    class="sidebar-close-btn"
                    type="button"
                    :aria-label="t('ticketCustomizer.closeControls')"
                    @click="closeSidebar"
                >
                    <X size="18" />
                </button>
            </div>

            <div class="tabs">
                <button v-for="tab in tabs" :key="tab" :class="{ active: activeTab === tab }" @click="activeTab = tab">
                    {{ t(`ticketCustomizer.${tab}Tab`) }}
                </button>
            </div>

            <button
                class="ai-design-btn"
                type="button"
                :disabled="isAiDesigning || isTicketsLoading || isLoading"
                @click="openAiPromptModal"
            >
                <WandSparkles size="18" />
                <span>{{ isAiDesigning ? t('ticketCustomizer.aiDesigning') : t('ticketCustomizer.aiDesign') }}</span>
            </button>
            <p v-if="aiDesignNotice" class="ai-design-notice">{{ aiDesignNotice }}</p>

            <section v-if="activeTab === 'shape'" class="control-group">
                <div class="grid-options">
                    <div v-for="(s, i) in shapes" :key="i" class="option-card" @click="currentShape = s" :class="{ 'active-bg': currentShape === s }">
                        <img :src="`/shapes/shape-${i + 1}.png`" />
                    </div>
                </div>

            </section>

            <section v-if="activeTab === 'picture'" class="control-group">
                <h5 class="mt-4">{{ t('ticketCustomizer.selectBackground') }}</h5>
                <div class="grid-options">
                    <div class="option-card" :class="{ 'active-bg': selectedBgIndex === -1 }"
                        @click="selectBackground('', -1)">
                        <div class="none-placeholder">{{ t('ticketCustomizer.none') }}</div>
                    </div>
                    <div v-for="(p, i) in movieBackdrops" :key="i" class="option-card"
                        :class="{ 'active-bg': selectedBgIndex === i }" @click="selectBackground(p, i)">
                        <img :src="p" />
                    </div>
                </div>
                <label class="d-flex mt-5 justify-between">
                    <span class="me-2 text-color">{{ t('ticketCustomizer.opacity') }}</span>
                    <span class="text-accent">{{ (backdropOpacity * 100).toFixed(0) }}%</span>
                </label>
                <div class="rotation-control">
                    <input type="range" v-model="backdropOpacity" min="0" max="1" step="0.1" class="rotate-slider" />
                    <button class="reset-btn" @click="backdropOpacity = 1">{{ t('ticketCustomizer.reset') }}</button>
                </div>
                <label class="d-flex my-3 justify-between">
                    <span class="me-3 text-color">{{ t('ticketCustomizer.color') }}</span>
                    <div class="mode-toggle">
                        <button @click="colorMode = 'solid'" :class="{ active: colorMode === 'solid' }">{{ t('ticketCustomizer.solid') }}</button>
                        <button @click="colorMode = 'gradient'"
                            :class="{ active: colorMode === 'gradient' }">{{ t('ticketCustomizer.gradient') }}</button>
                    </div>
                </label>
                <div class="control-row">
                    <input type="color" v-model="accentColor" class="color-picker" />
                    <input v-if="colorMode === 'gradient'" type="color" v-model="accentColor2"
                        class="color-picker ms-2" />
                    <span class="text-accent ms-3">{{ colorMode === 'solid' ? accentColor : t('ticketCustomizer.gradient') }}</span>
                    <label v-if="colorMode === 'gradient'" class="d-flex mt-3 justify-between">
                        <span class="me-2 text-color">{{ t('ticketCustomizer.gradientAngle') }}</span>
                        <span class="text-accent">{{ gradientAngle }}°</span>
                    </label>
                    <div v-if="colorMode === 'gradient'" class="rotation-control">
                        <input type="range" v-model="gradientAngle" min="0" max="360" class="rotate-slider" />
                    </div>
                </div>

            </section>

            <section v-if="activeTab === 'components'" class="control-group">
                <h5 class="mb-3">{{ t('ticketCustomizer.addInfo') }}</h5>
                <div class="grid-options">
                    <button class="info-btn" @click="addInfo('title')">{{ t('ticketCustomizer.infoTitle') }}</button>
                    <button class="info-btn" @click="addInfo('runtime')">{{ t('ticketCustomizer.infoRuntime') }}</button>
                    <button class="info-btn" @click="addInfo('genres')">{{ t('ticketCustomizer.infoGenres') }}</button>
                    <button class="info-btn" @click="addInfo('cinema')">{{ t('ticketCustomizer.infoCinema') }}</button>
                    <button class="info-btn" @click="addInfo('hall')">{{ t('ticketCustomizer.infoHall') }}</button>
                    <button class="info-btn" @click="addInfo('startTime')">{{ t('ticketCustomizer.infoDateTime') }}</button>
                    <button class="info-btn" @click="addInfo('seats')">{{ t('ticketCustomizer.infoSeats') }}</button>
                    <button class="info-btn" @click="addInfo('qr')">{{ t('ticketCustomizer.infoQr') }}</button>
                    <button class="info-btn" @click="addInfo('barcode')">{{ t('ticketCustomizer.infoBarcode') }}</button>
                </div>

                <div v-if="selectedText" class="settings-panel">
                    <label>{{ t('ticketCustomizer.rotationLabel') }} {{ selectedText.rotation }}°</label>
                    <input type="range" v-model.number="selectedText.rotation" min="0" max="360" />

                    <label>{{ t('ticketCustomizer.fontSizeLabel') }}</label>
                    <input type="number" v-model.number="selectedText.fontSize" min="12" max="100" />

                    <label>{{ t('ticketCustomizer.colorLabel') }}</label>
                    <input type="color" v-model="selectedText.color" />

                    <label>{{ t('ticketCustomizer.fontFamilyLabel') }}</label>
                    <select v-model="selectedText.fontFamily" class="font-select">
                        <option value="'Inter', sans-serif">Inter (Modern UI)</option>
                        <option value="'Playfair Display', serif">Playfair (Elegant Serif)</option>
                        <option value="'Bebas Neue', sans-serif">Bebas Neue (Bold Display)</option>
                        <option value="'Montserrat', sans-serif">Montserrat (Geometric)</option>
                        <option value="'Courier Prime', monospace">Courier Prime (Typewriter)</option>
                        <option value="'Roboto', sans-serif">Roboto (Readable)</option>
                        <option value="'Oswald', sans-serif">Oswald (Condensed Bold)</option>
                        <option value="'Lora', serif">Lora (Classic Serif)</option>
                        <option value="'Pacifico', cursive">Pacifico (Casual Script)</option>
                    </select>
                    <button class="delete-btn" @click="deleteSelectedText">
                        {{ t('ticketCustomizer.deleteSelected') }}
                    </button>
                </div>
            </section>
        </aside>

        <main class="canvas-area">
            <div v-if="isTicketsLoading || isLoading" class="loading-wrapper">
                <div class="loader-content">
                    <v-progress-circular indeterminate color="red-accent-3" size="70" width="4">
                        <v-icon size="24">mdi-movie-roll</v-icon>
                    </v-progress-circular>
                    <p class="mt-6 loading-text">{{ t('ticketCustomizer.loadingTicket') }}</p>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <div v-else ref="ticketRef" class="ticket-container" :style="{
                width: ticketDisplayWidth + 'px',
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.1s ease-out'
            }">
                <div class="canvas-content-wrapper">
                    
                    <div class="mask-layer">
                        <component :is="currentShape" :fillColor="accentColor" :accentColor="accentColor"
                            :accentColor2="accentColor2" :colorMode="colorMode" :gradientAngle="gradientAngle"
                            :imageSource="movieBackdrop || ''" :imageOpacity="+backdropOpacity"
                            :textElements="textElements" />
                    </div>
                    <div class="draggable-overlay-surface">
                        <VueDraggableResizable v-for="el in textElements" :key="el.id" :x="el.x" :y="el.y" :w="el.w"
                            :h="el.h" @click="selectText(el)" @resizing="(x, y, w, h) => handleResize(el, x, y, w, h)"
                            class-name="control-node-wrapper">
                            <div class="rotation-wrapper" :style="{ transform: `rotate(${el.rotation || 0}deg)` }" @mousedown="selectText(el)">
                                <div v-if="el.type === 'qr' && el.text !== 'N/A'" class="qr-node">
                                    <QrcodeVue :value="String(el.text)" :size="Math.max(40, Math.min(el.w, el.h) - 10)"
                                        level="H" />
                                </div>

                                <div v-else-if="el.type === 'barcode' && el.text !== 'N/A'" class="barcode-node">
                                    <div class="barcode-lines">
                                        <span v-for="n in 32" :key="n"></span>
                                    </div>
                                </div>

                                            <div v-else-if="el.text === 'N/A'" class="error-node">{{ t('ticketCustomizer.dataUnavailable') }}</div>

                                <input v-else v-model="el.text" class="transparent-drag-input" :style="{
                                    fontSize: el.fontSize + 'px',
                                    color: el.color,
                                    '--ticket-text-color': el.color,
                                    fontFamily: el.fontFamily || 'sans-serif'
                                }" />
                            </div>
                        </VueDraggableResizable>
                    </div>
                </div>
            </div>

            <button @click="openPreview" class="share-btn">
                <ExternalLink size="18" class="me-2 mb-1" />{{ t('ticketCustomizer.previewSave') }}
            </button>

            <v-dialog
                v-model="isAiPromptModalOpen"
                max-width="560"
                content-class="ai-prompt-dialog"
            >
                <v-card class="ai-prompt-card">
                    <div class="ai-prompt-header">
                        <div>
                            <h5 class="ai-prompt-title">{{ t('ticketCustomizer.aiPromptTitle') }}</h5>
                            <p class="ai-prompt-subtitle">{{ t('ticketCustomizer.aiPromptSubtitle') }}</p>
                        </div>
                        <v-btn icon variant="text" @click="isAiPromptModalOpen = false">
                            <X />
                        </v-btn>
                    </div>

                    <div class="ai-prompt-body">
                        <label for="ai-ticket-prompt">{{ t('ticketCustomizer.aiPromptLabel') }}</label>
                        <textarea
                            id="ai-ticket-prompt"
                            v-model="aiDesignPrompt"
                            :placeholder="t('ticketCustomizer.aiPromptPlaceholder')"
                            rows="5"
                        ></textarea>
                    </div>

                    <div class="ai-prompt-actions">
                        <v-btn variant="outlined" class="share-btn-style" @click="isAiPromptModalOpen = false">
                            {{ t('ticketCustomizer.cancel') }}
                        </v-btn>
                        <v-btn
                            class="save-btn-style"
                            :loading="isAiDesigning"
                            :disabled="isTicketsLoading || isLoading"
                            @click="autoDesignTicket"
                        >
                            <WandSparkles size="17" class="me-2" />
                            {{ t('ticketCustomizer.generateDesign') }}
                        </v-btn>
                    </div>
                </v-card>
            </v-dialog>

            <v-dialog
            v-model="isModalOpen"
            max-width="950"
            content-class="ticket-preview-dialog"
            >
            <v-card class="preview-modal-card">
                
                <div class="preview-header">
                    <div>
                        <h5 class="preview-title">{{ t('ticketCustomizer.previewTitle') }}</h5>
                        <p class="preview-subtitle">
                        {{ t('ticketCustomizer.previewSubtitle') }}
                        </p>
                    </div>

                    <v-btn
                        icon
                        variant="text"
                        @click="isModalOpen = false"
                    >
                        <X/>
                    </v-btn>
                </div>

                <div class="preview-body">

                <div class="preview-image-wrapper">
                    <img
                    :src="previewImageUrl"
                    class="preview-image"
                    />
                </div>

                <div class="preview-sidebar">

                    <div class="preview-section">
                    <label class="preview-label">
                        {{ t('ticketCustomizer.descriptionLabel') }}
                    </label>

                    <v-textarea
                        v-model="ticketDescription"
                        :placeholder="t('ticketCustomizer.descriptionPlaceholder')"
                        variant="outlined"
                        rows="10"
                        auto-grow
                        class="preview-input"
                    />
                    </div>

                    

                    <div class="preview-actions-asymmetric justify-end">
                        <div class="right-group">
                            <v-btn variant="outlined" class="share-btn-style" @click="triggerShare">
                                {{ t('ticketCustomizer.share') }}
                            </v-btn>
                            <v-btn class="save-btn-style" :loading="isSaving" @click="confirmSave">
                                {{ t('ticketCustomizer.saveDesign') }}
                            </v-btn>
                        </div>
                    </div>

                </div>
                </div>

            </v-card>
            </v-dialog>
        </main>
    </v-container>
    <FooterView/>
</v-app>    
</template>



<style scoped>
.customizer-layout {
    display: grid;
    grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
    gap: 32px;
    padding: 32px 32px 0 12px;
    background: var(--bg-color);
    color: #fff;
    min-height: 100vh;
    width: 100%;
    overflow: hidden;
}

.sidebar-toggle-fab {
    display: none;
}

.sidebar-backdrop {
    display: none;
}

.sidebar-topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.sidebar-close-btn {
    display: none;
}

.shape-selector h3 {
    margin-bottom: 20px;
}

.shape-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.shape-grid button {
    padding: 12px;
    background: #1a1a1a;
    border: 1px solid #333;
    color: white;
    cursor: pointer;
    border-radius: 8px;
}

.shape-grid button.active {
    border-color: #e53935;
    background: #222;
}

.canvas-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
}

.ticket-container {
    position: relative;
    overflow: hidden;
    aspect-ratio: 1280 / 854;
    height: auto;
    border-radius: 12px;
    margin-top: 100px;
    background: var(--bg-color);
    max-width: 100%;
    width: 100%;
}

.backdrop-layer {
    position: absolute;
    inset: 0;
    z-index: 1;
    background-size: cover;
    background-position: center;
    pointer-events: none;
}

.user-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
}

.mask-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 5;
}

.text-overlay {
    position: absolute;
    bottom: 20px;
    left: 20px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.controls-panel {
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.share-btn {
    margin-top: 50px;
    padding: 15px;
    background: #e53935;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    display: block;
    margin-left: auto;
}

.tabs {
    display: flex;
    gap: 5px;
    margin-bottom: 20px;
    border-bottom: 1px solid #333;
}

.tabs button {
    flex: 1;
    padding: 10px;
    background: transparent;
    color: #888;
    border: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
}

.tabs button.active {
    color: var(--text-color);
    border-bottom-color: #e53935;
}

.ai-design-btn {
    width: 100%;
    min-height: 46px;
    margin: 0 0 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 1px solid rgba(229, 57, 53, 0.65);
    border-radius: 8px;
    background: linear-gradient(135deg, #e53935, #527aff);
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease;
}

.ai-design-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.06);
}

.ai-design-btn:disabled {
    cursor: not-allowed;
    opacity: 0.62;
}

.ai-design-notice {
    margin: -10px 0 18px;
    padding: 8px 10px;
    border: 1px solid rgba(245, 158, 11, 0.35);
    border-radius: 8px;
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    font-size: 0.78rem;
    line-height: 1.35;
}

:deep(.ai-prompt-dialog) {
    border-radius: 20px;
    overflow: hidden;
}

.ai-prompt-card {
    background: var(--card-bg);
    color: var(--text-color);
    border: var(--border-card);
    border-radius: 20px;
    overflow: hidden;
}

.ai-prompt-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 24px;
    border-bottom: 1px solid var(--dropdown-divider);
    background: var(--header-bg);
}

.ai-prompt-title {
    margin: 0 0 6px;
    color: var(--text-color);
    font-size: 1.35rem;
    font-weight: 800;
}

.ai-prompt-subtitle {
    margin: 0;
    color: var(--muted-text-color);
    font-size: 0.92rem;
}

.ai-prompt-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 24px;
}

.ai-prompt-body label {
    color: var(--text-color);
    font-size: 0.88rem;
    font-weight: 700;
}

.ai-prompt-body textarea {
    width: 100%;
    min-height: 132px;
    max-height: 240px;
    resize: vertical;
    padding: 12px 14px;
    border: 1px solid #333;
    border-radius: 8px;
    background: var(--bg-color);
    color: var(--text-color);
    outline: none;
}

.ai-prompt-body textarea:focus {
    border-color: #527aff;
    box-shadow: 0 0 0 3px rgba(82, 122, 255, 0.14);
}

.ai-prompt-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 0 24px 24px;
}

.sidebar-scrollable {
    overflow-y: auto;
    overflow-x: hidden;
    border-right: 1px solid #333;
    padding: 0 20px;
    min-width: 0;
}

.sidebar-scrollable::-webkit-scrollbar {
    width: 6px;
}

.sidebar-scrollable::-webkit-scrollbar-thumb {
    background:var(--scroll-bg);
    border-radius: 4px;
}

.control-group {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #222;
}

.grid-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.option-card {
    border: 2px solid #333;
    border-radius: 8px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.2s ease;
}

.option-card.active-bg {
    border: 2px solid var(--selected-border);
    transform: scale(0.95);
    box-shadow: 0 0 10px var(--selected-box-shadow);
}

.option-card img {
    width: 100%;
    height: 100%;
}

.text-overlay {
    position: absolute;
    bottom: 40px;
    color: white;
    z-index: 2;
    pointer-events: none;
}

.ticket-container {
    position: relative;
    overflow: hidden;
    height: 430px;
    border-radius: 12px;
}

.clipped-wrapper {
    position: absolute;
    inset: 0;
    z-index: 1;
    clip-path: url(#shapeClip);
}

.rotation-control {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
}

.rotation-wrapper {
    width: 100%;
    height: 100%;
    transform-origin: center center;
    display: flex;
    align-items: center;
    justify-content: center;
}

.control-node-wrapper {
    position: absolute;
}

.rotate-slider {
    flex: 1;
    cursor: pointer;
    accent-color: #527aff;
}

.reset-btn {
    background: #222;
    border: 1px solid #444;
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
}

.reset-btn:hover {
    background: #333;
}

.text-accent {
    color: #527aff;
    font-weight: bold;
}

.color-picker {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    background: none;
    padding: 0;
}

.color-picker::-webkit-color-swatch {
    border-radius: 50%;
    border: 2px solid #444;
}

.color-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    font-size: 12px;
}

.none-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-color);
    color: #888;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
}

.mode-toggle {
    display: flex;
    background: #1a1a1a;
    border-radius: 4px;
    overflow: hidden;
}

.mode-toggle button {
    border: none;
    padding: 4px 10px;
    cursor: pointer;
    background: transparent;
    color: #888;
}

.mode-toggle button.active {
    background: #527aff;
    color: #fff;
}

.editable-text {
    width: 100%;
    height: 100%;
    background: transparent;
    border: 1px dashed transparent;
    color: rgb(250, 12, 12);
    text-align: center;
    cursor: move;
    font-family: sans-serif;
    outline: none;
    pointer-events: auto;
}

:deep(.draggable-text-wrapper) {
    z-index: 30 !important;
    cursor: move;
}

:deep(.vdr) {
    z-index: 30 !important;
}

.canvas-content-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    background: inherit;
}

.mask-layer {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
}

.draggable-overlay-surface {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: auto;
}

.control-node-wrapper {
    position: absolute;
    cursor: move;
}

.control-node-wrapper:hover,
.control-node-wrapper:focus-within {
    border: 1px dashed #527aff;
    background: rgba(82, 122, 255, 0.05);
}

.transparent-drag-input {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.24);
    border: none;
    color: var(--ticket-text-color, #ffffff);
    text-align: center;
    outline: none;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-width: 0;
    border-radius: 6px;
    font-weight: 800;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.85);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 15px;
}

.info-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
    background: var(--bg-color);
    border: 1px solid #333;
    color: var(--text-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8rem;
}

.info-btn:hover {
    border-color: #527aff;
    background: var(--info-hover);
    color: #fff;
}

.settings-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    background: var(--bg-color);
    border-radius: 8px;
    margin-top: 15px;
}

.settings-panel label {
    font-size: 0.85rem;
    color: var(--text-color);
}

.settings-panel input,
.settings-panel select {
    background: var(--bg-color);
    border: 1px solid #333;
    color: var(--text-color);
    padding: 5px;
    border-radius: 4px;
}

.delete-btn {
    margin-top: 15px;
    width: 100%;
    padding: 10px;
    background: transparent;
    border: 1px solid #e53935;
    color: #e53935;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s;
}

.delete-btn:hover {
    background: #e53935;
    color: white;
}

.qr-node {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    padding: 5px;
    border-radius: 8px;
}

.barcode-node {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
}

.barcode-lines {
    width: 92%;
    height: 78%;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
}

.barcode-lines span {
    display: block;
    width: 2px;
    height: 100%;
    background: black;
}
:deep(.ticket-preview-dialog) {
    border-radius: 24px;
    overflow: hidden;
    backdrop-filter: blur(12px);
}

.preview-modal-card {
    background: var(--card-bg);
    color: var(--text-color);
    border: var(--border-card);
    border-radius: 24px;
    overflow: hidden;
    max-height: calc(100dvh - 32px);
    display: flex;
    flex-direction: column;
}

.preview-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 28px;
    border-bottom: 1px solid var(--dropdown-divider);
    background: var(--header-bg);
    backdrop-filter: blur(10px);
}

.preview-title {
    font-size: 1.6rem;
    font-weight: 700;
    margin-bottom: 6px;
    color: var(--text-color);
}

.preview-subtitle {
    color: var(--muted-text-color);
    font-size: 0.95rem;
    margin: 0;
}

.preview-image-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-image {
    display: block; 
    width: 100%;
    max-width: 560px;
    object-fit: fill;
}

.preview-sidebar {
    padding: 28px;
    border-left: 1px solid var(--dropdown-divider);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 24px;
    background: rgba(255,255,255,0.02);
}

.preview-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.preview-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-color);
}
:deep(.preview-input .v-field) {
    background: var(--bg-color);
    border-radius: 14px;
}

:deep(.preview-input textarea) {
    color: var(--text-color);
}

.preview-actions-asymmetric {
    display: flex;
    align-items: flex-end;
}

.right-group {
    display: flex;
    gap: 12px;
}

.cancel-btn { 
    color: #888; 
    text-transform: none; 
}

.share-btn-style { 
    border: 1px solid #333; 
    border-radius: 8px; 
}

.save-btn-style { 
    background: #527aff !important;
    color: white; 
    border-radius: 8px; 
    font-weight: bold;
}
.preview-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    align-items: start; 
    min-height: 500px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
}

@media (max-width: 900px) {
    .preview-modal-card {
        max-height: calc(100dvh - 20px);
    }

    .preview-body {
        grid-template-columns: 1fr;
        min-height: 0;
    }

    .preview-sidebar {
        border-left: none;
        border-top: 1px solid var(--dropdown-divider);
        padding: 20px;
        min-height: 0;
    }

    .preview-image {
        max-width: 100%;
    }

    .preview-header {
        padding: 18px 20px;
    }
}

@media (max-width: 1200px) {
    .customizer-layout {
        grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
        gap: 24px;
        padding: 24px 24px 0 10px;
    }

    .ticket-container {
        margin-top: 72px;
        max-width: 650px;
    }

    .sidebar-scrollable {
        padding: 0 16px;
    }
}

@media (max-width: 992px) {
    .customizer-layout {
        grid-template-columns: 1fr;
        height: 100vh;
        overflow: hidden;
        padding: 18px 18px 0;
        gap: 0;
    }

    .sidebar-scrollable {
        position: fixed;
        top: 0;
        left: 0;
        width: min(86vw, 360px);
        height: 100vh;
        background: var(--card-bg);
        border-right: 1px solid #333;
        padding: 0 18px 18px;
        max-height: 100vh;
        overflow-y: auto;
        z-index: 60;
        transform: translateX(-105%);
        transition: transform 0.28s ease;
        box-shadow: 18px 0 40px rgba(0, 0, 0, 0.28);
    }

    .sidebar-scrollable.is-open {
        transform: translateX(0);
    }

    .sidebar-topbar {
        position: sticky;
        top: 0;
        background: var(--card-bg);
        padding-top: 8px;
        padding-bottom: 12px;
        z-index: 1;
    }

    .sidebar-close-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid #333;
        border-radius: 10px;
        background: transparent;
        color: var(--text-color);
        cursor: pointer;
    }

    .canvas-area {
        padding-bottom: 24px;
        width: 100%;
    }

    .ticket-container {
        width: 100% !important;
        max-width: 100%;
        margin-top: 24px;
        aspect-ratio: 1280 / 854;
    }

    .share-btn {
        margin-top: 28px;
        margin-left: 0;
        width: 100%;
        max-width: 420px;
    }

    .sidebar-toggle-fab {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        top: 88px;
        left: 16px;
        width: 48px;
        height: 48px;
        border-radius: 999px;
        border: 1px solid var(--border-color);
        background: var(--card-bg);
        color: var(--text-color);
        z-index: 70;
        cursor: pointer;
    }

    .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 55;
    }

    .grid-options {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 600px) {
    .preview-modal-card {
        max-height: calc(100dvh - 12px);
        border-radius: 18px;
    }

    .customizer-layout {
        padding: 12px 12px 0;
    }

    .sidebar-scrollable {
        width: min(90vw, 340px);
        padding: 0 14px 14px;
    }

    .tabs {
        gap: 4px;
        margin-bottom: 14px;
        overflow-x: auto;
        scrollbar-width: none;
    }

    .tabs::-webkit-scrollbar {
        display: none;
    }

    .tabs button {
        flex: 0 0 auto;
        min-width: 92px;
        padding: 10px 12px;
    }

    .grid-options {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
    }

    .control-group {
        margin-bottom: 22px;
        padding-bottom: 16px;
    }

    .ticket-container {
        margin-top: 12px;
        border-radius: 10px;
        height: auto;
        aspect-ratio: 1280 / 854;
    }

    .canvas-area {
        align-items: stretch;
        padding-top: 50px;
    }

    .canvas-content-wrapper {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .mask-layer,
    .draggable-overlay-surface {
        min-width: 100%;
    }

    .share-btn {
        width: 100%;
        max-width: none;
        margin-top: 20px;
    }

    .preview-header {
        gap: 12px;
        align-items: flex-start;
        padding: 16px 16px;
    }

    .preview-actions-asymmetric {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }

    .right-group {
        width: 100%;
        flex-direction: column;
    }

    .right-group .v-btn {
        width: 100%;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }

    .settings-panel {
        padding: 12px;
    }

    .preview-sidebar {
        padding: 16px;
    }

    .preview-body {
        padding-bottom: 4px;
    }

    .sidebar-toggle-fab {
        top: 72px;
        left: 12px;
        width: 44px;
        height: 44px;
    }
}

</style>
