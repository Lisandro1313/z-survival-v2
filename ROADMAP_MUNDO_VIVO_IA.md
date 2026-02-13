# 🌟 SISTEMA SOCIAL Y MUNDO VIVO - Implementación y Roadmap

## ✅ **LO QUE ACABAMOS DE IMPLEMENTAR (Fase 1)**

### 🔧 Errores Corregidos

1. ✅ **Error `showNarrativeMissionCompleted`**: Manejo seguro de `summary` undefined
2. ✅ **Error `addWorldLog`**: Cambiado a `worldLog` correctamente
3. ✅ **Eventos especiales**: Ahora se limpian después de completarse
4. ✅ **Limpieza de código**: Eliminadas funciones duplicadas en `messageHandlers.js`

### 🔥 Sistema Social: LA FOGATA

Un espacio social tipo "foro/red social" donde los jugadores comparten historias mientras están en el refugio.

**Características:**

- ✍️ **Crear posts** con título, contenido y categoría
- 📖 Categorías: Historia, Consejo, Pregunta, Busco Grupo, Comercio, General
- ❤️ **Sistema de likes** en posts
- 💬 **Comentarios** en posts
- 🔒 **Restricción por locación**: Solo accesible en Refugio Central
- ⏰ **Timestamps** con "hace x tiempo"
- 👤 **Perfiles visibles**: Nombre del autor en cada post

**Interfaz:**

```
🔥 LA FOGATA DEL REFUGIO
┌─────────────────────────────────────────┐
│ ✍️ Compartir en la Fogata               │
│ [Título]                                 │
│ [Contenido - textarea]                   │
│ [Categoría ▼] [🔥 Publicar]             │
└─────────────────────────────────────────┘

Posts recientes con:
- ❤️ Likes | 💬 Comentarios | ✍️ Comentar
```

### 🎲 Sistema de Juegos de Mesa

Juegos con apuestas de recursos, solo en el Refugio Central.

**Juegos Disponibles:**

1. 🃏 **Poker** - Juego clásico con apuestas
2. 🎲 **Dados** - Juego rápido de suerte
3. 🎰 **Ruleta** - Suerte pura
4. 🎴 **Blackjack** - 21 clásico

**Características:**

- 💰 **Apuestas de recursos** (comida mínimo 5)
- 👥 **Partidas multijugador** (2-6 jugadores según el juego)
- 🎮 **Salas activas** visibles con lista de jugadores
- 🏆 **Pozo acumulativo** que se reparte al ganador
- 🔒 **Restricción por locación**: Solo en Refugio Central

**Interfaz:**

```
🎲 MESA DE JUEGOS
┌──────────┬──────────┐
│ 🃏 POKER  │ 🎲 DADOS  │
│ 2 jugadores│ 0 jugadores│
└──────────┴──────────┘
┌──────────┬──────────┐
│ 🎰 RULETA│ 🎴 BLACKJACK│
│ 1 jugador│ 0 jugadores│
└──────────┴──────────┘
```

### 💬 Chat Mejorado

- 🌐 **Chat Global**: Para todos los jugadores
- 👥 **Chat de Grupo**: Solo para miembros del grupo
- Sistema más limpio e integrado

---

## 🚧 **FASE 2: BACKEND PARA SISTEMAS SOCIALES** (Próximo)

### Server-Side Necesario

**1. Sistema de Posts (Fogata)**

```javascript
// En server/survival_mvp.js - Agregar handlers:

// Base de datos para posts
const POSTS_DB = [];
const COMMENTS_DB = [];

handlers["fogata:create"] = (ws, data) => {
  const post = {
    id: generateId(),
    authorId: player.id,
    authorName: player.nombre,
    title: data.title,
    content: data.content,
    category: data.category,
    timestamp: Date.now(),
    likes: [],
    commentCount: 0,
  };

  POSTS_DB.push(post);

  ws.send(
    JSON.stringify({
      type: "fogata:created",
      post,
    }),
  );

  // Broadcast a todos en el refugio
  broadcastToLocation("refugio", {
    type: "fogata:posts",
    posts: getRecentPosts(),
  });
};

handlers["fogata:load"] = (ws, data) => {
  ws.send(
    JSON.stringify({
      type: "fogata:posts",
      posts: getRecentPosts(),
    }),
  );
};

handlers["fogata:like"] = (ws, data) => {
  const post = POSTS_DB.find((p) => p.id === data.postId);
  if (!post) return;

  const likeIndex = post.likes.indexOf(player.id);
  if (likeIndex === -1) {
    post.likes.push(player.id);
  } else {
    post.likes.splice(likeIndex, 1); // Unlike
  }

  broadcastToLocation("refugio", {
    type: "fogata:posts",
    posts: getRecentPosts(),
  });
};

handlers["fogata:comment"] = (ws, data) => {
  const comment = {
    id: generateId(),
    postId: data.postId,
    authorId: player.id,
    authorName: player.nombre,
    text: data.comment,
    timestamp: Date.now(),
  };

  COMMENTS_DB.push(comment);

  const post = POSTS_DB.find((p) => p.id === data.postId);
  if (post) post.commentCount++;

  ws.send(JSON.stringify({ type: "fogata:commented" }));
};

handlers["fogata:loadComments"] = (ws, data) => {
  const comments = COMMENTS_DB.filter((c) => c.postId === data.postId);

  ws.send(
    JSON.stringify({
      type: "fogata:comments",
      postId: data.postId,
      comments,
    }),
  );
};
```

**2. Sistema de Juegos**

```javascript
// Estado de juegos activos
const ACTIVE_GAMES = [];

handlers["game:join"] = (ws, data) => {
  // Verificar inventario
  if (!player.inventario.comida || player.inventario.comida < data.bet) {
    return sendError(ws, "No tienes suficiente comida");
  }

  // Buscar juego disponible o crear uno nuevo
  let game = ACTIVE_GAMES.find(
    (g) =>
      g.type === data.gameType &&
      g.status === "waiting" &&
      g.players.length < g.maxPlayers,
  );

  if (!game) {
    game = createNewGame(data.gameType);
    ACTIVE_GAMES.push(game);
  }

  // Agregar jugador
  game.players.push({
    id: player.id,
    name: player.nombre,
    bet: data.bet,
  });
  game.pot += data.bet;

  // Descontar apuesta
  player.inventario.comida -= data.bet;

  ws.send(
    JSON.stringify({
      type: "game:joined",
      gameType: data.gameType,
      game,
    }),
  );

  // Si hay suficientes jugadores, iniciar
  if (game.players.length >= game.minPlayers) {
    setTimeout(() => playGame(game), 3000);
  }
};

function playGame(game) {
  // Lógica del juego (random por ahora)
  const winner = game.players[Math.floor(Math.random() * game.players.length)];

  // Dar premio al ganador
  const winnerPlayer = WORLD.players[winner.id];
  if (winnerPlayer) {
    winnerPlayer.inventario.comida += game.pot;
  }

  // Notificar a todos los jugadores
  game.players.forEach((p) => {
    const connection = connections.get(p.id);
    if (connection) {
      connection.send(
        JSON.stringify({
          type: "game:result",
          winner: winner.id,
          winnerName: winner.name,
          prize: game.pot,
          inventory: WORLD.players[p.id].inventario,
        }),
      );
    }
  });

  // Remover juego
  const index = ACTIVE_GAMES.indexOf(game);
  if (index > -1) ACTIVE_GAMES.splice(index, 1);
}
```

---

## 🌟 **FASE 3: MUNDO VIVO CON IA** (Visión a Largo Plazo)

### Concepto Principal

> Un mundo virtual donde NPCs controlados por IA **VIVEN** - tienen necesidades, objetivos, relaciones, toman decisiones, y pueden morir. Los jugadores entran a este mundo vivo y coexisten con personajes IA.

### Características del Mundo Vivo

#### 🤖 **NPCs con IA Avanzada**

**1. Sistema de Necesidades**

```javascript
const NPC = {
  id: "npc_maria",
  nombre: "María",
  historia: "Enfermera que perdió a su familia...",

  // Estado vital
  salud: 100,
  hambre: 30,
  sed: 20,
  cansancio: 40,
  moral: 60,

  // Personalidad
  personalidad: {
    valiente: 0.7,
    social: 0.9,
    egoista: 0.2,
    optimista: 0.6,
  },

  // Habilidades
  habilidades: {
    medicina: 9,
    combate: 3,
    scavenging: 5,
    cocina: 7,
  },

  // Relaciones con otros NPCs
  relaciones: {
    npc_juan: 85, // Amor/amistad fuerte
    npc_pedro: -40, // Conflicto
  },

  // Estado mental
  emociones: {
    feliz: 0.5,
    estresado: 0.7,
    asustado: 0.3,
  },

  // Inventario personal
  inventario: {
    comida: 3,
    medicinas: 8,
    arma: 0,
  },

  // Objetivos actuales (generados por IA)
  objetivos: [
    {
      tipo: "sobrevivir",
      prioridad: 10,
      accion: "buscar_comida",
    },
    {
      tipo: "social",
      prioridad: 7,
      accion: "hablar_con_juan",
    },
  ],
};
```

**2. Sistema de Decisiones de IA**

```javascript
// Cada tick (30s), cada NPC toma decisiones

function npcTakeTurn(npc) {
  // 1. Evaluar estado y necesidades
  const urgencias = evaluateNeeds(npc);

  // 2. Generar opciones usando IA
  const opciones = await generateAIDecisions(npc, urgencias, WORLD);

  // 3. Ejecutar mejor opción
  const accion = selectBestAction(opciones, npc.personalidad);

  // 4. Ejecutar y actualizar mundo
  executeNPCAction(npc, accion);

  // 5. Generar eventos si es interesante
  if (accion.esInteresante) {
    broadcastWorldEvent({
      tipo: 'npc_action',
      npc: npc.nombre,
      accion: accion.descripcion,
      timestamp: Date.now()
    });
  }
}

// Integración con IA (Claude/GPT)
async function generateAIDecisions(npc, context, world) {
  const prompt = `
# NPC Decision Making

Eres ${npc.nombre}, ${npc.historia}

## Tu Estado Actual:
- Salud: ${npc.salud}/100
- Hambre: ${npc.hambre}/100 ${npc.hambre > 70 ? '⚠️ URGENTE' : ''}
- Moral: ${npc.moral}/100
- Emociones: ${JSON.stringify(npc.emociones)}

## Situación del Refugio:
- Comida disponible: ${world.locations.refugio.recursos.comida}
- Otros NPCs presentes: ${world.npcs.filter(n => n.locacion === 'refugio').map(n => n.nombre).join(', ')}
- Jugadores presentes: ${world.players.filter(p => p.locacion === 'refugio').length}

## Relaciones:
${Object.entries(npc.relaciones).map(([id, val]) => `- ${getNPCName(id)}: ${val > 0 ? '❤️' : '💢'} ${val}`).join('\n')}

## Tus opciones realistas:
1. Buscar comida en ${getLocationsNearby(npc.locacion).join(', ')}
2. Hablar con otros NPCs (mejorar relaciones, pedir ayuda)
3. Descansar (recuperar cansancio)
4. Jugar juegos de mesa (mejorar moral, socializar)
5. Ayudar en tareas del refugio
6. Resolver conflictos con NPCs con mala relación

Genera 3-5 acciones específicas que tomarías ahora, priorizadas.
Responde en JSON: [{ accion, razon, prioridad, riesgo }]
`;

  const response = await callAI(prompt);
  return JSON.parse(response);
}
```

**3. Ciclos de Vida**

```javascript
// NPCs pueden morir y nacer
function checkNPCVitals(npc) {
  // Muerte por hambre
  if (npc.hambre > 100) {
    killNPC(npc, 'murió de hambre');
    spawnNewNPC(); // Nace un nuevo superviviente
  }

  // Muerte por daño
  if (npc.salud <= 0) {
    killNPC(npc, 'murió por heridas');
    spawnNewNPC();
  }

  // Suicidio por moral baja
  if (npc.moral < 5 && Math.random() < 0.05) {
    killNPC(npc, 'se quitó la vida');
    createQuestAboutSuicide(npc);
  }
}

function spawnNewNPC() {
  const newNPC = await generateNPCWithAI({
    prompt: 'Crea un nuevo superviviente con historia, habilidades y personalidad única'
  });

  WORLD.npcs.push(newNPC);

  broadcastWorldEvent({
    tipo: 'nuevo_superviviente',
    mensaje: `${newNPC.nombre} llegó al refugio. ${newNPC.historia}`
  });
}
```

**4. Generación Dinámica de Misiones por IA**

```javascript
// La IA genera misiones basadas en dramas del mundo
async function generateDynamicQuest(trigger) {
  const prompt = `
El mundo zombie:
- NPCs: ${JSON.stringify(WORLD.npcs.map((n) => ({ nombre: n.nombre, estado: n.hambre > 70 ? "hambriento" : "ok", relaciones: n.relaciones })))}
- Recursos refugio: ${JSON.stringify(WORLD.locations.refugio.recursos)}
- Eventos recientes: ${getRecentEvents()}

Algo acaba de pasar: ${trigger}

Genera una misión que los JUGADORES puedan completar para ayudar con esta situación.

JSON: {
  titulo: string,
  descripcion: string,
  objetivos: [{ tipo, cantidad, descripcion }],
  recompensas: { xp, oro, items },
  urgencia: 1-10,
  expiraEn: minutos
}
`;

  const quest = await callAI(prompt);

  // Publicar misión
  WORLD.dynamicQuests.push(quest);
  broadcastToAll({
    type: "nueva_quest",
    quest,
  });
}

// Triggers de eventos
// - NPC hambriento
// - Conflicto entre NPCs
// - NPC enfermo
// - Horda de zombies
// - Recursos bajos
// - NPC perdido en exploración
```

**5. Diálogos Dinámicos con IA**

```javascript
// Cuando jugador habla con NPC
async function handleDialogue(playerId, npcId) {
  const npc = getNPC(npcId);
  const player = getPlayer(playerId);

  const prompt = `
Eres ${npc.nombre}. ${npc.historia}

Estado emocional: ${JSON.stringify(npc.emociones)}
Relación con ${player.nombre}: ${npc.relaciones[playerId] || 0}/100

${player.nombre} se acerca a hablar contigo.

Genera un diálogo natural de 2-3 líneas que refleje tu personalidad y estado actual.
Ofrece 3 opciones de respuesta que el jugador pueda elegir.

JSON: {
  dialogo: string,
  opciones: [{ texto, consecuencia }]
}
`;

  const dialogue = await callAI(prompt);

  sendToPlayer(playerId, {
    type: "dialogue:options",
    npc: npc.nombre,
    ...dialogue,
  });
}
```

### Implementación Técnica

**1. Backend con IA**

```javascript
// En server/ai/worldEngine.js

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function runAITick() {
  // Cada 2-5 minutos, hacer un análisis del mundo
  const worldState = summarizeWorld(WORLD);

  const prompt = `
Eres el "Game Master" de un mundo zombie vivo.

Estado actual: ${worldState}

Analiza el estado y genera:
1. 1-2 eventos interesantes que deberían pasar
2. 1-2 misiones que los jugadores podrían hacer
3. Cambios en relaciones entre NPCs
4. Nuevas historias emergentes

JSON: { eventos, quests, relacionesCambiadas, historiasEmergentes }
`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const result = JSON.parse(response.content[0].text);

  // Aplicar cambios al mundo
  applyAIChanges(result, WORLD);
}
```

**2. Base de Datos para Historia**

```sql
-- Trackear toda la historia del mundo
CREATE TABLE world_history (
  id INTEGER PRIMARY KEY,
  timestamp INTEGER,
  event_type TEXT,
  event_data JSON,
  npcs_involved TEXT,
  players_involved TEXT,
  importance INTEGER
);

-- Relaciones NPC
CREATE TABLE npc_relationships (
  npc1_id TEXT,
  npc2_id TEXT,
  value INTEGER,
  history JSON, -- [{timestamp, event, change}]
  PRIMARY KEY (npc1_id, npc2_id)
);

-- NPCs muertos (para recordar)
CREATE TABLE dead_npcs (
  id TEXT PRIMARY KEY,
  nombre TEXT,
  causa_muerte TEXT,
  timestamp INTEGER,
  historia TEXT,
  impacto_refugio INTEGER
);
```

---

## 📊 **PRIORIDADES DE DESARROLLO**

### Immediate (Esta semana)

1. ✅ Sistema social frontend (HECHO)
2. 🔧 Backend para fogata y posts
3. 🔧 Backend para juegos de mesa básicos

### Short-term (2-3 semanas)

1. Sistema de persistencia para posts (SQLite)
2. Lógica de juegos de mesa completa
3. Sistema de logros sociales

### Medium-term (1-2 meses)

1. IA para diálogos dinámicos con NPCs
2. Sistema de necesidades para NPCs
3. Generación de misiones por IA
4. Sistema de relaciones complejas

### Long-term (3-6 meses)

1. Mundo completamente vivo con IA
2. NPCs que nacen/mueren con ciclos de vida
3. Historias emergentes generadas por IA
4. Sistema de "memoria" del refugio

---

## 💡 **CONSEJOS PARA IMPLEMENTACIÓN**

### 1. IA Cost-Effective

- No llamar IA en cada tick
- Cache de decisiones comunes
- IA solo para momentos "interesantes"
- Usar modelos pequeños para decisiones simples

### 2. Performance

- NPCs toman turnos escalonados (no todos a la vez)
- Priorizar NPCs cerca de jugadores
- Sistema de "sleeping NPCs" cuando no hay jugadores

### 3. Balance

- IA puede ser impredecible → tener límites
- No permitir que IA rompa economía del juego
- Validar acciones de IA antes de aplicarlas

---

## 🎯 **VISIÓN FINAL**

Un juego donde:

- 🤖 NPCs viven vidas reales (comen, duermen, socializan, tienen conflictos)
- 🎭 Historias emergen orgánicamente (romances, rivalidades, traiciones)
- 👥 Jugadores observan y participan en este mundo vivo
- 🎮 Contenido infinito generado por IA pero con coherencia
- 🏆 Cada partida es única porque el mundo evoluciona diferente

**Ejemplo de sesión ideal:**

```
Día 1: María y Juan se enamoran
Día 3: Pedro está celoso, crea conflicto
Día 5: Misión generada: "Reunir suministros para boda de María y Juan"
Día 7: Pedro sabotea la misión
Día 10: Jugadores deben elegir: ¿Expulsar a Pedro o mediar?
Día 15: Nuevo NPC llega escapando de otra colonia
Día 20: El NPC nuevo trae noticias de un refugio mejor
...
```

Cada decisión cuenta. Cada jugador importa. El mundo VIVE.

**¡Vamos a crear el juego de supervivencia más inmersivo y social que existe!** 🚀
