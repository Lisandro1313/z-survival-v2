/**
 * 🔔 NOTIFICATION CONTROLLER
 * 
 * Endpoints para gestión de notificaciones
 */

import { notificationSystem } from '../systems/NotificationSystem.js';

export class NotificationController {
  
  /**
   * GET /api/notifications
   * Obtener notificaciones del jugador
   */
  static getNotifications(req, res) {
    try {
      const playerId = req.user.userId;
      const {
        limit = 50,
        offset = 0,
        category,
        unreadOnly,
        priority
      } = req.query;

      const notifications = notificationSystem.getNotifications(playerId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        category,
        unreadOnly: unreadOnly === 'true',
        priority
      });

      const unreadCount = notificationSystem.getUnreadCount(playerId);

      res.json({
        success: true,
        notifications,
        unreadCount,
        count: notifications.length
      });

    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/notifications/unread
   * Obtener solo no leídas
   */
  static getUnread(req, res) {
    try {
      const playerId = req.user.userId;
      const limit = parseInt(req.query.limit) || 50;

      const notifications = notificationSystem.getUnread(playerId, limit);
      const unreadCount = notificationSystem.getUnreadCount(playerId);

      res.json({
        success: true,
        notifications,
        unreadCount
      });

    } catch (error) {
      console.error('Error getting unread notifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/notifications/count
   * Obtener contador de no leídas
   */
  static getUnreadCount(req, res) {
    try {
      const playerId = req.user.userId;
      const category = req.query.category;

      const count = notificationSystem.getUnreadCount(playerId, category);

      res.json({
        success: true,
        unreadCount: count
      });

    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * POST /api/notifications/:notificationId/read
   * Marcar como leída
   */
  static markAsRead(req, res) {
    try {
      const playerId = req.user.userId;
      const { notificationId } = req.params;

      const result = notificationSystem.markAsRead(
        playerId,
        parseInt(notificationId)
      );

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      res.json(result);

    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * POST /api/notifications/read-all
   * Marcar todas como leídas
   */
  static markAllAsRead(req, res) {
    try {
      const playerId = req.user.userId;

      const result = notificationSystem.markAllAsRead(playerId);

      res.json(result);

    } catch (error) {
      console.error('Error marking all as read:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * DELETE /api/notifications/:notificationId
   * Eliminar notificación
   */
  static deleteNotification(req, res) {
    try {
      const playerId = req.user.userId;
      const { notificationId } = req.params;

      const result = notificationSystem.deleteNotification(
        playerId,
        parseInt(notificationId)
      );

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      res.json(result);

    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * DELETE /api/notifications
   * Limpiar todas las notificaciones
   */
  static clearAll(req, res) {
    try {
      const playerId = req.user.userId;

      const result = notificationSystem.clearAll(playerId);

      res.json(result);

    } catch (error) {
      console.error('Error clearing notifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/notifications/category/:category
   * Obtener por categoría
   */
  static getByCategory(req, res) {
    try {
      const playerId = req.user.userId;
      const { category } = req.params;
      const limit = parseInt(req.query.limit) || 20;

      const notifications = notificationSystem.getByCategory(
        playerId,
        category,
        limit
      );

      res.json({
        success: true,
        category,
        notifications,
        count: notifications.length
      });

    } catch (error) {
      console.error('Error getting notifications by category:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/notifications/stats
   * Estadísticas del sistema (admin)
   */
  static getStats(req, res) {
    try {
      const stats = notificationSystem.getStats();

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export default NotificationController;
