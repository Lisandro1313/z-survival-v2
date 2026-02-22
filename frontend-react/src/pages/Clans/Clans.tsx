import React, { useState, useEffect } from 'react'
import { useClanStore } from '../../store/clanStore'
import { usePlayerStore } from '../../store/playerStore'
import { ws } from '../../services/websocket'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import './Clans.css'

export const Clans: React.FC = () => {
  const { myClan, availableClans, clanInvitations, clanApplications } = useClanStore()
  const player = usePlayerStore((state) => state.player)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMembersTab, setShowMembersTab] = useState(true)
  const [clanName, setClanName] = useState('')
  const [clanTag, setClanTag] = useState('')
  const [clanDescription, setClanDescription] = useState('')
  const [selectedClan, setSelectedClan] = useState<any>(null)

  useEffect(() => {
    if (myClan) {
      ws.send('clan:get_info', { clanId: myClan.id })
    } else {
      ws.send('clan:get_available')
    }
    ws.send('clan:get_invitations')
  }, [myClan])

  const handleCreateClan = () => {
    if (clanName.trim() && clanTag.trim()) {
      ws.send('clan:create', {
        name: clanName.trim(),
        tag: clanTag.trim(),
        description: clanDescription.trim()
      })
      setShowCreateModal(false)
      setClanName('')
      setClanTag('')
      setClanDescription('')
    }
  }

  const handleJoinClan = (clanId: string) => {
    ws.send('clan:request_join', { clanId })
  }

  const handleLeaveClan = () => {
    if (myClan && window.confirm('¿Seguro que quieres abandonar el clan?')) {
      ws.send('clan:leave', { clanId: myClan.id })
    }
  }

  const handleInvitePlayer = (playerName: string) => {
    if (myClan) {
      ws.send('clan:invite', {
        clanId: myClan.id,
        playerName
      })
    }
  }

  const handleKickMember = (memberId: string) => {
    if (myClan && window.confirm('¿Seguro que quieres expulsar a este miembro?')) {
      ws.send('clan:kick', {
        clanId: myClan.id,
        memberId
      })
    }
  }

  const handlePromoteMember = (memberId: string) => {
    if (myClan) {
      ws.send('clan:promote', {
        clanId: myClan.id,
        memberId
      })
    }
  }

  const handleAcceptInvitation = (clanId: string) => {
    ws.send('clan:accept_invitation', { clanId })
  }

  const handleDeclineInvitation = (clanId: string) => {
    ws.send('clan:decline_invitation', { clanId })
  }

  const handleApproveApplication = (playerId: string) => {
    if (myClan) {
      ws.send('clan:approve_application', {
        clanId: myClan.id,
        playerId
      })
    }
  }

  const handleRejectApplication = (playerId: string) => {
    if (myClan) {
      ws.send('clan:reject_application', {
        clanId: myClan.id,
        playerId
      })
    }
  }

  const getRankIcon = (rank: string) => {
    const icons: Record<string, string> = {
      leader: '👑',
      officer: '⭐',
      veteran: '🎖️',
      member: '🛡️',
      recruit: '🔰'
    }
    return icons[rank] || '🔰'
  }

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      leader: '#fbbf24',
      officer: '#a855f7',
      veteran: '#3b82f6',
      member: '#10b981',
      recruit: '#6b7280'
    }
    return colors[rank] || '#6b7280'
  }

  return (
    <div className="clans-page">
      {/* Header */}
      <div className="clans-header">
        <h1>🛡️ Clanes</h1>
        {!myClan && (
          <Button onClick={() => setShowCreateModal(true)}>
            ➕ Crear Clan
          </Button>
        )}
      </div>

      {/* Invitations Banner */}
      {clanInvitations.length > 0 && (
        <div className="invitations-banner">
          <h3>📬 Tienes {clanInvitations.length} invitación(es) de clan</h3>
          <div className="invitations-list">
            {clanInvitations.map(inv => (
              <Card key={inv.clanId} className="invitation-card">
                <div className="invitation-info">
                  <span className="clan-tag">[{inv.clanTag}]</span>
                  <span className="clan-name">{inv.clanName}</span>
                  <span className="inviter">de {inv.inviterName}</span>
                </div>
                <div className="invitation-actions">
                  <Button onClick={() => handleAcceptInvitation(inv.clanId)}>
                    Aceptar
                  </Button>
                  <Button onClick={() => handleDeclineInvitation(inv.clanId)} variant="danger">
                    Rechazar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* My Clan Section */}
      {myClan ? (
        <div className="my-clan-section">
          <Card className="clan-card-main">
            {/* Clan Header */}
            <div className="clan-header">
              <div className="clan-emblem">🛡️</div>
              <div className="clan-info">
                <h2>
                  <span className="clan-tag">[{myClan.tag}]</span>
                  {myClan.name}
                </h2>
                <p className="clan-description">{myClan.description}</p>
                <div className="clan-stats-row">
                  <span>👥 {myClan.memberCount}/{myClan.maxMembers} miembros</span>
                  <span>⭐ Nivel {myClan.level}</span>
                  <span>🏆 {myClan.points} puntos</span>
                </div>
              </div>
            </div>

            {/* Clan Level Progress */}
            <div className="clan-level-section">
              <ProgressBar
                current={myClan.experience || 0}
                max={myClan.experienceToNextLevel || 1000}
                label="Experiencia de Clan"
                color="#a855f7"
              />
            </div>

            {/* Tabs */}
            <div className="clan-tabs">
              <button 
                className={showMembersTab ? 'active' : ''}
                onClick={() => setShowMembersTab(true)}
              >
                👥 Miembros
              </button>
              <button 
                className={!showMembersTab ? 'active' : ''}
                onClick={() => setShowMembersTab(false)}
              >
                📋 Solicitudes ({clanApplications.length})
              </button>
            </div>

            {/* Members Tab */}
            {showMembersTab ? (
              <div className="members-section">
                <div className="members-list">
                  {myClan.members.map(member => (
                    <div key={member.playerId} className="member-card">
                      <div className="member-info">
                        <span 
                          className="member-rank"
                          style={{ color: getRankColor(member.rank) }}
                        >
                          {getRankIcon(member.rank)}
                        </span>
                        <div className="member-details">
                          <span className="member-name">{member.playerName}</span>
                          <span className="member-rank-text">{member.rank}</span>
                        </div>
                      </div>
                      <div className="member-stats">
                        <span>Lvl {member.level}</span>
                        <span className={member.isOnline ? 'online' : 'offline'}>
                          {member.isOnline ? '🟢 Online' : '⚫ Offline'}
                        </span>
                      </div>
                      <div className="member-contribution">
                        <small>Contribución: {member.contribution || 0}</small>
                      </div>
                      {(myClan.myRank === 'leader' || myClan.myRank === 'officer') && member.playerId !== player?.id && (
                        <div className="member-actions">
                          {myClan.myRank === 'leader' && member.rank !== 'leader' && (
                            <Button 
                              size="small"
                              onClick={() => handlePromoteMember(member.playerId)}
                            >
                              ⬆️ Promover
                            </Button>
                          )}
                          <Button 
                            size="small"
                            variant="danger"
                            onClick={() => handleKickMember(member.playerId)}
                          >
                            ❌ Expulsar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Invite Player */}
                {(myClan.myRank === 'leader' || myClan.myRank === 'officer') && (
                  <div className="invite-section">
                    <h4>Invitar Jugador</h4>
                    <div className="invite-form">
                      <input
                        type="text"
                        placeholder="Nombre del jugador"
                        id="invite-player-input"
                      />
                      <Button onClick={() => {
                        const input = document.getElementById('invite-player-input') as HTMLInputElement
                        if (input.value.trim()) {
                          handleInvitePlayer(input.value.trim())
                          input.value = ''
                        }
                      }}>
                        📨 Enviar Invitación
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Applications Tab */
              <div className="applications-section">
                {clanApplications.length === 0 ? (
                  <p className="no-applications">No hay solicitudes pendientes.</p>
                ) : (
                  <div className="applications-list">
                    {clanApplications.map(app => (
                      <Card key={app.playerId} className="application-card">
                        <div className="application-info">
                          <span className="applicant-name">{app.playerName}</span>
                          <span className="applicant-level">Nivel {app.level}</span>
                        </div>
                        {(myClan.myRank === 'leader' || myClan.myRank === 'officer') && (
                          <div className="application-actions">
                            <Button onClick={() => handleApproveApplication(app.playerId)}>
                              ✅ Aprobar
                            </Button>
                            <Button 
                              onClick={() => handleRejectApplication(app.playerId)}
                              variant="danger"
                            >
                              ❌ Rechazar
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Leave Clan Button */}
            <div className="clan-footer">
              <Button onClick={handleLeaveClan} variant="danger">
                🚪 Abandonar Clan
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        /* Available Clans */
        <div className="available-clans-section">
          <h2>Clanes Disponibles</h2>
          <div className="clans-grid">
            {availableClans.length === 0 ? (
              <Card>
                <p className="no-clans">No hay clanes disponibles. ¡Crea el tuyo!</p>
              </Card>
            ) : (
              availableClans.map(clan => (
                <Card key={clan.id} className="clan-card-preview">
                  <div className="clan-preview-header">
                    <div className="clan-emblem-small">🛡️</div>
                    <div className="clan-preview-info">
                      <h3>
                        <span className="clan-tag">[{clan.tag}]</span>
                        {clan.name}
                      </h3>
                      <p className="clan-preview-description">{clan.description}</p>
                    </div>
                  </div>

                  <div className="clan-preview-stats">
                    <div className="stat">
                      <span className="label">Miembros:</span>
                      <span className="value">{clan.memberCount}/{clan.maxMembers}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Nivel:</span>
                      <span className="value">{clan.level}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Puntos:</span>
                      <span className="value">{clan.points}</span>
                    </div>
                  </div>

                  <div className="clan-preview-actions">
                    <Button onClick={() => setSelectedClan(clan)}>
                      📖 Ver Info
                    </Button>
                    <Button 
                      onClick={() => handleJoinClan(clan.id)}
                      disabled={clan.memberCount >= clan.maxMembers}
                    >
                      Solicitar Unirse
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Clan Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Crear Nuevo Clan</h2>
            <div className="create-clan-form">
              <div className="form-group">
                <label>Nombre del Clan:</label>
                <input
                  type="text"
                  value={clanName}
                  onChange={e => setClanName(e.target.value)}
                  placeholder="Los Supervivientes"
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label>Tag (3-5 caracteres):</label>
                <input
                  type="text"
                  value={clanTag}
                  onChange={e => setClanTag(e.target.value.toUpperCase())}
                  placeholder="SURV"
                  maxLength={5}
                />
              </div>

              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={clanDescription}
                  onChange={e => setClanDescription(e.target.value)}
                  placeholder="Un clan dedicado a sobrevivir y prosperar juntos..."
                  maxLength={200}
                  rows={4}
                />
              </div>

              <div className="form-info">
                <p>💰 Costo: 500 caps</p>
                <p>👥 Capacidad inicial: 10 miembros</p>
              </div>

              <div className="form-actions">
                <Button 
                  onClick={handleCreateClan}
                  disabled={!clanName.trim() || !clanTag.trim() || clanTag.length < 3}
                >
                  Crear Clan
                </Button>
                <Button onClick={() => setShowCreateModal(false)} variant="danger">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clan Info Modal */}
      {selectedClan && (
        <div className="modal-overlay" onClick={() => setSelectedClan(null)}>
          <div className="modal-content clan-info-modal" onClick={e => e.stopPropagation()}>
            <h2>
              <span className="clan-tag">[{selectedClan.tag}]</span>
              {selectedClan.name}
            </h2>
            <p className="clan-description-full">{selectedClan.description}</p>

            <div className="clan-full-stats">
              <div className="stat-box">
                <span className="stat-label">Miembros</span>
                <span className="stat-value">{selectedClan.memberCount}/{selectedClan.maxMembers}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Nivel</span>
                <span className="stat-value">{selectedClan.level}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Puntos</span>
                <span className="stat-value">{selectedClan.points}</span>
              </div>
            </div>

            <div className="clan-members-preview">
              <h4>Miembros Destacados:</h4>
              {selectedClan.topMembers?.map((member: any, i: number) => (
                <div key={i} className="member-preview">
                  <span>{getRankIcon(member.rank)} {member.playerName}</span>
                  <span>Lvl {member.level}</span>
                </div>
              ))}
            </div>

            <Button onClick={() => setSelectedClan(null)}>Cerrar</Button>
          </div>
        </div>
      )}
    </div>
  )
}


