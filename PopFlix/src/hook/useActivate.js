import { ref } from 'vue';
import { authService } from '@/services/authService';

export function useActivate() {
    const isLoading = ref(false);
    const isSuccess = ref(false);
    const message = ref('');

    const activate = async (token) => {
        if (!token) {
            isSuccess.value = false;
            message.value = "No activation token found.";
            return;
        }

        isLoading.value = true;

        try {
            await authService.activate(token);
            isSuccess.value = true;
            message.value = "Your account has been successfully verified! You can now log in.";
        } catch (error) {
            isSuccess.value = false;
            message.value = typeof error === 'string' ? error : "Activation failed. The link may be expired.";
        } finally {
            isLoading.value = false;
        }
    };

    return {
        isLoading,
        isSuccess,
        message,
        activate
    };
}