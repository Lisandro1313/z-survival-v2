/**
 * Middleware y utilidades para handlers WebSocket
 * Implementa validaciones comunes y reduce duplicación de código
 */

/**
 * Middleware: Requiere que el jugador exista
 * Previene el patrón repetitivo de validar jugador en cada handler
 */
export function requirePlayer(handler) {
    return async (msg, ws, playerId, WORLD, sendError) => {
        const player = WORLD.players[playerId];

        if (!player) {
            return sendError(ws, '❌ Jugador no encontrado. Por favor reconecta.');
        }

        // Llamar al handler original con el player ya validado
        return await handler(msg, ws, playerId, player, WORLD, sendError);
    };
}

/**
 * Middleware: Requiere que el jugador NO esté en combate
 */
export function requireNotInCombat(handler) {
    return async (msg, ws, playerId, player, WORLD, sendError) => {
        if (player.inCombat) {
            return sendError(ws, '⚔️ No puedes hacer esto durante el combate');
        }

        return await handler(msg, ws, playerId, player, WORLD, sendError);
    };
}

/**
 * Middleware: Requiere cooldown
 */
export function withCooldown(cooldownKey, duration) {
    return (handler) => {
        return async (msg, ws, playerId, player, WORLD, sendError) => {
            if (!player.cooldowns) player.cooldowns = {};

            const now = Date.now();
            const cooldownEnd = player.cooldowns[cooldownKey];

            if (cooldownEnd && now < cooldownEnd) {
                const segundos = Math.ceil((cooldownEnd - now) / 1000);
                return sendError(ws, `⏱️ Espera ${segundos}s antes de hacer esto de nuevo`);
            }

            // Ejecutar handler
            const result = await handler(msg, ws, playerId, player, WORLD, sendError);

            // Setear cooldown si el handler fue exitoso
            if (result !== false) {
                player.cooldowns[cooldownKey] = now + duration;
            }

            return result;
        };
    };
}

/**
 * Middleware: Requiere que el jugador esté en una locación específica
 */
export function requireLocation(locationType) {
    return (handler) => {
        return async (msg, ws, playerId, player, WORLD, sendError) => {
            const currentLoc = WORLD.locations[player.locacion];

            if (!currentLoc || currentLoc.tipo !== locationType) {
                return sendError(ws, `📍 Debes estar en una zona ${locationType === 'safe' ? 'segura' : 'de saqueo'}`);
            }

            return await handler(msg, ws, playerId, player, WORLD, sendError);
        };
    };
}

/**
 * Middleware: Requiere recursos en el inventario
 */
export function requireResources(recursos) {
    return (handler) => {
        return async (msg, ws, playerId, player, WORLD, sendError) => {
            const faltantes = [];

            for (const [recurso, cantidad] of Object.entries(recursos)) {
                if (!player.inventario[recurso] || player.inventario[recurso] < cantidad) {
                    faltantes.push(`${recurso} (${cantidad} requerido)`);
                }
            }

            if (faltantes.length > 0) {
                return sendError(ws, `❌ Te faltan: ${faltantes.join(', ')}`);
            }

            return await handler(msg, ws, playerId, player, WORLD, sendError);
        };
    };
}

/**
 * Middleware: Validar que un NPC exista
 */
export function requireNPC(handler) {
    return async (msg, ws, playerId, player, WORLD, sendError) => {
        const npcId = msg.npcId || msg.targetId;
        const npc = WORLD.npcs[npcId];

        if (!npc) {
            return sendError(ws, '❌ NPC no encontrado');
        }

        if (!npc.vivo) {
            return sendError(ws, `💀 ${npc.nombre} no está disponible`);
        }

        return await handler(msg, ws, playerId, player, npc, WORLD, sendError);
    };
}

/**
 * Utilidad: Composición de middlewares
 * Permite encadenar múltiples middlewares
 */
export function compose(...middlewares) {
    return (handler) => {
        return middlewares.reduceRight(
            (wrapped, middleware) => middleware(wrapped),
            handler
        );
    };
}

/**
 * Validadores de datos comunes
 */
export const validators = {
    /**
     * Validar que un valor sea un número positivo
     */
    isPositiveNumber(value, fieldName = 'valor') {
        if (typeof value !== 'number' || value <= 0) {
            return {
                valid: false,
                message: `❌ ${fieldName} debe ser un número positivo`
            };
        }
        return { valid: true };
    },

    /**
     * Validar que un string no esté vacío
     */
    isNonEmptyString(value, fieldName = 'texto') {
        if (typeof value !== 'string' || value.trim().length === 0) {
            return {
                valid: false,
                message: `❌ ${fieldName} no puede estar vacío`
            };
        }
        return { valid: true };
    },

    /**
     * Validar que un valor esté en una lista
     */
    isInList(value, list, fieldName = 'opción') {
        if (!list.includes(value)) {
            return {
                valid: false,
                message: `❌ ${fieldName} inválida. Opciones: ${list.join(', ')}`
            };
        }
        return { valid: true };
    },

    /**
     * Validar rango numérico
     */
    isInRange(value, min, max, fieldName = 'valor') {
        if (typeof value !== 'number' || value < min || value > max) {
            return {
                valid: false,
                message: `❌ ${fieldName} debe estar entre ${min} y ${max}`
            };
        }
        return { valid: true };
    }
};

/**
 * Helper: Enviar respuesta exitosa con datos
 */
export function createSuccessResponse(type, data = {}) {
    return {
        success: true,
        type,
        timestamp: Date.now(),
        ...data
    };
}

/**
 * Helper: Enviar respuesta de error con contexto
 */
export function createErrorResponse(message, code = 'GENERIC_ERROR', context = {}) {
    return {
        success: false,
        error: {
            message,
            code,
            timestamp: Date.now(),
            ...context
        }
    };
}

/**
 * Helper: Logger consistente para handlers
 */
export function logHandlerAction(playerId, action, details = {}) {
    const timestamp = new Date().toISOString();
    const detailsStr = Object.keys(details).length > 0
        ? JSON.stringify(details)
        : '';

    console.log(`[${timestamp}] 🎮 ${playerId} → ${action} ${detailsStr}`);
}

/**
 * Helper: Calcular XP con bonificadores
 */
export function calculateXP(baseXP, player, actionType = 'general') {
    let xp = baseXP;

    // Bonus por nivel (más difícil = más XP)
    const nivelBonus = Math.floor(player.nivel * 0.1 * baseXP);
    xp += nivelBonus;

    // Bonus por clase (si aplica)
    if (player.clase && player.clase.xpBonus) {
        if (player.clase.xpBonus[actionType]) {
            xp *= player.clase.xpBonus[actionType];
        }
    }

    return Math.floor(xp);
}

/**
 * Helper: Verificar si el jugador puede pagar un costo
 */
export function canAfford(player, cost) {
    const missing = [];

    for (const [recurso, cantidad] of Object.entries(cost)) {
        if (!player.inventario[recurso] || player.inventario[recurso] < cantidad) {
            missing.push({
                recurso,
                necesita: cantidad,
                tiene: player.inventario[recurso] || 0,
                falta: cantidad - (player.inventario[recurso] || 0)
            });
        }
    }

    return {
        canAfford: missing.length === 0,
        missing
    };
}

/**
 * Helper: Gastar recursos del inventario
 */
export function spendResources(player, cost) {
    for (const [recurso, cantidad] of Object.entries(cost)) {
        player.inventario[recurso] -= cantidad;
    }
}

/**
 * Helper: Dar recursos al jugador
 */
export function giveResources(player, resources) {
    if (!player.inventario) player.inventario = {};

    for (const [recurso, cantidad] of Object.entries(resources)) {
        player.inventario[recurso] = (player.inventario[recurso] || 0) + cantidad;
    }
}

/**
 * Helper: Formatear mensaje de recursos
 */
export function formatResourcesMessage(resources) {
    const icons = {
        comida: '🍖',
        medicinas: '💊',
        armas: '🔫',
        materiales: '🔧',
        tokens: '🪙'
    };

    return Object.entries(resources)
        .map(([recurso, cantidad]) => {
            const icon = icons[recurso] || '📦';
            return `${icon} ${cantidad} ${recurso}`;
        })
        .join(', ');
}
