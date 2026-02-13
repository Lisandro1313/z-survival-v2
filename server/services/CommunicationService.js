/**
 * 📡 COMMUNICATION SERVICE
 * 
 * Sistema de comunicación por frecuencias:
 * - Gestión de canales/frecuencias
 * - Broadcast por alcance (local, regional, global)
 * - Interceptación y espionaje
 * - Comunicación privada (P2P)
 * - Integración con AOI Manager
 */

import worldState from '../world/WorldState.js';
import aoiManager from '../websockets/AOIManager.js';
import { RADIO_TYPES } from '../models/RadioDevice.js';

class CommunicationService {
  constructor() {
    // Frecuencias activas: Map<frequency, Set<playerId>>
    this.frequencies = new Map();
    
    // Canales privados: Map<channelId, Set<playerId>>
    this.privateChannels = new Map();
    
    // Scanner activos: Set<playerId> (pueden interceptar)
    this.activeScanners = new Set();
    
    // Historial reciente para detección de patrones
    this.messageHistory = [];
    this.MAX_HISTORY = 1000;
    
    // Interferencias (eventos especiales)
    this.interferences = new Map(); // nodeId -> intensity (0-1)
  }

  /**
   * 1️⃣ COMUNICACIÓN LOCAL (sin dispositivo)
   * Solo jugadores en el mismo nodo
   */
  sendLocalMessage(senderId, text) {
    const player = worldState.getPlayer(senderId);
    if (!player) {
      return { success: false, error: 'Jugador no encontrado' };
    }

    const nodeId = player.currentNode;
    if (!nodeId) {
      return { success: false, error: 'Jugador no está en ningún nodo' };
    }

    // Obtener jugadores en el mismo nodo
    const playersInNode = worldState.getPlayersInNode(nodeId);
    
    const message = {
      type: 'chat:local',
      senderId,
      senderName: player.username,
      nodeId,
      text,
      timestamp: Date.now(),
      range: 'local',
    };

    // Broadcast solo a ese nodo
    aoiManager.broadcastToNode(nodeId, message);

    this._addToHistory(message);

    return { 
      success: true, 
      recipients: playersInNode.size,
      message,
    };
  }

  /**
   * 2️⃣ COMUNICACIÓN POR FRECUENCIA (walkie-talkie)
   */
  sendRadioMessage(senderId, frequency, text) {
    const player = worldState.getPlayer(senderId);
    if (!player) {
      return { success: false, error: 'Jugador no encontrado' };
    }

    // Verificar que tiene radio equipado
    if (!player.equippedRadio) {
      return { success: false, error: 'No tienes radio equipado' };
    }

    const radio = player.equippedRadio;

    // Verificar batería
    if (radio.batteryCharge <= 0) {
      return { success: false, error: 'Batería agotada' };
    }

    // Verificar que está sintonizado a esa frecuencia
    if (!radio.activeChannels.includes(frequency)) {
      return { success: false, error: `No estás sintonizado a ${frequency}` };
    }

    // Consumir batería por transmisión
    radio.consumeBattery(0.1); // 0.1 minutos = 6 segundos

    // Aplicar interferencia si existe
    const interference = this.interferences.get(player.currentNode) || 0;
    const garbled = interference > 0.5;

    const message = {
      type: 'chat:radio',
      senderId,
      senderName: player.username,
      frequency,
      text: garbled ? this._garbleText(text) : text,
      range: radio.range,
      encryption: radio.encryption,
      timestamp: Date.now(),
      garbled,
    };

    // Broadcast a jugadores sintonizados en esa frecuencia
    const recipients = this._broadcastToFrequency(frequency, message, radio.range, player);

    // Interceptación
    const intercepted = this._checkInterception(message, radio, player);

    this._addToHistory(message);

    return {
      success: true,
      recipients: recipients.size,
      intercepted,
      batteryRemaining: Math.round(radio.batteryCharge),
      message,
    };
  }

  /**
   * 3️⃣ COMUNICACIÓN PRIVADA (P2P)
   * Usando código de jugador
   */
  sendPrivateMessage(senderId, targetPlayerId, text) {
    const sender = worldState.getPlayer(senderId);
    const target = worldState.getPlayer(targetPlayerId);

    if (!sender || !target) {
      return { success: false, error: 'Jugador no encontrado' };
    }

    // Ambos deben tener radio
    if (!sender.equippedRadio) {
      return { success: false, error: 'No tienes radio equipado' };
    }

    if (!target.equippedRadio || !target.equippedRadio.equipped) {
      return { success: false, error: 'El destinatario no tiene radio activo' };
    }

    // Consumir batería
    sender.equippedRadio.consumeBattery(0.05);

    // Crear canal privado único
    const channelId = this._createPrivateChannelId(senderId, targetPlayerId);

    const message = {
      type: 'chat:private',
      senderId,
      senderName: sender.username,
      targetId: targetPlayerId,
      text,
      channelId,
      timestamp: Date.now(),
      encrypted: true,
    };

    // Enviar solo al destinatario
    const targetConnection = aoiManager.connections.get(targetPlayerId);
    if (targetConnection && targetConnection.readyState === 1) {
      targetConnection.send(JSON.stringify(message));
    }

    // También al remitente (confirmación)
    const senderConnection = aoiManager.connections.get(senderId);
    if (senderConnection && senderConnection.readyState === 1) {
      senderConnection.send(JSON.stringify({ ...message, echo: true }));
    }

    this._addToHistory(message);

    return {
      success: true,
      message,
      batteryRemaining: Math.round(sender.equippedRadio.batteryCharge),
    };
  }

  /**
   * 4️⃣ INTERCEPTACIÓN / ESPIONAJE
   */
  _checkInterception(message, senderRadio, sender) {
    const interceptors = [];

    // Solo mensajes por radio pueden ser interceptados
    if (message.type !== 'chat:radio') return [];

    // Verificar scanners activos
    for (const scannerId of this.activeScanners) {
      if (scannerId === sender.id) continue; // No te espías a ti mismo

      const scanner = worldState.getPlayer(scannerId);
      if (!scanner || !scanner.equippedRadio) continue;

      const scannerRadio = scanner.equippedRadio;
      
      // Verificar alcance
      if (!this._isInRange(sender, scanner, senderRadio.range)) continue;

      // Probabilidad de interceptación
      const baseChance = senderRadio.interceptionChance;
      const encryptionPenalty = message.encryption * 0.3; // Cifrado reduce chance
      const finalChance = Math.max(0, baseChance - encryptionPenalty);

      if (Math.random() < finalChance) {
        // Interceptado!
        const interceptedMessage = {
          ...message,
          type: 'chat:intercepted',
          interceptedBy: scannerId,
          decrypted: message.encryption === 0,
        };

        const scannerConnection = aoiManager.connections.get(scannerId);
        if (scannerConnection && scannerConnection.readyState === 1) {
          scannerConnection.send(JSON.stringify(interceptedMessage));
        }

        interceptors.push(scannerId);

        // Consumir batería del scanner
        scannerRadio.consumeBattery(0.05);
      }
    }

    return interceptors;
  }

  /**
   * Sintonizar frecuencia
   */
  joinFrequency(playerId, frequency) {
    const player = worldState.getPlayer(playerId);
    if (!player || !player.equippedRadio) {
      return { success: false, error: 'No tienes radio equipado' };
    }

    const radio = player.equippedRadio;
    const result = radio.tuneToFrequency(frequency);

    if (result.success) {
      // Agregar a mapa de frecuencias
      if (!this.frequencies.has(frequency)) {
        this.frequencies.set(frequency, new Set());
      }
      this.frequencies.get(frequency).add(playerId);

      console.log(`📻 ${player.username} sintonizó frecuencia ${frequency}`);
    }

    return result;
  }

  /**
   * Dejar frecuencia
   */
  leaveFrequency(playerId, frequency) {
    const player = worldState.getPlayer(playerId);
    if (!player || !player.equippedRadio) {
      return { success: false, error: 'No tienes radio equipado' };
    }

    player.equippedRadio.leaveFrequency(frequency);

    // Remover de mapa de frecuencias
    if (this.frequencies.has(frequency)) {
      this.frequencies.get(frequency).delete(playerId);
      if (this.frequencies.get(frequency).size === 0) {
        this.frequencies.delete(frequency);
      }
    }

    return { success: true };
  }

  /**
   * Activar scanner para interceptación
   */
  enableScanner(playerId) {
    const player = worldState.getPlayer(playerId);
    if (!player || !player.equippedRadio) {
      return { success: false, error: 'No tienes radio equipado' };
    }

    if (!player.equippedRadio.canIntercept) {
      return { success: false, error: 'Este dispositivo no puede escanear' };
    }

    this.activeScanners.add(playerId);
    console.log(`🔍 ${player.username} activó modo scanner`);

    return { success: true };
  }

  /**
   * Desactivar scanner
   */
  disableScanner(playerId) {
    this.activeScanners.delete(playerId);
    return { success: true };
  }

  /**
   * Obtener frecuencias activas (para scanner)
   */
  getActiveFrequencies(playerId) {
    const player = worldState.getPlayer(playerId);
    if (!player || !player.equippedRadio || !player.equippedRadio.canIntercept) {
      return { success: false, error: 'Necesitas un scanner' };
    }

    const frequencies = [];
    for (const [freq, players] of this.frequencies.entries()) {
      // Solo mostrar frecuencias en rango
      const inRange = Array.from(players).some(pid => {
        const other = worldState.getPlayer(pid);
        return this._isInRange(player, other, player.equippedRadio.scanRange);
      });

      if (inRange) {
        frequencies.push({
          frequency: freq,
          playerCount: players.size,
          activity: this._getFrequencyActivity(freq),
        });
      }
    }

    return { success: true, frequencies };
  }

  /**
   * Aplicar interferencia a un nodo (evento)
   */
  applyInterference(nodeId, intensity, duration) {
    this.interferences.set(nodeId, intensity);

    setTimeout(() => {
      this.interferences.delete(nodeId);
      console.log(`⚡ Interferencia terminada en ${nodeId}`);
    }, duration);

    console.log(`⚡ Interferencia aplicada en ${nodeId} (${intensity * 100}%)`);
  }

  /**
   * Cleanup cuando jugador se desconecta
   */
  onPlayerDisconnect(playerId) {
    // Remover de todas las frecuencias
    for (const [freq, players] of this.frequencies.entries()) {
      players.delete(playerId);
      if (players.size === 0) {
        this.frequencies.delete(freq);
      }
    }

    // Remover de scanners
    this.activeScanners.delete(playerId);
  }

  // ====================================
  // HELPERS INTERNOS
  // ====================================

  _broadcastToFrequency(frequency, message, range, sender) {
    const recipients = new Set();

    if (!this.frequencies.has(frequency)) {
      return recipients;
    }

    const listeners = this.frequencies.get(frequency);

    for (const listenerId of listeners) {
      if (listenerId === sender.id) continue; // No enviarse a sí mismo

      const listener = worldState.getPlayer(listenerId);
      if (!listener || !listener.equippedRadio || !listener.equippedRadio.equipped) continue;

      // Verificar alcance
      if (!this._isInRange(sender, listener, range)) continue;

      // Enviar mensaje
      const connection = aoiManager.connections.get(listenerId);
      if (connection && connection.readyState === 1) {
        connection.send(JSON.stringify(message));
        recipients.add(listenerId);
      }
    }

    return recipients;
  }

  _isInRange(player1, player2, range) {
    if (!player1 || !player2) return false;

    switch (range) {
      case 'node':
        // Mismo nodo
        return player1.currentNode === player2.currentNode;

      case 'region':
        // Misma región
        return player1.currentRegion === player2.currentRegion;

      case 'global':
        // Siempre en rango
        return true;

      default:
        return false;
    }
  }

  _createPrivateChannelId(playerId1, playerId2) {
    const sorted = [playerId1, playerId2].sort();
    return `private_${sorted[0]}_${sorted[1]}`;
  }

  _garbleText(text) {
    // Efecto de interferencia: reemplazar caracteres aleatorios
    return text.split('').map(char => {
      if (Math.random() < 0.3) {
        return ['*', '#', '%', '@'][Math.floor(Math.random() * 4)];
      }
      return char;
    }).join('');
  }

  _getFrequencyActivity(frequency) {
    const recentMessages = this.messageHistory.filter(
      m => m.frequency === frequency && Date.now() - m.timestamp < 60000
    );
    return recentMessages.length;
  }

  _addToHistory(message) {
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.MAX_HISTORY) {
      this.messageHistory.shift();
    }
  }

  /**
   * Stats para debugging
   */
  getStats() {
    return {
      activeFrequencies: this.frequencies.size,
      activeScanners: this.activeScanners.size,
      privateChannels: this.privateChannels.size,
      messageHistory: this.messageHistory.length,
      interferences: this.interferences.size,
    };
  }
}

// Singleton
const communicationService = new CommunicationService();
export default communicationService;
