// ====================================
// PLAYER TYPES
// ====================================

export interface Player {
  id: string;
  username: string;
  nombre: string;
  nivel: number;
  clase: string;
  xp: number;
  online: boolean;
  currentNode: string;
  currentRegion: string;
  
  // Stats
  stats: PlayerStats;
  
  // Inventario
  inventario: Record<string, number>;
  
  // Radio equipado
  equippedRadio?: RadioDevice | null;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  hambre: number;
  sed: number;
  energia: number;
  cordura: number;
}

// ====================================
// WORLD TYPES
// ====================================

export interface Node {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'refugio' | 'urbano' | 'comercial' | 'residencial' | 'industrial';
  regionId: string;
  peligro: number;
  recursos: Record<string, number>;
  conectadoCon: string[];
  playersPresent?: number;
}

export interface Region {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  nodes: string[];
}

// ====================================
// RADIO TYPES
// ====================================

export interface RadioDevice {
  type: string;
  name: string;
  range: 'local' | 'node' | 'region' | 'global';
  maxChannels: number;
  batteryCharge: number;
  batteryPercent: number;
  condition: number;
  equipped: boolean;
  activeChannels: string[];
  canTransmit: boolean;
  canIntercept?: boolean;
}

export interface RadioMessage {
  type: 'chat:local' | 'chat:radio' | 'chat:private' | 'chat:intercepted';
  senderId: string;
  senderName: string;
  text: string;
  frequency?: string;
  timestamp: number;
  garbled?: boolean;
  encrypted?: boolean;
  interceptedBy?: string;
}

export interface Frequency {
  frequency: string;
  playerCount: number;
  activity: number;
}

// ====================================
// WEBSOCKET MESSAGE TYPES
// ====================================

export type WSMessageType =
  | 'auth'
  | 'authenticated'
  | 'move'
  | 'player:joined'
  | 'player:left'
  | 'player:moved'
  | 'chat:local'
  | 'chat:radio'
  | 'chat:private'
  | 'chat:intercepted'
  | 'radio:equipped'
  | 'radio:unequipped'
  | 'radio:joined'
  | 'radio:left'
  | 'radio:sent'
  | 'radio:scan_enabled'
  | 'radio:scan_disabled'
  | 'radio:frequencies'
  | 'radio:battery_replaced'
  | 'radio:recharged'
  | 'radio:status'
  | 'notification:new'
  | 'notification:read'
  | 'notification:read_all'
  | 'getMissions'
  | 'acceptMission'
  | 'abandonMission'
  | 'completeMission'
  | 'missions:list'
  | 'mission:new'
  | 'mission:accepted'
  | 'mission:abandoned'
  | 'mission:completed'
  | 'mission:expired'
  | 'mission:participant_joined'
  | 'combat'
  | 'scavenge'
  | 'error';

export interface WSMessage {
  type: WSMessageType;
  [key: string]: any;
}

// ====================================
// UI STATE TYPES
// ====================================

export interface UIState {
  activePanel: 'inventory' | 'radio' | 'map' | 'stats' | 'missions' | null;
  isMenuOpen: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
}

// ====================================
// MISSION TYPES (FASE 11)
// ====================================

export type MissionType = 
  | 'resource_shortage' 
  | 'zombie_threat' 
  | 'npc_help' 
  | 'exploration' 
  | 'construction' 
  | 'trade' 
  | 'defense';

export type MissionPriority = 'urgent' | 'normal' | 'optional';

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  icon: string;
  priority: MissionPriority;
  timeLimit: number | null;
  expiresAt: number | null;
  objectives: Record<string, any>;
  progress: number;
  progressDetail?: Record<string, number>;
  reward: MissionReward;
  participants: string[];
  collective?: boolean;
  contributions?: Record<string, number>;
  created: number;
  status?: 'active' | 'completed' | 'expired';
}

export interface MissionReward {
  xp?: number;
  tokens?: number;
  items?: Record<string, number>;
  relation_boost?: Record<string, number>;
  collective_bonus?: string;
}
