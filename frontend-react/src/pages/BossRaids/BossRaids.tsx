import React, { useState, useEffect } from 'react'
import { useClanStore } from '../../store/clanStore'
import { usePlayerStore } from '../../store/playerStore'
import { ws } from '../../services/websocket'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import './BossRaids.css'

interface BossPhase {
  phase: number
  name: string
  hpThreshold: number
  abilities: string[]
  completed: boolean
}

interface BossRaid {
  id: string
  bossName: string
  bossType: string
  bossLevel: number
  bossHp: number
  bossMaxHp: number
  phases: BossPhase[]
  currentPhase: number
  participants: any[]
  rewards: any[]
  status: 'waiting' | 'active' | 'completed' | 'failed'
  difficulty: 'normal' | 'hard' | 'nightmare' | 'mythic'
}

export const BossRaids: React.FC = () => {
  const player = usePlayerStore((state) => state.player)
  const [bossRaids, setBossRaids] = useState<BossRaid[]>([])
  const [activeBossRaid, setActiveBossRaid] = useState<BossRaid | null>(null)
  const [showBossInfo, setShowBossInfo] = useState(false)
  const [selectedBoss, setSelectedBoss] = useState<BossRaid | null>(null)

  useEffect(() => {
    ws.send('bossraid:get_available')
    
    const interval = setInterval(() => {
      if (activeBossRaid) {
        ws.send('bossraid:get_status', { raidId: activeBossRaid.id })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [activeBossRaid])

  const handleJoinBossRaid = (raidId: string) => {
    ws.send('bossraid:join', { raidId })
  }

  const handleLeaveBossRaid = () => {
    if (activeBossRaid) {
      ws.send('bossraid:leave', { raidId: activeBossRaid.id })
    }
  }

  const handleStartBossRaid = () => {
    if (activeBossRaid) {
      ws.send('bossraid:start', { raidId: activeBossRaid.id })
    }
  }

  const handleAttackBoss = () => {
    if (activeBossRaid) {
      ws.send('bossraid:attack', { raidId: activeBossRaid.id })
    }
  }

  const handleUseAbility = (abilityId: string) => {
    if (activeBossRaid) {
      ws.send('bossraid:use_ability', { 
        raidId: activeBossRaid.id,
        abilityId 
      })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      normal: '#10b981',
      hard: '#f59e0b',
      nightmare: '#ef4444',
      mythic: '#a855f7'
    }
    return colors[difficulty] || '#gray'
  }

  const getBossIcon = (type: string) => {
    const icons: Record<string, string> = {
      zombie_king: '👑',
      plague_doctor: '🧪',
      necromancer: '💀',
      behemoth: '🦍',
      reaper: '☠️'
    }
    return icons[type] || '👹'
  }

  return (
    <div className="boss-raids-page">
      {/* Header */}
      <div className="boss-raids-header">
        <h1>👹 Boss Raids</h1>
        <p className="subtitle">Enfrenta a poderosos jefes cooperativamente</p>
      </div>

      {/* Active Boss Raid */}
      {activeBossRaid && (
        <div className="active-boss-section">
          <Card className="boss-card-active">
            <div className="boss-header">
              <div className="boss-icon-large">{getBossIcon(activeBossRaid.bossType)}</div>
              <div className="boss-title-info">
                <h2>{activeBossRaid.bossName}</h2>
                <span className="boss-level">Nivel {activeBossRaid.bossLevel}</span>
                <span 
                  className="boss-difficulty"
                  style={{ backgroundColor: getDifficultyColor(activeBossRaid.difficulty) }}
                >
                  {activeBossRaid.difficulty.toUpperCase()}
                </span>
              </div>
              <div className="boss-status">
                <span className={`status-badge ${activeBossRaid.status}`}>
                  {activeBossRaid.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Boss HP Bar */}
            <div className="boss-hp-section">
              <ProgressBar
                current={activeBossRaid.bossHp}
                max={activeBossRaid.bossMaxHp}
                label="Boss HP"
                color="#dc2626"
                showPercentage
              />
            </div>

            {/* Current Phase */}
            <div className="boss-phase-section">
              <h3>Fase {activeBossRaid.currentPhase}: {activeBossRaid.phases[activeBossRaid.currentPhase - 1]?.name}</h3>
              <div className="phase-abilities">
                <strong>Habilidades activas:</strong>
                <div className="abilities-list">
                  {activeBossRaid.phases[activeBossRaid.currentPhase - 1]?.abilities.map((ability, i) => (
                    <span key={i} className="ability-tag">{ability}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Phases Progress */}
            <div className="phases-progress">
              <h4>Progreso de Fases:</h4>
              <div className="phases-bar">
                {activeBossRaid.phases.map((phase, i) => (
                  <div 
                    key={i} 
                    className={`phase-indicator ${phase.completed ? 'completed' : ''} ${i === activeBossRaid.currentPhase - 1 ? 'current' : ''}`}
                  >
                    <span>{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Participants */}
            <div className="boss-participants">
              <h4>Participantes ({activeBossRaid.participants.length}/8)</h4>
              <div className="participants-grid">
                {activeBossRaid.participants.map(p => (
                  <div key={p.playerId} className={`participant-card ${p.isAlive ? '' : 'dead'}`}>
                    <span className="p-name">{p.playerName}</span>
                    <span className="p-hp">❤️ {p.hp}/{p.maxHp}</span>
                    <div className="p-stats">
                      <span>💀 {p.kills}</span>
                      <span>⚔️ {p.damage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Combat Actions */}
            {activeBossRaid.status === 'active' && (
              <div className="combat-actions">
                <Button onClick={handleAttackBoss}>
                  ⚔️ Atacar Boss
                </Button>
                <Button onClick={() => handleUseAbility('defensive_stance')}>
                  🛡️ Postura Defensiva
                </Button>
                <Button onClick={() => handleUseAbility('heal')}>
                  💊 Curar
                </Button>
                <Button onClick={() => handleUseAbility('power_attack')}>
                  💥 Ataque Poderoso
                </Button>
              </div>
            )}

            {/* Waiting Actions */}
            {activeBossRaid.status === 'waiting' && (
              <div className="waiting-actions">
                <Button onClick={handleStartBossRaid}>
                  🚀 Iniciar Boss Raid
                </Button>
                <Button onClick={handleLeaveBossRaid} variant="danger">
                  Abandonar
                </Button>
              </div>
            )}

            {/* Rewards Preview */}
            <div className="rewards-preview">
              <h4>🎁 Recompensas Potenciales:</h4>
              <div className="rewards-grid">
                {activeBossRaid.rewards.map((reward, i) => (
                  <div key={i} className={`reward-item rarity-${reward.rarity}`}>
                    <span className="reward-name">{reward.itemName}</span>
                    <span className="reward-qty">x{reward.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Available Boss Raids */}
      <div className="available-boss-raids">
        <h2>Boss Raids Disponibles</h2>
        <div className="boss-raids-grid">
          {bossRaids.length === 0 ? (
            <Card>
              <p className="no-bosses">No hay boss raids disponibles en este momento.</p>
              <p className="hint">Los bosses aparecen cada 6-12 horas según la dificultad.</p>
            </Card>
          ) : (
            bossRaids.map(boss => (
              <Card key={boss.id} className="boss-card-preview">
                <div className="boss-preview-header">
                  <span className="boss-icon">{getBossIcon(boss.bossType)}</span>
                  <div className="boss-info">
                    <h3>{boss.bossName}</h3>
                    <span className="level">Lvl {boss.bossLevel}</span>
                  </div>
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(boss.difficulty) }}
                  >
                    {boss.difficulty}
                  </span>
                </div>

                <div className="boss-preview-stats">
                  <p><strong>HP:</strong> {boss.bossMaxHp.toLocaleString()}</p>
                  <p><strong>Fases:</strong> {boss.phases.length}</p>
                  <p><strong>Jugadores:</strong> {boss.participants.length}/8</p>
                </div>

                <div className="boss-preview-actions">
                  <Button onClick={() => {
                    setSelectedBoss(boss)
                    setShowBossInfo(true)
                  }}>
                    📖 Info
                  </Button>
                  <Button 
                    onClick={() => handleJoinBossRaid(boss.id)}
                    disabled={boss.participants.length >= 8}
                  >
                    🎯 Unirse
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Boss Info Modal */}
      {showBossInfo && selectedBoss && (
        <div className="modal-overlay" onClick={() => setShowBossInfo(false)}>
          <div className="modal-content boss-info-modal" onClick={e => e.stopPropagation()}>
            <h2>{selectedBoss.bossName}</h2>
            <div className="boss-info-content">
              <div className="info-section">
                <h3>Información General</h3>
                <p><strong>Tipo:</strong> {selectedBoss.bossType}</p>
                <p><strong>Nivel:</strong> {selectedBoss.bossLevel}</p>
                <p><strong>HP:</strong> {selectedBoss.bossMaxHp.toLocaleString()}</p>
                <p><strong>Dificultad:</strong> {selectedBoss.difficulty}</p>
              </div>

              <div className="info-section">
                <h3>Fases del Combate</h3>
                {selectedBoss.phases.map((phase, i) => (
                  <div key={i} className="phase-info">
                    <h4>Fase {phase.phase}: {phase.name}</h4>
                    <p>HP Umbral: {phase.hpThreshold}%</p>
                    <p>Habilidades:</p>
                    <ul>
                      {phase.abilities.map((ability, j) => (
                        <li key={j}>{ability}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="info-section">
                <h3>Recompensas</h3>
                <div className="rewards-list">
                  {selectedBoss.rewards.map((reward, i) => (
                    <div key={i} className={`reward rarity-${reward.rarity}`}>
                      {reward.itemName} x{reward.quantity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={() => setShowBossInfo(false)}>Cerrar</Button>
          </div>
        </div>
      )}
    </div>
  )
}


