<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import {SquarePen, Award, MapPin, ClockFading, User, Ticket, Star, Mail, Phone, Users, Lock, XCircle, Plus, Camera, Eye, EyeOff, Check, CheckCircle, Info} from '@lucide/vue';

// Import other hook and component
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/authService';
import { formatMonthYear } from '@/utils/formatDateTime';
import { GENRE_MAP } from '@/utils/genre';
import { resolveBackendAssetPath } from '@/utils/FormatPicture';

const activeTab = ref('Profile');
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

const cloneUserState = () => JSON.parse(JSON.stringify(user));

const revokeBlobAvatar = (avatar) => {
  if (typeof avatar === 'string' && avatar.startsWith('blob:')) {
    URL.revokeObjectURL(avatar);
  }
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

const genreOptions = computed(() =>
  Object.entries(GENRE_MAP).map(([id, name]) => ({
    id: Number(id),
    name
  }))
);

const availableGenres = computed(() =>
  genreOptions.value.filter(
    genre => !user.genres.includes(genre.name)
  )
);

onMounted(async () => {
  try {
    await authStore.fetchProfile();
  } catch (e) {
    console.error('Failed to fetch profile on mount', e);
  }
});

const showPass = reactive({
  curr: false,
  new: false
});

const user = reactive({
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
  user.avatar = u.profileImage ? resolveBackendAssetPath(u.profileImage) : null;
  avatarLoadError.value = false;
  user.email = u.email || '';
  user.mobile = u.phone || '';
  user.gender = u.gender || 'Undisclosed';
  user.location = u.location || '';
  user.bio = u.bio || '';
  user.genres = parseGenres(u.favouriteGenres );
  user.tier = u.tier || 'Bronze';
  user.annualSpend = Number(u.totalSpent ?? u.annualSpend ?? u.totalSpentThisYear ?? 0) || 0;
  user.points = Number(u.points ?? u.loyaltyPoints ?? 0) || 0;
  user.joinedOn = u.joinedOn || u.createdAt || null;
  user.ticketCount = Number(u.ticketCount || 0) || 0;
  user.reviewCount=u.reviewCount || 0;
};


watch(currentUser, syncLocalUserFromStore, { immediate: true });

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

const nextTierName = computed(() => {
  if (currentTier.value === 'Bronze') return 'Silver';
  if (currentTier.value === 'Silver') return 'Gold';
  return 'Maxed';
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

const tabs = [
  { name: 'Profile', icon: User },
  { name: 'Ticket Design', icon: Ticket },
  { name: 'Reviews', icon: Star },
  { name: 'Membership Rewards', icon: Award }
];

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
    !user.genres.includes(selectedGenre.value)
  ) {
    user.genres.push(selectedGenre.value);
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
  <div class="profile-page-light">
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
            <span :class="['mini-tier-pill', currentTier.toLowerCase()]">
              <Award size="16"/>
              {{ currentTier }}
            </span>
          </div>
          <p class="meta-subtext"><MapPin size="16" class="me-2"/>{{user.location}} &bull; <ClockFading size="16" class="me-2"/> Joined {{ formatMonthYear(user.joinedOn)}}</p>

          <div class="user-stats-counter-row ps-2">
            <div class="stats-counter-item">
              <span class="stats-count-number">{{ user.ticketCount }}</span>
              <span class="stats-count-label">Tickets</span>
            </div>
            
            <div class="stats-vertical-divider"></div>
            
            <div class="stats-counter-item">
              <span class="stats-count-number">{{ user.reviewCount }}</span>
              <span class="stats-count-label">Reviews</span>
            </div>

            <div class="stats-vertical-divider"></div>

            <div class="stats-counter-item">
              <span class="stats-count-number">{{ user.points }}</span>
              <span class="stats-count-label">Points</span>
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
          Edit Profile
        </button>

        <template v-else>
          <button
            @click="cancelEdit"
            class="premium-cta-btn btn-cancel me-2"
          >
            Cancel
          </button>

          <button
            @click="saveProfile"
            class="premium-cta-btn btn-save"
          >
            Save Changes
          </button>
        </template>
      </div>
    </header>

    <section class="membership-dashboard-grid light-theme-dashboard">
      <div class="gsc-luxury-card" :class="`tier-${currentTier.toLowerCase()}`">
        <div class="card-glow-overlay"></div>
        <div class="card-internal-layout">
          <div class="card-brand-row">
            <span class="brand-logo">Membership Card<span class="accent-dot">.</span></span>
            <div class="chip-icon"></div>
          </div>
          
          <div class="card-holder-center">
            <p class="holder-label">Member Account:</p>
            <h2 class="holder-title">{{ user.name }}</h2>
          </div>

          <div class="card-footer-metrics">
            <div>
              <p class="metric-lbl">Tier Status</p>
              <p class="metric-val VIP">{{ currentTier.toUpperCase() }} Member</p>
            </div>
            <div class="text-right">
              <p class="metric-lbl">Status Period</p>
              <p class="metric-val code">Lifetime</p>
            </div>
          </div>
        </div>
      </div>

      <div class="progression-glass-panel" :class="`tier-${currentTier.toLowerCase()}`">
        <div class="panel-header-row">
          <div class="tier-milestones">
            <span class="milestone active">Bronze</span>
            <span :class="['milestone', currentTier !== 'Bronze' ? 'active' : '']">Silver</span>
            <span :class="['milestone', currentTier === 'Gold' ? 'active' : '']">Gold</span>
          </div>
          <div class="spend-counter">
            RM {{ Number(user.annualSpend).toFixed(2) }} <span class="total-label">spent</span>
          </div>
        </div>

        <div class="neon-progress-container">
          <div class="neon-track">
            <div class="neon-fill" :style="{ width: progressToNextTier + '%' }"></div>
          </div>
        </div>

        <div class="progression-footer-messages" v-if="currentTier !== 'Gold'">
          <p class="incentive-text">
            Spend another <span class="highlight">RM {{ Number(nextTierThreshold - Number(user.annualSpend)).toFixed(2) }}</span> to automatically unlock the premium benefits of <span class="highlight">{{ nextTierName }} Tier</span>.
          </p>
        </div>
        <div class="progression-footer-messages maxed" v-else>
          <p class="incentive-text maxed-text">
            Maximum tier status achieved. You are enjoying premium access to all luxury configurations and exclusive birthday rewards.
          </p>
        </div>
      </div>
    </section>

    <main class="dashboard-core">
      <div class="mb-6 d-flex mb-4">
        <div class="faq-toggle-pill">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            class="faq-toggle-btn"
            :class="{ 'active': activeTab === tab.name }"
            @click="activeTab = tab.name"
          >
            <component :is="tab.icon" size="16" class="me-2" />
            {{ tab.name }}
          </button>
        </div>
      </div>

      <div class="tab-view-viewport">
        <section v-if="activeTab === 'Profile'" class="control-grid-3col">
          
          <div class="glass-control-card">
            <h3 class="panel-inner-title fs-6"> Personal Details</h3>
            
            <div class="interactive-input-node">
              <label class="node-label"><Mail size="16" class="me-2"/>Email Address</label>
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
              <label class="node-label"><Phone size="16" class="me-2"/>Mobile Phone</label>
              <div class="input-container">
                <div v-if="!isEditing" class="node-display-text px-4">
                  {{ user.mobile }}
                </div>
                <input v-else type="tel" v-model="user.mobile" :disabled="!isEditing" :class="['node-field', isEditing ? 'unlocked' : 'locked']" />
              </div>
            </div>

            <div class="interactive-input-node">
              <label class="node-label"><Users size="16" class="me-2"/>Gender</label>
              <div class="input-container">
                <div v-if="!isEditing" class="node-display-text px-4">
                  {{ user.gender }}
                </div>
                <select v-else v-model="user.gender" :disabled="!isEditing" :class="['node-select-field', isEditing ? 'unlocked' : 'locked']">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Undisclosed">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div class="interactive-input-node">
              <label class="node-label"><MapPin size="16" class="me-2"/>Location</label>
              <div class="input-container">
                <div v-if="!isEditing" class="node-display-text px-4">
                  {{ user.location }}
                </div>
                <input v-else type="text" v-model="user.location" :disabled="!isEditing" :class="['node-field', isEditing ? 'unlocked' : 'locked']" />
              </div>
            </div>
          </div>

          <div class="glass-control-card">
            <h3 class="panel-inner-title fs-6">Bio</h3>
            
            <div class="interactive-input-node bio-node">
              <label class="node-label">Biography</label>
              <div v-if="!isEditing" class="node-display-text">
                  {{ user.bio }}
                </div>
              <textarea v-else v-model="user.bio" :disabled="!isEditing" :class="['node-textarea-field px-2', isEditing ? 'unlocked' : 'locked']" rows="4"></textarea>
            </div>

            <div class="security-nested-vault">
              <h4 class="vault-sub-title">Security Management</h4>
              <p class="vault-description">Update account passwords and local credential security keys.</p>
              
              <button 
                type="button" 
                class="open-modal-trigger-btn"
                :disabled="!isEditing"
                @click="openPasswordModal"
              >
                <Lock size="16" class="me-2"/>Change Password
              </button>
            </div>
          </div>

          <div class="glass-control-card">
            <h3 class="panel-inner-title fs-6">Favourite Genres</h3>
            
            <div class="neon-pill-cloud">
              <span v-for="(genre, index) in user.genres" :key="genre" class="vector-pill">
                {{ genre }}
                <button v-if="isEditing" @click="removeGenre(index)" class="pill-delete-cross"><XCircle size="16"/></button>
              </span>
            </div>

            <div v-if="isEditing" class="pill-injection-dock">
              <select
                v-model="selectedGenre"
                class="dock-input"
              >
                <option value="">Select Genre</option>

                <option
                  v-for="genre in availableGenres"
                  :key="genre.id"
                  :value="genre.name"
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

        <section v-if="activeTab === 'Ticket Design'" class="gallery-panel animate-fade">
          <div class="ticket-grid">
            <div v-for="n in 4" :key="n" class="ticket-card-ui">
              <div class="ticket-visual-stub">
                <div class="stub-notch"></div>
                <div class="ticket-preview-image-placeholder">Live Preview</div>
              </div>
              <div class="ticket-meta-info">
                <h4>Cinematic Concept Specimen #0{{ n }}</h4>
                <p>Created via Live Ticket Customizer</p>
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'Reviews'" class="reviews-panel animate-fade">
          <div class="review-stack">
            <div v-for="n in 3" :key="n" class="review-card-item">
              <div class="review-item-header">
                <span class="reviewed-movie-title">Feature Film Presentation Module {{ n }}</span>
                <span class="review-rating">★ ★ ★ ★ ☆</span>
              </div>
              <p class="review-body-text">
                Excellent visual composition and spatial pacing. The user experience matched historical design benchmarks perfectly.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <div class="modal-backdrop-blur" v-if="isPasswordModalOpen" @click.self="closePasswordModal">
      <div class="security-modal-container">
        <div class="modal-header">
          <div>
            <h3 class="modal-main-title">Change Account Password</h3>
            <p class="modal-subtitle">Update security credentials</p>
          </div>
          <button class="modal-close-cross" @click="closePasswordModal">⨉</button>
        </div>

        <form @submit.prevent="submitPasswordMutation" class="modal-form-body">
          <div class="interactive-input-node">
            <label class="node-label">Current Password</label>
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
            <label class="node-label">New Password</label>
            
            <div class="input-container">
              <input 
                :type="showPass.new ? 'text' : 'password'" 
                v-model="security.newPassword" 
                placeholder="Enter new password" 
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
                    <Check size="14" /> At least 8 characters
                  </li>
                  <li :class="{ valid: passwordReqs.case }">
                    <Check size="14" /> Upper & lowercase letters
                  </li>
                  <li :class="{ valid: passwordReqs.number }">
                    <Check size="14" /> At least one number
                  </li>
                  <li :class="{ valid: passwordReqs.symbol }">
                    <Check size="14" /> At least one symbol
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

.milestone.active { color: #0f172a; font-weight: 700; }

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

/* Form Card Controls Column Grid Layout */
.control-grid-3col { display: grid; grid-template-columns: 1fr 1.1fr 0.9fr; gap: 24px; }
.glass-control-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }

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
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 10px;
  color: #0f172a;
  font-size: 0.8rem;
  flex-grow: 1;
}
.dock-input:focus { outline: none; border-color: #0f172a; }
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
.ticket-preview-image-placeholder { text-transform: uppercase; font-size: 0.75rem; tracking: 0.05em; color: #94a3b8; }
.ticket-meta-info { padding: 12px; }
.ticket-meta-info h4 { margin: 0 0 4px 0; font-size: 0.95rem; color: #0f172a; font-weight: 600; }
.ticket-meta-info p { margin: 0; font-size: 0.8rem; color: #64748b; }

/* COMBINED FLAT REVIEWS STACK STYLING */
.review-stack { display: flex; flex-direction: column; gap: 12px; }
.review-card-item { background-color: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; }
.review-item-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600; }
.reviewed-movie-title { color: #0f172a; font-size: 0.95rem; }
.review-rating { color: #f59e0b; font-size: 0.9rem; letter-spacing: 2px; }
.review-body-text { margin: 0; color: #475569; font-size: 0.9rem; line-height: 1.5; }

/* Modal Backdrop Layer Matrix CSS */
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
  box-shadow: 0 4px 12px rgba(255, 82, 82, 0.25);
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
}
</style>
