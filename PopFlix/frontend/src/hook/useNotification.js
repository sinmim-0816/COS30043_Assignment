import { ref, computed } from 'vue';
import { io } from 'socket.io-client';
import { notificationService } from '../services/notificationService';

const notifications = ref([]);
const isConnected = ref(false);
let socket = null;
let activeUserId = null;

const getSocketBaseUrl = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    return apiBaseUrl.replace(/\/api\/?$/, '');
};

const mergeNotificationHistory = (history = []) => {
    const existingIds = new Set(notifications.value.map((notification) => notification.id));
    const merged = [...notifications.value];

    history.forEach((notification) => {
        if (!existingIds.has(notification.id)) {
            merged.push(notification);
        }
    });

    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    notifications.value = merged;
};

const loadNotificationHistory = async (userId) => {
    const history = await notificationService.getNotificationHistory(userId);
    mergeNotificationHistory(history);
};

export function useNotifications() {
    const unreadCount = computed(() => {
        return notifications.value.filter(n => !n.isRead).length;
    });

    const initNotificationSystem = async (userId) => {
        if (!userId) return;
        activeUserId = userId;

        try {
            await loadNotificationHistory(userId);
        } catch (err) {
            console.error('Failed to pull notification records history:', err);
        }

        if (socket) socket.disconnect();

        socket = io(`${getSocketBaseUrl()}/notifications`, {
            query: { userId: String(userId) },
            autoConnect: true,
        });

        socket.on('connect', () => {
            isConnected.value = true;
            console.log('Real-time notification socket pipeline established.');

            if (activeUserId) {
                loadNotificationHistory(activeUserId).catch((err) => {
                    console.error('Failed to resync notifications after socket connect:', err);
                });
            }
        });

        socket.on('disconnect', () => {
            isConnected.value = false;
        });

        socket.on('notification_received', (newNotification) => {
            notifications.value.unshift(newNotification);
        });
    };

    const disconnectNotifications = () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        notifications.value = [];
        isConnected.value = false;
        activeUserId = null;
    };

    const readNotification = async (notificationItem) => {
        if (notificationItem.isRead) return;
        try {
            notificationItem.isRead = true;
            await notificationService.markAsRead(notificationItem.id);
        } catch (err) {
            console.error('Failed to mark target line item read:', err);
        }
    };

    const readAllNotifications = async (userId) => {
        if (unreadCount.value === 0) return;
        try {
            notifications.value.forEach(n => n.isRead = true);
            await notificationService.markAllAsRead(userId);
        } catch (err) {
            console.error('Bulk update notification clearance error:', err);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            notifications.value = notifications.value.filter(n => n.id !== notificationId);
            await notificationService.deleteNotification(notificationId);
        } catch (err) {
            console.error(`Failed to delete target notification record ${notificationId}:`, err);
        }
    };

    return {
        notifications,
        unreadCount,
        isConnected,
        initNotificationSystem,
        disconnectNotifications,
        readNotification,
        readAllNotifications,
        deleteNotification,
    };
}
