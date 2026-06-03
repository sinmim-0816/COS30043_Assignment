<script setup>
import { ref } from 'vue';
import { Mail, Info, CheckCircle } from 'lucide-vue-next';
import { useAppI18n } from '../utils/i18n';

// Import other hook and component
import AuthLayout from '@/components/AuthLayout.vue';
import { useForgotPassword } from '../hook/useForgotPassword';

const { t } = useAppI18n();
const { handleForgotPassword, isLoading } = useForgotPassword();
const email = ref('');

// Feedback state
const showBadge = ref(false);
const message = ref('');
const isSuccess = ref(false);

const sendResetLink = async () => {
    try {
        await handleForgotPassword(email.value);
        message.value = t('auth.resetLinkSent');
        isSuccess.value = true;
    } catch (e) {
        message.value = t('auth.resetLinkFailed');
        console.error("Error send the link:",e);
        isSuccess.value = false;
    } finally {
        showBadge.value = true;
    }
};
</script>

<template>
    <v-snackbar v-model="showBadge" location="top" :timeout="5000" color="transparent" elevation="0" variant="flat"
        class="mt-4">
        <div class="d-flex justify-center w-100">
            <div class="premium-toast-badge d-flex align-center gap-2" :class="isSuccess ? 'success' : 'not-success'">
                <component :is="isSuccess ? CheckCircle : Info" size="20"
                    :class="isSuccess ? 'text-white' : 'text-red'" />
                <span class="badge-text">{{ message }}</span>
            </div>
        </div>
    </v-snackbar>

    <AuthLayout>
            <v-card flat class="login-card bg-transparent" width="450" height="100vh">
            <div class="text-center text-md-left">
                <h3 class="mt-2 fw-bold">{{ t('auth.forgotTitle') }}</h3>
                <p class="text-grey-darken-1 mt-2">
                    {{ t('auth.forgotSubtitle') }}
                </p>
            </div>

            <v-form @submit.prevent="sendResetLink" class="mt-6">
                <label class="premium-label mt-3">{{ t('auth.emailAddress') }}</label>
                <div class="input-group mb-6">
                    <v-text-field v-model="email" placeholder="you@example.com" variant="outlined" density="comfortable"
                        rounded="lg" color="red-accent-3" class="mt-2" hide-details>
                        <template v-slot:prepend-inner>
                            <Mail size="18" class="text-grey" />
                        </template>
                    </v-text-field>
                </div>

                <v-btn block color="red-accent-3" height="54" class="login-btn mt-5 " :loading="isLoading"
                    type="submit">
                    {{ t('auth.sendResetLink') }}
                </v-btn>
            </v-form>

            <div class="text-center mt-3 d-flex flex-row justify-center">
                <p class="text-grey text-caption">
                    {{ t('auth.rememberedIt') }}
                </p>
                <router-link to="/login" class="text-grey text-decoration-none hover-red ms-2 p-0">{{ t('auth.signIn') }}</router-link>
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
</style>
