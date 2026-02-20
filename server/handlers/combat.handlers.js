/**
 * HANDLERS DE COMBATE Y EQUIPAMIENTO (FASE 13)
 * Extraído de survival_mvp.js para mejor organización
 */

export function createCombatHandlers({
    WORLD,
    advancedCombat,
    economySystem,
    rateLimiter,
    giveXP,
    updatePlayerStats,
    checkAchievements,
    sendSuccess,
    sendError,
    createHandler,
    broadcast
}) {
    return {
        // ===== SISTEMA DE COMBATE AVANZADO (FASE 13) =====
        'combat:start': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            const loc = WORLD.locations[player.locacion];
            if (loc.zombies === 0) {
                return sendError(ws, 'No hay zombies aquí');
            }

            if (player.inCombat) {
                return sendError(ws, 'Ya estás en combate');
            }

            // Generar zombie usando el nuevo sistema
            const playerLevel = player.nivel || 1;
            const zombie = advancedCombat.generateZombie(playerLevel);

            // Inicializar efectos activos si no existen
            if (!player.efectosActivos) player.efectosActivos = [];
            if (!player.equipamiento) player.equipamiento = { arma_principal: 'puños', armadura: 'sin_armadura' };

            player.inCombat = {
                zombie: zombie,
                turno: 'player',
                roundNumber: 1
            };

            sendSuccess(ws, {
                type: 'combat:started',
                zombie: {
                    tipo: zombie.tipo,
                    nombre: zombie.nombre,
                    icono: zombie.icono,
                    hp: zombie.hpActual,
                    maxHP: zombie.hpMax,
                    nivel: zombie.nivel,
                    descripción: zombie.descripción
                },
                player: {
                    hp: player.salud,
                    maxHP: player.saludMaxima || 100,
                    arma: player.equipamiento.arma_principal,
                    armadura: player.equipamiento.armadura
                },
                turno: 'player',
                message: `${zombie.icono} ¡Un ${zombie.nombre} te ataca! Es tu turno.`
            });
        }),

        'combat:attack': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            // Rate limiting: max 15 ataques por minuto (1 cada 4s)
            const rateLimit = rateLimiter.check(playerId, 'attack', 15, 60000);
            if (!rateLimit.allowed) {
                return sendError(ws, '⏱️ Demasiado rápido. Espera un momento.');
            }

            if (!player.inCombat && msg.type === 'combat:attack') {
                return sendError(ws, 'No estás en combate. Usa el botón "Atacar Zombies" primero.');
            }

            // Iniciar combate si se usa botón 'attack' normal
            if (!player.inCombat && msg.type === 'attack') {
                const loc = WORLD.locations[player.locacion];
                if (loc.zombies === 0) {
                    return sendError(ws, 'No hay zombies aquí');
                }

                const playerLevel = player.nivel || 1;
                const zombie = advancedCombat.generateZombie(playerLevel);
                if (!player.equipamiento) player.equipamiento = { arma_principal: 'puños', armadura: 'sin_armadura' };
                if (!player.efectosActivos) player.efectosActivos = [];

                player.inCombat = {
                    zombie: zombie,
                    turno: 'player',
                    roundNumber: 1
                };
            }

            const combat = player.inCombat;
            const zombie = combat.zombie;

            if (combat.turno !== 'player') {
                return sendError(ws, 'No es tu turno');
            }

            const resultado = {
                playerAttack: {},
                zombieAttack: {},
                combatEnded: false,
                playerWon: false,
                loot: {},
                efectos: []
            };

            // ATAQUE DEL JUGADOR usando sistema avanzado
            const arma = player.equipamiento?.arma_principal || 'puños';
            const abilityUsed = msg.ability || null;

            const attackResult = advancedCombat.calculatePlayerDamage(player, zombie, arma, abilityUsed);

            if (attackResult.miss) {
                resultado.playerAttack = {
                    damage: 0,
                    miss: true,
                    arma: attackResult.arma
                };
            } else {
                zombie.hpActual = Math.max(0, zombie.hpActual - attackResult.daño);
                resultado.playerAttack = {
                    damage: attackResult.daño,
                    critical: attackResult.crítico,
                    arma: attackResult.arma
                };

                // Aplicar efectos especiales
                const specialEffects = advancedCombat.applySpecialEffects(zombie, player, attackResult.daño);
                resultado.efectos.push(...specialEffects);
            }

            // ¿Zombie muerto?
            if (zombie.hpActual <= 0) {
                resultado.combatEnded = true;
                resultado.playerWon = true;

                // Generar loot mejorado
                const loot = advancedCombat.generateLoot(zombie.tipo);
                for (const [item, cantidad] of Object.entries(loot)) {
                    player.inventario[item] = (player.inventario[item] || 0) + cantidad;
                    resultado.loot[item] = cantidad;
                }

                const loc = WORLD.locations[player.locacion];
                loc.zombies = Math.max(0, loc.zombies - 1);

                // XP según tipo de zombie
                giveXP(player, zombie.xp, ws);

                // Recompensa de moneda (FASE 15)
                if (economySystem) {
                    const currencyReward = economySystem.rewardZombieKill(player, zombie.tipo);
                    if (currencyReward.success) {
                        ws.send(JSON.stringify({
                            type: 'economy:currency_gained',
                            amount: currencyReward.amount,
                            newBalance: currencyReward.newBalance,
                            reason: 'zombie_kill'
                        }));
                    }
                }

                updatePlayerStats(player, 'zombies_matados', 1);
                player.skills.combate = Math.min(10, player.skills.combate + 0.2);
                checkAchievements(player, ws);

                delete player.inCombat;

                sendSuccess(ws, {
                    type: 'combat:result',
                    resultado,
                    zombie: {
                        tipo: zombie.tipo,
                        nombre: zombie.nombre,
                        icono: zombie.icono
                    },
                    player: {
                        hp: player.salud,
                        maxHP: player.saludMaxima || 100,
                        inventario: player.inventario
                    },
                    message: `¡Mataste al ${zombie.nombre}! +${zombie.xp} XP`,
                    zombiesRemaining: loc.zombies
                });

                broadcast({
                    type: 'world:event',
                    message: `⚔️ ${player.nombre} eliminó un ${zombie.nombre}${attackResult.crítico ? ' con golpe CRÍTICO' : ''}`,
                    category: 'combat'
                });

                return;
            }

            // CONTRAATAQUE DEL ZOMBIE usando sistema avanzado
            combat.turno = 'zombie';

            setTimeout(() => {
                if (!player.inCombat) return;

                const zombieAttackResult = advancedCombat.calculateZombieDamage(zombie, player);

                if (zombieAttackResult.aturdido) {
                    resultado.zombieAttack = {
                        damage: 0,
                        stunned: true
                    };
                    resultado.efectos.push('💫 El zombie está aturdido');
                } else if (zombieAttackResult.esquiva) {
                    resultado.zombieAttack = {
                        damage: 0,
                        dodged: true
                    };
                } else {
                    player.salud = Math.max(0, player.salud - zombieAttackResult.daño);
                    resultado.zombieAttack = {
                        damage: zombieAttackResult.daño,
                        dodged: false
                    };
                }

                // Procesar efectos sobre tiempo (sangrado, veneno, etc)
                const playerEffects = advancedCombat.processStatusEffects(player);
                const zombieEffects = advancedCombat.processStatusEffects(zombie);

                if (playerEffects.dañoTotal > 0) {
                    player.salud = Math.max(0, player.salud - playerEffects.dañoTotal);
                    resultado.efectos.push(...playerEffects.efectos);
                }
                if (zombieEffects.dañoTotal > 0) {
                    resultado.efectos.push(...zombieEffects.efectos);
                }

                combat.turno = 'player';
                combat.roundNumber++;

                // ¿Jugador muerto?
                if (player.salud <= 0) {
                    resultado.combatEnded = true;
                    resultado.playerWon = false;
                    delete player.inCombat;

                    ws.send(JSON.stringify({
                        type: 'combat:result',
                        resultado,
                        zombie: {
                            tipo: zombie.tipo,
                            nombre: zombie.nombre,
                            icono: zombie.icono
                        },
                        player: {
                            hp: 0,
                            maxHP: player.saludMaxima || 100
                        },
                        message: `💀 ¡El ${zombie.nombre} te mató! GAME OVER`
                    }));

                    setTimeout(() => {
                        player.salud = Math.floor((player.saludMaxima || 100) * 0.5);
                        player.locacion = 'refugio';
                        player.efectosActivos = [];

                        ws.send(JSON.stringify({
                            type: 'player:respawn',
                            message: 'Despertaste en el refugio...',
                            player: {
                                salud: player.salud,
                                locacion: player.locacion
                            }
                        }));
                    }, 3000);

                    return;
                }

                // Combate continúa
                ws.send(JSON.stringify({
                    type: 'combat:turn_result',
                    resultado,
                    zombie: {
                        tipo: zombie.tipo,
                        nombre: zombie.nombre,
                        icono: zombie.icono,
                        hp: zombie.hpActual,
                        maxHP: zombie.hpMax,
                        efectos: zombie.efectosActivos
                    },
                    player: {
                        hp: player.salud,
                        maxHP: player.saludMaxima || 100,
                        efectos: player.efectosActivos
                    },
                    turno: 'player',
                    roundNumber: combat.roundNumber,
                    message: `Round ${combat.roundNumber} - Tu turno`
                }));
            }, 1200);
        }),

        'combat:flee': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!player.inCombat) {
                return sendError(ws, 'No estás en combate');
            }

            const fleeChance = 0.5 + (player.atributos.agilidad / 50);

            if (Math.random() < fleeChance) {
                delete player.inCombat;
                sendSuccess(ws, {
                    type: 'combat:fled',
                    success: true,
                    message: '🏃 Lograste escapar del zombie'
                });
            } else {
                const zombieDamage = Math.floor(10 + Math.random() * 15);
                player.salud = Math.max(0, player.salud - zombieDamage);

                if (player.salud <= 0) {
                    delete player.inCombat;
                    sendSuccess(ws, {
                        type: 'combat:fled',
                        success: false,
                        died: true,
                        message: '💀 El zombie te alcanzó y te mató'
                    });

                    setTimeout(() => {
                        player.salud = Math.floor((player.saludMaxima || 100) * 0.5);
                        player.locacion = 'refugio';
                        ws.send(JSON.stringify({
                            type: 'player:respawn',
                            player: { salud: player.salud, locacion: player.locacion }
                        }));
                    }, 3000);
                } else {
                    sendSuccess(ws, {
                        type: 'combat:fled',
                        success: false,
                        damage: zombieDamage,
                        message: '💥 El zombie te golpeó mientras huías',
                        player: {
                            hp: player.salud,
                            maxHP: player.saludMaxima || 100
                        }
                    });
                }
            }
        }),

        // ===== SISTEMA DE EQUIPAMIENTO (FASE 13) =====
        'equip_weapon': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            const weaponKey = msg.weapon;
            const weaponInfo = advancedCombat.getWeaponInfo(weaponKey);

            if (!weaponInfo) {
                return sendError(ws, 'Arma no encontrada');
            }

            // Verificar si el jugador tiene el arma
            if (!player.inventario[weaponKey] || player.inventario[weaponKey] <= 0) {
                return sendError(ws, 'No tienes esa arma en tu inventario');
            }

            // Verificar nivel requerido
            if (weaponInfo.nivel && (player.nivel || 1) < weaponInfo.nivel) {
                return sendError(ws, `Necesitas nivel ${weaponInfo.nivel} para equipar ${weaponInfo.nombre}`);
            }

            if (!player.equipamiento) player.equipamiento = {};
            player.equipamiento.arma_principal = weaponKey;

            sendSuccess(ws, {
                type: 'weapon:equipped',
                weapon: {
                    key: weaponKey,
                    ...weaponInfo
                },
                message: `✅ ${weaponInfo.icono} ${weaponInfo.nombre} equipada`
            });
        }),

        'equip_armor': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            const armorKey = msg.armor;
            const armorInfo = advancedCombat.getArmorInfo(armorKey);

            if (!armorInfo) {
                return sendError(ws, 'Armadura no encontrada');
            }

            // Verificar si el jugador tiene la armadura
            if (armorKey !== 'sin_armadura' && (!player.inventario[armorKey] || player.inventario[armorKey] <= 0)) {
                return sendError(ws, 'No tienes esa armadura en tu inventario');
            }

            // Verificar nivel requerido
            if (armorInfo.nivel && (player.nivel || 1) < armorInfo.nivel) {
                return sendError(ws, `Necesitas nivel ${armorInfo.nivel} para equipar ${armorInfo.nombre}`);
            }

            if (!player.equipamiento) player.equipamiento = {};
            player.equipamiento.armadura = armorKey;

            sendSuccess(ws, {
                type: 'armor:equipped',
                armor: {
                    key: armorKey,
                    ...armorInfo
                },
                message: `✅ ${armorInfo.icono} ${armorInfo.nombre} equipada`
            });
        }),

        'get_equipment': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            const equipped = player.equipamiento || { arma_principal: 'puños', armadura: 'sin_armadura' };
            const weaponInfo = advancedCombat.getWeaponInfo(equipped.arma_principal);
            const armorInfo = advancedCombat.getArmorInfo(equipped.armadura);

            // Listar armas disponibles en inventario
            const availableWeapons = [];
            for (const [key, count] of Object.entries(player.inventario)) {
                const weapon = advancedCombat.getWeaponInfo(key);
                if (weapon && count > 0) {
                    availableWeapons.push({ key, count, ...weapon });
                }
            }

            // Listar armaduras disponibles en inventario
            const availableArmor = [];
            for (const [key, count] of Object.entries(player.inventario)) {
                const armor = advancedCombat.getArmorInfo(key);
                if (armor && count > 0) {
                    availableArmor.push({ key, count, ...armor });
                }
            }

            sendSuccess(ws, {
                type: 'equipment:info',
                equipped: {
                    weapon: { key: equipped.arma_principal, ...weaponInfo },
                    armor: { key: equipped.armadura, ...armorInfo }
                },
                available: {
                    weapons: availableWeapons,
                    armor: availableArmor
                }
            });
        }),

        'use_ability': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!player.inCombat) {
                return sendError(ws, 'Solo puedes usar habilidades en combate');
            }

            const abilityKey = msg.ability;
            const canUse = advancedCombat.canUseAbility(player, abilityKey);

            if (!canUse.can) {
                return sendError(ws, canUse.reason);
            }

            const ability = advancedCombat.abilities[abilityKey];

            // Aplicar costos
            if (ability.costo.stamina) {
                player.stamina = (player.stamina || 100) - ability.costo.stamina;
            }
            if (ability.costo.medicinas) {
                player.inventario.medicinas -= ability.costo.medicinas;
            }

            // Aplicar cooldown
            if (!player.abilityCooldowns) player.abilityCooldowns = {};
            player.abilityCooldowns[abilityKey] = Date.now() + (ability.cooldown * 1000);

            // Aplicar efecto inmediato si es curación
            if (ability.efecto.curación) {
                const curación = Math.floor((player.saludMaxima || 100) * ability.efecto.curación);
                player.salud = Math.min((player.saludMaxima || 100), player.salud + curación);

                sendSuccess(ws, {
                    type: 'ability:used',
                    ability: { key: abilityKey, ...ability },
                    effect: { type: 'heal', amount: curación },
                    player: { hp: player.salud, maxHP: player.saludMaxima || 100 },
                    message: `${ability.icono} ${ability.nombre}: +${curación} HP`
                });
            } else {
                // Otras habilidades se aplican en el próximo ataque
                player.nextAbility = abilityKey;

                sendSuccess(ws, {
                    type: 'ability:used',
                    ability: { key: abilityKey, ...ability },
                    message: `${ability.icono} ${ability.nombre} activada`
                });
            }
        })
    };
}
