/**
 * 👤 PLAYER ROUTES
 * Rutas de gestión de jugadores
 */

import { Router } from 'express';
import PlayerController from '../controllers/PlayerController.js';

const router = Router();

// ====================================
// INFORMACIÓN DE JUGADORES
// ====================================

// GET /api/player/:id - Obtener jugador específico
router.get('/:id', PlayerController.getPlayer);

// GET /api/player/:id/stats - Stats detallados de jugador
router.get('/:id/stats', PlayerController.getPlayerStats);

// ====================================
// LISTADOS
// ====================================

// GET /api/player/online - Jugadores conectados
router.get('/list/online', PlayerController.getOnlinePlayers);

// GET /api/player/in-node/:nodeId - Jugadores en nodo específico
router.get('/in-node/:nodeId', PlayerController.getPlayersInNode);

// ====================================
// ACCIONES
// ====================================

// POST /api/player/:id/move - Mover jugador a otro nodo
router.post('/:id/move', PlayerController.movePlayer);

// POST /api/player/:id/update - Actualizar stats del jugador
router.post('/:id/update', PlayerController.updatePlayer);

export default router;
