# 🗺️ BLUEPRINT COMPLETO - MIGRACIÓN FRONTEND

**Objetivo:** Migrar `survival.html` (17,010 líneas) a React modular organizado

---

## 📊 MAPEO COMPLETO: survival.html → React

### VARIABLES GLOBALES → STORES

| survival.html         | React Store           | Ubicación               |
| --------------------- | --------------------- | ----------------------- |
| `let player`          | `playerStore.player`  | `store/playerStore.ts`  |
| `let world`           | `worldStore.nodes`    | `store/worldStore.ts`   |
| `let ws`              | `ws` (singleton)      | `services/websocket.ts` |
| `let currentDialogue` | `uiStore.activeModal` | `store/uiStore.ts`      |
| `let tabsLoaded`      | `uiStore.mode`        | `store/uiStore.ts`      |
| `let currentGame`     | (nuevo store)         | `store/socialStore.ts`  |

### FUNCIONES DE RENDER → COMPONENTES

| función survival.html        | Componente React   | Archivo                         |
| ---------------------------- | ------------------ | ------------------------------- |
| `renderGame()`               | `<App />` + Router | `App.tsx`                       |
| `renderInventory()`          | `<Inventory />`    | `components/Inventory.tsx`      |
| `renderLocation()`           | `<NodeView />`     | `pages/NodeView/NodeView.tsx`   |
| `renderNPCs()`               | `<NPCList />`      | `components/NPCList.tsx`        |
| `renderCombat()`             | `<Combat />`       | `pages/Combat/Combat.tsx`       |
| `renderCrafting()`           | `<Crafting />`     | `pages/Crafting/Crafting.tsx`   |
| `renderBossRaids()`          | `<BossRaids />`    | `pages/BossRaids/BossRaids.tsx` |
| `renderTrustRelationships()` | `<TrustPanel />`   | `components/TrustPanel.tsx`     |
| `renderMyClan()`             | `<ClanPanel />`    | `pages/Clan/ClanPanel.tsx`      |
| `renderKarma()`              | `<KarmaPanel />`   | `components/KarmaPanel.tsx`     |

### FUNCIONES DE ACCIÓN → SERVICES

| función survival.html | Service React                    | Archivo                         |
| --------------------- | -------------------------------- | ------------------------------- |
| `move(location)`      | `movementService.move()`         | `services/movementService.ts`   |
| `scavenge()`          | `resourceService.scavenge()`     | `services/resourceService.ts`   |
| `attack()`            | `ws.send('combat:attack')`       | `pages/Combat/Combat.tsx`       |
| `craft(recipeId)`     | `craftingService.craft()`        | `services/craftingService.ts`   |
| `trade(npcId)`        | `tradeService.trade()`           | `services/tradeService.ts`      |
| `createClan(name)`    | `ws.send('clan:create')`         | `pages/Clan/ClanPanel.tsx`      |
| `spawnBoss(bossId)`   | `ws.send('bossraid:spawn_boss')` | `pages/BossRaids/BossRaids.tsx` |

### WEBSOCKET HANDLERS → HANDLERS POR DOMINIO

| messageHandlers (survival.html) | Handler React          | Archivo                                  |
| ------------------------------- | ---------------------- | ---------------------------------------- |
| `'player:data'`                 | `onPlayerData()`       | `services/handlers/playerHandlers.ts`    |
| `'world:state'`                 | `onWorldState()`       | `services/handlers/worldHandlers.ts`     |
| `'combat:started'`              | `onCombatStarted()`    | `services/handlers/combatHandlers.ts`    |
| `'crafting:success'`            | `onCraftingSuccess()`  | `services/handlers/craftingHandlers.ts`  |
| `'economy:data'`                | `onEconomyData()`      | `services/handlers/economyHandlers.ts`   |
| `'market:listings'`             | `onMarketListings()`   | `services/handlers/marketHandlers.ts`    |
| `'raid:started'`                | `onRaidStarted()`      | `services/handlers/raidHandlers.ts`      |
| `'bossraid:attack_result'`      | `onBossAttackResult()` | `services/handlers/bossRaidHandlers.ts`  |
| `'clan:my_info'`                | `onClanInfo()`         | `services/handlers/clanHandlers.ts`      |
| `'pvp:duel_invitation'`         | `onDuelInvitation()`   | `services/handlers/pvpHandlers.ts`       |
| `'fogata:posts'`                | `onFogataPosts()`      | `services/handlers/fogataHandlers.ts`    |
| `'narrative:started'`           | `onNarrativeStarted()` | `services/handlers/narrativeHandlers.ts` |

---

## 🗂️ DIVISIÓN DE LAS 312 FUNCIONES

### Funciones UI/Helpers (50 funciones) → Componentes UI

```
survival.html                   →  React Component
─────────────────────────────────────────────────────────
switchTab(tabName)              →  Router navigation
showModal(id)                   →  uiStore.openModal()
closeModal()                    →  uiStore.closeModal()
showNotification(msg, type)     →  <Notification /> + uiStore
playSound(type)                 →  soundService.play()
log(msg, type)                  →  logStore.add() + <LogPanel />
showDamageNumber(dmg)           →  <DamagePopup />
showLevelUpBanner(level)        →  <LevelUpBanner />
showBadge(tab)                  →  Badge component
```

### Funciones de Render (80 funciones) → Pages + Components

**Dashboard y Mundo:**

```
renderGame()                    →  App.tsx (router)
renderLocation()                →  NodeView.tsx
renderWorldEvents()             →  <EventsList />
renderDynamicQuests()           →  <QuestsList />
renderOnlinePlayers()           →  <OnlinePlayersList />
renderChat()                    →  <ChatPanel />
```

**Combat:**

```
renderCombat()                  →  Combat.tsx
renderCombatLog()               →  <CombatLog /> (ya implementado)
```

**Crafting:**

```
renderCrafting()                →  Crafting.tsx
renderCraftRecipes()            →  <RecipeList />
renderWorkbench()               →  <Workbench />
```

**Economía:**

```
renderEconomy()                 →  Economy.tsx
renderShop()                    →  <ShopPanel />
renderMarketplace()             →  <Marketplace />
renderMarketListings()          →  <ListingCard />
```

**Social:**

```
renderFogata()                  →  Social.tsx
renderFogataPosts()             →  <PostsList />
renderGames()                   →  <GamesList />
renderGroups()                  →  <GroupsList />
```

**Progresión:**

```
renderPlayerStats()             →  <StatsPanel />
renderInventory()               →  <Inventory />
renderQuests()                  →  <QuestsList />
renderAchievements()            →  <Achievements />
```

**Construcción:**

```
renderConstructionStructures()  →  <ConstructionPanel />
renderRefugioKPIs()             →  <RefugeStats />
```

**Raids y Bosses:**

```
renderRaids()                   →  Raids.tsx
renderBossRaids()               →  BossRaids.tsx
renderActiveBossRaids()         →  <ActiveRaidsList />
renderBossLeaderboard()         →  <BossLeaderboard />
```

**Sistema Social:**

```
renderTrustRelationships()      →  <TrustPanel />
renderMyClan()                  →  <ClanPanel />
renderClanStorage()             →  <ClanStorage />
renderClanMembers()             →  <MembersList />
```

**PvP:**

```
renderKarma()                   →  <KarmaPanel />
renderPvPRanking()              →  <PvPLeaderboard />
renderActiveDuels()             →  <DuelsList />
```

**Narrativa:**

```
renderNarrativeMissions()       →  <NarrativeMissions />
renderDialogue()                →  <DialogueModal />
```

### Funciones de Acción (150 funciones) → Services + WS sends

**Movimiento:**

```
move(location)                  →  movementService.move()
scavenge()                      →  resourceService.scavenge()
```

**Combat:**

```
attack()                        →  ws.send('combat:attack')
flee()                          →  ws.send('combat:flee')
useItem(itemId)                 →  ws.send('combat:use_item')
```

**Crafting:**

```
craft(recipeId)                 →  craftingService.craft()
batchCraft(recipeId, qty)       →  ws.send('batch_craft')
upgradeWeapon(weaponId)         →  ws.send('upgrade_weapon')
```

**Trading:**

```
trade(npcId)                    →  tradeService.open()
buyItem(itemId)                 →  ws.send('economy:buy')
sellItem(itemId)                →  ws.send('economy:sell')
```

**Marketplace:**

```
createListing(item, price)      →  ws.send('market:create_listing')
purchaseListing(listingId)      →  ws.send('market:purchase')
placeBid(listingId, amount)     →  ws.send('market:place_bid')
```

**Construcción:**

```
startConstruction(structureId)  →  ws.send('start_construction')
contribute(projectId, amount)   →  ws.send('contribute_construction')
```

**Clanes:**

```
createClan(name)                →  ws.send('clan:create')
joinClan(clanId)                →  ws.send('clan:join')
leaveClan()                     →  ws.send('clan:leave')
inviteMember(playerId)          →  ws.send('clan:invite')
depositStorage(itemId, qty)     →  ws.send('clan:deposit_storage')
withdrawStorage(itemId, qty)    →  ws.send('clan:withdraw_storage')
```

**Raids:**

```
joinRaid(raidId)                →  ws.send('raid:join')
leaveRaid(raidId)               →  ws.send('raid:leave')
defend()                        →  ws.send('raid:defend')
placeDefense(type, slot)        →  ws.send('raid:place_defense')
```

**Boss Raids:**

```
spawnBoss(bossId)               →  ws.send('bossraid:spawn_boss')
joinBossRaid(raidId)            →  ws.send('bossraid:join')
attackBoss(raidId)              →  ws.send('bossraid:attack')
leaveBossRaid(raidId)           →  ws.send('bossraid:leave')
```

**PvP:**

```
requestDuel(targetId)           →  ws.send('pvp:duel_request')
acceptDuel(duelId)              →  ws.send('pvp:accept_duel')
declineDuel(duelId)             →  ws.send('pvp:decline_duel')
attackDuel(action)              →  ws.send('pvp:attack')
```

**Social:**

```
createFogataPost(text)          →  ws.send('fogata:createPost')
likePost(postId)                →  ws.send('fogata:like')
commentPost(postId, text)       →  ws.send('fogata:comment')
createGame(type)                →  ws.send('game:create')
joinGame(gameId)                →  ws.send('game:join')
```

**Radio:**

```
joinRadio(freq)                 →  ws.send('radio:join')
sendRadioMessage(freq, text)    →  ws.send('radio:message')
scanFrequencies()               →  ws.send('radio:scan')
```

**Narrativa:**

```
startNarrativeMission(id)       →  ws.send('startNarrativeMission')
makeNarrativeChoice(id, choice) →  ws.send('narrativeChoice')
voteNarrative(missionId, option)→  ws.send('narrativeVote')
```

**Quests:**

```
acceptQuest(questId)            →  ws.send('accept_quest')
completeQuest(questId)          →  ws.send('complete_quest')
abandonQuest(questId)           →  ws.send('abandon_quest')
```

**Dialogue:**

```
talkToNPC(npcId)                →  dialogueService.start()
nextDialogue()                  →  dialogueService.next()
chooseDialogueOption(option)    →  dialogueService.choose()
```

---

## 📦 ARCHIVOS POR CREAR (Pendientes)

### Stores Adicionales

```
store/
├── socialStore.ts      # Fogata, juegos, grupos
├── economyStore.ts     # Caps, marketplace, listings
├── clanStore.ts        # Clan info, storage, members
├── questStore.ts       # Active quests, completed
├── raidStore.ts        # Active raids, defenses
└── bossRaidStore.ts    # Boss raids, leaderboard
```

### Handlers Adicionales

```
services/handlers/
├── craftingHandlers.ts
├── economyHandlers.ts
├── marketHandlers.ts
├── constructionHandlers.ts
├── clanHandlers.ts
├── raidHandlers.ts
├── bossRaidHandlers.ts
├── pvpHandlers.ts
├── fogataHandlers.ts
├── narrativeHandlers.ts
└── questHandlers.ts
```

### Services

```
services/
├── movementService.ts
├── resourceService.ts
├── craftingService.ts
├── tradeService.ts
├── dialogueService.ts
└── soundService.ts
```

### Pages Adicionales

```
pages/
├── Crafting/
├── Economy/
├── Marketplace/
├── Refuge/
├── Social/
├── Raids/
├── BossRaids/
├── Clan/
├── Map/
└── Progression/
```

### Components Adicionales

```
components/
├── ui/
│   ├── Modal.tsx
│   ├── Notification.tsx
│   ├── ProgressBar.tsx
│   ├── Badge.tsx
│   ├── Tooltip.tsx
│   └── Dropdown.tsx
├── game/
│   ├── Inventory.tsx
│   ├── QuestsList.tsx
│   ├── NPCList.tsx
│   ├── CraftingTable.tsx
│   ├── ShopPanel.tsx
│   └── TrustPanel.tsx
└── layout/
    ├── Sidebar.tsx
    ├── MiniMap.tsx
    └── LogPanel.tsx
```

---

## 🎯 ROADMAP DE MIGRACIÓN (Prioridad)

### Sprint 1 ✅ (Completado)

- [x] Setup React base
- [x] Stores principales (player, world, ui, combat)
- [x] WebSocket service + handlers básicos
- [x] Componentes UI base (Button, Card, TopBar, Shell)
- [x] Páginas Dashboard, NodeView, Combat

### Sprint 2 (1 semana)

- [ ] Inventario completo con drag & drop
- [ ] Sistema de crafteo
- [ ] Handlers: crafting, economy básico
- [ ] Components: Inventory, RecipeList, CraftingTable

### Sprint 3 (1 semana)

- [ ] Economía y Marketplace
- [ ] Handlers: economy, marketplace
- [ ] Pages: Economy, Marketplace
- [ ] Components: ShopPanel, MarketplaceListing

### Sprint 4 (1 semana)

- [ ] Sistema de Clanes completo
- [ ] Handlers: clan
- [ ] Store: clanStore
- [ ] Page: Clan

### Sprint 5 (1 semana)

- [ ] Social/Fogata
- [ ] Mini-juegos (dados)
- [ ] Handlers: fogata, games
- [ ] Store: socialStore
- [ ] Page: Social

### Sprint 6 (1 semana)

- [ ] Refugio y Construcción
- [ ] Handlers: construction
- [ ] Components: ConstructionPanel, RefugeStats
- [ ] Page: Refuge

### Sprint 7 (1 semana)

- [ ] Raids defensivos
- [ ] Handlers: raid
- [ ] Store: raidStore
- [ ] Page: Raids

### Sprint 8 (1 semana)

- [ ] Boss Raids completo
- [ ] Handlers: bossraid
- [ ] Store: bossRaidStore
- [ ] Page: BossRaids

### Sprint 9 (1 semana)

- [ ] PvP sistema
- [ ] Handlers: pvp
- [ ] Components: KarmaPanel, PvPLeaderboard

### Sprint 10 (1 semana)

- [ ] Radio/Walkie panel persistente
- [ ] Trust con NPCs
- [ ] Misiones narrativas
- [ ] Handlers: narrative, trust

### Sprint 11 (1 semana)

- [ ] Mapa global interactivo
- [ ] Onboarding tutorial
- [ ] Mobile responsive polish

### Sprint 12 (1 semana)

- [ ] Testing completo
- [ ] Performance optimization
- [ ] Documentación final
- [ ] Eliminar survival.html

---

## ⚠️ IMPORTANTE: REGLAS DE MIGRACIÓN

1. **NO copiar código línea por línea** - Rehacer con arquitectura React
2. **Mantener backend sin cambios** - Solo frontend se refactoriza
3. **Un sistema a la vez** - No migrar todo junto
4. **Testing obligatorio** - Testear cada feature antes de continuar
5. **Mantener survival.html** - Solo como referencia hasta finalizar migración
6. **Documentar cambios** - Actualizar este BLUEPRINT con cada sprint

---

## 🔗 CONECTORES BACKEND (sin cambios)

El frontend React consumirá los mismos endpoints que `survival.html`:

```
WebSocket: ws://localhost:3000
REST API: http://localhost:3000/api
```

**Mensajes WS soportados por backend actual:**

- 93+ message types server→client
- 78+ message types client→server

Ver `ARQUITECTURA_ACTUAL.md` para lista completa.

---

## 📝 TESTING CHECKLIST

Antes de marcar cada sprint como completo:

- [ ] No hay errores en consola
- [ ] TypeScript compila sin errores
- [ ] Handlers WS funcionan correctamente
- [ ] Stores se actualizan como esperado
- [ ] UI responde a cambios de estado
- [ ] No hay memory leaks
- [ ] Mobile responsive (si aplica)
- [ ] Documentación actualizada

---

**🎯 Estado Actual:** Sprint 1 completado ✅  
**📅 Próximo:** Sprint 2 - Inventario + Crafteo  
**⏱️ Tiempo estimado total:** 12 semanas
