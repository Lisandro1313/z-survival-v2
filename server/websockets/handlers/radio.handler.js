/**
 * 📻 RADIO HANDLER
 * 
 * Maneja mensajes WebSocket relacionados con el sistema de radio:
 * - Equipar/desequipar radio
 * - Sintonizar frecuencias
 * - Enviar mensajes por radio
 * - Mensajes privados
 * - Scanner / interceptación
 * - Gestión de batería
 */

import communicationService from '../../services/CommunicationService.js';
import worldState from '../../world/WorldState.js';
import RadioDevice, { RADIO_TYPES, BATTERY_TYPES } from '../../models/RadioDevice.js';

/**
 * EQUIPAR RADIO
 */
export function handleRadioEquip(ws, playerId, data) {
  const player = worldState.getPlayer(playerId);
  if (!player) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'Jugador no encontrado',
    }));
  }

  const { radioType, batteryType } = data;

  // Validar que existe el tipo de radio
  if (!RADIO_TYPES[radioType]) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'Tipo de radio inválido',
    }));
  }

  // Validar batería
  let battery = null;
  if (batteryType && BATTERY_TYPES[batteryType]) {
    battery = BATTERY_TYPES[batteryType];
  }

  // Crear dispositivo
  const radio = new RadioDevice(radioType, battery);
  const result = radio.equip();

  if (!result.success) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: result.error,
    }));
  }

  // Guardar en jugador
  player.equippedRadio = radio;

  ws.send(JSON.stringify({
    type: 'radio:equipped',
    radio: radio.getStatus(),
  }));

  console.log(`📻 ${player.username} equipó ${radio.name}`);
}

/**
 * DESEQUIPAR RADIO
 */
export function handleRadioUnequip(ws, playerId) {
  const player = worldState.getPlayer(playerId);
  if (!player || !player.equippedRadio) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'No tienes radio equipado',
    }));
  }

  // Dejar todas las frecuencias
  const frequencies = [...player.equippedRadio.activeChannels];
  frequencies.forEach(freq => {
    communicationService.leaveFrequency(playerId, freq);
  });

  // Desequipar
  player.equippedRadio.unequip();
  player.equippedRadio = null;

  // Desactivar scanner si estaba activo
  communicationService.disableScanner(playerId);

  ws.send(JSON.stringify({
    type: 'radio:unequipped',
  }));

  console.log(`📻 ${player.username} desequipó su radio`);
}

/**
 * SINTONIZAR FRECUENCIA
 */
export function handleRadioJoin(ws, playerId, data) {
  const { frequency } = data;

  if (!frequency) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'Frecuencia inválida',
    }));
  }

  const result = communicationService.joinFrequency(playerId, frequency);

  if (!result.success) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: result.error,
    }));
  }

  const player = worldState.getPlayer(playerId);

  ws.send(JSON.stringify({
    type: 'radio:joined',
    frequency,
    activeChannels: player.equippedRadio.activeChannels,
  }));

  console.log(`📻 ${player.username} sintonizó ${frequency}`);
}

/**
 * DEJAR FRECUENCIA
 */
export function handleRadioLeave(ws, playerId, data) {
  const { frequency } = data;

  const result = communicationService.leaveFrequency(playerId, frequency);

  if (!result.success) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: result.error,
    }));
  }

  const player = worldState.getPlayer(playerId);

  ws.send(JSON.stringify({
    type: 'radio:left',
    frequency,
    activeChannels: player.equippedRadio.activeChannels,
  }));

  console.log(`📻 ${player.username} dejó ${frequency}`);
}

/**
 * ENVIAR MENSAJE POR RADIO
 */
export function handleRadioMessage(ws, playerId, data) {
  const { frequency, text } = data;

  if (!text || text.trim().length === 0) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'Mensaje vacío',
    }));
  }

  if (!frequency) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'Frecuencia no especificada',
    }));
  }

  const result = communicationService.sendRadioMessage(playerId, frequency, text);

  if (!result.success) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: result.error,
    }));
  }

  // Confirmación al remitente
  ws.send(JSON.stringify({
    type: 'radio:sent',
    frequency,
    recipients: result.recipients,
    batteryRemaining: result.batteryRemaining,
    intercepted: result.intercepted.length > 0,
  }));

  // Log si fue interceptado
  if (result.intercepted.length > 0) {
    console.log(`🔍 Mensaje en ${frequency} interceptado por ${result.intercepted.length} scanners`);
  }
}

/**
 * MENSAJE PRIVADO (P2P)
 */
export function handleRadioPrivate(ws, playerId, data) {
  const { targetPlayerId, text } = data;

  if (!text || text.trim().length === 0) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'Mensaje vacío',
    }));
  }

  if (!targetPlayerId) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'Destinatario no especificado',
    }));
  }

  const result = communicationService.sendPrivateMessage(playerId, targetPlayerId, text);

  if (!result.success) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: result.error,
    }));
  }

  // Confirmación (el mensaje ya fue enviado por communicationService)
  console.log(`📻 Mensaje privado de ${playerId} a ${targetPlayerId}`);
}

/**
 * ACTIVAR SCANNER
 */
export function handleRadioScan(ws, playerId, data) {
  const { enable } = data;

  if (enable) {
    const result = communicationService.enableScanner(playerId);
    if (!result.success) {
      return ws.send(JSON.stringify({
        type: 'error',
        error: result.error,
      }));
    }

    ws.send(JSON.stringify({
      type: 'radio:scan_enabled',
    }));
  } else {
    communicationService.disableScanner(playerId);
    ws.send(JSON.stringify({
      type: 'radio:scan_disabled',
    }));
  }
}

/**
 * LISTAR FRECUENCIAS ACTIVAS (scanner)
 */
export function handleRadioFrequencies(ws, playerId) {
  const result = communicationService.getActiveFrequencies(playerId);

  if (!result.success) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: result.error,
    }));
  }

  ws.send(JSON.stringify({
    type: 'radio:frequencies',
    frequencies: result.frequencies,
  }));
}

/**
 * REEMPLAZAR BATERÍA
 */
export function handleRadioBattery(ws, playerId, data) {
  const { batteryType } = data;

  const player = worldState.getPlayer(playerId);
  if (!player || !player.equippedRadio) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'No tienes radio equipado',
    }));
  }

  if (!BATTERY_TYPES[batteryType]) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'Tipo de batería inválido',
    }));
  }

  const battery = BATTERY_TYPES[batteryType];
  const result = player.equippedRadio.replaceBattery(battery);

  if (!result.success) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: result.error,
    }));
  }

  ws.send(JSON.stringify({
    type: 'radio:battery_replaced',
    radio: player.equippedRadio.getStatus(),
    oldBattery: result.oldBattery,
  }));

  console.log(`🔋 ${player.username} reemplazó batería de su radio`);
}

/**
 * RECARGAR BATERÍA (en generador/solar)
 */
export function handleRadioRecharge(ws, playerId, data) {
  const player = worldState.getPlayer(playerId);
  if (!player || !player.equippedRadio) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'No tienes radio equipado',
    }));
  }

  // TODO: Verificar que jugador está en nodo con generador/solar
  // Por ahora permitir recargar siempre

  const minutes = data.minutes || 1;
  const result = player.equippedRadio.rechargeBattery(minutes);

  if (!result.success) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: result.error,
    }));
  }

  ws.send(JSON.stringify({
    type: 'radio:recharged',
    charge: result.charge,
    radio: player.equippedRadio.getStatus(),
  }));

  console.log(`🔋 ${player.username} recargó su radio (${result.charge}%)`);
}

/**
 * OBTENER ESTADO DEL RADIO
 */
export function handleRadioStatus(ws, playerId) {
  const player = worldState.getPlayer(playerId);
  if (!player) {
    return ws.send(JSON.stringify({
      type: 'error',
      error: 'Jugador no encontrado',
    }));
  }

  const status = player.equippedRadio 
    ? player.equippedRadio.getStatus() 
    : { equipped: false };

  ws.send(JSON.stringify({
    type: 'radio:status',
    radio: status,
  }));
}

export default {
  handleRadioEquip,
  handleRadioUnequip,
  handleRadioJoin,
  handleRadioLeave,
  handleRadioMessage,
  handleRadioPrivate,
  handleRadioScan,
  handleRadioFrequencies,
  handleRadioBattery,
  handleRadioRecharge,
  handleRadioStatus,
};
