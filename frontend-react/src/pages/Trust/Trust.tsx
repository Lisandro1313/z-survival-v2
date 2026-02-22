import React, { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { ws } from '../../services/websocket'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import './Trust.css'

interface TrustRelationship {
  playerId: string
  playerName: string
  level: number
  trustScore: number
  lastInteraction: string
  sharedMissions: number
  tradedItems: number
  helpedInCombat: number
  status: 'friend' | 'ally' | 'neutral' | 'rival'
}

interface TrustAction {
  id: string
  type: 'help' | 'trade' | 'mission' | 'defend' | 'heal' | 'gift'
  from: string
  to: string
  playerName: string
  trustGained: number
  timestamp: string
  description: string
}

interface TrustReward {
  trustLevel: number
  unlocked: boolean
  rewards: {
    type: string
    value: number
    description: string
  }[]
}

export const Trust: React.FC = () => {
  const player = usePlayerStore((state) => state.player)
  const [relationships, setRelationships] = useState<TrustRelationship[]>([])
  const [recentActions, setRecentActions] = useState<TrustAction[]>([])
  const [trustRewards, setTrustRewards] = useState<TrustReward[]>([])
  const [playerTrustScore, setPlayerTrustScore] = useState(0)
  const [playerTrustLevel, setPlayerTrustLevel] = useState(1)
  const [activeTab, setActiveTab] = useState<'relationships' | 'actions' | 'rewards'>('relationships')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    ws.send('trust:get_relationships')
    ws.send('trust:get_recent_actions')
    ws.send('trust:get_rewards')
    ws.send('trust:get_player_score')

    const interval = setInterval(() => {
      ws.send('trust:get_relationships')
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'friend': return '#22c55e'
      case 'ally': return '#3b82f6'
      case 'neutral': return '#9ca3af'
      case 'rival': return '#ef4444'
      default: return '#9ca3af'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'friend': return '💚'
      case 'ally': return '🤝'
      case 'neutral': return '😐'
      case 'rival': return '⚔️'
      default: return '👤'
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'help': return '🤝'
      case 'trade': return '💱'
      case 'mission': return '📜'
      case 'defend': return '🛡️'
      case 'heal': return '⚕️'
      case 'gift': return '🎁'
      default: return '✨'
    }
  }

  const getTrustLevelName = (level: number) => {
    if (level >= 10) return 'Legendario'
    if (level >= 8) return 'Héroe'
    if (level >= 6) return 'Veterano'
    if (level >= 4) return 'Compañero'
    if (level >= 2) return 'Conocido'
    return 'Novato'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `Hace ${minutes} minutos`
    if (hours < 24) return `Hace ${hours} horas`
    return `Hace ${days} días`
  }

  const filteredRelationships = relationships.filter(rel => {
    if (filterStatus === 'all') return true
    return rel.status === filterStatus
  })

  return (
    <div className="trust-page">
      {/* Header */}
      <div className="trust-header">
        <div className="header-left">
          <h1>🤝 Sistema de Confianza</h1>
          <p className="subtitle">Construye relaciones y desbloquea recompensas</p>
        </div>
        <div className="header-right">
          <div className="trust-score-display">
            <div className="score-label">Puntuación Global</div>
            <div className="score-value">{playerTrustScore}</div>
            <div className="score-level">
              Nivel {playerTrustLevel}: {getTrustLevelName(playerTrustLevel)}
            </div>
            <ProgressBar
              current={playerTrustScore % 1000}
              max={1000}
              label=""
              color="#22c55e"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="trust-tabs">
        <button 
          className={activeTab === 'relationships' ? 'active' : ''}
          onClick={() => setActiveTab('relationships')}
        >
          👥 Relaciones
        </button>
        <button 
          className={activeTab === 'actions' ? 'active' : ''}
          onClick={() => setActiveTab('actions')}
        >
          📋 Historial
        </button>
        <button 
          className={activeTab === 'rewards' ? 'active' : ''}
          onClick={() => setActiveTab('rewards')}
        >
          🎁 Recompensas
        </button>
      </div>

      {/* Content */}
      <div className="trust-content">
        {/* Relationships Tab */}
        {activeTab === 'relationships' && (
          <>
            {/* Filter */}
            <div className="trust-filter">
              <label>Filtrar por estado:</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">Todos</option>
                <option value="friend">Amigos</option>
                <option value="ally">Aliados</option>
                <option value="neutral">Neutral</option>
                <option value="rival">Rivales</option>
              </select>
            </div>

            <div className="relationships-grid">
              {filteredRelationships.length === 0 ? (
                <Card>
                  <p className="no-data">No tienes relaciones registradas todavía. Interactúa con otros jugadores!</p>
                </Card>
              ) : (
                filteredRelationships.map(rel => (
                  <Card key={rel.playerId} className="relationship-card">
                    <div className="relationship-header">
                      <div className="player-info">
                        <span className="status-icon">
                          {getStatusIcon(rel.status)}
                        </span>
                        <div>
                          <h3>{rel.playerName}</h3>
                          <span className="player-level">Nivel {rel.level}</span>
                        </div>
                      </div>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(rel.status) }}
                      >
                        {rel.status}
                      </span>
                    </div>

                    {/* Trust Score */}
                    <div className="trust-score-section">
                      <div className="score-header">
                        <span>Confianza:</span>
                        <strong>{rel.trustScore} pts</strong>
                      </div>
                      <ProgressBar
                        current={rel.trustScore}
                        max={1000}
                        label=""
                        color={getStatusColor(rel.status)}
                      />
                    </div>

                    {/* Stats */}
                    <div className="relationship-stats">
                      <div className="stat">
                        <span className="stat-icon">📜</span>
                        <span className="stat-value">{rel.sharedMissions}</span>
                        <span className="stat-label">Misiones</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">💱</span>
                        <span className="stat-value">{rel.tradedItems}</span>
                        <span className="stat-label">Intercambios</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">⚔️</span>
                        <span className="stat-value">{rel.helpedInCombat}</span>
                        <span className="stat-label">Combates</span>
                      </div>
                    </div>

                    {/* Last Interaction */}
                    <div className="last-interaction">
                      Última interacción: {formatDate(rel.lastInteraction)}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="actions-section">
            <h2>Historial de Acciones</h2>
            <p className="section-subtitle">
              Registro de todas las interacciones que afectaron tu confianza
            </p>

            <div className="actions-timeline">
              {recentActions.length === 0 ? (
                <Card>
                  <p className="no-data">No hay acciones registradas todavía.</p>
                </Card>
              ) : (
                recentActions.map(action => (
                  <Card key={action.id} className="action-card">
                    <div className="action-icon-wrapper">
                      <span className="action-icon">
                        {getActionIcon(action.type)}
                      </span>
                    </div>
                    <div className="action-content">
                      <div className="action-header">
                        <h4>{action.description}</h4>
                        <span className="action-time">{formatDate(action.timestamp)}</span>
                      </div>
                      <div className="action-details">
                        <span className="action-player">
                          {action.from === player?.id ? `Con ${action.playerName}` : `De ${action.playerName}`}
                        </span>
                        <span className="action-trust">
                          +{action.trustGained} confianza
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="rewards-section">
            <h2>Recompensas de Confianza</h2>
            <p className="section-subtitle">
              Desbloquea beneficios al aumentar tu nivel de confianza global
            </p>

            <div className="rewards-grid">
              {trustRewards.map(reward => (
                <Card 
                  key={reward.trustLevel} 
                  className={`reward-tier-card ${reward.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="tier-header">
                    <h3>Nivel {reward.trustLevel}</h3>
                    {reward.unlocked ? (
                      <span className="unlocked-badge">✅ Desbloqueado</span>
                    ) : (
                      <span className="locked-badge">🔒 Bloqueado</span>
                    )}
                  </div>

                  <div className="tier-name">
                    {getTrustLevelName(reward.trustLevel)}
                  </div>

                  <div className="tier-rewards">
                    <strong>Recompensas:</strong>
                    {reward.rewards.map((r, index) => (
                      <div key={index} className="reward-item">
                        <span className="reward-icon">
                          {r.type === 'trade_bonus' && '💰'}
                          {r.type === 'xp_bonus' && '⭐'}
                          {r.type === 'item_bonus' && '📦'}
                          {r.type === 'defense_bonus' && '🛡️'}
                          {r.type === 'damage_bonus' && '⚔️'}
                        </span>
                        <div className="reward-info">
                          <span className="reward-desc">{r.description}</span>
                          <span className="reward-value">+{r.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!reward.unlocked && (
                    <div className="tier-requirement">
                      Requiere {reward.trustLevel * 1000} puntos de confianza
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <Card className="info-panel">
        <h3>💡 Cómo Funciona la Confianza</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">🤝</span>
            <div className="info-text">
              <strong>Ayuda</strong>
              <p>Ayuda a otros jugadores en combate o misiones</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">💱</span>
            <div className="info-text">
              <strong>Comercio</strong>
              <p>Realiza intercambios justos en el marketplace</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📜</span>
            <div className="info-text">
              <strong>Cooperación</strong>
              <p>Completa misiones cooperativas</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🎁</span>
            <div className="info-text">
              <strong>Generosidad</strong>
              <p>Regala ítems o recursos a otros</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}


