/**
 * PVP SYSTEM - Sistema de Combate Jugador vs Jugador
 * 
 * Sistema de duelos consensuados, zonas de conflicto y protecciones básicas.
 * 
 * @author Z-SURVIVAL Team
 * @version 1.0.0
 * @date 2026-02-18
 */

import survivalDB from '../db/survivalDB.js';

class PvPSystem {
    constructor() {
        this.initializeDatabase();

        // Duelos activos en memoria
        this.activeDuels = new Map();

        // Zonas PvP
        this.PVP_ZONES = {
            'plaza': { pvpEnabled: false, safeZone: true },
            'hospital': { pvpEnabled: false, safeZone: true },
            'supermercado': { pvpEnabled: true, safeZone: false, warningLevel: 1 },
            'almacen': { pvpEnabled: true, safeZone: false, warningLevel: 2 },
            'fabrica': { pvpEnabled: true, safeZone: false, warningLevel: 3 },
            'bosque': { pvpEnabled: true, safeZone: false, warningLevel: 3 }
        };

        // Configuración
        this.CONFIG = {
            DUEL_REQUEST_TIMEOUT: 60, // segundos
            KILL_COOLDOWN: 300, // 5 minutos entre kills del mismo jugador
            RESPAWN_PROTECTION: 60, // 1 minuto de protección después de morir
            KARMA_LOSS_PER_KILL: 10,
            KARMA_GAIN_PER_DEFENSE: 5,
            MAX_KARMA: 100,
            MIN_KARMA: -100
        };
    }

    /**
     * Inicializar base de datos
     */
    initializeDatabase() {
        // Tabla de karma/reputación PvP
        const createKarmaTable = survivalDB.db.prepare(`
      CREATE TABLE IF NOT EXISTS pvp_karma (
        player_id TEXT PRIMARY KEY,
        karma INTEGER DEFAULT 0,
        kills INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0,
        duels_won INTEGER DEFAULT 0,
        duels_lost INTEGER DEFAULT 0,
        last_kill_time INTEGER DEFAULT 0,
        last_death_time INTEGER DEFAULT 0
      )
    `);

        // Tabla de historial PvP
        const createHistoryTable = survivalDB.db.prepare(`
      CREATE TABLE IF NOT EXISTS pvp_history (
        kill_id INTEGER PRIMARY KEY AUTOINCREMENT,
        killer_id TEXT NOT NULL,
        victim_id TEXT NOT NULL,
        kill_type TEXT NOT NULL,
        location TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now')),
        karma_change INTEGER DEFAULT 0
      )
    `);

        // Tabla de duelos históricos
        const createDuelsTable = survivalDB.db.prepare(`
      CREATE TABLE IF NOT EXISTS pvp_duels (
        duel_id TEXT PRIMARY KEY,
        challenger_id TEXT NOT NULL,
        challenged_id TEXT NOT NULL,
        winner_id TEXT,
        start_time INTEGER,
        end_time INTEGER,
        rounds INTEGER DEFAULT 1,
        status TEXT DEFAULT 'pending'
      )
    `);

        createKarmaTable.run();
        createHistoryTable.run();
        createDuelsTable.run();

        // Índices
        const createIndexes = [
            `CREATE INDEX IF NOT EXISTS idx_pvp_karma_player ON pvp_karma(player_id)`,
            `CREATE INDEX IF NOT EXISTS idx_pvp_history_killer ON pvp_history(killer_id)`,
            `CREATE INDEX IF NOT EXISTS idx_pvp_history_victim ON pvp_history(victim_id)`,
            `CREATE INDEX IF NOT EXISTS idx_pvp_duels_status ON pvp_duels(status)`
        ];

        createIndexes.forEach(sql => survivalDB.db.prepare(sql).run());
    }

    /**
     * Obtener karma de un jugador
     */
    getKarma(playerId) {
        const stmt = survivalDB.db.prepare(`
      SELECT * FROM pvp_karma WHERE player_id = ?
    `);

        const result = stmt.get(playerId);

        if (!result) {
            // Crear entrada inicial
            const insert = survivalDB.db.prepare(`
        INSERT INTO pvp_karma (player_id, karma) VALUES (?, 0)
      `);
            insert.run(playerId);
            return { player_id: playerId, karma: 0, kills: 0, deaths: 0, duels_won: 0, duels_lost: 0 };
        }

        return result;
    }

    /**
     * Verificar si un jugador puede atacar a otro
     */
    canAttack(attackerId, targetId, location) {
        // Verificar zona PvP
        const zone = this.PVP_ZONES[location];
        if (!zone || zone.safeZone) {
            return { allowed: false, reason: 'Zona segura - PvP deshabilitado' };
        }

        // Verificar protección de respawn
        const targetKarma = this.getKarma(targetId);
        const now = Math.floor(Date.now() / 1000);

        if (targetKarma.last_death_time && (now - targetKarma.last_death_time) < this.CONFIG.RESPAWN_PROTECTION) {
            const remaining = this.CONFIG.RESPAWN_PROTECTION - (now - targetKarma.last_death_time);
            return { allowed: false, reason: `Protección de respawn (${remaining}s restantes)` };
        }

        // Verificar cooldown de kills repetidas
        const recentKill = survivalDB.db.prepare(`
      SELECT timestamp FROM pvp_history
      WHERE killer_id = ? AND victim_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(attackerId, targetId);

        if (recentKill && (now - recentKill.timestamp) < this.CONFIG.KILL_COOLDOWN) {
            const remaining = this.CONFIG.KILL_COOLDOWN - (now - recentKill.timestamp);
            return { allowed: false, reason: `Cooldown activo (${Math.ceil(remaining / 60)} min restantes)` };
        }

        return { allowed: true };
    }

    /**
     * Solicitar duelo
     */
    requestDuel(challengerId, challengedId, rounds = 1) {
        // Verificar que ambos jugadores existan
        if (challengerId === challengedId) {
            return { success: false, error: 'No puedes retarte a ti mismo' };
        }

        // Verificar duelo activo
        const existingDuel = Array.from(this.activeDuels.values()).find(
            d => (d.challenger_id === challengerId || d.challenged_id === challengerId) && d.status === 'pending'
        );

        if (existingDuel) {
            return { success: false, error: 'Ya tienes un duelo pendiente' };
        }

        const duelId = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const duel = {
            duel_id: duelId,
            challenger_id: challengerId,
            challenged_id: challengedId,
            rounds,
            status: 'pending',
            created_at: Math.floor(Date.now() / 1000),
            expires_at: Math.floor(Date.now() / 1000) + this.CONFIG.DUEL_REQUEST_TIMEOUT
        };

        this.activeDuels.set(duelId, duel);

        // Guardar en DB
        const stmt = survivalDB.db.prepare(`
      INSERT INTO pvp_duels (duel_id, challenger_id, challenged_id, rounds, start_time)
      VALUES (?, ?, ?, ?, ?)
    `);

        stmt.run(duelId, challengerId, challengedId, rounds, duel.created_at);

        console.log(`⚔️ Duelo solicitado: ${challengerId} vs ${challengedId}`);

        // Auto-cancelar después del timeout
        setTimeout(() => {
            if (this.activeDuels.has(duelId) && this.activeDuels.get(duelId).status === 'pending') {
                this.cancelDuel(duelId, 'timeout');
            }
        }, this.CONFIG.DUEL_REQUEST_TIMEOUT * 1000);

        return { success: true, duelId, duel };
    }

    /**
     * Aceptar duelo
     */
    acceptDuel(duelId, challengedId) {
        const duel = this.activeDuels.get(duelId);

        if (!duel) {
            return { success: false, error: 'Duelo no encontrado' };
        }

        if (duel.challenged_id !== challengedId) {
            return { success: false, error: 'No eres el retado' };
        }

        if (duel.status !== 'pending') {
            return { success: false, error: 'El duelo ya no está pendiente' };
        }

        // Verificar expiración
        const now = Math.floor(Date.now() / 1000);
        if (now > duel.expires_at) {
            this.cancelDuel(duelId, 'expired');
            return { success: false, error: 'El duelo ha expirado' };
        }

        duel.status = 'active';
        duel.start_time = now;
        duel.current_round = 1;
        duel.scores = {
            [duel.challenger_id]: 0,
            [duel.challenged_id]: 0
        };

        // Actualizar DB
        const stmt = survivalDB.db.prepare(`
      UPDATE pvp_duels SET status = 'active', start_time = ? WHERE duel_id = ?
    `);

        stmt.run(now, duelId);

        console.log(`⚔️ Duelo aceptado: ${duel.challenger_id} vs ${duel.challenged_id}`);

        return { success: true, duel };
    }

    /**
     * Rechazar duelo
     */
    declineDuel(duelId, challengedId) {
        const duel = this.activeDuels.get(duelId);

        if (!duel || duel.challenged_id !== challengedId) {
            return { success: false, error: 'Duelo no válido' };
        }

        this.cancelDuel(duelId, 'declined');
        return { success: true };
    }

    /**
     * Cancelar duelo
     */
    cancelDuel(duelId, reason = 'manual') {
        const duel = this.activeDuels.get(duelId);

        if (duel) {
            duel.status = 'cancelled';

            const stmt = survivalDB.db.prepare(`
        UPDATE pvp_duels SET status = 'cancelled', end_time = ? WHERE duel_id = ?
      `);

            stmt.run(Math.floor(Date.now() / 1000), duelId);

            this.activeDuels.delete(duelId);

            console.log(`❌ Duelo cancelado: ${duelId} (${reason})`);
        }
    }

    /**
     * Resolver round de duelo
     */
    resolveDuelRound(duelId, winnerId) {
        const duel = this.activeDuels.get(duelId);

        if (!duel || duel.status !== 'active') {
            return { success: false, error: 'Duelo no activo' };
        }

        if (winnerId !== duel.challenger_id && winnerId !== duel.challenged_id) {
            return { success: false, error: 'Jugador no válido' };
        }

        duel.scores[winnerId]++;

        // Verificar si hay ganador
        const requiredWins = Math.ceil(duel.rounds / 2);

        if (duel.scores[winnerId] >= requiredWins) {
            return this.endDuel(duelId, winnerId);
        }

        duel.current_round++;

        return {
            success: true,
            roundWinner: winnerId,
            scores: duel.scores,
            currentRound: duel.current_round,
            duelComplete: false
        };
    }

    /**
     * Finalizar duelo
     */
    endDuel(duelId, winnerId) {
        const duel = this.activeDuels.get(duelId);

        if (!duel) {
            return { success: false, error: 'Duelo no encontrado' };
        }

        duel.status = 'completed';
        duel.winner_id = winnerId;
        duel.end_time = Math.floor(Date.now() / 1000);

        const loserId = winnerId === duel.challenger_id ? duel.challenged_id : duel.challenger_id;

        // Actualizar estadísticas
        this.updateDuelStats(winnerId, loserId);

        // Actualizar DB
        const stmt = survivalDB.db.prepare(`
      UPDATE pvp_duels SET status = 'completed', winner_id = ?, end_time = ? WHERE duel_id = ?
    `);

        stmt.run(winnerId, duel.end_time, duelId);

        this.activeDuels.delete(duelId);

        console.log(`🏆 Duelo ganado por ${winnerId}`);

        return {
            success: true,
            winner: winnerId,
            loser: loserId,
            finalScores: duel.scores,
            duelComplete: true
        };
    }

    /**
     * Actualizar estadísticas de duelo
     */
    updateDuelStats(winnerId, loserId) {
        // Winner
        const updateWinner = survivalDB.db.prepare(`
      INSERT INTO pvp_karma (player_id, duels_won, karma)
      VALUES (?, 1, ?)
      ON CONFLICT(player_id) DO UPDATE SET
        duels_won = duels_won + 1,
        karma = MIN(karma + ?, ?)
    `);

        updateWinner.run(winnerId, this.CONFIG.KARMA_GAIN_PER_DEFENSE, this.CONFIG.KARMA_GAIN_PER_DEFENSE, this.CONFIG.MAX_KARMA);

        // Loser
        const updateLoser = survivalDB.db.prepare(`
      INSERT INTO pvp_karma (player_id, duels_lost)
      VALUES (?, 1)
      ON CONFLICT(player_id) DO UPDATE SET
        duels_lost = duels_lost + 1
    `);

        updateLoser.run(loserId);
    }

    /**
     * Registrar kill PvP
     */
    registerKill(killerId, victimId, location, killType = 'pvp') {
        const now = Math.floor(Date.now() / 1000);

        // Actualizar stats del killer
        const updateKiller = survivalDB.db.prepare(`
      INSERT INTO pvp_karma (player_id, kills, karma, last_kill_time)
      VALUES (?, 1, ?, ?)
      ON CONFLICT(player_id) DO UPDATE SET
        kills = kills + 1,
        karma = MAX(karma - ?, ?),
        last_kill_time = ?
    `);

        updateKiller.run(
            killerId,
            -this.CONFIG.KARMA_LOSS_PER_KILL,
            now,
            this.CONFIG.KARMA_LOSS_PER_KILL,
            this.CONFIG.MIN_KARMA,
            now
        );

        // Actualizar stats de la víctima
        const updateVictim = survivalDB.db.prepare(`
      INSERT INTO pvp_karma (player_id, deaths, last_death_time)
      VALUES (?, 1, ?)
      ON CONFLICT(player_id) DO UPDATE SET
        deaths = deaths + 1,
        last_death_time = ?
    `);

        updateVictim.run(victimId, now, now);

        // Registrar en historial
        const insertHistory = survivalDB.db.prepare(`
      INSERT INTO pvp_history (killer_id, victim_id, kill_type, location, karma_change)
      VALUES (?, ?, ?, ?, ?)
    `);

        insertHistory.run(killerId, victimId, killType, location, -this.CONFIG.KARMA_LOSS_PER_KILL);

        console.log(`💀 PvP Kill: ${killerId} mató a ${victimId} en ${location}`);

        return {
            success: true,
            karmaLost: this.CONFIG.KARMA_LOSS_PER_KILL,
            newKarma: this.getKarma(killerId).karma
        };
    }

    /**
     * Obtener historial PvP de un jugador
     */
    getPlayerHistory(playerId, limit = 20) {
        const stmt = survivalDB.db.prepare(`
      SELECT * FROM pvp_history
      WHERE killer_id = ? OR victim_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

        return stmt.all(playerId, playerId, limit);
    }

    /**
     * Obtener ranking PvP
     */
    getPvPRanking(type = 'kills', limit = 10) {
        let orderBy = 'kills';

        if (type === 'karma') orderBy = 'karma';
        if (type === 'duels') orderBy = 'duels_won';
        if (type === 'kd') orderBy = '(CAST(kills AS FLOAT) / NULLIF(deaths, 0))';

        const stmt = survivalDB.db.prepare(`
      SELECT 
        player_id,
        karma,
        kills,
        deaths,
        duels_won,
        duels_lost,
        ROUND(CAST(kills AS FLOAT) / NULLIF(deaths, 0), 2) as kd_ratio
      FROM pvp_karma
      ORDER BY ${orderBy} DESC
      LIMIT ?
    `);

        return stmt.all(limit);
    }

    /**
     * Obtener nivel de karma descriptivo
     */
    getKarmaLevel(karma) {
        if (karma >= 75) return { level: 'Santo', color: '#00ff00', icon: '😇' };
        if (karma >= 50) return { level: 'Héroe', color: '#66ff66', icon: '🦸' };
        if (karma >= 25) return { level: 'Honorable', color: '#99ff99', icon: '⭐' };
        if (karma >= 0) return { level: 'Neutral', color: '#ffffff', icon: '⚪' };
        if (karma >= -25) return { level: 'Sospechoso', color: '#ffaa00', icon: '⚠️' };
        if (karma >= -50) return { level: 'Bandido', color: '#ff6600', icon: '💀' };
        if (karma >= -75) return { level: 'Asesino', color: '#ff0000', icon: '🔪' };
        return { level: 'Demonio', color: '#990000', icon: '👹' };
    }
}

export default PvPSystem;

