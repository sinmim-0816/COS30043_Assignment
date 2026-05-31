import { defineStore } from 'pinia';
import { authService } from '../services/authService';
import { useNotifications } from '@/hook/useNotification';

const SESSION_MODE_KEY = 'auth_persistence_mode';
const MODE_REMEMBER = 'remember';
const MODE_SESSION = 'session';

const readStoredSession = () => {
  const mode = localStorage.getItem(SESSION_MODE_KEY) || sessionStorage.getItem(SESSION_MODE_KEY);
  const usePersistentStorage = mode === MODE_REMEMBER;
  const storage = usePersistentStorage ? localStorage : sessionStorage;

  const token = storage.getItem('token') || null;
  const user = storage.getItem('user') || null;

  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    ...readStoredSession(),
  }),

  actions: {
    async login(email, password, rememberMe = false) {
      try {
        const data = await authService.login(email, password);

        this.token = data.access_token;
        this.user = data.user;

        const primaryStorage = rememberMe ? localStorage : sessionStorage;
        const secondaryStorage = rememberMe ? sessionStorage : localStorage;
        const modeValue = rememberMe ? MODE_REMEMBER : MODE_SESSION;

        primaryStorage.setItem('token', data.access_token);
        primaryStorage.setItem('user', JSON.stringify(data.user));
        primaryStorage.setItem(SESSION_MODE_KEY, modeValue);
        secondaryStorage.removeItem('token');
        secondaryStorage.removeItem('user');
        secondaryStorage.removeItem(SESSION_MODE_KEY);

        return data;
      } catch (error) {
        throw error.response?.data?.message || 'Login failed';
      }

    },

    async fetchProfile() {
      try {
        const userData = await authService.getProfile();

        this.user = userData;
        if (localStorage.getItem(SESSION_MODE_KEY) === MODE_REMEMBER) {
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (sessionStorage.getItem(SESSION_MODE_KEY) === MODE_SESSION) {
          sessionStorage.setItem('user', JSON.stringify(userData));
        }

        return userData;
      } catch (error) {
        console.error('Failed to sync profile data:', error);
        throw error.response?.data?.message || 'Failed to fetch profile';
      }
    },

    async updateProfile(userId, formData) {
      try {
        const updatedUser = await authService.updateProfile(userId, formData);
        this.user = updatedUser;
        if (localStorage.getItem(SESSION_MODE_KEY) === MODE_REMEMBER) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else if (sessionStorage.getItem(SESSION_MODE_KEY) === MODE_SESSION) {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return updatedUser;
      } catch (error) {
        console.error('Failed to update profile:', error);
        throw error.response?.data?.message || 'Failed to update profile';
      }
    },

    logout() {
      try {
        const { disconnectNotifications } = useNotifications();
        disconnectNotifications();
        console.log('Notification socket session cleanly terminated on logout.');
      } catch (socketError) {
        console.error('Error disconnecting websocket during logout:', socketError);
      }
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem(SESSION_MODE_KEY);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem(SESSION_MODE_KEY);
    }
  }
});
