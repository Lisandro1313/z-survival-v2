/**
 * 🤝 TRADE CONTROLLER
 * 
 * Controlador para endpoints de trading con sistema completo
 */

import { tradingSystem } from '../systems/TradingSystem.js';
import { worldState } from '../world/WorldState.js';

export class TradeController {
  
  /**
   * POST /api/trade/create
   * Crear una nueva oferta de trade
   */
  static createTrade(req, res) {
    try {
      const { targetId, offeredItems, requestedItems } = req.body;
      const initiatorId = req.user.userId; // De JWT middleware

      if (!targetId) {
        return res.status(400).json({ error: 'targetId requerido' });
      }

      const result = tradingSystem.createTradeOffer(
        initiatorId,
        targetId,
        offeredItems || [],
        requestedItems || []
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        message: 'Trade creado exitosamente',
        trade: result.trade
      });

    } catch (error) {
      console.error('Error creating trade:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * POST /api/trade/:tradeId/respond
   * Responder a una oferta de trade
   */
  static respondToTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const { action, counterOffer } = req.body; // action: accept, reject, counter
      const playerId = req.user.userId;

      if (!action || !['accept', 'reject', 'counter'].includes(action)) {
        return res.status(400).json({ error: 'Acción inválida' });
      }

      const result = tradingSystem.respondToTrade(
        playerId,
        parseInt(tradeId),
        action,
        counterOffer
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result);

    } catch (error) {
      console.error('Error responding to trade:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * POST /api/trade/:tradeId/confirm
   * Confirmar un trade aceptado
   */
  static confirmTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const playerId = req.user.userId;

      const result = tradingSystem.confirmTrade(
        playerId,
        parseInt(tradeId)
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result);

    } catch (error) {
      console.error('Error confirming trade:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * POST /api/trade/:tradeId/cancel
   * Cancelar un trade
   */
  static cancelTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const playerId = req.user.userId;

      const trade = tradingSystem.getTrade(parseInt(tradeId));
      
      if (!trade) {
        return res.status(404).json({ error: 'Trade no encontrado' });
      }

      // Verificar permiso
      if (trade.initiatorId !== playerId && trade.targetId !== playerId) {
        return res.status(403).json({ error: 'No tienes permiso para cancelar este trade' });
      }

      const result = tradingSystem.cancelTrade(parseInt(tradeId), 'user_cancelled');

      res.json(result);

    } catch (error) {
      console.error('Error cancelling trade:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/trade/active
   * Obtener trades activos del jugador
   */
  static getActiveTrades(req, res) {
    try {
      const playerId = req.user.userId;
      const trades = tradingSystem.getActiveTrades(playerId);

      res.json({
        success: true,
        trades,
        count: trades.length
      });

    } catch (error) {
      console.error('Error getting active trades:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/trade/history
   * Obtener historial de trades
   */
  static getTradeHistory(req, res) {
    try {
      const playerId = req.user.userId;
      const limit = parseInt(req.query.limit) || 20;

      const history = tradingSystem.getTradeHistory(playerId, limit);

      res.json({
        success: true,
        history,
        count: history.length
      });

    } catch (error) {
      console.error('Error getting trade history:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/trade/stats
   * Obtener estadísticas de trading del jugador
   */
  static getPlayerStats(req, res) {
    try {
      const playerId = req.user.userId;
      const stats = tradingSystem.getPlayerTradeStats(playerId);

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error getting player stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/trade/:tradeId
   * Obtener detalles de un trade específico
   */
  static getTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const playerId = req.user.userId;

      const trade = tradingSystem.getTrade(parseInt(tradeId));

      if (!trade) {
        return res.status(404).json({ error: 'Trade no encontrado' });
      }

      // Verificar permiso
      if (trade.initiatorId !== playerId && trade.targetId !== playerId) {
        return res.status(403).json({ error: 'No tienes permiso para ver este trade' });
      }

      res.json({
        success: true,
        trade
      });

    } catch (error) {
      console.error('Error getting trade:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/trade/system/stats
   * Estadísticas globales del sistema (para admins)
   */
  static getSystemStats(req, res) {
    try {
      const stats = tradingSystem.getStats();

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error getting system stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // ====================================
  // LEGACY COMPATIBILITY
  // ====================================

  /**
   * @deprecated Use createTrade instead
   */
  static async createOffer(req, res) {
    return TradeController.createTrade(req, res);
  }

  /**
   * @deprecated Use getActiveTrades instead
   */
  static async getPlayerOffers(req, res) {
    return TradeController.getActiveTrades(req, res);
  }

  /**
   * @deprecated Use respondToTrade instead
   */
  static async respondToOffer(req, res) {
    return TradeController.respondToTrade(req, res);
  }

  /**
   * @deprecated Use cancelTrade instead
   */
  static async cancelOffer(req, res) {
    return TradeController.cancelTrade(req, res);
  }
}

export default TradeController;

