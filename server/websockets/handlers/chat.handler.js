/**
 * 💬 CHAT HANDLER - Manejo de mensajes de chat
 * 
 * Sistema híbrido:
 * - Chat local: Sin radio, solo mismo nodo
 * - Chat radio: Por frecuencia (delegado a radio.handler)
 * - Chat privado: P2P (delegado a radio.handler)
 */

import worldState from '../../world/WorldState.js';
import communicationService from '../../services/CommunicationService.js';

export async function handleChatMessage(playerId, message, aoiManager) {
  const player = worldState.getPlayer(playerId);
  
  if (!player) return;

  const chatMessage = message.message || message.texto;
  const scope = message.scope || 'local'; // local, radio, private

  // Si es mensaje por radio, delegar a CommunicationService
  if (scope === 'radio' && message.frequency) {
    const result = communicationService.sendRadioMessage(playerId, message.frequency, chatMessage);
    if (!result.success) {
      console.log(`❌ Error radio: ${result.error}`);
    }
    return;
  }

  // Si es mensaje privado, delegar a CommunicationService
  if (scope === 'private' && message.targetPlayerId) {
    const result = communicationService.sendPrivateMessage(playerId, message.targetPlayerId, chatMessage);
    if (!result.success) {
      console.log(`❌ Error privado: ${result.error}`);
    }
    return;
  }

  // COMUNICACIÓN LOCAL (sin radio)
  const result = communicationService.sendLocalMessage(playerId, chatMessage);
  
  if (result.success) {
    console.log(`💬 [LOCAL:${player.nodeId}] ${player.nombre}: ${chatMessage} (${result.recipients} jugadores)`);
  }
}

export default handleChatMessage;
