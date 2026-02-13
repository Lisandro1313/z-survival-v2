/**
 * EventBus.js
 * Sistema de eventos desacoplado
 * 
 * Permite que los sistemas se comuniquen sin conocerse entre sí
 */

class EventBusClass {
    constructor() {
        this.listeners = {};
        this.history = [];
        this.maxHistory = 1000;
    }

    /**
     * Emitir un evento
     * @param {string} event - Nombre del evento
     * @param {any} payload - Datos del evento
     */
    emit(event, payload = null) {
        const eventData = {
            event,
            payload,
            timestamp: Date.now()
        };

        // Guardar en historial
        this.history.push(eventData);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // Notificar a listeners
        const handlers = this.listeners[event] || [];
        handlers.forEach(handler => {
            try {
                handler(payload, eventData);
            } catch (error) {
                console.error(`❌ Error en handler de evento "${event}":`, error);
            }
        });
    }

    /**
     * Escuchar un evento
     * @param {string} event - Nombre del evento
     * @param {function} handler - Función que se ejecuta cuando ocurre el evento
     */
    on(event, handler) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
    }

    /**
     * Dejar de escuchar un evento
     */
    off(event, handler) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }

    /**
     * Escuchar una sola vez
     */
    once(event, handler) {
        const wrappedHandler = (payload, eventData) => {
            handler(payload, eventData);
            this.off(event, wrappedHandler);
        };
        this.on(event, wrappedHandler);
    }

    /**
     * Limpiar todos los listeners de un evento
     */
    clear(event) {
        if (event) {
            delete this.listeners[event];
        } else {
            this.listeners = {};
        }
    }

    /**
     * Obtener historial de eventos
     */
    getHistory(event = null, limit = 100) {
        let filtered = this.history;
        if (event) {
            filtered = filtered.filter(e => e.event === event);
        }
        return filtered.slice(-limit);
    }
}

// Singleton global
export const EventBus = new EventBusClass();

// Exportar también la clase por si se necesitan múltiples buses
export default EventBusClass;
