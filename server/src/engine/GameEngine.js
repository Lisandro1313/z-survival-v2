/**
 * GameEngine.js
 * Motor central del juego
 * 
 * Coordina la ejecución de todos los sistemas
 * NO contiene lógica de dominio
 */

import { EventBus } from './EventBus.js';

export default class GameEngine {
    constructor(worldState, systems = []) {
        this.world = worldState;
        this.systems = systems;
        this.isRunning = false;
        this.tickCount = 0;
    }

    /**
     * Agregar un sistema al motor
     */
    addSystem(system) {
        this.systems.push(system);
        console.log(`✅ Sistema agregado: ${system.constructor.name}`);
    }

    /**
     * Ejecutar un tick de simulación
     */
    tick() {
        if (!this.isRunning) return;

        this.tickCount++;
        this.world.time.tick = this.tickCount;

        EventBus.emit('engine:tick_start', { tick: this.tickCount });

        // Ejecutar todos los sistemas en orden
        for (const system of this.systems) {
            try {
                system.update(this.world);
            } catch (error) {
                console.error(`❌ Error en sistema ${system.constructor.name}:`, error);
                EventBus.emit('system:error', {
                    system: system.constructor.name,
                    error: error.message
                });
            }
        }

        EventBus.emit('engine:tick_end', { tick: this.tickCount });
    }

    /**
     * Iniciar el motor
     */
    start() {
        this.isRunning = true;
        console.log('🚀 GameEngine iniciado');
        EventBus.emit('engine:started');
    }

    /**
     * Detener el motor
     */
    stop() {
        this.isRunning = false;
        console.log('⏸️ GameEngine detenido');
        EventBus.emit('engine:stopped');
    }

    /**
     * Obtener estado del mundo
     */
    getWorld() {
        return this.world;
    }

    /**
     * Obtener métricas del motor
     */
    getMetrics() {
        return {
            tickCount: this.tickCount,
            systems: this.systems.map(s => s.constructor.name),
            isRunning: this.isRunning
        };
    }
}
