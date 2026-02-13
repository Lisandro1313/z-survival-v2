/**
 * 🔐 RADIO ENCRYPTION ROUTES
 * Rutas para gestión de canales encriptados
 */

import express from 'express';
import { radioEncryptionSystem } from '../systems/RadioEncryptionSystem.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * POST /api/radio-encryption/channel
 * Crea un nuevo canal encriptado
 */
router.post('/channel', (req, res) => {
  try {
    const { channelId, customKey } = req.body;
    const creatorId = req.user.userId;
    
    if (!channelId) {
      return res.status(400).json({
        success: false,
        message: 'channelId es requerido'
      });
    }
    
    const result = radioEncryptionSystem.createEncryptedChannel(
      channelId,
      creatorId,
      customKey
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error creating encrypted channel:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/radio-encryption/grant
 * Otorga acceso a un jugador a un canal
 */
router.post('/grant', (req, res) => {
  try {
    const { playerId, channelId, key } = req.body;
    const requesterId = req.user.userId;
    
    if (!playerId || !channelId || !key) {
      return res.status(400).json({
        success: false,
        message: 'playerId, channelId y key son requeridos'
      });
    }
    
    // Verificar que el solicitante tenga acceso
    if (!radioEncryptionSystem.hasAccess(requesterId, channelId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este canal'
      });
    }
    
    radioEncryptionSystem.grantAccess(playerId, channelId, key);
    
    res.json({
      success: true,
      message: 'Acceso otorgado'
    });
  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/radio-encryption/revoke
 * Revoca acceso de un jugador
 */
router.post('/revoke', (req, res) => {
  try {
    const { playerId, channelId } = req.body;
    const requesterId = req.user.userId;
    
    if (!playerId || !channelId) {
      return res.status(400).json({
        success: false,
        message: 'playerId y channelId son requeridos'
      });
    }
    
    const channelInfo = radioEncryptionSystem.getChannelInfo(channelId);
    if (!channelInfo) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }
    
    if (channelInfo.createdBy !== requesterId) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador puede revocar acceso'
      });
    }
    
    radioEncryptionSystem.revokeAccess(playerId, channelId);
    
    res.json({
      success: true,
      message: 'Acceso revocado'
    });
  } catch (error) {
    console.error('Error revoking access:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/radio-encryption/rotate
 * Rota la clave de un canal
 */
router.post('/rotate', (req, res) => {
  try {
    const { channelId } = req.body;
    const requesterId = req.user.userId;
    
    if (!channelId) {
      return res.status(400).json({
        success: false,
        message: 'channelId es requerido'
      });
    }
    
    const result = radioEncryptionSystem.rotateChannelKey(channelId, requesterId);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error rotating key:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/radio-encryption/channels
 * Lista canales a los que el jugador tiene acceso
 */
router.get('/channels', (req, res) => {
  try {
    const playerId = req.user.userId;
    const channels = radioEncryptionSystem.getPlayerChannels(playerId);
    
    res.json({
      success: true,
      channels
    });
  } catch (error) {
    console.error('Error listing channels:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/radio-encryption/channel/:channelId
 * Obtiene información de un canal
 */
router.get('/channel/:channelId', (req, res) => {
  try {
    const { channelId } = req.params;
    const playerId = req.user.userId;
    
    if (!radioEncryptionSystem.hasAccess(playerId, channelId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este canal'
      });
    }
    
    const info = radioEncryptionSystem.getChannelInfo(channelId);
    
    if (!info) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }
    
    res.json({
      success: true,
      channel: info
    });
  } catch (error) {
    console.error('Error getting channel info:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/radio-encryption/channel/:channelId
 * Elimina un canal encriptado
 */
router.delete('/channel/:channelId', (req, res) => {
  try {
    const { channelId } = req.params;
    const requesterId = req.user.userId;
    
    radioEncryptionSystem.deleteChannel(channelId, requesterId);
    
    res.json({
      success: true,
      message: 'Canal eliminado'
    });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/radio-encryption/stats
 * Estadísticas del sistema (admin)
 */
router.get('/stats', (req, res) => {
  try {
    const stats = radioEncryptionSystem.getStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
