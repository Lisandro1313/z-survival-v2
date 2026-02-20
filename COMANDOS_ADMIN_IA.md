# 🎮 Comandos de Administración del Sistema de IA

**Fecha:** 18 de Febrero, 2026  
**Versión:** 2.0 - Admin Commands  
**Estado:** ✅ Implementado y testeado

---

## 📋 Resumen

Se agregaron 4 nuevos comandos de administración para facilitar el control y testing del sistema de IA:

1. **ai:clear_agents** - Eliminar todos los agentes de una región
2. **ai:get_agent** - Obtener detalles completos de un agente específico
3. **ai:set_agent_need** - Modificar necesidad de un agente (testing)
4. **ai:reset** - Resetear sistema completo

---

## 🔧 Comandos Disponibles

### 1. ai:clear_agents

Elimina todos los agentes de una región específica sin detener el sistema de IA.

**Uso desde frontend:**

```typescript
wsService.send("ai:clear_agents", { regionId: "default" });
```

**Uso desde WebSocket:**

```javascript
{
  "type": "ai:clear_agents",
  "regionId": "default"
}
```

**Respuesta exitosa:**

```json
{
  "type": "ai:agents_cleared",
  "data": {
    "count": 20,
    "regionId": "default",
    "message": "✅ 20 agentes eliminados de región default"
  }
}
```

**Casos de error:**

- Sistema de IA no disponible
- Worker no encontrado para la región
- Error al limpiar agentes

**Cuándo usar:**

- Limpiar agentes antes de spawnear nuevos
- Resetear población sin reiniciar todo el sistema
- Testing rápido de diferentes configuraciones

---

### 2. ai:get_agent

Obtiene detalles completos de un agente específico, incluyendo personalidad, necesidades, relaciones y memoria.

**Uso desde frontend:**

```typescript
wsService.send("ai:get_agent", {
  agentId: "agent-uuid-123",
  regionId: "default",
});
```

**Uso desde WebSocket:**

```javascript
{
  "type": "ai:get_agent",
  "agentId": "agent-uuid-123",
  "regionId": "default"
}
```

**Respuesta exitosa:**

```json
{
  "type": "ai:agent_details",
  "data": {
    "id": "agent-uuid-123",
    "name": "Sofía Mendez",
    "age": 35,
    "role": "Líder",
    "personality": {
      "openness": 75,
      "conscientiousness": 85,
      "extraversion": 60,
      "agreeableness": 70,
      "neuroticism": 30
    },
    "needs": {
      "hunger": 45,
      "thirst": 30,
      "rest": 60,
      "social": 20,
      "safety": 15
    },
    "state": {
      "location": "refugio",
      "subLocation": "plaza",
      "activity": "socializing",
      "emotion": "content",
      "sanity": 85
    },
    "relationships": {
      "agent-uuid-456": {
        "affection": 75,
        "trust": 80,
        "respect": 85,
        "sexualAttraction": 20
      }
    },
    "memoryStream": [
      {
        "type": "speech",
        "content": "Necesitamos más comida",
        "timestamp": 1234567890
      }
    ]
  }
}
```

**Casos de error:**

- No se especifica agentId
- Sistema de IA no disponible
- Worker no encontrado
- Agente no encontrado

**Cuándo usar:**

- Debugging de comportamiento de agentes
- Análisis de estado de agente específico
- Verificar valores de personalidad/necesidades
- Inspección de relaciones y memoria

---

### 3. ai:set_agent_need

Modifica manualmente una necesidad de un agente. Útil para testing de comportamientos específicos.

**Uso desde frontend:**

```typescript
wsService.send("ai:set_agent_need", {
  agentId: "agent-uuid-123",
  need: "hunger",
  value: 95,
  regionId: "default",
});
```

**Uso desde WebSocket:**

```javascript
{
  "type": "ai:set_agent_need",
  "agentId": "agent-uuid-123",
  "need": "hunger",
  "value": 95,
  "regionId": "default"
}
```

**Necesidades válidas:**

- `hunger` (hambre)
- `thirst` (sed)
- `rest` (descanso)
- `social` (socialización)
- `safety` (seguridad)

**Valor:** 0-100 (donde 100 = máxima urgencia)

**Respuesta exitosa:**

```json
{
  "type": "ai:agent_need_updated",
  "data": {
    "agentId": "agent-uuid-123",
    "need": "hunger",
    "value": 95,
    "message": "✅ hunger de Sofía Mendez actualizado a 95"
  }
}
```

**Broadcast automático:**

```json
{
  "type": "agent:need_update",
  "agentId": "agent-uuid-123",
  "need": "hunger",
  "oldValue": 45,
  "newValue": 95,
  "timestamp": 1234567890
}
```

**Casos de error:**

- Faltan parámetros requeridos (agentId, need, value)
- Valor fuera de rango (< 0 o > 100)
- Necesidad inválida
- Sistema de IA no disponible
- Worker o agente no encontrado

**Cuándo usar:**

- Testing de decisiones bajo presión (needs > 70)
- Forzar comportamientos específicos
- Simular situaciones extremas
- Debugging de sistema de decisiones

---

### 4. ai:reset

Resetea completamente el sistema de IA: detiene la simulación, elimina todos los agentes de todas las regiones, y reinicializa el sistema.

**Uso desde frontend:**

```typescript
wsService.send("ai:reset");
```

**Uso desde WebSocket:**

```javascript
{
  "type": "ai:reset"
}
```

**Respuesta exitosa:**

```json
{
  "type": "ai:reset_complete",
  "data": {
    "agentsCleared": 20,
    "message": "✅ Sistema reseteado: 20 agentes eliminados"
  }
}
```

**Broadcast automático:**

```json
{
  "type": "ai:system_reset",
  "timestamp": 1234567890,
  "triggeredBy": "player_123"
}
```

**Proceso de reset:**

1. Detiene sistema de IA si está activo (`aiManager.stop()`)
2. Itera sobre todos los workers
3. Obtiene todos los agentes de cada worker
4. Elimina agentes del registry
5. Reinicializa AIManager (`aiManager.initialize()`)
6. Broadcast de evento global

**Casos de error:**

- Sistema de IA no disponible
- Error durante reinicialización

**Cuándo usar:**

- Comenzar testing desde cero
- Limpiar estado corrupto
- Preparar sistema para nueva configuración
- Reset rápido sin reiniciar servidor

---

## 🎨 Interfaz de Usuario

### Botones en AIDebugPanel

**Ubicación:** Tab "Overview" → Control Section

#### 1. Botón "Start/Stop AI"

- **Color:** Azul cyan
- **Estado activo:** Borde brillante + shadow
- **Función:** `toggleAI()`

#### 2. Botón "Spawn Agents"

- **Color:** Verde
- **Estado:** Deshabilitado si hay agentes
- **Muestra:** Contador (X/20)
- **Función:** `spawnInitial()`

#### 3. Botón "Clear" (NUEVO)

- **Color:** Naranja
- **Estado:** Deshabilitado si no hay agentes
- **Muestra:** Contador (X)
- **Función:** `clearAgents()`
- **Confirmación:** Popup antes de ejecutar

#### 4. Botón "Reset System" (NUEVO)

- **Color:** Rojo
- **Función:** `resetSystem()`
- **Confirmación:** Popup antes de ejecutar

**Estilos CSS:**

```css
/* Control section con 4 botones */
.control-section {
  display: flex;
  gap: 10px;
}

/* Botón Clear (naranja) */
.ai-clear {
  flex: 1;
  padding: 15px;
  background: rgba(255, 152, 0, 0.2);
  border: 2px solid #ff9800;
  color: #ff9800;
  /* ... */
}

/* Botón Reset (rojo) */
.ai-reset {
  flex: 1;
  padding: 15px;
  background: rgba(244, 67, 54, 0.2);
  border: 2px solid #f44336;
  color: #f44336;
  /* ... */
}
```

---

## 🧪 Testing

### Suite de Tests Actualizada

**Archivo:** `test_ai_system.js`  
**Tests totales:** 10 (3 nuevos)

#### Test 8: ai:get_agent

```javascript
// Obtiene lista de agentes
const agentsListResponse = await sendAndWait("ai:get_agents", "ai:agents");

// Si hay agentes, obtiene detalles del primero
if (agentsListResponse.data.length > 0) {
  const firstAgentId = agentsListResponse.data[0].id;
  const agentResponse = await sendAndWait("ai:get_agent", "ai:agent_details", {
    agentId: firstAgentId,
    regionId: "default",
  });

  console.log(`✅ Detalles de agente obtenidos: ${agentResponse.data?.name}`);
}
```

#### Test 9: ai:clear_agents

```javascript
// Solo ejecuta si hay agentes
if (agentsListResponse.data.length > 0) {
  const clearResponse = await sendAndWait(
    "ai:clear_agents",
    "ai:agents_cleared",
    {
      regionId: "default",
    },
  );

  console.log(`✅ Agentes eliminados: ${clearResponse.data?.count} agentes`);
}
```

#### Test 10: ai:reset

```javascript
const resetResponse = await sendAndWait("ai:reset", "ai:reset_complete");
console.log(
  `✅ Sistema reseteado: ${resetResponse.data?.agentsCleared} agentes`,
);
```

**Resultado:** ✅ 10/10 tests pasando

---

## 📊 Flujo de Trabajo Típico

### Desarrollo/Testing

```bash
# 1. Iniciar servidores
cd server && node survival_mvp.js  # Terminal 1
cd frontend-react && npm run dev   # Terminal 2

# 2. Ejecutar tests automatizados
node test_ai_system.js

# 3. Abrir frontend
# http://localhost:5174 → Ctrl+D

# 4. Spawnear agentes
Click "🌱 Spawn Agents"

# 5. Activar IA
Click "▶️ Start AI"

# 6. Observar comportamiento
# - Tab "Agents" → Ver lista
# - Click en agente → Inspector detallado
# - Monitorear eventos en tiempo real

# 7. Resetear cuando sea necesario
Click "🗑️ Clear" (solo agentes) o "🔄 Reset System" (todo)
```

### Debugging de Agente Específico

```javascript
// 1. Obtener lista de agentes
wsService.send("ai:get_agents");

// 2. Seleccionar agente problemático
const problematicAgentId = "agent-uuid-123";

// 3. Obtener detalles completos
wsService.send("ai:get_agent", {
  agentId: problematicAgentId,
});

// 4. Modificar necesidad para testing
wsService.send("ai:set_agent_need", {
  agentId: problematicAgentId,
  need: "hunger",
  value: 95, // Forzar hambre extrema
});

// 5. Observar decisión resultante
// El agente debería priorizar buscar comida
```

### Testing de Escenarios Extremos

```javascript
// Escenario: Población bajo presión extrema
// 1. Spawnear agentes
wsService.send("ai:spawn_initial", { count: 20 });

// 2. Activar IA
wsService.send("ai:start");

// 3. Esperar 30 segundos de funcionamiento normal

// 4. Forzar crisis: Modificar múltiples agentes
for (const agent of agents) {
  wsService.send("ai:set_agent_need", {
    agentId: agent.id,
    need: "hunger",
    value: 85, // Hambre crítica en toda la población
  });
}

// 5. Observar emergencia social
// - Competencia por recursos
// - Posible violencia
// - Formación de coaliciones
// - Caída de sanidad colectiva

// 6. Reset para siguiente test
wsService.send("ai:reset");
```

---

## 🔒 Seguridad y Consideraciones

### Validaciones Implementadas

1. **ai:clear_agents:**
   - ✅ Valida que AIManager exista
   - ✅ Verifica que worker exista
   - ✅ Itera seguramente sobre agentes

2. **ai:get_agent:**
   - ✅ Requiere agentId obligatorio
   - ✅ Valida que agente exista
   - ✅ Retorna objeto completo

3. **ai:set_agent_need:**
   - ✅ Requiere 3 parámetros obligatorios
   - ✅ Valida rango 0-100
   - ✅ Lista blanca de needs válidos
   - ✅ Broadcast de cambio

4. **ai:reset:**
   - ✅ Detiene sistema antes de limpiar
   - ✅ Itera todos los workers
   - ✅ Reinicializa completamente
   - ✅ Broadcast global de reset

### Confirmaciones de Usuario

**Frontend implementa confirmación obligatoria para:**

```typescript
// Clear Agents
if (
  !confirm("¿Eliminar todos los agentes? Esta acción no se puede deshacer.")
) {
  return;
}

// Reset System
if (
  !confirm(
    "¿Resetear completamente el sistema de IA? Esto eliminará todos los agentes y detendrá la simulación.",
  )
) {
  return;
}
```

### Logging

Todos los comandos admin generan logs en backend:

```javascript
console.log(
  `🤖 [AI] ${count} agentes eliminados de región ${regionId} por ${playerId}`,
);
console.log(
  `🤖 [AI] hunger de agente ${agent.name} ajustado a ${value} por ${playerId}`,
);
console.log(
  `🤖 [AI] Sistema reseteado completamente por ${playerId} (${totalAgents} agentes)`,
);
```

---

## 📈 Métricas y Observabilidad

### Eventos Broadcasted

Los comandos admin generan eventos que pueden ser monitoreados:

| Comando        | Evento            | Payload                           |
| -------------- | ----------------- | --------------------------------- |
| clear_agents   | ai:agents_cleared | count, regionId                   |
| set_agent_need | agent:need_update | agentId, need, oldValue, newValue |
| reset          | ai:system_reset   | timestamp, triggeredBy            |

### Monitoreo Recomendado

```typescript
// Suscribirse a eventos admin
wsService.on("ai:agents_cleared", (msg) => {
  console.log(`🗑️ ${msg.data.count} agentes eliminados`);
  analytics.track("agents_cleared", msg.data);
});

wsService.on("agent:need_update", (msg) => {
  console.log(`📊 Need actualizado: ${msg.need} → ${msg.newValue}`);
  if (msg.newValue > 80) {
    console.warn("⚠️ Need crítico detectado");
  }
});

wsService.on("ai:system_reset", (msg) => {
  console.log("🔄 Sistema reseteado");
  analytics.track("system_reset", {
    triggeredBy: msg.triggeredBy,
    timestamp: msg.timestamp,
  });
});
```

---

## 🚀 Próximos Pasos

### Comandos Adicionales Sugeridos

1. **ai:spawn_single**
   - Spawnear un solo agente con parámetros custom
   - Útil para testing de personalidades específicas

2. **ai:kill_agent**
   - Eliminar agente específico
   - Simular muerte para testing

3. **ai:set_relationship**
   - Modificar relación entre dos agentes
   - Testing de dinámicas sociales

4. **ai:trigger_event**
   - Forzar evento específico (dark_thought, reproduction, etc.)
   - Testing de mecánicas avanzadas

5. **ai:get_analytics**
   - Estadísticas agregadas del sistema
   - Distribución de edades, sanidad promedio, etc.

### Mejoras de UI

1. **Panel de Control Avanzado**
   - Sliders para modificar needs en tiempo real
   - Gráficos de distribución de población
   - Timeline de eventos

2. **Inspector Mejorado**
   - Edición inline de valores
   - Historial de cambios
   - Predicción de próxima decisión

3. **Visualización de Relaciones**
   - Grafo interactivo
   - Filtros por tipo de relación
   - Detección de clústeres sociales

---

## 📚 Referencias

- **Backend:** [server/survival_mvp.js](../server/survival_mvp.js) líneas 7629-7785
- **Frontend:** [AIDebugPanel.tsx](../frontend-react/src/components/debug/AIDebugPanel.tsx)
- **Estilos:** [ai-debug.css](../frontend-react/src/styles/ai-debug.css) líneas 148-223
- **Tests:** [test_ai_system.js](../test_ai_system.js) tests 8-10
- **Documentación base:** [SISTEMA_IA_TESTING.md](SISTEMA_IA_TESTING.md)

---

**Última actualización:** 18 de Febrero, 2026  
**Versión:** 2.0  
**Estado:** ✅ Producción
