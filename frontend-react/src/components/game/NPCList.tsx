import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import './NPCList.css';

export interface NPC {
  id: string | number;
  name: string;
  role?: string;
  description?: string;
  location?: string;
  trust_level?: number;
  max_trust?: number;
  relationship?: 'hostile' | 'neutral' | 'friendly' | 'allied';
  available?: boolean;
  quest_available?: boolean;
  trade_available?: boolean;
  dialogue_available?: boolean;
  avatar?: string;
}

export interface NPCListProps {
  npcs: NPC[];
  onTalkToNPC?: (npcId: string | number) => void;
  onTradeWithNPC?: (npcId: string | number) => void;
  onViewDetails?: (npcId: string | number) => void;
  compact?: boolean;
  showFilters?: boolean;
}

type NPCFilter = 'all' | 'friendly' | 'neutral' | 'hostile' | 'quest';

export const NPCList: React.FC<NPCListProps> = ({
  npcs,
  onTalkToNPC,
  onTradeWithNPC,
  onViewDetails,
  compact = false,
  showFilters = true
}) => {
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [filter, setFilter] = useState<NPCFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter NPCs
  const filteredNPCs = useMemo(() => {
    let filtered = npcs;

    // Filter by relationship
    switch (filter) {
      case 'friendly':
        filtered = filtered.filter(npc => npc.relationship === 'friendly' || npc.relationship === 'allied');
        break;
      case 'neutral':
        filtered = filtered.filter(npc => npc.relationship === 'neutral');
        break;
      case 'hostile':
        filtered = filtered.filter(npc => npc.relationship === 'hostile');
        break;
      case 'quest':
        filtered = filtered.filter(npc => npc.quest_available);
        break;
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(npc =>
        npc.name.toLowerCase().includes(query) ||
        npc.role?.toLowerCase().includes(query) ||
        npc.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [npcs, filter, searchQuery]);

  const handleNPCClick = (npc: NPC) => {
    setSelectedNPC(npc.id === selectedNPC?.id ? null : npc);
    onViewDetails?.(npc.id);
  };

  const handleTalk = (npcId: string | number, event: React.MouseEvent) => {
    event.stopPropagation();
    onTalkToNPC?.(npcId);
  };

  const handleTrade = (npcId: string | number, event: React.MouseEvent) => {
    event.stopPropagation();
    onTradeWithNPC?.(npcId);
  };

  // Compact mode - just show count
  if (compact) {
    const friendlyCount = npcs.filter(npc => 
      npc.relationship === 'friendly' || npc.relationship === 'allied'
    ).length;

    return (
      <Card className="npc-list-compact" variant="glass">
        <div className="compact-header">
          <span className="icon">👥</span>
          <div className="compact-info">
            <span className="label">NPCs Amigables</span>
            <span className="count">{friendlyCount} / {npcs.length}</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="npc-list-container">
      {/* Filters */}
      {showFilters && (
        <div className="npc-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="filter-icon">👥</span>
            Todos ({npcs.length})
          </button>
          <button
            className={`filter-btn ${filter === 'friendly' ? 'active' : ''}`}
            onClick={() => setFilter('friendly')}
          >
            <span className="filter-icon">🤝</span>
            Amigables
          </button>
          <button
            className={`filter-btn ${filter === 'neutral' ? 'active' : ''}`}
            onClick={() => setFilter('neutral')}
          >
            <span className="filter-icon">😐</span>
            Neutrales
          </button>
          <button
            className={`filter-btn ${filter === 'hostile' ? 'active' : ''}`}
            onClick={() => setFilter('hostile')}
          >
            <span className="filter-icon">⚔️</span>
            Hostiles
          </button>
          <button
            className={`filter-btn ${filter === 'quest' ? 'active' : ''}`}
            onClick={() => setFilter('quest')}
          >
            <span className="filter-icon">❗</span>
            Con Misión
          </button>
        </div>
      )}

      {/* Search */}
      <div className="npc-search">
        <input
          type="text"
          placeholder="Buscar NPCs por nombre o rol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* NPCs Grid */}
      <div className="npc-grid">
        {filteredNPCs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👤</span>
            <p className="empty-text">No se encontraron NPCs</p>
          </div>
        ) : (
          filteredNPCs.map((npc) => (
            <NPCCard
              key={npc.id}
              npc={npc}
              isSelected={selectedNPC?.id === npc.id}
              onClick={() => handleNPCClick(npc)}
              onTalk={handleTalk}
              onTrade={handleTrade}
            />
          ))
        )}
      </div>

      {/* Details Panel (if selected) */}
      {selectedNPC && (
        <div className="npc-details-overlay" onClick={() => setSelectedNPC(null)}>
          <Card 
            className="npc-details-card" 
            variant="glass"
            onClick={(e: any) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="npc-details-header">
              <div className="npc-avatar-large">
                {selectedNPC.avatar || getRelationshipIcon(selectedNPC.relationship)}
              </div>
              <div className="npc-info">
                <h3 className="npc-name">{selectedNPC.name}</h3>
                {selectedNPC.role && <p className="npc-role">{selectedNPC.role}</p>}
                {selectedNPC.location && (
                  <p className="npc-location">
                    <span className="location-icon">📍</span>
                    {selectedNPC.location}
                  </p>
                )}
              </div>
              <button 
                className="close-btn"
                onClick={() => setSelectedNPC(null)}
              >
                ✕
              </button>
            </div>

            {/* Description */}
            {selectedNPC.description && (
              <div className="npc-description">
                <p>{selectedNPC.description}</p>
              </div>
            )}

            {/* Relationship */}
            <div className="npc-relationship">
              <span className="relationship-label">Relación:</span>
              <span className={`relationship-badge ${selectedNPC.relationship}`}>
                {getRelationshipIcon(selectedNPC.relationship)}
                {selectedNPC.relationship === 'hostile' && ' Hostil'}
                {selectedNPC.relationship === 'neutral' && ' Neutral'}
                {selectedNPC.relationship === 'friendly' && ' Amigable'}
                {selectedNPC.relationship === 'allied' && ' Aliado'}
              </span>
            </div>

            {/* Trust Level */}
            {selectedNPC.trust_level !== undefined && selectedNPC.max_trust && (
              <div className="npc-trust">
                <div className="trust-header">
                  <span className="trust-label">Confianza:</span>
                  <span className="trust-value">
                    {selectedNPC.trust_level} / {selectedNPC.max_trust}
                  </span>
                </div>
                <div className="trust-bar">
                  <div 
                    className="trust-fill"
                    style={{ 
                      width: `${(selectedNPC.trust_level / selectedNPC.max_trust) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Available Actions */}
            <div className="npc-actions">
              {selectedNPC.dialogue_available && (
                <button
                  className="npc-action-btn primary"
                  onClick={() => onTalkToNPC?.(selectedNPC.id)}
                >
                  <span className="btn-icon">💬</span>
                  Hablar
                  {selectedNPC.quest_available && (
                    <span className="quest-indicator">❗</span>
                  )}
                </button>
              )}
              {selectedNPC.trade_available && (
                <button
                  className="npc-action-btn secondary"
                  onClick={() => onTradeWithNPC?.(selectedNPC.id)}
                >
                  <span className="btn-icon">🛒</span>
                  Comerciar
                </button>
              )}
              {!selectedNPC.available && (
                <div className="unavailable-notice">
                  <span className="notice-icon">⏰</span>
                  <span className="notice-text">No disponible en este momento</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Helper component for NPC card
const NPCCard: React.FC<{
  npc: NPC;
  isSelected: boolean;
  onClick: () => void;
  onTalk: (npcId: string | number, event: React.MouseEvent) => void;
  onTrade: (npcId: string | number, event: React.MouseEvent) => void;
}> = ({ npc, isSelected, onClick, onTalk, onTrade }) => {
  return (
    <Card
      className={`npc-card ${isSelected ? 'selected' : ''} ${npc.relationship || 'neutral'} ${!npc.available ? 'unavailable' : ''}`}
      onClick={onClick}
      variant="glass"
    >
      {/* Quest Indicator */}
      {npc.quest_available && (
        <div className="quest-indicator-badge">❗</div>
      )}

      {/* Avatar */}
      <div className="npc-avatar">
        {npc.avatar || getRelationshipIcon(npc.relationship)}
      </div>

      {/* Info */}
      <div className="npc-card-info">
        <h4 className="npc-card-name">{npc.name}</h4>
        {npc.role && <p className="npc-card-role">{npc.role}</p>}
        
        {/* Trust Mini Bar */}
        {npc.trust_level !== undefined && npc.max_trust && (
          <div className="trust-mini">
            <div className="trust-mini-bar">
              <div 
                className="trust-mini-fill"
                style={{ 
                  width: `${(npc.trust_level / npc.max_trust) * 100}%` 
                }}
              />
            </div>
            <span className="trust-mini-text">
              {Math.round((npc.trust_level / npc.max_trust) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {npc.available && (
        <div className="npc-quick-actions">
          {npc.dialogue_available && (
            <button
              className="quick-action-btn"
              onClick={(e) => onTalk(npc.id, e)}
              title="Hablar"
            >
              💬
            </button>
          )}
          {npc.trade_available && (
            <button
              className="quick-action-btn"
              onClick={(e) => onTrade(npc.id, e)}
              title="Comerciar"
            >
              🛒
            </button>
          )}
        </div>
      )}

      {/* Unavailable Overlay */}
      {!npc.available && (
        <div className="unavailable-overlay">
          <span>No disponible</span>
        </div>
      )}
    </Card>
  );
};

// Helper function for relationship icons
const getRelationshipIcon = (relationship?: NPC['relationship']): string => {
  switch (relationship) {
    case 'hostile': return '⚔️';
    case 'neutral': return '😐';
    case 'friendly': return '🤝';
    case 'allied': return '🛡️';
    default: return '👤';
  }
};

export default NPCList;

