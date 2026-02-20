import { useUIStore } from '../../store/uiStore'
import type { RadioReceivePayload } from '../../types/messages'

export function onRadioReceive(payload: unknown): void {
  const data = payload as RadioReceivePayload
  
  useUIStore.getState().addNotification({
    type: 'info',
    message: `📻 [${data.freq}] ${data.from}: ${data.message}`,
    duration: 8000
  })
  
  console.log('[Handler] Radio message:', data)
}

export function onRadioJoined(payload: unknown): void {
  const data = payload as { freq: number }
  
  useUIStore.getState().addNotification({
    type: 'success',
    message: `Conectado a frecuencia ${data.freq}`,
    duration: 3000
  })
  
  console.log('[Handler] Joined radio freq:', data.freq)
}
