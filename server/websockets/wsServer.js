/**
 * 📡 WEBSOCKET SERVER - Servidor WebSocket Separado
 * 
 * Maneja todas las conexiones en tiempo real:
 * - Conexión/desconexión de jugadores
 * - Movimiento entre nodos
 * - Combat updates
 * - Chat global/regional
 * - Eventos broadcast
 */

import { WebSocketServer } from 'ws';
import worldState from '../world/WorldState.js';
import aoiManager from './AOIManager.js';
import survivalDB from '../db/survivalDB.js';
import { authenticateWebSocket } from '../middleware/auth.js';
import { extractTokenFromHeader } from '../utils/jwt.js';
import { tradingSystem } from '../systems/TradingSystem.js';
import { notificationSystem } from '../systems/NotificationSystem.js';

// Handlers modulares
import { handlePlayerMovement } from './handlers/movement.handler.js';
import { handleChatMessage } from './handlers/chat.handler.js';
import { handleCombatAction } from './handlers/combat.handler.js';
import radioHandler from './handlers/radio.handler.js';
import communicationService from '../services/CommunicationService.js';

export class WSServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.setupEventHandlers();
    this.setupTradingEvents();
    this.setupNotificationEvents();
    
    console.log('📡 WebSocket Server inicializado');
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  setupTradingEvents() {
    // Event listeners para trading system
    tradingSystem.on('trade:created', (trade) => {
      this.broadcastToPlayer(trade.targetId, {
        type: 'trade:offer_received',
        trade
      });
      this.broadcastToPlayer(trade.initiatorId, {
        type: 'trade:offer_sent',
        trade
      });

      // Enviar notificación
      notificationSystem.notify(trade.targetId, {
        type: 'info',
        category: 'trade',
        priority: 'normal',
        title: '🤝 Nueva Oferta de Trade',
        message: `Recibiste una oferta de intercambio`,
        data: { tradeId: trade.id },
        actions: [
          { label: 'Ver', action: 'view_trade', data: { tradeId: trade.id } }
        ]
      });
    });

    tradingSystem.on('trade:accepted', (trade) => {
      this.broadcastToPlayer(trade.initiatorId, {
        type: 'trade:accepted',
        trade
      });
      this.broadcastToPlayer(trade.targetId, {
        type: 'trade:accepted',
        trade
      });

      notificationSystem.notify(trade.initiatorId, {
        type: 'success',
        category: 'trade',
        title: '✅ Trade Aceptado',
        message: 'Tu oferta fue aceptada. Confirma para completar.',
        data: { tradeId: trade.id }
      });
    });

    tradingSystem.on('trade:confirmed', ({ trade, playerId }) => {
      const otherPlayerId = playerId === trade.initiatorId ? trade.targetId : trade.initiatorId;
      this.broadcastToPlayer(otherPlayerId, {
        type: 'trade:partner_confirmed',
        trade,
        confirmedBy: playerId
      });
    });

    tradingSystem.on('trade:completed', (trade) => {
      this.broadcastToPlayer(trade.initiatorId, {
        type: 'trade:completed',
        trade
      });
      this.broadcastToPlayer(trade.targetId, {
        type: 'trade:completed',
        trade
      });

      // Notificaciones de éxito
      notificationSystem.notifyMultiple([trade.initiatorId, trade.targetId], {
        type: 'success',
        category: 'trade',
        priority: 'high',
        title: '🎉 Trade Completado',
        message: '¡Intercambio exitoso!',
        data: { tradeId: trade.id }
      });
    });

    tradingSystem.on('trade:cancelled', ({ trade, reason }) => {
      this.broadcastToPlayer(trade.initiatorId, {
        type: 'trade:cancelled',
        trade,
        reason
      });
      this.broadcastToPlayer(trade.targetId, {
        type: 'trade:cancelled',
        trade,
        reason
      });

      // Notificación de cancelación
      notificationSystem.notifyMultiple([trade.initiatorId, trade.targetId], {
        type: 'warning',
        category: 'trade',
        title: '❌ Trade Cancelado',
        message: `Trade cancelado: ${reason}`,
        data: { tradeId: trade.id, reason }
      });
    });

    tradingSystem.on('trade:rejected', (trade) => {
      this.broadcastToPlayer(trade.initiatorId, {
        type: 'trade:rejected',
        trade
      });

      notificationSystem.notify(trade.initiatorId, {
        type: 'error',
        category: 'trade',
        title: '❌ Trade Rechazado',
        message: 'Tu oferta fue rechazada',
        data: { tradeId: trade.id }
      });
    });

    console.log('🤝 Trading System events conectados a WebSocket');
  }

  setupNotificationEvents() {
    // Event listeners para notification system
    notificationSystem.on('notification', ({ playerId, notification }) => {
      this.broadcastToPlayer(playerId, {
        type: 'notification:new',
        notification
      });
    });

    notificationSystem.on('notification:read', ({ playerId, notificationId }) => {
      this.broadcastToPlayer(playerId, {
        type: 'notification:read',
        notificationId
      });
    });

    notificationSystem.on('notification:read_all', ({ playerId }) => {
      this.broadcastToPlayer(playerId, {
        type: 'notification:read_all'
      });
    });

    console.log('🔔 Notification System events conectados a WebSocket');
  }

  broadcastToPlayer(playerId, message) {
    this.wss.clients.forEach(client => {
      if (client.userId === playerId && client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }

  handleConnection(ws, req) {
    console.log('🔌 Nueva conexión WebSocket');
    
    let playerId = null;
    let playerName = null;
    let authenticated = false;
    
    // Intentar autenticar desde query params o headers
    const url = new URL(req.url, `ws://${req.headers.host}`);
    const tokenFromQuery = url.searchParams.get('token');
    const tokenFromHeader = extractTokenFromHeader(req.headers.authorization);
    const token = tokenFromQuery || tokenFromHeader;
    
    // Si hay token, autenticar inmediatamente
    if (token) {
      const authResult = authenticateWebSocket(ws, token);
      if (authResult.authenticated) {
        authenticated = true;
        playerId = authResult.userId;
        playerName = authResult.username;
        console.log(`✅ WebSocket pre-autenticado: ${playerName} (${playerId})`);
      } else {
        console.log(`❌ WebSocket token inválido:`, authResult.error);
      }
    }

    // ====================================
    // MESSAGE HANDLER
    // ====================================
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Routing de mensajes
        switch (message.type) {
          // ====================================
          // AUTENTICACIÓN (con JWT o legacy)
          // ====================================
          
          case 'auth':
          case 'authenticate':
            // Si ya está autenticado con JWT, ignorar
            if (authenticated && playerId) {
              ws.send(JSON.stringify({
                type: 'authenticated',
                playerId,
                playerName,
                message: 'Already authenticated via JWT'
              }));
              break;
            }
            
            // Autenticación con JWT token
            if (message.token) {
              const authResult = authenticateWebSocket(ws, message.token);
              
              if (!authResult.authenticated) {
                ws.send(JSON.stringify({
                  type: 'auth_error',
                  error: authResult.error,
                  expired: authResult.expired
                }));
                break;
              }
              
              playerId = authResult.userId;
              playerName = authResult.username;
              authenticated = true;
            } 
            // Autenticación legacy (por playerId)
            else {
              playerId = message.playerId || message.personajeId;
              playerName = message.playerName || message.nombre;
              authenticated = true;
            }
            
            // Registrar conexión en AOI
            aoiManager.registerConnection(playerId, ws);
            
            // Obtener jugador
            let player = worldState.getPlayer(playerId);
            
            if (!player) {
              // Cargar de DB
              player = survivalDB.obtenerPersonaje(playerId);
              if (player) {
                player.inventario = JSON.parse(player.inventario || '{}');
                player.stats = JSON.parse(player.stats || '{}');
                player.skills = JSON.parse(player.skills || '{}');
                player.online = true;
                player.lastSeen = Date.now();
                player.nodeId = player.ubicacion || 'refugio';
                
                worldState.addPlayer(player);
              }
            }
            
            if (player) {
              player.online = true;
              
              // Suscribir a su nodo actual
              aoiManager.subscribe(playerId, player.nodeId);
              
              // Enviar confirmación
              ws.send(JSON.stringify({
                type: 'authenticated',
                playerId,
                player
              }));
              
              // Notificar a otros en el nodo
              aoiManager.broadcastToNode(player.nodeId, {
                type: 'player:joined',
                player: {
                  id: player.id,
                  nombre: player.nombre,
                  nivel: player.nivel,
                  clase: player.clase
                }
              }, playerId);
              
              console.log(`✅ ${playerName} autenticado (${playerId})`);
            }
            break;

          // ====================================
          // MOVIMIENTO
          // ====================================
          
          case 'move':
          case 'move_to_node':
            await handlePlayerMovement(playerId, message, ws, aoiManager);
            break;

          // ====================================
          // CHAT
          // ====================================
          
          case 'chat':
          case 'chat_message':
            await handleChatMessage(playerId, message, aoiManager);
            break;

          // ====================================
          // COMBATE
          // ====================================
          
          case 'combat':
          case 'attack':
          case 'shoot':
            await handleCombatAction(playerId, message, aoiManager);
            break;

          // ====================================
          // RADIO / COMUNICACIÓN
          // ====================================
          
          case 'radio:equip':
            radioHandler.handleRadioEquip(ws, playerId, message);
            break;
          
          case 'radio:unequip':
            radioHandler.handleRadioUnequip(ws, playerId);
            break;
          
          case 'radio:join':
            radioHandler.handleRadioJoin(ws, playerId, message);
            break;
          
          case 'radio:leave':
            radioHandler.handleRadioLeave(ws, playerId, message);
            break;
          
          case 'radio:message':
            radioHandler.handleRadioMessage(ws, playerId, message);
            break;
          
          case 'radio:private':
            radioHandler.handleRadioPrivate(ws, playerId, message);
            break;
          
          case 'radio:scan':
            radioHandler.handleRadioScan(ws, playerId, message);
            break;
          
          case 'radio:frequencies':
            radioHandler.handleRadioFrequencies(ws, playerId);
            break;
          
          case 'radio:battery':
            radioHandler.handleRadioBattery(ws, playerId, message);
            break;
          
          case 'radio:recharge':
            radioHandler.handleRadioRecharge(ws, playerId, message);
            break;
          
          case 'radio:status':
            radioHandler.handleRadioStatus(ws, playerId);
            break;

          // 🔐 RADIO ENCRYPTION
          
          case 'radio:create_encrypted':
            radioHandler.handleRadioCreateEncrypted(ws, playerId, message);
            break;
          
          case 'radio:share_key':
            radioHandler.handleRadioShareKey(ws, playerId, message);
            break;
          
          case 'radio:encrypted_channels':
            radioHandler.handleRadioEncryptedChannels(ws, playerId);
            break;
          
          case 'radio:rotate_key':
            radioHandler.handleRadioRotateKey(ws, playerId, message);
            break;
          
          case 'radio:delete_encrypted':
            radioHandler.handleRadioDeleteEncrypted(ws, playerId, message);
            break;

          // ====================================
          // SCAVENGE
          // ====================================
          
          case 'scavenge': {
            const player = worldState.getPlayer(playerId);
            if (!player) break;
            
            const node = worldState.getNode(player.nodeId);
            if (!node || !node.recursos) break;
            
            // Lógica simple de scavenge
            const foundItems = {};
            Object.keys(node.recursos).forEach(resource => {
              if (node.recursos[resource] > 0 && Math.random() > 0.5) {
                const amount = Math.floor(Math.random() * 3) + 1;
                const taken = Math.min(amount, node.recursos[resource]);
                
                node.recursos[resource] -= taken;
                player.inventario[resource] = (player.inventario[resource] || 0) + taken;
                foundItems[resource] = taken;
              }
            });
            
            // Responder
            ws.send(JSON.stringify({
              type: 'scavenge:result',
              success: Object.keys(foundItems).length > 0,
              items: foundItems
            }));
            
            // Persistir
            survivalDB.updatePlayer(playerId, player);
            break;
          }

          // ====================================
          // CRAFT
          // ====================================
          
          case 'craft':
            // TODO: Implementar lógica de crafteo
            ws.send(JSON.stringify({
              type: 'craft:result',
              success: false,
              message: 'Sistema de crafteo en desarrollo'
            }));
            break;

          // ====================================
          // CONSTRUCCIÓN (FASE 12)
          // ====================================
          
          case 'get_structures':
          case 'start_construction':
          case 'contribute_construction':
          case 'get_construction_projects':
          case 'get_refuge_effects':
            // Delegar a sistema de construcción existente
            try {
              const { default: constructionSystem } = await import('../systems/ConstructionSystem.js');
              // El sistema ya maneja estos mensajes
              console.log(`🏗️ Construction: ${message.type}`);
            } catch (error) {
              console.error('Error en construction:', error);
            }
            break;

          // ====================================
          // EVENTOS GLOBALES (FASE 11)
          // ====================================
          
          case 'get_active_events':
          case 'get_dynamic_quests':
          case 'accept_quest':
          case 'complete_quest':
          case 'cancel_quest':
            // Delegar a sistemas de eventos
            console.log(`⚡ Event: ${message.type}`);
            break;

          // ====================================
          // QUERIES
          // ====================================
          
          case 'get_player_data': {
            const playerData = worldState.getPlayer(playerId);
            ws.send(JSON.stringify({
              type: 'player_data',
              player: playerData
            }));
            break;
          }

          case 'get_node_data': {
            const nodeData = worldState.getNode(message.nodeId);
            const playersInNode = worldState.getPlayersInNode(message.nodeId);
            const npcsInNode = worldState.getNPCsInNode(message.nodeId);
            
            ws.send(JSON.stringify({
              type: 'node_data',
              node: nodeData,
              players: playersInNode,
              npcs: npcsInNode
            }));
            break;
          }

          // ====================================
          // TRADING
          // ====================================
          
          case 'trade:get_active': {
            const trades = tradingSystem.getActiveTrades(playerId);
            ws.send(JSON.stringify({
              type: 'trade:active_list',
              trades
            }));
            break;
          }

          case 'trade:get_history': {
            const history = tradingSystem.getTradeHistory(playerId, 20);
            ws.send(JSON.stringify({
              type: 'trade:history',
              history
            }));
            break;
          }

          case 'trade:get_stats': {
            const stats = tradingSystem.getPlayerTradeStats(playerId);
            ws.send(JSON.stringify({
              type: 'trade:stats',
              stats
            }));
            break;
          }

          default:
            console.warn(`⚠️ Tipo de mensaje no manejado: ${message.type}`);
            ws.send(JSON.stringify({
              type: 'error',
              message: `Tipo de mensaje desconocido: ${message.type}`
            }));
        }

      } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error procesando mensaje'
        }));
      }
    });

    // ====================================
    // CLOSE HANDLER
    // ====================================
    
    ws.on('close', () => {
      if (playerId) {
        console.log(`🔌 ${playerName} desconectado`);
        
        const player = worldState.getPlayer(playerId);
        if (player) {
          player.online = false;
          player.lastSeen = Date.now();
          
          // Notificar a otros en el nodo
          aoiManager.broadcastToNode(player.nodeId, {
            type: 'player:left',
            playerId,
            playerName
          });
          
          // Persistir estado
          survivalDB.updatePlayer(playerId, player);
        }
        
        // Cleanup de comunicación (frecuencias, scanners, canales privados)
        communicationService.onPlayerDisconnect(playerId);
        
        // Desregistrar de AOI
        aoiManager.unregisterConnection(playerId);
      }
    });

    // ====================================
    // ERROR HANDLER
    // ====================================
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  // ====================================
  // BROADCAST METHODS
  // ====================================

  broadcastToAll(message) {
    return aoiManager.broadcastGlobal(message);
  }

  broadcastToNode(nodeId, message) {
    return aoiManager.broadcastToNode(nodeId, message);
  }

  sendToPlayer(playerId, message) {
    return aoiManager.sendToPlayer(playerId, message);
  }
}

export default WSServer;
