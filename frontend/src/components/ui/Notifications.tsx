/**
 * 🔔 NOTIFICATIONS - Sistema de notificaciones
 */

import { useGameStore } from '../../stores/gameStore';
import './Notifications.css';

function Notifications() {
  const { ui, removeNotification } = useGameStore();

  if (ui.notifications.length === 0) {
    return null;
  }

  return (
    <div className="notifications-container">
      {ui.notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <span className="notification-icon">
            {notification.type === 'error' && '❌'}
            {notification.type === 'warning' && '⚠️'}
            {notification.type === 'success' && '✅'}
            {notification.type === 'info' && 'ℹ️'}
          </span>
          <span className="notification-message">{notification.message}</span>
        </div>
      ))}
    </div>
  );
}

export default Notifications;
