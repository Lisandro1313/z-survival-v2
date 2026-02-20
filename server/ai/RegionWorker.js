// ============================================================================
// REGION AI WORKER - Motor principal de simulación por región
// ============================================================================

import AgentRegistry from './systems/AgentRegistry.js';
import NeedsEngine from './systems/NeedsEngine.js';
import DecisionEngine from './systems/DecisionEngine.js';
import RelationshipEngine from './systems/RelationshipEngine.js';
import MemoryEngine from './systems/MemoryEngine.js';
import ReproductionEngine from './systems/ReproductionEngine.js';
import DialogueEngine from './systems/DialogueEngine.js';
import StabilityController from './systems/StabilityController.js';

class RegionWorker {
    constructor(regionId, config = {}) {
        this.regionId = regionId;
        this.config = {
            tickInterval: config.tickInterval || 2000, // 2 segundos por tick
            maxAgentsPerTick: config.maxAgentsPerTick || 50,
            ...config
        };

        // Sistemas
        this.agentRegistry = new AgentRegistry(this);
        this.needsEngine = new NeedsEngine(this);
        this.decisionEngine = new DecisionEngine(this);
        this.relationshipEngine = new RelationshipEngine(this);
        this.memoryEngine = new MemoryEngine(this);
        this.reproductionEngine = new ReproductionEngine(this);
        this.dialogueEngine = new DialogueEngine(this);
        this.stabilityController = new StabilityController(this);

        // Estado
        this.tickCount = 0;
        this.isRunning = false;
        this.tickTimer = null;

        console.log(`[RegionWorker] Created for region: ${regionId}`);
    }

    /**
     * Iniciar simulación
     */
    start() {
        if (this.isRunning) {
            console.warn(`[RegionWorker] Already running: ${this.regionId}`);
            return;
        }

        this.isRunning = true;
        this.tickTimer = setInterval(() => this.tick(), this.config.tickInterval);
        console.log(`[RegionWorker] Started: ${this.regionId}`);
    }

    /**
     * Detener simulación
     */
    stop() {
        if (this.tickTimer) {
            clearInterval(this.tickTimer);
            this.tickTimer = null;
        }
        this.isRunning = false;
        console.log(`[RegionWorker] Stopped: ${this.regionId}`);
    }

    /**
     * Tick principal - ejecuta un ciclo de simulación
     */
    async tick() {
        this.tickCount++;
        const startTime = Date.now();

        try {
            const agents = this.agentRegistry.getActiveAgents();

            if (agents.length === 0) {
                return; // No hay agentes, skip
            }

            // 1️⃣ UPDATE NEEDS (todos los agentes)
            for (const agent of agents) {
                this.needsEngine.update(agent);
            }

            // 2️⃣ DECIDE ACTIONS (muestreo para performance)
            const sampled = this.stabilityController.sampleAgents(agents);

            for (const agent of sampled) {
                const action = this.decisionEngine.decide(agent);
                if (action) {
                    await this.executeAction(agent, action);
                }
            }

            // 3️⃣ REPRODUCTION CHECK
            this.reproductionEngine.process(agents);

            // 4️⃣ STABILITY CONTROLS
            this.stabilityController.applyGlobalLimits();

            // 5️⃣ PERIODIC SNAPSHOT (cada 10 ticks = ~20 segundos)
            if (this.tickCount % 10 === 0) {
                await this.persistSnapshot();
            }

            const elapsed = Date.now() - startTime;

            if (elapsed > this.config.tickInterval * 0.8) {
                console.warn(`[RegionWorker] Slow tick: ${elapsed}ms (${agents.length} agents, ${sampled.length} sampled)`);
            }

        } catch (error) {
            console.error(`[RegionWorker] Tick error:`, error);
        }
    }

    /**
     * Ejecutar acción de un agente
     */
    async executeAction(agent, action) {
        switch (action.type) {
            case 'MOVE':
                this.moveAgent(agent, action);
                break;

            case 'SCAVENGE':
                this.handleScavenge(agent, action);
                break;

            case 'TRADE':
                this.handleTrade(agent, action);
                break;

            case 'SOCIALIZE':
                this.handleSocial(agent, action);
                break;

            case 'ROMANCE':
                this.handleRomance(agent, action);
                break;

            case 'ATTACK':
                this.handleConflict(agent, action);
                break;

            case 'HIDE':
                this.handleHide(agent, action);
                break;

            case 'REST':
                this.handleRest(agent, action);
                break;

            case 'INVESTIGATE':
                this.handleInvestigate(agent, action);
                break;

            default:
                console.warn(`[RegionWorker] Unknown action type: ${action.type}`);
        }

        // Actualizar cooldown
        agent.currentAction = {
            type: action.type,
            target: action.targetId,
            startedAt: Date.now(),
            cooldown: action.cooldown || 5000
        };
    }

    /**
     * MOVE - Mover agente a otro nodo
     */
    moveAgent(agent, action) {
        const oldNode = agent.nodeId;
        agent.nodeId = action.targetNodeId;

        this.publish('entity:update', { entity: agent });
        console.log(`[Agent ${agent.name}] Moved: ${oldNode} → ${action.targetNodeId}`);
    }

    /**
     * SCAVENGE - Buscar recursos
     */
    handleScavenge(agent, action) {
        // TODO: Integrar con economy/inventory
        agent.needs.hunger -= 10;
        agent.needs.wealth += 5;
        console.log(`[Agent ${agent.name}] Scavenged resources`);
    }

    /**
     * TRADE - Comerciar
     */
    handleTrade(agent, action) {
        // TODO: Integrar con EconomyManager
        console.log(`[Agent ${agent.name}] Trading...`);
    }

    /**
     * SOCIALIZE - Interacción social
     */
    handleSocial(agent, action) {
        const target = this.agentRegistry.get(action.targetId);
        if (!target) return;

        // Update relationship
        this.relationshipEngine.update(agent, target, 'socialized');

        // Store memory
        this.memoryEngine.storeInteraction(agent, target, 'socialized');

        // Generate dialogue
        const dialogue = this.dialogueEngine.generate(agent, target, 'social');
        if (dialogue) {
            this.publish('agent:speech', {
                agentId: agent.id,
                text: dialogue,
                mood: agent.stats.sanity > 70 ? 'friendly' : 'unsettled'
            });
        }

        agent.needs.social -= 20;
        console.log(`[Agent ${agent.name}] Socialized with ${target.name}`);
    }

    /**
     * ROMANCE - Cortejo/intimidad
     */
    handleRomance(agent, action) {
        const partner = this.agentRegistry.get(action.targetId);
        if (!partner) return;

        // Check mutual interest
        const partnerRel = partner.relationships[agent.id];
        if (partnerRel && partnerRel.affection > 50) {
            // Successful romance
            this.relationshipEngine.increaseIntimacy(agent, partner);
            this.memoryEngine.storeInteraction(agent, partner, 'intimacy');

            agent.needs.romance -= 30;
            partner.needs.romance -= 30;

            this.publish('agent:emotion_update', {
                agentId: agent.id,
                state: 'love'
            });

            console.log(`[Agent ${agent.name}] Romance with ${partner.name}`);
        } else {
            // Rejected
            agent.personality.selfEsteem -= 5;
            console.log(`[Agent ${agent.name}] Romance rejected by ${partner.name}`);
        }
    }

    /**
     * ATTACK - Conflicto violento
     */
    handleConflict(agent, action) {
        console.log(`[Agent ${agent.name}] Initiating combat with ${action.targetId}`);

        this.publish('combat:request', {
            attacker: agent.id,
            target: action.targetId,
            reason: action.reason || 'aggression'
        });
    }

    /**
     * HIDE - Esconderse
     */
    handleHide(agent, action) {
        agent.needs.safety += 20;
        agent.needs.social += 10;
        console.log(`[Agent ${agent.name}] Hiding...`);
    }

    /**
     * REST - Descansar
     */
    handleRest(agent, action) {
        agent.stats.stamina = Math.min(100, agent.stats.stamina + 30);
        agent.needs.hunger += 5;
        console.log(`[Agent ${agent.name}] Resting...`);
    }

    /**
     * INVESTIGATE - Explorar
     */
    handleInvestigate(agent, action) {
        // Generate dark dialogue at night
        const hour = new Date().getHours();
        if (hour >= 22 || hour <= 5) {
            if (agent.personality.paranoia > 60) {
                const darkDialogue = this.dialogueEngine.generate(agent, null, 'dark');
                if (darkDialogue) {
                    this.publish('agent:dark_thought', {
                        agentId: agent.id,
                        text: darkDialogue
                    });
                }
            }
        }

        console.log(`[Agent ${agent.name}] Investigating...`);
    }

    /**
     * Persistir snapshot de agentes
     */
    async persistSnapshot() {
        const agents = this.agentRegistry.getActiveAgents();

        if (this.aiManager) {
            await this.aiManager.persistSnapshot(agents);
            console.log(`[RegionWorker] Snapshot: ${agents.length} agents persisted`);
        }
    }

    /**
     * Publicar evento vía WebSocket y guardar en DB si es importante
     */
    publish(type, payload) {
        if (!this.aiManager) return;

        // Broadcast a todos los clientes conectados
        this.aiManager.broadcast(type, payload);

        // Eventos críticos que deben guardarse en DB
        const criticalEvents = [
            'agent:speech',
            'agent:dark_thought',
            'agent:follow',
            'agent:birth',
            'agent:death',
            'agent:relationship_update',
            'agent:reproduction'
        ];

        if (criticalEvents.includes(type) && payload.agentId) {
            // Guardar evento en DB para historial
            this.aiManager.logAgentEvent(payload.agentId, type, payload);
        }
    }

    /**
     * Cargar región desde DB
     */
    async loadRegion() {
        // TODO: Load from database
        console.log(`[RegionWorker] Loading region: ${this.regionId}`);
    }
}

export default RegionWorker;
