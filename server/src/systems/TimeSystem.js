/**
 * TimeSystem.js
 * Maneja el paso del tiempo en el mundo
 * 
 * Responsabilidades:
 * - Avanzar tick
 * - Calcular hora del día (0-23)
 * - Detectar transiciones día/noche
 * - Incrementar contador de días
 */

import { EventBus } from '../engine/EventBus.js';

export default class TimeSystem {
    update(world) {
        // Incrementar simulationTime
        world.time.simulationTime++;

        // Cada tick = 10 minutos de juego
        const minutosDelDia = (world.time.simulationTime * 10) % 1440; // 1440 minutos = 1 día
        const horaActual = Math.floor(minutosDelDia / 60);
        const horaAnterior = world.time.hour;

        world.time.hour = horaActual;
        world.time.timeOfDay = horaActual;

        // Detectar cambio de día
        if (horaActual === 0 && horaAnterior === 23) {
            world.time.day++;
            world.time.dayCount++;

            EventBus.emit('time:new_day', {
                day: world.time.day,
                dayCount: world.time.dayCount
            });

            console.log(`🌅 Amaneció. Día ${world.time.day}`);
        }

        // Detectar transiciones importantes
        if (horaActual === 6 && horaAnterior === 5) {
            EventBus.emit('time:dawn');  // Amanecer
        }
        if (horaActual === 20 && horaAnterior === 19) {
            EventBus.emit('time:dusk');  // Anochecer
        }

        // Emitir evento general de tick
        EventBus.emit('time:tick', {
            tick: world.time.tick,
            hour: world.time.hour,
            day: world.time.day,
            isNight: this.isNight(world)
        });
    }

    isNight(world) {
        return world.time.hour >= 20 || world.time.hour <= 6;
    }

    isDay(world) {
        return !this.isNight(world);
    }
}
