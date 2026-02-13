/**
 * 🔐 AUTH CONTROLLER - Autenticación y Registro
 * 
 * Maneja login, registro y creación de personajes
 * Usa JWT para autenticación y password hashing
 */

import survivalDB from '../db/survivalDB.js';
import worldState from '../world/WorldState.js';
import { generateTokenPair, refreshAccessToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/passwordHash.js';

export class AuthController {
  
  /**
   * POST /api/auth/register
   * Registra nuevo usuario con password hasheado y JWT
   */
  static async register(req, res) {
    try {
      const { usuario, password } = req.body;

      if (!usuario || !password) {
        return res.status(400).json({ 
          error: 'Usuario y contraseña requeridos',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // Validar fortaleza del password
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({
          error: 'Password inseguro',
          code: 'WEAK_PASSWORD',
          issues: passwordCheck.errors,
          strength: passwordCheck.strength
        });
      }

      // Verificar si usuario existe
      const existente = survivalDB.getUserByUsername(usuario);
      if (existente) {
        return res.status(409).json({ 
          error: 'Usuario ya existe',
          code: 'USER_EXISTS'
        });
      }

      // Hash del password
      const hashedPassword = await hashPassword(password);

      // Crear usuario
      const userId = survivalDB.createUser(usuario, hashedPassword);

      // Generar tokens JWT
      const tokens = generateTokenPair({
        userId,
        username: usuario
      });

      return res.status(201).json({
        success: true,
        userId,
        usuario,
        ...tokens
      });

    } catch (error) {
      console.error('Error en register:', error);
      return res.status(500).json({ 
        error: 'Error del servidor',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * POST /api/auth/login
   * Login de usuario existente con JWT
   */
  static async login(req, res) {
    try {
      const { usuario, password } = req.body;

      if (!usuario || !password) {
        return res.status(400).json({ 
          error: 'Usuario y contraseña requeridos',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // Obtener usuario
      const user = survivalDB.getUserByUsername(usuario);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Credenciales inválidas',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verificar password
      const passwordValid = await verifyPassword(password, user.password);
      
      if (!passwordValid) {
        return res.status(401).json({ 
          error: 'Credenciales inválidas',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generar tokens JWT
      const tokens = generateTokenPair({
        userId: user.id,
        username: user.username
      });

      return res.json({
        success: true,
        userId: user.id,
        usuario: user.username,
        ...tokens
      });

    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ 
        error: 'Error del servidor',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Renueva access token usando refresh token
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token requerido',
          code: 'MISSING_TOKEN'
        });
      }

      const result = refreshAccessToken(refreshToken);

      if (!result.success) {
        return res.status(401).json({
          error: 'Refresh token inválido o expirado',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      return res.json({
        success: true,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn
      });

    } catch (error) {
      console.error('Error en refreshToken:', error);
      return res.status(500).json({
        error: 'Error del servidor',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * POST /api/personaje/crear
   * Crea personaje para un usuario
   */
  static async createCharacter(req, res) {
    try {
      const { 
        usuarioId, 
        nombre, 
        clase, 
        avatar, 
        color,
        atributos 
      } = req.body;

      // Validaciones
      if (!usuarioId || !nombre || !clase) {
        return res.status(400).json({ 
          error: 'Datos incompletos' 
        });
      }

      // Verificar que no exista personaje con ese nombre
      const existente = survivalDB.getPlayerByName(nombre);
      if (existente) {
        return res.status(409).json({ 
          error: 'Ya existe un personaje con ese nombre' 
        });
      }

      // Stats base según clase
      const clasesStats = {
        soldado: { fuerza: 2, combate: 2, resistencia: 0, agilidad: 0, inteligencia: 0, supervivencia: 0 },
        medico: { fuerza: 0, combate: 0, resistencia: 0, agilidad: 0, inteligencia: 2, supervivencia: 0 },
        ingeniero: { fuerza: 0, combate: 0, resistencia: 0, agilidad: 0, inteligencia: 1, supervivencia: 0 },
        superviviente: { fuerza: 0, combate: 0, resistencia: 0, agilidad: 1, inteligencia: 0, supervivencia: 2 }
      };

      const baseStats = clasesStats[clase] || clasesStats.superviviente;

      // Crear personaje
      const personaje = {
        usuarioId,
        nombre,
        clase,
        avatar: avatar || '🧟',
        color: color || '#00ff00',
        nivel: 1,
        xp: 0,
        salud: 100,
        saludMax: 100,
        hambre: 100,
        stamina: 100,
        ubicacion: 'refugio',
        inventario: JSON.stringify({}),
        stats: JSON.stringify({
          ...baseStats,
          ...(atributos || {})
        }),
        skills: JSON.stringify({
          combate: baseStats.combate || 0,
          supervivencia: baseStats.supervivencia || 0,
          medicina: clase === 'medico' ? 2 : 0,
          mecanica: clase === 'ingeniero' ? 3 : 0,
          sigilo: baseStats.agilidad || 0,
          liderazgo: 0
        })
      };

      const personajeId = survivalDB.createPlayer(personaje);

      return res.status(201).json({
        success: true,
        personajeId,
        personaje: {
          id: personajeId,
          ...personaje
        }
      });

    } catch (error) {
      console.error('Error en createCharacter:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * GET /api/personajes/:usuarioId
   * Obtiene personajes de un usuario
   */
  static async getCharacters(req, res) {
    try {
      const { usuarioId } = req.params;

      if (!usuarioId) {
        return res.status(400).json({ 
          error: 'Usuario ID requerido' 
        });
      }

      const personajes = survivalDB.getPlayersByUser(usuarioId);

      return res.json({
        success: true,
        personajes: personajes || []
      });

    } catch (error) {
      console.error('Error en getCharacters:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }

  /**
   * POST /api/personaje/load
   * Carga personaje en WorldState (conexión)
   */
  static async loadCharacter(req, res) {
    try {
      const { personajeId } = req.body;

      if (!personajeId) {
        return res.status(400).json({ 
          error: 'Personaje ID requerido' 
        });
      }

      // Cargar de DB
      const personaje = survivalDB.getPlayer(personajeId);
      
      if (!personaje) {
        return res.status(404).json({ 
          error: 'Personaje no encontrado' 
        });
      }

      // Parsear JSON fields
      personaje.inventario = JSON.parse(personaje.inventario || '{}');
      personaje.stats = JSON.parse(personaje.stats || '{}');
      personaje.skills = JSON.parse(personaje.skills || '{}');

      // Agregar a WorldState
      personaje.online = true;
      personaje.lastSeen = Date.now();
      personaje.nodeId = personaje.ubicacion || 'refugio';

      worldState.addPlayer(personaje);

      return res.json({
        success: true,
        personaje
      });

    } catch (error) {
      console.error('Error en loadCharacter:', error);
      return res.status(500).json({ 
        error: 'Error del servidor' 
      });
    }
  }
}

export default AuthController;
