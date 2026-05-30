import { defineStore } from 'pinia';
import { authService } from '../services/authService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
  }),

  actions: {
    async login(email, password) {
      try {
        const data = await authService.login(email, password);

        this.token = data.access_token;
        this.user = data.user;
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
      } catch (error) {
        throw error.response?.data?.message || 'Login failed';
      }

    },

    async fetchProfile() {
      try {
        const userData = await authService.getProfile();

        this.user = userData;
        localStorage.setItem('user', JSON.stringify(userData));

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
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      } catch (error) {
        console.error('Failed to update profile:', error);
        throw error.response?.data?.message || 'Failed to update profile';
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});
