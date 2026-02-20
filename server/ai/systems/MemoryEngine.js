// ============================================================================
// MEMORY ENGINE - Gestión de memoria episódica de agentes
// ============================================================================

class MemoryEngine {
    constructor(worker) {
        this.worker = worker;
        this.maxMemoriesPerAgent = 100;
    }

    /**
     * Almacenar interacción en memoria
     */
    storeInteraction(agent, target, interactionType) {
        if (!agent.memory) {
            agent.memory = { events: [] };
        }

        const memory = {
            type: 'interaction',
            actor: target.id,
            actorName: target.name,
            interactionType,
            timestamp: Date.now(),
            emotionalImpact: this.calculateEmotionalImpact(interactionType),
            decay: 1.0 // 1 = fresh, 0 = forgotten
        };

        agent.memory.events.push(memory);

        // Prune old memories
        if (agent.memory.events.length > this.maxMemoriesPerAgent) {
            this.pruneMemories(agent);
        }
    }

    /**
     * Almacenar evento importante
     */
    storeEvent(agent, eventType, details) {
        if (!agent.memory) {
            agent.memory = { events: [] };
        }

        const memory = {
            type: eventType, // 'violence', 'romance', 'loss', 'achievement'
            details,
            timestamp: Date.now(),
            emotionalImpact: details.emotionalImpact || 0,
            decay: 1.0
        };

        agent.memory.events.push(memory);
    }

    /**
     * Obtener memorias recientes
     */
    getRecentMemories(agent, limit = 5) {
        if (!agent.memory) return [];

        return agent.memory.events
            .filter(m => m.decay > 0.3) // Solo memorias no muy olvidadas
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Obtener resumen de memoria para LLM
     */
    getMemorySummary(agent, limit = 3) {
        const memories = this.getRecentMemories(agent, limit);

        return memories.map(m => {
            if (m.type === 'interaction') {
                return `${m.interactionType} with ${m.actorName}`;
            }
            return `${m.type}: ${m.details}`;
        }).join(', ');
    }

    /**
     * Podar memorias antiguas (forgetting curve)
     */
    pruneMemories(agent) {
        if (!agent.memory) return;

        // Decay all memories
        for (const memory of agent.memory.events) {
            const ageInDays = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);

            // Exponential decay: decay = e^(-age/10)
            memory.decay = Math.exp(-ageInDays / 10);
        }

        // Remove forgotten memories (decay < 0.1)
        agent.memory.events = agent.memory.events
            .filter(m => m.decay > 0.1)
            .sort((a, b) => b.emotionalImpact - a.emotionalImpact) // Keep emotionally impactful
            .slice(0, this.maxMemoriesPerAgent);
    }

    /**
     * Calcular impacto emocional
     */
    calculateEmotionalImpact(interactionType) {
        const impacts = {
            'socialized': 5,
            'helped': 15,
            'betrayed': -40,
            'intimacy': 25,
            'conflict': -20,
            'violence': -30,
            'loss': -50,
            'achievement': 20
        };

        return impacts[interactionType] || 0;
    }

    /**
     * Check if agent remembers another agent
     */
    remembers(agent, targetId) {
        if (!agent.memory) return false;

        return agent.memory.events.some(m =>
            m.actor === targetId && m.decay > 0.3
        );
    }
}

export default MemoryEngine;

