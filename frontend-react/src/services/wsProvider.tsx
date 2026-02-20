import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { WebSocketService } from './websocket'

// ============================================================================
// WEBSOCKET PROVIDER - React context para WebSocket
// ============================================================================

interface WSContextValue {
  ws: WebSocketService
  isConnected: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  error: string | null
}

const WSContext = createContext<WSContextValue | null>(null)

interface WSProviderProps {
  children: React.ReactNode
  url?: string
  autoConnect?: boolean
}

/**
 * Provider para WebSocket
 * 
 * Proporciona instancia de WebSocket a toda la aplicación
 * Maneja conexión/reconexión automática
 */
export const WSProvider: React.FC<WSProviderProps> = ({ 
  children, 
  url,
  autoConnect = true 
}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<WSContextValue['connectionStatus']>('disconnected')
  const [error, setError] = useState<string | null>(null)
  
  // Crear instancia singleton de WebSocket
  const ws = useMemo(() => {
    const service = new WebSocketService(url)
    
    // Listeners para actualizar estado de conexión
    service.on('connecting', () => {
      setConnectionStatus('connecting')
      setError(null)
    })
    
    service.on('connected', () => {
      setConnectionStatus('connected')
      setIsConnected(true)
      setError(null)
      console.log('[WSProvider] Connected to server')
    })
    
    service.on('disconnected', () => {
      setConnectionStatus('disconnected')
      setIsConnected(false)
      console.log('[WSProvider] Disconnected from server')
    })
    
    service.on('reconnecting', (attempt: number) => {
      setConnectionStatus('reconnecting')
      console.log(`[WSProvider] Reconnecting... attempt ${attempt}`)
    })
    
    service.on('error', (err: Error) => {
      setConnectionStatus('error')
      setError(err.message)
      console.error('[WSProvider] Error:', err)
    })
    
    return service
  }, [url])
  
  // Auto-conectar al montar
  useEffect(() => {
    if (autoConnect) {
      ws.connect().catch(err => {
        console.error('[WSProvider] Failed to connect:', err)
      })
    }
    
    // Cleanup al desmontar
    return () => {
      ws.disconnect()
    }
  }, [ws, autoConnect])
  
  const value: WSContextValue = {
    ws,
    isConnected,
    connectionStatus,
    error
  }
  
  return (
    <WSContext.Provider value={value}>
      {children}
    </WSContext.Provider>
  )
}

/**
 * Hook para usar WebSocket en componentes
 * 
 * @example
 * const { ws, isConnected } = useWS()
 * ws.send('world:move', { nodeId: 'node-1' })
 */
export function useWS(): WSContextValue {
  const context = useContext(WSContext)
  
  if (!context) {
    throw new Error('useWS must be used within WSProvider')
  }
  
  return context
}

/**
 * Hook para verificar solo si está conectado
 * 
 * @example
 * const isConnected = useWSConnection()
 */
export function useWSConnection(): boolean {
  const { isConnected } = useWS()
  return isConnected
}

/**
 * Hook para obtener estado de conexión
 * 
 * @example
 * const status = useWSStatus()
 * if (status === 'reconnecting') { ... }
 */
export function useWSStatus(): WSContextValue['connectionStatus'] {
  const { connectionStatus } = useWS()
  return connectionStatus
}

// ============================================================================
// CONNECTION STATUS COMPONENT (opcional)
// ============================================================================

/**
 * Componente para mostrar estado de conexión
 * 
 * @example
 * <WSConnectionIndicator />
 */
export const WSConnectionIndicator: React.FC = () => {
  const { connectionStatus, error } = useWS()
  
  if (connectionStatus === 'connected') return null
  
  const statusMessages = {
    disconnected: 'Desconectado del servidor',
    connecting: 'Conectando...',
    reconnecting: 'Reconectando...',
    error: error || 'Error de conexión'
  }
  
  const statusColors = {
    disconnected: 'bg-gray-500',
    connecting: 'bg-yellow-500',
    reconnecting: 'bg-orange-500',
    error: 'bg-red-500'
  }
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-white ${statusColors[connectionStatus]}`}>
      {statusMessages[connectionStatus]}
    </div>
  )
}
