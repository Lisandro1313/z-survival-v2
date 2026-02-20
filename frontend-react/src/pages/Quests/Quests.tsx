import React, { useEffect } from 'react';
import { useQuestStore, Quest } from '../../store/questStore';
import { usePlayerStore } from '../../store/playerStore';
import { QuestsList } from '../../components/game/QuestsList';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useUIStore } from '../../store/uiStore';
import { ws } from '../../services/websocket';
import './Quests.css';

export const Quests: React.FC = () => {
  const player = usePlayerStore((state: any) => state.player);
  const { quests, dailyQuestsRefreshAt } = useQuestStore();
  const addNotification = useUIStore((state: any) => state.addNotification);

  // Calculate quest stats
  const availableQuests = quests.filter((q: Quest) => q.status === 'available');
  const activeQuests = quests.filter((q: Quest) => q.status === 'active');
  const completedQuests = quests.filter((q: Quest) => q.status === 'completed');
  const dailyQuests = quests.filter((q: Quest) => q.type === 'daily');

  useEffect(() => {
    // Request quests list on mount
    ws.send('missions:get_list', {});
  }, []);

  const handleAcceptQuest = (questId: number) => {
    // Check max active quests (ejemplo: límite de 5)
    if (activeQuests.length >= 5) {
      addNotification({
        message: 'No puedes tener más de 5 misiones activas',
        type: 'warning'
      });
      return;
    }

    ws.send('missions:accept', { quest_id: questId });
    addNotification({
      message: 'Misión aceptada',
      type: 'success'
    });
  };

  const handleAbandonQuest = (questId: number) => {
    ws.send('missions:abandon', { quest_id: questId });
    addNotification({
      message: 'Misión abandonada',
      type: 'warning'
    });
  };

  const handleTrackQuest = (_questId: number) => {
    // TODO: Implement quest tracking in HUD
    addNotification({
      message: 'Misión rastreada en HUD',
      type: 'info'
    });
  };

  // Time until daily reset
  const getTimeUntilReset = () => {
    if (!dailyQuestsRefreshAt) return 'N/A';
    const now = new Date();
    const reset = new Date(dailyQuestsRefreshAt);
    const diff = reset.getTime() - now.getTime();
    
    if (diff <= 0) return 'Disponible';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="quests-page">
      {/* Header Stats */}
      <div className="quests-header">
        <Card variant="glass" className="quest-stat-card">
          <div className="stat-icon-wrapper available">
            <span className="stat-icon">📢</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Disponibles</span>
            <span className="stat-value">{availableQuests.length}</span>
          </div>
        </Card>

        <Card variant="glass" className="quest-stat-card">
          <div className="stat-icon-wrapper active">
            <span className="stat-icon">⚡</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Activas</span>
            <div className="stat-with-limit">
              <span className="stat-value">{activeQuests.length}</span>
              <span className="stat-limit">/ 5</span>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="quest-stat-card">
          <div className="stat-icon-wrapper completed">
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Completadas</span>
            <span className="stat-value">{completedQuests.length}</span>
          </div>
        </Card>

        <Card variant="glass" className="quest-stat-card">
          <div className="stat-icon-wrapper daily">
            <span className="stat-icon">🔄</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Diarias</span>
            <div className="stat-with-timer">
              <span className="stat-value">{dailyQuests.length}</span>
              <span className="stat-timer">🕐 {getTimeUntilReset()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="quests-content">
        {/* Quests List */}
        <div className="quests-main">
          <QuestsList
            onAcceptQuest={handleAcceptQuest}
            onAbandonQuest={handleAbandonQuest}
            onTrackQuest={handleTrackQuest}
          />
        </div>

        {/* Sidebar */}
        <aside className="quests-sidebar">
          {/* Player Quest Progress */}
          <Card variant="glass" className="sidebar-card">
            <h3 className="sidebar-title">Progreso del Jugador</h3>
            <div className="player-quest-stats">
              <div className="quest-stat-row">
                <span className="stat-row-label">Nivel</span>
                <span className="stat-row-value">{player.level}</span>
              </div>
              <div className="quest-stat-row">
                <span className="stat-row-label">XP Actual</span>
                <span className="stat-row-value">{player.xp || 0}</span>
              </div>
              <div className="quest-stat-row progress">
                <span className="stat-row-label">Progreso XP</span>
                <ProgressBar
                  current={player.xp || 0}
                  max={player.level * 1000}
                  size="sm"
                  variant="xp"
                  showPercentage
                />
              </div>
              <div className="quest-stat-row">
                <span className="stat-row-label">Caps</span>
                <span className="stat-row-value caps">💰 {player.caps || 0}</span>
              </div>
            </div>
          </Card>

          {/* Quest Tips */}
          <Card variant="glass" className="sidebar-card">
            <h3 className="sidebar-title">💡 Consejos</h3>
            <ul className="tips-list">
              <li className="tip-item">
                <span className="tip-icon">⭐</span>
                <span className="tip-text">Las misiones principales avanzan la historia</span>
              </li>
              <li className="tip-item">
                <span className="tip-icon">📌</span>
                <span className="tip-text">Las secundarias dan recompensas extra</span>
              </li>
              <li className="tip-item">
                <span className="tip-icon">🔄</span>
                <span className="tip-text">Las diarias se renuevan cada 24 horas</span>
              </li>
              <li className="tip-item">
                <span className="tip-icon">🎉</span>
                <span className="tip-text">Los eventos son temporales, ¡no los pierdas!</span>
              </li>
              <li className="tip-item">
                <span className="tip-icon">⏰</span>
                <span className="tip-text">Algunas misiones pueden expirar</span>
              </li>
            </ul>
          </Card>

          {/* Quest Types Legend */}
          <Card variant="glass" className="sidebar-card">
            <h3 className="sidebar-title">📋 Tipos de Objetivos</h3>
            <div className="objectives-legend">
              <div className="legend-item">
                <span className="legend-icon">⚔️</span>
                <span className="legend-label">Eliminar enemigos</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">📦</span>
                <span className="legend-label">Recolectar items</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">🗺️</span>
                <span className="legend-label">Visitar ubicación</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">🔨</span>
                <span className="legend-label">Craftear items</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">💬</span>
                <span className="legend-label">Hablar con NPC</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">⏱️</span>
                <span className="legend-label">Sobrevivir tiempo</span>
              </div>
            </div>
          </Card>

          {/* Active Quests Quick View */}
          {activeQuests.length > 0 && (
            <Card variant="glass" className="sidebar-card">
              <h3 className="sidebar-title">⚡ Activas Rápido</h3>
              <div className="quick-quests">
                {activeQuests.slice(0, 3).map((quest: Quest) => {
                  const completedObjectives = quest.objectives.filter((obj: any) => obj.completed).length;
                  const totalObjectives = quest.objectives.length;
                  const progress = (completedObjectives / totalObjectives) * 100;
                  
                  return (
                    <div key={quest.id} className="quick-quest-item">
                      <div className="quick-quest-header">
                        <span className="quick-quest-title">{quest.title}</span>
                        <span className="quick-quest-progress">{Math.round(progress)}%</span>
                      </div>
                      <ProgressBar
                        current={completedObjectives}
                        max={totalObjectives}
                        size="sm"
                        variant="xp"
                        animated
                      />
                    </div>
                  );
                })}
                {activeQuests.length > 3 && (
                  <p className="quick-quests-more">
                    Y {activeQuests.length - 3} más...
                  </p>
                )}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Quests;
