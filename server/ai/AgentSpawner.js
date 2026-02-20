// ============================================================================
// AGENT SPAWNER - Sistema de generación de agentes iniciales
// ============================================================================

import { v4 as uuidv4 } from 'uuid';

class AgentSpawner {
    constructor() {
        this.firstNames = [
            'Alex', 'Jordan', 'Morgan', 'Casey', 'Taylor',
            'Riley', 'Avery', 'Quinn', 'Sage', 'River',
            'Dakota', 'Skylar', 'Phoenix', 'Rowan', 'Charlie',
            'Sam', 'Kai', 'Eden', 'Ash', 'Blake'
        ];

        this.lastNames = [
            'Silva', 'Mendez', 'Torres', 'Romero', 'Diaz',
            'Castro', 'Vargas', 'Reyes', 'Cruz', 'Ruiz'
        ];
    }

    /**
     * Generar agentes iniciales para una región
     */
    spawnInitialAgents(regionId, count = 20) {
        const agents = [];

        for (let i = 0; i < count; i++) {
            const agent = this.createRandomAgent(regionId);
            agents.push(agent);
        }

        // Crear algunas relaciones iniciales (20% tienen vínculos)
        this.createInitialRelationships(agents);

        return agents;
    }

    /**
     * Crear agente aleatorio
     */
    createRandomAgent(nodeId) {
        const age = this.randomAge();
        const lifeStage = this.getLifeStage(age);

        return {
            id: uuidv4(),
            name: this.generateName(),
            birthTimestamp: Date.now() - (age * 365 * 24 * 60 * 60 * 1000),
            age,
            lifeStage,
            nodeId,
            alive: true,

            personality: this.generatePersonality(),
            traumaProfile: this.generateTrauma(),

            needs: {
                hunger: this.random(30, 60),
                safety: this.random(40, 70),
                social: this.random(30, 60),
                romance: lifeStage === 'adult' ? this.random(20, 50) : 0,
                wealth: this.random(20, 50),
                purpose: this.random(30, 60)
            },

            relationships: {},

            memory: {
                events: []
            },

            stats: {
                hp: 100,
                stamina: 100,
                sanity: this.random(70, 95)
            }
        };
    }

    /**
     * Generar edad aleatoria (distribución realista)
     */
    randomAge() {
        const roll = Math.random();

        // 15% niños (5-11)
        if (roll < 0.15) return this.random(5, 11);

        // 15% adolescentes (12-17)
        if (roll < 0.30) return this.random(12, 17);

        // 60% adultos (18-59)
        if (roll < 0.90) return this.random(18, 59);

        // 10% ancianos (60-80)
        return this.random(60, 80);
    }

    /**
     * Obtener life stage según edad
     */
    getLifeStage(age) {
        if (age < 12) return 'child';
        if (age < 18) return 'teen';
        if (age < 60) return 'adult';
        return 'elder';
    }

    /**
     * Generar personalidad aleatoria
     */
    generatePersonality() {
        return {
            dominance: this.random(20, 80),
            submission: this.random(20, 80),
            aggression: this.random(10, 60), // Sesgado bajo para estabilidad
            empathy: this.random(30, 80),
            paranoia: this.random(20, 60),
            sexuality: this.random(20, 80),
            romanticIdealism: this.random(30, 80),
            possessiveness: this.random(20, 70),
            selfEsteem: this.random(30, 70),
            loneliness: this.random(20, 60),
            riskAversion: this.random(30, 80)
        };
    }

    /**
     * Generar perfil de trauma (inicial bajo)
     */
    generateTrauma() {
        return {
            abandonment: this.random(0, 30),
            violenceExposure: this.random(0, 20),
            insomnia: this.random(0, 40),
            hallucinationTendency: this.random(0, 20),
            cultBelief: this.random(0, 15),
            existentialCrisis: this.random(0, 30)
        };
    }

    /**
     * Crear relaciones iniciales entre agentes
     */
    createInitialRelationships(agents) {
        const relationshipCount = Math.floor(agents.length * 0.3); // 30% tienen vínculos

        for (let i = 0; i < relationshipCount; i++) {
            const agent1 = agents[Math.floor(Math.random() * agents.length)];
            const agent2 = agents[Math.floor(Math.random() * agents.length)];

            if (agent1.id === agent2.id) continue;
            if (agent1.relationships[agent2.id]) continue; // Ya tienen relación

            const relationType = this.selectRelationType(agent1, agent2);
            this.createRelationship(agent1, agent2, relationType);
        }
    }

    /**
     * Seleccionar tipo de relación según life stages
     */
    selectRelationType(agent1, agent2) {
        // Padres e hijos
        if (agent1.lifeStage === 'adult' && agent2.lifeStage === 'child') {
            return 'parent-child';
        }
        if (agent2.lifeStage === 'adult' && agent1.lifeStage === 'child') {
            return 'parent-child';
        }

        // Pareja romántica (solo adultos)
        if (agent1.lifeStage === 'adult' && agent2.lifeStage === 'adult' && Math.random() < 0.3) {
            return 'romantic';
        }

        // Amigos
        return 'friend';
    }

    /**
     * Crear relación bidireccional
     */
    createRelationship(agent1, agent2, type) {
        let affection1 = 0, affection2 = 0;
        let trust1 = 0, trust2 = 0;
        let attraction1 = 0, attraction2 = 0;
        let dependency1 = 0, dependency2 = 0;

        if (type === 'parent-child') {
            const parent = agent1.lifeStage === 'adult' ? agent1 : agent2;
            const child = agent1.lifeStage === 'child' ? agent1 : agent2;

            // Parent → Child
            parent.relationships[child.id] = {
                affection: this.random(70, 90),
                trust: this.random(60, 80),
                sexualAttraction: 0,
                jealousy: 0,
                dependency: this.random(20, 40),
                resentment: 0,
                history: []
            };

            // Child → Parent
            child.relationships[parent.id] = {
                affection: this.random(70, 90),
                trust: this.random(70, 95),
                sexualAttraction: 0,
                jealousy: 0,
                dependency: this.random(80, 100), // Alta dependencia
                resentment: 0,
                history: []
            };
        }
        else if (type === 'romantic') {
            affection1 = this.random(60, 85);
            affection2 = this.random(60, 85);
            trust1 = this.random(50, 80);
            trust2 = this.random(50, 80);
            attraction1 = this.random(60, 90);
            attraction2 = this.random(60, 90);
            dependency1 = this.random(30, 60);
            dependency2 = this.random(30, 60);

            agent1.relationships[agent2.id] = {
                affection: affection1,
                trust: trust1,
                sexualAttraction: attraction1,
                jealousy: this.random(0, 30),
                dependency: dependency1,
                resentment: 0,
                history: []
            };

            agent2.relationships[agent1.id] = {
                affection: affection2,
                trust: trust2,
                sexualAttraction: attraction2,
                jealousy: this.random(0, 30),
                dependency: dependency2,
                resentment: 0,
                history: []
            };
        }
        else { // friend
            affection1 = this.random(40, 70);
            affection2 = this.random(40, 70);
            trust1 = this.random(40, 70);
            trust2 = this.random(40, 70);

            agent1.relationships[agent2.id] = {
                affection: affection1,
                trust: trust1,
                sexualAttraction: 0,
                jealousy: 0,
                dependency: this.random(10, 30),
                resentment: 0,
                history: []
            };

            agent2.relationships[agent1.id] = {
                affection: affection2,
                trust: trust2,
                sexualAttraction: 0,
                jealousy: 0,
                dependency: this.random(10, 30),
                resentment: 0,
                history: []
            };
        }
    }

    /**
     * Generar nombre completo
     */
    generateName() {
        const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
        const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        return `${firstName} ${lastName}`;
    }

    /**
     * Random entero entre min y max (inclusive)
     */
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Crear agente con parámetros personalizados
     */
    createCustomAgent(regionId, params = {}) {
        const defaults = {
            name: params.name || this.generateName(),
            age: params.age || this.random(18, 65),
            role: params.role || this.roles[Math.floor(Math.random() * this.roles.length)],
            lifeStage: params.lifeStage || 'adult',
            personality: params.personality || {
                openness: this.random(20, 90),
                conscientiousness: this.random(20, 90),
                extraversion: this.random(20, 90),
                agreeableness: this.random(20, 90),
                neuroticism: this.random(20, 90)
            }
        };

        return {
            id: uuidv4(),
            regionId,
            name: defaults.name,
            age: defaults.age,
            role: defaults.role,
            lifeStage: defaults.lifeStage,
            alive: true,

            // Personalidad (Big Five personality traits)
            personality: defaults.personality,

            // Necesidades (0-100, donde 100 = máxima urgencia)
            needs: {
                hunger: this.random(10, 30),
                thirst: this.random(10, 30),
                rest: this.random(10, 30),
                social: this.random(20, 50),
                safety: this.random(10, 30)
            },

            // Estado actual
            state: {
                location: 'refugio',
                subLocation: 'plaza',
                activity: 'idle',
                emotion: 'neutral',
                sanity: this.random(70, 95)
            },

            // Relaciones con otros agentes
            relationships: {},

            // Memoria y experiencia
            memory: {
                shortTerm: [],
                longTerm: [],
                lastUpdate: Date.now()
            },

            // Timestamps
            createdAt: Date.now(),
            lastAction: Date.now()
        };
    }
}

export default AgentSpawner;
