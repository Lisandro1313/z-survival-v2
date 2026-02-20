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
import type { Player, Node, UIState, Notification, RadioDevice, RadioMessage, Mission, MissionPriority } from '../types';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'combat' | 'social' | 'ai';
  message: string;
}

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
  time: number;
  weather: string;
  
  // Logs
  logs: LogEntry[];
  
  // Radio
  radioMessages: RadioMessage[];
  
  // Missions (FASE 11)
  missions: Mission[];
  myMissions: Mission[];
  missionFilter: 'all' | MissionPriority;
  
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
  
  // Actions - Missions (FASE 11)
  setMissions: (missions: Mission[]) => void;
  setMyMissions: (missions: Mission[]) => void;
  setMissionFilter: (filter: 'all' | MissionPriority) => void;
  addMission: (mission: Mission) => void;
  updateMission: (missionId: string, updates: Partial<Mission>) => void;
  removeMission: (missionId: string) => void;
  
  // Actions - UI
  setActivePanel: (panel: UIState['activePanel']) => void;
  toggleMenu: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  
  // Actions - Logs
  addLog: (type: LogEntry['type'], message: string) => void;
  clearLogs: () => void;
  
  // Actions - World Time
  setTime: (time: number) => void;
  setWeather: (weather: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial State
  missions: [],
  myMissions: [],
  missionFilter: 'all',
  isAuthenticated: false,
  isLoading: false,
  token: localStorage.getItem('token'),
  player: null,
  currentNode: null,
  nearbyNodes: [],
  onlinePlayers: [],
  radioMessages: [],
  time: Date.now(),
  weather: 'clear',
  logs: [],
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

  // Mission Actions (FASE 11)
  setMissions: (missions: Mission[]) => set({ missions }),
  
  setMyMissions: (missions: Mission[]) => set({ myMissions: missions }),
  
  setMissionFilter: (filter: 'all' | MissionPriority) => set({ missionFilter: filter }),
  
  addMission: (mission: Mission) => {
    set((state) => ({
      missions: [...state.missions, mission],
    }));
  },
  
  updateMission: (missionId: string, updates: Partial<Mission>) => {
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId ? { ...m, ...updates } : m
      ),
      myMissions: state.myMissions.map((m) =>
        m.id === missionId ? { ...m, ...updates } : m
      ),
    }));
  },
  
  removeMission: (missionId: string) => {
    set((state) => ({
      missions: state.missions.filter((m) => m.id !== missionId),
      myMissions: state.myMissions.filter((m) => m.id !== missionId),
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
  
  // Logs Actions
  addLog: (type: LogEntry['type'], message: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      type,
      message,
    };
    
    set((state) => ({
      logs: [...state.logs, newLog].slice(-100), // Keep last 100 logs
    }));
  },
  
  clearLogs: () => {
    set({ logs: [] });
  },
  
  // World Time Actions
  setTime: (time: number) => {
    set({ time });
  },
  
  setWeather: (weather: string) => {
    set({ weather });
  },
}));
