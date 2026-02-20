-- ========================================
-- MIGRACIÓN FASE 15: SISTEMA DE ECONOMÍA
-- ========================================
-- Este script añade las columnas necesarias para el sistema de economía
-- a bases de datos existentes. Es seguro ejecutarlo múltiples veces.

-- Añadir columnas de economía a la tabla personajes
ALTER TABLE personajes ADD COLUMN currency INTEGER DEFAULT 100;
ALTER TABLE personajes ADD COLUMN lastDailyReward TEXT DEFAULT NULL;
ALTER TABLE personajes ADD COLUMN loginStreak INTEGER DEFAULT 0;

-- Actualizar personajes existentes con saldo inicial si es NULL
UPDATE personajes SET currency = 100 WHERE currency IS NULL;
UPDATE personajes SET loginStreak = 0 WHERE loginStreak IS NULL;

-- Índices opcionales para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_personajes_currency ON personajes(currency);

-- ========================================
-- TABLAS PARA MARKETPLACE (opcional - en memoria por ahora)
-- ========================================
-- Las siguientes tablas son opcionales. El sistema actual funciona en memoria,
-- pero estas tablas permiten persistencia de listings del marketplace.

CREATE TABLE IF NOT EXISTS marketplace_listings (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL, -- playerId del vendedor
    seller_name TEXT NOT NULL, -- nombre del vendedor
    item_id TEXT NOT NULL, -- ID del item
    item_name TEXT NOT NULL, -- Nombre del item
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL, -- Precio en currency
    listing_type TEXT NOT NULL, -- 'sell' o 'auction'
    min_bid INTEGER DEFAULT 0, -- Para subastas
    current_bid INTEGER DEFAULT 0, -- Puja actual
    current_bidder_id TEXT DEFAULT NULL, -- ID del mejor postor
    created_at INTEGER NOT NULL, -- Timestamp
    expires_at INTEGER NOT NULL, -- Timestamp de expiración
    status TEXT DEFAULT 'active', -- active, sold, cancelled, expired
    UNIQUE(seller_id, item_id, created_at)
);

CREATE TABLE IF NOT EXISTS marketplace_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'purchase', 'auction_win'
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id)
);

-- Índices para marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_expires ON marketplace_listings(expires_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_item ON marketplace_listings(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON marketplace_transactions(timestamp DESC);

-- ========================================
-- LOG DE ECONOMÍA (opcional)
-- ========================================
-- Útil para debugging y análisis económico

CREATE TABLE IF NOT EXISTS economy_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL, -- 'earn', 'spend', 'transfer'
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT NOT NULL, -- 'zombie_kill', 'quest_complete', 'npc_purchase', etc.
    details TEXT, -- JSON con detalles adicionales
    timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_economy_log_player ON economy_log(player_id);
CREATE INDEX IF NOT EXISTS idx_economy_log_timestamp ON economy_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_economy_log_type ON economy_log(transaction_type);

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Verificar que las columnas existen
SELECT 
    name as table_name,
    sql
FROM sqlite_master 
WHERE type='table' 
AND name='personajes';
