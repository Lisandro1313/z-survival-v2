import { create } from 'zustand'
import type { GameEvent, GlobalEvent, LocalEvent, EventId, NodeId } from '../types/world'

// ============================================================================
// EVENT STORE - Sistema de eventos separado
// ============================================================================

/**
 * Store para eventos globales y locales
 * 
 * - GlobalEvent: Afecta múltiples nodos (hordas, sequías, eclipses)
 * - LocalEvent: Afecta un solo nodo (oleadas zombies, mercantes, bandidos)
 */

interface EventStoreState {
  // State
  events: Record<EventId, GameEvent>
  activeGlobalEvents: EventId[]
  eventsByNode: Record<NodeId, EventId[]> // Index para queries rápidas
  
  // Actions
  setEvents: (events: Record<EventId, GameEvent>) => void
  addEvent: (event: GameEvent) => void
  removeEvent: (eventId: EventId) => void
  updateEvent: (eventId: EventId, updates: Partial<GameEvent>) => void
  
  // Queries
  getActiveEvents: () => GameEvent[]
  getGlobalEvents: () => GlobalEvent[]
  getLocalEvents: (nodeId?: NodeId) => LocalEvent[]
  getEventsForNode: (nodeId: NodeId) => GameEvent[]
  isEventActive: (eventId: EventId) => boolean
  
  // Utility
  clearEvents: () => void
  pruneExpiredEvents: () => void
}

const initialState = {
  events: {},
  activeGlobalEvents: [],
  eventsByNode: {}
}

export const useEventStore = create<EventStoreState>((set, get) => ({
  ...initialState,
  
  // ========================================
  // ACTIONS
  // ========================================
  
  setEvents: (events) => {
    // Rebuild indexes
    const activeGlobalEvents: EventId[] = []
    const eventsByNode: Record<NodeId, EventId[]> = {}
    
    Object.values(events).forEach(event => {
      if ('affectedNodes' in event) {
        activeGlobalEvents.push(event.id)
        event.affectedNodes.forEach(nodeId => {
          if (!eventsByNode[nodeId]) eventsByNode[nodeId] = []
          eventsByNode[nodeId].push(event.id)
        })
      } else {
        if (!eventsByNode[event.nodeId]) eventsByNode[event.nodeId] = []
        eventsByNode[event.nodeId].push(event.id)
      }
    })
    
    set({ events, activeGlobalEvents, eventsByNode })
  },
  
  addEvent: (event) => {
    set((state) => {
      const newEvents = { ...state.events, [event.id]: event }
      const newActiveGlobal = [...state.activeGlobalEvents]
      const newEventsByNode = { ...state.eventsByNode }
      
      if ('affectedNodes' in event) {
        newActiveGlobal.push(event.id)
        event.affectedNodes.forEach(nodeId => {
          if (!newEventsByNode[nodeId]) newEventsByNode[nodeId] = []
          newEventsByNode[nodeId] = [...newEventsByNode[nodeId], event.id]
        })
      } else {
        if (!newEventsByNode[event.nodeId]) newEventsByNode[event.nodeId] = []
        newEventsByNode[event.nodeId] = [...newEventsByNode[event.nodeId], event.id]
      }
      
      return {
        events: newEvents,
        activeGlobalEvents: newActiveGlobal,
        eventsByNode: newEventsByNode
      }
    })
  },
  
  removeEvent: (eventId) => {
    set((state) => {
      const event = state.events[eventId]
      if (!event) return state
      
      const { [eventId]: removed, ...remainingEvents } = state.events
      const newActiveGlobal = state.activeGlobalEvents.filter(id => id !== eventId)
      const newEventsByNode = { ...state.eventsByNode }
      
      if ('affectedNodes' in event) {
        event.affectedNodes.forEach(nodeId => {
          if (newEventsByNode[nodeId]) {
            newEventsByNode[nodeId] = newEventsByNode[nodeId].filter(id => id !== eventId)
          }
        })
      } else {
        if (newEventsByNode[event.nodeId]) {
          newEventsByNode[event.nodeId] = newEventsByNode[event.nodeId].filter(id => id !== eventId)
        }
      }
      
      return {
        events: remainingEvents,
        activeGlobalEvents: newActiveGlobal,
        eventsByNode: newEventsByNode
      }
    })
  },
  
  updateEvent: (eventId, updates) => {
    set((state) => {
      const event = state.events[eventId]
      if (!event) return state
      
      return {
        events: {
          ...state.events,
          [eventId]: { ...event, ...updates } as GameEvent
        }
      }
    })
  },
  
  // ========================================
  // QUERIES
  // ========================================
  
  getActiveEvents: () => {
    const now = Date.now()
    return Object.values(get().events).filter(event => 
      event.startTime <= now && event.endTime > now
    )
  },
  
  getGlobalEvents: () => {
    return get().activeGlobalEvents
      .map(id => get().events[id])
      .filter(Boolean)
      .filter(event => 'affectedNodes' in event) as GlobalEvent[]
  },
  
  getLocalEvents: (nodeId?: NodeId) => {
    const allEvents = Object.values(get().events).filter(
      event => 'nodeId' in event
    ) as LocalEvent[]
    
    if (nodeId) {
      return allEvents.filter(event => event.nodeId === nodeId)
    }
    return allEvents
  },
  
  getEventsForNode: (nodeId) => {
    const eventIds = get().eventsByNode[nodeId] || []
    return eventIds.map(id => get().events[id]).filter(Boolean)
  },
  
  isEventActive: (eventId) => {
    const event = get().events[eventId]
    if (!event) return false
    const now = Date.now()
    return event.startTime <= now && event.endTime > now
  },
  
  // ========================================
  // UTILITY
  // ========================================
  
  clearEvents: () => set(initialState),
  
  pruneExpiredEvents: () => {
    const now = Date.now()
    set((state) => {
      const activeEvents: Record<EventId, GameEvent> = {}
      
      Object.values(state.events).forEach(event => {
        if (event.endTime > now) {
          activeEvents[event.id] = event
        }
      })
      
      // Rebuild indexes
      const activeGlobalEvents: EventId[] = []
      const eventsByNode: Record<NodeId, EventId[]> = {}
      
      Object.values(activeEvents).forEach(event => {
        if ('affectedNodes' in event) {
          activeGlobalEvents.push(event.id)
          event.affectedNodes.forEach(nodeId => {
            if (!eventsByNode[nodeId]) eventsByNode[nodeId] = []
            eventsByNode[nodeId].push(event.id)
          })
        } else {
          if (!eventsByNode[event.nodeId]) eventsByNode[event.nodeId] = []
          eventsByNode[event.nodeId].push(event.id)
        }
      })
      
      return {
        events: activeEvents,
        activeGlobalEvents,
        eventsByNode
      }
    })
  }
}))

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Obtener eventos activos en nodo con intensidad
 */
export const selectActiveEventsInNode = (state: EventStoreState, nodeId: NodeId) => {
  return state.getEventsForNode(nodeId).filter(event => state.isEventActive(event.id))
}

/**
 * Verificar si hay eventos peligrosos activos
 */
export const selectHasDangerousEvents = (state: EventStoreState, nodeId: NodeId): boolean => {
  const events = state.getEventsForNode(nodeId)
  return events.some(event => {
    if ('affectedNodes' in event) {
      return event.type === 'horde' || event.type === 'plague'
    }
    return event.type === 'zombieWave' || event.type === 'bandits'
  })
}
