import {
    createRouter,
    createWebHistory
} from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

// Import views
import HomeView from '../views/HomeView.vue'
import AllMovies from '@/views/AllMovies.vue'
import MovieDetail from '@/views/MovieDetail.vue'
import AllShowtimes from '@/views/AllShowtimes.vue'
import TicketBooking from '@/views/TicketBooking.vue'
import UserLogin from '@/views/UserLogin.vue'
import CheckoutPayment from '@/views/CheckoutPayment.vue'
import MyTickets from '@/views/MyTickets.vue'
import TheaterPage from '@/views/TheaterPage.vue'
import TicketCustomizer from '@/views/TicketCustomizer.vue'
import CustomizeList from '@/views/CustomizeList.vue'
import RegisterPage from '@/views/RegisterPage.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'
import ResetPassword from '@/views/ResetPassword.vue'
import UserActivate from '@/views/UserActivate.vue'
import MyProfile from '@/views/MyProfile.vue'
import NotificationView from '@/views/NotificationView.vue'

const routes = [
    {
        path: '/',
        component: HomeView,
        meta: { title: 'Home' }
    },
    {
        path: '/movies',
        name: 'Movies',
        component: AllMovies,
        meta: { title: 'All Movies' }
    },
    {
        path: '/movie/:id',
        name: 'MovieDetails',
        component: MovieDetail,
        meta: { requiresAuth: true, title: 'Movie Details' }
    },
    {
        path: '/showtimes',
        name: 'Showtimes',
        component: AllShowtimes,
        meta: { requiresAuth: true, title: 'Movie Showtimes' }
    },
    {
        path: '/booking/:movieId/:showtimeId',
        name: 'TicketBooking',
        component: TicketBooking,
        meta: { title: 'Select Seats' }
    },
    {
        path: '/login',
        name: 'Login',
        component: UserLogin,
        meta: { title: 'Login' }
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterPage,
        meta: { title: 'Register' }
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: ForgotPassword,
        meta: { title: 'Forgot Password' }
    },
    {
        path: '/activate',
        name: 'ActivateAccount',
        component: UserActivate,
        meta: { title: 'Account Activation' }
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: ResetPassword,
        meta: { title: 'Reset Password' }
    },
    {
        path: '/checkout-payment',
        name: 'CheckoutPayment',
        component: CheckoutPayment,
        meta: { requiresAuth: true, title: 'Checkout Payment' }
    },
    {
        path: '/my-tickets',
        name: "MyTickets",
        component: MyTickets,
        meta: { requiresAuth: true, title: 'My Tickets' }
    },
    {
        path: '/notification',
        name: "MyNotification",
        component: NotificationView,
        meta: { requiresAuth: true, title: 'Notifications' }
    },
    {
        path: '/theaters',
        name: "Theaters",
        component: TheaterPage,
        meta: { requiresAuth: true, title: 'Theaters' }
    },
    {
        path: '/faq',
        name: 'FAQ',
        component: TheaterPage,
        meta: { requiresAuth: true, title: 'Frequently Asked Questions' }
    },
    {
        path: '/customize-tickets/:movieId/:bookingId',
        name: "CustomizeTickets",
        component: TicketCustomizer,
        meta: { requiresAuth: true, title: 'Customize Ticket Design' }
    },
    {
        path: '/customize-list',
        name: "CustomizeList",
        component: CustomizeList,
        meta: { requiresAuth: true, title: 'Ticket Designs' }
    },
    {
        path: '/profile',
        name: "MyProfile",
        component: MyProfile,
        meta: { requiresAuth: true, title: 'My Profile' }
    },

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isProtected = to.matched.some(record => record.meta.requiresAuth)
    if (isProtected && !authStore.user) {
        next({
            name: 'Login',
            query: { redirected: 'true', reason: 'auth_required' }
        })
    }
    else if (to.name === 'Login' && authStore.user) {
        next({ path: '/' })
    }
    else {
        next()
    }
})

router.afterEach((to) => {
    const pageTitle = to.meta?.title || 'Movie Booking and Cinema Tickets'
    document.title = `${pageTitle} | PopFlix`
})

export default router
