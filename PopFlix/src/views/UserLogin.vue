<script setup>
import { ref, onMounted } from 'vue';
import { Mail, Lock, Eye, EyeOff, Info, CheckCircle } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// Import other hook and components
import { useLogin } from '@/hook/useLogin';
import AuthLayout from '@/components/AuthLayout.vue';

const { email, password, isLoading, errorMessage, handleLogin } = useLogin();
const showPassword = ref(false);

const route = useRoute();
const router = useRouter();

const showAuthBadge = ref(false);
const authMessage = ref('');
const isSuccess = ref(false);

onMounted(() => {
    if (route.query.reason === 'auth_required') {
        authMessage.value = 'Please sign in to access this page';
        isSuccess.value = false;
        showAuthBadge.value = true;
        router.replace({ query: {} });
    }
    else if (window.history.state?.successMessage) {
        authMessage.value = window.history.state.successMessage;
        isSuccess.value = true;
        showAuthBadge.value = true;
        window.history.replaceState({}, document.title);
    }
    else if (window.history.state?.errorMessage) {
        authMessage.value = window.history.state.errorMessage;
        isSuccess.value = false;
        showAuthBadge.value = true;
        window.history.replaceState({}, document.title);
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

                <span class="badge-text">{{ authMessage }}</span>
            </div>
        </div>
    </v-snackbar>
    <AuthLayout>
        <v-card flat class="login-card bg-transparent" width="450" height="100vh">

            <div class="text-center text-md-left">
                <h3 class="mt-2 fw-bold">Welcome Back</h3>
                <p class="text-grey-darken-1 mt-2">
                    Enter your credentials to access your account.
                </p>
            </div>

            <v-form @submit.prevent="handleLogin">
                <label class="premium-label">Email Address</label>
                <div class="input-group mb-3">
                    <v-text-field v-model="email" placeholder="you@example.com" variant="outlined" density="comfortable"
                        rounded="lg" color="red-accent-3" class="mt-2" hide-details>
                        <template v-slot:prepend-inner>
                            <Mail size="18" class="text-grey" />
                        </template>
                    </v-text-field>
                </div>

                <label class="premium-label">Password</label>
                <div class="input-group mb-8">
                    <v-text-field v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
                        variant="outlined" density="comfortable" rounded="lg" color="red-accent-3"
                        class="mt-2" hide-details>
                        <template v-slot:prepend-inner>
                            <Lock size="18" class="text-grey" />
                        </template>
                        <template v-slot:append-inner>
                            <div @click="showPassword = !showPassword" class="d-flex align-center">
                                <component :is="showPassword ? Eye : EyeOff" size="18" class="text-grey hover-red" />
                            </div>
                        </template>
                    </v-text-field>
                </div>

                <div class="d-flex justify-end my-3">
                    <router-link to="/forgot-password" class="text-caption text-grey hover-red">Forgot Password?</router-link>
                </div>

                <v-btn block color="red-accent-3" height="54" class="login-btn mb-3" @click="handleLogin"
                    :loading="isLoading" type="submit">
                    Sign In
                </v-btn>
                <p v-if="errorMessage" class="error">
                    <Info size="20" class="me-2" />{{ errorMessage }}
                </p>
            </v-form>

            <div class="text-center mt-1">
                <p class="text-grey text-caption">
                    Don't have an account?
                    <router-link to="/register" class="text-red-accent-3 font-weight-bold ms-1">Register
                        here</router-link>
                </p>
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