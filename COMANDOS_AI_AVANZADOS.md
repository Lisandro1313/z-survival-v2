# Comandos de Administración de IA - Avanzados

## 📋 Resumen

Esta sesión extendió el sistema de IA con 3 comandos adicionales para control granular de agentes individuales.

---

## 🆕 Nuevos Comandos

### 1. `ai:spawn_single` - Spawnear Agente Custom

Crea un solo agente con parámetros personalizados.

**Request:**

```javascript
{
    type: 'ai:spawn_single',
    regionId: 'default',          // Región donde crear (opcional)
    name: 'TestAgent Alpha',       // Nombre custom (opcional)
    age: 25,                       // Edad específica (opcional)
    role: 'scout',                 // Rol asignado (opcional)
    lifeStage: 'adult',            // Etapa de vida (opcional)
    personality: {                 // Big Five (opcional)
        openness: 80,
        conscientiousness: 70,
        extraversion: 90,
        agreeableness: 60,
        neuroticism: 40
    }
}
```

**Response:**

```javascript
{
    type: 'ai:agent_spawned',
    data: {
        agent: { /* objeto completo del agente */ },
        regionId: 'default',
        message: '✅ Agente "TestAgent Alpha" spawneado exitosamente'
    }
}
```

**Casos de Uso:**

- Testing de personalidades específicas
- Crear NPCs con características únicas
- Simular escenarios con agentes controlados
- Debugging de comportamientos específicos

---

### 2. `ai:set_relationship` - Modificar Relaciones

Establece o modifica la relación entre dos agentes.

**Request:**

```javascript
{
    type: 'ai:set_relationship',
    agentId: 'uuid-agente-1',
    targetId: 'uuid-agente-2',
    relationship: {
        affection: 75,           // 0-100
        trust: 80,               // 0-100
        respect: 70,             // 0-100
        sexualAttraction: 0      // 0-100
    }
}
```

**Response:**

```javascript
{
    type: 'ai:relationship_updated',
    data: {
        agentId: 'uuid-agente-1',
        targetId: 'uuid-agente-2',
        relationship: { /* valores actualizados */ }
    }
}
```

**Broadcast Automático:**

```javascript
{
    type: 'agent:relationship_update',
    agentId: 'uuid-agente-1',
    targetId: 'uuid-agente-2',
    relationship: { /* valores */ },
    timestamp: 1234567890
}
```

**Validaciones:**

- Tipos válidos: `affection`, `trust`, `respect`, `sexualAttraction`
- Rango: 0-100 para cada valor
- Ambos agentes deben existir
- Inicializa automáticamente si no existe relación previa

**Casos de Uso:**

- Testing de dinámicas sociales
- Forzar conflictos o amistades
- Simular relaciones predefinidas
- Debugging de interacciones sociales

---

### 3. `ai:kill_agent` - Eliminar Agente Específico

Elimina un agente específico por ID.

**Request:**

```javascript
{
    type: 'ai:kill_agent',
    agentId: 'uuid-del-agente'
}
```

**Response:**

```javascript
{
    type: 'ai:agent_killed',
    data: {
        agentId: 'uuid-del-agente',
        message: '✅ Agente eliminado'
    }
}
```

**Broadcast Automático:**

```javascript
{
    type: 'agent:death',
    agentId: 'uuid-del-agente',
    cause: 'admin_kill',
    timestamp: 1234567890
}
```

**Comportamiento:**

- Marca `agent.alive = false`
- Remueve del registry activo
- Persiste cambio en BD
- Notifica a todos los clientes

**Casos de Uso:**

- Eliminar agentes problemáticos
- Testing de comportamientos ante muerte
- Control fino de población
- Cleanup selectivo

---

## 📊 Tests Implementados

**Suite completa: 13/13 tests pasando**

```bash
node test_ai_system.js
```

### Nuevos Tests:

**Test 9: ai:spawn_single**

- ✅ Crea agente con parámetros custom
- ✅ Valida personalidad Big Five
- ✅ Asigna rol específico

**Test 10: ai:set_relationship**

- ✅ Obtiene agentes disponibles
- ✅ Establece relación parcial
- ✅ Valida valores en rango

**Test 11: ai:kill_agent**

- ✅ Elimina agente específico
- ✅ Verifica eliminación del sistema
- ✅ Broadcast automático

**Test 12: ai:clear_agents** (reordenado)

- ✅ Limpia región completa

**Test 13: ai:reset** (reordenado)

- ✅ Reset completo del sistema

---

## 🔧 Cambios en Backend

### 1. `AgentSpawner.js` - Nuevo Método

**Líneas 289-356:**

```javascript
createCustomAgent(regionId, params = {}) {
    // Acepta parámetros opcionales
    // Usa defaults inteligentes si faltan
    // Retorna estructura completa de agente
}
```

**Ventajas:**

- Reutilizable para otros sistemas
- Validación automática de estructura
- Defaults consistentes con spawn masivo

### 2. `survival_mvp.js` - 3 Handlers Nuevos

**Líneas 7812-7987:**

- `'ai:spawn_single'` (línea 7812)
- `'ai:kill_agent'` (línea 7870)
- `'ai:set_relationship'` (línea 7930)

**Características Compartidas:**

- Uso de `createHandler()` para métricas
- Validaciones consistentes (AIManager, workers)
- Error handling completo
- Broadcast automático de eventos importantes

---

## 🚀 Uso desde Cliente

### Ejemplo: Spawnear Scout con Alta Extroversión

```javascript
ws.send(
  JSON.stringify({
    type: "ai:spawn_single",
    regionId: "default",
    name: "Swift Scout",
    age: 22,
    role: "scout",
    personality: {
      openness: 85,
      conscientiousness: 60,
      extraversion: 95, // Muy social
      agreeableness: 70,
      neuroticism: 30,
    },
  }),
);
```

### Ejemplo: Crear Rivalidad

```javascript
// Agent1 odia a Agent2
ws.send(
  JSON.stringify({
    type: "ai:set_relationship",
    agentId: "agent-1-uuid",
    targetId: "agent-2-uuid",
    relationship: {
      affection: 10,
      trust: 5,
      respect: 20,
      sexualAttraction: 0,
    },
  }),
);

// Agent2 también odia a Agent1
ws.send(
  JSON.stringify({
    type: "ai:set_relationship",
    agentId: "agent-2-uuid",
    targetId: "agent-1-uuid",
    relationship: {
      affection: 15,
      trust: 10,
      respect: 25,
      sexualAttraction: 0,
    },
  }),
);
```

### Ejemplo: Cleanup Selectivo

```javascript
// Eliminar agente específico que causa problemas
ws.send(
  JSON.stringify({
    type: "ai:kill_agent",
    agentId: "problematic-agent-uuid",
  }),
);
```

---

## 📝 Notas Importantes

### Debugging

1. **El servidor debe ejecutarse con:**

   ```bash
   node server/survival_mvp.js
   ```

   (NO usar `node server/index.js` - ese usa ws.js sin los handlers nuevos)

2. **Logs útiles:**
   ```
   🤖 [AI] Agente custom "X" spawneado en región Y por playerId
   🤖 [AI] Relación entre "X" y "Y" modificada por playerId
   🤖 [AI] Agente "X" eliminado por playerId
   ```

### Limitaciones

- **Worker requerido**: La región debe tener un worker activo
- **Sistema iniciado**: `ai:spawn_single` requiere sistema iniciado
- **Agentes existentes**: `ai:set_relationship` y `ai:kill_agent` requieren agentes spawneados
- **Rango de valores**: Relaciones solo aceptan 0-100

### Performance

- **spawn_single**: < 50ms (crea 1 agente + persist DB)
- **set_relationship**: < 10ms (actualiza objeto + broadcast)
- **kill_agent**: < 20ms (marca muerto + persist + broadcast)

---

## 🎯 Próximos Pasos

### Implementaciones Futuras (opcional)

1. **UI Controls:**
   - Form para crear agentes custom en AIDebugPanel
   - Sliders para modificar relaciones en tiempo real
   - Botón "Kill" en inspector de agente

2. **Comandos Adicionales:**
   - `ai:set_need` (ya existe) - Modificar necesidades individuales
   - `ai:trigger_action` - Forzar acción específica
   - `ai:set_emotion` - Cambiar estado emocional
   - `ai:add_memory` - Inyectar recuerdo falso

3. **Batch Operations:**
   - `ai:spawn_group` - Crear grupo con hierarchy social
   - `ai:kill_by_role` - Eliminar todos los de un rol
   - `ai:reset_relationships` - Borrar todas las relaciones

---

## ✅ Checklist de Verificación

- [x] 3 handlers implementados en backend
- [x] Método `createCustomAgent()` en AgentSpawner
- [x] 13 tests pasando exitosamente
- [x] Broadcast automático de eventos
- [x] Validaciones de parámetros
- [x] Error handling completo
- [x] Logs informativos
- [x] Documentación actualizada
- [ ] UI controls (opcional)
- [ ] Integración con panel admin (opcional)

---

## 📚 Referencias

- **Archivo principal**: `server/survival_mvp.js` (líneas 7812-7987)
- **AgentSpawner**: `server/ai/AgentSpawner.js` (líneas 289-356)
- **Tests**: `test_ai_system.js` (tests 9-13)
- **Arquitectura IA**: `SISTEMA_IA_NPCS.md`
