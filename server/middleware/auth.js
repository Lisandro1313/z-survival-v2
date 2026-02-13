/**
 * Authentication Middleware
 * Middleware para proteger rutas y validar JWT tokens
 */

import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';

/**
 * Middleware de autenticación para Express routes
 * Verifica JWT token en header Authorization
 */
export function authenticateToken(req, res, next) {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
        return res.status(401).json({
            error: 'Access token required',
            code: 'NO_TOKEN'
        });
    }
    
    const result = verifyAccessToken(token);
    
    if (!result.valid) {
        if (result.expired) {
            return res.status(401).json({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        return res.status(403).json({
            error: 'Invalid token',
            code: 'INVALID_TOKEN',
            details: result.error
        });
    }
    
    // Agregar datos del usuario al request
    req.user = {
        userId: result.payload.userId,
        username: result.payload.username
    };
    
    next();
}

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, solo lo verifica si existe
 */
export function optionalAuth(req, res, next) {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
        req.user = null;
        return next();
    }
    
    const result = verifyAccessToken(token);
    
    if (result.valid) {
        req.user = {
            userId: result.payload.userId,
            username: result.payload.username
        };
    } else {
        req.user = null;
    }
    
    next();
}

/**
 * Middleware para WebSocket authentication
 * Valida token y agrega userId a la conexión
 */
export function authenticateWebSocket(ws, token) {
    if (!token) {
        return {
            authenticated: false,
            error: 'No token provided'
        };
    }
    
    const result = verifyAccessToken(token);
    
    if (!result.valid) {
        return {
            authenticated: false,
            error: result.error,
            expired: result.expired
        };
    }
    
    // Agregar datos del usuario al WebSocket
    ws.userId = result.payload.userId;
    ws.username = result.payload.username;
    
    return {
        authenticated: true,
        userId: result.payload.userId,
        username: result.payload.username
    };
}

/**
 * Middleware para requerir rol específico
 * (Para futuras expansiones con sistema de roles)
 */
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'NO_AUTH'
            });
        }
        
        // Por ahora todos los usuarios tienen rol 'player'
        // En el futuro: verificar req.user.role
        const userRole = req.user.role || 'player';
        
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                code: 'FORBIDDEN',
                required: roles,
                current: userRole
            });
        }
        
        next();
    };
}

/**
 * Rate limiting por usuario
 * Limita requests por usuario autenticado
 */
const userRequestCounts = new Map();

export function rateLimit(maxRequests = 100, windowMs = 60000) {
    return (req, res, next) => {
        if (!req.user) {
            return next(); // Si no está autenticado, usar otro rate limiter global
        }
        
        const userId = req.user.userId;
        const now = Date.now();
        
        if (!userRequestCounts.has(userId)) {
            userRequestCounts.set(userId, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }
        
        const userLimit = userRequestCounts.get(userId);
        
        if (now > userLimit.resetTime) {
            // Reset contador
            userLimit.count = 1;
            userLimit.resetTime = now + windowMs;
            return next();
        }
        
        if (userLimit.count >= maxRequests) {
            const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
            
            return res.status(429).json({
                error: 'Too many requests',
                code: 'RATE_LIMIT',
                retryAfter
            });
        }
        
        userLimit.count++;
        next();
    };
}

/**
 * Cleanup de rate limiting (ejecutar periódicamente)
 */
export function cleanupRateLimits() {
    const now = Date.now();
    
    for (const [userId, data] of userRequestCounts.entries()) {
        if (now > data.resetTime + 300000) { // 5 minutos después del reset
            userRequestCounts.delete(userId);
        }
    }
}

// Limpiar rate limits cada 5 minutos
setInterval(cleanupRateLimits, 300000);

export default {
    authenticateToken,
    optionalAuth,
    authenticateWebSocket,
    requireRole,
    rateLimit
};
