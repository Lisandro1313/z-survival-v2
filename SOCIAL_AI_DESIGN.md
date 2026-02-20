# 🧠 SOCIAL AI SYSTEM - Arquitectura Completa

## 1. Visión

Agentes autónomos que viven en tu WorldState: sienten, recuerdan, se relacionan, actúan, compran, se enamoran, discuten y generan drama emergente — pero con límites para mantener estabilidad del mundo y experiencia de jugador.

## 2. Principios de Diseño

- ✅ **Servidor = source of truth**. Frontend no decide estado crítico.
- ✅ **Separación de responsabilidades**. WorldGraph, Entities, AISimulation, Combat, Economy y Events son módulos independientes.
- ✅ **Híbrido/controlado**: emergente local, topes globales (población, violencia, inflación).
- ✅ **Escalable**: simulación por regiones (workers), snapshot/deltas y AOI.
- ✅ **Explicabilidad + observabilidad**: debug UI para ver motivos de cada acción.
- ✅ **Seguridad y ética**: consentimiento para interacciones adultas, bloqueo de abuso y no generar pornografía o contenido ilegal en texto explícito.

## 3. Arquitectura Macro

```
Backend
├─ WorldManager (WorldGraph + Node metadata)
├─ EntityManager (entities: players, NPCs, zombies)
├─ AISimulationEngine (per-region workers)
│   ├─ AgentRegistry
│   ├─ NeedsEngine
│   ├─ DecisionEngine
│   ├─ MemoryEngine
│   ├─ RelationshipEngine
│   ├─ ReproductionEngine
│   ├─ DialogueGenerator (LLM optional / templated)
│   └─ StabilityController
├─ EconomyManager (node economies + marketplace)
├─ CombatManager (server-authoritative)
├─ EventScheduler (global/local events)
├─ Persistence Layer (Postgres + Redis)
└─ API / WS Gateway

Frontend
├─ React UI (debug panels, agent inspector, chat, radio)
└─ NodeView / Combat / Social components
```

## 4. Data Model

### 4.1 Agent Structure

```typescript
interface Agent {
  id: string;
  name: string;
  birthTimestamp: number;
  sex: "M" | "F" | "NB";
  age: number;
  gender: string;
  nodeId: string;

  // Psicología profunda
  personality: {
    dominance: number; // 0-100
    submission: number; // 0-100
    aggression: number; // 0-100
    empathy: number; // 0-100
    paranoia: number; // 0-100
    sexuality: number; // 0-100
    romanticIdealism: number; // 0-100
    possessiveness: number; // 0-100
    selfEsteem: number; // 0-100
    loneliness: number; // 0-100
    riskAversion: number; // 0-100
  };

  // Estado físico/mental
  stats: {
    hp: number;
    stamina: number;
    sanity: number; // 0-100
    hunger: number; // 0-100
  };

  // Necesidades
  needs: {
    hunger: number; // 0-100
    safety: number; // 0-100
    social: number; // 0-100
    romance: number; // 0-100
    wealth: number; // 0-100
    purpose: number; // 0-100
  };

  // Trauma y oscuridad
  traumaProfile: {
    abandonment: number; // 0-100
    violenceExposure: number; // 0-100
    insomnia: number; // 0-100
    hallucinationTendency: number; // 0-100
    cultBelief: number; // 0-100
    existentialCrisis: number; // 0-100
  };

  // Relaciones
  relationships: Record<string, Relationship>;

  // Memoria y estado
  memoryId: string;
  secrets: string[];
  lifeStage: "child" | "teen" | "adult" | "elder";
  alive: boolean;

  // Acción actual
  currentAction?: {
    type: string;
    target?: string;
    startedAt: number;
    cooldown?: number;
  };
}
```

### 4.2 Relationship Structure

```typescript
interface Relationship {
  targetId: string;
  affection: number; // -100 a 100
  sexualAttraction: number; // 0-100
  trust: number; // 0-100
  jealousy: number; // 0-100
  dependency: number; // 0-100
  resentment: number; // 0-100
  history: RelationshipEvent[];
}

interface RelationshipEvent {
  type: "met" | "helped" | "betrayed" | "intimacy" | "conflict" | "gift";
  timestamp: number;
  emotionalImpact: number;
  details?: string;
}
```

### 4.3 Memory Structure

```typescript
interface Memory {
  id: string;
  agentId: string;
  events: MemoryEntry[];
  lastPruned: number;
}

interface MemoryEntry {
  type: "interaction" | "violence" | "romance" | "loss" | "achievement";
  actor: string;
  timestamp: number;
  emotionalImpact: number;
  details: string;
  decay: number; // 0-1, memories fade
}
```

## 5. Mensajes WebSocket

### 5.1 Core World

**Cliente → Servidor:**

```typescript
{ type: 'entity:move', payload: { entityId, targetNodeId } }
{ type: 'entity:interact', payload: { actorId, targetId, actionType } }
{ type: 'combat:action', payload: { combatId, actionType } }
{ type: 'query:agent', payload: { agentId } }
{ type: 'radio:send', payload: { frequency, message } }
```

**Servidor → Cliente:**

```typescript
{ type: 'world:snapshot', payload: WorldState }
{ type: 'entity:update', payload: Entity }
{ type: 'node:update', payload: Node }
{ type: 'combat:started', payload: CombatInstance }
{ type: 'combat:turn_result', payload: result }
{ type: 'combat:ended', payload: summary }
{ type: 'radio:receive', payload: { speakerId, text } }
```

### 5.2 AI / Agent System

**Worker → Gateway → Cliente:**

```typescript
{ type: 'agent:speech', payload: { agentId, text, mood } }
{ type: 'agent:emotion_update', payload: { agentId, state } }
{ type: 'agent:follow', payload: { agentId, targetId } }
{ type: 'agent:relationship_update', payload: relationship }
{ type: 'agent:birth', payload: newAgent }
{ type: 'agent:death', payload: agentId }
{ type: 'agent:rumor', payload: { text, originAgentId } }
{ type: 'agent:dark_thought', payload: { agentId, text } }
```

**Worker ↔ Worker (Redis PubSub):**

```typescript
{ type: 'region:transfer_agent', payload: serializedAgent }
{ type: 'region:population_update', payload: metrics }
```

### 5.3 Economy System

```typescript
// Cliente → Servidor
{ type: 'economy:buy', payload: { buyerId, itemId } }
{ type: 'economy:sell', payload: { sellerId, itemId } }

// Servidor → Cliente
{ type: 'economy:update', payload: { nodeId, supply, demand, modifiers } }
```

### 5.4 Narrative / Events

```typescript
{ type: 'event:start', payload: Event }
{ type: 'event:end', payload: id }
{ type: 'event:global_mood_update', payload: { moraleIndex } }
```

## 6. Decision Engine

### 6.1 Algorithm

```javascript
function decide(agent, context) {
  const needs = agent.needs;
  const personality = agent.personality;

  const candidateActions = getPossibleActions(agent, context);

  let best = { action: null, score: -Infinity };

  for (action of candidateActions) {
    let score = 0;

    // Weight by needs
    for (need in needs) {
      const w = actionNeedWeight(action, need);
      score += w * needs[need];
    }

    // Personality modifier
    score *= personalityModifier(action, personality);

    // Risk evaluation
    score *= 1 - estimatedRisk(action, context) * personality.riskAversion;

    // Random factor (curiosity)
    score += randomNoise(agent);

    // Penalties
    if (isOnCooldown(agent, action) || globalCapReached(action, context)) {
      score -= 1000;
    }

    if (score > best.score) {
      best = { action, score };
    }
  }

  if (best.score < MIN_ACTION_SCORE) return idleAction();

  return executeAction(best.action);
}
```

### 6.2 Action Categories

- **MOVE**: Navegar entre nodos
- **SCAVENGE**: Buscar recursos
- **TRADE**: Intercambio comercial
- **SOCIALIZE**: Interacción social neutral
- **ROMANCE**: Cortejo, intimidad
- **HUNT**: Cazar zombies/animales
- **ATTACK**: Violencia contra otro agente
- **HIDE**: Esconderse (miedo)
- **REST**: Dormir, recuperar
- **INVESTIGATE**: Explorar misterios

### 6.3 Action Weights

```javascript
const ACTION_WEIGHTS = {
  SCAVENGE: { hunger: 0.8, safety: 0.2, wealth: 0.5 },
  SOCIALIZE: { social: 0.9, romance: 0.3 },
  ROMANCE: { romance: 0.9, social: 0.4 },
  ATTACK: { aggression: 1.0, safety: -0.5 },
  HIDE: { safety: 1.0, social: -0.3 },
  REST: { hunger: -0.2, stamina: 0.8 },
};
```

## 7. Relationship Engine

### 7.1 Affection Dynamics

```javascript
function updateRelationship(agent, target, interaction) {
  const rel = agent.relationships[target.id];

  switch (interaction.type) {
    case "helped":
      rel.affection += 10;
      rel.trust += 5;
      break;

    case "betrayed":
      rel.affection -= 30;
      rel.trust -= 50;
      rel.resentment += 40;
      break;

    case "intimacy":
      rel.affection += 20;
      rel.sexualAttraction += 15;
      rel.dependency += 10;
      break;

    case "flirted_with_other":
      if (rel.possessiveness > 50) {
        rel.jealousy += 30;
        rel.trust -= 20;
      }
      break;
  }

  // Trigger obsessive behavior
  if (rel.jealousy > 70 && agent.personality.possessiveness > 60) {
    triggerFollowBehavior(agent, target);
  }
}
```

### 7.2 Jealousy System

```javascript
function checkJealousy(agent) {
  for (const [targetId, rel] of Object.entries(agent.relationships)) {
    if (rel.jealousy > 60) {
      const target = getAgent(targetId);

      // Check if target is interacting with others
      const otherInteractions = getRecentInteractions(target).filter(
        (int) => int.type === "romance" && int.with !== agent.id,
      );

      if (otherInteractions.length > 0) {
        // Jealous reaction
        if (agent.personality.aggression > 70) {
          // Violent confrontation
          initiateConflict(agent, otherInteractions[0].with);
        } else {
          // Passive-aggressive or stalking
          followTarget(agent, target);
          generateJealousDialogue(agent, target);
        }
      }
    }
  }
}
```

## 8. Dialogue Generator

### 8.1 Template System

```javascript
const DIALOGUE_TEMPLATES = {
  // Oscuridad nocturna
  night_paranoia: {
    conditions: { timeOfDay: "night", paranoia: ">70" },
    templates: [
      "¿No sentís que nos observan?",
      "No escuches el silencio…",
      "Algo camina cuando nadie mira.",
      "¿Escuchaste eso? Sonó como… no, nada.",
      "A veces siento que alguien respira detrás de la puerta.",
    ],
  },

  // Celos
  jealous_confrontation: {
    conditions: { jealousy: ">70", target_present: true },
    templates: [
      "¿Quién era ese?",
      "No me gusta cómo te mira…",
      "¿Por qué estabas hablando con {targetName}?",
      "Yo también puedo hacer eso…",
    ],
  },

  // Enamoramiento
  romantic_approach: {
    conditions: { affection: ">60", sexualAttraction: ">50" },
    templates: [
      "Me gusta estar cerca tuyo…",
      "¿Te puedo acompañar?",
      "Sos diferente a los demás…",
    ],
  },

  // Insomnia / 3AM
  late_night_dread: {
    conditions: { hour: ">=3 && <=5", insomnia: ">50" },
    templates: [
      "Es extraño estar despierto a esta hora…",
      "¿No te da miedo la oscuridad?",
      "A veces siento que alguien golpea la ventana.",
      "¿Vos también escuchás los pasos?",
    ],
  },
};
```

### 8.2 LLM Integration (Optional)

```javascript
async function generateRichDialogue(agent, context) {
  if (shouldUseLLM(context)) {
    const prompt = buildPrompt(agent, context);
    const response = await callLLM(prompt);
    const filtered = applyContentFilter(response);
    cacheDialogue(agent.id, filtered);
    return filtered;
  }

  return templateDialogue(agent, context);
}

function buildPrompt(agent, context) {
  return `
Agent: ${agent.name}
Personality: aggression:${agent.personality.aggression}, paranoia:${agent.personality.paranoia}
Recent memories: ${getRecentMemories(agent, 3)}
Context: ${context.timeOfDay}, ${context.location}, ${context.nearbyAgents}
Tone: ${context.desiredTone}
Constraints: <120 chars, no explicit content, atmospheric/eerie
Generate single dialogue line:
  `.trim();
}
```

## 9. Reproduction Engine

```javascript
function processReproduction(agents) {
  for (const agent of agents) {
    if (agent.lifeStage !== "adult") continue;

    const partners = findPotentialPartners(agent);

    for (const partner of partners) {
      const rel = agent.relationships[partner.id];

      if (rel.affection > 70 && rel.trust > 60) {
        if (Math.random() < REPRODUCTION_CHANCE) {
          const child = createChild(agent, partner);
          spawnAgent(child);

          // Update relationships
          rel.dependency += 20;
          agent.needs.romance -= 50;
        }
      }
    }
  }
}

function createChild(parent1, parent2) {
  return {
    id: generateId(),
    name: generateName(),
    birthTimestamp: Date.now(),
    age: 0,
    lifeStage: "child",
    nodeId: parent1.nodeId,

    // Inherit personality (weighted average + mutation)
    personality: {
      aggression: inherit(
        parent1.personality.aggression,
        parent2.personality.aggression,
      ),
      empathy: inherit(
        parent1.personality.empathy,
        parent2.personality.empathy,
      ),
      // ... etc
    },
  };
}

function inherit(val1, val2) {
  const avg = (val1 + val2) / 2;
  const mutation = (Math.random() - 0.5) * 20; // ±10 mutation
  return clamp(avg + mutation, 0, 100);
}
```

## 10. Stability Controller (Híbrido)

### 10.1 Population Control

```javascript
function limitPopulation(region) {
  const current = region.agents.length;
  const max = region.maxAgents;

  if (current > max) {
    // Reduce birth rate
    REPRODUCTION_CHANCE *= 0.5;

    // Increase emigration
    const emigrants = selectEmigrants(region, current - max);
    for (const agent of emigrants) {
      migrateAgent(agent, findLessPopulatedRegion());
    }
  }
}
```

### 10.2 Violence Throttle

```javascript
function limitViolence(region) {
  const violenceIndex = calculateViolenceIndex(region);

  if (violenceIndex > VIOLENCE_THRESHOLD) {
    // Spawn guards
    spawnGuards(region, violenceIndex * 0.5);

    // Reduce aggression globally
    for (const agent of region.agents) {
      agent.personality.aggression *= 0.9;
    }

    // Increase safety need
    for (const agent of region.agents) {
      agent.needs.safety += 20;
    }
  }
}
```

### 10.3 Economy Dampeners

```javascript
function controlEconomy(region) {
  const inflation = calculateInflation(region);

  if (inflation > INFLATION_THRESHOLD) {
    // Inject supply
    for (const merchant of region.merchants) {
      merchant.inventory += SUPPLY_INJECTION;
    }

    // Price controls
    for (const item of region.marketplace.items) {
      item.price = Math.min(item.price, item.basePrice * MAX_PRICE_MULTIPLIER);
    }
  }
}
```

## 11. Implementation Roadmap

### Phase 0: Infra (1-2 weeks)

- [ ] Redis + Postgres setup
- [ ] Worker scaffold
- [ ] Basic pub/sub
- **Accept:** Worker can load region snapshot

### Phase 1: Core Agents (2-3 weeks)

- [ ] Agent model
- [ ] NeedsEngine
- [ ] Basic persistence
- **Accept:** Agents age, needs decay, agents seek food

### Phase 2: DecisionEngine (2-3 weeks)

- [ ] Decision scoring
- [ ] Action executor
- [ ] Cooldowns
- **Accept:** Emergent behaviors (gather, trade, sleep)

### Phase 3: Relationships (3 weeks)

- [ ] MemoryEngine
- [ ] RelationshipEngine
- [ ] Romance/jealousy triggers
- **Accept:** Pair bonds, jealousy events occur

### Phase 4: Economy Integration (3 weeks)

- [ ] NodeEconomy
- [ ] Marketplace
- [ ] Price dynamics
- **Accept:** Prices respond to supply/demand

### Phase 5: Reproduction (2-3 weeks)

- [ ] ReproductionEngine
- [ ] Inheritance
- **Accept:** Children spawn with inherited traits

### Phase 6: Dialogue (2-3 weeks)

- [ ] Template generator
- [ ] LLM integration
- [ ] Content filters
- **Accept:** Contextual eerie dialogue appears

### Phase 7: Polish (3-4 weeks)

- [ ] Debug UI
- [ ] Observability
- [ ] Safety controls
- [ ] Multi-region support
- **Accept:** 1000 agents running stable

**Total:** ~4-5 months to production-grade

## 12. Safety & Ethics

### 12.1 Content Policy

- ✅ **Intimacy:** Simulate emotional outcomes, NOT explicit sexual content
- ✅ **Violence:** Can happen but must be consequence-driven, not gratuitous
- ✅ **Consent:** Both agents must have conditions met
- ✅ **Self-harm:** Can be story beat but never instructional
- ✅ **Hate speech:** Blocked by filters
- ✅ **Player protection:** Report system, admin tools

### 12.2 Content Filters

```javascript
function applyContentFilter(text) {
  const blocked = [
    /explicit sexual terms/i,
    /graphic violence instructions/i,
    /hate speech patterns/i,
    /self-harm instructions/i,
  ];

  for (const pattern of blocked) {
    if (pattern.test(text)) {
      return "[Content filtered]";
    }
  }

  return text;
}
```

## 13. Debug & Observability

### 13.1 Agent Inspector UI

```typescript
interface AgentDebugView {
  id: string;
  name: string;
  currentNode: string;

  // Estado actual
  needs: Record<string, number>;
  personality: Record<string, number>;
  stats: Record<string, number>;

  // Última decisión
  lastDecision: {
    candidateActions: string[];
    scores: number[];
    selected: string;
    reason: string;
    timestamp: number;
  };

  // Relaciones
  relationships: {
    name: string;
    affection: number;
    trust: number;
    jealousy: number;
  }[];

  // Memoria reciente
  recentMemories: MemoryEntry[];
}
```

### 13.2 Metrics

- `actions_per_second` per region
- `llm_calls_per_minute`
- `spawn_death_rate`
- `population_by_lifestage`
- `inflation_index`
- `global_sanity_index`
- `violence_index`

## 14. Admin Controls

```javascript
const ADMIN_KNOBS = {
  maxAgentsPerRegion: 500,
  violenceThrottle: 70,
  birthRateMultiplier: 1.0,
  sanityDecayNightFactor: 1.5,
  paranoiaSpreadProbability: 0.1,
  llmRateLimitPerRegion: 10, // per minute
  economy_price_damping: 0.9,
};
```

## 15. Example Agent JSON

```json
{
  "id": "agent-7d2a",
  "name": "Lucía",
  "birthTimestamp": 1717243200000,
  "nodeId": "refuge-12",
  "personality": {
    "aggression": 20,
    "empathy": 70,
    "paranoia": 40,
    "sexuality": 50,
    "possessiveness": 30
  },
  "needs": {
    "hunger": 45,
    "safety": 80,
    "social": 20,
    "romance": 50,
    "wealth": 10
  },
  "stats": {
    "hp": 100,
    "stamina": 80,
    "sanity": 90
  },
  "relationships": {
    "agent-3a9": {
      "affection": 80,
      "attraction": 70,
      "trust": 60,
      "jealousy": 10
    }
  },
  "secrets": ["stole medicine from clinic"],
  "lifeStage": "adult",
  "currentAction": {
    "type": "scavenge",
    "target": "farm-3",
    "startedAt": 1650000000
  }
}
```

## 16. Conclusion

Este sistema permite:

✅ Psicología profunda emergente
✅ Relaciones complejas y dinámicas
✅ Celos, obsesión, seguimiento
✅ Diálogos contextuales inquietantes
✅ Terror psicológico emergente
✅ Drama relacional real
✅ Economía integrada
✅ Generaciones con herencia
✅ Estabilidad híbrida controlada
✅ Escalabilidad horizontal

**No es un NPC. Es un agente social consciente simulado.**
