/**
 * Survival Handlers - Sistema de Supervivencia Básico
 * 
 * Gestiona las mecánicas fundamentales de supervivencia:
 * - Consumo de alimentos para  reducir hambre
 * - Uso de medicinas para curar
 * - Scavenge (búsqueda de recursos) con sistema de riesgo
 * - Cooldowns y rate limiting
 * - Progresión de skills
 * 
 * Comandos: 3
 * - eat
 * - heal
 * - scavenge
 */

export function createSurvivalHandlers({ 
    WORLD,
    inventoryService,
    rateLimiter,
    giveXP,
    applyClassBonus,
    broadcast,
    logHandlerAction,
    checkAchievements,
    sendSuccess, 
    sendError, 
    createHandler 
}) {
    return {
        /**
         * Consumir comida para reducir hambre
         * Usa InventoryService para la lógica
         */
        'eat': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, '❌ Jugador no encontrado');

            // Usar InventoryService
            const result = inventoryService.eat(player);

            if (!result.success) {
                return sendError(ws, result.message);
            }

            logHandlerAction(playerId, 'eat', { hambre: result.stats.hambre });

            sendSuccess(ws, {
                type: 'eat:success',
                message: result.message,
                stats: result.stats,
                inventario: result.inventory
            });

            broadcast({
                type: 'world:event',
                message: `🍖 ${player.nombre} comió algo`,
                category: 'player'
            }, playerId);
        }),

        /**
         * Usar medicina para recuperar vida
         * Usa InventoryService para la lógica
         */
        'heal': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, '❌ Jugador no encontrado');

            // Usar InventoryService
            const result = inventoryService.heal(player);

            if (!result.success) {
                return sendError(ws, result.message);
            }

            logHandlerAction(playerId, 'heal', { vida: result.stats.vida });

            sendSuccess(ws, {
                type: 'heal:success',
                message: result.message,
                stats: result.stats,
                inventario: result.inventory
            });

            broadcast({
                type: 'world:event',
                message: `💊 ${player.nombre} usó medicina`,
                category: 'player'
            }, playerId);
        }),

        /**
         * Buscar recursos en locación actual
         * - Rate limiting: 5 búsquedas por minuto
         * - Riesgo de ataque de zombies
         * - Gana recursos según skill de supervivencia
         * - Cooldown de 3 segundos
         */
        'scavenge': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            // Rate limiting: max 5 búsquedas por minuto
            const rateLimit = rateLimiter.check(playerId, 'scavenge', 5, 60000);
            if (!rateLimit.allowed) {
                const segundos = Math.ceil(rateLimit.resetIn / 1000);
                return sendError(ws, `⏱️ Demasiadas búsquedas. Espera ${segundos}s`);
            }

            // Cooldown check
            if (player.cooldowns.scavenge && Date.now() < player.cooldowns.scavenge) {
                const segundos = Math.ceil((player.cooldowns.scavenge - Date.now()) / 1000);
                return sendError(ws, `Espera ${segundos}s antes de buscar de nuevo`);
            }

            const loc = WORLD.locations[player.locacion];
            if (loc.tipo !== 'loot') {
                return sendError(ws, 'No hay nada que buscar aquí');
            }

            // Hay zombies? Riesgo de daño
            if (loc.zombies > 0) {
                const riesgo = Math.max(0.1, 0.4 - (player.skills.sigilo * 0.05));
                if (Math.random() < riesgo) {
                    const danio = Math.floor(Math.random() * 15) + 10;
                    player.salud -= danio;

                    sendSuccess(ws, {
                        type: 'combat',
                        message: '🧟 ¡Un zombie te atacó!',
                        damage: danio,
                        salud: player.salud
                    });

                    loc.nivelRuido += 20;
                }
            }

            // Encontrar recursos
            const found = {};
            Object.keys(loc.recursos).forEach(recurso => {
                if (loc.recursos[recurso] <= 0) return;

                const bonus = Math.floor(player.skills.supervivencia / 2);
                let cantidad = Math.min(
                    loc.recursos[recurso],
                    Math.floor(Math.random() * (3 + bonus)) + 1
                );

                cantidad = applyClassBonus(player, 'loot', cantidad);

                if (cantidad > 0) {
                    found[recurso] = cantidad;
                    player.inventario[recurso] = (player.inventario[recurso] || 0) + cantidad;
                    loc.recursos[recurso] -= cantidad;
                }
            });

            // Subir skill
            player.skills.supervivencia = Math.min(10, player.skills.supervivencia + 0.1);

            // Ganar XP
            const xpGanado = 10 + Object.values(found).reduce((a, b) => a + b, 0) * 2;
            giveXP(player, xpGanado, ws);

            // Actualizar estadística de recursos
            const totalRecursos = Object.values(player.inventario).reduce((a, b) => a + b, 0);
            player.stats.recursos_totales = totalRecursos;
            checkAchievements(player, ws);

            // Cooldown de 3 segundos
            player.cooldowns.scavenge = Date.now() + 3000;

            sendSuccess(ws, {
                type: 'scavenge:result',
                found,
                inventario: player.inventario
            });
        }),
    };
}
