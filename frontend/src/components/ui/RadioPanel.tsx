/**
 * 📻 RADIO PANEL - Panel de radio con walkie-talkie
 */

import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import RadioService from '../../services/radioService';
import './RadioPanel.css';

function RadioPanel() {
  const { player } = useGameStore();
  const { send } = useWebSocket();
  const radioService = new RadioService(send);

  const [frequency, setFrequency] = useState('104.5');
  const [message, setMessage] = useState('');
  const [showEquipMenu, setShowEquipMenu] = useState(false);

  const radio = player?.equippedRadio;

  // ====================================
  // EQUIP RADIO
  // ====================================

  const handleEquipRadio = (radioType: string) => {
    radioService.equipRadio(radioType, 'BATTERY_RECHARGEABLE');
    setShowEquipMenu(false);
  };

  // ====================================
  // FREQUENCY
  // ====================================

  const handleJoinFrequency = () => {
    if (!frequency) return;
    radioService.joinFrequency(frequency);
  };

  const handleLeaveFrequency = (freq: string) => {
    radioService.leaveFrequency(freq);
  };

  // ====================================
  // SEND MESSAGE
  // ====================================

  const handleSendMessage = () => {
    if (!message.trim() || !radio?.activeChannels.length) return;
    
    const activeFreq = radio.activeChannels[0];
    radioService.sendMessage(activeFreq, message);
    setMessage('');
  };

  // ====================================
  // RENDER
  // ====================================

  if (!radio) {
    return (
      <div className="radio-panel">
        <h3>📻 Radio</h3>
        <div className="radio-status no-radio">
          <p>No tienes radio equipado</p>
          
          <button 
            className="btn-primary"
            onClick={() => setShowEquipMenu(!showEquipMenu)}
          >
            Equipar Radio
          </button>

          {showEquipMenu && (
            <div className="equip-menu">
              <button onClick={() => handleEquipRadio('WALKIE_LV1')}>
                📻 Walkie Básico (Nodo)
              </button>
              <button onClick={() => handleEquipRadio('WALKIE_LV2')}>
                📻 Walkie Militar (Región)
              </button>
              <button onClick={() => handleEquipRadio('WALKIE_LV3')}>
                📻 Radio Global
              </button>
              <button onClick={() => handleEquipRadio('SCANNER')}>
                🔍 Scanner
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="radio-panel">
      <h3>📻 {radio.name}</h3>

      {/* Battery Status */}
      <div className="radio-battery">
        <div className="battery-bar">
          <div 
            className="battery-fill"
            style={{ width: `${radio.batteryPercent}%` }}
          />
        </div>
        <span className="battery-text">
          🔋 {radio.batteryPercent}% 
          {radio.batteryPercent < 20 && ' ⚠️'}
        </span>
      </div>

      {/* Active Channels */}
      <div className="radio-channels">
        <h4>Frecuencias Activas</h4>
        {radio.activeChannels.length === 0 ? (
          <p className="no-channels">No hay frecuencias sintonizadas</p>
        ) : (
          <ul className="channel-list">
            {radio.activeChannels.map((freq) => (
              <li key={freq} className="channel-item">
                <span className="channel-freq">📡 {freq}</span>
                <button 
                  className="btn-small"
                  onClick={() => handleLeaveFrequency(freq)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Join Frequency */}
      {radio.activeChannels.length < radio.maxChannels && (
        <div className="radio-join">
          <input
            type="text"
            placeholder="104.5"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          />
          <button onClick={handleJoinFrequency}>Sintonizar</button>
        </div>
      )}

      {/* Send Message */}
      {radio.activeChannels.length > 0 && (
        <div className="radio-message">
          <textarea
            placeholder="Mensaje por radio..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!radio.canTransmit}
          >
            📡 Transmitir
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="radio-actions">
        {radio.canIntercept && (
          <button onClick={() => radioService.enableScanner()}>
            🔍 Activar Scanner
          </button>
        )}
        <button onClick={() => radioService.getStatus()}>
          📊 Estado
        </button>
        <button 
          className="btn-danger"
          onClick={() => radioService.unequipRadio()}
        >
          Desequipar
        </button>
      </div>
    </div>
  );
}

export default RadioPanel;
