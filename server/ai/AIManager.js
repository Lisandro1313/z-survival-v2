// ============================================================================
// AI INTEGRATION LAYER - Conecta sistema de IA con backend existente
// ============================================================================

import RegionWorker from './RegionWorker.js';
import AgentSpawner from './AgentSpawner.js';

class AIManager {
    constructor(wss, survivalDB) {
        this.wss = wss; // WebSocket server
        this.db = survivalDB;
        this.workers = new Map(); // regionId -> RegionWorker
        this.spawner = new AgentSpawner();
        this.enabled = false; // Desactivado por defecto (admin puede activar)
    }

    /**
     * Inicializar sistema de IA
     */
    async initialize() {
        console.log('🤖 [AI] Inicializando sistema de IA social...');

        // Crear tabla de agentes si no existe
        await this.createAgentTables();

        // Cargar agentes desde DB o crear iniciales
        const existingAgents = await this.loadAgentsFromDB();

        if (existingAgents.length === 0) {
            console.log('🤖 [AI] No hay agentes existentes. Spawning inicial...');
            await this.spawnInitialAgents();
        } else {
            console.log(`🤖 [AI] Cargados ${existingAgents.length} agentes desde DB`);
        }

        // Inicializar workers por región
        this.initializeWorkers();

        console.log('✅ [AI] Sistema de IA inicializado');
    }

    /**
     * Crear tablas de agentes en DB
     */
    async createAgentTables() {
        const createAgentsTable = `
      CREATE TABLE IF NOT EXISTS ai_agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        birth_timestamp INTEGER NOT NULL,
        age INTEGER NOT NULL,
        life_stage TEXT NOT NULL,
        node_id TEXT NOT NULL,
        alive INTEGER DEFAULT 1,
        personality TEXT NOT NULL,
        trauma_profile TEXT NOT NULL,
        needs TEXT NOT NULL,
        relationships TEXT NOT NULL,
        memory TEXT NOT NULL,
        stats TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;

        const createEventsTable = `
      CREATE TABLE IF NOT EXISTS ai_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
      )
    `;

        this.db.db.exec(createAgentsTable);
        this.db.db.exec(createEventsTable);

        console.log('✅ [AI] Tablas de agentes creadas');
    }

    /**
     * Cargar agentes desde DB
     */
    async loadAgentsFromDB() {
        const stmt = this.db.db.prepare('SELECT * FROM ai_agents WHERE alive = 1');
        const rows = stmt.all();

        return rows.map(row => ({
            id: row.id,
            name: row.name,
            birthTimestamp: row.birth_timestamp,
            age: row.age,
            lifeStage: row.life_stage,
            nodeId: row.node_id,
            alive: row.alive === 1,
            personality: JSON.parse(row.personality),
            traumaProfile: JSON.parse(row.trauma_profile),
            needs: JSON.parse(row.needs),
            relationships: JSON.parse(row.relationships),
            memory: JSON.parse(row.memory),
            stats: JSON.parse(row.stats)
        }));
    }

    /**
     * Spawn agentes iniciales
     */
    async spawnInitialAgents() {
        // TODO: Obtener nodos disponibles desde WorldGraph
        const defaultNode = 'refuge_1'; // Placeholder

        const agents = this.spawner.spawnInitialAgents(defaultNode, 20);

        // Guardar en DB
        const stmt = this.db.db.prepare(`
      INSERT INTO ai_agents (
        id, name, birth_timestamp, age, life_stage, node_id, alive,
        personality, trauma_profile, needs, relationships, memory, stats
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        for (const agent of agents) {
            stmt.run(
                agent.id,
                agent.name,
                agent.birthTimestamp,
                agent.age,
                agent.lifeStage,
                agent.nodeId,
                agent.alive ? 1 : 0,
                JSON.stringify(agent.personality),
                JSON.stringify(agent.traumaProfile),
                JSON.stringify(agent.needs),
                JSON.stringify(agent.relationships),
                JSON.stringify(agent.memory),
                JSON.stringify(agent.stats)
            );
        }

        console.log(`✅ [AI] Spawned ${agents.length} agentes iniciales`);
        return agents;
    }

    /**
     * Inicializar workers por región
     */
    initializeWorkers() {
        // Por ahora, un solo worker para región default
        const regionId = 'default';
        const worker = new RegionWorker(regionId, {
            tickInterval: 2000,
            maxAgentsPerTick: 50
        });

        // Conectar worker con AI manager
        worker.aiManager = this;

        this.workers.set(regionId, worker);

        console.log(`✅ [AI] Worker para región ${regionId} inicializado`);
    }

    /**
     * Start AI simulation
     */
    start() {
        if (this.enabled) {
            console.log('⚠️ [AI] Ya está en ejecución');
            return;
        }

        this.enabled = true;

        // Cargar agentes en workers
        this.loadAgentsFromDB().then(agents => {
            for (const worker of this.workers.values()) {
                // Filtrar agentes de esta región
                const regionAgents = agents.filter(a => a.nodeId.startsWith(worker.regionId) || worker.regionId === 'default');

                for (const agent of regionAgents) {
                    worker.agentRegistry.add(agent);
                }

                console.log(`🤖 [AI] Worker ${worker.regionId}: ${regionAgents.length} agentes cargados`);

                // Start worker
                worker.start();
            }

            console.log('✅ [AI] Simulación iniciada');
        });
    }

    /**
     * Stop AI simulation
     */
    stop() {
        if (!this.enabled) {
            console.log('⚠️ [AI] No está en ejecución');
            return;
        }

        this.enabled = false;

        for (const worker of this.workers.values()) {
            worker.stop();
        }

        console.log('⏸️ [AI] Simulación detenida');
    }

    /**
     * Broadcast mensaje a todos los clientes
     */
    broadcast(event, data) {
        if (!this.wss || !this.wss.clients) return;

        const message = JSON.stringify({
            type: event,
            data
        });

        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // OPEN
                client.send(message);
            }
        });
    }

    /**
     * Persistir snapshot de agentes
     */
    async persistSnapshot(agents) {
        const stmt = this.db.db.prepare(`
      UPDATE ai_agents SET
        age = ?,
        life_stage = ?,
        node_id = ?,
        alive = ?,
        personality = ?,
        trauma_profile = ?,
        needs = ?,
        relationships = ?,
        memory = ?,
        stats = ?,
        updated_at = strftime('%s', 'now')
      WHERE id = ?
    `);

        for (const agent of agents) {
            stmt.run(
                agent.age,
                agent.lifeStage,
                agent.nodeId,
                agent.alive ? 1 : 0,
                JSON.stringify(agent.personality),
                JSON.stringify(agent.traumaProfile),
                JSON.stringify(agent.needs),
                JSON.stringify(agent.relationships),
                JSON.stringify(agent.memory),
                JSON.stringify(agent.stats),
                agent.id
            );
        }
    }

    /**
     * Log evento de agente
     */
    async logAgentEvent(agentId, eventType, data) {
        const stmt = this.db.db.prepare(`
      INSERT INTO ai_events (agent_id, event_type, data)
      VALUES (?, ?, ?)
    `);

        stmt.run(agentId, eventType, JSON.stringify(data));
    }

    /**
     * Get stats
     */
    getStats() {
        const stats = {
            enabled: this.enabled,
            workers: this.workers.size,
            regions: {}
        };

        for (const [regionId, worker] of this.workers.entries()) {
            stats.regions[regionId] = worker.agentRegistry.getStats();
        }

        return stats;
    }
}

export default AIManager;
