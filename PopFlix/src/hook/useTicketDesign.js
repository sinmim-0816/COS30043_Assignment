import { ref } from 'vue';
import { ticketDesignService } from '@/services/ticketDesignService';

export function useTicketDesign() {
    const isLoading = ref(false);
    const error = ref(null);

    const save = async (bookingId, designImage, description) => {
        isLoading.value = true;
        try {
            return await ticketDesignService.saveDesign({
                booking_id: String(bookingId),
                design_image: designImage,
                description: description
            });
        } catch (err) {
            error.value = err;
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    return { save, isLoading, error };
}