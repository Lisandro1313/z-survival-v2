import { create } from 'zustand'

// ============================================================================
// RAID STORE - Gestión de raids cooperativos
// ============================================================================

export interface RaidParticipant {
  playerId: string
  playerName: string
  level: number
  role?: 'tank' | 'dps' | 'support' | 'scout'
  isReady: boolean
  isAlive: boolean
  kills: number
  damage: number
}

export interface RaidWave {
  waveNumber: number
  enemyCount: number
  enemiesKilled: number
  bossPresent: boolean
  bossId?: string
  startTime: number
  endTime?: number
  completed: boolean
}

export interface RaidReward {
  itemId: string
  itemName: string
  quantity: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  claimedBy?: string[]
}

export interface Raid {
  id: string
  nodeId: string
  nodeName: string
  
  // Raid Info
  type: 'horde' | 'boss' | 'scavenge' | 'rescue' | 'defense'
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare'
  minPlayers: number
  maxPlayers: number
  
  // Status
  status: 'waiting' | 'active' | 'completed' | 'failed'
  startTime?: number
  endTime?: number
  
  // Participants
  leaderId: string
  participants: Record<string, RaidParticipant>
  
  // Waves (for horde raids)
  waves: RaidWave[]
  currentWave: number
  totalWaves: number
  
  // Rewards
  rewards: RaidReward[]
  experienceReward: number
  
  // Stats
  totalKills: number
  totalDamage: number
  timeElapsed: number
}

export interface RaidStoreState {
  // State
  raids: Record<string, Raid>
  activeRaidId: string | null
  availableRaids: string[] // raidIds that can be joined
  
  // Personal stats
  myRaidHistory: {
    completed: number
    failed: number
    totalKills: number
    bestWave: number
  }
  
  // Actions - Raids
  setRaids: (raids: Record<string, Raid>) => void
  addRaid: (raid: Raid) => void
  updateRaid: (raidId: string, updates: Partial<Raid>) => void
  removeRaid: (raidId: string) => void
  setActiveRaid: (raidId: string | null) => void
  
  // Actions - Status
  startRaid: (raidId: string) => void
  completeRaid: (raidId: string) => void
  failRaid: (raidId: string) => void
  
  // Actions - Participants
  addParticipant: (raidId: string, participant: RaidParticipant) => void
  removeParticipant: (raidId: string, playerId: string) => void
  updateParticipant: (raidId: string, playerId: string, updates: Partial<RaidParticipant>) => void
  setParticipantReady: (raidId: string, playerId: string, ready: boolean) => void
  killParticipant: (raidId: string, playerId: string) => void
  
  // Actions - Waves
  startWave: (raidId: string, waveNumber: number) => void
  completeWave: (raidId: string, waveNumber: number) => void
  incrementWaveKills: (raidId: string, waveNumber: number) => void
  
  // Actions - Rewards
  addReward: (raidId: string, reward: RaidReward) => void
  claimReward: (raidId: string, rewardId: string, playerId: string) => void
  
  // Actions - Stats
  incrementKills: (raidId: string, playerId: string, amount: number) => void
  incrementDamage: (raidId: string, playerId: string, amount: number) => void
  updateMyStats: (stats: Partial<{
    completed: number
    failed: number
    totalKills: number
    bestWave: number
  }>) => void
  
  // Queries
  getActiveRaid: () => Raid | null
  getRaidsByNode: (nodeId: string) => Raid[]
  getMyActiveRaid: (playerId: string) => Raid | null
  isParticipating: (raidId: string, playerId: string) => boolean
  canJoinRaid: (raidId: string, playerId: string) => boolean
  getRaidProgress: (raidId: string) => number // 0-100
}

export const useRaidStore = create<RaidStoreState>((set, get) => ({
  // Initial State
  raids: {},
  activeRaidId: null,
  availableRaids: [],
  myRaidHistory: {
    completed: 0,
    failed: 0,
    totalKills: 0,
    bestWave: 0
  },
  
  // ==========================================
  // RAIDS
  // ==========================================
  
  setRaids: (raids) => set({ raids }),
  
  addRaid: (raid) => set(state => ({
    raids: { ...state.raids, [raid.id]: raid }
  })),
  
  updateRaid: (raidId, updates) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: { ...raid, ...updates }
      }
    }
  }),
  
  removeRaid: (raidId) => set(state => {
    const { [raidId]: _removed, ...remaining } = state.raids
    return {
      raids: remaining,
      activeRaidId: state.activeRaidId === raidId ? null : state.activeRaidId,
      availableRaids: state.availableRaids.filter(id => id !== raidId)
    }
  }),
  
  setActiveRaid: (raidId) => set({ activeRaidId: raidId }),
  
  // ==========================================
  // STATUS
  // ==========================================
  
  startRaid: (raidId) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          status: 'active',
          startTime: Date.now()
        }
      }
    }
  }),
  
  completeRaid: (raidId) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          status: 'completed',
          endTime: Date.now()
        }
      }
    }
  }),
  
  failRaid: (raidId) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          status: 'failed',
          endTime: Date.now()
        }
      }
    }
  }),
  
  // ==========================================
  // PARTICIPANTS
  // ==========================================
  
  addParticipant: (raidId, participant) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          participants: {
            ...raid.participants,
            [participant.playerId]: participant
          }
        }
      }
    }
  }),
  
  removeParticipant: (raidId, playerId) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    const { [playerId]: _removed, ...remaining } = raid.participants
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          participants: remaining
        }
      }
    }
  }),
  
  updateParticipant: (raidId, playerId, updates) => set(state => {
    const raid = state.raids[raidId]
    const participant = raid?.participants[playerId]
    if (!participant) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          participants: {
            ...raid.participants,
            [playerId]: { ...participant, ...updates }
          }
        }
      }
    }
  }),
  
  setParticipantReady: (raidId, playerId, ready) => set(state => {
    const raid = state.raids[raidId]
    const participant = raid?.participants[playerId]
    if (!participant) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          participants: {
            ...raid.participants,
            [playerId]: { ...participant, isReady: ready }
          }
        }
      }
    }
  }),
  
  killParticipant: (raidId, playerId) => set(state => {
    const raid = state.raids[raidId]
    const participant = raid?.participants[playerId]
    if (!participant) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          participants: {
            ...raid.participants,
            [playerId]: { ...participant, isAlive: false }
          }
        }
      }
    }
  }),
  
  // ==========================================
  // WAVES
  // ==========================================
  
  startWave: (raidId, waveNumber) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    const waveIndex = raid.waves.findIndex(w => w.waveNumber === waveNumber)
    if (waveIndex === -1) return state
    
    const updatedWaves = [...raid.waves]
    updatedWaves[waveIndex] = {
      ...updatedWaves[waveIndex],
      startTime: Date.now()
    }
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          waves: updatedWaves,
          currentWave: waveNumber
        }
      }
    }
  }),
  
  completeWave: (raidId, waveNumber) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    const waveIndex = raid.waves.findIndex(w => w.waveNumber === waveNumber)
    if (waveIndex === -1) return state
    
    const updatedWaves = [...raid.waves]
    updatedWaves[waveIndex] = {
      ...updatedWaves[waveIndex],
      endTime: Date.now(),
      completed: true
    }
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          waves: updatedWaves
        }
      }
    }
  }),
  
  incrementWaveKills: (raidId, waveNumber) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    const waveIndex = raid.waves.findIndex(w => w.waveNumber === waveNumber)
    if (waveIndex === -1) return state
    
    const updatedWaves = [...raid.waves]
    updatedWaves[waveIndex] = {
      ...updatedWaves[waveIndex],
      enemiesKilled: updatedWaves[waveIndex].enemiesKilled + 1
    }
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          waves: updatedWaves,
          totalKills: raid.totalKills + 1
        }
      }
    }
  }),
  
  // ==========================================
  // REWARDS
  // ==========================================
  
  addReward: (raidId, reward) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          rewards: [...raid.rewards, reward]
        }
      }
    }
  }),
  
  claimReward: (raidId, rewardId, playerId) => set(state => {
    const raid = state.raids[raidId]
    if (!raid) return state
    
    const rewardIndex = raid.rewards.findIndex(r => r.itemId === rewardId)
    if (rewardIndex === -1) return state
    
    const updatedRewards = [...raid.rewards]
    const reward = updatedRewards[rewardIndex]
    updatedRewards[rewardIndex] = {
      ...reward,
      claimedBy: [...(reward.claimedBy || []), playerId]
    }
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          rewards: updatedRewards
        }
      }
    }
  }),
  
  // ==========================================
  // STATS
  // ==========================================
  
  incrementKills: (raidId, playerId, amount) => set(state => {
    const raid = state.raids[raidId]
    const participant = raid?.participants[playerId]
    if (!participant) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          participants: {
            ...raid.participants,
            [playerId]: {
              ...participant,
              kills: participant.kills + amount
            }
          }
        }
      }
    }
  }),
  
  incrementDamage: (raidId, playerId, amount) => set(state => {
    const raid = state.raids[raidId]
    const participant = raid?.participants[playerId]
    if (!participant) return state
    
    return {
      raids: {
        ...state.raids,
        [raidId]: {
          ...raid,
          participants: {
            ...raid.participants,
            [playerId]: {
              ...participant,
              damage: participant.damage + amount
            }
          },
          totalDamage: raid.totalDamage + amount
        }
      }
    }
  }),
  
  updateMyStats: (stats) => set(state => ({
    myRaidHistory: { ...state.myRaidHistory, ...stats }
  })),
  
  // ==========================================
  // QUERIES
  // ==========================================
  
  getActiveRaid: () => {
    const state = get()
    return state.activeRaidId ? state.raids[state.activeRaidId] || null : null
  },
  
  getRaidsByNode: (nodeId) => {
    return Object.values(get().raids).filter(r => r.nodeId === nodeId)
  },
  
  getMyActiveRaid: (playerId) => {
    return Object.values(get().raids).find(
      r => r.status === 'active' && r.participants[playerId]
    ) || null
  },
  
  isParticipating: (raidId, playerId) => {
    const raid = get().raids[raidId]
    return raid ? playerId in raid.participants : false
  },
  
  canJoinRaid: (raidId, playerId) => {
    const raid = get().raids[raidId]
    if (!raid) return false
    if (raid.status !== 'waiting') return false
    if (playerId in raid.participants) return false
    
    const participantCount = Object.keys(raid.participants).length
    return participantCount < raid.maxPlayers
  },
  
  getRaidProgress: (raidId) => {
    const raid = get().raids[raidId]
    if (!raid) return 0
    
    if (raid.type === 'horde') {
      const completedWaves = raid.waves.filter(w => w.completed).length
      return (completedWaves / raid.totalWaves) * 100
    }
    
    // For other raid types, calculate based on different metrics
    return 0
  }
}))

export default useRaidStore
