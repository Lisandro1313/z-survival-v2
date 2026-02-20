import { create } from 'zustand'
import type { 
  WorldState, 
  WorldGraph,
  Node, 
  NodeId,
  Entity, 
  EntityId,
  CombatInstance,
  CombatId,
  NodeEconomy,
  GameEvent,
  EventId
} from '../types/world'

// ============================================================================
// WORLD STORE - Modelo definitivo (5 sistemas separados)
// ============================================================================

interface WorldStoreState extends WorldState {
  // ========================================
  // GRAPH ACTIONS
  // ========================================
  
  setGraph: (graph: WorldGraph) => void
  updateNode: (nodeId: NodeId, updates: Partial<Node>) => void
  addNode: (node: Node) => void
  removeNode: (nodeId: NodeId) => void
  setEdges: (nodeId: NodeId, edges: NodeId[]) => void
  
  // ========================================
  // ENTITY ACTIONS (indexed, NO arrays)
  // ========================================
  
  setEntities: (entities: Record<EntityId, Entity>) => void
  updateEntity: (entityId: EntityId, updates: Partial<Entity>) => void
  addEntity: (entity: Entity) => void
  removeEntity: (entityId: EntityId) => void
  
  // Helpers para queries comunes (NO modifican state)
  getEntitiesInNode: (nodeId: NodeId) => Entity[]
  getEntity: (entityId: EntityId) => Entity | undefined
  
  // ========================================
  // COMBAT ACTIONS
  // ========================================
  
  setCombats: (combats: Record<CombatId, CombatInstance>) => void
  addCombat: (combat: CombatInstance) => void
  updateCombat: (combatId: CombatId, updates: Partial<CombatInstance>) => void
  removeCombat: (combatId: CombatId) => void
  
  // ========================================
  // ECONOMY ACTIONS
  // ========================================
  
  setEconomies: (economies: Record<NodeId, NodeEconomy>) => void
  updateEconomy: (nodeId: NodeId, updates: Partial<NodeEconomy>) => void
  addEconomy: (economy: NodeEconomy) => void
  
  // ========================================
  // EVENT ACTIONS
  // ========================================
  
  setEvents: (events: Record<EventId, GameEvent>) => void
  addEvent: (event: GameEvent) => void
  removeEvent: (eventId: EventId) => void
  updateEvent: (eventId: EventId, updates: Partial<GameEvent>) => void
  
  // ========================================
  // METADATA ACTIONS
  // ========================================
  
  setCurrentNode: (nodeId: NodeId) => void
  
  // ========================================
  // UTILITY ACTIONS
  // ========================================
  
  clearWorld: () => void
  replaceWorldSnapshot: (snapshot: Partial<WorldState>) => void
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: WorldState = {
  graph: {
    nodes: {},
    edges: {}
  },
  entities: {}, // ✅ Record, NO array
  combats: {}, // ✅ Separado
  economies: {}, // ✅ Separado
  events: {}, // ✅ Separado
  currentNode: undefined
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useWorldStore = create<WorldStoreState>((set, get) => ({
  ...initialState,
  
  // ========================================
  // GRAPH ACTIONS
  // ========================================
  
  setGraph: (graph: WorldGraph) => set({ graph }),
  
  updateNode: (nodeId: NodeId, updates: Partial<Node>) => set((state) => ({
    graph: {
      ...state.graph,
      nodes: {
        ...state.graph.nodes,
        [nodeId]: state.graph.nodes[nodeId]
          ? { ...state.graph.nodes[nodeId], ...updates }
          : updates as Node
      }
    }
  })),
  
  addNode: (node: Node) => set((state) => ({
    graph: {
      ...state.graph,
      nodes: { ...state.graph.nodes, [node.id]: node }
    }
  })),
  
  removeNode: (nodeId: NodeId) => set((state) => {
    const { [nodeId]: removed, ...remainingNodes } = state.graph.nodes
    const { [nodeId]: removedEdges, ...remainingEdges } = state.graph.edges
    return {
      graph: {
        nodes: remainingNodes,
        edges: remainingEdges
      }
    }
  }),
  
  setEdges: (nodeId: NodeId, edges: NodeId[]) => set((state) => ({
    graph: {
      ...state.graph,
      edges: { ...state.graph.edges, [nodeId]: edges }
    }
  })),
  
  // ========================================
  // ENTITY ACTIONS (indexed access O(1))
  // ========================================
  
  setEntities: (entities: Record<EntityId, Entity>) => set({ entities }),
  
  updateEntity: (entityId, updates) => set((state) => ({
    entities: {
      ...state.entities,
      [entityId]: state.entities[entityId]
        ? { ...state.entities[entityId], ...updates }
        : updates as Entity
    }
  })),
  
  addEntity: (entity: Entity) => set((state) => ({
    entities: { ...state.entities, [entity.id]: entity }
  })),
  
  removeEntity: (entityId: EntityId) => set((state) => {
    const { [entityId]: removed, ...remaining } = state.entities
    return { entities: remaining }
  }),
  
  // Helpers (NO modifican state, solo queries)
  getEntitiesInNode: (nodeId: NodeId) => {
    const entities = get().entities
    return Object.values(entities).filter((e: Entity) => e.nodeId === nodeId)
  },
  
  getEntity: (entityId: EntityId) => {
    return get().entities[entityId]
  },
  
  // ========================================
  // COMBAT ACTIONS
  // ========================================
  
  setCombats: (combats: Record<CombatId, CombatInstance>) => set({ combats }),
  
  addCombat: (combat) => set((state) => ({
    combats: { ...state.combats, [combat.id]: combat }
  })),
  
  updateCombat: (combatId: CombatId, updates: Partial<CombatInstance>) => set((state) => ({
    combats: {
      ...state.combats,
      [combatId]: state.combats[combatId]
        ? { ...state.combats[combatId], ...updates }
        : updates as CombatInstance
    }
  })),
  
  removeCombat: (combatId: CombatId) => set((state) => {
    const { [combatId]: removed, ...remaining } = state.combats
    return { combats: remaining }
  }),
  
  // ========================================
  // ECONOMY ACTIONS
  // ========================================
  
  setEconomies: (economies: Record<NodeId, NodeEconomy>) => set({ economies }),
  
  updateEconomy: (nodeId, updates) => set((state) => ({
    economies: {
      ...state.economies,
      [nodeId]: state.economies[nodeId]
        ? { ...state.economies[nodeId], ...updates }
        : { nodeId, supply: {}, demand: {}, priceModifiers: {}, ...updates }
    }
  })),
  
  addEconomy: (economy: NodeEconomy) => set((state) => ({
    economies: { ...state.economies, [economy.nodeId]: economy }
  })),
  
  // ========================================
  // EVENT ACTIONS
  // ========================================
  
  setEvents: (events: Record<EventId, GameEvent>) => set({ events }),
  
  addEvent: (event) => set((state) => ({
    events: { ...state.events, [event.id]: event }
  })),
  
  removeEvent: (eventId: EventId) => set((state) => {
    const { [eventId]: removed, ...remaining } = state.events
    return { events: remaining }
  }),
  
  updateEvent: (eventId: EventId, updates: Partial<GameEvent>) => set((state) => {
    if (!state.events[eventId]) return state
    
    return {
      events: {
        ...state.events,
        [eventId]: { ...state.events[eventId], ...updates } as GameEvent
      }
    }
  }),
  
  // ========================================
  // METADATA ACTIONS
  // ========================================
  
  setCurrentNode: (nodeId: NodeId) => set({ currentNode: nodeId }),
  
  // ========================================
  // UTILITY ACTIONS
  // ========================================
  
  clearWorld: () => set(initialState),
  
  /**
   * Reemplazar todo el mundo con un snapshot (usado en login/reconexión)
   */
  replaceWorldSnapshot: (snapshot: Partial<WorldState>) => set((state) => ({
    ...state,
    ...snapshot
  }))
}))

// ============================================================================
// SELECTORS (Queries optimizadas)
// ============================================================================

/**
 * Obtener nodos vecinos
 */
export const selectNeighborNodes = (state: WorldStoreState, nodeId: NodeId): Node[] => {
  const edges = state.graph.edges[nodeId] || []
  return edges
    .map(edgeId => state.graph.nodes[edgeId])
    .filter(Boolean)
}

/**
 * Obtener combates activos de un jugador
 */
export const selectPlayerCombats = (state: WorldStoreState, playerId: EntityId): CombatInstance[] => {
  return Object.values(state.combats).filter(combat =>
    combat.state === 'active' && combat.participants.includes(playerId)
  )
}

/**
 * Obtener eventos activos en un nodo
 */
export const selectNodeEvents = (state: WorldStoreState, nodeId: NodeId): GameEvent[] => {
  return Object.values(state.events).filter(event => {
    if ('affectedNodes' in event) {
      return event.affectedNodes.includes(nodeId)
    }
    if ('nodeId' in event) {
      return event.nodeId === nodeId
    }
    return false
  })
}
