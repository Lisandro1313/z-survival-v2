import type { WSMessage } from '../types/messages'
import { createHandlerRegistry, type HandlerRegistry } from './handlerRegistry'

type MessageHandler = (payload: unknown) => void
type EventListener = (...args: any[]) => void

/**
 * WebSocket Service - Gestión de conexión con servidor
 * 
 * Características:
 * - Auto-reconexión con backoff
 * - Sistema de eventos para UI
 * - Heartbeat para mantener conexión
 * - Handler registry automático
 */
export class WebSocketService {
  private ws: WebSocket | null = null
  private url: string
  private handlers: HandlerRegistry
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000
  private heartbeatInterval: number | null = null
  
  // Sistema de eventos para UI
  private eventListeners: Record<string, EventListener[]> = {}
  
  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_WS_URL || 'ws://localhost:3000'
    this.handlers = createHandlerRegistry()
  }
  
  // ========================================
  // EVENT EMITTER PATTERN
  // ========================================
  
  on(event: string, listener: EventListener): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(listener)
  }
  
  off(event: string, listener: EventListener): void {
    if (!this.eventListeners[event]) return
    this.eventListeners[event] = this.eventListeners[event].filter(l => l !== listener)
  }
  
  private emit(event: string, ...args: any[]): void {
    if (!this.eventListeners[event]) return
    this.eventListeners[event].forEach(listener => {
      try {
        listener(...args)
      } catch (error) {
        console.error(`[WS] Event listener error for ${event}:`, error)
      }
    })
  }
  
  // ========================================
  // CONNECTION MANAGEMENT
  // ========================================
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }
      
      this.emit('connecting')
      
      try {
        this.ws = new WebSocket(this.url)
        
        this.ws.onopen = () => {
          console.log('[WS] Connected to server')
          this.reconnectAttempts = 0
          this.startHeartbeat()
          
          // 🔑 Enviar login automático con playerId de localStorage
          const playerId = localStorage.getItem('playerId') || `player_${Date.now()}`
          if (!localStorage.getItem('playerId')) {
            localStorage.setItem('playerId', playerId)
          }
          this.ws?.send(JSON.stringify({ type: 'login', playerId }))
          console.log('[WS] Login sent:', playerId)
          
          this.emit('connected')
          resolve()
        }
        
        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('[WS] Parse error:', error)
            this.emit('error', new Error('Failed to parse message'))
          }
        }
        
        this.ws.onclose = (event) => {
          console.warn('[WS] Connection closed:', event.code, event.reason)
          this.stopHeartbeat()
          this.emit('disconnected')
          this.attemptReconnect()
        }
        
        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error)
          this.emit('error', new Error('WebSocket error'))
          reject(error)
        }
      } catch (error) {
        console.error('[WS] Connection failed:', error)
        this.emit('error', error as Error)
        reject(error)
      }
    })
  }
  
  disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.emit('disconnected')
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
  
  // ========================================
  // MESSAGE HANDLING
  // ========================================
  
  private handleMessage(message: WSMessage): void {
    const handler = this.handlers[message.type]
    
    if (handler) {
      try {
        // 🔧 Compatibilidad: Extraer payload o usar todo el mensaje excepto 'type'
        const payload = message.payload !== undefined 
          ? message.payload 
          : (() => {
              const { type, ...rest } = message as any
              return rest
            })()
        
        handler(payload)
        this.emit('message', message)
      } catch (error) {
        console.error(`[WS] Handler error for ${message.type}:`, error)
        this.emit('error', new Error(`Handler failed for ${message.type}`))
      }
    } else {
      console.debug(`[WS] No handler for message type: ${message.type}`)
    }
    
    // Emit specific event for the message type
    // This allows components to subscribe to specific message types
    this.emit(message.type, message)
  }
  
  send(type: string, payload?: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send message, not connected')
      this.emit('error', new Error('Not connected'))
      return
    }
    
    // Backend expects: { type, ...otherFields }
    // Not: { type, payload: {...} }
    const message = payload 
      ? { type, ...payload as Record<string, any> }
      : { type }
    
    try {
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error('[WS] Send error:', error)
      this.emit('error', error as Error)
    }
  }
  
  // ========================================
  // RECONNECTION
  // ========================================
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnection attempts reached')
      this.emit('error', new Error('Max reconnection attempts reached'))
      return
    }
    
    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts
    
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    this.emit('reconnecting', this.reconnectAttempts)
    
    setTimeout(() => {
      console.log('[WS] Attempting to reconnect...')
      this.connect().catch(console.error)
    }, delay)
  }
  
  // ========================================
  // HEARTBEAT
  // ========================================
  
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatInterval = window.setInterval(() => {
      this.send('ping')
    }, 30000) // Ping every 30 seconds
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
  
  // ========================================
  // HANDLER MANAGEMENT
  // ========================================
  
  /**
   * Registrar handler dinámicamente (útil para plugins)
   */
  registerHandler(type: string, handler: MessageHandler): void {
    this.handlers[type] = handler
    console.log(`[WS] Registered handler for: ${type}`)
  }
  
  /**
   * Desregistrar handler
   */
  unregisterHandler(type: string): void {
    delete this.handlers[type]
    console.log(`[WS] Unregistered handler for: ${type}`)
  }
}

// ============================================================================
// SINGLETON INSTANCE (legacy compatibility)
// ============================================================================

export const ws = new WebSocketService()

