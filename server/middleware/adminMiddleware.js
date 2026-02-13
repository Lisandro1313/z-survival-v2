/**
 * 👨‍💼 ADMIN MIDDLEWARE
 * Middleware para verificar roles y permisos
 */

import { adminSystem, ROLES } from '../systems/AdminSystem.js';

/**
 * Verifica que el usuario tenga un rol específico
 * @param {string|Array<string>} allowedRoles - Rol(es) permitido(s)
 * @returns {Function} Middleware
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }
    
    const userRole = adminSystem.getUserRole(req.user.userId);
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes',
        requiredRole: allowedRoles,
        currentRole: userRole
      });
    }
    
    // Agregar rol al request
    req.userRole = userRole;
    
    next();
  };
}

/**
 * Verifica que el usuario tenga un permiso específico
 * @param {string} permission - Permiso requerido
 * @returns {Function} Middleware
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }
    
    const hasPermission = adminSystem.hasPermission(req.user.userId, permission);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes',
        requiredPermission: permission
      });
    }
    
    next();
  };
}

/**
 * Verifica que el usuario sea al menos moderador
 */
export const requireModerator = requireRole(ROLES.MODERATOR, ROLES.ADMIN, ROLES.SUPERADMIN);

/**
 * Verifica que el usuario sea al menos admin
 */
export const requireAdmin = requireRole(ROLES.ADMIN, ROLES.SUPERADMIN);

/**
 * Verifica que el usuario sea superadmin
 */
export const requireSuperAdmin = requireRole(ROLES.SUPERADMIN);

/**
 * Middleware para verificar si el usuario está baneado
 */
export function checkBan(req, res, next) {
  if (!req.user || !req.user.userId) {
    return next();
  }
  
  const ban = adminSystem.isBanned(req.user.userId);
  
  if (ban) {
    return res.status(403).json({
      success: false,
      message: 'Usuario baneado',
      ban: {
        reason: ban.reason,
        bannedAt: ban.bannedAt,
        expiresAt: ban.expiresAt,
        permanent: ban.permanent
      }
    });
  }
  
  next();
}

/**
 * Middleware para verificar si el usuario está muteado
 */
export function checkMute(req, res, next) {
  if (!req.user || !req.user.userId) {
    return next();
  }
  
  const mute = adminSystem.isMuted(req.user.userId);
  
  if (mute) {
    // El usuario puede continuar, pero agregar info al request
    req.userMuted = true;
    req.muteInfo = mute;
  }
  
  next();
}

export default {
  requireRole,
  requirePermission,
  requireModerator,
  requireAdmin,
  requireSuperAdmin,
  checkBan,
  checkMute
};
