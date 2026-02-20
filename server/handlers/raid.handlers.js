/**
 * Raid Handlers - Sistema de Raids PvE contra zombies
 * Fase 5 de refactorización
 * 
 * Handlers:
 * - raid:get_active - Obtener raids activos y programados
 * - raid:get_status - Estado del refugio
 * - raid:attack_zombie - Atacar zombie en raid
 * - raid:place_defense - Colocar defensas
 * - raid:repair_refuge - Reparar el refugio
 * - raid:get_history - Historial de raids
 * - raid:get_top_defenders - Top defensores
 * - raid:get_my_stats - Estadísticas del jugador
 * - raid:get_info - Información de un raid específico
 */

export function createRaidHandlers({
    WORLD,
    raidSystem,
    raidPersistence,
    advancedCombat,
    economySystem,
    sendSuccess,
    sendError,
    createHandler,
    broadcast
}) {
    return {
        'raid:get_active': createHandler(async (msg, ws, playerId) => {
            if (!raidSystem) {
                return sendError(ws, 'Sistema de raids no disponible');
            }

            const activeRaid = raidSystem.getActiveRaid();
            const scheduled = raidSystem.getScheduledRaids();

            sendSuccess(ws, {
                type: 'raid:active',
                activeRaid: activeRaid ? raidSystem.getRaidInfo(activeRaid.id) : null,
                scheduledRaids: scheduled.map(r => ({
                    id: r.id,
                    type: r.type,
                    name: r.name,
                    difficulty: r.difficulty,
                    scheduledFor: r.scheduledFor,
                    status: r.status
                }))
            });
        }),

        'raid:get_status': createHandler(async (msg, ws, playerId) => {
            if (!raidSystem) {
                return sendError(ws, 'Sistema de raids no disponible');
            }

            const status = raidSystem.getRefugeStatus();

            sendSuccess(ws, {
                type: 'raid:status',
                refuge: status
            });
        }),

        'raid:attack_zombie': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!raidSystem) {
                return sendError(ws, 'Sistema de raids no disponible');
            }

            const activeRaid = raidSystem.getActiveRaid();
            if (!activeRaid) {
                return sendError(ws, 'No hay raid activo');
            }

            const { zombieId } = msg;

            // Calcular daño según arma equipada (integración con Fase 13)
            let damage = player.atributos.fuerza * 10;
            if (player.equippedWeapon && advancedCombat) {
                const weapon = advancedCombat.getWeapon(player.equippedWeapon);
                if (weapon) {
                    damage = weapon.baseDamage;
                }
            }

            const result = raidSystem.attackZombie(playerId, player.nombre, zombieId, damage);

            if (!result.success) {
                return sendError(ws, result.error);
            }

            // Dar recompensas inmediatas
            if (result.killed && economySystem) {
                economySystem.giveCurrency(player, result.reward.caps, 'zombie_kill_raid');
                player.xp += result.reward.xp;
            }

            // Broadcast a todos los participantes
            broadcast({
                type: 'raid:zombie_attacked',
                playerId: playerId,
                playerName: player.nombre,
                zombieId: zombieId,
                damage: damage,
                killed: result.killed,
                zombieType: result.zombieType,
                reward: result.reward
            });

            sendSuccess(ws, {
                type: 'raid:attack_result',
                ...result
            });
        }),

        'raid:place_defense': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!raidSystem) {
                return sendError(ws, 'Sistema de raids no disponible');
            }

            const activeRaid = raidSystem.getActiveRaid();
            if (!activeRaid) {
                return sendError(ws, 'No hay raid activo');
            }

            const { defenseType, position } = msg;

            // Verificar que el jugador tenga los recursos
            const costs = {
                trampa_puas: { materiales: 10, metal: 5 },
                mina_terrestre: { materiales: 20, químicos: 10 },
                alambre_puas: { metal: 15, cuerda: 5 },
                molotov_auto: { combustible: 10, tela: 5 },
                red_electrica: { componentes: 15, metal: 10 }
            };

            const cost = costs[defenseType];
            if (!cost) {
                return sendError(ws, 'Tipo de defensa inválido');
            }

            for (const [resource, amount] of Object.entries(cost)) {
                if (!player.inventario[resource] || player.inventario[resource] < amount) {
                    return sendError(ws, `Necesitas ${amount} ${resource}`);
                }
            }

            // Deducir recursos
            for (const [resource, amount] of Object.entries(cost)) {
                player.inventario[resource] -= amount;
            }

            const result = raidSystem.placeDefense(playerId, player.nombre, defenseType, position);

            if (!result.success) {
                // Devolver recursos si falla
                for (const [resource, amount] of Object.entries(cost)) {
                    player.inventario[resource] += amount;
                }
                return sendError(ws, result.error);
            }

            broadcast({
                type: 'raid:defense_placed',
                playerId: playerId,
                playerName: player.nombre,
                defense: result.defense
            });

            sendSuccess(ws, {
                type: 'raid:defense_placed',
                defense: result.defense,
                inventario: player.inventario
            });

            console.log(`🎯 ${player.nombre} colocó ${defenseType} en raid`);
        }),

        'raid:repair_refuge': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!raidSystem) {
                return sendError(ws, 'Sistema de raids no disponible');
            }

            const activeRaid = raidSystem.getActiveRaid();
            if (!activeRaid) {
                return sendError(ws, 'No hay raid activo');
            }

            const { amount } = msg;

            // Verificar que tenga materiales
            const costPerHP = 2;
            const materialsNeeded = amount * costPerHP;

            if (!player.inventario.materiales || player.inventario.materiales < materialsNeeded) {
                return sendError(ws, `Necesitas ${materialsNeeded} materiales`);
            }

            // Deducir materiales
            player.inventario.materiales -= materialsNeeded;

            const result = raidSystem.repairRefuge(playerId, player.nombre, amount);

            if (!result.success) {
                // Devolver materiales si falla
                player.inventario.materiales += materialsNeeded;
                return sendError(ws, result.error);
            }

            broadcast({
                type: 'raid:refuge_repaired',
                playerId: playerId,
                playerName: player.nombre,
                repaired: result.repaired,
                newHealth: result.newHealth,
                maxHealth: result.maxHealth
            });

            sendSuccess(ws, {
                type: 'raid:repair_result',
                ...result,
                inventario: player.inventario
            });

            console.log(`🔧 ${player.nombre} reparó refugio +${result.repaired} HP`);
        }),

        'raid:get_history': createHandler(async (msg, ws, playerId) => {
            if (!raidPersistence) {
                return sendError(ws, 'Persistencia de raids no disponible');
            }

            const limit = msg.limit || 10;
            const history = raidPersistence.getRaidHistory(limit);

            sendSuccess(ws, {
                type: 'raid:history',
                raids: history
            });
        }),

        'raid:get_top_defenders': createHandler(async (msg, ws, playerId) => {
            if (!raidPersistence) {
                return sendError(ws, 'Persistencia de raids no disponible');
            }

            const limit = msg.limit || 10;
            const topDefenders = raidPersistence.getTopDefenders(limit);

            sendSuccess(ws, {
                type: 'raid:top_defenders',
                defenders: topDefenders
            });
        }),

        'raid:get_my_stats': createHandler(async (msg, ws, playerId) => {
            if (!raidPersistence) {
                return sendError(ws, 'Persistencia de raids no disponible');
            }

            const stats = raidPersistence.getPlayerStats(playerId);
            const myRaids = raidPersistence.getPlayerRaids(playerId, 10);

            sendSuccess(ws, {
                type: 'raid:my_stats',
                stats: stats || {
                    total_raids_participated: 0,
                    total_raids_won: 0,
                    total_zombies_killed: 0,
                    total_damage_dealt: 0,
                    total_caps_earned: 0
                },
                recentRaids: myRaids
            });
        }),

        'raid:get_info': createHandler(async (msg, ws, playerId) => {
            if (!raidSystem) {
                return sendError(ws, 'Sistema de raids no disponible');
            }

            const { raidId } = msg;
            const raidInfo = raidSystem.getRaidInfo(raidId);

            if (!raidInfo) {
                return sendError(ws, 'Raid no encontrado');
            }

            sendSuccess(ws, {
                type: 'raid:info',
                raid: raidInfo
            });
        })
    };
}
