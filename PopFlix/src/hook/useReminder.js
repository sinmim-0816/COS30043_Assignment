import { ref } from 'vue';
import { reminderService } from '@/services/reminderService';

export const useReminders = () => {
    const isProcessing = ref(false);
    const hasReminder = ref(false);

    const checkReminderStatus = async (movieId) => {
        try {
            const response = await reminderService.checkReminder(movieId);
            hasReminder.value = response.data.exists;
        } catch (error) {
            // If the backend returns 404, interpret as "no reminder"
            const status = error?.response?.status;
            if (status === 404) {
                hasReminder.value = false;
            } else {
                console.error("Failed to check reminder status", error);
            }
        }
    };

    const setReminder = async (movieId) => {
        isProcessing.value = true;
        try {
            await reminderService.createReminder(movieId);
            hasReminder.value = true;
            return true;
        } catch (error) {
            console.error("Failed to set reminder", error);
            throw error;
        } finally {
            isProcessing.value = false;
        }
    };

    return { isProcessing, hasReminder, checkReminderStatus, setReminder };
};