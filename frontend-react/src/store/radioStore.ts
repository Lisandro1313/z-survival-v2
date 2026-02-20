import { create } from 'zustand'

// ============================================================================
// RADIO STORE - Gestión de comunicaciones por radio
// ============================================================================

export interface RadioMessage {
  id: string
  frequency: string
  senderId: string
  senderName: string
  message: string
  timestamp: number
  isEncrypted?: boolean
  signalStrength?: number // 0-100
}

export interface RadioChannel {
  frequency: string
  name: string
  description?: string
  isPublic: boolean
  password?: string
  range?: number // Radio range in km
  members: string[] // playerIds subscribed
  messageCount: number
  lastActivity: number
}

export interface RadioDevice {
  id: string
  name: string
  battery: number
  maxBattery: number
  range: number
  canEncrypt: boolean
  canBroadcast: boolean
}

export interface RadioStoreState {
  // State
  messages: Record<string, RadioMessage[]> // frequency -> messages
  channels: Record<string, RadioChannel>
  activeFrequency: string | null
  currentDevice: RadioDevice | null
  isMuted: boolean
  volume: number
  
  // Actions - Messages
  addMessage: (message: RadioMessage) => void
  clearMessages: (frequency: string) => void
  clearAllMessages: () => void
  getMessagesByFrequency: (frequency: string) => RadioMessage[]
  
  // Actions - Channels
  setChannels: (channels: Record<string, RadioChannel>) => void
  addChannel: (channel: RadioChannel) => void
  updateChannel: (frequency: string, updates: Partial<RadioChannel>) => void
  removeChannel: (frequency: string) => void
  subscribeToChannel: (frequency: string, playerId: string) => void
  unsubscribeFromChannel: (frequency: string, playerId: string) => void
  
  // Actions - Device & Settings
  setActiveFrequency: (frequency: string | null) => void
  setDevice: (device: RadioDevice | null) => void
  setMuted: (muted: boolean) => void
  setVolume: (volume: number) => void
  useBattery: (amount: number) => void
  
  // Queries
  getActiveChannel: () => RadioChannel | null
  getSubscribedChannels: (playerId: string) => RadioChannel[]
  getPublicChannels: () => RadioChannel[]
  getRecentMessages: (limit: number) => RadioMessage[]
  canTransmit: () => boolean
}

export const useRadioStore = create<RadioStoreState>((set, get) => ({
  // Initial State
  messages: {},
  channels: {},
  activeFrequency: null,
  currentDevice: null,
  isMuted: false,
  volume: 80,
  
  // ==========================================
  // MESSAGES
  // ==========================================
  
  addMessage: (message) => set(state => {
    const frequencyMessages = state.messages[message.frequency] || []
    const updatedMessages = [...frequencyMessages, message]
    
    // Limit to last 100 messages per frequency
    const trimmedMessages = updatedMessages.slice(-100)
    
    return {
      messages: {
        ...state.messages,
        [message.frequency]: trimmedMessages
      }
    }
  }),
  
  clearMessages: (frequency) => set(state => {
    const { [frequency]: _removed, ...remaining } = state.messages
    return { messages: remaining }
  }),
  
  clearAllMessages: () => set({ messages: {} }),
  
  getMessagesByFrequency: (frequency) => {
    return get().messages[frequency] || []
  },
  
  // ==========================================
  // CHANNELS
  // ==========================================
  
  setChannels: (channels) => set({ channels }),
  
  addChannel: (channel) => set(state => ({
    channels: { ...state.channels, [channel.frequency]: channel }
  })),
  
  updateChannel: (frequency, updates) => set(state => {
    const channel = state.channels[frequency]
    if (!channel) return state
    
    return {
      channels: {
        ...state.channels,
        [frequency]: { ...channel, ...updates }
      }
    }
  }),
  
  removeChannel: (frequency) => set(state => {
    const { [frequency]: _removed, ...remaining } = state.channels
    return {
      channels: remaining,
      activeFrequency: state.activeFrequency === frequency ? null : state.activeFrequency
    }
  }),
  
  subscribeToChannel: (frequency, playerId) => set(state => {
    const channel = state.channels[frequency]
    if (!channel || channel.members.includes(playerId)) return state
    
    return {
      channels: {
        ...state.channels,
        [frequency]: {
          ...channel,
          members: [...channel.members, playerId]
        }
      }
    }
  }),
  
  unsubscribeFromChannel: (frequency, playerId) => set(state => {
    const channel = state.channels[frequency]
    if (!channel) return state
    
    return {
      channels: {
        ...state.channels,
        [frequency]: {
          ...channel,
          members: channel.members.filter(id => id !== playerId)
        }
      }
    }
  }),
  
  // ==========================================
  // DEVICE & SETTINGS
  // ==========================================
  
  setActiveFrequency: (frequency) => set({ activeFrequency: frequency }),
  
  setDevice: (device) => set({ currentDevice: device }),
  
  setMuted: (muted) => set({ isMuted: muted }),
  
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),
  
  useBattery: (amount) => set(state => {
    if (!state.currentDevice) return state
    
    const newBattery = Math.max(0, state.currentDevice.battery - amount)
    
    return {
      currentDevice: {
        ...state.currentDevice,
        battery: newBattery
      }
    }
  }),
  
  // ==========================================
  // QUERIES
  // ==========================================
  
  getActiveChannel: () => {
    const state = get()
    return state.activeFrequency ? state.channels[state.activeFrequency] || null : null
  },
  
  getSubscribedChannels: (playerId) => {
    return Object.values(get().channels).filter(ch => ch.members.includes(playerId))
  },
  
  getPublicChannels: () => {
    return Object.values(get().channels).filter(ch => ch.isPublic)
  },
  
  getRecentMessages: (limit) => {
    const state = get()
    const allMessages = Object.values(state.messages).flat()
    return allMessages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  },
  
  canTransmit: () => {
    const state = get()
    if (!state.currentDevice) return false
    if (state.currentDevice.battery <= 0) return false
    if (!state.currentDevice.canBroadcast) return false
    return true
  }
}))

export default useRadioStore
