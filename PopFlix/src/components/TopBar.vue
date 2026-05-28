<script setup>
// Import Lucide Icon
import {
    Bell,
    Search,
    User,
    LogOut,
    Ticket,
    ChevronDown
} from '@lucide/vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// import Logo
import logo from '@/assets/popflix_logo.png'

// Import other hook and components
import { useAuthStore } from '@/stores/auth'
import ThemeToggle from './ThemeToggle.vue'
import GlobalSearch from './GlobalSearch.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isSearchOpen = ref(false)

const isLoggedIn = computed(() => !!authStore.user)
const currentUser = computed(() => authStore.user)

const isAuthPage = computed(() => {
    const path = route.path;
    return path === '/login' || 
           path === '/register' || 
           path === '/forgot-password' || 
           path.startsWith('/reset-password');
})

const showNavLinks = computed(() => !isAuthPage.value)

const hoverStyle = ref({
    left: '0px',
    width: '0px',
    opacity: 0,
    backdropFilter: 'blur(0px)'
})

const handleMouseEnter = (event) => {
    const el = event.currentTarget
    hoverStyle.value = {
        left: `${el.offsetLeft}px`,
        width: `${el.offsetWidth}px`,
        opacity: 1,
        backdropFilter: 'blur(15px)'
    }
}

const handleMouseLeave = () => {
    hoverStyle.value.opacity = 0
    hoverStyle.value.backdropFilter = 'blur(0px)'
}

const isDropdownOpen = ref(false)
const toggleDropdown = (event) => {
    event.stopPropagation();
    isDropdownOpen.value = !isDropdownOpen.value
}

const handleLogout = () => {
    isDropdownOpen.value = false
    authStore.logout()
    router.push('/')
}

const navigateTo = (routeName) => {
    isDropdownOpen.value = false
    router.push({ name: routeName })
}

const closeDropdown = () => {
    isDropdownOpen.value = false
}

onMounted(() => {
    document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
    document.removeEventListener("click", closeDropdown)
})
</script>

<template>
    <header :class="{ 'transparent-header': isAuthPage }">
        <router-link to="/">
            <img :src="logo" alt="PopFlix Logo" class="company_logo">
        </router-link>
        <!-- Navigation -->
        <nav v-if="showNavLinks">
            <ul @mouseleave="handleMouseLeave" class="nav-list-wrapper">
                <li class="hover-capsule" :style="hoverStyle"></li>
                <li @mouseenter="handleMouseEnter"><router-link to="/movies">Movies</router-link></li>
                <li @mouseenter="handleMouseEnter"><router-link to="/showtimes">Showtimes</router-link></li>
                <li @mouseenter="handleMouseEnter"><router-link to="/theaters">Cinemas</router-link></li>
                <li @mouseenter="handleMouseEnter"><router-link to="/customize-list">Customization</router-link></li>
            </ul>
        </nav>
        <div class="nav-right-container">
            <!-- Search -->
            <button type="button" class="p-2" v-if="isLoggedIn" @click="isSearchOpen = true">
                <Search class="icon" />
            </button>

            <GlobalSearch v-model="isSearchOpen" />
            <!-- Notification -->
            <button type="button" class="p-2" v-if="isLoggedIn">
                <Bell class="icon" />
            </button>
            <div class="theme-toggle-wrapper">
                <ThemeToggle/>
            </div>
            <!-- Login/Register -->
            <div v-if="isLoggedIn" class="dropdown-wrapper">

                <div @click="toggleDropdown" class="user-profile-trigger" :class="{ 'active-trigger': isDropdownOpen }">
                    <div class="avatar-circle">
                        {{ currentUser.firstName.charAt(0).toUpperCase() }}
                    </div>
                    <span class="user-name-text">{{ currentUser.firstName }}</span>
                    <ChevronDown size="14" class="chevron-icon" :class="{ 'rotate-chevron': isDropdownOpen }" />
                </div>

                <transition name="dropdown-fade">
                    <ul v-if="isDropdownOpen" class="profile-dropdown-menu">
                        <li @click="navigateTo('Profile')" class="dropdown-item">
                            <User size="16" />
                            <span>View Profile</span>
                        </li>
                        <li @click="navigateTo('MyTickets')" class="dropdown-item">
                            <Ticket size="16" />
                            <span>My Tickets</span>
                        </li>

                        <li class="dropdown-divider"></li>

                        <li @click="handleLogout" class="dropdown-item logout-item">
                            <LogOut size="16" />
                            <span>Log Out</span>
                        </li>
                    </ul>
                </transition>

            </div>

            <div v-else class="auth-buttons-group">
                <router-link to="/register" class="register-btn px-4 py-2">
                    Register
                </router-link>
                <router-link to="/login" class="login-btn px-4 py-2 me-2">
                    <User class="icon me-1" size="22" /> Login
                </router-link>
            </div>
        </div>

    </header>
</template>

<style scoped>
header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: var(--topbar-bg);
    transition: background 0.3s ease;
    height: 65px;
}

.company_logo {
    height: 40px;
}

nav ul {
    display: flex;
    gap: 1.5rem;
}
nav ul li {
    display: block;
}

.nav-right-container {
    display: flex;
    align-items: center;
}

button {
    background-color:var(--glass-btn);
    backdrop-filter: blur(15px);
    border: none;
    cursor: pointer;
    margin-right: 1rem;
    color: var(--topbar-link);
    border-radius: 50px;
}
.dropdown-wrapper {
    position: relative;
}

.user-profile-trigger {
    display: flex;
    align-items: center;
    background: var(--glass-btn);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 6px 14px;
    border-radius: 30px;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
}

.user-profile-trigger:hover,
.active-trigger {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 82, 82, 0.4);
}

.avatar-circle {
    width: 26px;
    height: 26px;
    background-color: #ff5252;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    box-shadow: var(--avatar-shadow);
}

.user-name-text {
    color: var(--text-color);
    font-weight: 600;
    font-size: 14px;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chevron-icon {
    color: var(--chevron-icon);
    transition: transform 0.2s ease;
}

.rotate-chevron {
    transform: rotate(180deg);
}

.profile-dropdown-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    background: var(--bg-color);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    width: 200px;
    padding: 6px 0;
    margin: 0;
    list-style: none;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 1100;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 10px 16px;
    color: var(--text-color);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.dropdown-item:hover {
    background: var(--dropdown-hover);
    color: var(--text-color);
}

.dropdown-divider {
    height: 1px;
    background: var(--dropdown-divider);
    margin: 6px 0;
}

.logout-item {
    color: #ff5252;
}

.logout-item:hover {
    background: rgba(255, 82, 82, 0.1);
    color: #ff6666;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
    transition: all 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.auth-buttons-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.login-btn {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    color: white;
    font-size: 15px;
    border-radius: 30px;
    box-shadow: 0 4px 15px rgba(255, 82, 82, 0.25);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    white-space: nowrap;
    background: var(--login-bg);
}

.login-btn:hover {
    background: linear-gradient(135deg, #ff6666, #cc0000);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255, 82, 82, 0.35);
}

.login-btn:active {
    transform: translateY(1px);
}

.register-btn {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    font-weight: 500;
    color: var(--text-color);
    font-size: 15px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--register-bg);
    border-radius: 30px;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    white-space: nowrap;
}

.register-btn:hover {
    color: var(--text-color);
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--register-hover);
    transform: translateY(-1px);
}

.nav-list-wrapper {
    display: flex;
    align-items: center;
    position: relative;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0);
    padding: 6px;
    border-radius: 40px;
    margin: 0;
    list-style: none;
}

.nav-list-wrapper li:not(.hover-capsule) {
    position: relative;
    z-index: 2;
}

.nav-list-wrapper li a {
    display: block;
    text-decoration: none;
    font-weight: 700;
    color: var(--topbar-link);
    padding: 8px 15px;
    border-radius: 30px;
    transition: color 0.25s ease;
}

.nav-list-wrapper li:hover a,
.nav-list-wrapper li a.router-link-exact-active {
    color: var(--text-hover);
}

.hover-capsule {
    position: absolute;
    top: 6px;
    bottom: 6px;
    z-index: 1;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    pointer-events: none;
    transition:
        left 0.35s cubic-bezier(0.25, 1, 0.5, 1),
        width 0.35s cubic-bezier(0.25, 1, 0.5, 1),
        opacity 0.2s ease,
        backdrop-filter 0.2s ease;
}

.nav-list-wrapper li a.router-link-exact-active {
    color: #ff4d4d;
}
.theme-toggle-wrapper {
    display: flex;
    align-items: center;
    margin-right: 0.5rem;
}

.theme-toggler {
    background-color: rgba(212, 212, 212, 0.15);
    backdrop-filter: blur(15px);
    border: none;
    cursor: pointer;
    color: black;
    padding: 8px; 
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.theme-toggler:hover {
    background-color: rgba(255, 255, 255, 0.25);
}
@media (max-width: 768px) {
    nav ul {
        display: none;
    }
}
</style>