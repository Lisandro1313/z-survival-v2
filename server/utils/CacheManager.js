/**
 * ⚡ CACHE MANAGER
 * Sistema de caché en memoria con TTL y LRU eviction
 * 
 * Características:
 * - TTL (Time To Live) configurable
 * - LRU (Least Recently Used) eviction
 * - Multiple cache namespaces
 * - Stats y métricas
 */

class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutos por defecto
    
    // Namespaces para diferentes tipos de datos
    this.caches = new Map();
    
    // Estadísticas
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    // Cleanup automático cada minuto
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    
    console.log('⚡ CacheManager inicializado');
  }

  /**
   * Obtiene o crea un namespace de caché
   * @param {string} namespace - Namespace (ej: 'players', 'world', 'trades')
   * @returns {Map} Cache map
   */
  getNamespace(namespace) {
    if (!this.caches.has(namespace)) {
      this.caches.set(namespace, new Map());
    }
    return this.caches.get(namespace);
  }

  /**
   * Guarda un valor en caché
   * @param {string} namespace - Namespace
   * @param {string} key - Clave
   * @param {any} value - Valor
   * @param {number} ttl - TTL en ms (opcional)
   */
  set(namespace, key, value, ttl = null) {
    const cache = this.getNamespace(namespace);
    
    // Eviction LRU si se alcanza el límite
    if (cache.size >= this.maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
      this.stats.evictions++;
    }
    
    const entry = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0
    };
    
    cache.set(key, entry);
    this.stats.sets++;
  }

  /**
   * Obtiene un valor del caché
   * @param {string} namespace - Namespace
   * @param {string} key - Clave
   * @returns {any} Valor o null si no existe/expiró
   */
  get(namespace, key) {
    const cache = this.getNamespace(namespace);
    const entry = cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Verificar TTL
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Actualizar hits y timestamp (LRU)
    entry.hits++;
    entry.timestamp = Date.now();
    this.stats.hits++;
    
    return entry.value;
  }

  /**
   * Verifica si existe una clave
   * @param {string} namespace - Namespace
   * @param {string} key - Clave
   * @returns {boolean}
   */
  has(namespace, key) {
    return this.get(namespace, key) !== null;
  }

  /**
   * Elimina una clave
   * @param {string} namespace - Namespace
   * @param {string} key - Clave
   * @returns {boolean} True si existía
   */
  delete(namespace, key) {
    const cache = this.getNamespace(namespace);
    const result = cache.delete(key);
    if (result) {
      this.stats.deletes++;
    }
    return result;
  }

  /**
   * Limpia un namespace completo
   * @param {string} namespace - Namespace
   */
  clear(namespace) {
    const cache = this.getNamespace(namespace);
    cache.clear();
  }

  /**
   * Limpia todos los namespaces
   */
  clearAll() {
    this.caches.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  /**
   * Limpieza automática de entradas expiradas
   */
  cleanup() {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [namespace, cache] of this.caches) {
      for (const [key, entry] of cache) {
        const age = now - entry.timestamp;
        if (age > entry.ttl) {
          cache.delete(key);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} entradas eliminadas`);
    }
  }

  /**
   * Obtiene o genera un valor (cache-aside pattern)
   * @param {string} namespace - Namespace
   * @param {string} key - Clave
   * @param {Function} generator - Función para generar el valor si no está en caché
   * @param {number} ttl - TTL opcional
   * @returns {any} Valor
   */
  async getOrSet(namespace, key, generator, ttl = null) {
    // Intentar obtener de caché
    const cached = this.get(namespace, key);
    if (cached !== null) {
      return cached;
    }
    
    // Generar valor
    const value = await generator();
    
    // Guardar en caché
    this.set(namespace, key, value, ttl);
    
    return value;
  }

  /**
   * Invalida entradas por patrón
   * @param {string} namespace - Namespace
   * @param {RegExp} pattern - Patrón regex
   */
  invalidatePattern(namespace, pattern) {
    const cache = this.getNamespace(namespace);
    let deleted = 0;
    
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
        deleted++;
      }
    }
    
    console.log(`🗑️ Invalidadas ${deleted} entradas en ${namespace} por patrón`);
    return deleted;
  }

  /**
   * Obtiene estadísticas del caché
   * @returns {object} Stats
   */
  getStats() {
    const totalEntries = Array.from(this.caches.values())
      .reduce((sum, cache) => sum + cache.size, 0);
    
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      totalEntries,
      hitRate: `${hitRate}%`,
      namespaces: Array.from(this.caches.keys()).map(ns => ({
        name: ns,
        size: this.caches.get(ns).size
      }))
    };
  }

  /**
   * Precargar datos en caché
   * @param {string} namespace - Namespace
   * @param {Map} data - Datos a precargar
   * @param {number} ttl - TTL opcional
   */
  preload(namespace, data, ttl = null) {
    let loaded = 0;
    for (const [key, value] of data) {
      this.set(namespace, key, value, ttl);
      loaded++;
    }
    console.log(`📦 Precargadas ${loaded} entradas en ${namespace}`);
  }

  /**
   * Destruye el cache manager
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clearAll();
    console.log('⚡ CacheManager destruido');
  }
}

// Singleton
const cacheManager = new CacheManager({
  maxSize: 5000,
  defaultTTL: 300000 // 5 minutos
});

export { cacheManager, CacheManager };
export default cacheManager;
