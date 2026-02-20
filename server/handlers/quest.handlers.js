/**
 * Quest Handlers - Sistema de Misiones Básico
 * 
 * Gestiona el sistema de quests dinámicas del juego:
 * - Obtener quests disponibles (con caché)
 * - Aceptar quests
 * - Completar quests con recompensas
 * - Integración con sistema de economía
 * 
 * Comandos: 3
 * - getActiveQuests
 * - acceptQuest
 * - completeQuest
 */

export function createQuestHandlers({ 
    WORLD,
    cache,
    economySystem,
    guardarPlayer,
    sendSuccess, 
    sendError, 
    createHandler 
}) {
    return {
        /**
         * Obtener lista de quests activas disponibles
         * Implementa caché de 5 segundos para optimizar
         */
        'getActiveQuests': createHandler(async (msg, ws, playerId) => {
            try {
                // Intentar obtener del caché
                const cacheKey = 'activeQuests';
                let quests = cache.get(cacheKey);

                if (!quests) {
                    // No hay caché, obtener de la fuente
                    const dynamicQuests = await import('./world/dynamicQuests.js');
                    quests = dynamicQuests.default.getActiveQuests() || [];

                    // Cachear por 5 segundos
                    cache.set(cacheKey, quests, 5000);
                }

                sendSuccess(ws, {
                    type: 'quests:list',
                    quests
                });
            } catch (error) {
                console.error('Error obteniendo misiones:', error);
                sendSuccess(ws, {
                    type: 'quests:list',
                    quests: []
                });
            }
        }),

        /**
         * Aceptar una quest disponible
         * Invalida el caché de quests activas
         */
        'acceptQuest': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            try {
                const dynamicQuests = await import('./world/dynamicQuests.js');
                const quest = dynamicQuests.default.getQuestById(msg.questId);

                if (!quest) {
                    return sendError(ws, 'Misión no encontrada');
                }

                if (quest.estado !== 'disponible') {
                    return sendError(ws, 'Misión no disponible');
                }

                dynamicQuests.default.acceptQuest(msg.questId, player.id);

                // Invalidar caché de quests
                cache.invalidate('activeQuests');

                sendSuccess(ws, {
                    type: 'quest:accepted',
                    quest: dynamicQuests.default.getQuestById(msg.questId)
                });
            } catch (error) {
                console.error('Error aceptando misión:', error);
                sendError(ws, 'No se pudo aceptar la misión');
            }
        }),

        /**
         * Completar una quest
         * Aplica recompensas: XP, reputación, oro, moneda del sistema económico
         */
        'completeQuest': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            try {
                const dynamicQuests = await import('./world/dynamicQuests.js');
                const success = msg.success !== undefined ? msg.success : true;
                const result = dynamicQuests.default.completeQuest(msg.questId, player.id, success);

                if (!result.success) {
                    return sendError(ws, result.message);
                }

                // Aplicar recompensas
                if (result.rewards) {
                    if (result.rewards.xp) {
                        player.xp = (player.xp || 0) + result.rewards.xp;
                    }
                    if (result.rewards.reputacion) {
                        player.reputacion = (player.reputacion || 0) + result.rewards.reputacion;
                    }
                    if (result.rewards.oro) {
                        player.inventario.oro = (player.inventario.oro || 0) + result.rewards.oro;
                    }

                    // Recompensa de moneda por completar misión (FASE 15)
                    if (economySystem) {
                        const questType = result.tipo || 'secundaria';
                        const currencyReward = economySystem.rewardQuestCompletion(player, questType);
                        if (currencyReward.success) {
                            ws.send(JSON.stringify({
                                type: 'economy:currency_gained',
                                amount: currencyReward.amount,
                                newBalance: currencyReward.newBalance,
                                reason: 'quest_completion'
                            }));
                        }
                    }

                    guardarPlayer(player.id);
                }

                // Invalidar caché de quests
                cache.invalidate('activeQuests');

                sendSuccess(ws, {
                    type: 'quest:completed',
                    result,
                    player: {
                        xp: player.xp,
                        reputacion: player.reputacion,
                        inventario: player.inventario
                    }
                });
            } catch (error) {
                console.error('Error completando misión:', error);
                sendError(ws, 'No se pudo completar la misión');
            }
        }),
    };
}
