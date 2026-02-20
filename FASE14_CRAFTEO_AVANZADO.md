# FASE 14: SISTEMA DE CRAFTEO AVANZADO

## 📋 RESUMEN

Sistema completo de crafteo con recetas, mejoras, modificadores y workbenches especializados que permite a los jugadores crear, mejorar y personalizar armas, armaduras y consumibles.

## ✅ CARACTERÍSTICAS IMPLEMENTADAS

### 1. Sistema de Recetas

- **40+ Recetas** organizadas por categoría
- **Categorías**: Armas, Armaduras, Munición, Consumibles, Explosivos, Utilidades
- **Requisitos**: Materiales, nivel, workbench específico
- **Rareza**: Común, Poco común, Raro, Épico, Legendario
- **Tiempo de crafteo**: Variable según complejidad

### 2. Sistema de Mejoras (Upgrades)

- **Progresión por tiers**: 2-3 niveles de mejora por item
- **Mejoras graduales**: Cada tier aumenta stats
- **Ejemplos**:
  - Cuchillo → Cuchillo Afilado → Cuchillo de Combate
  - Pistola → Pistola Mejorada → Pistola de Élite
  - Armadura Ligera → Armadura Reforzada → Armadura Táctica

### 3. Sistema de Modificadores

- **12 Modificadores** para personalización
- **Tipos**:
  - **Armas**: Silenciador, Mira Telescópica, Cargador Extendido, Empuñadura Reforzada, Bayoneta, Cañón Largo
  - **Armadura**: Placas Balísticas, Kevlar Reforzado, Bolsillos Tácticos, Aislamiento Térmico, Camo Urbano, Refuerzo de Hombros
- **Bonificaciones**: Daño, precisión, capacidad, defensa, movilidad, sigilo

### 4. Sistema de Workbenches

- **7 Tipos** con árbol de progresión
- **Workbenches**:
  1. **Básico**: Starter, items simples (nivel 1)
  2. **Avanzado**: Items mejorados, acceso a upgrades (nivel 5)
  3. **Armero**: Especializado en armas y munición (nivel 8)
  4. **Médico**: Especializado en medicinas y consumibles (nivel 8)
  5. **Químico**: Especializado en explosivos y químicos (nivel 10)
  6. **Electrónico**: Especializado en dispositivos tecnológicos (nivel 12)
  7. **Maestro**: Acceso total a todo (nivel 15)

- **Requisitos de construcción**: Materiales, nivel, workbench predecesor

## 🎮 SISTEMA DE JUEGO

### Crafteo Básico

1. **Seleccionar workbench** activo
2. **Elegir categoría** de recetas
3. **Ver recetas disponibles** con requisitos
4. **Craftear item** si cumples requisitos
5. **Recibir experiencia** por craftear

### Mejoras

1. Tener el **item base** en inventario
2. Tener **materiales de mejora**
3. Usar **workbench adecuado**
4. Aplicar upgrade para obtener **versión mejorada**

### Modificadores

1. Tener el **item equipable** (arma/armadura)
2. Tener **materiales del modificador**
3. Usar **workbench avanzado** o superior
4. Aplicar modificador para **bonificación permanente**
5. Acumular **múltiples modificadores** en un item

### Construcción de Workbenches

1. Tener **nivel requerido**
2. Tener **workbench predecesor** (excepto Básico)
3. Recolectar **materiales de construcción**
4. Construir para **desbloquear recetas** nuevas

## 📊 RECETAS POR CATEGORÍA

### ⚔️ ARMAS (10 recetas)

| Item            | Materiales                     | Nivel | Rareza     | Workbench |
| --------------- | ------------------------------ | ----- | ---------- | --------- |
| Cuchillo        | 3 materiales, 1 metal          | 1     | Común      | Básico    |
| Bate con Clavos | 5 mat, 2 metal                 | 2     | Común      | Básico    |
| Lanza           | 6 mat, 2 metal                 | 3     | Poco común | Básico    |
| Machete         | 8 mat, 3 metal                 | 4     | Poco común | Avanzado  |
| Arco            | 10 mat, 1 cuerda               | 5     | Poco común | Avanzado  |
| Pistola         | 15 mat, 5 metal, 2 componentes | 6     | Raro       | Armero    |
| Escopeta        | 20 mat, 8 metal, 3 comp        | 8     | Raro       | Armero    |
| Rifle           | 25 mat, 10 metal, 5 comp       | 10    | Épico      | Armero    |
| Ballesta        | 18 mat, 6 metal, 2 cuerda      | 9     | Raro       | Armero    |
| Katana          | 30 mat, 15 metal               | 12    | Legendario | Maestro   |

### 🛡️ ARMADURAS (7 recetas)

| Item                | Materiales                | Nivel | Rareza     | Workbench |
| ------------------- | ------------------------- | ----- | ---------- | --------- |
| Ropa Reforzada      | 8 mat, 2 tela             | 2     | Común      | Básico    |
| Chaleco Improvisado | 12 mat, 3 tela, 2 metal   | 3     | Poco común | Básico    |
| Armadura Ligera     | 15 mat, 5 tela, 3 metal   | 5     | Poco común | Avanzado  |
| Chaleco Táctico     | 20 mat, 8 tela, 5 metal   | 7     | Raro       | Avanzado  |
| Armadura Pesada     | 25 mat, 5 metal, 5 comp   | 9     | Raro       | Armero    |
| Armadura Militar    | 35 mat, 10 metal, 8 comp  | 12    | Épico      | Maestro   |
| Armadura de Combate | 50 mat, 15 metal, 12 comp | 15    | Legendario | Maestro   |

### 💥 MUNICIÓN (5 recetas)

| Item               | Cantidad | Materiales         | Workbench |
| ------------------ | -------- | ------------------ | --------- |
| Flechas            | 10       | 5 mat, 1 metal     | Básico    |
| Balas 9mm          | 20       | 5 mat, 3 metal     | Armero    |
| Cartuchos          | 10       | 8 mat, 4 metal     | Armero    |
| Balas Rifle        | 15       | 10 mat, 5 metal    | Armero    |
| Explosivos Caseros | 3        | 15 mat, 5 químicos | Químico   |

### 💊 CONSUMIBLES (8 recetas)

| Item            | Efecto                      | Materiales         | Workbench |
| --------------- | --------------------------- | ------------------ | --------- |
| Vendaje         | +20 HP                      | 3 mat, 1 tela      | Básico    |
| Botiquín Básico | +40 HP                      | 5 mat, 2 medicinas | Básico    |
| Antídoto        | Cura veneno                 | 8 mat, 3 med       | Médico    |
| Estimulante     | +25 stamina                 | 10 mat, 2 med      | Médico    |
| Antibiótico     | +60 HP, cura infección      | 12 mat, 4 med      | Médico    |
| Med-X Avanzado  | +80 HP                      | 15 mat, 6 med      | Médico    |
| Adrenalina      | +50 stamina, +daño temporal | 18 mat, 5 med      | Médico    |
| Elixir Completo | +100 HP, +50 stamina        | 25 mat, 10 med     | Maestro   |

### 💣 EXPLOSIVOS (5 recetas)

| Item                     | Efecto                 | Materiales                  | Workbench |
| ------------------------ | ---------------------- | --------------------------- | --------- |
| Molotov                  | 30-50 daño área        | 3 mat, 2 combustible        | Básico    |
| Granada Casera           | 50-80 daño             | 8 mat, 3 químicos           | Químico   |
| C4                       | 100-150 daño           | 15 mat, 8 químicos          | Químico   |
| Mina Antipersonal        | 80 daño trampa         | 12 mat, 5 químicos, 3 metal | Químico   |
| Granada de Fragmentación | 60-100 daño + sangrado | 18 mat, 10 químicos         | Maestro   |

### 🔧 UTILIDADES (5 recetas)

| Item               | Función                      | Materiales                | Workbench   |
| ------------------ | ---------------------------- | ------------------------- | ----------- |
| Trampa             | Captura zombies              | 5 mat, 2 metal            | Básico      |
| Barricada          | +10 defensa refugio          | 8 mat, 3 metal            | Básico      |
| Radio              | Comunicación larga distancia | 20 mat, 8 comp            | Electrónico |
| Generador          | Energía para refugio         | 30 mat, 12 comp           | Electrónico |
| Torreta Automática | Defensa automática           | 40 mat, 15 comp, 10 metal | Maestro     |

## 🔄 SISTEMA DE PROGRESIÓN

### Niveles de Workbench

```
Básico (Nivel 1)
    ↓
Avanzado (Nivel 5)
    ↓
    ├─→ Armero (Nivel 8)
    ├─→ Médico (Nivel 8)
    ├─→ Químico (Nivel 10)
    └─→ Electrónico (Nivel 12)
            ↓
        Maestro (Nivel 15)
```

### Árbol de Mejoras (ejemplo: Pistola)

```
Pistola (6-10 dmg, 70% precisión)
    ↓ +8 mat, +4 metal
Pistola Mejorada (8-14 dmg, 75% precisión)
    ↓ +12 mat, +6 metal, +2 comp
Pistola de Élite (12-20 dmg, 85% precisión, +10% crítico)
```

### Modificadores Acumulativos

Un arma puede tener **múltiples modificadores**:

- Pistola + Silenciador = -25% ruido
- Pistola + Silenciador + Mira = -25% ruido, +15% precisión
- Pistola + Silenciador + Mira + Cargador Ext = -25% ruido, +15% precisión, +5 rondas

## 🎯 INTEGRACIÓN CON OTROS SISTEMAS

### Con Sistema de Combate (Fase 13)

- Armas crafteadas usables en combate
- Armaduras crafteadas dan bonificaciones defensivas
- Munición crafteada permite más combates
- Consumibles curables durante combate

### Con Sistema de Experiencia

- **+XP por craftear**: Variable según rareza
- **+XP por mejorar**: 50 XP base
- **+XP por modificar**: 30 XP base
- **+XP por construir workbench**: 100 XP base

### Con Inventario

- Materiales consumidos al craftear
- Items creados añadidos automáticamente
- Peso y capacidad respetados
- Items mejorados reemplazan originales

### Con Estadísticas

- `items_crafteados`: Contador total
- `items_mejorados`: Contador de upgrades
- `workbenches_construidos`: Progresión del jugador

## 📡 MENSAJES WEBSOCKET

### Cliente → Servidor

```javascript
// Obtener recetas disponibles
{ type: 'craft:get_recipes', workbench: 'básico', category: 'armas' }

// Craftear item
{ type: 'craft:item', recipe: 'pistola', quantity: 1, workbench: 'armero' }

// Mejorar item
{ type: 'craft:upgrade', item: 'pistola', workbench: 'armero' }

// Aplicar modificador
{ type: 'craft:apply_modifier', item: 'pistola', modifier: 'silenciador', workbench: 'avanzado' }

// Construir workbench
{ type: 'craft:build_workbench', workbench: 'armero' }

// Obtener info del crafteo
{ type: 'craft:get_info' }
```

### Servidor → Cliente

```javascript
// Lista de recetas
{
  type: 'craft:recipes',
  recipes: [...],
  workbench: 'armero',
  playerLevel: 8
}

// Crafteo exitoso
{
  type: 'craft:success',
  item: 'pistola',
  quantity: 1,
  recipe: {...},
  timeSeconds: 30,
  xpGained: 50,
  inventario: {...},
  message: '✅ Pistola x1 creado'
}

// Mejora exitosa
{
  type: 'craft:upgraded',
  originalItem: 'pistola',
  upgradedItem: 'pistola_mejorada',
  upgrade: {...},
  xpGained: 50,
  inventario: {...},
  message: '⬆️ Pistola Mejorada completada'
}

// Modificador aplicado
{
  type: 'craft:modifier_applied',
  item: 'pistola',
  modifier: {...},
  modifiers: ['silenciador'],
  xpGained: 30,
  inventario: {...},
  message: '🔧 Silenciador aplicado a pistola'
}

// Workbench construido
{
  type: 'craft:workbench_built',
  workbench: {...},
  currentWorkbench: 'armero',
  workbenches: ['básico', 'avanzado', 'armero'],
  xpGained: 100,
  inventario: {...},
  message: '🔨 Mesa de Armero construido'
}

// Info de crafteo
{
  type: 'craft:info',
  currentWorkbench: 'avanzado',
  availableWorkbenches: ['básico', 'avanzado'],
  workbenchInfo: {...},
  stats: {
    items_crafteados: 25,
    items_mejorados: 8,
    workbenches_construidos: 2
  }
}
```

## 🎨 UI/UX

### Panel de Crafteo (Tab Principal)

```
┌─────────────────────────────────────────┐
│ 🔨 CRAFTEO AVANZADO                     │
├─────────────────────────────────────────┤
│ Mesa Actual: Mesa Avanzada              │
│ Items mejorados y complejos             │
│                          [CAMBIAR MESA] │
├─────────────────────────────────────────┤
│ [⚔️ ARMAS] [🛡️ ARMADURAS] [💥 MUNICIÓN] │
│ [💊 CONSUMIBLES] [💣 EXPLOSIVOS]        │
│ [🔧 UTILIDAD] [⬆️ MEJORAS] [🔩 MODS]    │
├─────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ 🔫   │  │ 🔪   │  │ ⚔️    │          │
│  │Pistola│ │Machete│ │Katana│          │
│  │15m 5M│  │ 8m 3M│  │30m 15M│         │
│  │2comp │  │      │  │ Nv12 │          │
│  │⏱️ 30s │  │⏱️ 15s │  │⏱️ 60s │         │
│  └──────┘  └──────┘  └──────┘          │
└─────────────────────────────────────────┘
```

### Colores por Rareza

- **Común**: Verde (#00ff00)
- **Poco común**: Azul (#0088ff)
- **Raro**: Morado (#aa00ff)
- **Épico**: Rojo (#ff0000)
- **Legendario**: Dorado (#ffff00)

### Indicadores Visuales

- ✅ Puede craftear (color completo, clickeable)
- ❌ No puede craftear (grayed out, opacidad 0.5)
- 🔒 Workbench bloqueado
- ⏱️ Tiempo de crafteo
- 📊 Nivel requerido
- 🎯 Material faltante resaltado en rojo

## 📈 BALANCE Y ECONOMÍA

### Costos Progresivos

- **Tier 1** (Común): 3-8 materiales
- **Tier 2** (Poco común): 10-15 materiales
- **Tier 3** (Raro): 18-25 materiales + componentes
- **Tier 4** (Épico): 30-40 materiales + componentes + especiales
- **Tier 5** (Legendario): 50+ materiales + muchos componentes

### Tiempos de Crafteo

- **Básico**: 5-15 segundos
- **Avanzado**: 20-30 segundos
- **Raro**: 40-60 segundos
- **Épico**: 80-120 segundos
- **Legendario**: 180+ segundos

### Experiencia

- **Común**: 10-20 XP
- **Poco común**: 25-40 XP
- **Raro**: 50-80 XP
- **Épico**: 100-150 XP
- **Legendario**: 200+ XP

## 🔧 ARCHIVOS MODIFICADOS/CREADOS

### Creados

1. `server/systems/AdvancedCraftingSystem.js` (1,050 líneas)
   - Clase principal del sistema
   - 40+ recetas definidas
   - Sistema de upgrades
   - Sistema de modificadores
   - 7 workbenches
   - Métodos: craft(), upgrade(), applyModifier(), buildWorkbench()

2. `FASE14_CRAFTEO_AVANZADO.md` (este archivo)
   - Documentación completa

### Modificados

1. `server/survival_mvp.js` (+250 líneas)
   - Import de AdvancedCraftingSystem
   - 6 nuevos handlers de crafteo:
     - `craft:get_recipes`
     - `craft:item`
     - `craft:upgrade`
     - `craft:apply_modifier`
     - `craft:build_workbench`
     - `craft:get_info`

2. `public/survival.html` (+350 líneas)
   - UI mejorada de crafteo
   - 8 funciones JavaScript para crafteo:
     - `loadCraftRecipes()`
     - `switchCraftCategory()`
     - `showWorkbenchMenu()`
     - `selectWorkbench()`
     - `renderCraftRecipes()`
     - `craftItem()`
     - `upgradeItem()`
     - `applyModifier()`
     - `buildWorkbench()`
   - 7 message handlers:
     - `craft:recipes`
     - `craft:success`
     - `craft:upgraded`
     - `craft:modifier_applied`
     - `craft:workbench_built`
     - `craft:info`

3. `docs/PROGRESS.md`
   - Actualizado con Fase 14

## 🎮 FLUJO DE JUEGO TÍPICO

### Jugador Nivel 1-5 (Early Game)

1. Usa **Mesa Básica** (disponible desde inicio)
2. Craftea **Cuchillo**, **Vendaje**, **Molotov**
3. Recolecta materiales para **Mesa Avanzada**
4. Construye **Mesa Avanzada** al nivel 5
5. Desbloquea recetas intermedias

### Jugador Nivel 5-10 (Mid Game)

1. Usa **Mesa Avanzada**
2. Craftea **Machete**, **Armadura Ligera**, **Botiquín**
3. Mejora armas básicas a **versiones mejoradas**
4. Aplica **modificadores** (silenciador, mira)
5. Se especializa: construye **Armero** o **Médico**

### Jugador Nivel 10-15 (Late Game)

1. Usa mesas **especializadas**
2. Craftea **Rifle**, **Armadura Militar**, **C4**
3. Mejora items a **tier 3** (élite/táctico)
4. Acumula **múltiples modificadores** por item
5. Construye **Mesa Maestra** al nivel 15

### Jugador Nivel 15+ (End Game)

1. Usa **Mesa Maestra**
2. Craftea items **legendarios**: Katana, Armadura de Combate
3. Mejora todo a **máximo tier**
4. Personaliza equipo con **todos los modificadores**
5. Crea **Torreta Automática**, **Elixir Completo**

## 📊 ESTADÍSTICAS Y LOGROS SUGERIDOS

### Logros de Crafteo

- 🔨 **Aprendiz**: Craftea 10 items
- 🛠️ **Artesano**: Craftea 50 items
- ⚒️ **Maestro Artesano**: Craftea 200 items
- ⬆️ **Mejorador**: Mejora 10 items
- ⬆️⬆️ **Perfeccionista**: Mejora 50 items
- 🔧 **Modificador**: Aplica 20 modificadores
- 🏭 **Constructor**: Construye todas las mesas de trabajo
- 👑 **Leyenda del Craft**: Craftea todos los items legendarios

### Estadísticas Rastreadas

```javascript
player.stats = {
  items_crafteados: 0,
  items_mejorados: 0,
  modificadores_aplicados: 0,
  workbenches_construidos: 0,
  recetas_desbloqueadas: 0,
  materiales_consumidos: 0,
  tiempo_total_crafteo: 0, // segundos
};
```

## 🚀 MEJORAS FUTURAS SUGERIDAS

### Sistema de Blueprints

- Recetas raras encontradas en el mundo
- NPCs que enseñan recetas únicas
- Descubrir recetas mediante experimentación

### Crafteo Colaborativo

- Múltiples jugadores trabajan juntos
- Reducción de tiempo con ayuda
- Items de alto tier requieren múltiples crafters

### Especialización de Jugador

- Perks de crafteo por clase
- Bonificaciones para armero/médico/ingeniero
- Reduced material costs para especialidad

### Calidad del Item

- Items crafteados con % de "calidad"
- Probabilidad de crear versión "excepcional"
- Calidad afecta stats finales

### Durabilidad

- Items se desgastan con uso
- Reparación usando mesa de trabajo
- Modificadores afectan durabilidad

## 📝 NOTAS TÉCNICAS

### Rate Limiting

- Máximo **20 crafts por minuto** por jugador
- Previene spam y explotación
- Mensaje de error con tiempo restante

### Performance

- Recetas pre-calculadas en servidor
- Validación detallada antes de craftear
- Inventario actualizado atómicamente
- No hay estados inconsistentes

### Extensibilidad

- Fácil agregar nuevas recetas al array
- Workbenches configurables
- Modificadores modulares
- Sistema preparado para DLCs/expansiones

## ✅ TESTING CHECKLIST

- [ ] Craftear item básico (cuchillo)
- [ ] Craftear item avanzado (pistola)
- [ ] Craftear sin materiales suficientes (debe fallar)
- [ ] Craftear sin nivel requerido (debe fallar)
- [ ] Craftear sin workbench adecuado (debe fallar)
- [ ] Mejorar pistola → pistola mejorada
- [ ] Mejorar pistola mejorada → pistola de élite
- [ ] Intentar mejorar sin tener el item (debe fallar)
- [ ] Aplicar silenciador a pistola
- [ ] Aplicar mira a pistola (con silenciador ya aplicado)
- [ ] Aplicar modificador sin materiales (debe fallar)
- [ ] Construir Mesa Avanzada (nivel 5+)
- [ ] Construir Armero (nivel 8+, requiere Avanzada)
- [ ] Construir sin nivel (debe fallar)
- [ ] Construir sin workbench previo (debe fallar)
- [ ] Verificar XP ganado por craftear
- [ ] Verificar actualización de inventario
- [ ] Verificar UI muestra recetas correctamente
- [ ] Cambiar entre categorías (armas/armaduras/etc)
- [ ] Cambiar workbench activo
- [ ] Rate limit: intentar craftear 25 items rápidamente

## 🎉 CONCLUSIÓN

La **Fase 14** añade profundidad estratégica al juego mediante un sistema de crafteo completo que:

✅ Complementa el combate de Fase 13 con armas/armaduras crafteables  
✅ Proporciona progresión a largo plazo con workbenches y upgrades  
✅ Recompensa exploración y recolección de materiales  
✅ Permite personalización mediante modificadores  
✅ Integra con experiencia y estadísticas existentes  
✅ Escalabilidad para futuras expansiones

**Estado**: ✅ COMPLETAMENTE IMPLEMENTADO Y LISTO PARA TESTING

---

**Autor**: GitHub Copilot  
**Fecha**: Diciembre 2024  
**Versión**: 1.0  
**Líneas de código**: ~1,650 líneas (sistema + handlers + UI)
