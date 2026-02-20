/**
 * HANDLERS DE CRAFTEO AVANZADO (FASE 14)
 * Extraído de survival_mvp.js para mejor organización
 */

export function createCraftingHandlers({
    WORLD,
    advancedCrafting,
    economySystem,
    rateLimiter,
    giveXP,
    sendSuccess,
    sendError,
    createHandler
}) {
    return {
        // ===== SISTEMA DE CRAFTEO AVANZADO (FASE 14) =====

        'craft:get_recipes': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!advancedCrafting) {
                return sendError(ws, 'Sistema de crafteo no disponible');
            }

            const workbench = msg.workbench || player.workbench || 'básico';
            const category = msg.category || 'all';

            const available = advancedCrafting.getAvailableRecipes(player, workbench, category);

            sendSuccess(ws, {
                type: 'craft:recipes',
                recipes: available.recipes,
                workbench: available.workbench,
                playerLevel: player.nivel || 1
            });
        }),

        'craft:item': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!advancedCrafting) {
                return sendError(ws, 'Sistema de crafteo no disponible');
            }

            // Rate limiting: max 20 crafts por minuto
            const rateLimit = rateLimiter.check(playerId, 'craft', 20, 60000);
            if (!rateLimit.allowed) {
                const segundos = Math.ceil(rateLimit.resetIn / 1000);
                return sendError(ws, `⏱️ Demasiado rápido. Espera ${segundos}s`);
            }

            const recipeKey = msg.recipe;
            const quantity = msg.quantity || 1;
            const workbench = msg.workbench || player.workbench || 'básico';

            const result = advancedCrafting.craft(player, recipeKey, quantity, workbench);

            if (!result.success) {
                return sendError(ws, result.message);
            }

            // Actualizar inventario del jugador
            for (const [material, cantidad] of Object.entries(result.materialsUsed)) {
                player.inventario[material] = (player.inventario[material] || 0) - cantidad;
                if (player.inventario[material] <= 0) {
                    delete player.inventario[material];
                }
            }

            // Agregar items crafteados al inventario
            player.inventario[result.itemKey] = (player.inventario[result.itemKey] || 0) + result.quantityCrafted;

            // XP por craftear
            const xpGain = result.recipe.xp * result.quantityCrafted;
            giveXP(player, xpGain, ws);

            // Recompensa de moneda (FASE 15)
            if (economySystem && result.recipe.rareza) {
                const currencyReward = economySystem.rewardCrafting(player, result.recipe.rareza);
                if (currencyReward.success) {
                    ws.send(JSON.stringify({
                        type: 'economy:currency_gained',
                        amount: currencyReward.amount,
                        newBalance: currencyReward.newBalance,
                        reason: 'crafting'
                    }));
                }
            }

            // Incrementar contador de items crafteados
            player.stats.items_crafteados = (player.stats.items_crafteados || 0) + result.quantityCrafted;

            sendSuccess(ws, {
                type: 'craft:success',
                item: result.itemKey,
                quantity: result.quantityCrafted,
                recipe: result.recipe,
                timeSeconds: result.timeSeconds,
                xpGained: xpGain,
                inventario: player.inventario,
                message: `✅ ${result.recipe.nombre} x${result.quantityCrafted} creado`
            });

            console.log(`🔨 ${player.nombre} crafteó ${result.quantityCrafted}x ${result.recipe.nombre}`);
        }),

        'craft:upgrade': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!advancedCrafting) {
                return sendError(ws, 'Sistema de crafteo no disponible');
            }

            const itemKey = msg.item;
            const workbench = msg.workbench || player.workbench || 'básico';

            // Verificar que el jugador tiene el item
            if (!player.inventario[itemKey] || player.inventario[itemKey] <= 0) {
                return sendError(ws, 'No tienes ese item');
            }

            const result = advancedCrafting.upgrade(player, itemKey, workbench);

            if (!result.success) {
                return sendError(ws, result.message);
            }

            // Consumir materiales
            for (const [material, cantidad] of Object.entries(result.upgrade.materiales)) {
                player.inventario[material] = (player.inventario[material] || 0) - cantidad;
                if (player.inventario[material] <= 0) {
                    delete player.inventario[material];
                }
            }

            // Remover item original
            player.inventario[itemKey]--;
            if (player.inventario[itemKey] <= 0) {
                delete player.inventario[itemKey];
            }

            // Agregar item mejorado
            const upgradedKey = result.upgradedItemKey;
            player.inventario[upgradedKey] = (player.inventario[upgradedKey] || 0) + 1;

            // XP por mejorar
            const xpGain = result.upgrade.xp || 50;
            giveXP(player, xpGain, ws);

            player.stats.items_mejorados = (player.stats.items_mejorados || 0) + 1;

            sendSuccess(ws, {
                type: 'craft:upgraded',
                originalItem: itemKey,
                upgradedItem: upgradedKey,
                upgrade: result.upgrade,
                xpGained: xpGain,
                inventario: player.inventario,
                message: `⬆️ ${result.upgrade.nombreMejora} completada`
            });

            console.log(`⬆️ ${player.nombre} mejoró ${itemKey} a ${upgradedKey}`);
        }),

        'craft:apply_modifier': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!advancedCrafting) {
                return sendError(ws, 'Sistema de crafteo no disponible');
            }

            const itemKey = msg.item;
            const modifierKey = msg.modifier;
            const workbench = msg.workbench || player.workbench || 'avanzado';

            // Verificar que tiene el item
            if (!player.inventario[itemKey] || player.inventario[itemKey] <= 0) {
                return sendError(ws, 'No tienes ese item');
            }

            const result = advancedCrafting.applyModifier(player, itemKey, modifierKey, workbench);

            if (!result.success) {
                return sendError(ws, result.message);
            }

            // Consumir materiales
            for (const [material, cantidad] of Object.entries(result.modifier.materiales)) {
                player.inventario[material] = (player.inventario[material] || 0) - cantidad;
                if (player.inventario[material] <= 0) {
                    delete player.inventario[material];
                }
            }

            // Guardar modificador en el item del jugador
            if (!player.itemModifiers) player.itemModifiers = {};
            if (!player.itemModifiers[itemKey]) player.itemModifiers[itemKey] = [];
            player.itemModifiers[itemKey].push(modifierKey);

            // XP por aplicar modificador
            const xpGain = 30;
            giveXP(player, xpGain, ws);

            sendSuccess(ws, {
                type: 'craft:modifier_applied',
                item: itemKey,
                modifier: result.modifier,
                modifiers: player.itemModifiers[itemKey],
                xpGained: xpGain,
                inventario: player.inventario,
                message: `🔧 ${result.modifier.nombre} aplicado a ${itemKey}`
            });

            console.log(`🔧 ${player.nombre} aplicó ${modifierKey} a ${itemKey}`);
        }),

        'craft:build_workbench': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!advancedCrafting) {
                return sendError(ws, 'Sistema de crafteo no disponible');
            }

            const workbenchKey = msg.workbench;

            const result = advancedCrafting.buildWorkbench(player, workbenchKey);

            if (!result.success) {
                return sendError(ws, result.message);
            }

            // Consumir materiales
            for (const [material, cantidad] of Object.entries(result.workbench.materiales)) {
                player.inventario[material] = (player.inventario[material] || 0) - cantidad;
                if (player.inventario[material] <= 0) {
                    delete player.inventario[material];
                }
            }

            // Agregar workbench al jugador
            if (!player.workbenches) player.workbenches = [];
            player.workbenches.push(workbenchKey);
            player.workbench = workbenchKey; // Usar el nuevo workbench por defecto

            // XP por construir workbench
            const xpGain = result.workbench.xp || 100;
            giveXP(player, xpGain, ws);

            player.stats.workbenches_construidos = (player.stats.workbenches_construidos || 0) + 1;

            sendSuccess(ws, {
                type: 'craft:workbench_built',
                workbench: result.workbench,
                currentWorkbench: player.workbench,
                workbenches: player.workbenches,
                xpGained: xpGain,
                inventario: player.inventario,
                message: `🔨 ${result.workbench.nombre} construido`
            });

            console.log(`🏭 ${player.nombre} construyó ${result.workbench.nombre}`);
        }),

        'craft:get_info': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!advancedCrafting) {
                return sendError(ws, 'Sistema de crafteo no disponible');
            }

            const currentWorkbench = player.workbench || 'básico';
            const availableWorkbenches = player.workbenches || ['básico'];

            sendSuccess(ws, {
                type: 'craft:info',
                currentWorkbench,
                availableWorkbenches,
                workbenchInfo: advancedCrafting.workbenches[currentWorkbench],
                stats: {
                    items_crafteados: player.stats.items_crafteados || 0,
                    items_mejorados: player.stats.items_mejorados || 0,
                    workbenches_construidos: player.stats.workbenches_construidos || 0
                }
            });
        })
    };
}
