import {ref} from 'vue';
import { getExperiencesByKey } from '@/services/movieExperience';

export function useExperience(){
    const items=ref([]);
    const loading=ref(false);

    const loadExperiences=async(key)=>{
        loading.value=true;
        items.value=await getExperiencesByKey(key);
        loading.value=false;
    };

    return {items,loading, loadExperiences};
}