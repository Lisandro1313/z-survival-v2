import { useUIStore } from '../../store/uiStore'

interface Raid {
  type: string
  difficulty: number
  [key: string]: unknown
}

export function onRaidStarted(payload: { raid: Raid }) {
  const { raid } = payload
  useUIStore.getState().setMode('combat')
  useUIStore.getState().addNotification({
    type: 'warning',
    message: `¡Raid iniciado! ${raid.type} - Dificultad ${raid.difficulty}★`
  })
}

interface Wave {
  number: number
  enemies: unknown[]
  [key: string]: unknown
}

export function onRaidWave(payload: { raid?: Raid; wave: Wave }) {
  const { wave } = payload
  useUIStore.getState().addNotification({
    type: 'warning',
    message: `Oleada ${wave.number} - ${wave.enemies.length} enemigos`
  })
}

interface Defense {
  type: string
  [key: string]: unknown
}

export function onRaidDefenseTriggered(payload: { defense: Defense; damage: number }) {
  const { defense, damage } = payload
  console.log('[Raid] Defense triggered:', defense.type, 'damage:', damage)
}

interface Rewards {
  caps: number
  [key: string]: unknown
}

export function onRaidCompleted(payload: { raid?: Raid; rewards: Rewards }) {
  const { rewards } = payload
  useUIStore.getState().addNotification({
    type: 'success',
    message: `¡Raid completado! Recompensas: ${rewards.caps} caps`
  })
}

export function onRaidFailed(): void {
  useUIStore.getState().addNotification({
    type: 'error',
    message: `Raid fallido. El refugio perdió estabilidad.`
  })
}
