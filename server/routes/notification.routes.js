/**
 * 🔔 NOTIFICATION ROUTES
 */

import express from 'express';
import NotificationController from '../controllers/NotificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener notificaciones
router.get('/', NotificationController.getNotifications);

// Obtener no leídas
router.get('/unread', NotificationController.getUnread);

// Contador de no leídas
router.get('/count', NotificationController.getUnreadCount);

// Marcar como leída
router.post('/:notificationId/read', NotificationController.markAsRead);

// Marcar todas como leídas
router.post('/read-all', NotificationController.markAllAsRead);

// Eliminar notificación
router.delete('/:notificationId', NotificationController.deleteNotification);

// Limpiar todas
router.delete('/', NotificationController.clearAll);

// Por categoría
router.get('/category/:category', NotificationController.getByCategory);

// Stats
router.get('/stats', NotificationController.getStats);

export default router;
