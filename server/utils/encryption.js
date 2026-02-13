/**
 * 🔐 ENCRYPTION UTILITY
 * Sistema de encriptación AES-256-GCM para mensajes de radio seguros
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const AUTH_TAG_LENGTH = 16;

/**
 * Genera una clave de encriptación aleatoria
 * @returns {string} Clave en formato hex
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Deriva una clave de encriptación desde una passphrase
 * @param {string} passphrase - Frase secreta
 * @param {string} salt - Salt (opcional)
 * @returns {Buffer} Clave derivada
 */
export function deriveKey(passphrase, salt = 'z-survival-radio-salt') {
  return crypto.pbkdf2Sync(passphrase, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encripta un mensaje usando AES-256-GCM
 * @param {string} text - Texto a encriptar
 * @param {string} keyHex - Clave en formato hex
 * @returns {object} { encrypted, iv, authTag } todos en hex
 */
export function encrypt(text, keyHex) {
  try {
    const key = Buffer.from(keyHex, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('Error encrypting:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Desencripta un mensaje usando AES-256-GCM
 * @param {string} encrypted - Texto encriptado en hex
 * @param {string} keyHex - Clave en formato hex
 * @param {string} ivHex - IV en formato hex
 * @param {string} authTagHex - Auth tag en formato hex
 * @returns {string} Texto desencriptado
 */
export function decrypt(encrypted, keyHex, ivHex, authTagHex) {
  try {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting:', error);
    throw new Error('Decryption failed - Invalid key or corrupted data');
  }
}

/**
 * Encripta un mensaje con passphrase (más fácil para usuarios)
 * @param {string} text - Texto a encriptar
 * @param {string} passphrase - Frase secreta
 * @returns {object} { encrypted, iv, authTag } todos en hex
 */
export function encryptWithPassphrase(text, passphrase) {
  const key = deriveKey(passphrase);
  return encrypt(text, key.toString('hex'));
}

/**
 * Desencripta un mensaje con passphrase
 * @param {string} encrypted - Texto encriptado en hex
 * @param {string} passphrase - Frase secreta
 * @param {string} ivHex - IV en formato hex
 * @param {string} authTagHex - Auth tag en formato hex
 * @returns {string} Texto desencriptado
 */
export function decryptWithPassphrase(encrypted, passphrase, ivHex, authTagHex) {
  const key = deriveKey(passphrase);
  return decrypt(encrypted, key.toString('hex'), ivHex, authTagHex);
}

/**
 * Genera un hash de una clave para identificación (no para encriptar)
 * @param {string} key - Clave a hashear
 * @returns {string} Hash en hex (primeros 16 caracteres)
 */
export function keyFingerprint(key) {
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
}

/**
 * Empaqueta datos encriptados en un string compacto
 * @param {object} encrypted - { encrypted, iv, authTag }
 * @returns {string} Formato: encrypted.iv.authTag
 */
export function packEncrypted({ encrypted, iv, authTag }) {
  return `${encrypted}.${iv}.${authTag}`;
}

/**
 * Desempaqueta un string encriptado
 * @param {string} packed - Formato: encrypted.iv.authTag
 * @returns {object} { encrypted, iv, authTag }
 */
export function unpackEncrypted(packed) {
  const [encrypted, iv, authTag] = packed.split('.');
  if (!encrypted || !iv || !authTag) {
    throw new Error('Invalid encrypted message format');
  }
  return { encrypted, iv, authTag };
}

// Exportar todo
export default {
  generateEncryptionKey,
  deriveKey,
  encrypt,
  decrypt,
  encryptWithPassphrase,
  decryptWithPassphrase,
  keyFingerprint,
  packEncrypted,
  unpackEncrypted
};
