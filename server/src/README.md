# 🏗️ Nueva Arquitectura V2

## 📁 Estructura

```
server/src/
├── engine/           # Motor del juego
│   ├── EventBus.js       # Sistema de eventos desacoplado
│   ├── GameEngine.js     # Coordinador central
│   └── SimulationLoop.js # Loop de simulaci

ón
├── world/            # Estado puro
│   └── WorldState.js     # Solo datos, sin lógica
├── systems/          # Sistemas independientes
│   ├── TimeSystem.js     # Maneja tiempo y día/noche
│   ├── ZombieSystem.js   # Spawning y comportamiento zombies
│   └── NpcSystem.js      # Rutinas y necesidades NPCs
└── integrationBridge.js  # Puente con código legacy
```

## 🎯 Principios

1. **WorldState = Solo Datos**
   - No contiene funciones que modifiquen estado
   - Es completamente serializable
   - Nunca importa sistemas

2. **Sistemas = Solo Lógica**
   - Reciben `world` como parámetro
   - Modifican el estado a través de APIs claras
   - Se comunican vía EventBus, no directamente

3. **EventBus = Desacoplamiento**
   - Los sistemas emiten eventos
   - Otros sistemas escuchan
   - Nadie se conoce entre sí

4. **GameEngine = Coordinador**
   - Ejecuta sistemas en orden
   - No contiene lógica de dominio
   - Maneja errores de sistemas individuales

## 🔄 Patrón Strangler Fig

Usamos el **integration Bridge** para migrar sin romper nada:

```
Código Legacy (survival_mvp.js)
           ↕️ sync
    integrationBridge.js
           ↕️
   Nueva Arquitectura (src/)
```

### Beneficios

- ✅ Migración sin downtime
- ✅ Los dos sistemas conviven
- ✅ Puedes probar la nueva arquitectura sin riesgo
- ✅ Rollback instantáneo si algo falla

## 🚀 Cómo Usar

### 1. Inicializar (una sola vez al arrancar servidor)

```javascript
import { initializeNewEngine, getLegacyAPI } from "./src/integrationBridge.js";

const { engine, world } = initializeNewEngine();
const newAPI = getLegacyAPI(engine, world);
```

### 2. Reemplazar setInterval viejo

**ANTES:**

```javascript
setInterval(() => {
  WORLD.simulationTime++;
  // 300 líneas de lógica hardcodeada...
}, 10000);
```

**AHORA:**

```javascript
import { tickNewArchitecture } from "./src/integrationBridge.js";

setInterval(() => {
  tickNewArchitecture(WORLD); // ← Ejecuta nueva arquitectura
  // código legacy restante...
}, 10000);
```

### 3. Usar APIs limpias desde handlers

**ANTES (tocando WORLD directamente):**

```javascript
WORLD.locations[loc].zombies -= killed;
WORLD.locations[loc].nivelRuido += 60;
```

**AHORA (usando API):**

```javascript
newAPI.killZombie(loc, killed);
newAPI.addNoise(loc, 60);
```

## 📊 Estado Actual

### ✅ Implementado

- EventBus completo
- GameEngine funcional
- SimulationLoop
- TimeSystem (tiempo, día/noche)
- ZombieSystem (respawn, ruido, atracción)
- NpcSystem (hambre, rutinas, salud)
- Integration Bridge (sincronización bidireccional)

### 🔜 Próximos Sistemas

- MissionSystem
- HordeSystem
- EventSystem
- NarrativeSystem
- CraftingSystem
- ReputationSystem

## 🎮 Eventos Disponibles

Los sistemas emiten estos eventos que puedes escuchar:

```javascript
import { EventBus } from "./src/integrationBridge.js";

// Escuchar eventos de tiempo
EventBus.on("time:new_day", (data) => {
  console.log(`Nuevo día ${data.day}`);
});

// Escuchar zombies
EventBus.on("zombie:killed", (data) => {
  broadcast({ type: "zombie:update", ...data });
});

// Escuchar NPCs
EventBus.on("npc:ate", (data) => {
  console.log(`${data.name} comió`);
});
```

### Lista de Eventos

**Time:**

- `time:tick` - Cada tick
- `time:new_day` - Nuevo día
- `time:dawn` - Amanecer (6am)
- `time:dusk` - Anochecer (8pm)

**Zombies:**

- `zombie:killed` - Zombies eliminados
- `zombie:respawn` - Respawn después de cooldown
- `zombie:night_spawn` - Spawn nocturno
- `zombie:noise_attraction` - Atraídos por ruido

**NPCs:**

- `npc:sleeping` - NPC durmiendo
- `npc:working` - NPC trabajando
- `npc:active` - NPC activo
- `npc:ate` - NPC se alimentó
- `npc:damaged` - NPC recibió daño
- `npc:healed` - NPC curado
- `npc:critically_injured` - NPC en estado crítico

**Engine:**

- `engine:tick_start` - Inicio de tick
- `engine:tick_end` - Fin de tick
- `engine:started` - Motor iniciado
- `engine:stopped` - Motor detenido
- `system:error` - Error en un sistema

## 💡 Buenas Prácticas

### DO ✅

```javascript
// Usar API
newAPI.killZombie("hospital", 5);

// Escuchar eventos
EventBus.on("zombie:killed", handleZombieKilled);

// Acceder a datos read-only
const time = newAPI.getTime();
```

### DON'T ❌

```javascript
// NO tocar world directamente desde fuera
world.locations.hospital.zombies = 0; // ❌

// NO ejecutar lógica en handlers de eventos
EventBus.on("zombie:killed", (data) => {
  // ❌ No hacer esto en el handler
  world.locations[data.location].zombies = 0;
});
```

## 🧪 Testing

Puedes testear sistemas en aislamiento:

```javascript
import { createWorldState } from "./src/world/WorldState.js";
import TimeSystem from "./src/systems/TimeSystem.js";

const world = createWorldState();
const timeSystem = new TimeSystem();

// Ejecutar 10 ticks
for (let i = 0; i < 10; i++) {
  timeSystem.update(world);
}

console.log(`Hora: ${world.time.hour}`);
```

## 📈 Métricas

```javascript
const metrics = newAPI.getMetrics();
console.log(metrics);
// {
//   tickCount: 42,
//   systems: ['TimeSystem', 'ZombieSystem', 'NpcSystem'],
//   isRunning: true
// }
```

## 🔥 Beneficios Inmediatos

| Antes                             | Ahora                       |
| --------------------------------- | --------------------------- |
| 5400+ líneas monolíticas          | Sistemas de ~100 líneas     |
| setInterval con todo hardcoded    | Loop coordinado limpio      |
| WORLD hace todo                   | Estado + Sistemas separados |
| No testeable                      | Cada sistema se testea solo |
| Agregar feature = reescribir todo | 1 sistema = 1 archivo       |
| Debug = adivinar                  | Eventos + logs claros       |

---

**Este código puede crecer 5 años sin morir** 🚀
