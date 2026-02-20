/**
 * SISTEMA DE ECONOMÍA
 * Maneja moneda, precios, transacciones y valor de items
 */

export default class EconomySystem {
    constructor() {
        this.currency = 'caps'; // Nombre de la moneda
        this.initializePrices();
        this.initializeEarningRates();
    }

    /**
     * PRECIOS BASE DE ITEMS
     */
    initializePrices() {
        this.basePrices = {
            // ===== MATERIALES =====
            materiales: 5,
            madera: 3,
            metal: 10,
            componentes: 25,
            tela: 8,
            cuerda: 6,
            químicos: 15,
            combustible: 12,

            // ===== RECURSOS BÁSICOS =====
            comida: 8,
            agua: 5,
            medicinas: 20,

            // ===== ARMAS BÁSICAS =====
            cuchillo: 50,
            bate: 75,
            lanza: 100,
            machete: 150,
            arco: 200,

            // ===== ARMAS AVANZADAS =====
            pistola: 500,
            escopeta: 800,
            rifle: 1200,
            ballesta: 600,
            katana: 2000,

            // ===== ARMADURAS =====
            ropa_reforzada: 100,
            chaleco_improvisado: 200,
            armadura_ligera: 400,
            chaleco_tactico: 600,
            armadura_pesada: 1000,
            armadura_militar: 1500,
            armadura_combate: 2500,

            // ===== MUNICIÓN =====
            flechas: 2, // por unidad
            balas_9mm: 3,
            cartuchos: 5,
            balas_rifle: 4,
            explosivos_caseros: 50,

            // ===== CONSUMIBLES =====
            vendaje: 25,
            botiquin_basico: 50,
            antidoto: 80,
            estimulante: 60,
            antibiotico: 100,
            medx_avanzado: 150,
            adrenalina: 120,
            elixir_completo: 300,

            // ===== EXPLOSIVOS =====
            molotov: 40,
            granada_casera: 100,
            c4: 250,
            mina_antipersonal: 180,
            granada_fragmentacion: 200,

            // ===== UTILIDADES =====
            trampa: 60,
            barricada: 80,
            radio: 500,
            generador: 1000,
            torreta_automatica: 2000,

            // ===== MODIFICADORES =====
            silenciador: 200,
            mira_telescopica: 250,
            cargador_extendido: 150,
            empunadura_reforzada: 100,
            bayoneta: 120,
            canon_largo: 180,
            placas_balisticas: 300,
            kevlar_reforzado: 250,
            bolsillos_tacticos: 150,
            aislamiento_termico: 200,
            camo_urbano: 180,
            refuerzo_hombros: 160
        };

        // Multiplicadores por rareza
        this.rarityMultipliers = {
            'común': 1.0,
            'poco común': 1.5,
            'raro': 2.5,
            'épico': 4.0,
            'legendario': 8.0
        };

        // Multiplicadores de compra/venta
        this.sellPriceMultiplier = 0.5; // Vender a NPCs da 50% del valor
        this.buyPriceMultiplier = 1.2; // Comprar a NPCs cuesta 120% del valor base
        this.playerTradeTax = 0.05; // 5% de impuesto en comercio entre jugadores
        this.marketplaceTax = 0.1; // 10% de impuesto en el mercado
    }

    /**
     * TASAS DE GANANCIA DE MONEDA
     */
    initializeEarningRates() {
        this.earningRates = {
            // Por actividad
            zombie_killed: 10,
            quest_completed: 50,
            location_explored: 25,
            item_crafted_common: 5,
            item_crafted_uncommon: 10,
            item_crafted_rare: 25,
            item_crafted_epic: 50,
            item_crafted_legendary: 100,
            player_helped: 20,
            construction_contributed: 15,
            event_participated: 30,

            // Por nivel de zombie
            zombie_corredor: 15,
            zombie_griton: 12,
            zombie_tanque: 25,
            zombie_explosivo: 30,
            zombie_toxico: 28,
            zombie_radiactivo: 35,
            zombie_cazador: 40,
            zombie_berserker: 45,
            zombie_abominacion: 100,

            // Bonificación por racha
            kill_streak_5: 50,
            kill_streak_10: 100,
            kill_streak_20: 250,

            // Recompensas diarias
            daily_login: 100,
            daily_quest_bonus: 200,
            weekly_bonus: 500
        };
    }

    /**
     * Obtener precio de un item
     */
    getItemPrice(itemKey, quantity = 1, rarity = 'común') {
        const basePrice = this.basePrices[itemKey] || 10;
        const rarityMultiplier = this.rarityMultipliers[rarity] || 1.0;
        return Math.floor(basePrice * rarityMultiplier * quantity);
    }

    /**
     * Calcular precio de venta a NPC
     */
    getSellPrice(itemKey, quantity = 1, rarity = 'común') {
        const basePrice = this.getItemPrice(itemKey, quantity, rarity);
        return Math.floor(basePrice * this.sellPriceMultiplier);
    }

    /**
     * Calcular precio de compra a NPC
     */
    getBuyPrice(itemKey, quantity = 1, rarity = 'común') {
        const basePrice = this.getItemPrice(itemKey, quantity, rarity);
        return Math.floor(basePrice * this.buyPriceMultiplier);
    }

    /**
     * Calcular impuesto de comercio entre jugadores
     */
    calculateTradeTax(amount) {
        return Math.floor(amount * this.playerTradeTax);
    }

    /**
     * Calcular impuesto del mercado
     */
    calculateMarketplaceTax(amount) {
        return Math.floor(amount * this.marketplaceTax);
    }

    /**
     * Otorgar moneda a un jugador
     */
    giveCurrency(player, amount, reason = 'unknown') {
        if (!player.currency) player.currency = 0;
        player.currency += amount;

        // Tracking de estadísticas
        if (!player.stats.currency_earned) player.stats.currency_earned = 0;
        player.stats.currency_earned += amount;

        console.log(`💰 ${player.nombre} ganó ${amount} ${this.currency} (${reason})`);

        return {
            success: true,
            newBalance: player.currency,
            amount,
            reason
        };
    }

    /**
     * Quitar moneda a un jugador
     */
    takeCurrency(player, amount, reason = 'purchase') {
        if (!player.currency) player.currency = 0;

        if (player.currency < amount) {
            return {
                success: false,
                error: `No tienes suficiente ${this.currency}`,
                needed: amount,
                current: player.currency,
                missing: amount - player.currency
            };
        }

        player.currency -= amount;

        // Tracking de estadísticas
        if (!player.stats.currency_spent) player.stats.currency_spent = 0;
        player.stats.currency_spent += amount;

        console.log(`💸 ${player.nombre} gastó ${amount} ${this.currency} (${reason})`);

        return {
            success: true,
            newBalance: player.currency,
            amount,
            reason
        };
    }

    /**
     * Transferir moneda entre jugadores
     */
    transferCurrency(fromPlayer, toPlayer, amount, reason = 'transfer') {
        // Validar monto
        if (amount <= 0) {
            return {
                success: false,
                error: 'Monto inválido'
            };
        }

        // Calcular impuesto
        const tax = this.calculateTradeTax(amount);
        const totalCost = amount + tax;

        // Verificar fondos suficientes
        const takeResult = this.takeCurrency(fromPlayer, totalCost, reason);
        if (!takeResult.success) {
            return takeResult;
        }

        // Dar moneda al receptor
        this.giveCurrency(toPlayer, amount, reason);

        console.log(`💱 Transferencia: ${fromPlayer.nombre} → ${toPlayer.nombre}: ${amount} ${this.currency} (impuesto: ${tax})`);

        return {
            success: true,
            amount,
            tax,
            totalCost,
            senderBalance: fromPlayer.currency,
            receiverBalance: toPlayer.currency
        };
    }

    /**
     * Comprar item a NPC
     */
    buyFromNPC(player, itemKey, quantity = 1) {
        const price = this.getBuyPrice(itemKey, quantity);

        const takeResult = this.takeCurrency(player, price, `buy_${itemKey}`);
        if (!takeResult.success) {
            return takeResult;
        }

        // Añadir item al inventario
        if (!player.inventario[itemKey]) player.inventario[itemKey] = 0;
        player.inventario[itemKey] += quantity;

        // Stats
        if (!player.stats.items_comprados) player.stats.items_comprados = 0;
        player.stats.items_comprados += quantity;

        return {
            success: true,
            item: itemKey,
            quantity,
            price,
            newBalance: player.currency
        };
    }

    /**
     * Vender item a NPC
     */
    sellToNPC(player, itemKey, quantity = 1) {
        // Verificar que tiene el item
        if (!player.inventario[itemKey] || player.inventario[itemKey] < quantity) {
            return {
                success: false,
                error: 'No tienes suficientes items para vender'
            };
        }

        const price = this.getSellPrice(itemKey, quantity);

        // Quitar item del inventario
        player.inventario[itemKey] -= quantity;
        if (player.inventario[itemKey] <= 0) {
            delete player.inventario[itemKey];
        }

        // Dar moneda
        this.giveCurrency(player, price, `sell_${itemKey}`);

        // Stats
        if (!player.stats.items_vendidos) player.stats.items_vendidos = 0;
        player.stats.items_vendidos += quantity;

        return {
            success: true,
            item: itemKey,
            quantity,
            price,
            newBalance: player.currency
        };
    }

    /**
     * Recompensa por matar zombie
     */
    rewardZombieKill(player, zombieType = 'normal') {
        const baseReward = this.earningRates.zombie_killed;
        const typeBonus = this.earningRates[`zombie_${zombieType}`] || 0;
        const totalReward = baseReward + typeBonus;

        return this.giveCurrency(player, totalReward, `zombie_kill_${zombieType}`);
    }

    /**
     * Recompensa por completar quest
     */
    rewardQuestCompletion(player, questDifficulty = 'normal') {
        const baseReward = this.earningRates.quest_completed;
        const multiplier = {
            'fácil': 0.5,
            'normal': 1.0,
            'difícil': 1.5,
            'épico': 2.5,
            'legendario': 4.0
        }[questDifficulty] || 1.0;

        const reward = Math.floor(baseReward * multiplier);
        return this.giveCurrency(player, reward, 'quest_completed');
    }

    /**
     * Recompensa por crafteo
     */
    rewardCrafting(player, itemRarity = 'común') {
        const rarityKey = `item_crafted_${itemRarity.toLowerCase().replace(' ', '')}`;
        const reward = this.earningRates[rarityKey] || this.earningRates.item_crafted_common;

        return this.giveCurrency(player, reward, 'crafting');
    }

    /**
     * Recompensa diaria
     */
    rewardDailyLogin(player) {
        // Verificar si ya recibió recompensa hoy
        const today = new Date().toDateString();
        if (player.lastDailyReward === today) {
            return {
                success: false,
                error: 'Ya recibiste la recompensa diaria de hoy'
            };
        }

        player.lastDailyReward = today;

        // Bonus por días consecutivos
        if (!player.loginStreak) player.loginStreak = 0;
        player.loginStreak++;

        const baseReward = this.earningRates.daily_login;
        const streakBonus = Math.min(player.loginStreak * 10, 500); // Max 500 bonus
        const totalReward = baseReward + streakBonus;

        const result = this.giveCurrency(player, totalReward, 'daily_login');
        result.loginStreak = player.loginStreak;
        result.streakBonus = streakBonus;

        return result;
    }

    /**
     * Obtener inventario valorizado de un jugador
     */
    getInventoryValue(player) {
        let totalValue = 0;
        const itemValues = {};

        for (const [itemKey, quantity] of Object.entries(player.inventario || {})) {
            const value = this.getSellPrice(itemKey, quantity);
            itemValues[itemKey] = value;
            totalValue += value;
        }

        return {
            totalValue,
            itemValues,
            currency: player.currency || 0,
            netWorth: totalValue + (player.currency || 0)
        };
    }

    /**
     * Obtener estadísticas económicas del jugador
     */
    getEconomyStats(player) {
        const inventoryValue = this.getInventoryValue(player);

        return {
            currency: player.currency || 0,
            currencyEarned: player.stats.currency_earned || 0,
            currencySpent: player.stats.currency_spent || 0,
            itemsBought: player.stats.items_comprados || 0,
            itemsSold: player.stats.items_vendidos || 0,
            inventoryValue: inventoryValue.totalValue,
            netWorth: inventoryValue.netWorth,
            loginStreak: player.loginStreak || 0,
            lastDailyReward: player.lastDailyReward || null
        };
    }

    /**
     * Generar tienda de NPC con inventario aleatorio
     */
    generateNPCShop(npcType = 'general', playerLevel = 1) {
        const shopInventories = {
            general: {
                items: ['comida', 'agua', 'materiales', 'vendaje', 'cuchillo', 'bate'],
                stock: { min: 5, max: 20 }
            },
            armero: {
                items: ['pistola', 'escopeta', 'balas_9mm', 'cartuchos', 'cuchillo', 'machete'],
                stock: { min: 2, max: 10 }
            },
            medico: {
                items: ['medicinas', 'vendaje', 'botiquin_basico', 'antibiotico', 'antidoto'],
                stock: { min: 3, max: 15 }
            },
            comerciante: {
                items: ['materiales', 'metal', 'componentes', 'tela', 'cuerda', 'químicos'],
                stock: { min: 10, max: 30 }
            },
            especialista: {
                items: ['silenciador', 'mira_telescopica', 'placas_balisticas', 'kevlar_reforzado'],
                stock: { min: 1, max: 5 }
            }
        };

        const shopData = shopInventories[npcType] || shopInventories.general;
        const inventory = [];

        for (const itemKey of shopData.items) {
            const stock = Math.floor(Math.random() * (shopData.stock.max - shopData.stock.min + 1)) + shopData.stock.min;
            const price = this.getBuyPrice(itemKey, 1);

            // Items de nivel alto no aparecen para jugadores de bajo nivel
            if (price > playerLevel * 100 && Math.random() > 0.3) continue;

            inventory.push({
                item: itemKey,
                stock,
                price,
                pricePerUnit: price
            });
        }

        return {
            npcType,
            inventory,
            refreshTime: Date.now() + (3600000 * 6) // 6 horas
        };
    }
}
