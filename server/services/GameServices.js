/**
 * Service Layer - Lógica de negocio separada de handlers WebSocket
 * Principio de Responsabilidad Única (SRP)
 */

/**
 * Servicio de Recursos - Gestión de búsqueda y recolección
 */
export class ResourceService {
    constructor(world) {
        this.world = world;
    }

    /**
     * Buscar recursos en una locación
     * @returns {success: boolean, message: string, resources: object, zombieAlert: boolean}
     */
    scavenge(player, location) {
        // Validación: jugador en combate
        if (player.inCombat) {
            return {
                success: false,
                message: '⚔️ No puedes buscar mientras estás en combate'
            };
        }

        // Validación: locación segura
        if (location.tipo === 'safe') {
            return {
                success: false,
                message: '🏠 Esta zona ya está saqueada. Prueba en zonas peligrosas'
            };
        }

        // Validación: zombies en la zona
        if (location.zombies > 0) {
            return {
                success: false,
                message: `⚠️ Hay ${location.zombies} zombies aquí. Debes eliminarlos primero`,
                zombieAlert: true
            };
        }

        // Validación: recursos disponibles
        const totalRecursos = Object.values(location.recursos || {})
            .reduce((sum, val) => sum + val, 0);

        if (totalRecursos === 0) {
            return {
                success: false,
                message: '🕳️ No queda nada útil aquí. Esta zona está completamente saqueada'
            };
        }

        // Búsqueda exitosa
        const encontrado = this._rollForResources(location);

        if (encontrado.total === 0) {
            return {
                success: true,
                message: '🔍 Buscaste exhaustivamente pero no encontraste nada útil',
                resources: {}
            };
        }

        // Agregar recursos al inventario
        this._addToInventory(player, encontrado.items);
        this._removeFromLocation(location, encontrado.items);

        return {
            success: true,
            message: this._formatScavengeMessage(encontrado.items),
            resources: encontrado.items
        };
    }

    _rollForResources(location) {
        const items = {};
        let total = 0;

        for (const [recurso, cantidad] of Object.entries(location.recursos || {})) {
            if (cantidad > 0 && Math.random() < 0.5) {
                const encontrado = Math.ceil(Math.random() * Math.min(cantidad, 3));
                items[recurso] = encontrado;
                total += encontrado;
            }
        }

        return { items, total };
    }

    _addToInventory(player, items) {
        if (!player.inventario) player.inventario = {};

        for (const [recurso, cantidad] of Object.entries(items)) {
            player.inventario[recurso] = (player.inventario[recurso] || 0) + cantidad;
        }
    }

    _removeFromLocation(location, items) {
        for (const [recurso, cantidad] of Object.entries(items)) {
            location.recursos[recurso] = Math.max(0, location.recursos[recurso] - cantidad);
        }
    }

    _formatScavengeMessage(items) {
        const icons = {
            comida: '🍖',
            medicinas: '💊',
            armas: '🔫',
            materiales: '🔧'
        };

        const itemStrings = Object.entries(items).map(([recurso, cantidad]) => {
            const icon = icons[recurso] || '📦';
            return `${icon} ${cantidad} ${recurso}`;
        });

        return `✨ ¡Encontrado! ${itemStrings.join(', ')}`;
    }
}

/**
 * Servicio de Combate - Gestión de batallas y ataques
 */
export class CombatService {
    constructor(world) {
        this.world = world;
    }

    /**
     * Iniciar combate con zombies
     */
    initiateCombat(player, location, attackType = 'melee') {
        if (player.inCombat) {
            return {
                success: false,
                message: '⚔️ Ya estás en combate'
            };
        }

        if (location.zombies <= 0) {
            return {
                success: false,
                message: '✓ No hay zombies aquí'
            };
        }

        // Validar arma para disparo
        if (attackType === 'shoot') {
            if (!player.inventario?.armas || player.inventario.armas < 1) {
                return {
                    success: false,
                    message: '🔫 No tienes armas para disparar'
                };
            }
            player.inventario.armas--;
        }

        player.inCombat = true;
        player.combatTarget = location.id;

        return {
            success: true,
            message: attackType === 'shoot'
                ? '🔫 ¡Disparas al zombie!'
                : '⚔️ ¡Te lanzas al combate cuerpo a cuerpo!',
            attackType
        };
    }

    /**
     * Ejecutar ataque en combate
     */
    executeAttack(player, location, attackType = 'melee') {
        if (!player.inCombat) {
            return {
                success: false,
                message: '❌ No estás en combate'
            };
        }

        if (location.zombies <= 0) {
            player.inCombat = false;
            return {
                success: false,
                message: '✓ Has eliminado todos los zombies',
                combatEnded: true
            };
        }

        const result = this._calculateCombatRound(player, attackType);

        // Aplicar daño al zombie
        if (result.damageToZombie > 0) {
            location.zombies = Math.max(0, location.zombies - 1);
        }

        // Aplicar daño al jugador
        if (result.damageToPlayer > 0) {
            player.stats.vida = Math.max(0, player.stats.vida - result.damageToPlayer);
        }

        // Verificar muerte del jugador
        if (player.stats.vida <= 0) {
            return {
                success: false,
                message: '💀 Has muerto en combate...',
                playerDied: true,
                combatEnded: true
            };
        }

        // Verificar fin del combate
        if (location.zombies <= 0) {
            player.inCombat = false;
            const xpGained = 15 + Math.floor(Math.random() * 10);
            player.experiencia = (player.experiencia || 0) + xpGained;

            return {
                success: true,
                message: `🎉 ¡Victoria! Has ganado ${xpGained} XP`,
                combatEnded: true,
                xpGained
            };
        }

        return {
            success: true,
            message: result.message,
            damageDealt: result.damageToZombie,
            damageTaken: result.damageToPlayer,
            zombiesRemaining: location.zombies
        };
    }

    _calculateCombatRound(player, attackType) {
        const playerStrength = player.stats.fuerza || 5;
        const playerDex = player.stats.agilidad || 5;

        let damageToZombie = 0;
        let damageToPlayer = 0;
        let message = '';

        if (attackType === 'shoot' && player.inventario?.armas > 0) {
            player.inventario.armas--;
            damageToZombie = 1;
            message = '🔫 ¡Disparo certero! Zombie eliminado';
        } else {
            // Combate cuerpo a cuerpo
            const playerRoll = Math.random() * playerStrength;
            const zombieRoll = Math.random() * 8;

            if (playerRoll > zombieRoll * 1.2) {
                damageToZombie = 1;
                message = '⚔️ ¡Golpe letal! Zombie eliminado';
            } else if (playerRoll > zombieRoll) {
                message = '⚔️ Golpeas al zombie pero sigue de pie';
            } else {
                damageToPlayer = Math.ceil(Math.random() * 3);
                message = `💥 El zombie te ataca. Pierdes ${damageToPlayer} vida`;
            }
        }

        return { damageToZombie, damageToPlayer, message };
    }

    /**
     * Huir del combate
     */
    flee(player) {
        if (!player.inCombat) {
            return {
                success: false,
                message: '❌ No estás en combate'
            };
        }

        const escapeChance = (player.stats.agilidad || 5) / 20;
        const escaped = Math.random() < escapeChance;

        if (escaped) {
            player.inCombat = false;
            player.combatTarget = null;
            return {
                success: true,
                message: '🏃 ¡Escapaste con éxito!'
            };
        } else {
            const damage = Math.ceil(Math.random() * 4);
            player.stats.vida = Math.max(0, player.stats.vida - damage);

            if (player.stats.vida <= 0) {
                return {
                    success: false,
                    message: '💀 El zombie te alcanzó mientras huías...',
                    playerDied: true
                };
            }

            return {
                success: false,
                message: `💥 Fallo al escapar. Pierdes ${damage} vida`,
                damageTaken: damage
            };
        }
    }
}

/**
 * Servicio de Crafteo - Creación de items
 */
export class CraftingService {
    constructor() {
        this.recipes = {
            'vendaje': { comida: 1, materiales: 1, result: { medicinas: 1 } },
            'trampa': { materiales: 3, result: { armas: 1 } },
            'barricada': { materiales: 5, result: { defensas: 10 } }
        };
    }

    /**
     * Craftear un item
     */
    craft(player, itemName) {
        const recipe = this.recipes[itemName];

        if (!recipe) {
            return {
                success: false,
                message: `❌ Receta desconocida: ${itemName}`
            };
        }

        // Verificar recursos
        const missing = [];
        for (const [recurso, cantidad] of Object.entries(recipe)) {
            if (recurso === 'result') continue;
            if ((player.inventario?.[recurso] || 0) < cantidad) {
                missing.push(`${recurso} (${cantidad} requerido)`);
            }
        }

        if (missing.length > 0) {
            return {
                success: false,
                message: `❌ Te faltan recursos: ${missing.join(', ')}`
            };
        }

        // Consumir recursos
        for (const [recurso, cantidad] of Object.entries(recipe)) {
            if (recurso === 'result') continue;
            player.inventario[recurso] -= cantidad;
        }

        // Agregar resultado
        for (const [recurso, cantidad] of Object.entries(recipe.result)) {
            player.inventario[recurso] = (player.inventario[recurso] || 0) + cantidad;
        }

        return {
            success: true,
            message: `✨ ¡${itemName} creado con éxito!`,
            item: itemName,
            result: recipe.result
        };
    }
}

/**
 * Servicio de Comercio - Trading con NPCs
 */
export class TradeService {
    constructor(world) {
        this.world = world;
    }

    /**
     * Comerciar con un NPC
     */
    trade(player, npcId, ofreces, pides) {
        const npc = this.world.npcs[npcId];

        if (!npc) {
            return {
                success: false,
                message: '❌ NPC no encontrado'
            };
        }

        if (!npc.vivo) {
            return {
                success: false,
                message: `💀 ${npc.nombre} no está disponible`
            };
        }

        // Validar recursos del jugador
        if (!player.inventario[ofreces] || player.inventario[ofreces] < 1) {
            return {
                success: false,
                message: `❌ No tienes ${ofreces} para intercambiar`
            };
        }

        // Validar recursos del NPC
        if (!npc.inventario || !npc.inventario[pides] || npc.inventario[pides] < 1) {
            return {
                success: false,
                message: `❌ ${npc.nombre} no tiene ${pides} disponible`
            };
        }

        // Ejecutar intercambio
        player.inventario[ofreces]--;
        player.inventario[pides] = (player.inventario[pides] || 0) + 1;

        npc.inventario[pides]--;
        npc.inventario[ofreces] = (npc.inventario[ofreces] || 0) + 1;

        // Mejorar relación con el NPC
        if (!npc.relaciones) npc.relaciones = {};
        npc.relaciones[player.id] = Math.min(100, (npc.relaciones[player.id] || 50) + 5);

        return {
            success: true,
            message: `🤝 Intercambiaste ${ofreces} por ${pides} con ${npc.nombre}`,
            playerInventory: player.inventario,
            npcRelation: npc.relaciones[player.id]
        };
    }

    /**
     * Vender recursos al refugio
     */
    sellToRefuge(player, recurso, cantidad, refugio) {
        const precios = {
            comida: 10,
            medicinas: 20,
            armas: 30,
            materiales: 5
        };

        const precio = precios[recurso] || 5;

        if (!player.inventario[recurso] || player.inventario[recurso] < cantidad) {
            return {
                success: false,
                message: `❌ No tienes suficiente ${recurso}`
            };
        }

        const total = precio * cantidad;

        player.inventario[recurso] -= cantidad;
        player.inventario.tokens = (player.inventario.tokens || 0) + total;

        // Agregar al refugio
        refugio.recursos[recurso] = (refugio.recursos[recurso] || 0) + cantidad;

        return {
            success: true,
            message: `💰 Vendiste ${cantidad} ${recurso} por ${total} tokens`,
            tokensEarned: total,
            currentTokens: player.inventario.tokens
        };
    }
}

/**
 * Servicio de Diálogos - Interacción con NPCs
 */
export class DialogueService {
    constructor(world) {
        this.world = world;
    }

    /**
     * Iniciar diálogo con NPC
     */
    talk(player, npcId) {
        const npc = this.world.npcs[npcId];

        if (!npc) {
            return {
                success: false,
                message: '❌ NPC no encontrado'
            };
        }

        if (!npc.vivo) {
            return {
                success: false,
                message: `💀 ${npc.nombre} no puede hablar...`
            };
        }

        // Verificar ubicación
        if (npc.locacion !== player.locacion) {
            return {
                success: false,
                message: `📍 ${npc.nombre} no está aquí`
            };
        }

        // Obtener diálogo según relación
        const relacion = npc.relaciones?.[player.id] || 50;
        const dialogo = this._getDialogue(npc, relacion);

        // Mejorar relación levemente
        if (!npc.relaciones) npc.relaciones = {};
        npc.relaciones[player.id] = Math.min(100, relacion + 1);

        return {
            success: true,
            npc: {
                id: npcId,
                nombre: npc.nombre,
                dialogo: dialogo,
                relacion: npc.relaciones[player.id],
                estado: this._getNpcMood(npc)
            }
        };
    }

    _getDialogue(npc, relacion) {
        const dialogues = {
            high: [
                "¡Amigo! Me alegra verte. ¿En qué puedo ayudarte?",
                "Confío en ti. Cuéntame, ¿qué necesitas?",
                "Siempre es un placer hablar contigo."
            ],
            medium: [
                "Hola. ¿Qué necesitas?",
                "¿En qué puedo ayudarte?",
                "Dime."
            ],
            low: [
                "¿Qué quieres?",
                "No tengo tiempo para charlas.",
                "Habla rápido."
            ]
        };

        let category = 'medium';
        if (relacion >= 75) category = 'high';
        else if (relacion < 30) category = 'low';

        const options = dialogues[category];
        return options[Math.floor(Math.random() * options.length)];
    }

    _getNpcMood(npc) {
        if (npc.salud < 30) return '🤕 Herido';
        if (npc.moral > 75) return '😊 Feliz';
        if (npc.moral < 30) return '😔 Deprimido';
        if (npc.hambre > 70) return '😰 Hambriento';
        return '😐 Normal';
    }

    /**
     * Dar recursos a NPC (gift)
     */
    giveGift(player, npcId, recurso, cantidad) {
        const npc = this.world.npcs[npcId];

        if (!npc) {
            return {
                success: false,
                message: '❌ NPC no encontrado'
            };
        }

        if (!player.inventario[recurso] || player.inventario[recurso] < cantidad) {
            return {
                success: false,
                message: `❌ No tienes ${cantidad} ${recurso}`
            };
        }

        // Transferir recursos
        player.inventario[recurso] -= cantidad;
        if (!npc.inventario) npc.inventario = {};
        npc.inventario[recurso] = (npc.inventario[recurso] || 0) + cantidad;

        // Calcular mejora de relación según el regalo
        const valorGifts = {
            comida: 10,
            medicinas: 15,
            armas: 5,
            materiales: 5
        };

        const relacionBonus = (valorGifts[recurso] || 5) * cantidad;

        if (!npc.relaciones) npc.relaciones = {};
        const relacionAnterior = npc.relaciones[player.id] || 50;
        npc.relaciones[player.id] = Math.min(100, relacionAnterior + relacionBonus);

        // Efectos especiales según el recurso
        if (recurso === 'comida') {
            npc.hambre = Math.max(0, (npc.hambre || 50) - 20 * cantidad);
            npc.moral = Math.min(100, (npc.moral || 50) + 10);
        } else if (recurso === 'medicinas') {
            npc.salud = Math.min(100, (npc.salud || 50) + 25 * cantidad);
            npc.moral = Math.min(100, (npc.moral || 50) + 15);
        }

        const respuestas = [
            '¡Muchas gracias! Esto me ayuda mucho.',
            '¡Eres muy amable! No olvidaré esto.',
            'Esto significa mucho para mí. Gracias.',
            '¡Increíble! Justo lo que necesitaba.'
        ];

        return {
            success: true,
            message: `💝 ${npc.nombre}: "${respuestas[Math.floor(Math.random() * respuestas.length)]}"`,
            npc: {
                nombre: npc.nombre,
                relacion: npc.relaciones[player.id],
                relacionAnterior: relacionAnterior,
                mejora: relacionBonus
            }
        };
    }
}

/**
 * Servicio de Movimiento - Navegación entre locaciones
 */
export class MovementService {
    constructor(world) {
        this.world = world;
    }

    /**
     * Mover jugador a otra locación
     */
    move(player, targetId) {
        const currentLoc = this.world.locations[player.locacion];
        const targetLoc = this.world.locations[targetId];

        // Validaciones
        if (!currentLoc) {
            return {
                success: false,
                message: '❌ Locación actual no válida'
            };
        }

        if (!targetLoc) {
            return {
                success: false,
                message: '❌ Locación destino no encontrada'
            };
        }

        if (!currentLoc.conectado_a || !currentLoc.conectado_a.includes(targetId)) {
            return {
                success: false,
                message: `🚫 No hay camino desde ${currentLoc.nombre} a ${targetLoc.nombre}`
            };
        }

        if (player.inCombat) {
            return {
                success: false,
                message: '⚔️ No puedes moverte durante el combate'
            };
        }

        // Ejecutar movimiento
        const previousLoc = player.locacion;
        player.locacion = targetId;

        // Trackear locaciones visitadas
        if (!player.visitedLocations) player.visitedLocations = new Set();
        const isNewLocation = !player.visitedLocations.has(targetId);
        player.visitedLocations.add(targetId);

        // Bonus por exploración
        let xpBonus = 0;
        if (isNewLocation) {
            xpBonus = 10;
        }

        return {
            success: true,
            message: `📍 Te mudaste a ${targetLoc.nombre}`,
            location: {
                id: targetLoc.id,
                nombre: targetLoc.nombre,
                descripcion: targetLoc.descripcion,
                tipo: targetLoc.tipo,
                zombies: targetLoc.zombies,
                recursos: targetLoc.recursos
            },
            isNewLocation,
            xpBonus,
            previousLocation: previousLoc
        };
    }

    /**
     * Obtener locaciones disponibles desde la posición actual
     */
    getAvailableLocations(player) {
        const currentLoc = this.world.locations[player.locacion];

        if (!currentLoc || !currentLoc.conectado_a) {
            return {
                success: false,
                message: '❌ No hay locaciones conectadas'
            };
        }

        const available = currentLoc.conectado_a.map(locId => {
            const loc = this.world.locations[locId];
            const visited = player.visitedLocations?.has(locId) || false;

            return {
                id: loc.id,
                nombre: loc.nombre,
                tipo: loc.tipo,
                peligro: this._calculateDanger(loc),
                visitado: visited,
                zombies: loc.zombies,
                descripcionCorta: this._getShortDescription(loc)
            };
        });

        return {
            success: true,
            locations: available,
            currentLocation: currentLoc.nombre
        };
    }

    _calculateDanger(location) {
        if (location.tipo === 'safe') return 'Seguro';
        if (location.zombies > 10) return 'Muy Peligroso';
        if (location.zombies > 5) return 'Peligroso';
        if (location.zombies > 0) return 'Moderado';
        return 'Limpiado';
    }

    _getShortDescription(location) {
        const descriptions = {
            safe: '✓ Zona segura',
            loot: '📦 Recursos disponibles',
            dangerous: '⚠️ Zona peligrosa'
        };
        return descriptions[location.tipo] || '';
    }
}

/**
 * Servicio de Inventario - Gestión de items
 */
export class InventoryService {
    constructor() {
        this.maxStack = 999;
    }

    /**
     * Consumir comida
     */
    eat(player) {
        if (!player.inventario?.comida || player.inventario.comida < 1) {
            return {
                success: false,
                message: '❌ No tienes comida en tu inventario'
            };
        }

        if (player.stats.hambre <= 10) {
            return {
                success: false,
                message: '🍖 No tienes hambre en este momento'
            };
        }

        player.inventario.comida--;
        player.stats.hambre = Math.max(0, player.stats.hambre - 30);
        player.stats.vida = Math.min(
            player.stats.vidaMaxima || 100,
            player.stats.vida + 5
        );

        return {
            success: true,
            message: '🍖 Comiste. Te sientes mejor',
            stats: {
                hambre: player.stats.hambre,
                vida: player.stats.vida
            },
            inventory: player.inventario
        };
    }

    /**
     * Usar medicina
     */
    heal(player) {
        if (!player.inventario?.medicinas || player.inventario.medicinas < 1) {
            return {
                success: false,
                message: '❌ No tienes medicinas'
            };
        }

        if (player.stats.vida >= (player.stats.vidaMaxima || 100)) {
            return {
                success: false,
                message: '💊 Ya estás con salud completa'
            };
        }

        player.inventario.medicinas--;
        const healAmount = 40;
        player.stats.vida = Math.min(
            player.stats.vidaMaxima || 100,
            player.stats.vida + healAmount
        );

        return {
            success: true,
            message: `💊 Usaste medicina. Recuperaste ${healAmount} de vida`,
            stats: {
                vida: player.stats.vida,
                vidaMaxima: player.stats.vidaMaxima || 100
            },
            inventory: player.inventario
        };
    }

    /**
     * Transferir items entre jugadores
     */
    transfer(fromPlayer, toPlayer, recurso, cantidad) {
        if (!fromPlayer.inventario[recurso] || fromPlayer.inventario[recurso] < cantidad) {
            return {
                success: false,
                message: `❌ No tienes ${cantidad} ${recurso}`
            };
        }

        fromPlayer.inventario[recurso] -= cantidad;
        if (!toPlayer.inventario) toPlayer.inventario = {};
        toPlayer.inventario[recurso] = (toPlayer.inventario[recurso] || 0) + cantidad;

        return {
            success: true,
            message: `📦 Transferiste ${cantidad} ${recurso} a ${toPlayer.nombre}`,
            fromInventory: fromPlayer.inventario,
            toInventory: toPlayer.inventario
        };
    }

    /**
     * Obtener resumen del inventario
     */
    getSummary(player) {
        const inventory = player.inventario || {};
        const total = Object.values(inventory).reduce((sum, val) => sum + val, 0);

        const categorized = {
            supervivencia: {
                comida: inventory.comida || 0,
                medicinas: inventory.medicinas || 0
            },
            combate: {
                armas: inventory.armas || 0
            },
            construccion: {
                materiales: inventory.materiales || 0
            },
            moneda: {
                tokens: inventory.tokens || 0
            }
        };

        return {
            success: true,
            inventory: inventory,
            categorized: categorized,
            totalItems: total,
            capacity: this.maxStack
        };
    }
}

