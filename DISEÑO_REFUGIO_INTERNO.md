# 🏘️ DISEÑO: Sistema de Sub-Ubicaciones del Refugio

## 📍 Ubicaciones Internas del Refugio

### 1. **🍺 TABERNA "EL ÚLTIMO TRAGO"**

**NPC Principal: Rosa la Tabernera**

- **Actividades:**
  - 🎲 Juegos: Poker, Blackjack
  - 💰 Comercio: Intercambio de recursos por monedas
  - 💕 Romance: Sistema de relación con Rosa
  - 🗣️ Conversaciones con clientes borrachos
- **NPCs Secundarios:**
  - Borracho Ramón (siempre cuenta historias)
  - Viejo Soldado (veterano de guerra)
  - Mercader ambulante (comercio especial)

- **Sistema de Romance con Rosa:**
  - **Nivel 0-20:** Te ignora
  - **Nivel 21-40:** Conversación casual
  - **Nivel 41-60:** Coqueteo ligero
  - **Nivel 61-80:** Interés romántico
  - **Nivel 81-100:** Relación íntima

  **Subir nivel de relación:**
  - Regalar flores (+5)
  - Regalar medicinas (+10)
  - Regalar comida especial (+8)
  - Ganar partidas en su taberna (+3)
  - Protegerla en eventos (+15)

  **Beneficios de relación alta:**
  - Nivel 60+: Descuentos en comercio (20% off)
  - Nivel 80+: Te da comida gratis cada día
  - Nivel 100: Escenas íntimas + buff permanente (+10% a todos los stats)

---

### 2. **🎲 CALLEJÓN OSCURO**

**Zona peligrosa y clandestina**

- **Actividades:**
  - 🎲 Juegos ilegales: Dados, Apuestas altas
  - 🔫 Mercado negro: Armas, contrabando
  - 💀 Peleas clandestinas
- **NPCs:**
  - "El Tuerto" (organizador de juegos)
  - Contrabandista Miguel
  - Peleador callejero
- **Características:**
  - Apuestas más altas que en la taberna
  - Riesgo de ser robado (5% probabilidad)
  - Misiones ilegales disponibles

---

### 3. **🔥 PLAZA CENTRAL / FOGATA**

**Centro social del refugio**

- **Actividades:**
  - 📢 Muro de anuncios (posts sociales)
  - 🔥 Fogata comunitaria
  - 🤝 Reuniones de grupo
  - 📰 Noticias y rumores
- **NPCs:**
  - Capitán Rivas (lidera reuniones)
  - Chismosa Marta (rumores)
  - Niños jugando
- **Funcionalidades:**
  - Ver posts de otros jugadores
  - Crear anuncios
  - Organizar grupos
  - Escuchar rumores sobre locaciones

---

### 4. **⚕️ ENFERMERÍA**

**Centro médico**

- **NPC: Dr. Gómez**
- **Actividades:**
  - 💊 Curarse (costo: medicinas o monedas)
  - 🧪 Craftear medicamentos
  - 📚 Aprender primeros auxilios
- **NPCs secundarios:**
  - María (paciente)
  - Enfermera Ana

---

### 5. **🛠️ TALLER DE CRAFTEO**

**Zona de fabricación**

- **NPC: Marco el Mecánico**
- **Actividades:**
  - 🔨 Craftear armas
  - 🛡️ Mejorar armadura
  - 🔧 Reparar equipo

---

### 6. **🛏️ DORMITORIOS**

**Área de descanso**

- **Actividades:**
  - 💤 Dormir para recuperar energía
  - 📦 Almacén personal (inventario extendido)
  - 🔒 Espacio privado con NPCs romanceables

---

## 💰 SISTEMA DE MONEDA

### **"Fichas de Supervivencia"**

- Se obtienen:
  - Completando misiones (10-50 fichas)
  - Ganando en juegos (5-100 fichas)
  - Comerciando recursos (conversión dinámica)
  - Eventos especiales

- Se usan para:
  - Comprar en taberna/mercado negro
  - Pagar servicios médicos
  - Sobornar NPCs
  - Comprar regalos para romance

---

## 💕 SISTEMA DE ROMANCE

### **NPCs Romanceables:**

1. **Rosa (Tabernera)** - Difícil, requiere regalos caros
2. **Ana (Enfermera)** - Media, le gustan las medicinas
3. **Sofía (Comerciante)** - Fácil, le gusta la atención

### **Mecánicas:**

- **Barra de relación (0-100)**
- **Diálogos románticos desbloqueables**
- **Regalos específicos según personalidad**
- **Escenas especiales en nivel 100**

### **Beneficios de romance:**

- **Nivel 60+:** Descuentos especiales
- **Nivel 80+:** Ayuda en combate
- **Nivel 100:** Buff permanente de stats + contenido exclusivo

---

## 🎮 NAVEGACIÓN

### **UI de Navegación:**

```
[TABERNA] [CALLEJÓN] [PLAZA] [ENFERMERÍA] [TALLER] [DORMITORIOS]
    ↑           ↑        ↑         ↑          ↑          ↑
 Click para  moverse entre ubicaciones
```

### **Mapa del Refugio:**

```
    [ENTRADA]
        |
   [PLAZA CENTRAL]
    /    |    \
[TABERNA][ENFERMERÍA][TALLER]
    |         |          |
[CALLEJÓN][DORMITORIOS]
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### **Estructura de Datos:**

```javascript
WORLD.refugio = {
  subLocations: {
    taberna: {
      name: "Taberna El Último Trago",
      npcs: ["rosa", "ramon", "soldado"],
      activities: ["poker", "blackjack", "comercio", "romance"],
      description: "🍺 Una taberna acogedora...",
    },
    callejon: {
      name: "Callejón Oscuro",
      npcs: ["el_tuerto", "miguel", "peleador"],
      activities: ["dados", "mercado_negro", "peleas"],
      description: "🎲 Un lugar peligroso...",
    },
    plaza: {
      name: "Plaza Central",
      npcs: ["capitan_rivas", "marta", "ninos"],
      activities: ["fogata", "posts", "grupos"],
      description: "🔥 El corazón del refugio...",
    },
    // ... más ubicaciones
  },

  currentSubLocation: "plaza", // Ubicación actual del jugador
};
```

### **Nuevos NPCs con Atributos Extendidos:**

```javascript
{
  id: 'rosa',
  nombre: 'Rosa la Tabernera',
  avatar: '👩‍🦰',
  location: 'taberna',
  role: 'tabernera',
  romanceable: true,
  relationshipLevel: 0,
  personality: {
    likes: ['flores', 'vino', 'poesia'],
    dislikes: ['violencia', 'mentiras'],
    flirtDifficulty: 'hard'
  },
  dialogue: {
    0: "¿Qué quieres? Estoy ocupada.",
    20: "Ah, eres tú de nuevo. ¿Qué necesitas?",
    40: "Me caes bien, siempre vienes a ayudar.",
    60: "*sonrisa* ¿Otra vez por aquí?",
    80: "*se sonroja* Me... me alegra verte.",
    100: "Te he estado esperando... *beso*"
  },
  inventory: {
    fichas: 500,
    bebidas: 20,
    comida: 30
  }
}
```

---

## 🎯 PRIORIDAD DE IMPLEMENTACIÓN

### **FASE 1: Estructura Básica** ⏱️ 2-3 horas

- [x] Crear sistema de sub-ubicaciones
- [x] Navegación entre ubicaciones
- [x] NPCs asignados a ubicaciones
- [x] UI de navegación en refugio

### **FASE 2: Sistema de Comercio** ⏱️ 1-2 horas

- [x] Moneda "Fichas de Supervivencia"
- [x] Tiendas por ubicación
- [x] Conversión recursos <-> fichas

### **FASE 3: Sistema de Romance** ⏱️ 2-3 horas

- [x] Barra de relación
- [x] Sistema de regalos
- [x] Diálogos románticos
- [x] Escenas especiales

### **FASE 4: Juegos por Ubicación** ⏱️ 1 hora

- [x] Poker/Blackjack en taberna
- [x] Dados en callejón
- [x] Diferentes stakes según ubicación

### **FASE 5: Contenido Adulto (Opcional)** ⏱️ 1-2 horas

- [x] Escenas románticas nivel 100
- [x] Buffs por relación
- [x] Contenido bloqueado por edad

---

## ✅ ¿APROBADO?

Este diseño te da:

- ✅ Múltiples ubicaciones dentro del refugio
- ✅ NPCs específicos por zona
- ✅ Sistema de romance completo
- ✅ Economía con moneda
- ✅ Juegos distribuidos por ubicación
- ✅ Navegación intuitiva
- ✅ Contenido adulto opcional

**¿Quieres que implemente esto completo o prefieres empezar solo con algunas partes?**
