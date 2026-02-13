/**
 * 🤝 TRADE ROUTES
 * 
 * Rutas para sistema de trading completo
 */

import express from 'express';
import TradeController from '../controllers/TradeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación JWT
router.use(authenticateToken);

// ====================================
// NEW API (v2.0)
// ====================================

// Crear trade
router.post('/create', TradeController.createTrade);

// Responder a trade (accept/reject/counter)
router.post('/:tradeId/respond', TradeController.respondToTrade);

// Confirmar trade
router.post('/:tradeId/confirm', TradeController.confirmTrade);

// Cancelar trade
router.post('/:tradeId/cancel', TradeController.cancelTrade);

// Obtener trades activos
router.get('/active', TradeController.getActiveTrades);

// Obtener historial
router.get('/history', TradeController.getTradeHistory);

// Obtener stats del jugador
router.get('/stats', TradeController.getPlayerStats);

// Obtener trade específico
router.get('/:tradeId', TradeController.getTrade);

// Stats del sistema (admin)
router.get('/system/stats', TradeController.getSystemStats);

// ====================================
// LEGACY API (deprecated)
// ====================================

// POST /api/trade/offer - Crear oferta de intercambio
router.post('/offer', TradeController.createOffer);

// GET /api/trade/offers/:playerId - Ofertas pendientes de jugador
router.get('/offers/:playerId', TradeController.getPlayerOffers);

// POST /api/trade/:tradeId/respond - Aceptar/rechazar oferta
// (ya definido arriba con nueva API)

// DELETE /api/trade/:tradeId - Cancelar oferta propia
router.delete('/:tradeId', TradeController.cancelOffer);

export default router;
