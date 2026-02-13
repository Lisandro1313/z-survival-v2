/**
 * 📡 AOI MANAGER - Area of Interest Management
 * 
 * Gestiona qué jugadores deben recibir qué actualizaciones según su ubicación.
 * Solo envía información relevante a cada cliente (optimización de ancho de banda).
 * 
 * Principio: Un jugador solo necesita saber qué pasa en su nodo actual
 * y opcionalmente en nodos adyacentes.
 */

import worldState from '../world/WorldState.js';

export class AOIManager {
  constructor() {
    // Suscripciones: nodeId → Set<playerId>
    this.subscriptions = new Map();
    
    // Conexiones WebSocket: playerId → WebSocket
    this.connections = new Map();
    
    // Buffer de mensajes pendientes (para batch sends)
    this.messageBuffer = new Map(); // playerId → Array<message>
    
    console.log('📡 AOIManager inicializado');
  }

  // ====================================
  // CONNECTION MANAGEMENT
  // ====================================

  registerConnection(playerId, ws) {
    this.connections.set(playerId, ws);
    console.log(`📡 Conexión registrada: ${playerId}`);
  }

  unregisterConnection(playerId) {
    // Remover de todas las suscripciones
    for (const [nodeId, subscribers] of this.subscriptions.entries()) {
      subscribers.delete(playerId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(nodeId);
      }
    }
    
    // Remover conexión
    this.connections.delete(playerId);
    
    // Limpiar buffer
    this.messageBuffer.delete(playerId);
    
    console.log(`📡 Conexión removida: ${playerId}`);
  }

  getConnection(playerId) {
    return this.connections.get(playerId);
  }

  // ====================================
  // SUBSCRIPTION MANAGEMENT
  // ====================================

  subscribe(playerId, nodeId) {
    if (!nodeId) return;
    
    // Crear set si no existe
    if (!this.subscriptions.has(nodeId)) {
      this.subscriptions.set(nodeId, new Set());
    }
    
    // Agregar jugador
    this.subscriptions.get(nodeId).add(playerId);
    
    console.log(`📡 ${playerId} suscrito a nodo ${nodeId}`);
  }

  unsubscribe(playerId, nodeId) {
    if (!nodeId) return;
    
    const subscribers = this.subscriptions.get(nodeId);
    if (subscribers) {
      subscribers.delete(playerId);
      
      // Limpiar set vacío
      if (subscribers.size === 0) {
        this.subscriptions.delete(nodeId);
      }
      
      console.log(`📡 ${playerId} desuscrito de nodo ${nodeId}`);
    }
  }

  unsubscribeFromAll(playerId) {
    for (const [nodeId, subscribers] of this.subscriptions.entries()) {
      subscribers.delete(playerId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(nodeId);
      }
    }
  }

  /**
   * Mueve suscripción de jugador de un nodo a otro
   */
  moveSubscription(playerId, fromNodeId, toNodeId) {
    this.unsubscribe(playerId, fromNodeId);
    this.subscribe(playerId, toNodeId);
  }

  getSubscribersInNode(nodeId) {
    return Array.from(this.subscriptions.get(nodeId) || []);
  }

  // ====================================
  // BROADCAST OPERATIONS
  // ====================================

  /**
   * Envía mensaje a todos los jugadores en un nodo específico
   */
  broadcastToNode(nodeId, message, excludePlayerId = null) {
    const subscribers = this.subscriptions.get(nodeId);
    if (!subscribers || subscribers.size === 0) return 0;
    
    let sentCount = 0;
    
    for (const playerId of subscribers) {
      if (playerId === excludePlayerId) continue;
      
      const sent = this.sendToPlayer(playerId, message);
      if (sent) sentCount++;
    }
    
    return sentCount;
  }

  /**
   * Envía mensaje a un jugador específico
   */
  sendToPlayer(playerId, message) {
    const ws = this.connections.get(playerId);
    
    if (!ws || ws.readyState !== 1) { // 1 = OPEN
      return false;
    }
    
    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      ws.send(data);
      return true;
    } catch (error) {
      console.error(`❌ Error enviando a ${playerId}:`, error);
      return false;
    }
  }

  /**
   * Envía mensaje a todos los jugadores en múltiples nodos
   */
  broadcastToNodes(nodeIds, message) {
    let totalSent = 0;
    
    nodeIds.forEach(nodeId => {
      totalSent += this.broadcastToNode(nodeId, message);
    });
    
    return totalSent;
  }

  /**
   * Broadcast global (todos los jugadores conectados)
   */
  broadcastGlobal(message) {
    let sentCount = 0;
    
    for (const [playerId, ws] of this.connections.entries()) {
      if (ws.readyState === 1) {
        const sent = this.sendToPlayer(playerId, message);
        if (sent) sentCount++;
      }
    }
    
    return sentCount;
  }

  /**
   * Broadcast a nodo + nodos adyacentes (para eventos que se escuchan desde lejos)
   */
  broadcastToNodeAndAdjacent(nodeId, message, radius = 1) {
    const node = worldState.getNode(nodeId);
    if (!node) return 0;
    
    // Nodo actual
    let sentCount = this.broadcastToNode(nodeId, message);
    
    // Nodos conectados si radius >= 1
    if (radius >= 1 && node.conectado_a) {
      node.conectado_a.forEach(adjacentNodeId => {
        sentCount += this.broadcastToNode(adjacentNodeId, message);
      });
    }
    
    return sentCount;
  }

  // ====================================
  // BUFFERED MESSAGES (Optimización)
  // ====================================

  /**
   * Agrega mensaje al buffer de un jugador (para enviar en batch)
   */
  bufferMessage(playerId, message) {
    if (!this.messageBuffer.has(playerId)) {
      this.messageBuffer.set(playerId, []);
    }
    
    this.messageBuffer.get(playerId).push(message);
  }

  /**
   * Envía todos los mensajes buffereados de un jugador
   */
  flushBuffer(playerId) {
    const messages = this.messageBuffer.get(playerId);
    if (!messages || messages.length === 0) return 0;
    
    const ws = this.connections.get(playerId);
    if (!ws || ws.readyState !== 1) {
      this.messageBuffer.delete(playerId);
      return 0;
    }
    
    try {
      // Enviar como batch
      const batch = {
        type: 'batch',
        messages: messages,
        timestamp: Date.now()
      };
      
      ws.send(JSON.stringify(batch));
      
      // Limpiar buffer
      const count = messages.length;
      this.messageBuffer.delete(playerId);
      
      return count;
    } catch (error) {
      console.error(`❌ Error enviando batch a ${playerId}:`, error);
      this.messageBuffer.delete(playerId);
      return 0;
    }
  }

  /**
   * Flush todos los buffers (llamar al final de cada tick)
   */
  flushAllBuffers() {
    let totalMessages = 0;
    
    for (const playerId of this.messageBuffer.keys()) {
      totalMessages += this.flushBuffer(playerId);
    }
    
    return totalMessages;
  }

  // ====================================
  // QUERIES & STATS
  // ====================================

  getNodeStats(nodeId) {
    const subscribers = this.subscriptions.get(nodeId);
    
    return {
      nodeId,
      subscriberCount: subscribers ? subscribers.size : 0,
      subscribers: subscribers ? Array.from(subscribers) : []
    };
  }

  getAllNodeStats() {
    const stats = [];
    
    for (const [nodeId, subscribers] of this.subscriptions.entries()) {
      stats.push({
        nodeId,
        subscriberCount: subscribers.size
      });
    }
    
    return stats.sort((a, b) => b.subscriberCount - a.subscriberCount);
  }

  getStats() {
    return {
      totalConnections: this.connections.size,
      totalSubscriptions: this.subscriptions.size,
      bufferedMessages: Array.from(this.messageBuffer.values())
        .reduce((sum, buf) => sum + buf.length, 0),
      nodeStats: this.getAllNodeStats()
    };
  }

  // ====================================
  // UTILITY
  // ====================================

  /**
   * Verifica si un jugador puede "escuchar" eventos de un nodo
   */
  canPlayerHearNode(playerId, targetNodeId) {
    const player = worldState.getPlayer(playerId);
    if (!player) return false;
    
    // Mismo nodo
    if (player.nodeId === targetNodeId) return true;
    
    // Nodo adyacente
    const playerNode = worldState.getNode(player.nodeId);
    if (playerNode && playerNode.conectado_a?.includes(targetNodeId)) {
      return true;
    }
    
    return false;
  }

  /**
   * Obtiene todos los jugadores que pueden escuchar un evento en un nodo
   */
  getPlayersInRange(nodeId, radius = 0) {
    const players = new Set();
    
    // Jugadores en el nodo
    const directPlayers = this.getSubscribersInNode(nodeId);
    directPlayers.forEach(p => players.add(p));
    
    // Si radius > 0, incluir nodos adyacentes
    if (radius > 0) {
      const node = worldState.getNode(nodeId);
      if (node && node.conectado_a) {
        node.conectado_a.forEach(adjacentNodeId => {
          const adjacentPlayers = this.getSubscribersInNode(adjacentNodeId);
          adjacentPlayers.forEach(p => players.add(p));
        });
      }
    }
    
    return Array.from(players);
  }

  // ====================================
  // DEBUG
  // ====================================

  debugLog() {
    const stats = this.getStats();
    
    console.log('\n📡 AOIManager Status:');
    console.log(`  Conexiones: ${stats.totalConnections}`);
    console.log(`  Nodos con suscriptores: ${stats.totalSubscriptions}`);
    console.log(`  Mensajes buffereados: ${stats.bufferedMessages}`);
    
    if (stats.nodeStats.length > 0) {
      console.log('  Top nodos por suscriptores:');
      stats.nodeStats.slice(0, 5).forEach(node => {
        console.log(`    ${node.nodeId}: ${node.subscriberCount} jugadores`);
      });
    }
  }
}

// Singleton
export const aoiManager = new AOIManager();

export default aoiManager;
