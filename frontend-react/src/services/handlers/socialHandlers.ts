import { useSocialStore } from '../../store/socialStore'
import { useUIStore } from '../../store/uiStore'
import type { 
  NPC, 
  ActiveDialogue, 
  ChatMessage, 
  FogataPost, 
  FogataComment,
  OnlinePlayer
} from '../../store/socialStore'

// ============================================================================
// SOCIAL HANDLERS - Manejo de todos los mensajes del sistema social
// ============================================================================

// ========================================
// NPCs Y DIÁLOGOS
// ========================================

export function onNPCList(payload: { npcs: NPC[] }): void {
  const npcs = payload.npcs.reduce((acc, npc) => {
    acc[npc.id] = npc
    return acc
  }, {} as Record<string, NPC>)
  
  useSocialStore.getState().setNPCs(npcs)
}

export function onNPCUpdated(payload: { npc: NPC }): void {
  useSocialStore.getState().addNPC(payload.npc)
}

export function onDialogueStart(payload: ActiveDialogue): void {
  useSocialStore.getState().setActiveDialogue(payload)
}

export function onDialogueEnd(): void {
  useSocialStore.getState().clearDialogue()
}

interface DialogueOption {
  id?: string
  texto: string
  siguiente?: string
  requisitos?: Record<string, unknown>
  consecuencias?: Record<string, unknown>
}

interface DialogueData {
  id: string
  texto: string
  opciones: DialogueOption[]
}

export function onNPCTalk(payload: { npc: { id: string, nombre: string }, dialogo: DialogueData }): void {
  const dialogue: ActiveDialogue = {
    npcId: payload.npc.id,
    npcName: payload.npc.nombre,
    dialogueId: payload.dialogo.id,
    text: payload.dialogo.texto,
    options: payload.dialogo.opciones.map((opt: DialogueOption) => ({
      id: opt.id || Math.random().toString(),
      text: opt.texto,
      nextDialogueId: opt.siguiente,
      requirements: opt.requisitos,
      consequences: opt.consecuencias
    }))
  }
  
  useSocialStore.getState().setActiveDialogue(dialogue)
}

// ========================================
// CHAT
// ========================================

export function onChatMessage(payload: { 
  from: string, 
  fromId: string, 
  message: string, 
  type?: string,
  channel?: string 
}): void {
  const chatMessage: ChatMessage = {
    id: Date.now().toString() + Math.random(),
    from: payload.from,
    fromId: payload.fromId,
    message: payload.message,
    timestamp: Date.now(),
    type: (payload.type as ChatMessage['type']) || 'local',
    channel: payload.channel
  }
  
  useSocialStore.getState().addChatMessage(chatMessage)
  
  // Notificación visual si el chat no está visible
  useUIStore.getState().addNotification({
    type: 'info',
    message: `${payload.from}: ${payload.message}`,
    duration: 3000
  })
}

export function onWhisper(payload: { from: string, fromId: string, message: string }): void {
  const chatMessage: ChatMessage = {
    id: Date.now().toString() + Math.random(),
    from: payload.from,
    fromId: payload.fromId,
    message: payload.message,
    timestamp: Date.now(),
    type: 'whisper'
  }
  
  useSocialStore.getState().addChatMessage(chatMessage)
  
  useUIStore.getState().addNotification({
    type: 'info',
    message: `[Whisper] ${payload.from}: ${payload.message}`,
    duration: 5000
  })
}

export function onPartyChatMessage(payload: { from: string, fromId: string, message: string }): void {
  const chatMessage: ChatMessage = {
    id: Date.now().toString() + Math.random(),
    from: payload.from,
    fromId: payload.fromId,
    message: payload.message,
    timestamp: Date.now(),
    type: 'party'
  }
  
  useSocialStore.getState().addChatMessage(chatMessage)
}

export function onRadioMessage(payload: { 
  from: string, 
  fromId: string, 
  message: string, 
  frequency: string 
}): void {
  const chatMessage: ChatMessage = {
    id: Date.now().toString() + Math.random(),
    from: payload.from,
    fromId: payload.fromId,
    message: payload.message,
    timestamp: Date.now(),
    type: 'radio',
    channel: payload.frequency
  }
  
  useSocialStore.getState().addChatMessage(chatMessage)
}

// ========================================
// FOGATA (Red Social)
// ========================================

export function onFogataList(payload: { posts: FogataPost[] }): void {
  useSocialStore.getState().setFogataPosts(payload.posts)
}

export function onFogataCreated(payload: { post: FogataPost }): void {
  useSocialStore.getState().addFogataPost(payload.post)
  
  useUIStore.getState().addNotification({
    type: 'success',
    message: '¡Post publicado en la fogata!',
    duration: 3000
  })
}

export function onFogataNewPost(payload: { post: FogataPost, author?: string }): void {
  useSocialStore.getState().addFogataPost(payload.post)
  
  const author = payload.author || payload.post.authorName
  useUIStore.getState().addNotification({
    type: 'info',
    message: `🔥 ${author} publicó en la fogata`,
    duration: 3000
  })
}

export function onFogataLikeUpdate(payload: { 
  postId: string, 
  likes: string[],
  liker?: string 
}): void {
  useSocialStore.getState().updateFogataPost(payload.postId, {
    likes: payload.likes
  })
}

export function onFogataCommentAdded(payload: { 
  postId: string, 
  comment: FogataComment,
  commentCount: number 
}): void {
  useSocialStore.getState().addFogataComment(payload.comment)
  useSocialStore.getState().updateFogataPost(payload.postId, {
    commentCount: payload.commentCount
  })
}

export function onFogataCommentSuccess(): void {
  useUIStore.getState().addNotification({
    type: 'success',
    message: '✅ Comentario publicado',
    duration: 2000
  })
}

export function onFogataComments(payload: { postId: string, comments: FogataComment[] }): void {
  useSocialStore.getState().setFogataComments(payload.postId, payload.comments)
}

// ========================================
// PRESENCIA (Jugadores online)
// ========================================

export function onPlayersList(payload: { players: OnlinePlayer[] }): void {
  useSocialStore.getState().setOnlinePlayers(payload.players)
}

export function onPlayerConnected(payload: { player: OnlinePlayer }): void {
  useSocialStore.getState().addOnlinePlayer(payload.player)
  
  useUIStore.getState().addNotification({
    type: 'info',
    message: `${payload.player.name} se conectó`,
    duration: 2000
  })
}

export function onPlayerDisconnected(payload: { playerId: string, playerName?: string }): void {
  useSocialStore.getState().removeOnlinePlayer(payload.playerId)
  
  if (payload.playerName) {
    useUIStore.getState().addNotification({
      type: 'info',
      message: `${payload.playerName} se desconectó`,
      duration: 2000
    })
  }
}

export function onPlayerMoved(payload: { 
  playerId: string, 
  nodeId: string, 
  nodeName?: string 
}): void {
  useSocialStore.getState().updateOnlinePlayer(payload.playerId, {
    nodeId: payload.nodeId,
    nodeName: payload.nodeName
  })
}

// ========================================
// PARTY/GRUPO
// ========================================

interface PartyData {
  id: string
  lider?: string
  leaderId?: string
  leaderName?: string
  miembros?: PartyMemberData[]
  members?: PartyMemberData[]
  maxMembers?: number
}

interface PartyMemberData {
  id: string
  nombre?: string
  name?: string
  hp?: number
  maxHp?: number
  nivel?: number
  level?: number
  isOnline?: boolean
}

export function onPartyCreated(payload: { party: PartyData }): void {
  useSocialStore.getState().setParty({
    id: payload.party.id,
    leaderId: payload.party.lider || payload.party.leaderId || '',
    leaderName: payload.party.leaderName || 'Leader',
    members: (payload.party.miembros || payload.party.members || []).map(m => ({
      id: m.id,
      name: m.nombre || m.name || 'Unknown',
      hp: m.hp || 100,
      maxHp: m.maxHp || 100,
      level: m.nivel || m.level || 1,
      isOnline: m.isOnline !== undefined ? m.isOnline : true
    })),
    maxMembers: payload.party.maxMembers || 4
  })
  
  useUIStore.getState().addNotification({
    type: 'success',
    message: 'Grupo creado exitosamente',
    duration: 3000
  })
}

export function onPartyInvite(payload: { 
  from: string, 
  fromId: string, 
  partyId: string 
}): void {
  useSocialStore.getState().addPartyInvite({
    from: payload.from,
    fromId: payload.fromId,
    partyId: payload.partyId
  })
  
  useUIStore.getState().addNotification({
    type: 'warning',
    message: `${payload.from} te invitó a su grupo`,
    duration: 5000
  })
}

export function onPartyJoined(payload: { party: PartyData }): void {
  useSocialStore.getState().setParty({
    id: payload.party.id,
    leaderId: payload.party.lider || payload.party.leaderId || '',
    leaderName: payload.party.leaderName || 'Leader',
    members: (payload.party.miembros || payload.party.members || []).map(m => ({
      id: m.id,
      name: m.nombre || m.name || 'Unknown',
      hp: m.hp || 100,
      maxHp: m.maxHp || 100,
      level: m.nivel || m.level || 1,
      isOnline: m.isOnline !== undefined ? m.isOnline : true
    })),
    maxMembers: payload.party.maxMembers || 4
  })
  
  useUIStore.getState().addNotification({
    type: 'success',
    message: 'Te uniste al grupo',
    duration: 3000
  })
}

export function onPartyLeft(): void {
  useSocialStore.getState().setParty(null)
  
  useUIStore.getState().addNotification({
    type: 'info',
    message: 'Saliste del grupo',
    duration: 3000
  })
}

export function onPartyMemberJoined(payload: { member: PartyMemberData }): void {
  useSocialStore.getState().addPartyMember({
    id: payload.member.id,
    name: payload.member.nombre || payload.member.name || 'Unknown',
    hp: payload.member.hp || 100,
    maxHp: payload.member.maxHp || 100,
    level: payload.member.nivel || payload.member.level || 1,
    isOnline: true
  })
  
  useUIStore.getState().addNotification({
    type: 'info',
    message: `${payload.member.nombre || payload.member.name || 'Un jugador'} se unió al grupo`,
    duration: 3000
  })
}

export function onPartyMemberLeft(payload: { memberId: string, memberName?: string }): void {
  useSocialStore.getState().removePartyMember(payload.memberId)
  
  if (payload.memberName) {
    useUIStore.getState().addNotification({
      type: 'info',
      message: `${payload.memberName} dejó el grupo`,
      duration: 3000
    })
  }
}

export function onPartyDisbanded(): void {
  useSocialStore.getState().setParty(null)
  
  useUIStore.getState().addNotification({
    type: 'warning',
    message: 'El grupo fue disuelto',
    duration: 3000
  })
}

export function onPartyUpdate(payload: { party: PartyData }): void {
  // Actualizar miembros del party
  if (payload.party.members || payload.party.miembros) {
    const rawMembers = payload.party.members || payload.party.miembros || []
    const members = rawMembers.map((m: PartyMemberData) => ({
      id: m.id,
      name: m.nombre || m.name || 'Unknown',
      hp: m.hp || 100,
      maxHp: m.maxHp || 100,
      level: m.nivel || m.level || 1,
      isOnline: m.isOnline !== undefined ? m.isOnline : true
    }))
    
    useSocialStore.getState().setParty({
      id: payload.party.id,
      leaderId: payload.party.lider || payload.party.leaderId || '',
      leaderName: payload.party.leaderName || 'Leader',
      members,
      maxMembers: payload.party.maxMembers || 4
    })
  }
}

// ============================================================================
// EXPORTAR TODOS LOS HANDLERS
// ============================================================================

export const socialHandlers = {
  // NPCs
  'npc:list': onNPCList,
  'npc:updated': onNPCUpdated,
  'npc:talk': onNPCTalk,
  'dialogue:start': onDialogueStart,
  'dialogue:end': onDialogueEnd,
  'dialogo': onNPCTalk, // Legacy
  
  // Chat
  'chat:message': onChatMessage,
  'chat': onChatMessage, // Legacy
  'whisper': onWhisper,
  'party:chat': onPartyChatMessage,
  'party:chat_message': onPartyChatMessage,
  'radio:message': onRadioMessage,
  
  // Fogata
  'fogata:list': onFogataList,
  'fogata:created': onFogataCreated,
  'fogata:new_post': onFogataNewPost,
  'fogata:like_update': onFogataLikeUpdate,
  'fogata:comment_added': onFogataCommentAdded,
  'fogata:comment_success': onFogataCommentSuccess,
  'fogata:comments': onFogataComments,
  
  // Presencia
  'players:list': onPlayersList,
  'player:connected': onPlayerConnected,
  'player:disconnected': onPlayerDisconnected,
  'player:moved': onPlayerMoved,
  
  // Party
  'party:created': onPartyCreated,
  'party:invite': onPartyInvite,
  'party:joined': onPartyJoined,
  'party:left': onPartyLeft,
  'party:member_joined': onPartyMemberJoined,
  'party:member_left': onPartyMemberLeft,
  'party:disbanded': onPartyDisbanded,
  'party:update': onPartyUpdate,
  
  // Legacy
  'crear_party_exito': onPartyCreated,
  'invitar_party_recibida': onPartyInvite,
  'unirse_party_exito': onPartyJoined
}
