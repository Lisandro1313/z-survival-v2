# 📻 SISTEMA DE COMUNICACIÓN POR RADIO

**Implementación completa del sistema de comunicación diegética con walkie-talkies**

---

## 🎯 Concepto Core

Tu juego **NO tiene chat global genérico**.  
La comunicación **requiere dispositivos y frecuencias**.  
Solo hablás si tenés el equipo adecuado.

Esto crea:
- ✅ **Tensión táctica** (sin radio = aislado)
- ✅ **Economía de recursos** (baterías necesarias)
- ✅ **Espionaje emergente** (scanners + interceptación)
- ✅ **Identidad única** (comunicación diegética)

---

## 📡 4 CAPAS DEL SISTEMA

### 1️⃣ **COMUNICACIÓN LOCAL** (sin dispositivo)
**Mecánica:** Solo podés hablar con jugadores en el mismo nodo.

**Backend:**
```javascript
communicationService.sendLocalMessage(playerId, text)
// Broadcast solo al nodo actual vía AOI
aoiManager.broadcastToNode(nodeId, message)
```

**Características:**
- Sin costo de batería
- Rango limitado al nodo actual
- Ideal para refugios / encuentros casuales
- Sin interceptación posible

**WebSocket:**
```json
{
  "type": "chat",
  "scope": "local",
  "text": "Hola, hay alguien aquí?"
}
```

---

### 2️⃣ **COMUNICACIÓN POR FRECUENCIA** (walkie-talkie)

**Mecánica:** Necesitás radio equipado y sintonizar una frecuencia.

**Tipos de Radio:**

| Nivel | Alcance | Canales | Batería/min | Interceptable | Peso |
|-------|---------|---------|-------------|---------------|------|
| **Lv1** | Nodo | 1 | 0.5% | 20% | 0.3kg |
| **Lv2** | Región | 3 | 1.0% | 10% | 0.5kg |
| **Lv3** | Global | 5 | 2.0% | 3% | 1.2kg |

**Backend:**
```javascript
// Sintonizar frecuencia
communicationService.joinFrequency(playerId, "104.5")

// Enviar mensaje
communicationService.sendRadioMessage(playerId, "104.5", "Roger that")

// Salir de frecuencia
communicationService.leaveFrequency(playerId, "104.5")
```

**Consumo de Batería:**
- **Standby:** Sin consumo
- **Transmitir:** 0.1 min por mensaje (~6 segundos)
- **Escuchar:** 0.5-2.0% por minuto (según modelo)

**WebSocket:**
```json
// Equipar radio
{
  "type": "radio:equip",
  "radioType": "WALKIE_LV2",
  "batteryType": "BATTERY_RECHARGEABLE"
}

// Sintonizar
{
  "type": "radio:join",
  "frequency": "104.5"
}

// Transmitir
{
  "type": "radio:message",
  "frequency": "104.5",
  "text": "Enemigos al norte, confirmado"
}
```

**Frecuencias Sugeridas:**
- `104.5` - Canal público general
- `87.3` - Comercio / mercado
- `120.9` - Emergencias
- Privadas: `132.4`, `156.8`, etc.

---

### 3️⃣ **COMUNICACIÓN PRIVADA (P2P)**

**Mecánica:** Mensaje directo entre dos jugadores usando **código de persona**.

**Backend:**
```javascript
communicationService.sendPrivateMessage(senderId, targetPlayerId, text)
```

**Características:**
- Ambos deben tener radio equipado
- Canal exclusivo temporal
- Cifrado básico (según nivel del radio)
- Consume batería

**Código de Jugador:**
Cada jugador tiene un **ID único** (ej: `#A93X`) que comparte manualmente.

**WebSocket:**
```json
{
  "type": "radio:private",
  "targetPlayerId": "player_abc123",
  "text": "Te veo en el refugio a las 10"
}
```

**Canal Interno:**
```javascript
`private_${playerId1}_${playerId2}` // Ordenados alfabéticamente
```

---

### 4️⃣ **INTERCEPTACIÓN / ESPIONAJE** 🔍

**Mecánica:** Jugadores con **Scanner** pueden escuchar comunicaciones ajenas.

**Scanner Radio:**
```javascript
{
  id: 'radio_scanner',
  range: 'region',
  canIntercept: true,
  batteryConsumption: 1.5
}
```

**Cómo Funciona:**
1. Jugador activa modo scanner
2. Consume batería constantemente
3. Probabilidad de interceptar mensajes en su rango
4. Mensajes cifrados aparecen corruptos

**Probabilidad:**
```
interceptChance = radioInterceptionChance - (encryption × 0.3)
```

**WebSocket:**
```json
// Activar scanner
{
  "type": "radio:scan",
  "enable": true
}

// Listar frecuencias activas
{
  "type": "radio:frequencies"
}

// Respuesta
{
  "type": "radio:frequencies",
  "frequencies": [
    { "frequency": "104.5", "playerCount": 5, "activity": 12 },
    { "frequency": "87.3", "playerCount": 2, "activity": 3 }
  ]
}

// Mensaje interceptado
{
  "type": "chat:intercepted",
  "frequency": "104.5",
  "senderName": "??",
  "text": "E*em#go* *l n*rte",
  "decrypted": false
}
```

**Backend:**
```javascript
communicationService.enableScanner(playerId)
communicationService.getActiveFrequencies(playerId)
```

---

## 🔋 SISTEMA DE BATERÍAS

### **Tipos de Batería**

| Tipo | Carga | Recargable | Peso | Obtención |
|------|-------|------------|------|-----------|
| **AA (x2)** | 100 | ❌ | 0.05kg | Scavenge común |
| **Recargable** | 150 | ✅ (10%/min) | 0.1kg | Craft + Scavenge |
| **Power Cell** | 300 | ✅ (15%/min) | 0.2kg | Craft avanzado |

### **Consumo por Modelo**

```javascript
WALKIE_LV1: 0.5% por minuto
WALKIE_LV2: 1.0% por minuto  
WALKIE_LV3: 2.0% por minuto
SCANNER:    1.5% por minuto
```

### **Recarga**

**Requiere infraestructura:**
- **Generador eléctrico** (refugio)
- **Panel solar** (construcción)
- **Estación de carga** (nodo específico)

**WebSocket:**
```json
// Reemplazar batería
{
  "type": "radio:battery",
  "batteryType": "BATTERY_RECHARGEABLE"
}

// Recargar (en refugio con generador)
{
  "type": "radio:recharge",
  "minutes": 5 // Recargar 5 minutos
}
```

**Sin batería:**
```json
{
  "type": "error",
  "error": "Batería agotada"
}
// Radio se desequipa automáticamente
```

---

## 🌩️ EVENTOS ESPECIALES

### **Interferencia Atmosférica**

**Backend:**
```javascript
communicationService.applyInterference(nodeId, intensity, duration)
```

**Efectos:**
- **Tormenta solar:** Señales reducidas globalmente
- **Tormenta eléctrica:** Interferencia regional
- **Inhibidor de señal:** Zona sin comunicación
- **Sabotaje de antena:** Bloqueo temporal

**Mensaje con interferencia:**
```json
{
  "type": "chat:radio",
  "text": "E*em#go* *l n*rte, c*nfi#m*do",
  "garbled": true,
  "frequency": "104.5"
}
```

---

## 🏗️ INTEGRACIÓN CON SHARDING

### **Sin Sharding (Actual)**
```
Todos los jugadores en mismo servidor
→ RegionManager simula regiones
→ CommunicationService filtra por alcance
```

### **Con Sharding (Futuro)**

```
Gateway (Redis Pub/Sub)
    ↓
Region Server Norte → Radio alcance local
Region Server Centro → Radio alcance regional
Region Server Sur → Radio alcance global
    ↓
Broker coordina mensajes crossregion
```

**Alcances:**
- `node` → Solo dentro del servidor regional
- `region` → Crossregion vía Gateway
- `global` → Broadcast a todas las regiones

---

## 🎮 GAMEPLAY QUE ESTO CREA

### ✅ **Tensión Táctica**
Sin radio = completamente aislado.  
Con radio sin batería = en peligro.

### ✅ **Economía de Recursos**
Baterías son **valiosas**.  
Generadores/solares son **críticos** para grupos.

### ✅ **Espionaje Emergente**
Facciones rivales pueden interceptar.  
Cifrado militar = ventaja competitiva.

### ✅ **Coordinación de Grupos**
Equipos tácticos comparten frecuencia privada.  
Cambio de frecuencia = protocolo de emergencia.

### ✅ **Aislamiento Real**
Jugadores sin radio están **realmente** solos.  
Esto hace el mundo más peligroso.

### ✅ **PvP Sofisticado**
Equipos pueden triangular posición por transmisiones.  
Sabotaje de comunicación = estrategia válida.

---

## 📊 ARQUITECTURA TÉCNICA

### **Módulos Backend**

```
server/
├── models/
│   └── RadioDevice.js           # Clase de dispositivo radio
├── services/
│   └── CommunicationService.js  # Lógica de frecuencias + interceptación
└── websockets/
    └── handlers/
        └── radio.handler.js     # WebSocket handler radio
```

### **Flujo de Mensaje**

```
Cliente → WS: { type: "radio:message", frequency, text }
    ↓
radio.handler.js → CommunicationService
    ↓
CommunicationService.sendRadioMessage()
    ↓
- Verifica radio equipado
- Consume batería
- Aplica interferencia
- Chequea interceptación
    ↓
AOIManager.broadcastToFrequency()
    ↓
Solo jugadores sintonizados en rango reciben
    ↓
Scanners reciben mensaje interceptado (% chance)
```

### **Optimizaciones**

1. **Map-based subscriptions:**
```javascript
frequencies: Map<frequency, Set<playerId>>
// O(1) lookup, O(n) broadcast
```

2. **AOI Manager integration:**
```javascript
// Solo broadcast a conexiones relevantes
broadcastToFrequency(freq, message, range)
```

3. **Message buffering:**
```javascript
// Batch messages cada 50ms
messageQueue.push(msg)
setInterval(flushQueue, 50)
```

---

## 🎨 DISEÑO UI (Frontend)

### **Panel de Radio**

```
┌─────────────────────────────┐
│ 📻 Walkie-Talkie Militar    │
├─────────────────────────────┤
│ 🔋 [████████░░] 84%         │
│                              │
│ 📡 104.5      [ACTIVO]      │
│ 📡 87.3       [SILENCIADO]  │
│ 📡 120.9      [ACTIVO]      │
│                              │
│ [ Cambiar Frecuencia ]      │
│ [ Mensaje Privado ]         │
│ [ Modo Scanner ]            │
└─────────────────────────────┘
```

**Estados visuales:**
- 🟢 Radio equipado + batería OK
- 🟡 Batería baja (<20%)
- 🔴 Sin batería
- 📡 Frecuencia activa
- 🔇 Frecuencia silenciada
- 🔍 Modo scanner activo

---

## 📝 RESUMEN

✅ **Comunicación local** sin dispositivo (mismo nodo)  
✅ **Radio por frecuencia** con consumo de batería  
✅ **Mensajes privados** P2P cifrados  
✅ **Interceptación** por scanners  
✅ **Batería recargable** con infraestructura  
✅ **Eventos de interferencia** atmosférica  
✅ **Sharding-ready** (crossregion vía Gateway)  
✅ **Gameplay único** con identidad propia

---

## 🚀 PRÓXIMOS PASOS

1. **Frontend React**
   - Componente `RadioPanel`
   - Store para estado del radio
   - WebSocket client integrado

2. **Testing**
   - Simular múltiples clientes
   - Verificar interceptación
   - Probar crossregion

3. **Balanceo**
   - Ajustar consumo de batería
   - Probabilidades de interceptación
   - Crafteo de baterías avanzadas

---

**Este sistema es PURO GAMEPLAY.**  
No es un feature, es **identidad**.

🧟📻🔋
