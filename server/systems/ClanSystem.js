/**
 * CLAN SYSTEM - Sistema de Organizaciones de Jugadores
 * 
 * Permite a los jugadores formar clanes, con rangos, chat privado,
 * almacén compartido y beneficios cooperativos.
 * 
 * @author Z-SURVIVAL Team
 * @version 1.0.0
 * @date 2026-02-18
 */

import survivalDB from '../db/survivalDB.js';

class ClanSystem {
    constructor() {
        this.initializeDatabase();

        // Configuración de límites
        this.CONFIG = {
            MAX_CLAN_NAME_LENGTH: 20,
            MAX_CLAN_TAG_LENGTH: 5,
            MIN_CLAN_NAME_LENGTH: 3,
            MAX_CLAN_MEMBERS: 50,
            MIN_MEMBERS_TO_CREATE: 1,
            CREATION_COST: 5000, // caps
            RENAME_COST: 10000,
            DAILY_UPKEEP: 100 // por miembro
        };

        // Rangos del clan
        this.RANKS = {
            LEADER: { id: 'leader', name: 'Líder', level: 4, permissions: ['*'] },
            OFFICER: { id: 'officer', name: 'Oficial', level: 3, permissions: ['invite', 'kick', 'promote_recruit', 'manage_storage'] },
            VETERAN: { id: 'veteran', name: 'Veterano', level: 2, permissions: ['invite', 'manage_storage'] },
            MEMBER: { id: 'member', name: 'Miembro', level: 1, permissions: ['use_storage'] },
            RECRUIT: { id: 'recruit', name: 'Recluta', level: 0, permissions: [] }
        };

        // Beneficios por nivel de clan
        this.CLAN_BENEFITS = {
            1: { xpBonus: 0.05, storageSlots: 20, memberLimit: 10 },
            2: { xpBonus: 0.10, storageSlots: 40, memberLimit: 20 },
            3: { xpBonus: 0.15, storageSlots: 60, memberLimit: 30 },
            4: { xpBonus: 0.20, storageSlots: 80, memberLimit: 40 },
            5: { xpBonus: 0.25, storageSlots: 100, memberLimit: 50 }
        };
    }

    /**
     * Inicializar tablas de clanes
     */
    initializeDatabase() {
        // Tabla de clanes
        const createClansTable = survivalDB.db.prepare(`
      CREATE TABLE IF NOT EXISTS clans (
        clan_id TEXT PRIMARY KEY,
        clan_name TEXT UNIQUE NOT NULL,
        clan_tag TEXT UNIQUE NOT NULL,
        leader_id TEXT NOT NULL,
        description TEXT DEFAULT '',
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        total_members INTEGER DEFAULT 0,
        total_kills INTEGER DEFAULT 0,
        total_raids_won INTEGER DEFAULT 0,
        treasury INTEGER DEFAULT 0,
        is_recruiting BOOLEAN DEFAULT 1
      )
    `);

        // Tabla de miembros
        const createMembersTable = survivalDB.db.prepare(`
      CREATE TABLE IF NOT EXISTS clan_members (
        player_id TEXT PRIMARY KEY,
        clan_id TEXT NOT NULL,
        rank TEXT DEFAULT 'recruit',
        joined_at INTEGER DEFAULT (strftime('%s', 'now')),
        contribution_points INTEGER DEFAULT 0,
        last_active INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (clan_id) REFERENCES clans(clan_id) ON DELETE CASCADE
      )
    `);

        // Tabla de invitaciones
        const createInvitesTable = survivalDB.db.prepare(`
      CREATE TABLE IF NOT EXISTS clan_invites (
        invite_id TEXT PRIMARY KEY,
        clan_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        invited_by TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (clan_id) REFERENCES clans(clan_id) ON DELETE CASCADE
      )
    `);

        // Tabla de almacén del clan
        const createStorageTable = survivalDB.db.prepare(`
      CREATE TABLE IF NOT EXISTS clan_storage (
        clan_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        deposited_by TEXT,
        last_modified INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (clan_id, item_name),
        FOREIGN KEY (clan_id) REFERENCES clans(clan_id) ON DELETE CASCADE
      )
    `);

        // Tabla de log de actividades
        const createLogTable = survivalDB.db.prepare(`
      CREATE TABLE IF NOT EXISTS clan_activity_log (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        clan_id TEXT NOT NULL,
        player_id TEXT,
        action_type TEXT NOT NULL,
        details TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (clan_id) REFERENCES clans(clan_id) ON DELETE CASCADE
      )
    `);

        createClansTable.run();
        createMembersTable.run();
        createInvitesTable.run();
        createStorageTable.run();
        createLogTable.run();

        // Índices
        const createIndexes = [
            `CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id)`,
            `CREATE INDEX IF NOT EXISTS idx_clan_invites_player ON clan_invites(player_id)`,
            `CREATE INDEX IF NOT EXISTS idx_clan_storage_clan ON clan_storage(clan_id)`,
            `CREATE INDEX IF NOT EXISTS idx_clan_log_clan ON clan_activity_log(clan_id)`
        ];

        createIndexes.forEach(sql => survivalDB.db.prepare(sql).run());
    }

    /**
     * Crear un nuevo clan
     */
    createClan(leaderId, clanName, clanTag, description = '') {
        // Validaciones
        if (clanName.length < this.CONFIG.MIN_CLAN_NAME_LENGTH) {
            return { success: false, error: 'Nombre muy corto' };
        }

        if (clanName.length > this.CONFIG.MAX_CLAN_NAME_LENGTH) {
            return { success: false, error: 'Nombre muy largo' };
        }

        if (clanTag.length > this.CONFIG.MAX_CLAN_TAG_LENGTH) {
            return { success: false, error: 'Tag muy largo' };
        }

        // Verificar si ya está en un clan
        const existingMembership = this.getPlayerClan(leaderId);
        if (existingMembership) {
            return { success: false, error: 'Ya perteneces a un clan' };
        }

        // Verificar nombre/tag únicos
        const checkUnique = survivalDB.db.prepare(`
      SELECT clan_id FROM clans WHERE clan_name = ? OR clan_tag = ?
    `);

        if (checkUnique.get(clanName, clanTag)) {
            return { success: false, error: 'Nombre o tag ya existe' };
        }

        const clanId = `clan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Crear clan
            const insertClan = survivalDB.db.prepare(`
        INSERT INTO clans (clan_id, clan_name, clan_tag, leader_id, description, total_members)
        VALUES (?, ?, ?, ?, ?, 1)
      `);

            insertClan.run(clanId, clanName, clanTag, leaderId, description);

            // Agregar líder como miembro
            const insertMember = survivalDB.db.prepare(`
        INSERT INTO clan_members (player_id, clan_id, rank)
        VALUES (?, ?, 'leader')
      `);

            insertMember.run(leaderId, clanId);

            // Log de creación
            this.logActivity(clanId, leaderId, 'clan_created', `Clan ${clanName} creado`);

            console.log(`🏰 Clan creado: ${clanName} [${clanTag}] por ${leaderId}`);

            return {
                success: true,
                clan: this.getClanInfo(clanId)
            };
        } catch (error) {
            console.error('Error creando clan:', error);
            return { success: false, error: 'Error al crear clan' };
        }
    }

    /**
     * Obtener información del clan
     */
    getClanInfo(clanId) {
        const stmt = survivalDB.db.prepare(`
      SELECT * FROM clans WHERE clan_id = ?
    `);

        const clan = stmt.get(clanId);
        if (!clan) return null;

        // Obtener miembros
        clan.members = this.getClanMembers(clanId);

        // Obtener beneficios por nivel
        clan.benefits = this.CLAN_BENEFITS[clan.level] || this.CLAN_BENEFITS[1];

        return clan;
    }

    /**
     * Obtener miembros del clan
     */
    getClanMembers(clanId) {
        const stmt = survivalDB.db.prepare(`
      SELECT 
        cm.player_id, cm.rank, cm.joined_at, cm.contribution_points, cm.last_active,
        p.nombre as name, p.nivel as level
      FROM clan_members cm
      LEFT JOIN players p ON cm.player_id = p.id
      WHERE cm.clan_id = ?
      ORDER BY 
        CASE cm.rank 
          WHEN 'leader' THEN 4
          WHEN 'officer' THEN 3
          WHEN 'veteran' THEN 2
          WHEN 'member' THEN 1
          ELSE 0
        END DESC,
        cm.joined_at ASC
    `);

        return stmt.all(clanId);
    }

    /**
     * Obtener clan de un jugador
     */
    getPlayerClan(playerId) {
        const stmt = survivalDB.db.prepare(`
      SELECT cm.clan_id, cm.rank, c.*
      FROM clan_members cm
      JOIN clans c ON cm.clan_id = c.clan_id
      WHERE cm.player_id = ?
    `);

        return stmt.get(playerId);
    }

    /**
     * Invitar jugador al clan
     */
    invitePlayer(clanId, inviterId, targetPlayerId) {
        // Verificar permisos
        if (!this.hasPermission(inviterId, clanId, 'invite')) {
            return { success: false, error: 'Sin permisos para invitar' };
        }

        // Verificar que el objetivo no esté en un clan
        if (this.getPlayerClan(targetPlayerId)) {
            return { success: false, error: 'El jugador ya está en un clan' };
        }

        // Verificar invitación existente
        const existing = survivalDB.db.prepare(`
      SELECT invite_id FROM clan_invites 
      WHERE clan_id = ? AND player_id = ? AND expires_at > ?
    `).get(clanId, targetPlayerId, Math.floor(Date.now() / 1000));

        if (existing) {
            return { success: false, error: 'Ya tiene una invitación pendiente' };
        }

        const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 días

        const stmt = survivalDB.db.prepare(`
      INSERT INTO clan_invites (invite_id, clan_id, player_id, invited_by, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);

        stmt.run(inviteId, clanId, targetPlayerId, inviterId, expiresAt);

        this.logActivity(clanId, inviterId, 'player_invited', `Invitó a ${targetPlayerId}`);

        return { success: true, inviteId };
    }

    /**
     * Aceptar invitación
     */
    acceptInvite(playerId, inviteId) {
        const stmt = survivalDB.db.prepare(`
      SELECT * FROM clan_invites 
      WHERE invite_id = ? AND player_id = ? AND expires_at > ?
    `);

        const invite = stmt.get(inviteId, playerId, Math.floor(Date.now() / 1000));

        if (!invite) {
            return { success: false, error: 'Invitación no válida o expirada' };
        }

        // Verificar que el jugador no esté en un clan
        if (this.getPlayerClan(playerId)) {
            return { success: false, error: 'Ya estás en un clan' };
        }

        // Verificar límite de miembros
        const clan = this.getClanInfo(invite.clan_id);
        if (clan.total_members >= this.CLAN_BENEFITS[clan.level].memberLimit) {
            return { success: false, error: 'El clan está lleno' };
        }

        try {
            // Agregar como miembro
            const insertMember = survivalDB.db.prepare(`
        INSERT INTO clan_members (player_id, clan_id, rank)
        VALUES (?, ?, 'recruit')
      `);

            insertMember.run(playerId, invite.clan_id);

            // Actualizar contador de miembros
            const updateCount = survivalDB.db.prepare(`
        UPDATE clans SET total_members = total_members + 1 WHERE clan_id = ?
      `);

            updateCount.run(invite.clan_id);

            // Eliminar invitación
            const deleteInvite = survivalDB.db.prepare(`
        DELETE FROM clan_invites WHERE invite_id = ?
      `);

            deleteInvite.run(inviteId);

            this.logActivity(invite.clan_id, playerId, 'player_joined', `${playerId} se unió al clan`);

            return {
                success: true,
                clan: this.getClanInfo(invite.clan_id)
            };
        } catch (error) {
            console.error('Error aceptando invitación:', error);
            return { success: false, error: 'Error al unirse al clan' };
        }
    }

    /**
     * Abandonar clan
     */
    leaveClan(playerId) {
        const membership = this.getPlayerClan(playerId);

        if (!membership) {
            return { success: false, error: 'No estás en un clan' };
        }

        // Si es líder, debe transferir el liderazgo o disolver el clan
        if (membership.rank === 'leader') {
            const members = this.getClanMembers(membership.clan_id);
            if (members.length > 1) {
                return { success: false, error: 'Debes transferir el liderazgo o disolver el clan' };
            } else {
                // Disolver clan si es el único miembro
                return this.dissolveClan(membership.clan_id, playerId);
            }
        }

        try {
            const deleteMember = survivalDB.db.prepare(`
        DELETE FROM clan_members WHERE player_id = ?
      `);

            deleteMember.run(playerId);

            const updateCount = survivalDB.db.prepare(`
        UPDATE clans SET total_members = total_members - 1 WHERE clan_id = ?
      `);

            updateCount.run(membership.clan_id);

            this.logActivity(membership.clan_id, playerId, 'player_left', `${playerId} abandonó el clan`);

            return { success: true };
        } catch (error) {
            console.error('Error abandonando clan:', error);
            return { success: false, error: 'Error al abandonar' };
        }
    }

    /**
     * Expulsar miembro
     */
    kickMember(clanId, kickerId, targetPlayerId) {
        if (!this.hasPermission(kickerId, clanId, 'kick')) {
            return { success: false, error: 'Sin permisos para expulsar' };
        }

        // No puede expulsar al líder
        const targetMembership = survivalDB.db.prepare(`
      SELECT rank FROM clan_members WHERE player_id = ? AND clan_id = ?
    `).get(targetPlayerId, clanId);

        if (!targetMembership) {
            return { success: false, error: 'Jugador no está en el clan' };
        }

        if (targetMembership.rank === 'leader') {
            return { success: false, error: 'No puedes expulsar al líder' };
        }

        try {
            const deleteMember = survivalDB.db.prepare(`
        DELETE FROM clan_members WHERE player_id = ? AND clan_id = ?
      `);

            deleteMember.run(targetPlayerId, clanId);

            const updateCount = survivalDB.db.prepare(`
        UPDATE clans SET total_members = total_members - 1 WHERE clan_id = ?
      `);

            updateCount.run(clanId);

            this.logActivity(clanId, kickerId, 'player_kicked', `${kickerId} expulsó a ${targetPlayerId}`);

            return { success: true };
        } catch (error) {
            console.error('Error expulsando miembro:', error);
            return { success: false, error: 'Error al expulsar' };
        }
    }

    /**
     * Promover miembro
     */
    promoteMember(clanId, promoterId, targetPlayerId, newRank) {
        if (!this.hasPermission(promoterId, clanId, 'promote_' + newRank.toLowerCase())) {
            return { success: false, error: 'Sin permisos para promover' };
        }

        if (!this.RANKS[newRank.toUpperCase()]) {
            return { success: false, error: 'Rango no válido' };
        }

        try {
            const updateRank = survivalDB.db.prepare(`
        UPDATE clan_members SET rank = ? WHERE player_id = ? AND clan_id = ?
      `);

            updateRank.run(newRank.toLowerCase(), targetPlayerId, clanId);

            this.logActivity(clanId, promoterId, 'member_promoted', `${targetPlayerId} promovido a ${newRank}`);

            return { success: true };
        } catch (error) {
            console.error('Error promoviendo miembro:', error);
            return { success: false, error: 'Error al promover' };
        }
    }

    /**
     * Disolver clan (solo líder)
     */
    dissolveClan(clanId, leaderId) {
        const clan = this.getClanInfo(clanId);

        if (!clan || clan.leader_id !== leaderId) {
            return { success: false, error: 'Solo el líder puede disolver el clan' };
        }

        try {
            const deleteClan = survivalDB.db.prepare(`
        DELETE FROM clans WHERE clan_id = ?
      `);

            deleteClan.run(clanId);

            console.log(`💥 Clan disuelto: ${clan.clan_name}`);

            return { success: true };
        } catch (error) {
            console.error('Error disolviendo clan:', error);
            return { success: false, error: 'Error al disolver clan' };
        }
    }

    /**
     * Verificar si un jugador tiene un permiso específico
     */
    hasPermission(playerId, clanId, permission) {
        const member = survivalDB.db.prepare(`
      SELECT rank FROM clan_members WHERE player_id = ? AND clan_id = ?
    `).get(playerId, clanId);

        if (!member) return false;

        const rankInfo = this.RANKS[member.rank.toUpperCase()];
        if (!rankInfo) return false;

        // Líder tiene todos los permisos
        if (rankInfo.permissions.includes('*')) return true;

        return rankInfo.permissions.includes(permission);
    }

    /**
     * Depositar items en almacén del clan
     */
    depositToStorage(clanId, playerId, itemName, quantity) {
        if (!this.hasPermission(playerId, clanId, 'manage_storage')) {
            return { success: false, error: 'Sin permisos para gestionar almacén' };
        }

        try {
            const stmt = survivalDB.db.prepare(`
        INSERT INTO clan_storage (clan_id, item_name, quantity, deposited_by)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(clan_id, item_name) DO UPDATE SET
          quantity = quantity + ?,
          deposited_by = ?,
          last_modified = strftime('%s', 'now')
      `);

            stmt.run(clanId, itemName, quantity, playerId, quantity, playerId);

            this.logActivity(clanId, playerId, 'storage_deposit', `Depositó ${quantity}x ${itemName}`);

            return { success: true };
        } catch (error) {
            console.error('Error depositando en almacén:', error);
            return { success: false, error: 'Error al depositar' };
        }
    }

    /**
     * Retirar items del almacén del clan
     */
    withdrawFromStorage(clanId, playerId, itemName, quantity) {
        if (!this.hasPermission(playerId, clanId, 'use_storage')) {
            return { success: false, error: 'Sin permisos para usar almacén' };
        }

        const current = survivalDB.db.prepare(`
      SELECT quantity FROM clan_storage WHERE clan_id = ? AND item_name = ?
    `).get(clanId, itemName);

        if (!current || current.quantity < quantity) {
            return { success: false, error: 'No hay suficientes items' };
        }

        try {
            const updateStmt = survivalDB.db.prepare(`
        UPDATE clan_storage 
        SET quantity = quantity - ?, last_modified = strftime('%s', 'now')
        WHERE clan_id = ? AND item_name = ?
      `);

            updateStmt.run(quantity, clanId, itemName);

            // Eliminar si llegó a 0
            const deleteStmt = survivalDB.db.prepare(`
        DELETE FROM clan_storage WHERE clan_id = ? AND item_name = ? AND quantity <= 0
      `);

            deleteStmt.run(clanId, itemName);

            this.logActivity(clanId, playerId, 'storage_withdraw', `Retiró ${quantity}x ${itemName}`);

            return { success: true };
        } catch (error) {
            console.error('Error retirando del almacén:', error);
            return { success: false, error: 'Error al retirar' };
        }
    }

    /**
     * Obtener inventario del almacén
     */
    getStorage(clanId) {
        const stmt = survivalDB.db.prepare(`
      SELECT item_name, quantity, deposited_by, last_modified
      FROM clan_storage
      WHERE clan_id = ?
      ORDER BY item_name ASC
    `);

        return stmt.all(clanId);
    }

    /**
     * Registrar actividad en el log
     */
    logActivity(clanId, playerId, actionType, details) {
        const stmt = survivalDB.db.prepare(`
      INSERT INTO clan_activity_log (clan_id, player_id, action_type, details)
      VALUES (?, ?, ?, ?)
    `);

        stmt.run(clanId, playerId, actionType, details);
    }

    /**
     * Obtener log de actividades
     */
    getActivityLog(clanId, limit = 50) {
        const stmt = survivalDB.db.prepare(`
      SELECT * FROM clan_activity_log
      WHERE clan_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

        return stmt.all(clanId, limit);
    }

    /**
     * Buscar clanes que están reclutando
     */
    searchRecruitingClans(searchTerm = '') {
        let stmt;

        if (searchTerm) {
            stmt = survivalDB.db.prepare(`
        SELECT * FROM clans
        WHERE is_recruiting = 1 
        AND (clan_name LIKE ? OR clan_tag LIKE ? OR description LIKE ?)
        ORDER BY level DESC, total_members DESC
        LIMIT 20
      `);

            const term = `%${searchTerm}%`;
            return stmt.all(term, term, term);
        } else {
            stmt = survivalDB.db.prepare(`
        SELECT * FROM clans
        WHERE is_recruiting = 1
        ORDER BY level DESC, total_members DESC
        LIMIT 20
      `);

            return stmt.all();
        }
    }

    /**
     * Agregar XP al clan
     */
    addClanXP(clanId, amount, source) {
        const clan = this.getClanInfo(clanId);
        if (!clan) return;

        const newXP = clan.experience + amount;
        const xpForNextLevel = this.getXPForLevel(clan.level + 1);

        // Verificar level up
        let newLevel = clan.level;
        if (newXP >= xpForNextLevel && clan.level < 5) {
            newLevel = clan.level + 1;
            console.log(`⭐ Clan ${clan.clan_name} subió a nivel ${newLevel}!`);
        }

        const stmt = survivalDB.db.prepare(`
      UPDATE clans 
      SET experience = ?, level = ?
      WHERE clan_id = ?
    `);

        stmt.run(newXP, newLevel, clanId);

        this.logActivity(clanId, null, 'clan_xp_gained', `+${amount} XP de ${source}`);

        return { newLevel, newXP, leveledUp: newLevel > clan.level };
    }

    /**
     * Calcular XP necesaria para un nivel
     */
    getXPForLevel(level) {
        return level * level * 1000; // Escalado cuadrático
    }
}

export default ClanSystem;

