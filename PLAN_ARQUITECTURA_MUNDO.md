# 🌍 PLAN DE ARQUITECTURA COMPLETO - MUNDO CON NODOS

## Z-SURVIVAL: Sistema de Mundo Vivo Multijugador

---

## 📋 ÍNDICE

1. [Visión General](#visión-general)
2. [Fases de Implementación](#fases-de-implementación)
3. [Arquitectura Técnica](#arquitectura-técnica)
4. [Sistema de Nodos](#sistema-de-nodos)
5. [Sistema de Movimiento](#sistema-de-movimiento)
6. [Sistema Multijugador](#sistema-multijugador)
7. [Sistema de Reclamación](#sistema-de-reclamación)
8. [NPCs y Rutinas](#npcs-y-rutinas)
9. [Sistema de Combate](#sistema-de-combate)
10. [Economía y Balance](#economía-y-balance)
11. [UI/UX](#uiux)
12. [Base de Datos](#base-de-datos)
13. [Anti-Griefing](#anti-griefing)
14. [Performance](#performance)

---

## 🎯 VISIÓN GENERAL

### Concepto Central

Un mundo post-apocalíptico **persistente** donde:

- Los jugadores se mueven en **tiempo real** entre nodos (no teletransporte)
- Pueden **reclamar ubicaciones** y convertirlas en refugios
- **NPCs vivos** con rutinas diarias
- **Multijugador** con visibilidad de otros jugadores
- **Economía orgánica** con múltiples refugios
- **Sistema de colapso lento** para tensión narrativa

### Pilares de Diseño

1. **Mundo Vivo**: NPCs y jugadores siempre en movimiento
2. **Consecuencias Reales**: Decisiones afectan el mundo permanentemente
3. **Tensión Constante**: No hay zonas 100% seguras
4. **Emergencia Narrativa**: Historias surgen de interacciones
5. **Balance Económico**: Sumideros para evitar inflación

---

## 📅 FASES DE IMPLEMENTACIÓN

### FASE 0: Infraestructura Base

**Objetivo**: Tener servidor corriendo y DB configurada

#### Tareas:

- [x] Servidor WebSocket funcionando
- [x] Base de datos PostgreSQL + esquema básico
- [ ] Sistema de autenticación JWT
- [ ] Deploy con Docker/Railway
- [ ] Backups automáticos
- [ ] Logs y monitoreo básico

**Entregable**: Servidor que acepta conexiones y guarda jugadores

---

### FASE 1: Sistema de Nodos Básico

**Objetivo**: Mundo con 5-10 nodos conectados navegables

#### Tareas:

1. **Definir Nodos Iniciales**:
   - Refugio Central (hub)
   - Farmacia Abandonada
   - Casa Abandonada
   - Bosque (recursos)
   - Supermercado Saqueado

2. **Crear Estructura de Nodos en DB**:

```sql
CREATE TABLE nodes (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  owner_id VARCHAR(50),
  stability INT DEFAULT 50,
  moral INT DEFAULT 50,
  cohesion INT DEFAULT 50,
  security INT DEFAULT 30,
  resources JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE node_connections (
  from_node VARCHAR(50) REFERENCES nodes(id),
  to_node VARCHAR(50) REFERENCES nodes(id),
  distance FLOAT NOT NULL,
  danger_level INT DEFAULT 30,
  active BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (from_node, to_node)
);
```

3. **Endpoints REST**:
   - `GET /api/nodes` - Lista todos los nodos visibles
   - `GET /api/nodes/:id` - Detalle de un nodo
   - `GET /api/nodes/:id/connections` - Nodos conectados

**Entregable**: Mapa navegable con 5+ nodos conectados

---

### FASE 2: Movimiento Entre Nodos en Tiempo Real

**Objetivo**: Los jugadores caminan entre nodos, no se teletransportan

#### Componentes:

1. **Cliente - Renderizado de Ruta**:

```javascript
class RouteRenderer {
  constructor(fromNode, toNode) {
    this.path = this.computePath(fromNode, toNode);
    this.startTime = Date.now();
    this.duration = this.path.distance * 1000; // 1 seg por unidad
    this.currentProgress = 0;
  }

  update(deltaTime) {
    this.currentProgress += deltaTime / this.duration;
    if (this.currentProgress >= 1) {
      return "arrived";
    }

    const pos = this.interpolatePosition(this.currentProgress);
    return pos;
  }

  interpolatePosition(t) {
    // Interpolar entre waypoints del path
    const segment = Math.floor(t * this.path.waypoints.length);
    const localT = (t * this.path.waypoints.length) % 1;

    const p1 = this.path.waypoints[segment];
    const p2 = this.path.waypoints[segment + 1] || p1;

    return {
      x: p1.x + (p2.x - p1.x) * localT,
      y: p1.y + (p2.y - p1.y) * localT,
    };
  }
}
```

2. **Servidor - Autoritativo**:

```javascript
server.on("player:move", (playerId, targetNodeId) => {
  const player = getPlayer(playerId);
  const route = pathfinder.findPath(player.currentNode, targetNodeId);

  // Crear registro de movimiento
  const movement = {
    playerId,
    fromNode: player.currentNode,
    toNode: targetNodeId,
    startTime: Date.now(),
    eta: route.distance * 1000,
    path: route.waypoints,
  };

  activeMovements.set(playerId, movement);

  // Broadcast a jugadores cercanos
  broadcastToAOI(player, "player:moving", {
    playerId,
    fromNode: movement.fromNode,
    toNode: movement.toNode,
    eta: movement.eta,
    path: movement.path,
  });

  // Programar llegada
  setTimeout(() => {
    handlePlayerArrival(playerId, targetNodeId);
  }, movement.eta);
});

function handlePlayerArrival(playerId, nodeId) {
  const player = getPlayer(playerId);
  player.currentNode = nodeId;
  activeMovements.delete(playerId);

  // Evento de llegada (puede triggear encuentros)
  triggerNodeEvents(player, nodeId);

  broadcastToAOI(player, "player:arrived", {
    playerId,
    nodeId,
  });
}
```

3. **Eventos en Ruta**:

```javascript
// Eventos aleatorios mientras viajas
function checkRouteEvents(player, route, progress) {
  const roll = Math.random();

  if (roll < (0.05 * route.dangerLevel) / 100) {
    // Encuentro con zombie
    triggerCombat(player, generateZombieEncounter());
  } else if (roll < 0.08) {
    // Recurso encontrado
    giveRandomResource(player);
  } else if (roll < 0.12 && otherPlayersNearby(player)) {
    // Encuentro con otro jugador
    triggerPlayerEncounter(player);
  }
}
```

**Entregable**: Jugador se mueve en tiempo real, ve su posición en el mapa, puede ser interceptado

---

### FASE 3: Multijugador - AOI (Area of Interest)

**Objetivo**: Ver otros jugadores en tiempo real sin colapsar el servidor

#### Implementación:

1. **Spatial Grid (cuadrícula espacial)**:

```javascript
class SpatialGrid {
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.cells = new Map(); // key: "x,y", value: Set<playerId>
  }

  getCellKey(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  addPlayer(player) {
    const key = this.getCellKey(player.x, player.y);
    if (!this.cells.has(key)) {
      this.cells.set(key, new Set());
    }
    this.cells.get(key).add(player.id);
  }

  removePlayer(player) {
    const key = this.getCellKey(player.x, player.y);
    this.cells.get(key)?.delete(player.id);
  }

  getNearbyPlayers(player, radius = 200) {
    const nearby = new Set();
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerX = Math.floor(player.x / this.cellSize);
    const centerY = Math.floor(player.y / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerX + dx},${centerY + dy}`;
        const cell = this.cells.get(key);
        if (cell) {
          cell.forEach((id) => {
            if (id !== player.id) nearby.add(id);
          });
        }
      }
    }

    return Array.from(nearby);
  }
}
```

2. **Subscripciones**:

```javascript
// Cada tick (100ms), actualizar subscripciones
setInterval(() => {
  for (const player of activePlayers.values()) {
    const nearbyIds = spatialGrid.getNearbyPlayers(player);
    const currentSubs = subscriptions.get(player.id) || new Set();

    // Nuevos jugadores visibles
    for (const nearbyId of nearbyIds) {
      if (!currentSubs.has(nearbyId)) {
        subscribeToPlayer(player.id, nearbyId);
      }
    }

    // Jugadores que ya no están cerca
    for (const subId of currentSubs) {
      if (!nearbyIds.includes(subId)) {
        unsubscribeFromPlayer(player.id, subId);
      }
    }
  }
}, 100);
```

3. **Broadcast Optimizado**:

```javascript
function broadcastToAOI(player, eventType, data) {
  const nearbyPlayers = spatialGrid.getNearbyPlayers(player);

  for (const nearbyId of nearbyPlayers) {
    const socket = playerSockets.get(nearbyId);
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: eventType,
          data,
        }),
      );
    }
  }
}
```

**Entregable**: Jugadores ven a otros jugadores cercanos, no reciben datos de jugadores lejanos

---

### FASE 4: Sistema de Reclamación de Nodos

**Objetivo**: Jugadores pueden tomar control de ubicaciones

#### Mecánica:

1. **Estados de Nodo**:
   - `unclaimed`: Nadie lo controla
   - `claiming`: Alguien lo está reclamando (vulnerable)
   - `claimed`: Controlado por un jugador/grupo
   - `contested`: Dos o más facciones disputan

2. **Proceso de Reclamación**:

```javascript
// Cliente solicita reclamación
socket.send({
  type: "node:claim",
  nodeId: "farmacia_01",
  resources: {
    madera: 50,
    comida: 30,
    materiales: 40,
  },
});

// Servidor valida
server.on("node:claim", (playerId, data) => {
  const node = nodes.get(data.nodeId);
  const player = players.get(playerId);

  // Validaciones
  if (node.owner) {
    return error("Nodo ya reclamado");
  }

  if (!hasResources(player, data.resources)) {
    return error("Recursos insuficientes");
  }

  // Deducir recursos
  deductResources(player, data.resources);

  // Iniciar fase de reclamación (48h)
  node.status = "claiming";
  node.claimant = playerId;
  node.claimStartTime = Date.now();
  node.claimEndTime = Date.now() + 48 * 60 * 60 * 1000;

  // Notificar a todos los jugadores cercanos
  broadcastToNode(node.id, "node:claim_started", {
    nodeId: node.id,
    claimant: player.name,
    endTime: node.claimEndTime,
  });

  // Programar confirmación automática
  setTimeout(
    () => {
      confirmClaim(node.id);
    },
    48 * 60 * 60 * 1000,
  );
});

function confirmClaim(nodeId) {
  const node = nodes.get(nodeId);

  if (node.status === "claiming") {
    node.owner = node.claimant;
    node.status = "claimed";
    node.claimedAt = Date.now();

    log(`${node.claimant} ha reclamado ${node.name}!`);

    broadcastGlobal("node:claimed", {
      nodeId,
      owner: node.owner,
    });
  }
}
```

3. **Disputas**:

```javascript
// Otro jugador puede disputar durante fase de reclamación
server.on("node:contest", (playerId, nodeId) => {
  const node = nodes.get(nodeId);

  if (node.status !== "claiming") {
    return error("No se puede disputar");
  }

  // Cambiar a estado contestado
  node.status = "contested";
  node.contestants.push(playerId);

  // Iniciar votación o combate
  resolveContest(node);
});
```

**Entregable**: Jugadores pueden reclamar nodos vacíos, defender durante fase vulnerable

---

### FASE 5: Defensas y Mejoras de Nodos

**Objetivo**: Los nodos reclamados pueden fortificarse

#### Sistema de Construcción:

```javascript
const DEFENSES = {
  muralla_madera: {
    name: "Muralla de Madera",
    cost: { madera: 100, materiales: 50 },
    buildTime: 3600000, // 1 hora
    hp: 500,
    defense: 20,
    slots: 1,
  },
  torre_vigilancia: {
    name: "Torre de Vigilancia",
    cost: { madera: 80, materiales: 60 },
    buildTime: 2400000,
    hp: 300,
    visionRange: 150,
    slots: 1,
  },
  trampa_espinas: {
    name: "Trampa de Espinas",
    cost: { materiales: 30, metal: 10 },
    buildTime: 600000,
    damage: 15,
    slots: 0.5,
  },
};

server.on("node:build_defense", (playerId, data) => {
  const { nodeId, defenseType } = data;
  const node = nodes.get(nodeId);

  // Validar propiedad
  if (node.owner !== playerId) {
    return error("No eres propietario");
  }

  const defense = DEFENSES[defenseType];

  // Validar recursos
  if (!hasResources(getPlayer(playerId), defense.cost)) {
    return error("Recursos insuficientes");
  }

  // Validar slots
  const usedSlots = node.defenses.reduce((sum, d) => sum + d.slots, 0);
  if (usedSlots + defense.slots > node.maxDefenseSlots) {
    return error("Sin espacio para más defensas");
  }

  // Deducir recursos
  deductResources(getPlayer(playerId), defense.cost);

  // Iniciar construcción
  const construction = {
    id: generateId(),
    type: defenseType,
    startTime: Date.now(),
    endTime: Date.now() + defense.buildTime,
    progress: 0,
  };

  node.constructions.push(construction);

  // Completar automáticamente
  setTimeout(() => {
    completeConstruction(nodeId, construction.id);
  }, defense.buildTime);
});
```

**Entregable**: Nodos pueden tener defensas, afectan indicadores de seguridad

---

### FASE 6: NPCs con Rutinas Diarias

**Objetivo**: Mundo se siente vivo con NPCs autónomos

#### Sistema de Rutinas:

```javascript
class NPC {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.role = data.role; // agricultor, guardia, comerciante
    this.currentNode = data.startNode;
    this.currentSubLocation = "plaza";
    this.routine = this.generateRoutine();
    this.state = "idle";
  }

  generateRoutine() {
    switch (this.role) {
      case "agricultor":
        return [
          { time: "06:00", location: "granja", activity: "trabajar" },
          { time: "12:00", location: "plaza", activity: "comer" },
          { time: "13:00", location: "granja", activity: "trabajar" },
          { time: "18:00", location: "taberna", activity: "socializar" },
          { time: "22:00", location: "viviendas", activity: "dormir" },
        ];

      case "guardia":
        return [
          { time: "06:00", location: "torre", activity: "vigilar" },
          { time: "14:00", location: "muralla", activity: "patrullar" },
          { time: "22:00", location: "viviendas", activity: "dormir" },
        ];

      case "comerciante":
        return [
          { time: "08:00", location: "plaza", activity: "comerciar" },
          { time: "12:00", location: "taberna", activity: "negociar" },
          { time: "20:00", location: "viviendas", activity: "dormir" },
        ];
    }
  }

  update(gameTime) {
    const currentHour = gameTime.getHours();
    const currentRoutine = this.findCurrentRoutine(currentHour);

    if (currentRoutine.location !== this.currentSubLocation) {
      this.moveTo(currentRoutine.location);
    }

    this.performActivity(currentRoutine.activity);
  }

  moveTo(location) {
    this.state = "moving";
    this.targetLocation = location;

    // Movimiento simple entre sub-locaciones
    setTimeout(() => {
      this.currentSubLocation = location;
      this.state = "idle";
    }, 3000);
  }

  performActivity(activity) {
    switch (activity) {
      case "trabajar":
        // Generar recursos para el nodo
        if (Math.random() < 0.1) {
          const node = nodes.get(this.currentNode);
          node.resources.comida += 1;
        }
        break;

      case "vigilar":
        // Reducir chance de ataque zombie
        const node = nodes.get(this.currentNode);
        node.security += 0.1;
        break;

      case "comerciar":
        // Disponible para trading con jugadores
        this.state = "trading";
        break;
    }
  }
}

// Tick global de NPCs (cada 10 segundos)
setInterval(() => {
  for (const npc of npcs.values()) {
    npc.update(gameTime);
  }
}, 10000);
```

**Entregable**: NPCs se mueven por el refugio según horario, generan recursos, ofrecen servicios

---

### FASE 7: Sistema de Colapso Lento

**Objetivo**: Tensión narrativa con posible caída de refugios

#### Indicadores de Salud:

```javascript
class NodeHealth {
  constructor(node) {
    this.node = node;
    this.indicators = {
      stability: 75, // Infraestructura
      moral: 70, // Estado anímico
      cohesion: 65, // Unidad social
      resources: 60, // Reservas
      security: 50, // Defensa
    };
  }

  update() {
    // Decaimiento natural
    this.indicators.resources -= 0.5;

    // Eventos que erosionan
    if (this.node.underAttack) {
      this.indicators.security -= 2;
      this.indicators.moral -= 1;
    }

    if (this.indicators.resources < 20) {
      this.indicators.moral -= 1.5;
      this.indicators.cohesion -= 1;
    }

    // Chequear crisis
    const criticalIndicators = Object.values(this.indicators).filter(
      (v) => v < 30,
    ).length;

    if (criticalIndicators >= 2) {
      this.triggerCrisis();
    }
  }

  triggerCrisis() {
    this.node.status = "crisis";

    // Efectos:
    // - Producción -60%
    // - NPCs pueden huir
    // - Spawn de zombies internos
    // - Moral sigue cayendo

    broadcastToNode(this.node.id, "node:crisis", {
      nodeId: this.node.id,
      indicators: this.indicators,
    });
  }

  restore(indicator, amount) {
    this.indicators[indicator] = Math.min(
      100,
      this.indicators[indicator] + amount,
    );

    // Salir de crisis si todos > 40
    if (
      this.node.status === "crisis" &&
      Object.values(this.indicators).every((v) => v > 40)
    ) {
      this.node.status = "claimed";
      broadcastToNode(this.node.id, "node:crisis_resolved", {
        nodeId: this.node.id,
      });
    }
  }
}
```

**Entregable**: Refugios pueden entrar en crisis, requieren mantenimiento activo

---

### FASE 8: Economía y Mercado

**Objetivo**: Sistema económico auto-regulado

#### Componentes:

1. **Mercado Local** (P2P):

```javascript
server.on("market:create_listing", (playerId, data) => {
  const listing = {
    id: generateId(),
    seller: playerId,
    nodeId: data.nodeId,
    item: data.item,
    quantity: data.quantity,
    price: data.price,
    createdAt: Date.now(),
    expireAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  marketListings.set(listing.id, listing);

  broadcastToNode(data.nodeId, "market:new_listing", listing);
});

server.on("market:buy", (playerId, listingId) => {
  const listing = marketListings.get(listingId);
  const buyer = players.get(playerId);
  const seller = players.get(listing.seller);

  // Validar recursos del comprador
  if (buyer.currency < listing.price) {
    return error("Sin recursos suficientes");
  }

  // Transferir
  buyer.currency -= listing.price;
  seller.currency += listing.price;

  transferItem(seller, buyer, listing.item, listing.quantity);

  // Eliminar listing
  marketListings.delete(listingId);

  log(`${buyer.name} compró ${listing.item} a ${seller.name}`);
});
```

2. **Sumideros Económicos**:

```javascript
// Mantenimiento de defensas
setInterval(() => {
  for (const node of nodes.values()) {
    if (node.owner) {
      const maintenanceCost = calculateMaintenanceCost(node);

      const owner = players.get(node.owner);
      if (owner.resources.comida >= maintenanceCost.comida) {
        owner.resources.comida -= maintenanceCost.comida;
      } else {
        // Penalidad: defensas se degradan
        degradeDefenses(node);
      }
    }
  }
}, 3600000); // Cada 1 hora
```

**Entregable**: Economía funcional con inflación controlada

---

### FASE 9: Sistema de Asedios

**Objetivo**: PvP estructurado y balanceado

```javascript
server.on("siege:declare", (attackerId, targetNodeId) => {
  const node = nodes.get(targetNodeId);
  const attacker = players.get(attackerId);

  // Costo de declaración (anti-spam)
  if (attacker.resources.materiales < 200) {
    return error("Recursos insuficientes para asedio");
  }

  attacker.resources.materiales -= 200;

  // Crear ventana de asedio
  const siege = {
    id: generateId(),
    nodeId: targetNodeId,
    attacker: attackerId,
    defender: node.owner,
    startTime: Date.now() + 24 * 60 * 60 * 1000, // 24h preparación
    duration: 2 * 60 * 60 * 1000, // 2h de asedio
    status: "preparation",
  };

  activeSieges.set(siege.id, siege);

  // Notificar global
  broadcastGlobal("siege:declared", {
    siegeId: siege.id,
    attacker: attacker.name,
    defender: players.get(node.owner).name,
    nodeId: targetNodeId,
    startTime: siege.startTime,
  });

  // Programar inicio
  setTimeout(
    () => {
      startSiege(siege.id);
    },
    24 * 60 * 60 * 1000,
  );
});

function startSiege(siegeId) {
  const siege = activeSieges.get(siegeId);
  siege.status = "active";

  const node = nodes.get(siege.nodeId);
  node.underAttack = true;

  // Mecánica de asedio (simplificada)
  const attackPower = calculateAttackPower(siege.attacker);
  const defensePower = calculateDefensePower(node);

  // Resolución por fases cada 10 min
  // ...
}
```

**Entregable**: PvP con reglas claras, cooldowns, costo de entrada

---

### FASE 10: UI/UX Completa

**Objetivo**: Interfaz intuitiva para toda la complejidad

#### Pantallas Clave:

1. **Mapa Global** (navegación principal)
2. **Vista de Nodo** (cuando estás dentro)
3. **Panel de Viaje** (durante movimiento)
4. **Panel de Reclamación** (gestión de nodos propios)
5. **Mercado** (trading)
6. **Social** (chat, grupos, diplomacia)

#### Componentes UI:

```javascript
// Mini-mapa siempre visible
<div id="minimap" style="position: fixed; bottom: 20px; right: 20px;">
  <canvas width="200" height="200"></canvas>
  <div id="nearby-players">
    <!-- Lista de jugadores cercanos -->
  </div>
</div>

// Barra de viaje
<div id="travel-bar" v-if="player.traveling" style="position: fixed; top: 60px; left: 50%; transform: translateX(-50%);">
  <div class="travel-progress">
    <div class="progress-bar" :style="`width: ${travelProgress}%`"></div>
  </div>
  <div>
    Viajando a {{ destination.name }} - ETA: {{ eta }}
    <button @click="cancelTravel">Cancelar (costo stamina)</button>
  </div>
</div>
```

**Entregable**: Todas las funcionalidades accesibles desde UI clara

---

## 🛠️ ARQUITECTURA TÉCNICA

### Stack Recomendado

**Backend**:

- Node.js 20+ (o Bun para performance)
- WebSocket (ws library)
- PostgreSQL 15
- Redis (para cache y AOI)

**Frontend**:

- Vanilla JS o Vue 3 (ligero)
- Canvas 2D para renderizado
- WebSocket nativo

### Estructura de Archivos

```
server/
├── core/
│   ├── EventBus.js
│   ├── GameLoop.js
│   ├── SpatialGrid.js
├── systems/
│   ├── NodeSystem.js
│   ├── MovementSystem.js
│   ├── NPCSystem.js
│   ├── CombatSystem.js
│   ├── EconomySystem.js
│   ├── SiegeSystem.js
├── managers/
│   ├── PlayerManager.js
│   ├── NodeManager.js
│   ├── MarketManager.js
├── data/
│   ├── nodeDefinitions.json
│   ├── npcRoles.json
│   ├── recipes.json
├── db/
│   ├── schema.sql
│   ├── migrations/
│   ├── queries/
└── index.js

client/
├── core/
│   ├── GameClient.js
│   ├── Renderer.js
│   ├── InputManager.js
├── systems/
│   ├── MovementRenderer.js
│   ├── MapRenderer.js
│   ├── UIManager.js
├── assets/
│   ├── sprites/
│   ├── sounds/
└── index.html
```

---

## 📊 BASE DE DATOS

### Esquema Completo

```sql
-- Jugadores
CREATE TABLE players (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  current_node VARCHAR(50),
  x FLOAT DEFAULT 0,
  y FLOAT DEFAULT 0,
  hp INT DEFAULT 100,
  max_hp INT DEFAULT 100,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  currency INT DEFAULT 0,
  inventory JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  group_id VARCHAR(50),
  reputation INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- Nodos
CREATE TABLE nodes (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  owner_id VARCHAR(50) REFERENCES players(id),
  status VARCHAR(20) DEFAULT 'unclaimed',
  stability INT DEFAULT 50,
  moral INT DEFAULT 50,
  cohesion INT DEFAULT 50,
  security INT DEFAULT 30,
  resources JSONB DEFAULT '{}',
  defenses JSONB DEFAULT '[]',
  max_defense_slots INT DEFAULT 5,
  metadata JSONB DEFAULT '{}',
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conexiones entre nodos
CREATE TABLE node_connections (
  from_node VARCHAR(50) REFERENCES nodes(id),
  to_node VARCHAR(50) REFERENCES nodes(id),
  distance FLOAT NOT NULL,
  danger_level INT DEFAULT 30,
  active BOOLEAN DEFAULT TRUE,
  waypoints JSONB DEFAULT '[]',
  PRIMARY KEY (from_node, to_node)
);

-- NPCs
CREATE TABLE npcs (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(30) NOT NULL,
  current_node VARCHAR(50) REFERENCES nodes(id),
  current_sublocation VARCHAR(50),
  state VARCHAR(20) DEFAULT 'idle',
  routine JSONB DEFAULT '[]',
  memory JSONB DEFAULT '{}',
  relations JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Movimientos activos
CREATE TABLE active_movements (
  player_id VARCHAR(50) REFERENCES players(id) PRIMARY KEY,
  from_node VARCHAR(50) REFERENCES nodes(id),
  to_node VARCHAR(50) REFERENCES nodes(id),
  start_time BIGINT NOT NULL,
  eta BIGINT NOT NULL,
  path JSONB NOT NULL
);

-- Reclamaciones
CREATE TABLE node_claims (
  id VARCHAR(50) PRIMARY KEY,
  node_id VARCHAR(50) REFERENCES nodes(id),
  claimant_id VARCHAR(50) REFERENCES players(id),
  status VARCHAR(20) DEFAULT 'claiming',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  contested BOOLEAN DEFAULT FALSE,
  contestants JSONB DEFAULT '[]'
);

-- Asedios
CREATE TABLE sieges (
  id VARCHAR(50) PRIMARY KEY,
  node_id VARCHAR(50) REFERENCES nodes(id),
  attacker_id VARCHAR(50) REFERENCES players(id),
  defender_id VARCHAR(50) REFERENCES players(id),
  status VARCHAR(20) DEFAULT 'preparation',
  start_time TIMESTAMP NOT NULL,
  duration BIGINT NOT NULL,
  result VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mercado
CREATE TABLE market_listings (
  id VARCHAR(50) PRIMARY KEY,
  seller_id VARCHAR(50) REFERENCES players(id),
  node_id VARCHAR(50) REFERENCES nodes(id),
  item VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  price INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Eventos históricos
CREATE TABLE world_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  node_id VARCHAR(50),
  player_id VARCHAR(50),
  payload JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Grupos/Facciones
CREATE TABLE groups (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  leader_id VARCHAR(50) REFERENCES players(id),
  members JSONB DEFAULT '[]',
  controlled_nodes JSONB DEFAULT '[]',
  treasury JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_players_node ON players(current_node);
CREATE INDEX idx_npcs_node ON npcs(current_node);
CREATE INDEX idx_market_node ON market_listings(node_id);
CREATE INDEX idx_events_timestamp ON world_events(timestamp);
CREATE INDEX idx_events_node ON world_events(node_id);
```

---

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### Crítico (hacer YA):

1. ✅ Servidor WebSocket funcionando
2. ✅ DB schema básico
3. ⚠️ Sistema de nodos navegables (5 nodos iniciales)
4. ⚠️ Movimiento entre nodos con interpolación
5. ⚠️ AOI básico (spatial grid)

### Alta (siguiente sprint):

6. Sistema de reclamación básico
7. NPCs con rutinas simples
8. Mercado local P2P
9. Sistema de defensas (3-4 tipos)

### Media (después):

10. Sistema de colapso lento
11. Asedios PvP
12. Eventos narrativos globales
13. UI refinada

### Baja (polish):

14. Cosmética
15. Achievements
16. Leaderboards
17. Animaciones avanzadas

---

## 🚨 ANTI-GRIEFING

### Reglas:

1. **Cooldowns**: Atacar mismo nodo → 48h cooldown
2. **Costos**: Declarar asedio cuesta recursos
3. **Reputación**: Atacar sin causa baja reputación
4. **Loot Caps**: Máximo 30% de recursos del nodo
5. **Protección Nuevos**: Jugadores <nivel 10 inmunes
6. **Logs**: Todas las acciones quedan registradas
7. **Moderación**: Panel admin para revisar abusos

---

## 📈 PERFORMANCE

### Optimizaciones:

- **Rate limiting**: 10 msg/segundo por jugador
- **Batch updates**: Enviar posiciones cada 100ms
- **Spatial partitioning**: Solo enviar datos cercanos
- **DB indexing**: Índices en queries frecuentes
- **Redis cache**: Estados temporales en memoria
- **Lazy loading**: Chunks del mundo según cercanía

---

## 🎮 PRÓXIMOS PASOS INMEDIATOS

1. Terminar **sistema de nodos básico** con 5 ubicaciones
2. Implementar **pathfinding simple** entre nodos
3. Crear **interpolación client-side** para movimiento suave
4. Implementar **spatial grid** para AOI
5. UI: **panel de viaje** con mapa y ETA

---

## 📝 NOTAS FINALES

Este documento es **vivo** — lo actualizamos a medida que avanzamos.

**Filosofía**: Iterativo. Hacer lo mínimo funcional de cada fase antes de pasar a la siguiente.

**Meta actual**: Tener mundo navegable con 5 nodos, movimiento real y visibilidad de otros jugadores.

**Cuando tengamos eso**, expandimos a reclamación y economía.
