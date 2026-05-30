<template>
  <div class="profile-page-light">
    <header class="profile-hero-card">
      <div class="hero-left-cluster">
        <div class="avatar-container">
          <img :src="user.avatar" alt="Avatar" class="avatar-img" />
          <div class="avatar-edit-badge" v-if="isEditing">
            <span>Edit</span>
          </div>
        </div>
        <div class="identity-meta">
          <div class="name-badge-row">
            <h1 class="user-display-name">{{ user.name }}</h1>
            <span :class="['mini-tier-pill', user.tier.toLowerCase()]">{{ user.tier }}</span>
          </div>
          <p class="meta-subtext">Premium Member • Joined May 2026</p>
        </div>
      </div>
      
      <button 
        @click="toggleEditMode" 
        :class="['premium-cta-btn', isEditing ? 'btn-save' : 'btn-edit']"
      >
        {{ isEditing ? 'Save Changes' : 'Edit Profile' }}
      </button>
    </header>

    <section class="membership-dashboard-grid light-theme-dashboard">
      <div class="gsc-luxury-card">
        <div class="card-glow-overlay"></div>
        <div class="card-internal-layout">
          <div class="card-brand-row">
            <span class="brand-logo">POPFLIX REWARDS<span class="accent-dot">.</span></span>
            <div class="chip-icon"></div>
          </div>
          
          <div class="card-holder-center">
            <p class="holder-label">MEMBER ACCOUNT</p>
            <h2 class="holder-title">{{ user.name }}</h2>
          </div>

          <div class="card-footer-metrics">
            <div>
              <p class="metric-lbl">TIER STATUS</p>
              <p class="metric-val VIP">{{ user.tier.toUpperCase() }} MEMBER</p>
            </div>
            <div class="text-right">
              <p class="metric-lbl">STATUS PERIOD</p>
              <p class="metric-val code">Valid thru 2027</p>
            </div>
          </div>
        </div>
      </div>

      <div class="progression-glass-panel">
        <div class="panel-header-row">
          <div class="tier-milestones">
            <span class="milestone active">Bronze</span>
            <span :class="['milestone', user.tier === 'Silver' || user.tier === 'Gold' ? 'active' : '']">Silver</span>
            <span :class="['milestone', user.tier === 'Gold' ? 'active' : '']">Gold</span>
          </div>
          <div class="spend-counter">
            RM {{ user.annualSpend.toFixed(2) }} <span class="total-label">spent</span>
          </div>
        </div>

        <div class="neon-progress-container">
          <div class="neon-track">
            <div class="neon-fill" :style="{ width: progressToNextTier + '%' }"></div>
          </div>
        </div>

        <div class="progression-footer-messages" v-if="user.tier !== 'Gold'">
          <p class="incentive-text">
            Spend another <span class="highlight">RM {{ (nextTierThreshold - user.annualSpend).toFixed(2) }}</span> by Dec 31 to automatically unlock the premium benefits of <span class="highlight">{{ nextTierName }} Tier</span>.
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
      <nav class="neon-segmented-tabs">
        <button 
          v-for="tab in ['Profile', 'Ticket Design', 'Reviews']" 
          :key="tab"
          :class="['navigation-tab-item', activeTab === tab ? 'selected-tab' : '']"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </nav>

      <div class="tab-view-viewport">
        <section v-if="activeTab === 'Profile'" class="control-grid-3col">
          
          <div class="glass-control-card">
            <h3 class="panel-inner-title">Personal Details</h3>
            
            <div class="interactive-input-node">
              <label class="node-label">Email Address</label>
              <div class="input-container">
                <input type="email" v-model="user.email" :disabled="!isEditing" :class="['node-field', isEditing ? 'unlocked' : 'locked']" />
              </div>
            </div>

            <div class="interactive-input-node">
              <label class="node-label">Mobile Phone</label>
              <div class="input-container">
                <input type="tel" v-model="user.mobile" :disabled="!isEditing" :class="['node-field', isEditing ? 'unlocked' : 'locked']" />
              </div>
            </div>

            <div class="interactive-input-node">
              <label class="node-label">Gender</label>
              <div class="input-container">
                <select v-model="user.gender" :disabled="!isEditing" :class="['node-select-field', isEditing ? 'unlocked' : 'locked']">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Undisclosed">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div class="interactive-input-node">
              <label class="node-label">Location</label>
              <div class="input-container">
                <input type="text" v-model="user.location" :disabled="!isEditing" :class="['node-field', isEditing ? 'unlocked' : 'locked']" />
              </div>
            </div>
          </div>

          <div class="glass-control-card">
            <h3 class="panel-inner-title">About / Bio</h3>
            
            <div class="interactive-input-node bio-node">
              <label class="node-label">Biography</label>
              <textarea v-model="user.bio" :disabled="!isEditing" :class="['node-textarea-field', isEditing ? 'unlocked' : 'locked']" rows="4"></textarea>
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
                Change Account Password
              </button>
            </div>
          </div>

          <div class="glass-control-card">
            <h3 class="panel-inner-title">Genres</h3>
            <label class="node-label prefer-label">Favourite Film Categories</label>
            
            <div class="neon-pill-cloud">
              <span v-for="(genre, index) in user.genres" :key="genre" class="vector-pill">
                {{ genre }}
                <button v-if="isEditing" @click="removeGenre(index)" class="pill-delete-cross">-></button>
              </span>
            </div>

            <div v-if="isEditing" class="pill-injection-dock">
              <input type="text" v-model="newGenreInput" placeholder="Add genre..." @keydown.enter.prevent="addGenre" class="dock-input" />
              <button @click="addGenre" class="dock-action-btn">+</button>
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
            <h3 class="modal-main-title">Modify Account Password</h3>
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
                class="node-field unlocked" 
              />
              <button type="button" @click="showPass.curr = !showPass.curr" class="visibility-toggle-eye">
                {{ showPass.curr ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <div class="interactive-input-node">
            <label class="node-label">New Password</label>
            <div class="input-container">
              <input 
                :type="showPass.new ? 'text' : 'password'" 
                v-model="security.newPassword" 
                placeholder="Enter new password" 
                required
                class="node-field unlocked" 
              />
              <button type="button" @click="showPass.new = !showPass.new" class="visibility-toggle-eye">
                {{ showPass.new ? 'Hide' : 'Show' }}
              </button>
            </div>
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

<script setup>
import { ref, reactive, computed } from 'vue';

const activeTab = ref('Profile');
const isEditing = ref(false);
const isPasswordModalOpen = ref(false);
const newGenreInput = ref('');

const showPass = reactive({
  curr: false,
  new: false
});

const user = reactive({
  name: 'Fam Sin Mim',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  email: 'sinmim@swinburne.edu.my',
  mobile: '+60 12-345 6789',
  gender: 'Male',
  location: 'Sarawak, Malaysia',
  bio: 'Software development engineering major with specialized emphasis across full-stack applications and modern interactive systems.',
  genres: ['Sci-Fi', 'Cyberpunk', 'Psychological Thriller'],
  tier: 'Bronze', 
  annualSpend: 145.50 
});

const security = reactive({
  currentPassword: '',
  newPassword: ''
});

// Milestone Tier Calculations
const nextTierName = computed(() => {
  if (user.tier === 'Bronze') return 'Silver';
  if (user.tier === 'Silver') return 'Gold';
  return 'Maxed';
});

const nextTierThreshold = computed(() => {
  if (user.tier === 'Bronze') return 250.00;
  if (user.tier === 'Silver') return 500.00;
  return 0;
});

const progressToNextTier = computed(() => {
  if (nextTierThreshold.value === 0) return 100;
  return Math.min(100, (user.annualSpend / nextTierThreshold.value) * 100);
});

// State Actions
const toggleEditMode = () => {
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
};

const submitPasswordMutation = () => {
  console.log('Dispatched update payload:', JSON.stringify(security));
  closePasswordModal();
};

const addGenre = () => {
  const normalizedValue = newGenreInput.value.trim();
  if (normalizedValue && !user.genres.includes(normalizedValue)) {
    user.genres.push(normalizedValue);
    newGenreInput.value = '';
  }
};

const removeGenre = (index) => { user.genres.splice(index, 1); };
</script>

<style scoped>
/* Clean Light Theme Base Layout */
.profile-page-light {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
  color: #1e293b;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Profiles Header Block */
.profile-hero-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 32px;
  border-radius: 16px;
  margin-bottom: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.hero-left-cluster { display: flex; align-items: center; gap: 24px; }

.avatar-container {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: #e2e8f0;
  padding: 2px;
}

.avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

.avatar-edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #0f172a;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 2px solid #ffffff;
}

.name-badge-row { display: flex; align-items: center; gap: 12px; }
.user-display-name { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.01em; margin: 0; color: #0f172a; }

.mini-tier-pill {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}
.mini-tier-pill.bronze { background: #ffedd5; color: #c2410c; }
.mini-tier-pill.silver { background: #f1f5f9; color: #475569; }
.mini-tier-pill.gold { background: #fef9c3; color: #a16207; }

.meta-subtext { color: #64748b; margin: 4px 0 0 0; font-size: 0.9rem; }

/* Control Action Components */
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
.btn-save:hover { background: #1e293b; }

/* ==========================================================================
   UPDATED: INTEGRATED LIGHT MODE MEMBERSHIP DASHBOARD SECTION STYLES
   ========================================================================== */
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
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
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
.brand-logo { font-weight: 800; font-size: 1.1rem; letter-spacing: 0.05em; color: #0f172a; }
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
.milestone { font-size: 0.85rem; font-weight: 500; color: #94a3b8; }
.milestone.active { color: #0f172a; font-weight: 700; }

.spend-counter { font-size: 1.15rem; font-weight: 700; color: #0f172a; }
.total-label { font-size: 0.8rem; color: #64748b; font-weight: 400; }

.neon-progress-container { margin-bottom: 4px; }
.neon-track { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.neon-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progression-footer-messages { margin-top: 16px; }
.incentive-text { margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.6; }
.highlight { color: #0f172a; font-weight: 700; }
.maxed-text { color: #059669; font-weight: 600; }

/* System Tabs Navigation Links Row */
.neon-segmented-tabs {
  display: inline-flex;
  background: #e2e8f0;
  padding: 4px;
  border-radius: 10px;
  gap: 2px;
  margin-bottom: 24px;
}

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

.panel-inner-title { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 20px 0; }

.interactive-input-node { margin-bottom: 16px; }
.node-label { font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 6px; display: block; }
.prefer-label { margin-bottom: 12px; }

.input-container { position: relative; display: flex; align-items: center; width: 100%; }

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

/* Parameter Tags Configurations */
.neon-pill-cloud { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.vector-pill {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 6px;
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
.dock-action-btn { background: #0f172a; color: white; border: none; padding: 0 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; }

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

.dynamic-save-btn { background: #0f172a; color: #ffffff; }
.dynamic-save-btn:hover { background: #1e293b; }

.animate-fade { animation: fadeIn 0.15s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 1024px) {
  .membership-dashboard-grid.light-theme-dashboard { grid-template-columns: 1fr; }
  .control-grid-3col { grid-template-columns: 1fr; }
}
</style>