/* ============================================================================
 * WORLD STATE - MODELO DEFINITIVO (5 SISTEMAS INDEPENDIENTES)
 * ============================================================================
 * 
 * Estado del mundo separado en 5 sistemas desacoplados:
 * 1. WorldGraph - Topología pura
 * 2. EntitySystem - Toda vida del juego
 * 3. CombatSystem - Combate separado
 * 4. EconomySystem - Economía distribuida
 * 5. EventSystem - Eventos globales/locales
 */

// ============================================================================
// 1. WORLD GRAPH - Topología pura
// ============================================================================

export interface WorldGraph {
  nodes: Record<NodeId, Node>
  edges: Record<NodeId, NodeId[]>
}

export type NodeId = string
export type NodeType = 'city' | 'forest' | 'river' | 'house' | 'factory' | 'refuge' | 'hospital' | 'military'

export interface Node {
  id: NodeId
  type: NodeType
  name: string
  description?: string
  
  // Propiedad (opcional)
  ownerClanId?: string
  
  // Referencias a sistemas externos
  dangerLevel: number // 0-100
  economyProfileId: string // Referencia a NodeEconomy
  eventIds: string[] // Referencias a eventos activos
  
  // Coordenadas para renderizado
  coordinates?: { x: number; y: number }
}

// ============================================================================
// 2. ENTITY SYSTEM - Toda vida del juego
// ============================================================================

export type EntityId = string
export type EntityType = 'player' | 'npc' | 'zombie' | 'mercenary' | 'merchant' | 'boss'

export interface Entity {
  id: EntityId
  type: EntityType
  name: string
  
  // Ubicación
  nodeId: NodeId
  position: { x: number; y: number }
  
  // Stats
  stats: EntityStats
  
  // Inventario (referencia)
  inventoryId: string
  
  // Estado actual
  state: EntityState
  
  // Metadatos
  level?: number
  faction?: string
}

export interface EntityStats {
  hp: number
  maxHp: number
  stamina?: number
  maxStamina?: number
  defense?: number
  attack?: number
  speed?: number
}

export type EntityState =
  | { type: 'idle' }
  | { type: 'moving'; targetNode: NodeId; progress: number }
  | { type: 'inCombat'; combatId: string }
  | { type: 'trading'; targetEntityId: EntityId }
  | { type: 'scavenging' }
  | { type: 'resting' }

// ============================================================================
// 3. COMBAT SYSTEM - Separado del mundo
// ============================================================================

export type CombatId = string

export interface CombatInstance {
  id: CombatId
  participants: EntityId[] // Referencias a Entity
  turnOrder: EntityId[]
  currentTurnIndex: number
  log: CombatLogEntry[]
  state: 'active' | 'finished'
  result?: CombatResult
}

export interface CombatLogEntry {
  timestamp: number
  actorId: EntityId
  action: string
  targetId?: EntityId
  damage?: number
  effect?: string
}

export interface CombatResult {
  winner: EntityId | 'draw'
  losers: EntityId[]
  rewards?: Record<string, number>
  experience?: Record<EntityId, number>
}

// ============================================================================
// 4. ECONOMY SYSTEM - Distribuida por nodo
// ============================================================================

export interface NodeEconomy {
  nodeId: NodeId
  supply: Record<ItemId, number>
  demand: Record<ItemId, number>
  priceModifiers: Record<ItemId, number> // Multiplicadores (0.5 = 50% precio, 2.0 = 200%)
}

export type ItemId = string

export interface Marketplace {
  listings: Record<ListingId, Listing>
}

export type ListingId = string

export interface Listing {
  id: ListingId
  sellerId: EntityId
  itemId: ItemId
  quantity: number
  price: number
  timestamp: number
}

// ============================================================================
// 5. EVENT SYSTEM - No mezclado en node
// ============================================================================

export type EventId = string

export type GlobalEvent = {
  id: EventId
  type: 'horde' | 'airdrop' | 'plague' | 'drought' | 'eclipse'
  affectedNodes: NodeId[]
  startTime: number
  endTime: number
  intensity: number // 0-100
  description: string
  rewards?: Record<string, number>
}

export type LocalEvent = {
  id: EventId
  type: 'zombieWave' | 'merchantVisit' | 'bandits' | 'fire'
  nodeId: NodeId
  startTime: number
  endTime: number
  description: string
}

export type GameEvent = GlobalEvent | LocalEvent

// ============================================================================
// WORLD STATE FINAL - Composición de sistemas
// ============================================================================

export interface WorldState {
  // Sistema 1: Grafo del mundo
  graph: WorldGraph
  
  // Sistema 2: Entidades (indexed por ID, NO array)
  entities: Record<EntityId, Entity>
  
  // Sistema 3: Combates activos
  combats: Record<CombatId, CombatInstance>
  
  // Sistema 4: Economías por nodo
  economies: Record<NodeId, NodeEconomy>
  
  // Sistema 5: Eventos activos
  events: Record<EventId, GameEvent>
  
  // Metadata
  currentNode?: NodeId
}

// ============================================================================
// LEGACY TYPES (mantener para compatibilidad temporal)
// ============================================================================

export interface NPC {
  id: string
  name: string
  role: string
  dialogue?: string[]
  quests?: string[]
  trust?: number
}

export interface Resource {
  id: string
  type: string
  quantity: number
  respawnTime?: number
}
