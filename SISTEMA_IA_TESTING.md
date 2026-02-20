# 🤖 Sistema de IA - Guía de Testing

**Fecha:** 18 de Febrero, 2026  
**Estado:** ✅ Implementado y listo para testing

---

## 📊 Estado del Sistema

### Backend (Puerto 3000)

- ✅ Servidor corriendo
- ✅ AIManager inicializado
- ✅ AgentSpawner importado
- ✅ 4 handlers WebSocket activos:
  - `ai:get_stats` - Obtener estadísticas del sistema
  - `ai:start` - Iniciar simulación
  - `ai:stop` - Detener simulación
  - `ai:get_agents` - Listar agentes activos
  - `ai:spawn_initial` - Spawnear agentes iniciales

### Frontend (Puerto 5174)

- ✅ Servidor Vite corriendo
- ✅ AIDebugPanel implementado
- ✅ WebSocket conectado
- ✅ Botones de control integrados

---

## 🎮 Flujo de Testing Completo

### Paso 1: Verificar Servidores

```powershell
# Backend
Get-NetTCPConnection -LocalPort 3000 | Select-Object State
# Debe mostrar: Listen, Established

# Frontend
Get-NetTCPConnection -LocalPort 5174 | Select-Object State
# Debe mostrar: Listen
```

### Paso 2: Abrir Panel de Debug

1. Navegar a: http://localhost:5174
2. Presionar `Ctrl+D` para abrir el panel de debug
3. Verificar que aparezca el AIDebugPanel

### Paso 3: Spawnear Agentes

1. En el tab **"Overview"**, localizar botón **"🌱 Spawn Agents (0/20)"**
2. Click en el botón
3. Esperar mensaje de confirmación (1-2 segundos)
4. Verificar que el contador cambie a **(20/20)**
5. El botón debe deshabilitarse automáticamente

**Respuesta esperada del backend:**

```json
{
  "type": "ai:spawn_complete",
  "data": {
    "count": 20,
    "regionId": "default",
    "message": "✅ 20 agentes spawneados exitosamente"
  }
}
```

### Paso 4: Activar Simulación de IA

1. Click en botón **"▶️ Start AI"**
2. El botón debe cambiar a **"⏸️ Stop AI"** con estilo activo (cyan)
3. Status debe cambiar a **"🟢 Active"**

### Paso 5: Verificar Agentes en Tab "Agents"

1. Click en tab **"Agents"**
2. Debe mostrar lista de 20 agentes
3. Cada agente debe tener:
   - Nombre completo (ej: "Sofía Mendez")
   - Edad (ej: "35 años")
   - Rol (ej: "Líder", "Explorador", "Médico")
   - Emoción actual con emoji
   - Barra de sanidad

### Paso 6: Inspector de Agente Individual

1. Click en cualquier agente de la lista
2. Debe abrir tab **"Inspector"**
3. Verificar secciones:

**Personality Traits:**

- Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- Barras con valores 0-100

**Needs:**

- Hunger, Thirst, Rest, Social, Safety
- Gauges con colores (verde < 50, amarillo 50-70, rojo > 70)

**Current State:**

- Location (ej: "refugio, plaza")
- Activity (ej: "resting", "socializing")
- Emotion (ej: "content 😊")
- Sanity (0-100)

**Relationships:**

- Lista de otros agentes con valores de afinidad
- Colores: verde (positiva), roja (negativa)

**Memory Stream:**

- Últimos pensamientos/acciones
- Timestamps relativos (ej: "2 min ago")

### Paso 7: Monitorear Eventos en Tiempo Real

Con la IA activa, verificar que aparezcan eventos:

**agent:speech** - Cuando un agente habla

```json
{
  "agentId": "uuid",
  "text": "Necesitamos más comida",
  "emotion": "anxious",
  "timestamp": 1234567890
}
```

**agent:emotion_update** - Cambios emocionales

```json
{
  "agentId": "uuid",
  "oldEmotion": "content",
  "newEmotion": "anxious",
  "trigger": "low_food"
}
```

**agent:dark_thought** - Pensamientos perturbadores (3AM)

```json
{
  "agentId": "uuid",
  "thought": "¿Valgo algo en este mundo?",
  "sanity": 45
}
```

**agent:follow** - Comportamiento stalking

```json
{
  "stalkerId": "uuid1",
  "targetId": "uuid2",
  "intensity": 8
}
```

### Paso 8: Verificar Backend Logs

En el terminal del backend, verificar:

```
🤖 [AI] Sistema iniciado por player_123
✅ 20 agentes spawneados en región default por player_123
🧠 Agent "Sofía Mendez" decidió: explore (sanity: 85)
💬 Agent "Carlos Silva" dice: "¿Alguien ha visto suministros?"
😨 Agent "Ana Torres" está ansioso (hunger: 75)
🌙 Agent "Pedro Vargas" tuvo pensamiento oscuro (3:00 AM)
```

---

## 🧪 Tests Específicos

### Test 1: Sistema de Decisiones Autónomas

**Objetivo:** Verificar que los agentes toman decisiones basadas en su estado

**Procedimiento:**

1. Spawnear agentes
2. Activar IA
3. Esperar 5-10 ticks (30-60 segundos)
4. Verificar en Inspector que:
   - `needs` van aumentando con el tiempo
   - `activity` cambia basándose en `needs` más urgentes
   - `sanity` fluctúa según eventos

**Resultado esperado:**

- Agentes con `hunger > 70` deben buscar comida
- Agentes con `rest > 70` deben descansar
- Agentes con `social > 70` deben socializar

### Test 2: Sistema de Relaciones

**Objetivo:** Verificar que las relaciones evolucionan

**Procedimiento:**

1. Seleccionar un agente en Inspector
2. Observar sección "Relationships"
3. Esperar varios ticks
4. Refrescar/volver a seleccionar el agente

**Resultado esperado:**

- Valores de relación cambian (±5 por interacción)
- Aparecen nuevas relaciones con agentes cercanos
- Relaciones muy negativas pueden generar eventos de conflicto

### Test 3: Sistema de Memoria

**Objetivo:** Verificar que los agentes recuerdan acciones

**Procedimiento:**

1. Seleccionar agente en Inspector
2. Observar "Memory Stream"
3. Esperar que el agente realice acciones
4. Refrescar Inspector

**Resultado esperado:**

- Nuevas memorias aparecen en orden cronológico
- Memorias incluyen: speeches, decisions, emotional changes
- Timestamps son correctos

### Test 4: Comportamientos Avanzados

**Objetivo:** Verificar mecánicas especiales

**Procedimiento:**

1. Dejar la IA corriendo por 10+ minutos
2. Monitorear logs del backend

**Resultado esperado:**

- **3:00 AM:** Algunos agentes tienen `dark_thought`
- **Sanity < 30:** Agentes con sanidad baja tienen comportamientos erráticos
- **Stalking:** Agentes con `Neuroticism > 80` pueden seguir a otros

### Test 5: Persistencia de Datos

**Objetivo:** Verificar que los datos se guardan en DB

**Procedimiento:**

1. Spawnear y activar IA
2. Esperar varios eventos
3. Verificar tabla `agent_events` en SQLite:

```sql
SELECT * FROM agent_events
WHERE event_type IN ('agent:speech', 'agent:dark_thought')
ORDER BY timestamp DESC
LIMIT 10;
```

**Resultado esperado:**

- Eventos críticos están persistidos
- JSON payload es válido
- Timestamps son correctos

---

## 🐛 Troubleshooting

### Problema: Botón "Spawn Agents" no responde

**Posibles causas:**

- Backend no está corriendo
- WebSocket no conectado
- AgentSpawner no se cargó

**Solución:**

```powershell
# Verificar backend logs
Get-NetTCPConnection -LocalPort 3000

# Buscar mensaje de error
Get-Content server/logs/latest.log | Select-String "AgentSpawner"

# Reiniciar backend
cd server
node survival_mvp.js
```

### Problema: Agentes no aparecen en lista

**Posibles causas:**

- Spawn falló silenciosamente
- Worker de región no encontrado
- Registry no inicializado

**Solución:**

```javascript
// Enviar desde consola del browser
wsService.send("ai:get_agents");
// Ver respuesta en Network tab → WS
```

### Problema: Eventos no se reciben en frontend

**Posibles causas:**

- Sistema de IA no está activo (`enabled: false`)
- WebSocket handler no registrado
- Polling interval detenido

**Solución:**

```typescript
// En consola del browser
console.log(wsService.handlers); // Verificar handlers
wsService.send("ai:get_stats"); // Verificar estado
```

### Problema: Sanidad de agentes cae a 0 muy rápido

**Posibles causas:**

- Decay rate muy alto
- Necesidades no se satisfacen
- Eventos muy frecuentes

**Solución:**

```javascript
// Ajustar en AgentSpawner.js o DecisionEngine.js
const SANITY_DECAY_RATE = 0.5; // Reducir de 1.0 a 0.5
const NEED_INCREASE_RATE = 2; // Reducir de 5 a 2
```

---

## 📈 Métricas de Éxito

### Criterios Mínimos

- ✅ 20 agentes spawneados exitosamente
- ✅ Sistema de IA se activa sin errores
- ✅ Al menos 1 evento de cada tipo en 5 minutos
- ✅ Inspector muestra datos completos de agentes
- ✅ WebSocket envía/recibe mensajes correctamente

### Criterios Óptimos

- ✅ Agentes toman decisiones coherentes (needs → actions)
- ✅ Relaciones evolucionan dinámicamente
- ✅ Memoria stream se actualiza en tiempo real
- ✅ Eventos críticos se persisten en DB
- ✅ UI responde en < 100ms
- ✅ Sin memory leaks después de 1 hora

---

## 🚀 Próximos Pasos

Una vez validado el sistema básico:

1. **Ajustar balanceo de gameplay:**
   - Decay rates de necesidades
   - Frecuencia de eventos
   - Thresholds de sanidad

2. **Implementar visualización avanzada:**
   - Mapa 2D con ubicación de agentes
   - Gráficos de relaciones (grafo)
   - Timeline de eventos

3. **Agregar comandos de admin:**
   - `ai:reset` - Resetear simulación
   - `ai:spawn_single` - Spawnear agente específico
   - `ai:kill_agent` - Remover agente
   - `ai:set_needs` - Modificar necesidades manualmente

4. **Optimización:**
   - Batch updates para eventos
   - Throttling de broadcasts
   - Índices de DB para queries

---

## 📝 Checklist de Testing

```
[ ] Backend corriendo en puerto 3000
[ ] Frontend corriendo en puerto 5174
[ ] Panel de debug abre con Ctrl+D
[ ] Botón "Spawn Agents" funciona
[ ] 20 agentes aparecen en lista
[ ] Botón "Start AI" activa simulación
[ ] Status cambia a "🟢 Active"
[ ] Inspector muestra datos de agente seleccionado
[ ] Personality traits tienen valores 0-100
[ ] Needs tienen gauges con colores
[ ] Relationships muestran otros agentes
[ ] Memory stream tiene entradas
[ ] Eventos aparecen en backend logs
[ ] WebSocket envía/recibe correctamente
[ ] Datos persisten en SQLite
```

---

**Testing completado por:** ******\_******  
**Fecha:** ******\_******  
**Issues encontrados:** ******\_******  
**Siguiente fase:** ******\_******
