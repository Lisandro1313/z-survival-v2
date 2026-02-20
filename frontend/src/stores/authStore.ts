/**
 * Auth Store - Zustand
 * Gestión de autenticación y tokens JWT
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
}

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (username: string, password: string) => {
        console.log('🔵 authStore.login llamado', { username });
        set({ isLoading: true, error: null });
        
        try {
          console.log('📡 Enviando request a:', 'http://localhost:3000/api/auth/login');
          const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
          });

          console.log('📥 Response status:', response.status);

          if (!response.ok) {
            const error = await response.json();
            console.error('❌ Error response:', error);
            throw new Error(error.error || 'Login failed');
          }

          const data = await response.json();
          console.log('✅ Login exitoso:', data);

          if (data.success && data.user) {
            set({
              user: { id: data.user.id, username: data.user.username },
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            throw new Error('Login failed - invalid response');
          }

        } catch (error: any) {
          console.error('❌ Login error:', error);
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false
          });
          return false;
        }
      },

      // Register
      register: async (username: string, password: string) => {
        console.log('🔵 authStore.register llamado', { username });
        set({ isLoading: true, error: null });
        
        try {
          console.log('📡 Enviando request a:', 'http://localhost:3000/api/auth/register');
          const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
          });

          console.log('📥 Response status:', response.status);

          if (!response.ok) {
            const error = await response.json();
            console.error('❌ Error response:', error);
            throw new Error(error.error || error.issues?.join(', ') || 'Registration failed');
          }

          const data = await response.json();
          console.log('✅ Registro exitoso:', data);

          if (data.success && data.id) {
            set({
              user: { id: data.id, username },
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            throw new Error('Registration failed - invalid response');
          }

        } catch (error: any) {
          console.error('❌ Register error:', error);
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false
          });
          return false;
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set user (for manual updates)
      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true
        });
      }
    }),
    {
      name: 'auth-storage', // Nombre en localStorage
      partialize: (state) => ({
        // Solo persiste estos campos
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
