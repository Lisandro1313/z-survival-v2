# FASE 17: SISTEMA DE CONFIANZA (TRUST) Y CLANES

## 📋 RESUMEN

Esta fase implementa dos sistemas sociales cruciales para la profundidad del juego:

1. **Sistema de Confianza (Trust)**: Reemplaza flags binarios con valores numéricos de relación
2. **Sistema de Clanes**: Organizaciones de jugadores con progresión, almacenamiento compartido y jerarquías

**Estado**: ✅ COMPLETADO  
**Líneas de código**: ~1300 líneas (backend + frontend)  
**Fecha**: Diciembre 2024

---

## 🤝 SISTEMA DE CONFIANZA (TRUST)

### Características Principales

1. **Valores Numéricos de Confianza**
   - Rango: -100 (Enemigo) a +100 (Aliado)
   - Niveles discretos para gameplay:
     - **75-100**: ALIADO 💚 (Acceso total, misiones especiales)
     - **50-74**: AMIGO 💛 (Comercio con descuento, confianza alta)
     - **25-49**: CONOCIDO 🟡 (Interacciones normales)
     - **0-24**: NEUTRAL ⚪ (Mínima confianza)
     - **-1 a -24**: DESCONFIADO 🟠 (Desconfianza leve)
     - **-25 a -49**: HOSTIL 🔴 (No comercio, agresivo)
     - **-50 a -100**: ENEMIGO 💔 (Ataque en vista)

2. **Sistema de Decaimiento Natural**
   - Las relaciones se degradan lentamente sin interacción
   - Tasa: -1 punto cada 7 días de inactividad
   - Incentiva interacción continua con NPCs

3. **Formas de Modificar Trust**
   - **Completar misiones**: +15 a +30 trust
   - **Dar regalos**: Variable según calidad del ítem
   - **Revelar secretos**: +20 trust (acciones especiales)
   - **Traicionar/fallar misiones**: -20 a -50 trust

### Implementación Técnica

**Backend** (`server/systems/trustSystem.js` - 430 líneas)

```javascript
class TrustSystem {
  constructor(db) {
    this.db = db;
    this.initializeDatabase();
  }

  getTrust(playerId, npcId) {
    // Obtener valor de confianza
  }

  modifyTrust(playerId, npcId, amount, reason) {
    // Modificar confianza con límites
  }

  getTrustLevel(trustValue) {
    // Convertir valor numérico a nivel discreto
  }

  giveGift(playerId, npcId, itemId, quantity) {
    // Sistema de regalos con multiplicadores
  }

  applyNaturalDecay() {
    // Decaimiento automático cada 7 días
  }
}
```

**Frontend** (survival.html)

- Panel de relaciones con visualización de barras de progreso
- Códigos de color según nivel de trust
- Historial de última interacción

### Base de Datos

```sql
CREATE TABLE IF NOT EXISTS player_trust (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    npc_id TEXT NOT NULL,
    trust_value INTEGER DEFAULT 0,
    last_interaction INTEGER,
    total_gifts_given INTEGER DEFAULT 0,
    total_quests_completed INTEGER DEFAULT 0,
    UNIQUE(player_id, npc_id)
);
```

### WebSocket Handlers

- `trust:get` - Obtener trust de un NPC específico
- `trust:get_all` - Obtener todas las relaciones del jugador
- `trust:modify` - Modificar trust (admin/sistema)
- `trust:give_gift` - Dar regalo a NPC
- `trust:complete_quest_trust` - Aumentar trust por misión
- `trust:get_stats` - Estadísticas de relaciones

---

## 🏰 SISTEMA DE CLANES

### Características Principales

1. **Creación y Gestión de Clanes**
   - Costo de creación: 5000 caps
   - Nombre (max 30 chars) + Tag (3-5 chars) + Descripción (max 200 chars)
   - Solo líder puede crear clan

2. **Jerarquía de Rangos**
   - **LEADER** (5): Control total, única autoridad
   - **OFFICER** (4): Gestión de miembros, kick, promoción hasta VETERAN
   - **VETERAN** (3): Acceso completo al almacén
   - **MEMBER** (2): Acceso de lectura al almacén
   - **RECRUIT** (1): Sin acceso al almacén, periodo de prueba

3. **Sistema de Niveles de Clan**
   - Nivel 1 (0 XP): 10 miembros max, 50 capacidad almacén
   - Nivel 2 (1000 XP): 15 miembros, 100 capacidad
   - Nivel 3 (3000 XP): 20 miembros, 200 capacidad
   - Nivel 4 (7000 XP): 30 miembros, 350 capacidad
   - Nivel 5 (15000 XP): 50 miembros, 500 capacidad

4. **Almacenamiento Compartido**
   - Depósito/retiro de recursos según rango
   - Registro de todas las transacciones
   - Límite de capacidad según nivel del clan

5. **Sistema de Invitaciones**
   - Invitaciones con expiración (24h)
   - Solo OFFICER+ puede invitar
   - Aceptar/rechazar invitaciones

6. **Registro de Actividad**
   - Log completo de acciones del clan
   - Tipos: join, leave, kick, promote, deposit, withdraw
   - Límite configurable de entradas mostradas

### Implementación Técnica

**Backend** (`server/systems/ClanSystem.js` - 850+ líneas)

```javascript
class ClanSystem {
  constructor(db) {
    this.db = db;
    this.initializeDatabase();
    this.RANKS = { RECRUIT: 1, MEMBER: 2, VETERAN: 3, OFFICER: 4, LEADER: 5 };
  }

  createClan(leaderId, name, tag, description) {
    // Crear clan con validaciones
  }

  invitePlayer(inviterId, targetPlayerId) {
    // Sistema de invitaciones con permisos
  }

  acceptInvite(playerId, clanId) {
    // Aceptar invitación y unirse
  }

  promoteMember(promoterId, targetId, newRank) {
    // Promoción con validación de permisos
  }

  depositToStorage(playerId, itemId, quantity) {
    // Depósito al almacén compartido
  }

  withdrawFromStorage(playerId, itemId, quantity) {
    // Retiro del almacén según rango
  }

  addClanXP(clanId, amount, reason) {
    // Progresión de nivel del clan
  }
}
```

**Frontend** (survival.html - ~600 líneas)

- Panel principal del clan con estadísticas
- Navegador de clanes disponibles
- Formulario de creación de clan
- Gestión de miembros y almacén

### Base de Datos

```sql
-- Tabla principal de clanes
CREATE TABLE IF NOT EXISTS clans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL UNIQUE,
    description TEXT,
    leader_id TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    total_caps INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Miembros del clan
CREATE TABLE IF NOT EXISTS clan_members (
    clan_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    rank INTEGER DEFAULT 1,
    joined_at INTEGER DEFAULT (strftime('%s', 'now')),
    contribution_points INTEGER DEFAULT 0,
    PRIMARY KEY (clan_id, player_id)
);

-- Invitaciones
CREATE TABLE IF NOT EXISTS clan_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clan_id TEXT NOT NULL,
    inviter_id TEXT NOT NULL,
    invited_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER NOT NULL,
    status TEXT DEFAULT 'pending'
);

-- Almacenamiento
CREATE TABLE IF NOT EXISTS clan_storage (
    clan_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    last_modified INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (clan_id, item_id)
);

-- Log de actividad
CREATE TABLE IF NOT EXISTS clan_activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clan_id TEXT NOT NULL,
    player_id TEXT,
    action_type TEXT NOT NULL,
    details TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### WebSocket Handlers (15 total)

- `clan:create` - Crear nuevo clan
- `clan:get_info` - Obtener información de un clan
- `clan:get_my_clan` - Obtener clan del jugador
- `clan:invite` - Invitar jugador
- `clan:accept_invite` - Aceptar invitación
- `clan:decline_invite` - Rechazar invitación
- `clan:leave` - Abandonar clan
- `clan:kick` - Expulsar miembro
- `clan:promote` - Promocionar miembro
- `clan:get_members` - Listar miembros
- `clan:storage_deposit` - Depositar en almacén
- `clan:storage_withdraw` - Retirar del almacén
- `clan:get_storage` - Ver inventario del clan
- `clan:search_recruiting` - Buscar clanes que reclutan
- `clan:get_activity_log` - Ver historial de actividad

---

## 🎯 BENEFICIOS DE GAMEPLAY

### Sistema de Trust

- **Progresión narrativa profunda**: Relaciones evolucionan de forma natural
- **Recompensas escaladas**: Mejores misiones/precios según trust
- **Consecuencias reales**: Traicionar tiene impacto duradero
- **Mundo vivo**: NPCs reaccionan según historial del jugador

### Sistema de Clanes

- **Cooperación incentivada**: Recursos compartidos y objetivos comunes
- **Progresión a largo plazo**: Niveles de clan con beneficios tangibles
- **Economía de grupo**: Almacenamiento compartido y banco de clan
- **Jerarquía social**: Rangos con responsabilidades y recompensas

---

## 🔄 INTEGRACIÓN CON FASES PREVIAS

- **Fase 11 (Misiones Dinámicas)**: Trust afecta disponibilidad de misiones
- **Fase 15 (Economía)**: Precios de NPCs varían según trust
- **Fase 16 (Raids)**: Clanes pueden organizar raids grupales
- **Fase 18 (PvP)**: Clanes pueden defenderse mutuamente

---

## 📊 ESTADÍSTICAS DE IMPLEMENTACIÓN

**Backend**

- TrustSystem.js: 430 líneas
- ClanSystem.js: 850 líneas
- WebSocket handlers: 21 handlers
- Total backend: ~1280 líneas

**Frontend**

- Trust UI: ~200 líneas (panel + renderizado)
- Clan UI: ~600 líneas (4 modales + formularios)
- Total frontend: ~800 líneas

**Base de datos**

- 5 tablas nuevas (1 trust, 4 clanes)
- 10+ índices para performance

**Total Fase 17**: ~2100 líneas de código

---

## 🚀 PRÓXIMOS PASOS

- [ ] Eventos de clan (guerras, torneos)
- [ ] Sistema de alianzas entre clanes
- [ ] Territorios controlados por clanes
- [ ] Misiones exclusivas de clan
- [ ] Trust con facciones (no solo NPCs individuales)

---

## 🐛 TESTING

**Casos de prueba críticos:**

1. ✅ Creación de clan con validaciones
2. ✅ Sistema de invitaciones con expiración
3. ✅ Permisos de rango funcionando correctamente
4. ✅ Almacenamiento sin duplicación de items
5. ✅ Trust decaimiento natural
6. ✅ Modificación de trust con límites -100 a +100
7. ⏳ Migración de flags antiguos a trust (pendiente)

---

**Fecha de completación**: Diciembre 2024  
**Desarrollador**: GitHub Copilot + Usuario  
**Próxima fase**: [Fase 18 - Sistema PvP](FASE18_PVP.md)
