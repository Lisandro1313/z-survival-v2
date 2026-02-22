import React, { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import './Notification.css';

export interface NotificationProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  id,
  message,
  type,
  duration = 5000
}) => {
  const removeNotification = useUIStore((state) => state.removeNotification);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeNotification(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, removeNotification]);

  const handleClose = () => {
    removeNotification(id);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
    }
  };

  return (
    <div className={`notification notification--${type}`}>
      <div className="notification__icon">{getIcon()}</div>
      <div className="notification__content">
        <p className="notification__message">{message}</p>
      </div>
      <button 
        className="notification__close" 
        onClick={handleClose}
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const notifications = useUIStore((state) => state.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
        />
      ))}
    </div>
  );
};

