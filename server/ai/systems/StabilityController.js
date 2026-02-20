// ============================================================================
// STABILITY CONTROLLER - Topes híbridos para emergencia controlada
// ============================================================================

class StabilityController {
    constructor(config = {}) {
        this.config = {
            // Population limits
            maxPopulationPerRegion: config.maxPopulationPerRegion || 100,
            maxAgentsPerTick: config.maxAgentsPerTick || 50,

            // Violence dampeners
            maxViolenceIndex: config.maxViolenceIndex || 70,
            guardSpawnThreshold: config.guardSpawnThreshold || 75,

            // Economy dampeners
            maxInflationRate: config.maxInflationRate || 2.0,
            supplyInjectionThreshold: config.supplyInjectionThreshold || 1.5,

            // Sanity controls
            minAvgSanity: config.minAvgSanity || 30,
            sanityRestorationBonus: config.sanityRestorationBonus || 5,

            // Reproduction limits
            maxBirthsPerDay: config.maxBirthsPerDay || 5,
            minPopulationForReproduction: config.minPopulationForReproduction || 10
        };

        this.metrics = {
            ticksProcessed: 0,
            agentsSampled: 0,
            populationCaps: 0,
            violenceInterventions: 0,
            economyInjections: 0,
            sanityRestorations: 0
        };

        this.birthsToday = 0;
        this.lastDayReset = Date.now();
    }

    /**
     * Muestrear agentes para procesar este tick (evitar overhead)
     */
    sampleAgents(agents) {
        const active = agents.filter(a => a.alive);

        // Si hay pocos, procesar todos
        if (active.length <= this.config.maxAgentsPerTick) {
            this.metrics.agentsSampled += active.length;
            return active;
        }

        // Sampling: priorizar agentes con necesidades altas
        const sorted = active.sort((a, b) => {
            const urgencyA = this.calculateUrgency(a);
            const urgencyB = this.calculateUrgency(b);
            return urgencyB - urgencyA;
        });

        // Top 50% prioritarios + 50% aleatorios (para emergencia)
        const priority = sorted.slice(0, Math.floor(this.config.maxAgentsPerTick / 2));
        const random = this.shuffle(sorted).slice(0, Math.ceil(this.config.maxAgentsPerTick / 2));

        const sampled = [...new Set([...priority, ...random])];
        this.metrics.agentsSampled += sampled.length;

        return sampled;
    }

    /**
     * Calcular urgencia de un agente (para priorización)
     */
    calculateUrgency(agent) {
        let urgency = 0;

        // Necesidades críticas
        if (agent.needs.hunger > 80) urgency += 10;
        if (agent.needs.safety > 80) urgency += 8;
        if (agent.needs.social > 80) urgency += 3;

        // Sanidad baja
        if (agent.stats.sanity < 30) urgency += 7;

        // Celos peligrosos
        for (const rel of Object.values(agent.relationships)) {
            if (rel.jealousy > 80 && agent.personality.aggression > 70) {
                urgency += 15;
            }
        }

        return urgency;
    }

    /**
     * Aplicar límites globales después de cada tick
     */
    applyGlobalLimits(agents, region) {
        this.limitPopulation(agents, region);
        this.limitViolence(agents, region);
        this.limitEconomy(agents, region);
        this.restoreSanity(agents, region);

        this.metrics.ticksProcessed++;
    }

    /**
     * Limitar población por región
     */
    limitPopulation(agents, region) {
        const livingAgents = agents.filter(a => a.alive);

        if (livingAgents.length > this.config.maxPopulationPerRegion) {
            this.metrics.populationCaps++;

            // Forzar migración de agentes sin vínculos fuertes
            const migrants = this.selectMigrants(livingAgents, 10);

            console.log(`[StabilityController] Population cap reached (${livingAgents.length}/${this.config.maxPopulationPerRegion}). Forcing ${migrants.length} migrations.`);

            // TODO: Notify RegionWorker to transfer agents to adjacent regions
            // worker.migrateAgents(migrants, targetRegion)
        }
    }

    /**
     * Seleccionar agentes para migración (sin vínculos fuertes)
     */
    selectMigrants(agents, count) {
        return agents
            .sort((a, b) => {
                const bondsA = this.countStrongBonds(a);
                const bondsB = this.countStrongBonds(b);
                return bondsA - bondsB; // Menos vínculos = más probable migración
            })
            .slice(0, count);
    }

    /**
     * Contar vínculos fuertes de un agente
     */
    countStrongBonds(agent) {
        let count = 0;
        for (const rel of Object.values(agent.relationships)) {
            if (rel.affection > 60 || rel.dependency > 60) {
                count++;
            }
        }
        return count;
    }

    /**
     * Limitar violencia en región
     */
    limitViolence(agents, region) {
        const violenceIndex = this.getRegionViolenceIndex(agents);

        if (violenceIndex > this.config.maxViolenceIndex) {
            this.metrics.violenceInterventions++;

            console.log(`[StabilityController] Violence index high (${violenceIndex.toFixed(1)}). Applying dampeners.`);

            // Dampener 1: Reducir aggression temporalmente
            for (const agent of agents) {
                if (agent.personality.aggression > 70) {
                    agent.personality.aggression = Math.max(50, agent.personality.aggression - 10);
                }
            }

            // Dampener 2: Spawn guardias NPC si es crítico
            if (violenceIndex > this.config.guardSpawnThreshold) {
                console.log(`[StabilityController] Critical violence. Spawning guards.`);
                // TODO: worker.spawnGuards(region)
            }
        }
    }

    /**
     * Calcular índice de violencia regional
     */
    getRegionViolenceIndex(agents) {
        let totalAggression = 0;
        let totalResentment = 0;
        let count = 0;

        for (const agent of agents) {
            if (!agent.alive) continue;

            totalAggression += agent.personality.aggression;

            for (const rel of Object.values(agent.relationships)) {
                totalResentment += rel.resentment;
            }

            count++;
        }

        if (count === 0) return 0;

        const avgAggression = totalAggression / count;
        const avgResentment = totalResentment / (count * Math.max(1, Object.keys(agents[0]?.relationships || {}).length));

        return (avgAggression * 0.6 + avgResentment * 0.4);
    }

    /**
     * Limitar economía (futuro)
     */
    limitEconomy(agents, region) {
        // TODO: Integration with EconomyManager
        // Check inflation rate, inject supplies if needed
    }

    /**
     * Restaurar sanidad si promedio es muy bajo
     */
    restoreSanity(agents, region) {
        const livingAgents = agents.filter(a => a.alive);
        if (livingAgents.length === 0) return;

        const avgSanity = livingAgents.reduce((sum, a) => sum + a.stats.sanity, 0) / livingAgents.length;

        if (avgSanity < this.config.minAvgSanity) {
            this.metrics.sanityRestorations++;

            console.log(`[StabilityController] Low avg sanity (${avgSanity.toFixed(1)}). Applying restoration bonus.`);

            for (const agent of livingAgents) {
                agent.stats.sanity = Math.min(100, agent.stats.sanity + this.config.sanityRestorationBonus);
            }
        }
    }

    /**
     * Check si se puede reproducir (límite de nacimientos por día)
     */
    canReproduce() {
        // Reset counter si pasó un día
        const now = Date.now();
        const daysSinceReset = (now - this.lastDayReset) / (1000 * 60 * 60 * 24);

        if (daysSinceReset >= 1) {
            this.birthsToday = 0;
            this.lastDayReset = now;
        }

        return this.birthsToday < this.config.maxBirthsPerDay;
    }

    /**
     * Registrar nacimiento
     */
    registerBirth() {
        this.birthsToday++;
    }

    /**
     * Shuffle array (Fisher-Yates)
     */
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Obtener métricas
     */
    getMetrics() {
        return {
            ...this.metrics,
            birthsToday: this.birthsToday,
            config: this.config
        };
    }
}

export default StabilityController;
