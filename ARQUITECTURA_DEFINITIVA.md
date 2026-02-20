# ARQUITECTURA DEFINITIVA - Manolitri

> **Estado:** ✅ Implementada  
> **Fecha:** Diciembre 2024  
> **Objetivo:** Arquitectura escalable de 5 capas con separación total de responsabilidades

---

## 📐 Principios Fundamentales

### 1. Separación de Responsabilidades

- **Cada capa** tiene una responsabilidad única y clara
- **No mezclar** lógica de dominio con presentación
- **No duplicar** estado entre capas

### 2. Backend = Única Fuente de Verdad

- Frontend **nunca** calcula estado crítico
- Frontend **nunca** confirma acciones localmente
- Frontend solo renderiza lo que backend autoriza

### 3. Escalabilidad Horizontal

- Preparado para **múltiples shards** (mundos paralelos)
- Estado **desacoplado** por sistema
- **Sin dependencias** entre features

---

## 🏗️ Las 5 Capas

```
┌─────────────────────────────────────────┐
│  CAPA 1: APP CORE (≤30 líneas)         │
│  App.tsx, GameShell, Router, Providers │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  CAPA 2: STATE (Zustand Stores)        │
│  15 stores separados por dominio        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  CAPA 3: SERVICES (WebSocket + Actions)│
│  WS Client, Handler Registry, Actions   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  CAPA 4: FEATURES (Dominios autónomos) │
│  world/, combat/, crafting/, economy/   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  CAPA 5: UI SHARED (Componentes)       │
│  ui/, layout/, canvas/                  │
└─────────────────────────────────────────┘
```

---

## 🔷 CAPA 1: APP CORE

**Responsabilidad:** Montar React, proveer contexto global, routing

**Archivos:**

```
src/
├── App.tsx          # Router + Suspense + GameShell
├── main.tsx         # Entry point
└── GameShell.tsx    # Layout wrapper principal
```

**Reglas:**

- ✅ **Solo** Router, Layout, Suspense
- ❌ **Nunca** lógica de juego
- ⚠️ **Máximo** 30 líneas por archivo

**Ejemplo App.tsx:**

```tsx
import { WSProvider } from "./services/wsProvider";
import { GameShell } from "./components/layout/GameShell";

export default function App() {
  return (
    <WSProvider autoConnect>
      <Suspense fallback={<Loading />}>
        <GameShell>
          <Routes>
            <Route path="/game" element={<Dashboard />} />
            <Route path="/game/node/:id" element={<NodeView />} />
            {/* ... más rutas */}
          </Routes>
        </GameShell>
      </Suspense>
    </WSProvider>
  );
}
```

---

## 🔷 CAPA 2: STATE (Zustand Stores)

**Responsabilidad:** Reemplazar `window.gameState`, gestionar estado global

**Stores (15 totales):**

### ✅ Implementados (8):

- `playerStore.ts` - Estado del jugador
- **`worldStore.ts`** - Mundo con 5 sistemas separados
- `combatStore.ts` - Combate activo
- `uiStore.ts` - Estado UI (modales, tabs, etc.)
- `questStore.ts` - Misiones activas/disponibles
- `craftingStore.ts` - Crafteo en progreso
- `economyStore.ts` - Tienda, marketplace
- **`eventStore.ts`** - Eventos globales/locales

### ⏳ Pendientes (7):

- `socialStore.ts` - Chat, NPCs, interacciones
- `raidStore.ts` - Raids cooperativos
- `clanStore.ts` - Clan, miembros, recursos
- `radioStore.ts` - Radio/walkie messages
- `trustStore.ts` - Trust levels con NPCs
- `narrativeStore.ts` - Narrative choices, progress
- `refugeStore.ts` - Refugios propios, defensas

**Reglas:**

- ✅ Un dominio → un store
- ❌ **Nunca** mezclar responsabilidades
- ❌ Store **no renderiza** nada
- ❌ Store **no usa** DOM
- ❌ Store **no usa** WebSocket directamente

**Pattern:**

```typescript
export const useXStore = create<XState>((set, get) => ({
  // State
  items: {},

  // Actions
  setItems: (items) => set({ items }),

  updateItem: (id, updates) =>
    set((state) => ({
      items: { ...state.items, [id]: { ...state.items[id], ...updates } },
    })),

  // Queries (NO modifican state)
  getItem: (id) => get().items[id],
}));
```

---

## 🔷 CAPA 3: SERVICES

**Responsabilidad:** Comunicación con backend, gestión WebSocket

### Estructura:

```
services/
├── websocket.ts        # WebSocket class con auto-reconexión
├── wsProvider.tsx      # React context provider
├── handlerRegistry.ts  # Registry de handlers
├── actions.ts          # Actions para enviar WS
└── handlers/
    ├── index.ts
    ├── worldHandlers.ts
    ├── combatHandlers.ts
    └── ... (17 handlers)
```

### Patrón Handlers:

```typescript
// handlers/worldHandlers.ts
import { useWorldStore } from "@/store/worldStore";

export const onWorldUpdate = (payload: any) => {
  useWorldStore.getState().updateNode(payload.nodeId, payload.data);
};
```

**Reglas Handlers:**

- ✅ **Solo** reciben mensaje → actualizan store
- ❌ **Nunca** renderizan
- ❌ **Nunca** modifican DOM

### Patrón Actions:

```typescript
// actions.ts
import { ws } from "./websocket";

export const worldActions = {
  moveToNode(nodeId: string): void {
    ws.send("world:move", { nodeId });
  },
};
```

**Reglas Actions:**

- ✅ **Solo** envían WS
- ❌ **Nunca** actualizan store directamente
- ❌ **Nunca** renderizan

---

## 🔷 CAPA 4: FEATURES

**Responsabilidad:** Dominios autónomos del juego

### Estructura:

```
features/
├── world/
│   ├── WorldPage.tsx
│   ├── NodeView.tsx
│   └── components/
├── combat/
│   ├── CombatPage.tsx
│   └── components/
├── crafting/
├── economy/
├── quests/
└── social/
```

**Regla CRÍTICA:**

- ✅ Feature **autónoma**
- ❌ Feature **NO importa** lógica de otra feature
- ✅ Interacción **solo** por store o actions

---

## 🔷 CAPA 5: UI SHARED

**Responsabilidad:** Componentes reutilizables

### Estructura:

```
components/
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── ... (10 components)
├── layout/
│   ├── TopBar.tsx
│   ├── LeftSidebar.tsx
│   └── RightLogs.tsx
└── canvas/
    ├── GameCanvas.tsx
    └── EntitySprite.tsx
```

**Características:**

- ✅ Componentes **puros** (solo props)
- ✅ Sin lógica de negocio
- ✅ Reutilizables en cualquier feature

---

## 🌍 Modelo WorldState Definitivo

### Los 5 Sistemas Independientes

```typescript
WorldState = {
  graph: WorldGraph, // Sistema 1: Topología
  entities: Record<Id, Entity>, // Sistema 2: Vida del juego
  combats: Record<Id, Combat>, // Sistema 3: Combate
  economies: Record<Id, Economy>, // Sistema 4: Economía
  events: Record<Id, Event>, // Sistema 5: Eventos
};
```

### 1. WorldGraph - Topología Pura

```typescript
WorldGraph = {
  nodes: Record<NodeId, Node>,
  edges: Record<NodeId, NodeId[]>
}

Node = {
  id: string,
  type: 'city' | 'forest' | 'refuge',
  name: string,
  ownerClanId?: string,
  dangerLevel: number,
  economyProfileId: string,  // Referencia a NodeEconomy
  eventIds: string[]         // Referencias a eventos
}
```

**Principio:** Node **solo** guarda topología, **no** lógica

### 2. EntitySystem - Toda vida del juego

```typescript
Entity = {
  id: string,
  type: 'player' | 'npc' | 'zombie' | 'mercenary',
  nodeId: string,
  position: { x: number, y: number },
  stats: Stats,
  inventoryId: string,
  state: EntityState  // ← Clave para movimiento/combate
}

EntityState =
  | { type: 'idle' }
  | { type: 'moving', targetNode: string }
  | { type: 'inCombat', combatId: string }
  | { type: 'trading' }
  | { type: 'scavenging' }
```

**Principio:** Entities son **Record<Id, Entity>**, NO array

**Ventaja:** Acceso O(1), no hay `.map()` ineficientes

### 3. CombatSystem - Separado del mundo

```typescript
CombatInstance = {
  id: string,
  participants: EntityId[],  // Referencias
  turnOrder: EntityId[],
  currentTurnIndex: number,
  log: CombatLogEntry[],
  state: 'active' | 'finished'
}
```

**Principio:** Combate **no se mezcla** con worldStore

**Store:** `combatStore.ts` separado

### 4. EconomySystem - Distribuida por nodo

```typescript
NodeEconomy = {
  nodeId: string,
  supply: Record<ItemId, number>,
  demand: Record<ItemId, number>,
  priceModifiers: Record<ItemId, number>,
};
```

**Principio:** Economía **no es global**, cada nodo tiene la suya

### 5. EventSystem - Separado

```typescript
GlobalEvent = {
  id: string,
  type: 'horde' | 'airdrop' | 'plague',
  affectedNodes: NodeId[],
  startTime: number,
  endTime: number,
  intensity: number
}

LocalEvent = {
  id: string,
  type: 'zombieWave' | 'merchantVisit',
  nodeId: NodeId
}
```

**Principio:** Node **solo** almacena referencias (`eventIds`), no el evento completo

**Store:** `eventStore.ts` separado

---

## 🔄 Flujo Backend ↔ Frontend

### Patrón Universal

```
1. Jugador hace acción
2. Frontend llama action()          // actions.ts
3. Action envía mensaje WS          // ws.send()
4. Backend valida y modifica estado
5. Backend emite evento(s)
6. Frontend handler actualiza store // handlers/*.ts
7. UI reacciona automáticamente     // Zustand subscription
```

### ❌ NUNCA:

```typescript
// Frontend NUNCA muta estado primero
worldStore.updateEntity(id, { hp: hp - 10 }); // ❌ INCORRECTO
ws.send("combat:attack", { targetId });
```

### ✅ SIEMPRE:

```typescript
// Frontend envía, backend responde, handler actualiza
actions.combat.attack(targetId); // ✅ CORRECTO

// Handler recibe respuesta:
export const onCombatTurnResult = (payload) => {
  useWorldStore
    .getState()
    .updateEntity(payload.entityId, { hp: payload.newHp });
  useCombatStore.getState().addLogEntry(payload.log);
};
```

---

## 📡 Sincronización: Snapshots vs. Deltas

### A) Snapshots Completos

**Uso:** Login, reconexión, shard change

```typescript
// Backend envía:
{
  type: 'world:snapshot',
  payload: {
    graph: { nodes: {...}, edges: {...} },
    entities: { entityId: {...} },
    combats: {},
    economies: {},
    events: {}
  }
}

// Frontend reemplaza todo:
worldStore.replaceWorldSnapshot(payload)
```

### B) Deltas Incrementales

**Uso:** 99% del tiempo

```typescript
// Backend envía cambios específicos:
{ type: 'entity:update', payload: { id: 'player-1', hp: 85 } }
{ type: 'combat:started', payload: { id: 'combat-1', participants: [...] } }
{ type: 'event:start', payload: { id: 'event-1', type: 'horde', ... } }

// Frontend solo actualiza la parte afectada:
worldStore.updateEntity(id, updates)
combatStore.addCombat(combat)
eventStore.addEvent(event)
```

---

## 🎯 Flujos Específicos

### Movimiento de Entidades

```typescript
// Frontend
actions.world.moveToNode('node-5')

// Backend valida → actualiza → emite
{ type: 'entity:update', payload: {
  id: 'player-1',
  nodeId: 'node-5',
  state: { type: 'moving', targetNode: 'node-5', progress: 0 }
}}

// Handler
worldStore.updateEntity(payload.id, payload)

// UI (automático)
const entities = useWorldStore(state =>
  state.getEntitiesInNode(currentNode)
)
```

### Combate

```typescript
// INICIO
actions.combat.startCombat('zombie-1')

// Backend crea CombatInstance, cambia entity.state
{ type: 'combat:started', payload: { id: 'combat-1', ... } }
{ type: 'entity:update', payload: {
  id: 'player-1',
  state: { type: 'inCombat', combatId: 'combat-1' }
}}

// TURNO
actions.combat.performAction('attack')

// Backend resuelve, actualiza HP, guarda log
{ type: 'combat:turn_result', payload: { damage: 15, ... } }
{ type: 'entity:update', payload: { id: 'zombie-1', hp: 35 } }

// FIN (opcional)
{ type: 'combat:finished', payload: { winner: 'player-1', ... } }
```

**Crítico:** `combatStore` solo guarda instancia, `worldStore` sigue siendo dueño de entities

### Economía

```typescript
// Frontend
actions.economy.purchase('water', 5)

// Backend valida stock → descuenta caps → descuenta supply
{ type: 'entity:update', payload: {
  id: 'player-1',
  inventoryId: 'updated-inventory',
  caps: 235
}}
{ type: 'economy:update', payload: {
  nodeId: 'city-1',
  supply: { water: 15 }
}}

// Frontend NO calcula precio, NO descuenta localmente
```

### Eventos Globales

```typescript
// Backend inicia evento
{ type: 'event:start', payload: {
  id: 'horde-1',
  type: 'horde',
  affectedNodes: ['city-1', 'forest-2'],
  startTime: 1703001234,
  endTime: 1703002234
}}

// Frontend agrega a eventStore
eventStore.addEvent(payload)

// UI filtra por nodo actual
const events = useEventStore(state =>
  state.getEventsForNode(currentNode)
)

// Backend finaliza evento
{ type: 'event:end', payload: { id: 'horde-1' } }

// Frontend elimina
eventStore.removeEvent(payload.id)
```

---

## 🚀 Checklist de Implementación

### ✅ Completado

- [x] WorldState con 5 sistemas (worldStore.ts)
- [x] EventStore separado (eventStore.ts)
- [x] Entity System con Record indexado
- [x] HandlerRegistry mejorado
- [x] Actions separadas (actions.ts)
- [x] WSProvider React context
- [x] WebSocketService con eventos

### ⏳ En Progreso

- [ ] 7 stores faltantes
- [ ] GameShell.tsx
- [ ] Migrar pages/ → features/
- [ ] Actualizar handlers a nuevo worldStore

### 📋 Pendiente

- [ ] Documentar cada feature
- [ ] Testing setup (Vitest + RTL)
- [ ] Performance monitoring
- [ ] Error boundaries

---

## 📏 Reglas de Oro

### 1. Tamaño de Archivos

- ❌ **>300 líneas** → Dividir
- ⚠️ **>200 líneas** → Revisar
- ✅ **<150 líneas** → Ideal

### 2. Imports

- ❌ Feature importa otra feature
- ✅ Feature importa store
- ✅ Feature importa actions
- ✅ Feature importa UI shared

### 3. Estado

- ❌ `window.*` nunca más
- ✅ Todo en Zustand stores
- ❌ Store no importa React
- ✅ Store es puro TypeScript

### 4. WebSocket

- ❌ Componente llama `ws.send()` directo
- ✅ Componente llama `actions.*`
- ❌ Handler modifica DOM
- ✅ Handler actualiza store

### 5. Renderizado

- ❌ Archivo renderiza todo
- ✅ Componentes pequeños puros
- ❌ Lógica mezclada con JSX
- ✅ Lógica en hooks/utils

---

## 🔮 Ventajas de esta Arquitectura

### Escalabilidad

- ✅ Agregar features sin tocar existentes
- ✅ Soportar múltiples shards
- ✅ Agregar stores sin refactor

### Mantenibilidad

- ✅ Cada archivo <200 líneas
- ✅ Responsabilidades claras
- ✅ Fácil de testear

### Performance

- ✅ Entities indexadas (O(1) access)
- ✅ Deltas incrementales (no reconstruir todo)
- ✅ Queries optimizadas con selectors

### Developer Experience

- ✅ TypeScript end-to-end
- ✅ Autocompletado perfecto
- ✅ Sin efectos secundarios inesperados
- ✅ Debug sencillo (Redux DevTools)

---

## 📚 Referencias

- [worldStore.ts](../frontend-react/src/store/worldStore.ts) - WorldState definitivo
- [eventStore.ts](../frontend-react/src/store/eventStore.ts) - Event system
- [types/world.ts](../frontend-react/src/types/world.ts) - Tipos definitivos
- [actions.ts](../frontend-react/src/services/actions.ts) - Actions centralizadas
- [wsProvider.tsx](../frontend-react/src/services/wsProvider.tsx) - React context

---

**Última actualización:** Diciembre 2024  
**Status:** ✅ Arquitectura base implementada, features en migración
