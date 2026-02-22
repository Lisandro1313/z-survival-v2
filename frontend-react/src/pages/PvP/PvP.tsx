import React, { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { ws } from '../../services/websocket'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import './PvP.css'

interface Duel {
  id: string
  challenger: {
    id: string
    name: string
    level: number
    hp: number
    maxHp: number
  }
  opponent: {
    id: string
    name: string
    level: number
    hp: number
    maxHp: number
  }
  status: 'pending' | 'active' | 'finished'
  currentRound: number
  maxRounds: number
  winner?: string
  wager?: number
}

interface PvPStats {
  totalDuels: number
  wins: number
  losses: number
  draws: number
  winRate: number
  ranking: number
  elo: number
  killStreak: number
}

export const PvP: React.FC = () => {
  const player = usePlayerStore((state) => state.player)
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null)
  const [pendingDuels, setPendingDuels] = useState<Duel[]>([])
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([])
  const [pvpStats, setPvpStats] = useState<PvPStats>({
    totalDuels: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    ranking: 0,
    elo: 1000,
    killStreak: 0
  })
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'duel' | 'stats' | 'leaderboard'>('duel')
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [wagerAmount, setWagerAmount] = useState('')

  useEffect(() => {
    ws.send('pvp:get_stats')
    ws.send('pvp:get_online_players')
    ws.send('pvp:get_leaderboard')
    ws.send('pvp:get_pending_duels')
    
    const interval = setInterval(() => {
      if (activeDuel) {
        ws.send('pvp:get_duel_status', { duelId: activeDuel.id })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [activeDuel])

  const handleChallenge = () => {
    if (selectedPlayer && wagerAmount) {
      ws.send('pvp:challenge', {
        opponentId: selectedPlayer.id,
        wager: parseInt(wagerAmount)
      })
      setShowChallengeModal(false)
      setWagerAmount('')
      setSelectedPlayer(null)
    }
  }

  const handleAcceptDuel = (duelId: string) => {
    ws.send('pvp:accept_duel', { duelId })
  }

  const handleDeclineDuel = (duelId: string) => {
    ws.send('pvp:decline_duel', { duelId })
  }

  const handleAttack = (abilityId?: string) => {
    if (activeDuel) {
      ws.send('pvp:attack', {
        duelId: activeDuel.id,
        abilityId: abilityId || 'basic_attack'
      })
    }
  }

  const handleDefend = () => {
    if (activeDuel) {
      ws.send('pvp:defend', { duelId: activeDuel.id })
    }
  }

  const handleForfeit = () => {
    if (activeDuel && window.confirm('¿Seguro que quieres rendirte?')) {
      ws.send('pvp:forfeit', { duelId: activeDuel.id })
    }
  }

  const getEloColor = (elo: number) => {
    if (elo >= 2000) return '#fbbf24' // Legendary
    if (elo >= 1800) return '#a855f7' // Epic
    if (elo >= 1500) return '#3b82f6' // Rare
    if (elo >= 1200) return '#22c55e' // Uncommon
    return '#9ca3af' // Common
  }

  const getRankName = (elo: number) => {
    if (elo >= 2000) return 'Legendary'
    if (elo >= 1800) return 'Master'
    if (elo >= 1500) return 'Diamond'
    if (elo >= 1200) return 'Gold'
    if (elo >= 1000) return 'Silver'
    return 'Bronze'
  }

  return (
    <div className="pvp-page">
      {/* Header */}
      <div className="pvp-header">
        <h1>⚔️ Arena PvP</h1>
        <div className="player-elo">
          <span 
            className="elo-badge"
            style={{ backgroundColor: getEloColor(pvpStats.elo) }}
          >
            {getRankName(pvpStats.elo)}
          </span>
          <span className="elo-value">{pvpStats.elo} ELO</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="pvp-tabs">
        <button 
          className={activeTab === 'duel' ? 'active' : ''}
          onClick={() => setActiveTab('duel')}
        >
          ⚔️ Duelo
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Estadísticas
        </button>
        <button 
          className={activeTab === 'leaderboard' ? 'active' : ''}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Ranking
        </button>
      </div>

      {/* Content */}
      <div className="pvp-content">
        {/* Duel Tab */}
        {activeTab === 'duel' && (
          <>
            {/* Active Duel */}
            {activeDuel && activeDuel.status === 'active' ? (
              <Card className="active-duel-card">
                <h2>Duelo en Progreso</h2>
                
                <div className="duel-arena">
                  {/* Player 1 */}
                  <div className="duel-participant left">
                    <h3>{activeDuel.challenger.name}</h3>
                    <div className="participant-level">Lvl {activeDuel.challenger.level}</div>
                    <div className="participant-hp">
                      <ProgressBar
                        current={activeDuel.challenger.hp}
                        max={activeDuel.challenger.maxHp}
                        label="HP"
                        color="#10b981"
                      />
                    </div>
                  </div>

                  {/* VS */}
                  <div className="duel-vs">
                    <div className="vs-icon">⚔️</div>
                    <div className="round-info">
                      Ronda {activeDuel.currentRound}/{activeDuel.maxRounds}
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div className="duel-participant right">
                    <h3>{activeDuel.opponent.name}</h3>
                    <div className="participant-level">Lvl {activeDuel.opponent.level}</div>
                    <div className="participant-hp">
                      <ProgressBar
                        current={activeDuel.opponent.hp}
                        max={activeDuel.opponent.maxHp}
                        label="HP"
                        color="#ef4444"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {activeDuel.challenger.id === player?.id || activeDuel.opponent.id === player?.id ? (
                  <div className="duel-actions">
                    <Button onClick={() => handleAttack()}>
                      ⚔️ Atacar
                    </Button>
                    <Button onClick={() => handleAttack('power_attack')}>
                      💥 Ataque Fuerte
                    </Button>
                    <Button onClick={handleDefend}>
                      🛡️ Defender
                    </Button>
                    <Button onClick={() => handleAttack('special')}>
                      ✨ Especial
                    </Button>
                    <Button onClick={handleForfeit} variant="danger">
                      🏳️ Rendirse
                    </Button>
                  </div>
                ) : (
                  <div className="spectate-info">
                    👁️ Estás observando este duelo
                  </div>
                )}

                {activeDuel.wager && (
                  <div className="wager-info">
                    💰 Apuesta: {activeDuel.wager} caps
                  </div>
                )}
              </Card>
            ) : (
              <>
                {/* Pending Duels */}
                {pendingDuels.length > 0 && (
                  <div className="pending-duels-section">
                    <h2>Desafíos Pendientes</h2>
                    <div className="pending-duels-list">
                      {pendingDuels.map(duel => (
                        <Card key={duel.id} className="pending-duel-card">
                          <div className="duel-info">
                            <h3>{duel.challenger.name} te ha desafiado!</h3>
                            <p>Nivel {duel.challenger.level}</p>
                            {duel.wager && <p className="wager">💰 Apuesta: {duel.wager} caps</p>}
                          </div>
                          <div className="duel-actions">
                            <Button onClick={() => handleAcceptDuel(duel.id)}>
                              ✅ Aceptar
                            </Button>
                            <Button onClick={() => handleDeclineDuel(duel.id)} variant="danger">
                              ❌ Rechazar
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Online Players */}
                <div className="online-players-section">
                  <div className="section-header">
                    <h2>Jugadores Online</h2>
                    <p className="subtitle">{onlinePlayers.length} jugadores disponibles</p>
                  </div>

                  <div className="players-grid">
                    {onlinePlayers.length === 0 ? (
                      <Card>
                        <p className="no-players">No hay jugadores disponibles para duelo.</p>
                      </Card>
                    ) : (
                      onlinePlayers
                        .filter(p => p.id !== player?.id)
                        .map(p => (
                          <Card key={p.id} className="player-card">
                            <div className="player-info">
                              <h3>{p.name}</h3>
                              <div className="player-stats">
                                <span className="level">Lvl {p.level}</span>
                                <span 
                                  className="elo"
                                  style={{ color: getEloColor(p.elo || 1000) }}
                                >
                                  {p.elo || 1000} ELO
                                </span>
                              </div>
                              <div className="player-record">
                                <span className="wins">{p.wins || 0}W</span>
                                <span className="losses">{p.losses || 0}L</span>
                              </div>
                            </div>
                            <Button onClick={() => {
                              setSelectedPlayer(p)
                              setShowChallengeModal(true)
                            }}>
                              ⚔️ Desafiar
                            </Button>
                          </Card>
                        ))
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="stats-section">
            <Card className="stats-card-main">
              <h2>Mis Estadísticas</h2>
              
              <div className="stats-grid">
                <div className="stat-box">
                  <span className="stat-label">Total Duelos</span>
                  <span className="stat-value">{pvpStats.totalDuels}</span>
                </div>
                <div className="stat-box wins">
                  <span className="stat-label">Victorias</span>
                  <span className="stat-value">{pvpStats.wins}</span>
                </div>
                <div className="stat-box losses">
                  <span className="stat-label">Derrotas</span>
                  <span className="stat-value">{pvpStats.losses}</span>
                </div>
                <div className="stat-box draws">
                  <span className="stat-label">Empates</span>
                  <span className="stat-value">{pvpStats.draws}</span>
                </div>
                <div className="stat-box winrate">
                  <span className="stat-label">Tasa de Victoria</span>
                  <span className="stat-value">{pvpStats.winRate.toFixed(1)}%</span>
                </div>
                <div className="stat-box ranking">
                  <span className="stat-label">Ranking</span>
                  <span className="stat-value">#{pvpStats.ranking || 'N/A'}</span>
                </div>
                <div className="stat-box elo">
                  <span className="stat-label">ELO Rating</span>
                  <span 
                    className="stat-value"
                    style={{ color: getEloColor(pvpStats.elo) }}
                  >
                    {pvpStats.elo}
                  </span>
                </div>
                <div className="stat-box streak">
                  <span className="stat-label">Racha Actual</span>
                  <span className="stat-value">🔥 {pvpStats.killStreak}</span>
                </div>
              </div>

              <div className="stats-chart">
                <h3>Historial de Victorias</h3>
                <div className="win-loss-bar">
                  <div 
                    className="win-section"
                    style={{ width: `${pvpStats.winRate}%` }}
                  >
                    {pvpStats.wins}
                  </div>
                  <div 
                    className="loss-section"
                    style={{ width: `${100 - pvpStats.winRate}%` }}
                  >
                    {pvpStats.losses}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <h2>🏆 Ranking Global</h2>
            
            <div className="leaderboard-table">
              <div className="table-header">
                <div className="col rank">#</div>
                <div className="col player">Jugador</div>
                <div className="col level">Nivel</div>
                <div className="col elo">ELO</div>
                <div className="col record">W/L</div>
                <div className="col winrate">Tasa</div>
              </div>

              {leaderboard.length === 0 ? (
                <Card>
                  <p className="no-data">No hay datos del ranking todavía.</p>
                </Card>
              ) : (
                leaderboard.map((entry, index) => (
                  <div 
                    key={entry.playerId}
                    className={`table-row ${entry.playerId === player?.id ? 'my-entry' : ''}`}
                  >
                    <div className="col rank">
                      {index < 3 ? (
                        <span className={`medal rank-${index + 1}`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span>#{index + 1}</span>
                      )}
                    </div>
                    <div className="col player">{entry.playerName}</div>
                    <div className="col level">{entry.level}</div>
                    <div 
                      className="col elo"
                      style={{ color: getEloColor(entry.elo) }}
                    >
                      {entry.elo}
                    </div>
                    <div className="col record">
                      <span className="wins">{entry.wins}</span>/
                      <span className="losses">{entry.losses}</span>
                    </div>
                    <div className="col winrate">{entry.winRate.toFixed(1)}%</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Challenge Modal */}
      {showChallengeModal && selectedPlayer && (
        <div className="modal-overlay" onClick={() => setShowChallengeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Desafiar a {selectedPlayer.name}</h2>
            
            <div className="challenge-info">
              <p><strong>Nivel:</strong> {selectedPlayer.level}</p>
              <p><strong>ELO:</strong> <span style={{ color: getEloColor(selectedPlayer.elo || 1000) }}>
                {selectedPlayer.elo || 1000}
              </span></p>
              <p><strong>Record:</strong> {selectedPlayer.wins || 0}W - {selectedPlayer.losses || 0}L</p>
            </div>

            <div className="form-group">
              <label>Apuesta (opcional):</label>
              <input
                type="number"
                min="0"
                max={player?.caps || 0}
                value={wagerAmount}
                onChange={e => setWagerAmount(e.target.value)}
                placeholder="0 caps"
              />
              <small>Máximo: {player?.caps || 0} caps</small>
            </div>

            <div className="modal-info">
              <p>📝 El duelo será de 5 rondas máximo.</p>
              <p>⚔️ El primero en vencer gana.</p>
              {wagerAmount && <p>💰 El ganador se lleva {parseInt(wagerAmount) * 2} caps total.</p>}
            </div>

            <div className="form-actions">
              <Button onClick={handleChallenge}>
                ⚔️ Enviar Desafío
              </Button>
              <Button onClick={() => setShowChallengeModal(false)} variant="danger">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


