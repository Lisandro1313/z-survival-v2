# 🛡️ FASE 16: SISTEMA DE RAIDS PvE Y DEFENSA COOPERATIVA

## 📋 Resumen

Sistema completo de defensa cooperativa del refugio contra oleadas de zombies programadas. Los jugadores deben trabajar juntos para sobrevivir raids de dificultad escalable, usando construcciones defensivas, armas, trampas y estrategia en equipo.

---

## 🎯 Objetivos de la Fase

1. **Crear tensión PvE**: Ataques programados que requieren preparación
2. **Fomentar cooperación**: Recompensas por trabajar en equipo
3. **Integrar sistemas previos**: Usar construcción, combate, economía
4. **Gameplay emergente**: Estrategias defensivas variadas
5. **Recompensas proporcionales**: Mejor participación = mejores premios

---

## 🏗️ Diseño del Sistema

### **1. RAIDS (Ataques Programados)**

#### Tipos de Raids

**🌒 Raid Nocturno** (Común)

- Trigger: Cada 3 horas de juego
- Duración: 5-10 minutos
- Oleadas: 3-5
- Zombies: 50-100 (Normales, Corredores)
- Dificultad: ⭐
- Recompensas: Materiales básicos, ammo

**⚡ Raid Relámpago** (Poco común)

- Trigger: Random 20% al completar raid nocturno
- Duración: 3 minutos
- Oleadas: 2
- Zombies: 30-50 (Corredores, Gritones)
- Dificultad: ⭐⭐
- Recompensas: Armas comunes, componentes

**🔥 Raid Infernal** (Raro)

- Trigger: Cada 12 horas reales
- Duración: 15 minutos
- Oleadas: 7-10
- Zombies: 200+ (Todos los tipos élite)
- Dificultad: ⭐⭐⭐⭐
- Recompensas: Armas raras, armaduras, caps

**💀 Raid de Horda** (Épico)

- Trigger: Evento manual activado por admin
- Duración: 30 minutos
- Oleadas: 15+
- Zombies: 500+ (Incluye mini-bosses)
- Dificultad: ⭐⭐⭐⭐⭐
- Recompensas: Legendarios, modificadores épicos, 5000 caps

#### Estructura de un Raid

```javascript
{
  id: 'raid_abc123',
  type: 'nocturno|relampago|infernal|horda',
  status: 'announced|preparing|active|completed|failed',
  difficulty: 1-5,

  // Timing
  announcedAt: timestamp,
  startsAt: timestamp,  // 5 min después del anuncio
  endsAt: timestamp,

  // Oleadas
  currentWave: 1,
  totalWaves: 5,
  waves: [
    {
      wave: 1,
      zombies: 15,
      types: { normal: 10, corredor: 5 },
      spawnRate: 3, // zombies por segundo
      duration: 60 // segundos
    }
  ],

  // Estado del refugio
  refugeHealth: 1000,
  maxRefugeHealth: 1000,

  // Participantes
  defenders: [
    {
      playerId: 'player_1',
      playerName: 'Lisandro',
      damageDealt: 1250,
      zombiesKilled: 12,
      repairsDone: 50,
      survived: true
    }
  ],

  // Resultados
  totalZombiesKilled: 0,
  totalZombiesSpawned: 75,
  totalDamageToRefuge: 0,
  successful: null
}
```

### **2. FASES DE UN RAID**

#### **FASE 1: Anuncio (Announced)**

- **Duración:** 5 minutos
- **Objetivo:** Dar tiempo para preparación
- **Acciones disponibles:**
  - Comprar munición y consumibles
  - Reparar estructuras dañadas
  - Colocar trampas
  - Equipar mejor arma/armadura
  - Coordinar estrategia en chat
- **Notificación:** Broadcast a todos los jugadores

#### **FASE 2: Preparación (Preparing)**

- **Duración:** 2 minutos (countdown)
- **Objetivo:** Últimos ajustes
- **Acciones disponibles:**
  - Posicionarse estratégicamente
  - Activar buffs temporales
  - Revisar inventario
- **UI:** Countdown prominente

#### **FASE 3: Defensa Activa (Active)**

- **Duración:** Variable (5-30 min según tipo)
- **Objetivo:** Sobrevivir todas las oleadas
- **Mecánicas:**
  - Oleadas secuenciales con descansos de 30 seg
  - Zombies atacan refugio si no son detenidos
  - Refugio tiene HP que baja con cada golpe
  - Jugadores muertos pueden revivir entre oleadas
  - Trampas se activan automáticamente
  - Torres defensivas disparan automáticamente
- **UI:** Barra de HP del refugio, contador de oleada, lista de zombies

#### **FASE 4: Resolución (Completed/Failed)**

- **Duración:** Instantánea
- **Objetivo:** Evaluar resultados y dar recompensas
- **Condiciones de victoria:**
  - ✅ Refugio HP > 0 al terminar todas las oleadas
  - ❌ Refugio HP = 0 (derrota)
- **Cálculo de recompensas:**
  - Participación individual (damage, kills, repairs)
  - Bono por victoria
  - Multiplicador por dificultad
  - Caps + items raros

---

## 🔧 Arquitectura Técnica

### **Backend: RaidSystem.js**

```javascript
class RaidSystem {
  constructor() {
    this.activeRaid = null;
    this.raidHistory = [];
    this.defenses = new Map(); // Trampas y torres colocadas
  }

  // RAID LIFECYCLE
  scheduleRaid(type, delay)       // Programar raid futuro
  announceRaid(raid)               // Notificar a todos
  startRaid(raidId)                // Iniciar defensa
  processWave(raidId, waveNum)     // Procesar oleada
  endRaid(raidId, successful)      // Terminar raid

  // DEFENSA
  placeDefense(playerId, type, position)     // Colocar trampa/torre
  activateDefense(defenseId, zombies)        // Activar defensa
  repairRefuge(playerId, amount)             // Reparar refugio
  calculateRefugeDamage(zombies)             // Calcular daño

  // COMBATE DURANTE RAID
  attackZombie(playerId, zombieId)   // Atacar zombie en raid
  processZombieDeath(zombieId, raid) // Procesar muerte
  revivePlayer(playerId)             // Revivir entre oleadas

  // RECOMPENSAS
  calculateRewards(raid, playerId)   // Calcular recompensas individuales
  distributeRewards(raid)            // Distribuir a todos
  generateLoot(raidType, performance) // Generar loot según rendimiento

  // STATS
  getRaidHistory(limit)              // Historial de raids
  getTopDefenders(limit)             // Mejores defensores
  getRefugeStatus()                  // Estado actual del refugio
}
```

### **Defensas Colocables**

#### Trampas (Consumibles)

- **Trampa de púas** - Daño a primer zombie (50 DMG)
- **Mina terrestre** - Explosión AoE cuando zombie pisa (150 DMG, radio 3m)
- **Alambre de púas** - Ralentiza zombies 50% (20 seg)
- **Molotov automático** - Quema área (30 DMG/seg, 10 seg)
- **Red eléctrica** - Aturde zombies (5 seg, 70 DMG)

#### Torres Defensivas (Permanentes)

- **Torre de Ballesta** - 20 DMG/2 seg, rango 15m (Requiere: Watch Tower nivel 2)
- **Torre de Fuego** - 15 DMG/seg en área (Requiere: Workshop nivel 3)
- **Torre MG** - 10 DMG/0.5 seg (Requiere: Training Ground nivel 2)
- **Torre Tesla** - 100 DMG cada 10 seg en cadena (Requiere: Radio Tower nivel 3)

### **Integración con Sistemas Existentes**

#### Fase 12: Construcción

- Estructuras defensivas dan bonos permanentes en raids
- Defensive Wall: +20% HP refugio por nivel
- Watch Tower: +30% daño torres defensivas
- Training Ground: +15% daño jugadores

#### Fase 13: Combate Avanzado

- Mismo sistema de combate contra zombies
- Habilidades especiales con cooldown compartido
- Efectos de estado aplicables
- Armas y armaduras equipadas cuentan

#### Fase 15: Economía

- Recompensas en caps según participación
- Comprar trampas en NPC antes del raid
- Vender loot raro obtenido en raids
- Impuesto 0% durante raids (emergencia)

---

## 📊 Sistema de Recompensas

### Cálculo de Participación

```javascript
function calculateParticipation(defender, raid) {
  const damageScore = defender.damageDealt * 1.0;
  const killScore = defender.zombiesKilled * 100;
  const repairScore = defender.repairsDone * 2.0;
  const survivalBonus = defender.survived ? 500 : 0;

  const totalScore = damageScore + killScore + repairScore + survivalBonus;
  const participationPercent = (totalScore / raid.totalScore) * 100;

  return {
    score: totalScore,
    percent: participationPercent,
    rank: calculateRank(participationPercent),
  };
}
```

### Recompensas por Rango

**🥇 MVP (Top 1)** - 30% participación+

- Caps: 500-2000
- Item legendario garantizado
- 3x materiales raros
- Badge especial

**🥈 Héroe (Top 3)** - 20-30% participación

- Caps: 300-1000
- Item épico garantizado
- 2x materiales raros

**🥉 Defensor (Top 10)** - 10-20% participación

- Caps: 150-500
- Item raro garantizado
- 1x material raro

**🎖️ Participante** - 5-10% participación

- Caps: 50-200
- Item poco común
- Materiales básicos

**👎 Espectador** - <5% participación

- Caps: 10
- Sin items

---

## 🎨 Frontend UI

### Panel de Raid

```tsx
<div className="raid-panel">
  {/* Header */}
  <div className="raid-header">
    <h2>🛡️ {raid.type.toUpperCase()} RAID</h2>
    <span className="difficulty">{"⭐".repeat(raid.difficulty)}</span>
  </div>

  {/* Status */}
  <div className="raid-status">
    <div className="status-badge">{raid.status}</div>
    {raid.status === "preparing" && (
      <div className="countdown">
        Comienza en: {formatTime(raid.startsAt - Date.now())}
      </div>
    )}
  </div>

  {/* Refugio Health */}
  <div className="refuge-health">
    <label>Integridad del Refugio</label>
    <div className="health-bar">
      <div
        className="health-fill"
        style={{
          width: `${(raid.refugeHealth / raid.maxRefugeHealth) * 100}%`,
        }}
      />
      <span>
        {raid.refugeHealth} / {raid.maxRefugeHealth}
      </span>
    </div>
  </div>

  {/* Wave Progress */}
  {raid.status === "active" && (
    <div className="wave-progress">
      <h3>
        Oleada {raid.currentWave} / {raid.totalWaves}
      </h3>
      <div className="zombie-counter">
        🧟 {raid.zombiesAlive} zombies restantes
      </div>
    </div>
  )}

  {/* Defenders List */}
  <div className="defenders-list">
    <h3>Defensores ({raid.defenders.length})</h3>
    {raid.defenders.map((d) => (
      <div key={d.playerId} className="defender-card">
        <span className="name">{d.playerName}</span>
        <span className="stats">
          💀 {d.zombiesKilled} | 🗡️ {d.damageDealt} | 🔧 {d.repairsDone}
        </span>
      </div>
    ))}
  </div>

  {/* Actions */}
  {raid.status === "announced" && (
    <div className="raid-actions">
      <button onClick={prepareForRaid}>⚙️ Preparar Defensas</button>
      <button onClick={buySupplies}>🛒 Comprar Suministros</button>
      <button onClick={repairStructures}>🔧 Reparar Estructuras</button>
    </div>
  )}

  {raid.status === "active" && (
    <div className="raid-actions">
      <button onClick={placeDefense}>🎯 Colocar Trampa</button>
      <button onClick={repairRefuge}>🔨 Reparar Refugio</button>
    </div>
  )}

  {/* Results */}
  {raid.status === "completed" && (
    <div className="raid-results">
      <h2>{raid.successful ? "✅ VICTORIA" : "❌ DERROTA"}</h2>
      <div className="stats-summary">
        <div>Zombies eliminados: {raid.totalZombiesKilled}</div>
        <div>Daño recibido: {raid.totalDamageToRefuge}</div>
      </div>
      <h3>Tus Recompensas:</h3>
      <div className="loot-display">{/* Items obtenidos */}</div>
    </div>
  )}
</div>
```

---

## 📡 WebSocket Messages

### Client → Server

```javascript
// Gestión de raid
{ type: 'raid:get_active' }
{ type: 'raid:get_history', limit: 10 }
{ type: 'raid:get_status' }

// Defensa
{ type: 'raid:place_defense', defenseType: 'trampa_puas', position: { x, y } }
{ type: 'raid:repair_refuge', amount: 50 }
{ type: 'raid:attack_zombie', zombieId: 'zombie_123' }

// Stats
{ type: 'raid:get_top_defenders', limit: 10 }
{ type: 'raid:get_my_stats' }
```

### Server → Client

```javascript
// Eventos de raid
{ type: 'raid:announced', raid: {...} }
{ type: 'raid:started', raid: {...} }
{ type: 'raid:wave_start', raid: {...}, wave: 2 }
{ type: 'raid:wave_complete', raid: {...}, wave: 1 }
{ type: 'raid:completed', raid: {...}, successful: true }
{ type: 'raid:failed', raid: {...} }

// Updates en tiempo real
{ type: 'raid:refuge_damaged', newHealth: 850, damage: 50 }
{ type: 'raid:zombie_killed', zombieId, killerId, reward: {...} }
{ type: 'raid:defense_activated', defenseId, damage: 150, zombiesHit: 5 }
{ type: 'raid:player_joined', player: {...} }
{ type: 'raid:player_died', playerId }
{ type: 'raid:player_revived', playerId }

// Resultados
{ type: 'raid:rewards', playerId, rewards: { caps, items, rank } }
{ type: 'raid:leaderboard', defenders: [...] }
```

---

## 🗄️ Base de Datos

### Tablas Nuevas

```sql
-- Historial de raids
CREATE TABLE raids (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  difficulty INTEGER,
  started_at INTEGER,
  ended_at INTEGER,
  successful INTEGER DEFAULT 0,
  total_zombies_killed INTEGER DEFAULT 0,
  total_damage_taken INTEGER DEFAULT 0,
  defenders_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Participación en raids
CREATE TABLE raid_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raid_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT,
  damage_dealt INTEGER DEFAULT 0,
  zombies_killed INTEGER DEFAULT 0,
  repairs_done INTEGER DEFAULT 0,
  survived INTEGER DEFAULT 1,
  participation_score INTEGER DEFAULT 0,
  rank TEXT,
  caps_earned INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (raid_id) REFERENCES raids(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Defensas colocadas
CREATE TABLE raid_defenses (
  id TEXT PRIMARY KEY,
  raid_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  type TEXT NOT NULL,
  position_x REAL,
  position_y REAL,
  activated INTEGER DEFAULT 0,
  damage_dealt INTEGER DEFAULT 0,
  zombies_hit INTEGER DEFAULT 0,
  placed_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (raid_id) REFERENCES raids(id)
);

-- Estadísticas de jugadores en raids
CREATE TABLE player_raid_stats (
  player_id TEXT PRIMARY KEY,
  total_raids_participated INTEGER DEFAULT 0,
  total_raids_won INTEGER DEFAULT 0,
  total_zombies_killed INTEGER DEFAULT 0,
  total_damage_dealt INTEGER DEFAULT 0,
  total_repairs_done INTEGER DEFAULT 0,
  total_caps_earned INTEGER DEFAULT 0,
  mvp_count INTEGER DEFAULT 0,
  best_rank TEXT,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX idx_raids_type ON raids(type);
CREATE INDEX idx_raid_participants_raid ON raid_participants(raid_id);
CREATE INDEX idx_raid_participants_player ON raid_participants(player_id);
CREATE INDEX idx_raid_defenses_raid ON raid_defenses(raid_id);
```

---

## ⚙️ Configuración del Sistema

```javascript
const RAID_CONFIG = {
  // Scheduling
  NOCTURNO_INTERVAL: 3 * 60 * 60 * 1000, // 3 horas
  INFERNAL_INTERVAL: 12 * 60 * 60 * 1000, // 12 horas
  PREPARATION_TIME: 5 * 60 * 1000, // 5 minutos

  // Refugio
  BASE_REFUGE_HEALTH: 1000,
  HEALTH_PER_WALL_LEVEL: 200,
  REPAIR_COST_PER_HP: 2, // materiales

  // Oleadas
  WAVE_REST_TIME: 30 * 1000, // 30 segundos
  ZOMBIE_SPAWN_RATE: 3, // por segundo

  // Recompensas
  BASE_CAPS_REWARD: 100,
  DIFFICULTY_MULTIPLIER: [1, 1.5, 2, 3, 5],
  MVP_BONUS: 2.0,
  SURVIVAL_BONUS: 500,

  // Defensas
  MAX_TRAPS_PER_PLAYER: 5,
  MAX_TOWERS_TOTAL: 10,
  TRAP_COSTS: {
    trampa_puas: { materiales: 10, metal: 5 },
    mina_terrestre: { materiales: 20, químicos: 10 },
    alambre_puas: { metal: 15, cuerda: 5 },
    molotov_auto: { combustible: 10, tela: 5 },
    red_electrica: { componentes: 15, metal: 10 },
  },
};
```

---

## 🎮 Flujo de Juego

### Ejemplo: Raid Nocturno

**T-5min:**

```
🔔 [ALERTA] ¡Raid Nocturno programado en 5 minutos!
📍 Reúnete en el Refugio y prepara tus defensas.
```

**T-2min:**

```
⚠️ [PREPARACIÓN] El raid comienza en 2 minutos.
🛡️ Últimos ajustes recomendados.
```

**T-0:**

```
🚨 [INICIO] ¡El raid ha comenzado! Oleada 1/5
🧟 15 zombies se acercan al refugio...
```

**Durante oleadas:**

```
💥 Lisandro eliminó a Zombie Corredor (+100 caps)
🎯 Trampa de púas activada - 3 zombies dañados
🆘 Refugio dañado - HP: 850/1000
🔧 Juan reparó el refugio +50 HP
```

**Entre oleadas:**

```
✅ Oleada 1 completada - 30 segundos de descanso
🧟 Próxima oleada: 20 zombies (5 Gritones)
```

**Final:**

```
🎉 [VICTORIA] ¡Raid Nocturno completado!
📊 Zombies eliminados: 75/75
🏆 MVP: Lisandro (35% participación)

TUS RECOMPENSAS:
💰 +450 caps
⚔️ Rifle Raro
📦 15x Materiales
🎖️ Rango: Héroe
```

---

## ✅ Checklist de Implementación

### Backend

- [ ] Crear `server/systems/RaidSystem.js`
- [ ] Definir tipos de raids y configuración
- [ ] Implementar scheduling automático
- [ ] Sistema de oleadas con spawn de zombies
- [ ] Sistema de defensas (trampas y torres)
- [ ] Cálculo de daño al refugio
- [ ] Sistema de recompensas y participación
- [ ] Integración con EconomySystem
- [ ] Integración con AdvancedCombatSystem
- [ ] 10+ handlers WebSocket
- [ ] Migraciones de base de datos

### Frontend (Versión clásica)

- [ ] Panel de raid en sidebar
- [ ] Modal de preparación
- [ ] UI de defensa activa (barras, contadores)
- [ ] Lista de defensores en tiempo real
- [ ] Mapa de posicionamiento de defensas
- [ ] Modal de resultados con leaderboard
- [ ] Notificaciones de eventos de raid
- [ ] Integración con economía (comprar trampas)
- [ ] ~600 líneas CSS
- [ ] ~700 líneas JavaScript

### Frontend (React)

- [ ] Crear `RaidPanel.tsx`
- [ ] Crear `RaidPreparation.tsx`
- [ ] Crear `RaidActive.tsx`
- [ ] Crear `RaidResults.tsx`
- [ ] Crear `DefendersList.tsx`
- [ ] Actualizar gameStore con raid state
- [ ] Handlers WebSocket en hook

### Testing

- [ ] Test de scheduling de raids
- [ ] Test de oleadas y spawn
- [ ] Test de cálculo de recompensas
- [ ] Test de integración con economía
- [ ] Test de múltiples jugadores
- [ ] Test de edge cases (todos mueren, nadie participa)

### Documentación

- [ ] Actualizar PROGRESS.md
- [ ] Crear FASE16_RAIDS_PVE.md (este archivo)
- [ ] Actualizar README.md
- [ ] Documentar API WebSocket

---

## 🚀 Próximos Pasos Después de Fase 16

1. **Fase 17: Sistema de Clanes** - Organizaciones de jugadores
2. **Fase 18: Territorio y PvP** - Zonas controladas, conflictos
3. **Fase 19: Boss Raids** - Jefes épicos cooperativos
4. **Fase 20: Migración React Completa** - Abandonar versión clásica

---

**Autor:** GitHub Copilot  
**Fecha:** 18 de febrero de 2026  
**Versión:** 1.0 (Diseño Completo)
