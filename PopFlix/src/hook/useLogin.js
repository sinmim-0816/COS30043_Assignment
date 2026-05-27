import {ref} from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter, useRoute } from 'vue-router';

export function useLogin(){
    const authStore=useAuthStore();
    const router=useRouter();
    const route=useRoute();

    const email=ref('');
    const password=ref('');
    const isLoading=ref(false);
    const errorMessage=ref(null);

    const handleLogin=async()=>{
        isLoading.value=true;
        errorMessage.value=null;

        try{
            await authStore.login(email.value, password.value);
            const redirectPath=route.query.redirect || '/';
            router.push(redirectPath);
        }catch(err){
            errorMessage.value = "Incorrect email or password.";
        }finally{
            isLoading.value=false;
        }
    };

    return{
        email, password, isLoading, errorMessage, handleLogin
    }
}