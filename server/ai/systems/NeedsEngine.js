// ============================================================================
// NEEDS ENGINE - Sistema de necesidades dinámicas
// ============================================================================

class NeedsEngine {
    constructor(worker) {
        this.worker = worker;

        // Factores de decay por segundo
        this.decayRates = {
            hunger: 0.5,      // Aumenta 0.5 por segundo
            safety: 0.2,      // Disminuye 0.2 por segundo
            social: 0.3,      // Disminuye 0.3 por segundo
            romance: 0.1,     // Disminuye 0.1 por segundo
            wealth: 0.05,     // Disminuye 0.05 por segundo
            purpose: 0.15     // Disminuye 0.15 por segundo
        };
    }

    /**
     * Actualizar necesidades de un agente
     */
    update(agent) {
        const dt = (this.worker.config.tickInterval || 2000) / 1000; // segundos

        // HUNGER - Siempre aumenta
        agent.needs.hunger = this.clamp(
            agent.needs.hunger + this.decayRates.hunger * dt,
            0,
            100
        );

        // SAFETY - Disminuye por peligro
        const dangerLevel = this.assessDanger(agent);
        agent.needs.safety = this.clamp(
            agent.needs.safety - (this.decayRates.safety + dangerLevel) * dt,
            0,
            100
        );

        // SOCIAL - Disminuye por aislamiento
        const isolation = this.assessIsolation(agent);
        agent.needs.social = this.clamp(
            agent.needs.social + (this.decayRates.social + isolation) * dt,
            0,
            100
        );

        // ROMANCE - Disminuye naturalmente
        if (agent.lifeStage === 'adult') {
            agent.needs.romance = this.clamp(
                agent.needs.romance + this.decayRates.romance * dt,
                0,
                100
            );
        }

        // WEALTH - Disminuye lentamente
        agent.needs.wealth = this.clamp(
            agent.needs.wealth + this.decayRates.wealth * dt,
            0,
            100
        );

        // PURPOSE - Disminuye sin metas
        agent.needs.purpose = this.clamp(
            agent.needs.purpose + this.decayRates.purpose * dt,
            0,
            100
        );

        // SANITY - Afectada por necesidades extremas
        this.updateSanity(agent);

        // AGING
        this.updateAge(agent);
    }

    /**
     * Evaluar nivel de peligro en el entorno
     */
    assessDanger(agent) {
        // TODO: Check for zombies, hostile agents, events
        const nearbyAgents = this.worker.agentRegistry.getNearbyAgents(agent);
        const hostileCount = nearbyAgents.filter(other => {
            const rel = other.relationships[agent.id];
            return rel && rel.resentment > 70;
        }).length;

        return hostileCount * 5; // +5 danger per hostile
    }

    /**
     * Evaluar nivel de aislamiento
     */
    assessIsolation(agent) {
        const nearbyAgents = this.worker.agentRegistry.getNearbyAgents(agent);

        if (nearbyAgents.length === 0) {
            return agent.personality.loneliness * 0.5;
        }

        return 0;
    }

    /**
     * Actualizar sanidad mental
     */
    updateSanity(agent) {
        let sanityDelta = 0;

        // Necesidades extremas afectan sanidad
        if (agent.needs.hunger > 80) sanityDelta -= 0.5;
        if (agent.needs.safety > 80) sanityDelta -= 1.0;
        if (agent.needs.social > 80) sanityDelta -= 0.3;

        // Paranoia aumenta perdida
        if (agent.personality.paranoia > 70) {
            sanityDelta -= 0.2;
        }

        // Noche aumenta decay
        const hour = new Date().getHours();
        if (hour >= 22 || hour <= 5) {
            sanityDelta -= 0.5;

            // Insomnia intensifica
            if (agent.traumaProfile.insomnia > 50) {
                sanityDelta -= 0.5;
            }
        }

        agent.stats.sanity = this.clamp(agent.stats.sanity + sanityDelta, 0, 100);

        // Trauma por baja sanidad
        if (agent.stats.sanity < 30) {
            agent.traumaProfile.hallucinationTendency += 0.5;
            agent.personality.paranoia += 0.5;
        }
    }

    /**
     * Actualizar edad y etapa de vida
     */
    updateAge(agent) {
        const ageInSeconds = (Date.now() - agent.birthTimestamp) / 1000;
        const ageInGameYears = ageInSeconds / (60 * 60 * 24); // 1 día real = 1 año juego

        agent.age = Math.floor(ageInGameYears);

        // Update life stage
        if (agent.age < 12) {
            agent.lifeStage = 'child';
        } else if (agent.age < 18) {
            agent.lifeStage = 'teen';
        } else if (agent.age < 60) {
            agent.lifeStage = 'adult';
        } else {
            agent.lifeStage = 'elder';
        }

        // Death by old age
        if (agent.age > 80 && Math.random() < 0.001) {
            agent.alive = false;
            this.worker.publish('agent:death', { agentId: agent.id, cause: 'old_age' });
        }
    }

    /**
     * Obtener prioridad de necesidad más urgente
     */
    getHighestNeed(agent) {
        const needs = agent.needs;
        let highest = { name: null, value: -1 };

        for (const [name, value] of Object.entries(needs)) {
            if (value > highest.value) {
                highest = { name, value };
            }
        }

        return highest;
    }

    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
}

export default NeedsEngine;
