/**
 * Sistema de combate por turnos
 */

import { send } from './websocket.js';
import { log } from '../utils/helpers.js';

/**
 * Inicia un combate
 */
export function startCombat() {
    send({ type: 'combat:start' });
}

/**
 * Ataca en combate
 */
export function attack(attackType = 'melee') {
    if (!send({ type: 'combat:attack', attackType })) {
        log('No conectado al servidor', 'warning');
    }
}

/**
 * Intenta huir del combate
 */
export function flee() {
    if (!send({ type: 'combat:flee' })) {
        log('No conectado al servidor', 'warning');
    }
}

/**
 * Handlers de mensajes de combate
 */
export const combatHandlers = {
    'combat:started': (msg) => {
        const { player } = window.gameState || {};
        if (!player) return;

        player.inCombat = {
            zombieHP: msg.zombie.hp,
            zombieMaxHP: msg.zombie.maxHP,
            turno: msg.turno
        };

        log(msg.message, 'combat');
        window.gameState?.renderGame();
    },

    'combat:turn_result': (msg) => {
        const { player } = window.gameState || {};
        if (!player) return;

        const r = msg.resultado;

        // Ataque del jugador
        let combatLog = `⚔️ Atacaste: ${r.playerAttack.damage} daño`;
        if (r.playerAttack.critical) combatLog += ' ¡CRÍTICO!';
        log(combatLog, 'combat');

        // Ataque del zombie
        if (r.zombieAttack.dodged) {
            log(`✨ ¡Esquivaste el ataque del zombie!`, 'success');
        } else if (r.zombieAttack.damage > 0) {
            log(`🧟 Zombie te atacó: ${r.zombieAttack.damage} daño`, 'warning');
        }

        player.inCombat = {
            zombieHP: msg.zombie.hp,
            zombieMaxHP: msg.zombie.maxHP,
            turno: msg.turno
        };
        player.salud = msg.player.hp;
        player.saludMaxima = msg.player.maxHP;

        log(msg.message, 'combat');
        window.gameState?.renderGame();
    },

    'combat:result': (msg) => {
        const { player, world } = window.gameState || {};
        if (!player) return;

        const r = msg.resultado;

        if (r.combatEnded) {
            if (r.playerWon) {
                log(`🎉 ¡Victoria! ${msg.message}`, 'success');

                const lootItems = Object.entries(r.loot || {});
                if (lootItems.length > 0) {
                    log(`📦 Loot: ${lootItems.map(([k, v]) => `${k} x${v}`).join(', ')}`, 'success');
                }

                player.inventario = msg.player.inventario;
                // import('../utils/sounds.js').then(m => m.playSound('achievement')); // Sonido no disponible
            } else {
                log(msg.message, 'warning');
                import('../utils/sounds.js').then(m => m.playSound('recibo_dano'));
            }

            delete player.inCombat;
        }

        player.salud = msg.player.hp;
        if (msg.player.maxHP) player.saludMaxima = msg.player.maxHP;

        if (msg.zombiesRemaining !== undefined && world?.locations?.[player.locacion]) {
            world.locations[player.locacion].zombies = msg.zombiesRemaining;
        }

        window.gameState?.renderGame();
    },

    'combat:fled': (msg) => {
        const { player } = window.gameState || {};
        if (!player) return;

        if (msg.success) {
            log(msg.message, 'success');
        } else {
            log(msg.message, 'warning');
            if (msg.damage) player.salud = msg.player.hp;
        }

        delete player.inCombat;
        window.gameState?.renderGame();
    },

    'player:respawn': (msg) => {
        const { player } = window.gameState || {};
        if (!player) return;

        log(msg.message || 'Reapareciste en el refugio', 'warning');
        player.salud = msg.player.salud;
        player.locacion = msg.player.locacion;
        delete player.inCombat;
        window.gameState?.renderGame();
    }
};
