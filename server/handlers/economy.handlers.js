/**
 * Economy Handlers - Sistema de Economía
 * 
 * Gestiona el sistema económico del juego incluyendo:
 * - Estadísticas económicas del jugador
 * - Recompensas diarias con bonos por streak
 * - Compra/venta con NPCs comerciantes
 * - Tiendas dinámicas de NPCs
 * 
 * Comandos: 5
 * - economy:get_stats
 * - economy:daily_reward
 * - economy:buy_from_npc
 * - economy:sell_to_npc
 * - economy:get_npc_shop
 */

export function createEconomyHandlers({ 
    WORLD, 
    economySystem,
    sendSuccess, 
    sendError, 
    createHandler 
}) {
    return {
        /**
         * Obtener estadísticas económicas del jugador
         */
        'economy:get_stats': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!economySystem) {
                return sendError(ws, 'Sistema de economía no disponible');
            }

            const stats = economySystem.getEconomyStats(player);

            sendSuccess(ws, {
                type: 'economy:stats',
                stats
            });
        }),

        /**
         * Recompensa diaria con bonus por racha de días consecutivos
         */
        'economy:daily_reward': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!economySystem) {
                return sendError(ws, 'Sistema de economía no disponible');
            }

            const result = economySystem.rewardDailyLogin(player);

            if (!result.success) {
                return sendError(ws, result.error);
            }

            sendSuccess(ws, {
                type: 'economy:daily_reward',
                amount: result.amount,
                newBalance: result.newBalance,
                loginStreak: result.loginStreak,
                streakBonus: result.streakBonus,
                message: `🎁 +${result.amount} caps (${result.loginStreak} días consecutivos)`
            });

            console.log(`🎁 ${player.nombre} recibió recompensa diaria: ${result.amount} caps`);
        }),

        /**
         * Comprar items del NPC comerciante
         */
        'economy:buy_from_npc': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!economySystem) {
                return sendError(ws, 'Sistema de economía no disponible');
            }

            const { itemKey, quantity = 1 } = msg;

            const result = economySystem.buyFromNPC(player, itemKey, quantity);

            if (!result.success) {
                return sendError(ws, result.error);
            }

            sendSuccess(ws, {
                type: 'economy:purchase_complete',
                item: result.item,
                quantity: result.quantity,
                price: result.price,
                newBalance: result.newBalance,
                inventario: player.inventario,
                message: `Compraste ${itemKey} x${quantity} por ${result.price} caps`
            });

            console.log(`🛒 ${player.nombre} compró ${itemKey} x${quantity} por ${result.price} caps`);
        }),

        /**
         * Vender items al NPC comerciante
         */
        'economy:sell_to_npc': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!economySystem) {
                return sendError(ws, 'Sistema de economía no disponible');
            }

            const { itemKey, quantity = 1 } = msg;

            const result = economySystem.sellToNPC(player, itemKey, quantity);

            if (!result.success) {
                return sendError(ws, result.error);
            }

            sendSuccess(ws, {
                type: 'economy:sale_complete',
                item: result.item,
                quantity: result.quantity,
                price: result.price,
                newBalance: result.newBalance,
                inventario: player.inventario,
                message: `Vendiste ${itemKey} x${quantity} por ${result.price} caps`
            });

            console.log(`💰 ${player.nombre} vendió ${itemKey} x${quantity} por ${result.price} caps`);
        }),

        /**
         * Obtener inventario de la tienda NPC
         * Genera tiendas dinámicas según tipo de NPC y nivel del jugador
         */
        'economy:get_npc_shop': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!economySystem) {
                return sendError(ws, 'Sistema de economía no disponible');
            }

            const { npcType = 'general' } = msg;
            const shop = economySystem.generateNPCShop(npcType, player.nivel || 1);

            sendSuccess(ws, {
                type: 'economy:npc_shop',
                shop
            });
        }),
    };
}
