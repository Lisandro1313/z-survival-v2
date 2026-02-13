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
  activePanel: 'inventory' | 'radio' | 'map' | 'stats' | null;
  isMenuOpen: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
}
