/**
 * Sistema de Generación de Misiones Dinámicas
 * Genera misiones basadas en el estado actual del mundo
 */

class MissionGenerator {
    constructor() {
        this.missionTypes = {
            RESOURCE_SHORTAGE: 'resource_shortage',
            ZOMBIE_THREAT: 'zombie_threat',
            NPC_HELP: 'npc_help',
            EXPLORATION: 'exploration',
            CONSTRUCTION: 'construction',
            TRADE: 'trade',
            DEFENSE: 'defense'
        };

        this.priorities = {
            URGENT: 'urgent',      // 1 hora límite, rojo
            NORMAL: 'normal',      // 24 horas, amarillo
            OPTIONAL: 'optional'   // Sin límite, verde
        };

        this.activeMissions = new Map();
        this.completedMissions = new Map();
        this.missionIdCounter = 1;
    }

    /**
     * Analiza el estado del mundo y genera misiones relevantes
     */
    generateMissions(world) {
        const missions = [];

        // 1. Verificar escasez de recursos en refugio
        const resourceMissions = this.checkResourceShortage(world);
        missions.push(...resourceMissions);

        // 2. Verificar amenazas de zombies
        const zombieMissions = this.checkZombieThreat(world);
        missions.push(...zombieMissions);

        // 3. Verificar NPCs que necesitan ayuda
        const npcMissions = this.checkNPCNeeds(world);
        missions.push(...npcMissions);

        // 4. Generar misiones de exploración
        const explorationMissions = this.generateExplorationMissions(world);
        missions.push(...explorationMissions);

        // 5. Misiones de construcción/mejora
        const constructionMissions = this.generateConstructionMissions(world);
        missions.push(...constructionMissions);

        return missions;
    }

    /**
     * Verifica si hay escasez de recursos y genera misiones
     */
    checkResourceShortage(world) {
        const missions = [];
        const refugio = world.locations?.refugio;

        if (!refugio || !refugio.recursos) return missions;

        const thresholds = {
            comida: { critical: 50, low: 100 },
            agua: { critical: 30, low: 60 },
            madera: { critical: 20, low: 50 },
            metal: { critical: 10, low: 30 }
        };

        for (const [resource, amount] of Object.entries(refugio.recursos)) {
            const threshold = thresholds[resource];
            if (!threshold) continue;

            let priority, timeLimit, reward;

            if (amount < threshold.critical) {
                // Crítico: misión urgente
                priority = this.priorities.URGENT;
                timeLimit = 1 * 60 * 60 * 1000; // 1 hora
                reward = { xp: 200, tokens: 50 };

                missions.push({
                    id: `shortage_${resource}_${this.missionIdCounter++}`,
                    type: this.missionTypes.RESOURCE_SHORTAGE,
                    title: `¡URGENTE! Escasez de ${resource}`,
                    description: `El refugio está en crisis. Necesitamos ${threshold.critical * 2} de ${resource} AHORA o habrá consecuencias graves.`,
                    icon: this.getResourceIcon(resource),
                    priority,
                    timeLimit,
                    expiresAt: Date.now() + timeLimit,
                    objectives: {
                        collect: { [resource]: threshold.critical * 2 },
                        deliver: 'refugio'
                    },
                    reward,
                    progress: 0,
                    participants: [],
                    created: Date.now()
                });

            } else if (amount < threshold.low) {
                // Bajo: misión normal
                priority = this.priorities.NORMAL;
                timeLimit = 24 * 60 * 60 * 1000; // 24 horas
                reward = { xp: 100, tokens: 25 };

                missions.push({
                    id: `shortage_${resource}_${this.missionIdCounter++}`,
                    type: this.missionTypes.RESOURCE_SHORTAGE,
                    title: `Recolectar ${resource}`,
                    description: `Las reservas de ${resource} están bajas. El refugio necesita ${threshold.low} para estar preparado.`,
                    icon: this.getResourceIcon(resource),
                    priority,
                    timeLimit,
                    expiresAt: Date.now() + timeLimit,
                    objectives: {
                        collect: { [resource]: threshold.low },
                        deliver: 'refugio'
                    },
                    reward,
                    progress: 0,
                    participants: [],
                    created: Date.now()
                });
            }
        }

        return missions;
    }

    /**
     * Verifica amenazas de zombies y genera misiones
     */
    checkZombieThreat(world) {
        const missions = [];

        if (!world.locations) return missions;

        for (const [locationId, location] of Object.entries(world.locations)) {
            const zombieCount = location.zombies || 0;

            if (zombieCount > 20) {
                // Infestación grave
                missions.push({
                    id: `zombies_${locationId}_${this.missionIdCounter++}`,
                    type: this.missionTypes.ZOMBIE_THREAT,
                    title: `¡Infestación en ${location.nombre}!`,
                    description: `${location.nombre} está sobrepasada por zombies (${zombieCount}). Necesitamos un equipo de limpieza urgente.`,
                    icon: '🧟',
                    priority: this.priorities.URGENT,
                    timeLimit: 2 * 60 * 60 * 1000, // 2 horas
                    expiresAt: Date.now() + (2 * 60 * 60 * 1000),
                    objectives: {
                        kill_zombies: 15,
                        location: locationId
                    },
                    reward: {
                        xp: 300,
                        tokens: 75,
                        items: { 'munición': 20 }
                    },
                    progress: 0,
                    participants: [],
                    created: Date.now()
                });

            } else if (zombieCount > 10) {
                // Amenaza moderada
                missions.push({
                    id: `zombies_${locationId}_${this.missionIdCounter++}`,
                    type: this.missionTypes.ZOMBIE_THREAT,
                    title: `Limpiar ${location.nombre}`,
                    description: `Hay ${zombieCount} zombies en ${location.nombre}. Sería bueno reducir su número.`,
                    icon: '⚔️',
                    priority: this.priorities.NORMAL,
                    timeLimit: 12 * 60 * 60 * 1000, // 12 horas
                    expiresAt: Date.now() + (12 * 60 * 60 * 1000),
                    objectives: {
                        kill_zombies: 8,
                        location: locationId
                    },
                    reward: {
                        xp: 150,
                        tokens: 40
                    },
                    progress: 0,
                    participants: [],
                    created: Date.now()
                });
            }
        }

        return missions;
    }

    /**
     * Verifica si NPCs necesitan ayuda
     */
    checkNPCNeeds(world) {
        const missions = [];

        if (!world.npcs) return missions;

        for (const npc of Object.values(world.npcs)) {
            // NPC con poca salud necesita medicina
            if (npc.salud < 30) {
                missions.push({
                    id: `help_${npc.id}_health_${this.missionIdCounter++}`,
                    type: this.missionTypes.NPC_HELP,
                    title: `Ayudar a ${npc.nombre}`,
                    description: `${npc.nombre} está herido/a y necesita medicina urgentemente.`,
                    icon: '🏥',
                    priority: this.priorities.URGENT,
                    timeLimit: 30 * 60 * 1000, // 30 minutos
                    expiresAt: Date.now() + (30 * 60 * 1000),
                    objectives: {
                        give_items: { 'medicina': 2 },
                        to_npc: npc.id
                    },
                    reward: {
                        xp: 100,
                        tokens: 20,
                        relation_boost: { [npc.id]: 15 }
                    },
                    progress: 0,
                    participants: [],
                    created: Date.now()
                });
            }

            // NPC con baja relación con todos los jugadores
            const avgRelation = this.calculateAverageRelation(npc, world.players);
            if (avgRelation < 20) {
                missions.push({
                    id: `help_${npc.id}_relation_${this.missionIdCounter++}`,
                    type: this.missionTypes.NPC_HELP,
                    title: `Ganarse la confianza de ${npc.nombre}`,
                    description: `${npc.nombre} se siente aislado/a. Hablar con él/ella y darle un regalo podría ayudar.`,
                    icon: '🎁',
                    priority: this.priorities.OPTIONAL,
                    timeLimit: null,
                    expiresAt: null,
                    objectives: {
                        talk_to: npc.id,
                        give_gift: true
                    },
                    reward: {
                        xp: 80,
                        relation_boost: { [npc.id]: 20 }
                    },
                    progress: 0,
                    participants: [],
                    created: Date.now()
                });
            }
        }

        return missions;
    }

    /**
     * Genera misiones de exploración
     */
    generateExplorationMissions(world) {
        const missions = [];

        if (!world.locations) return missions;

        // Encontrar locaciones poco visitadas
        const visitCounts = {};
        if (world.players) {
            for (const player of Object.values(world.players)) {
                if (player.locaciones_visitadas_detalle) {
                    for (const [loc, count] of Object.entries(player.locaciones_visitadas_detalle)) {
                        visitCounts[loc] = (visitCounts[loc] || 0) + count;
                    }
                }
            }
        }

        const unexplored = Object.keys(world.locations).filter(loc =>
            (visitCounts[loc] || 0) < 3
        );

        if (unexplored.length > 0) {
            const randomLoc = unexplored[Math.floor(Math.random() * unexplored.length)];
            const location = world.locations[randomLoc];

            missions.push({
                id: `explore_${randomLoc}_${this.missionIdCounter++}`,
                type: this.missionTypes.EXPLORATION,
                title: `Explorar ${location.nombre}`,
                description: `${location.nombre} es un área poco explorada. Puede haber recursos valiosos o información importante.`,
                icon: '🗺️',
                priority: this.priorities.OPTIONAL,
                timeLimit: null,
                expiresAt: null,
                objectives: {
                    visit: randomLoc,
                    scavenge: true
                },
                reward: {
                    xp: 120,
                    tokens: 30
                },
                progress: 0,
                participants: [],
                created: Date.now()
            });
        }

        return missions;
    }

    /**
     * Genera misiones de construcción
     */
    generateConstructionMissions(world) {
        const missions = [];

        // Misión para construir muros defensivos
        if (!world.structures || !world.structures.muros) {
            missions.push({
                id: `construct_walls_${this.missionIdCounter++}`,
                type: this.missionTypes.CONSTRUCTION,
                title: 'Construir Muros Defensivos',
                description: 'El refugio necesita muros para protegerse de hordas. Requiere esfuerzo comunitario.',
                icon: '🏗️',
                priority: this.priorities.NORMAL,
                timeLimit: 48 * 60 * 60 * 1000, // 48 horas
                expiresAt: Date.now() + (48 * 60 * 60 * 1000),
                objectives: {
                    contribute_resources: {
                        madera: 300,
                        metal: 200
                    },
                    collective: true
                },
                reward: {
                    xp: 250,
                    tokens: 100,
                    collective_bonus: '+10% defensa para todos'
                },
                progress: 0,
                contributions: {},
                participants: [],
                created: Date.now()
            });
        }

        return missions;
    }

    /**
     * Registra progreso de una misión
     */
    updateMissionProgress(missionId, playerId, progress) {
        const mission = this.activeMissions.get(missionId);
        if (!mission) return null;

        // Agregar jugador a participantes si no está
        if (!mission.participants.includes(playerId)) {
            mission.participants.push(playerId);
        }

        // Actualizar progreso
        if (typeof progress === 'number') {
            mission.progress = Math.min(100, mission.progress + progress);
        } else if (typeof progress === 'object') {
            // Para objetivos complejos
            mission.progressDetail = mission.progressDetail || {};
            Object.assign(mission.progressDetail, progress);
        }

        // Verificar si se completó
        if (mission.progress >= 100 || this.checkObjectivesComplete(mission)) {
            return this.completeMission(missionId);
        }

        return mission;
    }

    /**
     * Completa una misión y distribuye recompensas
     */
    completeMission(missionId) {
        const mission = this.activeMissions.get(missionId);
        if (!mission) return null;

        mission.completedAt = Date.now();
        mission.status = 'completed';

        // Mover a completadas
        this.activeMissions.delete(missionId);
        this.completedMissions.set(missionId, mission);

        // Calcular recompensas por participante
        const rewardPerPlayer = this.calculateRewards(mission);

        return {
            mission,
            rewards: rewardPerPlayer
        };
    }

    /**
     * Verifica si una misión expiró
     */
    checkExpiredMissions() {
        const now = Date.now();
        const expired = [];

        for (const [missionId, mission] of this.activeMissions.entries()) {
            if (mission.expiresAt && now > mission.expiresAt) {
                mission.status = 'expired';
                mission.expiredAt = now;

                this.activeMissions.delete(missionId);
                this.completedMissions.set(missionId, mission);

                expired.push(mission);
            }
        }

        return expired;
    }

    /**
     * Obtiene misiones activas por prioridad
     */
    getMissionsByPriority(priority) {
        const missions = [];

        for (const mission of this.activeMissions.values()) {
            if (mission.priority === priority) {
                missions.push(mission);
            }
        }

        return missions;
    }

    /**
     * Obtiene todas las misiones activas
     */
    getActiveMissions() {
        return Array.from(this.activeMissions.values());
    }

    /**
     * Agrega una misión al sistema
     */
    addMission(mission) {
        this.activeMissions.set(mission.id, mission);
        return mission;
    }

    // ===== HELPERS =====

    getResourceIcon(resource) {
        const icons = {
            comida: '🍖',
            agua: '💧',
            madera: '🪵',
            metal: '⚙️',
            medicina: '💊'
        };
        return icons[resource] || '📦';
    }

    calculateAverageRelation(npc, players) {
        if (!players || Object.keys(players).length === 0) return 0;

        let total = 0;
        let count = 0;

        for (const player of Object.values(players)) {
            if (player.relaciones && player.relaciones[npc.id] !== undefined) {
                total += player.relaciones[npc.id];
                count++;
            }
        }

        return count > 0 ? total / count : 0;
    }

    checkObjectivesComplete(mission) {
        // Lógica específica según tipo de misión
        // Por ahora, usar el progreso simple
        return mission.progress >= 100;
    }

    calculateRewards(mission) {
        const baseReward = mission.reward;
        const participantCount = mission.participants.length;

        if (participantCount === 0) return {};

        // Dividir recompensas entre participantes
        const rewards = {};

        mission.participants.forEach(playerId => {
            rewards[playerId] = {
                xp: Math.floor((baseReward.xp || 0) / participantCount),
                tokens: Math.floor((baseReward.tokens || 0) / participantCount),
                items: baseReward.items || {},
                relation_boost: baseReward.relation_boost || {}
            };
        });

        return rewards;
    }

    /**
     * Limpia misiones completadas antiguas (más de 24 horas)
     */
    cleanupOldMissions() {
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        for (const [missionId, mission] of this.completedMissions.entries()) {
            if (mission.completedAt < oneDayAgo) {
                this.completedMissions.delete(missionId);
            }
        }
    }
}

export default MissionGenerator;
