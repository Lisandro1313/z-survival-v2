import { useNavigate } from 'react-router-dom'
import { useCombatStore } from '../../store/combatStore'
import { ws } from '../../services/websocket'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import './Combat.css'

export default function Combat() {
  const navigate = useNavigate()
  const combat = useCombatStore()
  
  if (!combat.isActive || !combat.enemy) {
    return (
      <div className="combat combat-inactive">
        <Card variant="glass">
          <h2>No hay combate activo</h2>
          <Button onClick={() => navigate('/')}>Volver al Dashboard</Button>
        </Card>
      </div>
    )
  }
  
  const enemyHpPercent = (combat.enemy.hp / combat.enemy.maxHp) * 100
  
  const handleAttack = () => {
    if (!combat.isPlayerTurn) return
    ws.send('combat:attack', { combatId: combat.combatId })
  }
  
  const handleFlee = () => {
    ws.send('combat:flee', { combatId: combat.combatId })
  }
  
  return (
    <div className="combat">
      <div className="combat-area">
        <Card title="Combate" variant="danger">
          {/* Enemy */}
          <div className="combat-enemy">
            <div className="enemy-avatar">
              🧟
            </div>
            <div className="enemy-info">
              <h3>{combat.enemy.name}</h3>
              <div className="enemy-level">Nivel {combat.enemy.level}</div>
              <div className="hp-bar">
                <div 
                  className="hp-fill" 
                  style={{ width: `${enemyHpPercent}%` }}
                />
              </div>
              <div className="hp-text">
                {combat.enemy.hp} / {combat.enemy.maxHp} HP
              </div>
            </div>
          </div>
          
          {/* Player Actions */}
          <div className="combat-actions">
            <h4>Tus Acciones</h4>
            <div className="action-buttons">
              <Button 
                variant="primary" 
                onClick={handleAttack}
                disabled={!combat.isPlayerTurn}
              >
                ⚔️ Ataque Rápido
              </Button>
              <Button 
                variant="secondary"
                disabled={!combat.isPlayerTurn}
              >
                🛡️ Defender
              </Button>
              <Button 
                variant="secondary"
                disabled={!combat.isPlayerTurn}
              >
                💊 Usar Item
              </Button>
              <Button 
                variant="danger"
                onClick={handleFlee}
              >
                🏃 Huir
              </Button>
            </div>
          </div>
          
          {/* Turn Indicator */}
          <div className={`turn-indicator ${combat.isPlayerTurn ? 'player-turn' : 'enemy-turn'}`}>
            {combat.isPlayerTurn ? 'TU TURNO' : 'TURNO DEL ENEMIGO'}
          </div>
        </Card>
      </div>
      
      <aside className="combat-log-panel">
        <Card title="Log de Combate" variant="glass">
          <div className="combat-log">
            {combat.log.length > 0 ? (
              combat.log.slice().reverse().map(entry => (
                <div key={entry.id} className={`log-entry log-${entry.type}`}>
                  <span className="log-time">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="log-message">{entry.message}</span>
                  {entry.damage && (
                    <span className="log-damage">{entry.damage} dmg</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted">Comienza el combate...</p>
            )}
          </div>
        </Card>
      </aside>
    </div>
  )
}
