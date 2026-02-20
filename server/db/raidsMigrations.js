/**
 * MIGRACIÓN FASE 16: Sistema de Raids PvE
 * Tablas para gestionar raids, participantes y estadísticas
 */

export const RAIDS_MIGRATIONS = [
    `-- Tabla de raids (historial completo)
    CREATE TABLE IF NOT EXISTS raids (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT,
        difficulty INTEGER DEFAULT 1,
        status TEXT DEFAULT 'scheduled',
        started_at INTEGER,
        ended_at INTEGER,
        scheduled_for INTEGER,
        successful INTEGER DEFAULT 0,
        
        -- Configuración
        total_waves INTEGER DEFAULT 5,
        duration INTEGER,
        
        -- Refugio
        refuge_health INTEGER DEFAULT 1000,
        max_refuge_health INTEGER DEFAULT 1000,
        
        -- Métricas
        total_zombies_killed INTEGER DEFAULT 0,
        total_zombies_spawned INTEGER DEFAULT 0,
        total_damage_to_refuge INTEGER DEFAULT 0,
        defenders_count INTEGER DEFAULT 0,
        
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )`,

    `-- Tabla de participantes en raids
    CREATE TABLE IF NOT EXISTS raid_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raid_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        player_name TEXT,
        
        -- Stats de participación
        damage_dealt INTEGER DEFAULT 0,
        zombies_killed INTEGER DEFAULT 0,
        repairs_done INTEGER DEFAULT 0,
        survived INTEGER DEFAULT 1,
        
        -- Recompensas
        participation_score INTEGER DEFAULT 0,
        participation_percent REAL DEFAULT 0,
        rank TEXT,
        caps_earned INTEGER DEFAULT 0,
        
        joined_at INTEGER DEFAULT (strftime('%s', 'now')),
        
        FOREIGN KEY (raid_id) REFERENCES raids(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )`,

    `-- Tabla de defensas colocadas durante raids
    CREATE TABLE IF NOT EXISTS raid_defenses (
        id TEXT PRIMARY KEY,
        raid_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        player_name TEXT,
        
        type TEXT NOT NULL,
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0,
        
        activated INTEGER DEFAULT 0,
        damage_dealt INTEGER DEFAULT 0,
        zombies_hit INTEGER DEFAULT 0,
        
        placed_at INTEGER DEFAULT (strftime('%s', 'now')),
        
        FOREIGN KEY (raid_id) REFERENCES raids(id) ON DELETE CASCADE
    )`,

    `-- Tabla de estadísticas globales de raids por jugador
    CREATE TABLE IF NOT EXISTS player_raid_stats (
        player_id TEXT PRIMARY KEY,
        
        -- Participación
        total_raids_participated INTEGER DEFAULT 0,
        total_raids_won INTEGER DEFAULT 0,
        total_raids_lost INTEGER DEFAULT 0,
        
        -- Combat stats
        total_zombies_killed INTEGER DEFAULT 0,
        total_damage_dealt INTEGER DEFAULT 0,
        total_repairs_done INTEGER DEFAULT 0,
        
        -- Recompensas
        total_caps_earned INTEGER DEFAULT 0,
        
        -- Logros
        mvp_count INTEGER DEFAULT 0,
        heroe_count INTEGER DEFAULT 0,
        defensor_count INTEGER DEFAULT 0,
        best_rank TEXT,
        
        -- Records
        best_participation_percent REAL DEFAULT 0,
        highest_zombies_killed INTEGER DEFAULT 0,
        highest_damage_dealt INTEGER DEFAULT 0,
        
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )`,

    `-- Índices para optimizar queries
    CREATE INDEX IF NOT EXISTS idx_raids_type ON raids(type)`,

    `CREATE INDEX IF NOT EXISTS idx_raids_status ON raids(status)`,

    `CREATE INDEX IF NOT EXISTS idx_raids_scheduled ON raids(scheduled_for)`,

    `CREATE INDEX IF NOT EXISTS idx_raid_participants_raid ON raid_participants(raid_id)`,

    `CREATE INDEX IF NOT EXISTS idx_raid_participants_player ON raid_participants(player_id)`,

    `CREATE INDEX IF NOT EXISTS idx_raid_defenses_raid ON raid_defenses(raid_id)`,

    `CREATE INDEX IF NOT EXISTS idx_raid_defenses_player ON raid_defenses(player_id)`
];

/**
 * Aplicar migraciones
 */
export function applyRaidsMigrations(db) {
    console.log('🛡️ Aplicando migraciones de Raids PvE...');

    try {
        RAIDS_MIGRATIONS.forEach((migration, index) => {
            try {
                db.exec(migration);
                console.log(`  ✅ Migración ${index + 1}/${RAIDS_MIGRATIONS.length} aplicada`);
            } catch (error) {
                // Ignorar errores de "ya existe"
                if (!error.message.includes('already exists')) {
                    console.error(`  ❌ Error en migración ${index + 1}:`, error.message);
                }
            }
        });

        console.log('✅ Migraciones de Raids completadas');
        return true;
    } catch (error) {
        console.error('❌ Error aplicando migraciones de Raids:', error);
        return false;
    }
}

/**
 * Funciones de persistencia
 */
export class RaidPersistence {
    constructor(db) {
        this.db = db;
    }

    /**
     * Guardar raid en base de datos
     */
    saveRaid(raid) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO raids (
                id, type, name, difficulty, status,
                started_at, ended_at, scheduled_for, successful,
                total_waves, duration,
                refuge_health, max_refuge_health,
                total_zombies_killed, total_zombies_spawned,
                total_damage_to_refuge, defenders_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            raid.id,
            raid.type,
            raid.name,
            raid.difficulty,
            raid.status,
            raid.startsAt,
            raid.endsAt,
            raid.scheduledFor,
            raid.successful ? 1 : 0,
            raid.totalWaves,
            raid.duration,
            raid.refugeHealth,
            raid.maxRefugeHealth,
            raid.totalZombiesKilled,
            raid.totalZombiesSpawned,
            raid.totalDamageToRefuge,
            raid.defenders ? raid.defenders.size : 0
        );
    }

    /**
     * Guardar participante en raid
     */
    saveParticipant(raidId, defender, rewards) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO raid_participants (
                raid_id, player_id, player_name,
                damage_dealt, zombies_killed, repairs_done, survived,
                participation_score, participation_percent, rank, caps_earned
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            raidId,
            defender.playerId,
            defender.playerName,
            defender.damageDealt,
            defender.zombiesKilled,
            defender.repairsDone,
            defender.survived ? 1 : 0,
            rewards.participation.score,
            rewards.participation.percent,
            rewards.participation.rank,
            rewards.rewards.caps
        );
    }

    /**
     * Guardar defensa colocada
     */
    saveDefense(defense) {
        const stmt = this.db.prepare(`
            INSERT INTO raid_defenses (
                id, raid_id, player_id, player_name,
                type, position_x, position_y,
                activated, damage_dealt, zombies_hit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            defense.id,
            defense.raidId,
            defense.playerId,
            defense.playerName,
            defense.type,
            defense.position.x,
            defense.position.y,
            defense.activated ? 1 : 0,
            defense.damageDealt,
            defense.zombiesHit
        );
    }

    /**
     * Actualizar estadísticas de jugador
     */
    updatePlayerStats(playerId, raid, rewards) {
        // Obtener stats actuales
        const current = this.db.prepare(`
            SELECT * FROM player_raid_stats WHERE player_id = ?
        `).get(playerId);

        if (!current) {
            // Crear entrada inicial
            this.db.prepare(`
                INSERT INTO player_raid_stats (player_id) VALUES (?)
            `).run(playerId);
        }

        // Actualizar stats
        const stmt = this.db.prepare(`
            UPDATE player_raid_stats SET
                total_raids_participated = total_raids_participated + 1,
                total_raids_won = total_raids_won + ?,
                total_raids_lost = total_raids_lost + ?,
                total_zombies_killed = total_zombies_killed + ?,
                total_damage_dealt = total_damage_dealt + ?,
                total_repairs_done = total_repairs_done + ?,
                total_caps_earned = total_caps_earned + ?,
                mvp_count = mvp_count + ?,
                heroe_count = heroe_count + ?,
                defensor_count = defensor_count + ?,
                best_rank = CASE 
                    WHEN best_rank IS NULL THEN ?
                    WHEN ? = 'mvp' THEN 'mvp'
                    WHEN ? = 'heroe' AND best_rank != 'mvp' THEN 'heroe'
                    WHEN ? = 'defensor' AND best_rank NOT IN ('mvp', 'heroe') THEN 'defensor'
                    ELSE best_rank
                END,
                best_participation_percent = MAX(best_participation_percent, ?),
                highest_zombies_killed = MAX(highest_zombies_killed, ?),
                highest_damage_dealt = MAX(highest_damage_dealt, ?),
                updated_at = strftime('%s', 'now')
            WHERE player_id = ?
        `);

        const defender = raid.defenders.get(playerId);
        const rank = rewards.participation.rank;

        stmt.run(
            raid.successful ? 1 : 0,
            raid.successful ? 0 : 1,
            defender.zombiesKilled,
            defender.damageDealt,
            defender.repairsDone,
            rewards.rewards.caps,
            rank === 'mvp' ? 1 : 0,
            rank === 'heroe' ? 1 : 0,
            rank === 'defensor' ? 1 : 0,
            rank,
            rank,
            rank,
            rank,
            rewards.participation.percent,
            defender.zombiesKilled,
            defender.damageDealt,
            playerId
        );
    }

    /**
     * Obtener historial de raids
     */
    getRaidHistory(limit = 10) {
        const stmt = this.db.prepare(`
            SELECT * FROM raids 
            WHERE status IN ('completed', 'failed')
            ORDER BY ended_at DESC 
            LIMIT ?
        `);

        return stmt.all(limit);
    }

    /**
     * Obtener top defensores
     */
    getTopDefenders(limit = 10) {
        const stmt = this.db.prepare(`
            SELECT 
                player_id,
                total_raids_participated,
                total_raids_won,
                total_zombies_killed,
                total_damage_dealt,
                total_caps_earned,
                mvp_count,
                best_rank,
                best_participation_percent
            FROM player_raid_stats
            ORDER BY total_caps_earned DESC
            LIMIT ?
        `);

        return stmt.all(limit);
    }

    /**
     * Obtener stats de jugador
     */
    getPlayerStats(playerId) {
        const stmt = this.db.prepare(`
            SELECT * FROM player_raid_stats WHERE player_id = ?
        `);

        return stmt.get(playerId);
    }

    /**
     * Obtener raids de un jugador
     */
    getPlayerRaids(playerId, limit = 10) {
        const stmt = this.db.prepare(`
            SELECT 
                r.*,
                rp.damage_dealt,
                rp.zombies_killed,
                rp.repairs_done,
                rp.survived,
                rp.rank,
                rp.caps_earned
            FROM raids r
            INNER JOIN raid_participants rp ON r.id = rp.raid_id
            WHERE rp.player_id = ?
            ORDER BY r.ended_at DESC
            LIMIT ?
        `);

        return stmt.all(playerId, limit);
    }
}

export default {
    RAIDS_MIGRATIONS,
    applyRaidsMigrations,
    RaidPersistence
};
