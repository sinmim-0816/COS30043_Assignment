<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotifications } from '@/hook/useNotification';
import { Bell, Check, Film, Receipt, Award, Paintbrush } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const dropdownActive = ref(false);

const currentUser = computed(() => authStore.user || {});
const userId = computed(() => currentUser.value?.id);

// Bind the reactive websocket hook actions
const { 
  notifications, 
  unreadCount, 
  initNotificationSystem, 
  disconnectNotifications, 
  readNotification,
  readAllNotifications 
} = useNotifications();

// Automatically connect system on load if user is authenticated
onMounted(() => {
  if (userId.value) initNotificationSystem(userId.value);
});

// Watch authentication status changes (Login / Logout events)
watch(userId, (newId) => {
  if (newId) {
    initNotificationSystem(newId);
  } else {
    disconnectNotifications();
    dropdownActive.value = false;
  }
});

// Close dropdown if user clicks outside
const toggleDropdown = () => {
  dropdownActive.value = !dropdownActive.value;
};

// Handle navigating to dynamic router URLs when item is selected
const handleItemInteraction = async (item) => {
  dropdownActive.value = false;
  
  // 1. Sync read states with backend database
  await readNotification(item);
  
  // 2. Perform smooth route steering changes if link target is included
  if (item.url) {
    router.push(item.url);
  }
};

// Small context utility choosing icons dynamically based on text or type elements
const getContextIcon = (type) => {
  if (type === 'success') return Award;
  return Bell;
};
</script>

<template>
  <div class="notification-center-container">
    <button class="bell-trigger-btn" @click="toggleDropdown" :class="{ 'has-unread': unreadCount > 0 }">
      <Bell :size="22" class="bell-icon" />
      <span v-if="unreadCount > 0" class="badge-counter-indicator">
        {{ unreadCount }}
      </span>
    </button>

    <div v-if="dropdownActive" class="notification-dropdown-panel animate-fade-in">
      <div class="dropdown-header-block">
        <h3>Notifications</h3>
        <button 
          v-if="unreadCount > 0" 
          @click="readAllNotifications(userId)" 
          class="mark-all-read-btn"
        >
          Mark all read
        </button>
      </div>

      <div class="notification-list-scrollway">
        <div v-if="notifications.length === 0" class="empty-state-card">
          <p>Your notification tray is empty</p>
        </div>

        <div 
          v-for="item in notifications" 
          :key="item.id" 
          class="notification-feed-row"
          :class="{ 'unread-row': !item.isRead, 'clickable-row': item.url }"
          @click="handleItemInteraction(item)"
        >
          <div class="status-indicator-stripe" :class="item.type"></div>

          <div class="row-icon-housing" :class="item.type">
            <component :is="getContextIcon(item.type)" :size="16" />
          </div>

          <div class="notification-copy-block">
            <div class="title-line-row">
              <h4>{{ item.title }}</h4>
              <span v-if="!item.isRead" class="unread-dot"></span>
            </div>
            <p>{{ item.message }}</p>
            <span class="timestamp-string">
              {{ new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-center-container {
  position: relative;
  display: inline-block;
}

.bell-trigger-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  padding: 8px;
  color: #64748b;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bell-trigger-btn:hover {
  color: #1e293b;
}

.badge-counter-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ffb100; /* PopFlix Accent Gold color */
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 10px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
}

/* Dropdown Menu Geometry Container */
.notification-dropdown-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 12px;
  width: 360px;
  max-height: 480px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dropdown-header-block {
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-header-block h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.mark-all-read-btn {
  background: transparent;
  border: none;
  color: #ffb100;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.notification-list-scrollway {
  overflow-y: auto;
  flex-grow: 1;
}

.empty-state-card {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 13.5px;
}

/* Notification Row Item Styling */
.notification-feed-row {
  display: flex;
  padding: 14px 18px;
  position: relative;
  border-bottom: 1px solid #f8fafc;
  gap: 12px;
  transition: background 0.15s ease;
}

.clickable-row {
  cursor: pointer;
}

.notification-feed-row:hover {
  background: #f8fafc;
}

.unread-row {
  background: rgba(255, 177, 0, 0.01);
}

/* Lateral Color Ribbon Accents */
.status-indicator-stripe {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #cbd5e1;
}
.status-indicator-stripe.success { background: #10b981; }
.status-indicator-stripe.info { background: #3b82f6; }

/* Micro-badge circle */
.row-icon-housing {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f1f5f9;
  color: #64748b;
}
.row-icon-housing.success { background: #ecfdf5; color: #10b981; }
.row-icon-housing.info { background: #eff6ff; color: #3b82f6; }

.notification-copy-block {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.title-line-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-line-row h4 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #1e293b;
}

.unread-dot {
  width: 6px;
  height: 6px;
  background: #ffb100;
  border-radius: 50%;
}

.notification-copy-block p {
  margin: 0;
  font-size: 12.5px;
  color: #64748b;
  line-height: 1.4;
}

.timestamp-string {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  margin-top: 2px;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>