import { ReactNode, useEffect } from 'react'
import { ws } from '../../services/websocket'
import TopBar from './TopBar'
import { NotificationContainer } from '../ui/Notification'
import './Shell.css'

interface ShellProps {
  children: ReactNode
}

export default function Shell({ children }: ShellProps) {
  useEffect(() => {
    // Connect WebSocket on mount
    ws.connect().then(() => {
      console.log('[Shell] WebSocket connected, requesting initial data...')
      
      // Solicitar datos iniciales después de conectar
      setTimeout(() => {
        ws.send('getMissions', {}) // Solicitar misiones
        ws.send('getWorldNodes', {}) // Solicitar nodos del mundo
        ws.send('getPlayerData', {}) // Solicitar datos del jugador
        console.log('[Shell] Requested initial data: missions, world nodes, player data')
      }, 500) // Pequeño delay para que el login se procese primero
    }).catch(console.error)
    
    // Cleanup on unmount
    return () => {
      ws.disconnect()
    }
  }, [])
  
  return (
    <div className="shell">
      <TopBar />
      <main className="shell-main">
        {children}
      </main>
      <NotificationContainer />
    </div>
  )
}

