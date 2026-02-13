/**
 * 🚶 MOVEMENT HANDLER - Manejo del movimiento entre nodos
 */

import worldState from '../../world/WorldState.js';
import regionManager from '../../world/RegionManager.js';

export async function handlePlayerMovement(playerId, message, ws, aoiManager) {
  const targetNodeId = message.targetNodeId || message.ubicacion;
  
  if (!targetNodeId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Target node ID requerido'
    }));
    return;
  }

  const player = worldState.getPlayer(playerId);
  
  if (!player) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Jugador no encontrado'
    }));
    return;
  }

  // Verificar que el nodo existe
  const targetNode = worldState.getNode(targetNodeId);
  
  if (!targetNode) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Nodo destino no encontrado'
    }));
    return;
  }

  // Verificar conectividad
  const currentNode = worldState.getNode(player.nodeId);
  
  if (targetNodeId !== player.nodeId && !currentNode.conectado_a?.includes(targetNodeId)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Nodo no conectado'
    }));
    return;
  }

  // Si ya está en ese nodo
  if (player.nodeId === targetNodeId) {
    ws.send(JSON.stringify({
      type: 'move:already_there',
      message: 'Ya estás en ese nodo'
    }));
    return;
  }

  // Calcular tiempo de viaje
  const travelTime = regionManager.calculateTravelTime(player.nodeId, targetNodeId);
  
  const oldNodeId = player.nodeId;

  // Notificar salida del nodo actual
  aoiManager.broadcastToNode(oldNodeId, {
    type: 'player:leaving',
    playerId: player.id,
    playerName: player.nombre,
    destination: targetNode.nombre
  }, playerId);

  // Iniciar viaje
  player.traveling = true;
  player.travelDestination = targetNodeId;
  player.travelEndTime = Date.now() + travelTime;

  // Confirmación al jugador
  ws.send(JSON.stringify({
    type: 'move:started',
    fromNode: oldNodeId,
    toNode: targetNodeId,
    travelTime,
    arrivalTime: player.travelEndTime
  }));

  // Programar llegada (el TickEngine manejará la llegada real)
  setTimeout(() => {
    // Verificar que el viaje no fue cancelado
    if (player.traveling && player.travelDestination === targetNodeId) {
      // Actualizar posición
      worldState.updatePlayerNode(playerId, oldNodeId, targetNodeId);
      
      // Actualizar suscripción AOI
      aoiManager.moveSubscription(playerId, oldNodeId, targetNodeId);
      
      // Marcar viaje completado
      player.traveling = false;
      player.travelDestination = null;
      player.travelEndTime = null;

      // Notificar llegada
      ws.send(JSON.stringify({
        type: 'move:completed',
        nodeId: targetNodeId,
        node: targetNode
      }));

      // Notificar a otros en el nodo destino
      aoiManager.broadcastToNode(targetNodeId, {
        type: 'player:arrived',
        player: {
          id: player.id,
          nombre: player.nombre,
          nivel: player.nivel,
          clase: player.clase,
          avatar: player.avatar
        }
      }, playerId);

      console.log(`🚶 ${player.nombre} llegó a ${targetNode.nombre}`);
    }
  }, travelTime);
}

export default handlePlayerMovement;
