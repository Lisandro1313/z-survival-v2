# 📖 ÍNDICE RÁPIDO - Proyecto React Z-Survival

**Guía rápida para navegar el proyecto y encontrar lo que necesitas**

---

## 🗂️ DOCUMENTACIÓN

| Archivo                                        | Descripción                      | Cuándo usarlo               |
| ---------------------------------------------- | -------------------------------- | --------------------------- |
| [README.md](README.md)                         | Setup inicial + comandos básicos | Primera vez instalando      |
| [BLUEPRINT.md](BLUEPRINT.md)                   | Roadmap completo 12 sprints      | Planificación a largo plazo |
| [CHECKLIST.md](CHECKLIST.md)                   | Validación paso a paso           | Verificar que todo funciona |
| [HANDLERS_REFERENCE.md](HANDLERS_REFERENCE.md) | 100+ handlers documentados       | Implementar nuevos handlers |
| [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md)           | Inventario completo 95 archivos  | Ver qué está hecho          |
| [MEJORAS_SPRINT2.md](MEJORAS_SPRINT2.md)       | Features Sprint 2 detalladas     | Entender últimas mejoras    |
| [RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md)   | Overview 60% completitud         | Vista general rápida        |
| [INDICE.md](INDICE.md)                         | Este archivo                     | Navegación rápida           |

---

## 📁 ESTRUCTURA DE CARPETAS

```
frontend-react/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/              # UI base (Button, Card, Modal, etc.)
│   │   ├── game/            # Juego (Inventory, CraftingTable)
│   │   └── layout/          # Layout (Shell, TopBar)
│   │
│   ├── pages/               # Páginas principales (rutas)
│   │   ├── Dashboard/       # Home
│   │   ├── NodeView/        # Vista nodo
│   │   ├── Combat/          # Combate
│   │   ├── Refuge/          # Refugio
│   │   ├── Social/          # Fogata
│   │   ├── Map/             # Mapa global
│   │   ├── Crafting/        # Mesa crafteo 🆕
│   │   └── Economy/         # Economía 🆕
│   │
│   ├── services/            # Lógica de negocio
│   │   ├── websocket.ts     # WebSocket singleton
│   │   └── handlers/        # 16 dominios handlers
│   │
│   ├── store/               # State management Zustand
│   │   ├── playerStore.ts
│   │   ├── worldStore.ts
│   │   ├── uiStore.ts
│   │   ├── combatStore.ts
│   │   ├── questStore.ts    🆕
│   │   ├── craftingStore.ts 🆕
│   │   └── economyStore.ts  🆕
│   │
│   ├── types/               # TypeScript types
│   │   ├── player.ts
│   │   ├── world.ts
│   │   └── messages.ts
│   │
│   ├── styles/              # CSS global
│   │   ├── tokens.css       # Variables CSS
│   │   └── global.css       # Estilos base
│   │
│   ├── App.tsx              # Router principal (8 rutas)
│   └── main.tsx             # Entry point
│
├── package.json             # Dependencies
├── vite.config.ts           # Vite config
├── tsconfig.json            # TypeScript config
└── .env.example             # Env variables template
```

---

## 🎯 BUSCO IMPLEMENTAR...

### Una nueva página

1. 📁 Crear carpeta `src/pages/NombrePagina/`
2. 📄 Crear `NombrePagina.tsx` + `NombrePagina.css`
3. 🔗 Agregar ruta en [src/App.tsx](src/App.tsx)
4. 📚 Ver patrón en [pages/Crafting/Crafting.tsx](src/pages/Crafting/Crafting.tsx)

### Un nuevo store

1. 📄 Crear `src/store/nombreStore.ts`
2. 📋 Copiar patrón de [questStore.ts](src/store/questStore.ts)
3. 🔗 Usar desde componentes con `useNombreStore()`
4. 🔌 Conectar handlers en `services/handlers/`

### Un nuevo componente UI

1. 📁 Crear en `src/components/ui/`
2. 📄 Crear `ComponentName.tsx` + `ComponentName.css`
3. 📚 Ver patrón en [Notification.tsx](src/components/ui/Notification.tsx)
4. 🎨 Usar tokens de [tokens.css](src/styles/tokens.css)

### Un nuevo componente de juego

1. 📁 Crear en `src/components/game/`
2. 📄 Crear `ComponentName.tsx` + `ComponentName.css`
3. 📚 Ver patrón en [Inventory.tsx](src/components/game/Inventory.tsx)
4. 🔗 Conectar con stores correspondientes

### Nuevos handlers

1. 📄 Crear `src/services/handlers/dominioHandlers.ts`
2. 📚 Ver patrón en [craftingHandlers.ts](src/services/handlers/craftingHandlers.ts)
3. 🔗 Registrar en [handlers/index.ts](src/services/handlers/index.ts)
4. 📖 Documentar en [HANDLERS_REFERENCE.md](HANDLERS_REFERENCE.md)

### Estilos globales

1. 📝 Agregar en [tokens.css](src/styles/tokens.css) para variables
2. 📝 Agregar en [global.css](src/styles/global.css) para estilos base
3. 🎨 Usar `var(--nombre-token)` en componentes

---

## 🔍 BUSCO ENTENDER...

### ¿Cómo funciona el WebSocket?

👉 [services/websocket.ts](src/services/websocket.ts)

- Singleton pattern
- Auto-reconexión exponencial
- Heartbeat cada 30s
- Router a handlers

### ¿Cómo funcionan los handlers?

👉 [HANDLERS_REFERENCE.md](HANDLERS_REFERENCE.md)

- 16 dominios implementados
- 100+ message types
- Pattern establecido
- Flowchart incluido

### ¿Cómo funcionan los stores?

👉 Ejemplos:

- Simple: [uiStore.ts](src/store/uiStore.ts)
- Complejo: [craftingStore.ts](src/store/craftingStore.ts)
- Pattern Zustand con computed

### ¿Cómo funciona el routing?

👉 [src/App.tsx](src/App.tsx)

- React Router 6
- 8 rutas activas
- Shell wrapper global

### ¿Cómo funciona el sistema de notificaciones?

👉 [components/ui/Notification.tsx](src/components/ui/Notification.tsx)

- Global container
- 4 tipos (success, error, warning, info)
- Auto-dismiss
- Integrado en Shell

### ¿Cómo funciona el design system?

👉 [styles/tokens.css](src/styles/tokens.css)

- 50+ variables CSS
- Colores, spacing, shadows
- Reutilizable en todos los componentes

---

## 🎮 FEATURES IMPLEMENTADAS

### Sistema de Crafteo ✅

**Archivos clave:**

- Store: [craftingStore.ts](src/store/craftingStore.ts)
- Handlers: [craftingHandlers.ts](src/services/handlers/craftingHandlers.ts)
- UI: [CraftingTable.tsx](src/components/game/CraftingTable.tsx)
- Página: [Crafting.tsx](src/pages/Crafting/Crafting.tsx)

**Funcionalidad:**

- Recetas con ingredientes
- Cola de crafteo
- Progress tracking
- Rush crafting

### Sistema Económico ✅

**Archivos clave:**

- Store: [economyStore.ts](src/store/economyStore.ts)
- Handlers: [economyHandlers.ts](src/services/handlers/economyHandlers.ts)
- Página: [Economy.tsx](src/pages/Economy/Economy.tsx)

**Funcionalidad:**

- Tienda NPCs
- Sistema de carrito
- Transaction history
- Filtros avanzados

### Sistema de Quests ⚠️ (Store listo, UI pendiente)

**Archivos clave:**

- Store: [questStore.ts](src/store/questStore.ts)
- Handlers: [questHandlers.ts](src/services/handlers/questHandlers.ts)

**Pendiente:** QuestsList component

### Sistema de Inventario ✅

**Archivos clave:**

- Component: [Inventory.tsx](src/components/game/Inventory.tsx)
- Store: playerStore (items array)

**Funcionalidad:**

- Grid responsive
- Filtros + búsqueda
- Rarity colors
- Durability bars
- Acciones (usar, equipar, soltar)

### Sistema de Notificaciones ✅

**Archivos clave:**

- Component: [Notification.tsx](src/components/ui/Notification.tsx)
- Store: uiStore (notifications array)
- Container: Integrado en [Shell.tsx](src/components/layout/Shell.tsx)

**Funcionalidad:**

- Toast notifications
- 4 tipos visuales
- Auto-dismiss
- Global en todas las páginas

---

## 🚀 COMANDOS RÁPIDOS

### Desarrollo

```bash
# Primera vez
cd frontend-react
npm install
cp .env.example .env
# Editar .env con WS_URL del backend

# Iniciar desarrollo
npm run dev
# Abre http://localhost:5173

# Verificar errores TypeScript
npm run type-check

# Build producción
npm run build
npm run preview
```

### Navegación en el Browser

```
/                → Dashboard (home)
/node            → Vista nodo top-down
/combat          → Pantalla combate
/refuge          → Gestión refugio
/social          → Fogata + posts
/map             → Mapa global
/crafting        → Mesa de crafteo 🆕
/economy         → Centro económico 🆕
```

---

## 📊 ESTADO DEL PROYECTO

### Completitud General: 60%

| Categoría       | Progreso       | Estado         |
| --------------- | -------------- | -------------- |
| Core            | 100%           | ✅ Completo    |
| Stores          | 47% (7/15)     | 🟡 En progreso |
| Handlers        | 77% (100+/129) | 🟢 Bien        |
| Components UI   | 67% (8/12)     | 🟢 Bien        |
| Components Game | 25% (2/8)      | 🟡 Inicial     |
| Pages           | 62% (8/13)     | 🟢 Bien        |
| Testing         | 0%             | 🔴 Pendiente   |

### Próximo Milestone: Sprint 2 Completo (75%)

- Implementar QuestsList component
- Setup Vitest + tests básicos
- Crear 2-3 stores adicionales

---

## 🆘 TROUBLESHOOTING

### El proyecto no compila

1. Verificar `npm install` ejecutado
2. Check versión Node.js (>=18)
3. Borrar `node_modules` y reinstalar
4. Verificar errores TypeScript con `npm run type-check`

### WebSocket no conecta

1. Verificar backend corriendo
2. Check `.env` tiene `VITE_WS_URL` correcto
3. Ver console browser (DevTools F12)
4. Verificar puerto backend (default 3000)

### Componente no aparece

1. Check import correcto
2. Verificar ruta en App.tsx
3. Console browser por errores
4. Verificar CSS importado

### Store no actualiza UI

1. Verificar `useXStore()` en componente
2. Check handler está registrado en `handlers/index.ts`
3. Verificar WebSocket recibe mensaje (console)
4. Debug con React DevTools

---

## 📞 RECURSOS ADICIONALES

### Para Aprender

- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)
- [Vite Docs](https://vitejs.dev/)

### Para Consultar

- [BLUEPRINT.md](BLUEPRINT.md) - Roadmap completo
- [HANDLERS_REFERENCE.md](HANDLERS_REFERENCE.md) - Handlers documentados
- [survival.html](../public/survival.html) - Frontend original (referencia)

### Para Contribuir

1. Leer patterns establecidos
2. Seguir naming conventions
3. Documentar handlers nuevos
4. Agregar tests cuando estén disponibles

---

## ✅ CHECKLIST RÁPIDO

### Antes de empezar a desarrollar

- [ ] `npm install` ejecutado
- [ ] `.env` configurado
- [ ] Backend corriendo
- [ ] Browser abierto en localhost:5173
- [ ] DevTools abierto (F12)

### Antes de hacer commit

- [ ] `npm run type-check` sin errores
- [ ] Código formateado
- [ ] CSS co-located con componente
- [ ] Props tipadas correctamente
- [ ] Console sin warnings

### Antes de PR

- [ ] Feature funciona end-to-end
- [ ] Documentación actualizada
- [ ] No hay console.logs innecesarios
- [ ] Tests agregados (cuando estén disponibles)

---

## 🎯 SIGUIENTES PASOS SUGERIDOS

### Si eres nuevo:

1. Leer [README.md](README.md)
2. Ejecutar proyecto local
3. Navegar entre páginas
4. Revisar [BLUEPRINT.md](BLUEPRINT.md)

### Si vas a implementar features:

1. Leer [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md)
2. Revisar patterns en código existente
3. Leer [HANDLERS_REFERENCE.md](HANDLERS_REFERENCE.md)
4. Implementar siguiendo patterns

### Si vas a hacer testing:

1. Setup Vitest (pendiente)
2. Crear tests para stores
3. Crear tests para componentes
4. E2E con Playwright

---

**Última actualización:** 18 Feb 2026  
**Versión proyecto:** Sprint 2 Parcial (60%)  
**Total archivos:** 95  
**Total líneas:** ~13,800
