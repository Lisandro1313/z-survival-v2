/**
 * PvP Handlers - Sistema de combate jugador contra jugador
 * - Gestión de karma y duelos
 * - Ataques PvP y combate
 * - Historial y rankings
 * 
 * Comandos: 12
 * - pvp:get_karma, pvp:can_attack
 * - pvp:request_duel, pvp:accept_duel, pvp:decline_duel, pvp:cancel_duel, pvp:duel_action
 * - pvp:attack
 * - pvp:get_history, pvp:get_ranking, pvp:get_active_duels, pvp:get_stats
 */

export function createPvPHandlers({ WORLD, pvpSystem, broadcast, sendSuccess, sendError, createHandler }) {
    return {

        'pvp:get_karma': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const karmaData = pvpSystem.getKarma(playerId);

            sendSuccess(ws, {
                type: 'pvp:karma_data',
                karma: karmaData
            });
        }),

        'pvp:can_attack': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const { targetPlayerId } = msg;
            const canAttack = pvpSystem.canAttack(playerId, targetPlayerId);

            sendSuccess(ws, {
                type: 'pvp:can_attack_result',
                targetPlayerId,
                canAttack: canAttack.allowed,
                reason: canAttack.reason
            });
        }),

        'pvp:request_duel': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const { targetPlayerId, wager } = msg;
            const result = pvpSystem.requestDuel(playerId, targetPlayerId, wager || 0);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'pvp:duel_requested',
                    targetPlayerId,
                    duelId: result.duel.id
                });

                const targetWs = Object.entries(WORLD.players).find(
                    ([id]) => id === targetPlayerId
                )?.[1]?.ws;

                if (targetWs) {
                    sendSuccess(targetWs, {
                        type: 'pvp:duel_invitation',
                        challengerId: playerId,
                        duelId: result.duel.id,
                        wager: wager || 0,
                        expiresAt: result.duel.expires_at
                    });
                }
            } else {
                sendError(ws, result.message);
            }
        }),

        'pvp:accept_duel': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const { duelId } = msg;
            const result = pvpSystem.acceptDuel(duelId, playerId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'pvp:duel_accepted',
                    duelId
                });

                const challengerId = result.duel.challenger_id;
                const challengerWs = Object.entries(WORLD.players).find(
                    ([id]) => id === challengerId
                )?.[1]?.ws;

                if (challengerWs) {
                    sendSuccess(challengerWs, {
                        type: 'pvp:duel_started',
                        duelId,
                        opponentId: playerId
                    });
                }

                broadcast({
                    type: 'pvp:duel_active',
                    duelId,
                    participants: [challengerId, playerId]
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'pvp:decline_duel': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const { duelId } = msg;
            const result = pvpSystem.declineDuel(duelId, playerId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'pvp:duel_declined',
                    duelId
                });

                const challengerId = result.challengerId;
                const challengerWs = Object.entries(WORLD.players).find(
                    ([id]) => id === challengerId
                )?.[1]?.ws;

                if (challengerWs) {
                    sendSuccess(challengerWs, {
                        type: 'pvp:duel_declined',
                        duelId,
                        declinerId: playerId
                    });
                }
            } else {
                sendError(ws, result.message);
            }
        }),

        'pvp:cancel_duel': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const { duelId } = msg;
            const result = pvpSystem.cancelDuel(duelId, playerId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'pvp:duel_cancelled',
                    duelId
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'pvp:duel_action': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const { duelId, action } = msg;
            const player = WORLD.players[playerId];

            if (!player) {
                return sendError(ws, 'Jugador no encontrado');
            }

            const result = pvpSystem.resolveDuelRound(duelId, playerId, action, player);

            if (result.success) {
                broadcast({
                    type: 'pvp:duel_round_result',
                    duelId,
                    result: result.roundResult
                });

                if (result.duelEnded) {
                    const endResult = pvpSystem.endDuel(duelId, result.winner);

                    if (endResult.success) {
                        const winner = WORLD.players[result.winner];
                        const loser = WORLD.players[result.loser];

                        if (winner && endResult.rewards) {
                            winner.caps += endResult.rewards.caps;
                            winner.xp += endResult.rewards.xp;
                        }

                        broadcast({
                            type: 'pvp:duel_ended',
                            duelId,
                            winner: result.winner,
                            loser: result.loser,
                            rewards: endResult.rewards
                        });
                    }
                }

                sendSuccess(ws, {
                    type: 'pvp:action_processed',
                    result: result.roundResult
                });
            } else {
                sendError(ws, result.message);
            }
        }),

        'pvp:attack': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const { targetPlayerId } = msg;
            const player = WORLD.players[playerId];
            const target = WORLD.players[targetPlayerId];

            if (!player || !target) {
                return sendError(ws, 'Jugador no encontrado');
            }

            const canAttack = pvpSystem.canAttack(playerId, targetPlayerId);

            if (!canAttack.allowed) {
                return sendError(ws, canAttack.reason);
            }

            const attackResult = {
                damage: Math.floor(Math.random() * 30) + 10,
                critical: Math.random() < 0.15
            };

            if (attackResult.critical) {
                attackResult.damage *= 2;
            }

            target.vida -= attackResult.damage;
            const targetKilled = target.vida <= 0;

            if (targetKilled) {
                target.vida = 0;
                pvpSystem.registerKill(playerId, targetPlayerId);
            }

            sendSuccess(ws, {
                type: 'pvp:attack_result',
                targetPlayerId,
                damage: attackResult.damage,
                critical: attackResult.critical,
                targetKilled
            });

            const targetWs = target.ws;
            if (targetWs) {
                sendSuccess(targetWs, {
                    type: 'pvp:attacked',
                    attackerId: playerId,
                    damage: attackResult.damage,
                    critical: attackResult.critical,
                    newHealth: target.vida
                });
            }

            broadcast({
                type: 'pvp:combat_update',
                attackerId: playerId,
                targetPlayerId,
                damage: attackResult.damage,
                targetKilled
            });
        }),

        'pvp:get_history': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const { limit } = msg;
            const history = pvpSystem.getPvPHistory(playerId, limit || 20);

            sendSuccess(ws, {
                type: 'pvp:history',
                history
            });
        }),

        'pvp:get_ranking': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const { limit } = msg;
            const ranking = pvpSystem.getPvPRanking(limit || 10);

            sendSuccess(ws, {
                type: 'pvp:ranking',
                ranking
            });
        }),

        'pvp:get_active_duels': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const duels = pvpSystem.getActiveDuels(playerId);

            sendSuccess(ws, {
                type: 'pvp:active_duels',
                duels
            });
        }),

        'pvp:get_stats': createHandler(async (msg, ws, playerId) => {
            if (!pvpSystem) {
                return sendError(ws, 'Sistema PvP no disponible');
            }

            const stats = pvpSystem.getPlayerStats(playerId);

            sendSuccess(ws, {
                type: 'pvp:stats',
                stats
            });
        }),

    };
}
