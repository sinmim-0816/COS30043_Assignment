import {
    createRouter,
    createWebHistory
} from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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

const routes = [
    {
        path: '/',
        component: HomeView
    },
    {
        path: '/movies',
        name: 'Movies',
        component: AllMovies
    },
    {
        path: '/movie/:id',
        name: 'MovieDetails',
        component: MovieDetail,
        meta: { requiresAuth: true }
    },
    {
        path: '/showtimes',
        name: 'Showtimes',
        component: AllShowtimes,
        meta: { requiresAuth: true }
    },
    {
        path: '/booking/:movieId/:showtimeId',
        name: 'TicketBooking',
        component: TicketBooking,
        
    },
    {
        path: '/login',
        name: 'Login',
        component: UserLogin
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterPage
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: ForgotPassword
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: ResetPassword
    },
    {
        path: '/checkout-payment',
        name: 'CheckoutPayment',
        component: CheckoutPayment,
        meta: { requiresAuth: true }
    },
    {
        path: '/my-tickets',
        name: "MyTickets",
        component: MyTickets,
        meta: { requiresAuth: true }
    },
    {
        path: '/theaters',
        name: "Theaters",
        component: TheaterPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/customize-tickets/:movieId/:bookingId',
        name: "CustomizeTickets",
        component: TicketCustomizer,
        meta: { requiresAuth: true }
    },
    {
        path: '/customize-list',
        name: "CustomizeList",
        component: CustomizeList,
        meta: { requiresAuth: true }
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

export default router
