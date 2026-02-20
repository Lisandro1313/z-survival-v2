import { ws } from './websocket'

// ============================================================================
// SOCIAL ACTIONS - Acciones para interactuar con el sistema social
// ============================================================================

// ========================================
// NPCs Y DIÁLOGOS
// ========================================

export const npcActions = {
  /**
   * Hablar con un NPC
   */
  talkToNPC(npcId: string, playerId: string): void {
    ws.send('hablar_npc', { playerId, npcId })
  },
  
  /**
   * Responder a un diálogo (seleccionar opción)
   */
  respondToDialogue(npcId: string, dialogueId: string, optionId: string, playerId: string): void {
    ws.send('responder_dialogo', { playerId, npcId, dialogueId, optionId })
  },
  
  /**
   * Solicitar lista de NPCs
   */
  requestNPCList(): void {
    ws.send('npc:list', {})
  }
}

// ========================================
// CHAT
// ========================================

export const chatActions = {
  /**
   * Enviar mensaje de chat local
   */
  sendMessage(message: string, playerId: string): void {
    ws.send('chat', { playerId, mensaje: message })
  },
  
  /**
   * Enviar whisper (mensaje privado)
   */
  sendWhisper(targetPlayerName: string, message: string, playerId: string): void {
    ws.send('whisper', { playerId, target: targetPlayerName, message })
  },
  
  /**
   * Enviar mensaje al party/grupo
   */
  sendPartyMessage(message: string, playerId: string): void {
    ws.send('chat_party', { playerId, mensaje: message })
  },
  
  /**
   * Enviar mensaje por radio (frecuencia específica)
   */
  sendRadioMessage(message: string, frequency: string, playerId: string): void {
    ws.send('radio:transmit', { playerId, frequency, message })
  }
}

// ========================================
// FOGATA (Red Social)
// ========================================

export const fogataActions = {
  /**
   * Cargar posts de la fogata
   */
  loadPosts(sortBy: 'recent' | 'popular' | 'commented' = 'recent', category?: string): void {
    ws.send('fogata:load', { sortBy, category, limit: 20 })
  },
  
  /**
   * Crear un post en la fogata
   */
  createPost(title: string, content: string, category: string,playerId: string): void {
    ws.send('fogata:create', { playerId, title, content, category })
  },
  
  /**
   * Dar/quitar like a un post
   */
  toggleLike(postId: string, playerId: string): void {
    ws.send('fogata:like', { playerId, postId })
  },
  
  /**
   * Comentar en un post
   */
  commentOnPost(postId: string, comment: string, playerId: string): void {
    ws.send('fogata:comment', { playerId, postId, comment })
  },
  
  /**
   * Cargar comentarios de un post
   */
  loadComments(postId: string): void {
    ws.send('fogata:loadComments', { postId })
  }
}

// ========================================
// PRESENCIA (Jugadores online)
// ========================================

export const presenceActions = {
  /**
   * Solicitar lista de jugadores online
   */
  requestOnlinePlayers(): void {
    ws.send('players:list', {})
  },
  
  /**
   * Actualizar presencia propia (ubicación, estado, etc.)
   */
  updatePresence(nodeId: string, status?: string): void {
    ws.send('player:update_presence', { nodeId, status })
  }
}

// ========================================
// PARTY/GRUPO
// ========================================

export const partyActions = {
  /**
   * Crear un party/grupo
   */
  createParty(partyName: string, playerId: string, password?: string): void {
    ws.send('crear_party', { playerId, nombre: partyName, password })
  },
  
  /**
   * Invitar a alguien al party
   */
  inviteToParty(targetPlayerId: string, playerId: string): void {
    ws.send('invitar_party', { playerId, invitadoId: targetPlayerId })
  },
  
  /**
   * Aceptar invitación a party
   */
  acceptPartyInvite(partyId: string, playerId: string): void {
    ws.send('aceptar_invitacion_party', { playerId, partyId })
  },
  
  /**
   * Rechazar invitación a party
   */
  rejectPartyInvite(partyId: string, playerId: string): void {
    ws.send('rechazar_invitacion_party', { playerId, partyId })
  },
  
  /**
   * Salir del party
   */
  leaveParty(playerId: string): void {
    ws.send('salir_party', { playerId })
  },
  
  /**
   * Kickear a alguien del party (solo líder)
   */
  kickFromParty(targetPlayerId: string, playerId: string): void {
    ws.send('expulsar_party', { playerId, expulsadoId: targetPlayerId })
  },
  
  /**
   * Solicitar info del party actual
   */
  requestPartyInfo(playerId: string): void {
    ws.send('obtener_party', { playerId })
  },
  
  /**
   * Listar parties disponibles
   */
  listParties(): void {
    ws.send('group:list', {})
  },
  
  /**
   * Unirse a un party por ID (si no tiene password o conoces el password)
   */
  joinParty(partyId: string, playerId: string, password?: string): void {
    ws.send('unirse_party', { playerId, partyId, password })
  }
}

// ============================================================================
// EXPORT DEFAULT (todas las acciones juntas)
// ============================================================================

export const socialActions = {
  npc: npcActions,
  chat: chatActions,
  fogata: fogataActions,
  presence: presenceActions,
  party: partyActions
}

export default socialActions
