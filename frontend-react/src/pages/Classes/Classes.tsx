import React, { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { ws } from '../../services/websocket'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import './Classes.css'

interface PlayerClass {
  id: string
  name: string
  description: string
  icon: string
  stats: {
    health: number
    damage: number
    defense: number
    special: string
  }
  abilities: string[]
  unlocked: boolean
  selected: boolean
}

interface Ability {
  id: string
  name: string
  description: string
  icon: string
  type: 'active' | 'passive'
  classRequired: string
  level: number
  maxLevel: number
  cooldown?: number
  currentCooldown?: number
  damage?: number
  healing?: number
  duration?: number
  cost: {
    skillPoints: number
    caps?: number
  }
  requirements: {
    level?: number
    previousAbility?: string
  }
  unlocked: boolean
}

export const Classes: React.FC = () => {
  const player = usePlayerStore((state) => state.player)
  const [classes, setClasses] = useState<PlayerClass[]>([])
  const [abilities, setAbilities] = useState<Ability[]>([])
  const [activeTab, setActiveTab] = useState<'classes' | 'abilities' | 'skills'>('classes')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [skillPoints, setSkillPoints] = useState(0)
  const [showClassModal, setShowClassModal] = useState(false)
  const [showAbilityModal, setShowAbilityModal] = useState(false)
  const [modalClass, setModalClass] = useState<PlayerClass | null>(null)
  const [modalAbility, setModalAbility] = useState<Ability | null>(null)

  useEffect(() => {
    ws.send('classes:get_all')
    ws.send('abilities:get_all')
    ws.send('player:get_skill_points')

    const interval = setInterval(() => {
      ws.send('abilities:get_cooldowns')
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleSelectClass = (classId: string) => {
    if (window.confirm('¿Estás seguro? Solo puedes cambiar de clase una vez por semana.')) {
      ws.send('classes:select', { classId })
      setShowClassModal(false)
      setModalClass(null)
    }
  }

  const handleUnlockAbility = (abilityId: string) => {
    ws.send('abilities:unlock', { abilityId })
    setShowAbilityModal(false)
    setModalAbility(null)
  }

  const handleUpgradeAbility = (abilityId: string) => {
    ws.send('abilities:upgrade', { abilityId })
  }

  const handleUseAbility = (abilityId: string) => {
    ws.send('abilities:use', { abilityId })
  }

  const getClassIcon = (className: string) => {
    switch (className.toLowerCase()) {
      case 'soldier': return '⚔️'
      case 'medic': return '⚕️'
      case 'scout': return '🏹'
      case 'engineer': return '🔧'
      case 'leader': return '👑'
      default: return '🎯'
    }
  }

  const getAbilityTypeColor = (type: string) => {
    return type === 'active' ? '#3b82f6' : '#10b981'
  }

  const formatCooldown = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="classes-page">
      {/* Header */}
      <div className="classes-header">
        <div className="header-left">
          <h1>🎯 Clases & Habilidades</h1>
          {selectedClass && (
            <div className="current-class">
              Clase Actual: <span className="class-badge">{selectedClass}</span>
            </div>
          )}
        </div>
        <div className="header-right">
          <div className="skill-points">
            ⭐ <strong>{skillPoints}</strong> Puntos de Habilidad
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="classes-tabs">
        <button 
          className={activeTab === 'classes' ? 'active' : ''}
          onClick={() => setActiveTab('classes')}
        >
          👤 Clases
        </button>
        <button 
          className={activeTab === 'abilities' ? 'active' : ''}
          onClick={() => setActiveTab('abilities')}
        >
          ✨ Habilidades Activas
        </button>
        <button 
          className={activeTab === 'skills' ? 'active' : ''}
          onClick={() => setActiveTab('skills')}
        >
          📊 Árbol de Habilidades
        </button>
      </div>

      {/* Content */}
      <div className="classes-content">
        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="classes-section">
            <div className="section-header">
              <h2>Elige tu Clase</h2>
              <p className="subtitle">Cada clase tiene habilidades y estadísticas únicas</p>
            </div>

            <div className="classes-grid">
              {classes.map(cls => (
                <Card 
                  key={cls.id} 
                  className={`class-card ${cls.selected ? 'selected' : ''} ${!cls.unlocked ? 'locked' : ''}`}
                >
                  <div className="class-icon">{getClassIcon(cls.name)}</div>
                  <h3>{cls.name}</h3>
                  <p className="class-description">{cls.description}</p>

                  {/* Stats */}
                  <div className="class-stats">
                    <div className="stat">
                      <span className="stat-label">❤️ Salud</span>
                      <span className="stat-value">{cls.stats.health}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">⚔️ Daño</span>
                      <span className="stat-value">{cls.stats.damage}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">🛡️ Defensa</span>
                      <span className="stat-value">{cls.stats.defense}</span>
                    </div>
                  </div>

                  {/* Special */}
                  <div className="class-special">
                    <strong>Especial:</strong> {cls.stats.special}
                  </div>

                  {/* Abilities Preview */}
                  <div className="abilities-preview">
                    <strong>Habilidades:</strong>
                    <div className="abilities-icons">
                      {cls.abilities.slice(0, 4).map((abilityId, index) => (
                        <span key={index} className="ability-icon-small">
                          {index === 0 && '⚡'}
                          {index === 1 && '🔥'}
                          {index === 2 && '💫'}
                          {index === 3 && '✨'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {cls.unlocked ? (
                    cls.selected ? (
                      <div className="selected-badge">✓ Clase Seleccionada</div>
                    ) : (
                      <Button onClick={() => {
                        setModalClass(cls)
                        setShowClassModal(true)
                      }}>
                        Seleccionar Clase
                      </Button>
                    )
                  ) : (
                    <div className="locked-info">
                      🔒 Bloqueado - Alcanza nivel {cls.name === 'Leader' ? '20' : '10'}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Abilities Tab */}
        {activeTab === 'abilities' && (
          <div className="abilities-section">
            <div className="section-header">
              <h2>Habilidades Activas</h2>
              <p className="subtitle">Tus habilidades desbloqueadas y disponibles</p>
            </div>

            {abilities.filter(a => a.unlocked).length === 0 ? (
              <Card>
                <p className="no-data">No tienes habilidades desbloqueadas. Ve al Árbol de Habilidades.</p>
              </Card>
            ) : (
              <div className="abilities-grid">
                {abilities
                  .filter(a => a.unlocked)
                  .map(ability => (
                    <Card key={ability.id} className="ability-card">
                      <div className="ability-header">
                        <div className="ability-icon">{ability.icon}</div>
                        <div className="ability-info">
                          <h3>{ability.name}</h3>
                          <span 
                            className="ability-type"
                            style={{ color: getAbilityTypeColor(ability.type) }}
                          >
                            {ability.type === 'active' ? 'ACTIVA' : 'PASIVA'}
                          </span>
                        </div>
                      </div>

                      <p className="ability-description">{ability.description}</p>

                      {/* Level */}
                      <div className="ability-level">
                        <span>Nivel {ability.level}/{ability.maxLevel}</span>
                        <ProgressBar
                          current={ability.level}
                          max={ability.maxLevel}
                          label=""
                          color="#fbbf24"
                        />
                      </div>

                      {/* Stats */}
                      <div className="ability-stats">
                        {ability.damage && (
                          <div className="ability-stat">
                            <span className="label">Daño:</span>
                            <span className="value">{ability.damage}</span>
                          </div>
                        )}
                        {ability.healing && (
                          <div className="ability-stat">
                            <span className="label">Curación:</span>
                            <span className="value">{ability.healing}</span>
                          </div>
                        )}
                        {ability.duration && (
                          <div className="ability-stat">
                            <span className="label">Duración:</span>
                            <span className="value">{ability.duration}s</span>
                          </div>
                        )}
                        {ability.cooldown && (
                          <div className="ability-stat">
                            <span className="label">Cooldown:</span>
                            <span className="value">{formatCooldown(ability.cooldown)}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="ability-actions">
                        {ability.type === 'active' && (
                          <Button 
                            onClick={() => handleUseAbility(ability.id)}
                            disabled={ability.currentCooldown ? ability.currentCooldown > 0 : false}
                          >
                            {ability.currentCooldown && ability.currentCooldown > 0 
                              ? `⏱️ ${formatCooldown(ability.currentCooldown)}`
                              : '🔥 Usar'
                            }
                          </Button>
                        )}
                        {ability.level < ability.maxLevel && (
                          <Button 
                            onClick={() => handleUpgradeAbility(ability.id)}
                            disabled={skillPoints < ability.cost.skillPoints}
                          >
                            ⬆️ Mejorar ({ability.cost.skillPoints} pts)
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Skills Tree Tab */}
        {activeTab === 'skills' && (
          <div className="skills-tree-section">
            <div className="section-header">
              <h2>Árbol de Habilidades</h2>
              <p className="subtitle">Desbloquea y mejora tus habilidades</p>
            </div>

            {!selectedClass ? (
              <Card>
                <p className="no-data">Selecciona una clase primero para ver el árbol de habilidades.</p>
              </Card>
            ) : (
              <div className="skills-tree">
                {abilities
                  .filter(a => a.classRequired === selectedClass)
                  .map((ability, index) => (
                    <Card 
                      key={ability.id} 
                      className={`skill-node ${ability.unlocked ? 'unlocked' : ''}`}
                      style={{ 
                        gridRow: Math.floor(index / 3) + 1,
                        gridColumn: (index % 3) + 1
                      }}
                    >
                      <div className="skill-node-icon">{ability.icon}</div>
                      <h4>{ability.name}</h4>
                      <p className="skill-node-description">{ability.description}</p>

                      <div className="skill-node-level">
                        {ability.unlocked ? (
                          <span className="level-badge">{ability.level}/{ability.maxLevel}</span>
                        ) : (
                          <span className="locked-badge">🔒</span>
                        )}
                      </div>

                      <div className="skill-node-cost">
                        <span>⭐ {ability.cost.skillPoints} pts</span>
                        {ability.cost.caps && <span>💰 {ability.cost.caps} caps</span>}
                      </div>

                      {/* Requirements */}
                      {ability.requirements.level && (
                        <div className="skill-requirement">
                          Requiere nivel {ability.requirements.level}
                        </div>
                      )}

                      {/* Actions */}
                      {!ability.unlocked ? (
                        <Button 
                          onClick={() => {
                            setModalAbility(ability)
                            setShowAbilityModal(true)
                          }}
                          disabled={
                            skillPoints < ability.cost.skillPoints || 
                            (ability.requirements.level && (player?.level || 0) < ability.requirements.level)
                          }
                        >
                          Desbloquear
                        </Button>
                      ) : ability.level < ability.maxLevel ? (
                        <Button onClick={() => handleUpgradeAbility(ability.id)}>
                          Mejorar
                        </Button>
                      ) : (
                        <div className="maxed-badge">✓ Maximizada</div>
                      )}
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Class Selection Modal */}
      {showClassModal && modalClass && (
        <div className="modal-overlay" onClick={() => setShowClassModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Seleccionar: {modalClass.name}</h2>
            
            <div className="modal-class-info">
              <div className="modal-icon">{getClassIcon(modalClass.name)}</div>
              <p>{modalClass.description}</p>

              <div className="modal-stats">
                <div className="stat-row">
                  <span>❤️ Salud:</span>
                  <strong>{modalClass.stats.health}</strong>
                </div>
                <div className="stat-row">
                  <span>⚔️ Daño:</span>
                  <strong>{modalClass.stats.damage}</strong>
                </div>
                <div className="stat-row">
                  <span>🛡️ Defensa:</span>
                  <strong>{modalClass.stats.defense}</strong>
                </div>
                <div className="stat-row full">
                  <span>✨ Especial:</span>
                  <strong>{modalClass.stats.special}</strong>
                </div>
              </div>

              <div className="modal-warning">
                ⚠️ Solo puedes cambiar de clase una vez por semana
              </div>
            </div>

            <div className="form-actions">
              <Button onClick={() => handleSelectClass(modalClass.id)}>
                Confirmar Selección
              </Button>
              <Button onClick={() => setShowClassModal(false)} variant="danger">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ability Unlock Modal */}
      {showAbilityModal && modalAbility && (
        <div className="modal-overlay" onClick={() => setShowAbilityModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Desbloquear: {modalAbility.name}</h2>
            
            <div className="modal-ability-info">
              <div className="modal-icon">{modalAbility.icon}</div>
              <p>{modalAbility.description}</p>

              <div className="modal-ability-details">
                <div className="detail-row">
                  <span>Tipo:</span>
                  <strong style={{ color: getAbilityTypeColor(modalAbility.type) }}>
                    {modalAbility.type === 'active' ? 'Activa' : 'Pasiva'}
                  </strong>
                </div>
                {modalAbility.damage && (
                  <div className="detail-row">
                    <span>Daño:</span>
                    <strong>{modalAbility.damage}</strong>
                  </div>
                )}
                {modalAbility.healing && (
                  <div className="detail-row">
                    <span>Curación:</span>
                    <strong>{modalAbility.healing}</strong>
                  </div>
                )}
                {modalAbility.cooldown && (
                  <div className="detail-row">
                    <span>Cooldown:</span>
                    <strong>{formatCooldown(modalAbility.cooldown)}</strong>
                  </div>
                )}
              </div>

              <div className="modal-cost">
                <strong>Costo:</strong>
                <div className="cost-items">
                  <span>⭐ {modalAbility.cost.skillPoints} Puntos</span>
                  {modalAbility.cost.caps && <span>💰 {modalAbility.cost.caps} caps</span>}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <Button onClick={() => handleUnlockAbility(modalAbility.id)}>
                Desbloquear Habilidad
              </Button>
              <Button onClick={() => setShowAbilityModal(false)} variant="danger">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


