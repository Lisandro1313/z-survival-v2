import { create } from 'zustand'

// ============================================================================
// TRUST STORE - Gestión de confianza y reputación con NPCs
// ============================================================================

export interface TrustLevel {
  npcId: string
  npcName: string
  level: number // -100 (enemy) to 100 (ally)
  label: string // "Enemigo", "Desconfiado", "Neutral", "Amigo", "Aliado"
  interactions: number
  lastInteraction: number
  
  // Perks por nivel de confianza
  unlockedPerks: string[]
  availableQuests: string[]
  tradeBonus: number // % discount/bonus en trades
}

export interface ReputationEvent {
  id: string
  npcId: string
  change: number // +/- trust points
  reason: string
  timestamp: number
}

export interface Faction {
  id: string
  name: string
  description: string
  reputation: number // -100 to 100
  rank: string
  members: string[] // npcIds
  rewards: string[] // unlocked rewards
}

export interface TrustStoreState {
  // State
  trustLevels: Record<string, TrustLevel> // npcId -> trust
  factions: Record<string, Faction>
  reputationHistory: ReputationEvent[]
  maxHistorySize: number
  
  // Actions - Trust
  setTrustLevels: (trustLevels: Record<string, TrustLevel>) => void
  updateTrust: (npcId: string, change: number, reason: string) => void
  setTrust: (npcId: string, level: number) => void
  addTrustLevel: (trust: TrustLevel) => void
  incrementInteractions: (npcId: string) => void
  
  // Actions - Perks & Content
  unlockPerk: (npcId: string, perkId: string) => void
  addAvailableQuest: (npcId: string, questId: string) => void
  removeAvailableQuest: (npcId: string, questId: string) => void
  
  // Actions - Factions
  setFactions: (factions: Record<string, Faction>) => void
  updateFaction: (factionId: string, change: number) => void
  setFactionRank: (factionId: string, rank: string) => void
  addFactionReward: (factionId: string, rewardId: string) => void
  
  // Actions - History
  addReputationEvent: (event: ReputationEvent) => void
  clearHistory: () => void
  
  // Queries
  getTrustLevel: (npcId: string) => TrustLevel | null
  getTrustLabel: (npcId: string) => string
  getEnemies: () => TrustLevel[]
  getAllies: () => TrustLevel[]
  getNeutrals: () => TrustLevel[]
  getFactionMembers: (factionId: string) => TrustLevel[]
  getRecentEvents: (limit: number) => ReputationEvent[]
}

// Helper to calculate trust label
function calculateTrustLabel(level: number): string {
  if (level <= -75) return 'Enemigo'
  if (level <= -25) return 'Hostil'
  if (level <= -5) return 'Desconfiado'
  if (level <= 5) return 'Neutral'
  if (level <= 25) return 'Conocido'
  if (level <= 50) return 'Amigo'
  if (level <= 75) return 'Confidente'
  return 'Aliado'
}

function calculateTradeBonus(level: number): number {
  if (level >= 75) return 25 // 25% discount
  if (level >= 50) return 15
  if (level >= 25) return 10
  if (level >= 5) return 5
  if (level >= -5) return 0
  if (level >= -25) return -10 // 10% markup
  if (level >= -50) return -25
  return -50 // Very expensive or refuses to trade
}

export const useTrustStore = create<TrustStoreState>((set, get) => ({
  // Initial State
  trustLevels: {},
  factions: {},
  reputationHistory: [],
  maxHistorySize: 50,
  
  // ==========================================
  // TRUST LEVELS
  // ==========================================
  
  setTrustLevels: (trustLevels) => set({ trustLevels }),
  
  updateTrust: (npcId, change, reason) => set(state => {
    const current = state.trustLevels[npcId]
    if (!current) return state
    
    const newLevel = Math.max(-100, Math.min(100, current.level + change))
    const newLabel = calculateTrustLabel(newLevel)
    const newBonus = calculateTradeBonus(newLevel)
    
    // Add to history
    const event: ReputationEvent = {
      id: `${Date.now()}_${npcId}`,
      npcId,
      change,
      reason,
      timestamp: Date.now()
    }
    
    const newHistory = [...state.reputationHistory, event].slice(-state.maxHistorySize)
    
    return {
      trustLevels: {
        ...state.trustLevels,
        [npcId]: {
          ...current,
          level: newLevel,
          label: newLabel,
          tradeBonus: newBonus,
          lastInteraction: Date.now()
        }
      },
      reputationHistory: newHistory
    }
  }),
  
  setTrust: (npcId, level) => set(state => {
    const current = state.trustLevels[npcId]
    if (!current) return state
    
    const clampedLevel = Math.max(-100, Math.min(100, level))
    const newLabel = calculateTrustLabel(clampedLevel)
    const newBonus = calculateTradeBonus(clampedLevel)
    
    return {
      trustLevels: {
        ...state.trustLevels,
        [npcId]: {
          ...current,
          level: clampedLevel,
          label: newLabel,
          tradeBonus: newBonus
        }
      }
    }
  }),
  
  addTrustLevel: (trust) => set(state => ({
    trustLevels: { ...state.trustLevels, [trust.npcId]: trust }
  })),
  
  incrementInteractions: (npcId) => set(state => {
    const current = state.trustLevels[npcId]
    if (!current) return state
    
    return {
      trustLevels: {
        ...state.trustLevels,
        [npcId]: {
          ...current,
          interactions: current.interactions + 1,
          lastInteraction: Date.now()
        }
      }
    }
  }),
  
  // ==========================================
  // PERKS & CONTENT
  // ==========================================
  
  unlockPerk: (npcId, perkId) => set(state => {
    const current = state.trustLevels[npcId]
    if (!current || current.unlockedPerks.includes(perkId)) return state
    
    return {
      trustLevels: {
        ...state.trustLevels,
        [npcId]: {
          ...current,
          unlockedPerks: [...current.unlockedPerks, perkId]
        }
      }
    }
  }),
  
  addAvailableQuest: (npcId, questId) => set(state => {
    const current = state.trustLevels[npcId]
    if (!current || current.availableQuests.includes(questId)) return state
    
    return {
      trustLevels: {
        ...state.trustLevels,
        [npcId]: {
          ...current,
          availableQuests: [...current.availableQuests, questId]
        }
      }
    }
  }),
  
  removeAvailableQuest: (npcId, questId) => set(state => {
    const current = state.trustLevels[npcId]
    if (!current) return state
    
    return {
      trustLevels: {
        ...state.trustLevels,
        [npcId]: {
          ...current,
          availableQuests: current.availableQuests.filter(q => q !== questId)
        }
      }
    }
  }),
  
  // ==========================================
  // FACTIONS
  // ==========================================
  
  setFactions: (factions) => set({ factions }),
  
  updateFaction: (factionId, change) => set(state => {
    const faction = state.factions[factionId]
    if (!faction) return state
    
    const newRep = Math.max(-100, Math.min(100, faction.reputation + change))
    
    return {
      factions: {
        ...state.factions,
        [factionId]: {
          ...faction,
          reputation: newRep
        }
      }
    }
  }),
  
  setFactionRank: (factionId, rank) => set(state => {
    const faction = state.factions[factionId]
    if (!faction) return state
    
    return {
      factions: {
        ...state.factions,
        [factionId]: { ...faction, rank }
      }
    }
  }),
  
  addFactionReward: (factionId, rewardId) => set(state => {
    const faction = state.factions[factionId]
    if (!faction || faction.rewards.includes(rewardId)) return state
    
    return {
      factions: {
        ...state.factions,
        [factionId]: {
          ...faction,
          rewards: [...faction.rewards, rewardId]
        }
      }
    }
  }),
  
  // ==========================================
  // HISTORY
  // ==========================================
  
  addReputationEvent: (event) => set(state => ({
    reputationHistory: [...state.reputationHistory, event].slice(-state.maxHistorySize)
  })),
  
  clearHistory: () => set({ reputationHistory: [] }),
  
  // ==========================================
  // QUERIES
  // ==========================================
  
  getTrustLevel: (npcId) => {
    return get().trustLevels[npcId] || null
  },
  
  getTrustLabel: (npcId) => {
    const trust = get().trustLevels[npcId]
    return trust ? trust.label : 'Desconocido'
  },
  
  getEnemies: () => {
    return Object.values(get().trustLevels).filter(t => t.level < -25)
  },
  
  getAllies: () => {
    return Object.values(get().trustLevels).filter(t => t.level > 25)
  },
  
  getNeutrals: () => {
    return Object.values(get().trustLevels).filter(t => t.level >= -25 && t.level <= 25)
  },
  
  getFactionMembers: (factionId) => {
    const faction = get().factions[factionId]
    if (!faction) return []
    
    return Object.values(get().trustLevels).filter(t => faction.members.includes(t.npcId))
  },
  
  getRecentEvents: (limit) => {
    return get().reputationHistory.slice(-limit).reverse()
  }
}))

export default useTrustStore
