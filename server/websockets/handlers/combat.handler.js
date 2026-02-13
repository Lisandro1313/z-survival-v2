/**
 * ⚔️ COMBAT HANDLER - Manejo de acciones de combate
 */

import worldState from '../../world/WorldState.js';

export async function handleCombatAction(playerId, message, aoiManager) {
  const player = worldState.getPlayer(playerId);
  
  if (!player) return;

  const targetId = message.targetId;
  const action = message.action || 'attack';

  // Verificar cooldown
  if (player.combatCooldown && Date.now() < player.combatCooldown) {
    return aoiManager.sendToPlayer(playerId, {
      type: 'combat:cooldown',
      remaining: player.combatCooldown - Date.now()
    });
  }

  const node = worldState.getNode(player.nodeId);
  
  if (!node) return;

  // Lógica simple de combate vs zombis
  if (targetId === 'zombie' || action === 'shoot') {
    if (node.zombies <= 0) {
      return aoiManager.sendToPlayer(playerId, {
        type: 'combat:no_target',
        message: 'No hay zombis aquí'
      });
    }

    // Verificar si tiene armas
    if (!player.inventario.armas || player.inventario.armas <= 0) {
      return aoiManager.sendToPlayer(playerId, {
        type: 'combat:no_weapon',
        message: 'No tienes armas'
      });
    }

    // Calcular daño
    const damage = Math.floor(Math.random() * 20) + 10;
    const killed = Math.random() > 0.3; // 70% probabilidad de matar

    if (killed) {
      node.zombies = Math.max(0, node.zombies - 1);

      // XP reward
      const xpGain = 10;
      player.xp += xpGain;

      // Broadcast
      aoiManager.broadcastToNode(player.nodeId, {
        type: 'combat:kill',
        playerId: player.id,
        playerName: player.nombre,
        target: 'zombie',
        xpGain,
        zombiesRemaining: node.zombies
      });
    } else {
      // Falló el ataque - aumentar ruido
      node.nivelRuido += 10;

      aoiManager.broadcastToNode(player.nodeId, {
        type: 'combat:miss',
        playerId: player.id,
        playerName: player.nombre
      });
    }

    // Cooldown
    player.combatCooldown = Date.now() + 4000; // 4 segundos

    // Consumir durabilidad de arma (opcional)
    if (Math.random() > 0.9) {
      player.inventario.armas--;
    }

    console.log(`⚔️ ${player.nombre} atacó zombie (${killed ? 'KILL' : 'MISS'})`);
  }
}

export default handleCombatAction;
