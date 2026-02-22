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

        'getWorldNodes': createHandler(async (msg, ws, playerId) => {
            try {
                const worldState = WORLD.worldState || WORLD;
                const nodes = Array.from(worldState.nodes.values());
                
                // Convertir nodos al formato esperado por el frontend
                const nodesFormatted = {};
                const edgesFormatted = {};
                
                nodes.forEach(node => {
                    nodesFormatted[node.id] = {
                        id: node.id,
                        name: node.nombre,
                        type: node.tipo,
                        description: node.descripcion,
                        resources: node.recursos,
                        zombies: node.zombies || 0,
                        defenses: node.defensas || 0,
                        region: node.regionId
                    };
                    
                    edgesFormatted[node.id] = node.conectado_a || [];
                });

                sendSuccess(ws, {
                    type: 'world:nodes',
                    graph: {
                        nodes: nodesFormatted,
                        edges: edgesFormatted
                    }
                });
            } catch (error) {
                console.error('Error obteniendo nodos del mundo:', error);
                sendError(ws, '❌ Error al obtener nodos del mundo');
            }
        }),

        'exploreNode': createHandler(async (msg, ws, playerId) => {
            try {
                const worldState = WORLD.worldState || WORLD;
                const player = WORLD.players[playerId];
                
                if (!player) {
                    return sendError(ws, 'Jugador no encontrado');
                }

                const nodeId = msg.nodeId;
                const node = worldState.getNode(nodeId);

                if (!node) {
                    return sendError(ws, 'Nodo no encontrado');
                }

                // Mover al jugador al nodo
                player.nodeId = nodeId;

                // Si hay zombies, iniciar combate automáticamente
                if (node.zombies && node.zombies > 0) {
                    // Usar el sistema de combate avanzado existente
                    const playerLevel = player.nivel || 1;
                    
                    // Generar zombie con nivel basado en el nodo
                    const zombieTipo = node.zombies >= 5 ? 'corredor' : 'común';
                    const zombie = {
                        tipo: zombieTipo,
                        nombre: zombieTipo === 'corredor' ? 'Zombie Corredor' : 'Zombie',
                        icono: '🧟',
                        hpMax: 40 + (playerLevel * 10) + (node.zombies * 5),
                        hpActual: 40 + (playerLevel * 10) + (node.zombies * 5),
                        nivel: Math.max(1, Math.floor(node.zombies / 2) + 1),
                        ataque: 8 + playerLevel + node.zombies,
                        defensa: 3 + Math.floor(playerLevel / 2),
                        xp: 15 + (node.zombies * 3),
                        descripción: `Un zombie ${zombieTipo} en ${node.nombre}`
                    };

                    // Inicializar equipamiento si no existe
                    if (!player.equipamiento) {
                        player.equipamiento = { arma_principal: 'puños', armadura: 'sin_armadura' };
                    }
                    if (!player.efectosActivos) {
                        player.efectosActivos = [];
                    }

                    // Iniciar combate
                    player.inCombat = {
                        zombie: zombie,
                        turno: 'player',
                        roundNumber: 1,
                        nodeId: nodeId
                    };

                    // Enviar en formato compatible con frontend
                    const combatId = `combat_${Date.now()}`;
                    sendSuccess(ws, {
                        type: 'combat:started',
                        combatId: combatId,
                        enemy: {
                            id: `zombie_${nodeId}_${Date.now()}`,
                            name: zombie.nombre,
                            type: zombie.tipo,
                            hp: zombie.hpActual,
                            maxHp: zombie.hpMax,
                            level: zombie.nivel
                        },
                        playerHp: player.salud,
                        message: `¡Encuentras ${node.zombies} zombies en ${node.nombre}! ${zombie.icono} Un ${zombie.nombre} te ataca!`
                    });
                } else {
                    // No hay zombies, exploración segura
                    // Dar algo de botín aleatorio
                    const loot = {};
                    if (node.recursos) {
                        Object.keys(node.recursos).forEach(recurso => {
                            const cantidadMax = node.recursos[recurso];
                            if (cantidadMax > 0) {
                                const cantidad = Math.floor(Math.random() * Math.min(3, cantidadMax)) + 1;
                                loot[recurso] = cantidad;
                                if (!player.inventario[recurso]) {
                                    player.inventario[recurso] = 0;
                                }
                                player.inventario[recurso] += cantidad;
                                // Reducir recursos del nodo
                                node.recursos[recurso] = Math.max(0, node.recursos[recurso] - cantidad);
                            }
                        });
                    }

                    const lootMessage = Object.keys(loot).length > 0
                        ? Object.entries(loot).map(([r, c]) => `+${c} ${r}`).join(', ')
                        : 'No encontraste nada útil';

                    sendSuccess(ws, {
                        type: 'explore:success',
                        nodeId,
                        nodeName: node.nombre,
                        loot,
                        inventory: player.inventario,
                        message: `Exploraste ${node.nombre}. ${lootMessage}`
                    });
                }

                // Notificar movimiento
                sendSuccess(ws, {
                    type: 'moved',
                    location: nodeId,
                    message: `Te moviste a ${node.nombre}`
                });

            } catch (error) {
                console.error('Error explorando nodo:', error);
                sendError(ws, '❌ Error al explorar nodo');
            }
        }),
    };
}
