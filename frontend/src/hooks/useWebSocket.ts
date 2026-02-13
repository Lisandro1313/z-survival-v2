/**
 * 📡 WEBSOCKET HOOK
 * 
 * Hook custom para manejar conexión WebSocket con el servidor
 * - Auto-reconexión
 * - Message routing
 * - Integración con store
 * - JWT Authentication
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore, getAccessToken } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import type { WSMessage, RadioMessage } from '../types';

const WS_URL = import.meta.env.DEV 
  ? 'ws://localhost:3000' 
  : `ws://${window.location.host}`;

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const heartbeatInterval = useRef<NodeJS.Timeout>();

  const {
    player,
    setPlayer,
    setCurrentNode,
    updateOnlinePlayers,
    addRadioMessage,
    setEquippedRadio,
    addNotification,
  } = useGameStore();

  const { handleWebSocketNotification } = useNotificationStore();

  // ====================================
  // MESSAGE HANDLER
  // ====================================

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      console.log('📡 WS Message:', message.type, message);

      switch (message.type) {
        // ====================================
        // AUTH
        // ====================================
        
        case 'authenticated':
          console.log('✅ Authenticated successfully');
          if (message.player) {
            setPlayer(message.player);
          }
          addNotification({
            type: 'success',
            message: 'Conectado al servidor',
          });
          break;

        // ====================================
        // PLAYER UPDATES
        // ====================================

        case 'player:joined':
          console.log(`👤 ${message.player?.nombre} joined`);
          addNotification({
            type: 'info',
            message: `${message.player?.nombre} se unió al nodo`,
          });
          break;

        case 'player:left':
          console.log(`👤 Player ${message.playerId} left`);
          break;

        case 'player:moved':
          console.log(`🚶 Player moved to ${message.nodeId}`);
          break;

        // ====================================
        // CHAT / RADIO
        // ====================================

        case 'chat:local':
        case 'chat:radio':
        case 'chat:private':
        case 'chat:intercepted':
          addRadioMessage(message as RadioMessage);
          break;

        // ====================================
        // RADIO STATUS
        // ====================================

        case 'radio:equipped':
          setEquippedRadio(message.radio);
          addNotification({
            type: 'success',
            message: `Radio equipado: ${message.radio.name}`,
          });
          break;

        case 'radio:unequipped':
          setEquippedRadio(null);
          addNotification({
            type: 'info',
            message: 'Radio desequipado',
          });
          break;

        case 'radio:joined':
          addNotification({
            type: 'success',
            message: `Sintonizado a ${message.frequency}`,
          });
          break;

        case 'radio:left':
          addNotification({
            type: 'info',
            message: `Desconectado de ${message.frequency}`,
          });
          break;

        case 'radio:sent':
          console.log(`📻 Mensaje enviado (${message.recipients} receptores)`);
          if (message.intercepted) {
            addNotification({
              type: 'warning',
              message: '⚠️ Tu mensaje pudo ser interceptado',
            });
          }
          break;

        case 'radio:battery_replaced':
          setEquippedRadio(message.radio);
          addNotification({
            type: 'success',
            message: '🔋 Batería reemplazada',
          });
          break;

        case 'radio:recharged':
          setEquippedRadio(message.radio);
          addNotification({
            type: 'success',
            message: `🔋 Recargado al ${message.radio.batteryPercent}%`,
          });
          break;

        case 'radio:scan_enabled':
          addNotification({
            type: 'info',
            message: '🔍 Scanner activado',
          });
          break;

        case 'radio:frequencies':
          console.log('📻 Frecuencias activas:', message.frequencies);
          break;
NOTIFICATIONS
        // ====================================

        case 'notification:new':
        case 'notification:read':
        case 'notification:read_all':
          handleWebSocketNotification(message);
          break;

        // ====================================
        // 
        // ====================================
        // ERRORS
        // ====================================

        case 'error':
          console.error('❌ Server error:', message.error);
          addNotification({
            type: 'error',
            message: message.error || 'Error del servidor',
          });
          break;

        default:
          console.warn('⚠️ Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error parsing WS message:', error);
    }
  }, [setPlayer, setCurrentNode, updateOnlinePlayers, addRadioMessage, setEquippedRadio, addNotification]);

  // ====================================
  // CONNECTION MANAGEMENT
  // ====================================

  const connect = useCallback(() => {
    if (!player) {
      console.warn('⚠️ Cannot connect: No player data');
      return;
    }

    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    console.log('📡 Connecting to WebSocket...');
    
    // Obtener JWT token
    const accessToken = getAccessToken();
    
    // Construir URL con JWT si está disponible
    const wsUrl = accessToken 
      ? `${WS_URL}?token=${encodeURIComponent(accessToken)}`
      : WS_URL;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('✅ WebSocket connected');
      
      // Si no hay JWT en URL, autenticar por mensaje (fallback)
      if (!accessToken) {
        ws.current?.send(JSON.stringify({
          type: 'auth',
          playerId: player.id,
          playerName: player.username,
        }));
      }

      // Start heartbeat
      heartbeatInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Every 30 seconds
    };

    ws.current.onmessage = handleMessage;

    ws.current.onclose = (event) => {
      console.log('🔌 WebSocket disconnected', event.code);
      
      // Clear heartbeat
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }

      // Auto-reconnect after 3 seconds
      if (event.code !== 1000) { // Not a clean close
        reconnectTimeout.current = setTimeout(() => {
          console.log('♻️ Attempting to reconnect...');
          connect();
        }, 3000);
      }
    };

    ws.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      addNotification({
        type: 'error',
        message: 'Error de conexión con el servidor',
      });
    };
  }, [player, handleMessage, addNotification]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...');
    
    // Clear timers
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    // Close connection
    if (ws.current) {
      ws.current.close(1000, 'Client disconnect');
      ws.current = null;
    }
  }, []);

  // ====================================
  // SEND METHODS
  // ====================================

  const send = useCallback((message: WSMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not open, cannot send message');
    }
  }, []);

  // ====================================
  // CLEANUP
  // ====================================

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    send,
    isConnected: ws.current?.readyState === WebSocket.OPEN,
  };
}
