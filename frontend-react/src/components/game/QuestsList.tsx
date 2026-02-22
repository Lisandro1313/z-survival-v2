import React, { useState, useMemo } from 'react';
import { useQuestStore, Quest, QuestObjective } from '../../store/questStore';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import './QuestsList.css';

export interface QuestsListProps {
  onAcceptQuest?: (questId: number) => void;
  onAbandonQuest?: (questId: number) => void;
  onTrackQuest?: (questId: number) => void;
  compact?: boolean;
}

type QuestTab = 'available' | 'active' | 'completed';

export const QuestsList: React.FC<QuestsListProps> = ({
  onAcceptQuest,
  onAbandonQuest,
  onTrackQuest,
  compact = false
}) => {
  const { quests, selectedQuest, selectQuest, acceptQuest, abandonQuest } = useQuestStore();
  const [activeTab, setActiveTab] = useState<QuestTab>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter quests by tab
  const filteredQuests = useMemo(() => {
    let filtered = quests;

    // Filter by tab
    switch (activeTab) {
      case 'available':
        filtered = filtered.filter((q: Quest) => q.status === 'available');
        break;
      case 'active':
        filtered = filtered.filter((q: Quest) => q.status === 'active');
        break;
      case 'completed':
        filtered = filtered.filter((q: Quest) => q.status === 'completed');
        break;
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((q: Quest) => 
        q.title.toLowerCase().includes(query) ||
        q.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [quests, activeTab, searchQuery]);

  const handleQuestClick = (quest: Quest) => {
    selectQuest(quest.id === selectedQuest?.id ? null : quest);
  };

  const handleAccept = (questId: number) => {
    acceptQuest(questId);
    onAcceptQuest?.(questId);
  };

  const handleAbandon = (questId: number) => {
    abandonQuest(questId);
    onAbandonQuest?.(questId);
  };

  const handleTrack = (questId: number) => {
    onTrackQuest?.(questId);
  };

  // Compact mode - just show active quests count
  if (compact) {
    const activeCount = quests.filter((q: Quest) => q.status === 'active').length;
    return (
      <Card className="quests-list-compact" variant="glass">
        <div className="compact-header">
          <span className="icon">📋</span>
          <div className="compact-info">
            <span className="label">Misiones Activas</span>
            <span className="count">{activeCount}</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="quests-list-container">
      {/* Tabs */}
      <div className="quests-tabs">
        <button
          className={`quest-tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          <span className="tab-icon">📢</span>
          <span className="tab-label">Disponibles</span>
          <span className="tab-count">
            {quests.filter((q: Quest) => q.status === 'available').length}
          </span>
        </button>
        <button
          className={`quest-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <span className="tab-icon">⚡</span>
          <span className="tab-label">Activas</span>
          <span className="tab-count">
            {quests.filter((q: Quest) => q.status === 'active').length}
          </span>
        </button>
        <button
          className={`quest-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <span className="tab-icon">✅</span>
          <span className="tab-label">Completadas</span>
          <span className="tab-count">
            {quests.filter((q: Quest) => q.status === 'completed').length}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="quests-search">
        <input
          type="text"
          placeholder="Buscar misiones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Quests List + Details Panel */}
      <div className="quests-content">
        {/* Quests List */}
        <div className="quests-list">
          {filteredQuests.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p className="empty-text">
                {activeTab === 'available' && 'No hay misiones disponibles'}
                {activeTab === 'active' && 'No tienes misiones activas'}
                {activeTab === 'completed' && 'No has completado misiones aún'}
              </p>
            </div>
          ) : (
            filteredQuests.map((quest: Quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                isSelected={selectedQuest?.id === quest.id}
                onClick={() => handleQuestClick(quest)}
              />
            ))
          )}
        </div>

        {/* Details Panel */}
        {selectedQuest && (
          <div className="quest-details">
            <Card variant="glass">
              {/* Header */}
              <div className="quest-details-header">
                <div className="quest-title-row">
                  <h3 className="quest-title">{selectedQuest.title}</h3>
                  <span className={`quest-type-badge ${selectedQuest.type}`}>
                    {selectedQuest.type === 'main' && '⭐ Principal'}
                    {selectedQuest.type === 'side' && '📌 Secundaria'}
                    {selectedQuest.type === 'daily' && '🔄 Diaria'}
                    {selectedQuest.type === 'event' && '🎉 Evento'}
                  </span>
                </div>
                <p className="quest-description">{selectedQuest.description}</p>
              </div>

              {/* Objectives */}
              <div className="quest-objectives">
                <h4 className="section-title">Objetivos</h4>
                {selectedQuest.objectives.map((objective: QuestObjective) => (
                  <div key={objective.id} className="objective-item">
                    <div className="objective-header">
                      <span className={`objective-icon ${objective.completed ? 'completed' : ''}`}>
                        {objective.completed ? '✅' : getObjectiveIcon(objective.type)}
                      </span>
                      <span className="objective-description">{objective.description}</span>
                    </div>
                    <div className="objective-progress">
                      <ProgressBar
                        current={objective.current}
                        max={objective.required}
                        size="sm"
                        variant={objective.completed ? 'xp' : 'progress'}
                        showPercentage={false}
                        showValues
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Rewards */}
              <div className="quest-rewards">
                <h4 className="section-title">Recompensas</h4>
                <div className="rewards-grid">
                  {selectedQuest.rewards.map((reward: any, index: number) => (
                    <div key={index} className="reward-item">
                      <span className="reward-icon">
                        {reward.type === 'xp' && '⭐'}
                        {reward.type === 'caps' && '💰'}
                        {reward.type === 'item' && '📦'}
                        {reward.type === 'reputation' && '👥'}
                      </span>
                      <div className="reward-info">
                        <span className="reward-amount">
                          {reward.type === 'item' ? reward.item_name : `${reward.amount}`}
                        </span>
                        <span className="reward-type">
                          {reward.type === 'xp' && 'XP'}
                          {reward.type === 'caps' && 'Caps'}
                          {reward.type === 'item' && 'Item'}
                          {reward.type === 'reputation' && 'Reputación'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="quest-actions">
                {selectedQuest.status === 'available' && (
                  <button
                    className="quest-action-btn primary"
                    onClick={() => handleAccept(selectedQuest.id)}
                  >
                    <span className="btn-icon">✓</span>
                    Aceptar Misión
                  </button>
                )}
                {selectedQuest.status === 'active' && (
                  <>
                    <button
                      className="quest-action-btn secondary"
                      onClick={() => handleTrack(selectedQuest.id)}
                    >
                      <span className="btn-icon">📍</span>
                      Rastrear
                    </button>
                    <button
                      className="quest-action-btn danger"
                      onClick={() => handleAbandon(selectedQuest.id)}
                    >
                      <span className="btn-icon">✗</span>
                      Abandonar
                    </button>
                  </>
                )}
                {selectedQuest.status === 'completed' && (
                  <div className="quest-completed-badge">
                    <span className="badge-icon">🏆</span>
                    <span className="badge-text">Misión Completada</span>
                  </div>
                )}
              </div>

              {/* Extra Info */}
              {selectedQuest.level_required && (
                <div className="quest-requirements">
                  <span className="requirement-label">Nivel requerido:</span>
                  <span className="requirement-value">{selectedQuest.level_required}</span>
                </div>
              )}
              {selectedQuest.expires_at && selectedQuest.status !== 'completed' && (
                <div className="quest-expiration">
                  <span className="expiration-icon">⏰</span>
                  <span className="expiration-text">
                    Expira: {new Date(selectedQuest.expires_at).toLocaleString()}
                  </span>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for quest card
const QuestCard: React.FC<{
  quest: Quest;
  isSelected: boolean;
  onClick: () => void;
}> = ({ quest, isSelected, onClick }) => {
  const progress = quest.objectives.filter(obj => obj.completed).length;
  const total = quest.objectives.length;

  return (
    <Card
      className={`quest-card ${isSelected ? 'selected' : ''} ${quest.status}`}
      onClick={onClick}
      variant="glass"
    >
      <div className="quest-card-header">
        <h4 className="quest-card-title">{quest.title}</h4>
        <span className={`quest-status-badge ${quest.status}`}>
          {quest.status === 'available' && '📢'}
          {quest.status === 'active' && '⚡'}
          {quest.status === 'completed' && '✅'}
          {quest.status === 'failed' && '❌'}
          {quest.status === 'expired' && '⏰'}
        </span>
      </div>
      <p className="quest-card-description">{quest.description}</p>
      
      {quest.status === 'active' && (
        <div className="quest-card-progress">
          <ProgressBar
            current={progress}
            max={total}
            label="Objetivos"
            size="sm"
            variant="xp"
            showPercentage
          />
        </div>
      )}

      <div className="quest-card-footer">
        <span className={`quest-type-small ${quest.type}`}>
          {quest.type === 'main' && '⭐'}
          {quest.type === 'side' && '📌'}
          {quest.type === 'daily' && '🔄'}
          {quest.type === 'event' && '🎉'}
        </span>
        {quest.level_required && (
          <span className="quest-level">Nivel {quest.level_required}+</span>
        )}
      </div>
    </Card>
  );
};

// Helper function for objective icons
const getObjectiveIcon = (type: QuestObjective['type']): string => {
  switch (type) {
    case 'kill': return '⚔️';
    case 'collect': return '📦';
    case 'visit': return '🗺️';
    case 'craft': return '🔨';
    case 'talk': return '💬';
    case 'survive': return '⏱️';
    default: return '📋';
  }
};

export default QuestsList;

