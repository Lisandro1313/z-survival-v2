# 🚀 Quickstart - Proyecto React Survival

> **Estado:** Sprint 2 Parcial completado (60% funcionalidad total)  
> **Última actualización:** Sprint 2  
> **Archivos:** 95 archivos, ~13,800 líneas código

## ⚡ Inicio Rápido (5 minutos)

### 1. Instalar dependencias

```bash
cd frontend-react
npm install
```

**Dependencias principales:**

- `react@18.2.0` + `react-dom@18.2.0`
- `zustand@4.4.0` - State management
- `react-router-dom@6.14.1` - Routing
- `typescript@5.2.2`
- `vite@5.0.0`

### 2. Iniciar servidor de desarrollo

```bash
npm run dev
```

**Acceso:** http://localhost:5173

### 3. Explorar páginas implementadas

| Ruta        | Funcionalidad           | Estado            |
| ----------- | ----------------------- | ----------------- |
| `/`         | Dashboard principal     | ✅ Sprint 1       |
| `/node/:id` | Vista detalle nodo      | ✅ Sprint 1       |
| `/combat`   | Sistema combate         | ✅ Sprint 1       |
| `/refuge`   | Refugio interno         | ✅ Sprint 1       |
| `/social`   | Interacción social      | ✅ Sprint 1       |
| `/map`      | Mapa mundo              | ✅ Sprint 1       |
| `/crafting` | **Mesa de crafteo**     | ✅ **Sprint 2**   |
| `/economy`  | **Centro económico**    | ✅ **Sprint 2**   |
| `/quests`   | **Sistema de misiones** | ✅ **Sprint 2.2** |

---

## 🎯 Lo Nuevo en Sprint 2

### Stores Críticos (3 nuevos)

**1. questStore.ts**

```typescript
import { useQuestStore } from "@/store/questStore";

// En componente
const { quests, activeQuests, acceptQuest } = useQuestStore();

// Acciones disponibles
acceptQuest(questId); // Aceptar misión
completeQuest(questId); // Completar
abandonQuest(questId); // Abandonar
updateObjective(questId, objId, progress);
```

**2. craftingStore.ts**

```typescript
import { useCraftingStore } from "@/store/craftingStore";

const {
  recipes,
  currentCrafting,
  craftingQueue,
  startCrafting,
  getFilteredRecipes,
  canCraft,
} = useCraftingStore();

// Craftear
if (canCraft(recipeId)) {
  startCrafting(recipeId);
}
```

**3. economyStore.ts**

```typescript
import { useEconomyStore } from "@/store/economyStore";

const { shopItems, cartItems, playerCaps, addToCart, getCartTotal, canAfford } =
  useEconomyStore();

// Comprar
addToCart(item, quantity);
if (canAfford(getCartTotal())) {
  // checkout...
}
```

### Componentes UI Reutilizables (2 nuevos)

**1. Notification**

```tsx
import { useUIStore } from "@/store/uiStore";

const { addNotification } = useUIStore();

// Usar
addNotification({
  message: "¡Compra exitosa!",
  type: "success", // success | error | warning | info
});
```

**2. ProgressBar**

```tsx
import ProgressBar from "@/components/ui/ProgressBar";

<ProgressBar
  current={50}
  max={100}
  label="Crafteo"
  variant="progress" // health | hunger | stamina | xp | progress | danger
  size="md" // sm | md | lg
  animated
/>;
```

### Componentes Game (2 nuevos)

**1. Inventory**

```tsx
import Inventory from "@/components/game/Inventory";

<Inventory
  mode="compact" // compact | full
  onUseItem={handleUse}
  onEquipItem={handleEquip}
  onDropItem={handleDrop}
/>;
```

**2. CraftingTable**

```tsx
import CraftingTable from "@/components/game/CraftingTable";

<CraftingTable
  onCraft={(recipeId) =>
    websocket.send("crafting:start", { recipe_id: recipeId })
  }
  onCancel={(recipeId) =>
    websocket.send("crafting:cancel", { recipe_id: recipeId })
  }
  onRush={(recipeId) =>
    websocket.send("crafting:rush", { recipe_id: recipeId })
  }
/>;
```

**3. QuestsList (NUEVO Sprint 2.2)**

```tsx
import QuestsList from '@/components/game/QuestsList'

<QuestsList
  onAcceptQuest={handleAccept}
  onAbandonQuest={handleAbandon}
  onTrackQuest={handleTrack}
/>

// Modo compact para sidebars
<QuestsList compact />
```

**4. NPCList (NUEVO Sprint 2.2)**

```tsx
import NPCList from '@/components/game/NPCList'

<NPCList
  npcs={npcArray}
  onTalkToNPC={(id) => handleDialogue(id)}
  onTradeWithNPC={(id) => handleTrade(id)}
  showFilters
/>

// Modo compact
<NPCList npcs={npcArray} compact />
```

---

## 📂 Estructura Relevante

```
frontend-react/
├── src/
│   ├── store/               # 🆕 7 stores (3 nuevos)
│   │   ├── playerStore.ts
│   │   ├── worldStore.ts
│   │   ├── uiStore.ts
│   │   ├── combatStore.ts
│   │   ├── questStore.ts       ← NUEVO
│   │   ├── craftingStore.ts    ← NUEVO
│   │   └── economyStore.ts     ← NUEVO
│   │
│   ├── components/
│   │   ├── ui/              # 🆕 6 componentes (2 nuevos)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Notification.tsx  ← NUEVO
│   │   │   └── ProgressBar.tsx   ← NUEVO
│   │   │
│   │   ├── game/            # 🆕 2 componentes (2 nuevos)
│   │   │   ├── Inventory.tsx     ← NUEVO
│   │   │   └── CraftingTable.tsx ← NUEVO
│   │   │
│   │   └── layout/
│   │       ├── Shell.tsx         ← Actualizado (NotificationContainer)
│   │       └── TopBar.tsx
│   │
│   ├── pages/               # 🆕 8 páginas (2 nuevas)
│   │   ├── Dashboard/
│   │   ├── NodeView/
│   │   ├── Combat/
│   │   ├── Refuge/
│   │   ├── Social/
│   │   ├── Map/
│   │   ├── Crafting/       ← NUEVO
│   │   └── Economy/        ← NUEVO
│   │
│   ├── services/
│   │   ├── websocket.ts
│   │   └── handlers/       # 🆕 Actualizados (3)
│   │       ├── craftingHandlers.ts   ← Actualizado
│   │       ├── economyHandlers.ts    ← Actualizado
│   │       └── questHandlers.ts      ← Actualizado
│   │
│   ├── App.tsx             ← Actualizado (rutas)
│   └── main.tsx
│
└── DOCS/ 📚
    ├── MEJORAS_SPRINT2.md         ← NUEVO (500 líneas)
    ├── RESUMEN_EJECUTIVO.md       ← NUEVO (400 líneas)
    └── INDICE.md                  ← NUEVO (600 líneas)
```

---

## 🧪 Testing Rápido

### Quests (página `/quests`) 🆕

1. Abrir http://localhost:5173/quests
2. **Ver header stats** (4 cards: disponibles/activas/completadas/diarias)
3. **Tabs filtering** (Available/Active/Completed)
4. **Buscar misión** con input
5. **Click en misión** → Panel detalles derecha
6. **Ver objetivos** con progress individual (kill/collect/visit/craft/talk/survive)
7. **Ver recompensas** (XP/Caps/Items/Reputación)
8. **Accept quest** → Validación límite 5 activas
9. **Sidebar:** Progreso jugador, Consejos, Tipos objetivos, Activas rápido

### Crafteo (página `/crafting`)

1. Abrir http://localhost:5173/crafting
2. **Ver lista recetas** en panel izquierdo
3. **Filtrar por categoría** (weapon/armor/consumable)
4. **Buscar receta** con input
5. **Validación ingredientes** visual (✓/🚫)
6. **Craftear** → Progress bar animada
7. **Cola visible** con primeros 3
8. **Sidebar:** Player info + quick inventory (modo compact)

### Economía (página `/economy`)

1. Abrir http://localhost:5173/economy
2. **Ver balance caps** en header
3. **Filtrar tienda** por categoría (7 opciones)
4. **Items grid** con rarity colors
5. **Agregar al carrito** múltiples items
6. **Ver total con descuentos** automático
7. **Checkout** → Validación caps
8. **Transaction history** últimas 5

### Notificaciones (global)

```typescript
// En cualquier página
import { useUIStore } from "@/store/uiStore";

const { addNotification } = useUIStore();

addNotification({ message: "Test notification", type: "success" });
// Aparece top-right, auto-dismiss 5s
```

---

## 🔌 Integración WebSocket

### Mensajes Implementados (Sprint 2)

**Crafting:**

```javascript
// Cliente → Servidor
websocket.send('crafting:get_recipes')
websocket.send('crafting:start', { recipe_id: 'pistol_01' })
websocket.send('crafting:cancel', { recipe_id: 'pistol_01' })
websocket.send('crafting:rush', { recipe_id: 'pistol_01', caps: 5 })

// Servidor → Cliente (handlers actualizados)
'crafting:recipes' → useCraftingStore.setRecipes()
'crafting:success' → completeCrafting() + addItem()
'crafting:failed' → cancelCrafting() + notification error
```

**Economy:**

```javascript
// Cliente → Servidor
websocket.send('economy:get_items')
websocket.send('economy:purchase', { item_id: 'ammo_9mm', quantity: 50 })
websocket.send('economy:sell', { item_id: 'scrap_metal', quantity: 10 })

// Servidor → Cliente (handlers actualizados)
'economy:data' → setShopItems() + setCaps()
'purchase:success' → removeCaps() + addTransaction()
'sale:success' → addCaps() + addTransaction()
'caps:updated' → sync playerStore bidireccional
```

**Quests:**

```javascript
// Cliente → Servidor
websocket.send('missions:get_list')
websocket.send('missions:accept', { quest_id: 'quest_001' })
websocket.send('missions:abandon', { quest_id: 'quest_001' })

// Servidor → Cliente (handlers actualizados)
'missions:list' → setQuests()
'mission:new' → addQuest() + notification
'mission:accepted' → acceptQuest() + notification
'mission:completed' → completeQuest() + notification rewards
'mission:expired' → updateQuest(status: expired)
```

**NPCs (propuesto - pendiente backend):**

```javascript
// Cliente → Servidor
websocket.send('npc:get_list', { location_id?: string })
websocket.send('npc:talk', { npc_id: 'npc_001' })
websocket.send('npc:trade', { npc_id: 'npc_001' })

// Servidor → Cliente
'npc:list' → Array de NPCs con trust levels
'npc:dialogue' → Abrir m4/8 (50%) | 🟡 Parcial | 4 nuevos (Inventory, CraftingTable, QuestsList, NPCList) |
| **Pages** | 9/13 (69%) | 🟢 Bueno | 3 nuevas (Crafting, Economy, Quests
```

---

## 📊 Estado del Proyecto

### Completitud por Dominio

| Dominio             | Archivos     | Estado       | Comentario                                |
| ------------------- | ------------ | ------------ | ----------------------------------------- |
| **Stores**          | 7/15 (47%)   | 🟡 Parcial   | 3 nuevos (quest, crafting, economy)       |
| **Components UI**   | 6/10 (60%)   | 🟡 Parcial   | 2 nuevos (Notification, ProgressBar)      |
| **Components Game** | 2/8 (25%)    | 🟠 Bajo      | 2 nuevos (Inventory, CraftingTable)       |
| **Pages**           | 8/13 (62%)   | 🟢 Bueno     | 2 nuevas (Crafting, Economy)              |
| **Handlers**        | 15/15 (100%) | 🟢 Completo  | 3 actualizados (crafting, economy, quest) |
| **Services**        | 2/2 (100%)   | 🟢 Completo  | WebSocket + Handlers                      |
| **Routing**         | 8/13 (62%)   | 🟢 Bueno     | Todas las páginas existentes rutadas      |
| **Testing**         | 0/1 (0%)     | 🔴 Pendiente | Setup Vitest + RTL                        |

**Total:** 65% funcionalidad completa

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev              # Inicia dev server (puerto 5173)
npm run build            # Build para producción
npm run preview          # Preview build producción

# Linting
npm run lint             # ESLint

# Testing (cuando esté configurado)
npm run test             # Vitest
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report

# TypeScript
npx tsc --noEmit         # Type checking
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'zustand'"

**Solución:**

```bash
npm install zustand@4.4.0
```

### Error: TypeScript "implicitly has 'any' type"

**Causa:** Archivos viejos (pre-Sprint 2) no strict mode compliant  
**Solución temporal:** Archivos nuevos son strict compliant, los viejos se migrarán gradualmente

### Página blanca en ruta nueva

**Checklist:**

1. ¿Ruta agregada en `App.tsx`?
2. ¿Imports correctos en página?
3. ¿Store usado tiene hook exportado?
4. Ver consola browser para errores runtime

### Notificaciones no aparecen

**Checklist:**

1. `<NotificationContainer />` está en `Shell.tsx` (✅ ya está)
2. `useUIStore().addNotification()` llamado correctamente
3. Ver z-index CSS (debe ser 9999)

---

## 📚 Documentación Relacionada

| Documento                                       | Cuándo Leer                    | Líneas |
| ----------------------------------------------- | ------------------------------ | ------ |
| [QUICKSTART.md](./QUICKSTART.md)                | **Empezar ahora**              | 250    |
| [INDICE.md](../INDICE.md)                       | Buscar archivo específico      | 600    |
| [RESUMEN_EJECUTIVO.md](../RESUMEN_EJECUTIVO.md) | Overview completo proyecto     | 400    |
| [MEJORAS_SPRINT2.md](../MEJORAS_SPRINT2.md)     | Detalles técnicos Sprint 2     | 500    |
| [ESTADO_ACTUAL.md](../ESTADO_ACTUAL.md)         | Estado pre-Sprint 2 (Sprint 1) | 800    |
| [BLUEPRINT.md](../BLUEPRINT.md)                 | Arquitectura + roadmap         | 1,200  |

---

## ✅ Checklist Desarrollo

### Antes de empezar feature nueva

- [ ] Leer [INDICE.md](../INDICE.md) sección "Busco implementar..."
- [ ] Verificar store existe o crear siguiendo pattern
- [ ] Revisar handlers relevantes actualizados
- [ ] Comprobar tipos en `types/` compartidos

### Durante desarrollo

- [ ] TypeScript strict mode compliant
- [ ] CSS co-located con componente
- [ ] Handlers actualizados si toca WebSocket
- [ ] Notifications para feedback user

### Antes de commit

- [ ] `npm run lint` pasa
- [ ] `npx tsc --noEmit` sin errores
- [ ] Probar feature en browser manualmente
- [ ] Actualizar documentación si es feature grande

---

## 🎯 Próximos Pasos Sugeridos

### Inmediato (Sprint 2 completar)

1. **Testing Setup** (CRÍTICO)
   - Instalar Vitest + RTL
   - Tests stores: craftingStore, economyStore, questStore
   - Tests componentes: Notification, ProgressBar

2. **QuestsList Component** (CRÍTICO)
   - Sistema quest 95% completo, solo falta UI
   - Usar questStore hooks ya implementados
   - Integrar en Dashboard o página nueva /quests

### Mediano Plazo (Sprint 3-4)

3. **Stores Sociales**
   - clanStore.ts (gestión clan)
   - raidStore.ts (raids cooperativos)

4. **Marketplace Page**
   - Usa economyStore (marketListings ya existe)
   - Economía jugador-jugador

5. **Componentes Game**
   - NPCList.tsx (para diálogos)
   - ShopPanel.tsx (reusar lógica Economy.tsx)
   - ChatPanel.tsx (comunicación)

### Largo Plazo (Sprint 5+)

6. **Páginas Raids** (cuando raidStore + bossRaidStore estén)
7. **Progression Page** (skill tree, último sprint)
8. **Optimizaciones** (code splitting, lazy loading)

---

## 🚀 ¡Listo para Usar!

```bash
# Paso 1: Instalar
npm install

# Paso 2: Iniciar
npm run dev

# Paso 3: Abrir browser
# http://localhost:5173

# Paso 4: Navegar a nuevas páginas
# /crafting  → Mesa de crafteo completa
# /economy   → Centro económico con tienda y carrito

# Paso 5: Disfrutar 🎉
```

---

**Actualizado:** Sprint 2.2 (Quests + NPCs)  
**Proyecto:** Manolitri Survival - Frontend React  
**Completitud:** 65% total, 101 archivos, ~16,300 líneas, 9 rutas  
**Próximo milestone:** Testing Setup + Social Integration → 70%
