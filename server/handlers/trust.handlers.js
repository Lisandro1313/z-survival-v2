/**
 * Trust Handlers - Sistema de Confianza con NPCs
 * 
 * Gestiona las relaciones y niveles de confianza entre jugadores y NPCs:
 * - Consulta de niveles de confianza individuales y globales
 * - Modificación de confianza por eventos
 * - Sistema de regalos para aumentar confianza
 * - Recompensas por completar quests
 * - Estadísticas de relaciones
 * 
 * Comandos: 6
 * - trust:get
 * - trust:get_all
 * - trust:modify
 * - trust:give_gift
 * - trust:complete_quest_trust
 * - trust:get_stats
 */

export function createTrustHandlers({ 
    WORLD,
    trustSystem,
    broadcast,
    sendSuccess, 
    sendError, 
    createHandler 
}) {
    return {
        /**
         * Obtener nivel de confianza con un NPC específico
         */
        'trust:get': createHandler(async (msg, ws, playerId) => {
            if (!trustSystem) {
                return sendError(ws, 'Sistema de confianza no disponible');
            }

            const { npcId } = msg;
            const trustData = trustSystem.getTrust(playerId, npcId);

            sendSuccess(ws, {
                type: 'trust:data',
                npcId,
                trust: trustData
            });
        }),

        /**
         * Obtener todos los niveles de confianza del jugador
         */
        'trust:get_all': createHandler(async (msg, ws, playerId) => {
            if (!trustSystem) {
                return sendError(ws, 'Sistema de confianza no disponible');
            }

            const allTrust = trustSystem.getAllTrust(playerId);

            sendSuccess(ws, {
                type: 'trust:all_data',
                relationships: allTrust
            });
        }),

        /**
         * Modificar nivel de confianza con un NPC
         * Usado por eventos del juego (acciones, decisiones, etc)
         */
        'trust:modify': createHandler(async (msg, ws, playerId) => {
            if (!trustSystem) {
                return sendError(ws, 'Sistema de confianza no disponible');
            }

            const { npcId, amount, reason } = msg;
            const newTrust = trustSystem.modifyTrust(playerId, npcId, amount, reason);

            sendSuccess(ws, {
                type: 'trust:updated',
                npcId,
                trust: newTrust,
                reason
            });

            broadcast({
                type: 'trust:updated',
                playerId,
                npcId,
                trust: newTrust
            });
        }),

        /**
         * Dar regalo a un NPC para aumentar confianza
         * Consume items del inventario del jugador
         */
        'trust:give_gift': createHandler(async (msg, ws, playerId) => {
            if (!trustSystem) {
                return sendError(ws, 'Sistema de confianza no disponible');
            }

            const { npcId, itemId, quantity } = msg;
            const player = WORLD.players[playerId];

            if (!player) {
                return sendError(ws, 'Jugador no encontrado');
            }

            const inventoryItem = player.inventario.find(i => i.item === itemId);
            if (!inventoryItem || inventoryItem.cantidad < quantity) {
                return sendError(ws, 'No tienes suficientes recursos para este regalo');
            }

            const result = trustSystem.giveGift(playerId, npcId, itemId, quantity);

            if (result.success) {
                inventoryItem.cantidad -= quantity;
                if (inventoryItem.cantidad <= 0) {
                    player.inventario = player.inventario.filter(i => i.item !== itemId);
                }

                sendSuccess(ws, {
                    type: 'trust:gift_given',
                    npcId,
                    trustGained: result.trustGained,
                    newTrust: result.newTrust
                });

                broadcast({
                    type: 'inventory:updated',
                    playerId,
                    inventario: player.inventario
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        /**
         * Completar quest y ganar confianza con NPC
         */
        'trust:complete_quest_trust': createHandler(async (msg, ws, playerId) => {
            if (!trustSystem) {
                return sendError(ws, 'Sistema de confianza no disponible');
            }

            const { npcId, questId } = msg;
            const result = trustSystem.completeQuest(playerId, npcId, questId);

            sendSuccess(ws, {
                type: 'trust:quest_completed',
                npcId,
                questId,
                trustGained: result.trustGained,
                newTrust: result.newTrust
            });
        }),

        /**
         * Obtener estadísticas de relaciones del jugador
         * Incluye cantidad de NPCs conocidos, niveles promedio, etc
         */
        'trust:get_stats': createHandler(async (msg, ws, playerId) => {
            if (!trustSystem) {
                return sendError(ws, 'Sistema de confianza no disponible');
            }

            const stats = trustSystem.getRelationshipStats(playerId);

            sendSuccess(ws, {
                type: 'trust:stats',
                stats
            });
        }),
    };
}
