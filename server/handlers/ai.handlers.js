/**
 * AI SYSTEM HANDLERS
 * Comandos de administración y control del sistema de IA
 */

/**
 * Crea los handlers del sistema de IA
 * @param {Object} dependencies - Dependencias inyectadas
 * @param {Object} dependencies.aiManager - Manager del sistema de IA
 * @param {Class} dependencies.AgentSpawner - Clase para spawnear agentes
 * @param {Function} dependencies.sendSuccess - Helper para enviar respuesta exitosa
 * @param {Function} dependencies.sendError - Helper para enviar error
 * @param {Function} dependencies.createHandler - Wrapper de handlers
 * @param {Function} dependencies.broadcast - Función para broadcast
 * @returns {Object} Objeto con todos los handlers de IA
 */
export function createAIHandlers({
    aiManager,
    AgentSpawner,
    sendSuccess,
    sendError,
    createHandler,
    broadcast
}) {
    return {
        'ai:get_stats': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            try {
                const stats = aiManager.getStats();
                sendSuccess(ws, {
                    type: 'ai:stats',
                    data: stats
                });
            } catch (error) {
                console.error('Error obteniendo stats de IA:', error);
                sendError(ws, '❌ Error al obtener estadísticas de IA');
            }
        }),

        'ai:start': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            if (aiManager.enabled) {
                return sendError(ws, '⚠️ El sistema de IA ya está activo');
            }

            try {
                aiManager.start();

                broadcast({
                    type: 'ai:started',
                    timestamp: Date.now()
                });

                sendSuccess(ws, {
                    type: 'ai:started',
                    message: '✅ Sistema de IA iniciado'
                });

                console.log(`🤖 [AI] Sistema iniciado por ${playerId}`);
            } catch (error) {
                console.error('Error iniciando IA:', error);
                sendError(ws, '❌ Error al iniciar sistema de IA');
            }
        }),

        'ai:stop': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            if (!aiManager.enabled) {
                return sendError(ws, '⚠️ El sistema de IA ya está detenido');
            }

            try {
                aiManager.stop();

                broadcast({
                    type: 'ai:stopped',
                    timestamp: Date.now()
                });

                sendSuccess(ws, {
                    type: 'ai:stopped',
                    message: '✅ Sistema de IA detenido'
                });

                console.log(`🤖 [AI] Sistema detenido por ${playerId}`);
            } catch (error) {
                console.error('Error deteniendo IA:', error);
                sendError(ws, '❌ Error al detener sistema de IA');
            }
        }),

        'ai:get_agents': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            if (!aiManager.enabled) {
                return sendSuccess(ws, {
                    type: 'ai:agents',
                    data: []
                });
            }

            try {
                const agents = [];
                for (const worker of aiManager.workers.values()) {
                    const activeAgents = worker.agentRegistry.getActiveAgents();
                    agents.push(...activeAgents);
                }

                sendSuccess(ws, {
                    type: 'ai:agents',
                    data: agents
                });
            } catch (error) {
                console.error('Error obteniendo agentes de IA:', error);
                sendError(ws, '❌ Error al obtener agentes');
            }
        }),

        'ai:spawn_initial': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            if (!AgentSpawner) {
                return sendError(ws, '❌ AgentSpawner no disponible');
            }

            try {
                const count = msg.count || 20;
                const regionId = msg.regionId || 'default';

                // Verificar si ya hay agentes
                const worker = aiManager.workers.get(regionId);
                if (!worker) {
                    return sendError(ws, '❌ Worker no encontrado para región: ' + regionId);
                }

                const existingAgents = worker.agentRegistry.getActiveAgents();
                if (existingAgents.length > 0) {
                    return sendError(ws, `⚠️ Ya existen ${existingAgents.length} agentes. Límpielos primero.`);
                }

                // Spawear agentes
                const spawner = new AgentSpawner();
                const agents = spawner.spawnInitialAgents(regionId, count);

                // Registrar agentes en el worker
                for (const agent of agents) {
                    worker.agentRegistry.add(agent);
                }

                // Persistir en base de datos
                await aiManager.persistSnapshot(agents);

                sendSuccess(ws, {
                    type: 'ai:spawn_complete',
                    data: {
                        count: agents.length,
                        regionId,
                        message: `✅ ${agents.length} agentes spawneados exitosamente`
                    }
                });

                console.log(`🤖 [AI] ${agents.length} agentes spawneados en región ${regionId} por ${playerId}`);
            } catch (error) {
                console.error('Error spawneando agentes:', error);
                sendError(ws, '❌ Error al spawnear agentes: ' + error.message);
            }
        }),

        'ai:spawn_single': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            if (!AgentSpawner) {
                return sendError(ws, '❌ AgentSpawner no disponible');
            }

            try {
                const regionId = msg.regionId || 'default';
                const worker = aiManager.workers.get(regionId);

                if (!worker) {
                    return sendError(ws, `❌ Worker no encontrado para región: ${regionId}`);
                }

                // Crear agente con parámetros custom
                const spawner = new AgentSpawner();
                const customParams = {
                    name: msg.name,
                    age: msg.age,
                    role: msg.role,
                    personality: msg.personality,
                    lifeStage: msg.lifeStage
                };

                const agent = spawner.createCustomAgent(regionId, customParams);

                // Registrar en worker
                worker.agentRegistry.add(agent);

                // Persistir en DB
                await aiManager.persistSnapshot([agent]);

                sendSuccess(ws, {
                    type: 'ai:agent_spawned',
                    data: {
                        agent,
                        regionId,
                        message: `✅ Agente "${agent.name}" spawneado exitosamente`
                    }
                });

                console.log(`🤖 [AI] Agente custom "${agent.name}" spawneado en región ${regionId} por ${playerId}`);
            } catch (error) {
                console.error('Error spawneando agente single:', error);
                sendError(ws, '❌ Error al spawnear agente: ' + error.message);
            }
        }),

        'ai:clear_agents': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            try {
                const regionId = msg.regionId || 'default';
                const worker = aiManager.workers.get(regionId);

                if (!worker) {
                    return sendError(ws, `❌ Worker no encontrado para región: ${regionId}`);
                }

                // Obtener agentes antes de limpiar
                const agents = worker.agentRegistry.getActiveAgents();
                const count = agents.length;

                // Limpiar registry
                agents.forEach(agent => {
                    worker.agentRegistry.remove(agent.id);
                });

                sendSuccess(ws, {
                    type: 'ai:agents_cleared',
                    data: {
                        count,
                        regionId,
                        message: `✅ ${count} agentes eliminados de región ${regionId}`
                    }
                });

                console.log(`🤖 [AI] ${count} agentes eliminados de región ${regionId} por ${playerId}`);
            } catch (error) {
                console.error('Error limpiando agentes:', error);
                sendError(ws, '❌ Error al limpiar agentes: ' + error.message);
            }
        }),

        'ai:get_agent': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            try {
                const { agentId, regionId } = msg;

                if (!agentId) {
                    return sendError(ws, '❌ Se requiere agentId');
                }

                const region = regionId || 'default';
                const worker = aiManager.workers.get(region);

                if (!worker) {
                    return sendError(ws, `❌ Worker no encontrado para región: ${region}`);
                }

                const agent = worker.agentRegistry.get(agentId);

                if (!agent) {
                    return sendError(ws, `❌ Agente no encontrado: ${agentId}`);
                }

                sendSuccess(ws, {
                    type: 'ai:agent_details',
                    data: agent
                });
            } catch (error) {
                console.error('Error obteniendo agente:', error);
                sendError(ws, '❌ Error al obtener agente: ' + error.message);
            }
        }),

        'ai:set_agent_need': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            try {
                const { agentId, need, value, regionId } = msg;

                if (!agentId || !need || value === undefined) {
                    return sendError(ws, '❌ Se requiere agentId, need y value');
                }

                if (value < 0 || value > 100) {
                    return sendError(ws, '❌ El valor debe estar entre 0 y 100');
                }

                const validNeeds = ['hunger', 'thirst', 'rest', 'social', 'safety'];
                if (!validNeeds.includes(need)) {
                    return sendError(ws, `❌ Need inválido. Válidos: ${validNeeds.join(', ')}`);
                }

                const region = regionId || 'default';
                const worker = aiManager.workers.get(region);

                if (!worker) {
                    return sendError(ws, `❌ Worker no encontrado para región: ${region}`);
                }

                const agent = worker.agentRegistry.get(agentId);

                if (!agent) {
                    return sendError(ws, `❌ Agente no encontrado: ${agentId}`);
                }

                // Modificar necesidad
                agent.needs[need] = value;

                sendSuccess(ws, {
                    type: 'ai:agent_need_updated',
                    data: {
                        agentId,
                        need,
                        value,
                        message: `✅ ${need} de ${agent.name} actualizado a ${value}`
                    }
                });

                // Broadcast evento
                aiManager.broadcast('agent:need_update', {
                    agentId,
                    need,
                    oldValue: agent.needs[need],
                    newValue: value,
                    timestamp: Date.now()
                });

                console.log(`🤖 [AI] ${need} de agente ${agent.name} ajustado a ${value} por ${playerId}`);
            } catch (error) {
                console.error('Error ajustando necesidad de agente:', error);
                sendError(ws, '❌ Error al ajustar necesidad: ' + error.message);
            }
        }),

        'ai:kill_agent': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            try {
                const { agentId, regionId } = msg;

                if (!agentId) {
                    return sendError(ws, '❌ Se requiere agentId');
                }

                const region = regionId || 'default';
                const worker = aiManager.workers.get(region);

                if (!worker) {
                    return sendError(ws, `❌ Worker no encontrado para región: ${region}`);
                }

                const agent = worker.agentRegistry.get(agentId);

                if (!agent) {
                    return sendError(ws, `❌ Agente no encontrado: ${agentId}`);
                }

                const agentName = agent.name;

                // Marcar como muerto
                agent.alive = false;

                // Remover del registry
                worker.agentRegistry.remove(agentId);

                sendSuccess(ws, {
                    type: 'ai:agent_killed',
                    data: {
                        agentId,
                        name: agentName,
                        regionId: region,
                        message: `✅ Agente "${agentName}" eliminado`
                    }
                });

                // Broadcast muerte
                aiManager.broadcast('agent:death', {
                    agentId,
                    name: agentName,
                    cause: 'admin_kill',
                    timestamp: Date.now()
                });

                console.log(`🤖 [AI] Agente "${agentName}" eliminado manualmente por ${playerId}`);
            } catch (error) {
                console.error('Error eliminando agente:', error);
                sendError(ws, '❌ Error al eliminar agente: ' + error.message);
            }
        }),

        'ai:set_relationship': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            try {
                const { agentId, targetId, relationship, regionId } = msg;

                if (!agentId || !targetId || !relationship) {
                    return sendError(ws, '❌ Se requiere agentId, targetId y relationship');
                }

                const validRelTypes = ['affection', 'trust', 'respect', 'sexualAttraction'];
                const invalidKeys = Object.keys(relationship).filter(k => !validRelTypes.includes(k));

                if (invalidKeys.length > 0) {
                    return sendError(ws, `❌ Tipos de relación inválidos: ${invalidKeys.join(', ')}. Válidos: ${validRelTypes.join(', ')}`);
                }

                // Validar valores 0-100
                for (const [key, value] of Object.entries(relationship)) {
                    if (value < 0 || value > 100) {
                        return sendError(ws, `❌ Valor de ${key} debe estar entre 0 y 100`);
                    }
                }

                const region = regionId || 'default';
                const worker = aiManager.workers.get(region);

                if (!worker) {
                    return sendError(ws, `❌ Worker no encontrado para región: ${region}`);
                }

                const agent = worker.agentRegistry.get(agentId);
                const target = worker.agentRegistry.get(targetId);

                if (!agent) {
                    return sendError(ws, `❌ Agente no encontrado: ${agentId}`);
                }

                if (!target) {
                    return sendError(ws, `❌ Agente objetivo no encontrado: ${targetId}`);
                }

                // Inicializar relación si no existe
                if (!agent.relationships[targetId]) {
                    agent.relationships[targetId] = {
                        affection: 50,
                        trust: 50,
                        respect: 50,
                        sexualAttraction: 10
                    };
                }

                // Actualizar valores
                Object.assign(agent.relationships[targetId], relationship);

                sendSuccess(ws, {
                    type: 'ai:relationship_updated',
                    data: {
                        agentId,
                        targetId,
                        agentName: agent.name,
                        targetName: target.name,
                        newValues: agent.relationships[targetId],
                        message: `✅ Relación entre ${agent.name} y ${target.name} actualizada`
                    }
                });

                // Broadcast actualización
                aiManager.broadcast('agent:relationship_update', {
                    agentId,
                    targetId,
                    relationship: agent.relationships[targetId],
                    timestamp: Date.now()
                });

                console.log(`🤖 [AI] Relación entre "${agent.name}" y "${target.name}" modificada por ${playerId}`);
            } catch (error) {
                console.error('Error modificando relación:', error);
                sendError(ws, '❌ Error al modificar relación: ' + error.message);
            }
        }),

        'ai:reset': createHandler(async (msg, ws, playerId) => {
            if (!aiManager) {
                return sendError(ws, '❌ Sistema de IA no disponible');
            }

            try {
                // Detener sistema si está activo
                if (aiManager.enabled) {
                    aiManager.stop();
                }

                // Limpiar todos los workers
                let totalAgents = 0;
                for (const worker of aiManager.workers.values()) {
                    const agents = worker.agentRegistry.getActiveAgents();
                    totalAgents += agents.length;

                    agents.forEach(agent => {
                        worker.agentRegistry.remove(agent.id);
                    });
                }

                // Reinicializar
                await aiManager.initialize();

                sendSuccess(ws, {
                    type: 'ai:reset_complete',
                    data: {
                        agentsCleared: totalAgents,
                        message: `✅ Sistema reseteado: ${totalAgents} agentes eliminados`
                    }
                });

                // Broadcast reset global
                aiManager.broadcast('ai:system_reset', {
                    timestamp: Date.now(),
                    triggeredBy: playerId
                });

                console.log(`🤖 [AI] Sistema reseteado completamente por ${playerId} (${totalAgents} agentes eliminados)`);
            } catch (error) {
                console.error('Error reseteando sistema:', error);
                sendError(ws, '❌ Error al resetear sistema: ' + error.message);
            }
        })
    };
}
