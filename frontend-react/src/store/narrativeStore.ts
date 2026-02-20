import { create } from 'zustand'

// ============================================================================
// NARRATIVE STORE - Gestión de historia, decisiones y progreso narrativo
// ============================================================================

export interface StoryChoice {
  id: string
  text: string
  consequences?: string[]
  requirements?: Record<string, unknown>
}

export interface StoryNode {
  id: string
  title: string
  content: string
  type: 'event' | 'choice' | 'ending' | 'milestone'
  choices?: StoryChoice[]
  nextNodeId?: string
  timestamp: number
}

export interface PlayerChoice {
  id: string
  nodeId: string
  choiceId: string
  choiceText: string
  timestamp: number
  consequences: string[]
}

export interface StoryBranch {
  id: string
  name: string
  description: string
  isActive: boolean
  nodes: string[] // nodeIds
  progress: number // 0-100
}

export interface Ending {
  id: string
  name: string
  description: string
  type: 'good' | 'neutral' | 'bad' | 'secret'
  unlocked: boolean
  achievedAt?: number
}

export interface Milestone {
  id: string
  name: string
  description: string
  category: 'story' | 'combat' | 'social' | 'exploration' | 'survival'
  achieved: boolean
  achievedAt?: number
  reward?: string
}

export interface NarrativeStoreState {
  // State
  currentNodeId: string | null
  visitedNodes: Set<string>
  storyNodes: Record<string, StoryNode>
  
  // Choices & Consequences
  playerChoices: PlayerChoice[]
  activeConsequences: string[]
  
  // Branches & Progress
  branches: Record<string, StoryBranch>
  activeBranchId: string | null
  
  // Endings & Milestones
  endings: Record<string, Ending>
  milestones: Record<string, Milestone>
  
  // Meta
  storyProgress: number // 0-100, overall completion
  playthrough: number // Number of times story completed
  
  // Actions - Story Progress
  setCurrentNode: (nodeId: string) => void
  visitNode: (nodeId: string) => void
  addStoryNode: (node: StoryNode) => void
  updateStoryNode: (nodeId: string, updates: Partial<StoryNode>) => void
  
  // Actions - Choices
  makeChoice: (nodeId: string, choice: StoryChoice) => void
  addConsequence: (consequence: string) => void
  removeConsequence: (consequence: string) => void
  clearConsequences: () => void
  
  // Actions - Branches
  setBranches: (branches: Record<string, StoryBranch>) => void
  setActiveBranch: (branchId: string) => void
  updateBranchProgress: (branchId: string, progress: number) => void
  completeBranch: (branchId: string) => void
  
  // Actions - Endings & Milestones
  unlockEnding: (endingId: string) => void
  achieveMilestone: (milestoneId: string) => void
  addMilestone: (milestone: Milestone) => void
  
  // Actions - Meta
  setStoryProgress: (progress: number) => void
  incrementPlaythrough: () => void
  resetStory: () => void
  
  // Queries
  getCurrentNode: () => StoryNode | null
  hasVisited: (nodeId: string) => boolean
  getChoiceHistory: (limit?: number) => PlayerChoice[]
  getBranchProgress: (branchId: string) => number
  getUnlockedEndings: () => Ending[]
  getAchievedMilestones: (category?: Milestone['category']) => Milestone[]
  canMakeChoice: (choice: StoryChoice) => boolean
}

export const useNarrativeStore = create<NarrativeStoreState>((set, get) => ({
  // Initial State
  currentNodeId: null,
  visitedNodes: new Set(),
  storyNodes: {},
  playerChoices: [],
  activeConsequences: [],
  branches: {},
  activeBranchId: null,
  endings: {},
  milestones: {},
  storyProgress: 0,
  playthrough: 1,
  
  // ==========================================
  // STORY PROGRESS
  // ==========================================
  
  setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),
  
  visitNode: (nodeId) => set(state => {
    const newVisited = new Set(state.visitedNodes)
    newVisited.add(nodeId)
    return { visitedNodes: newVisited, currentNodeId: nodeId }
  }),
  
  addStoryNode: (node) => set(state => ({
    storyNodes: { ...state.storyNodes, [node.id]: node }
  })),
  
  updateStoryNode: (nodeId, updates) => set(state => {
    const node = state.storyNodes[nodeId]
    if (!node) return state
    
    return {
      storyNodes: {
        ...state.storyNodes,
        [nodeId]: { ...node, ...updates }
      }
    }
  }),
  
  // ==========================================
  // CHOICES
  // ==========================================
  
  makeChoice: (nodeId, choice) => set(state => {
    const playerChoice: PlayerChoice = {
      id: `choice_${Date.now()}`,
      nodeId,
      choiceId: choice.id,
      choiceText: choice.text,
      timestamp: Date.now(),
      consequences: choice.consequences || []
    }
    
    const newConsequences = [
      ...state.activeConsequences,
      ...(choice.consequences || [])
    ]
    
    return {
      playerChoices: [...state.playerChoices, playerChoice],
      activeConsequences: newConsequences
    }
  }),
  
  addConsequence: (consequence) => set(state => ({
    activeConsequences: [...state.activeConsequences, consequence]
  })),
  
  removeConsequence: (consequence) => set(state => ({
    activeConsequences: state.activeConsequences.filter(c => c !== consequence)
  })),
  
  clearConsequences: () => set({ activeConsequences: [] }),
  
  // ==========================================
  // BRANCHES
  // ==========================================
  
  setBranches: (branches) => set({ branches }),
  
  setActiveBranch: (branchId) => set(state => {
    // Deactivate all branches first
    const updatedBranches = Object.fromEntries(
      Object.entries(state.branches).map(([id, branch]) => [
        id,
        { ...branch, isActive: id === branchId }
      ])
    )
    
    return {
      branches: updatedBranches,
      activeBranchId: branchId
    }
  }),
  
  updateBranchProgress: (branchId, progress) => set(state => {
    const branch = state.branches[branchId]
    if (!branch) return state
    
    return {
      branches: {
        ...state.branches,
        [branchId]: {
          ...branch,
          progress: Math.max(0, Math.min(100, progress))
        }
      }
    }
  }),
  
  completeBranch: (branchId) => set(state => {
    const branch = state.branches[branchId]
    if (!branch) return state
    
    return {
      branches: {
        ...state.branches,
        [branchId]: {
          ...branch,
          progress: 100,
          isActive: false
        }
      }
    }
  }),
  
  // ==========================================
  // ENDINGS & MILESTONES
  // ==========================================
  
  unlockEnding: (endingId) => set(state => {
    const ending = state.endings[endingId]
    if (!ending || ending.unlocked) return state
    
    return {
      endings: {
        ...state.endings,
        [endingId]: {
          ...ending,
          unlocked: true,
          achievedAt: Date.now()
        }
      }
    }
  }),
  
  achieveMilestone: (milestoneId) => set(state => {
    const milestone = state.milestones[milestoneId]
    if (!milestone || milestone.achieved) return state
    
    return {
      milestones: {
        ...state.milestones,
        [milestoneId]: {
          ...milestone,
          achieved: true,
          achievedAt: Date.now()
        }
      }
    }
  }),
  
  addMilestone: (milestone) => set(state => ({
    milestones: { ...state.milestones, [milestone.id]: milestone }
  })),
  
  // ==========================================
  // META
  // ==========================================
  
  setStoryProgress: (progress) => set({ 
    storyProgress: Math.max(0, Math.min(100, progress)) 
  }),
  
  incrementPlaythrough: () => set(state => ({ 
    playthrough: state.playthrough + 1 
  })),
  
  resetStory: () => set({
    currentNodeId: null,
    visitedNodes: new Set(),
    playerChoices: [],
    activeConsequences: [],
    activeBranchId: null,
    storyProgress: 0
    // Note: We keep endings, milestones, and playthrough count
  }),
  
  // ==========================================
  // QUERIES
  // ==========================================
  
  getCurrentNode: () => {
    const state = get()
    return state.currentNodeId ? state.storyNodes[state.currentNodeId] || null : null
  },
  
  hasVisited: (nodeId) => {
    return get().visitedNodes.has(nodeId)
  },
  
  getChoiceHistory: (limit) => {
    const choices = get().playerChoices
    return limit ? choices.slice(-limit) : choices
  },
  
  getBranchProgress: (branchId) => {
    return get().branches[branchId]?.progress || 0
  },
  
  getUnlockedEndings: () => {
    return Object.values(get().endings).filter(e => e.unlocked)
  },
  
  getAchievedMilestones: (category) => {
    const milestones = Object.values(get().milestones).filter(m => m.achieved)
    return category ? milestones.filter(m => m.category === category) : milestones
  },
  
  canMakeChoice: (choice) => {
    // Check if requirements are met
    if (!choice.requirements) return true
    
    // Here you would check against player state, inventory, etc.
    // For now, just return true
    return true
  }
}))

export default useNarrativeStore
