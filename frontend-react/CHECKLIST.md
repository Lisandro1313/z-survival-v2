# ✅ CHECKLIST DE INTEGRACIÓN Y VALIDACIÓN

## 🚀 Setup Inicial (5 minutos)

### 1. Instalar Dependencias

```bash
cd frontend-react
npm install
```

**✅ Validar:** No errores en la instalación

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

**Editar `.env`:**

```env
VITE_WS_URL=ws://localhost:3000
VITE_API_URL=http://localhost:3000
```

**✅ Validar:** Archivo `.env` creado

### 3. Verificar Backend

```bash
# En tu terminal del backend
cd server
node index.js
```

**✅ Validar:** Backend corriendo en puerto 3000

### 4. Iniciar Frontend React

```bash
# En terminal del frontend
npm run dev
```

**✅ Validar:**

- Frontend corre en `http://localhost:5173`
- No errores de compilación TypeScript
- Vite muestra "ready in X ms"

---

## 🔍 Validación de Componentes (10 minutos)

### Dashboard

- [ ] Navegar a `http://localhost:5173`
- [ ] Ver nombre del jugador en TopBar
- [ ] Ver barra HP/Hunger/Stamina
- [ ] Ver botones "Explorar Mundo", "Ir al Refugio", "Fogata Social"

### WebSocket Connection

**Abrir DevTools Console (F12)**

- [ ] Ver mensaje: `WebSocket connected`
- [ ] NO ver errores de conexión
- [ ] Ver logs de handlers ejecutándose

### TopBar

- [ ] Barras de stats con colores correctos (verde HP, amarillo Hunger, azul Stamina)
- [ ] Mostrar ubicación actual
- [ ] Mostrar nivel y caps

### NodeView

- [ ] Click en "Explorar Mundo"
- [ ] Ver canvas top-down con grid
- [ ] Ver emoji del jugador y entidades
- [ ] Panel lateral con info del nodo

### Combat (si hay enemigos)

- [ ] Si entras en combate, ver pantalla de combat
- [ ] Enemy card con HP bar
- [ ] 4 botones de acción (Attack, Defend, Use Item, Flee)
- [ ] Combat log mostrando turnos
- [ ] Turn indicator

---

## 🧩 Validación de Stores (5 minutos)

**Abrir React DevTools** (instalar extensión si no tienes)

### playerStore

```javascript
// En consola del navegador
window.__playerStore = (await import("./src/store/playerStore.ts")).default;
console.log(window.__playerStore.getState());
```

- [ ] Ver objeto `player` con HP, inventory, caps

### worldStore

- [ ] Ver `nodes` con datos del mundo
- [ ] Ver `currentNode` con ubicación actual

### uiStore

- [ ] Ver `mode: 'dashboard'` o `'node'`
- [ ] Ver `notifications: []`

### combatStore (si aplica)

- [ ] Ver `combatId` si hay combate activo
- [ ] Ver `enemy` con stats
- [ ] Ver `log` con entradas

---

## 📡 Validación WebSocket (10 minutos)

### Enviar Mensajes

**En consola del navegador:**

```javascript
// Importar WS service
const ws = (await import("./src/services/websocket.ts")).ws;

// Verificar conexión
console.log(ws.isConnected()); // true

// Enviar test de movimiento
ws.send("move", { location: "supermercado" });
```

### Recibir Mensajes

**En backend, enviar mensaje de test via WS:**

```javascript
// En tu backend
client.send(
  JSON.stringify({
    type: "player:update",
    payload: { stats: { hp: 90 } },
  }),
);
```

**✅ Validar:**

- [ ] Handler ejecuta sin errores
- [ ] Store se actualiza
- [ ] UI refleja el cambio

### Handlers Implementados

Verificar que estos handlers existen:

- [ ] `player:data` → playerHandlers.ts
- [ ] `player:update` → playerHandlers.ts
- [ ] `world:state` → worldHandlers.ts
- [ ] `combat:started` → combatHandlers.ts
- [ ] `radio:receive` → radioHandlers.ts

---

## 🎨 Validación de Estilos (5 minutos)

### Design Tokens

**Inspeccionar elemento HTML:**

- [ ] Variables CSS cargadas (--bg, --neon, --panel, etc.)
- [ ] Colores aplicados correctamente

### Componentes

- [ ] Buttons tienen hover effect
- [ ] Cards tienen border sutil
- [ ] TopBar tiene backdrop blur
- [ ] Animaciones funcionan (fadeIn, slideIn)

### Responsive

- [ ] Resize ventana → elementos se adaptan
- [ ] Mobile view (DevTools) → layout no roto

---

## 🔒 Validación TypeScript (2 minutos)

```bash
npm run typecheck
```

**✅ Validar:**

- [ ] No errores de tipado
- [ ] Exit code 0

---

## 🧪 Validación de Routing (3 minutos)

### Navegación Manual

- [ ] Ir a `http://localhost:5173/` → Dashboard
- [ ] Ir a `http://localhost:5173/node` → NodeView
- [ ] Ir a `http://localhost:5173/combat` → Combat (o redirect si no hay combate)

### Navegación Programática

```javascript
// En consola
const { useUIStore } = await import("./src/store/uiStore.ts");
useUIStore.getState().setMode("node");
```

- [ ] Router navega correctamente
- [ ] Página cambia sin recargar

---

## 🐛 Debugging Checklist

### Si WebSocket no conecta:

1. Verificar backend corriendo en puerto 3000
2. Verificar `.env` tiene VITE_WS_URL correcto
3. Verificar firewall no bloquea puerto
4. Ver errores en consola de backend

### Si componentes no renderizan:

1. Ver errores en consola del navegador (F12)
2. Verificar imports correctos
3. Verificar props requeridos se pasan

### Si stores no actualizan UI:

1. Verificar componente usa hook correcto (`usePlayerStore()`)
2. Verificar handler actualiza store correctamente
3. Ver React DevTools para estado actual

### Si TypeScript da errores:

1. Ejecutar `npm run typecheck`
2. Ver qué tipos faltan o están mal
3. Agregar interfaces necesarias en `types/`

---

## ✨ Features Implementadas (Sprint 1)

### ✅ Core Architecture

- [x] React 18 + TypeScript 5 + Vite 5
- [x] Zustand stores (player, world, ui, combat)
- [x] WebSocket singleton con reconexión
- [x] React Router 6
- [x] Design system con tokens CSS

### ✅ Components

- [x] Button (4 variants, 3 sizes)
- [x] Card (4 variants)
- [x] TopBar (stats bars)
- [x] Shell (layout wrapper)

### ✅ Pages

- [x] Dashboard (welcome screen)
- [x] NodeView (canvas top-down)
- [x] Combat (combat screen)

### ✅ Handlers

- [x] Player handlers (data, update, levelUp)
- [x] World handlers (state, update, moved)
- [x] Combat handlers (started, turnResult, victory, defeat)
- [x] Radio handlers (receive, joined)

### ✅ Services

- [x] WebSocket service con heartbeat
- [x] Handler registry extensible

---

## 📋 Próximos Pasos (Sprint 2)

### Pendientes Inmediatos

- [ ] Inventario con drag & drop
- [ ] Sistema de crafteo completo
- [ ] Handlers de crafting
- [ ] Handlers de economy
- [ ] Página de Refuge

### Documentación

- [x] README.md completo ✅
- [x] BLUEPRINT.md con roadmap ✅
- [x] CHECKLIST.md (este archivo) ✅

---

## 🎯 Criterios de Éxito

**El scaffold está listo cuando:**

- ✅ `npm install` instala sin errores
- ✅ `npm run dev` levanta servidor
- ✅ WebSocket conecta al backend
- ✅ Dashboard renderiza correctamente
- ✅ TopBar muestra stats del jugador
- ✅ No errores en consola
- ✅ TypeScript compila sin errores
- ✅ README tiene instrucciones completas

---

## 📞 Soporte

**Si algo falla:**

1. Ver errores en consola (F12)
2. Verificar backend está corriendo
3. Verificar `.env` configurado
4. Leer README.md sección troubleshooting

**Archivos de referencia:**

- `README.md` - Instrucciones completas
- `BLUEPRINT.md` - Roadmap de migración
- `survival.html` - Referencia del código legacy (NO modificar)

---

**🎮 TODO LISTO - EMPEZÁ A MIGRAR!**

Ejecuta:

```bash
npm install
npm run dev
```

Y abrí `http://localhost:5173` para ver el scaffold funcionando.
