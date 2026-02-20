import { useUIStore } from '../../store/uiStore'

export function onNarrativeMissions(payload: { missions?: unknown[] }) {
  console.log('[Narrative] Missions available:', payload)
  // Update narrative missions store
}

interface Mission {
  title: string
  [key: string]: unknown
}

export function onNarrativeStarted(payload: { mission: Mission }) {
  const { mission } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `Misión narrativa iniciada: ${mission.title}`
  })
  // Open narrative modal
}

interface Step {
  description: string
  [key: string]: unknown
}

export function onNarrativeNextStep(payload: { mission?: Mission; step: Step }) {
  const { step } = payload
  console.log('[Narrative] Next step:', step.description)
  // Update narrative modal with new step
}

export function onNarrativeCompleted(payload: { mission: Mission; rewards?: unknown }) {
  const { mission } = payload
  useUIStore.getState().addNotification({
    type: 'success',
    message: `¡Misión completada! ${mission.title}`
  })
}
