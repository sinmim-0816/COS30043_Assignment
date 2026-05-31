import { ref } from 'vue';
import { authService } from '../services/authService';

export function useRegister() {
    const isLoading = ref(false);
    const errorMessage = ref('');

    const handleRegister = async (formData) => {
        isLoading.value = true;
        errorMessage.value = '';
        try {
            return await authService.register(formData);
        } catch (err) {
            if (typeof err === 'object') {
                errorMessage.value = err;
            } else {
                errorMessage.value = { general: err };
            }
            return null;
        } finally {
            isLoading.value = false;
        }
    };

    return { handleRegister, isLoading, errorMessage };
}