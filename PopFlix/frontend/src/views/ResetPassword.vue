<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResetPassword } from '../hook/useResetPassword';
import AuthLayout from '@/components/AuthLayout.vue';
import { Lock, Info, Eye, EyeOff, Check, X } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const { handleReset, isLoading, errorMessage, verifyToken } = useResetPassword();

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConPassword = ref(false);
const isTypingPassword = ref(false);

const isCheckingToken = ref(true);
const isTokenValid = ref(false);
const tokenError = ref('');

const token = route.query.token;
const isConfirmMatch = computed(() => password.value && password.value === confirmPassword.value);

const reqs = computed(() => ({
    length: password.value.length >= 8,
    case: /[a-z]/.test(password.value) && /[A-Z]/.test(password.value),
    number: /\d/.test(password.value),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password.value)
}));

const isPassValid = computed(() => {
    return Object.values(reqs.value).every(Boolean);
});

const strengthWidth = computed(() => {
    const count = Object.values(reqs.value).filter(Boolean).length;
    return (count / 4) * 100 + '%';
});

const strengthColor = computed(() => {
    const count = Object.values(reqs.value).filter(Boolean).length;
    if (count <= 1) return '#ff4d4d';
    if (count <= 2) return '#ffa500';
    return '#4caf50';
});

const strengthText = computed(() => {
    const count = Object.values(reqs.value).filter(Boolean).length;
    if (count === 0) return '';
    if (count === 1) return 'Weak';
    if (count === 2) return 'Fair';
    if (count === 3) return 'Good';
    return 'Strong';
});

const passwordError = computed(() => {
    if (password.value.length > 0 && !isPassValid.value) {
        return 'Password does not meet requirements';
    }
    return '';
});

onMounted(async () => {
    if (!token) {
        isCheckingToken.value = false;
        isTokenValid.value = false;
        tokenError.value = "No reset token provided in the link.";
        router.push({
            path: '/login',
            state: { errorMessage: tokenError.value }
        });
        return;
    }

    try {
        if (verifyToken) {
            await verifyToken(token);
        }
        isTokenValid.value = true;
    } catch (error) {
        isTokenValid.value = false;
        const msg = error.response?.data?.message || errorMessage.value || "This reset link is invalid or has expired.";
        
        router.replace({
            path: '/login',
            state: { errorMessage: msg } 
        });
    } finally {
        isCheckingToken.value = false;
    }
});

const submit = async () => {
    if (!isConfirmMatch.value) {
        errorMessage.value = "Passwords do not match";
        return;
    }

    if (!isPassValid.value) {
        errorMessage.value = "Password does not meet requirements";
        return;
    }

    try {
        await handleReset(token, password.value);
        router.push({
            path: '/login',
            state: { successMessage: 'Password successfully reset! Please login.' }
        });
    } catch (e) {
        console.log("Error reset Password:", e)
    }
};
</script>

<template>
    <AuthLayout>
        <v-card flat class="login-card bg-transparent" width="450" height="100vh">
            <div class="text-center text-md-left">
                <h3 class="mt-4 fw-bold">Set New Password</h3>
                <p class="text-grey-darken-1 mt-2">
                    Enter your new password below.
                </p>
            </div>

            <v-form @submit.prevent="submit">
                <label class="premium-label mb-2">New Password</label>
                <div class="input-group">
                    <v-text-field v-model="password" :type="showPassword ? 'text' : 'password'"
                        @focus="isTypingPassword = true" @blur="isTypingPassword = false" placeholder="••••••••"
                        variant="outlined" density="comfortable" rounded="lg" color="red-accent-3" hide-details>
                        <template v-slot:prepend-inner>
                            <Lock size="18" class="text-grey" />
                        </template>
                        <template v-slot:append-inner>
                            <div class="d-flex align-center gap-2">
                                <Check v-if="isPassValid" size="18" class="text-green" />
                                <X v-if="password.length > 0 && !isPassValid" size="18" class="text-red" />
                                <component :is="showPassword ? Eye : EyeOff" size="18"
                                    class="text-grey hover-red cursor-pointer" @click="showPassword = !showPassword" />
                            </div>
                        </template>
                    </v-text-field>
                </div>
                <p v-if="passwordError" class="text-red text-caption">
                    <span>
                        <Info size="16" class="me-2" />
                    </span>{{ passwordError }}
                </p>

                <v-expand-transition>
                    <div v-if="isTypingPassword || password.length > 0">
                        <div class="strength-container mb-4 mt-2">
                            <div class="d-flex justify-end align-center mb-1">
                                <span class="text-caption font-weight-bold" :style="{ color: strengthColor }">
                                    {{ strengthText }}
                                </span>
                            </div>
                            <div class="strength-meter">
                                <div class="strength-bar"
                                    :style="{ width: strengthWidth, backgroundColor: strengthColor }">
                                </div>
                            </div>
                        </div>

                        <!-- Requirements List -->
                        <ul class="requirements-list">
                            <li :class="{ 'valid': reqs.length }">
                                <Check size="14" /> At least 8 characters
                            </li>
                            <li :class="{ 'valid': reqs.case }">
                                <Check size="14" /> Mix of upper and lower case
                            </li>
                            <li :class="{ 'valid': reqs.number }">
                                <Check size="14" /> At least one number
                            </li>
                            <li :class="{ 'valid': reqs.symbol }">
                                <Check size="14" /> At least one symbol (eg. &%$#)
                            </li>
                        </ul>
                    </div>
                </v-expand-transition>

                <label class="premium-label mb-2 mt-4">Confirm New Password</label>
                <div class="input-group">
                    <v-text-field v-model="confirmPassword" :type="showConPassword ? 'text' : 'password'"
                        placeholder="••••••••" variant="outlined" density="comfortable" rounded="lg"
                        color="red-accent-3" hide-details>
                        <template v-slot:prepend-inner>
                            <Lock size="18" class="text-grey" />
                        </template>
                        <template v-slot:append-inner>
                            <div class="d-flex align-center gap-2">
                                <Check v-if="isConfirmMatch.value" size="18" class="text-green" />
                                <X v-if="confirmPassword.length > 0 && !isConfirmMatch.value" size="18" class="text-red" />
                                <component :is="showConPassword ? Eye : EyeOff" size="18"
                                    class="text-grey hover-red cursor-pointer"
                                    @click="showConPassword = !showConPassword" />
                            </div>
                        </template>
                    </v-text-field>
                </div>
                <p v-if="errorMessage" class="text-red text-caption">
                    <span>
                        <Info size="16" class="me-2" />
                    </span>{{ errorMessage }}
                </p>
                <v-btn block color="red-accent-3" height="54" class="login-btn mb-3 mt-4" :loading="isLoading"
                    type="submit">
                    Update Password
                </v-btn>

                <div class="text-center mt-3 d-flex flex-row justify-center">
                    <p class="text-grey text-caption">
                        Remembered it?
                    </p>
                    <router-link to="/login" class="text-grey text-decoration-none hover-red ms-2 p-0">Login
                    </router-link>
                </div>
            </v-form>
        </v-card>
    </AuthLayout>
</template>

<style scoped>
.strength-bar {
    height: 100%;
    transition: width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.4s ease;
}

.requirements-list {
    list-style: none;
    padding: 0;
    font-size: 12px;
    color: #888;
    margin-top: 10px;
}

.requirements-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.requirements-list li.valid {
    color: #4caf50;
}
</style>