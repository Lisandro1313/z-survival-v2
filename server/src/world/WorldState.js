/**
 * WorldState.js
 * Estado puro del mundo - SOLO datos, CERO lógica
 * 
 * REGLAS:
 * - Este archivo NUNCA importa sistemas
 * - No contiene funciones que modifiquen estado
 * - Es completamente serializable
 */

export function createWorldState() {
    return {
        // ===== TIEMPO =====
        time: {
            tick: 0,
            simulationTime: 0,
            hour: 8,           // 0-23
            day: 1,
            dayCount: 1,
            timeOfDay: 8
        },

        // ===== LOCACIONES =====
        locations: {
            refugio: {
                id: 'refugio',
                nombre: 'Refugio Central',
                tipo: 'safe',
                descripcion: 'Un edificio fortificado. Hay gente aquí.',
                recursos: { comida: 20, medicinas: 5, armas: 2, materiales: 10 },
                zombies: 0,
                zombiesInitial: 0,
                zombiesRespawnTime: null,
                nivelRuido: 0,
                defensas: 50,
                conectado_a: ['supermercado', 'farmacia', 'casa_abandonada', 'hospital', 'comisaria']
            },
            supermercado: {
                id: 'supermercado',
                nombre: 'Supermercado Saqueado',
                tipo: 'loot',
                descripcion: 'Estantes vacíos, pero quizás quede algo.',
                recursos: { comida: 15, medicinas: 2, materiales: 5 },
                zombies: 3,
                zombiesInitial: 3,
                zombiesRespawnTime: null,
                nivelRuido: 0,
                conectado_a: ['refugio', 'hospital']
            },
            farmacia: {
                id: 'farmacia',
                nombre: 'Farmacia',
                tipo: 'loot',
                descripcion: 'La puerta está rota. Huele a muerte.',
                recursos: { medicinas: 10, comida: 1, materiales: 3 },
                zombies: 5,
                zombiesInitial: 5,
                zombiesRespawnTime: null,
                nivelRuido: 0,
                conectado_a: ['refugio']
            },
            casa_abandonada: {
                id: 'casa_abandonada',
                nombre: 'Casa Abandonada',
                tipo: 'loot',
                descripcion: 'Una casa de dos pisos.',
                recursos: { comida: 8, armas: 1, materiales: 8 },
                zombies: 2,
                zombiesInitial: 2,
                zombiesRespawnTime: null,
                nivelRuido: 0,
                conectado_a: ['refugio']
            },
            hospital: {
                id: 'hospital',
                nombre: 'Hospital Abandonado',
                tipo: 'loot',
                descripcion: 'Corredores oscuros. Muchos infectados.',
                recursos: { medicinas: 25, comida: 5, armas: 1, materiales: 10 },
                zombies: 12,
                zombiesInitial: 12,
                zombiesRespawnTime: null,
                nivelRuido: 0,
                conectado_a: ['refugio', 'supermercado']
            },
            comisaria: {
                id: 'comisaria',
                nombre: 'Comisaría',
                tipo: 'loot',
                descripcion: 'La estación de policía.',
                recursos: { armas: 8, medicinas: 3, comida: 2, materiales: 12 },
                zombies: 8,
                zombiesInitial: 8,
                zombiesRespawnTime: null,
                nivelRuido: 0,
                conectado_a: ['refugio', 'puente_sur']
            },
            puente_sur: {
                id: 'puente_sur',
                nombre: 'Puente Sur',
                tipo: 'dangerous',
                descripcion: 'Un puente largo. Peligroso.',
                recursos: { comida: 3, materiales: 5 },
                zombies: 15,
                zombiesInitial: 15,
                zombiesRespawnTime: null,
                nivelRuido: 0,
                conectado_a: ['comis aria', 'refugio_norte']
            },
            refugio_norte: {
                id: 'refugio_norte',
                nombre: 'Refugio Norte',
                tipo: 'safe',
                descripcion: 'Otro grupo de sobrevivientes.',
                recursos: { comida: 30, medicinas: 8, armas: 5, materiales: 15 },
                zombies: 0,
                zombiesInitial: 0,
                nivelRuido: 0,
                defensas: 60,
                conectado_a: ['puente_sur', 'fabrica', 'mercado']
            },
            fabrica: {
                id: 'fabrica',
                nombre: 'Fábrica Abandonada',
                tipo: 'loot',
                descripcion: 'Muchos recursos pero peligrosa.',
                recursos: { materiales: 30, armas: 3, comida: 2 },
                zombies: 10,
                zombiesInitial: 10,
                zombiesRespawnTime: null,
                nivelRuido: 0,
                conectado_a: ['refugio_norte']
            },
            mercado: {
                id: 'mercado',
                nombre: 'Mercado Negro',
                tipo: 'trade',
                descripcion: 'Un mercado ilegal.',
                recursos: { comida: 20, medicinas: 5, armas: 10, materiales: 8 },
                zombies: 2,
                zombiesInitial: 2,
                zombiesRespawnTime: null,
                nivelRuido: 0,
                conectado_a: ['refugio_norte']
            }
        },

        // ===== NPCS =====
        npcs: {},

        // === == JUGADORES =====
        players: {},

        // ===== MISIONES =====
        missions: {
            active: [],
            completed: [],
            templates: []
        },

        // ===== EVENTOS =====
        events: {
            active: [],
            narrative: null,
            special: [],
            world: []
        },

        // ===== HORDAS =====
        hordes: {
            next: null,
            warning: false,
            history: []
        },

        // ===== FACCIONES =====
        factions: {},

        // ===== LOGS Y MÉTRICAS =====
        logs: [],
        metrics: {
            zombiesKilled: 0,
            playersOnline: 0,
            npcsAlive: 0,
            resourcesGathered: 0
        },

        // ===== COLA DE ACCIONES (para sistema determinístico) =====
        actions: []
    };
}

export function cloneWorldState(state) {
    return JSON.parse(JSON.stringify(state));
}
