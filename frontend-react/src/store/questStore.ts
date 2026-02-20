import { create } from 'zustand';

export interface Quest {
  id: number;
  title: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'event';
  status: 'available' | 'active' | 'completed' | 'failed' | 'expired';
  objectives: QuestObjective[];
  rewards: QuestReward[];
  level_required?: number;
  expires_at?: string;
  progress?: number;
  max_progress?: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'visit' | 'craft' | 'talk' | 'survive';
  target?: string;
  current: number;
  required: number;
  completed: boolean;
}

export interface QuestReward {
  type: 'xp' | 'caps' | 'item' | 'reputation';
  amount: number;
  item_id?: string;
  item_name?: string;
}

interface QuestState {
  // State
  quests: Quest[];
  activeQuests: Quest[];
  completedQuests: Quest[];
  selectedQuest: Quest | null;
  dailyQuestsRefreshAt: string | null;
  
  // Actions
  setQuests: (quests: Quest[]) => void;
  addQuest: (quest: Quest) => void;
  updateQuest: (questId: number, updates: Partial<Quest>) => void;
  removeQuest: (questId: number) => void;
  selectQuest: (quest: Quest | null) => void;
  acceptQuest: (questId: number) => void;
  completeQuest: (questId: number) => void;
  abandonQuest: (questId: number) => void;
  updateObjective: (questId: number, objectiveId: string, current: number) => void;
  setDailyRefreshTime: (time: string) => void;
  clearExpiredQuests: () => void;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  // Initial state
  quests: [],
  activeQuests: [],
  completedQuests: [],
  selectedQuest: null,
  dailyQuestsRefreshAt: null,

  // Actions
  setQuests: (quests) => {
    const active = quests.filter(q => q.status === 'active');
    const completed = quests.filter(q => q.status === 'completed');
    set({ quests, activeQuests: active, completedQuests: completed });
  },

  addQuest: (quest) => {
    const { quests } = get();
    const exists = quests.find(q => q.id === quest.id);
    if (exists) {
      get().updateQuest(quest.id, quest);
      return;
    }
    
    const newQuests = [...quests, quest];
    const active = newQuests.filter(q => q.status === 'active');
    const completed = newQuests.filter(q => q.status === 'completed');
    
    set({ 
      quests: newQuests, 
      activeQuests: active,
      completedQuests: completed 
    });
  },

  updateQuest: (questId, updates) => {
    set((state) => {
      const quests = state.quests.map(q => 
        q.id === questId ? { ...q, ...updates } : q
      );
      const active = quests.filter(q => q.status === 'active');
      const completed = quests.filter(q => q.status === 'completed');
      
      return { 
        quests,
        activeQuests: active,
        completedQuests: completed,
        selectedQuest: state.selectedQuest?.id === questId 
          ? { ...state.selectedQuest, ...updates }
          : state.selectedQuest
      };
    });
  },

  removeQuest: (questId) => {
    set((state) => {
      const quests = state.quests.filter(q => q.id !== questId);
      const active = quests.filter(q => q.status === 'active');
      const completed = quests.filter(q => q.status === 'completed');
      
      return {
        quests,
        activeQuests: active,
        completedQuests: completed,
        selectedQuest: state.selectedQuest?.id === questId ? null : state.selectedQuest
      };
    });
  },

  selectQuest: (quest) => set({ selectedQuest: quest }),

  acceptQuest: (questId) => {
    get().updateQuest(questId, { status: 'active' });
  },

  completeQuest: (questId) => {
    get().updateQuest(questId, { 
      status: 'completed',
      progress: 100 
    });
  },

  abandonQuest: (questId) => {
    get().updateQuest(questId, { status: 'available' });
  },

  updateObjective: (questId, objectiveId, current) => {
    set((state) => {
      const quests = state.quests.map(quest => {
        if (quest.id !== questId) return quest;
        
        const objectives = quest.objectives.map(obj => {
          if (obj.id !== objectiveId) return obj;
          return {
            ...obj,
            current: Math.min(current, obj.required),
            completed: current >= obj.required
          };
        });
        
        // Calculate overall progress
        const totalRequired = objectives.reduce((sum, obj) => sum + obj.required, 0);
        const totalCurrent = objectives.reduce((sum, obj) => sum + obj.current, 0);
        const progress = totalRequired > 0 ? Math.floor((totalCurrent / totalRequired) * 100) : 0;
        
        return { ...quest, objectives, progress };
      });
      
      const active = quests.filter(q => q.status === 'active');
      const completed = quests.filter(q => q.status === 'completed');
      
      return { 
        quests,
        activeQuests: active,
        completedQuests: completed
      };
    });
  },

  setDailyRefreshTime: (time) => set({ dailyQuestsRefreshAt: time }),

  clearExpiredQuests: () => {
    const now = new Date();
    set((state) => {
      const quests = state.quests.map(q => {
        if (q.expires_at && new Date(q.expires_at) < now && q.status !== 'completed') {
          return { ...q, status: 'expired' as const };
        }
        return q;
      });
      
      const active = quests.filter(q => q.status === 'active');
      const completed = quests.filter(q => q.status === 'completed');
      
      return { quests, activeQuests: active, completedQuests: completed };
    });
  }
}));
