/**
 * 🔐 AUTH ROUTES
 * Rutas de autenticación y gestión de personajes
 */

import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ====================================
// AUTENTICACIÓN
// ====================================

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', AuthController.register);

// POST /api/auth/login - Login de usuario
router.post('/login', AuthController.login);

// POST /api/auth/refresh - Renovar access token
router.post('/refresh', AuthController.refreshToken);

// ====================================
// PERSONAJES (Rutas protegidas)
// ====================================

// POST /api/auth/character/create - Crear personaje
router.post('/character/create', authenticateToken, AuthController.createCharacter);

// GET /api/auth/characters/:usuarioId - Obtener personajes de usuario
router.get('/characters/:usuarioId', authenticateToken, AuthController.getCharacters);

// POST /api/auth/character/load - Cargar personaje en sesión
router.post('/character/load', authenticateToken, AuthController.loadCharacter);

export default router;
