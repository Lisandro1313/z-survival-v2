# 🧟 Z-SURVIVAL v2.0 - NUEVA ARQUITECTURA

**Sistema de supervivencia post-apocalíptico con arquitectura escalable y sistema de radio diegético**

---

## ✅ TODO COMPLETADO

### Backend Completo (3,500+ líneas)
- ✅ WorldState Map-based (O(1) lookups)
- ✅ RegionManager (3 regiones, sharding-ready)
- ✅ TickEngine (multi-tick: 1s, 200ms, 5s)
- ✅ AOI Manager (selective broadcasting)
- ✅ Controllers + Routes modulares
- ✅ **Sistema de Radio completo** 📻🔋

### Frontend Completo (React + Vite)
- ✅ React 18 + TypeScript
- ✅ Zustand store
- ✅ WebSocket hooks
- ✅ Componentes UI modulares
- ✅ **RadioPanel completo**
- ✅ ChatWindow con tipos de mensajes
- ✅ Sistema de notificaciones

---

## 🚀 INICIAR PROYECTO

### Terminal 1: Backend
\`\`\`bash
npm run start:v2
\`\`\`

### Terminal 2: Frontend
\`\`\`bash
cd frontend
npm run dev
\`\`\`

Luego abrir: **http://localhost:5173**

---

## 📻 SISTEMA DE RADIO - RESUMEN

### 4 Capas de Comunicación

1. **Local** (sin dispositivo) - Mismo nodo
2. **Frecuencia** (walkie-talkie) - Por canal
3. **Privada P2P** - Mensaje directo
4. **Interceptación** (scanner) - Espionaje

### Tipos de Radio

| Tipo | Alcance | Canales | Batería/min | Interceptable |
|------|---------|---------|-------------|---------------|
| Lv1 | Nodo | 1 | 0.5% | 20% |
| Lv2 | Región | 3 | 1.0% | 10% |
| Lv3 | Global | 5 | 2.0% | 3% |
| Scanner | Región | - | 1.5% | Solo escucha |

### Baterías

- **AA (x2)**: 100 carga, NO recargable
- **Recargable**: 150 carga, recarga 10%/min
- **Power Cell**: 300 carga, recarga 15%/min

---

## 🎮 PROBAR SISTEMA DE RADIO

### 1. Equipar Radio

**Frontend:**
\`\`\`typescript
// Panel Radio → Botón "Equipar Radio" → Seleccionar tipo
\`\`\`

**WebSocket:**
\`\`\`json
{
  "type": "radio:equip",
  "radioType": "WALKIE_LV2",
  "batteryType": "BATTERY_RECHARGEABLE"
}
\`\`\`

### 2. Sintonizar Frecuencia

\`\`\`json
{
  "type": "radio:join",
  "frequency": "104.5"
}
\`\`\`

### 3. Enviar Mensaje

\`\`\`json
{
  "type": "radio:message",
  "frequency": "104.5",
  "text": "Enemigos al norte"
}
\`\`\`

### 4. Mensaje Privado

\`\`\`json
{
  "type": "radio:private",
  "targetPlayerId": "player_123",
  "text": "Te veo en el refugio"
}
\`\`\`

### 5. Activar Scanner

\`\`\`json
{
  "type": "radio:scan",
  "enable": true
}
\`\`\`

---

## 📂 ESTRUCTURA

\`\`\`
z-survival-v2/
├── server/
│   ├── models/RadioDevice.js         # 📻 Dispositivos
│   ├── services/CommunicationService.js  # 📻 Lógica
│   ├── websockets/handlers/radio.handler.js  # 📻 WS Handler
│   ├── world/WorldState.js
│   ├── world/RegionManager.js
│   ├── world/TickEngine.js
│   ├── websockets/AOIManager.js
│   └── server_v2.js
│
└── frontend/
    ├── src/
    │   ├── components/ui/RadioPanel.tsx  # 📻 UI Radio
    │   ├── components/ui/ChatWindow.tsx
    │   ├── services/radioService.ts
    │   ├── stores/gameStore.ts
    │   └── hooks/useWebSocket.ts
    └── package.json
\`\`\`

---

## 📊 ENDPOINTS

### Autenticación
\`\`\`
POST /api/auth/register
POST /api/auth/login
POST /api/auth/character/create
\`\`\`

### Jugador
\`\`\`
GET  /api/player/:id
GET  /api/player/list/online
POST /api/player/:id/move
\`\`\`

### Mundo
\`\`\`
GET  /api/world
GET  /api/world/nodes
GET  /api/world/regions
\`\`\`

---

## 📡 MENSAJES WEBSOCKET

### Radio
- \`radio:equip\` - Equipar radio
- \`radio:join\` - Sintonizar frecuencia
- \`radio:message\` - Transmitir
- \`radio:private\` - Mensaje P2P
- \`radio:scan\` - Activar scanner
- \`radio:battery\` - Reemplazar batería
- \`radio:recharge\` - Recargar

### Otros
- \`auth\` - Autenticación
- \`move\` - Movimiento
- \`chat\` - Chat local
- \`combat\` - Combate
- \`scavenge\` - Saquear

---

## 🧪 TESTING CON WSCAT

\`\`\`bash
npm install -g wscat
wscat -c ws://localhost:3000

# Autenticar
> {"type":"auth","playerId":"test123","playerName":"Tester"}

# Equipar radio
> {"type":"radio:equip","radioType":"WALKIE_LV2","batteryType":"BATTERY_RECHARGEABLE"}

# Sintonizar
> {"type":"radio:join","frequency":"104.5"}

# Transmitir
> {"type":"radio:message","frequency":"104.5","text":"Hola mundo"}
\`\`\`

---

## 🌍 SHARDING FUTURO

### Actual
\`\`\`
Servidor Único
  → RegionManager (3 regiones simuladas)
  → CommunicationService filtra por alcance
\`\`\`

### Futuro
\`\`\`
Gateway (Redis)
  → Region Server Norte
  → Region Server Centro
  → Region Server Sur
\`\`\`

Radio alcance:
- **Node**: Solo dentro del server
- **Region**: Crossregion vía Gateway
- **Global**: Broadcast a todos

---

## 📝 DOCUMENTACIÓN COMPLETA

Ver **[RADIO_SYSTEM_DESIGN.md](./RADIO_SYSTEM_DESIGN.md)** para:
- Arquitectura detallada
- Flujos de datos
- Probabilidades de interceptación
- Eventos de interferencia
- Integración con sharding
- Gameplay emergente

---

## 🎯 PRÓXIMOS PASOS

- [ ] Testing multiplayer con 5+ clientes
- [ ] Balanceo de batería y consumo
- [ ] Crafteo de radios avanzados
- [ ] Generadores y paneles solares
- [ ] Eventos de interferencia atmosférica
- [ ] Vista 3D del mundo
- [ ] Sharding real con Redis

---

## 🧠 ARQUITECTURA CLAVE

### Backend
- **Map-based storage** = O(1) lookups
- **AOI selective broadcasting** = Solo clientes relevantes
- **Multi-tick engine** = Game loop eficiente
- **Sharding-ready** = Regiones independientes

### Frontend
- **Zustand** = State management simple
- **WebSocket hooks** = Auto-reconexión
- **Componentes modulares** = Fácil mantenimiento
- **TypeScript** = Type safety

### Sistema Radio
- **Diegético** = Requiere dispositivo físico
- **Consumo recurso** = Baterías necesarias
- **Emergente** = Espionaje, interceptación
- **Identidad única** = No es chat genérico

---

**Este sistema es GAMEPLAY, no un feature. Es identidad del juego. 🧟📻🔋**
