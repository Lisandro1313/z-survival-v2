import db from '../db/index.js';
import flagSystem from '../systems/flagSystem.js';
import dialogueEngine from '../systems/dialogueEngine.js';

/**
 * 🌍 GLOBAL EVENTS MANAGER - Sistema de Eventos Globales
 * 
 * Gestiona eventos que afectan a todos los jugadores simultáneamente:
 * - 🧟 Hordas de Zombies: Spawn masivo temporal
 * - 📦 Airdrops: Cajas con recursos en ubicaciones aleatorias
 * - 🛒 Comerciante Viajero: NPC especial con items únicos
 * - ☔ Clima Extremo: Lluvia ácida, niebla, tormentas
 * - 🚨 Eventos Narrativos: Racionamiento, conflictos
 * 
 * FASE 11 - Q1 2026
 */

class GlobalEvents {
    constructor() {
        // Eventos activos actuales
        this.activeGlobalEvent = null;
        this.activeEvents = new Map(); // eventId -> event data
        
        // Scheduler
        this.eventSchedule = [];
        this.lastEventCheck = Date.now();
        this.minTimeBetweenEvents = 1800000; // 30 minutos entre eventos
        
        // Broadcast callback
        this.broadcastCallback = null;
        
        // Estado de eventos por tipo
        this.zombieHordeActive = false;
        this.airdropLocations = new Map();
        this.merchantActive = null;
        this.weatherActive = null;
        
        console.log('🌍 Global Events Manager initialized');
    }
    
    // ===== CONFIGURACIÓN =====
    setBroadcastCallback(callback) {
        this.broadcastCallback = callback;
    }
    
    broadcast(message) {
        if (this.broadcastCallback) {
            this.broadcastCallback(message);
        }
    }
    
    // ========================================
    // 🧟 HORDA DE ZOMBIES
    // ========================================
    
    /**
     * Inicia evento de horda de zombies
     * - x3 zombies en todas las locaciones
     * - Duración: 30 minutos
     * - Recompensa grupal si sobreviven
     */
    triggerZombieHorde() {
        if (this.zombieHordeActive) return null;
        
        const eventId = `horde_${Date.now()}`;
        const duration = 1800000; // 30 minutos
        const endsAt = Date.now() + duration;
        
        const event = {
            id: eventId,
            type: 'zombie_horde',
            title: '🧟 HORDA DE ZOMBIES',
            description: '¡Una enorme horda se acerca! Los zombies se triplican en todas las locaciones.',
            startedAt: Date.now(),
            endsAt,
            duration,
            status: 'active',
            effects: {
                zombieMultiplier: 3,
                locations: ['supermercado', 'farmacia', 'casa_abandonada', 'hospital', 'comisaria', 'plaza']
            },
            rewards: {
                survivalBonus: { xp: 200, reputacion: 30, oro: 100 }
            }
        };
        
        this.activeEvents.set(eventId, event);
        this.zombieHordeActive = true;
        
        // Notificar a todos
        this.broadcast({
            type: 'global_event:start',
            event: {
                id: eventId,
                type: 'zombie_horde',
                title: event.title,
                description: event.description,
                endsAt,
                effects: event.effects
            }
        });
        
        // Programar fin automático
        setTimeout(() => this.endZombieHorde(eventId), duration);
        
        console.log(`🧟 Horda de zombies iniciada (${duration/1000}s)`);
        return event;
    }
    
    endZombieHorde(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        event.status = 'completed';
        this.zombieHordeActive = false;
        this.activeEvents.delete(eventId);
        
        this.broadcast({
            type: 'global_event:end',
            event: {
                id: eventId,
                type: 'zombie_horde',
                message: '✅ La horda ha pasado. El peligro disminuye.',
                rewards: event.rewards.survivalBonus
            }
        });
        
        console.log(`✅ Horda de zombies terminada`);
    }
    
    // ========================================
    // 📦 AIRDROP DE SUMINISTROS
    // ========================================
    
    /**
     * Lanza airdrop con recursos en ubicación aleatoria
     * - Aviso 5 minutos antes
     * - Primero que llega, gana
     */
    triggerAirdrop() {
        const eventId = `airdrop_${Date.now()}`;
        const locations = ['supermercado', 'farmacia', 'casa_abandonada', 'hospital', 'comisaria'];
        const targetLocation = locations[Math.floor(Math.random() * locations.length)];
        
        const warningTime = 300000; // 5 minutos
        const availableTime = 600000; // 10 minutos después del aviso
        const endsAt = Date.now() + warningTime + availableTime;
        
        const loot = this.generateAirdropLoot();
        
        const event = {
            id: eventId,
            type: 'airdrop',
            title: '📦 AIRDROP DETECTADO',
            description: `Se detecta un airdrop cayendo cerca de ${this.getLocationName(targetLocation)}. ¡Apresúrate!`,
            startedAt: Date.now(),
            warningEndsAt: Date.now() + warningTime,
            endsAt,
            status: 'warning',
            location: targetLocation,
            loot,
            claimed: false,
            claimedBy: null
        };
        
        this.activeEvents.set(eventId, event);
        this.airdropLocations.set(eventId, targetLocation);
        
        // Aviso inicial
        this.broadcast({
            type: 'global_event:start',
            event: {
                id: eventId,
                type: 'airdrop',
                title: event.title,
                description: `📻 Aviso: Airdrop detectado. Llegará en 5 minutos cerca de ${this.getLocationName(targetLocation)}.`,
                location: targetLocation,
                warningEndsAt: event.warningEndsAt
            }
        });
        
        // Airdrop cae después de 5 min
        setTimeout(() => {
            event.status = 'active';
            this.broadcast({
                type: 'global_event:update',
                event: {
                    id: eventId,
                    type: 'airdrop',
                    message: `📦 ¡El airdrop ha caído en ${this.getLocationName(targetLocation)}! ¡Corre!`,
                    location: targetLocation
                }
            });
        }, warningTime);
        
        // Expiración automática
        setTimeout(() => this.expireAirdrop(eventId), warningTime + availableTime);
        
        console.log(`📦 Airdrop programado en ${targetLocation}`);
        return event;
    }
    
    claimAirdrop(eventId, playerId, playerLocation) {
        const event = this.activeEvents.get(eventId);
        if (!event || event.type !== 'airdrop') {
            return { success: false, message: 'Airdrop no encontrado' };
        }
        
        if (event.claimed) {
            return { success: false, message: 'Alguien más reclamó el airdrop' };
        }
        
        if (event.status !== 'active') {
            return { success: false, message: 'El airdrop aún no ha caído' };
        }
        
        if (playerLocation !== event.location) {
            return { success: false, message: `Debes estar en ${this.getLocationName(event.location)}` };
        }
        
        // Reclamar
        event.claimed = true;
        event.claimedBy = playerId;
        event.status = 'claimed';
        
        this.broadcast({
            type: 'global_event:end',
            event: {
                id: eventId,
                type: 'airdrop',
                message: `📦 ¡El jugador ${playerId} reclamó el airdrop!`,
                claimedBy: playerId
            }
        });
        
        this.activeEvents.delete(eventId);
        this.airdropLocations.delete(eventId);
        
        console.log(`📦 Airdrop reclamado por jugador ${playerId}`);
        return { success: true, loot: event.loot };
    }
    
    expireAirdrop(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event || event.claimed) return;
        
        event.status = 'expired';
        this.activeEvents.delete(eventId);
        this.airdropLocations.delete(eventId);
        
        this.broadcast({
            type: 'global_event:end',
            event: {
                id: eventId,
                type: 'airdrop',
                message: '⏰ El airdrop expiró. Nadie lo reclamó.'
            }
        });
        
        console.log(`⏰ Airdrop expirado`);
    }
    
    generateAirdropLoot() {
        const lootTables = [
            { comida: 50, agua: 30, medicinas: 10, oro: 100 },
            { armas: 3, municion: 50, medicinas: 15, oro: 150 },
            { materiales: 80, herramientas: 5, oro: 120 },
            { comida: 30, agua: 20, medicinas: 20, armas: 2, oro: 200 }
        ];
        return lootTables[Math.floor(Math.random() * lootTables.length)];
    }
    
    // ========================================
    // 🛒 COMERCIANTE VIAJERO
    // ========================================
    
    /**
     * Comerciante viajero con items únicos
     * - Aparece 1 hora
     * - Precios dinámicos
     */
    triggerTravelingMerchant() {
        if (this.merchantActive) return null;
        
        const eventId = `merchant_${Date.now()}`;
        const duration = 3600000; // 1 hora
        const endsAt = Date.now() + duration;
        
        const inventory = this.generateMerchantInventory();
        
        const event = {
            id: eventId,
            type: 'traveling_merchant',
            title: '🛒 COMERCIANTE VIAJERO',
            description: 'Un comerciante misterioso ha llegado al refugio con items raros.',
            startedAt: Date.now(),
            endsAt,
            duration,
            status: 'active',
            merchantName: 'Eli el Errante',
            inventory,
            salesCount: 0
        };
        
        this.activeEvents.set(eventId, event);
        this.merchantActive = event;
        
        this.broadcast({
            type: 'global_event:start',
            event: {
                id: eventId,
                type: 'traveling_merchant',
                title: event.title,
                description: event.description,
                merchantName: event.merchantName,
                inventory,
                endsAt
            }
        });
        
        setTimeout(() => this.endTravelingMerchant(eventId), duration);
        
        console.log(`🛒 Comerciante viajero llegó (${duration/60000} min)`);
        return event;
    }
    
    endTravelingMerchant(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        event.status = 'completed';
        this.merchantActive = null;
        this.activeEvents.delete(eventId);
        
        this.broadcast({
            type: 'global_event:end',
            event: {
                id: eventId,
                type: 'traveling_merchant',
                message: '🛒 El comerciante se va. "Hasta la próxima, supervivientes."',
                salesMade: event.salesCount
            }
        });
        
        console.log(`🛒 Comerciante viajero se fue`);
    }
    
    generateMerchantInventory() {
        return [
            { item: 'vaccine_boost', name: 'Inyección T-Virus', precio: 500, cantidad: 3, efecto: '+50 HP máximo permanente' },
            { item: 'lucky_charm', name: 'Amuleto de Suerte', precio: 300, cantidad: 5, efecto: '+20% drop rate por 24h' },
            { item: 'stealth_cloak', name: 'Capa de Sigilo', precio: 400, cantidad: 2, efecto: '-50% encuentros zombie por 12h' },
            { item: 'master_key', name: 'Llave Maestra', precio: 600, cantidad: 1, efecto: 'Desbloquea área secreta' },
            { item: 'energy_drink', name: 'Bebida Energética', precio: 100, cantidad: 10, efecto: '+50 energía instantánea' }
        ];
    }
    
    buyFromMerchant(eventId, playerId, itemId, oro) {
        const event = this.activeEvents.get(eventId);
        if (!event || event.type !== 'traveling_merchant' || event.status !== 'active') {
            return { success: false, message: 'Comerciante no disponible' };
        }
        
        const itemIndex = event.inventory.findIndex(i => i.item === itemId);
        if (itemIndex === -1) {
            return { success: false, message: 'Item no encontrado' };
        }
        
        const item = event.inventory[itemIndex];
        if (item.cantidad <= 0) {
            return { success: false, message: 'Item agotado' };
        }
        
        if (oro < item.precio) {
            return { success: false, message: 'Oro insuficiente' };
        }
        
        // Vender
        item.cantidad--;
        event.salesCount++;
        
        console.log(`🛒 Jugador ${playerId} compró ${item.name}`);
        return { success: true, item };
    }
    
    // ========================================
    // ☔ CLIMA EXTREMO
    // ========================================
    
    /**
     * Eventos de clima extremo
     * - Lluvia ácida: -2 HP/turno al aire libre
     * - Niebla: Visibilidad reducida
     * - Tormenta: Bloquea movimiento
     */
    triggerWeatherEvent() {
        if (this.weatherActive) return null;
        
        const eventId = `weather_${Date.now()}`;
        const weatherTypes = [
            { type: 'acid_rain', title: '☔ LLUVIA ÁCIDA', effect: 'damage', value: 2 },
            { type: 'fog', title: '🌫️ NIEBLA DENSA', effect: 'visibility', value: -50 },
            { type: 'storm', title: '⛈️ TORMENTA', effect: 'movement_block', value: true }
        ];
        
        const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        const duration = 900000; // 15 minutos
        const endsAt = Date.now() + duration;
        
        const event = {
            id: eventId,
            type: 'weather',
            weatherType: weather.type,
            title: weather.title,
            description: this.getWeatherDescription(weather.type),
            startedAt: Date.now(),
            endsAt,
            duration,
            status: 'active',
            effect: weather.effect,
            effectValue: weather.value
        };
        
        this.activeEvents.set(eventId, event);
        this.weatherActive = event;
        
        this.broadcast({
            type: 'global_event:start',
            event: {
                id: eventId,
                type: 'weather',
                weatherType: weather.type,
                title: event.title,
                description: event.description,
                effect: weather.effect,
                effectValue: weather.value,
                endsAt
            }
        });
        
        setTimeout(() => this.endWeatherEvent(eventId), duration);
        
        console.log(`☔ Clima extremo: ${weather.type} (${duration/60000} min)`);
        return event;
    }
    
    endWeatherEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        event.status = 'completed';
        this.weatherActive = null;
        this.activeEvents.delete(eventId);
        
        this.broadcast({
            type: 'global_event:end',
            event: {
                id: eventId,
                type: 'weather',
                message: `☀️ El clima mejora. ${event.title} ha terminado.`
            }
        });
        
        console.log(`☀️ Clima extremo terminado`);
    }
    
    getWeatherDescription(type) {
        const descriptions = {
            acid_rain: 'Lluvia tóxica cae del cielo. Estar al aire libre causa -2 HP por acción.',
            fog: 'Niebla espesa reduce la visibilidad. Probabilidad de encontrar recursos -50%.',
            storm: 'Tormenta violenta bloquea el movimiento. No puedes cambiar de locación.'
        };
        return descriptions[type] || '';
    }
    
    // ========================================
    // 🎲 SCHEDULER AUTOMÁTICO
    // ========================================
    
    /**
     * Verifica y genera eventos automáticamente
     * Debe llamarse desde el tick del servidor
     */
    tick() {
        const now = Date.now();
        
        // No generar si hay evento reciente
        if (now - this.lastEventCheck < this.minTimeBetweenEvents) {
            return;
        }
        
        // No generar si ya hay 2+ eventos activos
        if (this.activeEvents.size >= 2) {
            return;
        }
        
        // Probabilidad de evento: 15% por tick
        if (Math.random() < 0.15) {
            this.generateRandomEvent();
            this.lastEventCheck = now;
        }
    }
    
    generateRandomEvent() {
        const eventTypes = [
            { type: 'zombie_horde', weight: 30, fn: () => this.triggerZombieHorde() },
            { type: 'airdrop', weight: 25, fn: () => this.triggerAirdrop() },
            { type: 'traveling_merchant', weight: 20, fn: () => this.triggerTravelingMerchant() },
            { type: 'weather', weight: 25, fn: () => this.triggerWeatherEvent() }
        ];
        
        // Filtrar eventos que ya están activos
        const available = eventTypes.filter(e => {
            if (e.type === 'zombie_horde' && this.zombieHordeActive) return false;
            if (e.type === 'traveling_merchant' && this.merchantActive) return false;
            if (e.type === 'weather' && this.weatherActive) return false;
            return true;
        });
        
        if (available.length === 0) return null;
        
        // Weighted random
        const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const eventType of available) {
            random -= eventType.weight;
            if (random <= 0) {
                console.log(`🎲 Generando evento aleatorio: ${eventType.type}`);
                return eventType.fn();
            }
        }
        
        return null;
    }
    
    // ========================================
    // GETTERS Y UTILIDADES
    // ========================================
    
    getActiveEvents() {
        return Array.from(this.activeEvents.values());
    }
    
    getEventById(eventId) {
        return this.activeEvents.get(eventId);
    }
    
    getLocationName(locationId) {
        const names = {
            refugio: 'Refugio Central',
            supermercado: 'Supermercado',
            farmacia: 'Farmacia',
            casa_abandonada: 'Casa Abandonada',
            hospital: 'Hospital',
            comisaria: 'Comisaría'
        };
        return names[locationId] || locationId;
    }
    
    // ========================================
    // EVENTOS NARRATIVOS LEGACY (RACIONAMIENTO)
    // ========================================

    /**
     * Verifica si debe gatillarse el evento de racionamiento
     * @param {number} playerId 
     * @returns {boolean}
     */
    shouldTriggerRacionamiento(playerId) {
        // No gatillar si ya se inició
        if (flagSystem.has(playerId, 'evento_racionamiento_iniciado')) {
            return false;
        }

        // Gatillar si completó la quest 103 (medicina de Teresa)
        if (flagSystem.has(playerId, 'quest_103_completed')) {
            return true;
        }

        // O si han pasado 3 días desde el primer login (placeholder)
        const player = db.prepare('SELECT created_at FROM players WHERE id = ?').get(playerId);
        if (player) {
            const createdAt = new Date(player.created_at);
            const now = new Date();
            const daysSince = (now - createdAt) / (1000 * 60 * 60 * 24);
            return daysSince >= 3;
        }

        return false;
    }

    /**
     * Gatilla el evento de racionamiento
     * @param {number} playerId 
     * @returns {object}
     */
    triggerRacionamiento(playerId) {
        console.log(`🚨 Gatillando evento de racionamiento para player ${playerId}`);

        // Marcar el flag
        flagSystem.set(playerId, 'evento_racionamiento_iniciado');

        // Verificar si Ana confía en el jugador (consulta privada)
        const relacion = this.getRelacion(playerId, 'npc_ana');

        if (relacion >= 10) {
            // Ana te consulta primero
            const dialogo = dialogueEngine.getDialogueById('evento_racionamiento_consulta_ana', playerId);
            return {
                tipo: 'consulta_privada',
                npc: dialogueEngine.getNPC('npc_ana'),
                dialogo
            };
        } else {
            // Anuncio público directo - Ana no te consulta
            return {
                tipo: 'anuncio_publico',
                mensaje: 'Ana reúne a todos en el refugio. Va a anunciar algo importante.',
                dialogo_siguiente: 'evento_racionamiento_decision'
            };
        }
    }

    /**
     * Obtiene la relación con un NPC
     * @param {number} playerId 
     * @param {string} npcId 
     * @returns {number}
     */
    getRelacion(playerId, npcId) {
        try {
            const stmt = db.prepare(`
                SELECT relacion FROM player_npc_relations 
                WHERE player_id = ? AND npc_id = ?
            `);
            const result = stmt.get(playerId, npcId);
            return result ? result.relacion : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Verifica si hay algún evento global activo para el jugador
     * @param {number} playerId 
     * @returns {object|null}
     */
    checkActiveGlobalEvents(playerId) {
        // Verificar evento de racionamiento
        if (this.shouldTriggerRacionamiento(playerId)) {
            return this.triggerRacionamiento(playerId);
        }

        // Aquí se pueden agregar más eventos globales en el futuro
        // if (this.shouldTriggerInvasion(playerId)) { ... }

        return null;
    }

    /**
     * Obtiene el estado del evento de racionamiento para un jugador
     * @param {number} playerId 
     * @returns {object}
     */
    getRacionamientoState(playerId) {
        return {
            iniciado: flagSystem.has(playerId, 'evento_racionamiento_iniciado'),
            resuelto: flagSystem.has(playerId, 'evento_racionamiento_resuelto'),
            decision: this.getPlayerDecision(playerId),
            consecuencias: this.getConsequences(playerId)
        };
    }

    /**
     * Obtiene la decisión que tomó el jugador
     * @param {number} playerId 
     * @returns {string|null}
     */
    getPlayerDecision(playerId) {
        if (flagSystem.has(playerId, 'player_apoyo_ana_publico')) return 'apoyo_ana';
        if (flagSystem.has(playerId, 'player_apoyo_gomez_publico')) return 'apoyo_gomez';
        if (flagSystem.has(playerId, 'player_propuso_huida')) return 'propuso_huida';
        if (flagSystem.has(playerId, 'player_revelo_secreto_gomez')) return 'revelo_secreto';
        if (flagSystem.has(playerId, 'player_silencio_evento')) return 'silencio';
        return null;
    }

    /**
     * Obtiene las consecuencias del evento
     * @param {number} playerId 
     * @returns {object}
     */
    getConsequences(playerId) {
        return {
            gomez_arrestado: flagSystem.has(playerId, 'gomez_arrestado'),
            gomez_ejecutado: flagSystem.has(playerId, 'gomez_ejecutado'),
            gomez_expulsado: flagSystem.has(playerId, 'gomez_expulsado'),
            gomez_perdonado: flagSystem.has(playerId, 'gomez_perdonado'),
            ana_autoridad_reforzada: flagSystem.has(playerId, 'ana_autoridad_reforzada'),
            refugio_dividido: flagSystem.has(playerId, 'refugio_dividido'),
            nina_abandono_refugio: flagSystem.has(playerId, 'nina_abandono_refugio'),
            refugio_autoritario: flagSystem.has(playerId, 'refugio_autoritario')
        };
    }

    /**
     * Crea notificación de evento global
     * @param {number} playerId 
     * @param {string} mensaje 
     */
    notifyGlobalEvent(playerId, mensaje) {
        db.prepare(`
            INSERT INTO messages (lugar, autor_id, autor_tipo, mensaje, tipo)
            VALUES ('refugio', 'sistema', 'sistema', ?, 'evento_global')
        `).run(mensaje);
    }
}

export default new GlobalEvents();
