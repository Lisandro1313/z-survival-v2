/**
 * 🗺️ REGION MANAGER - Gestión de Regiones para Sharding
 * 
 * Preparado para dividir el mundo en regiones independientes
 * que pueden ejecutarse en procesos separados (shards)
 */

import worldState from './WorldState.js';

export class RegionManager {
  constructor() {
    this.regions = new Map();
    
    // Definición inicial de regiones
    this.initializeRegions();
  }

  initializeRegions() {
    // ====================================
    // REGIÓN NORTE - Zona urbana
    // ====================================
    this.createRegion('norte', {
      name: 'Zona Norte',
      description: 'Área urbana con supermercados y farmacias',
      nodes: ['refugio', 'supermercado', 'farmacia'],
      difficulty: 'media',
      zombieDensity: 0.6,
      resourceMultiplier: 1.2
    });

    // ====================================
    // REGIÓN CENTRO - Zona residencial
    // ====================================
    this.createRegion('centro', {
      name: 'Zona Centro',
      description: 'Casas abandonadas y vecindarios',
      nodes: ['casa_abandonada', 'vecindario'],
      difficulty: 'baja',
      zombieDensity: 0.4,
      resourceMultiplier: 1.0
    });

    // ====================================
    // REGIÓN SUR - Zona peligrosa
    // ====================================
    this.createRegion('sur', {
      name: 'Zona Sur',
      description: 'Hospital y comisaría - Alto riesgo',
      nodes: ['hospital', 'comisaria'],
      difficulty: 'alta',
      zombieDensity: 0.9,
      resourceMultiplier: 1.5
    });

    console.log('✅ RegionManager: 3 regiones inicializadas');
  }

  createRegion(regionId, config) {
    const region = {
      id: regionId,
      name: config.name,
      description: config.description,
      nodes: config.nodes || [],
      difficulty: config.difficulty || 'media',
      zombieDensity: config.zombieDensity || 0.5,
      resourceMultiplier: config.resourceMultiplier || 1.0,
      
      // Stats
      playerCount: 0,
      npcCount: 0,
      activeEvents: 0,
      
      // Estado
      status: 'active', // active, crisis, locked
      lastUpdate: Date.now(),
      
      // Servidor asignado (para sharding futuro)
      shardId: null,
      shardHost: null
    };

    this.regions.set(regionId, region);
    worldState.addRegion(regionId, region);

    return region;
  }

  getRegion(regionId) {
    return this.regions.get(regionId);
  }

  getRegionByNode(nodeId) {
    for (const [regionId, region] of this.regions.entries()) {
      if (region.nodes.includes(nodeId)) {
        return region;
      }
    }
    return null;
  }

  getAllRegions() {
    return Array.from(this.regions.values());
  }

  // ====================================
  // PLAYER DISTRIBUTION
  // ====================================

  updateRegionStats() {
    for (const [regionId, region] of this.regions.entries()) {
      // Contar jugadores en nodos de esta región
      let playerCount = 0;
      let npcCount = 0;
      
      region.nodes.forEach(nodeId => {
        playerCount += worldState.getPlayersInNode(nodeId).length;
        npcCount += worldState.getNPCsInNode(nodeId).length;
      });

      region.playerCount = playerCount;
      region.npcCount = npcCount;
      region.lastUpdate = Date.now();
    }
  }

  getRegionLoad(regionId) {
    const region = this.regions.get(regionId);
    if (!region) return 0;

    // Cálculo de carga: players + npcs + eventos
    const load = region.playerCount + (region.npcCount * 0.5) + (region.activeEvents * 2);
    return Math.round(load);
  }

  getMostLoadedRegion() {
    let maxLoad = 0;
    let maxRegion = null;

    for (const [regionId, region] of this.regions.entries()) {
      const load = this.getRegionLoad(regionId);
      if (load > maxLoad) {
        maxLoad = load;
        maxRegion = region;
      }
    }

    return { region: maxRegion, load: maxLoad };
  }

  // ====================================
  // SHARDING PREPARATION
  // ====================================

  /**
   * Asigna una región a un shard específico (para escalamiento futuro)
   */
  assignRegionToShard(regionId, shardId, shardHost) {
    const region = this.regions.get(regionId);
    if (!region) return false;

    region.shardId = shardId;
    region.shardHost = shardHost;

    console.log(`🔗 Región ${regionId} asignada a shard ${shardId} (${shardHost})`);
    return true;
  }

  /**
   * Verifica si una región puede ser movida a otro shard
   */
  canMigrateRegion(regionId) {
    const region = this.regions.get(regionId);
    if (!region) return false;

    // No migrar si hay muchos jugadores o eventos críticos
    return region.playerCount < 10 && region.activeEvents < 3;
  }

  // ====================================
  // CRISIS & STATUS
  // ====================================

  setRegionStatus(regionId, status) {
    const region = this.regions.get(regionId);
    if (!region) return false;

    region.status = status;
    console.log(`⚠️ Región ${regionId} cambió a estado: ${status}`);
    
    return true;
  }

  triggerRegionCrisis(regionId, crisisType) {
    const region = this.regions.get(regionId);
    if (!region) return false;

    this.setRegionStatus(regionId, 'crisis');

    // Aplicar efectos de crisis
    switch (crisisType) {
      case 'zombie_horde':
        region.zombieDensity *= 2;
        break;
      case 'resource_shortage':
        region.resourceMultiplier *= 0.5;
        break;
      case 'lockdown':
        region.status = 'locked';
        break;
    }

    console.log(`🚨 Crisis en región ${regionId}: ${crisisType}`);
    return true;
  }

  resolveRegionCrisis(regionId) {
    const region = this.regions.get(regionId);
    if (!region) return false;

    // Restaurar valores normales
    this.setRegionStatus(regionId, 'active');
    this.updateRegionStats();

    console.log(`✅ Crisis resuelta en región ${regionId}`);
    return true;
  }

  // ====================================
  // ROUTING & PATHFINDING
  // ====================================

  /**
   * Calcula el tiempo de viaje entre dos nodos (considerando regiones)
   */
  calculateTravelTime(fromNodeId, toNodeId) {
    const fromRegion = this.getRegionByNode(fromNodeId);
    const toRegion = this.getRegionByNode(toNodeId);

    if (!fromRegion || !toRegion) return 0;

    // Mismo nodo
    if (fromNodeId === toNodeId) return 0;

    // Misma región: 5 segundos
    if (fromRegion.id === toRegion.id) return 5000;

    // Regiones adyacentes: 15 segundos
    if (this.areRegionsAdjacent(fromRegion.id, toRegion.id)) return 15000;

    // Regiones lejanas: 30 segundos
    return 30000;
  }

  areRegionsAdjacent(region1Id, region2Id) {
    const adjacencyMap = {
      norte: ['centro'],
      centro: ['norte', 'sur'],
      sur: ['centro']
    };

    return adjacencyMap[region1Id]?.includes(region2Id) || false;
  }

  // ====================================
  // DEBUG & STATS
  // ====================================

  getRegionStats() {
    this.updateRegionStats();

    return Array.from(this.regions.values()).map(region => ({
      id: region.id,
      name: region.name,
      status: region.status,
      players: region.playerCount,
      npcs: region.npcCount,
      events: region.activeEvents,
      load: this.getRegionLoad(region.id),
      shard: region.shardId || 'main'
    }));
  }

  debugLog() {
    console.log('\n🗺️ RegionManager Status:');
    this.getRegionStats().forEach(stat => {
      console.log(`  ${stat.name}:`);
      console.log(`    Status: ${stat.status}`);
      console.log(`    Players: ${stat.players} | NPCs: ${stat.npcs}`);
      console.log(`    Load: ${stat.load} | Shard: ${stat.shard}`);
    });
  }
}

// Singleton
export const regionManager = new RegionManager();

export default regionManager;
