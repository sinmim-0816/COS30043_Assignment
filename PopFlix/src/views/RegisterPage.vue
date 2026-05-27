<script setup>
import { reactive, computed, ref, watch } from 'vue';
import { Check, User2, Mail, Phone, Lock, Eye, EyeOff, Info, X } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

// Import other hooks and components
import AuthLayout from '@/components/AuthLayout.vue';
import { useRegister } from '@/hook/useRegister';

const { handleRegister, isLoading, errorMessage } = useRegister();
const router = useRouter();
const submitted = ref(false);

const isFnameValid = computed(() => {
    const regex = /^[A-Za-z\s]+$/;
    return form.firstName.length >= 2 && regex.test(form.firstName);
});

const isLnameValid = computed(() => {
    const regex = /^[A-Za-z\s]+$/;
    return form.lastName.length >= 2 && regex.test(form.lastName);
});
const isEmailValid = computed(() => /.+@.+\..+/.test(form.email));
const isPhoneValid = computed(() => {
    return /^01\d-\d{7,8}$/.test(form.phone);
});
const isConfirmMatch = computed(() => form.password && form.password === form.confirmPassword);
const showPassword = ref(false);
const showConPassword = ref(false);
const isTypingPassword = ref(false);

const form = reactive({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });

watch(() => form.firstName, (newVal) => {
    form.firstName = newVal.replace(/[^A-Za-z\s]/g, '');
});

watch(() => form.lastName, (newVal) => {
    form.lastName = newVal.replace(/[^A-Za-z\s]/g, '');
});

watch(() => form.phone, (newVal) => {
    let value = newVal.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 3) {
        form.phone = value.slice(0, 3) + '-' + value.slice(3);
    } else {
        form.phone = value;
    }
});

const isLetter = (e) => {
    let char = String.fromCharCode(e.keyCode);
    if (/^[A-Za-z\s]+$/.test(char)) return true;
    else e.preventDefault();
};

const isNumber = (e) => {
    if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
    }
};

const reqs = computed(() => ({
    length: form.password.length >= 8,
    case: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password),
    number: /\d/.test(form.password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(form.password)
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

const validationErrors = computed(() => {
    const errors = {};
    if (submitted.value) {
        if (form.firstName.length === 0) errors.firstName = 'First name is required';
        else if (!isFnameValid.value) errors.firstName = 'First name must contain only letters';

        if (form.lastName.length === 0) errors.lastName = 'Last name is required';
        else if (!isLnameValid.value) errors.lastName = 'Last name must contain only letters';

        if (form.email.length === 0) errors.email = 'Email is required';
        else if (!isEmailValid.value) errors.email = 'Invalid email format';

        if (form.phone.length === 0) errors.phone = 'Telephone is required';
        else if (!isPhoneValid.value) errors.phone = 'Invalid phone format (01x-xxxxxxx)';

        if (form.password.length === 0) errors.password = 'Password is required';
        else if (!Object.values(reqs.value).every(Boolean)) errors.password = 'Password does not meet requirements';

        if (form.confirmPassword.length === 0) errors.confirmPassword = 'Confirm password is required';
        else if (!isConfirmMatch.value) errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
});

const submitForm = async () => {
    submitted.value = true;
    isTypingPassword.value = false;
    if (Object.keys(validationErrors.value).length > 0) return;

    const result = await handleRegister(form);
    if (result) {
        router.push({
            path: '/login',
            state: { successMessage: 'Registration successful! Please login.' }
        });
    }
};
</script>

<template>
    <AuthLayout>
        <v-card flat class="login-card bg-transparent" width="500">
            <div class="text-center text-md-left">
                <h3 class="mt-2 fw-bold">Create Account</h3>
                <p class="text-grey-darken-1 mt-2">
                    Enter your information to unlock your personalized cinema experience.
                </p>
            </div>
            <p v-if="errorMessage" class="text-red"><span>
                    <Info class="me-2" size="16" />
                </span>{{ errorMessage.general }}</p>
            <v-form @submit.prevent="submitForm">
                <v-row>
                    <v-col cols="6">
                        <!-- First name -->
                        <label class="premium-label">First Name</label>
                        <div class="input-group">
                            <v-text-field v-model="form.firstName" @keypress="isLetter($event)" placeholder="John"
                                variant="outlined" density="comfortable" rounded="lg" color="red-accent-3"
                                base-color="rgba(255,255,255,1)" class="mt-2" hide-details>
                                <template v-slot:prepend-inner>
                                    <User2 size="18" class="text-grey" />
                                </template>
                                <template v-slot:append-inner>
                                    <Check v-if="isFnameValid" size="18" class="text-green" />
                                    <X v-if="validationErrors.firstName" size="18" class="text-red" />
                                </template>
                            </v-text-field>
                        </div>
                        <p v-if="validationErrors.firstName" class="text-red text-caption">
                            <span>
                                <Info size="16" class="me-2" />
                            </span>{{ validationErrors.firstName }}
                        </p>
                    </v-col>
                    <v-col cols="6">
                        <!-- Last Name -->
                        <label class="premium-label">Last Name</label>
                        <div class="input-group">
                            <v-text-field v-model="form.lastName" placeholder="Doe" @keypress="isLetter($event)"
                                variant="outlined" density="comfortable" rounded="lg" color="red-accent-3"
                                base-color="rgba(255,255,255,1)" class="mt-2" hide-details>
                                <template v-slot:prepend-inner>
                                    <User2 size="18" class="text-grey" />
                                </template>
                                <template v-slot:append-inner>
                                    <Check v-if="isLnameValid" size="18" class="text-green" />
                                    <X v-if="validationErrors.lastName" size="18" class="text-red" />
                                </template>
                            </v-text-field>
                        </div>
                        <p v-if="validationErrors.lastName" class="text-red text-caption">
                            <span>
                                <Info size="16" class="me-2" />
                            </span>{{ validationErrors.lastName }}
                        </p>
                    </v-col>
                </v-row>
                <!-- Email -->
                <label class="premium-label mt-3">Email</label>
                <div class="input-group">
                    <v-text-field v-model="form.email" placeholder="you@example.com" variant="outlined"
                        density="comfortable" rounded="lg" color="red-accent-3" base-color="rgba(255,255,255,1)"
                        class="mt-2" hide-details>
                        <template v-slot:prepend-inner>
                            <Mail size="18" class="text-grey" />
                        </template>
                        <template v-slot:append-inner>
                            <Check v-if="isEmailValid" size="18" class="text-green" />
                            <X v-if="validationErrors.email" size="18" class="text-red" />
                        </template>
                    </v-text-field>
                </div>
                <p v-if="validationErrors.email" class="text-red text-caption">
                    <span>
                        <Info size="16" class="me-2" />
                    </span>{{ validationErrors.email }}
                </p>

                <!-- Phone -->
                <label class="premium-label mt-3">Telephone</label>
                <div class="input-group">
                    <v-text-field v-model="form.phone" @keypress="isNumber" placeholder="01x-xxxxxxx" variant="outlined"
                        density="comfortable" rounded="lg" color="red-accent-3" base-color="rgba(255,255,255,1)"
                        class="mt-2" hide-details>
                        <template v-slot:prepend-inner>
                            <Phone size="18" class="text-grey" />
                        </template>
                        <template v-slot:append-inner>
                            <Check v-if="isPhoneValid" size="18" class="text-green" />
                            <X v-if="validationErrors.phone" size="18" class="text-red" />
                        </template>
                    </v-text-field>
                </div>
                <p v-if="validationErrors.phone" class="text-red text-caption">
                    <span>
                        <Info size="16" class="me-2" />
                    </span>{{ validationErrors.phone }}
                </p>

                <!-- Password Input -->
                <label class="premium-label mt-3">Password</label>
                <div class="input-group">
                    <v-text-field v-model="form.password" :type="showPassword ? 'text' : 'password'" @focus="isTypingPassword=true"
                    @blur="isTypingPassword=false" 
                        placeholder="••••••••" variant="outlined" density="comfortable" rounded="lg"
                        color="red-accent-3" base-color="rgba(255,255,255,1)" class="mt-2" hide-details>
                        <template v-slot:prepend-inner>
                            <Lock size="18" class="text-grey" />
                        </template>
                        <template v-slot:append-inner>
                            <div class="d-flex align-center gap-2">
                                <Check v-if="isPassValid" size="18" class="text-green" />
                                <X v-if="validationErrors.password" size="18" class="text-red" />
                                <div @click="showPassword = !showPassword" class="d-flex align-center">
                                    <component :is="showPassword ? Eye : EyeOff" size="18"
                                        class="text-grey hover-red" />
                                </div>
                            </div>
                        </template>
                    </v-text-field>
                </div>
                <p v-if="validationErrors.password" class="text-red text-caption">
                    <span>
                        <Info size="16" class="me-2" />
                    </span>{{ validationErrors.password }}
                </p>
                <!-- Password Strength Bar -->
                <v-expand-transition>
                    <div v-if="isTypingPassword || form.password.length > 0">
                        <div class="strength-container mb-4">
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
                <label class="premium-label mt-3">Confirm Password</label>
                <div class="input-group mb-8">
                    <v-text-field v-model="form.confirmPassword" :type="showConPassword ? 'text' : 'password'"
                        placeholder="••••••••" variant="outlined" density="comfortable" rounded="lg"
                        color="red-accent-3" base-color="rgba(255,255,255,1)" class="mt-2" hide-details>
                        <template v-slot:prepend-inner>
                            <Lock size="18" class="text-grey" />
                        </template>
                        <template v-slot:append-inner>
                            <div class="d-flex align-center gap-2">
                                <X v-if="validationErrors.confirmPassword" size="18" class="text-red" />
                                <Check v-if="isConfirmMatch" size="18" class="text-green" />

                                <div @click="showConPassword = !showConPassword"
                                    class="d-flex align-center cursor-pointer">
                                    <component :is="showConPassword ? Eye : EyeOff" size="18"
                                        class="text-grey hover-red" />
                                </div>
                            </div>
                        </template>
                    </v-text-field>
                </div>
                <p v-if="validationErrors.confirmPassword" class="text-red text-caption">
                    <span>
                        <Info size="16" class="me-2" />
                    </span>{{ validationErrors.confirmPassword }}
                </p>

                <v-btn block color="red-accent-3" height="50" class="login-btn mt-4" type="submit" :loading="isLoading">
                    Sign Up
                </v-btn>
                <div class="text-center mt-3">
                    <p class="text-grey text-caption">
                        Already have an account?
                        <router-link to="/login" class="text-red-accent-3 font-weight-bold ms-1">Login
                            here</router-link>
                    </p>
                </div>
            </v-form>
        </v-card>
    </AuthLayout>
</template>

<style scoped>
.strength-meter {
    height: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    overflow: hidden;
    margin-top: 15px;
}

.strength-container {
    margin-top: 1.5rem;
}

.strength-bar {
    height: 100%;
    transition: width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.4s ease;
    box-shadow: 0 0 8px currentColor;
}

.requirements-list {
    list-style: none;
    padding: 0;
    font-size: 12px;
    color: #888;
    user-select: none;
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

.premium-label {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: rgba(255, 255, 255, 0.815);
}

.login-card {
    margin-top: 70px;
}

.login-btn {
    letter-spacing: 2px;
    box-shadow: 0 4px 15px rgba(255, 82, 82, 0.3);
    background: linear-gradient(135deg, #ff4d4d, #b30000);
    border-radius: 10px;
}
</style>