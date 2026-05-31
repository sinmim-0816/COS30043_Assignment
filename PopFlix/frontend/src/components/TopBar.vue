<script setup>
// Import Lucide Icon
import {
    Bell,
    Search,
    User,
    LogOut,
    ChevronDown,
    Menu,
    Ticket,
} from '@lucide/vue'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// import Logo
import logo from '@/assets/popflix_logo.png'

// Import other hook and components
import { useAuthStore } from '../stores/auth.js'
import ThemeToggle from './ThemeToggle.vue'
import GlobalSearch from './GlobalSearch.vue'
import { resolveBackendAssetPath } from '../utils/FormatPicture.js'
import { useNotifications } from '../hook/useNotification.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isSearchOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isMobileScreen = ref(false)

const isLoggedIn = computed(() => !!authStore.user)
const currentUser = computed(() => authStore.user)

const { unreadCount, initNotificationSystem, disconnectNotifications } = useNotifications()

onMounted(() => {
    document.addEventListener('click', closeDropdown)
    window.addEventListener('resize', handleResize)
    
    if (currentUser.value?.id) {
        initNotificationSystem(currentUser.value.id)
    }
})

watch(
    () => currentUser.value?.id,
    (newId) => {
        if (newId) {
            initNotificationSystem(newId)
        } else {
            disconnectNotifications()
        }
    }
)

const isAuthPage = computed(() => {
    const path = route.path;
    return path === '/login' || 
           path === '/register' || 
           path === '/forgot-password' || 
           path.startsWith('/reset-password') ||
           path.startsWith('/activate');
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
    isMobileMenuOpen.value = false
    authStore.logout()
    router.push('/')
}

const navigateTo = (routeName) => {
    isDropdownOpen.value = false
    isMobileMenuOpen.value = false
    router.push({ name: routeName })
}

const closeDropdown = () => {
    isDropdownOpen.value = false
}

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const handleResize = () => {
    isMobileScreen.value = window.innerWidth <= 768
    if (window.innerWidth > 768) {
        isMobileMenuOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', closeDropdown)
    window.addEventListener('resize', handleResize);
})

onUnmounted(() => {
    document.removeEventListener("click", closeDropdown)
    window.removeEventListener('resize', handleResize);   
})

watch(
    () => route.fullPath,
    () => {
        isDropdownOpen.value = false
        isMobileMenuOpen.value = false
        isSearchOpen.value = false
    }
)
</script>

<template>
    <header :class="{
        'transparent-header': isAuthPage && !isSearchOpen,
        'search-open-header': isSearchOpen
    }">
        <router-link to="/">
            <img :src="logo" alt="PopFlix Logo" class="company_logo">
        </router-link>
        <!-- Navigation -->
        <nav v-if="showNavLinks" class="desktop-nav">
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
            <button type="button" class="search desktop-action" v-if="isLoggedIn" @click="isSearchOpen = true">
                <Search class="icon" size="22"/>
            </button>

            <GlobalSearch v-model="isSearchOpen" />
            <!-- Notification -->
            <router-link 
                v-if="isLoggedIn" 
                to="/notification" 
                class="p-2 desktop-action bell-link-wrapper"
                aria-label="View notifications"
            >
                <Bell class="icon" />
                <span v-if="unreadCount > 0" class="badge-counter-indicator">
                    {{ unreadCount }}
                </span>
            </router-link>
            <div class="theme-toggle-wrapper desktop-action">
                <ThemeToggle/>
            </div>
            <!-- Login/Register -->
            <template v-if="isLoggedIn">
                <div class="dropdown-wrapper me-2">
                    <div
                        @click="toggleDropdown"
                        class="user-profile-trigger"
                        :class="{ 'active-trigger': isDropdownOpen }"
                    >
                        <div class="avatar-circle">
                            <img
                                v-if="currentUser?.profileImage"
                                :src="resolveBackendAssetPath(currentUser.profileImage)"
                                alt="User Avatar"
                                class="avatar-img"
                            />

                            <span v-else>
                                {{ currentUser?.firstName?.charAt(0).toUpperCase() }}
                            </span>
                            </div>

                        <span v-if="!isMobileScreen" class="user-name-text">
                            {{ currentUser?.firstName }}
                        </span>

                        <ChevronDown
                            size="14"
                            class="chevron-icon"
                            :class="{ 'rotate-chevron': isDropdownOpen }"
                        />
                    </div>
                </div>

                <transition name="dropdown-fade">
                    <ul v-if="isDropdownOpen" class="profile-dropdown-menu me-2">
                        <li @click="navigateTo('MyProfile')" class="dropdown-item">
                            <User size="16" />
                            <span>View Profile</span>
                        </li>

                        <li @click="navigateTo('MyTickets')" class="dropdown-item">
                            <Ticket size="16" />
                            <span>My Bookings</span>
                        </li>

                        <li class="dropdown-divider"></li>

                        <li @click="handleLogout" class="dropdown-item logout-item">
                            <LogOut size="16" />
                            <span>Log Out</span>
                        </li>
                    </ul>
                </transition>

            </template>

            <template v-else>

                <div class="auth-buttons-group desktop-action">
                    <router-link to="/register" class="register-btn px-4 py-2">
                        Register
                    </router-link>

                    <router-link to="/login" class="login-btn px-4 py-2 me-2">
                        <User class="icon me-1" size="22" />
                        Login
                    </router-link>
                </div>

            </template>
            <button
                v-if="showNavLinks"
                type="button"
                class="p-2 mobile-menu-button m-0"
                @click.stop="toggleMobileMenu"
                aria-label="Open menu"
            >
                <Menu />
            </button>
        </div>

    </header>
    <transition name="mobile-dropdown">
    <div
        v-if="isMobileMenuOpen"
        class="mobile-dropdown-menu"
    >
        <nav class="mobile-dropdown-links">
            <router-link to="/movies" @click="closeMobileMenu">
                Movies
            </router-link>

            <router-link to="/showtimes" @click="closeMobileMenu">
                Showtimes
            </router-link>

            <router-link to="/theaters" @click="closeMobileMenu">
                Cinemas
            </router-link>

            <router-link to="/customize-list" @click="closeMobileMenu">
                Customization
            </router-link>

            <template v-if="isLoggedIn">
                <button
                    class="mobile-logout-btn"
                    @click="handleLogout"
                >
                    <LogOut size="18" />
                    Logout
                </button>
            </template>

            <template v-else>
                <router-link to="/login" @click="closeMobileMenu">
                    Login
                </router-link>

                <router-link to="/register" @click="closeMobileMenu">
                    Register
                </router-link>
            </template>
        </nav>
    </div>
</transition>
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

.mobile-menu-button {
    display: none;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    background: none !important;
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
    align-content:center;
    font-weight: 700;
    font-size: 13px;
    box-shadow: var(--avatar-shadow);
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
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
    top: calc(100%);
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
}

.theme-toggler {
    background-color: rgba(135, 135, 135, 0.15);
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

.search-open-header {
    background: var(--header-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-color);
}

.mobile-nav-drawer {
    background: var(--bg-color);
    color: var(--text-color);
    border:1px solid red;
}

.mobile-menu-shell {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
}

.mobile-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--dropdown-divider);
}

.mobile-menu-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-color);
}

.mobile-menu-close {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0;
}

.mobile-nav-links {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.mobile-nav-links a,
.mobile-auth-link {
    text-decoration: none;
    color: var(--text-color);
    font-weight: 600;
    padding: 0.9rem 1rem;
    border-radius: 12px;
    background: var(--glass-btn);
}

.mobile-nav-links a.router-link-exact-active {
    background: rgba(255, 82, 82, 0.12);
    color: #ff5252;
}

.mobile-menu-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--dropdown-divider);
}

.mobile-action-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    border-radius: 12px;
    padding: 0.9rem 1rem;
    margin-right: 0;
    text-align: left;
}

.logout-action {
    color: #ff5252;
}

.mobile-theme-toggle {
    padding: 0.25rem 0;
}

.mobile-user-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1rem;
    background: var(--glass-btn);
    border-radius: 12px;
}

.mobile-user-name {
    font-weight: 700;
    color: var(--text-color);
}

.mobile-user-email {
    font-size: 0.85rem;
    color: var(--muted-text-color);
}

.login-variant {
    background: var(--login-bg);
    color: #fff;
}

.mobile-dropdown-menu {
    position: fixed;
    top: 65px;
    left: 0;
    width: 100%;
    background: var(--header-bg);
    border-bottom: 1px solid var(--border-color);
    z-index: 999;
    padding: 1rem;
}

.mobile-dropdown-links {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.mobile-dropdown-links a,
.mobile-logout-btn {
    width: 100%;
    padding: 14px 16px;
    border-radius: 12px;
    text-decoration: none;
    color: var(--text-color);
    font-weight: 600;
    transition: all 0.2s ease;
}

.mobile-dropdown-links a:hover,
.mobile-logout-btn:hover {
    background: rgba(117, 117, 117, 0.1);
}

.mobile-dropdown-links a.router-link-exact-active {
    color: #ff5252;
    background: rgba(255, 82, 82, 0.12);
}

.mobile-logout-btn {
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #ff5252;
    margin-right: 0;
    background: none;
}

.mobile-dropdown-enter-active,
.mobile-dropdown-leave-active {
    transition: all 0.3s ease;
}

.mobile-dropdown-enter-from,
.mobile-dropdown-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

.mobile-dropdown-enter-to,
.mobile-dropdown-leave-from {
    opacity: 1;
    transform: translateY(0);
}

.bell-link-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    background-color: var(--glass-btn);
    backdrop-filter: blur(15px);
    border: none;
    cursor: pointer;
    margin-right: 1rem;
    color: var(--topbar-link);
    border-radius: 50px;
    width: 40px;
    height: 40px;
    transition: all 0.2s ease;
}

.icon:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: #ff5252;
}

.badge-counter-indicator {
    position: absolute;
    top: -2px;
    right: -2px;
    background: #ff5252;
    color: white;
    font-size: 10px;
    font-weight: 800;
    border-radius: 10px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--topbar-bg);
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.search{
    width: 40px !important;
    height:40px !important;
}

@media (max-width: 1008px) {
    .desktop-nav, .desktop-profile {
        display: none;
    }

    .mobile-menu-button {
        display: inline-flex;
    }

    .nav-right-container {
        margin-left: auto;
    }

    header {
        gap: 0.5rem;
    }

}

@media (min-width: 1009px) {
    .mobile-dropdown-menu {
        display: none !important;
    }
}
</style>
