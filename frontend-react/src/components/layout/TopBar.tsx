import React from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';

const TopBar: React.FC = () => {
  const { player } = usePlayerStore();
  const { currentNode } = useUIStore();
  
  // Mock data for time/weather until we integrate with world state
  const time = Date.now();
  const weather = 'clear';

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTimeOfDay = (timestamp: number) => {
    const hour = new Date(timestamp).getHours();
    if (hour >= 6 && hour < 12) return '🌅 Mañana';
    if (hour >= 12 && hour < 18) return '☀️ Tarde';
    if (hour >= 18 && hour < 22) return '🌆 Atardecer';
    return '🌙 Noche';
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'clear': return '☀️';
      case 'cloudy': return '☁️';
      case 'rain': return '🌧️';
      case 'storm': return '⛈️';
      case 'fog': return '🌫️';
      default: return '☀️';
    }
  };

  return (
    <div className="top-bar">
      <div className="top-bar-section left">
        <div className="game-title">
          🧟 MANOLITRI SURVIVAL
        </div>
      </div>

      <div className="top-bar-section center">
        {player && (
          <>
            <div className="stat-item">
              <span className="stat-icon">❤️</span>
              <span className="stat-value">{player.hp}</span>
              <span className="stat-max">/100</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚡</span>
              <span className="stat-value">{player.stamina}</span>
              <span className="stat-max">/100</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🍖</span>
              <span className="stat-value">{player.hunger}</span>
              <span className="stat-max">/100</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💧</span>
              <span className="stat-value">{player.thirst}</span>
              <span className="stat-max">/100</span>
            </div>
          </>
        )}
      </div>

      <div className="top-bar-section right">
        <div className="time-weather">
          <div className="time">
            {getTimeOfDay(time)} {formatTime(time)}
          </div>
          <div className="weather">
            {getWeatherIcon(weather)} {weather}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

