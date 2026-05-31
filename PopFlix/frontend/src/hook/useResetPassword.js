import { ref } from 'vue';
import { authService } from '../services/authService';

export const useResetPassword = () => {
    const isLoading = ref(false);
    const errorMessage = ref('');

    const verifyToken = async (token) => {
        isLoading.value = true;
        errorMessage.value = '';
        try {
            return await authService.verifyResetToken(token);
        } catch (e) {
            errorMessage.value = e.response?.data?.message || "Invalid or expired reset link.";
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    const handleReset = async (token, newPassword) => {
        isLoading.value = true;
        errorMessage.value = '';
        try {
            return await authService.resetPassword(token, newPassword);
        } catch (e) {
            errorMessage.value = e.response?.data?.message || "Failed to reset password";
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    return { handleReset, isLoading, errorMessage, verifyToken };
};