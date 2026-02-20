/**
 * Handler Registry - Sistema de registro centralizado de handlers WebSocket
 * 
 * REGLA: Los handlers SOLO actualizan stores, NUNCA modifican DOM ni renderizan
 */

import { getHandlers } from './handlers'

export type MessageHandler = (payload: any) => void

export interface HandlerRegistry {
  [messageType: string]: MessageHandler
}

/**
 * Crear registro de handlers
 * Usa getHandlers() existente para compatibilidad
 */
export function createHandlerRegistry(): HandlerRegistry {
  return getHandlers()
}

/**
 * Validar que un handler existe para el tipo de mensaje
 */
export function hasHandler(registry: HandlerRegistry, messageType: string): boolean {
  return messageType in registry
}

/**
 * Obtener handler para un tipo de mensaje
 */
export function getHandler(registry: HandlerRegistry, messageType: string): MessageHandler | undefined {
  return registry[messageType]
}

/**
 * Registrar un nuevo handler dinámicamente (útil para plugins/extensiones)
 */
export function registerHandler(
  registry: HandlerRegistry, 
  messageType: string, 
  handler: MessageHandler
): void {
  if (registry[messageType]) {
    console.warn(`[HandlerRegistry] Overwriting handler for message type: ${messageType}`)
  }
  registry[messageType] = handler
}

/**
 * Desregistrar un handler
 */
export function unregisterHandler(registry: HandlerRegistry, messageType: string): void {
  delete registry[messageType]
}

