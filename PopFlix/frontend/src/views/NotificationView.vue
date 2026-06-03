<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  Inbox, 
  CircleAlert, 
  MailOpen, 
  Check, 
  Clock, 
  Trash2,
  Search,
  X,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';

// Import other hook and components
import { useAuthStore } from '../stores/auth';
import { useNotifications } from '../hook/useNotification';
import { useAppI18n } from '../utils/i18n';
import FooterView from '@/components/FooterView.vue';

const authStore = useAuthStore();
const router=useRouter();
const userId = computed(() => authStore.user?.id);
const isDarkTheme = ref(false);
const themeObserver = ref(null);

const { 
  notifications, 
  readNotification, 
  readAllNotifications,
  deleteNotification,
  unreadCount 
} = useNotifications();

const { t } = useAppI18n();

const activeFilter = ref('all');
const searchQuery = ref('');

const syncThemeState = () => {
  isDarkTheme.value =
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark';
};

onMounted(() => {
  syncThemeState();
  themeObserver.value = new MutationObserver(() => syncThemeState());
  themeObserver.value.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
});

onUnmounted(() => {
  themeObserver.value?.disconnect();
});

const filteredNotifications = computed(() => {
  let result = notifications.value;

  if (activeFilter.value === 'unread') {
    result = result.filter(n => !n.isRead);
  } else if (activeFilter.value === 'success' || activeFilter.value === 'info') {
    result = result.filter(n => n.type === activeFilter.value);
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.message.toLowerCase().includes(query)
    );
  }

  return result;
});

const highlightText = (text, search) => {
  if (!search || !search.trim() || !text) return text;
  
  const query = search.trim();
  const escapedQuery = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  return text.replace(regex, '<span class="highlight-match">$1</span>');
};

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

const clearSearch = () => {
  searchQuery.value = '';
};
</script>

<template>
    <v-app>
  <div :class="['gmail-layout-container', isDarkTheme ? 'theme-dark' : 'theme-light']">
    
    <aside class="gmail-sidebar">
      <div class="compose-space">
          <div class="sidebar-brand">
            <span class="fw-bold">{{ t('notifications.inboxTitle') }}</span>
          </div>
      </div>

      <nav class="sidebar-nav">
        <button 
          class="nav-tab" 
          :class="{ 'tab-active': activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          <Inbox :size="18" />
          <span class="tab-label">{{ t('notifications.allNotifications') }}</span>
          <span class="total-badge">{{ notifications.length }}</span>
        </button>

        <button 
          class="nav-tab" 
          :class="{ 'tab-active': activeFilter === 'unread' }"
          @click="activeFilter = 'unread'"
        >
          <CircleAlert :size="18" />
          <span class="tab-label">{{ t('notifications.unread') }}</span>
          <span v-if="unreadCount > 0" class="unread-count-pill">{{ unreadCount }}</span>
        </button>

        <div class="sidebar-divider"></div>
      </nav>
    </aside>

    <main class="gmail-main-pane">
      
      <div class="toolbar-ribbon">
        <div class="d-flex flex-row w-100 gap-2">
          <button 
            v-if="unreadCount > 0"
            @click="readAllNotifications(userId)" 
            class="icon-action-btn" 
            :title="t('notifications.markAllReadTitle')"
          >
            <MailOpen :size="18" />
            <span>{{ t('notifications.markAllRead') }}</span>
          </button>
          <div class="search-wrapper">
            <Search :size="16" class="search-icon" />
            <input 
              v-model="searchQuery" 
              type="text" 
              :placeholder="t('notifications.searchPlaceholder')" 
              class="search-input"
            />
            <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
              <X :size="14" />
            </button>
          </div>
        </div>

        <div class="d-flex justify-end w-100">
          <span class="pagination-meta">
            {{ t('notifications.showingEntries', { count: filteredNotifications.length }) }}
          </span>
        </div>
      </div>

      <div class="mailbox-list-frame">
        <div v-if="filteredNotifications.length === 0" class="gmail-empty-state">
          <Inbox :size="40" class="empty-vector" />
          <p v-if="searchQuery">{{ t('notifications.noMatches', { query: searchQuery }) }}</p>
          <p v-else>{{ t('notifications.emptyInbox') }}</p>
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
            <span class="sender-title-text" v-html="highlightText(item.title, searchQuery)"></span>
          </div>

          <div class="snippet-content-cell">
            <p class="message-paragraph" v-html="highlightText(item.message, searchQuery)"></p>
          </div>

          <div class="inline-hover-actions">
            <button 
              v-if="!item.isRead"
              @click="handleInlineReadToggle($event, item)" 
              class="inline-action-circle" 
              :title="t('notifications.markAsRead')"
            >
              <Check :size="15" />
            </button>
            <button 
              @click="handleInlineDelete($event, item)" 
              class="inline-action-circle delete-btn" 
              :title="t('notifications.deleteNotification')"
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
  <FooterView/>
  </v-app>
</template>

<style scoped>
.gmail-layout-container {
  display: flex;
  background: var(--notification-bg);
  color: var(--notification-text);
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
  color: var(--notification-text);
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--notification-surface);
  border: 1px solid var(--notification-border);
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
  color: var(--notification-text-soft);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
}

.nav-tab:hover {
  background-color: var(--notification-hover);
}

.tab-active {
  background-color: var(--notification-accent-soft) !important;
  color: var(--notification-accent) !important;
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
  color: var(--notification-text-muted);
}

.unread-count-pill {
  background-color: var(--notification-unread);
  color: var(--card-bg) !important;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
}

.sidebar-divider {
  height: 1px;
  background-color: var(--notification-divider);
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
  background: var(--notification-surface);
  display: flex;
  flex-direction: column;
  box-shadow: var(--notification-shadow);
  overflow: hidden;
  border: 1px solid var(--notification-border);
}

.toolbar-ribbon {
  height: 48px;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--notification-divider);
  background: var(--notification-toolbar-bg);
}

.icon-action-btn {
  background: transparent;
  border: 1px solid var(--notification-border);
  color: var(--notification-text-soft);
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
  background-color: var(--notification-hover);
  border-color: var(--notification-divider);
  color: var(--notification-text);
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 400px;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #5e6266;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 36px;
  background-color: #f1f3f4;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0 36px;
  font-size: 14px;
  color: #1f1f1f;
  transition: all 0.15s ease;
  outline: none;
}

.search-input:focus {
  background-color: #ffffff;
  border-color: #0b57d0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: #5e6266;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
}
.clear-search-btn:hover { background-color: #e8eaed; color: #1f1f1f; }

.pagination-meta {
  font-size: 12px;
  color: var(--notification-text-muted);
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
  border-bottom: 1px solid var(--notification-divider);
  cursor: pointer;
  position: relative;
  gap: 16px;
  background-color: var(--notification-surface);
  transition: box-shadow 0.15s, background-color 0.15s;
}

.gmail-row:hover {
  box-shadow: inset 1px 0 0 var(--notification-accent), inset -1px 0 0 var(--notification-divider), 0 1px 3px 1px rgba(60,64,67,.15);
  background-color: var(--notification-hover-strong);
  z-index: 1;
}

.unread-gmail-row {
  background-color: var(--notification-accent-soft);
}

.unread-gmail-row .sender-title-text,
.unread-gmail-row .message-paragraph {
  font-weight: 700;
  color: var(--notification-text);
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
  background-color: var(--notification-divider);
}
.status-marker-dot.success { background-color: var(--notification-success); }
.status-marker-dot.info { background-color: var(--notification-info); }

.unread-indicator-bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--notification-unread); 
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
  color: var(--notification-text-soft);
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
  color: var(--notification-text-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timestamp-cell {
  font-size: 12px;
  color: var(--notification-text-muted);
  width: 70px;
  text-align: right;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.time-clock-icon {
  color: var(--notification-text-muted);
}

.inline-hover-actions {
  display: none;
  position: absolute;
  right: 86px;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(90deg, rgba(247,249,252,0) 0%, var(--notification-surface) 25%, var(--notification-surface) 100%);
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
  color: var(--notification-text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.inline-action-circle:hover {
  background-color: var(--notification-hover);
  color: var(--notification-text);
}

.delete-btn:hover {
  background-color: rgba(225, 29, 72, 0.1); 
  color: #e11d48;
}
.gmail-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  color: var(--notification-text-muted);
}

.empty-vector {
  color: var(--notification-text-muted);
  margin-bottom: 12px;
}

.gmail-empty-state p {
  font-size: 14px;
  margin: 0;
}

.gmail-layout-container.theme-dark .sidebar-brand,
.gmail-layout-container.theme-dark .gmail-main-pane,
.gmail-layout-container.theme-dark .nav-tab,
.gmail-layout-container.theme-dark .icon-action-btn,
.gmail-layout-container.theme-dark .gmail-row,
.gmail-layout-container.theme-dark .inline-action-circle {
  backdrop-filter: blur(14px);
}
:deep(.highlight-match) {
  background-color: rgba(255, 177, 0, 0.3); 
  color: #b45309;
  font-weight: 700;
  border-radius: 2px;
  padding: 0 2px;
}

.theme-dark :deep(.highlight-match) {
  background-color: rgba(254, 240, 138, 0.25); 
  color: #fef08a;
}

@media (max-width: 1024px) {
  .gmail-layout-container {
    flex-direction: column;
    padding-top: 56px;
  }

  .gmail-sidebar {
    width: 100%;
    padding: 10px 12px 0;
  }

  .compose-space {
    padding: 0 0 10px;
  }

  .sidebar-brand {
    padding: 12px 14px;
    border-radius: 14px;
  }

  .sidebar-nav {
    flex-direction: row;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 10px;
    scrollbar-width: none;
  }

  .sidebar-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-tab {
    width: auto;
    min-width: 170px;
    flex-shrink: 0;
    height: 40px;
    padding: 0 16px;
    border: 1px solid var(--notification-border);
    background: var(--notification-surface);
  }

  .tab-label {
    white-space: nowrap;
  }

  .sidebar-divider {
    display: none;
  }

  .gmail-main-pane {
    margin: 8px 12px 12px;
    min-height: 0;
  }

  .toolbar-ribbon {
    height: auto;
    padding: 12px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .toolbar-ribbon .d-flex.flex-row.w-100.gap-2 {
    flex-wrap: wrap;
    gap: 10px !important;
  }

  .icon-action-btn {
    width: 100%;
    justify-content: center;
  }

  .search-wrapper {
    max-width: none;
    width: 100%;
  }

  .pagination-meta {
    width: 100%;
    text-align: left;
  }

  .mailbox-list-frame {
    overflow-x: hidden;
  }

  .gmail-row {
    height: auto;
    min-height: 56px;
    align-items: flex-start;
    padding: 12px 14px;
    gap: 10px;
    flex-wrap: wrap;
  }

  .meta-markers {
    width: auto;
    padding-top: 5px;
  }

  .sender-domain-box {
    width: auto;
    min-width: 0;
    flex: 1 1 100%;
    order: 1;
    padding-left: 0;
  }

  .snippet-content-cell {
    flex: 1 1 100%;
    order: 2;
    padding-right: 0;
    padding-left: 32px;
  }

  .inline-hover-actions {
    display: flex;
    position: static;
    transform: none;
    order: 3;
    width: auto;
    margin-left: auto;
    padding-left: 0;
    height: auto;
    background: none;
  }

  .timestamp-cell {
    order: 4;
    width: auto;
    margin-left: auto;
  }

  .gmail-row:hover .inline-hover-actions {
    display: flex;
  }
}

@media (max-width: 640px) {
  .gmail-layout-container {
    padding-top: 52px;
  }

  .gmail-sidebar {
    padding: 8px 10px 0;
  }

  .sidebar-brand {
    font-size: 14px;
  }

  .nav-tab {
    min-width: 150px;
    height: 38px;
    padding: 0 14px;
    font-size: 13px;
  }

  .tab-label {
    margin-left: 10px;
  }

  .gmail-main-pane {
    margin: 6px 10px 10px;
  }

  .toolbar-ribbon {
    padding: 10px;
  }

  .icon-action-btn {
    font-size: 12px;
    padding: 8px 10px;
  }

  .search-input {
    height: 38px;
    font-size: 13px;
  }

  .gmail-row {
    padding: 12px 12px 10px;
    border-radius: 14px;
    margin-bottom: 8px;
    border: 1px solid var(--notification-border);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .gmail-row:hover {
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  }

  .sender-title-text,
  .message-paragraph {
    font-size: 13px;
    white-space: normal;
    line-height: 1.35;
  }

  .snippet-content-cell {
    padding-left: 0;
  }

  .inline-hover-actions {
    margin-left: 0;
    gap: 8px;
  }

  .inline-action-circle {
    width: 30px;
    height: 30px;
  }

  .timestamp-cell {
    font-size: 11px;
  }

  .gmail-empty-state {
    padding: 60px 18px;
  }
}
</style>
