// ============================================================================
// AGENT REGISTRY - Gestión de agentes activos en memoria
// ============================================================================

class AgentRegistry {
    constructor(worker) {
        this.worker = worker;
        this.agents = new Map(); // id -> agent
    }

    /**
     * Agregar agente
     */
    add(agent) {
        this.agents.set(agent.id, agent);
    }

    /**
     * Obtener agente por ID
     */
    get(agentId) {
        return this.agents.get(agentId);
    }

    /**
     * Remover agente
     */
    remove(agentId) {
        return this.agents.delete(agentId);
    }

    /**
     * Obtener todos los agentes activos
     */
    getActiveAgents() {
        return Array.from(this.agents.values()).filter(a => a.alive);
    }

    /**
     * Obtener agentes en un nodo específico
     */
    getAgentsInNode(nodeId) {
        return this.getActiveAgents().filter(a => a.nodeId === nodeId);
    }

    /**
     * Obtener agentes cercanos (mismo nodo o adyacentes)
     */
    getNearbyAgents(agent) {
        // Por ahora solo mismo nodo
        return this.getAgentsInNode(agent.nodeId).filter(a => a.id !== agent.id);
    }

    /**
     * Buscar pareja potencial
     */
    findPotentialPartners(agent) {
        return this.getNearbyAgents(agent).filter(other => {
            if (other.lifeStage !== 'adult') return false;

            const rel = agent.relationships[other.id];
            if (!rel) return false;

            return rel.affection > 60 && rel.sexualAttraction > 50;
        });
    }

    /**
     * Estadísticas
     */
    getStats() {
        const agents = this.getActiveAgents();
        return {
            total: agents.length,
            byLifeStage: {
                child: agents.filter(a => a.lifeStage === 'child').length,
                teen: agents.filter(a => a.lifeStage === 'teen').length,
                adult: agents.filter(a => a.lifeStage === 'adult').length,
                elder: agents.filter(a => a.lifeStage === 'elder').length
            },
            avgSanity: agents.reduce((sum, a) => sum + a.stats.sanity, 0) / agents.length
        };
    }
}

export default AgentRegistry;
