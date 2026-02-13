/**
 * 👤 PLAYER CONTROLLER - Gestión de Jugadores
 * 
 * Maneja operaciones relacionadas con jugadores individuales
 */

import worldState from '../world/WorldState.js';
import survivalDB from '../db/survivalDB.js';

export class PlayerController {
  
  /**
   * GET /api/player/:id
   * Obtiene información de un jugador
   */
  static async getPlayer(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ 
          error: 'Player ID requerido' 
        });
      }

      // Buscar en WorldState primero (jugador online)
      let player = worldState.getPlayer(id);
      
      // Si no está online, buscar en DB
      if (!player) {
        player = survivalDB.getPlayer(id);
        
        if (player) {
          // Parsear JSON
          player.inventario = JSON.parse(player.inventario || '{}');
          player.stats = JSON.parse(player.stats || '{}');
          player.skills = JSON.parse(player.skills || '{}');
          player.online = false;
        }
      }

      if (!player) {
        return res.status(404).json({ 
          error: 'Jugador no encontrado' 
        });
      }

      return res.json({
        success: true,
        player
      });

    } catch (error) {
      console.error('Error en getPlayer:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * GET /api/players/online
   * Lista jugadores conectados
   */
  static async getOnlinePlayers(req, res) {
    try {
      const players = worldState.getOnlinePlayers();

      return res.json({
        success: true,
        count: players.length,
        players: players.map(p => ({
          id: p.id,
          nombre: p.nombre,
          nivel: p.nivel,
          clase: p.clase,
          ubicacion: p.nodeId || p.ubicacion,
          avatar: p.avatar,
          color: p.color
        }))
      });

    } catch (error) {
      console.error('Error en getOnlinePlayers:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * GET /api/players/in-node/:nodeId
   * Jugadores en un nodo específico
   */
  static async getPlayersInNode(req, res) {
    try {
      const { nodeId } = req.params;

      const players = worldState.getPlayersInNode(nodeId);

      return res.json({
        success: true,
        nodeId,
        count: players.length,
        players: players.map(p => ({
          id: p.id,
          nombre: p.nombre,
          nivel: p.nivel,
          clase: p.clase,
          avatar: p.avatar,
          color: p.color,
          salud: p.salud,
          saludMax: p.saludMax
        }))
      });

    } catch (error) {
      console.error('Error en getPlayersInNode:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * POST /api/player/:id/move
   * Mueve jugador a otro nodo
   */
  static async movePlayer(req, res) {
    try {
      const { id } = req.params;
      const { targetNodeId } = req.body;

      if (!id || !targetNodeId) {
        return res.status(400).json({ 
          error: 'Player ID y target node requeridos' 
        });
      }

      const player = worldState.getPlayer(id);
      
      if (!player) {
        return res.status(404).json({ 
          error: 'Jugador no encontrado' 
        });
      }

      // Verificar que el nodo destino existe
      const targetNode = worldState.getNode(targetNodeId);
      
      if (!targetNode) {
        return res.status(404).json({ 
          error: 'Nodo destino no encontrado' 
        });
      }

      // Verificar conectividad
      const currentNode = worldState.getNode(player.nodeId);
      
      if (!currentNode.conectado_a?.includes(targetNodeId)) {
        return res.status(400).json({ 
          error: 'Nodo no conectado' 
        });
      }

      // Iniciar viaje
      const oldNodeId = player.nodeId;
      player.traveling = true;
      player.travelDestination = targetNodeId;
      player.travelEndTime = Date.now() + 5000; // 5 segundos

      return res.json({
        success: true,
        player: {
          id: player.id,
          nombre: player.nombre,
          fromNode: oldNodeId,
          toNode: targetNodeId,
          travelTime: 5000,
          arrivalTime: player.travelEndTime
        }
      });

    } catch (error) {
      console.error('Error en movePlayer:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * POST /api/player/:id/update
   * Actualiza stats del jugador
   */
  static async updatePlayer(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const player = worldState.getPlayer(id);
      
      if (!player) {
        return res.status(404).json({ 
          error: 'Jugador no encontrado' 
        });
      }

      // Actualizar campos permitidos
      const allowedFields = ['salud', 'hambre', 'stamina', 'inventario'];
      
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          player[field] = updates[field];
        }
      });

      // Persistir en DB
      survivalDB.updatePlayer(id, player);

      return res.json({
        success: true,
        player
      });

    } catch (error) {
      console.error('Error en updatePlayer:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * GET /api/player/:id/stats
   * Estadísticas detalladas del jugador
   */
  static async getPlayerStats(req, res) {
    try {
      const { id } = req.params;

      const player = worldState.getPlayer(id) || survivalDB.getPlayer(id);
      
      if (!player) {
        return res.status(404).json({ 
          error: 'Jugador no encontrado' 
        });
      }

      return res.json({
        success: true,
        stats: {
          nivel: player.nivel,
          xp: player.xp,
          clase: player.clase,
          salud: player.salud,
          saludMax: player.saludMax,
          hambre: player.hambre,
          stamina: player.stamina,
          stats: typeof player.stats === 'string' 
            ? JSON.parse(player.stats) 
            : player.stats,
          skills: typeof player.skills === 'string'
            ? JSON.parse(player.skills)
            : player.skills
        }
      });

    } catch (error) {
      console.error('Error en getPlayerStats:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }
}

export default PlayerController;
