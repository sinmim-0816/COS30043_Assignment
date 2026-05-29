<script setup>
import { ref, onMounted, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as htmlToImage from 'html-to-image';
import VueDraggableResizable from 'vue-draggable-resizable-vue3';
import QrcodeVue from 'qrcode.vue';
import { ExternalLink,X } from 'lucide-vue-next';

// Import other hook and components
import { useMovies } from '@/hook/useMovies';
import { useTickets } from '@/hook/useTickets';
import { getGenreName } from '@/utils/genre';
import { useTicketDesign } from '@/hook/useTicketDesign';

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
const activeTicket = ref(null);

const shapes = [TicketShape1, TicketShape2, TicketShape3, TicketShape4, TicketShape5, TicketShape6,TicketShape7,TicketShape8,TicketShape9,TicketShape10,TicketShape11,TicketShape12,TicketShape13,TicketShape14];
const currentShape = shallowRef(TicketShape1);
const tabs = ['Shape', 'Picture', 'Components'];
const activeTab = ref('Shape');
const isModalOpen = ref(false);
const previewImageUrl = ref('');

const ticketRef = ref(null);
const movieTitle = ref('');
const width = ref(650);
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
const ticketDescription = ref('');

const openPreview = async () => {
    try {
        const dataUrl = await captureTicket();
        previewImageUrl.value = dataUrl;
        isModalOpen.value = true;
    } catch (err) {
        alert("Failed to generate preview. Please try again.");
        console.error(err);
    }
};

const confirmSave = async () => {
    if (!activeTicket.value) return;
    try {
        const imageToSave = previewImageUrl.value || await captureTicket();
        previewImageUrl.value = imageToSave;
        await save(activeTicket.value.bookingId, imageToSave, ticketDescription.value);
        alert('Design saved successfully!');
        isModalOpen.value = false;
    } catch (err) {
        console.error(err);
        alert('Failed to save design');
    }
};

const selectText = (el) => {
    selectedText.value = el;
};

const addInfo = (infoKey) => {
    const valueMap = {
        title: activeTicket.value.title,
        runtime: activeTicket.value.runtime,
        genres: activeTicket.value.genres
            .map(id => getGenreName(id))
            .join(', '),
        cinema: activeTicket.value.cinema,
        hall: activeTicket.value.hall,
        startTime: new Date(activeTicket.value.startTime).toLocaleString(),
        seats: activeTicket.value.seats.join(', '),
        id: activeTicket.value.id,
        qr: activeTicket.value.bookingId,
        barcode: activeTicket.value.bookingId,
    };

    textElements.value.push({
        id: Date.now(),
        text: valueMap[infoKey] || 'N/A',
        type: infoKey,
        x: 50, y: 50, w: 200, h: 40,
        fontSize: 16,
        rotation: 0,
        color: '#ffffff'
    });
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
    const movieId = route.params.movieId;
    activeTicket.value = await fetchTicketDetails(route.params.bookingId);

    if (movieId) {
        const movie = await fetchMovieDetails(movieId);
        if (movie) {
            movieTitle.value = movie.title;
            moviePosters.value = movie.posters || [movie.poster];
            const BASE_URL = 'https://image.tmdb.org/t/p/original';
            movieBackdrops.value = (movie.backdrops || []).map(path => `${BASE_URL}${path}`);
        }

    }
});

watch(currentShape, () => {
    movieBackdrop.value = "";
    bg.value.src = "";
    accentColor.value="#fefefe";
    accentColor2.value="";
    selectedBgIndex.value = -1;
})

const bg = ref({ x: 0, y: 0, width: 700, height: 430, src: '' });

const loadImageAsDataUrl = async (url) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;

    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`Failed to load image: ${response.status}`);

    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const selectBackground = async (url, index) => {
    selectedBgIndex.value = index;

    if (!url) {
        movieBackdrop.value = '';
        bg.value.src = '';
        return;
    }

    try {
        const safeUrl = await loadImageAsDataUrl(url);
        movieBackdrop.value = safeUrl;
        bg.value.src = safeUrl;
    } catch (error) {
        console.warn('Backdrop conversion failed, falling back to original URL:', error);
        movieBackdrop.value = url;
        bg.value.src = url;
    }
};

const captureTicket = async () => {
    try {
        const node = ticketRef.value;

        if (!node) {
            throw new Error('Ticket node missing');
        }
        const originalBg = node.style.background;

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
                title: 'My Ticket',
                text: ticketDescription.value || 'Check out my cinema ticket design!'
            });
        } else {
            const link = document.createElement('a');
            link.href = previewImageUrl.value;
            link.download = 'my-popflix-ticket.png';
            link.click();
        }
    } catch (err) {
        console.error(err);
        alert('Sharing not supported on this browser.');
    }
};

</script>

<template>
    <v-container fluid class="customizer-layout" width="100vw">
        <aside class="sidebar-scrollable">
            <h4 class="mt-5">Customize Ticket</h4>

            <div class="tabs">
                <button v-for="tab in tabs" :key="tab" :class="{ active: activeTab === tab }" @click="activeTab = tab">
                    {{ tab }}
                </button>
            </div>

            <section v-if="activeTab === 'Shape'" class="control-group">
                <div class="grid-options">
                    <div v-for="(s, i) in shapes" :key="i" class="option-card" @click="currentShape = s" :class="{ 'active-bg': currentShape === s }">
                        <img :src="`/shapes/shape-${i + 1}.png`" />
                    </div>
                </div>

            </section>

            <section v-if="activeTab === 'Picture'" class="control-group">
                <h5 class="mt-4">Select Background</h5>
                <div class="grid-options">
                    <div class="option-card" :class="{ 'active-bg': selectedBgIndex === -1 }"
                        @click="selectBackground('', -1)">
                        <div class="none-placeholder">None</div>
                    </div>

                    <div v-for="(p, i) in movieBackdrops" :key="i" class="option-card"
                        :class="{ 'active-bg': selectedBgIndex === i }" @click="selectBackground(p, i)">
                        <img :src="p" />
                    </div>
                </div>
                <label class="d-flex mt-5 justify-between">
                    <span class="me-2 text-color">Opacity</span>
                    <span class="text-accent">{{ (backdropOpacity * 100).toFixed(0) }}%</span>
                </label>
                <div class="rotation-control">
                    <input type="range" v-model="backdropOpacity" min="0" max="1" step="0.1" class="rotate-slider" />
                    <button class="reset-btn" @click="backdropOpacity = 1">Reset</button>
                </div>
                <label class="d-flex my-3 justify-between">
                    <span class="me-3 text-color">Color</span>
                    <div class="mode-toggle">
                        <button @click="colorMode = 'solid'" :class="{ active: colorMode === 'solid' }">Solid</button>
                        <button @click="colorMode = 'gradient'"
                            :class="{ active: colorMode === 'gradient' }">Gradient</button>
                    </div>
                </label>
                <div class="control-row">
                    <input type="color" v-model="accentColor" class="color-picker" />
                    <input v-if="colorMode === 'gradient'" type="color" v-model="accentColor2"
                        class="color-picker ms-2" />
                    <span class="text-accent ms-3">{{ colorMode === 'solid' ? accentColor : 'Gradient' }}</span>
                    <label v-if="colorMode === 'gradient'" class="d-flex mt-3 justify-between">
                        <span class="me-2 text-color">Gradient Angle</span>
                        <span class="text-accent">{{ gradientAngle }}°</span>
                    </label>
                    <div v-if="colorMode === 'gradient'" class="rotation-control">
                        <input type="range" v-model="gradientAngle" min="0" max="360" class="rotate-slider" />
                    </div>
                </div>

            </section>

            <section v-if="activeTab === 'Components'" class="control-group">
                <h5 class="mb-3">Add Info</h5>
                <div class="grid-options">
                    <button class="info-btn" @click="addInfo('title')">Title</button>
                    <button class="info-btn" @click="addInfo('runtime')">Runtime</button>
                    <button class="info-btn" @click="addInfo('genres')">Genres</button>
                    <button class="info-btn" @click="addInfo('cinema')">Cinema</button>
                    <button class="info-btn" @click="addInfo('hall')">Hall</button>
                    <button class="info-btn" @click="addInfo('startTime')">Date/Time</button>
                    <button class="info-btn" @click="addInfo('seats')">Seats</button>
                    <button class="info-btn" @click="addInfo('qr')">QR Code</button>
                    <button class="info-btn" @click="addInfo('barcode')">Barcode</button>
                </div>

                <div v-if="selectedText" class="settings-panel">
                    <label>Rotation: {{ selectedText.rotation }}°</label>
                    <input type="range" v-model.number="selectedText.rotation" min="0" max="360" />

                    <label>Font Size</label>
                    <input type="number" v-model.number="selectedText.fontSize" min="12" max="100" />

                    <label>Color</label>
                    <input type="color" v-model="selectedText.color" />

                    <label>Font Family</label>
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
                        Delete Selected Element
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
                    <p class="mt-6 loading-text">Loading Ticket...</p>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <div v-else ref="ticketRef" class="ticket-container" :style="{
                width: width + 'px',
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
                            <div class="rotation-wrapper" :style="{ transform: `rotate(${el.rotation || 0}deg)` }">
                                <div v-if="el.type === 'qr' && el.text !== 'N/A'" class="qr-node">
                                    <QrcodeVue :value="String(el.text)" :size="Math.max(40, Math.min(el.w, el.h) - 10)"
                                        level="H" />
                                </div>

                                <div v-else-if="el.type === 'barcode' && el.text !== 'N/A'" class="barcode-node">
                                    <div class="barcode-lines">
                                        <span v-for="n in 32" :key="n"></span>
                                    </div>
                                </div>

                                <div v-else-if="el.text === 'N/A'" class="error-node">Data Unavailable</div>

                                <input v-else v-model="el.text" class="transparent-drag-input" :style="{
                                    fontSize: el.fontSize + 'px',
                                    color: el.color,
                                    fontFamily: el.fontFamily || 'sans-serif'
                                }" />
                            </div>
                        </VueDraggableResizable>
                    </div>
                </div>
            </div>

            <button @click="openPreview" class="share-btn">
                <ExternalLink size="18" class="me-2 mb-1" />Preview & Save
            </button>

            <v-dialog
            v-model="isModalOpen"
            max-width="950"
            content-class="ticket-preview-dialog"
            >
            <v-card class="preview-modal-card">
                
                <div class="preview-header">
                <div>
                    <h5 class="preview-title">Ticket Preview</h5>
                    <p class="preview-subtitle">
                    Review your customized PopFlix ticket before saving or sharing.
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
                        Description
                    </label>

                    <v-textarea
                        v-model="ticketDescription"
                        placeholder="Describe your movie night..."
                        variant="outlined"
                        rows="10"
                        auto-grow
                        class="preview-input"
                    />
                    </div>

                    

                    <div class="preview-actions-asymmetric">
                        <v-btn variant="text" class="cancel-btn" @click="isModalOpen = false">
                            Cancel
                        </v-btn>

                        <div class="right-group">
                            <v-btn variant="outlined" class="share-btn-style" @click="triggerShare">
                                Share
                            </v-btn>
                            <v-btn class="save-btn-style" :loading="isSaving" @click="confirmSave">
                                Save Design
                            </v-btn>
                        </div>
                    </div>

                </div>
                </div>

            </v-card>
            </v-dialog>
        </main>
    </v-container>
</template>



<style scoped>
.customizer-layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 40px;
    padding: 40px 40px 0 10px;
    background: var(--bg-color);
    color: #fff;
    min-height: 100vh;
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
}

.ticket-container {
    position: relative;
    overflow: hidden;
    height: 60%;
    border-radius: 12px;
    margin-top: 100px;
    background: var(--bg-color);
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

.customizer-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    height: 100vh;
    overflow: hidden;
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

.sidebar-scrollable {
    overflow-y: auto;
    border-right: 1px solid #333;
    padding: 0 20px;
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
    background: transparent;
    border: none;
    color: transparent;
    text-align: center;
    outline: none;
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
    justify-content: space-between;
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
}

@media (max-width: 900px) {
    .preview-body {
        grid-template-columns: 1fr;
    }

    .preview-sidebar {
        border-left: none;
        border-top: 1px solid var(--dropdown-divider);
    }

    .preview-image {
        max-width: 100%;
    }
}

</style>
