/**
 * NpcSystem.js
 * Maneja el comportamiento y necesidades de los NPCs
 * 
 * Responsabilidades:
 * - Decrementar hambre con el tiempo
 * - Manejar rutinas según hora del día
 * - Recuperar salud durante el sueño
 * - Auto-alimentarse del refugio
 * - Gestionar moral
 */

import { EventBus } from '../engine/EventBus.js';

export default class NpcSystem {
    update(world) {
        const hora = (world.time.simulationTime * 10) % 1440; // Minutos del día

        Object.values(world.npcs).forEach(npc => {
            if (!npc.vivo) return;

            // 1. Decrementar hambre
            npc.hambre = Math.max(0, npc.hambre - 2);

            // 2. Rutina según hora del día
            if (hora >= 0 && hora < 360) {
                // 0-6am: Durmiendo
                if (npc.estado !== 'durmiendo') {
                    npc.estado = 'durmiendo';
                    EventBus.emit('npc:sleeping', { npc: npc.id });
                }
                // Recuperar salud mientras duerme
                npc.salud = Math.min(100, npc.salud + 2);
            } else if (hora >= 360 && hora < 720) {
                // 6am-12pm: Trabajando
                if (npc.estado !== 'trabajando') {
                    npc.estado = 'trabajando';
                    EventBus.emit('npc:working', { npc: npc.id });
                }
            } else {
                // 12pm+: Activo
                if (npc.estado !== 'activo') {
                    npc.estado = 'activo';
                    EventBus.emit('npc:active', { npc: npc.id });
                }
            }

            // 3. Auto-alimentarse del refugio si tiene hambre
            if (npc.hambre < 30 && npc.locacion === 'refugio') {
                const refugio = world.locations.refugio;
                if (refugio && refugio.recursos && refugio.recursos.comida > 0) {
                    refugio.recursos.comida -= 1;
                    npc.hambre = Math.min(100, npc.hambre + 25);
                    npc.moral = Math.min(100, npc.moral + 5);

                    EventBus.emit('npc:ate', {
                        npc: npc.id,
                        name: npc.nombre,
                        hunger: npc.hambre
                    });

                    console.log(`🍖 ${npc.nombre} comió del refugio`);
                }
            }

            // 4. Moral baja si salud baja
            if (npc.salud < 30) {
                npc.moral = Math.max(0, npc.moral - 3);
            }

            // 5. NPCs no mueren, solo quedan debilitados
            if (npc.salud <= 0) {
                npc.salud = 5; // Mínimo 5 HP
                npc.moral = Math.max(0, npc.moral - 10);

                EventBus.emit('npc:critically_injured', {
                    npc: npc.id,
                    name: npc.nombre
                });

                console.log(`⚠️ ${npc.nombre} está gravemente herido`);
            }
        });
    }

    /**
     * API: Dañar un NPC
     */
    damageNpc(world, npcId, amount) {
        const npc = world.npcs[npcId];
        if (!npc || !npc.vivo) return false;

        npc.salud = Math.max(0, npc.salud - amount);

        EventBus.emit('npc:damaged', {
            npc: npcId,
            damage: amount,
            health: npc.salud
        });

        return true;
    }

    /**
     * API: Curar un NPC
     */
    healNpc(world, npcId, amount) {
        const npc = world.npcs[npcId];
        if (!npc || !npc.vivo) return false;

        npc.salud = Math.min(100, npc.salud + amount);

        EventBus.emit('npc:healed', {
            npc: npcId,
            heal: amount,
            health: npc.salud
        });

        return true;
    }

    /**
     * API: Alimentar un NPC
     */
    feedNpc(world, npcId, amount = 25) {
        const npc = world.npcs[npcId];
        if (!npc || !npc.vivo) return false;

        npc.hambre = Math.min(100, npc.hambre + amount);
        npc.moral = Math.min(100, npc.moral + 5);

        EventBus.emit('npc:fed', {
            npc: npcId,
            hunger: npc.hambre
        });

        return true;
    }
}
