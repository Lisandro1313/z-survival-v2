/**
 * World Events Handlers - Sistema de Eventos Mundiales
 * 
 * Comandos: 4
 * - getWorldEvents
 * - event:respond
 * - getWorldState
 * - getMissions
 * 
 * Arquitectura:
 * - Eventos mundiales con narrativa dinámica (caché 3s)
 * - Sistema de respuesta a eventos con riesgos y recompensas
 * - Estado completo de simulación del mundo
 * - Sistema de misiones dinámicas
 */

export function createWorldEventsHandlers({ 
    WORLD, 
    connections,
    cache,
    missionGenerator,
    broadcast,
    sendSuccess, 
    sendError, 
    createHandler 
}) {
    return {
        'getWorldEvents': createHandler(async (msg, ws, playerId) => {
            try {
                const limit = msg.limit || 30;
                const cacheKey = `worldEvents:${limit}`;
                let events = cache.get(cacheKey);

                if (!events) {
                    const narrativeEngine = await import('./world/narrativeEngine.js');
                    events = narrativeEngine.default.getRecentEvents(limit);

                    // Cachear por 3 segundos
                    cache.set(cacheKey, events, 3000);
                }

                sendSuccess(ws, {
                    type: 'world:events',
                    events: events.reverse()
                });
            } catch (error) {
                console.error('Error obteniendo eventos del mundo:', error);
                sendError(ws, 'No se pudieron obtener los eventos del mundo');
            }
        }),

        'event:respond': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            const evento = WORLD.activeEvents.find(e => e.id === msg.eventId);
            if (!evento) {
                return sendError(ws, 'Evento no disponible');
            }

            const opcion = evento.opciones[msg.opcionIndex];

            // Verificar costo
            let canAfford = true;
            Object.keys(opcion.costo).forEach(recurso => {
                if (recurso === 'moral' || recurso === 'defensas') return;
                const total = player.inventario[recurso] || 0;
                if (total < opcion.costo[recurso]) {
                    canAfford = false;
                }
            });

            if (!canAfford) {
                return sendError(ws, 'No tienes suficientes recursos');
            }

            // Aplicar costo
            Object.keys(opcion.costo).forEach(recurso => {
                if (recurso === 'moral' || recurso === 'defensas') return;
                player.inventario[recurso] -= opcion.costo[recurso];
            });

            let resultado = `Elegiste: ${opcion.texto}. `;

            // Riesgo
            if (Math.random() < opcion.riesgo) {
                resultado += '¡Algo salió MAL! ';
                player.salud -= 20;
                broadcast({
                    type: 'event:bad_outcome',
                    message: `${player.nombre} tomó una decisión arriesgada y salió mal...`
                });
            } else {
                // Aplicar recompensas
                Object.keys(opcion.recompensa).forEach(recurso => {
                    if (recurso === 'moral') {
                        Object.values(WORLD.npcs).forEach(n => {
                            if (n.vivo) n.moral = Math.max(0, Math.min(100, n.moral + opcion.recompensa[recurso]));
                        });
                    } else if (recurso === 'defensas') {
                        WORLD.locations.refugio.defensas += opcion.recompensa[recurso];
                    } else {
                        player.inventario[recurso] = (player.inventario[recurso] || 0) + opcion.recompensa[recurso];
                    }
                });
                resultado += 'Todo salió bien.';

                player.xp += 25;
                ws.send(JSON.stringify({
                    type: 'xp:gained',
                    amount: 25,
                    xp: player.xp,
                    xpMax: player.xpParaSiguienteNivel
                }));

                if (player.xp >= player.xpParaSiguienteNivel) {
                    player.nivel++;
                    player.xp = 0;
                    player.xpParaSiguienteNivel = Math.floor(player.xpParaSiguienteNivel * 1.5);
                    ws.send(JSON.stringify({
                        type: 'level:up',
                        nivel: player.nivel,
                        xpMax: player.xpParaSiguienteNivel
                    }));
                }

                // Agregar NPC si es evento de refugiados
                if (evento.id === 'refugiados' && msg.opcionIndex === 0) {
                    const nombres = ['Ana', 'Pedro', 'Luis', 'Carmen', 'Miguel', 'Sofia', 'Carlos', 'Elena'];
                    const apellidos = ['García', 'López', 'Martínez', 'Rodríguez', 'González', 'Fernández'];
                    const nombreCompleto = `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`;

                    const npcId = `refugiado_${Date.now()}`;
                    WORLD.npcs[npcId] = {
                        id: npcId,
                        nombre: nombreCompleto,
                        rol: 'refugiado',
                        locacion: 'refugio',
                        salud: 80,
                        hambre: 60,
                        moral: 70,
                        vivo: true,
                        estado: 'activo',
                        enMision: false,
                        dialogo: `Gracias por aceptarnos, ${player.nombre}. No te defraudaremos.`,
                        dialogos: [
                            'Venimos de muy lejos...',
                            'No teníamos a dónde ir.',
                            'Ayudaremos en lo que podamos.',
                            'Mi familia está a salvo gracias a ti.'
                        ]
                    };

                    broadcast({
                        type: 'npc:joined',
                        npc: WORLD.npcs[npcId]
                    });

                    resultado += ` ${nombreCompleto} se unió al refugio.`;
                }

                broadcast({
                    type: 'event:outcome',
                    message: `${player.nombre}: ${resultado}`
                });
            }

            // Remover evento
            WORLD.activeEvents = WORLD.activeEvents.filter(e => e.id !== msg.eventId);

            sendSuccess(ws, {
                type: 'event:resolved',
                resultado,
                inventario: player.inventario,
                salud: player.salud
            });
        }),

        'getWorldState': createHandler(async (msg, ws, playerId) => {
            try {
                const worldSimulation = await import('./world/simulation.js');
                const state = worldSimulation.default.getWorldState() || {
                    tick: 0,
                    npcCount: 0,
                    activeEvents: 0,
                    narrativeStats: { romances: 0, conflictos: 0, dramas: 0, actividades: 0 },
                    aiStats: { npcsWithMemories: 0, totalMemories: 0, activeGoals: 0 }
                };

                sendSuccess(ws, {
                    type: 'world:fullState',
                    state
                });
            } catch (error) {
                console.error('Error obteniendo estado del mundo:', error);
                // Enviar estado vacío en lugar de error
                sendSuccess(ws, {
                    type: 'world:fullState',
                    state: {
                        tick: 0,
                        npcCount: 0,
                        activeEvents: 0,
                        narrativeStats: { romances: 0, conflictos: 0, dramas: 0, actividades: 0 },
                        aiStats: { npcsWithMemories: 0, totalMemories: 0, activeGoals: 0 }
                    }
                });
            }
        }),

        'getMissions': createHandler(async (msg, ws, playerId) => {
            try {
                if (!missionGenerator) {
                    return sendError(ws, '❌ Sistema de misiones no disponible');
                }

                const activeMissions = Array.from(missionGenerator.activeMissions.values());
                const playerMissions = activeMissions.filter(m =>
                    m.participants && m.participants.includes(playerId)
                );

                sendSuccess(ws, {
                    type: 'missions:list',
                    missions: {
                        active: playerMissions,
                        available: activeMissions.filter(m => !m.participants || !m.participants.includes(playerId))
                    }
                });
            } catch (error) {
                console.error('Error obteniendo misiones:', error);
                sendError(ws, '❌ Error al obtener misiones');
            }
        }),
    };
}
