import React, { useState, useEffect } from 'react';
import ws from '../../services/websocket';

interface Agent {
  id: string;
  name: string;
  age: number;
  lifeStage: string;
  nodeId: string;
  alive: boolean;
  personality: Record<string, number>;
  needs: Record<string, number>;
  traumaProfile: Record<string, number>;
  relationships: Record<string, any>;
  memory: { events: any[] };
  stats: { hp: number; stamina: number; sanity: number };
}

interface AIStats {
  enabled: boolean;
  workers: number;
  regions: Record<string, any>;
}

interface AIDebugPanelProps {
  onClose: () => void;
}

const AIDebugPanel: React.FC<AIDebugPanelProps> = ({ onClose }) => {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [tab, setTab] = useState<'overview' | 'agents' | 'inspector'>('overview');

  useEffect(() => {
    // Request AI stats
    ws.send('ai:get_stats');

    // Listen for AI stats updates
    const handleAIStats = (payload: any) => {
      setStats(payload.data);
    };

    const handleAIAgents = (payload: any) => {
      setAgents(payload.data);
    };

    const handleAgentSpeech = (payload: any) => {
      console.log('[Agent Speech]', payload);
      // Refresh agents to show updated state
      ws.send('ai:get_agents');
    };

    const handleEmotionUpdate = (payload: any) => {
      console.log('[Emotion Update]', payload);
      // Update selected agent if it matches
      if (selectedAgent && selectedAgent.id === payload.agentId) {
        ws.send('ai:get_agents');
      }
    };

    // Subscribe to WebSocket events
    ws.on('ai:stats', handleAIStats);
    ws.on('ai:agents', handleAIAgents);
    ws.on('agent:speech', handleAgentSpeech);
    ws.on('agent:emotion_update', handleEmotionUpdate);

    // Admin command responses
    const handleAgentsCleared = (message: any) => {
      console.log('[Agents Cleared]', message);
      ws.send('ai:get_agents');
      ws.send('ai:get_stats');
    };

    const handleResetComplete = (message: any) => {
      console.log('[System Reset]', message);
      ws.send('ai:get_agents');
      ws.send('ai:get_stats');
    };

    ws.on('ai:agents_cleared', handleAgentsCleared);
    ws.on('ai:reset_complete', handleResetComplete);

    // Poll for updates every 5 seconds
    const pollInterval = setInterval(() => {
      if (stats?.enabled) {
        ws.send('ai:get_stats');
        if (tab === 'agents' || tab === 'inspector') {
          ws.send('ai:get_agents');
        }
      }
    }, 5000);

    return () => {
      ws.off('ai:stats', handleAIStats);
      ws.off('ai:agents', handleAIAgents);
      ws.off('agent:speech', handleAgentSpeech);
      ws.off('agent:emotion_update', handleEmotionUpdate);
      ws.off('ai:agents_cleared', handleAgentsCleared);
      ws.off('ai:reset_complete', handleResetComplete);
      clearInterval(pollInterval);
    };
  }, [stats?.enabled, tab, selectedAgent]);

  const toggleAI = () => {
    const action = stats?.enabled ? 'ai:stop' : 'ai:start';
    ws.send(action);
    
    // Update UI optimistically
    setTimeout(() => {
      ws.send('ai:get_stats');
    }, 500);
  };

  const spawnInitial = () => {
    ws.send('ai:spawn_initial', { count: 20, regionId: 'default' });
    
    // Refresh agents list after spawn
    setTimeout(() => {
      ws.send('ai:get_agents');
      ws.send('ai:get_stats');
    }, 1000);
  };

  const clearAgents = () => {
    if (!confirm('¿Eliminar todos los agentes? Esta acción no se puede deshacer.')) {
      return;
    }

    ws.send('ai:clear_agents', { regionId: 'default' });
    
    // Refresh after clear
    setTimeout(() => {
      ws.send('ai:get_agents');
      ws.send('ai:get_stats');
      setSelectedAgent(null); // Deselect any selected agent
    }, 500);
  };

  const resetSystem = () => {
    if (!confirm('¿Resetear completamente el sistema de IA? Esto eliminará todos los agentes y detendrá la simulación.')) {
      return;
    }

    ws.send('ai:reset');
    
    // Refresh after reset
    setTimeout(() => {
      ws.send('ai:get_agents');
      ws.send('ai:get_stats');
      setSelectedAgent(null);
    }, 1000);
  };

  const renderPersonalityBar = (trait: string, value: number) => (
    <div className="trait-bar" key={trait}>
      <label>{trait}</label>
      <div className="bar-container">
        <div 
          className={`bar-fill ${value > 70 ? 'high' : value < 30 ? 'low' : ''}`}
          style={{ width: `${value}%` }}
        />
        <span className="bar-value">{value.toFixed(0)}</span>
      </div>
    </div>
  );

  const renderNeedsGauge = (need: string, value: number) => {
    const getColor = () => {
      if (value > 70) return '#ff4444';
      if (value > 50) return '#ffaa00';
      return '#44ff44';
    };

    return (
      <div className="need-gauge" key={need}>
        <div className="gauge-header">
          <span>{need}</span>
          <span>{value.toFixed(0)}</span>
        </div>
        <div className="gauge-bar">
          <div 
            className="gauge-fill"
            style={{ 
              width: `${value}%`,
              backgroundColor: getColor()
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="ai-debug-panel">
      <div className="debug-header">
        <h2>🤖 AI Debug Panel</h2>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <div className="debug-tabs">
        <button 
          className={tab === 'overview' ? 'active' : ''}
          onClick={() => setTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={tab === 'agents' ? 'active' : ''}
          onClick={() => setTab('agents')}
        >
          👥 Agents ({agents.length})
        </button>
        <button 
          className={tab === 'inspector' ? 'active' : ''}
          onClick={() => setTab('inspector')}
          disabled={!selectedAgent}
        >
          🔍 Inspector
        </button>
      </div>

      <div className="debug-content">
        {tab === 'overview' && (
          <div className="overview-tab">
            <div className="control-section">
              <button 
                className={`ai-toggle ${stats?.enabled ? 'active' : ''}`}
                onClick={toggleAI}
              >
                {stats?.enabled ? '⏸️ Stop AI' : '▶️ Start AI'}
              </button>
              <button 
                className="ai-spawn"
                onClick={spawnInitial}
                disabled={agents.length > 0}
                title={agents.length > 0 ? 'Ya existen agentes' : 'Spawnear 20 agentes iniciales'}
              >
                🌱 Spawn Agents ({agents.length}/20)
              </button>
              <button 
                className="ai-clear"
                onClick={clearAgents}
                disabled={agents.length === 0}
                title={agents.length === 0 ? 'No hay agentes' : 'Eliminar todos los agentes'}
              >
                🗑️ Clear ({agents.length})
              </button>
              <button 
                className="ai-reset"
                onClick={resetSystem}
                title="Resetear sistema completo (detiene IA y elimina agentes)"
              >
                🔄 Reset System
              </button>
            </div>

            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Status</div>
                  <div className={`stat-value ${stats.enabled ? 'active' : ''}`}>
                    {stats.enabled ? '🟢 Active' : '🔴 Inactive'}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Workers</div>
                  <div className="stat-value">{stats.workers}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Agents</div>
                  <div className="stat-value">{agents.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Avg Sanity</div>
                  <div className="stat-value">
                    {agents.length > 0 
                      ? (agents.reduce((sum, a) => sum + a.stats.sanity, 0) / agents.length).toFixed(1)
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            )}

            {stats?.regions && Object.entries(stats.regions).map(([regionId, data]: [string, any]) => (
              <div className="region-card" key={regionId}>
                <h3>Region: {regionId}</h3>
                <div className="region-stats">
                  <div>Total: {data.total}</div>
                  <div>Child: {data.byLifeStage?.child || 0}</div>
                  <div>Teen: {data.byLifeStage?.teen || 0}</div>
                  <div>Adult: {data.byLifeStage?.adult || 0}</div>
                  <div>Elder: {data.byLifeStage?.elder || 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'agents' && (
          <div className="agents-tab">
            <div className="agents-list">
              {agents.map(agent => (
                <div 
                  key={agent.id}
                  className={`agent-item ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setTab('inspector');
                  }}
                >
                  <div className="agent-header">
                    <span className="agent-name">{agent.name}</span>
                    <span className="agent-age">{agent.age}y ({agent.lifeStage})</span>
                  </div>
                  <div className="agent-stats-mini">
                    <span>❤️ {agent.stats.hp}</span>
                    <span>🧠 {agent.stats.sanity.toFixed(0)}</span>
                    <span>⚡ {agent.stats.stamina}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'inspector' && selectedAgent && (
          <div className="inspector-tab">
            <div className="inspector-header">
              <h3>{selectedAgent.name}</h3>
              <div className="inspector-meta">
                {selectedAgent.age} years old • {selectedAgent.lifeStage} • {selectedAgent.nodeId}
              </div>
            </div>

            <div className="inspector-section">
              <h4>📊 Stats</h4>
              <div className="stats-row">
                <div>❤️ HP: {selectedAgent.stats.hp}/100</div>
                <div>⚡ Stamina: {selectedAgent.stats.stamina}/100</div>
                <div>🧠 Sanity: {selectedAgent.stats.sanity.toFixed(1)}/100</div>
              </div>
            </div>

            <div className="inspector-section">
              <h4>🎭 Personality</h4>
              <div className="traits-list">
                {Object.entries(selectedAgent.personality).map(([trait, value]) =>
                  renderPersonalityBar(trait, value as number)
                )}
              </div>
            </div>

            <div className="inspector-section">
              <h4>🎯 Needs</h4>
              <div className="needs-list">
                {Object.entries(selectedAgent.needs).map(([need, value]) =>
                  renderNeedsGauge(need, value as number)
                )}
              </div>
            </div>

            <div className="inspector-section">
              <h4>💔 Trauma Profile</h4>
              <div className="trauma-grid">
                {Object.entries(selectedAgent.traumaProfile).map(([trauma, value]) => (
                  <div key={trauma} className="trauma-item">
                    <span>{trauma}</span>
                    <span className={value as number > 50 ? 'high' : ''}>{(value as number).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="inspector-section">
              <h4>💞 Relationships ({Object.keys(selectedAgent.relationships).length})</h4>
              <div className="relationships-list">
                {Object.entries(selectedAgent.relationships).map(([targetId, rel]: [string, any]) => (
                  <div key={targetId} className="relationship-item">
                    <div className="rel-header">
                      Target: {targetId.substring(0, 8)}...
                    </div>
                    <div className="rel-stats">
                      <span>❤️ {rel.affection}</span>
                      <span>🔥 {rel.sexualAttraction}</span>
                      <span>🤝 {rel.trust}</span>
                      <span>😠 {rel.jealousy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="inspector-section">
              <h4>🧠 Memory ({selectedAgent.memory.events.length} events)</h4>
              <div className="memory-list">
                {selectedAgent.memory.events.slice(-10).reverse().map((event: any, i) => (
                  <div key={i} className="memory-item">
                    <span className="memory-type">{event.type}</span>
                    <span className="memory-impact">{event.emotionalImpact > 0 ? '+' : ''}{event.emotionalImpact}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDebugPanel;

