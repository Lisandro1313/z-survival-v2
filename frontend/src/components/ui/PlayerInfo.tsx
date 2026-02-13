/**
 * 👤 PLAYER INFO - Información del jugador
 */

import type { Player } from '../../types';
import './PlayerInfo.css';

interface Props {
  player: Player;
}

function PlayerInfo({ player }: Props) {
  const healthPercent = (player.stats.hp / player.stats.maxHp) * 100;

  return (
    <div className="player-info">
      <div className="player-name">
        <h3>{player.nombre}</h3>
        <span className="player-level">Lv. {player.nivel}</span>
      </div>

      <div className="player-stats">
        <div className="stat-bar">
          <span>❤️ HP</span>
          <div className="bar">
            <div className="bar-fill hp" style={{ width: `${healthPercent}%` }} />
          </div>
          <span>{player.stats.hp}/{player.stats.maxHp}</span>
        </div>

        <div className="stat-row">
          <span>🍗 {Math.round(player.stats.hambre)}%</span>
          <span>💧 {Math.round(player.stats.sed)}%</span>
          <span>⚡ {Math.round(player.stats.energia)}%</span>
        </div>
      </div>

      {player.equippedRadio && (
        <div className="player-radio-status">
          <span className="radio-indicator">📻</span>
          <span className="battery-mini">
            {player.equippedRadio.batteryPercent}%
          </span>
        </div>
      )}
    </div>
  );
}

export default PlayerInfo;
