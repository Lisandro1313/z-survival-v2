/**
 * 📻🔐 RADIO ENCRYPTION SYSTEM
 * Gestiona canales encriptados y claves de encriptación para comunicaciones seguras
 */

import { EventEmitter } from 'events';
import { generateEncryptionKey, encrypt, decrypt, keyFingerprint } from '../utils/encryption.js';

class RadioEncryptionSystem extends EventEmitter {
  constructor() {
    super();
    
    // Canales encriptados activos
    // channelId -> { key, fingerprint, createdAt, createdBy, members: Set<playerId> }
    this.encryptedChannels = new Map();
    
    // Claves de jugadores
    // playerId -> Map<channelId, key>
    this.playerKeys = new Map();
    
    // Historial de rotación de claves
    this.keyRotationHistory = new Map();
    
    console.log('🔐 RadioEncryptionSystem inicializado');
  }

  /**
   * Crea un nuevo canal encriptado
   * @param {string} channelId - ID del canal (frecuencia)
   * @param {string} creatorId - ID del jugador creador
   * @param {string} customKey - Clave personalizada (opcional)
   * @returns {object} { channelId, key, fingerprint }
   */
  createEncryptedChannel(channelId, creatorId, customKey = null) {
    const key = customKey || generateEncryptionKey();
    const fingerprint = keyFingerprint(key);
    
    const channel = {
      key,
      fingerprint,
      createdAt: Date.now(),
      createdBy: creatorId,
      members: new Set([creatorId]),
      rotationCount: 0
    };
    
    this.encryptedChannels.set(channelId, channel);
    this.grantAccess(creatorId, channelId, key);
    
    this.emit('channel:created', {
      channelId,
      createdBy: creatorId,
      fingerprint
    });
    
    console.log(`🔐 Canal encriptado creado: ${channelId} (fingerprint: ${fingerprint})`);
    
    return {
      channelId,
      key,
      fingerprint
    };
  }

  /**
   * Otorga acceso a un jugador a un canal encriptado
   * @param {string} playerId - ID del jugador
   * @param {string} channelId - ID del canal
   * @param {string} key - Clave de encriptación
   */
  grantAccess(playerId, channelId, key) {
    if (!this.playerKeys.has(playerId)) {
      this.playerKeys.set(playerId, new Map());
    }
    
    this.playerKeys.get(playerId).set(channelId, key);
    
    const channel = this.encryptedChannels.get(channelId);
    if (channel) {
      channel.members.add(playerId);
    }
    
    this.emit('access:granted', {
      playerId,
      channelId,
      fingerprint: keyFingerprint(key)
    });
  }

  /**
   * Revoca acceso de un jugador a un canal
   * @param {string} playerId - ID del jugador
   * @param {string} channelId - ID del canal
   */
  revokeAccess(playerId, channelId) {
    const playerKeyMap = this.playerKeys.get(playerId);
    if (playerKeyMap) {
      playerKeyMap.delete(channelId);
    }
    
    const channel = this.encryptedChannels.get(channelId);
    if (channel) {
      channel.members.delete(playerId);
    }
    
    this.emit('access:revoked', { playerId, channelId });
  }

  /**
   * Encripta un mensaje para un canal
   * @param {string} channelId - ID del canal
   * @param {string} message - Mensaje a encriptar
   * @returns {object} { encrypted, iv, authTag, fingerprint }
   */
  encryptMessage(channelId, message) {
    const channel = this.encryptedChannels.get(channelId);
    
    if (!channel) {
      throw new Error(`Canal encriptado no encontrado: ${channelId}`);
    }
    
    const encryptedData = encrypt(message, channel.key);
    
    return {
      ...encryptedData,
      fingerprint: channel.fingerprint
    };
  }

  /**
   * Desencripta un mensaje de un canal
   * @param {string} playerId - ID del jugador que desencripta
   * @param {string} channelId - ID del canal
   * @param {object} encryptedData - { encrypted, iv, authTag }
   * @returns {string} Mensaje desencriptado
   */
  decryptMessage(playerId, channelId, encryptedData) {
    const playerKeyMap = this.playerKeys.get(playerId);
    
    if (!playerKeyMap || !playerKeyMap.has(channelId)) {
      throw new Error('No tienes acceso a este canal encriptado');
    }
    
    const key = playerKeyMap.get(channelId);
    
    try {
      return decrypt(
        encryptedData.encrypted,
        key,
        encryptedData.iv,
        encryptedData.authTag
      );
    } catch (error) {
      console.error(`Error desencriptando mensaje en canal ${channelId}:`, error);
      throw new Error('No se pudo desencriptar el mensaje - clave inválida');
    }
  }

  /**
   * Rota la clave de un canal (cambia la clave)
   * @param {string} channelId - ID del canal
   * @param {string} requesterId - ID del jugador que solicita
   * @returns {object} { newKey, newFingerprint }
   */
  rotateChannelKey(channelId, requesterId) {
    const channel = this.encryptedChannels.get(channelId);
    
    if (!channel) {
      throw new Error('Canal no encontrado');
    }
    
    if (channel.createdBy !== requesterId) {
      throw new Error('Solo el creador puede rotar la clave');
    }
    
    // Guardar clave antigua en historial
    if (!this.keyRotationHistory.has(channelId)) {
      this.keyRotationHistory.set(channelId, []);
    }
    this.keyRotationHistory.get(channelId).push({
      oldKey: channel.key,
      oldFingerprint: channel.fingerprint,
      rotatedAt: Date.now(),
      rotatedBy: requesterId
    });
    
    // Generar nueva clave
    const newKey = generateEncryptionKey();
    const newFingerprint = keyFingerprint(newKey);
    
    channel.key = newKey;
    channel.fingerprint = newFingerprint;
    channel.rotationCount++;
    
    // Actualizar claves de todos los miembros
    for (const memberId of channel.members) {
      const playerKeyMap = this.playerKeys.get(memberId);
      if (playerKeyMap) {
        playerKeyMap.set(channelId, newKey);
      }
    }
    
    this.emit('key:rotated', {
      channelId,
      newFingerprint,
      members: Array.from(channel.members)
    });
    
    console.log(`🔄 Clave rotada para canal ${channelId}: ${newFingerprint}`);
    
    return {
      newKey,
      newFingerprint
    };
  }

  /**
   * Verifica si un jugador tiene acceso a un canal
   * @param {string} playerId - ID del jugador
   * @param {string} channelId - ID del canal
   * @returns {boolean}
   */
  hasAccess(playerId, channelId) {
    const playerKeyMap = this.playerKeys.get(playerId);
    return playerKeyMap ? playerKeyMap.has(channelId) : false;
  }

  /**
   * Obtiene información de un canal encriptado
   * @param {string} channelId - ID del canal
   * @returns {object} Info del canal (sin la clave)
   */
  getChannelInfo(channelId) {
    const channel = this.encryptedChannels.get(channelId);
    
    if (!channel) {
      return null;
    }
    
    return {
      channelId,
      fingerprint: channel.fingerprint,
      createdAt: channel.createdAt,
      createdBy: channel.createdBy,
      memberCount: channel.members.size,
      rotationCount: channel.rotationCount
    };
  }

  /**
   * Lista canales a los que un jugador tiene acceso
   * @param {string} playerId - ID del jugador
   * @returns {Array} Lista de channel info
   */
  getPlayerChannels(playerId) {
    const playerKeyMap = this.playerKeys.get(playerId);
    
    if (!playerKeyMap) {
      return [];
    }
    
    const channels = [];
    for (const channelId of playerKeyMap.keys()) {
      const info = this.getChannelInfo(channelId);
      if (info) {
        channels.push(info);
      }
    }
    
    return channels;
  }

  /**
   * Elimina un canal encriptado
   * @param {string} channelId - ID del canal
   * @param {string} requesterId - ID del jugador que solicita
   */
  deleteChannel(channelId, requesterId) {
    const channel = this.encryptedChannels.get(channelId);
    
    if (!channel) {
      throw new Error('Canal no encontrado');
    }
    
    if (channel.createdBy !== requesterId) {
      throw new Error('Solo el creador puede eliminar el canal');
    }
    
    // Revocar acceso a todos los miembros
    for (const memberId of channel.members) {
      this.revokeAccess(memberId, channelId);
    }
    
    this.encryptedChannels.delete(channelId);
    this.keyRotationHistory.delete(channelId);
    
    this.emit('channel:deleted', { channelId });
    
    console.log(`🗑️ Canal encriptado eliminado: ${channelId}`);
  }

  /**
   * Estadísticas del sistema
   * @returns {object} Stats
   */
  getStats() {
    return {
      totalChannels: this.encryptedChannels.size,
      totalPlayers: this.playerKeys.size,
      channelsWithRotation: Array.from(this.encryptedChannels.values())
        .filter(c => c.rotationCount > 0).length
    };
  }
}

// Singleton
const radioEncryptionSystem = new RadioEncryptionSystem();
export { radioEncryptionSystem };
export default radioEncryptionSystem;
