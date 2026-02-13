/**
 * 🔔 NOTIFICATION SYSTEM
 * 
 * Sistema unificado de notificaciones en tiempo real
 * - Notificaciones persistentes por jugador
 * - Prioridades (low, normal, high, critical)
 * - Auto-expiración configurable
 * - Categorías (trade, combat, social, system, radio, events)
 * - Read/Unread tracking
 * - Broadcast a jugadores específicos o grupos
 */

import { EventEmitter } from 'events';

export class NotificationSystem extends EventEmitter {
  constructor() {
    super();
    
    this.notifications = new Map(); // notificationId → Notification
    this.playerNotifications = new Map(); // playerId → Set<notificationId>
    this.unreadCount = new Map(); // playerId → number
    
    this.nextNotificationId = 1;
    
    console.log('🔔 Notification System initialized');
  }

  // ====================================
  // CREATE NOTIFICATIONS
  // ====================================

  /**
   * Enviar notificación a un jugador
   */
  notify(playerId, notification) {
    const notif = {
      id: this.nextNotificationId++,
      playerId,
      type: notification.type || 'info', // info, success, warning, error
      category: notification.category || 'system', // trade, combat, social, system, radio, events
      priority: notification.priority || 'normal', // low, normal, high, critical
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      read: false,
      persistent: notification.persistent !== false, // Por defecto persistente
      expiresAt: notification.expiresAt || (Date.now() + (24 * 60 * 60 * 1000)), // 24h por defecto
      createdAt: Date.now(),
      actions: notification.actions || [] // Botones de acción
    };

    // Guardar notificación
    this.notifications.set(notif.id, notif);
    
    // Indexar por jugador
    if (!this.playerNotifications.has(playerId)) {
      this.playerNotifications.set(playerId, new Set());
    }
    this.playerNotifications.get(playerId).add(notif.id);

    // Incrementar contador de no leídas
    this.unreadCount.set(playerId, (this.unreadCount.get(playerId) || 0) + 1);

    // Emitir evento para WebSocket broadcast
    this.emit('notification', { playerId, notification: notif });

    return notif;
  }

  /**
   * Notificar a múltiples jugadores
   */
  notifyMultiple(playerIds, notification) {
    const results = [];
    
    for (const playerId of playerIds) {
      const notif = this.notify(playerId, notification);
      results.push(notif);
    }
    
    return results;
  }

  /**
   * Notificar a todos los jugadores online
   */
  notifyAll(notification) {
    // Esto lo manejará el servidor pasando lista de jugadores online
    this.emit('notification:broadcast', { notification });
  }

  /**
   * Notificar a jugadores en un nodo específico
   */
  notifyNode(nodeId, notification) {
    this.emit('notification:node', { nodeId, notification });
  }

  /**
   * Notificar a jugadores en una región
   */
  notifyRegion(regionId, notification) {
    this.emit('notification:region', { regionId, notification });
  }

  // ====================================
  // READ/MANAGE NOTIFICATIONS
  // ====================================

  /**
   * Marcar notificación como leída
   */
  markAsRead(playerId, notificationId) {
    const notif = this.notifications.get(notificationId);
    
    if (!notif || notif.playerId !== playerId) {
      return { success: false, error: 'Notificación no encontrada' };
    }

    if (!notif.read) {
      notif.read = true;
      notif.readAt = Date.now();
      
      // Decrementar contador
      const count = this.unreadCount.get(playerId) || 0;
      this.unreadCount.set(playerId, Math.max(0, count - 1));

      this.emit('notification:read', { playerId, notificationId });
    }

    return { success: true };
  }

  /**
   * Marcar todas como leídas
   */
  markAllAsRead(playerId) {
    const notifIds = this.playerNotifications.get(playerId);
    
    if (!notifIds) {
      return { success: true, count: 0 };
    }

    let count = 0;
    for (const notifId of notifIds) {
      const notif = this.notifications.get(notifId);
      if (notif && !notif.read) {
        notif.read = true;
        notif.readAt = Date.now();
        count++;
      }
    }

    this.unreadCount.set(playerId, 0);
    this.emit('notification:read_all', { playerId });

    return { success: true, count };
  }

  /**
   * Eliminar notificación
   */
  deleteNotification(playerId, notificationId) {
    const notif = this.notifications.get(notificationId);
    
    if (!notif || notif.playerId !== playerId) {
      return { success: false, error: 'Notificación no encontrada' };
    }

    // Remover de índices
    this.notifications.delete(notificationId);
    
    const playerNotifs = this.playerNotifications.get(playerId);
    if (playerNotifs) {
      playerNotifs.delete(notificationId);
      if (playerNotifs.size === 0) {
        this.playerNotifications.delete(playerId);
      }
    }

    // Decrementar contador si no estaba leída
    if (!notif.read) {
      const count = this.unreadCount.get(playerId) || 0;
      this.unreadCount.set(playerId, Math.max(0, count - 1));
    }

    this.emit('notification:deleted', { playerId, notificationId });

    return { success: true };
  }

  /**
   * Limpiar todas las notificaciones de un jugador
   */
  clearAll(playerId) {
    const notifIds = this.playerNotifications.get(playerId);
    
    if (!notifIds) {
      return { success: true, count: 0 };
    }

    let count = 0;
    for (const notifId of notifIds) {
      this.notifications.delete(notifId);
      count++;
    }

    this.playerNotifications.delete(playerId);
    this.unreadCount.delete(playerId);

    return { success: true, count };
  }

  // ====================================
  // QUERY METHODS
  // ====================================

  /**
   * Obtener notificaciones de un jugador
   */
  getNotifications(playerId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      category = null,
      unreadOnly = false,
      priority = null
    } = options;

    const notifIds = this.playerNotifications.get(playerId);
    
    if (!notifIds) {
      return [];
    }

    let notifications = Array.from(notifIds)
      .map(id => this.notifications.get(id))
      .filter(Boolean);

    // Filtros
    if (category) {
      notifications = notifications.filter(n => n.category === category);
    }

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    if (priority) {
      notifications = notifications.filter(n => n.priority === priority);
    }

    // Ordenar por fecha (más recientes primero)
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    // Paginación
    return notifications.slice(offset, offset + limit);
  }

  /**
   * Obtener contador de no leídas
   */
  getUnreadCount(playerId, category = null) {
    if (!category) {
      return this.unreadCount.get(playerId) || 0;
    }

    // Contar por categoría
    const notifIds = this.playerNotifications.get(playerId);
    if (!notifIds) return 0;

    let count = 0;
    for (const notifId of notifIds) {
      const notif = this.notifications.get(notifId);
      if (notif && !notif.read && notif.category === category) {
        count++;
      }
    }

    return count;
  }

  /**
   * Obtener notificaciones por categoría
   */
  getByCategory(playerId, category, limit = 20) {
    return this.getNotifications(playerId, { category, limit });
  }

  /**
   * Obtener solo no leídas
   */
  getUnread(playerId, limit = 50) {
    return this.getNotifications(playerId, { unreadOnly: true, limit });
  }

  // ====================================
  // CLEANUP
  // ====================================

  /**
   * Limpiar notificaciones expiradas
   */
  cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [notifId, notif] of this.notifications.entries()) {
      if (now > notif.expiresAt) {
        this.deleteNotification(notif.playerId, notifId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired notifications`);
    }

    return cleaned;
  }

  /**
   * Limpiar notificaciones leídas antiguas (>7 días)
   */
  cleanupOldRead() {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [notifId, notif] of this.notifications.entries()) {
      if (notif.read && notif.readAt && notif.readAt < sevenDaysAgo) {
        this.deleteNotification(notif.playerId, notifId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old read notifications`);
    }

    return cleaned;
  }

  // ====================================
  // STATS
  // ====================================

  getStats() {
    return {
      totalNotifications: this.notifications.size,
      totalPlayers: this.playerNotifications.size,
      totalUnread: Array.from(this.unreadCount.values()).reduce((sum, val) => sum + val, 0),
      byCategory: this._countByCategory(),
      byPriority: this._countByPriority()
    };
  }

  _countByCategory() {
    const counts = {};
    for (const notif of this.notifications.values()) {
      counts[notif.category] = (counts[notif.category] || 0) + 1;
    }
    return counts;
  }

  _countByPriority() {
    const counts = {};
    for (const notif of this.notifications.values()) {
      counts[notif.priority] = (counts[notif.priority] || 0) + 1;
    }
    return counts;
  }
}

// Singleton
export const notificationSystem = new NotificationSystem();

export default notificationSystem;
