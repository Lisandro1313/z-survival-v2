/**
 * 🌍 WORLD STATE - Estado Global del Mundo en Memoria
 * Arquitectura preparada para sharding por regiones
 * 
 * Este módulo centraliza el estado del mundo y permite:
 * - Consultas rápidas O(1) por ID
 * - Filtrado eficiente por región/nodo
 * - Preparación para división en shards
 */

export class WorldState {
  constructor() {
    // ====================================
    // JUGADORES
    // ====================================
    this.players = new Map(); // playerId → Player object
    this.playersByNode = new Map(); // nodeId → Set<playerId>
    
    // ====================================
    // NPCS
    // ====================================
    this.npcs = new Map(); // npcId → NPC object
    this.npcsByNode = new Map(); // nodeId → Set<npcId>
    
    // ====================================
    // REGIONES (preparado para sharding)
    // ====================================
    this.regions = new Map(); // regionId → Region object
    
    // ====================================
    // NODOS (Locaciones del mapa)
    // ====================================
    this.nodes = new Map(); // nodeId → Node object
    
    // ====================================
    // EVENTOS ACTIVOS
    // ====================================
    this.activeEvents = new Map(); // eventId → Event object
    
    // ====================================
    // CONSTRUCCIONES (FASE 12)
    // ====================================
    this.constructionProjects = new Map(); // projectId → Project
    this.completedStructures = new Map(); // structureId → Structure
    
    // ====================================
    // TRADE & ECONOMÍA
    // ====================================
    this.activeTradeOffers = new Map(); // tradeId → Trade
    
    // ====================================
    // GRUPOS/CLANES
    // ====================================
    this.groups = new Map(); // groupId → Group
  }

  // ====================================
  // PLAYER OPERATIONS
  // ====================================

  addPlayer(player) {
    this.players.set(player.id, player);
    this._indexPlayerToNode(player.id, player.nodeId);
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this._removePlayerFromNode(playerId, player.nodeId);
      this.players.delete(playerId);
    }
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  updatePlayerNode(playerId, oldNodeId, newNodeId) {
    const player = this.players.get(playerId);
    if (!player) return false;
    
    this._removePlayerFromNode(playerId, oldNodeId);
    player.nodeId = newNodeId;
    this._indexPlayerToNode(playerId, newNodeId);
    
    return true;
  }

  getPlayersInNode(nodeId) {
    const playerIds = this.playersByNode.get(nodeId) || new Set();
    return Array.from(playerIds).map(id => this.players.get(id)).filter(Boolean);
  }

  getOnlinePlayers() {
    return Array.from(this.players.values()).filter(p => p.online);
  }

  // ====================================
  // NPC OPERATIONS
  // ====================================

  addNPC(npc) {
    this.npcs.set(npc.id, npc);
    this._indexNPCToNode(npc.id, npc.nodeId);
  }

  removeNPC(npcId) {
    const npc = this.npcs.get(npcId);
    if (npc) {
      this._removeNPCFromNode(npcId, npc.nodeId);
      this.npcs.delete(npcId);
    }
  }

  getNPC(npcId) {
    return this.npcs.get(npcId);
  }

  updateNPCNode(npcId, oldNodeId, newNodeId) {
    const npc = this.npcs.get(npcId);
    if (!npc) return false;
    
    this._removeNPCFromNode(npcId, oldNodeId);
    npc.nodeId = newNodeId;
    this._indexNPCToNode(npcId, newNodeId);
    
    return true;
  }

  getNPCsInNode(nodeId) {
    const npcIds = this.npcsByNode.get(nodeId) || new Set();
    return Array.from(npcIds).map(id => this.npcs.get(id)).filter(Boolean);
  }

  getAllNPCs() {
    return Array.from(this.npcs.values());
  }

  // ====================================
  // NODE OPERATIONS
  // ====================================

  addNode(node) {
    this.nodes.set(node.id, node);
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  updateNodeResources(nodeId, resources) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.recursos = { ...node.recursos, ...resources };
    }
  }

  getConnectedNodes(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node || !node.conectado_a) return [];
    
    return node.conectado_a
      .map(id => this.nodes.get(id))
      .filter(Boolean);
  }

  // ====================================
  // REGION OPERATIONS (para sharding futuro)
  // ====================================

  addRegion(regionId, region) {
    this.regions.set(regionId, region);
  }

  getRegion(regionId) {
    return this.regions.get(regionId);
  }

  getNodesInRegion(regionId) {
    return Array.from(this.nodes.values())
      .filter(node => node.regionId === regionId);
  }

  getPlayersInRegion(regionId) {
    const nodesInRegion = this.getNodesInRegion(regionId);
    const players = new Set();
    
    nodesInRegion.forEach(node => {
      const nodePlayers = this.getPlayersInNode(node.id);
      nodePlayers.forEach(p => players.add(p));
    });
    
    return Array.from(players);
  }

  // ====================================
  // EVENT OPERATIONS
  // ====================================

  addEvent(event) {
    this.activeEvents.set(event.id, event);
  }

  removeEvent(eventId) {
    this.activeEvents.delete(eventId);
  }

  getEvent(eventId) {
    return this.activeEvents.get(eventId);
  }

  getActiveEvents() {
    return Array.from(this.activeEvents.values());
  }

  getEventsInNode(nodeId) {
    return Array.from(this.activeEvents.values())
      .filter(event => event.nodeId === nodeId);
  }

  // ====================================
  // STATISTICS & QUERIES
  // ====================================

  getStats() {
    return {
      players: {
        total: this.players.size,
        online: this.getOnlinePlayers().length
      },
      npcs: {
        total: this.npcs.size
      },
      nodes: {
        total: this.nodes.size
      },
      events: {
        active: this.activeEvents.size
      },
      regions: {
        total: this.regions.size
      }
    };
  }

  // ====================================
  // INTERNAL INDEXING
  // ====================================

  _indexPlayerToNode(playerId, nodeId) {
    if (!nodeId) return;
    
    if (!this.playersByNode.has(nodeId)) {
      this.playersByNode.set(nodeId, new Set());
    }
    this.playersByNode.get(nodeId).add(playerId);
  }

  _removePlayerFromNode(playerId, nodeId) {
    if (!nodeId) return;
    
    const players = this.playersByNode.get(nodeId);
    if (players) {
      players.delete(playerId);
      if (players.size === 0) {
        this.playersByNode.delete(nodeId);
      }
    }
  }

  _indexNPCToNode(npcId, nodeId) {
    if (!nodeId) return;
    
    if (!this.npcsByNode.has(nodeId)) {
      this.npcsByNode.set(nodeId, new Set());
    }
    this.npcsByNode.get(nodeId).add(npcId);
  }

  _removeNPCFromNode(npcId, nodeId) {
    if (!nodeId) return;
    
    const npcs = this.npcsByNode.get(nodeId);
    if (npcs) {
      npcs.delete(npcId);
      if (npcs.size === 0) {
        this.npcsByNode.delete(nodeId);
      }
    }
  }

  // ====================================
  // CLEANUP & MAINTENANCE
  // ====================================

  cleanup() {
    // Remover jugadores desconectados hace más de 5 minutos
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    for (const [playerId, player] of this.players.entries()) {
      if (!player.online && player.lastSeen < fiveMinutesAgo) {
        this.removePlayer(playerId);
      }
    }
  }

  // ====================================
  // DEBUG & LOGGING
  // ====================================

  debugLog() {
    console.log('🌍 WorldState Status:');
    console.log(`  👥 Players: ${this.players.size} (${this.getOnlinePlayers().length} online)`);
    console.log(`  🤖 NPCs: ${this.npcs.size}`);
    console.log(`  📍 Nodes: ${this.nodes.size}`);
    console.log(`  ⚡ Active Events: ${this.activeEvents.size}`);
    console.log(`  🗺️ Regions: ${this.regions.size}`);
  }
}

// Singleton global
export const worldState = new WorldState();

export default worldState;
