/**
 * integrationBridge.js
 * Puente de integración entre arquitectura V1 (survival_mvp.js) y V2 (nueva arquitectura)
 * 
 * PATRÓN: Strangler Fig Pattern
 * - Permite usar la nueva arquitectura sin romper el código viejo
 * - Migración incremental sin downtime
 * - Los dos sistemas conviven y se sincronizan
 */

import { createWorldState } from './world/WorldState.js';
import GameEngine from './engine/GameEngine.js';
import TimeSystem from './systems/TimeSystem.js';
import ZombieSystem from './systems/ZombieSystem.js';
import NpcSystem from './systems/NpcSystem.js';
import { EventBus } from './engine/EventBus.js';

// Instancias globales (se inicializan una sola vez)
let engineInstance = null;
let worldStateInstance = null;
let systemInstances = {};

/**
 * Inicializar el nuevo motor
 */
export function initializeNewEngine() {
    if (engineInstance) {
        console.warn('⚠️ Motor ya inicializado');
        return { engine: engineInstance, world: worldStateInstance };
    }

    // Crear mundo
    worldStateInstance = createWorldState();

    // Crear sistemas
    systemInstances.time = new TimeSystem();
    systemInstances.zombie = new ZombieSystem();
    systemInstances.npc = new NpcSystem();

    // Crear motor con sistemas
    engineInstance = new GameEngine(worldStateInstance, [
        systemInstances.time,
        systemInstances.zombie,
        systemInstances.npc
    ]);

    // Iniciar el motor
    engineInstance.start();

    console.log('✅ Nueva arquitectura inicializada');
    console.log(`   - ${Object.keys(systemInstances).length} sistemas cargados`);

    return {
        engine: engineInstance,
        world: worldStateInstance
    };
}

/**
 * Sincronizar datos del WORLD viejo al nuevo worldState
 * Esto permite migrar gradualmente
 */
export function syncFromLegacy(legacyWORLD, newWorld) {
    // Sincronizar locaciones (solo datos que cambian)
    Object.keys(legacyWORLD.locations).forEach(locationId => {
        if (newWorld.locations[locationId]) {
            const legacyLoc = legacyWORLD.locations[locationId];
            const newLoc = newWorld.locations[locationId];

            // Sincronizar solo campos mutables
            newLoc.zombies = legacyLoc.zombies;
            newLoc.zombiesRespawnTime = legacyLoc.zombiesRespawnTime;
            newLoc.nivelRuido = legacyLoc.nivelRuido;
            newLoc.recursos = { ...legacyLoc.recursos };
            if (legacyLoc.defensas !== undefined) newLoc.defensas = legacyLoc.defensas;
        }
    });

    // Sincronizar NPCs
    newWorld.npcs = { ...legacyWORLD.npcs };

    // Sincronizar jugadores
    newWorld.players = { ...legacyWORLD.players };

    // Sincronizar tiempo
    newWorld.time.simulationTime = legacyWORLD.simulationTime || 0;
    newWorld.time.day = legacyWORLD.dayCount || 1;

    console.log('🔄 Sincronizado WORLD viejo → nuevo');
}

/**
 * Sincronizar datos del nuevo worldState al WORLD viejo
 * Para que el código legacy vea los cambios
 */
export function syncToLegacy(newWorld, legacyWORLD) {
    // Sincronizar locaciones
    Object.keys(newWorld.locations).forEach(locationId => {
        if (legacyWORLD.locations[locationId]) {
            const newLoc = newWorld.locations[locationId];
            const legacyLoc = legacyWORLD.locations[locationId];

            legacyLoc.zombies = newLoc.zombies;
            legacyLoc.zombiesRespawnTime = newLoc.zombiesRespawnTime;
            legacyLoc.nivelRuido = newLoc.nivelRuido;
            legacyLoc.recursos = { ...newLoc.recursos };
            if (newLoc.defensas !== undefined) legacyLoc.defensas = newLoc.defensas;
        }
    });

    // Sincronizar NPCs
    Object.keys(newWorld.npcs).forEach(npcId => {
        if (legacyWORLD.npcs[npcId]) {
            legacyWORLD.npcs[npcId] = { ...newWorld.npcs[npcId] };
        }
    });

    // Sincronizar tiempo
    legacyWORLD.simulationTime = newWorld.time.simulationTime;
    legacyWORLD.timeOfDay = newWorld.time.timeOfDay;
    legacyWORLD.dayCount = newWorld.time.day;
}

/**
 * API unificada que expone funciones limpias
 * El código viejo puede usar estas funciones en lugar de tocar WORLD directamente
 */
export function getLegacyAPI(engine, world) {
    return {
        // ===== ZOMBIES =====
        killZombie(locationId, count = 1) {
            return systemInstances.zombie.killZombies(world, locationId, count);
        },

        addNoise(locationId, amount) {
            systemInstances.zombie.addNoise(world, locationId, amount);
        },

        getZombieStats() {
            const stats = {};
            Object.keys(world.locations).forEach(locId => {
                const loc = world.locations[locId];
                stats[locId] = {
                    current: loc.zombies,
                    max: loc.zombiesInitial,
                    noise: loc.nivelRuido
                };
            });
            return stats;
        },

        // ===== NPCS =====
        damageNpc(npcId, amount) {
            return systemInstances.npc.damageNpc(world, npcId, amount);
        },

        healNpc(npcId, amount) {
            return systemInstances.npc.healNpc(world, npcId, amount);
        },

        feedNpc(npcId, amount = 25) {
            return systemInstances.npc.feedNpc(world, npcId, amount);
        },

        // ===== TIEMPO =====
        getTime() {
            return {
                tick: world.time.tick,
                hour: world.time.hour,
                day: world.time.day,
                isNight: world.time.hour >= 20 || world.time.hour <= 6
            };
        },

        // ===== MUNDO =====
        getWorld() {
            return world;
        },

        getLocation(locationId) {
            return world.locations[locationId];
        },

        getNpc(npcId) {
            return world.npcs[npcId];
        },

        // ===== ENGINE =====
        getEngine() {
            return engine;
        },

        getMetrics() {
            return engine.getMetrics();
        }
    };
}

/**
 * Hook para ejecutar la nueva arquitectura junto con la vieja
 * Se llama en cada tick del setInterval viejo
 */
export function tickNewArchitecture(legacyWORLD) {
    if (!engineInstance || !worldStateInstance) {
        console.warn('⚠️ Motor no inicializado');
        return;
    }

    // 1. Sincronizar WORLD viejo → nuevo
    syncFromLegacy(legacyWORLD, worldStateInstance);

    // 2. Ejecutar tick del nuevo motor
    engineInstance.tick();

    // 3. Sincronizar nuevo → WORLD viejo
    syncToLegacy(worldStateInstance, legacyWORLD);
}

/**
 * Exportar EventBus para que el código viejo pueda escuchar eventos
 */
export { EventBus };

export default {
    initializeNewEngine,
    syncFromLegacy,
    syncToLegacy,
    getLegacyAPI,
    tickNewArchitecture,
    EventBus
};
