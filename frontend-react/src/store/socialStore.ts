import { create } from 'zustand'

// ============================================================================
// SOCIAL STORE - Sistema social completo
// ============================================================================
// Maneja:
// - NPCs y diálogos
// - Chat (local, global, whispers)
// - Fogata (posts, comments, likes)
// - Jugadores online (presencia)
// - Party/Grupo

// ============================================================================
// TYPES
// ============================================================================

export interface NPC {
  id: string
  name: string
  role: string
  nodeId?: string
  trust?: number
  faction?: string
  isAlive?: boolean
}

export interface DialogueOption {
  id: string
  text: string
  nextDialogueId?: string | null
  requirements?: Record<string, any>
  consequences?: Record<string, any>
}

export interface ActiveDialogue {
  npcId: string
  npcName: string
  dialogueId: string
  text: string
  options: DialogueOption[]
}

export interface ChatMessage {
  id: string
  from: string
  fromId: string
  message: string
  timestamp: number
  type: 'local' | 'global' | 'whisper' | 'party' | 'radio'
  channel?: string // Para radio
}

export interface FogataPost {
  id: string
  authorId: string
  authorName: string
  title: string
  content: string
  category: string
  timestamp: number
  likes: string[] // Array de playerIds
  commentCount: number
}

export interface FogataComment {
  id: string
  postId: string
  authorId: string
  authorName: string
  text: string
  timestamp: number
}

export interface OnlinePlayer {
  id: string
  name: string
  level?: number
  nodeId?: string
  nodeName?: string
  partyId?: string
  isInCombat?: boolean
}

export interface Party {
  id: string
  leaderId: string
  leaderName: string
  members: PartyMember[]
  maxMembers: number
}

export interface PartyMember {
  id: string
  name: string
  hp: number
  maxHp: number
  level: number
  isOnline: boolean
}

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface SocialStoreState {
  // ========================================
  // NPCs
  // ========================================
  npcs: Record<string, NPC>
  activeDialogue: ActiveDialogue | null
  
  // ========================================
  // CHAT
  // ========================================
  chatMessages: ChatMessage[]
  maxChatMessages: number
  unreadCount: number
  
  // ========================================
  // FOGATA (Red Social)
  // ========================================
  fogataPosts: Record<string, FogataPost>
  fogataComments: Record<string, FogataComment[]> // postId -> comments
  currentSortBy: 'recent' | 'popular' | 'commented'
  
  // ========================================
  // PRESENCIA (Jugadores online)
  // ========================================
  onlinePlayers: Record<string, OnlinePlayer>
  
  // ========================================
  // PARTY/GRUPO
  // ========================================
  currentParty: Party | null
  partyInvites: Array<{ from: string, fromId: string, partyId: string }>
  
  // ========================================
  // NPC ACTIONS
  // ========================================
  
  setNPCs: (npcs: Record<string, NPC>) => void
  addNPC: (npc: NPC) => void
  updateNPC: (npcId: string, updates: Partial<NPC>) => void
  removeNPC: (npcId: string) => void
  
  setActiveDialogue: (dialogue: ActiveDialogue | null) => void
  clearDialogue: () => void
  
  getNPCsByNode: (nodeId: string) => NPC[]
  getNPC: (npcId: string) => NPC | undefined
  
  // ========================================
  // CHAT ACTIONS
  // ========================================
  
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
  markChatAsRead: () => void
  getChatByType: (type: ChatMessage['type']) => ChatMessage[]
  
  // ========================================
  // FOGATA ACTIONS
  // ========================================
  
  setFogataPosts: (posts: FogataPost[]) => void
  addFogataPost: (post: FogataPost) => void
  updateFogataPost: (postId: string, updates: Partial<FogataPost>) => void
  removeFogataPost: (postId: string) => void
  
  toggleLike: (postId: string, playerId: string) => void
  incrementCommentCount: (postId: string) => void
  
  setFogataComments: (postId: string, comments: FogataComment[]) => void
  addFogataComment: (comment: FogataComment) => void
  
  setSortBy: (sortBy: 'recent' | 'popular' | 'commented') => void
  getSortedPosts: () => FogataPost[]
  
  // ========================================
  // PRESENCIA ACTIONS
  // ========================================
  
  setOnlinePlayers: (players: OnlinePlayer[]) => void
  addOnlinePlayer: (player: OnlinePlayer) => void
  removeOnlinePlayer: (playerId: string) => void
  updateOnlinePlayer: (playerId: string, updates: Partial<OnlinePlayer>) => void
  
  getOnlinePlayersInNode: (nodeId: string) => OnlinePlayer[]
  getOnlinePlayerCount: () => number
  
  // ========================================
  // PARTY ACTIONS
  // ========================================
  
  setParty: (party: Party | null) => void
  updatePartyMember: (memberId: string, updates: Partial<PartyMember>) => void
  addPartyMember: (member: PartyMember) => void
  removePartyMember: (memberId: string) => void
  
  addPartyInvite: (invite: { from: string, fromId: string, partyId: string }) => void
  removePartyInvite: (partyId: string) => void
  clearPartyInvites: () => void
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  npcs: {},
  activeDialogue: null,
  
  chatMessages: [],
  maxChatMessages: 100,
  unreadCount: 0,
  
  fogataPosts: {},
  fogataComments: {},
  currentSortBy: 'recent' as const,
  
  onlinePlayers: {},
  
  currentParty: null,
  partyInvites: []
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useSocialStore = create<SocialStoreState>((set, get) => ({
  ...initialState,
  
  // ========================================
  // NPC ACTIONS
  // ========================================
  
  setNPCs: (npcs: Record<string, NPC>) => set({ npcs }),
  
  addNPC: (npc: NPC) => set((state) => ({
    npcs: { ...state.npcs, [npc.id]: npc }
  })),
  
  updateNPC: (npcId: string, updates: Partial<NPC>) => set((state) => ({
    npcs: {
      ...state.npcs,
      [npcId]: state.npcs[npcId] 
        ? { ...state.npcs[npcId], ...updates }
        : updates as NPC
    }
  })),
  
  removeNPC: (npcId: string) => set((state) => {
    const { [npcId]: removed, ...remaining } = state.npcs
    return { npcs: remaining }
  }),
  
  setActiveDialogue: (dialogue: ActiveDialogue | null) => set({ activeDialogue: dialogue }),
  
  clearDialogue: () => set({ activeDialogue: null }),
  
  getNPCsByNode: (nodeId: string) => {
    return Object.values(get().npcs).filter(npc => npc.nodeId === nodeId)
  },
  
  getNPC: (npcId: string) => get().npcs[npcId],
  
  // ========================================
  // CHAT ACTIONS
  // ========================================
  
  addChatMessage: (message: ChatMessage) => set((state) => {
    const newMessages = [...state.chatMessages, message]
    
    // Limitar historial
    if (newMessages.length > state.maxChatMessages) {
      newMessages.shift()
    }
    
    return {
      chatMessages: newMessages,
      unreadCount: state.unreadCount + 1
    }
  }),
  
  clearChat: () => set({ chatMessages: [], unreadCount: 0 }),
  
  markChatAsRead: () => set({ unreadCount: 0 }),
  
  getChatByType: (type: ChatMessage['type']) => {
    return get().chatMessages.filter(msg => msg.type === type)
  },
  
  // ========================================
  // FOGATA ACTIONS
  // ========================================
  
  setFogataPosts: (posts: FogataPost[]) => {
    const postsRecord = posts.reduce((acc, post) => {
      acc[post.id] = post
      return acc
    }, {} as Record<string, FogataPost>)
    
    set({ fogataPosts: postsRecord })
  },
  
  addFogataPost: (post: FogataPost) => set((state) => ({
    fogataPosts: { ...state.fogataPosts, [post.id]: post }
  })),
  
  updateFogataPost: (postId: string, updates: Partial<FogataPost>) => set((state) => ({
    fogataPosts: {
      ...state.fogataPosts,
      [postId]: state.fogataPosts[postId]
        ? { ...state.fogataPosts[postId], ...updates }
        : updates as FogataPost
    }
  })),
  
  removeFogataPost: (postId: string) => set((state) => {
    const { [postId]: removed, ...remaining } = state.fogataPosts
    const { [postId]: removedComments, ...remainingComments } = state.fogataComments
    return { 
      fogataPosts: remaining,
      fogataComments: remainingComments
    }
  }),
  
  toggleLike: (postId: string, playerId: string) => set((state) => {
    const post = state.fogataPosts[postId]
    if (!post) return state
    
    const likes = [...post.likes]
    const index = likes.indexOf(playerId)
    
    if (index === -1) {
      likes.push(playerId)
    } else {
      likes.splice(index, 1)
    }
    
    return {
      fogataPosts: {
        ...state.fogataPosts,
        [postId]: { ...post, likes }
      }
    }
  }),
  
  incrementCommentCount: (postId: string) => set((state) => {
    const post = state.fogataPosts[postId]
    if (!post) return state
    
    return {
      fogataPosts: {
        ...state.fogataPosts,
        [postId]: { ...post, commentCount: post.commentCount + 1 }
      }
    }
  }),
  
  setFogataComments: (postId: string, comments: FogataComment[]) => set((state) => ({
    fogataComments: { ...state.fogataComments, [postId]: comments }
  })),
  
  addFogataComment: (comment: FogataComment) => set((state) => {
    const existing = state.fogataComments[comment.postId] || []
    return {
      fogataComments: {
        ...state.fogataComments,
        [comment.postId]: [...existing, comment]
      }
    }
  }),
  
  setSortBy: (sortBy: 'recent' | 'popular' | 'commented') => set({ currentSortBy: sortBy }),
  
  getSortedPosts: () => {
    const posts = Object.values(get().fogataPosts)
    const sortBy = get().currentSortBy
    
    switch (sortBy) {
      case 'popular':
        return posts.sort((a, b) => b.likes.length - a.likes.length)
      case 'commented':
        return posts.sort((a, b) => b.commentCount - a.commentCount)
      case 'recent':
      default:
        return posts.sort((a, b) => b.timestamp - a.timestamp)
    }
  },
  
  // ========================================
  // PRESENCIA ACTIONS
  // ========================================
  
  setOnlinePlayers: (players: OnlinePlayer[]) => {
    const playersRecord = players.reduce((acc, player) => {
      acc[player.id] = player
      return acc
    }, {} as Record<string, OnlinePlayer>)
    
    set({ onlinePlayers: playersRecord })
  },
  
  addOnlinePlayer: (player: OnlinePlayer) => set((state) => ({
    onlinePlayers: { ...state.onlinePlayers, [player.id]: player }
  })),
  
  removeOnlinePlayer: (playerId: string) => set((state) => {
    const { [playerId]: removed, ...remaining } = state.onlinePlayers
    return { onlinePlayers: remaining }
  }),
  
  updateOnlinePlayer: (playerId: string, updates: Partial<OnlinePlayer>) => set((state) => ({
    onlinePlayers: {
      ...state.onlinePlayers,
      [playerId]: state.onlinePlayers[playerId]
        ? { ...state.onlinePlayers[playerId], ...updates }
        : updates as OnlinePlayer
    }
  })),
  
  getOnlinePlayersInNode: (nodeId: string) => {
    return Object.values(get().onlinePlayers).filter(p => p.nodeId === nodeId)
  },
  
  getOnlinePlayerCount: () => Object.keys(get().onlinePlayers).length,
  
  // ========================================
  // PARTY ACTIONS
  // ========================================
  
  setParty: (party: Party | null) => set({ currentParty: party }),
  
  updatePartyMember: (memberId: string, updates: Partial<PartyMember>) => set((state) => {
    if (!state.currentParty) return state
    
    const members = state.currentParty.members.map(m =>
      m.id === memberId ? { ...m, ...updates } : m
    )
    
    return {
      currentParty: { ...state.currentParty, members }
    }
  }),
  
  addPartyMember: (member: PartyMember) => set((state) => {
    if (!state.currentParty) return state
    
    return {
      currentParty: {
        ...state.currentParty,
        members: [...state.currentParty.members, member]
      }
    }
  }),
  
  removePartyMember: (memberId: string) => set((state) => {
    if (!state.currentParty) return state
    
    return {
      currentParty: {
        ...state.currentParty,
        members: state.currentParty.members.filter(m => m.id !== memberId)
      }
    }
  }),
  
  addPartyInvite: (invite) => set((state) => ({
    partyInvites: [...state.partyInvites, invite]
  })),
  
  removePartyInvite: (partyId: string) => set((state) => ({
    partyInvites: state.partyInvites.filter(inv => inv.partyId !== partyId)
  })),
  
  clearPartyInvites: () => set({ partyInvites: [] })
}))
