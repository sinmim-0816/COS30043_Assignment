<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import {SquarePen, MapPin, ClockFading, Ticket, Star, Mail, Phone, Users, Lock, XCircle, Plus, Camera, Eye, EyeOff, Check, CheckCircle, Info, Trash2, Award} from '@lucide/vue';

// Import other hook and component
import { useAuthStore } from '../stores/auth';
import { authService } from '../services/authService';
import { formatMonthYear } from '../utils/formatDateTime';
import { GENRE_IDS, getGenreName } from '../utils/genre';
import { resolveBackendAssetPath } from '../utils/FormatPicture';
import { useTicketDesign } from '../hook/useTicketDesign';
import { formatTicketDate } from '../utils/formatDateTime';
import { useReviews } from '../hook/useReviews';
import {
  applyFontSizePreference,
  readStoredFontSize,
} from '../utils/appPreferences';
import { useAppI18n } from '../utils/i18n';
import FooterView from '@/components/FooterView.vue';

const activeTab = ref('profile');
const route = useRoute();
const isEditing = ref(false);
const isPasswordModalOpen = ref(false);
const avatarLoadError = ref(false)
const authStore = useAuthStore();
const showAuthBadge = ref(false);
const authMessage = ref('');
const isSuccess = ref(false);
const currentUser = computed(() => authStore.user || {});
const selectedGenre=ref('');
const avatarInput = ref(null);
const originalUser = ref(null);
const selectedAvatarFile = ref(null);
const isTypingPassword = ref(false);
const { fetchAllByUser, isLoading: isTicketsLoading } = useTicketDesign();
const { reviews, isLoading, error, fetchUserReviews, removeReview } = useReviews();
const userTicketDesigns = ref([]);
const tabViewportRef = ref(null);
const ticketDesignSectionRef = ref(null);
const reviewsSectionRef = ref(null);
const rewardsSectionRef = ref(null);
const isDarkTheme = ref(false);
const themeObserver = ref(null);
const selectedFontSize = ref(readStoredFontSize());
const { locale, t, setLocale, getLocaleLabel, supportedLocales } = useAppI18n();
const fontSizeOptions = [
  { value: 'small', label: 'Small', preview: 'Aa' },
  { value: 'medium', label: 'Medium', preview: 'Aa' },
  { value: 'large', label: 'Large', preview: 'Aa' },
];
const languageOptions = computed(() =>
  supportedLocales.map((value) => ({
    value,
    label: getLocaleLabel(value),
  }))
);

const cloneUserState = () => JSON.parse(JSON.stringify(user));

const revokeBlobAvatar = (avatar) => {
  if (typeof avatar === 'string' && avatar.startsWith('blob:')) {
    URL.revokeObjectURL(avatar);
  }
};

const syncThemeState = () => {
  isDarkTheme.value =
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark';
};

const setFontSize = (size) => {
  selectedFontSize.value = size;
};

const setLanguage = (value) => {
  setLocale(value);
};

const triggerAvatarUpload = () => {
  avatarInput.value?.click();
};

const handleAvatarChange = (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  revokeBlobAvatar(user.avatar);
  selectedAvatarFile.value = file;
  avatarLoadError.value = false;
  user.avatar = URL.createObjectURL(file);
};

const malaysiaStates = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Kuala Lumpur',
  'Labuan',
  'Putrajaya'
];


const cancelEdit = () => {
  if (originalUser.value) {
    revokeBlobAvatar(user.avatar);
    Object.assign(user, originalUser.value);
  }

  selectedGenre.value = '';
  selectedAvatarFile.value = null;
  avatarLoadError.value = false;
  isEditing.value = false;
};

const saveProfile = async () => {
  try {
    const userId = authStore.user?.id;

    if (!userId) {
      throw new Error('Missing user id for profile update.');
    }

    const formData = new FormData();
    formData.append('email', user.email || '');
    formData.append('phone', user.mobile || '');
    formData.append('gender', user.gender || '');
    formData.append('location', user.location || '');
    formData.append('bio', user.bio || '');
    formData.append('favouriteGenres', JSON.stringify(user.genres || []));

    if (selectedAvatarFile.value) {
      formData.append('avatar', selectedAvatarFile.value);
    }

    await authStore.updateProfile(userId, formData);
    await authStore.fetchProfile();
    selectedAvatarFile.value = null;
    originalUser.value = null;
    avatarLoadError.value = false;

    isEditing.value = false;
    
    // Show success toast
    authMessage.value = 'Profile updated successfully!';
    isSuccess.value = true;
    showAuthBadge.value = true;
  } catch (error) {
    console.error(error);
    // Show error toast
    authMessage.value = error?.message || 'Failed to update profile';
    isSuccess.value = false;
    showAuthBadge.value = true;
  }
};

const handleShare = async (ticket) => {
  try {
    const targetImageUrl = resolveBackendAssetPath(ticket.design_image);
    
    const response = await fetch(targetImageUrl);
    if (!response.ok) throw new Error('Failed to fetch ticket asset image');
    const blob = await response.blob();
    
    const file = new File([blob], `ticket-${ticket.booking_id || 'design'}.png`, { 
      type: 'image/png' 
    });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file]
      });
      console.log('Ticket image payload distributed successfully');
    } else {
      triggerLocalDownload(targetImageUrl, `ticket-${ticket.booking_id}.png`);
    }
  } catch (err) {
    console.error('Core sharing operation failed:', err);
    alert('Sharing directly is not fully supported on this app instance. Downloading instead.');
    if (ticket?.design_image) {
      triggerLocalDownload(resolveBackendAssetPath(ticket.design_image), `ticket-${ticket.booking_id}.png`);
    }
  }
};

const triggerLocalDownload = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank'; 
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); 
};

const genreOptions = computed(() =>
  GENRE_IDS.map((id) => ({
    id,
    name: getGenreName(id),
  }))
);

const renderGenreNames = (genreIds) => {
  const idsArray = parseGenres(genreIds);
  
  if (!idsArray || idsArray.length === 0) return t('profile.general');
  return idsArray
    .map((id) => getGenreName(Number(String(id).trim())))
    .join(', '); 
};

const availableGenres = computed(() =>
  genreOptions.value.filter(
    (genre) => !user.genres.includes(String(genre.id))
  )
);

onMounted(async () => {
  syncThemeState();
  themeObserver.value = new MutationObserver(() => {
    syncThemeState();
  });
  themeObserver.value.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  try {
    await authStore.fetchProfile();
    const ticketsData = await fetchAllByUser();
    userTicketDesigns.value = ticketsData || [];
    await applyRouteTab(route.query.tab);
  } catch (e) {
    console.error('Failed to fetch profile and ticket design on mount', e);
  }
});

onUnmounted(() => {
  themeObserver.value?.disconnect();
});

const handleDeleteRequest = async (reviewId) => {
  if (confirm('Are you sure you want to permanently delete this movie review?')) {
    try {
      await removeReview(reviewId);
      await authStore.fetchProfile();
    } catch (err) {
      alert('Could not remove review record right now. Please try again later.');
      console.log(err);
    }
  }
};

const showPass = reactive({
  curr: false,
  new: false
});

const user = reactive({
  id: null,
  name: '',
  avatar: null,
  email: '',
  mobile: '',
  gender: 'Undisclosed',
  location: '',
  bio: '',
  genres: [],
  tier: 'Bronze',
  annualSpend: 0,
  points: 0,
  joinedOn: null,
  ticketCount: 0,
  reviewCount:0,
});

const parseGenres = (genres) => {
  if (!genres) return [];

  if (Array.isArray(genres)) return genres;
  if (typeof genres === 'string') {
    return genres
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(g => g.trim())
      .filter(Boolean);
  }

  return [];
};


const syncLocalUserFromStore = () => {
  const u = currentUser.value || {};
  user.name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || '';
  user.id = u.id || null;
  user.avatar = u.profileImage ? resolveBackendAssetPath(u.profileImage) : null;
  avatarLoadError.value = false;
  user.email = u.email || '';
  user.mobile = u.phone || '';
  user.gender = u.gender || 'Undisclosed';
  user.location = u.location || '';
  user.bio = u.bio || '';
  user.genres = parseGenres(u.favouriteGenres).map((g) => String(g));
  user.tier = u.tier || 'Bronze';
  user.annualSpend = Number(u.totalSpent ?? u.annualSpend ?? u.totalSpentThisYear ?? 0) || 0;
  user.points = Number(u.points ?? u.loyaltyPoints ?? 0) || 0;
  user.joinedOn = u.joinedOn || u.createdAt || null;
  user.ticketCount = Number(u.ticketCount || 0) || 0;
  user.reviewCount=u.reviewCount || 0;
};


watch(currentUser, syncLocalUserFromStore, { immediate: true });
watch(selectedFontSize, (newValue) => {
  applyFontSizePreference(newValue);
}, { immediate: true });
watch(
  () => route.fullPath,
  async () => {
    await applyRouteTab(route.query.tab);
  },
  { immediate: true },
);
watch(() => activeTab.value, (newTab) => {
  if (newTab === 'reviews' && currentUser.value?.id) {
    fetchUserReviews(currentUser.value.id);
  }
});

const userInitial = computed(() => {
  const name = user.name || '';
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
});

const security = reactive({
  currentPassword: '',
  newPassword: ''
});

const passwordErrors = reactive({
  currentPassword: '',
  newPassword: ''
});

const currentTier = computed(() => {
  const spent = Number(user.annualSpend) || 0;
  if (spent >= 2000) return 'Gold';
  if (spent >= 500) return 'Silver';
  return 'Bronze';
});

const currentTierLabel = computed(() => {
  return t(`profile.${currentTier.value.toLowerCase()}`);
});

const nextTierLabel = computed(() => {
  if (currentTier.value === 'Bronze') return t('profile.silver');
  if (currentTier.value === 'Silver') return t('profile.gold');
  return t('profile.gold');
});

const nextTierThreshold = computed(() => {
  if (currentTier.value === 'Bronze') return 500.00;
  if (currentTier.value === 'Silver') return 2000.00;
  return 0;
});

const progressToNextTier = computed(() => {
  if (nextTierThreshold.value === 0) return 100;
  return Math.min(100, (Number(user.annualSpend) / nextTierThreshold.value) * 100);
});

const tabs = computed(() => [
  { id: 'profile', label: t('profile.tabs.profile') },
  { id: 'ticket-design', label: t('profile.tabs.ticketDesign') },
  { id: 'reviews', label: t('profile.tabs.reviews') },
  { id: 'rewards', label: t('profile.tabs.rewards') }
]);

const normalizeTabQuery = (tabValue) => {
  if (!tabValue) return null;

  const normalized = String(tabValue).replace(/\+/g, ' ').trim().toLowerCase();
  if (normalized === 'profile') return 'profile';
  if (normalized === 'ticket design' || normalized === 'ticket-design') return 'ticket-design';
  if (normalized === 'reviews') return 'reviews';
  if (normalized === 'rewards') return 'rewards';

  return null;
};

const scrollTabSectionIntoView = async (tabName) => {
  await nextTick();

  const targetMap = {
    profile: tabViewportRef,
    'ticket-design': ticketDesignSectionRef,
    reviews: reviewsSectionRef,
    rewards: rewardsSectionRef,
  };

  const target = targetMap[tabName]?.value;
  if (target?.scrollIntoView) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const applyRouteTab = async (tabValue) => {
  const targetTab = normalizeTabQuery(tabValue) || 'profile';
  activeTab.value = targetTab;

  if (targetTab === 'reviews' && currentUser.value?.id) {
    fetchUserReviews(currentUser.value.id);
  }

  await scrollTabSectionIntoView(targetTab);
};

// State Actions
const toggleEditMode = () => {
  if (!isEditing.value) {
    originalUser.value = cloneUserState();
  }
  isEditing.value = !isEditing.value;
};

const openPasswordModal = () => {
  if (isEditing.value) {
    isPasswordModalOpen.value = true;
  }
};

const closePasswordModal = () => {
  isPasswordModalOpen.value = false;
  security.currentPassword = '';
  security.newPassword = '';
  showPass.curr = false;
  showPass.new = false;
  passwordErrors.currentPassword = '';
  passwordErrors.newPassword = '';
};

const submitPasswordMutation = async () => {
  // Clear previous errors
  passwordErrors.currentPassword = '';
  passwordErrors.newPassword = '';

  // Validate new password strength
  if (!isNewPassValid.value) {
    passwordErrors.newPassword = 'Password does not meet all requirements';
    return;
  }

  if (!security.currentPassword) {
    passwordErrors.currentPassword = 'Current password is required';
    return;
  }

  try {
    const userId = authStore.user?.id;
    if (!userId) {
      throw new Error('User ID not found');
    }

    await authService.changePassword(
      userId,
      security.currentPassword,
      security.newPassword
    );

    console.log('Password changed successfully');
    authMessage.value = 'Password changed successfully!';
    isSuccess.value = true;
    showAuthBadge.value = true;
    closePasswordModal();
  } catch (error) {
    console.error('Password change failed:', error);
    const errorMsg = error?.response?.data?.message || error?.message || 'Failed to change password';
    
    // Set error on appropriate field
    if (errorMsg.toLowerCase().includes('incorrect')) {
      passwordErrors.currentPassword = errorMsg;
    } else if (errorMsg.toLowerCase().includes('different')) {
      passwordErrors.newPassword = 'New password must be different from current password';
    } else {
      passwordErrors.currentPassword = errorMsg;
    }
  }
};

const addGenre = () => {
  if (
    selectedGenre.value &&
    !user.genres.includes(String(selectedGenre.value))
  ) {
    user.genres.push(String(selectedGenre.value));
  }

  selectedGenre.value = '';
};

const removeGenre = (index) => { user.genres.splice(index, 1); };

const passwordReqs = computed(() => ({
  length: security.newPassword.length >= 8,
  case: /[a-z]/.test(security.newPassword) && /[A-Z]/.test(security.newPassword),
  number: /\d/.test(security.newPassword),
  symbol: /[!@#$%^&*(),.?":{}|<>]/.test(security.newPassword)
}));

const isNewPassValid = computed(() => {
  return Object.values(passwordReqs.value).every(Boolean);
});

const passStrengthCount = computed(() => {
  return Object.values(passwordReqs.value).filter(Boolean).length;
});

const passStrengthWidth = computed(() => {
  return (passStrengthCount.value / 4) * 100 + '%';
});

const passStrengthColor = computed(() => {
  if (passStrengthCount.value <= 1) return '#ff4d4d';
  if (passStrengthCount.value <= 2) return '#ffa500';
  return '#4caf50';
});

const passStrengthText = computed(() => {
  if (passStrengthCount.value === 0) return '';
  if (passStrengthCount.value === 1) return 'Weak';
  if (passStrengthCount.value === 2) return 'Fair';
  if (passStrengthCount.value === 3) return 'Good';
  return 'Strong';
});

</script>

<template>
  <v-snackbar v-model="showAuthBadge" location="top" :timeout="5000" color="transparent" elevation="0" variant="flat"
        class="mt-4">
        <div class="d-flex justify-center w-100">
            <div class="premium-toast-badge d-flex align-center gap-2" :class="isSuccess ? 'success' : 'not-success'">

                <component :is="isSuccess ? CheckCircle : Info" size="20"
                    :class="isSuccess ? 'text-white' : 'text-red'" />

                <span class="badge-text">{{ authMessage }}</span>
            </div>
        </div>
    </v-snackbar>
    <v-app>
  <div :class="['profile-page-light', isDarkTheme ? 'theme-dark' : 'theme-light']">
    <header class="profile-hero-card">
      <div class="hero-left-cluster">
        <div class="avatar-container">
          <img 
            v-if="user.avatar && !avatarLoadError" 
            :src="user.avatar" 
            alt="Avatar" 
            class="avatar-img" 
            @error="avatarLoadError = true"
          />
          
          <div v-else class="avatar-placeholder">
            {{ userInitial }}
          </div>

          <div
            v-if="isEditing"
            class="avatar-overlay"
            @click="triggerAvatarUpload"
          >
            <Camera size="24" />
          </div>

          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="d-none"
            @change="handleAvatarChange"
          />
        </div>
        <div class="identity-meta">
          <div class="name-badge-row">
            <h1 class="user-display-name">{{ user.name }}</h1>
          </div>
          <p class="meta-subtext"><MapPin size="16" class="me-2"/>{{user.location || 'Set Location'}} &bull; <ClockFading size="16" class="me-1"/> Joined {{ formatMonthYear(user.joinedOn)}}</p>

          <div class="user-stats-counter-row ps-2">
            <div class="stats-counter-item">
              <span class="stats-count-number">{{ user.ticketCount }}</span>
              <span class="stats-count-label">{{ t('profile.tickets') }}</span>
            </div>
            
            <div class="stats-vertical-divider"></div>
            
            <div class="stats-counter-item">
              <span class="stats-count-number">{{ user.reviewCount }}</span>
              <span class="stats-count-label">{{ t('profile.reviews') }}</span>
            </div>

            <div class="stats-vertical-divider"></div>

            <div class="stats-counter-item">
              <span class="stats-count-number">{{ user.points }}</span>
              <span class="stats-count-label">{{ t('profile.points') }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="profile-action-buttons">
        <button
          v-if="!isEditing"
          @click="toggleEditMode"
          class="premium-cta-btn btn-edit"
        >
          <SquarePen size="16" class="me-2" />
          {{ t('profile.editProfile') }}
        </button>

        <button
          v-if="isEditing"
          @click="cancelEdit"
          class="premium-cta-btn btn-cancel"
          type="button"
        >
          {{ t('profile.cancel') }}
        </button>

        <button
          v-if="isEditing"
          @click="saveProfile"
          class="premium-cta-btn btn-save"
          type="button"
        >
          {{ t('profile.saveChanges') }}
        </button>
      </div>
    </header>

    <section class="membership-dashboard-grid light-theme-dashboard">
      <div class="gsc-luxury-card" :class="`tier-${currentTier.toLowerCase()}`">
        <div class="card-glow-overlay"></div>
        <div class="card-internal-layout">
          <div class="card-brand-row">
            <span class="brand-logo">{{ t('profile.membershipCard') }}<span class="accent-dot">.</span></span>
            <div class="chip-icon"></div>
          </div>
          
          <div class="card-holder-center">
            <p class="holder-label">{{ t('profile.memberAccount') }}:</p>
            <h2 class="holder-title">{{ user.name }}</h2>
          </div>

          <div class="card-footer-metrics">
            <div>
              <p class="metric-lbl">{{ t('profile.tierStatus') }}</p>
              <p class="metric-val VIP">{{ currentTierLabel }} {{ t('profile.member') }}</p>
            </div>
            <div class="text-right">
              <p class="metric-lbl">{{ t('profile.statusPeriod') }}</p>
              <p class="metric-val code">{{ t('profile.lifetime') }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="progression-glass-panel" :class="`tier-${currentTier.toLowerCase()}`">
        <div class="panel-header-row">
          <div class="tier-milestones">
            <span class="milestone active">{{ t('profile.bronze') }}</span>
            <span :class="['milestone', currentTier !== 'Bronze' ? 'active' : '']">{{ t('profile.silver') }}</span>
            <span :class="['milestone', currentTier === 'Gold' ? 'active' : '']">{{ t('profile.gold') }}</span>
          </div>
          <div class="spend-counter">
            RM {{ Number(user.annualSpend).toFixed(2) }} <span class="total-label">{{ t('profile.spent') }}</span>
          </div>
        </div>

        <div class="neon-progress-container">
          <div class="neon-track">
            <div class="neon-fill" :style="{ width: progressToNextTier + '%' }"></div>
          </div>
        </div>

        <div class="progression-footer-messages" v-if="currentTier !== 'Gold'">
          <p class="incentive-text">
            {{ t('profile.spendMoreToUnlock', {
              amount: `RM ${Number(nextTierThreshold.value - Number(user.annualSpend)).toFixed(2)}`,
              tier: nextTierLabel.value
            }) }}
          </p>
        </div>
        <div class="progression-footer-messages maxed" v-else>
          <p class="incentive-text maxed-text">
            {{ t('profile.maxTierMessage') }}
          </p>
        </div>
      </div>
    </section>

    <main class="dashboard-core">
      <div class="mb-6 d-flex mb-4">
        <div class="faq-toggle-pill">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="faq-toggle-btn"
            :class="{ 'active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="tab-view-viewport" ref="tabViewportRef">
        <section v-if="activeTab === 'profile'" class="control-grid-3col">
          
          <div class="glass-control-card">
            <h3 class="panel-inner-title fs-6">{{ t('profile.personalDetails') }}</h3>
            
            <div class="interactive-input-node">
              <label class="node-label"><Mail size="16" class="me-2"/>{{ t('profile.emailAddress') }}</label>
              <div class="input-container">
                <div v-if="!isEditing" class="node-display-text px-4">
                  {{ user.email }}
                </div>

                <input 
                  v-else
                  type="email" 
                  v-model="user.email" 
                  class="node-field unlocked px-2" 
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div class="interactive-input-node">
              <label class="node-label"><Phone size="16" class="me-2"/>{{ t('profile.mobilePhone') }}</label>
              <div class="input-container">
                <div v-if="!isEditing" class="node-display-text px-4">
                  {{ user.mobile }}
                </div>
                <input v-else type="tel" v-model="user.mobile" :disabled="!isEditing" :class="['node-field', isEditing ? 'unlocked' : 'locked']" />
              </div>
            </div>

            <div class="interactive-input-node">
              <label class="node-label"><Users size="16" class="me-2"/>{{ t('profile.gender') }}</label>
              <div class="input-container">
                <div v-if="!isEditing" class="node-display-text px-4">
                  {{ user.gender }}
                </div>
                <select v-else v-model="user.gender" :disabled="!isEditing" :class="['node-select-field', isEditing ? 'unlocked' : 'locked']">
                  <option value="Male">{{ t('profile.genderMale') }}</option>
                  <option value="Female">{{ t('profile.genderFemale') }}</option>
                  <option value="Undisclosed">{{ t('profile.genderUndisclosed') }}</option>
                </select>
              </div>
            </div>

            <div class="interactive-input-node">
              <label class="node-label"><MapPin size="16" class="me-2"/>{{ t('profile.location') }}</label>
              <div class="input-container">
                <div v-if="!isEditing" class="node-display-text px-4">
                  {{ user.location || t('profile.updateYourLocation') }}
                </div>
                <v-autocomplete
                  v-else
                  v-model="user.location"
                  :items="malaysiaStates"
                  :label="t('profile.searchState')"
                  variant="solo"
                  density="comfortable"
                  class="node-field ms-3"
                />
                </div>
            </div>
          </div>

          <div class="glass-control-card">
            <h3 class="panel-inner-title fs-6">{{ t('profile.bio') }}</h3>
            
            <div class="interactive-input-node bio-node">
              <label class="node-label">{{ t('profile.biography') }}</label>
              <div v-if="!isEditing" class="node-display-text">
                  {{ user.bio || t('profile.updateYourBio') }}
                </div>
              <textarea v-else v-model="user.bio" :disabled="!isEditing" :class="['node-textarea-field px-2', isEditing ? 'unlocked' : 'locked']" rows="4"></textarea>
            </div>

            <div class="security-nested-vault">
              <h4 class="vault-sub-title">{{ t('profile.securityManagement') }}</h4>
              <p class="vault-description">{{ t('profile.securityDescription') }}</p>
              
              <button 
                type="button" 
                class="open-modal-trigger-btn"
                :disabled="!isEditing"
                @click="openPasswordModal"
              >
                <Lock size="16" class="me-2"/>{{ t('profile.changePassword') }}
              </button>
            </div>
          </div>

          <div class="glass-control-card">
            <h3 class="panel-inner-title fs-6">{{ t('profile.favouriteGenres') }}</h3>
            
            <div class="neon-pill-cloud">
              <span v-for="(genre, index) in user.genres" :key="genre" class="vector-pill">
                {{ getGenreName(Number(genre)) }}
                <button v-if="isEditing" @click="removeGenre(index)" class="pill-delete-cross"><XCircle size="16"/></button>
              </span>
            </div>

            <div v-if="isEditing" class="pill-injection-dock">
              <select
                v-model="selectedGenre"
                class="dock-input"
              >
                <option value="">{{ t('profile.selectGenre') }}</option>

                <option
                  v-for="genre in availableGenres"
                  :key="genre.id"
                  :value="String(genre.id)"
                >
                  {{ genre.name }}
                </option>
              </select>

              <button
                @click="addGenre"
                class="dock-action-btn"
                :disabled="!selectedGenre"
              >
                <Plus size="16"/>
              </button>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'profile'" class="display-settings-shell">
          <div class="glass-control-card display-settings-card">
            <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-4">
              <div>
                <h3 class="panel-inner-title fs-6 mb-1">{{ t('profile.displaySettings') }}</h3>
                <p class="display-settings-description mb-0">
                  {{ t('profile.textSizeDescription') }}
                </p>
              </div>
            </div>

            <div class="font-size-option-grid">
              <button
                v-for="option in fontSizeOptions"
                :key="option.value"
                type="button"
                class="font-size-option"
                :class="{ active: selectedFontSize === option.value }"
                @click="setFontSize(option.value)"
              >
                <div>
                  <p class="font-size-option-label">{{ option.label }}</p>
                  <p class="font-size-option-preview">{{ option.preview }}</p>
                </div>
                <Check v-if="selectedFontSize === option.value" size="18" />
              </button>
            </div>

            <div class="mt-5">
              <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-4">
                <div>
                  <h3 class="panel-inner-title fs-6 mb-1">{{ t('profile.appLanguage') }}</h3>
                  <p class="display-settings-description mb-0">
                    {{ t('profile.languageDescription') }}
                  </p>
                </div>
              </div>

              <div class="font-size-option-grid">
                <button
                  v-for="option in languageOptions"
                  :key="option.value"
                  type="button"
                  class="font-size-option"
                  :class="{ active: locale === option.value }"
                  @click="setLanguage(option.value)"
                >
                  <div>
                    <p class="font-size-option-label">{{ option.label }}</p>
                    <p class="font-size-option-preview">{{ option.value.toUpperCase() }}</p>
                  </div>
                  <Check v-if="locale === option.value" size="18" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'ticket-design'" class="gallery-panel animate-fade" ref="ticketDesignSectionRef">
          <div v-if="isTicketsLoading" class="loading-placeholder">
            <p>{{ t('profile.loadingTicketDesigns') }}</p>
          </div>

          <div v-else-if="!userTicketDesigns.length" class="empty-placeholder">
            <Ticket class="icon-empty" />
            <p>{{ t('profile.noTicketDesigns') }}</p>
          </div>

          <div v-else class="ticket-grid">
            <div 
              v-for="ticket in userTicketDesigns" 
              :key="ticket.id" 
              class="ticket-design-card"
            >

              <div class="ticket-poster-container">
                <img 
                  :src="resolveBackendAssetPath(ticket.design_image)" 
                  :alt="ticket.booking?.showtime?.movie?.title || t('profile.ticketArt')"
                />

                <button 
                  class="ticket-share-floating-btn" 
                  @click.stop="handleShare(ticket)"
                  title="Share Ticket Design"
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </button>
            </div>

              <div class="ticket-info">
                <div class="ticket-grid-info">
                  <h3 class="fs-6 text-black">{{ ticket.booking?.showtime?.movie?.title || t('profile.customMasterpiece') }}</h3>
                </div>

                <div>
                  <small>{{ t('profile.thoughts') }}</small>
                  <p class="ticket-description-text">
                    {{ ticket.description || t('profile.noTicketNotes') }}
                  </p>
                  
                </div>
                
              </div>

              <div class="ticket-divider">
                <div class="notch"></div>
                <div class="dash"></div>
                <div class="notch"></div>
              </div>

              <div class="ticket-footer">

                <div>
                  <small>Booking ID</small>
                  <p>#{{ ticket.booking_id }}</p>
                </div>
                <p >{{ formatTicketDate( ticket.created_at) }}</p>
              </div>
              
            </div>
          </div>
        </section>

       <section v-if="activeTab === 'reviews'" class="reviews-panel animate-fade" ref="reviewsSectionRef">
          <div v-if="isLoading" class="d-flex justify-center align-center py-10">
            <v-progress-circular indeterminate color="#ff5252" size="40" />
          </div>

          <div v-else-if="error" class="text-center py-6 text-danger">
            <p>{{ error }}</p>
          </div>

          <div v-else-if="!reviews || reviews.length === 0" class="text-center py-10 opacity-60">
            <p>{{ t('profile.noReviewsYet') }}</p>
          </div>

          <div v-else class="review-stack">
            
            <div 
              v-for="review in reviews" 
              :key="review.id" 
              class="review-card-item-premium"
            >
              <div class="review-poster-thumbnail">
                <img 
                  v-if="review.booking?.showtime?.movie?.poster_path"
                  :src="`https://image.tmdb.org/t/p/w200${review.booking.showtime.movie.poster_path}`" 
                  class="thumbnail-img"
                  :alt="t('profile.reviewMovieAlt')" 
                />
              </div>

              <div class="review-content-main-flow">
                <div class="review-item-header-premium">
                  <div class="movie-meta-group">
                    <h3 class="reviewed-movie-title-premium">
                      {{ review.booking?.showtime?.movie?.title || t('profile.untitledReviewMovie') }}
                    </h3>
                    {{ console.log(review) }}
                    <div class="meta-sub-row">
                      <span class="genre-pill-badge">
                        {{ renderGenreNames(review.booking?.showtime?.movie?.genre_ids) }}
                      </span>
                      <span class="meta-separator-dot">•</span>
                      <span class="review-date-stamp">
                        <ClockFading size="16" class="me-2"/>
                        {{ formatTicketDate(review.createdAt || review.created_at) }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="rating-display-stars-wrapper">
                    <Star 
                      v-for="star in 5" 
                      :key="star" 
                      :size="14"
                      class="star-unit"
                      :class="{ 'filled': star <= (review.rating || 5) }"
                      :fill="star <= (review.rating || 5) ? '#ffb100' : 'transparent'"
                    />
                  </div>
                </div>

                <p class="review-body-text-premium">
                  {{ review.comment || review.body || t('profile.noReviewComment') }}
                </p>

                
              </div>

              <button 
                class="review-action-delete-btn" 
                @click="handleDeleteRequest(review.id)"
                :title="t('profile.removeReviewTitle')"
              >
                <Trash2/>
              </button>
            </div>
          </div>
        </section>
        <section v-if="activeTab === 'rewards'" class="rewards-panel animate-fade" ref="rewardsSectionRef">
          <div class="tier-cards-grid">
          
            <div class="tier-card border-bronze" :class="{ 'is-active': currentTier === 'Bronze' }">
              <div class="tier-card-header">
                <div class="tier-icon-badge bg-bronze-light">
                  <Award :size="22" class="color-bronze" />
                </div>
                <span v-if="currentTier === 'Bronze'" class="status-pill current-pill">{{ t('profile.current') }}</span>
              </div>

              <div class="tier-card-body">
                <h3 class="tier-title">Bronze</h3>
                <p class="tier-range">RM 0 – RM 499</p>
                <div class="tier-discount color-bronze">0% off</div>

                <ul class="tier-perks-list">
                  <li><Check :size="16" class="perk-check-icon" /> Early bird access</li>
                  <li><Check :size="16" class="perk-check-icon" /> Birthday free drink</li>
                  <li><Check :size="16" class="perk-check-icon" /> Member newsletter</li>
                </ul>
              </div>
            </div>

            <div 
              class="tier-card border-silver" 
              :class="{ 
                'is-active': currentTier === 'Silver', 
                'is-locked': currentTier === 'Bronze' 
              }"
            >
              <div class="tier-card-header">
                <div class="tier-icon-badge bg-silver-light">
                  <Award :size="22" class="color-silver" />
                </div>
                <span v-if="currentTier === 'Silver'" class="status-pill current-pill">{{ t('profile.current') }}</span>
                <Lock v-if="currentTier === 'Bronze'" :size="16" class="status-lock-icon" />
              </div>

              <div class="tier-card-body">
                <h3 class="tier-title">Silver</h3>
                <p class="tier-range">RM 500 – RM 1999</p>
                <div class="tier-discount color-silver">10% off</div>

                <ul class="tier-perks-list">
                  <li><Check :size="16" class="perk-check-icon" /> All Bronze perks</li>
                  <li><Check :size="16" class="perk-check-icon" /> 10% ticket discount</li>
                  <li><Check :size="16" class="perk-check-icon" /> Priority seat selection</li>
                  <li><Check :size="16" class="perk-check-icon" /> 1 free popcorn/month</li>
                </ul>
              </div>
            </div>

            <div 
              class="tier-card border-gold" 
              :class="{ 
                'is-active': currentTier === 'Gold', 
                'is-locked': currentTier === 'Bronze' || currentTier === 'Silver' 
              }"
            >
              <div class="tier-card-header">
                <div class="tier-icon-badge bg-gold-light">
                  <Award :size="22" class="color-gold" />
                </div>
                <span v-if="currentTier === 'Gold'" class="status-pill current-pill">{{ t('profile.current') }}</span>
                <Lock v-if="currentTier !== 'Gold'" :size="16" class="status-lock-icon" />
              </div>

              <div class="tier-card-body">
                <h3 class="tier-title">Gold</h3>
                <p class="tier-range">RM 2000+</p>
                <div class="tier-discount color-gold">20% off</div>

                <ul class="tier-perks-list">
                  <li><Check :size="16" class="perk-check-icon" /> All Silver perks</li>
                  <li><Check :size="16" class="perk-check-icon" /> 20% ticket discount</li>
                  <li><Check :size="16" class="perk-check-icon" /> LUXE lounge access</li>
                  <li><Check :size="16" class="perk-check-icon" /> Exclusive previews</li>
                  <li><Check :size="16" class="perk-check-icon" /> Free ticket on birthday</li>
                  <li><Check :size="16" class="perk-check-icon" /> Gold cinema lanyard</li>
                </ul>
              </div>
            </div>

          </div>
        </section>
      </div>
    </main>

    <div class="modal-backdrop-blur" v-if="isPasswordModalOpen" @click.self="closePasswordModal">
      <div class="security-modal-container">
        <div class="modal-header">
          <div>
            <h3 class="modal-main-title">{{ t('profile.changeAccountPassword') }}</h3>
            <p class="modal-subtitle">{{ t('profile.updateSecurityCredentials') }}</p>
          </div>
          <button class="modal-close-cross" @click="closePasswordModal">⨉</button>
        </div>

        <form @submit.prevent="submitPasswordMutation" class="modal-form-body">
          <div class="interactive-input-node">
            <label class="node-label">{{ t('profile.currentPassword') }}</label>
            <div class="input-container">
              <input 
                :type="showPass.curr ? 'text' : 'password'" 
                v-model="security.currentPassword" 
                placeholder="••••••••" 
                required
                @input="passwordErrors.currentPassword = ''"
                class="node-field unlocked" 
              />
              <button
                type="button"
                @click="showPass.curr = !showPass.curr"
                class="visibility-toggle-eye icon-btn"
              >
                <Eye v-if="showPass.curr" size="18" />
                <EyeOff v-else size="18" />
              </button>
            </div>
            <p v-if="passwordErrors.currentPassword" class="error-text">
              <Info size="16" class="me-2"/>{{ passwordErrors.currentPassword }}
            </p>
          </div>

          <div class="interactive-input-node">
            <label class="node-label">{{ t('profile.newPassword') }}</label>
            
            <div class="input-container">
              <input 
                :type="showPass.new ? 'text' : 'password'" 
                v-model="security.newPassword" 
                :placeholder="t('profile.enterNewPassword')" 
                required
                @focus="isTypingPassword=true"
                @blur="isTypingPassword=false"
                @input="passwordErrors.newPassword = ''"
                class="node-field unlocked" 
              />
              <button
                type="button"
                @click="showPass.new = !showPass.new"
                class="visibility-toggle-eye icon-btn"
              >
                <Eye v-if="showPass.new" size="18" />
                <EyeOff v-else size="18" />
              </button>
            </div>
            <p v-if="passwordErrors.newPassword" class="error-text">
              <Info size="16" class="me-2"/>{{ passwordErrors.newPassword }}
            </p>
            <v-expand-transition>
              <!-- Password Strength Bar -->
              <div v-if="isTypingPassword" class="strength-container">
                <div class="d-flex justify-end align-center mb-1">
                  <span class="text-caption font-weight-bold"
                    :style="{ color: passStrengthColor }">
                    {{ passStrengthText }}
                  </span>
                </div>

                <div class="strength-meter">
                  <div class="strength-bar"
                    :style="{
                      width: passStrengthWidth,
                      backgroundColor: passStrengthColor
                    }">
                  </div>
                </div>

                <!-- Requirements -->
                <ul class="requirements-list mt-2">
                  <li :class="{ valid: passwordReqs.length }">
                    <Check size="14" /> {{ t('profile.atLeast8Chars') }}
                  </li>
                  <li :class="{ valid: passwordReqs.case }">
                    <Check size="14" /> {{ t('profile.upperLowercase') }}
                  </li>
                  <li :class="{ valid: passwordReqs.number }">
                    <Check size="14" /> {{ t('profile.atLeastOneNumber') }}
                  </li>
                  <li :class="{ valid: passwordReqs.symbol }">
                    <Check size="14" /> {{ t('profile.atLeastOneSymbol') }}
                  </li>
                </ul>
              </div>
              </v-expand-transition>
            </div>
          

          <div class="modal-action-dock">
            <button type="button" class="modal-btn cancel-btn" @click="closePasswordModal">Cancel</button>
            <button type="submit" class="modal-btn dynamic-save-btn">Update Password</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <FooterView/>
</v-app>
</template>

<style scoped>
.profile-page-light {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
  min-height: 100vh;
}

.profile-action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-cancel {
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.btn-cancel:hover {
  background: #f8fafc;
  color: #0f172a;
}

.hero-left-cluster { 
  display: flex; 
  align-items: center; 
  gap: 24px; 
}

.avatar-container {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: #e2e8f0;
  padding: 2px;
  align-items: center;
  justify-content: center;
}

.avatar-img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  border-radius: 50%; 
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #ff5252;
  color: #ffffff;
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  user-select: none;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-container {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay svg {
  transition: transform 0.2s ease;
}

.avatar-overlay:hover svg {
  transform: scale(1.15);
}
.name-badge-row { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}
.user-display-name { 
  font-size: 1.4rem;
   font-weight: 700; 
   letter-spacing: -0.01em; 
   margin: 0; 
   color: #0f172a; 
  }

.mini-tier-pill {
  font-size: 0.85rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 30px;
}
.mini-tier-pill.bronze { background: #ffedd5; color: #c2410c; }
.mini-tier-pill.silver { background: #f1f5f9; color: #475569; }
.mini-tier-pill.gold { background: #fef9c3; color: #a16207; }

.meta-subtext { color: #64748b; margin: 4px 0 0 0; font-size: 0.9rem; }

.premium-cta-btn {
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid #cbd5e1;
}

.btn-edit { background: #ffffff; color: #334155; }
.btn-edit:hover { background: #f8fafc; border-color: #cbd5e1; }
.btn-save { background: #0f172a; color: #ffffff; border-color: #0f172a; }

.membership-dashboard-grid.light-theme-dashboard {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
  margin-bottom: 32px;
  background: #ffffff;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
}

.gsc-luxury-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 20px; 
  padding: 28px;
  min-height: 190px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.03), 
    0 10px 15px -3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6); 
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}

.gsc-luxury-card.tier-bronze {
  background: linear-gradient(135deg, #ffffff 0%, #fff7ed 50%, #ffedd5 100%);
  border: 1px solid rgba(251, 146, 60, 0.35);
  box-shadow: 
    0 10px 15px -3px rgba(251, 146, 60, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.gsc-luxury-card.tier-silver {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 
    0 10px 15px -3px rgba(148, 163, 184, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.gsc-luxury-card.tier-gold {
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 50%, #fef3c7 100%);
  border: 1px solid rgba(245, 158, 11, 0.35); 
  box-shadow: 
    0 10px 15px -3px rgba(245, 158, 11, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.gsc-luxury-card::before {
  content: "";
  position: absolute;
  top: -60px;
  right: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}

.gsc-luxury-card::after {
  content: "";
  position: absolute;
  bottom: -40px;
  left: -40px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: 0.15;
  filter: blur(20px);
  z-index: 1;
}

.tier-bronze::after {
  background: #ea580c;
}

.tier-silver::after {
  background: #64748b;
}

.tier-gold::after {
  background: #d97706;
}

.card-glow-overlay {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 60%);
  pointer-events: none;
}

.card-internal-layout { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; justify-content: space-between; gap: 20px;}
.card-brand-row { display: flex; justify-content: space-between; align-items: center; }
.brand-logo { 
  font-weight: 700; 
  font-size: 1.1rem;  
  color: #0f172a; 
}
.accent-dot { color: #4f46e5; }
.chip-icon { width: 36px; height: 24px; background: #cbd5e1; border-radius: 4px; border: 1px solid #94a3b8; }

.card-holder-center { margin-top: auto; }
.holder-label { font-size: 0.6rem; color: #64748b; letter-spacing: 0.1em; margin: 0 0 2px 0; font-weight: 600; }
.holder-title { font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.02em; }

.card-footer-metrics { display: flex; justify-content: space-between; align-items: flex-end; }
.metric-lbl { font-size: 0.6rem; color: #64748b; letter-spacing: 0.05em; margin: 0 0 2px 0; font-weight: 600; }
.metric-val { font-size: 0.9rem; font-weight: 700; margin: 0; }
.metric-val.VIP { color: #b45309; }
.metric-val.code { font-family: monospace; color: #475569; }

/* Trackers Panels Layout Elements */
.progression-glass-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.panel-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.tier-milestones { display: flex; gap: 16px; }

.milestone { 
  font-size: 0.85rem; 
  font-weight: 500; 
  color: #94a3b8; 
}

.milestone.active { color: var(--text-color); font-weight: 700; }

.spend-counter { font-size: 1.15rem; font-weight: 700; color: #0f172a; }
.total-label { font-size: 0.8rem; color: #64748b; font-weight: 400; }

.neon-progress-container { margin-bottom: 4px; }
.neon-track { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }

.neon-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(
    90deg,
    #facc15,
    #f97316, 
    #ef4444 
  );

  position: relative;
  overflow: hidden;
}

.neon-fill::after {
  content: "";
  position: absolute;
  top: 0;
  left: -60%;
  width: 60%;
  height: 100%;
  background: rgba(255, 255, 255, 0.35);
  transform: skewX(-25deg);
}

.progression-footer-messages { margin-top: 16px; }
.incentive-text { margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.6; }
.highlight { color: #0f172a; font-weight: 700; }
.maxed-text { color: #059669; font-weight: 600; }


.navigation-tab-item {
  background: transparent;
  border: none;
  color: #64748b;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.1s ease;
}
.selected-tab { background: #ffffff; color: #0f172a; }

.control-grid-3col { 
  display: grid; 
  grid-template-columns: 1fr 1.1fr 0.9fr; 
  gap: 24px; 
}
.glass-control-card { 
  background: #ffffff; 
  border: 1px solid #e2e8f0; 
  border-radius: 12px; 
  padding: 24px; 
}

.panel-inner-title { 
  font-weight: 700; 
  color: #64748b;  
  margin: 0 0 20px 0; 
}

.interactive-input-node {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.node-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  opacity: 0.6;
}
.prefer-label { margin-bottom: 12px; }

.input-container {
  min-height: 42px;
  display: flex;
  align-items: center;
  position: relative;
}

.node-field, .node-textarea-field, .node-select-field {
  width: 100%;
  box-sizing: border-box;
  font-size: 0.9rem;
  color: #0f172a;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 10px 12px;
  transition: all 0.15s ease;
}

.node-textarea-field { resize: none; font-family: inherit; }
.node-select-field { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 14px; padding-right: 32px; }

.locked { pointer-events: none; background: #f8fafc; border-color: transparent; color: #475569; padding-left: 0; }
.unlocked:focus { border-color: #0f172a; outline: none; }

.visibility-toggle-eye {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
.visibility-toggle-eye:hover { color: #0f172a; }

/* Security Account Section Operations */
.security-nested-vault {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #e2e8f0;
}
.vault-sub-title { font-size: 0.85rem; font-weight: 600; color: #0f172a; margin: 0 0 4px 0; }
.vault-description { font-size: 0.8rem; color: #64748b; margin: 0 0 12px 0; }

.open-modal-trigger-btn {
  width: 100%;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.open-modal-trigger-btn:hover:not(:disabled) { background: #e2e8f0; color: #0f172a; }
.open-modal-trigger-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.neon-pill-cloud { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 6px; 
  margin-bottom: 12px; 
}
.vector-pill {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 0.8rem;
  color: #334155;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pill-delete-cross { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.85rem; padding: 0; }
.pill-delete-cross:hover { color: #ef4444; }

.pill-injection-dock { display: flex; gap: 6px; }
.dock-input {
  /* neutral base for light theme */
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 10px;
  color: #0f172a;
  font-size: 0.8rem;
  flex-grow: 1;
  /* remove native arrow so we can use a themed arrow */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23334755' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 34px;
}
.dock-input:focus { outline: none; border-color: #0f172a; }

/* Ensure option list matches theme where supported */
.dock-input option { background: #ffffff; color: #0f172a; }
.dock-action-btn { 
  background: var(--movie-btn) !important; 
  color: white; 
  border: none; 
  padding: 0 12px; 
  border-radius: 6px; 
  cursor: pointer;
 }

/* COMBINED FLAT TICKET DESIGN PANEL STYLING */
.ticket-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
.ticket-card-ui { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.ticket-visual-stub { background-color: #f1f5f9; height: 110px; position: relative; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: #64748b; font-weight: 500; }
.stub-notch { position: absolute; left: -8px; top: calc(50% - 8px); width: 16px; height: 16px; border-radius: 50%; background-color: #f8fafc; border-right: 1px solid #e2e8f0; }
.ticket-preview-image-placeholder { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; color: #94a3b8; }
.ticket-meta-info { padding: 12px; }
.ticket-meta-info h4 { margin: 0 0 4px 0; font-size: 0.95rem; color: #0f172a; font-weight: 600; }
.ticket-meta-info p { margin: 0; font-size: 0.8rem; color: #64748b; }


.reviews-panel {
  width: 100%;
}

.review-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1000px;
  margin: 0 auto;
}

.review-card-item-premium {
  position: relative;
  display: flex;
  gap: 20px;
  background: var(--card-bg, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15);
  border-radius: 14px;
  padding: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-align: left;
}

.review-card-item-premium:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.review-poster-thumbnail {
  width: 72px;
  height: 88px;
  flex-shrink: 0;
  background: rgba(128, 128, 128, 0.05);
  border: 1px solid rgba(128, 128, 128, 0.15);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(128, 128, 128, 0.4);
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback-thumbnail-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.review-content-main-flow {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding-right: 40px; 
}

.review-item-header-premium {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.movie-meta-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reviewed-movie-title-premium {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-color, #1e293b);
  margin: 0;
  line-height: 1.2;
}

.meta-sub-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.genre-pill-badge {
  background: rgba(255, 82, 82, 0.08);
  color: #ff5252;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 82, 82, 0.15);
  font-size: 11px;
}

.meta-separator-dot {
  opacity: 0.3;
}

.review-date-stamp {
  display: inline-flex;
  align-items: center;
  opacity: 0.5;
  font-weight: 500;
}

.rating-display-stars-wrapper {
  display: flex;
  gap: 2px;
  font-size: 13px;
  color: rgba(128, 128, 128, 0.25); 
  user-select: none;
}

.star-unit.filled {
  color: #ffb100; 
}

.review-body-text-premium {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--text-color, #334155);
  opacity: 0.85;
  margin: 0 0 14px 0;
}

.review-card-footer-metrics {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color);
  opacity: 0.5;
  margin-top: auto; 
}

.review-action-delete-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid rgba(128, 128, 128, 0.2);
  color: rgba(128, 128, 128, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.review-action-delete-btn:hover {
  background: rgba(239, 68, 68, 0.06);
  border-color: #ef4444;
  color: #ef4444;
  transform: scale(1.02);
}

.review-action-delete-btn:active {
  transform: scale(0.96);
}

.animate-fade {
  animation: fadeIn 0.35s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-backdrop-blur {
  position: fixed;
  inset: 0;
  z-index: 999;
  background-color: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.security-modal-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  width: 100%;
  max-width: 440px;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.modal-main-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
.modal-subtitle { font-size: 0.8rem; color: #64748b; margin: 2px 0 0 0; }

.modal-close-cross {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.modal-close-cross:hover { color: #0f172a; }

.modal-form-body { display: flex; flex-direction: column; }

.strength-container {
  margin-top: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.03);
  border-radius: 8px;
}

.strength-meter {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
}

.strength-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.requirements-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.requirements-list li.valid {
  color: #059669;
}

.error-text {
  color: #dc2626;
  font-size: 0.85rem;
  margin-top: 6px;
  margin-bottom: 0;
  padding: 0;
}

.modal-action-dock {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.modal-btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.cancel-btn { background: #ffffff; color: #475569; border: 1px solid #cbd5e1; }
.cancel-btn:hover { background: #f8fafc; color: #0f172a; }

.dynamic-save-btn { 
  background: var(--movie-btn) !important; 
  color: #ffffff; 
}
.dynamic-save-btn:hover { background: #1e293b; }

.animate-fade { animation: fadeIn 0.15s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 1024px) {
  .membership-dashboard-grid.light-theme-dashboard { grid-template-columns: 1fr; }
  .control-grid-3col { grid-template-columns: 1fr; }
}

/* Refined dashboard refresh */
.profile-page-light {
  max-width: 1320px;
  padding: 28px 20px 44px;
}

.profile-page-light::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-size: 28px 28px;
}

.profile-hero-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: 28px;
  margin-bottom: 24px;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) auto;
  gap: 24px;
  align-items: center;
  margin-top:60px;
}

.profile-hero-card::after {
  content: '';
  position: absolute;
  inset: auto -10% -35% auto;
  width: 320px;
  height: 320px;
  pointer-events: none;
}

.profile-hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-left-cluster {
  gap: 20px;
  align-items: center;
}

.hero-bio-row {
  margin: 12px 0 0;
  max-width: 700px;
  color: rgba(226, 232, 240, 0.8);
  font-size: 0.95rem;
  line-height: 1.7;
}

.hero-right-cluster {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  z-index: 1;
}

.hero-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.hero-stat-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border-radius: 18px;
  padding: 14px 16px;
  color: #ffffff;
}

.hero-stat-label {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(226, 232, 240, 0.66);
  margin-bottom: 4px;
}

.hero-stat-card strong {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
}


.btn-edit {
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  border-color: rgba(255, 255, 255, 0.18);
}

.btn-save {
  background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
  color: #ffffff;
  border-color: transparent;
}

.membership-dashboard-grid.light-theme-dashboard {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
  background: transparent;
  padding: 0;
  border: none;
  box-shadow: none;
}

.membership-card {
  background: linear-gradient(145deg, #0f172a 0%, #111827 100%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  min-height: 220px;
}

.progression-glass-panel {
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(18px);
}

.dashboard-core {
  border-radius: 28px;
  padding: 24px;
}

.neon-segmented-tabs {
  background: rgba(226, 232, 240, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: inline-flex;
  padding: 4px;
  border-radius: 10px;
  gap: 2px;
  margin-bottom: 24px;
}

.navigation-tab-item {
  min-width: 110px;
}

.selected-tab {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.control-grid-3col {
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1fr);
  align-items: start;
}

.control-grid-3col > .glass-control-card:nth-child(1) {
  grid-column: span 2;
}

.control-grid-3col > .glass-control-card:nth-child(3) {
  grid-column: 1 / -1;
}

.glass-control-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
  border-radius: 20px;
}

.display-settings-shell {
  margin-top: 24px;
}

.display-settings-card {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
}

.display-settings-description {
  font-size: 0.85rem;
  color: #64748b;
}

.font-size-option-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.font-size-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  text-align: left;
}

.font-size-option:hover {
  transform: translateY(-1px);
}

.font-size-option.active {
  border-color: #ff5252;
}

.font-size-option-label {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.font-size-option-preview {
  margin: 2px 0 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.node-field,
.node-textarea-field,
.node-select-field,
.dock-input {
  background: #f8fafc;
  border-color: #dbe3ee;
}

.node-field:focus,
.node-textarea-field:focus,
.node-select-field:focus,
.dock-input:focus {
  border-color: #0f172a;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
}

.vector-pill {
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(15, 23, 42, 0.08);
}

.dock-action-btn {
  background: #0f172a;
}

.ticket-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.ticket-card-ui,
.review-card-item {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
}

.ticket-visual-stub {
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.92));
  color: #ffffff;
}

.review-rating {
  color: #e11d48;
}

.review-body-text,
.ticket-meta-info p {
  color: #475569;
}

.modal-backdrop-blur {
  background-color: rgba(15, 23, 42, 0.42);
}

.faq-toggle-pill {
  display: inline-flex;
  background: rgba(128, 128, 128, 0.05); 
  border: 1px solid rgba(128, 128, 128, 0.15); 
  border-radius: 50px;
  padding: 6px;
  gap: 4px;
}

.faq-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  opacity: 0.7;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.faq-toggle-btn:hover {
  opacity: 1;
  color: #ff5252;
}

.faq-toggle-btn.active {
  background-color: #ff5252b5;
  color: #ffffff !important;
  opacity: 1;
}

.security-modal-container {
  border-radius: 20px;
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.18);
}

.user-stats-counter-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 12px; 
}

.stats-counter-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stats-count-number {
  font-size: 1.75rem;
  font-weight: 600;
  color: #474747;
  line-height: 1.1;
  align-self: center;
}

.stats-count-label {
  font-size: 0.9rem;
  color: #8c8c8c;
  margin-top: 4px;
}

.stats-vertical-divider {
  width: 1px;
  height: 36px;
  background-color: #e0e0e0;
  align-self: center;
}

/* Container Ticket Grid Layout */
.ticket-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
  padding: 16px 0;
  width: 100%;
}

/* Master Ticket Wrapper */
.ticket-design-card {
  background: var(--card-bg, #ffffff);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  width: 100%;
  max-width: 300px;
  max-height:400px;
  margin: 0 auto;
  border: 1px solid rgba(128, 128, 128, 0.15);
}


.ticket-poster-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px; /* Optional: ensures matching crisp container edges */
}

/* Floating Share Button Core Styling */
.ticket-share-floating-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(144, 144, 144, 0.25);
  background: rgba(15, 23, 42, 0.436); 
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.ticket-share-floating-btn:hover {
  background: #ff5252; 
  border-color: #ff5252;
  color: #ffffff;
}

.ticket-full-image {
  width: 100%;
  object-fit: cover; 
  overflow: hidden;
}

/* 3. Ticket Operational Info Body */
.ticket-info {
  padding: 20px 24px;
  background: #ffffff;
}

.ticket-grid-info {
  gap: 16px;
  margin-bottom: 16px;
}

.ticket-info small {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #9ca3af;
  font-weight: 700;
  margin-bottom: 4px;
}

.ticket-info p {
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* Interactive Seat Chips */
.seat-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.seat-chip {
  background: #fff5f5;
  color: #c53030;
  border: 1px solid #feb2b2;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  font-family: monospace;
}

/* Custom Crew Notes */
.ticket-description-text {
  font-size: 13px !important;
  font-weight: 500 !important;
  color: #4b5563 !important;
  line-height: 1.4;
  font-style: italic;
}

/* 4. Perforation Concave Notch Divider */
.ticket-divider {
  height: 20px;
  background: #ffffff;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ticket-divider .dash {
  width: 100%;
  border-bottom: 1px dashed rgba(128, 128, 128, 0.3);
  position: absolute;
  left: 0;
  z-index: 1;
}

.ticket-divider .notch {
  width: 20px;
  height: 20px;
  background: var(--bg-color, #f3f4f6);
  border-radius: 50%;
  position: absolute;
  z-index: 2;
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.ticket-divider .notch:first-child {
  left: -10px;
}

.ticket-divider .notch:last-child {
  right: -10px;
}

.ticket-footer {
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px dashed rgba(128, 128, 128, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ticket-footer small {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
  font-weight: 700;
}

.ticket-footer p {
  font-size: 13px;
  font-weight: 700;
  font-family: monospace;
  color: #374151;
  margin: 0;
}

.loading-placeholder, .empty-placeholder {
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px;
  background: var(--card-bg, #ffffff);
  border-radius: 16px;
  border: 2px dashed rgba(128, 128, 128, 0.2);
  color: #6b7280;
}

.icon-empty {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

/* --- MEMBERSHIP REWARDS THEME HOUSING --- */

.rewards-panel {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.tier-progress-bar {
  background: rgba(128, 128, 128, 0.1);
  border-radius: 4px;
}

/* Grid Layout matching the 3-column setup */
.tier-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 16px;
}

/* Base Card Styles */
.tier-card {
  background: #fdfbf7; /* Very light warm premium background glow */
  border: 1px solid rgba(128, 128, 128, 0.12);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
}

/* Upper Header Alignment rules inside card boundaries */
.tier-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tier-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Status Pill Indicators styling */
.status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.current-pill {
  background: #f3eae1;
  color: #8c6d4f;
}

.status-lock-icon {
  color: #c4c4c4;
  opacity: 0.8;
}

.tier-card-body {
  text-align: left;
}

.tier-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 2px 0;
}

.tier-range {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 16px;
  font-weight: 500;
}

.tier-discount {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 20px;
  letter-spacing: -0.5px;
}

.tier-perks-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tier-perks-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: #475569;
  font-weight: 500;
}

.perk-check-icon {
  color: #7bb883;
  flex-shrink: 0;
}

.color-bronze { color: #8c6d4f; }
.bg-bronze-light { background: #f5ede4; }

.color-silver { color: #8a94a6; }
.bg-silver-light { background: #f0f2f5; }

.color-gold { color: #b59461; }
.bg-gold-light { background: #f7f2e8; }

.tier-card.is-active {
  background: #ffffff;
  border-width: 2px;
  box-shadow: 0 10px 25px rgba(140, 109, 79, 0.08);
}

.tier-card.is-active.border-bronze { border-color: #8c6d4f; }
.tier-card.is-active.border-silver { border-color: #8a94a6; }
.tier-card.is-active.border-gold { border-color: #b59461; }

.tier-card.is-locked {
  background: #fafafa;
  border-color: rgba(128, 128, 128, 0.08);
}

.tier-card.is-locked .tier-title,
.tier-card.is-locked .tier-range,
.tier-card.is-locked .tier-discount,
.tier-card.is-locked .tier-perks-list li {
  color: #5176ae !important;
  opacity: 0.65;
}

.tier-card.is-locked .perk-check-icon {
  color: #cbd5e1;
}

.tier-card.is-locked .tier-icon-badge {
  background: #f1f5f9;
}

.tier-card.is-locked .tier-icon-badge svg {
  color: #94a3b8 !important;
}

@media (max-width: 768px) {

  .ticket-grid {
    grid-template-columns: 1fr;
  }

  .ticket-poster {
    height: 200px;
  }

  .ticket-footer {
    gap: 12px;
    flex-wrap: wrap;
  }

}

@media (max-width: 1024px) {
  .profile-hero-card {
    grid-template-columns: 1fr;
  }

  .hero-right-cluster {
    width: 100%;
  }

  .hero-stat-grid {
    grid-template-columns: 1fr;
  }

  .membership-dashboard-grid.light-theme-dashboard {
    grid-template-columns: 1fr;
  }

  .control-grid-3col {
    grid-template-columns: 1fr;
  }

  .control-grid-3col > .glass-control-card:nth-child(1),
  .control-grid-3col > .glass-control-card:nth-child(3) {
    grid-column: auto;
  }

  .font-size-option-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .profile-page-light {
    padding: 16px 12px 28px;
  }

  .profile-hero-card,
  .dashboard-core {
    border-radius: 22px;
    padding: 18px;
  }

  .avatar-container {
    width: 72px;
    height: 72px;
  }

  .user-display-name {
    font-size: 1.4rem;
  }

  .hero-bio-row {
    font-size: 0.88rem;
  }

  .progression-glass-panel,
  .glass-control-card {
    padding: 18px;
    border-radius: 18px;
  }

  .neon-segmented-tabs {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .navigation-tab-item {
    min-width: 0;
    padding-inline: 8px;
  }

  .ticket-grid {
    grid-template-columns: 1fr;
  }

  .review-item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .display-settings-card {
    padding: 18px;
  }

  .font-size-option {
    padding: 14px 16px;
  }

  .meta-sub-row {
    font-size:10px;
    width:200px;
  }
  .genre-pill-badge{
    font-size:10px;
  }
}

.profile-page-light.theme-dark {
  color: #e5e7eb;
}

.profile-page-light.theme-dark .profile-hero-card {
  background: linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(8, 13, 24, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36);
}

.profile-page-light.theme-dark .profile-hero-card::after {
  background: radial-gradient(circle, rgba(255, 82, 82, 0.12), transparent 68%);
}

.profile-page-light.theme-dark .user-display-name,
.profile-page-light.theme-dark .holder-title,
.profile-page-light.theme-dark .brand-logo,
.profile-page-light.theme-dark .metric-val,
.profile-page-light.theme-dark .panel-inner-title,
.profile-page-light.theme-dark .vault-sub-title,
.profile-page-light.theme-dark .modal-main-title,
.profile-page-light.theme-dark .tier-card-title,
.profile-page-light.theme-dark .tier-card-price {
  color: #f8fafc;
}

.profile-page-light.theme-dark .meta-subtext,
.profile-page-light.theme-dark .stats-count-label,
.profile-page-light.theme-dark .vault-description,
.profile-page-light.theme-dark .node-label,
.profile-page-light.theme-dark .incentive-text,
.profile-page-light.theme-dark .review-body-text-premium,
.profile-page-light.theme-dark .review-date-stamp,
.profile-page-light.theme-dark .ticket-meta-info p,
.profile-page-light.theme-dark .modal-subtitle {
  color: rgba(226, 232, 240, 0.72);
}

.profile-page-light.theme-dark .stats-count-number,
.profile-page-light.theme-dark .spend-counter,
.profile-page-light.theme-dark .highlight {
  color: #ffffff;
}

.profile-page-light.theme-dark .stats-vertical-divider,
.profile-page-light.theme-dark .security-nested-vault,
.profile-page-light.theme-dark .modal-action-dock,
.profile-page-light.theme-dark .contact-card {
  border-color: rgba(255, 255, 255, 0.08);
}

.profile-page-light.theme-dark .gsc-luxury-card,
.profile-page-light.theme-dark .progression-glass-panel,
.profile-page-light.theme-dark .glass-control-card,
.profile-page-light.theme-dark .review-card-item-premium,
.profile-page-light.theme-dark .review-card-item,
.profile-page-light.theme-dark .ticket-card-ui,
.profile-page-light.theme-dark .security-modal-container {
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.96), rgba(10, 14, 23, 0.94));
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
}

.profile-page-light.theme-dark .progression-glass-panel,
.profile-page-light.theme-dark .glass-control-card,
.profile-page-light.theme-dark .review-card-item-premium,
.profile-page-light.theme-dark .review-card-item,
.profile-page-light.theme-dark .ticket-card-ui {
  background: rgba(17, 24, 39, 0.92);
}

.profile-page-light.theme-dark .node-field,
.profile-page-light.theme-dark .node-textarea-field,
.profile-page-light.theme-dark .node-select-field,
.profile-page-light.theme-dark .dock-input {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  /* white arrow for dark theme */
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23f8fafc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 34px;
}

.profile-page-light.theme-dark .dock-input option {
  background: rgba(17,24,39,0.98);
  color: #e5e7eb;
}

.profile-page-light.theme-dark .dock-input::placeholder {
  color: rgba(226, 232, 240, 0.45);
}

.profile-page-light.theme-dark .node-field::placeholder,
.profile-page-light.theme-dark .node-textarea-field::placeholder,
.profile-page-light.theme-dark .dock-input::placeholder {
  color: rgba(226, 232, 240, 0.45);
}

.profile-page-light.theme-dark .locked {
  background: rgba(255, 255, 255, 0.02);
  color: rgba(226, 232, 240, 0.7);
}

.profile-page-light.theme-dark .unlocked:focus,
.profile-page-light.theme-dark .dock-input:focus {
  border-color: #ff5252;
  box-shadow: 0 0 0 3px rgba(255, 82, 82, 0.12);
}

.profile-page-light.theme-dark .open-modal-trigger-btn,
.profile-page-light.theme-dark .dock-action-btn,
.profile-page-light.theme-dark .modal-btn.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.profile-page-light.theme-dark .open-modal-trigger-btn:hover:not(:disabled),
.profile-page-light.theme-dark .dock-action-btn:hover,
.profile-page-light.theme-dark .modal-btn.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.profile-page-light.theme-dark .btn-edit {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.12);
}

.profile-page-light.theme-dark .btn-cancel {
  background: rgba(255, 255, 255, 0.06);
  color: #e5e7eb;
}

.profile-page-light.theme-dark .btn-save,
.profile-page-light.theme-dark .dynamic-save-btn,
.profile-page-light.theme-dark .movie-btn {
  background: linear-gradient(135deg, #ff4d4d, #b30000);
  color: #ffffff;
}

.profile-page-light.theme-dark .faq-toggle-pill {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
}

.profile-page-light.theme-dark .faq-toggle-btn {
  color: rgba(226, 232, 240, 0.72);
}

.profile-page-light.theme-dark .faq-toggle-btn:hover {
  color: #ffffff;
}

.profile-page-light.theme-dark .faq-toggle-btn.active {
  background: rgba(242, 39, 39, 0.57);
  color: #ffffff !important;
}

.profile-page-light.theme-dark .vector-pill {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.profile-page-light.theme-dark .review-rating {
  color: #f5c518;
}

.profile-page-light.theme-dark .review-poster-thumbnail {
  background: rgba(255, 255, 255, 0.04);
}

.profile-page-light.theme-dark .tier-card {
  background: rgba(17, 24, 39, 0.94);
  border-color: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.profile-page-light.theme-dark .tier-card.is-active {
  background: rgba(255, 255, 255, 0.07);
}

.profile-page-light.theme-dark .tier-card.is-locked {
  opacity: 0.75;
}

.profile-page-light.theme-dark .bg-bronze-light,
.profile-page-light.theme-dark .bg-silver-light,
.profile-page-light.theme-dark .bg-gold-light {
  background: rgba(255, 255, 255, 0.08);
}

.profile-page-light.theme-dark .color-bronze,
.profile-page-light.theme-dark .color-silver,
.profile-page-light.theme-dark .color-gold {
  color: #f8fafc;
}

.profile-page-light.theme-dark .status-pill.current-pill {
  background: rgba(255, 82, 82, 0.15);
  color: #ffffff;
}

.profile-page-light.theme-dark .status-lock-icon {
  color: rgba(226, 232, 240, 0.75);
}

.profile-page-light.theme-dark .progression-footer-messages.maxed .incentive-text {
  color: #86efac;
}

.profile-page-light.theme-dark .display-settings-card {
  background: linear-gradient(145deg, rgba(17, 24, 39, 0.96), rgba(10, 14, 23, 0.94));
  border-color: rgba(255, 255, 255, 0.08);
}

.profile-page-light.theme-dark .display-settings-description {
  color: rgba(226, 232, 240, 0.72);
}



.profile-page-light.theme-dark .font-size-option {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.profile-page-light.theme-dark .font-size-option-label {
  color: rgba(226, 232, 240, 0.72);
}

.profile-page-light.theme-dark .font-size-option-preview {
  color: #f8fafc;
}

.profile-page-light.theme-dark .font-size-option.active {
  border-color: rgba(255, 82, 82, 0.5);
}
</style>
