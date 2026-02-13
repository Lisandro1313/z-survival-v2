/**
 * 📊 DATABASE INDEXES
 * Definiciones de índices para optimización de queries
 * 
 * Cuando se migre de mock DB a SQLite real, estos índices
 * mejorarán significativamente el rendimiento de las queries
 */

export const DATABASE_INDEXES = {
  // ====================================
  // TABLA: usuarios
  // ====================================
  usuarios: [
    {
      name: 'idx_usuarios_username',
      columns: ['username'],
      unique: true,
      description: 'Búsqueda rápida por username en login'
    },
    {
      name: 'idx_usuarios_email',
      columns: ['email'],
      unique: true,
      description: 'Búsqueda por email'
    },
    {
      name: 'idx_usuarios_created_at',
      columns: ['created_at'],
      description: 'Ordenamiento por fecha de registro'
    }
  ],

  // ====================================
  // TABLA: personajes (characters)
  // ====================================
  personajes: [
    {
      name: 'idx_personajes_usuario_id',
      columns: ['usuario_id'],
      description: 'Listar personajes de un usuario'
    },
    {
      name: 'idx_personajes_nombre',
      columns: ['nombre'],
      unique: true,
      description: 'Nombres de personajes únicos'
    },
    {
      name: 'idx_personajes_last_login',
      columns: ['last_login'],
      description: 'Personajes activos recientemente'
    },
    {
      name: 'idx_personajes_level',
      columns: ['level'],
      description: 'Rankings y filtros por nivel'
    }
  ],

  // ====================================
  // TABLA: trades (intercambios)
  // ====================================
  trades: [
    {
      name: 'idx_trades_initiator',
      columns: ['initiator_id'],
      description: 'Trades iniciados por un jugador'
    },
    {
      name: 'idx_trades_receiver',
      columns: ['receiver_id'],
      description: 'Trades recibidos por un jugador'
    },
    {
      name: 'idx_trades_status',
      columns: ['status'],
      description: 'Filtrar trades por estado (pending, accepted, etc.)'
    },
    {
      name: 'idx_trades_created_at',
      columns: ['created_at'],
      description: 'Ordenar trades por fecha'
    },
    {
      name: 'idx_trades_composite',
      columns: ['status', 'created_at'],
      description: 'Composite index para queries comunes'
    }
  ],

  // ====================================
  // TABLA: notifications (notificaciones)
  // ====================================
  notifications: [
    {
      name: 'idx_notifications_player',
      columns: ['player_id'],
      description: 'Notificaciones de un jugador'
    },
    {
      name: 'idx_notifications_read',
      columns: ['is_read'],
      description: 'Filtrar por leídas/no leídas'
    },
    {
      name: 'idx_notifications_category',
      columns: ['category'],
      description: 'Filtrar por categoría'
    },
    {
      name: 'idx_notifications_priority',
      columns: ['priority'],
      description: 'Ordenar por prioridad'
    },
    {
      name: 'idx_notifications_created_at',
      columns: ['created_at'],
      description: 'Ordenar por fecha'
    },
    {
      name: 'idx_notifications_composite',
      columns: ['player_id', 'is_read', 'created_at'],
      description: 'Composite index para query principal'
    }
  ],

  // ====================================
  // TABLA: inventory (inventario)
  // ====================================
  inventory: [
    {
      name: 'idx_inventory_character',
      columns: ['character_id'],
      description: 'Items de un personaje'
    },
    {
      name: 'idx_inventory_item_type',
      columns: ['item_type'],
      description: 'Filtrar por tipo de item'
    },
    {
      name: 'idx_inventory_composite',
      columns: ['character_id', 'item_type'],
      description: 'Query común: items de un personaje por tipo'
    }
  ],

  // ====================================
  // TABLA: world_nodes (nodos del mundo)
  // ====================================
  world_nodes: [
    {
      name: 'idx_nodes_coordinates',
      columns: ['x', 'y'],
      unique: true,
      description: 'Búsqueda por coordenadas'
    },
    {
      name: 'idx_nodes_region',
      columns: ['region_id'],
      description: 'Nodos de una región'
    },
    {
      name: 'idx_nodes_type',
      columns: ['node_type'],
      description: 'Filtrar por tipo de nodo'
    }
  ],

  // ====================================
  // TABLA: player_sessions (sesiones)
  // ====================================
  player_sessions: [
    {
      name: 'idx_sessions_player',
      columns: ['player_id'],
      description: 'Sesiones de un jugador'
    },
    {
      name: 'idx_sessions_token',
      columns: ['refresh_token'],
      unique: true,
      description: 'Búsqueda por token'
    },
    {
      name: 'idx_sessions_expires_at',
      columns: ['expires_at'],
      description: 'Cleanup de tokens expirados'
    }
  ],

  // ====================================
  // TABLA: encrypted_channels (canales encriptados)
  // ====================================
  encrypted_channels: [
    {
      name: 'idx_channels_id',
      columns: ['channel_id'],
      unique: true,
      description: 'Búsqueda por ID de canal'
    },
    {
      name: 'idx_channels_creator',
      columns: ['created_by'],
      description: 'Canales creados por un jugador'
    },
    {
      name: 'idx_channels_fingerprint',
      columns: ['fingerprint'],
      description: 'Verificación de fingerprint'
    }
  ]
};

/**
 * Genera SQL para crear índices (SQLite)
 * @param {string} table - Nombre de tabla
 * @returns {Array<string>} SQL statements
 */
export function generateIndexSQL(table) {
  const indexes = DATABASE_INDEXES[table];
  if (!indexes) return [];
  
  return indexes.map(idx => {
    const unique = idx.unique ? 'UNIQUE ' : '';
    const columns = idx.columns.join(', ');
    return `CREATE ${unique}INDEX IF NOT EXISTS ${idx.name} ON ${table}(${columns});`;
  });
}

/**
 * Genera todos los índices para todas las tablas
 * @returns {Array<string>} SQL statements
 */
export function generateAllIndexes() {
  const sql = [];
  
  for (const table in DATABASE_INDEXES) {
    const tableSQL = generateIndexSQL(table);
    sql.push(`-- Índices para tabla: ${table}`);
    sql.push(...tableSQL);
    sql.push('');
  }
  
  return sql.join('\n');
}

/**
 * Documentación de índices
 * @returns {string} Markdown documentation
 */
export function generateIndexDocumentation() {
  let doc = '# Database Indexes Documentation\n\n';
  doc += 'Índices optimizados para queries comunes\n\n';
  
  for (const [table, indexes] of Object.entries(DATABASE_INDEXES)) {
    doc += `## Tabla: ${table}\n\n`;
    
    for (const idx of indexes) {
      doc += `### ${idx.name}\n`;
      doc += `- **Columnas**: ${idx.columns.join(', ')}\n`;
      if (idx.unique) doc += `- **Único**: Sí\n`;
      doc += `- **Descripción**: ${idx.description}\n\n`;
    }
  }
  
  return doc;
}

export default {
  DATABASE_INDEXES,
  generateIndexSQL,
  generateAllIndexes,
  generateIndexDocumentation
};
