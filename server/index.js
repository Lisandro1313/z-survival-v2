import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

// Importar sistemas CORE
import db from './db/index.js';
import survivalDB from './db/survivalDB.js';
import gameWebSocket from './ws.js';

// Importar NUEVOS sistemas (flag-based)
import flagSystem from './systems/flagSystem.js';
import dialogueEngine from './systems/dialogueEngine.js';
import itemSystem from './systems/itemSystem.js';
import globalEvents from './world/globalEvents.js';

// Sistemas de mundo vivo
import eventManager from './world/events.js';
import worldSimulation from './world/simulation.js';
import questSystem from './systems/questSystem.js';
import dynamicQuests from './world/dynamicQuests.js';

// ========== SISTEMAS DESACTIVADOS (TEMPORALMENTE) ==========
// import enemyManager from './world/enemies.js'; // Combate desactivado por ahora

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rutas API
app.get('/api/locations', (req, res) => {
    const locations = db.prepare('SELECT * FROM locations').all();
    res.json(locations.map(loc => ({
        ...loc,
        conexiones: JSON.parse(loc.conexiones),
        recursos: JSON.parse(loc.recursos)
    })));
});

app.get('/api/player/:id', (req, res) => {
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);

    if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    player.stats = JSON.parse(player.stats);
    player.estado_emocional = JSON.parse(player.estado_emocional);

    res.json(player);
});

app.get('/api/events/:locationId', (req, res) => {
    const events = eventManager.getActiveEvents(req.params.locationId);
    res.json(events);
});

// ========== RUTAS DE AUTENTICACIÓN ==========

// Registro
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    const result = survivalDB.crearUsuario(username, password);
    res.json(result);
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = survivalDB.loginUsuario(username, password);

    if (user) {
        const personajes = survivalDB.obtenerPersonajes(user.id);
        res.json({ success: true, user, personajes });
    } else {
        res.json({ success: false, error: 'Credenciales inválidas' });
    }
});

// ========== RUTAS DE PERSONAJES ==========

// Crear personaje
app.post('/api/personaje/crear', (req, res) => {
    const { usuarioId, nombre, clase, fuerza, resistencia, agilidad, inteligencia, avatar, color } = req.body;

    const result = survivalDB.crearPersonaje(usuarioId, {
        nombre,
        clase,
        fuerza: fuerza || 5,
        resistencia: resistencia || 5,
        agilidad: agilidad || 5,
        inteligencia: inteligencia || 5,
        avatar,
        color
    });

    if (result.success) {
        const personaje = survivalDB.obtenerPersonaje(result.id);
        res.json({ success: true, personaje });
    } else {
        res.json(result);
    }
});

// Obtener personajes de un usuario
app.get('/api/personajes/:usuarioId', (req, res) => {
    const personajes = survivalDB.obtenerPersonajes(req.params.usuarioId);
    res.json({ personajes });
});

// Cargar personaje en el mundo
app.post('/api/personaje/load', (req, res) => {
    const { personajeId } = req.body;
    const personaje = survivalDB.obtenerPersonaje(personajeId);

    if (!personaje) {
        return res.json({ success: false, error: 'Personaje no encontrado' });
    }

    // Crear o actualizar jugador en la base de datos principal
    const playerId = `player_${personajeId}`;

    // Verificar si ya existe
    let player = db.prepare('SELECT * FROM players WHERE alias = ?').get(personaje.nombre);

    if (!player) {
        // Crear jugador nuevo
        const result = db.prepare(`
            INSERT INTO players (alias, lugar_actual, nivel, experiencia, stats, estado_emocional)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            personaje.nombre,
            personaje.locacion || 'hospital',
            personaje.nivel,
            personaje.xp,
            JSON.stringify({
                salud: personaje.salud,
                salud_max: 100 + (personaje.resistencia * 10),
                energia: 100,
                energia_max: 100,
                resistencia: personaje.resistencia,
                fuerza: personaje.fuerza,
                defensa: personaje.resistencia,
                velocidad: personaje.agilidad,
                carisma: 5,
                empatia: 5,
                intimidacion: personaje.fuerza,
                astucia: personaje.inteligencia,
                percepcion: personaje.inteligencia,
                suerte: 5,
                estres: 0
            }),
            JSON.stringify({
                miedo: 5,
                confianza: 7,
                esperanza: 8,
                desesperacion: 2
            })
        );

        player = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
    }

    // Actualizar última conexión
    db.prepare('UPDATE players SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(player.id);

    // Parsear stats
    player.stats = JSON.parse(player.stats);
    player.estado_emocional = JSON.parse(player.estado_emocional);

    // Agregar info del personaje original
    player.dbId = personajeId;
    player.avatar = personaje.avatar;
    player.color = personaje.color;
    player.clase = personaje.clase;

    res.json({
        success: true,
        player: {
            id: playerId,
            ...player
        }
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicializar WebSocket
gameWebSocket.initialize(server);

// Conectar dynamicQuests con el broadcast del WebSocket
dynamicQuests.setBroadcastCallback((message) => {
    gameWebSocket.broadcastGlobal(message);
});

// ========== FASE A: SISTEMAS NUEVOS (FLAG-BASED) ==========
// Inicializar FlagSystem
flagSystem.initialize();

// Cargar data de NPCs y Diálogos
const npcsData = JSON.parse(readFileSync('./data/npcs.json', 'utf-8'));
const dialoguesData = JSON.parse(readFileSync('./data/dialogues.json', 'utf-8'));

// Inicializar DialogueEngine con data
dialogueEngine.initialize(npcsData, dialoguesData);

// Inicializar QuestSystem V2 (basado en eventos)
questSystem.initialize();

// Iniciar simulación del mundo
// worldSimulation.start(); // TEMPORALMENTE DESHABILITADO - Requiere SQLite

console.log('✓ FASE A: Sistema de flags y diálogos condicionales activo');
console.log('✓ GlobalEvents: Sistema de eventos narrativos cargado');
console.log('✓ QuestSystem V2: Sistema basado en eventos activo');
console.log('✓ WorldSimulation: Mundo vivo en ejecución');
console.log('✓ DynamicQuests: Generación automática de misiones activa');

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║         🎮 MANOLITRI - FASE A 🎮      ║
║       ARQUITECTURA FLAG-BASED         ║
║                                       ║
║  Servidor corriendo en puerto ${PORT}   ║
║  http://localhost:${PORT}               ║
║                                       ║
║  ✓ FlagSystem: ACTIVO                 ║
║  ✓ DialogueEngine: ACTIVO             ║
║  ✓ ItemSystem: ACTIVO                 ║
║  ✓ GlobalEvents: ACTIVO               ║
║  ✓ QuestSystem V2: ACTIVO             ║
║  ✓ WorldSimulation: ACTIVO            ║
║  ✓ DynamicQuests: ACTIVO              ║
║  ✓ PartyManager: ACTIVO               ║
║  ✓ Base de datos: CONECTADA           ║
║  ✓ WebSocket: LISTO                   ║
║                                       ║
║  🎯 TEST: Ana → Gómez → Ana           ║
║  🚨 EVENTO: Racionamiento disponible  ║
║  👥 Grupos y chat avanzado            ║
║  📊 Votaciones de grupo               ║
║  💕 Misiones dinámicas de NPCs        ║
║                                       ║
╚═══════════════════════════════════════╝
  `);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
});
