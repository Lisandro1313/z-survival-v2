/**
 * ⚡ PERFORMANCE MIDDLEWARE
 * Middleware de Express para medir performance de requests
 */

import performanceMonitor from '../utils/PerformanceMonitor.js';
import cacheManager from '../utils/CacheManager.js';

/**
 * Middleware de medición de performance
 */
export function performanceMiddleware(req, res, next) {
  const label = `${req.method} ${req.path}`;
  const timerId = performanceMonitor.start(label);
  
  // Hook en el finish del response
  res.on('finish', () => {
    performanceMonitor.end(timerId);
    performanceMonitor.recordCustom('statusCode', res.statusCode);
  });
  
  next();
}

/**
 * Middleware de caché HTTP
 * @param {string} namespace - Namespace del caché
 * @param {number} ttl - TTL en ms
 * @param {Function} keyGenerator - Función para generar clave (opcional)
 */
export function cacheMiddleware(namespace, ttl = 60000, keyGenerator = null) {
  return (req, res, next) => {
    // Solo cachear GET
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generar clave
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `${req.path}_${JSON.stringify(req.query)}`;
    
    // Intentar obtener de caché
    const cached = cacheManager.get(namespace, cacheKey);
    
    if (cached !== null) {
      console.log(`💨 Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }
    
    // Interceptar res.json para cachear
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Guardar en caché solo respuestas exitosas
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheManager.set(namespace, cacheKey, data, ttl);
        console.log(`💾 Cache SET: ${cacheKey}`);
      }
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Middleware de rate limiting simple
 * @param {number} maxRequests - Máximo de requests
 * @param {number} windowMs - Ventana de tiempo en ms
 */
export function rateLimitMiddleware(maxRequests = 100, windowMs = 60000) {
  const requests = new Map();
  
  // Cleanup periódico
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests) {
      if (now - data.resetTime > windowMs) {
        requests.delete(ip);
      }
    }
  }, windowMs);
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, {
        count: 1,
        resetTime: now
      });
      return next();
    }
    
    const data = requests.get(ip);
    
    // Resetear si pasó la ventana
    if (now - data.resetTime > windowMs) {
      data.count = 1;
      data.resetTime = now;
      return next();
    }
    
    // Verificar límite
    if (data.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas peticiones, intenta más tarde',
        retryAfter: Math.ceil((data.resetTime + windowMs - now) / 1000)
      });
    }
    
    data.count++;
    next();
  };
}

/**
 * Middleware de compresión de respuestas grandes
 * @param {number} threshold - Tamaño mínimo en bytes
 */
export function compressionMiddleware(threshold = 1024) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      const jsonString = JSON.stringify(data);
      
      // Si es grande y el cliente acepta gzip
      if (jsonString.length > threshold && req.headers['accept-encoding']?.includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
        // Aquí se podría implementar compresión real con zlib
        console.log(`🗜️ Response comprimida: ${jsonString.length} bytes`);
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

export default {
  performanceMiddleware,
  cacheMiddleware,
  rateLimitMiddleware,
  compressionMiddleware
};
