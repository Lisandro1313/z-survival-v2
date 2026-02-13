/**
 * 👨‍💼 ADMIN ROUTES
 * Rutas para panel de administración
 */

import express from 'express';
import { adminSystem, ROLES } from '../systems/AdminSystem.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin, requireModerator, requireSuperAdmin } from '../middleware/adminMiddleware.js';
import worldState from '../world/WorldState.js';
import { tradingSystem } from '../systems/TradingSystem.js';
import { notificationSystem } from '../systems/NotificationSystem.js';
import performanceMonitor from '../utils/PerformanceMonitor.js';
import cacheManager from '../utils/CacheManager.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ====================================
// DASHBOARD GENERAL
// ====================================

/**
 * GET /api/admin/dashboard
 * Dashboard principal con estadísticas
 */
router.get('/dashboard', requireModerator, (req, res) => {
  try {
    const players = worldState.getAllPlayers();
    const activePlayers = players.filter(p => p.isOnline).length;
    
    const dashboard = {
      server: {
        uptime: `${(process.uptime() / 60).toFixed(2)} minutos`,
        memory: {
          used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
          total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
        },
        performance: performanceMonitor.getSummary()
      },
      players: {
        total: players.length,
        online: activePlayers,
        offline: players.length - activePlayers
      },
      world: {
        totalNodes: worldState.nodes.size,
        regions: worldState.regions.size
      },
      trading: tradingSystem.getStats(),
      notifications: notificationSystem.getStats(),
      admin: adminSystem.getStats(),
      cache: cacheManager.getStats()
    };
    
    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ====================================
// GESTIÓN DE ROLES
// ====================================

/**
 * POST /api/admin/roles/assign
 * Asigna un rol a un usuario (solo admin)
 */
router.post('/roles/assign', requireAdmin, (req, res) => {
  try {
    const { userId, role } = req.body;
    const adminId = req.user.userId;
    
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'userId y role son requeridos'
      });
    }
    
    // Solo superadmin puede asignar superadmin
    if (role === ROLES.SUPERADMIN) {
      const adminRole = adminSystem.getUserRole(adminId);
      if (adminRole !== ROLES.SUPERADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Solo superadmin puede asignar superadmin'
        });
      }
    }
    
    adminSystem.assignRole(userId, role, adminId);
    
    res.json({
      success: true,
      message: `Rol ${role} asignado a usuario ${userId}`
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/roles/revoke
 * Remueve rol de un usuario (solo admin)
 */
router.post('/roles/revoke', requireAdmin, (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId es requerido'
      });
    }
    
    adminSystem.revokeRole(userId, adminId);
    
    res.json({
      success: true,
      message: `Rol removido de usuario ${userId}`
    });
  } catch (error) {
    console.error('Error revoking role:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/roles/list
 * Lista todos los admins
 */
router.get('/roles/list', requireModerator, (req, res) => {
  try {
    const admins = adminSystem.listAdmins();
    
    res.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error('Error listing admins:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ====================================
// GESTIÓN DE USUARIOS
// ====================================

/**
 * POST /api/admin/users/ban
 * Banea a un usuario
 */
router.post('/users/ban', requireModerator, (req, res) => {
  try {
    const { userId, reason, duration } = req.body;
    const adminId = req.user.userId;
    
    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'userId y reason son requeridos'
      });
    }
    
    const durationMs = duration ? duration * 1000 : null;
    adminSystem.banUser(userId, reason, adminId, durationMs);
    
    res.json({
      success: true,
      message: `Usuario ${userId} baneado`
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/users/unban
 * Desbanea a un usuario
 */
router.post('/users/unban', requireModerator, (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId es requerido'
      });
    }
    
    adminSystem.unbanUser(userId, adminId);
    
    res.json({
      success: true,
      message: `Usuario ${userId} desbaneado`
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/users/mute
 * Mutea a un usuario
 */
router.post('/users/mute', requireModerator, (req, res) => {
  try {
    const { userId, reason, duration = 3600 } = req.body;
    const adminId = req.user.userId;
    
    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'userId y reason son requeridos'
      });
    }
    
    const durationMs = duration * 1000;
    adminSystem.muteUser(userId, reason, adminId, durationMs);
    
    res.json({
      success: true,
      message: `Usuario ${userId} muteado por ${duration} segundos`
    });
  } catch (error) {
    console.error('Error muting user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/users/unmute
 * Desmutea a un usuario
 */
router.post('/users/unmute', requireModerator, (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId es requerido'
      });
    }
    
    adminSystem.unmuteUser(userId, adminId);
    
    res.json({
      success: true,
      message: `Usuario ${userId} desmuteado`
    });
  } catch (error) {
    console.error('Error unmuting user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/users/kick
 * Kickea a un usuario (desconectar)
 */
router.post('/users/kick', requireModerator, (req, res) => {
  try {
    const { userId, reason } = req.body;
    const adminId = req.user.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId es requerido'
      });
    }
    
    const player = worldState.getPlayer(userId);
    if (player && player.ws) {
      player.ws.close();
      
      adminSystem.logAction('user:kicked', adminId, {
        userId,
        reason: reason || 'Sin razón'
      });
      
      res.json({
        success: true,
        message: `Usuario ${userId} kickeado`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Usuario no conectado'
      });
    }
  } catch (error) {
    console.error('Error kicking user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users/banned
 * Lista usuarios baneados
 */
router.get('/users/banned', requireModerator, (req, res) => {
  try {
    const banned = adminSystem.listBannedUsers();
    
    res.json({
      success: true,
      banned
    });
  } catch (error) {
    console.error('Error listing banned users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users/muted
 * Lista usuarios muteados
 */
router.get('/users/muted', requireModerator, (req, res) => {
  try {
    const muted = adminSystem.listMutedUsers();
    
    res.json({
      success: true,
      muted
    });
  } catch (error) {
    console.error('Error listing muted users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users/online
 * Lista jugadores online
 */
router.get('/users/online', requireModerator, (req, res) => {
  try {
    const players = worldState.getAllPlayers();
    const online = players
      .filter(p => p.isOnline)
      .map(p => ({
        userId: p.userId,
        username: p.username,
        position: { x: p.x, y: p.y },
        health: p.health,
        connectedAt: p.connectedAt
      }));
    
    res.json({
      success: true,
      online,
      count: online.length
    });
  } catch (error) {
    console.error('Error listing online users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ====================================
// BROADCAST
// ====================================

/**
 * POST /api/admin/broadcast
 * Envía mensaje a todos los jugadores
 */
router.post('/broadcast', requireAdmin, (req, res) => {
  try {
    const { message, type = 'announcement' } = req.body;
    const adminId = req.user.userId;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'message es requerido'
      });
    }
    
    // Enviar notificación a todos los jugadores
    notificationSystem.notifyAll({
      title: '📢 Anuncio del servidor',
      message,
      category: 'system',
      priority: 'high',
      data: { type, from: 'admin' }
    });
    
    adminSystem.logAction('broadcast:sent', adminId, {
      message,
      type
    });
    
    res.json({
      success: true,
      message: 'Broadcast enviado'
    });
  } catch (error) {
    console.error('Error broadcasting:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ====================================
// LOGS Y AUDITORÍA
// ====================================

/**
 * GET /api/admin/logs
 * Obtiene logs de acciones administrativas
 */
router.get('/logs', requireModerator, (req, res) => {
  try {
    const { adminId, action, limit = 100 } = req.query;
    
    const logs = adminSystem.getLogs({
      adminId,
      action,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/stats
 * Estadísticas del sistema
 */
router.get('/stats', requireModerator, (req, res) => {
  try {
    const stats = {
      admin: adminSystem.getStats(),
      trading: tradingSystem.getStats(),
      notifications: notificationSystem.getStats(),
      cache: cacheManager.getStats(),
      performance: performanceMonitor.getSummary()
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
