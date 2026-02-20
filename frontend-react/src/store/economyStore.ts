import { create } from 'zustand';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price_caps: number;
  stock: number;
  max_stock: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level_required: number;
  reputation_required?: number;
  discount?: number; // percentage
}

export interface MarketListing {
  id: number;
  seller_id: number;
  seller_name: string;
  item_id: string;
  item_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  listed_at: string;
  expires_at: string;
  type: 'sell' | 'auction';
  current_bid?: number;
  highest_bidder?: string;
}

export interface Transaction {
  id: number;
  type: 'purchase' | 'sale' | 'trade' | 'auction';
  item_name: string;
  quantity: number;
  price: number;
  other_party?: string;
  timestamp: string;
  success: boolean;
}

interface EconomyState {
  // State
  playerCaps: number;
  shopItems: ShopItem[];
  marketListings: MarketListing[];
  myListings: MarketListing[];
  transactions: Transaction[];
  selectedShopItem: ShopItem | null;
  selectedListing: MarketListing | null;
  cartItems: Array<{ item: ShopItem; quantity: number }>;
  
  // Filters
  shopCategory: string;
  shopSearchQuery: string;
  marketFilter: 'all' | 'weapons' | 'armor' | 'consumables' | 'resources' | 'misc';
  sortBy: 'price_asc' | 'price_desc' | 'newest' | 'ending_soon';
  
  // Actions
  setCaps: (caps: number) => void;
  addCaps: (amount: number) => void;
  removeCaps: (amount: number) => void;
  
  // Shop actions
  setShopItems: (items: ShopItem[]) => void;
  updateShopItem: (itemId: string, updates: Partial<ShopItem>) => void;
  selectShopItem: (item: ShopItem | null) => void;
  setShopCategory: (category: string) => void;
  setShopSearchQuery: (query: string) => void;
  
  // Cart actions
  addToCart: (item: ShopItem, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  
  // Market actions
  setMarketListings: (listings: MarketListing[]) => void;
  addMarketListing: (listing: MarketListing) => void;
  removeMarketListing: (listingId: number) => void;
  updateMarketListing: (listingId: number, updates: Partial<MarketListing>) => void;
  selectListing: (listing: MarketListing | null) => void;
  setMarketFilter: (filter: EconomyState['marketFilter']) => void;
  setSortBy: (sort: EconomyState['sortBy']) => void;
  
  // My listings
  setMyListings: (listings: MarketListing[]) => void;
  addMyListing: (listing: MarketListing) => void;
  removeMyListing: (listingId: number) => void;
  
  // Transactions
  addTransaction: (transaction: Transaction) => void;
  clearTransactions: () => void;
  
  // Computed
  getFilteredShopItems: () => ShopItem[];
  getFilteredMarketListings: () => MarketListing[];
  canAfford: (price: number) => boolean;
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  // Initial state
  playerCaps: 0,
  shopItems: [],
  marketListings: [],
  myListings: [],
  transactions: [],
  selectedShopItem: null,
  selectedListing: null,
  cartItems: [],
  
  // Filters
  shopCategory: 'all',
  shopSearchQuery: '',
  marketFilter: 'all',
  sortBy: 'newest',

  // Actions
  setCaps: (caps) => set({ playerCaps: Math.max(0, caps) }),
  
  addCaps: (amount) => set((state) => ({ 
    playerCaps: state.playerCaps + Math.abs(amount) 
  })),
  
  removeCaps: (amount) => set((state) => ({ 
    playerCaps: Math.max(0, state.playerCaps - Math.abs(amount)) 
  })),

  // Shop actions
  setShopItems: (items) => set({ shopItems: items }),

  updateShopItem: (itemId, updates) => {
    set((state) => ({
      shopItems: state.shopItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
      selectedShopItem: state.selectedShopItem?.id === itemId
        ? { ...state.selectedShopItem, ...updates }
        : state.selectedShopItem
    }));
  },

  selectShopItem: (item) => set({ selectedShopItem: item }),

  setShopCategory: (category) => set({ shopCategory: category }),

  setShopSearchQuery: (query) => set({ shopSearchQuery: query }),

  // Cart actions
  addToCart: (item, quantity) => {
    set((state) => {
      const existing = state.cartItems.find(ci => ci.item.id === item.id);
      
      if (existing) {
        return {
          cartItems: state.cartItems.map(ci =>
            ci.item.id === item.id
              ? { ...ci, quantity: Math.min(ci.quantity + quantity, item.stock) }
              : ci
          )
        };
      }
      
      return {
        cartItems: [...state.cartItems, { item, quantity: Math.min(quantity, item.stock) }]
      };
    });
  },

  removeFromCart: (itemId) => {
    set((state) => ({
      cartItems: state.cartItems.filter(ci => ci.item.id !== itemId)
    }));
  },

  updateCartQuantity: (itemId, quantity) => {
    set((state) => ({
      cartItems: state.cartItems.map(ci =>
        ci.item.id === itemId
          ? { ...ci, quantity: Math.max(1, Math.min(quantity, ci.item.stock)) }
          : ci
      )
    }));
  },

  clearCart: () => set({ cartItems: [] }),

  getCartTotal: () => {
    const { cartItems } = get();
    return cartItems.reduce((total, ci) => {
      const price = ci.item.price_caps;
      const discount = ci.item.discount || 0;
      const finalPrice = price * (1 - discount / 100);
      return total + (finalPrice * ci.quantity);
    }, 0);
  },

  // Market actions
  setMarketListings: (listings) => set({ marketListings: listings }),

  addMarketListing: (listing) => {
    set((state) => ({
      marketListings: [...state.marketListings, listing]
    }));
  },

  removeMarketListing: (listingId) => {
    set((state) => ({
      marketListings: state.marketListings.filter(l => l.id !== listingId),
      selectedListing: state.selectedListing?.id === listingId ? null : state.selectedListing
    }));
  },

  updateMarketListing: (listingId, updates) => {
    set((state) => ({
      marketListings: state.marketListings.map(l =>
        l.id === listingId ? { ...l, ...updates } : l
      ),
      selectedListing: state.selectedListing?.id === listingId
        ? { ...state.selectedListing, ...updates }
        : state.selectedListing
    }));
  },

  selectListing: (listing) => set({ selectedListing: listing }),

  setMarketFilter: (filter) => set({ marketFilter: filter }),

  setSortBy: (sort) => set({ sortBy: sort }),

  // My listings
  setMyListings: (listings) => set({ myListings: listings }),

  addMyListing: (listing) => {
    set((state) => ({
      myListings: [...state.myListings, listing]
    }));
  },

  removeMyListing: (listingId) => {
    set((state) => ({
      myListings: state.myListings.filter(l => l.id !== listingId)
    }));
  },

  // Transactions
  addTransaction: (transaction) => {
    set((state) => ({
      transactions: [transaction, ...state.transactions].slice(0, 50) // Keep last 50
    }));
  },

  clearTransactions: () => set({ transactions: [] }),

  // Computed
  getFilteredShopItems: () => {
    const { shopItems, shopCategory, shopSearchQuery } = get();
    
    let filtered = shopItems;
    
    // Filter by category
    if (shopCategory !== 'all') {
      filtered = filtered.filter(item => item.category === shopCategory);
    }
    
    // Filter by search
    if (shopSearchQuery.trim()) {
      const query = shopSearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  },

  getFilteredMarketListings: () => {
    const { marketListings, marketFilter, sortBy } = get();
    
    let filtered = [...marketListings];
    
    // Filter by category
    if (marketFilter !== 'all') {
      // This would need category info on listings
      // For now, just return all
    }
    
    // Sort
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price_per_unit - b.price_per_unit);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price_per_unit - a.price_per_unit);
        break;
      case 'newest':
        filtered.sort((a, b) => 
          new Date(b.listed_at).getTime() - new Date(a.listed_at).getTime()
        );
        break;
      case 'ending_soon':
        filtered.sort((a, b) =>
          new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
        );
        break;
    }
    
    return filtered;
  },

  canAfford: (price) => {
    const { playerCaps } = get();
    return playerCaps >= price;
  }
}));
