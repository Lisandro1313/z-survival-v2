/**
 * 🚀 APP.JS - Servidor HTTP Limpio y Modular
 * 
 * Nueva arquitectura escalable con:
 * - Routes separados
 * - Controllers
 * - Middlewares
 * - WorldState en memoria
 * - Preparado para sharding
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.routes.js';
import playerRoutes from './routes/player.routes.js';
import worldRoutes from './routes/world.routes.js';
import tradeRoutes from './routes/trade.routes.js';
import notificationRoutes from './routes/notification.routes.js';

// World Systems
import worldState from './world/WorldState.js';
import regionManager from './world/RegionManager.js';
import tickEngine from './world/TickEngine.js';
import { tradingSystem } from './systems/TradingSystem.js';
import { notificationSystem } from './systems/NotificationSystem.js';

// Database
import survivalDB from './db/survivalDB.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================================
// EXPRESS APP SETUP
// ====================================

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (si es necesario)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ====================================
// API ROUTES
// ====================================

app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/world', worldRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/notifications', notificationRoutes);

// ====================================
// LEGACY ROUTES (Compatibilidad)
// ====================================

// Para mantener compatibilidad con código antiguo
app.post('/api/personaje/crear', (req, res) => {
  // Redirect to new route
  req.url = '/api/auth/character/create';
  authRoutes(req, res);
});

app.post('/api/personaje/load', (req, res) => {
  req.url = '/api/auth/character/load';
  authRoutes(req, res);
});

app.get('/api/personajes/:usuarioId', (req, res) => {
  req.url = `/api/auth/characters/${req.params.usuarioId}`;
  authRoutes(req, res);
});

app.get('/api/players/online', (req, res) => {
  req.url = '/api/player/list/online';
  playerRoutes(req, res);
});

app.get('/api/stats', (req, res) => {
  req.url = '/api/world/stats';
  worldRoutes(req, res);
});

// ====================================
// ERROR HANDLING
// ====================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path
  });
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  
  res.status(error.status || 500).json({
    error: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ====================================
// INITIALIZATION
// ====================================

export async function initializeApp() {
  try {
    console.log('\n🚀 Inicializando Z-Survival v2.0...\n');

    // 1. Inicializar base de datos
    console.log('📦 Inicializando base de datos...');
    survivalDB.initialize();

    // 2. Cargar nodos en WorldState
    console.log('🌍 Cargando mapa del mundo...');
    await loadWorldNodes();

    // 3. Inicializar regiones
    console.log('🗺️ Inicializando RegionManager...');
    regionManager.initializeRegions();

    // 4. Iniciar TickEngine
    console.log('⏱️ Iniciando TickEngine...');
    tickEngine.start();

    // 5. Cargar sistemas FASE 11-12
    console.log('⚡ Cargando sistemas avanzados (FASE 11-12)...');
    await loadAdvancedSystems();

    // 6. Inicializar Trading System
    console.log('🤝 Trading System inicializado');
    // tradingSystem ya está inicializado como singleton

    // 7. Inicializar Notification System
    console.log('🔔 Notification System inicializado');
    // notificationSystem ya está inicializado como singleton

    console.log('\n✅ Servidor inicializado correctamente\n');
    
    // Debug stats
    worldState.debugLog();
    regionManager.debugLog();

  } catch (error) {
    console.error('❌ Error iniciando aplicación:', error);
    throw error;
  }
}

// ====================================
// WORLD DATA LOADING
// ====================================

async function loadWorldNodes() {
  // Definir nodos del mapa (migrado desde survival_mvp.js)
  const nodes = [
    {
      id: 'refugio',
      nombre: 'Refugio Central',
      tipo: 'safe',
      descripcion: 'Un edificio fortificado. Hay gente aquí.',
      recursos: { comida: 20, medicinas: 5, armas: 2, materiales: 10 },
      recursosMax: { comida: 50, medicinas: 20, armas: 10, materiales: 30 },
      zombies: 0,
      nivelRuido: 0,
      defensas: 50,
      conectado_a: ['supermercado', 'farmacia', 'casa_abandonada', 'hospital', 'comisaria'],
      regionId: 'norte'
    },
    {
      id: 'supermercado',
      nombre: 'Supermercado Saqueado',
      tipo: 'loot',
      descripcion: 'Estanterías vacías. Algo de comida queda.',
      recursos: { comida: 15, materiales: 5 },
      recursosMax: { comida: 40, materiales: 15 },
      zombies: 3,
      nivelRuido: 0,
      defensas: 0,
      conectado_a: ['refugio', 'farmacia'],
      regionId: 'norte'
    },
    {
      id: 'farmacia',
      nombre: 'Farmacia Abandonada',
      tipo: 'loot',
      descripcion: 'Medicinas raras. Olor a podredumbre.',
      recursos: { medicinas: 12, comida: 3 },
      recursosMax: { medicinas: 30, comida: 10 },
      zombies: 2,
      nivelRuido: 0,
      defensas: 0,
      conectado_a: ['refugio', 'supermercado', 'hospital'],
      regionId: 'norte'
    },
    {
      id: 'casa_abandonada',
      nombre: 'Casa Abandonada',
      tipo: 'loot',
      descripcion: 'Una vivienda familiar. Silencio inquietante.',
      recursos: { comida: 8, materiales: 10, armas: 1 },
      recursosMax: { comida: 20, materiales: 25, armas: 3 },
      zombies: 1,
      nivelRuido: 0,
      defensas: 0,
      conectado_a: ['refugio'],
      regionId: 'centro'
    },
    {
      id: 'hospital',
      nombre: 'Hospital',
      tipo: 'danger',
      descripcion: 'Pasillos oscuros. Muchas medicinas... y zombies.',
      recursos: { medicinas: 25, materiales: 5, armas: 2 },
      recursosMax: { medicinas: 60, materiales: 15, armas: 5 },
      zombies: 8,
      nivelRuido: 0,
      defensas: 0,
      conectado_a: ['refugio', 'farmacia'],
      regionId: 'sur'
    },
    {
      id: 'comisaria',
      nombre: 'Comisaría',
      tipo: 'danger',
      descripcion: 'Armas y munición. Altamente defendida antes del colapso.',
      recursos: { armas: 10, medicinas: 3, materiales: 8 },
      recursosMax: { armas: 25, medicinas: 10, materiales: 20 },
      zombies: 5,
      nivelRuido: 0,
      defensas: 0,
      conectado_a: ['refugio'],
      regionId: 'sur'
    }
  ];

  // Agregar nodos a WorldState
  nodes.forEach(node => {
    worldState.addNode(node);
  });

  console.log(`   ✅ ${nodes.length} nodos cargados`);
}

async function loadAdvancedSystems() {
  try {
    // Importación dinámica de GlobalEvents, DynamicQuests, ConstructionSystem
    const { default: globalEvents } = await import('./world/globalEvents.js');
    const { default: dynamicQuests } = await import('./world/dynamicQuests.js');
    const { default: constructionSystem } = await import('./systems/ConstructionSystem.js');

    // Configurar callbacks si es necesario
    if (constructionSystem && constructionSystem.setBroadcastCallback) {
      constructionSystem.setBroadcastCallback((message) => {
        // Broadcast será manejado por wsServer
        console.log('🏗️ Construction broadcast:', message.type);
      });
    }

    // Configurar cleanup de trades expirados (cada 1 minuto)
    setInterval(() => {
      tradingSystem.cleanupExpiredTrades();
    }, 60000);

    // Configurar cleanup de notificaciones (cada 5 minutos)
    setInterval(() => {
      notificationSystem.cleanupExpired();
    }, 5 * 60000);

    // Cleanup de notificaciones viejas (cada hora)
    setInterval(() => {
      notificationSystem.cleanupOldRead();
    }, 60 * 60000);

    console.log('   ✅ GlobalEvents, DynamicQuests, ConstructionSystem cargados');

  } catch (error) {
    console.warn('   ⚠️ Error cargando sistemas avanzados:', error.message);
  }
}

// ====================================
// GRACEFUL SHUTDOWN
// ====================================

process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  
  // Detener TickEngine
  tickEngine.stop();
  
  // Persistir jugadores online
  const onlinePlayers = worldState.getOnlinePlayers();
  onlinePlayers.forEach(player => {
    survivalDB.updatePlayer(player.id, player);
  });
  
  console.log('✅ Servidor cerrado correctamente');
  process.exit(0);
});

export default app;
