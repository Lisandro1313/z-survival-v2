import { create } from 'zustand'
import type { Player, InventoryItem } from '../types/player'

interface PlayerState {
  player: Player | null
  
  // Actions
  setPlayer: (player: Player) => void
  updatePlayer: (updates: Partial<Player>) => void
  updateStats: (stats: Partial<Pick<Player, 'hp' | 'hunger' | 'stamina'>>) => void
  addItem: (item: InventoryItem) => void
  removeItem: (itemId: string, quantity?: number) => void
  updateCaps: (caps: number) => void
  clearPlayer: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  player: null,
  
  setPlayer: (player) => set({ player }),
  
  updatePlayer: (updates) => set((state) => ({
    player: state.player ? { ...state.player, ...updates } : null
  })),
  
  updateStats: (stats) => set((state) => ({
    player: state.player ? { ...state.player, ...stats } : null
  })),
  
  addItem: (item) => set((state) => {
    if (!state.player) return state
    
    const existingItemIndex = state.player.inventory.findIndex(i => i.id === item.id)
    const newInventory = [...state.player.inventory]
    
    if (existingItemIndex >= 0) {
      newInventory[existingItemIndex].quantity += item.quantity
    } else {
      newInventory.push(item)
    }
    
    return {
      player: { ...state.player, inventory: newInventory }
    }
  }),
  
  removeItem: (itemId, quantity = 1) => set((state) => {
    if (!state.player) return state
    
    const newInventory = state.player.inventory
      .map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: item.quantity - quantity }
        }
        return item
      })
      .filter(item => item.quantity > 0)
    
    return {
      player: { ...state.player, inventory: newInventory }
    }
  }),
  
  updateCaps: (caps) => set((state) => ({
    player: state.player ? { ...state.player, caps } : null
  })),
  
  clearPlayer: () => set({ player: null })
}))
