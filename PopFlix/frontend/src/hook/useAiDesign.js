import { ref } from 'vue';
import { aiDesignService } from '../services/aiDesignService';

export function useAiDesign() {
    const isAiDesigning = ref(false);
    const aiDesignError = ref(null);

    const generateTicketDesign = async (payload) => {
        isAiDesigning.value = true;
        aiDesignError.value = null;

        try {
            const response = await aiDesignService.generateTicketDesign(payload);
            return response.data;
        } catch (err) {
            aiDesignError.value = err;
            throw err;
        } finally {
            isAiDesigning.value = false;
        }
    };

    return {
        generateTicketDesign,
        isAiDesigning,
        aiDesignError
    };
}
