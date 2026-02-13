/**
 * 👨‍💼 ADMIN SYSTEM
 * Sistema de administración con roles y permisos
 */

import { EventEmitter } from 'events';

// Roles disponibles
export const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
};

// Permisos por rol
export const PERMISSIONS = {
  [ROLES.USER]: [
    'game:play',
    'game:trade',
    'game:chat',
    'profile:view',
    'profile:edit_own'
  ],
  [ROLES.MODERATOR]: [
    'game:play',
    'game:trade',
    'game:chat',
    'profile:view',
    'profile:edit_own',
    'moderation:mute',
    'moderation:kick',
    'reports:view',
    'reports:resolve'
  ],
  [ROLES.ADMIN]: [
    'game:play',
    'game:trade',
    'game:chat',
    'profile:view',
    'profile:edit_own',
    'profile:edit_any',
    'moderation:mute',
    'moderation:kick',
    'moderation:ban',
    'reports:view',
    'reports:resolve',
    'admin:view_stats',
    'admin:manage_users',
    'admin:broadcast'
  ],
  [ROLES.SUPERADMIN]: [
    '*' // Todos los permisos
  ]
};

class AdminSystem extends EventEmitter {
  constructor() {
    super();
    
    // Usuarios con roles especiales
    // userId -> { role, permissions, assignedAt, assignedBy }
    this.adminUsers = new Map();
    
    // Bans activos
    // userId -> { reason, bannedBy, bannedAt, expiresAt, permanent }
    this.bannedUsers = new Map();
    
    // Mutes activos
    // userId -> { reason, mutedBy, mutedAt, expiresAt }
    this.mutedUsers = new Map();
    
    // Logs de acciones administrativas
    this.actionLogs = [];
    this.maxLogs = 1000;
    
    console.log('👨‍💼 AdminSystem inicializado');
  }

  /**
   * Asigna rol a un usuario
   * @param {string} userId - ID del usuario
   * @param {string} role - Rol a asignar
   * @param {string} assignedBy - ID del admin que asigna
   */
  assignRole(userId, role, assignedBy) {
    if (!Object.values(ROLES).includes(role)) {
      throw new Error('Rol inválido');
    }
    
    this.adminUsers.set(userId, {
      role,
      permissions: PERMISSIONS[role],
      assignedAt: Date.now(),
      assignedBy
    });
    
    this.logAction('role:assigned', assignedBy, {
      userId,
      role
    });
    
    this.emit('role:assigned', { userId, role, assignedBy });
    
    console.log(`👨‍💼 Rol ${role} asignado a usuario ${userId}`);
  }

  /**
   * Remueve rol de un usuario
   * @param {string} userId - ID del usuario
   * @param {string} removedBy - ID del admin que remueve
   */
  revokeRole(userId, removedBy) {
    const userData = this.adminUsers.get(userId);
    
    if (!userData) {
      throw new Error('Usuario sin rol especial');
    }
    
    this.adminUsers.delete(userId);
    
    this.logAction('role:revoked', removedBy, {
      userId,
      oldRole: userData.role
    });
    
    this.emit('role:revoked', { userId, removedBy });
    
    console.log(`👨‍💼 Rol removido de usuario ${userId}`);
  }

  /**
   * Obtiene rol de un usuario
   * @param {string} userId - ID del usuario
   * @returns {string} Rol
   */
  getUserRole(userId) {
    const userData = this.adminUsers.get(userId);
    return userData ? userData.role : ROLES.USER;
  }

  /**
   * Verifica si un usuario tiene un permiso
   * @param {string} userId - ID del usuario
   * @param {string} permission - Permiso a verificar
   * @returns {boolean}
   */
  hasPermission(userId, permission) {
    const userData = this.adminUsers.get(userId);
    
    if (!userData) {
      // Usuario normal, verificar permisos de USER
      return PERMISSIONS[ROLES.USER].includes(permission);
    }
    
    // Superadmin tiene todos los permisos
    if (userData.permissions.includes('*')) {
      return true;
    }
    
    return userData.permissions.includes(permission);
  }

  /**
   * Banea a un usuario
   * @param {string} userId - ID del usuario
   * @param {string} reason - Razón del ban
   * @param {string} bannedBy - ID del admin
   * @param {number} duration - Duración en ms (null = permanente)
   */
  banUser(userId, reason, bannedBy, duration = null) {
    const ban = {
      reason,
      bannedBy,
      bannedAt: Date.now(),
      expiresAt: duration ? Date.now() + duration : null,
      permanent: duration === null
    };
    
    this.bannedUsers.set(userId, ban);
    
    this.logAction('user:banned', bannedBy, {
      userId,
      reason,
      duration: duration ? `${duration / 1000}s` : 'permanente'
    });
    
    this.emit('user:banned', { userId, ban });
    
    console.log(`🚫 Usuario ${userId} baneado: ${reason}`);
  }

  /**
   * Desbanea a un usuario
   * @param {string} userId - ID del usuario
   * @param {string} unbannedBy - ID del admin
   */
  unbanUser(userId, unbannedBy) {
    if (!this.bannedUsers.has(userId)) {
      throw new Error('Usuario no está baneado');
    }
    
    this.bannedUsers.delete(userId);
    
    this.logAction('user:unbanned', unbannedBy, { userId });
    
    this.emit('user:unbanned', { userId, unbannedBy });
    
    console.log(`✅ Usuario ${userId} desbaneado`);
  }

  /**
   * Verifica si un usuario está baneado
   * @param {string} userId - ID del usuario
   * @returns {boolean|object} False o info del ban
   */
  isBanned(userId) {
    const ban = this.bannedUsers.get(userId);
    
    if (!ban) return false;
    
    // Verificar si expiró
    if (!ban.permanent && ban.expiresAt && Date.now() > ban.expiresAt) {
      this.bannedUsers.delete(userId);
      return false;
    }
    
    return ban;
  }

  /**
   * Mutea a un usuario
   * @param {string} userId - ID del usuario
   * @param {string} reason - Razón del mute
   * @param {string} mutedBy - ID del admin
   * @param {number} duration - Duración en ms
   */
  muteUser(userId, reason, mutedBy, duration = 3600000) {
    const mute = {
      reason,
      mutedBy,
      mutedAt: Date.now(),
      expiresAt: Date.now() + duration
    };
    
    this.mutedUsers.set(userId, mute);
    
    this.logAction('user:muted', mutedBy, {
      userId,
      reason,
      duration: `${duration / 1000}s`
    });
    
    this.emit('user:muted', { userId, mute });
    
    console.log(`🔇 Usuario ${userId} muteado: ${reason}`);
  }

  /**
   * Desmutea a un usuario
   * @param {string} userId - ID del usuario
   * @param {string} unmutedBy - ID del admin
   */
  unmuteUser(userId, unmutedBy) {
    if (!this.mutedUsers.has(userId)) {
      throw new Error('Usuario no está muteado');
    }
    
    this.mutedUsers.delete(userId);
    
    this.logAction('user:unmuted', unmutedBy, { userId });
    
    this.emit('user:unmuted', { userId, unmutedBy });
    
    console.log(`🔊 Usuario ${userId} desmuteado`);
  }

  /**
   * Verifica si un usuario está muteado
   * @param {string} userId - ID del usuario
   * @returns {boolean|object} False o info del mute
   */
  isMuted(userId) {
    const mute = this.mutedUsers.get(userId);
    
    if (!mute) return false;
    
    // Verificar si expiró
    if (Date.now() > mute.expiresAt) {
      this.mutedUsers.delete(userId);
      return false;
    }
    
    return mute;
  }

  /**
   * Registra una acción administrativa
   * @param {string} action - Acción realizada
   * @param {string} adminId - ID del admin
   * @param {object} details - Detalles
   */
  logAction(action, adminId, details = {}) {
    const log = {
      id: this.actionLogs.length + 1,
      action,
      adminId,
      details,
      timestamp: Date.now()
    };
    
    this.actionLogs.push(log);
    
    // Limitar tamaño del log
    if (this.actionLogs.length > this.maxLogs) {
      this.actionLogs.shift();
    }
    
    this.emit('action:logged', log);
  }

  /**
   * Obtiene logs de acciones
   * @param {object} filters - Filtros
   * @returns {Array} Logs
   */
  getLogs(filters = {}) {
    let logs = [...this.actionLogs];
    
    if (filters.adminId) {
      logs = logs.filter(log => log.adminId === filters.adminId);
    }
    
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    
    if (filters.limit) {
      logs = logs.slice(-filters.limit);
    }
    
    return logs.reverse();
  }

  /**
   * Obtiene estadísticas generales
   * @returns {object} Stats
   */
  getStats() {
    return {
      totalAdmins: this.adminUsers.size,
      totalBans: this.bannedUsers.size,
      totalMutes: this.mutedUsers.size,
      totalActions: this.actionLogs.length,
      roleDistribution: {
        moderator: Array.from(this.adminUsers.values())
          .filter(u => u.role === ROLES.MODERATOR).length,
        admin: Array.from(this.adminUsers.values())
          .filter(u => u.role === ROLES.ADMIN).length,
        superadmin: Array.from(this.adminUsers.values())
          .filter(u => u.role === ROLES.SUPERADMIN).length
      }
    };
  }

  /**
   * Lista todos los admins
   * @returns {Array} Admins
   */
  listAdmins() {
    return Array.from(this.adminUsers.entries()).map(([userId, data]) => ({
      userId,
      ...data
    }));
  }

  /**
   * Lista usuarios baneados
   * @returns {Array} Banned users
   */
  listBannedUsers() {
    return Array.from(this.bannedUsers.entries()).map(([userId, ban]) => ({
      userId,
      ...ban
    }));
  }

  /**
   * Lista usuarios muteados
   * @returns {Array} Muted users
   */
  listMutedUsers() {
    return Array.from(this.mutedUsers.entries()).map(([userId, mute]) => ({
      userId,
      ...mute
    }));
  }
}

// Singleton
const adminSystem = new AdminSystem();

export { adminSystem, AdminSystem };
export default adminSystem;
