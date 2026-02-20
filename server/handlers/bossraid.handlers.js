/**
 * Boss Raid Handlers - Sistema de jefes cooperativos
 * - Gestión de bosses y raids activos
 * - Sistema de participación (join/leave)
 * - Combate cooperativo contra jefes
 * - Leaderboard, historial y logros
 * 
 * Comandos: 12
 * - bossraid:get_bosses, bossraid:get_active_raids
 * - bossraid:spawn_boss, bossraid:join, bossraid:leave
 * - bossraid:attack
 * - bossraid:get_raid_info, bossraid:get_participants
 * - bossraid:get_leaderboard, bossraid:get_history
 * - bossraid:get_achievements, bossraid:get_boss_stats
 */

export function createBossRaidHandlers({ WORLD, bossRaidSystem, advancedCombat, broadcast, sendSuccess, sendError, createHandler }) {
    return {

        'bossraid:get_bosses': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const bosses = bossRaidSystem.getAllBosses();

            sendSuccess(ws, {
                type: 'bossraid:bosses_list',
                bosses
            });
        }),

        'bossraid:get_active_raids': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const raids = bossRaidSystem.getActiveRaids();

            sendSuccess(ws, {
                type: 'bossraid:active_raids',
                raids
            });
        }),

        'bossraid:spawn_boss': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const { bossId, location } = msg;
            const result = bossRaidSystem.spawnBoss(bossId, location || 'wasteland');

            if (result.success) {
                // Broadcast a todos los jugadores
                broadcast({
                    type: 'bossraid:boss_spawned',
                    boss: result.boss,
                    location: result.location,
                    raid_id: result.raid_id,
                    message: `🐉 ¡${result.boss.name} ha aparecido en ${result.location}!`
                });

                sendSuccess(ws, result);
            } else {
                sendError(ws, result.error);
            }
        }),

        'bossraid:join': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const player = WORLD.players[playerId];
            if (!player) {
                return sendError(ws, 'Jugador no encontrado');
            }

            const { raidId } = msg;
            const result = bossRaidSystem.joinRaid(
                raidId,
                playerId,
                player.nombre,
                player.nivel || 1,
                player.salud || 100,
                player.saludMaxima || 100
            );

            if (result.success) {
                // Notificar a todos los participantes del raid
                const participants = bossRaidSystem.getRaidParticipants(raidId);

                for (const p of participants.participants) {
                    const targetWs = Object.values(WORLD.connections).find(c => c.playerId === p.player_id);
                    if (targetWs) {
                        targetWs.send(JSON.stringify({
                            type: 'bossraid:player_joined',
                            raid_id: raidId,
                            player_id: playerId,
                            player_name: player.nombre,
                            message: `${player.nombre} se unió al raid`
                        }));
                    }
                }

                sendSuccess(ws, {
                    type: 'bossraid:joined',
                    ...result
                });
            } else {
                sendError(ws, result.error);
            }
        }),

        'bossraid:leave': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const { raidId } = msg;
            const result = bossRaidSystem.leaveRaid(raidId, playerId);

            if (result.success) {
                const player = WORLD.players[playerId];

                // Notificar a los participantes restantes
                const participants = bossRaidSystem.getRaidParticipants(raidId);

                for (const p of participants.participants) {
                    const targetWs = Object.values(WORLD.connections).find(c => c.playerId === p.player_id);
                    if (targetWs) {
                        targetWs.send(JSON.stringify({
                            type: 'bossraid:player_left',
                            raid_id: raidId,
                            player_id: playerId,
                            player_name: player?.nombre || 'Jugador',
                            message: `${player?.nombre || 'Un jugador'} salió del raid`
                        }));
                    }
                }

                sendSuccess(ws, {
                    type: 'bossraid:left',
                    message: 'Saliste del raid'
                });
            } else {
                sendError(ws, result.error);
            }
        }),

        'bossraid:attack': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const player = WORLD.players[playerId];
            if (!player) {
                return sendError(ws, 'Jugador no encontrado');
            }

            const { raidId } = msg;

            // Calcular daño usando el sistema de combate avanzado
            let damage = player.atributos?.fuerza * 10 || 50;
            let isCritical = false;
            let weaponName = 'Puño';

            if (player.equippedWeapon && advancedCombat) {
                const weapon = advancedCombat.getWeapon(player.equippedWeapon);
                if (weapon) {
                    damage = weapon.baseDamage;
                    weaponName = weapon.nombre;

                    // Chance de crítico basado en suerte
                    const critChance = (player.atributos?.suerte || 5) / 100;
                    isCritical = Math.random() < critChance;

                    if (isCritical) {
                        damage *= 2;
                    }
                }
            }

            const result = bossRaidSystem.attackBoss(
                raidId,
                playerId,
                player.nombre,
                damage,
                isCritical,
                weaponName
            );

            if (result.success) {
                // Broadcast a todos los participantes
                const participants = bossRaidSystem.getRaidParticipants(raidId);

                for (const p of participants.participants) {
                    const targetWs = Object.values(WORLD.connections).find(c => c.playerId === p.player_id);
                    if (targetWs) {
                        targetWs.send(JSON.stringify({
                            type: 'bossraid:attack_result',
                            raid_id: raidId,
                            attacker_id: playerId,
                            attacker_name: player.nombre,
                            damage: result.damage,
                            is_critical: result.isCritical,
                            weapon_name: result.weaponName,
                            boss_hp: result.boss_hp,
                            boss_max_hp: result.boss_max_hp,
                            boss_hp_percent: result.boss_hp_percent,
                            phase_changed: result.phase_changed,
                            new_phase: result.new_phase,
                            boss_defeated: result.boss_defeated
                        }));
                    }
                }

                // Si cambió de fase, notificar con mensaje especial
                if (result.phase_changed) {
                    for (const p of participants.participants) {
                        const targetWs = Object.values(WORLD.connections).find(c => c.playerId === p.player_id);
                        if (targetWs) {
                            targetWs.send(JSON.stringify({
                                type: 'bossraid:phase_change',
                                raid_id: raidId,
                                phase: result.new_phase,
                                message: `⚠️ NUEVA FASE: ${result.new_phase.name} - ${result.new_phase.description}`
                            }));
                        }
                    }
                }

                // Si el boss fue derrotado
                if (result.boss_defeated) {
                    const defeatResult = bossRaidSystem.defeatBoss(raidId);

                    if (defeatResult.success) {
                        // Distribuir recompensas y notificar
                        for (const p of defeatResult.participants) {
                            const targetWs = Object.values(WORLD.connections).find(c => c.playerId === p.player_id);
                            const targetPlayer = WORLD.players[p.player_id];

                            if (targetPlayer && defeatResult.loot_distribution[p.player_id]) {
                                const loot = defeatResult.loot_distribution[p.player_id];

                                // Dar XP y Oro
                                if (loot.xp) {
                                    targetPlayer.experiencia = (targetPlayer.experiencia || 0) + loot.xp;
                                }
                                if (loot.gold) {
                                    targetPlayer.oro = (targetPlayer.oro || 0) + loot.gold;
                                }

                                // Dar items
                                for (const item of loot.items) {
                                    targetPlayer.inventario[item.item_id] = (targetPlayer.inventario[item.item_id] || 0) + item.amount;
                                }

                                if (targetWs) {
                                    targetWs.send(JSON.stringify({
                                        type: 'bossraid:victory',
                                        raid_id: raidId,
                                        boss_name: defeatResult.boss_name,
                                        boss_icon: defeatResult.boss_icon,
                                        duration_seconds: defeatResult.duration_seconds,
                                        mvp: defeatResult.mvp,
                                        your_loot: loot,
                                        your_damage: p.damage_dealt,
                                        your_contribution: loot.contribution_percent,
                                        is_mvp: p.player_id === defeatResult.mvp.player_id
                                    }));
                                }
                            }
                        }

                        // Broadcast global
                        broadcast({
                            type: 'world:event',
                            message: `🎉 ¡${defeatResult.boss_name} ha sido derrotado! MVP: ${defeatResult.mvp.player_name} con ${defeatResult.mvp.damage_dealt} de daño`,
                            category: 'boss_raid'
                        });
                    }
                }

                sendSuccess(ws, result);
            } else {
                sendError(ws, result.error);
            }
        }),

        'bossraid:get_raid_info': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const { raidId } = msg;
            const result = bossRaidSystem.getRaidInfo(raidId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'bossraid:raid_info',
                    raid: result.raid
                });
            } else {
                sendError(ws, result.error);
            }
        }),

        'bossraid:get_participants': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const { raidId } = msg;
            const result = bossRaidSystem.getRaidParticipants(raidId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'bossraid:participants',
                    raid_id: raidId,
                    participants: result.participants
                });
            } else {
                sendError(ws, 'Error obteniendo participantes');
            }
        }),

        'bossraid:get_leaderboard': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const { limit } = msg;
            const result = bossRaidSystem.getDamageLeaderboard(limit || 10);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'bossraid:leaderboard',
                    leaderboard: result.leaderboard
                });
            } else {
                sendError(ws, 'Error obteniendo leaderboard');
            }
        }),

        'bossraid:get_history': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const { limit } = msg;
            const result = bossRaidSystem.getPlayerHistory(playerId, limit || 20);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'bossraid:history',
                    history: result.history
                });
            } else {
                sendError(ws, 'Error obteniendo historial');
            }
        }),

        'bossraid:get_achievements': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const result = bossRaidSystem.getPlayerAchievements(playerId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'bossraid:achievements',
                    achievements: result.achievements
                });
            } else {
                sendError(ws, 'Error obteniendo achievements');
            }
        }),

        'bossraid:get_boss_stats': createHandler(async (msg, ws, playerId) => {
            if (!bossRaidSystem) {
                return sendError(ws, 'Sistema de Boss Raids no disponible');
            }

            const { bossId } = msg;
            const result = bossRaidSystem.getBossStats(bossId);

            if (result.success) {
                sendSuccess(ws, {
                    type: 'bossraid:boss_stats',
                    boss_id: bossId,
                    stats: result.stats
                });
            } else {
                sendError(ws, 'Error obteniendo stats del boss');
            }
        }),

    };
}
