/**
 * Clan Handlers - Sistema de Clanes
 * Fase 6 de refactorización
 * 
 * Handlers:
 * - clan:create - Crear un nuevo clan
 * - clan:get_info - Obtener información de un clan
 * - clan:get_my_clan - Obtener clan del jugador
 * - clan:invite - Invitar a un jugador al clan
 * - clan:accept_invite - Aceptar invitación
 * - clan:decline_invite - Rechazar invitación
 * - clan:leave - Abandonar el clan
 * - clan:kick - Expulsar miembro
 * - clan:promote - Promover/cambiar rango de miembro
 * - clan:get_members - Listar miembros del clan
 * - clan:storage_deposit - Depositar items en almacén del clan
 * - clan:storage_withdraw - Retirar items del almacén
 * - clan:get_storage - Ver almacén del clan
 * - clan:search_recruiting - Buscar clanes reclutando
 * - clan:get_activity_log - Ver registro de actividad del clan
 */

export function createClanHandlers({
    WORLD,
    clanSystem,
    connections,
    sendSuccess,
    sendError,
    createHandler,
    broadcast
}) {
    // Helper para obtener WebSocket de un jugador
    const getPlayerWs = (playerId) => {
        return connections ? connections.get(playerId) : null;
    };

    return {
        'clan:create': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { name, tag, description } = msg;
            const player = WORLD.players[playerId];

            if (!player) {
                return sendError(ws, 'Jugador no encontrado');
            }

            if (player.caps < 5000) {
                return sendError(ws, 'Necesitas 5000 chapas para crear un clan');
            }

            const result = clanSystem.createClan(playerId, name, tag, description);

            if (result.success) {
                player.caps -= 5000;

                sendSuccess(ws, {
                    type: 'clan:created',
                    clan: result.clan
                });

                broadcast({
                    type: 'inventory:updated',
                    playerId,
                    caps: player.caps
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'clan:get_info': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { clanId } = msg;
            const clan = clanSystem.getClan(clanId);

            if (!clan) {
                return sendError(ws, 'Clan no encontrado');
            }

            sendSuccess(ws, {
                type: 'clan:info',
                clan
            });
        }),

        'clan:get_my_clan': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const clan = clanSystem.getPlayerClan(playerId);

            sendSuccess(ws, {
                type: 'clan:my_info',
                clan: clan || null
            });
        }),

        'clan:invite': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { targetPlayerId } = msg;
            const result = clanSystem.invitePlayer(playerId, targetPlayerId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'clan:invite_sent',
                    targetPlayerId
                });

                // Notificar al jugador invitado si está online
                const targetWs = getPlayerWs(targetPlayerId);
                if (targetWs) {
                    sendSuccess(targetWs, {
                        type: 'clan:invite_received',
                        clanId: result.invite.clan_id,
                        inviterId: playerId,
                        expiresAt: result.invite.expires_at
                    });
                }
            } else {
                sendError(ws, result.message);
            }
        }),

        'clan:accept_invite': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { clanId } = msg;
            const result = clanSystem.acceptInvite(playerId, clanId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'clan:joined',
                    clan: result.clan
                });

                broadcast({
                    type: 'clan:member_joined',
                    clanId,
                    playerId
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'clan:decline_invite': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { clanId } = msg;
            const result = clanSystem.declineInvite(playerId, clanId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'clan:invite_declined',
                    clanId
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'clan:leave': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const result = clanSystem.leaveClan(playerId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'clan:left',
                    clanId: result.clanId
                });

                broadcast({
                    type: 'clan:member_left',
                    clanId: result.clanId,
                    playerId
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'clan:kick': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { targetPlayerId } = msg;
            const result = clanSystem.kickMember(playerId, targetPlayerId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'clan:member_kicked',
                    targetPlayerId
                });

                broadcast({
                    type: 'clan:member_left',
                    clanId: result.clanId,
                    playerId: targetPlayerId
                });

                // Notificar al jugador expulsado si está online
                const targetWs = getPlayerWs(targetPlayerId);
                if (targetWs) {
                    sendSuccess(targetWs, {
                        type: 'clan:kicked',
                        clanId: result.clanId
                    });
                }
            } else {
                sendError(ws, result.message);
            }
        }),

        'clan:promote': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { targetPlayerId, newRank } = msg;
            const result = clanSystem.promoteMember(playerId, targetPlayerId, newRank);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'clan:member_promoted',
                    targetPlayerId,
                    newRank
                });

                broadcast({
                    type: 'clan:rank_updated',
                    clanId: result.clanId,
                    playerId: targetPlayerId,
                    newRank
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'clan:get_members': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { clanId } = msg;
            const members = clanSystem.getClanMembers(clanId);

            sendSuccess(ws, {
                type: 'clan:members',
                clanId,
                members
            });
        }),

        'clan:storage_deposit': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { itemId, quantity } = msg;
            const player = WORLD.players[playerId];

            if (!player) {
                return sendError(ws, 'Jugador no encontrado');
            }

            const inventoryItem = player.inventario.find(i => i.item === itemId);
            if (!inventoryItem || inventoryItem.cantidad < quantity) {
                return sendError(ws, 'No tienes suficientes recursos');
            }

            const result = clanSystem.depositToStorage(playerId, itemId, quantity);

            if (result.success) {
                inventoryItem.cantidad -= quantity;
                if (inventoryItem.cantidad <= 0) {
                    player.inventario = player.inventario.filter(i => i.item !== itemId);
                }

                sendSuccess(ws, {
                    type: 'clan:storage_deposited',
                    itemId,
                    quantity
                });

                broadcast({
                    type: 'inventory:updated',
                    playerId,
                    inventario: player.inventario
                });

                broadcast({
                    type: 'clan:storage_updated',
                    clanId: result.clanId
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'clan:storage_withdraw': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { itemId, quantity } = msg;
            const player = WORLD.players[playerId];

            if (!player) {
                return sendError(ws, 'Jugador no encontrado');
            }

            const result = clanSystem.withdrawFromStorage(playerId, itemId, quantity);

            if (result.success) {
                const inventoryItem = player.inventario.find(i => i.item === itemId);
                if (inventoryItem) {
                    inventoryItem.cantidad += quantity;
                } else {
                    player.inventario.push({ item: itemId, cantidad: quantity });
                }

                sendSuccess(ws, {
                    type: 'clan:storage_withdrawn',
                    itemId,
                    quantity
                });

                broadcast({
                    type: 'inventory:updated',
                    playerId,
                    inventario: player.inventario
                });

                broadcast({
                    type: 'clan:storage_updated',
                    clanId: result.clanId
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'clan:get_storage': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const result = clanSystem.getClanStorage(playerId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'clan:storage',
                    storage: result.storage
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'clan:search_recruiting': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const clans = clanSystem.getRecruitingClans();

            sendSuccess(ws, {
                type: 'clan:recruiting_list',
                clans
            });
        }),

        'clan:get_activity_log': createHandler(async (msg, ws, playerId) => {
            if (!clanSystem) {
                return sendError(ws, 'Sistema de clanes no disponible');
            }

            const { limit } = msg;
            const result = clanSystem.getClanActivityLog(playerId, limit || 50);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'clan:activity_log',
                    activities: result.activities
                });
            } else {
                sendError(ws, result.message);
            }
        })
    };
}
