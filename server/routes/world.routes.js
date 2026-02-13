/**
 * 🌍 WORLD ROUTES
 * Rutas de consulta del mundo y nodos
 */

import { Router } from 'express';
import WorldController from '../controllers/WorldController.js';

const router = Router();

// ====================================
// ESTADO GENERAL
// ====================================

// GET /api/world - Estado del mundo
router.get('/', WorldController.getWorld);

// GET /api/world/stats - Estadísticas generales
router.get('/stats', WorldController.getStats);

// ====================================
// NODOS
// ====================================

// GET /api/world/nodes - Lista todos los nodos
router.get('/nodes', WorldController.getAllNodes);

// GET /api/world/node/:nodeId - Detalle de nodo específico
router.get('/node/:nodeId', WorldController.getNode);

// POST /api/world/node/:nodeId/resources - Actualizar recursos de nodo
router.post('/node/:nodeId/resources', WorldController.updateNodeResources);

// ====================================
// REGIONES
// ====================================

// GET /api/world/regions - Info de todas las regiones
router.get('/regions', WorldController.getRegions);

// GET /api/world/region/:regionId - Detalle de región
router.get('/region/:regionId', WorldController.getRegion);

// ====================================
// EVENTOS
// ====================================

// GET /api/world/events - Eventos globales activos
router.get('/events', WorldController.getActiveEvents);

export default router;
