/**
 * ⚡ QUERY OPTIMIZER
 * Optimizaciones de queries y batching para mejor rendimiento
 */

import cacheManager from './CacheManager.js';

class QueryOptimizer {
  constructor() {
    // Batcher para queries en lote
    this.batchQueue = new Map();
    this.batchTimeout = 50; // ms
    this.batchTimers = new Map();
    
    console.log('⚡ QueryOptimizer inicializado');
  }

  /**
   * Batch de múltiples queries similares
   * @param {string} queryType - Tipo de query
   * @param {string} key - Clave única
   * @param {Function} executor - Función que ejecuta el batch
   * @returns {Promise} Resultado
   */
  batch(queryType, key, executor) {
    return new Promise((resolve, reject) => {
      // Crear batch queue si no existe
      if (!this.batchQueue.has(queryType)) {
        this.batchQueue.set(queryType, new Map());
      }
      
      const queue = this.batchQueue.get(queryType);
      
      // Agregar a la cola
      queue.set(key, { resolve, reject });
      
      // Cancelar timer anterior
      if (this.batchTimers.has(queryType)) {
        clearTimeout(this.batchTimers.get(queryType));
      }
      
      // Programar ejecución del batch
      const timer = setTimeout(async () => {
        const items = Array.from(queue.keys());
        const callbacks = Array.from(queue.values());
        
        // Limpiar
        queue.clear();
        this.batchTimers.delete(queryType);
        
        try {
          // Ejecutar batch
          const results = await executor(items);
          
          // Resolver promesas
          items.forEach((item, index) => {
            callbacks[index].resolve(results[index]);
          });
        } catch (error) {
          // Rechazar todas
          callbacks.forEach(cb => cb.reject(error));
        }
      }, this.batchTimeout);
      
      this.batchTimers.set(queryType, timer);
    });
  }

  /**
   * Cache wrapper para queries
   * @param {string} namespace - Namespace del caché
   * @param {string} key - Clave
   * @param {Function} queryFn - Función de query
   * @param {number} ttl - TTL opcional
   * @returns {Promise} Resultado
   */
  async cachedQuery(namespace, key, queryFn, ttl = null) {
    return cacheManager.getOrSet(namespace, key, queryFn, ttl);
  }

  /**
   * Memoización de funciones costosas
   * @param {Function} fn - Función a memoizar
   * @param {Function} keyGenerator - Generador de clave desde args
   * @returns {Function} Función memoizada
   */
  memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
    const cache = new Map();
    
    return function(...args) {
      const key = keyGenerator(...args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn.apply(this, args);
      cache.set(key, result);
      
      return result;
    };
  }

  /**
   * Debounce para reducir frecuencia de queries
   * @param {Function} fn - Función a debounce
   * @param {number} delay - Delay en ms
   * @returns {Function} Función debounced
   */
  debounce(fn, delay = 100) {
    let timer = null;
    
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Throttle para limitar frecuencia de queries
   * @param {Function} fn - Función a throttle
   * @param {number} limit - Límite en ms
   * @returns {Function} Función throttled
   */
  throttle(fn, limit = 100) {
    let inThrottle = false;
    
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Lazy loading con caché
   * @param {string} namespace - Namespace
   * @param {string} key - Clave
   * @param {Function} loader - Función de carga
   * @returns {Function} Getter lazy
   */
  lazy(namespace, key, loader) {
    let loaded = false;
    let value = null;
    
    return async function() {
      if (!loaded) {
        // Intentar caché primero
        value = cacheManager.get(namespace, key);
        
        if (value === null) {
          value = await loader();
          cacheManager.set(namespace, key, value);
        }
        
        loaded = true;
      }
      
      return value;
    };
  }

  /**
   * Query paralelo con límite de concurrencia
   * @param {Array} items - Items a procesar
   * @param {Function} processor - Función procesadora
   * @param {number} concurrency - Límite de concurrencia
   * @returns {Promise<Array>} Resultados
   */
  async parallelLimit(items, processor, concurrency = 10) {
    const results = [];
    const executing = [];
    
    for (const item of items) {
      const promise = processor(item).then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });
      
      results.push(promise);
      executing.push(promise);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
    
    return Promise.all(results);
  }

  /**
   * Pipeline de transformaciones con caché
   * @param {string} namespace - Namespace
   * @param {any} input - Input
   * @param {Array<Function>} transforms - Transformaciones
   * @returns {any} Resultado
   */
  async pipeline(namespace, input, transforms) {
    let result = input;
    
    for (let i = 0; i < transforms.length; i++) {
      const cacheKey = `pipeline_${i}_${JSON.stringify(result)}`;
      result = await cacheManager.getOrSet(
        namespace,
        cacheKey,
        () => transforms[i](result)
      );
    }
    
    return result;
  }

  /**
   * Estadísticas del optimizer
   * @returns {object} Stats
   */
  getStats() {
    return {
      activeBatches: this.batchQueue.size,
      queuedItems: Array.from(this.batchQueue.values())
        .reduce((sum, queue) => sum + queue.size, 0),
      cacheStats: cacheManager.getStats()
    };
  }
}

// Singleton
const queryOptimizer = new QueryOptimizer();

export { queryOptimizer, QueryOptimizer };
export default queryOptimizer;
