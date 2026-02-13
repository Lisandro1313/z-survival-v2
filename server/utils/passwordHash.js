/**
 * Password Hashing Utilities
 * Usando crypto nativo de Node.js (sin dependencias externas)
 */

import crypto from 'crypto';

// Configuración de hashing
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const ITERATIONS = 100000;
const DIGEST = 'sha512';

/**
 * Hash de password usando PBKDF2
 * @param {string} password - Password en texto plano
 * @returns {string} - Hash en formato: salt:hash
 */
export async function hashPassword(password) {
    return new Promise((resolve, reject) => {
        // Generar salt aleatorio
        const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
        
        // Generar hash
        crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) {
                reject(err);
                return;
            }
            
            const hash = derivedKey.toString('hex');
            resolve(`${salt}:${hash}`);
        });
    });
}

/**
 * Verificar password contra hash
 * @param {string} password - Password en texto plano
 * @param {string} storedHash - Hash almacenado (formato: salt:hash)
 * @returns {boolean} - true si coincide
 */
export async function verifyPassword(password, storedHash) {
    return new Promise((resolve, reject) => {
        const [salt, originalHash] = storedHash.split(':');
        
        if (!salt || !originalHash) {
            reject(new Error('Invalid hash format'));
            return;
        }
        
        crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) {
                reject(err);
                return;
            }
            
            const hash = derivedKey.toString('hex');
            resolve(hash === originalHash);
        });
    });
}

/**
 * Generar password aleatorio seguro
 * @param {number} length - Longitud del password (por defecto 12)
 * @returns {string} - Password aleatorio
 */
export function generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const bytes = crypto.randomBytes(length);
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[bytes[i] % charset.length];
    }
    
    return password;
}

/**
 * Validar fortaleza del password
 * @param {string} password
 * @returns {object} - {valid: boolean, errors: string[]}
 */
export function validatePasswordStrength(password) {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('Password debe tener al menos 8 caracteres');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password debe contener al menos una letra minúscula');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password debe contener al menos una letra mayúscula');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Password debe contener al menos un número');
    }
    
    if (password.length < 12 && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
        errors.push('Password corto debe contener al menos un carácter especial');
    }
    
    // Detectar passwords comunes
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password demasiado común, elige otro');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        strength: calculatePasswordStrength(password)
    };
}

/**
 * Calcular score de fortaleza (0-100)
 */
function calculatePasswordStrength(password) {
    let score = 0;
    
    // Longitud
    score += Math.min(password.length * 4, 40);
    
    // Variedad de caracteres
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 15;
    
    // Variedad adicional
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 15);
    
    return Math.min(score, 100);
}

/**
 * Generar token de recuperación de password
 */
export function generateRecoveryToken() {
    return crypto.randomBytes(32).toString('hex');
}

export default {
    hashPassword,
    verifyPassword,
    generateRandomPassword,
    validatePasswordStrength,
    generateRecoveryToken
};
