/**
 * Auth Store - Zustand
 * Gestión de autenticación y tokens JWT
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: number;
  username: string;
}

interface AuthState {
  // Estado
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  clearError: () => void;
  setTokens: (accessToken: string, refreshToken: string, user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      accessToken: null,
      refreshToken: null,
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
            body: JSON.stringify({ usuario: username, password })
          });

          console.log('📥 Response status:', response.status);

          if (!response.ok) {
            const error = await response.json();
            console.error('❌ Error response:', error);
            throw new Error(error.error || 'Login failed');
          }

          const data = await response.json();
          console.log('✅ Login exitoso:', data);

          set({
            user: { userId: data.userId, username: data.usuario },
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return true;

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
            body: JSON.stringify({ usuario: username, password })
          });

          console.log('📥 Response status:', response.status);

          if (!response.ok) {
            const error = await response.json();
            console.error('❌ Error response:', error);
            throw new Error(error.error || error.issues?.join(', ') || 'Registration failed');
          }

          const data = await response.json();
          console.log('✅ Registro exitoso:', data);

          set({
            user: { userId: data.userId, username: data.usuario },
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return true;

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
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null
        });
      },

      // Refresh access token
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          return false;
        }

        try {
          const response = await fetch('http://localhost:3000/api/auth/refresh', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ refreshToken })
          });

          if (!response.ok) {
            // Refresh token inválido o expirado
            get().logout();
            return false;
          }

          const data = await response.json();

          set({
            accessToken: data.accessToken
          });

          return true;

        } catch (error) {
          get().logout();
          return false;
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set tokens (para uso interno)
      setTokens: (accessToken: string, refreshToken: string, user: User) => {
        set({
          accessToken,
          refreshToken,
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
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Helper para obtener el access token actual
export const getAccessToken = () => useAuthStore.getState().accessToken;

// Helper para verificar si el token está próximo a expirar
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convertir a milliseconds
    const now = Date.now();
    const timeUntilExpiry = exp - now;
    
    return timeUntilExpiry < 2 * 60 * 1000; // Menos de 2 minutos
  } catch {
    return true;
  }
};

export default useAuthStore;
