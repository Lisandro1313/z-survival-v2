/**
 * =====================================================
 * FASE 21: BOSS RAID SYSTEM
 * =====================================================
 * Sistema completo de raids cooperativos contra jefes legendarios
 * 
 * Características:
 * - 4 Tiers de bosses (Common→Elite→Legendary→Mythic)
 * - Sistema de fases dinámicas (bosses cambian mecánicas al bajar HP)
 * - Habilidades especiales con cooldowns
 * - Sistema de contribuciones (damage, healing, debuffs)
 * - Loot escalonado por contribución y tier
 * - Achievements y estadísticas persistentes
 * - Broadcasting en tiempo real para todos los participantes
 * =====================================================
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../db/survival.db');

export class BossRaidSystem {
    constructor(db) {
        this.db = db || new Database(dbPath);
        this.activeRaids = new Map(); // raid_id -> raid state en memoria
        this.lastAbilityUse = new Map(); // raid_id -> ability cooldowns

        console.log('🐉 BossRaidSystem inicializado');
    }

    // =====================================================
    // GESTIÓN DE RAIDS
    // =====================================================

    /**
     * Obtener todos los bosses disponibles
     */
    getAllBosses() {
        try {
            const bosses = this.db.prepare(`
                SELECT * FROM boss_definitions ORDER BY tier ASC, level_requirement ASC
            `).all();

            return bosses.map(boss => ({
                ...boss,
                phases: JSON.parse(boss.phases),
                abilities: JSON.parse(boss.abilities),
                loot_table: JSON.parse(boss.loot_table),
                requirements: boss.requirements ? JSON.parse(boss.requirements) : {}
            }));
        } catch (error) {
            console.error('❌ Error obteniendo bosses:', error);
            return [];
        }
    }

    /**
     * Obtener un boss específico por ID
     */
    getBossDefinition(bossId) {
        try {
            const boss = this.db.prepare(`
                SELECT * FROM boss_definitions WHERE id = ?
            `).get(bossId);

            if (!boss) return null;

            return {
                ...boss,
                phases: JSON.parse(boss.phases),
                abilities: JSON.parse(boss.abilities),
                loot_table: JSON.parse(boss.loot_table),
                requirements: boss.requirements ? JSON.parse(boss.requirements) : {}
            };
        } catch (error) {
            console.error(`❌ Error obteniendo boss ${bossId}:`, error);
            return null;
        }
    }

    /**
     * Spawnear un nuevo boss
     */
    spawnBoss(bossId, location = 'wasteland') {
        try {
            const boss = this.getBossDefinition(bossId);
            if (!boss) {
                return { success: false, error: 'Boss no encontrado' };
            }

            // Verificar si ya hay un raid activo de este boss
            const existingRaid = this.db.prepare(`
                SELECT id FROM active_boss_raids 
                WHERE boss_id = ? AND status = 'active'
            `).get(bossId);

            if (existingRaid) {
                return { success: false, error: 'Ya hay un raid activo de este boss' };
            }

            // Crear nuevo raid
            const result = this.db.prepare(`
                INSERT INTO active_boss_raids (
                    boss_id, current_hp, max_hp, current_phase, status, location, active_mechanics, ability_cooldowns
                ) VALUES (?, ?, ?, 0, 'active', ?, '{}', '{}')
            `).run(bossId, boss.base_hp, boss.base_hp, location);

            const raidId = result.lastInsertRowid;

            // Inicializar estado en memoria
            this.activeRaids.set(Number(raidId), {
                raid_id: Number(raidId),
                boss_id: bossId,
                boss,
                current_hp: boss.base_hp,
                max_hp: boss.base_hp,
                current_phase: 0,
                participants: [],
                active_mechanics: {},
                ability_cooldowns: {},
                combat_log: [],
                spawned_at: Date.now()
            });

            console.log(`🐉 Boss ${boss.name} spawneado en ${location} (Raid ID: ${raidId})`);

            return {
                success: true,
                raid_id: Number(raidId),
                boss: {
                    id: boss.id,
                    name: boss.name,
                    tier: boss.tier,
                    icon: boss.icon,
                    description: boss.description,
                    hp: boss.base_hp,
                    max_hp: boss.base_hp,
                    level_requirement: boss.level_requirement,
                    requirements: boss.requirements
                },
                location
            };
        } catch (error) {
            console.error('❌ Error spawneando boss:', error);
            return { success: false, error: 'Error interno del servidor' };
        }
    }

    /**
     * Obtener raids activos
     */
    getActiveRaids() {
        try {
            const raids = this.db.prepare(`
                SELECT 
                    abr.*,
                    bd.name as boss_name,
                    bd.icon as boss_icon,
                    bd.tier,
                    bd.description,
                    bd.level_requirement,
                    bd.requirements,
                    COUNT(brp.id) as participant_count
                FROM active_boss_raids abr
                JOIN boss_definitions bd ON abr.boss_id = bd.id
                LEFT JOIN boss_raid_participants brp ON abr.id = brp.raid_id AND brp.is_active = 1
                WHERE abr.status = 'active'
                GROUP BY abr.id
                ORDER BY abr.spawned_at DESC
            `).all();

            return raids.map(raid => ({
                ...raid,
                active_mechanics: JSON.parse(raid.active_mechanics || '{}'),
                ability_cooldowns: JSON.parse(raid.ability_cooldowns || '{}'),
                requirements: raid.requirements ? JSON.parse(raid.requirements) : {}
            }));
        } catch (error) {
            console.error('❌ Error obteniendo raids activos:', error);
            return [];
        }
    }

    /**
     * Obtener información de un raid específico
     */
    getRaidInfo(raidId) {
        try {
            // Intentar obtener de memoria primero
            if (this.activeRaids.has(raidId)) {
                const memoryRaid = this.activeRaids.get(raidId);
                return {
                    success: true,
                    raid: memoryRaid
                };
            }

            // Si no está en memoria, consultar DB
            const raid = this.db.prepare(`
                SELECT 
                    abr.*,
                    bd.name as boss_name,
                    bd.icon as boss_icon,
                    bd.tier,
                    bd.description,
                    bd.phases,
                    bd.abilities,
                    bd.loot_table
                FROM active_boss_raids abr
                JOIN boss_definitions bd ON abr.boss_id = bd.id
                WHERE abr.id = ?
            `).get(raidId);

            if (!raid) {
                return { success: false, error: 'Raid no encontrado' };
            }

            // Obtener participantes
            const participants = this.db.prepare(`
                SELECT * FROM boss_raid_participants WHERE raid_id = ? AND is_active = 1
            `).all(raidId);

            return {
                success: true,
                raid: {
                    ...raid,
                    phases: JSON.parse(raid.phases),
                    abilities: JSON.parse(raid.abilities),
                    loot_table: JSON.parse(raid.loot_table),
                    active_mechanics: JSON.parse(raid.active_mechanics || '{}'),
                    ability_cooldowns: JSON.parse(raid.ability_cooldowns || '{}'),
                    participants: participants.map(p => ({
                        ...p,
                        loot_received: p.loot_received ? JSON.parse(p.loot_received) : []
                    }))
                }
            };
        } catch (error) {
            console.error(`❌ Error obteniendo info del raid ${raidId}:`, error);
            return { success: false, error: 'Error interno' };
        }
    }

    // =====================================================
    // GESTIÓN DE PARTICIPANTES
    // =====================================================

    /**
     * Unirse a un raid
     */
    joinRaid(raidId, playerId, playerName, playerLevel, playerHP, playerMaxHP) {
        try {
            const raid = this.getRaidInfo(raidId);
            if (!raid.success) {
                return { success: false, error: 'Raid no encontrado' };
            }

            const boss = this.getBossDefinition(raid.raid.boss_id);
            if (!boss) {
                return { success: false, error: 'Boss no encontrado' };
            }

            // Verificar requisitos
            if (playerLevel < boss.level_requirement) {
                return {
                    success: false,
                    error: `Nivel mínimo requerido: ${boss.level_requirement}`
                };
            }

            // Verificar si ya está en el raid
            const existing = this.db.prepare(`
                SELECT id FROM boss_raid_participants 
                WHERE raid_id = ? AND player_id = ?
            `).get(raidId, playerId);

            if (existing) {
                // Reactivar participante si había salido
                this.db.prepare(`
                    UPDATE boss_raid_participants 
                    SET is_active = 1, left_at = NULL, current_hp = ?, max_hp = ?
                    WHERE raid_id = ? AND player_id = ?
                `).run(playerHP, playerMaxHP, raidId, playerId);
            } else {
                // Agregar nuevo participante
                this.db.prepare(`
                    INSERT INTO boss_raid_participants (
                        raid_id, player_id, player_name, current_hp, max_hp
                    ) VALUES (?, ?, ?, ?, ?)
                `).run(raidId, playerId, playerName, playerHP, playerMaxHP);
            }

            // Actualizar memoria si el raid está cargado
            if (this.activeRaids.has(raidId)) {
                const raidState = this.activeRaids.get(raidId);
                const participantIndex = raidState.participants.findIndex(p => p.player_id === playerId);

                if (participantIndex >= 0) {
                    raidState.participants[participantIndex].is_active = true;
                    raidState.participants[participantIndex].current_hp = playerHP;
                    raidState.participants[participantIndex].max_hp = playerMaxHP;
                } else {
                    raidState.participants.push({
                        player_id: playerId,
                        player_name: playerName,
                        current_hp: playerHP,
                        max_hp: playerMaxHP,
                        damage_dealt: 0,
                        healing_done: 0,
                        is_active: true
                    });
                }
            }

            console.log(`⚔️ ${playerName} se unió al raid ${raidId}`);

            return {
                success: true,
                message: `Te uniste al raid contra ${boss.name}`,
                raid_id: raidId,
                boss_name: boss.name,
                boss_hp: raid.raid.current_hp,
                boss_max_hp: raid.raid.max_hp
            };
        } catch (error) {
            console.error(`❌ Error al unirse al raid:`, error);
            return { success: false, error: 'Error interno' };
        }
    }

    /**
     * Salir de un raid
     */
    leaveRaid(raidId, playerId) {
        try {
            this.db.prepare(`
                UPDATE boss_raid_participants 
                SET is_active = 0, left_at = CURRENT_TIMESTAMP
                WHERE raid_id = ? AND player_id = ?
            `).run(raidId, playerId);

            // Actualizar memoria
            if (this.activeRaids.has(raidId)) {
                const raidState = this.activeRaids.get(raidId);
                const participant = raidState.participants.find(p => p.player_id === playerId);
                if (participant) {
                    participant.is_active = false;
                }
            }

            console.log(`🚪 Jugador ${playerId} salió del raid ${raidId}`);

            return { success: true };
        } catch (error) {
            console.error('❌ Error al salir del raid:', error);
            return { success: false, error: 'Error interno' };
        }
    }

    /**
     * Obtener participantes de un raid
     */
    getRaidParticipants(raidId) {
        try {
            const participants = this.db.prepare(`
                SELECT * FROM boss_raid_participants 
                WHERE raid_id = ? AND is_active = 1
                ORDER BY damage_dealt DESC
            `).all(raidId);

            return {
                success: true,
                participants: participants.map(p => ({
                    ...p,
                    loot_received: p.loot_received ? JSON.parse(p.loot_received) : []
                }))
            };
        } catch (error) {
            console.error('❌ Error obteniendo participantes:', error);
            return { success: false, participants: [] };
        }
    }

    // =====================================================
    // SISTEMA DE COMBATE
    // =====================================================

    /**
     * Atacar al boss
     */
    attackBoss(raidId, playerId, playerName, damage, isCritical = false, weaponName = 'Arma') {
        try {
            // Obtener raid
            const raidInfo = this.getRaidInfo(raidId);
            if (!raidInfo.success) {
                return { success: false, error: 'Raid no encontrado' };
            }

            const raid = raidInfo.raid;

            // Verificar que el jugador está en el raid
            const participant = this.db.prepare(`
                SELECT * FROM boss_raid_participants 
                WHERE raid_id = ? AND player_id = ? AND is_active = 1
            `).get(raidId, playerId);

            if (!participant) {
                return { success: false, error: 'No estás en este raid' };
            }

            // Aplicar daño al boss
            const newBossHP = Math.max(0, raid.current_hp - damage);

            this.db.prepare(`
                UPDATE active_boss_raids SET current_hp = ? WHERE id = ?
            `).run(newBossHP, raidId);

            // Actualizar contribución del jugador
            this.db.prepare(`
                UPDATE boss_raid_participants 
                SET damage_dealt = damage_dealt + ?
                WHERE raid_id = ? AND player_id = ?
            `).run(damage, raidId, playerId);

            // Registrar en combat log
            this.db.prepare(`
                INSERT INTO boss_raid_combat_log (
                    raid_id, attacker_id, attacker_name, attacker_type, action_type, damage_dealt, was_critical
                ) VALUES (?, ?, ?, 'player', 'attack', ?, ?)
            `).run(raidId, playerId, playerName, damage, isCritical ? 1 : 0);

            // Actualizar memoria
            if (this.activeRaids.has(raidId)) {
                const raidState = this.activeRaids.get(raidId);
                raidState.current_hp = newBossHP;

                const p = raidState.participants.find(p => p.player_id === playerId);
                if (p) {
                    p.damage_dealt += damage;
                }
            }

            // Verificar cambio de fase
            const boss = this.getBossDefinition(raid.boss_id);
            const hpPercent = (newBossHP / raid.max_hp) * 100;
            let phaseChanged = false;
            let newPhase = null;

            for (let i = boss.phases.length - 1; i >= 0; i--) {
                const phase = boss.phases[i];
                if (hpPercent <= phase.threshold && raid.current_phase < (i + 1)) {
                    newPhase = phase;
                    phaseChanged = true;

                    this.db.prepare(`
                        UPDATE active_boss_raids SET current_phase = ? WHERE id = ?
                    `).run(i + 1, raidId);

                    if (this.activeRaids.has(raidId)) {
                        this.activeRaids.get(raidId).current_phase = i + 1;
                    }

                    break;
                }
            }

            // Verificar derrota del boss
            const bossDefeated = newBossHP <= 0;

            if (bossDefeated) {
                this.defeatBoss(raidId);
            }

            return {
                success: true,
                damage,
                isCritical,
                weaponName,
                boss_hp: newBossHP,
                boss_max_hp: raid.max_hp,
                boss_hp_percent: (newBossHP / raid.max_hp) * 100,
                phase_changed: phaseChanged,
                new_phase: newPhase,
                boss_defeated: bossDefeated,
                attacker_name: playerName
            };
        } catch (error) {
            console.error('❌ Error atacando boss:', error);
            return { success: false, error: 'Error interno' };
        }
    }

    /**
     * Boss usa habilidad especial
     */
    useBossAbility(raidId, abilityId) {
        try {
            const raidInfo = this.getRaidInfo(raidId);
            if (!raidInfo.success) {
                return { success: false, error: 'Raid no encontrado' };
            }

            const raid = raidInfo.raid;
            const boss = this.getBossDefinition(raid.boss_id);

            const ability = boss.abilities.find(a => a.id === abilityId);
            if (!ability) {
                return { success: false, error: 'Habilidad no encontrada' };
            }

            // Verificar cooldown
            const cooldowns = JSON.parse(raid.ability_cooldowns || '{}');
            const now = Date.now();

            if (cooldowns[abilityId] && now < cooldowns[abilityId]) {
                return { success: false, error: 'Habilidad en cooldown' };
            }

            // Aplicar cooldown
            cooldowns[abilityId] = now + (ability.cooldown * 1000);

            this.db.prepare(`
                UPDATE active_boss_raids SET ability_cooldowns = ? WHERE id = ?
            `).run(JSON.stringify(cooldowns), raidId);

            // Registrar en combat log
            this.db.prepare(`
                INSERT INTO boss_raid_combat_log (
                    raid_id, attacker_name, attacker_type, action_type, ability_id, damage_dealt
                ) VALUES (?, ?, 'boss', 'ability', ?, ?)
            `).run(raidId, boss.name, abilityId, ability.damage || 0);

            // Obtener participantes para aplicar efectos
            const participants = this.getRaidParticipants(raidId);

            // Aplicar daño/efectos según tipo de habilidad
            let affectedPlayers = [];

            if (ability.aoe) {
                // AoE - afecta a todos
                affectedPlayers = participants.participants.map(p => ({
                    player_id: p.player_id,
                    player_name: p.player_name,
                    damage_taken: ability.damage || 0
                }));

                // Aplicar daño a todos los participantes
                for (const player of participants.participants) {
                    const newHP = Math.max(0, player.current_hp - (ability.damage || 0));
                    this.db.prepare(`
                        UPDATE boss_raid_participants SET current_hp = ? WHERE raid_id = ? AND player_id = ?
                    `).run(newHP, raidId, player.player_id);
                }
            } else if (ability.single_target) {
                // Single target - afecta al jugador con más daño (aggro)
                const topDamager = participants.participants.sort((a, b) => b.damage_dealt - a.damage_dealt)[0];

                if (topDamager) {
                    affectedPlayers = [{
                        player_id: topDamager.player_id,
                        player_name: topDamager.player_name,
                        damage_taken: ability.damage || 0
                    }];

                    const newHP = Math.max(0, topDamager.current_hp - (ability.damage || 0));
                    this.db.prepare(`
                        UPDATE boss_raid_participants SET current_hp = ? WHERE raid_id = ? AND player_id = ?
                    `).run(newHP, raidId, topDamager.player_id);
                }
            }

            console.log(`💥 Boss ${boss.name} usó ${ability.name} en raid ${raidId}`);

            return {
                success: true,
                ability: {
                    id: ability.id,
                    name: ability.name,
                    description: ability.description,
                    damage: ability.damage || 0,
                    aoe: ability.aoe || false,
                    single_target: ability.single_target || false,
                    effects: ability.effects || {}
                },
                affected_players: affectedPlayers,
                cooldown_until: cooldowns[abilityId]
            };
        } catch (error) {
            console.error('❌ Error usando habilidad de boss:', error);
            return { success: false, error: 'Error interno' };
        }
    }

    /**
     * Derrotar al boss (finalizar raid)
     */
    defeatBoss(raidId) {
        try {
            const raidInfo = this.getRaidInfo(raidId);
            if (!raidInfo.success) {
                return { success: false, error: 'Raid no encontrado' };
            }

            const raid = raidInfo.raid;
            const boss = this.getBossDefinition(raid.boss_id);
            const participants = this.getRaidParticipants(raidId);

            if (participants.participants.length === 0) {
                return { success: false, error: 'No hay participantes' };
            }

            // Calcular tiempo de duración
            const spawnedAt = new Date(raid.spawned_at).getTime();
            const now = Date.now();
            const durationSeconds = Math.floor((now - spawnedAt) / 1000);

            // Encontrar MVP (mayor daño)
            const sortedByDamage = [...participants.participants].sort((a, b) => b.damage_dealt - a.damage_dealt);
            const mvp = sortedByDamage[0];

            // Distribuir loot
            const lootDistribution = this.distributeLoot(raidId, boss, participants.participants);

            // Marcar raid como completado
            this.db.prepare(`
                UPDATE active_boss_raids 
                SET status = 'completed', defeated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(raidId);

            // Registrar en historial
            this.db.prepare(`
                INSERT INTO boss_raid_history (
                    raid_id, boss_id, boss_name, tier, success, duration_seconds,
                    participants, top_damage_dealer, top_damage_amount,
                    mvp_player_id, mvp_player_name
                ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
            `).run(
                raidId,
                boss.id,
                boss.name,
                boss.tier,
                durationSeconds,
                JSON.stringify(participants.participants.map(p => p.player_name)),
                mvp.player_name,
                mvp.damage_dealt,
                mvp.player_id,
                mvp.player_name
            );

            // Otorgar achievements
            this.checkAndGrantAchievements(raidId, boss, participants.participants, mvp);

            // Limpiar de memoria
            this.activeRaids.delete(raidId);

            console.log(`🎉 Boss ${boss.name} derrotado en raid ${raidId}! MVP: ${mvp.player_name}`);

            return {
                success: true,
                boss_name: boss.name,
                boss_icon: boss.icon,
                duration_seconds: durationSeconds,
                mvp: {
                    player_id: mvp.player_id,
                    player_name: mvp.player_name,
                    damage_dealt: mvp.damage_dealt
                },
                loot_distribution: lootDistribution,
                participants: sortedByDamage.map(p => ({
                    player_name: p.player_name,
                    damage_dealt: p.damage_dealt,
                    loot: lootDistribution[p.player_id] || []
                }))
            };
        } catch (error) {
            console.error('❌ Error derrotando boss:', error);
            return { success: false, error: 'Error interno' };
        }
    }

    // =====================================================
    // SISTEMA DE LOOT
    // =====================================================

    /**
     * Distribuir loot entre participantes
     */
    distributeLoot(raidId, boss, participants) {
        try {
            const lootTable = boss.loot_table;
            const lootDistribution = {};

            // Calcular daño total
            const totalDamage = participants.reduce((sum, p) => sum + p.damage_dealt, 0);

            for (const participant of participants) {
                const contributionPercent = (participant.damage_dealt / totalDamage) * 100;
                const playerLoot = [];

                // Loot garantizado (todos lo reciben)
                for (const item of lootTable.guaranteed) {
                    if (Math.random() < item.chance) {
                        playerLoot.push({
                            item_id: item.item_id,
                            name: item.name,
                            rarity: item.rarity,
                            amount: item.amount || 1,
                            source: 'guaranteed'
                        });
                    }
                }

                // Loot random (basado en contribución)
                for (const item of lootTable.random) {
                    // Aumentar chance si contribuyó mucho
                    const adjustedChance = item.chance * (0.5 + (contributionPercent / 100));

                    if (Math.random() < adjustedChance) {
                        const amount = item.amount
                            ? this._parseAmountRange(item.amount)
                            : 1;

                        playerLoot.push({
                            item_id: item.item_id,
                            name: item.name,
                            rarity: item.rarity,
                            amount,
                            source: 'random'
                        });
                    }
                }

                // XP y Gold (escalado por contribución)
                const [minXP, maxXP] = lootTable.xp_range;
                const [minGold, maxGold] = lootTable.gold_range;

                const baseXP = minXP + Math.random() * (maxXP - minXP);
                const baseGold = minGold + Math.random() * (maxGold - minGold);

                const xpGained = Math.floor(baseXP * (0.3 + (contributionPercent / 100)));
                const goldGained = Math.floor(baseGold * (0.3 + (contributionPercent / 100)));

                // Actualizar DB
                this.db.prepare(`
                    UPDATE boss_raid_participants 
                    SET loot_received = ?, xp_gained = ?, gold_gained = ?
                    WHERE raid_id = ? AND player_id = ?
                `).run(
                    JSON.stringify(playerLoot),
                    xpGained,
                    goldGained,
                    raidId,
                    participant.player_id
                );

                lootDistribution[participant.player_id] = {
                    items: playerLoot,
                    xp: xpGained,
                    gold: goldGained,
                    contribution_percent: Math.round(contributionPercent)
                };
            }

            return lootDistribution;
        } catch (error) {
            console.error('❌ Error distribuyendo loot:', error);
            return {};
        }
    }

    /**
     * Parsear rango de cantidad (ej: "5-10" -> random entre 5 y 10)
     */
    _parseAmountRange(amountStr) {
        if (typeof amountStr === 'number') return amountStr;

        const [min, max] = amountStr.split('-').map(Number);
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    // =====================================================
    // SISTEMA DE ACHIEVEMENTS
    // =====================================================

    /**
     * Verificar y otorgar achievements
     */
    checkAndGrantAchievements(raidId, boss, participants, mvp) {
        try {
            const achievements = [];

            // Achievement: Primera victoria contra este boss
            for (const participant of participants) {
                const firstKill = this.db.prepare(`
                    SELECT COUNT(*) as count FROM boss_raid_history brh
                    JOIN boss_raid_participants brp ON brh.raid_id = brp.raid_id
                    WHERE brp.player_id = ? AND brh.boss_id = ? AND brh.success = 1
                `).get(participant.player_id, boss.id);

                if (firstKill.count === 1) { // Este es el primero
                    this._grantAchievement(
                        participant.player_id,
                        `first_${boss.id}`,
                        `Primera Victoria: ${boss.name}`,
                        `Derrotaste a ${boss.name} por primera vez`,
                        boss.tier
                    );
                }
            }

            // Achievement: MVP
            this._grantAchievement(
                mvp.player_id,
                `mvp_${raidId}`,
                `MVP del Raid #${raidId}`,
                `Fuiste el jugador con más daño en la derrota de ${boss.name}`,
                boss.tier
            );

            // Achievement: Tier específico
            if (boss.tier === 4) {
                for (const participant of participants) {
                    this._grantAchievement(
                        participant.player_id,
                        'mythic_slayer',
                        'Asesino Mítico',
                        'Derrotaste a un boss Mítico',
                        4
                    );
                }
            }

            return achievements;
        } catch (error) {
            console.error('❌ Error verificando achievements:', error);
            return [];
        }
    }

    /**
     * Otorgar achievement a un jugador
     */
    _grantAchievement(playerId, achievementId, name, description, tier) {
        try {
            const existing = this.db.prepare(`
                SELECT id FROM boss_raid_achievements 
                WHERE player_id = ? AND achievement_id = ?
            `).get(playerId, achievementId);

            if (!existing) {
                this.db.prepare(`
                    INSERT INTO boss_raid_achievements (
                        player_id, achievement_id, achievement_name, achievement_description, tier
                    ) VALUES (?, ?, ?, ?, ?)
                `).run(playerId, achievementId, name, description, tier);

                console.log(`🏆 Achievement otorgado a jugador ${playerId}: ${name}`);
            }
        } catch (error) {
            console.error('❌ Error otorgando achievement:', error);
        }
    }

    /**
     * Obtener achievements de un jugador
     */
    getPlayerAchievements(playerId) {
        try {
            const achievements = this.db.prepare(`
                SELECT * FROM boss_raid_achievements 
                WHERE player_id = ?
                ORDER BY unlocked_at DESC
            `).all(playerId);

            return { success: true, achievements };
        } catch (error) {
            console.error('❌ Error obteniendo achievements:', error);
            return { success: false, achievements: [] };
        }
    }

    // =====================================================
    // ESTADÍSTICAS Y RANKINGS
    // =====================================================

    /**
     * Obtener ranking de jugadores por daño total
     */
    getDamageLeaderboard(limit = 10) {
        try {
            const leaderboard = this.db.prepare(`
                SELECT * FROM boss_raid_damage_leaderboard LIMIT ?
            `).all(limit);

            return { success: true, leaderboard };
        } catch (error) {
            console.error('❌ Error obteniendo leaderboard:', error);
            return { success: false, leaderboard: [] };
        }
    }

    /**
     * Obtener estadísticas de un boss
     */
    getBossStats(bossId) {
        try {
            const stats = this.db.prepare(`
                SELECT * FROM boss_stats WHERE id = ?
            `).get(bossId);

            return { success: true, stats: stats || {} };
        } catch (error) {
            console.error('❌ Error obteniendo stats de boss:', error);
            return { success: false, stats: {} };
        }
    }

    /**
     * Obtener historial de un jugador
     */
    getPlayerHistory(playerId, limit = 20) {
        try {
            const history = this.db.prepare(`
                SELECT 
                    brh.*,
                    brp.damage_dealt,
                    brp.xp_gained,
                    brp.gold_gained,
                    brp.loot_received
                FROM boss_raid_history brh
                JOIN boss_raid_participants brp ON brh.raid_id = brp.raid_id
                WHERE brp.player_id = ?
                ORDER BY brh.completed_at DESC
                LIMIT ?
            `).all(playerId, limit);

            return {
                success: true,
                history: history.map(h => ({
                    ...h,
                    participants: JSON.parse(h.participants),
                    loot_received: h.loot_received ? JSON.parse(h.loot_received) : []
                }))
            };
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            return { success: false, history: [] };
        }
    }
}

export default BossRaidSystem;
