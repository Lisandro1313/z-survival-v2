import { create } from 'zustand'

interface CombatEnemy {
  id: string
  name: string
  type: string
  hp: number
  maxHp: number
  level: number
}

interface CombatState {
  combatId: string | null
  enemy: CombatEnemy | null
  playerHp: number
  isPlayerTurn: boolean
  log: CombatLogEntry[]
  isActive: boolean
  
  // Actions
  startCombat: (combatId: string, enemy: CombatEnemy, playerHp: number) => void
  updateCombat: (updates: {
    playerHp?: number
    enemyHp?: number
    isPlayerTurn?: boolean
  }) => void
  addLogEntry: (entry: Omit<CombatLogEntry, 'id' | 'timestamp'>) => void
  endCombat: () => void
  clearLog: () => void
}

interface CombatLogEntry {
  id: string
  type: 'attack' | 'defend' | 'item' | 'flee' | 'critical' | 'miss'
  message: string
  timestamp: number
  attacker?: string
  damage?: number
}

export const useCombatStore = create<CombatState>((set) => ({
  combatId: null,
  enemy: null,
  playerHp: 0,
  isPlayerTurn: true,
  log: [],
  isActive: false,
  
  startCombat: (combatId, enemy, playerHp) => set({
    combatId,
    enemy,
    playerHp,
    isPlayerTurn: true,
    log: [],
    isActive: true
  }),
  
  updateCombat: (updates) => set((state) => ({
    playerHp: updates.playerHp ?? state.playerHp,
    enemy: updates.enemyHp && state.enemy
      ? { ...state.enemy, hp: updates.enemyHp }
      : state.enemy,
    isPlayerTurn: updates.isPlayerTurn ?? state.isPlayerTurn
  })),
  
  addLogEntry: (entry) => set((state) => ({
    log: [
      ...state.log.slice(-19), // Keep last 20 entries
      {
        ...entry,
        id: `log-${Date.now()}`,
        timestamp: Date.now()
      }
    ]
  })),
  
  endCombat: () => set({
    combatId: null,
    enemy: null,
    playerHp: 0,
    isPlayerTurn: true,
    log: [],
    isActive: false
  }),
  
  clearLog: () => set({ log: [] })
}))
