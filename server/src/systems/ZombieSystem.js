/**
 * ZombieSystem.js
 * Maneja el comportamiento y spawning de zombies
 * 
 * Responsabilidades:
 * - Respawn nocturno gradual
 * - Respawn después de cooldown (30 min)
 * - Atracción por ruido alto
 * - Decay de nivel de ruido
 * - Respetar límites máximos (zombiesInitial)
 */

import { EventBus } from '../engine/EventBus.js';

export default class ZombieSystem {
    update(world) {
        const esNoche = world.time.hour >= 20 || world.time.hour <= 6;

        Object.values(world.locations).forEach(loc => {
            if (loc.tipo === 'safe') return; // Refugios no tienen zombies

            // 1. Decay de ruido con el tiempo
            loc.nivelRuido = Math.max(0, loc.nivelRuido - 2);

            // 2. Respawn después de cooldown (30 minutos)
            if (loc.zombiesRespawnTime && Date.now() >= loc.zombiesRespawnTime) {
                loc.zombies = loc.zombiesInitial;
                loc.zombiesRespawnTime = null;

                EventBus.emit('zombie:respawn', {
                    location: loc.id,
                    count: loc.zombies
                });

                console.log(`🧟 Zombies respawnearon en ${loc.nombre} (${loc.zombies}/${loc.zombiesInitial})`);
            }

            // 3. Respawn nocturno gradual (sin superar límite)
            if (esNoche && Math.random() < 0.3 && loc.zombies < loc.zombiesInitial) {
                const spawn = Math.floor(Math.random() * 2) + 1;
                const prevCount = loc.zombies;
                loc.zombies = Math.min(loc.zombiesInitial, loc.zombies + spawn);

                if (loc.zombies > prevCount) {
                    EventBus.emit('zombie:night_spawn', {
                        location: loc.id,
                        spawned: loc.zombies - prevCount,
                        total: loc.zombies
                    });
                }
            }

            // 4. Atracción por ruido alto (pueden superar límite temporalmente +5)
            if (loc.nivelRuido > 60 && loc.zombiesInitial > 0) {
                const atraccion = Math.floor(Math.random() * 2) + 1;
                const maxTemporal = loc.zombiesInitial + 5;

                if (loc.zombies < maxTemporal) {
                    loc.zombies = Math.min(maxTemporal, loc.zombies + atraccion);

                    EventBus.emit('zombie:noise_attraction', {
                        location: loc.id,
                        attracted: atraccion,
                        noise: loc.nivelRuido,
                        total: loc.zombies
                    });

                    console.log(`🔊 El ruido atrajo ${atraccion} zombies a ${loc.nombre} (${loc.zombies}/${loc.zombiesInitial})`);
                }
            }
        });
    }

    /**
     * API: Matar zombies en una ubicación
     */
    killZombies(world, locationId, count) {
        const loc = world.locations[locationId];
        if (!loc) return false;

        const killed = Math.min(count, loc.zombies);
        loc.zombies -= killed;

        // Si se eliminaron todos, iniciar cooldown de respawn
        if (loc.zombies === 0 && loc.zombiesInitial > 0) {
            loc.zombiesRespawnTime = Date.now() + (30 * 60 * 1000); // 30 minutos
            console.log(`🧟 Zona ${loc.nombre} limpiada. Respawn en 30 minutos.`);
        }

        EventBus.emit('zombie:killed', {
            location: locationId,
            killed,
            remaining: loc.zombies,
            max: loc.zombiesInitial
        });

        return killed;
    }

    /**
     * API: Incrementar ruido en una ubicación
     */
    addNoise(world, locationId, amount) {
        const loc = world.locations[locationId];
        if (!loc) return;

        loc.nivelRuido = Math.min(100, loc.nivelRuido + amount);

        EventBus.emit('zombie:noise_increased', {
            location: locationId,
            noise: loc.nivelRuido
        });
    }
}
