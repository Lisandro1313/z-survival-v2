/**
 * 🤝 TRADING SYSTEM
 * 
 * Sistema completo de intercambio entre jugadores con:
 * - Ofertas de trade (crear, aceptar, rechazar, cancelar)
 * - Sistema de escrow (items bloqueados durante trade)
 * - Historial de trades
 * - Notificaciones en tiempo real
 * - Validación de items
 * - Protección contra fraude
 */

import { worldState } from '../world/WorldState.js';
import { EventEmitter } from 'events';

export class TradingSystem extends EventEmitter {
  constructor() {
    super();
    
    this.trades = new Map(); // tradeId → Trade object
    this.tradeHistory = new Map(); // playerId → Array<TradeHistory>
    this.playerTrades = new Map(); // playerId → Set<tradeId> (active trades)
    this.escrowLocks = new Map(); // playerId → Set<itemId> (locked items)
    
    this.nextTradeId = 1;
    
    console.log('🤝 Trading System initialized');
  }

  // ====================================
  // CREATE TRADE OFFER
  // ====================================

  /**
   * Crea una nueva oferta de trade
   * @param {number} initiatorId - ID del jugador que inicia
   * @param {number} targetId - ID del jugador objetivo
   * @param {Array} offeredItems - Items ofrecidos [{id, name, quantity}]
   * @param {Array} requestedItems - Items solicitados [{name, quantity}]
   * @returns {Object} Trade object o error
   */
  createTradeOffer(initiatorId, targetId, offeredItems = [], requestedItems = []) {
    // Validaciones
    const initiator = worldState.getPlayer(initiatorId);
    const target = worldState.getPlayer(targetId);

    if (!initiator || !target) {
      return { success: false, error: 'Jugador no encontrado' };
    }

    if (initiatorId === targetId) {
      return { success: false, error: 'No puedes tradear contigo mismo' };
    }

    if (!target.online) {
      return { success: false, error: 'El jugador objetivo está offline' };
    }

    // Verificar que los jugadores estén en el mismo nodo o cercanos
    if (initiator.nodeId !== target.nodeId) {
      const connectedNodes = worldState.getConnectedNodes(initiator.nodeId);
      const isNearby = connectedNodes.some(node => node.id === target.nodeId);
      
      if (!isNearby) {
        return { success: false, error: 'El jugador está muy lejos para tradear' };
      }
    }

    // Verificar que el iniciador tenga los items ofrecidos
    const validationResult = this._validateOfferedItems(initiator, offeredItems);
    if (!validationResult.success) {
      return validationResult;
    }

    // Verificar que los items no estén bloqueados
    for (const item of offeredItems) {
      if (this.isItemLocked(initiatorId, item.id)) {
        return { success: false, error: `El item ${item.name} está bloqueado en otro trade` };
      }
    }

    // Crear trade
    const tradeId = this.nextTradeId++;
    const trade = {
      id: tradeId,
      initiatorId,
      targetId,
      status: 'pending', // pending, accepted, rejected, cancelled, completed
      offeredItems,
      requestedItems,
      initiatorConfirmed: false,
      targetConfirmed: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutos
    };

    this.trades.set(tradeId, trade);
    worldState.activeTradeOffers.set(tradeId, trade);

    // Indexar trade por jugador
    this._indexTradeForPlayer(initiatorId, tradeId);
    this._indexTradeForPlayer(targetId, tradeId);

    // Bloquear items en escrow
    this._lockItems(initiatorId, offeredItems);

    // Emitir evento
    this.emit('trade:created', trade);

    console.log(`🤝 Trade #${tradeId} creado: ${initiator.username} → ${target.username}`);

    return { success: true, trade };
  }

  // ====================================
  // RESPOND TO TRADE
  // ====================================

  /**
   * Responder a una oferta de trade (aceptar/rechazar/counters)
   */
  respondToTrade(playerId, tradeId, action, counterOffer = null) {
    const trade = this.trades.get(tradeId);
    
    if (!trade) {
      return { success: false, error: 'Trade no encontrado' };
    }

    if (trade.targetId !== playerId) {
      return { success: false, error: 'No tienes permiso para responder a este trade' };
    }

    if (trade.status !== 'pending') {
      return { success: false, error: `Trade ya está ${trade.status}` };
    }

    if (Date.now() > trade.expiresAt) {
      this.cancelTrade(tradeId, 'expired');
      return { success: false, error: 'Trade expirado' };
    }

    switch (action) {
      case 'accept':
        return this._acceptTrade(trade);
      
      case 'reject':
        return this._rejectTrade(trade);
      
      case 'counter':
        return this._counterOffer(trade, playerId, counterOffer);
      
      default:
        return { success: false, error: 'Acción inválida' };
    }
  }

  // ====================================
  // CONFIRM TRADE
  // ====================================

  /**
   * Confirmar trade (ambos jugadores deben confirmar)
   */
  confirmTrade(playerId, tradeId) {
    const trade = this.trades.get(tradeId);
    
    if (!trade) {
      return { success: false, error: 'Trade no encontrado' };
    }

    if (trade.status !== 'accepted') {
      return { success: false, error: 'Trade no está en estado aceptado' };
    }

    // Marcar confirmación
    if (playerId === trade.initiatorId) {
      trade.initiatorConfirmed = true;
    } else if (playerId === trade.targetId) {
      trade.targetConfirmed = true;
    } else {
      return { success: false, error: 'No eres parte de este trade' };
    }

    this.emit('trade:confirmed', { tradeId, playerId, trade });

    // Si ambos confirmaron, completar trade
    if (trade.initiatorConfirmed && trade.targetConfirmed) {
      return this._completeTrade(trade);
    }

    return { 
      success: true, 
      message: 'Confirmación registrada, esperando al otro jugador',
      trade 
    };
  }

  // ====================================
  // CANCEL TRADE
  // ====================================

  cancelTrade(tradeId, reason = 'user_cancelled') {
    const trade = this.trades.get(tradeId);
    
    if (!trade) {
      return { success: false, error: 'Trade no encontrado' };
    }

    if (trade.status === 'completed') {
      return { success: false, error: 'Trade ya completado' };
    }

    // Desbloquear items
    this._unlockItems(trade.initiatorId, trade.offeredItems);

    // Actualizar estado
    trade.status = 'cancelled';
    trade.cancelledAt = Date.now();
    trade.cancelReason = reason;

    // Remover de activos
    this.trades.delete(tradeId);
    worldState.activeTradeOffers.delete(tradeId);
    
    this._removeTradeFromPlayer(trade.initiatorId, tradeId);
    this._removeTradeFromPlayer(trade.targetId, tradeId);

    // Agregar a historial
    this._addToHistory(trade);

    this.emit('trade:cancelled', { tradeId, reason, trade });

    console.log(`🤝 Trade #${tradeId} cancelado: ${reason}`);

    return { success: true, message: 'Trade cancelado' };
  }

  // ====================================
  // QUERY METHODS
  // ====================================

  getActiveTrades(playerId) {
    const tradeIds = this.playerTrades.get(playerId) || new Set();
    return Array.from(tradeIds)
      .map(id => this.trades.get(id))
      .filter(Boolean);
  }

  getTradeHistory(playerId, limit = 20) {
    const history = this.tradeHistory.get(playerId) || [];
    return history.slice(-limit);
  }

  getTrade(tradeId) {
    return this.trades.get(tradeId);
  }

  getPlayerTradeStats(playerId) {
    const history = this.tradeHistory.get(playerId) || [];
    
    return {
      totalTrades: history.length,
      completed: history.filter(t => t.status === 'completed').length,
      cancelled: history.filter(t => t.status === 'cancelled').length,
      rejected: history.filter(t => t.status === 'rejected').length,
      activeTrades: this.getActiveTrades(playerId).length,
    };
  }

  // ====================================
  // INTERNAL METHODS
  // ====================================

  _acceptTrade(trade) {
    const target = worldState.getPlayer(trade.targetId);
    
    // Validar que el target tenga los items solicitados
    const validationResult = this._validateRequestedItems(target, trade.requestedItems);
    if (!validationResult.success) {
      return validationResult;
    }

    // Bloquear items del target
    this._lockItems(trade.targetId, trade.requestedItems);

    trade.status = 'accepted';
    trade.acceptedAt = Date.now();

    this.emit('trade:accepted', trade);

    return { 
      success: true, 
      message: 'Trade aceptado. Ambos jugadores deben confirmar.',
      trade 
    };
  }

  _rejectTrade(trade) {
    // Desbloquear items
    this._unlockItems(trade.initiatorId, trade.offeredItems);

    trade.status = 'rejected';
    trade.rejectedAt = Date.now();

    this.trades.delete(trade.id);
    worldState.activeTradeOffers.delete(trade.id);
    
    this._removeTradeFromPlayer(trade.initiatorId, trade.id);
    this._removeTradeFromPlayer(trade.targetId, trade.id);

    this._addToHistory(trade);

    this.emit('trade:rejected', trade);

    return { success: true, message: 'Trade rechazado', trade };
  }

  _completeTrade(trade) {
    const initiator = worldState.getPlayer(trade.initiatorId);
    const target = worldState.getPlayer(trade.targetId);

    // Validar que ambos jugadores sigan teniendo los items
    const initiatorValid = this._validateOfferedItems(initiator, trade.offeredItems);
    const targetValid = this._validateRequestedItems(target, trade.requestedItems);

    if (!initiatorValid.success || !targetValid.success) {
      this.cancelTrade(trade.id, 'items_validation_failed');
      return { 
        success: false, 
        error: 'Validación de items falló. Trade cancelado.' 
      };
    }

    // ⚠️ AQUÍ IRÍA LA LÓGICA REAL DE TRANSFERENCIA DE ITEMS
    // Por ahora solo simulamos el intercambio
    
    // Transferir items del initiator al target
    // this._transferItems(initiator, target, trade.offeredItems);
    
    // Transferir items del target al initiator
    // this._transferItems(target, initiator, trade.requestedItems);

    // Desbloquear items
    this._unlockItems(trade.initiatorId, trade.offeredItems);
    this._unlockItems(trade.targetId, trade.requestedItems);

    // Actualizar estado
    trade.status = 'completed';
    trade.completedAt = Date.now();

    this.trades.delete(trade.id);
    worldState.activeTradeOffers.delete(trade.id);
    
    this._removeTradeFromPlayer(trade.initiatorId, trade.id);
    this._removeTradeFromPlayer(trade.targetId, trade.id);

    this._addToHistory(trade);

    this.emit('trade:completed', trade);

    console.log(`✅ Trade #${trade.id} completado exitosamente`);

    return { 
      success: true, 
      message: '¡Trade completado exitosamente!',
      trade 
    };
  }

  _counterOffer(trade, playerId, counterOffer) {
    // TODO: Implementar counter offers
    return { success: false, error: 'Counter offers no implementados aún' };
  }

  _validateOfferedItems(player, items) {
    // ⚠️ MOCK: En producción verificar inventario real
    if (!player.inventory) {
      return { success: false, error: 'Inventario no disponible' };
    }

    for (const item of items) {
      // Verificar que el jugador tenga el item
      const hasItem = true; // Mock
      if (!hasItem) {
        return { success: false, error: `No tienes el item: ${item.name}` };
      }
    }

    return { success: true };
  }

  _validateRequestedItems(player, items) {
    return this._validateOfferedItems(player, items);
  }

  _lockItems(playerId, items) {
    if (!this.escrowLocks.has(playerId)) {
      this.escrowLocks.set(playerId, new Set());
    }

    const locks = this.escrowLocks.get(playerId);
    items.forEach(item => locks.add(item.id));
  }

  _unlockItems(playerId, items) {
    const locks = this.escrowLocks.get(playerId);
    if (!locks) return;

    items.forEach(item => locks.delete(item.id));
    
    if (locks.size === 0) {
      this.escrowLocks.delete(playerId);
    }
  }

  isItemLocked(playerId, itemId) {
    const locks = this.escrowLocks.get(playerId);
    return locks ? locks.has(itemId) : false;
  }

  _indexTradeForPlayer(playerId, tradeId) {
    if (!this.playerTrades.has(playerId)) {
      this.playerTrades.set(playerId, new Set());
    }
    this.playerTrades.get(playerId).add(tradeId);
  }

  _removeTradeFromPlayer(playerId, tradeId) {
    const trades = this.playerTrades.get(playerId);
    if (trades) {
      trades.delete(tradeId);
      if (trades.size === 0) {
        this.playerTrades.delete(playerId);
      }
    }
  }

  _addToHistory(trade) {
    // Agregar a historial de ambos jugadores
    [trade.initiatorId, trade.targetId].forEach(playerId => {
      if (!this.tradeHistory.has(playerId)) {
        this.tradeHistory.set(playerId, []);
      }
      
      const history = this.tradeHistory.get(playerId);
      history.push({
        tradeId: trade.id,
        partnerId: playerId === trade.initiatorId ? trade.targetId : trade.initiatorId,
        status: trade.status,
        wasInitiator: playerId === trade.initiatorId,
        createdAt: trade.createdAt,
        completedAt: trade.completedAt,
        cancelledAt: trade.cancelledAt,
        offeredItems: trade.offeredItems,
        requestedItems: trade.requestedItems,
      });

      // Mantener solo últimos 100 trades
      if (history.length > 100) {
        history.shift();
      }
    });
  }

  // ====================================
  // CLEANUP
  // ====================================

  cleanupExpiredTrades() {
    const now = Date.now();
    let cleaned = 0;

    for (const [tradeId, trade] of this.trades.entries()) {
      if (now > trade.expiresAt && trade.status === 'pending') {
        this.cancelTrade(tradeId, 'expired');
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired trades`);
    }
  }

  // ====================================
  // STATS
  // ====================================

  getStats() {
    return {
      activeTrades: this.trades.size,
      playersTrading: this.playerTrades.size,
      lockedItems: Array.from(this.escrowLocks.values())
        .reduce((sum, set) => sum + set.size, 0),
    };
  }
}

// Singleton
export const tradingSystem = new TradingSystem();

export default tradingSystem;
