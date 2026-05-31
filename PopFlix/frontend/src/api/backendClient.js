import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import router from '../router';

const backendClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

backendClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    let token = authStore.token || sessionStorage.getItem('token') || localStorage.getItem('token');

    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Content-Type', undefined);
      } else {
        delete config.headers['Content-Type'];
      }
    }
    const isPublicRoute = config.url.includes('/auth/login') || config.url.includes('/auth/register');

    if (isPublicRoute) {
      return config;
    }

    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(`Request to secure endpoint [${config.url}] made without an auth token string.`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

backendClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data } = error.response || {};

    console.error(`Backend Error [${status}]:`, data);

    if (status === 401) {
      const authStore = useAuthStore();
      authStore.logout();

      if (router.currentRoute.value.path !== '/login') {
        router.push({ path: '/login', query: { expired: 'true', reason: 'auth_required' } })
      }
    }

    return Promise.reject(error);
  }
);

export default backendClient;
