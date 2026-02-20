import { create } from 'zustand'

export type GameMode = 'dashboard' | 'node' | 'combat' | 'refuge' | 'social' | 'map'

interface UIState {
  // Current mode
  mode: GameMode
  prevMode: GameMode | null
  
  // Modal state
  activeModal: string | null
  modalData: unknown | null
  
  // Loading states
  isLoading: boolean
  loadingMessage: string | null
  
  // Notifications
  notifications: Notification[]
  
  // UI preferences
  showMinimap: boolean
  showLogs: boolean
  
  // Actions
  setMode: (mode: GameMode) => void
  goBack: () => void
  openModal: (modalId: string, data?: unknown) => void
  closeModal: () => void
  setLoading: (isLoading: boolean, message?: string) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  toggleMinimap: () => void
  toggleLogs: () => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: number
  duration?: number
}

export const useUIStore = create<UIState>((set) => ({
  mode: 'dashboard',
  prevMode: null,
  activeModal: null,
  modalData: null,
  isLoading: false,
  loadingMessage: null,
  notifications: [],
  showMinimap: true,
  showLogs: true,
  
  setMode: (mode) => set((state) => ({
    mode,
    prevMode: state.mode
  })),
  
  goBack: () => set((state) => ({
    mode: state.prevMode || 'dashboard',
    prevMode: null
  })),
  
  openModal: (modalId, data) => set({
    activeModal: modalId,
    modalData: data
  }),
  
  closeModal: () => set({
    activeModal: null,
    modalData: null
  }),
  
  setLoading: (isLoading, message) => set({
    isLoading,
    loadingMessage: message || null
  }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      {
        ...notification,
        id: `notif-${Date.now()}-${Math.random()}`,
        timestamp: Date.now()
      }
    ]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  toggleMinimap: () => set((state) => ({
    showMinimap: !state.showMinimap
  })),
  
  toggleLogs: () => set((state) => ({
    showLogs: !state.showLogs
  }))
}))
