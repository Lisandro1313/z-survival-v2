/**
 * ⚡ PERFORMANCE ROUTES
 * Rutas para consultar métricas y performance
 */

import express from 'express';
import performanceMonitor from '../utils/PerformanceMonitor.js';
import cacheManager from '../utils/CacheManager.js';
import queryOptimizer from '../utils/QueryOptimizer.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/performance/metrics
 * Obtiene resumen de métricas de performance
 */
router.get('/metrics', authenticateToken, (req, res) => {
  try {
    const summary = performanceMonitor.getSummary();
    
    res.json({
      success: true,
      metrics: summary
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/performance/report
 * Reporte completo de performance (admin)
 */
router.get('/report', authenticateToken, (req, res) => {
  try {
    const report = performanceMonitor.getReport();
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/performance/cache/stats
 * Estadísticas del caché
 */
router.get('/cache/stats', authenticateToken, (req, res) => {
  try {
    const stats = cacheManager.getStats();
    
    res.json({
      success: true,
      cache: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/performance/cache/clear
 * Limpia el caché (admin)
 */
router.post('/cache/clear', authenticateToken, (req, res) => {
  try {
    const { namespace } = req.body;
    
    if (namespace) {
      cacheManager.clear(namespace);
      res.json({
        success: true,
        message: `Caché de ${namespace} limpiado`
      });
    } else {
      cacheManager.clearAll();
      res.json({
        success: true,
        message: 'Todo el caché limpiado'
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/performance/cache/invalidate
 * Invalida entradas de caché por patrón
 */
router.post('/cache/invalidate', authenticateToken, (req, res) => {
  try {
    const { namespace, pattern } = req.body;
    
    if (!namespace || !pattern) {
      return res.status(400).json({
        success: false,
        message: 'namespace y pattern son requeridos'
      });
    }
    
    const regex = new RegExp(pattern);
    const deleted = cacheManager.invalidatePattern(namespace, regex);
    
    res.json({
      success: true,
      message: `${deleted} entradas invalidadas`
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/performance/optimizer/stats
 * Estadísticas del query optimizer
 */
router.get('/optimizer/stats', authenticateToken, (req, res) => {
  try {
    const stats = queryOptimizer.getStats();
    
    res.json({
      success: true,
      optimizer: stats
    });
  } catch (error) {
    console.error('Error getting optimizer stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/performance/reset
 * Resetea métricas (admin)
 */
router.post('/reset', authenticateToken, (req, res) => {
  try {
    performanceMonitor.reset();
    
    res.json({
      success: true,
      message: 'Métricas reseteadas'
    });
  } catch (error) {
    console.error('Error resetting metrics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/performance/health
 * Health check con métricas básicas
 */
router.get('/health', (req, res) => {
  const mem = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({
    success: true,
    health: {
      status: 'healthy',
      uptime: `${(uptime / 60).toFixed(2)} minutos`,
      memory: {
        heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`
      },
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
