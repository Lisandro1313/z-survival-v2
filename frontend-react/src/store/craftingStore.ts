import { create } from 'zustand';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: 'weapon' | 'armor' | 'consumable' | 'tool' | 'building' | 'ammo' | 'misc';
  ingredients: RecipeIngredient[];
  result_item_id: string;
  result_quantity: number;
  level_required: number;
  crafting_time: number; // en segundos
  xp_reward: number;
  unlocked: boolean;
}

export interface RecipeIngredient {
  item_id: string;
  item_name: string;
  quantity_required: number;
  quantity_available: number;
}

export interface CraftingSession {
  recipe_id: string;
  recipe_name: string;
  started_at: string;
  ends_at: string;
  progress: number; // 0-100
  can_rush: boolean;
}

interface CraftingState {
  // State
  recipes: Recipe[];
  unlockedRecipes: Recipe[];
  lockedRecipes: Recipe[];
  selectedRecipe: Recipe | null;
  craftingQueue: CraftingSession[];
  currentCrafting: CraftingSession | null;
  filterCategory: string;
  searchQuery: string;
  
  // Actions
  setRecipes: (recipes: Recipe[]) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipeId: string, updates: Partial<Recipe>) => void;
  unlockRecipe: (recipeId: string) => void;
  selectRecipe: (recipe: Recipe | null) => void;
  setFilterCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  
  // Crafting actions
  startCrafting: (session: CraftingSession) => void;
  updateCraftingProgress: (recipeId: string, progress: number) => void;
  completeCrafting: (recipeId: string) => void;
  cancelCrafting: (recipeId: string) => void;
  addToQueue: (session: CraftingSession) => void;
  removeFromQueue: (recipeId: string) => void;
  
  // Computed
  getFilteredRecipes: () => Recipe[];
  canCraft: (recipeId: string) => boolean;
}

export const useCraftingStore = create<CraftingState>((set, get) => ({
  // Initial state
  recipes: [],
  unlockedRecipes: [],
  lockedRecipes: [],
  selectedRecipe: null,
  craftingQueue: [],
  currentCrafting: null,
  filterCategory: 'all',
  searchQuery: '',

  // Actions
  setRecipes: (recipes) => {
    const unlocked = recipes.filter(r => r.unlocked);
    const locked = recipes.filter(r => !r.unlocked);
    set({ recipes, unlockedRecipes: unlocked, lockedRecipes: locked });
  },

  addRecipe: (recipe) => {
    const { recipes } = get();
    const exists = recipes.find(r => r.id === recipe.id);
    if (exists) {
      get().updateRecipe(recipe.id, recipe);
      return;
    }
    
    const newRecipes = [...recipes, recipe];
    const unlocked = newRecipes.filter(r => r.unlocked);
    const locked = newRecipes.filter(r => !r.unlocked);
    
    set({ 
      recipes: newRecipes,
      unlockedRecipes: unlocked,
      lockedRecipes: locked
    });
  },

  updateRecipe: (recipeId, updates) => {
    set((state) => {
      const recipes = state.recipes.map(r =>
        r.id === recipeId ? { ...r, ...updates } : r
      );
      const unlocked = recipes.filter(r => r.unlocked);
      const locked = recipes.filter(r => !r.unlocked);
      
      return {
        recipes,
        unlockedRecipes: unlocked,
        lockedRecipes: locked,
        selectedRecipe: state.selectedRecipe?.id === recipeId
          ? { ...state.selectedRecipe, ...updates }
          : state.selectedRecipe
      };
    });
  },

  unlockRecipe: (recipeId) => {
    get().updateRecipe(recipeId, { unlocked: true });
  },

  selectRecipe: (recipe) => set({ selectedRecipe: recipe }),

  setFilterCategory: (category) => set({ filterCategory: category }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  // Crafting actions
  startCrafting: (session) => {
    set({ currentCrafting: session });
  },

  updateCraftingProgress: (recipeId, progress) => {
    set((state) => {
      if (state.currentCrafting?.recipe_id === recipeId) {
        return {
          currentCrafting: {
            ...state.currentCrafting,
            progress: Math.min(100, Math.max(0, progress))
          }
        };
      }
      
      const queue = state.craftingQueue.map(session =>
        session.recipe_id === recipeId
          ? { ...session, progress: Math.min(100, Math.max(0, progress)) }
          : session
      );
      
      return { craftingQueue: queue };
    });
  },

  completeCrafting: (recipeId) => {
    set((state) => {
      if (state.currentCrafting?.recipe_id === recipeId) {
        // Move to next in queue or clear
        const [nextSession, ...remainingQueue] = state.craftingQueue;
        return {
          currentCrafting: nextSession || null,
          craftingQueue: remainingQueue
        };
      }
      
      // Remove from queue
      const queue = state.craftingQueue.filter(s => s.recipe_id !== recipeId);
      return { craftingQueue: queue };
    });
  },

  cancelCrafting: (recipeId) => {
    set((state) => {
      if (state.currentCrafting?.recipe_id === recipeId) {
        const [nextSession, ...remainingQueue] = state.craftingQueue;
        return {
          currentCrafting: nextSession || null,
          craftingQueue: remainingQueue
        };
      }
      
      const queue = state.craftingQueue.filter(s => s.recipe_id !== recipeId);
      return { craftingQueue: queue };
    });
  },

  addToQueue: (session) => {
    set((state) => ({
      craftingQueue: [...state.craftingQueue, session]
    }));
  },

  removeFromQueue: (recipeId) => {
    set((state) => ({
      craftingQueue: state.craftingQueue.filter(s => s.recipe_id !== recipeId)
    }));
  },

  // Computed
  getFilteredRecipes: () => {
    const { unlockedRecipes, filterCategory, searchQuery } = get();
    
    let filtered = unlockedRecipes;
    
    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(r => r.category === filterCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  },

  canCraft: (recipeId) => {
    const { recipes } = get();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe || !recipe.unlocked) return false;
    
    // Check if all ingredients are available
    return recipe.ingredients.every(
      ing => ing.quantity_available >= ing.quantity_required
    );
  }
}));
