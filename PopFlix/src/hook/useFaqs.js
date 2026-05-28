import { ref, onMounted } from 'vue';
import { faqService } from '@/services/faqService';

export const useFaqs = () => {
    const allFaqs = ref([]);
    const faqCategories = ref([]);
    const isLoadingFaqs = ref(false);
    const errorMessage = ref('');

    const fetchFaqs = async () => {
        isLoadingFaqs.value = true;
        errorMessage.value = '';
        try {
            const data = await faqService.getAllFaqs();
            allFaqs.value = data;

            const uniqueCategories = [...new Set(data.map(faq => faq.category))];
            faqCategories.value = uniqueCategories;

        } catch (e) {
            errorMessage.value = e;
            console.error("Error fetching FAQs:", e);
        } finally {
            isLoadingFaqs.value = false;
        }
    };

    onMounted(() => {
        fetchFaqs();
    });

    return {
        allFaqs,
        faqCategories,
        isLoadingFaqs,
        errorMessage,
        fetchFaqs
    };
};