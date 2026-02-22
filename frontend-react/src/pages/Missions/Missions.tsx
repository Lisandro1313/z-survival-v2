import React, { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { ws } from '../../services/websocket'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import './Missions.css'

interface Mission {
  id: string
  title: string
  description: string
  type: 'main' | 'side' | 'daily' | 'weekly' | 'event'
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  status: 'available' | 'active' | 'completed' | 'failed'
  objectives: {
    id: string
    description: string
    current: number
    required: number
    completed: boolean
  }[]
  rewards: {
    xp?: number
    caps?: number
    items?: { id: string; name: string; quantity: number; rarity: string }[]
    reputation?: number
  }
  timeLimit?: number
  timeRemaining?: number
  requirements?: {
    level?: number
    previousMission?: string
  }
}

export const Missions: React.FC = () => {
  const player = usePlayerStore((state) => state.player)
  const [missions, setMissions] = useState<Mission[]>([])
  const [activeMissions, setActiveMissions] = useState<Mission[]>([])
  const [completedMissions, setCompletedMissions] = useState<Mission[]>([])
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('active')
  const [showMissionModal, setShowMissionModal] = useState(false)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

  useEffect(() => {
    ws.send('missions:get_all')
    ws.send('missions:get_active')
    ws.send('missions:get_completed')

    const interval = setInterval(() => {
      ws.send('missions:get_active')
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleAcceptMission = (missionId: string) => {
    ws.send('missions:accept', { missionId })
    setShowMissionModal(false)
    setSelectedMission(null)
  }

  const handleAbandonMission = (missionId: string) => {
    if (window.confirm('¿Seguro que quieres abandonar esta misión?')) {
      ws.send('missions:abandon', { missionId })
    }
  }

  const handleClaimRewards = (missionId: string) => {
    ws.send('missions:claim_rewards', { missionId })
  }

  const getMissionTypeColor = (type: string) => {
    switch (type) {
      case 'main': return '#fbbf24'
      case 'side': return '#3b82f6'
      case 'daily': return '#22c55e'
      case 'weekly': return '#a855f7'
      case 'event': return '#ef4444'
      default: return '#9ca3af'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#22c55e'
      case 'medium': return '#fbbf24'
      case 'hard': return '#f97316'
      case 'extreme': return '#ef4444'
      default: return '#9ca3af'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return '#fbbf24'
      case 'epic': return '#a855f7'
      case 'rare': return '#3b82f6'
      case 'uncommon': return '#22c55e'
      default: return '#9ca3af'
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const filteredMissions = missions.filter(mission => {
    if (filterType !== 'all' && mission.type !== filterType) return false
    if (filterDifficulty !== 'all' && mission.difficulty !== filterDifficulty) return false
    return true
  })

  return (
    <div className="missions-page">
      {/* Header */}
      <div className="missions-header">
        <h1>📜 Panel de Misiones</h1>
        <div className="mission-stats">
          <span className="stat">✅ {completedMissions.length} Completadas</span>
          <span className="stat active">🔄 {activeMissions.length} Activas</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="missions-tabs">
        <button 
          className={activeTab === 'available' ? 'active' : ''}
          onClick={() => setActiveTab('available')}
        >
          📋 Disponibles
        </button>
        <button 
          className={activeTab === 'active' ? 'active' : ''}
          onClick={() => setActiveTab('active')}
        >
          🔄 En Progreso
        </button>
        <button 
          className={activeTab === 'completed' ? 'active' : ''}
          onClick={() => setActiveTab('completed')}
        >
          ✅ Completadas
        </button>
      </div>

      {/* Filters */}
      {activeTab === 'available' && (
        <div className="missions-filters">
          <div className="filter-group">
            <label>Tipo:</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">Todos</option>
              <option value="main">Principal</option>
              <option value="side">Secundaria</option>
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
              <option value="event">Evento</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Dificultad:</label>
            <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
              <option value="all">Todas</option>
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
              <option value="extreme">Extrema</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="missions-content">
        {/* Available Missions */}
        {activeTab === 'available' && (
          <div className="missions-grid">
            {filteredMissions.length === 0 ? (
              <Card>
                <p className="no-data">No hay misiones disponibles en este momento.</p>
              </Card>
            ) : (
              filteredMissions.map(mission => (
                <Card key={mission.id} className="mission-card">
                  <div className="mission-header">
                    <div className="mission-title">
                      <h3>{mission.title}</h3>
                      <div className="mission-badges">
                        <span 
                          className="type-badge"
                          style={{ backgroundColor: getMissionTypeColor(mission.type) }}
                        >
                          {mission.type}
                        </span>
                        <span 
                          className="difficulty-badge"
                          style={{ backgroundColor: getDifficultyColor(mission.difficulty) }}
                        >
                          {mission.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mission-description">{mission.description}</p>

                  {/* Objectives Preview */}
                  <div className="objectives-preview">
                    <strong>Objetivos:</strong>
                    <ul>
                      {mission.objectives.slice(0, 3).map(obj => (
                        <li key={obj.id}>
                          {obj.description}
                        </li>
                      ))}
                      {mission.objectives.length > 3 && (
                        <li className="more-objectives">+{mission.objectives.length - 3} más...</li>
                      )}
                    </ul>
                  </div>

                  {/* Rewards Preview */}
                  <div className="rewards-preview">
                    <strong>Recompensas:</strong>
                    <div className="rewards-icons">
                      {mission.rewards.xp && <span>⭐ {mission.rewards.xp} XP</span>}
                      {mission.rewards.caps && <span>💰 {mission.rewards.caps} caps</span>}
                      {mission.rewards.items && mission.rewards.items.length > 0 && (
                        <span>📦 {mission.rewards.items.length} ítem(s)</span>
                      )}
                      {mission.rewards.reputation && <span>🏆 {mission.rewards.reputation} rep</span>}
                    </div>
                  </div>

                  {/* Requirements */}
                  {mission.requirements?.level && player && player.level < mission.requirements.level && (
                    <div className="requirements-warning">
                      ⚠️ Requiere nivel {mission.requirements.level}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mission-actions">
                    <Button onClick={() => {
                      setSelectedMission(mission)
                      setShowMissionModal(true)
                    }}>
                      👁️ Ver Detalles
                    </Button>
                    <Button 
                      onClick={() => handleAcceptMission(mission.id)}
                      disabled={
                        mission.requirements?.level && player 
                          ? player.level < mission.requirements.level 
                          : false
                      }
                    >
                      ✅ Aceptar
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Active Missions */}
        {activeTab === 'active' && (
          <div className="missions-grid">
            {activeMissions.length === 0 ? (
              <Card>
                <p className="no-data">No tienes misiones activas. Ve a la pestaña Disponibles.</p>
              </Card>
            ) : (
              activeMissions.map(mission => (
                <Card key={mission.id} className="mission-card active">
                  <div className="mission-header">
                    <div className="mission-title">
                      <h3>{mission.title}</h3>
                      <div className="mission-badges">
                        <span 
                          className="type-badge"
                          style={{ backgroundColor: getMissionTypeColor(mission.type) }}
                        >
                          {mission.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Time Limit */}
                  {mission.timeRemaining && (
                    <div className="time-remaining">
                      ⏱️ Tiempo restante: {formatTime(mission.timeRemaining)}
                    </div>
                  )}

                  {/* Objectives Progress */}
                  <div className="objectives-progress">
                    <strong>Progreso de Objetivos:</strong>
                    {mission.objectives.map(obj => (
                      <div key={obj.id} className="objective-item">
                        <div className="objective-header">
                          <span className={obj.completed ? 'completed' : ''}>
                            {obj.completed ? '✅' : '⬜'} {obj.description}
                          </span>
                          <span className="objective-count">
                            {obj.current}/{obj.required}
                          </span>
                        </div>
                        <ProgressBar
                          current={obj.current}
                          max={obj.required}
                          label=""
                          color={obj.completed ? '#22c55e' : '#3b82f6'}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Overall Progress */}
                  <div className="overall-progress">
                    <strong>Progreso Total:</strong>
                    <ProgressBar
                      current={mission.objectives.filter(o => o.completed).length}
                      max={mission.objectives.length}
                      label=""
                      color="#fbbf24"
                    />
                  </div>

                  {/* Actions */}
                  <div className="mission-actions">
                    {mission.status === 'completed' ? (
                      <Button onClick={() => handleClaimRewards(mission.id)}>
                        🎁 Reclamar Recompensas
                      </Button>
                    ) : (
                      <>
                        <Button onClick={() => {
                          setSelectedMission(mission)
                          setShowMissionModal(true)
                        }}>
                          👁️ Detalles
                        </Button>
                        <Button 
                          onClick={() => handleAbandonMission(mission.id)}
                          variant="danger"
                        >
                          🗑️ Abandonar
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Completed Missions */}
        {activeTab === 'completed' && (
          <div className="missions-grid">
            {completedMissions.length === 0 ? (
              <Card>
                <p className="no-data">No has completado ninguna misión todavía.</p>
              </Card>
            ) : (
              completedMissions.map(mission => (
                <Card key={mission.id} className="mission-card completed">
                  <div className="mission-header">
                    <div className="mission-title">
                      <h3>{mission.title}</h3>
                      <span className="completed-badge">✅ Completada</span>
                    </div>
                  </div>

                  <p className="mission-description">{mission.description}</p>

                  {/* Rewards Claimed */}
                  <div className="rewards-claimed">
                    <strong>Recompensas Obtenidas:</strong>
                    <div className="rewards-list">
                      {mission.rewards.xp && (
                        <div className="reward-item">
                          <span>⭐ Experiencia</span>
                          <strong>+{mission.rewards.xp}</strong>
                        </div>
                      )}
                      {mission.rewards.caps && (
                        <div className="reward-item">
                          <span>💰 Caps</span>
                          <strong>+{mission.rewards.caps}</strong>
                        </div>
                      )}
                      {mission.rewards.items?.map((item, index) => (
                        <div key={index} className="reward-item">
                          <span 
                            className="item-name"
                            style={{ color: getRarityColor(item.rarity) }}
                          >
                            📦 {item.name}
                          </span>
                          <strong>x{item.quantity}</strong>
                        </div>
                      ))}
                      {mission.rewards.reputation && (
                        <div className="reward-item">
                          <span>🏆 Reputación</span>
                          <strong>+{mission.rewards.reputation}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Mission Details Modal */}
      {showMissionModal && selectedMission && (
        <div className="modal-overlay" onClick={() => setShowMissionModal(false)}>
          <div className="modal-content mission-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedMission.title}</h2>
              <div className="modal-badges">
                <span 
                  className="type-badge"
                  style={{ backgroundColor: getMissionTypeColor(selectedMission.type) }}
                >
                  {selectedMission.type}
                </span>
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(selectedMission.difficulty) }}
                >
                  {selectedMission.difficulty}
                </span>
              </div>
            </div>

            <div className="modal-body">
              <p className="modal-description">{selectedMission.description}</p>

              {/* Full Objectives */}
              <div className="modal-section">
                <h3>📋 Objetivos</h3>
                <ul className="objectives-full-list">
                  {selectedMission.objectives.map(obj => (
                    <li key={obj.id}>
                      {obj.description}
                      {selectedMission.status === 'active' && (
                        <span className="objective-progress-text">
                          {obj.current}/{obj.required}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full Rewards */}
              <div className="modal-section rewards-section">
                <h3>🎁 Recompensas</h3>
                <div className="rewards-full-list">
                  {selectedMission.rewards.xp && (
                    <div className="reward-box">
                      <div className="reward-icon">⭐</div>
                      <div className="reward-details">
                        <span className="reward-label">Experiencia</span>
                        <strong className="reward-value">+{selectedMission.rewards.xp} XP</strong>
                      </div>
                    </div>
                  )}
                  {selectedMission.rewards.caps && (
                    <div className="reward-box">
                      <div className="reward-icon">💰</div>
                      <div className="reward-details">
                        <span className="reward-label">Caps</span>
                        <strong className="reward-value">+{selectedMission.rewards.caps}</strong>
                      </div>
                    </div>
                  )}
                  {selectedMission.rewards.items?.map((item, index) => (
                    <div key={index} className="reward-box">
                      <div className="reward-icon">📦</div>
                      <div className="reward-details">
                        <span 
                          className="reward-label"
                          style={{ color: getRarityColor(item.rarity) }}
                        >
                          {item.name}
                        </span>
                        <strong className="reward-value">x{item.quantity}</strong>
                      </div>
                    </div>
                  ))}
                  {selectedMission.rewards.reputation && (
                    <div className="reward-box">
                      <div className="reward-icon">🏆</div>
                      <div className="reward-details">
                        <span className="reward-label">Reputación</span>
                        <strong className="reward-value">+{selectedMission.rewards.reputation}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Time Limit */}
              {selectedMission.timeLimit && (
                <div className="modal-section">
                  <h3>⏱️ Límite de Tiempo</h3>
                  <p className="time-info">{formatTime(selectedMission.timeLimit)}</p>
                </div>
              )}
            </div>

            <div className="form-actions">
              {selectedMission.status === 'available' ? (
                <Button onClick={() => handleAcceptMission(selectedMission.id)}>
                  ✅ Aceptar Misión
                </Button>
              ) : selectedMission.status === 'completed' ? (
                <Button onClick={() => handleClaimRewards(selectedMission.id)}>
                  🎁 Reclamar Recompensas
                </Button>
              ) : null}
              <Button onClick={() => setShowMissionModal(false)} variant="danger">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


