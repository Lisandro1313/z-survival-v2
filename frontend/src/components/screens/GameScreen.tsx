/**
 * 🎮 GAME SCREEN - Pantalla principal del juego
 */

import { useGameStore } from '../../stores/gameStore';
import RadioPanel from '../ui/RadioPanel';
import ChatWindow from '../ui/ChatWindow';
import PlayerInfo from '../ui/PlayerInfo';
import NodeInfo from '../ui/NodeInfo';
import Notifications from '../ui/Notifications';
import { NotificationPanel } from '../NotificationPanel';
import './GameScreen.css';

function GameScreen() {
  const { player, currentNode, ui } = useGameStore();

  if (!player) {
    return <div>Error: No player data</div>;
  }

  return (
    <div className="game-screen">
      {/* Header */}
      <header className="game-header">
        <h1>🧟 Z-Survival v2.0</h1>
        <div className="header-right">
          <PlayerInfo player={player} />
          <NotificationPanel />
        </div>
      </header>

      {/* Main Game Area */}
      <main className="game-main">
        <div className="game-left">
          <NodeInfo node={currentNode} />
          <ChatWindow />
        </div>

        <div className="game-center">
          <div className="game-canvas">
            <h2>🗺️ Mundo del Juego</h2>
            <p>Vista 3D / Isométrica (En desarrollo)</p>
            {currentNode && (
              <div className="current-location">
                <h3>{currentNode.nombre}</h3>
                <p>{currentNode.descripcion}</p>
              </div>
            )}
          </div>
        </div>

        <div className="game-right">
          {ui.activePanel === 'radio' && <RadioPanel />}
          {ui.activePanel === null && (
            <div className="panel-placeholder">
              <p>Selecciona un panel</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer / Quick Actions */}
      <footer className="game-footer">
        <QuickActions />
      </footer>

      {/* Notifications */}
      <Notifications />
    </div>
  );
}

function QuickActions() {
  const { setActivePanel, ui } = useGameStore();

  return (
    <div className="quick-actions">
      <button 
        className={ui.activePanel === 'radio' ? 'active' : ''}
        onClick={() => setActivePanel(ui.activePanel === 'radio' ? null : 'radio')}
      >
        📻 Radio
      </button>
      <button onClick={() => setActivePanel('inventory')}>
        🎒 Inventario
      </button>
      <button onClick={() => setActivePanel('map')}>
        🗺️ Mapa
      </button>
      <button onClick={() => setActivePanel('stats')}>
        📊 Stats
      </button>
    </div>
  );
}

export default GameScreen;
