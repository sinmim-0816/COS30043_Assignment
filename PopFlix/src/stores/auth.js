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
        console.log(this.token)
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log(localStorage.getItem('token'))
        return data;
      } catch (error) {
        throw error.response?.data?.message || 'Login failed';
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