<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { TresCanvas } from '@tresjs/core';
import { Html, OrbitControls } from '@tresjs/cientos';
import { SunMedium, MoonStar } from 'lucide-vue-next';

// Import other hook and components
import { LAYOUT_CONFIG } from '../utils/SeatLayout';

const props = defineProps({
  selectedSeat: { type: [String, Array], default: 'DOLBY-A-1' },
  selectedSeats: { type: Array, default: () => [] },
  experienceType: { type: String, default: 'DOLBY' },
  trailerUrl: { type: String, default: '' },
});

const isDarkTheme = ref(true);

const setThemeFromApp = () => {
  isDarkTheme.value = document.documentElement.classList.contains('dark');
};

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
};

const layout = computed(() => LAYOUT_CONFIG[props.experienceType] || LAYOUT_CONFIG.DOLBY);

const visualProfile = computed(() => {
  const profiles = {
    IMAX: { seatColor: '#294a8f', accent: '#5f9cff', width: 0.9, depth: 0.82, height: 0.34, rowGap: 1.28, screenGap: 8.8, screenScale: 1.18, eyeHeight: 1.28 },
    DOLBY: { seatColor: '#7b101c', accent: '#ff405c', width: 0.84, depth: 0.78, height: 0.32, rowGap: 1.16, screenGap: 7.6, screenScale: 1, eyeHeight: 1.22 },
    '4DX': { seatColor: '#3f256f', accent: '#b46cff', width: 0.95, depth: 0.9, height: 0.42, rowGap: 1.38, screenGap: 8.2, screenScale: 1.04, eyeHeight: 1.34 },
    LUXE: { seatColor: '#8c6b2e', accent: '#ffd166', width: 1.12, depth: 0.96, height: 0.38, rowGap: 1.52, screenGap: 9.2, screenScale: 0.96, eyeHeight: 1.28 },
    INDULGE: { seatColor: '#5f3f2f', accent: '#f0b27a', width: 1.28, depth: 1.12, height: 0.32, rowGap: 1.68, screenGap: 9.8, screenScale: 0.92, eyeHeight: 1.16 },
    BEANIE: { seatColor: '#2f7a68', accent: '#68ffd7', width: 1.18, depth: 1.05, height: 0.22, rowGap: 1.42, screenGap: 7.4, screenScale: 0.86, eyeHeight: 0.9 },
    JUNIOR: { seatColor: '#d84a78', accent: '#ffc2d6', width: 0.74, depth: 0.68, height: 0.26, rowGap: 1.02, screenGap: 6.4, screenScale: 0.82, eyeHeight: 0.98 },
  };

  return profiles[props.experienceType] || profiles.DOLBY;
});

const parseSeatId = (seatId) => {
  if (!seatId) return null;

  const parts = String(seatId).split('-');
  const row = parts.length >= 3 ? parts[parts.length - 2] : parts[0] || 'A';
  const col = Number(parts.length >= 3 ? parts[parts.length - 1] : parts[1] || 1);

  return {
    row: row.toUpperCase(),
    col: Number.isFinite(col) ? col : 1,
  };
};

const selectedSeatList = computed(() => {
  const source = Array.isArray(props.selectedSeats) && props.selectedSeats.length > 0
    ? props.selectedSeats
    : (Array.isArray(props.selectedSeat) ? props.selectedSeat : [props.selectedSeat]);

  return source
    .map(parseSeatId)
    .filter(Boolean);
});

const selectedSeatIds = computed(() => new Set(
  selectedSeatList.value.map((seat) => `${props.experienceType}-${seat.row}-${seat.col}`)
));

const activeSeatId = ref('');

const aisleOffsetForColumn = (col) => {
  return layout.value.aisleAfter
    .filter((aisleCol) => col > aisleCol)
    .length * 0.72;
};

const rowElevation = (rowIndex) => {
  const flatRows = Math.min(3, layout.value.rows);
  const stepIndex = Math.max(0, rowIndex - (flatRows - 1));
  return stepIndex * 0.22;
};

const seatPosition = (rowIndex, col) => {
  const profile = visualProfile.value;
  const totalWidth = layout.value.cols * profile.width + (layout.value.aisleAfter.length * 0.72);
  const x = (col - 1) * profile.width + aisleOffsetForColumn(col) - totalWidth / 2 + profile.width / 2;
  const z = rowIndex * profile.rowGap - ((layout.value.rows - 1) * profile.rowGap) / 2;
  const y = 0.35 + rowElevation(rowIndex);

  return [x, y, z];
};

const rows = computed(() => Array.from({ length: layout.value.rows }, (_, index) => ({
  label: String.fromCharCode(65 + index),
  index,
})));

const seats = computed(() => rows.value.flatMap((row) =>
  Array.from({ length: layout.value.cols }, (_, index) => {
    const col = index + 1;
    const id = `${props.experienceType}-${row.label}-${col}`;
    const isSelected = selectedSeatIds.value.has(id);

    return {
      id,
      row: row.label,
      col,
      isSelected,
      position: seatPosition(row.index, col),
    };
  })
));

watch(
  selectedSeatList,
  (seatList) => {
    const firstSelectedSeat = seatList[0];
    if (!firstSelectedSeat) {
      activeSeatId.value = '';
      return;
    }

    const firstSelectedId = `${props.experienceType}-${firstSelectedSeat.row}-${firstSelectedSeat.col}`;
    if (!activeSeatId.value || !selectedSeatIds.value.has(activeSeatId.value)) {
      activeSeatId.value = firstSelectedId;
    }
  },
  { immediate: true }
);

const activeSeat = computed(() => {
  if (activeSeatId.value) {
    const focusedSeat = seats.value.find((seat) => seat.id === activeSeatId.value && seat.isSelected);
    if (focusedSeat) return focusedSeat;
  }

  return seats.value.find((seat) => seat.isSelected) || seats.value[0] || null;
});

const focusSeat = (seatId) => {
  if (selectedSeatIds.value.has(seatId)) {
    activeSeatId.value = seatId;
  }
};

const selectedCoords = computed(() => {
  if (!activeSeat.value) return seatPosition(0, 1);
  return activeSeat.value.position;
});

const cameraTarget = computed(() => [
  screenPosition.value[0],
  screenPosition.value[1],
  screenPosition.value[2],
]);

const cameraPosition = computed(() => {
  return [
    selectedCoords.value[0],
    selectedCoords.value[1] + visualProfile.value.eyeHeight,
    selectedCoords.value[2] + visualProfile.value.depth * 0.38,
  ];
});

const selectedSeatLabel = computed(() => {
  if (selectedSeatList.value.length === 0) return 'A1';
  if (selectedSeatList.value.length === 1) {
    return `${selectedSeatList.value[0].row}${selectedSeatList.value[0].col}`;
  }

  if (activeSeat.value) {
    return `Viewing ${activeSeat.value.row}${activeSeat.value.col}`;
  }

  return `${selectedSeatList.value.length} seats selected`;
});

const frontRowZ = computed(() => -((layout.value.rows - 1) * visualProfile.value.rowGap) / 2);
const screenPosition = computed(() => [0, 4.35, frontRowZ.value - visualProfile.value.screenGap]);
const floorDepth = computed(() => layout.value.rows * visualProfile.value.rowGap + visualProfile.value.screenGap + 3.6);
const floorWidth = computed(() => layout.value.cols * visualProfile.value.width + layout.value.aisleAfter.length * 0.72 + 3);
const screenWidth = computed(() => (floorWidth.value - 1.4) * visualProfile.value.screenScale);
const screenHeight = computed(() => 2.05 * visualProfile.value.screenScale);
const trailerWidth = computed(() => Math.round(760 * visualProfile.value.screenScale));

const trailerKey = computed(() => {
  if (!props.trailerUrl) return '';
  const match = props.trailerUrl.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#/]+)/);
  return match ? match[1] : props.trailerUrl;
});

const trailerEmbedUrl = computed(() => {
  if (!trailerKey.value) return '';
  return `https://www.youtube.com/embed/${trailerKey.value}?autoplay=1&mute=1&rel=0&playsinline=1`;
});

const scenePalette = computed(() => {
  if (isDarkTheme.value) {
    return {
      shellBg: '#050508',
      fog: '#050508',
      text: '#ffffff',
      mutedText: '#aab1c2',
      badgeBg: 'rgba(5, 5, 8, 0.72)',
      badgeBorder: 'rgba(255, 255, 255, 0.12)',
      badgeText: '#ffffff',
      floor: '#090b10',
      riser: '#0d1018',
      screen: '#101827',
      screenGlow: '#6aa7ff',
      seatBack: '#151821',
      shellAccent: '#ced7ff',
      shellFront: '#050508',
    };
  }

  return {
    shellBg: '#faf7f2',
    fog: '#eef3ff',
    text: '#041435',
    mutedText: '#536277',
    badgeBg: 'rgba(255, 255, 255, 0.84)',
    badgeBorder: 'rgba(4, 20, 53, 0.12)',
    badgeText: '#041435',
    floor: '#edf2fb',
    riser: '#dfe7f5',
    screen: '#d7e4fb',
    screenGlow: '#4f7cff',
    seatBack: '#c9d4e7',
    shellAccent: '#1d4ed8',
    shellFront: '#fafcff',
  };
});

const shellStyle = computed(() => ({
  background: scenePalette.value.shellBg,
  color: scenePalette.value.text,
}));

const badgeStyle = computed(() => ({
  background: scenePalette.value.badgeBg,
  borderColor: scenePalette.value.badgeBorder,
  color: scenePalette.value.badgeText,
}));

onMounted(() => {
  setThemeFromApp();
});
</script>

<template>
  <div class="seat-preview-shell" :style="shellStyle">
    <div class="scene-badge">
      <span>{{ experienceType }} layout</span>
      <strong>{{ selectedSeatLabel }}</strong>
    </div>

    <div
      class="theme-badge"
      :style="badgeStyle"
      role="button"
      tabindex="0"
      :aria-label="isDarkTheme ? 'Switch to light mode preview' : 'Switch to dark mode preview'"
      @click="toggleTheme"
      @keydown.enter.prevent="toggleTheme"
      @keydown.space.prevent="toggleTheme"
    >
      <component :is="isDarkTheme ? MoonStar : SunMedium" :size="16" />
      <span>{{ isDarkTheme ? 'Dark mode' : 'Light mode' }}</span>
    </div>

    <TresCanvas :clear-color="scenePalette.shellFront" class="seat-preview-canvas">
      <TresPerspectiveCamera :position="cameraPosition" :look-at="cameraTarget" :fov="48" />
      <TresFog attach="fog" :color="scenePalette.fog" :near="18" :far="62" />

      <TresAmbientLight :intensity="isDarkTheme ? 0.7 : 1.2" :color="scenePalette.shellAccent" />
      <TresDirectionalLight :position="[4, 7, 3]" :intensity="isDarkTheme ? 2.1 : 1.4" />
      <TresPointLight :position="[selectedCoords[0], 3.2, selectedCoords[2]]" :intensity="isDarkTheme ? 130 : 95" :color="visualProfile.accent" :distance="8" />
      <TresPointLight :position="[0, 4, screenPosition[2] - 1]" :intensity="isDarkTheme ? 80 : 50" :color="scenePalette.screenGlow" :distance="18" />

      <TresMesh :position="[0, -0.04, 0]">
        <TresBoxGeometry :args="[floorWidth, 0.08, floorDepth]" />
        <TresMeshStandardMaterial :color="scenePalette.floor" :roughness="isDarkTheme ? 0.92 : 0.82" />
      </TresMesh>

      <TresMesh
        v-for="row in rows"
        :key="`${row.label}-riser`"
        :position="[0, rowElevation(row.index) / 2, seatPosition(row.index, 1)[2]]"
      >
        <TresBoxGeometry :args="[floorWidth - 1, Math.max(0.04, rowElevation(row.index)), visualProfile.rowGap * 0.86]" />
        <TresMeshStandardMaterial :color="scenePalette.riser" :roughness="isDarkTheme ? 0.9 : 0.84" />
      </TresMesh>

      <TresMesh :position="screenPosition">
        <TresBoxGeometry :args="[screenWidth, screenHeight, 0.08]" />
        <TresMeshStandardMaterial :color="scenePalette.screen" :emissive="scenePalette.screenGlow" :emissive-intensity="isDarkTheme ? 0.22 : 0.12" />
      </TresMesh>

      <Html
        :position="[screenPosition[0], screenPosition[1], screenPosition[2] + 0.07]"
        :transform="true"
        :distance-factor="7"
        :occlude="false"
      >
        <div class="trailer-screen-in-scene">
          <iframe
            v-if="trailerEmbedUrl"
            :style="{ width: `${trailerWidth}px` }"
            :src="trailerEmbedUrl"
            title="Selected movie trailer"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
          ></iframe>
          <div v-else class="trailer-placeholder">
            <span>Trailer unavailable</span>
          </div>
        </div>
      </Html>

      <TresMesh
        v-for="seat in seats"
        :key="seat.id"
        :position="seat.position"
        :class="['seat-mesh', { 'seat-mesh--selected': seat.isSelected, 'seat-mesh--active': seat.id === activeSeatId }]"
        :cursor="seat.isSelected ? 'pointer' : 'default'"
        @click="seat.isSelected && focusSeat(seat.id)"
      >
        <TresBoxGeometry :args="[visualProfile.width * 0.72, visualProfile.height, visualProfile.depth * 0.72]" />
        <TresMeshStandardMaterial
          :color="seat.isSelected ? visualProfile.accent : (isDarkTheme ? visualProfile.seatColor : '#dde6f5')"
          :emissive="seat.isSelected ? visualProfile.accent : '#000000'"
          :emissive-intensity="seat.id === activeSeatId ? 0.6 : (seat.isSelected ? 0.32 : (isDarkTheme ? 0 : 0.04))"
          :roughness="isDarkTheme ? 0.55 : 0.68"
        />
      </TresMesh>

      <TresMesh
        v-for="seat in seats"
        :key="`${seat.id}-back`"
        :position="[seat.position[0], seat.position[1] + visualProfile.height * 0.75, seat.position[2] + visualProfile.depth * 0.32]"
      >
        <TresBoxGeometry :args="[visualProfile.width * 0.72, visualProfile.height * 1.45, 0.14]" />
        <TresMeshStandardMaterial
          :color="seat.isSelected ? visualProfile.accent : (isDarkTheme ? scenePalette.seatBack : '#c6d2e4')"
          :emissive="seat.isSelected ? visualProfile.accent : '#000000'"
          :emissive-intensity="seat.id === activeSeatId ? 0.75 : (seat.isSelected ? 0.45 : (isDarkTheme ? 0 : 0.04))"
          :roughness="isDarkTheme ? 0.5 : 0.72"
        />
      </TresMesh>

      <TresMesh
        v-for="seat in seats.filter((item) => item.isSelected)"
        :key="`${seat.id}-marker`"
        :position="[seat.position[0], seat.position[1] + 1.05, seat.position[2]]"
      >
        <TresTorusGeometry :args="[0.22, 0.02, 10, 28]" />
        <TresMeshStandardMaterial :color="visualProfile.accent" :emissive="visualProfile.accent" :emissive-intensity="0.95" />
      </TresMesh>

      <TresMesh :position="[selectedCoords[0], selectedCoords[1] + 0.72, selectedCoords[2]]">
        <TresCylinderGeometry :args="[0.035, 0.035, 0.95, 16]" />
        <TresMeshStandardMaterial :color="visualProfile.accent" :emissive="visualProfile.accent" :emissive-intensity="0.75" />
      </TresMesh>

      <TresMesh :position="[selectedCoords[0], selectedCoords[1] + 0.08, selectedCoords[2]]" :rotation="[Math.PI / 2, 0, 0]">
        <TresTorusGeometry :args="[0.46, 0.025, 10, 36]" />
        <TresMeshStandardMaterial :color="visualProfile.accent" :emissive="visualProfile.accent" :emissive-intensity="0.85" />
      </TresMesh>

      <OrbitControls
        :enable-damping="false"
        :auto-rotate="false"
        :rotate-speed="0.55"
        :min-distance="0.5"
        :max-distance="Math.max(8, floorDepth)"
        :target="cameraTarget"
      />
    </TresCanvas>
  </div>
</template>

<style scoped>
.seat-preview-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 70vh;
  overflow: hidden;
}

.seat-preview-canvas {
  width: 100%;
  height: 100%;
}

.scene-badge {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(5, 5, 8, 0.72);
  backdrop-filter: blur(12px);
  color: #ffffff;
}

.scene-badge span {
  color: #aab1c2;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0;
}

.scene-badge strong {
  color: #ffffff;
  font-size: 1rem;
}

.theme-badge {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid;
  border-radius: 10px;
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
  pointer-events: auto;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.theme-badge span {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.theme-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.2);
}

.trailer-screen-in-scene {
  width: 760px;
  aspect-ratio: 16 / 5.7;
  overflow: hidden;
  border: 1px solid rgba(164, 197, 255, 0.45);
  border-radius: 6px;
  background: #080c14;
  box-shadow: 0 0 28px rgba(106, 167, 255, 0.26);
}

.trailer-screen-in-scene iframe {
  max-width: 100%;
  height: 100%;
  border: 0;
}

.trailer-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #aab1c2;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0;
}

@media (max-width: 800px) {
  .trailer-screen-in-scene {
    width: 520px;
  }

  .theme-badge {
    top: 12px;
    right: 12px;
  }
}
</style>

<!-- TODO: Handle multiple seats selected -->
