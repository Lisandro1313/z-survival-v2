/**
 * Missions Handlers - Sistema de Misiones Cooperativas
 * 
 * Comandos: 5
 * - quest:vote
 * - mission:complete
 * - acceptMission
 * - abandonMission
 * - completeMission
 * 
 * Arquitectura:
 * - Quests cooperativas con sistema de votación
 * - Misiones desde WORLD.activeMissions (antiguo sistema)
 * - Misiones dinámicas desde missionGenerator (nuevo sistema)
 * - Recompensas XP, items y tokens
 */

export function createMissionsHandlers({ 
    WORLD, 
    connections,
    missionGenerator,
    giveXP,
    broadcast,
    sendSuccess, 
    sendError, 
    createHandler 
}) {
    return {
        'quest:vote': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!WORLD.questCooperativa.activa) {
                return sendError(ws, 'No hay quest activa');
            }

            if (!WORLD.questCooperativa.opciones.includes(msg.opcion)) {
                return sendError(ws, 'Opción inválida');
            }

            // Remover voto anterior
            Object.keys(WORLD.questCooperativa.votos).forEach(opt => {
                WORLD.questCooperativa.votos[opt] = WORLD.questCooperativa.votos[opt].filter(id => id !== playerId);
            });

            // Agregar nuevo voto
            if (!WORLD.questCooperativa.votos[msg.opcion]) {
                WORLD.questCooperativa.votos[msg.opcion] = [];
            }
            WORLD.questCooperativa.votos[msg.opcion].push(playerId);

            sendSuccess(ws, {
                type: 'quest:voted',
                opcion: msg.opcion,
                message: `Votaste por: ${msg.opcion}`
            });

            broadcast({
                type: 'quest:votes_update',
                votos: WORLD.questCooperativa.votos
            });
        }),

        'mission:complete': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            const mission = WORLD.activeMissions.find(m => m.id === msg.missionId);
            if (!mission) {
                return sendError(ws, 'Misión no encontrada');
            }

            if (mission.completedBy.includes(playerId)) {
                return sendError(ws, 'Ya completaste esta misión');
            }

            mission.completedBy.push(playerId);

            // Aplicar recompensas
            if (mission.rewards) {
                player.xp = (player.xp || 0) + mission.rewards.xp;
                Object.entries(mission.rewards.items || {}).forEach(([item, qty]) => {
                    player.inventario[item] = (player.inventario[item] || 0) + qty;
                });
            }

            sendSuccess(ws, {
                type: 'mission:completed',
                mission,
                rewards: mission.rewards,
                player: {
                    xp: player.xp,
                    inventario: player.inventario
                }
            });

            broadcast({
                type: 'world:event',
                message: `✅ ${player.nombre} completó la misión: ${mission.title}`,
                category: 'mission'
            });
        }),

        'acceptMission': createHandler(async (msg, ws, playerId) => {
            try {
                if (!missionGenerator) {
                    return sendError(ws, '❌ Sistema de misiones no disponible');
                }

                const player = WORLD.players[playerId];
                if (!player) return sendError(ws, '❌ Jugador no encontrado');

                const mission = missionGenerator.activeMissions.get(msg.missionId);
                if (!mission) {
                    return sendError(ws, '❌ Misión no encontrada');
                }

                // Verificar si ya está participando
                if (mission.participants && mission.participants.includes(playerId)) {
                    return sendError(ws, '⚠️ Ya estás participando en esta misión');
                }

                // Agregar jugador a la misión
                if (!mission.participants) mission.participants = [];
                mission.participants.push(playerId);

                sendSuccess(ws, {
                    type: 'mission:accepted',
                    mission: mission,
                    message: `✅ Has aceptado: ${mission.title}`
                });

                // Notificar a otros participantes
                mission.participants.forEach(pid => {
                    if (pid !== playerId) {
                        const otherWs = connections.get(pid);
                        if (otherWs) {
                            sendSuccess(otherWs, {
                                type: 'mission:participant_joined',
                                missionId: mission.id,
                                playerName: player.nombre
                            });
                        }
                    }
                });

                console.log(`🎯 ${player.nombre} aceptó misión: ${mission.title}`);
            } catch (error) {
                console.error('Error aceptando misión:', error);
                sendError(ws, '❌ Error al aceptar misión');
            }
        }),

        'abandonMission': createHandler(async (msg, ws, playerId) => {
            try {
                if (!missionGenerator) {
                    return sendError(ws, '❌ Sistema de misiones no disponible');
                }

                const player = WORLD.players[playerId];
                if (!player) return sendError(ws, '❌ Jugador no encontrado');

                const mission = missionGenerator.activeMissions.get(msg.missionId);
                if (!mission) {
                    return sendError(ws, '❌ Misión no encontrada');
                }

                // Remover jugador de la misión
                if (mission.participants) {
                    mission.participants = mission.participants.filter(pid => pid !== playerId);
                }

                sendSuccess(ws, {
                    type: 'mission:abandoned',
                    missionId: mission.id,
                    message: `Has abandonado: ${mission.title}`
                });

                console.log(`⚠️ ${player.nombre} abandonó misión: ${mission.title}`);
            } catch (error) {
                console.error('Error abandonando misión:', error);
                sendError(ws, '❌ Error al abandonar misión');
            }
        }),

        'completeMission': createHandler(async (msg, ws, playerId) => {
            try {
                if (!missionGenerator) {
                    return sendError(ws, '❌ Sistema de misiones no disponible');
                }

                const player = WORLD.players[playerId];
                if (!player) return sendError(ws, '❌ Jugador no encontrado');

                const result = missionGenerator.completeMission(msg.missionId);

                if (!result) {
                    return sendError(ws, '❌ No se pudo completar la misión');
                }

                const { mission, rewards } = result;

                // Distribuir recompensas a todos los participantes
                mission.participants.forEach(pid => {
                    const participant = WORLD.players[pid];
                    if (!participant) return;

                    const participantWs = connections.get(pid);

                    // Dar XP
                    if (rewards.xp) {
                        giveXP(participant, rewards.xp, participantWs);
                    }

                    // Dar tokens
                    if (rewards.tokens) {
                        participant.tokens = (participant.tokens || 0) + rewards.tokens;
                    }

                    // Dar items
                    if (rewards.items) {
                        rewards.items.forEach(item => {
                            if (!participant.inventario) participant.inventario = {};
                            participant.inventario[item] = (participant.inventario[item] || 0) + 1;
                        });
                    }

                    // Notificar recompensas
                    if (participantWs) {
                        sendSuccess(participantWs, {
                            type: 'mission:completed',
                            mission: mission,
                            rewards: rewards,
                            message: `✅ Misión completada: ${mission.title}`
                        });
                    }

                    console.log(`🎁 ${participant.nombre} recibió recompensas por: ${mission.title}`);
                });

                // Remover de misiones activas en WORLD
                const index = WORLD.activeMissions.findIndex(m => m.id === mission.id);
                if (index !== -1) {
                    WORLD.activeMissions.splice(index, 1);
                }

            } catch (error) {
                console.error('Error completando misión:', error);
                sendError(ws, '❌ Error al completar misión');
            }
        }),
    };
}
