/**
 * TRUST SYSTEM - Sistema de Relaciones Numéricas con NPCs
 * 
 * Sistema acumulativo de confianza que reemplaza flags binarios con counters numéricos.
 * Permite relaciones más matizadas y dinámicas con NPCs.
 * 
 * @author Z-SURVIVAL Team
 * @version 1.0.0
 * @date 2026-02-18
 */

import survivalDB from '../db/survivalDB.js';

class TrustSystem {
    constructor() {
        this.initializeDatabase();

        // Thresholds de relación
        this.THRESHOLDS = {
            ALLY: 50,           // >= 50: Aliado leal
            FRIEND: 25,         // >= 25: Amigo
            NEUTRAL: 0,         // >= 0: Neutral
            SUSPICIOUS: -25,    // < 0: Desconfiado  
            ENEMY: -50,         // < -25: Enemigo
            HOSTILE: -75        // < -50: Quiere matarte
        };

        // NPCs principales del sistema
        this.NPCS = ['ana', 'gomez', 'marco', 'nina', 'sofia', 'teresa'];

        // Modificadores de acciones comunes
        this.TRUST_MODIFIERS = {
            // Positivos
            GIFT_SMALL: 5,
            GIFT_MEDIUM: 10,
            GIFT_LARGE: 20,
            QUEST_COMPLETED: 15,
            HELPED_IN_DANGER: 25,
            SAVED_LIFE: 50,
            KEPT_SECRET: 30,

            // Negativos
            REFUSED_HELP: -10,
            BROKE_PROMISE: -20,
            REVEALED_SECRET: -40,
            BETRAYED: -60,
            ATTACKED: -80,
            KILLED_ALLY: -100
        };
    }

    /**
     * Inicializar tabla de trust en base de datos
     */
    initializeDatabase() {
        const createTable = survivalDB.db.prepare(`
      CREATE TABLE IF NOT EXISTS player_trust (
        player_id TEXT NOT NULL,
        npc_id TEXT NOT NULL,
        trust_value INTEGER DEFAULT 0,
        last_interaction INTEGER DEFAULT 0,
        total_interactions INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (player_id, npc_id)
      )
    `);

        createTable.run();

        // Índices para optimización
        const createIndexes = [
            `CREATE INDEX IF NOT EXISTS idx_trust_player ON player_trust(player_id)`,
            `CREATE INDEX IF NOT EXISTS idx_trust_npc ON player_trust(npc_id)`,
            `CREATE INDEX IF NOT EXISTS idx_trust_value ON player_trust(trust_value)`
        ];

        createIndexes.forEach(sql => survivalDB.db.prepare(sql).run());
    }

    /**
     * Obtener nivel de trust actual con un NPC
     */
    getTrust(playerId, npcId) {
        const stmt = survivalDB.db.prepare(`
      SELECT trust_value FROM player_trust 
      WHERE player_id = ? AND npc_id = ?
    `);

        const result = stmt.get(playerId, npcId);
        return result ? result.trust_value : 0; // Default es neutral
    }

    /**
     * Obtener todos los niveles de trust de un jugador
     */
    getAllTrust(playerId) {
        const stmt = survivalDB.db.prepare(`
      SELECT npc_id, trust_value, total_interactions 
      FROM player_trust 
      WHERE player_id = ?
    `);

        const results = stmt.all(playerId);
        const trustMap = {};

        // Asegurar que todos los NPCs existen en el mapa
        this.NPCS.forEach(npc => {
            trustMap[npc] = 0;
        });

        // Aplicar valores de DB
        results.forEach(row => {
            trustMap[row.npc_id] = row.trust_value;
        });

        return trustMap;
    }

    /**
     * Modificar trust con un NPC
     */
    modifyTrust(playerId, npcId, amount, reason = 'unknown') {
        const currentTrust = this.getTrust(playerId, npcId);
        let newTrust = currentTrust + amount;

        // Limitar entre -100 y +100
        newTrust = Math.max(-100, Math.min(100, newTrust));

        const stmt = survivalDB.db.prepare(`
      INSERT INTO player_trust (player_id, npc_id, trust_value, last_interaction, total_interactions, updated_at)
      VALUES (?, ?, ?, ?, 1, ?)
      ON CONFLICT(player_id, npc_id) DO UPDATE SET
        trust_value = ?,
        last_interaction = ?,
        total_interactions = total_interactions + 1,
        updated_at = ?
    `);

        const now = Math.floor(Date.now() / 1000);
        stmt.run(playerId, npcId, newTrust, now, now, newTrust, now, now);

        // Determinar cambio de threshold
        const oldLevel = this.getTrustLevel(currentTrust);
        const newLevel = this.getTrustLevel(newTrust);

        const result = {
            npcId,
            oldTrust: currentTrust,
            newTrust,
            change: amount,
            reason,
            oldLevel,
            newLevel,
            levelChanged: oldLevel !== newLevel
        };

        console.log(`🔄 Trust modificado: ${playerId} -> ${npcId} | ${currentTrust} -> ${newTrust} (${amount >= 0 ? '+' : ''}${amount}) [${reason}]`);

        return result;
    }

    /**
     * Obtener nivel de relación según threshold
     */
    getTrustLevel(trustValue) {
        if (trustValue >= this.THRESHOLDS.ALLY) return 'ALLY';
        if (trustValue >= this.THRESHOLDS.FRIEND) return 'FRIEND';
        if (trustValue >= this.THRESHOLDS.NEUTRAL) return 'NEUTRAL';
        if (trustValue >= this.THRESHOLDS.ENEMY) return 'SUSPICIOUS';
        if (trustValue >= this.THRESHOLDS.HOSTILE) return 'ENEMY';
        return 'HOSTILE';
    }

    /**
     * Obtener descripción textual del nivel de relación
     */
    getTrustLevelDescription(trustValue) {
        const level = this.getTrustLevel(trustValue);
        const descriptions = {
            ALLY: '💚 Aliado Leal',
            FRIEND: '💙 Amigo',
            NEUTRAL: '⚪ Neutral',
            SUSPICIOUS: '🟡 Desconfiado',
            ENEMY: '🟠 Enemigo',
            HOSTILE: '🔴 Hostil'
        };
        return descriptions[level] || '⚪ Neutral';
    }

    /**
     * Verificar si cumple threshold específico
     */
    hasThreshold(playerId, npcId, threshold) {
        const trust = this.getTrust(playerId, npcId);
        return trust >= this.THRESHOLDS[threshold];
    }

    /**
     * Procesar regalo a NPC (modifica trust)
     */
    giveGift(playerId, npcId, itemName, itemValue) {
        let trustIncrease = 0;

        if (itemValue >= 50) {
            trustIncrease = this.TRUST_MODIFIERS.GIFT_LARGE;
        } else if (itemValue >= 20) {
            trustIncrease = this.TRUST_MODIFIERS.GIFT_MEDIUM;
        } else {
            trustIncrease = this.TRUST_MODIFIERS.GIFT_SMALL;
        }

        return this.modifyTrust(playerId, npcId, trustIncrease, `gift:${itemName}`);
    }

    /**
     * Completar quest de un NPC (modifica trust)
     */
    completeQuest(playerId, npcId, questId) {
        return this.modifyTrust(
            playerId,
            npcId,
            this.TRUST_MODIFIERS.QUEST_COMPLETED,
            `quest:${questId}`
        );
    }

    /**
     * Revelar secreto (impacto negativo severo)
     */
    revealSecret(playerId, npcId, secretId) {
        return this.modifyTrust(
            playerId,
            npcId,
            this.TRUST_MODIFIERS.REVEALED_SECRET,
            `betrayal:${secretId}`
        );
    }

    /**
     * Mantener secreto (impacto positivo significativo)
     */
    keepSecret(playerId, npcId, secretId) {
        return this.modifyTrust(
            playerId,
            npcId,
            this.TRUST_MODIFIERS.KEPT_SECRET,
            `loyalty:${secretId}`
        );
    }

    /**
     * Ayudar en situación peligrosa
     */
    helpInDanger(playerId, npcId, situation) {
        return this.modifyTrust(
            playerId,
            npcId,
            this.TRUST_MODIFIERS.HELPED_IN_DANGER,
            `help:${situation}`
        );
    }

    /**
     * Salvar la vida de un NPC
     */
    saveLife(playerId, npcId, situation) {
        return this.modifyTrust(
            playerId,
            npcId,
            this.TRUST_MODIFIERS.SAVED_LIFE,
            `saved:${situation}`
        );
    }

    /**
     * Romper una promesa
     */
    breakPromise(playerId, npcId, promiseId) {
        return this.modifyTrust(
            playerId,
            npcId,
            this.TRUST_MODIFIERS.BROKE_PROMISE,
            `broken_promise:${promiseId}`
        );
    }

    /**
     * Obtener estadísticas de relaciones del jugador
     */
    getRelationshipStats(playerId) {
        const allTrust = this.getAllTrust(playerId);

        const stats = {
            allies: [],
            friends: [],
            neutral: [],
            suspicious: [],
            enemies: [],
            hostile: [],
            average: 0,
            highest: { npc: null, value: -100 },
            lowest: { npc: null, value: 100 }
        };

        let total = 0;
        let count = 0;

        Object.entries(allTrust).forEach(([npc, trust]) => {
            count++;
            total += trust;

            const level = this.getTrustLevel(trust);
            stats[level.toLowerCase()].push({ npc, trust });

            if (trust > stats.highest.value) {
                stats.highest = { npc, value: trust };
            }
            if (trust < stats.lowest.value) {
                stats.lowest = { npc, value: trust };
            }
        });

        stats.average = count > 0 ? Math.round(total / count) : 0;

        return stats;
    }

    /**
     * Obtener diálogos condicionados por trust
     */
    getConditionalDialogue(playerId, npcId, dialogueOptions) {
        const trust = this.getTrust(playerId, npcId);
        const level = this.getTrustLevel(trust);

        // Filtrar opciones de diálogo según trust level
        return dialogueOptions.filter(option => {
            if (option.requireTrustMin && trust < option.requireTrustMin) return false;
            if (option.requireTrustMax && trust > option.requireTrustMax) return false;
            if (option.requireLevel && level !== option.requireLevel) return false;
            return true;
        });
    }

    /**
     * Resetear trust con un NPC (for debugging/admin)
     */
    resetTrust(playerId, npcId) {
        const stmt = survivalDB.db.prepare(`
      DELETE FROM player_trust 
      WHERE player_id = ? AND npc_id = ?
    `);

        stmt.run(playerId, npcId);
        console.log(`♻️ Trust reseteado: ${playerId} -> ${npcId}`);
    }

    /**
     * Obtener historial de interacciones
     */
    getInteractionHistory(playerId, npcId) {
        const stmt = survivalDB.db.prepare(`
      SELECT * FROM player_trust 
      WHERE player_id = ? AND npc_id = ?
    `);

        return stmt.get(playerId, npcId) || null;
    }

    /**
     * Decaimiento natural de trust negativo con el tiempo (forgiveness)
     */
    applyNaturalDecay(playerId) {
        const stmt = survivalDB.db.prepare(`
      SELECT player_id, npc_id, trust_value, last_interaction 
      FROM player_trust 
      WHERE player_id = ? AND trust_value < 0
    `);

        const negativeRelations = stmt.all(playerId);
        const now = Math.floor(Date.now() / 1000);
        const DAY_IN_SECONDS = 86400;

        negativeRelations.forEach(relation => {
            const daysSinceInteraction = (now - relation.last_interaction) / DAY_IN_SECONDS;

            // Cada 7 días sin interacción, trust negativo mejora +5
            if (daysSinceInteraction >= 7) {
                const decayAmount = Math.floor(daysSinceInteraction / 7) * 5;
                const newTrust = Math.min(0, relation.trust_value + decayAmount);

                if (newTrust !== relation.trust_value) {
                    this.modifyTrust(playerId, relation.npc_id, decayAmount, 'natural_decay');
                }
            }
        });
    }
}

export default TrustSystem;
