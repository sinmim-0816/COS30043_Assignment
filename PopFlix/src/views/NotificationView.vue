<script setup>
import { ref, computed } from 'vue';
import { 
  Inbox, 
  CircleAlert, 
  MailOpen, 
  Check, 
  Clock, 
  Trash2,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';

// Import other hook and components
import { useAuthStore } from '@/stores/auth';
import { useNotifications } from '@/hook/useNotification';

const authStore = useAuthStore();
const router=useRouter();
const userId = computed(() => authStore.user?.id);

const { 
  notifications, 
  readNotification, 
  readAllNotifications,
  deleteNotification,
  unreadCount 
} = useNotifications();

const activeFilter = ref('all');

const filteredNotifications = computed(() => {
  if (activeFilter.value === 'unread') {
    return notifications.value.filter(n => !n.isRead);
  }
  if (activeFilter.value === 'success' || activeFilter.value === 'info') {
    return notifications.value.filter(n => n.type === activeFilter.value);
  }
  return notifications.value;
});

const handleRowClick = async (item) => {
  if (!item.isRead) {
    await readNotification(item);
  }
  if (item.url) {
    router.push(item.url);
  }
};

const handleInlineReadToggle = async (event, item) => {
  event.stopPropagation();
  await readNotification(item);
};

const handleInlineDelete = async (event, item) => {
  event.stopPropagation();
  await deleteNotification(item.id);
};
</script>

<template>
  <div class="gmail-layout-container">
    
    <aside class="gmail-sidebar">
      <div class="compose-space">
        <div class="sidebar-brand">
          <span class="fw-bold">Inbox</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button 
          class="nav-tab" 
          :class="{ 'tab-active': activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          <Inbox :size="18" />
          <span class="tab-label">All Notifications</span>
          <span class="total-badge">{{ notifications.length }}</span>
        </button>

        <button 
          class="nav-tab" 
          :class="{ 'tab-active': activeFilter === 'unread' }"
          @click="activeFilter = 'unread'"
        >
          <CircleAlert :size="18" />
          <span class="tab-label">Unread</span>
          <span v-if="unreadCount > 0" class="unread-count-pill">{{ unreadCount }}</span>
        </button>

        <div class="sidebar-divider"></div>
      </nav>
    </aside>

    <main class="gmail-main-pane">
      
      <div class="toolbar-ribbon">
        <div class="toolbar-left">
          <button 
            v-if="unreadCount > 0"
            @click="readAllNotifications(userId)" 
            class="icon-action-btn" 
            title="Mark all as read"
          >
            <MailOpen :size="18" />
            <span>Mark all read</span>
          </button>
        </div>

        <div class="toolbar-right">
          <span class="pagination-meta">
            Showing <b>{{ filteredNotifications.length }}</b> entries
          </span>
        </div>
      </div>

      <div class="mailbox-list-frame">
        <div v-if="filteredNotifications.length === 0" class="gmail-empty-state">
          <Inbox :size="40" class="empty-vector" />
          <p>Nothing in this category. Enjoy your empty inbox!</p>
        </div>

        <div 
          v-for="item in filteredNotifications" 
          :key="item.id" 
          class="gmail-row"
          :class="{ 'unread-gmail-row': !item.isRead }"
          @click="handleRowClick(item)"
        >
          
          <div class="meta-markers">
            <span class="status-marker-dot" :class="item.type"></span>
            <span v-if="!item.isRead" class="unread-indicator-bullet"></span>
          </div>

          <div class="sender-domain-box">
            <span class="sender-title-text">{{ item.title }}</span>
          </div>

          <div class="snippet-content-cell">
            <p class="message-paragraph">
              {{ item.message }}
            </p>
          </div>

          <div class="inline-hover-actions">
            <button 
              v-if="!item.isRead"
              @click="handleInlineReadToggle($event, item)" 
              class="inline-action-circle" 
              title="Mark as read"
            >
              <Check :size="15" />
            </button>
            <button 
              @click="handleInlineDelete($event, item)" 
              class="inline-action-circle delete-btn" 
              title="Delete notification"
            >
              <Trash2 :size="15" />
            </button>
          </div>

          <div class="timestamp-cell">
            <Clock :size="12" class="time-clock-icon" />
            <span>
              {{ new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>

        </div>
      </div>
    </main>

  </div>
</template>

<style scoped>
.gmail-layout-container {
  display: flex;
  background-color: #f6f8fc; 
  min-height: 100vh;
  padding-top: 65px;
  box-sizing: border-box;
}

.gmail-sidebar {
  width: 256px;
  flex-shrink: 0;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
}

.compose-space {
  padding: 8px 12px 16px 12px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #1f1f1f;
  padding: 12px 16px;
  border-radius: 16px;
}

.brand-accent {
  color: #ffb100;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-tab {
  display: flex;
  align-items: center;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0 24px 0 12px;
  height: 32px;
  border-radius: 16px;
  color: #444746;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
}

.nav-tab:hover {
  background-color: #eaebef;
}

.tab-active {
  background-color: #d3e3fd !important;
  color: #041e49 !important;
  font-weight: 700;
}

.tab-label {
  flex-grow: 1;
  margin-left: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.total-badge {
  font-size: 12px;
  color: #5e6266;
}

.unread-count-pill {
  background-color: #b3261e;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
}

.sidebar-divider {
  height: 1px;
  background-color: #e3e3e3;
  margin: 8px 12px;
}

.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 4px;
}
.success-dot { background-color: #10b981; }
.info-dot { background-color: #3b82f6; }

.gmail-main-pane {
  flex-grow: 1;
  margin: 8px 16px 16px 0;
  background-color: #ffffff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  overflow: hidden;
}

.toolbar-ribbon {
  height: 48px;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f3f4;
}

.icon-action-btn {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #444746;
  cursor: pointer;
  border-radius: 6px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.icon-action-btn:hover {
  background-color: #f8fafc;
  border-color: #94a3b8;
  color: #1e293b;
}

.pagination-meta {
  font-size: 12px;
  color: #5e6266;
}

.mailbox-list-frame {
  flex-grow: 1;
  overflow-y: auto;
}

.gmail-row {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 40px;
  border-bottom: 1px solid #f2f6fc;
  cursor: pointer;
  position: relative;
  gap: 16px;
  background-color: #ffffff;
  transition: box-shadow 0.15s, background-color 0.15s;
}

.gmail-row:hover {
  box-shadow: inset 1px 0 0 #ffb100, inset -1px 0 0 #f2f6fc, 0 1px 3px 1px rgba(60,64,67,.15);
  background-color: #f7f9fc;
  z-index: 1;
}

.unread-gmail-row {
  background-color: #f2f6fc;
}

.unread-gmail-row .sender-title-text,
.unread-gmail-row .message-paragraph {
  font-weight: 700;
  color: #1f1f1f;
}

.meta-markers {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 24px;
  flex-shrink: 0;
}

.status-marker-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #cbd5e1;
}
.status-marker-dot.success { background-color: #10b981; }
.status-marker-dot.info { background-color: #3b82f6; }

.unread-indicator-bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #0b57d0; 
}

.sender-domain-box {
  width: 180px;
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sender-title-text {
  font-size: 14px;
  color: #444746;
}

.snippet-content-cell {
  flex-grow: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-right: 80px;
}

.message-paragraph {
  margin: 0;
  font-size: 14px;
  color: #5e6266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timestamp-cell {
  font-size: 12px;
  color: #5e6266;
  width: 70px;
  text-align: right;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.time-clock-icon {
  color: #94a3b8;
}

.inline-hover-actions {
  display: none;
  position: absolute;
  right: 86px;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(90deg, rgba(247,249,252,0) 0%, #f7f9fc 25%, #f7f9fc 100__);
  padding-left: 32px;
  height: 100%;
  align-items: center;
  gap: 6px;
}

.gmail-row:hover .inline-hover-actions {
  display: flex;
}

.inline-action-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #444746;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.inline-action-circle:hover {
  background-color: #e1e3e6;
  color: #1f1f1f;
}

.delete-btn:hover {
  background-color: #fde8e8; 
  color: #e11d48;
}
.gmail-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  color: #747775;
}

.empty-vector {
  color: #c4c7c5;
  margin-bottom: 12px;
}

.gmail-empty-state p {
  font-size: 14px;
  margin: 0;
}
</style>