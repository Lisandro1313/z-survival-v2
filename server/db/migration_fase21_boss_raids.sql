-- =====================================================
-- FASE 21: SISTEMA DE BOSS RAIDS AVANZADO
-- =====================================================
-- Schema para raids cooperativos contra jefes legendarios
-- con mecánicas avanzadas, fases, habilidades y loot épico

-- Tabla de definiciones de bosses
CREATE TABLE IF NOT EXISTS boss_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier INTEGER NOT NULL, -- 1=Common, 2=Elite, 3=Legendary, 4=Mythic
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    base_hp INTEGER NOT NULL,
    base_damage INTEGER NOT NULL,
    base_defense INTEGER NOT NULL,
    level_requirement INTEGER DEFAULT 1,
    
    -- Mecánicas de fases (JSON array)
    -- Ejemplo: [{"threshold": 75, "name": "Enrage", "effects": ["damage_boost": 1.5]}, ...]
    phases TEXT NOT NULL,
    
    -- Habilidades especiales (JSON array)
    -- Ejemplo: [{"id":"ground_slam", "name":"Ground Slam", "damage":150, "cooldown":10, "aoe":true}]
    abilities TEXT NOT NULL,
    
    -- Loot table (JSON)
    -- Ejemplo: {"guaranteed": [{"item_id":"legendary_vest", "chance":1.0}], "random": [...]}
    loot_table TEXT NOT NULL,
    
    -- Cooldown entre spawns (minutos)
    spawn_cooldown INTEGER DEFAULT 60,
    
    -- Requisitos para enfrentar
    requirements TEXT, -- JSON: {"min_level": 10, "min_players": 3, "items_required": []}
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de raids activos (instancias de bosses spawneados)
CREATE TABLE IF NOT EXISTS active_boss_raids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    boss_id TEXT NOT NULL,
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    current_phase INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active', -- active, completed, failed
    location TEXT NOT NULL,
    
    -- Mecánicas activas (JSON)
    -- Ejemplo: {"enrage": true, "berserk_stacks": 3, "regenerating": false}
    active_mechanics TEXT,
    
    -- Cooldowns de habilidades (JSON)
    -- Ejemplo: {"ground_slam": 1708281600000, "toxic_cloud": 1708281550000}
    ability_cooldowns TEXT,
    
    spawned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    defeated_at DATETIME,
    
    FOREIGN KEY (boss_id) REFERENCES boss_definitions(id)
);

-- Tabla de participantes en raids
CREATE TABLE IF NOT EXISTS boss_raid_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raid_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    
    -- Contribuciones
    damage_dealt INTEGER DEFAULT 0,
    healing_done INTEGER DEFAULT 0,
    times_died INTEGER DEFAULT 0,
    abilities_used INTEGER DEFAULT 0,
    
    -- Estado actual
    is_active INTEGER DEFAULT 1, -- 1=en raid, 0=salió o murió permanently
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    
    -- Recompensas (calculadas al final)
    loot_received TEXT, -- JSON array de items
    xp_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0,
    
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    left_at DATETIME,
    
    FOREIGN KEY (raid_id) REFERENCES active_boss_raids(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE(raid_id, player_id)
);

-- Tabla de historial de ataques (logs de combate detallados)
CREATE TABLE IF NOT EXISTS boss_raid_combat_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raid_id INTEGER NOT NULL,
    attacker_id INTEGER, -- player_id o null si es el boss
    attacker_name TEXT,
    attacker_type TEXT NOT NULL, -- 'player' o 'boss'
    
    action_type TEXT NOT NULL, -- 'attack', 'ability', 'heal', 'defend'
    ability_id TEXT, -- ID de habilidad si aplica
    
    damage_dealt INTEGER DEFAULT 0,
    healing_done INTEGER DEFAULT 0,
    was_critical INTEGER DEFAULT 0,
    was_dodged INTEGER DEFAULT 0,
    
    -- Efectos aplicados (JSON)
    -- Ejemplo: ["bleeding", "stunned", "poisoned"]
    effects_applied TEXT,
    
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (raid_id) REFERENCES active_boss_raids(id),
    FOREIGN KEY (attacker_id) REFERENCES players(id)
);

-- Tabla de historial de raids completados (para estadísticas y achievements)
CREATE TABLE IF NOT EXISTS boss_raid_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raid_id INTEGER NOT NULL,
    boss_id TEXT NOT NULL,
    boss_name TEXT NOT NULL,
    tier INTEGER NOT NULL,
    
    -- Resultado
    success INTEGER NOT NULL, -- 1=victoria, 0=derrota
    duration_seconds INTEGER NOT NULL, -- Tiempo que tomó el raid
    
    -- Participantes (JSON array de nombres)
    participants TEXT NOT NULL,
    top_damage_dealer TEXT,
    top_damage_amount INTEGER,
    
    -- MVP (Most Valuable Player)
    mvp_player_id INTEGER,
    mvp_player_name TEXT,
    
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (raid_id) REFERENCES active_boss_raids(id),
    FOREIGN KEY (boss_id) REFERENCES boss_definitions(id),
    FOREIGN KEY (mvp_player_id) REFERENCES players(id)
);

-- Tabla de achievements de raids
CREATE TABLE IF NOT EXISTS boss_raid_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT NOT NULL,
    tier INTEGER, -- Tier del boss relacionado
    
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE(player_id, achievement_id)
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_active_raids_status ON active_boss_raids(status);
CREATE INDEX IF NOT EXISTS idx_active_raids_location ON active_boss_raids(location);
CREATE INDEX IF NOT EXISTS idx_raid_participants_raid ON boss_raid_participants(raid_id);
CREATE INDEX IF NOT EXISTS idx_raid_participants_player ON boss_raid_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_raid_history_boss ON boss_raid_history(boss_id);
CREATE INDEX IF NOT EXISTS idx_raid_history_player ON boss_raid_history(mvp_player_id);
CREATE INDEX IF NOT EXISTS idx_raid_achievements_player ON boss_raid_achievements(player_id);

-- =====================================================
-- DATOS INICIALES: BOSSES LEGENDARIOS
-- =====================================================

-- TIER 1: THE HORDE KING (Rey de la Horda)
INSERT OR REPLACE INTO boss_definitions (
    id, name, tier, icon, description,
    base_hp, base_damage, base_defense,
    level_requirement,
    phases, abilities, loot_table,
    spawn_cooldown, requirements
) VALUES (
    'horde_king',
    'The Horde King',
    1,
    '👑',
    'Un zombie colosal que comanda hordas enteras. Su corona oxidada es símbolo de su dominio sobre los muertos vivientes.',
    5000,
    50,
    20,
    5,
    '[
        {"threshold": 50, "name": "Call the Horde", "description": "Invoca zombies de refuerzo", "effects": {"summon_zombies": 3, "damage_boost": 1.2}}
    ]',
    '[
        {"id": "zombie_swarm", "name": "Zombie Swarm", "description": "Invoca 5 zombies menores", "cooldown": 30, "effects": {"summon_count": 5}},
        {"id": "commanding_roar", "name": "Commanding Roar", "description": "AoE que aumenta daño de aliados", "damage": 30, "cooldown": 20, "aoe": true}
    ]',
    '{
        "guaranteed": [
            {"item_id": "military_vest", "name": "Military Vest", "rarity": "rare", "chance": 1.0},
            {"item_id": "golden_crown_fragment", "name": "Golden Crown Fragment", "rarity": "epic", "chance": 0.5}
        ],
        "random": [
            {"item_id": "advanced_rifle", "name": "Advanced Rifle", "rarity": "rare", "chance": 0.3},
            {"item_id": "medkit_large", "name": "Large Medkit", "rarity": "uncommon", "chance": 0.6},
            {"item_id": "rare_materials", "name": "Rare Materials", "amount": "5-10", "chance": 0.8}
        ],
        "xp_range": [500, 800],
        "gold_range": [200, 400]
    }',
    60,
    '{"min_level": 5, "min_players": 2, "recommended_players": 4}'
);

-- TIER 2: MUTANT BRUTE (Bruto Mutante)
INSERT OR REPLACE INTO boss_definitions (
    id, name, tier, icon, description,
    base_hp, base_damage, base_defense,
    level_requirement,
    phases, abilities, loot_table,
    spawn_cooldown, requirements
) VALUES (
    'mutant_brute',
    'Mutant Brute',
    2,
    '💪',
    'Una aberración muscular que ha mutado más allá de los zombies comunes. Su fuerza es devastadora y su rabia, infinita.',
    8000,
    80,
    35,
    10,
    '[
        {"threshold": 60, "name": "Enrage", "description": "Aumenta velocidad de ataque", "effects": {"damage_boost": 1.3, "attack_speed": 1.5}},
        {"threshold": 30, "name": "Berserk", "description": "Furia total, pero pierde defensa", "effects": {"damage_boost": 1.8, "defense_reduction": 0.5}}
    ]',
    '[
        {"id": "ground_slam", "name": "Ground Slam", "description": "AoE masivo que aturde", "damage": 100, "cooldown": 25, "aoe": true, "effects": {"stun_duration": 3}},
        {"id": "charge", "name": "Brutal Charge", "description": "Embiste a un jugador", "damage": 150, "cooldown": 15, "single_target": true},
        {"id": "intimidate", "name": "Intimidating Roar", "description": "Reduce ataque de todos", "cooldown": 30, "aoe": true, "effects": {"attack_debuff": 0.7, "duration": 10}}
    ]',
    '{
        "guaranteed": [
            {"item_id": "reinforced_armor", "name": "Reinforced Armor", "rarity": "epic", "chance": 1.0},
            {"item_id": "mutant_tissue", "name": "Mutant Tissue", "rarity": "epic", "chance": 1.0}
        ],
        "random": [
            {"item_id": "heavy_shotgun", "name": "Heavy Shotgun", "rarity": "epic", "chance": 0.4},
            {"item_id": "strength_serum", "name": "Strength Serum", "rarity": "rare", "chance": 0.5},
            {"item_id": "epic_materials", "name": "Epic Materials", "amount": "3-7", "chance": 0.7}
        ],
        "xp_range": [1000, 1500],
        "gold_range": [400, 700]
    }',
    90,
    '{"min_level": 10, "min_players": 3, "recommended_players": 5}'
);

-- TIER 3: INFECTED COLOSSUS (Coloso Infectado)
INSERT OR REPLACE INTO boss_definitions (
    id, name, tier, icon, description,
    base_hp, base_damage, base_defense,
    level_requirement,
    phases, abilities, loot_table,
    spawn_cooldown, requirements
) VALUES (
    'infected_colossus',
    'The Infected Colossus',
    3,
    '🏔️',
    'Un titán de carne putrefacta y metal oxidado. Su simple presencia emana toxinas mortales. Se dice que fue un experimento militar fallido.',
    15000,
    120,
    50,
    15,
    '[
        {"threshold": 75, "name": "Toxic Phase", "description": "Empieza a emanar gas tóxico", "effects": {"aura_damage": 5, "damage_boost": 1.1}},
        {"threshold": 50, "name": "Armored Phase", "description": "Activa placas metálicas", "effects": {"defense_boost": 1.5, "speed_reduction": 0.7}},
        {"threshold": 25, "name": "Regeneration", "description": "Regenera HP constantemente", "effects": {"regen_per_second": 50, "damage_boost": 1.3}}
    ]',
    '[
        {"id": "toxic_cloud", "name": "Toxic Cloud", "description": "Nube venenosa AoE", "damage": 40, "cooldown": 20, "aoe": true, "effects": {"poison_duration": 15, "poison_damage": 10}},
        {"id": "charge_attack", "name": "Titan Charge", "description": "Embiste atravesando jugadores", "damage": 200, "cooldown": 25, "effects": {"knockback": true}},
        {"id": "metal_burst", "name": "Metal Burst", "description": "Explota metralla en todas direcciones", "damage": 80, "cooldown": 30, "aoe": true, "effects": {"bleeding_duration": 10}},
        {"id": "regenerate", "name": "Forced Regeneration", "description": "Se cura 1000 HP", "healing": 1000, "cooldown": 60}
    ]',
    '{
        "guaranteed": [
            {"item_id": "legendary_weapon", "name": "Legendary Weapon (Random)", "rarity": "legendary", "chance": 1.0},
            {"item_id": "colossus_heart", "name": "Colossus Heart", "rarity": "legendary", "chance": 1.0},
            {"item_id": "epic_armor_set", "name": "Epic Armor Set", "rarity": "epic", "chance": 1.0}
        ],
        "random": [
            {"item_id": "anti_toxin", "name": "Anti-Toxin Serum", "rarity": "epic", "chance": 0.6},
            {"item_id": "legendary_materials", "name": "Legendary Materials", "amount": "2-5", "chance": 0.8},
            {"item_id": "crafting_blueprint_legendary", "name": "Legendary Blueprint", "chance": 0.3}
        ],
        "xp_range": [2500, 4000],
        "gold_range": [1000, 1500]
    }',
    120,
    '{"min_level": 15, "min_players": 4, "recommended_players": 6}'
);

-- TIER 4: WASTELAND WARLORD (Señor de la Guerra) - ENDGAME BOSS
INSERT OR REPLACE INTO boss_definitions (
    id, name, tier, icon, description,
    base_hp, base_damage, base_defense,
    level_requirement,
    phases, abilities, loot_table,
    spawn_cooldown, requirements
) VALUES (
    'wasteland_warlord',
    'Wasteland Warlord',
    4,
    '⚔️',
    'El boss definitivo. Un humano corrompido que se ha fusionado con la infección, conservando su inteligencia pero perdiendo su humanidad. Comanda ejércitos y posee poderes sobrenaturales.',
    25000,
    150,
    70,
    20,
    '[
        {"threshold": 80, "name": "Phase 1: Commander", "description": "Invoca guardias de élite", "effects": {"summon_elites": 2, "damage_boost": 1.0}},
        {"threshold": 60, "name": "Phase 2: Berserker", "description": "Combate cuerpo a cuerpo intenso", "effects": {"damage_boost": 1.4, "attack_speed": 2.0}},
        {"threshold": 40, "name": "Phase 3: Necromancer", "description": "Invoca hordas infinitas", "effects": {"summon_zombies_constant": true, "heal_from_minion_deaths": 100}},
        {"threshold": 20, "name": "Phase 4: Corrupted God", "description": "Forma final con poderes oscuros", "effects": {"damage_boost": 2.0, "defense_boost": 1.5, "life_steal": 0.3}},
        {"threshold": 5, "name": "Phase 5: Last Stand", "description": "Sacrifica HP por daño masivo", "effects": {"damage_boost": 3.0, "kamikaze_mode": true}}
    ]',
    '[
        {"id": "summon_guards", "name": "Summon Elite Guards", "description": "Invoca 2 guardias de élite", "cooldown": 40, "effects": {"summon_elites": 2}},
        {"id": "dark_eruption", "name": "Dark Eruption", "description": "Explosión oscura masiva", "damage": 250, "cooldown": 35, "aoe": true},
        {"id": "soul_drain", "name": "Soul Drain", "description": "Roba vida de todos los jugadores", "damage": 100, "cooldown": 30, "aoe": true, "effects": {"life_steal": 1.0}},
        {"id": "time_freeze", "name": "Time Freeze", "description": "Congela el tiempo para todos", "cooldown": 60, "aoe": true, "effects": {"stun_duration": 5}},
        {"id": "execute", "name": "Execute", "description": "Mata instantáneamente a jugadores bajo 20% HP", "cooldown": 45, "single_target": true, "effects": {"execute_threshold": 0.2}},
        {"id": "final_stand", "name": "Final Stand", "description": "Curación completa + berserk (solo fase 5)", "healing": 5000, "cooldown": 90, "effects": {"damage_boost": 2.5, "duration": 20}}
    ]',
    '{
        "guaranteed": [
            {"item_id": "mythic_weapon", "name": "Mythic Weapon", "rarity": "mythic", "chance": 1.0},
            {"item_id": "warlord_armor_set", "name": "Warlord Armor Set", "rarity": "mythic", "chance": 1.0},
            {"item_id": "corrupted_crown", "name": "Corrupted Crown", "rarity": "mythic", "chance": 1.0},
            {"item_id": "warlord_title", "name": "Title: Warlord Slayer", "rarity": "unique", "chance": 1.0}
        ],
        "random": [
            {"item_id": "mythic_materials", "name": "Mythic Materials", "amount": "5-10", "chance": 1.0},
            {"item_id": "legendary_consumables", "name": "Legendary Consumables Pack", "amount": "10", "chance": 0.8},
            {"item_id": "crafting_blueprint_mythic", "name": "Mythic Blueprint", "chance": 0.5},
            {"item_id": "cosmetic_unique", "name": "Unique Cosmetic", "chance": 0.3}
        ],
        "xp_range": [5000, 10000],
        "gold_range": [3000, 5000]
    }',
    180,
    '{"min_level": 20, "min_players": 6, "recommended_players": 8}'
);

-- =====================================================
-- VIEWS Y FUNCIONES ÚTILES
-- =====================================================

-- View: Ranking de jugadores por daño total en raids
CREATE VIEW IF NOT EXISTS boss_raid_damage_leaderboard AS
SELECT 
    player_id,
    player_name,
    SUM(damage_dealt) as total_damage,
    COUNT(DISTINCT raid_id) as raids_participated,
    SUM(CASE WHEN is_active = 0 AND raid_id IN (
        SELECT raid_id FROM active_boss_raids WHERE status = 'completed'
    ) THEN 1 ELSE 0 END) as raids_completed
FROM boss_raid_participants
GROUP BY player_id, player_name
ORDER BY total_damage DESC;

-- View: Estadísticas de cada boss
CREATE VIEW IF NOT EXISTS boss_stats AS
SELECT 
    bd.id,
    bd.name,
    bd.tier,
    COUNT(DISTINCT abr.id) as times_spawned,
    COUNT(DISTINCT CASE WHEN abr.status = 'completed' THEN abr.id END) as times_defeated,
    ROUND(AVG(brh.duration_seconds), 2) as avg_defeat_time_seconds,
    brh.top_damage_dealer as last_top_damage_dealer
FROM boss_definitions bd
LEFT JOIN active_boss_raids abr ON bd.id = abr.boss_id
LEFT JOIN boss_raid_history brh ON abr.id = brh.raid_id
GROUP BY bd.id, bd.name, bd.tier;
