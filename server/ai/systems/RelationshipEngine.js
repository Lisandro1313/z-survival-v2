// ============================================================================
// RELATIONSHIP ENGINE - Gestión de relaciones entre agentes
// ============================================================================

class RelationshipEngine {
    constructor(worker) {
        this.worker = worker;
    }

    /**
     * Actualizar relación basada en interacción
     */
    update(agent, target, interactionType) {
        // Inicializar relación si no existe
        if (!agent.relationships[target.id]) {
            agent.relationships[target.id] = this.createRelationship(target.id);
        }

        if (!target.relationships[agent.id]) {
            target.relationships[agent.id] = this.createRelationship(agent.id);
        }

        const rel = agent.relationships[target.id];
        const targetRel = target.relationships[agent.id];

        // Aplicar cambios según tipo de interacción
        switch (interactionType) {
            case 'socialized':
                rel.affection += 5;
                rel.trust += 2;
                targetRel.affection += 5;
                targetRel.trust += 2;
                break;

            case 'helped':
                rel.affection += 15;
                rel.trust += 10;
                targetRel.affection += 15;
                targetRel.trust += 10;
                break;

            case 'betrayed':
                rel.affection -= 30;
                rel.trust -= 50;
                rel.resentment += 40;
                targetRel.affection -= 30;
                targetRel.trust -= 50;
                targetRel.resentment += 40;
                break;

            case 'intimacy':
                rel.affection += 20;
                rel.sexualAttraction += 15;
                rel.dependency += 10;
                targetRel.affection += 20;
                targetRel.sexualAttraction += 15;
                targetRel.dependency += 10;
                break;

            case 'flirted_with_other':
                if (rel.possessiveness > 50) {
                    rel.jealousy += 30;
                    rel.trust -= 20;
                }
                break;

            case 'conflict':
                rel.affection -= 20;
                rel.resentment += 20;
                targetRel.affection -= 20;
                targetRel.resentment += 20;
                break;
        }

        // Clamp values
        this.clampRelationship(rel);
        this.clampRelationship(targetRel);

        // Check for jealousy triggers
        this.checkJealousy(agent, target);

        // Store history
        rel.history.push({
            type: interactionType,
            timestamp: Date.now(),
            emotionalImpact: this.calculateEmotionalImpact(interactionType)
        });
    }

    /**
     * Aumentar intimidad
     */
    increaseIntimacy(agent, partner) {
        this.update(agent, partner, 'intimacy');

        this.worker.publish('agent:relationship_update', {
            agentId: agent.id,
            targetId: partner.id,
            type: 'intimacy',
            affection: agent.relationships[partner.id].affection
        });
    }

    /**
     * Check for jealousy
     */
    checkJealousy(agent, target) {
        const rel = agent.relationships[target.id];

        if (rel.jealousy > 70 && agent.personality.possessiveness > 60) {
            // Trigger stalking behavior
            this.triggerFollowBehavior(agent, target);
        }

        if (rel.jealousy > 80 && agent.personality.aggression > 70) {
            // Potential violent confrontation
            console.log(`[RelationshipEngine] ${agent.name} is dangerously jealous of ${target.name}`);
        }
    }

    /**
     * Trigger follow behavior (stalking)
     */
    triggerFollowBehavior(agent, target) {
        // Agent will follow target
        this.worker.publish('agent:follow', {
            agentId: agent.id,
            targetId: target.id,
            reason: 'jealousy'
        });

        console.log(`[RelationshipEngine] ${agent.name} is now following ${target.name} (jealousy)`);
    }

    /**
     * Crear nueva relación
     */
    createRelationship(targetId) {
        return {
            targetId,
            affection: 0,
            sexualAttraction: 0,
            trust: 50,
            jealousy: 0,
            dependency: 0,
            resentment: 0,
            possessiveness: 0,
            history: []
        };
    }

    /**
     * Clamp relationship values
     */
    clampRelationship(rel) {
        rel.affection = Math.max(-100, Math.min(100, rel.affection));
        rel.sexualAttraction = Math.max(0, Math.min(100, rel.sexualAttraction));
        rel.trust = Math.max(0, Math.min(100, rel.trust));
        rel.jealousy = Math.max(0, Math.min(100, rel.jealousy));
        rel.dependency = Math.max(0, Math.min(100, rel.dependency));
        rel.resentment = Math.max(0, Math.min(100, rel.resentment));
    }

    /**
     * Calculate emotional impact
     */
    calculateEmotionalImpact(interactionType) {
        const impacts = {
            'socialized': 5,
            'helped': 15,
            'betrayed': -40,
            'intimacy': 25,
            'conflict': -20,
            'flirted_with_other': -15
        };

        return impacts[interactionType] || 0;
    }

    /**
     * Decay relationships over time (no interaction)
     */
    decayRelationships(agent) {
        for (const [targetId, rel] of Object.entries(agent.relationships)) {
            const lastInteraction = rel.history[rel.history.length - 1];

            if (lastInteraction) {
                const timeSinceInteraction = Date.now() - lastInteraction.timestamp;
                const daysSince = timeSinceInteraction / (1000 * 60 * 60 * 24);

                if (daysSince > 7) {
                    // Decay affection slowly
                    rel.affection *= 0.99;
                    rel.jealousy *= 0.95;
                    rel.dependency *= 0.95;
                }
            }
        }
    }
}

export default RelationshipEngine;

