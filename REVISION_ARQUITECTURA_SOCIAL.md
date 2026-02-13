# 🔍 REVISIÓN ARQUITECTURA - SISTEMA SOCIAL

## ❌ PROBLEMAS DETECTADOS

### 1. INCONSISTENCIAS EN NOMBRES DE MENSAJES WEBSOCKET

#### Problema: Fogata - Comentarios

- **Frontend envía:** `fogata:comment` con campo `comment`
- **Backend espera:** `fogata:comment` con campo `content` ❌
- **Backend responde:** `fogata:new_comment` (broadcast)
- **Frontend espera:** `fogata:commented` ❌

#### Problema: Fogata - Likes

- **Backend responde:** `fogata:like_update` (broadcast)
- **Frontend espera:** `fogata:liked` o no hace nada específico ❌

#### Problema: Fogata - Nuevo Post

- **Backend responde:** `fogata:new_post` (broadcast a todos)
- **Frontend:** NO tiene handler para esto ❌

#### Problema: Juegos - Lista

- **Backend responde:** `game:list_response`
- **Frontend espera:** `game:list` ❌

#### Problema: Juegos - Resultado

- **Backend responde:** `game:finished`
- **Frontend espera:** `game:result` ❌

#### Problema: Juegos - Actualización

- **Backend responde:** `game:updated` (broadcast)
- **Frontend:** NO tiene handler para esto ❌

### 2. HANDLERS FALTANTES EN FRONTEND

El frontend NO maneja estos broadcasts importantes:

- `fogata:new_post` - Cuando alguien más crea un post
- `fogata:like_update` - Actualización de likes en tiempo real
- `fogata:new_comment` - Cuando alguien más comenta
- `game:updated` - Cuando se actualiza un juego (nuevo jugador)
- `game:finished` - Resultado final del juego

### 3. PARÁMETROS INCONSISTENTES

#### game:join

- **Frontend envía:** `gameType` y `bet` (cantidad apostada)
- **Backend usa:** Solo `gameType`, ignora `bet` y usa configuración predefinida ❌

#### fogata:comment

- **Frontend envía:** `comment` (nombre del campo)
- **Backend espera:** `content` (nombre del campo) ❌

---

## ✅ SOLUCIÓN PROPUESTA

### NOMBRES ESTÁNDAR WEBSOCKET

```javascript
// FOGATA (Posts)
"fogata:create"; // Cliente → Servidor: Crear post
"fogata:created"; // Servidor → Cliente: Post creado (confirmación)
"fogata:new_post"; // Servidor → TODOS: Broadcast de nuevo post
"fogata:load"; // Cliente → Servidor: Cargar posts
"fogata:list"; // Servidor → Cliente: Lista de posts
"fogata:like"; // Cliente → Servidor: Toggle like
"fogata:like_update"; // Servidor → TODOS: Actualización de likes
"fogata:comment"; // Cliente → Servidor: Agregar comentario
"fogata:comment_added"; // Servidor → TODOS: Nuevo comentario agregado
"fogata:loadComments"; // Cliente → Servidor: Cargar comentarios
"fogata:comments"; // Servidor → Cliente: Lista de comentarios

// JUEGOS
"game:join"; // Cliente → Servidor: Unirse a juego
"game:joined"; // Servidor → Cliente: Confirmación de unión
"game:updated"; // Servidor → TODOS: Juego actualizado (nuevo jugador)
"game:list"; // Cliente → Servidor: Pedir lista de juegos
"game:list"; // Servidor → Cliente: Lista de juegos activos
"game:started"; // Servidor → TODOS: Juego iniciado
"game:finished"; // Servidor → TODOS: Juego terminado con resultados
```

### CAMBIOS NECESARIOS

#### Backend (server/survival_mvp.js)

1. ✅ Cambiar `fogata:new_comment` → mantener pero también enviar `fogata:comment_added`
2. ✅ Cambiar `game:list_response` → `game:list`
3. ✅ Agregar soporte para campo `comment` además de `content` en fogata:comment
4. ✅ Usar el campo `bet` que envía el cliente en game:join

#### Frontend (public/survival.html)

1. ✅ Agregar handler para `fogata:new_post` (actualizar feed en tiempo real)
2. ✅ Agregar handler para `fogata:like_update` (actualizar likes en tiempo real)
3. ✅ Agregar handler para `fogata:comment_added` (actualizar comentarios en tiempo real)
4. ✅ Agregar handler para `game:updated` (actualizar lista de juegos)
5. ✅ Cambiar handler de `game:list` para recibir lista correctamente
6. ✅ Cambiar handler de `game:result` a `game:finished`

---

## 🏗️ MEJORAS DE ARQUITECTURA

### 1. Centralizar Configuración de Mensajes

Crear un archivo compartido con los tipos de mensajes para evitar inconsistencias.

### 2. Validación de Datos

Agregar validación robusta en backend antes de procesar mensajes.

### 3. Sistema de Notificaciones Broadcast

Mejorar el sistema de broadcast para updates en tiempo real.

### 4. Manejo de Errores

Estandarizar respuestas de error.

---

## 🎯 PRIORIDAD DE CORRECCIONES

### Alta Prioridad (Rompen funcionalidad)

1. ❌ `fogata:comment` - Campo `comment` vs `content`
2. ❌ `game:list_response` vs `game:list`
3. ❌ `game:finished` vs `game:result`

### Media Prioridad (Funcionalidad limitada)

4. ⚠️ Falta handler `fogata:new_post` (no actualiza en tiempo real)
5. ⚠️ Falta handler `game:updated` (no actualiza jugadores en tiempo real)

### Baja Prioridad (Mejoras)

6. 💡 Usar campo `bet` del cliente
7. 💡 Estandarizar respuestas de broadcast
