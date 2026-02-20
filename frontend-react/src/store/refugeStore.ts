import { create } from 'zustand'

// ============================================================================
// REFUGE STORE - Gestión de refugios, defensas y mejoras
// ============================================================================

export interface RefugeDefense {
  id: string
  type: 'barricade' | 'trap' | 'turret' | 'wall' | 'alarm'
  level: number
  durability: number
  maxDurability: number
  position?: { x: number, y: number }
}

export interface RefugeUpgrade {
  id: string
  name: string
  description: string
  level: number
  maxLevel: number
  cost: Record<string, number> // resourceId -> amount
  unlocked: boolean
}

export interface RefugeStorage {
  capacity: number
  used: number
  items: Record<string, number> // itemId -> quantity
}

export interface Refuge {
  id: string
  nodeId: string
  nodeName: string
  ownerId: string
  ownerName: string
  level: number
  
  // Defensas
  defenses: Record<string, RefugeDefense>
  overallDefenseRating: number
  
  // Storage
  storage: RefugeStorage
  
  // Upgrades/Mejoras
  upgrades: Record<string, RefugeUpgrade>
  
  // Estado
  isUnderAttack: boolean
  lastAttackTime?: number
  inhabitants: string[] // Array de playerIds
  
  // Recursos generados
  resourceGeneration: Record<string, number> // resourceId -> per hour
}

export interface RefugeStoreState {
  // State
  refuges: Record<string, Refuge>
  currentRefugeId: string | null
  availableUpgrades: RefugeUpgrade[]
  
  // Actions - Refuges
  setRefuges: (refuges: Record<string, Refuge>) => void
  addRefuge: (refuge: Refuge) => void
  updateRefuge: (refugeId: string, updates: Partial<Refuge>) => void
  removeRefuge: (refugeId: string) => void
  setCurrentRefuge: (refugeId: string | null) => void
  
  // Actions - Defenses
  addDefense: (refugeId: string, defense: RefugeDefense) => void
  updateDefense: (refugeId: string, defenseId: string, updates: Partial<RefugeDefense>) => void
  removeDefense: (refugeId: string, defenseId: string) => void
  repairDefense: (refugeId: string, defenseId: string, amount: number) => void
  
  // Actions - Upgrades
  setAvailableUpgrades: (upgrades: RefugeUpgrade[]) => void
  unlockUpgrade: (refugeId: string, upgradeId: string) => void
  upgradeLevel: (refugeId: string, upgradeId: string) => void
  
  // Actions - Storage
  updateStorage: (refugeId: string, items: Record<string, number>) => void
  addToStorage: (refugeId: string, itemId: string, amount: number) => void
  removeFromStorage: (refugeId: string, itemId: string, amount: number) => void
  
  // Actions - Inhabitants
  addInhabitant: (refugeId: string, playerId: string) => void
  removeInhabitant: (refugeId: string, playerId: string) => void
  
  // Queries
  getCurrentRefuge: () => Refuge | null
  getRefugesByOwner: (ownerId: string) => Refuge[]
  getRefugesByNode: (nodeId: string) => Refuge[]
  getTotalDefenseRating: (refugeId: string) => number
}

export const useRefugeStore = create<RefugeStoreState>((set, get) => ({
  // Initial State
  refuges: {},
  currentRefugeId: null,
  availableUpgrades: [],
  
  // ==========================================
  // REFUGES
  // ==========================================
  
  setRefuges: (refuges) => set({ refuges }),
  
  addRefuge: (refuge) => set(state => ({
    refuges: { ...state.refuges, [refuge.id]: refuge }
  })),
  
  updateRefuge: (refugeId, updates) => set(state => {
    const refuge = state.refuges[refugeId]
    if (!refuge) return state
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: { ...refuge, ...updates }
      }
    }
  }),
  
  removeRefuge: (refugeId) => set(state => {
    const { [refugeId]: _removed, ...remaining } = state.refuges
    return {
      refuges: remaining,
      currentRefugeId: state.currentRefugeId === refugeId ? null : state.currentRefugeId
    }
  }),
  
  setCurrentRefuge: (refugeId) => set({ currentRefugeId: refugeId }),
  
  // ==========================================
  // DEFENSES
  // ==========================================
  
  addDefense: (refugeId, defense) => set(state => {
    const refuge = state.refuges[refugeId]
    if (!refuge) return state
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          defenses: { ...refuge.defenses, [defense.id]: defense }
        }
      }
    }
  }),
  
  updateDefense: (refugeId, defenseId, updates) => set(state => {
    const refuge = state.refuges[refugeId]
    if (!refuge || !refuge.defenses[defenseId]) return state
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          defenses: {
            ...refuge.defenses,
            [defenseId]: { ...refuge.defenses[defenseId], ...updates }
          }
        }
      }
    }
  }),
  
  removeDefense: (refugeId, defenseId) => set(state => {
    const refuge = state.refuges[refugeId]
    if (!refuge) return state
    
    const { [defenseId]: _removed, ...remaining } = refuge.defenses
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          defenses: remaining
        }
      }
    }
  }),
  
  repairDefense: (refugeId, defenseId, amount) => set(state => {
    const refuge = state.refuges[refugeId]
    const defense = refuge?.defenses[defenseId]
    if (!defense) return state
    
    const newDurability = Math.min(defense.durability + amount, defense.maxDurability)
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          defenses: {
            ...refuge.defenses,
            [defenseId]: { ...defense, durability: newDurability }
          }
        }
      }
    }
  }),
  
  // ==========================================
  // UPGRADES
  // ==========================================
  
  setAvailableUpgrades: (upgrades) => set({ availableUpgrades: upgrades }),
  
  unlockUpgrade: (refugeId, upgradeId) => set(state => {
    const refuge = state.refuges[refugeId]
    const upgrade = refuge?.upgrades[upgradeId]
    if (!upgrade) return state
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          upgrades: {
            ...refuge.upgrades,
            [upgradeId]: { ...upgrade, unlocked: true }
          }
        }
      }
    }
  }),
  
  upgradeLevel: (refugeId, upgradeId) => set(state => {
    const refuge = state.refuges[refugeId]
    const upgrade = refuge?.upgrades[upgradeId]
    if (!upgrade || upgrade.level >= upgrade.maxLevel) return state
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          upgrades: {
            ...refuge.upgrades,
            [upgradeId]: { ...upgrade, level: upgrade.level + 1 }
          }
        }
      }
    }
  }),
  
  // ==========================================
  // STORAGE
  // ==========================================
  
  updateStorage: (refugeId, items) => set(state => {
    const refuge = state.refuges[refugeId]
    if (!refuge) return state
    
    const used = Object.values(items).reduce((sum, qty) => sum + qty, 0)
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          storage: { ...refuge.storage, items, used }
        }
      }
    }
  }),
  
  addToStorage: (refugeId, itemId, amount) => set(state => {
    const refuge = state.refuges[refugeId]
    if (!refuge) return state
    
    const currentAmount = refuge.storage.items[itemId] || 0
    const newAmount = currentAmount + amount
    const newUsed = refuge.storage.used + amount
    
    if (newUsed > refuge.storage.capacity) return state // Over capacity
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          storage: {
            ...refuge.storage,
            items: { ...refuge.storage.items, [itemId]: newAmount },
            used: newUsed
          }
        }
      }
    }
  }),
  
  removeFromStorage: (refugeId, itemId, amount) => set(state => {
    const refuge = state.refuges[refugeId]
    const currentAmount = refuge?.storage.items[itemId] || 0
    if (!refuge || currentAmount < amount) return state
    
    const newAmount = currentAmount - amount
    const newUsed = refuge.storage.used - amount
    const { [itemId]: _removed, ...remainingItems } = refuge.storage.items
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          storage: {
            ...refuge.storage,
            items: newAmount > 0 
              ? { ...refuge.storage.items, [itemId]: newAmount }
              : remainingItems,
            used: newUsed
          }
        }
      }
    }
  }),
  
  // ==========================================
  // INHABITANTS
  // ==========================================
  
  addInhabitant: (refugeId, playerId) => set(state => {
    const refuge = state.refuges[refugeId]
    if (!refuge || refuge.inhabitants.includes(playerId)) return state
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          inhabitants: [...refuge.inhabitants, playerId]
        }
      }
    }
  }),
  
  removeInhabitant: (refugeId, playerId) => set(state => {
    const refuge = state.refuges[refugeId]
    if (!refuge) return state
    
    return {
      refuges: {
        ...state.refuges,
        [refugeId]: {
          ...refuge,
          inhabitants: refuge.inhabitants.filter(id => id !== playerId)
        }
      }
    }
  }),
  
  // ==========================================
  // QUERIES
  // ==========================================
  
  getCurrentRefuge: () => {
    const state = get()
    return state.currentRefugeId ? state.refuges[state.currentRefugeId] || null : null
  },
  
  getRefugesByOwner: (ownerId) => {
    return Object.values(get().refuges).filter(r => r.ownerId === ownerId)
  },
  
  getRefugesByNode: (nodeId) => {
    return Object.values(get().refuges).filter(r => r.nodeId === nodeId)
  },
  
  getTotalDefenseRating: (refugeId) => {
    const refuge = get().refuges[refugeId]
    if (!refuge) return 0
    
    return Object.values(refuge.defenses).reduce((total, defense) => {
      const condition = defense.durability / defense.maxDurability
      const defensePower = defense.level * 10 * condition
      return total + defensePower
    }, 0)
  }
}))

export default useRefugeStore
