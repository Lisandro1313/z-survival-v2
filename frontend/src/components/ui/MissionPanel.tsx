/**
 * 🎯 MISSION PANEL (FASE 11)
 * 
 * Panel de misiones dinámicas con:
 * - Filtros por prioridad
 * - Cards de misiones
 * - Progreso en tiempo real
 * - Acciones (Aceptar/Abandonar/Completar)
 */

import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Mission, MissionPriority } from '../../types';
import './MissionPanel.css';

// ====================================
// MISSION ICONS
// ====================================

const MISSION_ICONS: Record<string, string> = {
  resource_shortage: '📦',
  zombie_threat: '🧟',
  npc_help: '🤝',
  exploration: '🗺️',
  construction: '🏗️',
  trade: '💰',
  defense: '🛡️',
};

// ====================================
// PRIORITY COLORS
// ====================================

const PRIORITY_COLORS: Record<MissionPriority, string> = {
  urgent: '#e74c3c',
  normal: '#f39c12',
  optional: '#3498db',
};

const PRIORITY_LABELS: Record<MissionPriority, string> = {
  urgent: 'URGENTE',
  normal: 'NORMAL',
  optional: 'OPCIONAL',
};

// ====================================
// MISSION CARD COMPONENT
// ====================================

interface MissionCardProps {
  mission: Mission;
  onAccept: (missionId: string) => void;
  onAbandon: (missionId: string) => void;
  onComplete: (missionId: string) => void;
  isMyMission: boolean;
}

function MissionCard({ mission, onAccept, onAbandon, onComplete, isMyMission }: MissionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // ====================================
  // COUNTDOWN TIMER
  // ====================================

  useEffect(() => {
    if (!mission.expiresAt) {
      setTimeRemaining('∞');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = mission.expiresAt! - now;

      if (remaining <= 0) {
        setTimeRemaining('Expirado');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [mission.expiresAt]);

  // ====================================
  // PROGRESS CALCULATION
  // ====================================

  const progressPercent = mission.progress || 0;

  // ====================================
  // REWARDS TEXT
  // ====================================

  const rewardsText = useMemo(() => {
    const rewards: string[] = [];
    if (mission.reward.xp) rewards.push(`⭐ ${mission.reward.xp} XP`);
    if (mission.reward.tokens) rewards.push(`🪙 ${mission.reward.tokens} tokens`);
    if (mission.reward.items) {
      const itemCount = Object.keys(mission.reward.items).length;
      if (itemCount > 0) rewards.push(`📦 ${itemCount} items`);
    }
    return rewards.join(' | ');
  }, [mission.reward]);

  // ====================================
  // RENDER
  // ====================================

  return (
    <div 
      className="mission-card" 
      style={{ borderLeftColor: PRIORITY_COLORS[mission.priority] }}
    >
      {/* Header */}
      <div className="mission-card-header">
        <div className="mission-icon">{MISSION_ICONS[mission.type] || '🎯'}</div>
        <div className="mission-title-wrapper">
          <h3 className="mission-title">{mission.title}</h3>
          <span 
            className="mission-priority" 
            style={{ backgroundColor: PRIORITY_COLORS[mission.priority] }}
          >
            {PRIORITY_LABELS[mission.priority]}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mission-description">{mission.description}</p>

      {/* Timer & Participants */}
      <div className="mission-info">
        {mission.expiresAt && (
          <div className="mission-timer">
            ⏰ {timeRemaining}
          </div>
        )}
        {mission.collective && (
          <div className="mission-participants">
            👥 {mission.participants.length} participantes
          </div>
        )}
      </div>

      {/* Progress Bar (for accepted missions) */}
      {isMyMission && (
        <div className="mission-progress">
          <div className="mission-progress-bar">
            <div 
              className="mission-progress-fill" 
              style={{ 
                width: `${progressPercent}%`,
                backgroundColor: PRIORITY_COLORS[mission.priority]
              }}
            />
          </div>
          <span className="mission-progress-text">{progressPercent.toFixed(0)}%</span>
        </div>
      )}

      {/* Rewards */}
      <div className="mission-rewards">
        🎁 {rewardsText}
      </div>

      {/* Actions */}
      <div className="mission-actions">
        {!isMyMission ? (
          <button 
            className="mission-btn mission-btn-accept"
            onClick={() => onAccept(mission.id)}
          >
            ✅ Aceptar
          </button>
        ) : (
          <>
            <button 
              className="mission-btn mission-btn-complete"
              onClick={() => onComplete(mission.id)}
              disabled={progressPercent < 100}
            >
              🎉 Completar
            </button>
            <button 
              className="mission-btn mission-btn-abandon"
              onClick={() => onAbandon(mission.id)}
            >
              ❌ Abandonar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ====================================
// MISSION PANEL COMPONENT
// ====================================

export default function MissionPanel() {
  const { 
    missions, 
    myMissions, 
    missionFilter, 
    setMissionFilter,
    player 
  } = useGameStore();

  const { send } = useWebSocket();

  // ====================================
  // LOAD MISSIONS ON MOUNT
  // ====================================

  useEffect(() => {
    // Request missions from server
    send({ type: 'getMissions' });
  }, []);

  // ====================================
  // FILTERED MISSIONS
  // ====================================

  const filteredMissions = useMemo(() => {
    if (missionFilter === 'all') {
      return missions;
    }
    return missions.filter((m: Mission) => m.priority === missionFilter);
  }, [missions, missionFilter]);

  // ====================================
  // MISSION ACTIONS
  // ====================================

  const handleAccept = (missionId: string) => {
    send({ 
      type: 'acceptMission', 
      missionId,
      playerId: player?.id 
    });
  };

  const handleAbandon = (missionId: string) => {
    send({ 
      type: 'abandonMission', 
      missionId,
      playerId: player?.id 
    });
  };

  const handleComplete = (missionId: string) => {
    send({ 
      type: 'completeMission', 
      missionId,
      playerId: player?.id 
    });
  };

  // ====================================
  // RENDER
  // ====================================

  return (
    <div className="mission-panel">
      {/* Header */}
      <div className="mission-panel-header">
        <h2>🎯 Misiones Dinámicas</h2>
        <div className="mission-stats">
          <span>📋 {missions.length} disponibles</span>
          <span>✅ {myMissions.length} activas</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mission-filters">
        <button
          className={`mission-filter ${missionFilter === 'all' ? 'active' : ''}`}
          onClick={() => setMissionFilter('all')}
        >
          Todas ({missions.length})
        </button>
        <button
          className={`mission-filter ${missionFilter === 'urgent' ? 'active' : ''}`}
          onClick={() => setMissionFilter('urgent')}
          style={{ borderColor: PRIORITY_COLORS.urgent }}
        >
          🔥 Urgentes ({missions.filter((m: Mission) => m.priority === 'urgent').length})
        </button>
        <button
          className={`mission-filter ${missionFilter === 'normal' ? 'active' : ''}`}
          onClick={() => setMissionFilter('normal')}
          style={{ borderColor: PRIORITY_COLORS.normal }}
        >
          ⚡ Normales ({missions.filter((m: Mission) => m.priority === 'normal').length})
        </button>
        <button
          className={`mission-filter ${missionFilter === 'optional' ? 'active' : ''}`}
          onClick={() => setMissionFilter('optional')}
          style={{ borderColor: PRIORITY_COLORS.optional }}
        >
          💎 Opcionales ({missions.filter((m: Mission) => m.priority === 'optional').length})
        </button>
      </div>

      {/* My Missions Section */}
      {myMissions.length > 0 && (
        <div className="mission-section">
          <h3 className="mission-section-title">✅ Mis Misiones Activas</h3>
          <div className="mission-grid">
            {myMissions.map((mission: Mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onAccept={handleAccept}
                onAbandon={handleAbandon}
                onComplete={handleComplete}
                isMyMission={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Missions Section */}
      <div className="mission-section">
        <h3 className="mission-section-title">📋 Misiones Disponibles</h3>
        {filteredMissions.length === 0 ? (
          <div className="mission-empty">
            <p>No hay misiones disponibles en este momento.</p>
            <p className="mission-empty-hint">Las misiones se generan dinámicamente cada 50 segundos.</p>
          </div>
        ) : (
          <div className="mission-grid">
            {filteredMissions.map((mission: Mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onAccept={handleAccept}
                onAbandon={handleAbandon}
                onComplete={handleComplete}
                isMyMission={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
