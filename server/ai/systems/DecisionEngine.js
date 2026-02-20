// ============================================================================
// DECISION ENGINE - Motor de decisiones basado en necesidades y personalidad
// ============================================================================

const ACTION_WEIGHTS = {
    MOVE: { safety: 0.3, hunger: 0.2, social: 0.1 },
    SCAVENGE: { hunger: 0.8, safety: 0.2, wealth: 0.5 },
    TRADE: { wealth: 0.7, social: 0.3 },
    SOCIALIZE: { social: 0.9, romance: 0.3, purpose: 0.2 },
    ROMANCE: { romance: 0.9, social: 0.4 },
    ATTACK: { aggression: 1.0, safety: -0.5 },
    HIDE: { safety: 1.0, social: -0.3 },
    REST: { hunger: -0.2, stamina: 0.8 },
    INVESTIGATE: { purpose: 0.6, social: 0.2 }
};

const MIN_ACTION_SCORE = 10;

class DecisionEngine {
    constructor(worker) {
        this.worker = worker;
    }

    /**
     * Decidir acción para un agente
     */
    decide(agent) {
        // Check cooldown
        if (this.isOnCooldown(agent)) {
            return null;
        }

        // Get possible actions
        const candidateActions = this.getPossibleActions(agent);

        if (candidateActions.length === 0) {
            return { type: 'REST', reason: 'no actions available' };
        }

        // Score each action
        let bestScore = -Infinity;
        let bestAction = null;
        const scores = [];

        for (const action of candidateActions) {
            const score = this.computeScore(agent, action);
            scores.push({ action: action.type, score });

            if (score > bestScore) {
                bestScore = score;
                bestAction = action;
            }
        }

        // Log decision for debug
        if (bestAction && bestScore > MIN_ACTION_SCORE) {
            // console.log(`[Agent ${agent.name}] Decision: ${bestAction.type} (score: ${bestScore.toFixed(1)})`);
        }

        // If score too low, idle
        if (bestScore < MIN_ACTION_SCORE) {
            return null;
        }

        return bestAction;
    }

    /**
     * Computar score de una acción
     */
    computeScore(agent, action) {
        let score = 0;

        const weights = ACTION_WEIGHTS[action.type] || {};

        // 1️⃣ NEEDS-BASED SCORING
        for (const [need, weight] of Object.entries(weights)) {
            if (agent.needs[need] !== undefined) {
                score += weight * agent.needs[need];
            }
        }

        // 2️⃣ PERSONALITY MODIFIERS
        score *= this.getPersonalityModifier(agent, action);

        // 3️⃣ RISK EVALUATION
        const risk = this.estimateRisk(agent, action);
        score *= (1 - risk * agent.personality.riskAversion / 100);

        // 4️⃣ RANDOM FACTOR (curiosity)
        score += (Math.random() - 0.5) * 5;

        // 5️⃣ PENALTIES
        if (this.globalCapReached(action)) {
            score -= 1000;
        }

        return score;
    }

    /**
     * Obtener acciones posibles para un agente
     */
    getPossibleActions(agent) {
        const actions = [];
        const nearbyAgents = this.worker.agentRegistry.getNearbyAgents(agent);

        // MOVE - Siempre posible
        actions.push({ type: 'MOVE', targetNodeId: this.getRandomAdjacentNode(agent) });

        // SCAVENGE - Si hay recursos
        if (agent.nodeId) {
            actions.push({ type: 'SCAVENGE' });
        }

        // TRADE - Si hay comerciantes
        if (nearbyAgents.some(a => a.profession === 'merchant')) {
            actions.push({ type: 'TRADE', targetId: nearbyAgents.find(a => a.profession === 'merchant').id });
        }

        // SOCIALIZE - Si hay otros agentes
        if (nearbyAgents.length > 0) {
            const target = nearbyAgents[Math.floor(Math.random() * nearbyAgents.length)];
            actions.push({ type: 'SOCIALIZE', targetId: target.id });
        }

        // ROMANCE - Si hay parejas potenciales
        const partners = this.worker.agentRegistry.findPotentialPartners(agent);
        if (partners.length > 0 && agent.lifeStage === 'adult') {
            actions.push({
                type: 'ROMANCE',
                targetId: partners[0].id,
                cooldown: 30000 // 30 segundos
            });
        }

        // ATTACK - Si hay enemigos
        const enemies = nearbyAgents.filter(other => {
            const rel = agent.relationships[other.id];
            return rel && rel.resentment > 70;
        });
        if (enemies.length > 0 && agent.personality.aggression > 60) {
            actions.push({
                type: 'ATTACK',
                targetId: enemies[0].id,
                cooldown: 60000 // 1 minuto
            });
        }

        // HIDE - Si está asustado
        if (agent.stats.sanity < 50 || agent.needs.safety > 70) {
            actions.push({ type: 'HIDE' });
        }

        // REST - Siempre posible
        actions.push({ type: 'REST' });

        // INVESTIGATE - Si es de noche y paranoia alta
        const hour = new Date().getHours();
        if ((hour >= 22 || hour <= 5) && agent.personality.paranoia > 50) {
            actions.push({ type: 'INVESTIGATE' });
        }

        return actions;
    }

    /**
     * Modificador de personalidad
     */
    getPersonalityModifier(agent, action) {
        let modifier = 1.0;

        switch (action.type) {
            case 'ATTACK':
                modifier = 0.5 + (agent.personality.aggression / 100);
                break;

            case 'SOCIALIZE':
                modifier = 0.5 + (agent.personality.empathy / 100);
                break;

            case 'ROMANCE':
                modifier = 0.5 + (agent.personality.sexuality / 100);
                break;

            case 'HIDE':
                modifier = 0.5 + (agent.personality.paranoia / 100);
                break;

            case 'INVESTIGATE':
                modifier = 0.5 + ((agent.personality.paranoia + agent.traumaProfile.insomnia) / 200);
                break;
        }

        return Math.max(0.1, modifier);
    }

    /**
     * Estimar riesgo de una acción
     */
    estimateRisk(agent, action) {
        switch (action.type) {
            case 'ATTACK':
                return 0.8; // Alto riesgo
            case 'ROMANCE':
                return 0.3; // Riesgo emocional
            case 'INVESTIGATE':
                return 0.5; // Riesgo psicológico
            case 'SCAVENGE':
                return 0.4; // Riesgo medio
            default:
                return 0.1; // Bajo riesgo
        }
    }

    /**
     * Check if action is on cooldown
     */
    isOnCooldown(agent) {
        if (!agent.currentAction) return false;

        const elapsed = Date.now() - agent.currentAction.startedAt;
        return elapsed < (agent.currentAction.cooldown || 0);
    }

    /**
     * Check if global cap reached (stability control)
     */
    globalCapReached(action) {
        // TODO: Check with StabilityController
        return false;
    }

    /**
     * Get random adjacent node (placeholder)
     */
    getRandomAdjacentNode(agent) {
        // TODO: Query WorldGraph for adjacent nodes
        return agent.nodeId; // Por ahora, mismo nodo
    }
}

export default DecisionEngine;
