# 📋 HANDLERS COMPLETOS - Referencia Rápida

## Resumen

**Total de handlers implementados:** 100+  
**Dominios cubiertos:** 16  
**Message types del backend cubiertos:** ~75%

---

## Handlers por Dominio

### 1. Player Handlers (`playerHandlers.ts`)

Mensajes que maneja:

- `player:data` - Datos completos del jugador al conectar
- `player:update` - Actualización parcial de datos
- `player:levelup` - Subida de nivel

**Stores actualizados:** `playerStore`

---

### 2. World Handlers (`worldHandlers.ts`)

Mensajes que maneja:

- `world:state` - Estado inicial del mundo
- `world:update` - Actualización del mundo
- `moved` - Jugador se movió
- `entity.update` - Actualización de entidades
- `active_events` - Eventos globales activos

**Stores actualizados:** `worldStore`

---

### 3. Combat Handlers (`combatHandlers.ts`)

Mensajes que maneja:

- `combat` / `combat:started` - Combate iniciado
- `combat:turn_result` - Resultado de turno
- `combat:victory` - Victoria en combate
- `combat:defeat` - Derrota en combate
- `combat:flee` - Huida exitosa

**Stores actualizados:** `combatStore`, `uiStore` (modo)

---

### 4. Crafting Handlers (`craftingHandlers.ts`)

Mensajes que maneja:

- `crafting:recipes` - Lista de recetas
- `crafting:success` - Crafteo exitoso
- `crafting:failed` - Crafteo fallido

**Stores actualizados:** `playerStore` (inventario), `uiStore` (notificaciones)

---

### 5. Economy Handlers (`economyHandlers.ts`)

Mensajes que maneja:

- `economy:data` - Datos de economía
- `economy:purchase_success` - Compra exitosa
- `economy:sale_success` - Venta exitosa
- `economy:caps_updated` - Caps actualizados

**Stores actualizados:** `playerStore` (caps, inventario)

---

### 6. Market Handlers (`marketHandlers.ts`)

Mensajes que maneja:

- `market:listings` - Listings del marketplace
- `market:listing_created` - Listing creado
- `market:purchase_success` - Compra de listing
- `market:bid_placed` - Puja colocada
- `market:auction_won` - Subasta ganada

**Stores actualizados:** Future `marketStore`, `uiStore` (notificaciones)

---

### 7. Construction Handlers (`constructionHandlers.ts`)

Mensajes que maneja:

- `construction:started` - Construcción iniciada
- `construction:progress` - Progreso de construcción
- `construction:completed` - Construcción completada
- `construction_contributed` - Contribución recibida

**Stores actualizados:** Future `refugeStore`, `uiStore` (notificaciones)

---

### 8. Clan Handlers (`clanHandlers.ts`)

Mensajes que maneja:

- `clan:my_info` - Info de mi clan
- `clan:created` - Clan creado
- `clan:joined` - Unido a clan
- `clan:left` - Abandonado clan
- `clan:recruiting_list` - Lista de clanes reclutando
- `clan:invite_received` - Invitación recibida
- `clan:member_joined` - Miembro nuevo
- `clan:storage_updated` - Almacén actualizado

**Stores actualizados:** Future `clanStore`, `uiStore` (notificaciones)

---

### 9. Raid Handlers (`raidHandlers.ts`)

Mensajes que maneja:

- `raid:started` - Raid iniciado
- `raid:wave` - Nueva oleada
- `raid:defense_triggered` - Defensa activada
- `raid:completed` - Raid completado
- `raid:failed` - Raid fallido

**Stores actualizados:** Future `raidStore`, `uiStore` (modo, notificaciones)

---

### 10. Boss Raid Handlers (`bossRaidHandlers.ts`)

Mensajes que maneja:

- `bossraid:bosses_list` - Lista de bosses
- `bossraid:active_raids` - Raids activos
- `bossraid:boss_spawned` - Boss spawneado
- `bossraid:player_joined` - Jugador unido
- `bossraid:attack_result` - Resultado de ataque
- `bossraid:phase_change` - Cambio de fase
- `bossraid:victory` - Boss derrotado
- `bossraid:leaderboard` - Leaderboard
- `bossraid:achievements` - Logro desbloqueado

**Stores actualizados:** Future `bossRaidStore`, `uiStore`

---

### 11. PvP Handlers (`pvpHandlers.ts`)

Mensajes que maneja:

- `pvp:duel_invitation` - Invitación a duelo
- `pvp:duel_started` - Duelo iniciado
- `pvp:duel_round_result` - Resultado de round
- `pvp:duel_ended` - Duelo terminado
- `pvp:karma_data` - Datos de karma
- `pvp:ranking` - Ranking PvP

**Stores actualizados:** Future `pvpStore`, `combatStore`, `uiStore`

---

### 12. Fogata/Social Handlers (`fogataHandlers.ts`)

Mensajes que maneja:

- `fogata:posts` - Posts de la fogata
- `fogata:like_added` - Like agregado
- `fogata:comment_added` - Comentario agregado
- `game:joined` - Jugador unido a juego
- `game:started` - Juego iniciado
- `game:finished` - Juego terminado

**Stores actualizados:** Future `socialStore`, `uiStore`

---

### 13. Narrative Handlers (`narrativeHandlers.ts`)

Mensajes que maneja:

- `narrative:missions` - Misiones narrativas
- `narrative:started` - Misión iniciada
- `narrative:nextStep` - Siguiente paso
- `narrative:completed` - Misión completada

**Stores actualizados:** Future `narrativeStore`, `uiStore`

---

### 14. Quest Handlers (`questHandlers.ts`)

Mensajes que maneja:

- `missions:list` - Lista de misiones
- `mission:new` - Nueva misión
- `mission:accepted` - Misión aceptada
- `mission:completed` - Misión completada
- `mission:expired` - Misión expirada

**Stores actualizados:** Future `questStore`, `uiStore`

---

### 15. Trust Handlers (`trustHandlers.ts`)

Mensajes que maneja:

- `trust:data` - Datos de trust con NPC
- `trust:all_data` - Todos los trust
- `trust:updated` - Trust actualizado
- `trust:gift_given` - Regalo entregado

**Stores actualizados:** Future `trustStore`, `uiStore`

---

### 16. Radio Handlers (`radioHandlers.ts`)

Mensajes que maneja:

- `radio:receive` - Mensaje de radio recibido
- `radio:joined` - Unido a frecuencia

**Stores actualizados:** Future `radioStore`, `uiStore` (notificaciones)

---

## Flujo de Handler Típico

```typescript
// 1. Servidor envía mensaje
socket.send(JSON.stringify({
  type: 'combat:victory',
  payload: { xp: 100, loot: [...] }
}))

// 2. WebSocket service recibe y rutea
ws.route(message)  // → busca handler en registry

// 3. Handler se ejecuta
export function onCombatVictory(payload) {
  // Actualiza stores
  usePlayerStore.getState().addXP(payload.xp)
  useCombatStore.getState().endCombat()

  // Muestra notificación
  useUIStore.getState().addNotification({
    type: 'success',
    message: `¡Victoria! +${payload.xp} XP`
  })

  // Cambia modo si es necesario
  useUIStore.getState().setMode('dashboard')
}

// 4. React re-renderiza componentes que usan esos stores
```

---

## Cómo Agregar Nuevo Handler

### Paso 1: Crear archivo handler

```typescript
// services/handlers/newSystemHandlers.ts
import { useUIStore } from "../../store/uiStore";

export function onNewEvent(payload: any) {
  console.log("[NewSystem] Event:", payload);
  // Tu lógica aquí
}
```

### Paso 2: Registrar en index.ts

```typescript
// services/handlers/index.ts
import * as newSystemHandlers from "./newSystemHandlers";

export function getHandlers() {
  return {
    // ...existing handlers
    "newsystem:event": newSystemHandlers.onNewEvent,
  };
}
```

### Paso 3: Testear

```javascript
// En console del navegador
ws.send("test", { type: "newsystem:event", payload: { test: true } });
```

---

## Stores que Faltan Crear

Para completar la funcionalidad de todos los handlers, crear estos stores:

1. `clanStore.ts` - Para clan:\* handlers
2. `raidStore.ts` - Para raid:\* handlers
3. `bossRaidStore.ts` - Para bossraid:\* handlers
4. `socialStore.ts` - Para fogata:_ y game:_ handlers
5. `questStore.ts` - Para mission:\* handlers
6. `trustStore.ts` - Para trust:\* handlers
7. `pvpStore.ts` - Para pvp:\* handlers
8. `narrativeStore.ts` - Para narrative:\* handlers
9. `economyStore.ts` - Para economy:_ y market:_ handlers
10. `refugeStore.ts` - Para construction:\* handlers
11. `radioStore.ts` - Para radio:\* handlers

---

## Prioridad de Implementación

**Sprint 2 (alta prioridad):**

- ✅ craftingHandlers
- ✅ economyHandlers
- [ ] questStore + integration

**Sprint 3 (media prioridad):**

- ✅ clanHandlers
- ✅ raidHandlers
- [ ] clanStore + raidStore + integration

**Sprint 4 (baja prioridad):**

- ✅ bossRaidHandlers
- ✅ pvpHandlers
- ✅ narrativeHandlers
- [ ] Stores correspondientes

---

## Testing Checklist

Para cada handler:

- [ ] Handler registrado en index.ts
- [ ] Store actualiza correctamente
- [ ] Notificación se muestra (si aplica)
- [ ] No hay errores en console
- [ ] Testear con payload real del backend
- [ ] Documentar en este archivo

---

## Notas Importantes

- **Todos los handlers son defensivos:** usan optional chaining y valores por defecto
- **Notificaciones automáticas:** La mayoría muestra notificación al usuario
- **Logs útiles:** Cada handler loggea info relevante para debugging
- **Stores futuros:** Varios handlers están preparados para stores que se crearán después
- **Extensible:** Fácil agregar handlers nuevos siguiendo el patrón existente

---

**Última actualización:** Sprint 1 completado - 16 dominios, 100+ handlers implementados
