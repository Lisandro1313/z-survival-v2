/**
 * JWT Utilities
 * Gestión de tokens de autenticación
 */

import jwt from 'jsonwebtoken';

// Secret keys (en producción usar variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'z-survival-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'z-survival-refresh-secret-key';

// Duración de tokens
const ACCESS_TOKEN_EXPIRY = '15m';      // 15 minutos
const REFRESH_TOKEN_EXPIRY = '7d';      // 7 días

/**
 * Generar token de acceso
 */
export function generateAccessToken(payload) {
    return jwt.sign(
        { 
            userId: payload.userId,
            username: payload.username,
            type: 'access'
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

/**
 * Generar refresh token
 */
export function generateRefreshToken(payload) {
    return jwt.sign(
        { 
            userId: payload.userId,
            username: payload.username,
            type: 'refresh'
        },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
}

/**
 * Generar par de tokens (access + refresh)
 */
export function generateTokenPair(payload) {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        expiresIn: 900 // 15 minutos en segundos
    };
}

/**
 * Verificar access token
 */
export function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.type !== 'access') {
            throw new Error('Invalid token type');
        }
        
        return { 
            valid: true, 
            payload: decoded 
        };
    } catch (error) {
        return { 
            valid: false, 
            error: error.message,
            expired: error.name === 'TokenExpiredError'
        };
    }
}

/**
 * Verificar refresh token
 */
export function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        
        return { 
            valid: true, 
            payload: decoded 
        };
    } catch (error) {
        return { 
            valid: false, 
            error: error.message 
        };
    }
}

/**
 * Extraer payload del token sin verificar (útil para tokens expirados)
 */
export function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
}

/**
 * Renovar access token usando refresh token
 */
export function refreshAccessToken(refreshToken) {
    const result = verifyRefreshToken(refreshToken);
    
    if (!result.valid) {
        return { 
            success: false, 
            error: result.error 
        };
    }
    
    const newAccessToken = generateAccessToken({
        userId: result.payload.userId,
        username: result.payload.username
    });
    
    return { 
        success: true, 
        accessToken: newAccessToken,
        expiresIn: 900
    };
}

/**
 * Extraer token del header Authorization
 */
export function extractTokenFromHeader(authHeader) {
    if (!authHeader) {
        return null;
    }
    
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    
    return parts[1];
}

/**
 * Verificar si un token está próximo a expirar (dentro de 2 minutos)
 */
export function isTokenExpiringSoon(token) {
    const decoded = decodeToken(token);
    
    if (!decoded || !decoded.exp) {
        return true;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    return timeUntilExpiry < 120; // Menos de 2 minutos
}

export default {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
    refreshAccessToken,
    extractTokenFromHeader,
    isTokenExpiringSoon
};
