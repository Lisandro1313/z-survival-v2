/* Player Types */
export interface Player {
  id: string
  username: string
  level: number
  xp: number
  hp: number
  maxHp: number
  hunger: number
  stamina: number
  location: string
  x?: number
  y?: number
  inventory: InventoryItem[]
  caps: number
  karma?: number
  clanId?: string
}

export interface InventoryItem {
  id: string
  name: string
  type: string
  quantity: number
  equipped?: boolean
  durability?: number
  maxDurability?: number
  stats?: Record<string, number>
}

export interface PlayerStats {
  hp: number
  maxHp: number
  hunger: number
  stamina: number
  level: number
  xp: number
}
