<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-vue-next';
import { useActivate } from '../hook/useActivate';
import AuthLayout from '@/components/AuthLayout.vue';
import { useAppI18n } from '../utils/i18n';

const route = useRoute();
const router = useRouter();
const { isLoading, isSuccess, message, activate } = useActivate();
const { t, locale } = useAppI18n();
const localeCopy = {
    en: { activationSuccess: 'You can now log in to your account.' },
    zh: { activationSuccess: '您现在可以登录您的账户。' },
    ms: { activationSuccess: 'Anda kini boleh log masuk ke akaun anda.' },
};
const authLocale = computed(() => localeCopy[locale.value] || localeCopy.en);

const showAuthBadge = ref(false);

onMounted(async () => {
    const token = route.query.token;
    
    if (token) {
        await activate(token);
        showAuthBadge.value = true;
        if (isSuccess.value) {
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }
    } else {
        message.value = t('auth.noActivationLink');
        isSuccess.value = false;
        showAuthBadge.value = true;
    }
});
</script>

<template>
    <v-snackbar v-model="showAuthBadge" location="top" :timeout="5000" color="transparent" elevation="0" variant="flat"
        class="mt-4">
        <div class="d-flex justify-center w-100">
            <div class="premium-toast-badge d-flex align-center gap-2" :class="isSuccess ? 'success' : 'not-success'">
                <component :is="isSuccess ? CheckCircle : Info" size="20"
                    :class="isSuccess ? 'text-white' : 'text-red'" />
                <span class="badge-text">{{ isSuccess ? t('auth.setupSuccess') : t('auth.verificationFailed') }}</span>
            </div>
        </div>
    </v-snackbar>

    <AuthLayout>
        <v-card flat class="login-card bg-transparent" width="450">
            
            <div class="text-center text-md-left mb-8">
                <h3 class="mt-2 fw-bold">{{ t('auth.activationTitle') }}</h3>
                <p class="text-grey-darken-1 mt-2">
                    {{ isLoading ? t('auth.verifyingIdentity') : t('auth.almostThere') }}
                </p>
            </div>

            <div v-if="isLoading" class="text-center py-10">
                <Loader2 size="48" class="text-red-accent-3 animate-spin mx-auto mb-4" />
                <p class="text-grey">{{ t('auth.communicatingSecurely') }}</p>
            </div>

            <div v-else class="text-center py-5">
                <component 
                    :is="isSuccess ? CheckCircle : AlertCircle" 
                    :size="64" 
                    :class="isSuccess ? 'text-green-500' : 'text-red-500'"
                    class="mx-auto mb-4"
                />
                
                <h3 class="fw-bold mb-2">
                    {{ isSuccess ? t('auth.setupSuccess') : t('auth.verificationFailed') }}
                </h3>
                <p class="text-grey-darken-1 mb-6">
                    {{ isSuccess ? authLocale.value.activationSuccess : message }}
                </p>

                <v-btn 
                    block 
                    color="red-accent-3" 
                    height="54" 
                    class="login-btn text-white" 
                    to="/login"
                >
                    {{ isSuccess ? t('auth.loginNow') : t('auth.backToHome') }}
                </v-btn>
            </div>
        </v-card>
    </AuthLayout>
</template>

<style scoped>
.premium-toast-badge {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 10px 20px;
    border-radius: 50px;
    color: white;
    margin-top: 20px;
    animation: slideDownFade 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.not-success {
    background: rgba(61, 1, 12, 0.85);
    border: 1px solid rgba(255, 82, 82, 0.25);
}

.success {
    background: rgba(12, 135, 29, 0.85);
    border: 1px solid rgba(1, 61, 9, 0.85);
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes slideDownFade {
    from {
        transform: translateY(-20px) scale(0.95);
        opacity: 0;
    }
    to {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
}
.login-card{
    height: 100vh;
}
</style>
