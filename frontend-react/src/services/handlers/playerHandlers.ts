import { usePlayerStore } from '../../store/playerStore'
import { useUIStore } from '../../store/uiStore'
import type { PlayerDataPayload, PlayerUpdatePayload } from '../../types/messages'

export function onPlayerData(payload: unknown): void {
  const data = payload as PlayerDataPayload
  
  usePlayerStore.getState().setPlayer({
    id: data.id,
    username: data.username,
    level: data.level,
    xp: data.xp,
    hp: data.hp,
    maxHp: data.maxHp,
    hunger: data.hunger,
    stamina: data.stamina,
    location: data.location,
    inventory: data.inventory as any[],
    caps: data.caps
  })
  
  console.log('[Handler] Player data loaded:', data.username)
}

export function onPlayerUpdate(payload: unknown): void {
  const data = payload as PlayerUpdatePayload
  
  usePlayerStore.getState().updatePlayer(data)
  
  console.log('[Handler] Player updated:', data)
}

export function onPlayerLevelUp(payload: unknown): void {
  const data = payload as { level: number; xp: number }
  
  usePlayerStore.getState().updatePlayer({
    level: data.level,
    xp: data.xp
  })
  
  useUIStore.getState().addNotification({
    type: 'success',
    message: `¡Subiste al nivel ${data.level}!`,
    duration: 5000
  })
  
  console.log('[Handler] Player level up:', data.level)
}
