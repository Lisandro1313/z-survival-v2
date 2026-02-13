/**
 * SimulationLoop.js
 * Maneja el loop de simulación del juego
 * 
 * Reemplaza el setInterval gigante por algo controlado
 */

import { EventBus } from './EventBus.js';

let intervalId = null;

/**
 * Iniciar el loop de simulación
 * @param {GameEngine} engine - Instancia del motor del juego
 * @param {number} interval - Intervalo en milisegundos (default: 10000 = 10 segundos)
 */
export function start(engine, interval = 10000) {
    if (intervalId) {
        console.warn('⚠️ Simulation loop ya está corriendo');
        return;
    }

    engine.start();

    intervalId = setInterval(() => {
        engine.tick();
    }, interval);

    console.log(`⏱️ Simulation loop iniciado (intervalo: ${interval}ms)`);
    EventBus.emit('simulation:started', { interval });
}

/**
 * Detener el loop de simulación
 */
export function stop(engine) {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        engine.stop();
        console.log('⏹️ Simulation loop detenido');
        EventBus.emit('simulation:stopped');
    }
}

/**
 * Verificar si el loop está corriendo
 */
export function isRunning() {
    return intervalId !== null;
}
