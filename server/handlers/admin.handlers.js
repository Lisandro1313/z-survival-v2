/**
 * Admin & Utils Handlers - Comandos Administrativos y Utilidades
 * 
 * Comandos: 3
 * - craft (crafteo básico legacy)
 * - admin:getMetrics
 * - getIntenseRelationships
 * 
 * Arquitectura:
 * - Crafteo básico con verificación de materiales
 * - Métricas de rendimiento del servidor
 * - Sistema de relaciones intensas NPCs
 */

export function createAdminUtilsHandlers({ 
    WORLD, 
    rateLimiter,
    handlerMetrics,
    getMetricsReport,
    applyClassBonus,
    updatePlayerStats,
    giveXP,
    checkAchievements,
    sendSuccess, 
    sendError, 
    createHandler 
}) {
    return {
        'craft': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            // Rate limiting: max 10 crafteos por minuto
            const rateLimit = rateLimiter.check(playerId, 'craft', 10, 60000);
            if (!rateLimit.allowed) {
                const segundos = Math.ceil(rateLimit.resetIn / 1000);
                return sendError(ws, `⏱️ Demasiado rápido. Espera ${segundos}s`);
            }

            if (player.cooldowns.craft && Date.now() < player.cooldowns.craft) {
                const segundos = Math.ceil((player.cooldowns.craft - Date.now()) / 1000);
                return sendError(ws, `Espera ${segundos}s antes de craftear de nuevo`);
            }

            const recipe = WORLD.craftingRecipes[msg.item];
            if (!recipe) {
                return sendError(ws, 'Receta inválida');
            }

            // Verificar materiales
            let canCraft = true;
            const materialRequirements = {};
            Object.keys(recipe).forEach(mat => {
                if (mat === 'resultado') return;
                materialRequirements[mat] = applyClassBonus(player, 'craft_cost', recipe[mat]);
                if (!player.inventario[mat] || player.inventario[mat] < materialRequirements[mat]) {
                    canCraft = false;
                }
            });

            if (!canCraft) {
                return sendError(ws, 'No tienes suficientes materiales');
            }

            // Consumir materiales
            Object.keys(materialRequirements).forEach(mat => {
                player.inventario[mat] -= materialRequirements[mat];
            });

            // Crear item
            const resultado = recipe.resultado;
            if (resultado.tipo === 'defensa') {
                WORLD.locations.refugio.defensas += resultado.cantidad;
                sendSuccess(ws, {
                    type: 'craft:success',
                    item: msg.item,
                    defensas: WORLD.locations.refugio.defensas,
                    inventario: player.inventario
                });
            } else {
                player.inventario[resultado.tipo] = (player.inventario[resultado.tipo] || 0) + resultado.cantidad;
                sendSuccess(ws, {
                    type: 'craft:success',
                    item: msg.item,
                    inventario: player.inventario
                });
            }

            player.skills.mecanica = Math.min(10, player.skills.mecanica + 0.2);
            updatePlayerStats(player, 'items_crafteados', 1);
            const xpGained = applyClassBonus(player, 'xp', 15);
            giveXP(player, xpGained, ws);
            checkAchievements(player, ws);

            player.cooldowns.craft = Date.now() + 2000;
        }),

        'admin:getMetrics': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            // Solo admin puede ver métricas (puedes agregar un flag isAdmin al jugador)
            // Por ahora lo dejamos abierto para testing

            const report = getMetricsReport();

            sendSuccess(ws, {
                type: 'admin:metrics',
                metrics: report,
                totalHandlers: Object.keys(handlerMetrics).length,
                timestamp: Date.now()
            });

            console.log(`📊 Métricas solicitadas por ${player.nombre}`);
        }),

        'getIntenseRelationships': createHandler(async (msg, ws, playerId) => {
            try {
                const npcRelationships = await import('./world/npcRelations.js');
                const minIntensity = msg.minIntensity || 5;
                const relationships = npcRelationships.default.getIntenseRelationships(minIntensity);

                sendSuccess(ws, {
                    type: 'world:relationships',
                    relationships
                });
            } catch (error) {
                console.error('Error obteniendo relaciones:', error);
                sendError(ws, 'No se pudieron obtener las relaciones');
            }
        }),
    };
}
