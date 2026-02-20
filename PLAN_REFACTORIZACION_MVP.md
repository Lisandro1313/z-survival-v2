# Plan de Refactorización: survival_mvp.js

## ✅ PROGRESO ACTUAL

**Estado:** Fase 6 COMPLETADA  
**Archivo principal:** survival_mvp.js  
**Tamaño inicial:** 11,540 líneas  
**Tamaño actual:** 8,314 líneas  
**Reducción total:** 3,226 líneas (28.0%)

**Logros:**

### Fase 1: Handlers de IA ✅

- ✅ Handlers de IA extraídos a `server/handlers/ai.handlers.js` (11 comandos, 630 líneas)
- ✅ Reducción: 2,158 líneas

### Fase 2: Handlers de Combate ✅

- ✅ Handlers de combate extraídos a `server/handlers/combat.handlers.js` (7 comandos, 530 líneas)
  - combat:start, combat:attack, combat:flee
  - equip_weapon, equip_armor, get_equipment, use_ability
- ✅ Handler legacy 'attack' agregado como redirección
- ✅ Reducción adicional: 211 líneas

### Fase 3: Handlers de Crafteo ✅

- ✅ Handlers de crafteo extraídos a `server/handlers/crafting.handlers.js` (6 comandos, 237 líneas)
  - craft:get_recipes, craft:item, craft:upgrade
  - craft:apply_modifier, craft:build_workbench, craft:get_info
- ✅ Reducción adicional: 214 líneas

### Fase 4: Handlers de Marketplace ✅

- ✅ Handlers de mercado extraídos a `server/handlers/market.handlers.js` (7 comandos, 207 líneas)
  - market:create_listing, market:buy_listing, market:place_bid
  - market:cancel_listing, market:search, market:get_my_listings, market:get_stats
- ✅ Reducción adicional: 183 líneas

### Fase 5: Handlers de Raids ✅

- ✅ Handlers de raids extraídos a `server/handlers/raid.handlers.js` (9 comandos, 262 líneas)
  - raid:get_active, raid:get_status, raid:attack_zombie
  - raid:place_defense, raid:repair_refuge
  - raid:get_history, raid:get_top_defenders, raid:get_my_stats, raid:get_info
- ✅ Reducción adicional: 213 líneas

### Fase 6: Handlers de Clanes ✅

- ✅ Handlers de clanes extraídos a `server/handlers/clan.handlers.js` (15 comandos, 390 líneas)
  - clan:create, clan:get_info, clan:get_my_clan, clan:invite
  - clan:accept_invite, clan:decline_invite, clan:leave, clan:kick, clan:promote
  - clan:get_members
  - clan:storage_deposit, clan:storage_withdraw, clan:get_storage
  - clan:search_recruiting, clan:get_activity_log
- ✅ Reducción adicional: 298 líneas

### Arquitectura

- ✅ Sistema de inyección de dependencias implementado
- ✅ Factory pattern con `createAllHandlers()`
- ✅ Servidor funcionando correctamente
- ✅ 6 módulos de handlers creados (AI, Combat, Crafting, Market, Raid, Clan)
- ✅ Template establecido para extraer otros handlers

---

## 🚨 Problema Original

**Archivo:** `server/survival_mvp.js`  
**Tamaño:** 11,540 líneas  
**Estado:** ⚠️ MONOLITO - Viola principio de responsabilidad única

---

## 📊 Análisis de Responsabilidades

### Contenido Actual (estimado):

1. **Imports y configuración** (~150 líneas)
2. **Definición de WORLD** (~2,500 líneas)
   - Locaciones
   - NPCs
   - Items
   - Sub-ubicaciones
3. **Servicios** (~500 líneas)
4. **WebSocket Handlers** (~6,000 líneas)
   - Handlers de movimiento, combate, crafteo
   - Handlers de comercio, diálogos
   - Handlers de misiones
   - Handlers de construcción
   - Handlers de raids
   - Handlers de PvP
   - Handlers de IA (recientemente agregados)
5. **Lógica de inicialización** (~1,000 líneas)
6. **Sistema de ticks** (~500 líneas)
7. **Utilidades y helpers** (~1,000 líneas)

---

## 🎯 Propuesta de Separación

### Fase 1: Extraer Handlers (PRIORIDAD ALTA)

**Problema:** 6,000+ líneas de handlers en un solo archivo

**Solución:**

```
server/
├── handlers/
│   ├── index.js                    # Exporta todos los handlers
│   ├── auth.handlers.js            # Login, registro
│   ├── movement.handlers.js        # Move, travel
│   ├── combat.handlers.js          # Attack, defend, shoot
│   ├── inventory.handlers.js       # Get items, drop, trade
│   ├── crafting.handlers.js        # Craft, recipes
│   ├── npc.handlers.js             # Talk, quest, gift
│   ├── construction.handlers.js    # Build, upgrade
│   ├── trade.handlers.js           # Market, exchange
│   ├── mission.handlers.js         # Accept, complete missions
│   ├── raid.handlers.js            # Start, join raids
│   ├── pvp.handlers.js             # Arena, duels
│   ├── clan.handlers.js            # Clan management
│   ├── ai.handlers.js              # AI admin commands ✅ NUEVO
│   └── debug.handlers.js           # Dev tools
```

**Beneficios:**

- Cada archivo ~200-500 líneas
- Fácil encontrar y modificar handlers
- Testing individual por categoría
- Menos merge conflicts

---

### Fase 2: Extraer Datos de WORLD (PRIORIDAD ALTA)

**Problema:** 2,500+ líneas de datos hardcoded

**Solución:**

```
server/
├── data/
│   ├── locations.js                # Todas las locaciones
│   ├── npcs.json                   # ✅ YA EXISTE
│   ├── items.js                    # Catálogo de items
│   ├── recipes.js                  # Recetas de crafteo
│   ├── missions.js                 # Templates de misiones
│   └── world-config.js             # Configuración global
```

**Migración:**

```javascript
// survival_mvp.js (ANTES)
const WORLD = {
  locations: {
    /* 500 líneas */
  },
  npcs: {
    /* 1000 líneas */
  },
  // ...
};

// survival_mvp.js (DESPUÉS)
import { locations } from "./data/locations.js";
import npcs from "./data/npcs.json";
import { items } from "./data/items.js";

const WORLD = {
  locations,
  npcs,
  items,
  // ... solo estado mutable
};
```

---

### Fase 3: Modularizar Servicios (PRIORIDAD MEDIA)

**Estado Actual:**

```javascript
// ✅ Ya separados en services/GameServices.js
```

**Mejora:**
Cada servicio en su propio archivo:

```
server/
├── services/
│   ├── ResourceService.js
│   ├── CombatService.js
│   ├── CraftingService.js
│   ├── TradeService.js
│   ├── DialogueService.js
│   ├── MovementService.js
│   └── InventoryService.js
```

---

### Fase 4: Separar Lógica de WebSocket (PRIORIDAD MEDIA)

**Problema:** Lógica de WS mezclada con handlers

**Solución:**

```
server/
├── websocket/
│   ├── server.js                   # Setup de WebSocket
│   ├── connection.js               # Manejo de conexiones
│   ├── broadcast.js                # Utilidades de broadcast
│   └── middleware.js               # Auth, rate limiting
```

---

### Fase 5: Extraer Sistema de Ticks (PRIORIDAD BAJA)

```
server/
├── engine/
│   ├── tick.js                     # Sistema de ticks principal
│   ├── zombie-spawner.js           # Lógica de spawns
│   ├── resource-decay.js           # Decadencia de recursos
│   └── world-sync.js               # Sincronización de mundo
```

---

## 🛠️ Plan de Implementación

### Opción A: Migración Gradual (RECOMENDADO)

**Semana 1:**

1. ✅ Crear estructura de carpetas
2. ✅ Extraer handlers de IA a `handlers/ai.handlers.js`
3. ✅ Testear que funcionen correctamente
4. ✅ Extraer 2-3 handlers más simples

**Semana 2:** 5. Extraer todos los handlers restantes 6. Actualizar imports en survival_mvp.js 7. Testing exhaustivo

**Semana 3:** 8. Extraer datos de WORLD a archivos separados 9. Adaptar código para usar imports 10. Verificar que nada se rompa

**Semana 4:** 11. Separar servicios individuales 12. Extraer lógica de WebSocket 13. Testing final y optimización

### Opción B: Big Bang (NO RECOMENDADO)

- Refactorizar todo de golpe
- ⚠️ Alto riesgo de bugs
- ⚠️ Difícil de debuggear

---

## 📦 Estructura Final Objetivo

```
server/
├── survival_mvp.js                 # ~500 líneas
│   ├── Setup de Express
│   ├── Inicialización de WORLD
│   ├── WebSocket server setup
│   └── Entry point
│
├── handlers/                       # ~3,000 líneas TOTAL
│   ├── auth.handlers.js            (~200 líneas)
│   ├── movement.handlers.js        (~300 líneas)
│   ├── combat.handlers.js          (~500 líneas)
│   ├── inventory.handlers.js       (~400 líneas)
│   ├── crafting.handlers.js        (~300 líneas)
│   ├── npc.handlers.js             (~400 líneas)
│   ├── construction.handlers.js    (~300 líneas)
│   ├── trade.handlers.js           (~200 líneas)
│   ├── mission.handlers.js         (~300 líneas)
│   ├── raid.handlers.js            (~400 líneas)
│   ├── pvp.handlers.js             (~300 líneas)
│   ├── clan.handlers.js            (~200 líneas)
│   └── ai.handlers.js              (~200 líneas) ✅
│
├── data/                           # ~2,500 líneas TOTAL
│   ├── locations.js                (~800 líneas)
│   ├── npcs.json                   (~1000 líneas) ✅
│   ├── items.js                    (~400 líneas)
│   ├── recipes.js                  (~200 líneas)
│   └── world-config.js             (~100 líneas)
│
├── services/                       # ✅ YA SEPARADO
├── websocket/                      # ~300 líneas
├── engine/                         # ~500 líneas
└── utils/                          # ✅ YA EXISTE
```

**Resultado:** De 11,540 líneas → ~20 archivos modulares

---

## ✅ Próximo Paso Inmediato

**¿Quieres que empiece por extraer los handlers de IA que acabamos de implementar?**

Esto sería un buen caso de estudio porque:

1. ✅ Código fresco - fácil de mover
2. ✅ Ya está bien delimitado (líneas 7812-7987)
3. ✅ Tiene tests que verifican funcionalidad
4. ✅ Nos enseña el patrón para los demás

Esto reduciría survival_mvp.js en ~200 líneas y crearía el template para los otros 12 archivos de handlers.

**¿Procedemos con esto?**
