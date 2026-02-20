import { create } from 'zustand'

// ============================================================================
// CLAN STORE - Gestión de clanes, miembros, territorios y guerras
// ============================================================================

export interface ClanMember {
  playerId: string
  playerName: string
  rank: 'leader' | 'officer' | 'veteran' | 'member' | 'recruit'
  joinDate: number
  contributionPoints: number
  lastActive: number
  permissions: string[]
}

export interface ClanTerritory {
  nodeId: string
  nodeName: string
  controlPercentage: number // 0-100
  capturedAt?: number
  defenseLevel: number
  income: number // Resources per hour
}

export interface ClanWar {
  id: string
  attackerClanId: string
  defenderClanId: string
  territoryId: string
  startTime: number
  endTime?: number
  status: 'pending' | 'active' | 'completed'
  attackerScore: number
  defenderScore: number
  winner?: string
}

export interface ClanStorage {
  resources: Record<string, number>
  items: Record<string, number>
  capacity: number
  used: number
}

export interface ClanUpgrade {
  id: string
  name: string
  description: string
  level: number
  maxLevel: number
  cost: Record<string, number>
  benefits: string[]
}

export interface Clan {
  id: string
  name: string
  tag: string // [TAG]
  description: string
  leaderId: string
  
  // Members
  members: Record<string, ClanMember>
  maxMembers: number
  
  // Territories
  territories: Record<string, ClanTerritory>
  
  // Resources
  storage: ClanStorage
  level: number
  experience: number
  
  // Upgrades
  upgrades: Record<string, ClanUpgrade>
  
  // Wars
  activeWars: string[] // warIds
  warHistory: { won: number, lost: number }
  
  // Meta
  createdAt: number
  reputation: number
  isRecruiting: boolean
  requirements: {
    minLevel?: number
    requiresApproval: boolean
  }
}

export interface ClanApplication {
  id: string
  clanId: string
  playerId: string
  playerName: string
  playerLevel: number
  message: string
  timestamp: number
  status: 'pending' | 'approved' | 'rejected'
}

export interface ClanStoreState {
  // State
  clans: Record<string, Clan>
  myClanId: string | null
  clanApplications: ClanApplication[]
  wars: Record<string, ClanWar>
  
  // Actions - Clans
  setClans: (clans: Record<string, Clan>) => void
  addClan: (clan: Clan) => void
  updateClan: (clanId: string, updates: Partial<Clan>) => void
  removeClan: (clanId: string) => void
  setMyClan: (clanId: string | null) => void
  
  // Actions - Members
  addMember: (clanId: string, member: ClanMember) => void
  removeMember: (clanId: string, playerId: string) => void
  updateMember: (clanId: string, playerId: string, updates: Partial<ClanMember>) => void
  promoteMember: (clanId: string, playerId: string) => void
  demoteMember: (clanId: string, playerId: string) => void
  addContribution: (clanId: string, playerId: string, points: number) => void
  
  // Actions - Territories
  addTerritory: (clanId: string, territory: ClanTerritory) => void
  updateTerritory: (clanId: string, nodeId: string, updates: Partial<ClanTerritory>) => void
  removeTerritory: (clanId: string, nodeId: string) => void
  
  // Actions - Storage
  updateStorage: (clanId: string, resources: Record<string, number>) => void
  depositResource: (clanId: string, resourceId: string, amount: number) => void
  withdrawResource: (clanId: string, resourceId: string, amount: number) => void
  
  // Actions - Upgrades
  addUpgrade: (clanId: string, upgrade: ClanUpgrade) => void
  upgradeLevel: (clanId: string, upgradeId: string) => void
  
  // Actions - Wars
  declareWar: (war: ClanWar) => void
  updateWar: (warId: string, updates: Partial<ClanWar>) => void
  endWar: (warId: string, winnerId: string) => void
  
  // Actions - Applications
  addApplication: (application: ClanApplication) => void
  approveApplication: (applicationId: string) => void
  rejectApplication: (applicationId: string) => void
  
  // Queries
  getMyClan: () => Clan | null
  getMembersByClan: (clanId: string) => ClanMember[]
  getMyPermissions: (playerId: string) => string[]
  canPerformAction: (clanId: string, playerId: string, action: string) => boolean
  getTotalIncome: (clanId: string) => number
  getClansByTerritory: (nodeId: string) => Clan[]
  getActiveApplications: (clanId: string) => ClanApplication[]
}

const RANK_HIERARCHY: Record<ClanMember['rank'], number> = {
  'leader': 5,
  'officer': 4,
  'veteran': 3,
  'member': 2,
  'recruit': 1
}

const RANK_PERMISSIONS: Record<ClanMember['rank'], string[]> = {
  'leader': ['all'],
  'officer': ['invite', 'kick_recruit', 'manage_storage', 'declare_war', 'manage_territory'],
  'veteran': ['invite', 'manage_storage'],
  'member': ['deposit'],
  'recruit': []
}

export const useClanStore = create<ClanStoreState>((set, get) => ({
  // Initial State
  clans: {},
  myClanId: null,
  clanApplications: [],
  wars: {},
  
  // ==========================================
  // CLANS
  // ==========================================
  
  setClans: (clans) => set({ clans }),
  
  addClan: (clan) => set(state => ({
    clans: { ...state.clans, [clan.id]: clan }
  })),
  
  updateClan: (clanId, updates) => set(state => {
    const clan = state.clans[clanId]
    if (!clan) return state
    
    return {
      clans: {
        ...state.clans,
        [clanId]: { ...clan, ...updates }
      }
    }
  }),
  
  removeClan: (clanId) => set(state => {
    const { [clanId]: _removed, ...remaining } = state.clans
    return {
      clans: remaining,
      myClanId: state.myClanId === clanId ? null : state.myClanId
    }
  }),
  
  setMyClan: (clanId) => set({ myClanId: clanId }),
  
  // ==========================================
  // MEMBERS
  // ==========================================
  
  addMember: (clanId, member) => set(state => {
    const clan = state.clans[clanId]
    if (!clan) return state
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          members: {
            ...clan.members,
            [member.playerId]: member
          }
        }
      }
    }
  }),
  
  removeMember: (clanId, playerId) => set(state => {
    const clan = state.clans[clanId]
    if (!clan) return state
    
    const { [playerId]: _removed, ...remaining } = clan.members
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          members: remaining
        }
      }
    }
  }),
  
  updateMember: (clanId, playerId, updates) => set(state => {
    const clan = state.clans[clanId]
    const member = clan?.members[playerId]
    if (!member) return state
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          members: {
            ...clan.members,
            [playerId]: { ...member, ...updates }
          }
        }
      }
    }
  }),
  
  promoteMember: (clanId, playerId) => set(state => {
    const clan = state.clans[clanId]
    const member = clan?.members[playerId]
    if (!member) return state
    
    const currentLevel = RANK_HIERARCHY[member.rank]
    let newRank = member.rank
    
    if (currentLevel < 4) { // Can't promote to leader
      const ranks: ClanMember['rank'][] = ['recruit', 'member', 'veteran', 'officer', 'leader']
      const currentIndex = ranks.indexOf(member.rank)
      if (currentIndex < ranks.length - 2) {
        newRank = ranks[currentIndex + 1]
      }
    }
    
    const newPermissions = RANK_PERMISSIONS[newRank]
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          members: {
            ...clan.members,
            [playerId]: {
              ...member,
              rank: newRank,
              permissions: newPermissions
            }
          }
        }
      }
    }
  }),
  
  demoteMember: (clanId, playerId) => set(state => {
    const clan = state.clans[clanId]
    const member = clan?.members[playerId]
    if (!member || member.rank === 'recruit') return state
    
    const ranks: ClanMember['rank'][] = ['recruit', 'member', 'veteran', 'officer', 'leader']
    const currentIndex = ranks.indexOf(member.rank)
    const newRank = currentIndex > 0 ? ranks[currentIndex - 1] : member.rank
    const newPermissions = RANK_PERMISSIONS[newRank]
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          members: {
            ...clan.members,
            [playerId]: {
              ...member,
              rank: newRank,
              permissions: newPermissions
            }
          }
        }
      }
    }
  }),
  
  addContribution: (clanId, playerId, points) => set(state => {
    const clan = state.clans[clanId]
    const member = clan?.members[playerId]
    if (!member) return state
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          members: {
            ...clan.members,
            [playerId]: {
              ...member,
              contributionPoints: member.contributionPoints + points
            }
          }
        }
      }
    }
  }),
  
  // ==========================================
  // TERRITORIES
  // ==========================================
  
  addTerritory: (clanId, territory) => set(state => {
    const clan = state.clans[clanId]
    if (!clan) return state
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          territories: {
            ...clan.territories,
            [territory.nodeId]: territory
          }
        }
      }
    }
  }),
  
  updateTerritory: (clanId, nodeId, updates) => set(state => {
    const clan = state.clans[clanId]
    const territory = clan?.territories[nodeId]
    if (!territory) return state
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          territories: {
            ...clan.territories,
            [nodeId]: { ...territory, ...updates }
          }
        }
      }
    }
  }),
  
  removeTerritory: (clanId, nodeId) => set(state => {
    const clan = state.clans[clanId]
    if (!clan) return state
    
    const { [nodeId]: _removed, ...remaining } = clan.territories
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          territories: remaining
        }
      }
    }
  }),
  
  // ==========================================
  // STORAGE
  // ==========================================
  
  updateStorage: (clanId, resources) => set(state => {
    const clan = state.clans[clanId]
    if (!clan) return state
    
    const used = Object.values(resources).reduce((sum, qty) => sum + qty, 0)
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          storage: {
            ...clan.storage,
            resources,
            used
          }
        }
      }
    }
  }),
  
  depositResource: (clanId, resourceId, amount) => set(state => {
    const clan = state.clans[clanId]
    if (!clan) return state
    
    const currentAmount = clan.storage.resources[resourceId] || 0
    const newAmount = currentAmount + amount
    const newUsed = clan.storage.used + amount
    
    if (newUsed > clan.storage.capacity) return state
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          storage: {
            ...clan.storage,
            resources: {
              ...clan.storage.resources,
              [resourceId]: newAmount
            },
            used: newUsed
          }
        }
      }
    }
  }),
  
  withdrawResource: (clanId, resourceId, amount) => set(state => {
    const clan = state.clans[clanId]
    const currentAmount = clan?.storage.resources[resourceId] || 0
    if (!clan || currentAmount < amount) return state
    
    const newAmount = currentAmount - amount
    const newUsed = clan.storage.used - amount
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          storage: {
            ...clan.storage,
            resources: {
              ...clan.storage.resources,
              [resourceId]: newAmount
            },
            used: newUsed
          }
        }
      }
    }
  }),
  
  // ==========================================
  // UPGRADES
  // ==========================================
  
  addUpgrade: (clanId, upgrade) => set(state => {
    const clan = state.clans[clanId]
    if (!clan) return state
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          upgrades: {
            ...clan.upgrades,
            [upgrade.id]: upgrade
          }
        }
      }
    }
  }),
  
  upgradeLevel: (clanId, upgradeId) => set(state => {
    const clan = state.clans[clanId]
    const upgrade = clan?.upgrades[upgradeId]
    if (!upgrade || upgrade.level >= upgrade.maxLevel) return state
    
    return {
      clans: {
        ...state.clans,
        [clanId]: {
          ...clan,
          upgrades: {
            ...clan.upgrades,
            [upgradeId]: {
              ...upgrade,
              level: upgrade.level + 1
            }
          }
        }
      }
    }
  }),
  
  // ==========================================
  // WARS
  // ==========================================
  
  declareWar: (war) => set(state => ({
    wars: { ...state.wars, [war.id]: war }
  })),
  
  updateWar: (warId, updates) => set(state => {
    const war = state.wars[warId]
    if (!war) return state
    
    return {
      wars: {
        ...state.wars,
        [warId]: { ...war, ...updates }
      }
    }
  }),
  
  endWar: (warId, winnerId) => set(state => {
    const war = state.wars[warId]
    if (!war) return state
    
    return {
      wars: {
        ...state.wars,
        [warId]: {
          ...war,
          status: 'completed',
          endTime: Date.now(),
          winner: winnerId
        }
      }
    }
  }),
  
  // ==========================================
  // APPLICATIONS
  // ==========================================
  
  addApplication: (application) => set(state => ({
    clanApplications: [...state.clanApplications, application]
  })),
  
  approveApplication: (applicationId) => set(state => ({
    clanApplications: state.clanApplications.map(app =>
      app.id === applicationId ? { ...app, status: 'approved' as const } : app
    )
  })),
  
  rejectApplication: (applicationId) => set(state => ({
    clanApplications: state.clanApplications.map(app =>
      app.id === applicationId ? { ...app, status: 'rejected' as const } : app
    )
  })),
  
  // ==========================================
  // QUERIES
  // ==========================================
  
  getMyClan: () => {
    const state = get()
    return state.myClanId ? state.clans[state.myClanId] || null : null
  },
  
  getMembersByClan: (clanId) => {
    const clan = get().clans[clanId]
    return clan ? Object.values(clan.members) : []
  },
  
  getMyPermissions: (playerId) => {
    const state = get()
    const myClan = state.myClanId ? state.clans[state.myClanId] : null
    const member = myClan?.members[playerId]
    return member?.permissions || []
  },
  
  canPerformAction: (clanId, playerId, action) => {
    const clan = get().clans[clanId]
    const member = clan?.members[playerId]
    if (!member) return false
    
    if (member.permissions.includes('all')) return true
    return member.permissions.includes(action)
  },
  
  getTotalIncome: (clanId) => {
    const clan = get().clans[clanId]
    if (!clan) return 0
    
    return Object.values(clan.territories).reduce((total, t) => total + t.income, 0)
  },
  
  getClansByTerritory: (nodeId) => {
    return Object.values(get().clans).filter(c => nodeId in c.territories)
  },
  
  getActiveApplications: (clanId) => {
    return get().clanApplications.filter(
      app => app.clanId === clanId && app.status === 'pending'
    )
  }
}))

export default useClanStore
