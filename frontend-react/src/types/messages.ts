/* WebSocket Message Types */

// Base message structure
export interface WSMessage<T = unknown> {
  type: string
  payload?: T
  timestamp?: number
  requestId?: string
}

// Player messages
export interface PlayerDataPayload {
  id: string
  username: string
  level: number
  xp: number
  hp: number
  maxHp: number
  hunger: number
  stamina: number
  location: string
  inventory: unknown[]
  caps: number
}

export interface PlayerUpdatePayload {
  hp?: number
  hunger?: number
  stamina?: number
  location?: string
  xp?: number
  level?: number
}

// World messages
export interface WorldStatePayload {
  nodes: Record<string, unknown>
  currentNode: string
}

export interface EntityUpdatePayload {
  entities: Array<{
    id: string
    type: string
    x: number
    y: number
    hp?: number
    name?: string
  }>
}

// Combat messages
export interface CombatStartedPayload {
  combatId: string
  enemy: {
    id: string
    name: string
    type: string
    hp: number
    maxHp: number
    level: number
  }
  playerHp: number
}

export interface CombatTurnResultPayload {
  combatId: string
  attacker: string
  defender: string
  damage: number
  isCritical: boolean
  attackerHp: number
  defenderHp: number
}

export interface CombatVictoryPayload {
  xp: number
  loot: unknown[]
  caps: number
}

// Radio messages
export interface RadioReceivePayload {
  from: string
  freq: number
  message: string
  timestamp: number
}

// Clan messages
export interface ClanInfoPayload {
  id: string
  name: string
  leaderId: string
  members: Array<{
    id: string
    username: string
    rank: string
  }>
  storage: unknown[]
  level: number
  xp: number
}

// Raid messages
export interface RaidStartedPayload {
  raidId: string
  type: string
  difficulty: number
  waves: number
  participants: string[]
}

// Boss Raid messages
export interface BossRaidPayload {
  raidId: string
  bossId: string
  bossName: string
  bossHp: number
  bossMaxHp: number
  phase: number
  participants: Array<{
    playerId: string
    username: string
    totalDamage: number
  }>
}

// Message type union
export type MessageType =
  | 'player:data'
  | 'player:update'
  | 'player:levelup'
  | 'world:state'
  | 'world:update'
  | 'moved'
  | 'entity.update'
  | 'combat:started'
  | 'combat:turn_result'
  | 'combat:victory'
  | 'combat:defeat'
  | 'radio:receive'
  | 'clan:my_info'
  | 'raid:started'
  | 'bossraid:boss_spawned'
  | 'error'
