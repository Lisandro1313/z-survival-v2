/**
 * 🤝 TRADE PANEL
 * 
 * Panel para gestionar intercambios entre jugadores
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { api } from '../../services/api';
import './TradePanel.css';

interface Trade {
  id: number;
  initiatorId: number;
  targetId: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  offeredItems: TradeItem[];
  requestedItems: TradeItem[];
  initiatorConfirmed: boolean;
  targetConfirmed: boolean;
  createdAt: number;
  expiresAt: number;
}

interface TradeItem {
  id: string;
  name: string;
  quantity: number;
}

interface TradeStats {
  totalTrades: number;
  completed: number;
  cancelled: number;
  rejected: number;
  activeTrades: number;
}

function TradePanel() {
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'stats'>('active');
  const [loading, setLoading] = useState(false);

  const { player, addNotification } = useGameStore();

  useEffect(() => {
    if (player) {
      loadActiveTrades();
      loadStats();
    }
  }, [player]);

  const loadActiveTrades = async () => {
    setLoading(true);
    try {
      const response = await api.trade.getActive();
      setActiveTrades(response.trades);
    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error.message || 'Error cargando trades',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTradeHistory = async () => {
    setLoading(true);
    try {
      const response = await api.trade.getHistory();
      setTradeHistory(response.history);
    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error.message || 'Error cargando historial',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.trade.getStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAcceptTrade = async (tradeId: number) => {
    try {
      await api.trade.respond(tradeId, 'accept');
      addNotification({
        type: 'success',
        message: 'Trade aceptado. Confirma para completar.',
      });
      await loadActiveTrades();
    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error.message || 'Error aceptando trade',
      });
    }
  };

  const handleRejectTrade = async (tradeId: number) => {
    try {
      await api.trade.respond(tradeId, 'reject');
      addNotification({
        type: 'info',
        message: 'Trade rechazado',
      });
      await loadActiveTrades();
    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error.message || 'Error rechazando trade',
      });
    }
  };

  const handleConfirmTrade = async (tradeId: number) => {
    try {
      await api.trade.confirm(tradeId);
      addNotification({
        type: 'success',
        message: 'Trade confirmado',
      });
      await loadActiveTrades();
    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error.message || 'Error confirmando trade',
      });
    }
  };

  const handleCancelTrade = async (tradeId: number) => {
    try {
      await api.trade.cancel(tradeId);
      addNotification({
        type: 'info',
        message: 'Trade cancelado',
      });
      await loadActiveTrades();
    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error.message || 'Error cancelando trade',
      });
    }
  };

  const renderTradeCard = (trade: Trade) => {
    const isInitiator = player?.userId === trade.initiatorId;
    const isTarget = player?.userId === trade.targetId;
    const canConfirm = trade.status === 'accepted';
    const needsResponse = isTarget && trade.status === 'pending';

    return (
      <div key={trade.id} className="trade-card">
        <div className="trade-header">
          <span className={`trade-status status-${trade.status}`}>
            {trade.status.toUpperCase()}
          </span>
          <span className="trade-id">#{trade.id}</span>
        </div>

        <div className="trade-body">
          <div className="trade-section">
            <h4>{isInitiator ? 'Tú ofreces' : 'Ofrece'}:</h4>
            {trade.offeredItems.length > 0 ? (
              <ul>
                {trade.offeredItems.map((item, idx) => (
                  <li key={idx}>
                    {item.name} x{item.quantity}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">Nada</p>
            )}
          </div>

          <div className="trade-arrow">⇄</div>

          <div className="trade-section">
            <h4>{isInitiator ? 'Solicitas' : 'Tú das'}:</h4>
            {trade.requestedItems.length > 0 ? (
              <ul>
                {trade.requestedItems.map((item, idx) => (
                  <li key={idx}>
                    {item.name} x{item.quantity}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">Nada</p>
            )}
          </div>
        </div>

        {canConfirm && (
          <div className="trade-confirmations">
            <div className={`confirm-status ${trade.initiatorConfirmed ? 'confirmed' : ''}`}>
              Iniciador: {trade.initiatorConfirmed ? '✅' : '⏳'}
            </div>
            <div className={`confirm-status ${trade.targetConfirmed ? 'confirmed' : ''}`}>
              Receptor: {trade.targetConfirmed ? '✅' : '⏳'}
            </div>
          </div>
        )}

        <div className="trade-actions">
          {needsResponse && (
            <>
              <button
                className="btn-accept"
                onClick={() => handleAcceptTrade(trade.id)}
              >
                Aceptar
              </button>
              <button
                className="btn-reject"
                onClick={() => handleRejectTrade(trade.id)}
              >
                Rechazar
              </button>
            </>
          )}

          {canConfirm && !((isInitiator && trade.initiatorConfirmed) || (isTarget && trade.targetConfirmed)) && (
            <button
              className="btn-confirm"
              onClick={() => handleConfirmTrade(trade.id)}
            >
              Confirmar Trade
            </button>
          )}

          {(trade.status === 'pending' || trade.status === 'accepted') && (
            <button
              className="btn-cancel"
              onClick={() => handleCancelTrade(trade.id)}
            >
              Cancelar
            </button>
          )}
        </div>

        <div className="trade-footer">
          <span className="trade-timer">
            Expira: {new Date(trade.expiresAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="trade-panel">
      <div className="panel-header">
        <h2>🤝 Trading</h2>
        {stats && (
          <div className="stats-badge">
            {stats.activeTrades} activos
          </div>
        )}
      </div>

      <div className="panel-tabs">
        <button
          className={activeTab === 'active' ? 'active' : ''}
          onClick={() => setActiveTab('active')}
        >
          Activos ({activeTrades.length})
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => {
            setActiveTab('history');
            if (tradeHistory.length === 0) loadTradeHistory();
          }}
        >
          Historial
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
      </div>

      <div className="panel-content">
        {loading && <div className="loading">Cargando...</div>}

        {!loading && activeTab === 'active' && (
          <div className="trades-list">
            {activeTrades.length === 0 ? (
              <div className="empty-state">
                <p>No hay trades activos</p>
              </div>
            ) : (
              activeTrades.map(renderTradeCard)
            )}
          </div>
        )}

        {!loading && activeTab === 'history' && (
          <div className="history-list">
            {tradeHistory.length === 0 ? (
              <div className="empty-state">
                <p>No hay historial de trades</p>
              </div>
            ) : (
              tradeHistory.map((trade, idx) => (
                <div key={idx} className="history-item">
                  <span className={`status-${trade.status}`}>{trade.status}</span>
                  <span>Trade #{trade.tradeId}</span>
                  <span>{new Date(trade.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === 'stats' && stats && (
          <div className="stats-panel">
            <div className="stat-item">
              <span className="stat-label">Total Trades:</span>
              <span className="stat-value">{stats.totalTrades}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completados:</span>
              <span className="stat-value success">{stats.completed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Cancelados:</span>
              <span className="stat-value warning">{stats.cancelled}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rechazados:</span>
              <span className="stat-value danger">{stats.rejected}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TradePanel;
