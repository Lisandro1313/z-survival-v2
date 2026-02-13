/**
 * 🌍 WORLD CONTROLLER - Estado del Mundo y Nodos
 * 
 * Maneja consultas sobre el mundo, nodos, regiones, eventos
 */

import worldState from '../world/WorldState.js';
import regionManager from '../world/RegionManager.js';
import tickEngine from '../world/TickEngine.js';

export class WorldController {
  
  /**
   * GET /api/world
   * Estado general del mundo
   */
  static async getWorld(req, res) {
    try {
      const stats = worldState.getStats();
      const regions = regionManager.getAllRegions();

      return res.json({
        success: true,
        world: {
          stats,
          regions: regions.map(r => ({
            id: r.id,
            name: r.name,
            status: r.status,
            playerCount: r.playerCount,
            npcCount: r.npcCount,
            difficulty: r.difficulty
          })),
          tickEngine: tickEngine.getStats()
        }
      });

    } catch (error) {
      console.error('Error en getWorld:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * GET /api/world/nodes
   * Lista todos los nodos
   */
  static async getAllNodes(req, res) {
    try {
      const nodes = Array.from(worldState.nodes.values());

      return res.json({
        success: true,
        count: nodes.length,
        nodes: nodes.map(node => ({
          id: node.id,
          nombre: node.nombre,
          tipo: node.tipo,
          descripcion: node.descripcion,
          conectado_a: node.conectado_a,
          zombies: node.zombies,
          nivelRuido: node.nivelRuido,
          defensas: node.defensas,
          recursos: node.recursos
        }))
      });

    } catch (error) {
      console.error('Error en getAllNodes:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * GET /api/world/node/:nodeId
   * Información detallada de un nodo
   */
  static async getNode(req, res) {
    try {
      const { nodeId } = req.params;

      const node = worldState.getNode(nodeId);
      
      if (!node) {
        return res.status(404).json({ 
          error: 'Nodo no encontrado' 
        });
      }

      // Jugadores en el nodo
      const players = worldState.getPlayersInNode(nodeId);
      
      // NPCs en el nodo
      const npcs = worldState.getNPCsInNode(nodeId);

      // Eventos activos
      const events = worldState.getEventsInNode(nodeId);

      return res.json({
        success: true,
        node: {
          ...node,
          players: players.map(p => ({
            id: p.id,
            nombre: p.nombre,
            nivel: p.nivel,
            clase: p.clase
          })),
          npcs: npcs.map(npc => ({
            id: npc.id,
            nombre: npc.nombre,
            tipo: npc.tipo,
            estado: npc.estado
          })),
          events: events.map(e => ({
            id: e.id,
            tipo: e.tipo,
            timeRemaining: e.endTime ? e.endTime - Date.now() : null
          }))
        }
      });

    } catch (error) {
      console.error('Error en getNode:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * GET /api/world/regions
   * Información de regiones
   */
  static async getRegions(req, res) {
    try {
      const regions = regionManager.getRegionStats();

      return res.json({
        success: true,
        count: regions.length,
        regions
      });

    } catch (error) {
      console.error('Error en getRegions:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * GET /api/world/region/:regionId
   * Detalle de una región
   */
  static async getRegion(req, res) {
    try {
      const { regionId } = req.params;

      const region = regionManager.getRegion(regionId);
      
      if (!region) {
        return res.status(404).json({ 
          error: 'Región no encontrada' 
        });
      }

      // Nodos en la región
      const nodes = regionManager.getRegion(regionId).nodes.map(nodeId => {
        const node = worldState.getNode(nodeId);
        return node ? {
          id: node.id,
          nombre: node.nombre,
          tipo: node.tipo
        } : null;
      }).filter(Boolean);

      // Jugadores en la región
      const players = worldState.getPlayersInRegion(regionId);

      return res.json({
        success: true,
        region: {
          ...region,
          nodes,
          playerCount: players.length,
          load: regionManager.getRegionLoad(regionId)
        }
      });

    } catch (error) {
      console.error('Error en getRegion:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * GET /api/world/events
   * Eventos globales activos
   */
  static async getActiveEvents(req, res) {
    try {
      const events = worldState.getActiveEvents();

      return res.json({
        success: true,
        count: events.length,
        events: events.map(event => ({
          id: event.id,
          tipo: event.tipo,
          nombre: event.nombre,
          descripcion: event.descripcion,
          nodeId: event.nodeId,
          startTime: event.startTime,
          endTime: event.endTime,
          timeRemaining: event.endTime ? event.endTime - Date.now() : null
        }))
      });

    } catch (error) {
      console.error('Error en getActiveEvents:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * GET /api/world/stats
   * Estadísticas generales
   */
  static async getStats(req, res) {
    try {
      const worldStats = worldState.getStats();
      const regionStats = regionManager.getRegionStats();
      const tickStats = tickEngine.getStats();
      const mostLoaded = regionManager.getMostLoadedRegion();

      return res.json({
        success: true,
        stats: {
          world: worldStats,
          regions: {
            total: regionStats.length,
            stats: regionStats,
            mostLoaded: mostLoaded.region ? {
              name: mostLoaded.region.name,
              load: mostLoaded.load
            } : null
          },
          tickEngine: tickStats,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }
      });

    } catch (error) {
      console.error('Error en getStats:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * POST /api/world/node/:nodeId/resources
   * Actualiza recursos de un nodo (admin)
   */
  static async updateNodeResources(req, res) {
    try {
      const { nodeId } = req.params;
      const { recursos } = req.body;

      const node = worldState.getNode(nodeId);
      
      if (!node) {
        return res.status(404).json({ 
          error: 'Nodo no encontrado' 
        });
      }

      worldState.updateNodeResources(nodeId, recursos);

      return res.json({
        success: true,
        node: {
          id: node.id,
          recursos: node.recursos
        }
      });

    } catch (error) {
      console.error('Error en updateNodeResources:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }
}

export default WorldController;
