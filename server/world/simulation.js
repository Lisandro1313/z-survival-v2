// Importar db desde survivalDB (que ya está inicializado)
import survivalDB from '../db/survivalDB.js';
const db = survivalDB.db;

import events from './events.js';
import enemies from './enemies.js';
import narrativeEngine from './narrativeEngine.js';
import npcRelationships from './npcRelations.js';
import dynamicQuests from './dynamicQuests.js';
import npcAI from './npcAI.js';

/**
 * SISTEMA DE SIMULACIÓN AUTÓNOMA - Estilo Dwarf Fortress + Red Dead Redemption
 * El mundo vive por sí solo: NPCs toman decisiones, se mueven, interactúan,
 * recursos fluyen, eventos emergen, historias se crean proceduralmente.
 * 
 * NUEVO: Sistema de narrativa emergente con relaciones complejas entre NPCs
 */

class WorldSimulation {
    constructor() {
        this.simulationInterval = null;
        this.tickRate = 10000; // 10 segundos por tick (más frecuente!)
        this.isRunning = false;

        // Configuración de simulación
        this.config = {
            npcDecisionChance: 0.5, // 50% chance de decisión autónoma por tick (aumentado)
            eventSpawnChance: 0.25, // 25% chance de evento emergente (aumentado)
            narrativeEventChance: 0.7, // 70% chance de evento narrativo entre NPCs (NUEVO)
            resourceDepletionRate: 0.02, // 2% depleción de recursos por tick
            relationshipChangeRate: 0.1, // Cambios graduales en relaciones
            npcNeedsDecayRate: 0.05 // Decaimiento de necesidades
        };

        // Estado del mundo
        this.worldState = {
            tick: 0,
            activeStories: [], // Narrativas emergentes
            factions: new Map(), // Grupos y alianzas
            resourceFlows: new Map(), // Flujo de recursos entre ubicaciones
            recentNpcActions: [] // Acciones autónomas recientes de NPCs (IA)
        };

        // Contexto social para NPCs (broadcast, posts, juegos)
        this.socialContext = null;
    }

    // ===== INICIAR SIMULACIÓN =====
    start(socialContext = null) {
        if (this.isRunning) return;

        this.isRunning = true;
        this.socialContext = socialContext;

        console.log('🌍 Sistema de simulación del mundo INICIADO');
        console.log(`⏰ Tick cada ${this.tickRate / 1000} segundos`);

        // Inicializar estado de NPCs
        this.initializeNPCs();

        // Loop principal de simulación
        this.simulationInterval = setInterval(() => {
            this.worldTick(this.socialContext);
        }, this.tickRate);
    }

    stop() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.isRunning = false;
            console.log('🌍 Sistema de simulación DETENIDO');
        }
    }

    // ===== TICK PRINCIPAL DEL MUNDO =====
    async worldTick(socialContext = null) {
        this.worldState.tick++;
        // Mundo vive en silencio - jugador descubre cambios

        try {
            // 1. NPCs autónomos toman decisiones (IA MEJORADA)
            await this.makeNpcDecisions();

            // 2. Simular necesidades de NPCs
            this.updateNPCNeeds();

            // 3. NPCs se mueven entre ubicaciones
            this.simulateNPCMovement();

            // 4. Interacciones entre NPCs
            this.simulateNPCInteractions();

            // 4.5 NUEVO: Eventos narrativos entre NPCs (DRAMA!)
            this.generateNarrativeEvents();

            // 5. Recursos y economía
            this.simulateResources();

            // 6. Eventos emergentes
            this.generateEmergentEvents();

            // 7. Evolución de relaciones
            this.updateRelationships();

            // 7.5 NUEVO: Decaimiento natural de relaciones NPC-NPC
            npcRelationships.decayAllRelationships();

            // 8. Actualizar facciones y alianzas
            this.updateFactions();

            // 9. NUEVO: Generar quests dinámicas basadas en eventos
            this.generateDynamicQuests();

            // 10. NUEVO: NPCs participan en actividades sociales (fogata, juegos, chat)
            if (socialContext) {
                this.simulateNPCSocialLife(socialContext);
            }

            // Tick completado en silencio
        } catch (error) {
            console.error('❌ Error en tick de simulación:', error);
        }
    }

    // ===== INICIALIZAR NPCS CON ESTADO =====
    initializeNPCs() {
        const npcs = db.prepare('SELECT * FROM npcs WHERE estado = ?').all('activo');

        npcs.forEach(npc => {
            // Agregar tabla de estado extendido si no existe
            const stateExists = db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='npc_state'
            `).get();

            if (!stateExists) {
                db.prepare(`
                    CREATE TABLE IF NOT EXISTS npc_state (
                        npc_id TEXT PRIMARY KEY,
                        necesidades TEXT NOT NULL, -- {hambre, sed, cansancio, seguridad, social}
                        actividad_actual TEXT DEFAULT 'idle',
                        objetivo_actual TEXT,
                        ultima_decision INTEGER DEFAULT 0,
                        FOREIGN KEY (npc_id) REFERENCES npcs(id)
                    )
                `).run();
            }

            // Inicializar estado si no existe
            const hasState = db.prepare('SELECT * FROM npc_state WHERE npc_id = ?').get(npc.id);

            if (!hasState) {
                db.prepare(`
                    INSERT INTO npc_state (npc_id, necesidades, actividad_actual)
                    VALUES (?, ?, ?)
                `).run(npc.id, JSON.stringify({
                    hambre: 50,
                    sed: 50,
                    cansancio: 30,
                    seguridad: 70,
                    social: 60
                }), 'idle');
            }
        });

        console.log(`✅ ${npcs.length} NPCs inicializados con estado`);
    }

    // ===== COMPORTAMIENTO AUTÓNOMO DE NPCs =====
    simulateNPCBehavior() {
        const npcs = db.prepare(`
            SELECT n.*, ns.necesidades, ns.actividad_actual 
            FROM npcs n
            JOIN npc_state ns ON n.id = ns.npc_id
            WHERE n.estado = 'activo'
        `).all();

        let decisionsCount = 0;

        npcs.forEach(npc => {
            // Random chance de tomar decisión
            if (Math.random() > this.config.npcDecisionChance) return;

            const needs = JSON.parse(npc.necesidades);
            const personality = JSON.parse(npc.personalidad);

            // Determinar acción basada en necesidades y personalidad
            const action = this.decideNPCAction(npc, needs, personality);

            if (action) {
                this.executeNPCAction(npc, action);
                decisionsCount++;
            }
        });

        if (decisionsCount > 0) {
            console.log(`  🤖 ${decisionsCount} NPCs tomaron decisiones autónomas`);
        }
    }

    decideNPCAction(npc, needs, personality) {
        // Priorizar por necesidad más urgente
        const urgentNeed = Object.entries(needs).reduce((max, [key, val]) =>
            val < max.value ? { need: key, value: val } : max,
            { need: null, value: 100 }
        );

        // Si necesidad crítica (< 20), actuar
        if (urgentNeed.value < 20) {
            switch (urgentNeed.need) {
                case 'hambre': return { type: 'buscar_comida' };
                case 'sed': return { type: 'buscar_agua' };
                case 'cansancio': return { type: 'descansar' };
                case 'seguridad': return { type: 'huir_peligro' };
                case 'social': return { type: 'socializar' };
            }
        }

        // Decisiones basadas en personalidad
        if (personality.agresivo > 7 && Math.random() < 0.3) {
            return { type: 'patrullar', target: npc.lugar_actual };
        }

        if (personality.comerciante > 7 && Math.random() < 0.2) {
            return { type: 'comerciar' };
        }

        // Acción idle/explorar
        if (Math.random() < 0.1) {
            return { type: 'explorar' };
        }

        return null;
    }

    executeNPCAction(npc, action) {
        // Actualizar actividad actual
        db.prepare(`
            UPDATE npc_state 
            SET actividad_actual = ?, ultima_decision = ?
            WHERE npc_id = ?
        `).run(action.type, Date.now(), npc.id);

        // Log de acción (para generar narrativa)
        this.logNPCAction(npc, action);
    }

    // ===== ACTUALIZAR NECESIDADES DE NPCs =====
    updateNPCNeeds() {
        const npcs = db.prepare(`
            SELECT npc_id, necesidades FROM npc_state
        `).all();

        npcs.forEach(({ npc_id, necesidades }) => {
            const needs = JSON.parse(necesidades);

            // Decrementar necesidades (hambre/sed aumentan, seguridad/social decaen)
            needs.hambre = Math.max(0, needs.hambre - 2);
            needs.sed = Math.max(0, needs.sed - 3);
            needs.cansancio = Math.min(100, needs.cansancio + 1);
            needs.seguridad = Math.max(0, needs.seguridad - 1);
            needs.social = Math.max(0, needs.social - 1);

            db.prepare(`
                UPDATE npc_state SET necesidades = ? WHERE npc_id = ?
            `).run(JSON.stringify(needs), npc_id);
        });
    }

    // ===== MOVIMIENTO AUTÓNOMO DE NPCs =====
    simulateNPCMovement() {
        const npcs = db.prepare(`
            SELECT n.id, n.lugar_actual, ns.actividad_actual
            FROM npcs n
            JOIN npc_state ns ON n.id = ns.npc_id
            WHERE n.estado = 'activo'
        `).all();

        let movementsCount = 0;

        npcs.forEach(npc => {
            // Chance de moverse si está explorando o buscando algo
            if (['explorar', 'buscar_comida', 'buscar_agua'].includes(npc.actividad_actual)) {
                if (Math.random() < 0.4) {
                    const newLocation = this.chooseNewLocation(npc.lugar_actual);
                    if (newLocation) {
                        db.prepare('UPDATE npcs SET lugar_actual = ? WHERE id = ?')
                            .run(newLocation, npc.id);
                        movementsCount++;
                        // NPC se movió en silencio
                    }
                }
            }
        });

        // NPCs se mueven sin anunciar
    }

    chooseNewLocation(currentLocation) {
        const location = db.prepare('SELECT conexiones FROM locations WHERE id = ?')
            .get(currentLocation);

        if (!location) return null;

        const connections = JSON.parse(location.conexiones);
        return connections[Math.floor(Math.random() * connections.length)];
    }

    // ===== INTERACCIONES ENTRE NPCs =====
    simulateNPCInteractions() {
        // Obtener NPCs en misma ubicación
        const locations = db.prepare(`
            SELECT lugar_actual, GROUP_CONCAT(id) as npc_ids
            FROM npcs
            WHERE estado = 'activo'
            GROUP BY lugar_actual
            HAVING COUNT(*) > 1
        `).all();

        let interactionsCount = 0;

        locations.forEach(({ lugar_actual, npc_ids }) => {
            const npcs = npc_ids.split(',');

            // Random chance de interacción
            if (Math.random() < 0.3 && npcs.length >= 2) {
                const npc1 = npcs[0];
                const npc2 = npcs[Math.floor(Math.random() * npcs.length)];

                if (npc1 !== npc2) {
                    this.generateNPCInteraction(npc1, npc2, lugar_actual);
                    interactionsCount++;
                }
            }
        });

        // Interacciones ocurren en background
    }

    generateNPCInteraction(npc1Id, npc2Id, location) {
        const types = ['conversacion', 'intercambio', 'conflicto', 'alianza'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Registrar en memoria de ambos NPCs
        [npc1Id, npc2Id].forEach(npcId => {
            const npc = db.prepare('SELECT memoria FROM npcs WHERE id = ?').get(npcId);
            const memoria = JSON.parse(npc.memoria || '[]');

            memoria.push({
                tipo: type,
                con: npc1Id === npcId ? npc2Id : npc1Id,
                ubicacion: location,
                timestamp: Date.now()
            });

            // Mantener solo últimas 20 memorias
            if (memoria.length > 20) memoria.shift();

            db.prepare('UPDATE npcs SET memoria = ? WHERE id = ?')
                .run(JSON.stringify(memoria), npcId);
        });
    }

    // ===== SIMULACIÓN DE RECURSOS =====
    simulateResources() {
        const locations = db.prepare('SELECT id, recursos FROM locations').all();

        locations.forEach(location => {
            const recursos = JSON.parse(location.recursos);
            let changed = false;

            // Depleción gradual de recursos
            Object.keys(recursos).forEach(recurso => {
                if (Math.random() < this.config.resourceDepletionRate) {
                    recursos[recurso] = Math.max(0, recursos[recurso] - 1);
                    changed = true;
                }
            });

            // Regeneración en zonas específicas
            if (location.id === 'parque' || location.id === 'lago') {
                if (Math.random() < 0.1) {
                    recursos.agua = Math.min(10, (recursos.agua || 0) + 1);
                    recursos.comida = Math.min(10, (recursos.comida || 0) + 1);
                    changed = true;
                }
            }

            if (changed) {
                db.prepare('UPDATE locations SET recursos = ? WHERE id = ?')
                    .run(JSON.stringify(recursos), location.id);
            }
        });
    }

    // ===== GENERAR EVENTOS NARRATIVOS (NUEVO) =====
    generateNarrativeEvents() {
        // Chance de generar 1-3 eventos narrativos por tick
        const eventCount = Math.random() < this.config.narrativeEventChance
            ? Math.floor(Math.random() * 3) + 1
            : 0;

        let generatedCount = 0;

        for (let i = 0; i < eventCount; i++) {
            const event = narrativeEngine.generateWorldEvent();
            if (event) {
                narrativeEngine.logWorldEvent(event);
                generatedCount++;
                // Eventos narrativos ocurren en silencio - jugador debe descubrirlos
            }
        }

        // Eventos generados en background (sin logs)
    }

    // ===== GENERAR EVENTOS EMERGENTES (ACTUALIZADO) =====
    generateEmergentEvents() {
        if (Math.random() > this.config.eventSpawnChance) return;

        const eventTypes = [
            { type: 'horda_zombies', locations: ['calle_sur', 'calle_norte', 'cementerio'] },
            { type: 'recurso_descubierto', locations: ['almacen', 'fabrica', 'aeropuerto'] },
            { type: 'conflicto_facciones', locations: ['mercado', 'plaza', 'banco'] },
            { type: 'npc_herido', locations: ['hospital', 'refugio'] },
            { type: 'comercio_caravana', locations: ['mercado', 'puerto'] }
        ];

        const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const location = event.locations[Math.floor(Math.random() * event.locations.length)];

        this.createEmergentEvent(event.type, location);
    }

    createEmergentEvent(type, location) {
        const eventData = this.generateEventData(type, location);

        // Crear evento en la base de datos (tabla events debe existir)
        try {
            const result = db.prepare(`
                INSERT INTO events (id, type, title, description, location_id, created_at, status)
                VALUES (?, ?, ?, ?, ?, ?, 'active')
            `).run(
                `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                eventData.tipo,
                eventData.titulo,
                eventData.descripcion,
                location,
                Date.now()
            );

            console.log(`  ⚡ Evento emergente: "${eventData.titulo}" en ${location}`);

            // Si es horda, spawnear enemigos
            if (type === 'horda_zombies') {
                for (let i = 0; i < 3; i++) {
                    enemies.spawnEnemy(location);
                }
            }
        } catch (err) {
            console.error('  ⚠️ Error creando evento emergente:', err.message);
        }
    }

    generateEventData(type, location) {
        const templates = {
            horda_zombies: {
                tipo: 'peligro',
                titulo: '¡Horda de zombies!',
                descripcion: 'Una horda de zombies se acerca. Los sobrevivientes necesitan ayuda urgente.',
                opciones: [
                    { texto: 'Defender la zona', requisitos: { stat: 'fuerza', minimo: 5 }, efectos: { reputacion: 10 } },
                    { texto: 'Evacuar civiles', requisitos: { stat: 'carisma', minimo: 6 }, efectos: { reputacion: 8 } }
                ]
            },
            recurso_descubierto: {
                tipo: 'narrativo',
                titulo: 'Escondite secreto descubierto',
                descripcion: 'Alguien encontró un escondite con suministros. Hay que decidir qué hacer.',
                opciones: [
                    { texto: 'Compartir con todos', requisitos: {}, efectos: { reputacion: 5 } },
                    { texto: 'Quedarse todo', requisitos: {}, efectos: { oro: 50, reputacion: -5 } }
                ]
            },
            conflicto_facciones: {
                tipo: 'social',
                titulo: 'Disputa territorial',
                descripcion: 'Dos grupos de sobrevivientes disputan el control de esta zona.',
                opciones: [
                    { texto: 'Mediar conflicto', requisitos: { stat: 'carisma', minimo: 7 }, efectos: { reputacion: 15 } },
                    { texto: 'Apoyar un bando', requisitos: {}, efectos: { reputacion: 5 } }
                ]
            },
            npc_herido: {
                tipo: 'social',
                titulo: 'Sobreviviente herido',
                descripcion: 'Un sobreviviente está gravemente herido y necesita ayuda inmediata.',
                opciones: [
                    { texto: 'Curarlo', requisitos: { item: 'item_botiquin' }, efectos: { reputacion: 10 } },
                    { texto: 'Reconfortar', requisitos: { stat: 'empatia', minimo: 5 }, efectos: { reputacion: 5 } }
                ]
            },
            comercio_caravana: {
                tipo: 'narrativo',
                titulo: 'Caravana comerciante',
                descripcion: 'Una caravana de comerciantes ha llegado. Ofertas especiales por tiempo limitado.',
                opciones: [
                    { texto: 'Ver productos', requisitos: {}, efectos: {} },
                    { texto: 'Ignorar', requisitos: {}, efectos: {} }
                ]
            }
        };

        return templates[type] || templates.recurso_descubierto;
    }

    // ===== EVOLUCIÓN DE RELACIONES =====
    updateRelationships() {
        try {
            // Relaciones gradualmente tienden a la media (60) si no hay interacción
            const relationships = db.prepare('SELECT * FROM relationships').all();

            relationships.forEach(rel => {
                const valores = JSON.parse(rel.valores);
                let changed = false;

                Object.keys(valores).forEach(key => {
                    const current = valores[key];
                    const target = 60; // Neutral

                    if (current < target) {
                        valores[key] = Math.min(target, current + 1);
                        changed = true;
                    } else if (current > target) {
                        valores[key] = Math.max(target, current - 1);
                        changed = true;
                    }
                });

                if (changed) {
                    db.prepare('UPDATE relationships SET valores = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                        .run(JSON.stringify(valores), rel.id);
                }
            });
        } catch (error) {
            // Tabla relationships no existe o error en la query
            // Esto es normal en las primeras ejecuciones antes de que la DB esté completamente inicializada
            if (error.code !== 'SQLITE_ERROR') {
                console.error('Error actualizando relaciones:', error);
            }
        }
    }

    // ===== FACCIONES Y ALIANZAS =====
    updateFactions() {
        // Por ahora, sistema básico
        // En futuro: grupos dinámicos que se forman/disuelven
    }

    // ===== GENERAR QUESTS DINÁMICAS (NUEVO) =====
    generateDynamicQuests() {
        const quest = dynamicQuests.autoGenerateQuests();
        if (quest) {
            console.log(`  🎯 [QUEST] ${quest.title}`);
        }
    }
    // ===== DECISIONES AUTÓNOMAS DE NPCs (IA MEJORADA) =====
    async makeNpcDecisions() {
        try {
            const decisions = await npcAI.makeAllDecisions();
            if (decisions.length > 0) {
                console.log(`🤖 ${decisions.length} NPCs tomaron decisiones autónomas`);

                // Guardar las acciones más recientes para exponer en estado
                this.worldState.recentNpcActions = decisions.slice(-10);
            }
            return decisions;
        } catch (error) {
            console.error('Error en decisiones de NPCs:', error);
            return [];
        }
    }
    // ===== LOGGING DE NARRATIVA =====
    logNPCAction(npc, action) {
        // Guardar para generar narrativas emergentes
        this.worldState.activeStories.push({
            npc: npc.id,
            action: action.type,
            location: npc.lugar_actual,
            timestamp: Date.now()
        });

        // Mantener solo últimas 100 historias
        if (this.worldState.activeStories.length > 100) {
            this.worldState.activeStories.shift();
        }
    }

    // ===== SIMULAR VIDA SOCIAL DE NPCs =====
    // NPCs participan en fogata, juegos, chat como si fueran jugadores reales
    simulateNPCSocialLife(context) {
        const { broadcast, postsDB, activeGames } = context;

        // Obtener NPCs activos
        const npcs = db.prepare(`
            SELECT n.*, ns.necesidades 
            FROM npcs n
            JOIN npc_state ns ON n.id = ns.npc_id
            WHERE n.estado = 'activo'
        `).all();

        if (npcs.length === 0) return;

        let actionsCount = 0;

        npcs.forEach(npc => {
            const needs = JSON.parse(npc.necesidades);
            const personality = JSON.parse(npc.personalidad || '{}');

            // Probabilidad base de acción social: 80% por NPC por tick (MUY ACTIVO)
            if (Math.random() > 0.80) return;

            // Elegir tipo de acción social basada en personalidad
            const actions = [];

            // Acciones disponibles ponderadas por personalidad
            if (personality.social >= 6) {
                actions.push({ type: 'create_post', weight: 4 });
                actions.push({ type: 'chat', weight: 5 });
            } else {
                actions.push({ type: 'create_post', weight: 2 });
                actions.push({ type: 'chat', weight: 3 });
            }

            if (personality.comerciante >= 7) {
                actions.push({ type: 'join_game', weight: 5 });
                actions.push({ type: 'create_game', weight: 3 }); // NUEVO: Crear juegos
            } else {
                actions.push({ type: 'join_game', weight: 2 });
                actions.push({ type: 'create_game', weight: 1 }); // NUEVO: Crear juegos
            }

            if (postsDB.length > 0) {
                actions.push({ type: 'comment_post', weight: 2 });
                actions.push({ type: 'like_post', weight: 3 });
            }

            // Seleccionar acción aleatoria ponderada
            const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
            let random = Math.random() * totalWeight;
            let selectedAction = null;

            for (const action of actions) {
                random -= action.weight;
                if (random <= 0) {
                    selectedAction = action.type;
                    break;
                }
            }

            // Ejecutar acción
            if (selectedAction) {
                this.executeNPCSocialAction(npc, selectedAction, { broadcast, postsDB, activeGames });
                actionsCount++;
            }
        });

        if (actionsCount > 0) {
            console.log(`  🎭 ${actionsCount} NPCs realizaron acciones sociales`);
        }
    }

    executeNPCSocialAction(npc, actionType, context) {
        const { broadcast, postsDB, activeGames } = context;

        switch (actionType) {
            case 'create_post':
                this.npcCreatePost(npc, broadcast, postsDB);
                break;
            case 'chat':
                this.npcSendChat(npc, broadcast);
                break;
            case 'join_game':
                this.npcJoinGame(npc, broadcast, activeGames);
                break;
            case 'create_game':
                this.npcCreateGame(npc, broadcast, activeGames);
                break;
            case 'comment_post':
                this.npcCommentPost(npc, broadcast, postsDB);
                break;
            case 'like_post':
                this.npcLikePost(npc, broadcast, postsDB);
                break;
        }
    }

    // NPCs crean posts en fogata
    npcCreatePost(npc, broadcast, postsDB) {
        const personality = JSON.parse(npc.personalidad || '{}');
        const topics = [
            {
                category: 'survival', templates: [
                    'He visto un grupo de zombies cerca de {location}. Cuidado.',
                    'Encontré recursos en {location}. Aún quedan algunas cosas útiles.',
                    'Alguien debería revisar {location}, puede haber supervivientes.',
                    'La zona de {location} está más peligrosa últimamente.',
                ]
            },
            {
                category: 'social', templates: [
                    'Extraño los días antes del apocalipsis...',
                    '¿Alguien más siente que cada día es más difícil?',
                    'Necesito hablar con alguien. Esto de sobrevivir solo es duro.',
                    'Me pregunto cuántos más habrán sobrevivido por ahí.',
                    '¿Qué hacían antes de todo esto? Yo era {profession}.',
                ]
            },
            {
                category: 'trade', templates: [
                    'Tengo {resource} de sobra. ¿Alguien necesita?',
                    'Busco {resource}. Dispuesto a intercambiar.',
                    'Si alguien tiene {resource}, hablemos.',
                ]
            },
            {
                category: 'rumor', templates: [
                    'Escuché que hay un refugio al norte...',
                    'Dicen que el ejército dejó un bunker abandonado por aquí.',
                    'Un comerciante me contó sobre una zona segura.',
                    'He oído rumores de una cura. ¿Será verdad?',
                ]
            },
        ];

        // Elegir categoría basada en personalidad
        let category;
        if (personality.comerciante >= 7 && Math.random() > 0.5) {
            category = topics.find(t => t.category === 'trade');
        } else if (personality.social >= 7 && Math.random() > 0.4) {
            category = topics.find(t => t.category === 'social');
        } else {
            category = topics[Math.floor(Math.random() * topics.length)];
        }

        const template = category.templates[Math.floor(Math.random() * category.templates.length)];

        // Rellenar template
        const locations = ['supermercado', 'farmacia', 'hospital', 'comisaría', 'escuela'];
        const resources = ['comida', 'medicinas', 'armas', 'agua'];
        const professions = ['médico', 'ingeniero', 'profesor', 'comerciante', 'soldado'];

        let content = template
            .replace('{location}', locations[Math.floor(Math.random() * locations.length)])
            .replace('{resource}', resources[Math.floor(Math.random() * resources.length)])
            .replace('{profession}', professions[Math.floor(Math.random() * professions.length)]);

        const post = {
            id: `post_npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            authorId: `npc_${npc.id}`,
            authorName: `🤖 ${npc.nombre}`,
            title: category.category === 'survival' ? '⚠️ Alerta' :
                category.category === 'social' ? '💭 Reflexión' :
                    category.category === 'trade' ? '💱 Comercio' : '📢 Rumor',
            content: content,
            category: category.category,
            timestamp: Date.now(),
            likes: [],
            comments: [],
            isNPC: true
        };

        postsDB.unshift(post);

        // Broadcast a todos
        broadcast({
            type: 'fogata:new_post',
            post: post
        });
    }

    // NPCs hablan en chat global
    npcSendChat(npc, broadcast) {
        const messages = [
            '¿Alguien tiene comida extra?',
            'He visto movimiento extraño afuera.',
            'Necesito ayuda con una expedición.',
            '¿Cuánto tiempo llevamos aquí ya?',
            'Deberíamos organizarnos mejor.',
            '¿Algún plan para hoy?',
            'Vi zombies cerca del perímetro.',
            'Alguien dejó la puerta abierta anoche...',
            'Necesito descansar un poco.',
            '¿Hay noticias del exterior?',
            'Creo que deberíamos fortalecer las defensas.',
            '¿Qué comeremos hoy?',
        ];

        const message = messages[Math.floor(Math.random() * messages.length)];

        broadcast({
            type: 'chat',
            nombre: `🤖 ${npc.nombre}`,
            mensaje: message,
            isNPC: true
        });
    }

    // NPCs se unen a juegos
    npcJoinGame(npc, broadcast, activeGames) {
        // Buscar juegos que aceptan más jugadores
        const openGames = activeGames.filter(g =>
            g.status === 'waiting' &&
            g.players.length < g.maxPlayers &&
            !g.players.some(p => p.id.startsWith('npc_'))
        );

        if (openGames.length === 0) return;

        const game = openGames[Math.floor(Math.random() * openGames.length)];

        // Agregar NPC al juego
        game.players.push({
            id: `npc_${npc.id}`,
            nombre: `🤖 ${npc.nombre}`,
            bet: Math.floor(Math.random() * 5) + 1, // 1-5 de apuesta
            isNPC: true
        });

        // Incrementar pot
        const betAmount = game.players[game.players.length - 1].bet;
        game.pot.comida = (game.pot.comida || 0) + betAmount;

        broadcast({
            type: 'game:updated',
            game: {
                id: game.id,
                type: game.type,
                players: game.players.length,
                pot: game.pot,
                status: game.status
            },
            action: 'joined',
            joiner: npc.nombre
        });

        broadcast({
            type: 'chat',
            nombre: `🎲 Sistema`,
            mensaje: `🤖 ${npc.nombre} se unió a ${game.type}`,
            isNPC: true
        });
    }

    // NPCs crean juegos nuevos
    npcCreateGame(npc, broadcast, activeGames) {
        // No crear juego si ya hay muchos activos
        if (activeGames.length >= 6) return;

        const gameTypes = ['poker', 'dice', 'roulette', 'blackjack'];
        const gameNames = { poker: 'Póker', dice: 'Dados', roulette: 'Ruleta', blackjack: 'Blackjack' };
        const gameMaxPlayers = { poker: 6, dice: 4, roulette: 8, blackjack: 5 };
        const gameMinPlayers = { poker: 2, dice: 2, roulette: 1, blackjack: 1 };

        const type = gameTypes[Math.floor(Math.random() * gameTypes.length)];
        const bet = Math.floor(Math.random() * 5) + 2; // 2-6 de apuesta inicial

        const newGame = {
            id: `game_npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            name: gameNames[type],
            players: [{
                id: `npc_${npc.id}`,
                nombre: `🤖 ${npc.nombre}`,
                bet: bet,
                isNPC: true
            }],
            pot: { comida: bet },
            status: 'waiting',
            minPlayers: gameMinPlayers[type],
            maxPlayers: gameMaxPlayers[type],
            createdBy: `npc_${npc.id}`,
            createdAt: Date.now()
        };

        activeGames.push(newGame);

        broadcast({
            type: 'game:updated',
            game: {
                id: newGame.id,
                type: newGame.type,
                players: newGame.players.length,
                pot: newGame.pot,
                status: newGame.status
            },
            action: 'created',
            creator: npc.nombre
        });

        broadcast({
            type: 'chat',
            nombre: `🎲 Sistema`,
            mensaje: `🤖 ${npc.nombre} creó una partida de ${gameNames[type]}. ¡Únete!`,
            isNPC: true
        });
    }

    // NPCs comentan en posts
    npcCommentPost(npc, broadcast, postsDB) {
        if (postsDB.length === 0) return;

        const post = postsDB[Math.floor(Math.random() * Math.min(5, postsDB.length))]; // Comentar en posts recientes

        const comments = [
            'Interesante...',
            'Yo también lo noté.',
            'Ten cuidado con eso.',
            'Buena información.',
            '¿Estás seguro?',
            'Gracias por compartir.',
            'Deberíamos investigar más.',
            'No estoy tan seguro de eso.',
            'Tiene sentido.',
            '¿Alguien más puede confirmarlo?',
        ];

        const comment = {
            id: `comment_npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            authorId: `npc_${npc.id}`,
            authorName: `🤖 ${npc.nombre}`,
            content: comments[Math.floor(Math.random() * comments.length)],
            timestamp: Date.now(),
            isNPC: true
        };

        post.comments.push(comment);

        broadcast({
            type: 'fogata:comment_added',
            postId: post.id,
            comment: comment,
            commentCount: post.comments.length
        });
    }

    // NPCs dan like a posts
    npcLikePost(npc, broadcast, postsDB) {
        if (postsDB.length === 0) return;

        const post = postsDB[Math.floor(Math.random() * Math.min(10, postsDB.length))];
        const npcUserId = `npc_${npc.id}`;

        if (post.likes.includes(npcUserId)) return; // Ya le dio like

        post.likes.push(npcUserId);

        broadcast({
            type: 'fogata:like_update',
            postId: post.id,
            likes: post.likes.length
        });
    }

    // ===== OBTENER ESTADO DEL MUNDO (MEJORADO) =====
    getWorldState() {
        return {
            tick: this.worldState.tick,
            isRunning: this.isRunning,
            activeStories: this.worldState.activeStories.slice(-10), // Últimas 10
            npcCount: db.prepare('SELECT COUNT(*) as count FROM npcs WHERE estado = ?').get('activo').count,
            activeEvents: db.prepare('SELECT COUNT(*) as count FROM events WHERE estado = ?').get('activo').count,

            // NUEVO: Estadísticas narrativas
            narrativeStats: narrativeEngine.getWorldStats(),
            recentWorldEvents: narrativeEngine.getRecentEvents(20),
            intenseRelationships: npcRelationships.getIntenseRelationships(6),

            // NUEVO: Misiones dinámicas
            activeQuests: dynamicQuests.getActiveQuests(),

            // NUEVO: Acciones autónomas de NPCs (IA)
            recentNpcActions: this.worldState.recentNpcActions || [],
            aiStats: npcAI.getAIStats()
        };
    }
}

// Singleton
const worldSimulation = new WorldSimulation();
export default worldSimulation;
