import { useUIStore } from '../../store/uiStore'
import { useQuestStore } from '../../store/questStore'

interface Mission {
  id: string
  title: string
  [key: string]: unknown
}

interface Rewards {
  xp: number
  caps: number
  [key: string]: unknown
}

export function onMissionsList(payload: { missions?: Mission[] }) {
  const { missions } = payload
  if (missions && Array.isArray(missions)) {
    useQuestStore.getState().setQuests(missions)
  }
  console.log('[Quests] Missions loaded:', missions?.length)
}

export function onMissionNew(payload: { mission: Mission }) {
  const { mission } = payload
  useQuestStore.getState().addQuest(mission)
  useUIStore.getState().addNotification({
    type: 'info',
    message: `Nueva misión: ${mission.title}`
  })
}

export function onMissionAccepted(payload: { mission: Mission }) {
  const { mission } = payload
  useQuestStore.getState().acceptQuest(mission.id)
  useUIStore.getState().addNotification({
    type: 'success',
    message: `Misión aceptada: ${mission.title}`
  })
}

export function onMissionCompleted(payload: { mission: Mission; rewards: Rewards }) {
  const { mission, rewards } = payload
  useQuestStore.getState().completeQuest(mission.id)
  useUIStore.getState().addNotification({
    type: 'success',
    message: `¡Misión completada! +${rewards.xp} XP, +${rewards.caps} caps`
  })
}

export function onMissionExpired(payload: { mission: Mission }) {
  const { mission } = payload
  useQuestStore.getState().updateQuest(mission.id, { status: 'expired' })
  useUIStore.getState().addNotification({
    type: 'warning',
    message: `Misión expirada: ${mission.title}`
  })
}
