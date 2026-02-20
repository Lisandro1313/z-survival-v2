/**
 * WebSocket Actions - Sistema de envío de mensajes al servidor
 * 
 * REGLA: Actions SOLO envían mensajes, NUNCA actualizan stores directamente
 * 
 * El store se actualiza cuando el servidor responde con un handler
 */

import { ws } from './websocket'
import { socialActions as socialActionsImported } from './socialActions'

/**
 * Verifica que el WebSocket esté conectado antes de enviar
 */
function ensureConnected(): void {
  if (!ws.isConnected()) {
    throw new Error('[Actions] WebSocket not connected. Cannot send message.')
  }
}

/**
 * Genera un requestId único para rastrear peticiones
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================================================
// WORLD ACTIONS
// ============================================================================

export const worldActions = {
  /**
   * Mover jugador a un nodo
   */
  moveToNode(nodeId: string): void {
    ensureConnected()
    ws.send('world:move', {
      nodeId,
      requestId: generateRequestId()
    })
  },

  /**
   * Solicitar datos del nodo actual
   */
  requestNodeData(nodeId: string): void {
    ensureConnected()
    ws.send('world:get_node', { nodeId })
  },

  /**
   * Scavengear en nodo actual
   */
  scavenge(): void {
    ensureConnected()
    ws.send('world:scavenge', {})
  }
}

// ============================================================================
// COMBAT ACTIONS
// ============================================================================

export const combatActions = {
  /**
   * Iniciar combate con entidad
   */
  startCombat(targetId: string): void {
    ensureConnected()
    ws.send('combat:start', { targetId })
  },

  /**
   * Realizar acción de combate
   */
  performAction(action: 'attack' | 'defend' | 'skill', skillId?: string): void {
    ensureConnected()
    ws.send('combat:action', { action, skillId })
  },

  /**
   * Huir del combate
   */
  flee(): void {
    ensureConnected()
    ws.send('combat:flee', {})
  }
}

// ============================================================================
// CRAFTING ACTIONS
// ============================================================================

export const craftingActions = {
  /**
   * Solicitar lista de recetas
   */
  requestRecipes(): void {
    ensureConnected()
    ws.send('crafting:get_recipes', {})
  },

  /**
   * Craftear receta
   */
  craft(recipeId: string): void {
    ensureConnected()
    ws.send('crafting:craft', { recipe_id: recipeId })
  },

  /**
   * Cancelar crafteo
   */
  cancelCraft(recipeId: string): void {
    ensureConnected()
    ws.send('crafting:cancel', { recipe_id: recipeId })
  },

  /**
   * Acelerar crafteo con caps
   */
  rushCraft(recipeId: string): void {
    ensureConnected()
    ws.send('crafting:rush', { recipe_id: recipeId })
  }
}

// ============================================================================
// ECONOMY ACTIONS
// ============================================================================

export const economyActions = {
  /**
   * Solicitar items de tienda
   */
  requestShopItems(): void {
    ensureConnected()
    ws.send('economy:get_items', {})
  },

  /**
   * Comprar item
   */
  purchase(itemId: string, quantity: number): void {
    ensureConnected()
    ws.send('economy:purchase', { item_id: itemId, quantity })
  },

  /**
   * Vender item
   */
  sell(itemId: string, quantity: number): void {
    ensureConnected()
    ws.send('economy:sell', { item_id: itemId, quantity })
  }
}

// ============================================================================
// QUEST ACTIONS
// ============================================================================

export const questActions = {
  /**
   * Solicitar lista de misiones
   */
  requestQuests(): void {
    ensureConnected()
    ws.send('missions:get_list', {})
  },

  /**
   * Aceptar misión
   */
  acceptQuest(questId: number): void {
    ensureConnected()
    ws.send('missions:accept', { quest_id: questId })
  },

  /**
   * Abandonar misión
   */
  abandonQuest(questId: number): void {
    ensureConnected()
    ws.send('missions:abandon', { quest_id: questId })
  },

  /**
   * Completar misión
   */
  completeQuest(questId: number): void {
    ensureConnected()
    ws.send('missions:complete', { quest_id: questId })
  }
}

// ============================================================================
// SOCIAL ACTIONS (importado desde socialActions.ts - incluye NPCs)
// ============================================================================

// Chat, Fogata, NPCs, Diálogos, Party, Presencia
// Usar: socialActionsImported.chat.sendMessage(), socialActionsImported.npc.talkToNPC(), etc.
// Ver socialActions.ts para documentación completa

const socialActions = socialActionsImported

// ============================================================================
// CLAN ACTIONS
// ============================================================================

export const clanActions = {
  /**
   * Crear clan
   */
  createClan(name: string, tag: string): void {
    ensureConnected()
    ws.send('clan:create', { name, tag })
  },

  /**
   * Unirse a clan
   */
  joinClan(clanId: string): void {
    ensureConnected()
    ws.send('clan:join', { clan_id: clanId })
  },

  /**
   * Salir del clan
   */
  leaveClan(): void {
    ensureConnected()
    ws.send('clan:leave', {})
  },

  /**
   * Invitar jugador al clan
   */
  invitePlayer(playerId: string): void {
    ensureConnected()
    ws.send('clan:invite', { player_id: playerId })
  }
}

// ============================================================================
// RAID ACTIONS
// ============================================================================

export const raidActions = {
  /**
   * Iniciar raid
   */
  startRaid(raidId: string): void {
    ensureConnected()
    ws.send('raid:start', { raid_id: raidId })
  },

  /**
   * Unirse a raid
   */
  joinRaid(raidId: string): void {
    ensureConnected()
    ws.send('raid:join', { raid_id: raidId })
  },

  /**
   * Salir de raid
   */
  leaveRaid(): void {
    ensureConnected()
    ws.send('raid:leave', {})
  }
}

// ============================================================================
// NPC ACTIONS (incluido en socialActions.npc)
// ============================================================================

// Acciones de NPCs ahora están en socialActions.npc
// Mantenemos esta referencia para compatibilidad de código existente
const npcActions = socialActionsImported.npc

/**
 * Exportar todas las actions agrupadas
 */
export const actions = {
  world: worldActions,
  combat: combatActions,
  crafting: craftingActions,
  economy: economyActions,
  quest: questActions,
  social: socialActions,
  clan: clanActions,
  raid: raidActions,
  npc: npcActions
}

export default actions
