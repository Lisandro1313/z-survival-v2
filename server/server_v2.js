/**
 * 🚀 SERVER V2 - Punto de Entrada con Nueva Arquitectura
 * 
 * Inicia el servidor completo:
 * - HTTP Server (Express)
 * - WebSocket Server
 * - WorldState & TickEngine
 * - Sistemas avanzados (FASE 11-12)
 */

import http from 'http';
import app, { initializeApp } from './app.js';
import WSServer from './websockets/wsServer.js';
import aoiManager from './websockets/AOIManager.js';
import tickEngine from './world/TickEngine.js';

const PORT = process.env.PORT || 3000;

// ====================================
// SERVER INITIALIZATION
// ====================================

async function startServer() {
  try {
    console.log('═'.repeat(60));
    console.log('🧟 Z-SURVIVAL v2.0 - Nueva Arquitectura Escalable');
    console.log('═'.repeat(60));

    // 1. Inicializar aplicación (DB, WorldState, Regiones, etc.)
    await initializeApp();

    // 2. Crear servidor HTTP
    const server = http.createServer(app);

    // 3. Inicializar WebSocket Server
    const wsServer = new WSServer(server);

    // 4. Configurar TickEngine callbacks para broadcast
    tickEngine.onBroadcast = (message) => {
      // Broadcast a través de AOI Manager
      if (message.nodeId) {
        aoiManager.broadcastToNode(message.nodeId, message);
      } else if (message.global) {
        aoiManager.broadcastGlobal(message);
      }
    };

    // 5. Iniciar servidor
    server.listen(PORT, () => {
      console.log('\n' + '═'.repeat(60));
      console.log(`✅ Servidor HTTP escuchando en puerto ${PORT}`);
      console.log(`📡 WebSocket Server activo`);
      console.log(`⏱️  TickEngine corriendo (${tickEngine.tickRate}ms)`);
      console.log(`🌍 WorldState inicializado`);
      console.log(`🗺️  RegionManager activo`);
      console.log(`📊 AOI Manager funcionando`);
      console.log('═'.repeat(60));
      console.log(`\n🎮 Juego disponible en: http://localhost:${PORT}`);
      console.log(`\n💡 Endpoints API:`);
      console.log(`   - GET  /api/world          - Estado del mundo`);
      console.log(`   - GET  /api/world/nodes    - Lista de nodos`);
      console.log(`   - GET  /api/player/list/online - Jugadores online`);
      console.log(`   - POST /api/auth/register  - Registrar usuario`);
      console.log(`   - POST /api/auth/login     - Login`);
      console.log('\n📡 WebSocket: ws://localhost:' + PORT);
      console.log('═'.repeat(60) + '\n');

      // Debug stats cada 60 segundos
      setInterval(() => {
        const stats = aoiManager.getStats();
        console.log(`\n📊 Stats: ${stats.totalConnections} conexiones | ${stats.totalSubscriptions} nodos activos`);
      }, 60000);
    });

    // ====================================
    // ERROR HANDLING
    // ====================================

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Error: Puerto ${PORT} ya está en uso`);
        console.log(`💡 Solución: Cambia el puerto con PORT=3001 node server/server_v2.js`);
      } else {
        console.error('❌ Error del servidor:', error);
      }
      process.exit(1);
    });

    // ====================================
    // GRACEFUL SHUTDOWN
    // ====================================

    const gracefulShutdown = () => {
      console.log('\n🛑 Iniciando shutdown graceful...');
      
      // 1. Detener TickEngine
      console.log('⏱️  Deteniendo TickEngine...');
      tickEngine.stop();
      
      // 2. Cerrar WebSocket connections
      console.log('📡 Cerrando conexiones WebSocket...');
      wsServer.wss.clients.forEach(client => {
        client.close();
      });
      
      // 3. Cerrar servidor HTTP
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
      
      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️  Forzando cierre...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Error fatal iniciando servidor:', error);
    process.exit(1);
  }
}

// ====================================
// START
// ====================================

startServer();
