/**
 * Narrative Handlers - Sistema de Narrativa y Misiones Narrativas
 * 
 * Comandos: 6
 * - narrative:respond
 * - getNarrativeMissions
 * - startNarrativeMission
 * - narrativeChoice
 * - narrativeVote
 * - getActiveMission
 * 
 * Arquitectura:
 * - Eventos narrativos con opciones, costos y riesgos
 * - Sistema de misiones narrativas con caché
 * - Soporte para misiones grupales con votación
 * - Imports dinámicos de narrativeMissions.js
 */

export function createNarrativeHandlers({ 
    WORLD, 
    connections,
    cache,
    guardarPlayer,
    giveXP,
    broadcast,
    sendSuccess, 
    sendError, 
    createHandler 
}) {
    return {
        'narrative:respond': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!WORLD.activeNarrativeEvent) {
                return sendError(ws, 'No hay evento narrativo activo');
            }

            const currentEvent = WORLD.activeNarrativeEvent;
            const opcion = currentEvent.opciones[msg.opcionIndex];

            if (!opcion) {
                return sendError(ws, 'Opción inválida');
            }

            let resultado = `${currentEvent.nombre}: Elegiste "${opcion.texto}". `;

            // Aplicar costo
            if (opcion.costo) {
                let canAfford = true;
                Object.entries(opcion.costo).forEach(([recurso, cant]) => {
                    if (!player.inventario[recurso] || player.inventario[recurso] < cant) {
                        canAfford = false;
                    }
                });

                if (!canAfford) {
                    return sendSuccess(ws, {
                        type: 'narrative:failed',
                        message: 'No tienes los recursos necesarios.'
                    });
                }

                Object.entries(opcion.costo).forEach(([recurso, cant]) => {
                    player.inventario[recurso] -= cant;
                });
            }

            // Aplicar riesgo
            if (opcion.riesgo && Math.random() < opcion.riesgo) {
                resultado += '¡Salió mal! Perdiste recursos y salud.';
                player.salud = Math.max(10, player.salud - 30);
            } else {
                // Aplicar recompensa
                if (opcion.recompensa) {
                    Object.entries(opcion.recompensa).forEach(([key, value]) => {
                        if (key === 'defensas') {
                            WORLD.locations.refugio.defensas += value;
                        } else if (key === 'moral') {
                            player.moral = Math.max(0, Math.min(100, (player.moral || 50) + value));
                        } else if (key === 'npc_nuevo') {
                            resultado += ` ¡${value} se unió al refugio!`;
                        } else if (key === 'refugio_mejorado') {
                            resultado += ' ¡Encontraron un refugio seguro definitivo!';
                        } else if (key === 'recursos_extra') {
                            resultado += ' ¡Establecieron ruta comercial permanente!';
                        } else {
                            player.inventario[key] = (player.inventario[key] || 0) + value;
                        }
                    });
                }
                resultado += ' ¡Éxito!';
            }

            giveXP(player, 50, ws);

            sendSuccess(ws, {
                type: 'narrative:completed',
                resultado,
                inventario: player.inventario,
                defensas: WORLD.locations.refugio.defensas
            });

            // Avanzar a siguiente parte
            if (opcion.siguiente) {
                const nextEvent = WORLD.narrativeChains[opcion.siguiente];
                if (nextEvent) {
                    WORLD.activeNarrativeEvent = nextEvent;
                    setTimeout(() => {
                        broadcast({
                            type: 'narrative:event',
                            event: nextEvent
                        });
                        console.log(`📖 EVENTO CONTINÚA: ${nextEvent.nombre} (Parte ${nextEvent.parte})`);
                    }, 5000);
                } else {
                    WORLD.activeNarrativeEvent = null;
                }
            } else {
                WORLD.activeNarrativeEvent = null;
                console.log(`📖 Evento narrativo completado`);
            }
        }),

        'getNarrativeMissions': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            try {
                // Cachear por nivel de jugador
                const cacheKey = `narrativeMissions:${player.nivel || 1}`;
                let missions = cache.get(cacheKey);

                if (!missions) {
                    const narrativeMissions = await import('./systems/narrativeMissions.js');
                    missions = narrativeMissions.default.getAvailableMissions(player.nivel || 1);

                    // Cachear por 10 segundos
                    cache.set(cacheKey, missions, 10000);
                }

                sendSuccess(ws, {
                    type: 'narrative:missions',
                    missions
                });
            } catch (error) {
                console.error('Error obteniendo misiones narrativas:', error);
                sendError(ws, 'Error cargando misiones');
            }
        }),

        'startNarrativeMission': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            try {
                const narrativeMissions = await import('./systems/narrativeMissions.js');
                const result = narrativeMissions.default.startMission(
                    msg.templateId,
                    player.id,
                    msg.isGroup,
                    msg.partyMembers || []
                );

                if (!result.success) {
                    return sendError(ws, result.message);
                }

                // Notificar a todos los miembros del grupo
                if (msg.isGroup && msg.partyMembers) {
                    msg.partyMembers.forEach(memberId => {
                        const memberWs = Array.from(connections.values()).find(c => c.playerId === memberId);
                        if (memberWs) {
                            memberWs.send(JSON.stringify({
                                type: 'narrative:started',
                                mission: result.mission
                            }));
                        }
                    });
                }

                sendSuccess(ws, {
                    type: 'narrative:started',
                    mission: result.mission
                });
            } catch (error) {
                console.error('Error iniciando misión narrativa:', error);
                sendError(ws, 'Error al iniciar misión');
            }
        }),

        'narrativeChoice': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            try {
                const narrativeMissions = await import('./systems/narrativeMissions.js');
                const result = narrativeMissions.default.makeChoice(msg.missionId, player.id, msg.choiceId);

                if (!result.success) {
                    return sendError(ws, result.message);
                }

                if (result.completed) {
                    // Aplicar recompensas
                    if (result.rewards) {
                        player.xp = (player.xp || 0) + result.rewards.xp;
                        player.salud = Math.min(100, player.salud + result.rewards.health);

                        Object.entries(result.rewards.items || {}).forEach(([item, qty]) => {
                            player.inventario[item] = (player.inventario[item] || 0) + qty;
                        });

                        guardarPlayer(player.id);
                    }

                    sendSuccess(ws, {
                        type: 'narrative:completed',
                        rewards: result.rewards,
                        summary: result.summary
                    });
                } else {
                    sendSuccess(ws, {
                        type: 'narrative:nextStep',
                        step: result.nextStep,
                        effects: result.effects
                    });
                }
            } catch (error) {
                console.error('Error en elección narrativa:', error);
                sendError(ws, 'Error procesando elección');
            }
        }),

        'narrativeVote': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            try {
                const narrativeMissions = await import('./systems/narrativeMissions.js');
                const result = narrativeMissions.default.vote(msg.missionId, player.id, msg.choiceId);

                if (!result.success) {
                    return sendError(ws, result.message);
                }

                sendSuccess(ws, {
                    type: 'narrative:voted',
                    votesCount: result.votesCount,
                    totalMembers: result.totalMembers
                });
            } catch (error) {
                console.error('Error votando:', error);
                sendError(ws, 'Error al votar');
            }
        }),

        'getActiveMission': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            try {
                // Cachear misión activa por 5 segundos
                const cacheKey = `activeMission:${playerId}`;
                let activeMission = cache.get(cacheKey);

                if (activeMission === null) {
                    const narrativeMissions = await import('./systems/narrativeMissions.js');
                    activeMission = narrativeMissions.default.getActiveMission(player.id);
                    cache.set(cacheKey, activeMission, 5000);
                }

                sendSuccess(ws, {
                    type: 'narrative:active',
                    mission: activeMission
                });
            } catch (error) {
                console.error('Error obteniendo misión activa:', error);
                sendError(ws, 'Error al obtener misión');
            }
        }),
    };
}
