import { useWorldStore } from '../../store/worldStore'
import { usePlayerStore } from '../../store/playerStore'
import type { WorldStatePayload, EntityUpdatePayload } from '../../types/messages'

export function onWorldState(payload: unknown): void {
  const data = payload as WorldStatePayload
  
  // 🔧 Fix: worldStore no tiene setWorld, usar setGraph
  if (data.nodes) {
    useWorldStore.getState().setGraph({ nodes: data.nodes, edges: {} })
  }
  if (data.currentNode) {
    useWorldStore.getState().setCurrentNode(data.currentNode)
  }
  
  console.log('[Handler] World state loaded')
}

export function onWorldUpdate(payload: unknown): void {
  const data = payload as WorldStatePayload
  // 🔧 Fix: Actualizar solo lo que venga en el payload
  if (data.nodes) useWorldStore.getState().setGraph({ nodes: data.nodes, edges: {} })
  if (data.currentNode) useWorldStore.getState().setCurrentNode(data.currentNode)
  console.log('[Handler] World updated')
}

export function onMoved(payload: unknown): void {
  const data = payload as { location: string; message?: string }
  
  usePlayerStore.getState().updatePlayer({
    location: data.location
  })
  
  useWorldStore.getState().setCurrentNode(data.location)
  
  console.log('[Handler] Player moved to:', data.location)
}

export function onEntityUpdate(payload: unknown): void {
  const data = payload as EntityUpdatePayload
  
  // Convert array to Record if needed
  const entitiesRecord = Array.isArray(data.entities)
    ? data.entities.reduce((acc, entity) => {
        acc[entity.id] = entity
        return acc
      }, {} as Record<string, typeof data.entities[0]>)
    : data.entities
  
  useWorldStore.getState().setEntities(entitiesRecord)
  
  console.log('[Handler] Entities updated:', Array.isArray(data.entities) ? data.entities.length : Object.keys(data.entities).length)
}

export function onActiveEvents(payload: unknown): void {
  const eventsArray = payload as { id: string; [key: string]: unknown }[]
  
  // Convert array to Record
  const eventsRecord = eventsArray.reduce((acc, event) => {
    acc[event.id] = event
    return acc
  }, {} as Record<string, typeof eventsArray[0]>)
  
  useWorldStore.getState().setEvents(eventsRecord)
  
  console.log('[Handler] Active events:', eventsArray.length)
}
