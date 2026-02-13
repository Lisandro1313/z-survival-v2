# 🧟 Survival Zombie - Multiplayer RPG

¡El mundo ha caído! Juego de supervivencia zombie multijugador en tiempo real con NPCs vivos, crafting, quests cooperativas y sistema de personajes con clases.

## 🎮 Características

### 🎭 Sistema de Personajes

- **Login/Registro** con persistencia en base de datos
- **4 Clases**: Soldado, Médico, Ingeniero, Superviviente
- **Atributos personalizables**: Fuerza, Resistencia, Agilidad, Inteligencia
- **Avatares y colores** únicos
- **Sistema de niveles y XP** con progreso guardado

### 🌍 Mundo Vivo

- **6 locaciones** explorables con zombies dinámicos
- **4 NPCs** con rutinas autónomas:
  - Salen a explorar y traen recursos
  - Hablan entre ellos cada 90 segundos
  - Necesitan comida o mueren
  - Tienen moral que afecta el refugio
- **Hordas de zombies** cada hora del juego
- **Eventos emergentes** con decisiones y consecuencias

### 🌟 FASE 11: Eventos Globales & Misiones Dinámicas

- **4 Tipos de Eventos Globales**:
  - 🧟 Zombie Horde - Hordas masivas que amenazan el refugio
  - 📦 Supply Airdrop - Cajas de suministros del cielo
  - 👤 Traveling Merchant - Comerciantes con items raros
  - ⛈️ Severe Weather - Clima extremo con efectos especiales
- **Misiones Dinámicas** generadas por relaciones y eventos
- **Programación automática** de eventos cada 10-20 minutos
- **Notificaciones en tiempo real** para todos los jugadores
- **UI dedicada** con tarjetas de eventos y misiones

### 🏗️ FASE 12: Construcción Cooperativa

- **8 Estructuras construibles**:
  - 🛡️ Defensive Wall - Aumenta defensa del refugio
  - 🌿 Garden - Genera comida pasivamente
  - 🗼 Watch Tower - Mejora detección de amenazas
  - 🛠️ Workshop - Reduce costos de crafteo
  - ⚕️ Infirmary - Regenera HP pasivamente
  - 📦 Storage - Aumenta capacidad de inventario
  - 📡 Radio Tower - Mejora rango de comunicación
  - 🎯 Training Ground - Bonus de XP para todos
- **Sistema de contribuciones** - Múltiples jugadores construyen juntos
- **Progreso en tiempo real** con barras visuales
- **Efectos permanentes** aplicados al refugio
- **Sistema de niveles** - Mejora estructuras hasta nivel 3-5

### 🤝 Multijugador Cooperativo

- **Quests cooperativas** con votación en tiempo real
- Decisiones grupales que afectan el refugio
- Chat en tiempo real (logs del mundo)
- Ver otros jugadores en tu ubicación

### ⚔️ Mecánicas de Juego

- **Scavenge**: Buscar recursos en locaciones (cooldown 3s)
- **Crafting**: Crear items y defensas (cooldown 2s)
- **Combate**: Disparar zombies pero genera ruido (cooldown 4s)
- **Sistema de skills**: 6 habilidades que mejoran con uso
- **Recursos del refugio**: Compartidos entre todos

## 🚀 Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/survival-zombie.git
cd survival-zombie

# Instalar dependencias
npm install

# Iniciar servidor
npm start

# Abrir en navegador
http://localhost:3000
```

## 📦 Dependencias

- **Node.js** v16+
- **Express** - Servidor HTTP
- **ws** - WebSockets para tiempo real
- **better-sqlite3** - Base de datos persistente

## 🌐 Deploy en Railway (RECOMENDADO)

### Paso 1: Preparar GitHub

```bash
# Inicializar git (si no lo hiciste)
git init
git add .
git commit -m "Initial commit"

# Crear repo en GitHub y conectar
git remote add origin https://github.com/TU_USUARIO/survival-zombie.git
git push -u origin main
```

### Paso 2: Deploy en Railway

1. Ve a [Railway.app](https://railway.app) y haz login con GitHub
2. Click en **"New Project"** → **"Deploy from GitHub repo"**
3. Selecciona tu repositorio `survival-zombie`
4. Railway detecta automáticamente Node.js y hace deploy
5. Ve a **Settings** → **Networking** → **Generate Domain**
6. ¡Listo! Comparte la URL con amigos: `https://tu-proyecto.up.railway.app`

**Variables de entorno (opcional):**

- `PORT` = 3000 (Railway lo asigna automático)

## 🎯 Cómo Jugar Multijugador

### ✅ Opción 1: Railway/Render (MEJOR)

- Deploy el proyecto
- Comparte la URL pública con amigos
- Todos crean cuenta y personaje
- ¡Jueguen juntos desde cualquier lugar!

### Opción 2: LAN (misma WiFi)

```bash
# Host encuentra su IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Amigos se conectan a
http://TU_IP:3000
```

### Opción 3: Túnel (ngrok)

```bash
# Instalar ngrok
ngrok http 3000

# Compartir URL pública
https://xyz.ngrok.io
```

## 🗺️ Estructura del Proyecto

```
survival-zombie/
├── server/
│   ├── survival_mvp.js       # Servidor principal + simulación
│   ├── db/
│   │   ├── survivalDB.js     # Manager de base de datos
│   │   └── survival_schema.sql # Esquema SQL
│   └── ws.js                 # WebSocket handlers (legacy)
├── public/
│   ├── index.html            # Login y creación de personajes
│   └── survival.html         # Juego principal
├── package.json
└── README.md
```

## 🎮 Controles

- **Scavenge**: Buscar recursos en locaciones de loot
- **Craft**: Crear vendajes, molotovs, barricadas, trampas
- **Shoot**: Matar zombies (requiere armas, cooldown 4s)
- **Move**: Viajar entre locaciones
- **Give**: Dar items a NPCs para mejorar moral
- **Vote**: Participar en quests cooperativas

## 🏆 Sistema de Clases

### 🎖️ Soldado

- +2 Fuerza | +2 Combate
- Experto en combate y armas

### ⚕️ Médico

- +2 Inteligencia | +2 Medicina
- Salva vidas y cura heridas

### 🔧 Ingeniero

- +1 Inteligencia | +3 Mecánica
- Maestro del crafteo y construcción

### 🎒 Superviviente

- +1 Agilidad | +2 Supervivencia | +1 Sigilo
- Adaptable y sigiloso

## 🤝 Quests Cooperativas

Aparecen cada 4 minutos con 2+ jugadores:

- 🏥 **Expedición al Hospital** - Riesgo vs recompensa
- 🚁 **Señal de Radio Misteriosa** - Aliados o trampa
- 👥 **Grupo de Refugiados** - Moral vs recursos
- ⚠️ **Defensa del Refugio** - Defender o evacuar

Todos votan, la mayoría decide, las consecuencias son reales.

## ⚙️ Sistema de Cooldowns

Para evitar spam y hacer el juego más estratégico:

- **Scavenge**: 3 segundos
- **Craft**: 2 segundos
- **Shoot**: 4 segundos

## 📝 Comandos Git

```bash
# Estado actual
git status

# Agregar cambios
git add .
git commit -m "Tu mensaje"

# Subir a GitHub
git push

# Crear rama nueva
git checkout -b nueva-feature

# Volver a main
git checkout main
```

## 🐛 Troubleshooting

**Error: Cannot find module**

```bash
npm install
```

**Puerto 3000 en uso**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID NUMERO /F

# Mac/Linux
lsof -i :3000
kill -9 PID
```

**WebSocket no conecta en Railway**

- Asegúrate que Railway generó un dominio público
- WebSocket usa la misma URL (cambia http→ws automático)

## 📝 Licencia

MIT

## 👨‍💻 Desarrollo

```bash
# Modo desarrollo (auto-restart)
npm install -g nodemon
nodemon server/survival_mvp.js
```

## 🔮 Roadmap

### ✅ Completado

- [x] FASE 1-10: Sistema base MVP con multijugador
- [x] FASE 11: Eventos Globales & Misiones Dinámicas (~1,450 líneas)
- [x] FASE 12: Sistema de Construcción Cooperativa (~1,200 líneas)

### 🚧 En Desarrollo

- [ ] FASE 13: Por determinar (opciones: Raids PvE, Clanes, Economía, Vehículos)

### 🔮 Futuras Expansiones

- [ ] Más locaciones (zona militar, hospital, mall)
- [ ] Sistema de clanes/grupos con territorios
- [ ] Sistema de economía y comercio
- [ ] Sistema de vehículos
- [ ] Más eventos especiales
- [ ] Sistema de logros y estadísticas
- [ ] PvP opcional en zonas específicas
- [ ] Más tipos de zombies (corredor, tanque, etc)
- [ ] Mapa más grande con sistema de chunks
- [ ] Migración a motor 3D (Three.js/Babylon.js)

---

**¡Sobrevive o muere intentándolo!** 🧟‍♂️

Desarrollado con ❤️ y mucho café
