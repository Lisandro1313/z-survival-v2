/**
 * 🛡️ SISTEMA DE RAIDS PvE
 * Gestiona ataques programados de zombies al refugio
 * Defensa cooperativa con recompensas escalables
 */

export default class RaidSystem {
    constructor() {
        this.activeRaid = null;
        this.raidHistory = [];
        this.scheduledRaids = [];
        this.defenses = new Map(); // Trampas y torres colocadas
        this.raidTypes = this.initializeRaidTypes();
        this.config = this.initializeConfig();
        this.zombieTemplates = this.initializeZombieTemplates();
    }

    /**
     * CONFIGURACIÓN DEL SISTEMA
     */
    initializeConfig() {
        return {
            // Scheduling
            NOCTURNO_INTERVAL: 3 * 60 * 60 * 1000, // 3 horas
            INFERNAL_INTERVAL: 12 * 60 * 60 * 1000, // 12 horas
            PREPARATION_TIME: 5 * 60 * 1000, // 5 minutos
            COUNTDOWN_TIME: 2 * 60 * 1000, // 2 minutos

            // Refugio
            BASE_REFUGE_HEALTH: 1000,
            HEALTH_PER_WALL_LEVEL: 200,
            REPAIR_COST_PER_HP: 2, // materiales por HP

            // Oleadas
            WAVE_REST_TIME: 30 * 1000, // 30 segundos
            ZOMBIE_SPAWN_RATE: 3, // por segundo
            ZOMBIE_DAMAGE_TO_REFUGE: 10, // daño base por zombie vivo

            // Recompensas
            BASE_CAPS_REWARD: 100,
            DIFFICULTY_MULTIPLIER: [1, 1.5, 2, 3, 5],
            MVP_BONUS: 2.0,
            SURVIVAL_BONUS: 500,

            // Defensas
            MAX_TRAPS_PER_PLAYER: 5,
            MAX_TOWERS_TOTAL: 10
        };
    }

    /**
     * TIPOS DE RAIDS
     */
    initializeRaidTypes() {
        return {
            nocturno: {
                name: 'Raid Nocturno',
                emoji: '🌒',
                difficulty: 1,
                duration: 8 * 60 * 1000, // 8 minutos
                waves: 5,
                zombiesPerWave: 15,
                types: ['normal', 'corredor', 'griton'],
                rewards: {
                    baseCaps: 200,
                    items: ['materiales', 'ammo', 'comida'],
                    rarityPool: ['común', 'poco común']
                }
            },
            relampago: {
                name: 'Raid Relámpago',
                emoji: '⚡',
                difficulty: 2,
                duration: 5 * 60 * 1000, // 5 minutos
                waves: 3,
                zombiesPerWave: 25,
                types: ['corredor', 'griton', 'tanque'],
                rewards: {
                    baseCaps: 400,
                    items: ['armas', 'componentes', 'munición'],
                    rarityPool: ['poco común', 'raro']
                }
            },
            infernal: {
                name: 'Raid Infernal',
                emoji: '🔥',
                difficulty: 4,
                duration: 15 * 60 * 1000, // 15 minutos
                waves: 10,
                zombiesPerWave: 20,
                types: ['tanque', 'explosivo', 'toxico', 'cazador'],
                rewards: {
                    baseCaps: 1000,
                    items: ['armas_raras', 'armaduras', 'modificadores'],
                    rarityPool: ['raro', 'épico']
                }
            },
            horda: {
                name: 'Raid de Horda',
                emoji: '💀',
                difficulty: 5,
                duration: 30 * 60 * 1000, // 30 minutos
                waves: 15,
                zombiesPerWave: 35,
                types: ['todos', 'abominacion'], // Incluye mini-bosses
                rewards: {
                    baseCaps: 5000,
                    items: ['legendarios', 'épicos', 'modificadores_raros'],
                    rarityPool: ['épico', 'legendario']
                }
            }
        };
    }

    /**
     * PLANTILLAS DE ZOMBIES PARA RAIDS
     */
    initializeZombieTemplates() {
        return {
            normal: { hp: 50, damage: 5, speed: 1.0, xp: 10, caps: 10 },
            corredor: { hp: 40, damage: 3, speed: 2.0, xp: 15, caps: 15 },
            griton: { hp: 60, damage: 4, speed: 1.0, xp: 20, caps: 20 },
            tanque: { hp: 200, damage: 15, speed: 0.5, xp: 50, caps: 50 },
            explosivo: { hp: 80, damage: 50, speed: 1.5, xp: 40, caps: 40 }, // Explota al morir
            toxico: { hp: 100, damage: 8, speed: 1.0, xp: 45, caps: 45 }, // Veneno
            cazador: { hp: 120, damage: 20, speed: 1.8, xp: 60, caps: 60 },
            berserker: { hp: 150, damage: 25, speed: 1.5, xp: 70, caps: 70 },
            abominacion: { hp: 500, damage: 40, speed: 0.8, xp: 200, caps: 200 } // Mini-boss
        };
    }

    /**
     * ========================================
     * SCHEDULING DE RAIDS
     * ========================================
     */

    /**
     * Programar un raid futuro
     */
    scheduleRaid(type, customDelay = null) {
        const raidType = this.raidTypes[type];
        if (!raidType) {
            throw new Error(`Raid type ${type} not found`);
        }

        const delay = customDelay || (type === 'nocturno' ?
            this.config.NOCTURNO_INTERVAL : this.config.INFERNAL_INTERVAL);

        const announcedAt = Date.now();
        const startsAt = announcedAt + this.config.PREPARATION_TIME;

        const raid = {
            id: `raid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            name: raidType.name,
            emoji: raidType.emoji,
            difficulty: raidType.difficulty,
            status: 'scheduled',

            // Timing
            announcedAt: null,
            startsAt: null,
            endsAt: null,
            scheduledFor: announcedAt + delay,

            // Configuración
            duration: raidType.duration,
            totalWaves: raidType.waves,
            zombiesPerWave: raidType.zombiesPerWave,
            zombieTypes: raidType.types,

            // Estado de progreso
            currentWave: 0,
            waves: [],

            // Estado del refugio
            refugeHealth: 0,
            maxRefugeHealth: 0,

            // Participantes
            defenders: new Map(),

            // Zombies activos
            activeZombies: new Map(),

            // Métricas
            totalZombiesKilled: 0,
            totalZombiesSpawned: 0,
            totalDamageToRefuge: 0,

            // Resultado
            successful: null,
            rewards: raidType.rewards
        };

        this.scheduledRaids.push(raid);
        return raid;
    }

    /**
     * Anunciar raid inminente (5 min antes)
     */
    announceRaid(raidId) {
        const raid = this.scheduledRaids.find(r => r.id === raidId);
        if (!raid) return null;

        raid.status = 'announced';
        raid.announcedAt = Date.now();
        raid.startsAt = raid.announcedAt + this.config.PREPARATION_TIME;

        return raid;
    }

    /**
     * Iniciar raid
     */
    startRaid(raidId, constructionSystem = null) {
        const raid = this.scheduledRaids.find(r => r.id === raidId);
        if (!raid || raid.status !== 'announced') return null;

        // Calcular HP del refugio basado en construcciones
        let maxHealth = this.config.BASE_REFUGE_HEALTH;
        if (constructionSystem) {
            const structures = constructionSystem.getCompletedStructures();
            const walls = structures.filter(s => s.structure_type === 'defensive_wall');
            walls.forEach(wall => {
                maxHealth += this.config.HEALTH_PER_WALL_LEVEL * wall.level;
            });
        }

        raid.maxRefugeHealth = maxHealth;
        raid.refugeHealth = maxHealth;

        // Generar oleadas
        raid.waves = this.generateWaves(raid);

        // Cambiar estado
        raid.status = 'active';
        raid.startsAt = Date.now();
        raid.endsAt = raid.startsAt + raid.duration;

        // Mover a raid activo
        this.activeRaid = raid;
        this.scheduledRaids = this.scheduledRaids.filter(r => r.id !== raidId);

        // Iniciar primera oleada
        this.startWave(raid, 1);

        return raid;
    }

    /**
     * Generar configuración de oleadas
     */
    generateWaves(raid) {
        const waves = [];
        const waveDuration = (raid.duration - (raid.totalWaves - 1) * this.config.WAVE_REST_TIME) / raid.totalWaves;

        for (let i = 1; i <= raid.totalWaves; i++) {
            // Escalar dificultad progresivamente
            const difficultyScale = 1 + (i - 1) * 0.2; // +20% por oleada
            const zombieCount = Math.floor(raid.zombiesPerWave * difficultyScale);

            // Distribuir tipos de zombies
            const zombieDistribution = this.distributeZombieTypes(
                zombieCount,
                raid.zombieTypes,
                i,
                raid.totalWaves
            );

            waves.push({
                wave: i,
                zombies: zombieCount,
                types: zombieDistribution,
                duration: waveDuration,
                status: 'pending' // pending | active | completed
            });
        }

        return waves;
    }

    /**
     * Distribuir tipos de zombies en una oleada
     */
    distributeZombieTypes(count, allowedTypes, waveNum, totalWaves) {
        const distribution = {};
        const difficulty = waveNum / totalWaves; // 0.0 a 1.0

        // Primeras oleadas: más básicos
        // Últimas oleadas: más élites
        if (allowedTypes.includes('todos')) {
            // Raid de horda: todos los tipos
            distribution.normal = Math.floor(count * 0.3 * (1 - difficulty));
            distribution.corredor = Math.floor(count * 0.2);
            distribution.tanque = Math.floor(count * 0.15);
            distribution.cazador = Math.floor(count * 0.15 * difficulty);
            distribution.toxico = Math.floor(count * 0.1);
            distribution.explosivo = Math.floor(count * 0.1);

            // Mini-boss en oleadas finales
            if (waveNum > totalWaves * 0.7) {
                distribution.abominacion = 1;
            }
        } else {
            // Distribución normal según tipos permitidos
            const typeCount = allowedTypes.length;
            allowedTypes.forEach((type, index) => {
                const weight = (index + 1) / typeCount; // Tipos más avanzados tienen más peso
                const baseAmount = count / typeCount;
                distribution[type] = Math.floor(baseAmount * (difficulty * weight + (1 - difficulty)));
            });
        }

        // Ajustar para que sume exactamente count
        const totalAssigned = Object.values(distribution).reduce((a, b) => a + b, 0);
        const diff = count - totalAssigned;
        if (diff > 0) {
            distribution[allowedTypes[0]] = (distribution[allowedTypes[0]] || 0) + diff;
        }

        return distribution;
    }

    /**
     * Iniciar oleada específica
     */
    startWave(raid, waveNum) {
        const wave = raid.waves[waveNum - 1];
        if (!wave) return;

        wave.status = 'active';
        wave.startedAt = Date.now();
        raid.currentWave = waveNum;

        // Spawnear zombies
        for (const [type, count] of Object.entries(wave.types)) {
            for (let i = 0; i < count; i++) {
                this.spawnZombie(raid, type);
            }
        }

        return wave;
    }

    /**
     * Spawnear zombie en raid
     */
    spawnZombie(raid, type) {
        const template = this.zombieTemplates[type];
        if (!template) return null;

        const zombie = {
            id: `zombie_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: type,
            hp: template.hp,
            maxHp: template.hp,
            damage: template.damage,
            speed: template.speed,
            xp: template.xp,
            caps: template.caps,
            status: 'alive', // alive | attacking | dead
            position: { x: 0, y: 0 }, // Posición en el mapa
            reachedRefuge: false
        };

        raid.activeZombies.set(zombie.id, zombie);
        raid.totalZombiesSpawned++;

        return zombie;
    }

    /**
     * ========================================
     * COMBATE DURANTE RAID
     * ========================================
     */

    /**
     * Jugador ataca zombie durante raid
     */
    attackZombie(playerId, playerName, zombieId, damage) {
        if (!this.activeRaid) return { error: 'No hay raid activo' };

        const zombie = this.activeRaid.activeZombies.get(zombieId);
        if (!zombie || zombie.status === 'dead') {
            return { error: 'Zombie no encontrado o ya está muerto' };
        }

        // Aplicar daño
        zombie.hp -= damage;

        // Registrar participación
        this.recordDefenderAction(playerId, playerName, {
            damageDealt: damage
        });

        // Verificar muerte
        if (zombie.hp <= 0) {
            return this.processZombieDeath(zombieId, playerId, playerName);
        }

        return {
            success: true,
            zombieId: zombieId,
            damage: damage,
            remainingHp: zombie.hp,
            killed: false
        };
    }

    /**
     * Procesar muerte de zombie
     */
    processZombieDeath(zombieId, killerId, killerName) {
        if (!this.activeRaid) return;

        const zombie = this.activeRaid.activeZombies.get(zombieId);
        if (!zombie) return;

        zombie.status = 'dead';
        this.activeRaid.totalZombiesKilled++;

        // Registrar kill
        this.recordDefenderAction(killerId, killerName, {
            zombiesKilled: 1
        });

        // Remover del mapa activo
        this.activeRaid.activeZombies.delete(zombieId);

        // Recompensa inmediata
        const immediateReward = {
            caps: zombie.caps,
            xp: zombie.xp
        };

        // Verificar si oleada completada
        if (this.activeRaid.activeZombies.size === 0) {
            this.completeWave(this.activeRaid);
        }

        return {
            success: true,
            zombieId: zombieId,
            killed: true,
            zombieType: zombie.type,
            reward: immediateReward
        };
    }

    /**
     * Registrar acción de defensor
     */
    recordDefenderAction(playerId, playerName, actions) {
        if (!this.activeRaid) return;

        let defender = this.activeRaid.defenders.get(playerId);
        if (!defender) {
            defender = {
                playerId: playerId,
                playerName: playerName,
                damageDealt: 0,
                zombiesKilled: 0,
                repairsDone: 0,
                survived: true,
                joinedAt: Date.now()
            };
            this.activeRaid.defenders.set(playerId, defender);
        }

        // Actualizar stats
        if (actions.damageDealt) defender.damageDealt += actions.damageDealt;
        if (actions.zombiesKilled) defender.zombiesKilled += actions.zombiesKilled;
        if (actions.repairsDone) defender.repairsDone += actions.repairsDone;
        if (actions.survived !== undefined) defender.survived = actions.survived;

        return defender;
    }

    /**
     * ========================================
     * DEFENSAS (TRAMPAS Y TORRES)
     * ========================================
     */

    /**
     * Colocar defensa
     */
    placeDefense(playerId, playerName, defenseType, position) {
        if (!this.activeRaid) return { error: 'No hay raid activo' };

        // Verificar límites
        const playerDefenses = Array.from(this.defenses.values())
            .filter(d => d.playerId === playerId && d.raidId === this.activeRaid.id);

        if (playerDefenses.length >= this.config.MAX_TRAPS_PER_PLAYER) {
            return { error: 'Límite de trampas alcanzado' };
        }

        const defense = {
            id: `defense_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            raidId: this.activeRaid.id,
            playerId: playerId,
            playerName: playerName,
            type: defenseType,
            position: position,
            activated: false,
            damageDealt: 0,
            zombiesHit: 0,
            placedAt: Date.now()
        };

        this.defenses.set(defense.id, defense);

        return {
            success: true,
            defense: defense
        };
    }

    /**
     * Activar defensa (cuando zombie la pisa)
     */
    activateDefense(defenseId) {
        const defense = this.defenses.get(defenseId);
        if (!defense || defense.activated) return null;

        defense.activated = true;

        // Calcular efecto según tipo
        const effects = this.getDefenseEffects(defense.type);

        // Aplicar a zombies cercanos
        const affectedZombies = this.getZombiesInRange(defense.position, effects.range);

        let totalDamage = 0;
        affectedZombies.forEach(zombie => {
            const damage = effects.damage;
            zombie.hp -= damage;
            totalDamage += damage;

            if (zombie.hp <= 0) {
                this.processZombieDeath(zombie.id, defense.playerId, defense.playerName);
            }
        });

        defense.damageDealt = totalDamage;
        defense.zombiesHit = affectedZombies.length;

        return {
            success: true,
            defenseId: defenseId,
            type: defense.type,
            damage: totalDamage,
            zombiesHit: affectedZombies.length
        };
    }

    /**
     * Obtener efectos de defensa según tipo
     */
    getDefenseEffects(defenseType) {
        const effects = {
            trampa_puas: { damage: 50, range: 1 },
            mina_terrestre: { damage: 150, range: 3 },
            alambre_puas: { damage: 0, range: 2, slow: 0.5 },
            molotov_auto: { damage: 30, range: 4, dot: 10, duration: 10 },
            red_electrica: { damage: 70, range: 2, stun: 5 }
        };

        return effects[defenseType] || { damage: 0, range: 0 };
    }

    /**
     * Obtener zombies en rango de posición
     */
    getZombiesInRange(position, range) {
        if (!this.activeRaid) return [];

        return Array.from(this.activeRaid.activeZombies.values())
            .filter(zombie => {
                const distance = Math.sqrt(
                    Math.pow(zombie.position.x - position.x, 2) +
                    Math.pow(zombie.position.y - position.y, 2)
                );
                return distance <= range && zombie.status === 'alive';
            });
    }

    /**
     * ========================================
     * REPARACIÓN DEL REFUGIO
     * ========================================
     */

    /**
     * Reparar refugio durante raid
     */
    repairRefuge(playerId, playerName, amount) {
        if (!this.activeRaid) return { error: 'No hay raid activo' };

        const raid = this.activeRaid;

        // Verificar que no esté a máximo HP
        if (raid.refugeHealth >= raid.maxRefugeHealth) {
            return { error: 'El refugio ya está a máxima salud' };
        }

        // Calcular reparación real
        const actualRepair = Math.min(amount, raid.maxRefugeHealth - raid.refugeHealth);
        raid.refugeHealth += actualRepair;

        // Registrar acción
        this.recordDefenderAction(playerId, playerName, {
            repairsDone: actualRepair
        });

        return {
            success: true,
            repaired: actualRepair,
            newHealth: raid.refugeHealth,
            maxHealth: raid.maxRefugeHealth
        };
    }

    /**
     * Calcular daño al refugio por zombies vivos
     */
    calculateRefugeDamage() {
        if (!this.activeRaid) return 0;

        let damage = 0;
        this.activeRaid.activeZombies.forEach(zombie => {
            if (zombie.reachedRefuge && zombie.status === 'alive') {
                damage += this.config.ZOMBIE_DAMAGE_TO_REFUGE;
            }
        });

        return damage;
    }

    /**
     * Aplicar daño al refugio
     */
    damageRefuge(damage) {
        if (!this.activeRaid) return;

        this.activeRaid.refugeHealth -= damage;
        this.activeRaid.totalDamageToRefuge += damage;

        if (this.activeRaid.refugeHealth <= 0) {
            this.activeRaid.refugeHealth = 0;
            this.failRaid(this.activeRaid.id);
        }
    }

    /**
     * ========================================
     * COMPLETAR Y FINALIZAR RAIDS
     * ========================================
     */

    /**
     * Completar oleada
     */
    completeWave(raid) {
        const wave = raid.waves[raid.currentWave - 1];
        if (!wave) return;

        wave.status = 'completed';
        wave.completedAt = Date.now();

        // Si hay más oleadas, programar siguiente
        if (raid.currentWave < raid.totalWaves) {
            // Descanso de 30 segundos
            setTimeout(() => {
                if (this.activeRaid && this.activeRaid.id === raid.id) {
                    this.startWave(raid, raid.currentWave + 1);
                }
            }, this.config.WAVE_REST_TIME);
        } else {
            // Última oleada completada
            this.completeRaid(raid.id);
        }
    }

    /**
     * Completar raid exitosamente
     */
    completeRaid(raidId) {
        if (!this.activeRaid || this.activeRaid.id !== raidId) return;

        this.activeRaid.status = 'completed';
        this.activeRaid.successful = true;
        this.activeRaid.endsAt = Date.now();

        // Mover a historial
        this.raidHistory.unshift(this.activeRaid);
        if (this.raidHistory.length > 50) {
            this.raidHistory = this.raidHistory.slice(0, 50);
        }

        const raid = this.activeRaid;
        this.activeRaid = null;

        return raid;
    }

    /**
     * Fallar raid
     */
    failRaid(raidId) {
        if (!this.activeRaid || this.activeRaid.id !== raidId) return;

        this.activeRaid.status = 'failed';
        this.activeRaid.successful = false;
        this.activeRaid.endsAt = Date.now();

        // Marcar todos los defensores como no sobrevivientes
        this.activeRaid.defenders.forEach(defender => {
            defender.survived = false;
        });

        // Mover a historial
        this.raidHistory.unshift(this.activeRaid);
        if (this.raidHistory.length > 50) {
            this.raidHistory = this.raidHistory.slice(0, 50);
        }

        const raid = this.activeRaid;
        this.activeRaid = null;

        return raid;
    }

    /**
     * ========================================
     * SISTEMA DE RECOMPENSAS
     * ========================================
     */

    /**
     * Calcular recompensas para un defensor
     */
    calculateRewards(raid, playerId) {
        const defender = raid.defenders.get(playerId);
        if (!defender) return null;

        // Score de participación
        const damageScore = defender.damageDealt * 1.0;
        const killScore = defender.zombiesKilled * 100;
        const repairScore = defender.repairsDone * 2.0;
        const survivalBonus = defender.survived ? this.config.SURVIVAL_BONUS : 0;

        const totalScore = damageScore + killScore + repairScore + survivalBonus;

        // Calcular porcentaje de participación
        const allScores = Array.from(raid.defenders.values())
            .map(d => {
                return d.damageDealt * 1.0 +
                    d.zombiesKilled * 100 +
                    d.repairsDone * 2.0 +
                    (d.survived ? this.config.SURVIVAL_BONUS : 0);
            });

        const totalAllScores = allScores.reduce((a, b) => a + b, 0);
        const participationPercent = totalAllScores > 0 ? (totalScore / totalAllScores * 100) : 0;

        // Determinar rango
        const rank = this.calculateRank(participationPercent);

        // Calcular caps
        const difficultyMultiplier = this.config.DIFFICULTY_MULTIPLIER[raid.difficulty - 1] || 1;
        const rankMultiplier = rank === 'mvp' ? this.config.MVP_BONUS :
            rank === 'heroe' ? 1.5 :
                rank === 'defensor' ? 1.2 : 1.0;

        const baseCaps = raid.rewards.baseCaps;
        const earnedCaps = Math.floor(baseCaps * difficultyMultiplier * rankMultiplier * (participationPercent / 100));

        // Generar loot
        const loot = this.generateLoot(raid.type, rank, participationPercent);

        return {
            playerId: playerId,
            playerName: defender.playerName,
            participation: {
                score: totalScore,
                percent: participationPercent,
                rank: rank,
                stats: {
                    damageDealt: defender.damageDealt,
                    zombiesKilled: defender.zombiesKilled,
                    repairsDone: defender.repairsDone,
                    survived: defender.survived
                }
            },
            rewards: {
                caps: earnedCaps,
                items: loot
            }
        };
    }

    /**
     * Calcular rango según participación
     */
    calculateRank(participationPercent) {
        if (participationPercent >= 30) return 'mvp';
        if (participationPercent >= 20) return 'heroe';
        if (participationPercent >= 10) return 'defensor';
        if (participationPercent >= 5) return 'participante';
        return 'espectador';
    }

    /**
     * Generar loot según tipo de raid y rendimiento
     */
    generateLoot(raidType, rank, participationPercent) {
        const loot = [];
        const raidConfig = this.raidTypes[raidType];
        if (!raidConfig) return loot;

        const itemPool = raidConfig.rewards.items;
        const rarityPool = raidConfig.rewards.rarityPool;

        // Cantidad de items según rango
        let itemCount = 0;
        if (rank === 'mvp') itemCount = 5;
        else if (rank === 'heroe') itemCount = 3;
        else if (rank === 'defensor') itemCount = 2;
        else if (rank === 'participante') itemCount = 1;

        // Generar items
        for (let i = 0; i < itemCount; i++) {
            const category = itemPool[Math.floor(Math.random() * itemPool.length)];
            const rarity = rarityPool[Math.floor(Math.random() * rarityPool.length)];

            loot.push({
                category: category,
                rarity: rarity,
                quantity: Math.floor(Math.random() * 5) + 1
            });
        }

        return loot;
    }

    /**
     * Distribuir recompensas a todos los defensores
     */
    distributeRewards(raid) {
        const rewards = new Map();

        raid.defenders.forEach((defender, playerId) => {
            const reward = this.calculateRewards(raid, playerId);
            if (reward) {
                rewards.set(playerId, reward);
            }
        });

        return rewards;
    }

    /**
     * ========================================
     * GETTERS Y UTILIDADES
     * ========================================
     */

    /**
     * Obtener raid activo
     */
    getActiveRaid() {
        return this.activeRaid;
    }

    /**
     * Obtener raids programados
     */
    getScheduledRaids() {
        return this.scheduledRaids;
    }

    /**
     * Obtener historial de raids
     */
    getRaidHistory(limit = 10) {
        return this.raidHistory.slice(0, limit);
    }

    /**
     * Obtener estado del refugio
     */
    getRefugeStatus() {
        if (!this.activeRaid) {
            return {
                health: this.config.BASE_REFUGE_HEALTH,
                maxHealth: this.config.BASE_REFUGE_HEALTH,
                inRaid: false
            };
        }

        return {
            health: this.activeRaid.refugeHealth,
            maxHealth: this.activeRaid.maxRefugeHealth,
            inRaid: true,
            raidType: this.activeRaid.type,
            currentWave: this.activeRaid.currentWave,
            totalWaves: this.activeRaid.totalWaves
        };
    }

    /**
     * Obtener top defensores
     */
    getTopDefenders(limit = 10) {
        // Esto requeriría integración con base de datos
        // Por ahora retornamos del raid actual
        if (!this.activeRaid) return [];

        const defenders = Array.from(this.activeRaid.defenders.values())
            .map(d => this.calculateRewards(this.activeRaid, d.playerId))
            .sort((a, b) => b.participation.score - a.participation.score)
            .slice(0, limit);

        return defenders;
    }

    /**
     * Verificar si un jugador está en raid activo
     */
    isPlayerInActiveRaid(playerId) {
        if (!this.activeRaid) return false;
        return this.activeRaid.defenders.has(playerId);
    }

    /**
     * Obtener info completa del raid para UI
     */
    getRaidInfo(raidId) {
        let raid = null;

        if (this.activeRaid && this.activeRaid.id === raidId) {
            raid = this.activeRaid;
        } else {
            raid = this.scheduledRaids.find(r => r.id === raidId) ||
                this.raidHistory.find(r => r.id === raidId);
        }

        if (!raid) return null;

        return {
            id: raid.id,
            type: raid.type,
            name: raid.name,
            emoji: raid.emoji,
            difficulty: raid.difficulty,
            status: raid.status,

            timing: {
                announcedAt: raid.announcedAt,
                startsAt: raid.startsAt,
                endsAt: raid.endsAt,
                scheduledFor: raid.scheduledFor
            },

            progress: {
                currentWave: raid.currentWave,
                totalWaves: raid.totalWaves,
                zombiesKilled: raid.totalZombiesKilled,
                zombiesAlive: raid.activeZombies ? raid.activeZombies.size : 0
            },

            refuge: {
                health: raid.refugeHealth,
                maxHealth: raid.maxRefugeHealth,
                damageTaken: raid.totalDamageToRefuge
            },

            defenders: Array.from(raid.defenders ? raid.defenders.values() : []),

            successful: raid.successful
        };
    }
}
