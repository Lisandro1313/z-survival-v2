/**
 * Sistema de WebSocket y comunicación con el servidor
 */

import { log } from '../utils/helpers.js';

let ws = null;
let pingInterval = null;
let reconnectTimeout = null;
let messageHandlers = {};

const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

/**
 * Registra handlers de mensajes
 */
export function registerMessageHandlers(handlers) {
    messageHandlers = { ...messageHandlers, ...handlers };
}

/**
 * Conecta al servidor WebSocket
 */
export function connect(playerId) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('Ya conectado al WebSocket');
        return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('✅ Conectado al servidor');
        log('Conectado al servidor', 'success');
        reconnectAttempts = 0;

        // Login
        send({ type: 'login', playerId });

        // Actualizar indicador de conexión
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.className = 'connection-status connected';
            statusEl.innerHTML = '🟢 Conectado';
        }

        // Ping cada 30 segundos
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                send({ type: 'ping' });
            }
        }, 30000);
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
    };

    ws.onclose = () => {
        log('Desconectado del servidor', 'warning');
        if (pingInterval) clearInterval(pingInterval);

        // Actualizar indicador
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.className = 'connection-status disconnected pulse';
            statusEl.innerHTML = '🔴 Desconectado';
        }

        // Reconexión con backoff exponencial
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 16000);
            log(`Reconectando en ${delay / 1000}s... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, 'warning');

            reconnectTimeout = setTimeout(() => {
                const playerId = localStorage.getItem('playerId');
                if (playerId) connect(playerId);
            }, delay);
        } else {
            log('❌ No se pudo reconectar. Recarga la página.', 'warning');
            if (statusEl) statusEl.innerHTML = '🔴 Sin conexión';
        }
    };

    ws.onerror = (error) => {
        console.error('Error de WebSocket:', error);
        log('Error de conexión', 'warning');
    };
}

/**
 * Envía un mensaje al servidor
 */
export function send(message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        log('No conectado al servidor', 'warning');
        return false;
    }

    ws.send(JSON.stringify(message));
    return true;
}

/**
 * Maneja mensajes entrantes
 */
function handleMessage(msg) {
    const messageType = msg.type || msg.tipo;
    const handler = messageHandlers[messageType];

    if (handler) {
        handler(msg);
    } else {
        console.warn('Handler no encontrado para mensaje:', messageType, msg);
    }
}

/**
 * Desconecta el WebSocket
 */
export function disconnect() {
    if (pingInterval) clearInterval(pingInterval);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (ws) {
        ws.close();
        ws = null;
    }
}

/**
 * Verifica si está conectado
 */
export function isConnected() {
    return ws && ws.readyState === WebSocket.OPEN;
}

/**
 * Obtiene el WebSocket actual (para casos especiales)
 */
export function getWebSocket() {
    return ws;
}
