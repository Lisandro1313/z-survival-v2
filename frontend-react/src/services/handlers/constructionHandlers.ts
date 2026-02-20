import { useUIStore } from '../../store/uiStore'

interface Project {
  name: string
  [key: string]: unknown
}

export function onConstructionStarted(payload: { project: Project }) {
  const { project } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `Construcción iniciada: ${project.name}`
  })
}

export function onConstructionProgress(payload: { project: Project; progress: number }) {
  const { project, progress } = payload
  console.log('[Construction] Progress:', project.name, `${progress}%`)
  // Update construction store when implemented
}

export function onConstructionCompleted(payload: { project: Project }) {
  const { project } = payload
  useUIStore.getState().addNotification({
    type: 'success',
    message: `¡Construcción completada! ${project.name}`
  })
}

export function onConstructionContributed(payload: { project: Project; contributor: string; amount: number }) {
  const { project, contributor, amount } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `${contributor} contribuyó ${amount} recursos a ${project.name}`
  })
}
