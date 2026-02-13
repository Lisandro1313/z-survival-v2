/**
 * 🎮 GAME STORE - Estado global del juego
 * 
 * Maneja:
 * - Autenticación
 * - Player state
 * - World state
 * - UI state
 */

import { create } from 'zustand';
import type { Player, Node, UIState, Notification, RadioDevice, RadioMessage } from '../types';

interface GameState {
  // Auth
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  
  // Player
  player: Player | null;
  
  // World
  currentNode: Node | null;
  nearbyNodes: Node[];
  onlinePlayers: Player[];
  
  // Radio
  radioMessages: RadioMessage[];
  
  // UI
  ui: UIState;
  
  // Actions - Auth
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setPlayer: (player: Player) => void;
  
  // Actions - World
  setCurrentNode: (node: Node) => void;
  setNearbyNodes: (nodes: Node[]) => void;
  updateOnlinePlayers: (players: Player[]) => void;
  
  // Actions - Radio
  addRadioMessage: (message: RadioMessage) => void;
  clearRadioMessages: () => void;
  setEquippedRadio: (radio: RadioDevice | null) => void;
  
  // Actions - UI
  setActivePanel: (panel: UIState['activePanel']) => void;
  toggleMenu: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial State
  isAuthenticated: false,
  isLoading: false,
  token: localStorage.getItem('token'),
  player: null,
  currentNode: null,
  nearbyNodes: [],
  onlinePlayers: [],
  radioMessages: [],
  ui: {
    activePanel: null,
    isMenuOpen: false,
    notifications: [],
  },

  // Auth Actions
  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      set({
        isAuthenticated: true,
        token: data.token,
        player: data.player,
        isLoading: false,
      });

      localStorage.setItem('token', data.token);
    } catch (error) {
      set({ isLoading: false });
      get().addNotification({
        type: 'error',
        message: 'Error al iniciar sesión',
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      isAuthenticated: false,
      token: null,
      player: null,
      currentNode: null,
      nearbyNodes: [],
      radioMessages: [],
    });
  },

  setPlayer: (player: Player) => set({ player }),

  // World Actions
  setCurrentNode: (node: Node) => set({ currentNode: node }),
  
  setNearbyNodes: (nodes: Node[]) => set({ nearbyNodes: nodes }),
  
  updateOnlinePlayers: (players: Player[]) => set({ onlinePlayers: players }),

  // Radio Actions
  addRadioMessage: (message: RadioMessage) => {
    set((state) => ({
      radioMessages: [...state.radioMessages, message].slice(-100), // Keep last 100
    }));
  },

  clearRadioMessages: () => set({ radioMessages: [] }),

  setEquippedRadio: (radio: RadioDevice | null) => {
    set((state) => ({
      player: state.player 
        ? { ...state.player, equippedRadio: radio }
        : null,
    }));
  },

  // UI Actions
  setActivePanel: (panel: UIState['activePanel']) => {
    set((state) => ({
      ui: { ...state.ui, activePanel: panel },
    }));
  },

  toggleMenu: () => {
    set((state) => ({
      ui: { ...state.ui, isMenuOpen: !state.ui.isMenuOpen },
    }));
  },

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };

    set((state) => ({
      ui: {
        ...state.ui,
        notifications: [...state.ui.notifications, newNotification],
      },
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(newNotification.id);
    }, 5000);
  },

  removeNotification: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        notifications: state.ui.notifications.filter((n) => n.id !== id),
      },
    }));
  },
}));
