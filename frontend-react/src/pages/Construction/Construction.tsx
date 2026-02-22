import React, { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { ws } from '../../services/websocket'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import './Construction.css'

interface Building {
  id: string
  type: string
  name: string
  level: number
  maxLevel: number
  hp: number
  maxHp: number
  status: 'active' | 'damaged' | 'under_construction' | 'destroyed'
  benefits: {
    [key: string]: number
  }
  upgradeCost: {
    wood?: number
    stone?: number
    metal?: number
    caps?: number
  }
}

interface ConstructionProject {
  id: string
  buildingType: string
  buildingName: string
  requiredResources: {
    wood?: number
    stone?: number
    metal?: number
  }
  contributedResources: {
    wood?: number
    stone?: number
    metal?: number
  }
  contributors: Array<{
    playerId: string
    playerName: string
    contribution: number
  }>
  progress: number
  estimatedTime: number
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled'
}

interface Blueprint {
  id: string
  name: string
  type: string
  description: string
  category: 'defense' | 'resource' | 'social' | 'utility'
  requirements: {
    wood?: number
    stone?: number
    metal?: number
    level?: number
  }
  benefits: string[]
  buildTime: number
  unlocked: boolean
}

export const Construction: React.FC = () => {
  const player = usePlayerStore((state) => state.player)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [projects, setProjects] = useState<ConstructionProject[]>([])
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [activeTab, setActiveTab] = useState<'buildings' | 'projects' | 'blueprints'>('buildings')
  const [showBuildModal, setShowBuildModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
  const [selectedProject, setSelectedProject] = useState<ConstructionProject | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [contributionAmounts, setContributionAmounts] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    ws.send('construction:get_buildings')
    ws.send('construction:get_projects')
    ws.send('construction:get_blueprints')

    const interval = setInterval(() => {
      ws.send('construction:get_projects')
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleStartProject = () => {
    if (selectedBlueprint) {
      ws.send('construction:start_project', {
        blueprintId: selectedBlueprint.id
      })
      setShowBuildModal(false)
      setSelectedBlueprint(null)
    }
  }

  const handleContribute = () => {
    if (selectedProject) {
      const contributions: { [key: string]: number } = {}
      Object.entries(contributionAmounts).forEach(([resource, amount]) => {
        if (amount) {
          contributions[resource] = parseInt(amount)
        }
      })

      ws.send('construction:contribute', {
        projectId: selectedProject.id,
        resources: contributions
      })

      setShowContributeModal(false)
      setContributionAmounts({})
      setSelectedProject(null)
    }
  }

  const handleUpgradeBuilding = (buildingId: string) => {
    ws.send('construction:upgrade_building', { buildingId })
  }

  const handleRepairBuilding = (buildingId: string) => {
    ws.send('construction:repair_building', { buildingId })
  }

  const handleCancelProject = (projectId: string) => {
    if (window.confirm('¿Seguro que quieres cancelar este proyecto? Se devolverán los recursos.')) {
      ws.send('construction:cancel_project', { projectId })
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'defense': return '🛡️'
      case 'resource': return '⚒️'
      case 'social': return '👥'
      case 'utility': return '🔧'
      default: return '🏗️'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'damaged': return '#f59e0b'
      case 'under_construction': return '#3b82f6'
      case 'destroyed': return '#ef4444'
      default: return '#9ca3af'
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="construction-page">
      {/* Header */}
      <div className="construction-header">
        <h1>🏗️ Centro de Construcción</h1>
        <div className="player-resources">
          <span className="resource">🪵 {player?.resources?.wood || 0}</span>
          <span className="resource">🪨 {player?.resources?.stone || 0}</span>
          <span className="resource">⚙️ {player?.resources?.metal || 0}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="construction-tabs">
        <button 
          className={activeTab === 'buildings' ? 'active' : ''}
          onClick={() => setActiveTab('buildings')}
        >
          🏛️ Edificios
        </button>
        <button 
          className={activeTab === 'projects' ? 'active' : ''}
          onClick={() => setActiveTab('projects')}
        >
          🔨 Proyectos
        </button>
        <button 
          className={activeTab === 'blueprints' ? 'active' : ''}
          onClick={() => setActiveTab('blueprints')}
        >
          📐 Planos
        </button>
      </div>

      {/* Content */}
      <div className="construction-content">
        {/* Buildings Tab */}
        {activeTab === 'buildings' && (
          <div className="buildings-section">
            <div className="section-header">
              <h2>Edificios de la Colonia</h2>
              <p className="subtitle">{buildings.length} estructuras construidas</p>
            </div>

            {buildings.length === 0 ? (
              <Card>
                <p className="no-data">No hay edificios construidos todavía. Ve a Planos para comenzar.</p>
              </Card>
            ) : (
              <div className="buildings-grid">
                {buildings.map(building => (
                  <Card key={building.id} className="building-card">
                    <div className="building-header">
                      <h3>{building.name}</h3>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(building.status) }}
                      >
                        {building.status}
                      </span>
                    </div>

                    <div className="building-level">
                      Nivel {building.level}/{building.maxLevel}
                    </div>

                    {/* HP Bar */}
                    <div className="building-hp">
                      <ProgressBar
                        current={building.hp}
                        max={building.maxHp}
                        label="Integridad"
                        color={building.hp / building.maxHp > 0.5 ? '#10b981' : '#f59e0b'}
                      />
                    </div>

                    {/* Benefits */}
                    <div className="benefits-section">
                      <strong>Beneficios:</strong>
                      <ul className="benefits-list">
                        {Object.entries(building.benefits).map(([key, value]) => (
                          <li key={key}>
                            {key}: +{value}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="building-actions">
                      {building.status === 'damaged' && (
                        <Button 
                          onClick={() => handleRepairBuilding(building.id)}
                          variant="warning"
                        >
                          🔧 Reparar
                        </Button>
                      )}
                      {building.level < building.maxLevel && building.status === 'active' && (
                        <Button 
                          onClick={() => {
                            setSelectedBuilding(building)
                          }}
                        >
                          ⬆️ Mejorar
                        </Button>
                      )}
                    </div>

                    {/* Upgrade Cost */}
                    {selectedBuilding?.id === building.id && (
                      <div className="upgrade-cost">
                        <strong>Costo de Mejora:</strong>
                        <div className="cost-list">
                          {Object.entries(building.upgradeCost).map(([resource, amount]) => (
                            <span key={resource} className="cost-item">
                              {resource === 'wood' && '🪵'}
                              {resource === 'stone' && '🪨'}
                              {resource === 'metal' && '⚙️'}
                              {resource === 'caps' && '💰'}
                              {amount}
                            </span>
                          ))}
                        </div>
                        <Button onClick={() => handleUpgradeBuilding(building.id)}>
                          Confirmar Mejora
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="projects-section">
            <div className="section-header">
              <h2>Proyectos en Progreso</h2>
              <p className="subtitle">{projects.length} proyectos activos</p>
            </div>

            {projects.length === 0 ? (
              <Card>
                <p className="no-data">No hay proyectos activos. Ve a Planos para iniciar uno.</p>
              </Card>
            ) : (
              <div className="projects-grid">
                {projects.map(project => (
                  <Card key={project.id} className="project-card">
                    <div className="project-header">
                      <h3>{project.buildingName}</h3>
                      <span className={`project-status ${project.status}`}>
                        {project.status}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="project-progress">
                      <ProgressBar
                        current={project.progress}
                        max={100}
                        label="Progreso"
                        color="#3b82f6"
                      />
                    </div>

                    {/* Resources */}
                    <div className="project-resources">
                      <strong>Recursos:</strong>
                      {Object.entries(project.requiredResources).map(([resource, required]) => {
                        const contributed = project.contributedResources[resource as keyof typeof project.contributedResources] || 0
                        return (
                          <div key={resource} className="resource-progress">
                            <span className="resource-label">
                              {resource === 'wood' && '🪵'}
                              {resource === 'stone' && '🪨'}
                              {resource === 'metal' && '⚙️'}
                              {resource.charAt(0).toUpperCase() + resource.slice(1)}
                            </span>
                            <ProgressBar
                              current={contributed}
                              max={required}
                              label=""
                              color="#22c55e"
                            />
                            <span className="resource-count">
                              {contributed}/{required}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Contributors */}
                    <div className="contributors-section">
                      <strong>Contribuyentes ({project.contributors.length}):</strong>
                      <div className="contributors-list">
                        {project.contributors.slice(0, 5).map(contributor => (
                          <div key={contributor.playerId} className="contributor">
                            <span className="contributor-name">{contributor.playerName}</span>
                            <span className="contributor-amount">+{contributor.contribution}</span>
                          </div>
                        ))}
                        {project.contributors.length > 5 && (
                          <span className="more-contributors">
                            +{project.contributors.length - 5} más
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    {project.estimatedTime > 0 && (
                      <div className="estimated-time">
                        ⏱️ Tiempo estimado: {formatTime(project.estimatedTime)}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="project-actions">
                      <Button 
                        onClick={() => {
                          setSelectedProject(project)
                          setShowContributeModal(true)
                        }}
                      >
                        ➕ Contribuir
                      </Button>
                      {project.status === 'planning' && (
                        <Button 
                          onClick={() => handleCancelProject(project.id)}
                          variant="danger"
                        >
                          ❌ Cancelar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Blueprints Tab */}
        {activeTab === 'blueprints' && (
          <div className="blueprints-section">
            <div className="section-header">
              <h2>Planos Disponibles</h2>
              <p className="subtitle">Selecciona un plano para comenzar la construcción</p>
            </div>

            <div className="blueprints-grid">
              {blueprints.map(blueprint => (
                <Card 
                  key={blueprint.id} 
                  className={`blueprint-card ${!blueprint.unlocked ? 'locked' : ''}`}
                >
                  <div className="blueprint-header">
                    <span className="category-icon">
                      {getCategoryIcon(blueprint.category)}
                    </span>
                    <h3>{blueprint.name}</h3>
                  </div>

                  <p className="blueprint-description">{blueprint.description}</p>

                  {/* Benefits */}
                  <div className="blueprint-benefits">
                    <strong>Beneficios:</strong>
                    <ul>
                      {blueprint.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Requirements */}
                  <div className="blueprint-requirements">
                    <strong>Requerimientos:</strong>
                    <div className="requirements-list">
                      {blueprint.requirements.wood && (
                        <span className="requirement">
                          🪵 {blueprint.requirements.wood}
                        </span>
                      )}
                      {blueprint.requirements.stone && (
                        <span className="requirement">
                          🪨 {blueprint.requirements.stone}
                        </span>
                      )}
                      {blueprint.requirements.metal && (
                        <span className="requirement">
                          ⚙️ {blueprint.requirements.metal}
                        </span>
                      )}
                      {blueprint.requirements.level && (
                        <span className="requirement">
                          📊 Nivel {blueprint.requirements.level}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Build Time */}
                  <div className="build-time">
                    ⏱️ Tiempo: {formatTime(blueprint.buildTime)}
                  </div>

                  {/* Action */}
                  {blueprint.unlocked ? (
                    <Button 
                      onClick={() => {
                        setSelectedBlueprint(blueprint)
                        setShowBuildModal(true)
                      }}
                    >
                      🔨 Iniciar Construcción
                    </Button>
                  ) : (
                    <div className="locked-info">
                      🔒 Bloqueado - Requisitos no cumplidos
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Build Modal */}
      {showBuildModal && selectedBlueprint && (
        <div className="modal-overlay" onClick={() => setShowBuildModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Iniciar Construcción</h2>
            
            <div className="modal-blueprint-info">
              <h3>{selectedBlueprint.name}</h3>
              <p>{selectedBlueprint.description}</p>

              <div className="modal-requirements">
                <strong>Recursos Necesarios:</strong>
                <div className="requirements-grid">
                  {Object.entries(selectedBlueprint.requirements).map(([resource, amount]) => (
                    resource !== 'level' && (
                      <div key={resource} className="requirement-item">
                        <span className="req-icon">
                          {resource === 'wood' && '🪵'}
                          {resource === 'stone' && '🪨'}
                          {resource === 'metal' && '⚙️'}
                        </span>
                        <span className="req-amount">{amount}</span>
                        <span className="req-label">{resource}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="modal-info">
                <p>⏱️ Tiempo estimado: {formatTime(selectedBlueprint.buildTime)}</p>
                <p>👥 Otros jugadores podrán contribuir con recursos</p>
              </div>
            </div>

            <div className="form-actions">
              <Button onClick={handleStartProject}>
                🔨 Comenzar Proyecto
              </Button>
              <Button onClick={() => setShowBuildModal(false)} variant="danger">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowContributeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Contribuir al Proyecto</h2>
            
            <div className="contribute-info">
              <h3>{selectedProject.buildingName}</h3>
              <div className="overall-progress">
                <ProgressBar
                  current={selectedProject.progress}
                  max={100}
                  label="Progreso Total"
                  color="#3b82f6"
                />
              </div>
            </div>

            <div className="contribute-form">
              {Object.entries(selectedProject.requiredResources).map(([resource, required]) => {
                const contributed = selectedProject.contributedResources[resource as keyof typeof selectedProject.contributedResources] || 0
                const remaining = required - contributed
                const playerHas = player?.resources?.[resource as keyof typeof player.resources] || 0

                return remaining > 0 && (
                  <div key={resource} className="contribute-resource">
                    <label>
                      {resource === 'wood' && '🪵'}
                      {resource === 'stone' && '🪨'}
                      {resource === 'metal' && '⚙️'}
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </label>
                    <div className="resource-status">
                      <span>Necesario: {remaining}</span>
                      <span>Tienes: {playerHas}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={Math.min(remaining, playerHas)}
                      value={contributionAmounts[resource] || ''}
                      onChange={e => setContributionAmounts(prev => ({
                        ...prev,
                        [resource]: e.target.value
                      }))}
                      placeholder="0"
                    />
                  </div>
                )
              })}
            </div>

            <div className="form-actions">
              <Button onClick={handleContribute}>
                ✅ Contribuir
              </Button>
              <Button onClick={() => setShowContributeModal(false)} variant="danger">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


