import { useUIStore } from '../../store/uiStore'

interface NPC {
  name: string
  [key: string]: unknown
}

export function onTrustData(payload: { npc?: NPC; trust?: unknown }) {
  console.log('[Trust] Data for NPC:', payload)
  // Update trust store when implemented
}

export function onTrustAllData(payload: { relationships?: unknown[] }) {
  console.log('[Trust] All trust relationships:', payload)
  // Update trust store with all NPCs
}

export function onTrustUpdated(payload: { npc: NPC; oldLevel?: number; newLevel?: number; delta: number }) {
  const { npc, delta } = payload
  const message = delta > 0 
    ? `Tu relación con ${npc.name} mejoró (+${delta})`
    : `Tu relación con ${npc.name} empeoró (${delta})`
  
  useUIStore.getState().addNotification({
    type: delta > 0 ? 'success' : 'warning',
    message
  })
}

export function onTrustGiftGiven(payload: { npc: NPC; gift?: unknown; trustGain: number }) {
  const { npc, trustGain } = payload
  useUIStore.getState().addNotification({
    type: 'success',
    message: `${npc.name} apreció tu regalo (+${trustGain} trust)`
  })
}
