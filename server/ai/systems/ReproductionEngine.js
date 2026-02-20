// ============================================================================
// REPRODUCTION ENGINE - Herencia genética y spawn de nuevos agentes
// ============================================================================

import { v4 as uuidv4 } from 'uuid';

class ReproductionEngine {
    constructor(worker) {
        this.worker = worker;
        this.cooldowns = new Map(); // agentId -> timestamp
        this.config = {
            minAffection: 70,
            minTrust: 60,
            minAttraction: 50,
            cooldownDays: 30, // días entre embarazos
            gestationTicks: 100, // ~3 minutos (100 ticks * 2s)
            mutationRange: 10 // ±10 en traits heredados
        };
        this.pregnancies = new Map(); // agentId -> { partner, startTick, ticksRemaining }
    }

    /**
     * Procesar reproducción en región
     */
    process(agents, currentTick) {
        const adults = agents.filter(a =>
            a.alive &&
            a.lifeStage === 'adult' &&
            a.personality.sexuality > 30
        );

        // Check pregnancies en progreso
        this.updatePregnancies(currentTick);

        // Intentar nuevos embarazos
        for (const agent of adults) {
            if (this.pregnancies.has(agent.id)) continue; // Ya embarazado
            if (!this.canReproduce(agent)) continue;

            const partner = this.findCompatiblePartner(agent, adults);
            if (partner && this.worker.stabilityController.canReproduce()) {
                this.startPregnancy(agent, partner, currentTick);
            }
        }
    }

    /**
     * Check si agente puede reproducirse
     */
    canReproduce(agent) {
        const lastBirth = this.cooldowns.get(agent.id);
        if (!lastBirth) return true;

        const daysSince = (Date.now() - lastBirth) / (1000 * 60 * 60 * 24);
        return daysSince >= this.config.cooldownDays;
    }

    /**
     * Encontrar pareja compatible
     */
    findCompatiblePartner(agent, candidates) {
        const potentials = candidates.filter(c => {
            if (c.id === agent.id) return false;
            if (c.lifeStage !== 'adult') return false;
            if (this.pregnancies.has(c.id)) return false;
            if (!this.canReproduce(c)) return false;

            const rel = agent.relationships[c.id];
            if (!rel) return false;

            return (
                rel.affection >= this.config.minAffection &&
                rel.trust >= this.config.minTrust &&
                rel.sexualAttraction >= this.config.minAttraction
            );
        });

        if (potentials.length === 0) return null;

        // Escoger el de mayor affection
        return potentials.sort((a, b) => {
            const relA = agent.relationships[a.id];
            const relB = agent.relationships[b.id];
            return relB.affection - relA.affection;
        })[0];
    }

    /**
     * Iniciar embarazo
     */
    startPregnancy(parent, partner, currentTick) {
        this.pregnancies.set(parent.id, {
            partnerId: partner.id,
            startTick: currentTick,
            ticksRemaining: this.config.gestationTicks
        });

        console.log(`[ReproductionEngine] Pregnancy started: ${parent.name} + ${partner.name}`);

        // WS notification (futuro)
        // this.worker.publish('agent:pregnancy', { parentId: parent.id, partnerId: partner.id });
    }

    /**
     * Actualizar embarazos en progreso
     */
    updatePregnancies(currentTick) {
        for (const [parentId, pregnancy] of this.pregnancies.entries()) {
            pregnancy.ticksRemaining--;

            if (pregnancy.ticksRemaining <= 0) {
                this.giveBirth(parentId, pregnancy.partnerId, currentTick);
                this.pregnancies.delete(parentId);
            }
        }
    }

    /**
     * Dar a luz (spawn child)
     */
    giveBirth(parentId, partnerId, currentTick) {
        const parent = this.worker.agentRegistry.get(parentId);
        const partner = this.worker.agentRegistry.get(partnerId);

        if (!parent || !partner) {
            console.error(`[ReproductionEngine] Parent or partner not found`);
            return;
        }

        const child = this.createChild(parent, partner);

        // Add to registry
        this.worker.agentRegistry.add(child);

        // Cooldowns
        this.cooldowns.set(parent.id, Date.now());
        this.cooldowns.set(partner.id, Date.now());

        // Stability controller
        this.worker.stabilityController.registerBirth();

        console.log(`[ReproductionEngine] Birth: ${child.name} (parents: ${parent.name} + ${partner.name})`);

        // WS notification
        this.worker.publish('agent:birth', {
            childId: child.id,
            childName: child.name,
            parentId: parent.id,
            partnerId: partner.id
        });
    }

    /**
     * Crear hijo con herencia genética
     */
    createChild(parent1, parent2) {
        const child = {
            id: uuidv4(),
            name: this.generateChildName(parent1, parent2),
            birthTimestamp: Date.now(),
            age: 0,
            lifeStage: 'child',
            nodeId: parent1.nodeId, // Nace en ubicación del parent
            alive: true,

            // 🧬 HERENCIA GENÉTICA
            personality: this.inheritPersonality(parent1, parent2),

            traumaProfile: {
                abandonment: 0,
                violenceExposure: 0,
                insomnia: 0,
                hallucinationTendency: 0,
                cultBelief: 0,
                existentialCrisis: 0
            },

            needs: {
                hunger: 30,
                safety: 50,
                social: 60, // Niños necesitan atención
                romance: 0, // No aplica a niños
                wealth: 0,
                purpose: 20
            },

            relationships: {
                [parent1.id]: {
                    affection: 80,
                    trust: 90,
                    sexualAttraction: 0,
                    jealousy: 0,
                    dependency: 100, // Totalmente dependiente
                    resentment: 0,
                    history: []
                },
                [parent2.id]: {
                    affection: 80,
                    trust: 90,
                    sexualAttraction: 0,
                    jealousy: 0,
                    dependency: 100,
                    resentment: 0,
                    history: []
                }
            },

            memory: {
                events: []
            },

            stats: {
                hp: 100,
                stamina: 100,
                sanity: 100 // Niños tienen sanidad alta inicial
            }
        };

        return child;
    }

    /**
     * Heredar personality de padres con mutación
     */
    inheritPersonality(parent1, parent2) {
        const traits = [
            'dominance', 'submission', 'aggression', 'empathy', 'paranoia',
            'sexuality', 'romanticIdealism', 'possessiveness', 'selfEsteem',
            'loneliness', 'riskAversion'
        ];

        const inherited = {};

        for (const trait of traits) {
            const p1Value = parent1.personality[trait];
            const p2Value = parent2.personality[trait];

            // Promedio ponderado (70% promedio + 30% del más dominante)
            let base = (p1Value + p2Value) / 2;

            // El padre con mayor dominance tiene más influencia
            if (parent1.personality.dominance > parent2.personality.dominance) {
                base = base * 0.7 + p1Value * 0.3;
            } else {
                base = base * 0.7 + p2Value * 0.3;
            }

            // Mutación: ±10 random
            const mutation = (Math.random() * this.config.mutationRange * 2) - this.config.mutationRange;
            inherited[trait] = this.clamp(base + mutation, 0, 100);
        }

        return inherited;
    }

    /**
     * Generar nombre de hijo (composición de padres + suffix)
     */
    generateChildName(parent1, parent2) {
        const suffixes = ['Jr.', 'II', 'el Joven', 'hijo'];

        // 70% chance de heredar parte del nombre de un padre
        if (Math.random() < 0.7) {
            const chosenParent = Math.random() < 0.5 ? parent1 : parent2;
            const baseName = chosenParent.name.split(' ')[0];

            // 30% chance de añadir suffix
            if (Math.random() < 0.3) {
                return `${baseName} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
            }

            return baseName;
        }

        // 30% chance de nombre completamente nuevo
        return this.generateRandomName();
    }

    /**
     * Generar nombre aleatorio
     */
    generateRandomName() {
        const firstNames = [
            'Alex', 'Jordan', 'Morgan', 'Casey', 'Taylor',
            'Riley', 'Avery', 'Quinn', 'Sage', 'River'
        ];

        return firstNames[Math.floor(Math.random() * firstNames.length)];
    }

    /**
     * Clamp value entre min y max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
}

export default ReproductionEngine;
