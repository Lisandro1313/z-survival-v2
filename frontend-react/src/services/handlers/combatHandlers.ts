import { useCombatStore } from '../../store/combatStore'
import { usePlayerStore } from '../../store/playerStore'
import { useUIStore } from '../../store/uiStore'
import type { 
  CombatStartedPayload, 
  CombatTurnResultPayload,
  CombatVictoryPayload 
} from '../../types/messages'

export function onCombatStarted(payload: unknown): void {
  const data = payload as CombatStartedPayload
  
  useCombatStore.getState().startCombat(
    data.combatId,
    data.enemy,
    data.playerHp
  )
  
  useUIStore.getState().setMode('combat')
  
  console.log('[Handler] Combat started:', data.enemy.name)
}

export function onCombatTurnResult(payload: unknown): void {
  const data = payload as CombatTurnResultPayload
  
  useCombatStore.getState().updateCombat({
    playerHp: data.attackerHp,
    enemyHp: data.defenderHp
  })
  
  useCombatStore.getState().addLogEntry({
    type: data.isCritical ? 'critical' : 'attack',
    message: `${data.attacker} golpea a ${data.defender} por ${data.damage} de daño${data.isCritical ? ' ¡CRÍTICO!' : ''}`,
    attacker: data.attacker,
    damage: data.damage
  })
  
  console.log('[Handler] Combat turn:', data)
}

export function onCombatVictory(payload: unknown): void {
  const data = payload as CombatVictoryPayload
  
  usePlayerStore.getState().updatePlayer({
    xp: (usePlayerStore.getState().player?.xp || 0) + data.xp,
    caps: (usePlayerStore.getState().player?.caps || 0) + data.caps
  })
  
  useUIStore.getState().addNotification({
    type: 'success',
    message: `¡Victoria! +${data.xp} XP, +${data.caps} caps`,
    duration: 5000
  })
  
  setTimeout(() => {
    useCombatStore.getState().endCombat()
    useUIStore.getState().setMode('dashboard')
  }, 3000)
  
  console.log('[Handler] Combat victory:', data)
}

export function onCombatDefeat(): void {
  useUIStore.getState().addNotification({
    type: 'error',
    message: 'Has sido derrotado...',
    duration: 5000
  })
  
  setTimeout(() => {
    useCombatStore.getState().endCombat()
    useUIStore.getState().setMode('dashboard')
  }, 3000)
  
  console.log('[Handler] Combat defeat')
}

export function onCombatFlee(): void {
  useUIStore.getState().addNotification({
    type: 'warning',
    message: 'Escapaste del combate',
    duration: 3000
  })
  
  useCombatStore.getState().endCombat()
  useUIStore.getState().setMode('dashboard')
  
  console.log('[Handler] Combat flee')
}
