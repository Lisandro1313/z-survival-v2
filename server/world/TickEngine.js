/**
 * ⏱️ TICK ENGINE - Motor de Actualización del Mundo
 * 
 * Sistema de ciclos que actualiza el estado del mundo periódicamente:
 * - Actualiza NPCs (movimiento, rutinas, necesidades)
 * - Procesa eventos globales
 * - Decay de recursos
 * - Regeneración de nodos
 * - Broadcast de cambios a jugadores
 */

import worldState from './WorldState.js';
import regionManager from './RegionManager.js';

export class TickEngine {
  constructor(options = {}) {
    this.tickRate = options.tickRate || 1000; // 1 segundo por defecto
    this.fastTickRate = options.fastTickRate || 200; // 200ms para updates críticos
    this.slowTickRate = options.slowTickRate || 5000; // 5s para updates lentos
    
    this.isRunning = false;
    this.tickCount = 0;
    
    // Intervalos
    this.mainInterval = null;
    this.fastInterval = null;
    this.slowInterval = null;
    
    // Callbacks externos
    this.onTick = options.onTick || (() => {});
    this.onBroadcast = options.onBroadcast || (() => {});
    
    // Performance tracking
    this.lastTickTime = 0;
    this.averageTickDuration = 0;
    
    console.log('⏱️ TickEngine inicializado');
  }

  // ====================================
  // START / STOP
  // ====================================

  start() {
    if (this.isRunning) {
      console.warn('⚠️ TickEngine ya está corriendo');
      return;
    }

    this.isRunning = true;
    this.tickCount = 0;

    // Main tick - 1 segundo
    this.mainInterval = setInterval(() => this._mainTick(), this.tickRate);

    // Fast tick - 200ms (combat, movimiento)
    this.fastInterval = setInterval(() => this._fastTick(), this.fastTickRate);

    // Slow tick - 5 segundos (decay, regeneración)
    this.slowInterval = setInterval(() => this._slowTick(), this.slowTickRate);

    console.log('✅ TickEngine iniciado');
    console.log(`   Main: ${this.tickRate}ms | Fast: ${this.fastTickRate}ms | Slow: ${this.slowTickRate}ms`);
  }

  stop() {
    if (!this.isRunning) return;

    clearInterval(this.mainInterval);
    clearInterval(this.fastInterval);
    clearInterval(this.slowInterval);

    this.isRunning = false;
    console.log('🛑 TickEngine detenido');
  }

  // ====================================
  // MAIN TICK (1 segundo)
  // ====================================

  _mainTick() {
    const startTime = Date.now();
    this.tickCount++;

    try {
      // 1. Actualizar NPCs
      this._updateNPCs();

      // 2. Actualizar eventos globales
      this._updateEvents();

      // 3. Actualizar estadísticas de regiones
      if (this.tickCount % 10 === 0) {
        regionManager.updateRegionStats();
      }

      // 4. Cleanup (cada minuto)
      if (this.tickCount % 60 === 0) {
        this._performCleanup();
      }

      // 5. Debug log (cada 30 segundos)
      if (this.tickCount % 30 === 0) {
        this._logStats();
      }

      // 6. Callback externo
      this.onTick({
        tick: this.tickCount,
        type: 'main',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('❌ Error en main tick:', error);
    }

    // Performance tracking
    const duration = Date.now() - startTime;
    this.lastTickTime = duration;
    this.averageTickDuration = (this.averageTickDuration * 0.9) + (duration * 0.1);

    if (duration > 100) {
      console.warn(`⚠️ Tick lento: ${duration}ms`);
    }
  }

  // ====================================
  // FAST TICK (200ms) - Combat, Movement
  // ====================================

  _fastTick() {
    try {
      // Actualizar combates activos
      this._updateCombats();

      // Actualizar movimientos de jugadores
      this._updatePlayerMovements();

      // Broadcast cambios críticos
      this._broadcastCriticalUpdates();

    } catch (error) {
      console.error('❌ Error en fast tick:', error);
    }
  }

  // ====================================
  // SLOW TICK (5 segundos) - Decay, Regen
  // ====================================

  _slowTick() {
    try {
      // Decay de recursos en nodos
      this._decayResources();

      // Regeneración de recursos
      this._regenerateResources();

      // Regeneración de HP de jugadores
      this._regeneratePlayerHP();

      // Actualizar hambre de jugadores
      this._updateHunger();

    } catch (error) {
      console.error('❌ Error en slow tick:', error);
    }
  }

  // ====================================
  // UPDATE FUNCTIONS
  // ====================================

  _updateNPCs() {
    const npcs = worldState.getAllNPCs();
    
    npcs.forEach(npc => {
      if (!npc || !npc.update) return;
      
      try {
        // Llamar función update del NPC si existe
        npc.update();
        
        // Actualizar necesidades básicas
        if (npc.hambre !== undefined) {
          npc.hambre = Math.max(0, npc.hambre - 0.5);
        }
        
        // Actualizar moral
        if (npc.moral !== undefined && npc.hambre < 30) {
          npc.moral = Math.max(0, npc.moral - 1);
        }
        
      } catch (error) {
        console.error(`Error actualizando NPC ${npc.id}:`, error);
      }
    });
  }

  _updateEvents() {
    const events = worldState.getActiveEvents();
    
    events.forEach(event => {
      // Verificar si el evento expiró
      if (event.endTime && Date.now() > event.endTime) {
        worldState.removeEvent(event.id);
        
        this.onBroadcast({
          type: 'event:ended',
          event: event
        });
      }
    });
  }

  _updateCombats() {
    // TODO: Implementar lógica de combate automático
    // Actualizar ticks de DOT (damage over time)
    // Procesar ataques en cola
  }

  _updatePlayerMovements() {
    const players = worldState.getOnlinePlayers();
    
    players.forEach(player => {
      // Si el jugador está viajando entre nodos
      if (player.traveling && player.travelEndTime) {
        if (Date.now() >= player.travelEndTime) {
          // Llegó a destino
          const oldNode = player.nodeId;
          const newNode = player.travelDestination;
          
          worldState.updatePlayerNode(player.id, oldNode, newNode);
          
          player.traveling = false;
          player.travelDestination = null;
          player.travelEndTime = null;
          
          this.onBroadcast({
            type: 'player:moved',
            playerId: player.id,
            fromNode: oldNode,
            toNode: newNode
          });
        }
      }
    });
  }

  _broadcastCriticalUpdates() {
    // Broadcast solo cambios que necesitan actualización inmediata
    // (combate, movimiento, eventos urgentes)
  }

  _decayResources() {
    const nodes = Array.from(worldState.nodes.values());
    
    nodes.forEach(node => {
      if (!node.recursos) return;
      
      // Decay lento de recursos (simula saqueo externo, deterioro)
      Object.keys(node.recursos).forEach(resource => {
        if (node.recursos[resource] > 0) {
          node.recursos[resource] = Math.max(0, node.recursos[resource] - 0.1);
        }
      });
    });
  }

  _regenerateResources() {
    const nodes = Array.from(worldState.nodes.values());
    
    nodes.forEach(node => {
      if (!node.recursos) return;
      
      // Regeneración muy lenta (locaciones no se vacían completamente)
      Object.keys(node.recursos).forEach(resource => {
        if (node.recursos[resource] < node.recursosMax?.[resource]) {
          node.recursos[resource] += 0.2;
        }
      });
    });
  }

  _regeneratePlayerHP() {
    const players = worldState.getOnlinePlayers();
    
    players.forEach(player => {
      // Regeneración natural HP si no está en combate
      if (player.salud < player.saludMax && !player.inCombat) {
        player.salud = Math.min(player.saludMax, player.salud + 1);
      }
    });
  }

  _updateHunger() {
    const players = worldState.getOnlinePlayers();
    
    players.forEach(player => {
      if (player.hambre > 0) {
        player.hambre = Math.max(0, player.hambre - 1);
      }
      
      // Si tiene mucha hambre, pierde HP
      if (player.hambre === 0 && player.salud > 0) {
        player.salud = Math.max(0, player.salud - 2);
      }
    });
  }

  _performCleanup() {
    // Limpiar jugadores offline antiguos
    worldState.cleanup();
    
    // Limpiar eventos expirados
    const events = worldState.getActiveEvents();
    events.forEach(event => {
      if (event.expired) {
        worldState.removeEvent(event.id);
      }
    });
    
    console.log('🧹 Cleanup realizado');
  }

  _logStats() {
    const stats = worldState.getStats();
    
    console.log('\n⏱️ TickEngine Stats:');
    console.log(`   Tick: ${this.tickCount} | Avg duration: ${Math.round(this.averageTickDuration)}ms`);
    console.log(`   Players: ${stats.players.online}/${stats.players.total}`);
    console.log(`   NPCs: ${stats.npcs.total}`);
    console.log(`   Active Events: ${stats.events.active}`);
  }

  // ====================================
  // PUBLIC API
  // ====================================

  getStats() {
    return {
      isRunning: this.isRunning,
      tickCount: this.tickCount,
      tickRate: this.tickRate,
      lastTickTime: this.lastTickTime,
      averageTickDuration: Math.round(this.averageTickDuration),
      worldStats: worldState.getStats()
    };
  }

  setTickRate(newRate) {
    this.tickRate = newRate;
    
    if (this.isRunning) {
      clearInterval(this.mainInterval);
      this.mainInterval = setInterval(() => this._mainTick(), this.tickRate);
      console.log(`⏱️ Tick rate actualizado a ${newRate}ms`);
    }
  }
}

// Singleton
export const tickEngine = new TickEngine();

export default tickEngine;
