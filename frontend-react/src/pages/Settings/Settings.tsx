import React, { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { ws } from '../../services/websocket'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import './Settings.css'

interface GameSettings {
  audio: {
    masterVolume: number
    musicVolume: number
    sfxVolume: number
    ambientVolume: number
    muteAll: boolean
  }
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra'
    particles: boolean
    shadows: boolean
    animations: boolean
    fps: number
  }
  gameplay: {
    autoLoot: boolean
    autoCombat: boolean
    showDamageNumbers: boolean
    showHealthBars: boolean
    confirmActions: boolean
    quickSlots: number
  }
  notifications: {
    tradeRequests: boolean
    clanInvites: boolean
    duelChallenges: boolean
    friendRequests: boolean
    systemMessages: boolean
    combatAlerts: boolean
  }
  privacy: {
    showOnlineStatus: boolean
    allowTradeRequests: boolean
    allowPartyInvites: boolean
    allowWhispers: boolean
    blockList: string[]
  }
}

export const Settings: React.FC = () => {
  const player = usePlayerStore((state) => state.player)
  const [settings, setSettings] = useState<GameSettings>({
    audio: {
      masterVolume: 100,
      musicVolume: 80,
      sfxVolume: 90,
      ambientVolume: 70,
      muteAll: false
    },
    graphics: {
      quality: 'high',
      particles: true,
      shadows: true,
      animations: true,
      fps: 60
    },
    gameplay: {
      autoLoot: false,
      autoCombat: false,
      showDamageNumbers: true,
      showHealthBars: true,
      confirmActions: true,
      quickSlots: 4
    },
    notifications: {
      tradeRequests: true,
      clanInvites: true,
      duelChallenges: true,
      friendRequests: true,
      systemMessages: true,
      combatAlerts: true
    },
    privacy: {
      showOnlineStatus: true,
      allowTradeRequests: true,
      allowPartyInvites: true,
      allowWhispers: true,
      blockList: []
    }
  })

  const [activeTab, setActiveTab] = useState<'audio' | 'graphics' | 'gameplay' | 'notifications' | 'privacy'>('gameplay')
  const [hasChanges, setHasChanges] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    ws.send('settings:get')
  }, [])

  const handleSettingChange = (category: keyof GameSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSaveSettings = () => {
    ws.send('settings:save', settings)
    setHasChanges(false)
    setSaveMessage('⚠️ Configuración guardada exitosamente!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleResetSettings = () => {
    if (window.confirm('¿Seguro que quieres restablecer todas las configuraciones a sus valores por defecto?')) {
      ws.send('settings:reset')
      setHasChanges(false)
      setSaveMessage('Configuración restablecida')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <h1>⚙️ Configuración</h1>
        <div className="header-actions">
          {hasChanges && (
            <Button onClick={handleSaveSettings}>
              💾 Guardar Cambios
            </Button>
          )}
        </div>
      </div>

      {saveMessage && (
        <div className="save-message">
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="settings-tabs">
        <button 
          className={activeTab === 'gameplay' ? 'active' : ''}
          onClick={() => setActiveTab('gameplay')}
        >
          🎮 Jugabilidad
        </button>
        <button 
          className={activeTab === 'audio' ? 'active' : ''}
          onClick={() => setActiveTab('audio')}
        >
          🔊 Audio
        </button>
        <button 
          className={activeTab === 'graphics' ? 'active' : ''}
          onClick={() => setActiveTab('graphics')}
        >
          🎨 Gráficos
        </button>
        <button 
          className={activeTab === 'notifications' ? 'active' : ''}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notificaciones
        </button>
        <button 
          className={activeTab === 'privacy' ? 'active' : ''}
          onClick={() => setActiveTab('privacy')}
        >
          🔒 Privacidad
        </button>
      </div>

      {/* Content */}
      <div className="settings-content">
        {/* Gameplay Tab */}
        {activeTab === 'gameplay' && (
          <Card className="settings-card">
            <h2>⚙️ Opciones de Jugabilidad</h2>
            
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <strong>Auto-Recolección</strong>
                  <p>Recoger automáticamente objetos del suelo</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.gameplay.autoLoot}
                    onChange={e => handleSettingChange('gameplay', 'autoLoot', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Combate Automático</strong>
                  <p>Atacar automáticamente enemigos cercanos</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.gameplay.autoCombat}
                    onChange={e => handleSettingChange('gameplay', 'autoCombat', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Mostrar Números de Daño</strong>
                  <p>Visualizar el daño infligido en combate</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.gameplay.showDamageNumbers}
                    onChange={e => handleSettingChange('gameplay', 'showDamageNumbers', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Mostrar Barras de Salud</strong>
                  <p>Mostrar HP de enemigos y aliados</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.gameplay.showHealthBars}
                    onChange={e => handleSettingChange('gameplay', 'showHealthBars', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Confirmar Acciones</strong>
                  <p>Pedir confirmación para acciones importantes</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.gameplay.confirmActions}
                    onChange={e => handleSettingChange('gameplay', 'confirmActions', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Slots Rápidos</strong>
                  <p>Número de slots de acceso rápido (2-8)</p>
                </div>
                <input 
                  type="number"
                  min="2"
                  max="8"
                  value={settings.gameplay.quickSlots}
                  onChange={e => handleSettingChange('gameplay', 'quickSlots', parseInt(e.target.value))}
                  className="number-input"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <Card className="settings-card">
            <h2>🔊 Configuración de Audio</h2>
            
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <strong>Silenciar Todo</strong>
                  <p>Desactivar todos los sonidos del juego</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.audio.muteAll}
                    onChange={e => handleSettingChange('audio', 'muteAll', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item slider-item">
                <div className="setting-info">
                  <strong>Volumen General</strong>
                  <span className="volume-value">{settings.audio.masterVolume}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.masterVolume}
                  onChange={e => handleSettingChange('audio', 'masterVolume', parseInt(e.target.value))}
                  disabled={settings.audio.muteAll}
                  className="range-slider"
                />
              </div>

              <div className="setting-item slider-item">
                <div className="setting-info">
                  <strong>Volumen de Música</strong>
                  <span className="volume-value">{settings.audio.musicVolume}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.musicVolume}
                  onChange={e => handleSettingChange('audio', 'musicVolume', parseInt(e.target.value))}
                  disabled={settings.audio.muteAll}
                  className="range-slider"
                />
              </div>

              <div className="setting-item slider-item">
                <div className="setting-info">
                  <strong>Efectos de Sonido</strong>
                  <span className="volume-value">{settings.audio.sfxVolume}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.sfxVolume}
                  onChange={e => handleSettingChange('audio', 'sfxVolume', parseInt(e.target.value))}
                  disabled={settings.audio.muteAll}
                  className="range-slider"
                />
              </div>

              <div className="setting-item slider-item">
                <div className="setting-info">
                  <strong>Sonido Ambiental</strong>
                  <span className="volume-value">{settings.audio.ambientVolume}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.ambientVolume}
                  onChange={e => handleSettingChange('audio', 'ambientVolume', parseInt(e.target.value))}
                  disabled={settings.audio.muteAll}
                  className="range-slider"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Graphics Tab */}
        {activeTab === 'graphics' && (
          <Card className="settings-card">
            <h2>🎨 Configuración Gráfica</h2>
            
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <strong>Calidad Gráfica</strong>
                  <p>Ajusta el nivel general de calidad visual</p>
                </div>
                <select 
                  value={settings.graphics.quality}
                  onChange={e => handleSettingChange('graphics', 'quality', e.target.value)}
                  className="select-input"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Efectos de Partículas</strong>
                  <p>Mostrar efectos visuales de habilidades y combate</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.graphics.particles}
                    onChange={e => handleSettingChange('graphics', 'particles', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Sombras</strong>
                  <p>Renderizar sombras de personajes y objetos</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.graphics.shadows}
                    onChange={e => handleSettingChange('graphics', 'shadows', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Animaciones</strong>
                  <p>Activar animaciones de interfaz</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.graphics.animations}
                    onChange={e => handleSettingChange('graphics', 'animations', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Límite de FPS</strong>
                  <p>Cuadros por segundo máximos</p>
                </div>
                <select 
                  value={settings.graphics.fps}
                  onChange={e => handleSettingChange('graphics', 'fps', parseInt(e.target.value))}
                  className="select-input"
                >
                  <option value="30">30 FPS</option>
                  <option value="60">60 FPS</option>
                  <option value="120">120 FPS</option>
                  <option value="144">144 FPS</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card className="settings-card">
            <h2>🔔 Preferencias de Notificaciones</h2>
            
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <strong>Solicitudes de Comercio</strong>
                  <p>Notificar cuando alguien quiere comerciar</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.tradeRequests}
                    onChange={e => handleSettingChange('notifications', 'tradeRequests', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Invitaciones a Clan</strong>
                  <p>Notificar invitaciones a unirse a clanes</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.clanInvites}
                    onChange={e => handleSettingChange('notifications', 'clanInvites', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Desafíos de Duelo</strong>
                  <p>Notificar cuando te desafían a un duelo</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.duelChallenges}
                    onChange={e => handleSettingChange('notifications', 'duelChallenges', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Solicitudes de Amistad</strong>
                  <p>Notificar nuevas solicitudes de amistad</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.friendRequests}
                    onChange={e => handleSettingChange('notifications', 'friendRequests', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Mensajes del Sistema</strong>
                  <p>Mostrar notificaciones del sistema</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.systemMessages}
                    onChange={e => handleSettingChange('notifications', 'systemMessages', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Alertas de Combate</strong>
                  <p>Notificar cuando entras en combate</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.combatAlerts}
                    onChange={e => handleSettingChange('notifications', 'combatAlerts', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </Card>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <Card className="settings-card">
            <h2>🔒 Configuración de Privacidad</h2>
            
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <strong>Mostrar Estado Online</strong>
                  <p>Permitir que otros vean si estás conectado</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.showOnlineStatus}
                    onChange={e => handleSettingChange('privacy', 'showOnlineStatus', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Permitir Solicitudes de Comercio</strong>
                  <p>Otros jugadores pueden solicitar comerciar contigo</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.allowTradeRequests}
                    onChange={e => handleSettingChange('privacy', 'allowTradeRequests', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Permitir Invitaciones a Grupo</strong>
                  <p>Otros jugadores pueden invitarte a su grupo</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.allowPartyInvites}
                    onChange={e => handleSettingChange('privacy', 'allowPartyInvites', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <strong>Permitir Mensajes Privados</strong>
                  <p>Recibir mensajes directos de otros jugadores</p>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.allowWhispers}
                    onChange={e => handleSettingChange('privacy', 'allowWhispers', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Footer Actions */}
      <div className="settings-footer">
        <Button onClick={handleResetSettings} variant="danger">
          🔄 Restablecer Todo
        </Button>
        <div className="footer-info">
          <p>Los cambios se guardan automáticamente</p>
        </div>
      </div>
    </div>
  )
}


