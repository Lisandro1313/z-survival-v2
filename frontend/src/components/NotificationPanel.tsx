import React, { useState, useEffect, useRef } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import './NotificationPanel.css';

// Iconos por categoría
const categoryIcons: Record<string, string> = {
  trade: '🤝',
  combat: '⚔️',
  social: '👥',
  system: '⚙️',
  radio: '📻',
  events: '🎯'
};

// Colores por tipo
const typeColors: Record<string, string> = {
  info: '#3498db',
  success: '#2ecc71',
  warning: '#f39c12',
  error: '#e74c3c'
};

export const NotificationPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Ejecutar acciones si las hay
    if (notification.actions && notification.actions.length > 0) {
      const action = notification.actions[0];
      // Aquí puedes manejar diferentes tipos de acciones
      console.log('Action:', action);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    if (window.confirm('¿Eliminar todas las notificaciones?')) {
      await clearAll();
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  return (
    <div className="notification-panel" ref={panelRef}>
      {/* Bell Icon con Badge */}
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Panel Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <h3>Notificaciones</h3>
            <div className="notification-actions">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Todas
              </button>
              <button 
                className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                No leídas ({unreadCount})
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {notifications.length > 0 && (
            <div className="bulk-actions">
              <button onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                ✓ Marcar todas como leídas
              </button>
              <button onClick={handleClearAll} className="danger">
                🗑️ Limpiar todas
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="notification-list">
            {isLoading ? (
              <div className="notification-empty">
                <div className="spinner"></div>
                <p>Cargando notificaciones...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">🔕</span>
                <p>{filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'} priority-${notification.priority}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ borderLeftColor: typeColors[notification.type] }}
                >
                  <div className="notification-icon">
                    {categoryIcons[notification.category]}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTime(notification.timestamp)}</div>
                  </div>

                  <div className="notification-controls">
                    {!notification.read && (
                      <button 
                        className="mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Marcar como leída"
                      >
                        ✓
                      </button>
                    )}
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
