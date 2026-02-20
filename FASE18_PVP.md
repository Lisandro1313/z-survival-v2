# FASE 18: SISTEMA PVP COMPLETO

## 📋 RESUMEN

Implementación de un sistema PvP completo con duelos consensuales, zonas PvP, karma y rankings.

**Estado**: ✅ COMPLETADO  
**Líneas de código**: ~900 líneas (backend + frontend)  
**Fecha**: Diciembre 2024

---

## ⚔️ CARACTERÍSTICAS PRINCIPALES

### 1. Sistema de Duelos Consensuales

**Flujo de Duelo:**

1. Jugador A desafía a Jugador B con apuesta opcional
2. Jugador B tiene 60 segundos para aceptar/rechazar
3. Si acepta, comienza duelo por turnos
4. Ganador recibe recompensas (XP, caps, karma)

**Mecánicas de Duelo:**

- Sistema por turnos con acciones (atacar, defender, habilidad especial)
- Daño basado en stats del jugador
- Posibilidad de críticos (15% chance, 2x daño)
- Duración máxima: 10 turnos
- Recompensas escaladas según apuesta

### 2. Sistema de Karma

**Rango de Karma: -100 (Asesino) a +100 (Héroe)**

| Karma      | Nivel     | Icono | Efectos                                                  |
| ---------- | --------- | ----- | -------------------------------------------------------- |
| 75-100     | HÉROE     | 😇    | Acceso a zonas seguras exclusivas, descuentos en mercado |
| 50-74      | HONORABLE | 😊    | Respeto de NPCs, bonos en misiones                       |
| 25-49      | JUSTO     | 🙂    | Sin penalizaciones                                       |
| -24 a 24   | NEUTRAL   | 😐    | Estado base                                              |
| -49 a -25  | RUFIÁN    | 😠    | NPCs hostiles, precios elevados                          |
| -74 a -50  | BANDIDO   | 😈    | Bounty en tu cabeza, cazadores te persiguen              |
| -100 a -75 | ASESINO   | 💀    | Marcado para muerte, sin acceso a tiendas                |

**Modificadores de Karma:**

- Ganar duelo consensual: +5 karma
- Perder duelo: -2 karma
- Matar en zona PvP consensual: 0 karma
- Asesinato fuera de duelo: -20 karma
- Matar a jugador con karma negativo: +10 karma (bounty hunter)

### 3. Zonas PvP

**Tipos de Zonas:**

1. **Zonas Seguras** (nivel karma requerido ≥ 0)
   - `refugio` - Refugio Central
   - `hospital` - Hospital Zeimet
   - Sin PvP permitido

2. **Zonas Neutrales** (nivel karma ≥ -50)
   - `bosque` - Bosque del Norte
   - `ciudad` - Ruinas de la Ciudad
   - PvP solo por duelo consensual

3. **Zonas PvP Libres** (sin restricción)
   - `fabrica_abandonada` - Fábrica Abandonada
   - `bunker_militar` - Bunker Militar
   - `zona_radion` - Zona de Radiación
   - PvP libre, karma bajo permite ataque sin duelo

### 4. Sistema de Ranking PvP

**Clasificación por:**

- Total de victorias en duelos
- Ratio victorias/derrotas
- Nivel de karma
- Damage total infligido

**Recompensas de Ranking:**

- Top 1: 🥇 Título "Campeón" + 1000 caps semanales
- Top 2-3: 🥈🥉 Título "Maestro" + 500 caps semanales
- Top 10: Badge especial + 100 caps semanales

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### Backend (`server/systems/PvPSystem.js` - 650 líneas)

```javascript
class PvPSystem {
  constructor(db) {
    this.db = db;
    this.activeDuels = new Map();
    this.PVP_ZONES = {
      safe: ["refugio", "hospital"],
      neutral: ["bosque", "ciudad", "supermercado"],
      pvp_free: ["fabrica_abandonada", "bunker_militar", "zona_radiacion"],
    };
    this.initializeDatabase();
  }

  canAttack(attackerId, targetId) {
    // Verificar si ataque es válido según karma y zona
  }

  requestDuel(challengerId, targetId, wager = 0) {
    // Crear solicitud de duelo con expiración
  }

  acceptDuel(duelId, accepterId) {
    // Aceptar duelo y comenzar combate
  }

  resolveDuelRound(duelId, playerId, action, playerData) {
    // Resolver turno de duelo
  }

  endDuel(duelId, winnerId) {
    // Finalizar duelo y distribuir recompensas
  }

  registerKill(killerId, victimId) {
    // Registrar muerte y actualizar karma
  }

  getKarma(playerId) {
    // Obtener karma y nivel actual
  }

  getPvPRanking(limit = 10) {
    // Obtener top jugadores PvP
  }
}
```

### Frontend (survival.html - ~250 líneas)

**Modales:**

1. **pvpModal**: Panel principal con duelos activos y solicitudes
2. **pvpRankingModal**: Tabla de clasificación
3. **karmaModal**: Visualización de karma con barra y estadísticas

**Funciones Clave:**

```javascript
function showPvPPanel() {
  /* Abrir panel PvP */
}
function showKarmaPanel() {
  /* Mostrar karma del jugador */
}
function renderKarma(karmaData) {
  /* Renderizar UI de karma */
}
function renderPvPRanking(ranking) {
  /* Tabla de ranking */
}
```

### Base de Datos

```sql
-- Karma de jugadores
CREATE TABLE IF NOT EXISTS pvp_karma (
    player_id TEXT PRIMARY KEY,
    karma INTEGER DEFAULT 0,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    duel_wins INTEGER DEFAULT 0,
    duel_losses INTEGER DEFAULT 0,
    last_updated INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Historial de PvP
CREATE TABLE IF NOT EXISTS pvp_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attacker_id TEXT NOT NULL,
    victim_id TEXT NOT NULL,
    was_duel BOOLEAN DEFAULT 0,
    location TEXT,
    damage_dealt INTEGER,
    timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Duelos activos
CREATE TABLE IF NOT EXISTS pvp_duels (
    id TEXT PRIMARY KEY,
    challenger_id TEXT NOT NULL,
    challenged_id TEXT NOT NULL,
    wager INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    current_round INTEGER DEFAULT 0,
    challenger_hp INTEGER,
    challenged_hp INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER,
    winner_id TEXT
);
```

### WebSocket Handlers (12 total)

- `pvp:get_karma` - Obtener karma del jugador
- `pvp:can_attack` - Verificar si puede atacar a alguien
- `pvp:request_duel` - Solicitar duelo
- `pvp:accept_duel` - Aceptar duelo
- `pvp:decline_duel` - Rechazar duelo
- `pvp:cancel_duel` - Cancelar duelo (solo retador)
- `pvp:duel_action` - Ejecutar acción en turno de duelo
- `pvp:attack` - Atacar directamente en zona PvP
- `pvp:get_history` - Ver historial de combates
- `pvp:get_ranking` - Obtener tabla de clasificación
- `pvp:get_active_duels` - Ver duelos activos del jugador
- `pvp:get_stats` - Estadísticas personales de PvP

---

## 🎮 GAMEPLAY Y ESTRATEGIA

### Estrategias de Karma

**Jugador Héroe (Karma Alto)**

- Beneficios en comercio y refugio
- Acceso a misiones exclusivas
- Puede cazar bandidos por recompensas

**Jugador Neutral**

- Flexibilidad para elegir bando
- Sin bonos ni penalizaciones
- Puede participar en cualquier contenido

**Jugador Bandido (Karma Bajo)**

- Puede atacar libremente en zonas PvP
- Precio en su cabeza (otros ganan karma matándolo)
- Restricción en zonas seguras

### Tácticas de Duelo

1. **Atacante Agresivo**
   - Spam de ataques para daño rápido
   - Riesgo: Vulnerable a contraataques

2. **Defensor Estratégico**
   - Alternar defensa y ataque
   - Conserva HP para última ronda

3. **Especialista en Habilidades**
   - Usar habilidades especiales en momento crítico
   - Requiere gestión de recursos

### Zonas de Farming PvP

**Fabrica Abandonada:**

- Loot valioso
- Alto riesgo de emboscadas
- Zona libre de karma

**Bunker Militar:**

- Equipamiento militar
- Control por clanes
- Guerras por territorio

---

## 🔄 INTEGRACIÓN CON OTRAS FASES

### Con Fase 15 (Economía)

- Apuestas en duelos
- Bounties por karma negativo
- Mercado de equipamiento PvP

### Con Fase 17 (Clanes)

- Guerras entre clanes
- Duelos de honor clan vs clan
- Karma compartido para acciones de clan

### Con Fase 16 (Raids)

- Raids PvEvP (otros jugadores pueden sabotear)
- Competencia por recompensas de raid
- Zonas de raid como PvP libre

---

## 📊 ESTADÍSTICAS DE IMPLEMENTACIÓN

**Backend:**

- PvPSystem.js: 650 líneas
- WebSocket handlers: 12 handlers
- Base de datos: 3 tablas

**Frontend:**

- PvP UI: ~250 líneas
- 3 modales principales
- Integración con notificaciones

**Total Fase 18:** ~900 líneas

---

## 🎯 BALANCE Y AJUSTES

### Valores Actuales (v1.0)

| Parámetro             | Valor         |
| --------------------- | ------------- |
| Duelo win karma       | +5            |
| Duelo loss karma      | -2            |
| Asesinato karma       | -20           |
| Bounty kill karma     | +10           |
| Duración duelo        | 60s por turno |
| Expiración invitación | 60s           |
| Crítico chance        | 15%           |
| Crítico multiplier    | 2x            |

### Ajustes Planeados

- [ ] Scaling de recompensas según nivel de jugadores
- [ ] Seasons de PvP con reset de rankings
- [ ] Torneos automatizados
- [ ] Áreas de arena dedicadas

---

## 🐛 TESTING

**Casos de prueba:**

1. ✅ Duelo consensual completo (challenger gana)
2. ✅ Duelo consensual (challenged gana)
3. ✅ Rechazo de duelo (karma sin cambios)
4. ✅ Ataque en zona segura (bloqueado)
5. ✅ Ataque en zona PvP libre (permitido)
6. ✅ Karma negativo previene entrada a zonas seguras
7. ⏳ Bounty hunting (pendiente integración completa)
8. ⏳ Guerras de clanes (requiere eventos)

---

## 🚀 PRÓXIMAS EXPANSIONES

### Corto Plazo

- Arenas PvP dedicadas con espectadores
- Sistema de ranking por temporadas
- Achievements de PvP

### Medio Plazo

- Torneos automatizados con brackets
- Betting system (apostar a duelos de otros)
- Títulos y cosméticos por ranking

### Largo Plazo

- Territorios controlados por clanes
- Sieges (asedios a bases de clan)
- Mundo PvP global (mapa de control)

---

## 💡 NOTAS DE DISEÑO

**Filosofía del Sistema:**

1. **Consensualidad**: PvP mayormente opt-in vía duelos
2. **Consecuencias**: Karma penaliza asesinos sin razón
3. **Recompensas**: Balance riesgo/recompensa en zonas PvP
4. **Skill > Gear**: Táctica más importante que equipo

**Lecciones de Otros MMOs:**

- EvE Online: Zonas con diferentes niveles de seguridad
- Dark Souls: Invasiones con limitaciones de nivel
- WoW: Battlegrounds estructurados vs PvP abierto

---

**Fecha de completación**: Diciembre 2024  
**Desarrollador**: GitHub Copilot + Usuario  
**Fase previa**: [Fase 17 - Trust y Clanes](FASE17_TRUST_CLANES.md)  
**Próxima fase**: TBD (posiblemente Eventos Mundiales o Construcción Avanzada)
