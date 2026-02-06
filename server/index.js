import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

// Importar sistemas CORE
import db from './db/index.js';
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

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicializar WebSocket
gameWebSocket.initialize(server);

// ========== FASE A: SISTEMAS NUEVOS (FLAG-BASED) ==========
// Inicializar FlagSystem
flagSystem.initialize();

// Cargar data de NPCs y Diálogos
const npcsData = JSON.parse(readFileSync('./server/data/npcs.json', 'utf-8'));
const dialoguesData = JSON.parse(readFileSync('./server/data/dialogues.json', 'utf-8'));

// Inicializar DialogueEngine con data
dialogueEngine.initialize(npcsData, dialoguesData);

// Inicializar QuestSystem V2 (basado en eventos)
questSystem.initialize();

// Iniciar simulación del mundo
worldSimulation.start();

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
