import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';

interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'combat' | 'social' | 'ai';
  message: string;
}

const RightLogs: React.FC = () => {
  const { logs } = useGameStore();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'combat': return '⚔️';
      case 'social': return '💬';
      case 'ai': return '🤖';
      default: return 'ℹ️';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    setAutoScroll(isAtBottom);
  };

  return (
    <div className="right-logs-content">
      <div className="logs-header">
        <h3>📋 Eventos</h3>
        <button 
          className={`auto-scroll-toggle ${autoScroll ? 'active' : ''}`}
          onClick={() => setAutoScroll(!autoScroll)}
          title="Auto-scroll"
        >
          {autoScroll ? '🔽' : '⏸️'}
        </button>
      </div>

      <div className="logs-list" onScroll={handleScroll}>
        {logs.length === 0 ? (
          <div className="logs-empty">
            No hay eventos recientes
          </div>
        ) : (
          logs.map((log: LogEntry) => (
            <div key={log.id} className={`log-entry log-${log.type}`}>
              <span className="log-icon">{getLogIcon(log.type)}</span>
              <div className="log-content">
                <div className="log-message">{log.message}</div>
                <div className="log-time">{formatTime(log.timestamp)}</div>
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      <div className="logs-footer">
        <button 
          className="clear-logs-btn"
          onClick={() => useGameStore.getState().clearLogs()}
        >
          🗑️ Limpiar
        </button>
      </div>
    </div>
  );
};

export default RightLogs;
