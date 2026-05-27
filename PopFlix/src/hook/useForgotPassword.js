import { ref } from 'vue';
import { authService } from '@/services/authService';

export const useForgotPassword = () => {
    const isLoading = ref(false);
    const errorMessage = ref('');

    const handleForgotPassword = async (email) => {
        isLoading.value = true;
        errorMessage.value = '';
        try {
            return await authService.forgotPassword(email);
        } catch (e) {
            errorMessage.value = e.response?.data?.message || "Failed to send reset link";
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    return { handleForgotPassword, isLoading, errorMessage };
};