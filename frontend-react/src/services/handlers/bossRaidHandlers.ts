import { useUIStore } from '../../store/uiStore'

export function onBosseslist(payload: { bosses?: unknown[] }) {
  console.log('[BossRaid] Bosses list:', payload)
  // Update boss raid store when implemented
}

export function onActiveRaids(payload: { raids?: unknown[] }) {
  console.log('[BossRaid] Active raids:', payload)
  // Update active boss raids list
}

interface Boss {
  name: string
  tier: number
  [key: string]: unknown
}

export function onBossSpawned(payload: { boss: Boss }) {
  const { boss } = payload
  useUIStore.getState().addNotification({
    type: 'warning',
    message: `¡Boss spawneado! ${boss.name} - Tier ${boss.tier}`
  })
}

interface Player {
  name: string
  [key: string]: unknown
}

export function onPlayerJoined(payload: { raid?: unknown; player: Player }) {
  const { player } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `${player.name} se unió al boss raid`
  })
}

export function onAttackResult(payload: { raid?: unknown; player: Player; damage: number; isCrit: boolean }) {
  const { player, damage, isCrit } = payload
  console.log('[BossRaid] Attack:', player.name, 'dealt', damage, isCrit ? '(CRIT)' : '')
  // Update combat log
}

interface Phase {
  number: number
  description: string
  [key: string]: unknown
}

export function onPhaseChange(payload: { raid?: unknown; phase: Phase }) {
  const { phase } = payload
  useUIStore.getState().addNotification({
    type: 'warning',
    message: `¡Fase ${phase.number}! ${phase.description}`
  })
}

export function onVictory(): void {
  useUIStore.getState().addNotification({
    type: 'success',
    message: `¡Boss derrotado! Loot obtenido.`
  })
}

export function onLeaderboard(payload: { leaderboard?: unknown[] }) {
  console.log('[BossRaid] Leaderboard:', payload)
  // Update leaderboard view
}

interface Achievement {
  name: string
  [key: string]: unknown
}

export function onAchievements(payload: { achievement: Achievement }) {
  const { achievement } = payload
  useUIStore.getState().addNotification({
    type: 'success',
    message: `¡Logro desbloqueado! ${achievement.name}`
  })
}
