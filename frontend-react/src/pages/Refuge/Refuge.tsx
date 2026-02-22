import React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../../store/playerStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import './Refuge.css'

export default function Refuge() {
  const navigate = useNavigate()
  const player = usePlayerStore(state => state.player)
  
  return (
    <div className="refuge-container">
      {/* Hero Section */}
      <div className="refuge-hero">
        <div className="refuge-hero-content">
          <h1 className="refuge-title">🏰 REFUGIO CENTRAL</h1>
          <p className="refuge-subtitle">Estás a salvo aquí. ¿Qué hacés ahora?</p>
          
          <div className="player-quick-stats">
            <div className="quick-stat">
              <span className="stat-icon">❤️</span>
              <div className="stat-info">
                <span className="stat-label">Salud</span>
                <div className="stat-bar">
                  <div className="stat-bar-fill health" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
            <div className="quick-stat">
              <span className="stat-icon">⚡</span>
              <div className="stat-info">
                <span className="stat-label">Energía</span>
                <div className="stat-bar">
                  <div className="stat-bar-fill energy" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
            <div className="quick-stat">
              <span className="stat-icon">⭐</span>
              <div className="stat-info">
                <span className="stat-label">Nivel {player?.level || 1}</span>
                <div className="stat-bar">
                  <div className="stat-bar-fill xp" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="refuge-main-actions">
        <h2 className="section-title">Actividades Principales</h2>
        <div className="main-actions-grid">
          <Card 
            className="action-card primary-action" 
            onClick={() => navigate('/map')}
          >
            <div className="action-icon">🗺️</div>
            <h3 className="action-title">Explorar</h3>
            <p className="action-desc">Salir al mundo exterior y buscar recursos</p>
            <div className="action-badge">¡Aventura!</div>
          </Card>

          <Card 
            className="action-card primary-action" 
            onClick={() => navigate('/missions')}
          >
            <div className="action-icon">📋</div>
            <h3 className="action-title">Misiones</h3>
            <p className="action-desc">Completá objetivos y ganá recompensas</p>
            <div className="action-badge new">3 Nuevas</div>
          </Card>

          <Card 
            className="action-card primary-action" 
            onClick={() => navigate('/social')}
          >
            <div className="action-icon">🔥</div>
            <h3 className="action-title">Fogata / Social</h3>
            <p className="action-desc">Interactuá con otros supervivientes</p>
            <div className="action-badge">12 Online</div>
          </Card>

          <Card 
            className="action-card primary-action" 
            onClick={() => navigate('/construction')}
          >
            <div className="action-icon">🏗️</div>
            <h3 className="action-title">Gestión Refugio</h3>
            <p className="action-desc">Construí y mejorá estructuras</p>
            <div className="action-badge">En progreso</div>
          </Card>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="refuge-secondary-section">
        <div className="secondary-left">
          <h2 className="section-title">Progresión & Combate</h2>
          <div className="secondary-actions-grid">
            <Card className="action-card-sm" onClick={() => navigate('/classes')}>
              <div className="action-icon-sm">⚔️</div>
              <div className="action-content-sm">
                <h4>Clases & Habilidades</h4>
                <p>2 puntos disponibles</p>
              </div>
            </Card>

            <Card className="action-card-sm" onClick={() => navigate('/crafting')}>
              <div className="action-icon-sm">🔨</div>
              <div className="action-content-sm">
                <h4>Crafteo</h4>
                <p>Crear equipamiento</p>
              </div>
            </Card>

            <Card className="action-card-sm" onClick={() => navigate('/raids')}>
              <div className="action-icon-sm">🎯</div>
              <div className="action-content-sm">
                <h4>Raids</h4>
                <p>PvE cooperativo</p>
              </div>
            </Card>

            <Card className="action-card-sm" onClick={() => navigate('/boss-raids')}>
              <div className="action-icon-sm">👹</div>
              <div className="action-content-sm">
                <h4>Boss Raids</h4>
                <p>Jefes épicos</p>
              </div>
            </Card>

            <Card className="action-card-sm" onClick={() => navigate('/pvp')}>
              <div className="action-icon-sm">⚡</div>
              <div className="action-content-sm">
                <h4>Duelos PvP</h4>
                <p>ELO: 1250</p>
              </div>
            </Card>

            <Card className="action-card-sm" onClick={() => navigate('/combat')}>
              <div className="action-icon-sm">🗡️</div>
              <div className="action-content-sm">
                <h4>Combate</h4>
                <p>Entrenar habilidades</p>
              </div>
            </Card>
          </div>
        </div>

        <div className="secondary-right">
          <h2 className="section-title">Economía & Social</h2>
          <div className="secondary-actions-grid">
            <Card className="action-card-sm" onClick={() => navigate('/marketplace')}>
              <div className="action-icon-sm">🛒</div>
              <div className="action-content-sm">
                <h4>Mercado</h4>
                <p>Comprar/Vender</p>
              </div>
            </Card>

            <Card className="action-card-sm" onClick={() => navigate('/economy')}>
              <div className="action-icon-sm">💰</div>
              <div className="action-content-sm">
                <h4>Economía</h4>
                <p>{player?.caps || 0} caps</p>
              </div>
            </Card>

            <Card className="action-card-sm" onClick={() => navigate('/clans')}>
              <div className="action-icon-sm">🛡️</div>
              <div className="action-content-sm">
                <h4>Clanes</h4>
                <p>Unirte o crear</p>
              </div>
            </Card>

            <Card className="action-card-sm" onClick={() => navigate('/trust')}>
              <div className="action-icon-sm">🤝</div>
              <div className="action-content-sm">
                <h4>Confianza</h4>
                <p>Reputación</p>
              </div>
            </Card>

            <Card className="action-card-sm" onClick={() => navigate('/quests')}>
              <div className="action-icon-sm">📜</div>
              <div className="action-content-sm">
                <h4>Quests</h4>
                <p>Historia principal</p>
              </div>
            </Card>

            <Card className="action-card-sm" onClick={() => navigate('/settings')}>
              <div className="action-icon-sm">⚙️</div>
              <div className="action-content-sm">
                <h4>Configuración</h4>
                <p>Ajustes del juego</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="refuge-info-section">
        <Card className="info-card">
          <h3>📊 Estado del Refugio</h3>
          <div className="refuge-stats-grid">
            <div className="refuge-stat">
              <span className="refuge-stat-label">Moral</span>
              <div className="refuge-stat-bar">
                <div className="refuge-stat-fill" style={{ width: '78%', background: '#10b981' }}></div>
              </div>
              <span className="refuge-stat-value">78%</span>
            </div>
            <div className="refuge-stat">
              <span className="refuge-stat-label">Seguridad</span>
              <div className="refuge-stat-bar">
                <div className="refuge-stat-fill" style={{ width: '45%', background: '#f59e0b' }}></div>
              </div>
              <span className="refuge-stat-value">45%</span>
            </div>
            <div className="refuge-stat">
              <span className="refuge-stat-label">Recursos</span>
              <div className="refuge-stat-bar">
                <div className="refuge-stat-fill" style={{ width: '62%', background: '#10b981' }}></div>
              </div>
              <span className="refuge-stat-value">62%</span>
            </div>
          </div>
        </Card>

        <Card className="info-card">
          <h3>🛡️ Defenses Activas</h3>
          <div className="defenses-list">
            <div className="defense-item">
              <span className="defense-icon">🔥</span>
              <span className="defense-name">Trampa de Fuego</span>
              <span className="defense-count">x3</span>
            </div>
            <div className="defense-item">
              <span className="defense-icon">⚡</span>
              <span className="defense-name">Cerca Eléctrica</span>
              <span className="defense-count">x2</span>
            </div>
            <div className="defense-item">
              <span className="defense-icon">🗼</span>
              <span className="defense-name">Torre de Vigilancia</span>
              <span className="defense-count">x1</span>
            </div>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            style={{ marginTop: '12px', width: '100%' }}
            onClick={() => navigate('/construction')}
          >
            Gestionar Defensas
          </Button>
        </Card>

        <Card className="info-card">
          <h3>📰 Noticias Recientes</h3>
          <div className="news-list">
            <div className="news-item">
              <span className="news-time">Hace 5 min</span>
              <span className="news-text">Raid derrotada: +250 XP</span>
            </div>
            <div className="news-item">
              <span className="news-time">Hace 15 min</span>
              <span className="news-text">Nuevo comerciante en el refugio</span>
            </div>
            <div className="news-item">
              <span className="news-time">Hace 1 hora</span>
              <span className="news-text">Airdrop detectado en Zona Norte</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}


