import React, { useState, useEffect } from 'react'
import { useRaidStore } from '../../store/raidStore'
import { usePlayerStore } from '../../store/playerStore'
import { ws } from '../../services/websocket'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import './Raids.css'

export const Raids: React.FC = () => {
  const { raids, activeRaidId, myRaidHistory } = useRaidStore()
  const player = usePlayerStore((state) => state.player)
  const [selectedRaidId, setSelectedRaidId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    // Solicitar raids disponibles
    ws.send('raid:get_available')
    if (activeRaidId) {
      ws.send('raid:get_status', { raidId: activeRaidId })
    }
  }, [activeRaidId])

  const activeRaid = activeRaidId ? raids[activeRaidId] : null
  const selectedRaid = selectedRaidId ? raids[selectedRaidId] : null
  const availableRaids = Object.values(raids).filter(r => r.status === 'waiting')

  const handleCreateRaid = (type: string, difficulty: string) => {
    ws.send('raid:create', { 
      type, 
      difficulty,
      nodeId: player?.currentNode || 'refuge'
    })
    setShowCreateModal(false)
  }

  const handleJoinRaid = (raidId: string) => {
    ws.send('raid:join', { raidId })
  }

  const handleLeaveRaid = () => {
    if (activeRaidId) {
      ws.send('raid:leave', { raidId: activeRaidId })
    }
  }

  const handleStartRaid = () => {
    if (activeRaidId) {
      ws.send('raid:start', { raidId: activeRaidId })
    }
  }

  const handleToggleReady = () => {
    if (activeRaidId && player) {
      ws.send('raid:set_ready', { 
        raidId: activeRaidId,
        ready: !activeRaid?.participants[player.id]?.isReady
      })
    }
  }

  const getRaidTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      horde: '🧟',
      boss: '👹',
      scavenge: '🔍',
      rescue: '🚑',
      defense: '🛡️'
    }
    return icons[type] || '⚔️'
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: '#4ade80',
      normal: '#fbbf24',
      hard: '#f97316',
      nightmare: '#dc2626'
    }
    return colors[difficulty] || '#gray'
  }

  return (
    <div className="raids-page">
      {/* Header */}
      <div className="raids-header">
        <h1>🏆 Raids Cooperativos</h1>
        <div className="raids-stats">
          <div className="stat">
            <span className="label">Completadas:</span>
            <span className="value">{myRaidHistory.completed}</span>
          </div>
          <div className="stat">
            <span className="label">Falladas:</span>
            <span className="value">{myRaidHistory.failed}</span>
          </div>
          <div className="stat">
            <span className="label">Total Kills:</span>
            <span className="value">{myRaidHistory.totalKills}</span>
          </div>
          <div className="stat">
            <span className="label">Mejor Oleada:</span>
            <span className="value">{myRaidHistory.bestWave}</span>
          </div>
        </div>
      </div>

      <div className="raids-container">
        {/* Active Raid Section */}
        {activeRaid && (
          <div className="active-raid-section">
            <Card>
              <h2>🎯 Raid Activa</h2>
              <div className="raid-info-header">
                <span className="raid-type">{getRaidTypeIcon(activeRaid.type)} {activeRaid.type.toUpperCase()}</span>
                <span 
                  className="raid-difficulty"
                  style={{ color: getDifficultyColor(activeRaid.difficulty) }}
                >
                  {activeRaid.difficulty.toUpperCase()}
                </span>
                <span className="raid-status">{activeRaid.status.toUpperCase()}</span>
              </div>

              {/* Wave Progress */}
              {activeRaid.status === 'active' && (
                <div className="wave-progress">
                  <h3>Oleada {activeRaid.currentWave} / {activeRaid.totalWaves}</h3>
                  {activeRaid.waves[activeRaid.currentWave - 1] && (
                    <ProgressBar
                      current={activeRaid.waves[activeRaid.currentWave - 1].enemiesKilled}
                      max={activeRaid.waves[activeRaid.currentWave - 1].enemyCount}
                      label="Enemigos"
                      color="#ef4444"
                    />
                  )}
                </div>
              )}

              {/* Participants */}
              <div className="participants-section">
                <h3>Participantes ({Object.keys(activeRaid.participants).length}/{activeRaid.maxPlayers})</h3>
                <div className="participants-list">
                  {Object.values(activeRaid.participants).map(p => (
                    <div key={p.playerId} className={`participant ${p.isAlive ? '' : 'dead'}`}>
                      <span className="name">{p.playerName}</span>
                      <span className="level">Lvl {p.level}</span>
                      {p.role && <span className="role">{p.role}</span>}
                      <span className={`status ${p.isReady ? 'ready' : 'not-ready'}`}>
                        {p.isReady ? '✓' : '○'}
                      </span>
                      <div className="stats">
                        <span>💀 {p.kills}</span>
                        <span>⚔️ {p.damage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="raid-actions">
                {activeRaid.status === 'waiting' && (
                  <>
                    {activeRaid.leaderId === player?.id && (
                      <Button
                        onClick={handleStartRaid}
                        disabled={Object.values(activeRaid.participants).filter(p => p.isReady).length < activeRaid.minPlayers}
                      >
                        🚀 Iniciar Raid
                      </Button>
                    )}
                    <Button onClick={handleToggleReady}>
                      {activeRaid.participants[player?.id || '']?.isReady ? 'No Listo' : 'Listo'}
                    </Button>
                  </>
                )}
                <Button onClick={handleLeaveRaid} variant="danger">
                  Abandonar
                </Button>
              </div>

              {/* Stats */}
              <div className="raid-stats">
                <div className="stat">
                  <span>Total Kills:</span>
                  <span>{activeRaid.totalKills}</span>
                </div>
                <div className="stat">
                  <span>Total Damage:</span>
                  <span>{activeRaid.totalDamage}</span>
                </div>
                <div className="stat">
                  <span>Tiempo:</span>
                  <span>{Math.floor(activeRaid.timeElapsed / 60)}m {activeRaid.timeElapsed % 60}s</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Available Raids */}
        <div className="available-raids-section">
          <div className="section-header">
            <h2>Raids Disponibles</h2>
            <Button onClick={() => setShowCreateModal(true)}>
              ➕ Crear Raid
            </Button>
          </div>

          <div className="raids-grid">
            {availableRaids.length === 0 ? (
              <Card>
                <p className="no-raids">No hay raids disponibles. ¡Crea una!</p>
              </Card>
            ) : (
              availableRaids.map(raid => (
                <Card key={raid.id} className="raid-card">
                  <div className="raid-card-header">
                    <span className="raid-type-icon">{getRaidTypeIcon(raid.type)}</span>
                    <h3>{raid.type.toUpperCase()}</h3>
                    <span 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(raid.difficulty) }}
                    >
                      {raid.difficulty}
                    </span>
                  </div>

                  <div className="raid-card-info">
                    <p><strong>Ubicación:</strong> {raid.nodeName}</p>
                    <p><strong>Líder:</strong> {raid.participants[raid.leaderId]?.playerName}</p>
                    <p><strong>Jugadores:</strong> {Object.keys(raid.participants).length}/{raid.maxPlayers}</p>
                    <p><strong>Oleadas:</strong> {raid.totalWaves}</p>
                  </div>

                  <div className="raid-card-rewards">
                    <strong>Recompensas:</strong>
                    <p>💰 {raid.experienceReward} XP</p>
                    {raid.rewards.slice(0, 3).map((r, i) => (
                      <span key={i} className={`reward-item rarity-${r.rarity}`}>
                        {r.itemName} x{r.quantity}
                      </span>
                    ))}
                  </div>

                  <Button 
                    onClick={() => handleJoinRaid(raid.id)}
                    disabled={Object.keys(raid.participants).length >= raid.maxPlayers}
                  >
                    Unirse
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Raid Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Crear Nueva Raid</h2>
            <div className="create-raid-form">
              <div className="form-group">
                <label>Tipo de Raid:</label>
                <div className="raid-types">
                  {['horde', 'boss', 'scavenge', 'rescue', 'defense'].map(type => (
                    <Button
                      key={type}
                      onClick={() => {
                        const difficulty = 'normal'
                        handleCreateRaid(type, difficulty)
                      }}
                    >
                      {getRaidTypeIcon(type)} {type}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Dificultad:</label>
                <div className="difficulty-buttons">
                  {['easy', 'normal', 'hard', 'nightmare'].map(diff => (
                    <Button
                      key={diff}
                      style={{ backgroundColor: getDifficultyColor(diff) }}
                      onClick={() => handleCreateRaid('horde', diff)}
                    >
                      {diff}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(false)} variant="danger">
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


