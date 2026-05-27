import { ref } from 'vue';
import { getExperiencesByKey, getAllExperiencesFromApi } from '@/services/movieExperience';

export function useExperience() {
    const items = ref([]);
    const loading = ref(false);

    const loadExperiences = async (key) => {
        loading.value = true;
        items.value = await getExperiencesByKey(key);
        loading.value = false;
    };

    const loadAllExperiences = async () => {
        loading.value = true;
        const allData = await getAllExperiencesFromApi();
        loading.value = false;
        return allData;
    };

    return { items, loading, loadExperiences, loadAllExperiences };
}