# Z-Survival Frontend React

Frontend modular para Z-Survival construido con **React 18 + TypeScript + Vite + Zustand**.

## 🚀 Quick Start

### 1. Instalación

```bash
cd frontend-react
npm install
```

### 2. Configuración

Copia el archivo de variables de entorno:

```bash
cp .env.example .env
```

Edita `.env` con la URL de tu backend:

```env
VITE_WS_URL=ws://localhost:3000
VITE_API_URL=http://localhost:3000
```

### 3. Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 4. Build para producción

```bash
npm run build
npm run preview
```

---

## 📁 Estructura del Proyecto

```
frontend-react/
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── ui/               # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   └── Card.tsx
│   │   └── layout/           # Componentes de layout
│   │       ├── Shell.tsx     # Wrapper principal
│   │       └── TopBar.tsx    # Barra superior
│   │
│   ├── pages/                # Páginas/vistas principales
│   │   ├── Dashboard/        # Dashboard principal
│   │   ├── NodeView/         # Vista de nodo con canvas
│   │   └── Combat/           # Pantalla de combate
│   │
│   ├── services/             # Servicios y lógica de negocio
│   │   ├── websocket.ts      # WebSocket singleton
│   │   └── handlers/         # Handlers por dominio
│   │       ├── index.ts      # Registry de handlers
│   │       ├── playerHandlers.ts
│   │       ├── worldHandlers.ts
│   │       ├── combatHandlers.ts
│   │       └── radioHandlers.ts
│   │
│   ├── store/                # State management (Zustand)
│   │   ├── playerStore.ts    # Estado del jugador
│   │   ├── worldStore.ts     # Estado del mundo
│   │   ├── uiStore.ts        # Estado de UI
│   │   └── combatStore.ts    # Estado de combate
│   │
│   ├── types/                # TypeScript types
│   │   ├── player.ts
│   │   ├── world.ts
│   │   └── messages.ts
│   │
│   ├── styles/               # Estilos globales
│   │   ├── tokens.css        # Variables de diseño
│   │   └── global.css        # Estilos base
│   │
│   ├── App.tsx               # Componente raíz
│   └── main.tsx              # Entry point
│
├── index.html                # HTML shell
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🧱 Arquitectura

### Principios de Diseño

1. **Un modo activo a la vez** - Solo una vista principal visible
2. **Estado centralizado** - Zustand stores para todo el estado
3. **Componentes pequeños** - Máximo 300 líneas por componente
4. **Handlers por dominio** - WebSocket handlers organizados por feature
5. **TypeScript estricto** - Tipos para toda la comunicación

### Estado Global (Zustand Stores)

#### `playerStore.ts`

- `player`: Datos del jugador (HP, stamina, inventario, caps)
- `setPlayer()`: Cargar jugador completo
- `updatePlayer()`: Actualizar parcialmente
- `updateStats()`: Actualizar HP/hunger/stamina
- `addItem()` / `removeItem()`: Gestión de inventario

#### `worldStore.ts`

- `nodes`: Mapa de nodos del mundo
- `entities`: Entidades activas (jugadores, NPCs, zombies)
- `events`: Eventos globales activos
- `currentNode`: Nodo actual del jugador
- `setWorld()`, `updateNode()`, `setEntities()`

#### `uiStore.ts`

- `mode`: Modo activo ('dashboard' | 'node' | 'combat' | 'refuge' | 'social' | 'map')
- `activeModal`: Modal abierto actualmente
- `notifications`: Array de notificaciones
- `isLoading`: Estado de carga global
- `setMode()`, `openModal()`, `addNotification()`

#### `combatStore.ts`

- `combatId`: ID del combate activo
- `enemy`: Datos del enemigo
- `isPlayerTurn`: Indicador de turnos
- `log`: Log de combate (últimas 20 entradas)
- `startCombat()`, `updateCombat()`, `endCombat()`

### WebSocket Service

**Singleton pattern** para gestionar conexión WebSocket:

```typescript
import { ws } from "./services/websocket";

// Conectar (automático en Shell)
ws.connect();

// Enviar mensaje
ws.send("move", { location: "supermercado" });

// Estado de conexión
ws.isConnected();
```

**Handlers automáticos** - Los mensajes del servidor se rutean automáticamente:

```
Server envía: { type: 'player:data', payload: {...} }
→ Se ejecuta: playerHandlers.onPlayerData(payload)
→ Actualiza: playerStore
```

---

## 🎨 Sistema de Diseño

### Tokens CSS

Variables definidas en `styles/tokens.css`:

```css
--bg: #0f1113 /* Background principal */ --panel: #181a1c /* Paneles y cards */
  --neon: #14ff83 /* Color primario (verde neón) */ --danger: #ff375f
  /* Color de peligro (rojo) */ --warn: #ffb454
  /* Color de advertencia (naranja) */ --muted: #9aa0a6 /* Texto secundario */;
```

### Componentes Base

#### Button

```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Click me
</Button>
```

Variantes: `primary`, `secondary`, `danger`, `ghost`  
Tamaños: `sm`, `md`, `lg`

#### Card

```tsx
<Card title="Mi Card" footer={<Button>Acción</Button>}>
  Contenido del card
</Card>
```

Variantes: `default`, `glass`, `danger`, `success`

---

## 📡 Comunicación con Backend

### WebSocket Messages

#### Client → Server

```typescript
// Movimiento
ws.send("move", { location: "casa_abandonada" });
ws.send("scavenge", {});

// Combate
ws.send("combat:attack", { combatId: "123" });
ws.send("combat:flee", { combatId: "123" });
ws.send("combat:use_item", { combatId: "123", itemId: "potion" });

// Crafteo
ws.send("craft", { recipeId: "bandage" });
ws.send("batch_craft", { recipeId: "bullet", quantity: 10 });

// Economía
ws.send("economy:buy", { itemId: "water", quantity: 1 });
ws.send("economy:sell", { itemId: "scrap", quantity: 5 });

// Marketplace
ws.send("market:create_listing", { itemId: "medkit", price: 100 });
ws.send("market:purchase", { listingId: "123" });

// Construcción
ws.send("start_construction", { structureId: "wall" });
ws.send("contribute_construction", { projectId: "123", amount: 50 });

// Clanes
ws.send("clan:create", { name: "Los Supervivientes" });
ws.send("clan:join", { clanId: "123" });
ws.send("clan:deposit_storage", { itemId: "food", quantity: 10 });

// Raids
ws.send("raid:join", { raidId: "123" });
ws.send("raid:place_defense", { type: "trap", slot: 1 });

// Boss Raids
ws.send("bossraid:spawn_boss", { bossId: "horde_king" });
ws.send("bossraid:join", { raidId: "123" });
ws.send("bossraid:attack", { raidId: "123" });

// PvP
ws.send("pvp:duel_request", { targetId: "player123" });
ws.send("pvp:accept_duel", { duelId: "123" });

// Social/Fogata
ws.send("fogata:createPost", { text: "Hola mundo!" });
ws.send("fogata:like", { postId: "123" });
ws.send("game:create", { type: "dice", bet: 50 });

// Radio
ws.send("radio:join", { freq: 100.1 });
ws.send("radio:message", { freq: 100.1, message: "Hola" });

// Quests
ws.send("accept_quest", { questId: "123" });
ws.send("complete_quest", { questId: "123" });

// Trust
ws.send("trust:give_gift", { npcId: "vargo", itemId: "medicine" });

// Narrative
ws.send("startNarrativeMission", { missionId: "intro" });
ws.send("narrativeChoice", { missionId: "intro", choice: "A" });
```

#### Server → Client (handlers automáticos)

```typescript
// Player data
'player:data' → playerHandlers.onPlayerData()
'player:update' → playerHandlers.onPlayerUpdate()
'player:levelup' → playerHandlers.onPlayerLevelUp()

// World
'world:state' → worldHandlers.onWorldState()
'entity.update' → worldHandlers.onEntityUpdate()
'moved' → worldHandlers.onMoved()

// Combat
'combat:started' → combatHandlers.onCombatStarted()
'combat:turn_result' → combatHandlers.onCombatTurnResult()
'combat:victory' → combatHandlers.onCombatVictory()
'combat:defeat' → combatHandlers.onCombatDefeat()

// Crafting
'crafting:recipes' → craftingHandlers.onCraftingRecipes()
'crafting:success' → craftingHandlers.onCraftingSuccess()
'crafting:failed' → craftingHandlers.onCraftingFailed()

// Economy
'economy:data' → economyHandlers.onEconomyData()
'economy:caps_updated' → economyHandlers.onCapsUpdated()

// Marketplace
'market:listings' → marketHandlers.onMarketListings()
'market:listing_created' → marketHandlers.onListingCreated()

// Construction
'construction:started' → constructionHandlers.onConstructionStarted()
'construction:completed' → constructionHandlers.onConstructionCompleted()

// Clans
'clan:my_info' → clanHandlers.onClanMyInfo()
'clan:created' → clanHandlers.onClanCreated()
'clan:storage_updated' → clanHandlers.onClanStorageUpdated()

// Raids
'raid:started' → raidHandlers.onRaidStarted()
'raid:wave' → raidHandlers.onRaidWave()
'raid:completed' → raidHandlers.onRaidCompleted()

// Boss Raids
'bossraid:boss_spawned' → bossRaidHandlers.onBossSpawned()
'bossraid:attack_result' → bossRaidHandlers.onAttackResult()
'bossraid:phase_change' → bossRaidHandlers.onPhaseChange()
'bossraid:victory' → bossRaidHandlers.onVictory()

// PvP
'pvp:duel_invitation' → pvpHandlers.onDuelInvitation()
'pvp:duel_started' → pvpHandlers.onDuelStarted()
'pvp:duel_ended' → pvpHandlers.onDuelEnded()

// Social/Fogata
'fogata:posts' → fogataHandlers.onFogataPosts()
'game:finished' → fogataHandlers.onGameFinished()

// Narrative
'narrative:started' → narrativeHandlers.onNarrativeStarted()
'narrative:completed' → narrativeHandlers.onNarrativeCompleted()

// Quests
'mission:new' → questHandlers.onMissionNew()
'mission:completed' → questHandlers.onMissionCompleted()

// Trust
'trust:updated' → trustHandlers.onTrustUpdated()
'trust:gift_given' → trustHandlers.onTrustGiftGiven()

// Radio
'radio:receive' → radioHandlers.onRadioReceive()
```

---

## 🛠️ Agregar Nuevas Features

### 1. Agregar nuevo handler WebSocket

**Paso 1**: Crear archivo handler en `services/handlers/`

```typescript
// services/handlers/clanHandlers.ts
import { usePlayerStore } from "../../store/playerStore";

export function onClanInfo(payload: any) {
  // Tu lógica aquí
  console.log("Clan info:", payload);
}
```

**Paso 2**: Registrar en `services/handlers/index.ts`

```typescript
import * as clanHandlers from "./clanHandlers";

export function getHandlers() {
  return {
    // ... handlers existentes
    "clan:my_info": clanHandlers.onClanInfo,
  };
}
```

### 2. Agregar nueva página

**Paso 1**: Crear carpeta en `pages/`

```typescript
// pages/Refuge/Refuge.tsx
export default function Refuge() {
  return <div>Mi nuevo modo Refugio</div>
}
```

**Paso 2**: Agregar ruta en `App.tsx`

```typescript
<Route path="/refuge" element={<Refuge />} />
```

**Paso 3**: Agregar modo en `uiStore.ts`

```typescript
export type GameMode = 'dashboard' | 'node' | 'combat' | 'refuge' | ...
```

### 3. Agregar nuevo componente UI

```typescript
// components/ui/MyComponent.tsx
import './MyComponent.css'

interface MyComponentProps {
  title: string
}

export default function MyComponent({ title }: MyComponentProps) {
  return <div className="my-component">{title}</div>
}
```

---

## 📋 Migration Checklist

### Funcionalidades por Migrar desde `survival.html`

#### ✅ Completadas

- [x] Player data (HP, hunger, stamina, inventario)
- [x] WebSocket connection
- [x] Dashboard básico
- [x] NodeView con canvas
- [x] Combat básico
- [x] TopBar con stats

#### 🔄 En Progreso

- [ ] Sistema de crafteo completo
- [ ] Marketplace
- [ ] Sistema de clanes
- [ ] Boss raids
- [ ] PvP
- [ ] Trust con NPCs

#### 📝 Pendientes

- [ ] Radio/Walkie panel persistente
- [ ] Inventario drag & drop
- [ ] Mapa global interactivo
- [ ] Sistema de construcción
- [ ] Fogata/Social completo
- [ ] Mini-juegos
- [ ] Misiones narrativas
- [ ] Onboarding tutorial
- [ ] Mobile responsive optimizado

---

## 🧪 Testing

```bash
# Lint
npm run lint

# Type check
npm run typecheck
```

### Agregar Tests (futuro)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

---

## 🚢 Deployment

### Build optimizado

```bash
npm run build
```

Output en `dist/` - Servir con cualquier static host (Netlify, Vercel, GitHub Pages).

### Variables de entorno en producción

Configurar en el hosting:

- `VITE_WS_URL` → URL WebSocket producción
- `VITE_API_URL` → URL API REST producción

---

## 📚 Recursos y Referencia

- [React Docs](https://react.dev)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Vite Docs](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ⚠️ Notas Importantes

1. **No modificar `survival.html`** - Mantenlo como referencia pero no lo edites más
2. **Backend sin cambios** - Este frontend consume los mismos endpoints existentes
3. **Migración incremental** - Implementa features de a una, no todo junto
4. **Testing obligatorio** - Testea cada feature antes de marcar como completa

---

## 🤝 Contribución

### Convenciones de Código

- **Naming**: camelCase para variables, PascalCase para componentes
- **Archivos**: PascalCase para componentes, camelCase para utilities
- **Imports**: Ordena: React → Externos → Internos → Styles
- **Max líneas**: 300 líneas por archivo (dividir si es más grande)

### Commit Messages

```
feat: Agregar sistema de crafteo
fix: Corregir bug en combat log
refactor: Reorganizar worldStore
docs: Actualizar README con nuevos handlers
```

---

**🎮 ¡Listo para jugar!**

Ejecuta `npm install && npm run dev` y empieza a migrar features.
