# 🚀 Guía para Subir a GitHub

## Estado Actual
- ✅ Git inicializado
- ✅ .gitignore configurado
- ⚠️ Remote apunta a repo antiguo (Manolitri)
- 🎯 Nuevo repo: https://github.com/Lisandro1313/z-survival-v2

---

## Pasos para Subir al Nuevo Repositorio

### 1. Cambiar el Remote al Nuevo Repositorio

```bash
# Remover el remote antiguo
git remote remove origin

# Agregar el nuevo remote
git remote add origin https://github.com/Lisandro1313/z-survival-v2.git

# Verificar que se cambió correctamente
git remote -v
```

**Resultado esperado**:
```
origin  https://github.com/Lisandro1313/z-survival-v2.git (fetch)
origin  https://github.com/Lisandro1313/z-survival-v2.git (push)
```

---

### 2. Preparar el Commit

```bash
# Ver archivos modificados
git status

# Agregar todos los archivos
git add .

# Crear commit con mensaje descriptivo
git commit -m "🎮 FASE 10 completada: Sistema de logros, animaciones y efectos visuales

- Sistema de achievements (12 logros en 6 categorías)
- Efectos visuales de combate (números flotantes, shake)
- Banner de level up con partículas
- Panel de logros mejorado con categorías
- CSS animations completo (+370 líneas)
- Service layer completo (7 services)
- Middleware system (7 middlewares)
- Documentación completa de FASES 1-10"
```

---

### 3. Subir al Repositorio

```bash
# Primera vez (crear rama main y pushear)
git branch -M main
git push -u origin main

# O si ya existe la rama
git push origin main
```

**Si te pide autenticación**:
- Usar Personal Access Token (no password)
- Ir a: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generar token con permisos: `repo`, `workflow`
- Usar el token como password cuando te lo pida

---

### 4. Verificar en GitHub

1. Abrir: https://github.com/Lisandro1313/z-survival-v2
2. Verificar que aparecen todos los archivos
3. Verificar que `README.md` se vea bien
4. Comprobar que `.gitignore` está funcionando (no debe haber `node_modules/` ni `.sqlite`)

---

## Si Hay Conflictos o Problemas

### El repositorio no existe en GitHub
```bash
# Crear el repo en GitHub primero:
# 1. Ir a https://github.com/new
# 2. Nombre: z-survival-v2
# 3. Descripción: Survival Zombie Game - MVP con Sistema de Logros
# 4. NO inicializar con README (ya lo tenemos)
# 5. Click "Create repository"

# Luego ejecutar los comandos de arriba
```

### Ya hay contenido en el repositorio remoto
```bash
# Opción 1: Forzar push (CUIDADO: sobrescribe todo)
git push -f origin main

# Opción 2: Hacer pull primero y resolver conflictos
git pull origin main --allow-unrelated-histories
# Resolver conflictos manualmente
git add .
git commit -m "Merge con remote"
git push origin main
```

### Error de autenticación
```bash
# Configurar credenciales
git config --global user.name "Lisandro1313"
git config --global user.email "tu-email@example.com"

# Si sigue fallando, usar SSH en vez de HTTPS
git remote set-url origin git@github.com:Lisandro1313/z-survival-v2.git
```

---

## Comandos Útiles

### Ver estado actual
```bash
git status              # Ver archivos modificados
git log --oneline       # Ver historial de commits
git remote -v          # Ver remotes configurados
git branch -a          # Ver todas las ramas
```

### Deshacer cambios
```bash
git checkout .         # Deshacer cambios no commiteados
git reset HEAD~1       # Deshacer último commit (mantiene cambios)
git reset --hard HEAD~1 # Deshacer último commit (BORRA cambios)
```

### Limpiar archivos no deseados
```bash
git clean -fd          # Borrar archivos no rastreados
git rm --cached -r .   # Quitar archivos del índice (después agregar a .gitignore)
```

---

## Estructura Esperada en GitHub

```
z-survival-v2/
├── .gitignore
├── README.md
├── NEXT_STEPS.md ⭐ (NUEVO)
├── DEPLOY_GITHUB.md ⭐ (NUEVO)
├── package.json
├── railway.json
├── FASE*.md (documentación)
├── server/
│   ├── survival_mvp.js
│   ├── services/
│   ├── utils/
│   ├── db/
│   └── ...
└── public/
    ├── survival.html
    ├── style.css
    ├── js/
    └── ...
```

---

## Checklist Pre-Push

- [ ] `.gitignore` incluye `node_modules/`, `*.sqlite`, `.env`
- [ ] `README.md` está actualizado
- [ ] `NEXT_STEPS.md` creado con roadmap
- [ ] Servidor funciona localmente (`npm start`)
- [ ] No hay errores de sintaxis
- [ ] Base de datos no está incluida (solo schema)
- [ ] Credenciales o tokens no están en código

---

## Después de Subir

### 1. Crear README.md atractivo
```markdown
# 🧟 Z-Survival v2.0

Juego de supervivencia zombie multiplayer con sistema de logros y efectos visuales.

[Demo Live](URL) | [Documentación](NEXT_STEPS.md) | [Changelog](FASE10_LOGROS_ANIMACIONES.md)

## ✨ Features
- ⚔️ Combate por turnos con efectos visuales
- 🏆 Sistema de achievements (12 logros)
- 🤖 NPCs con IA social
- 💰 Economía y comercio
- 🎲 Juegos de casino
- 📜 Misiones narrativas

## 🚀 Quick Start
\`\`\`bash
npm install
npm start
# Open http://localhost:3000
\`\`\`

## 📊 Tech Stack
Node.js | Express | WebSocket | SQLite | Vanilla JS
```

### 2. Configurar GitHub Pages (opcional)
- Settings → Pages → Source: Deploy from branch → main → /docs

### 3. Agregar Topics
- Settings → Topics → Agregar: `game`, `zombie`, `multiplayer`, `nodejs`, `websocket`, `survival`

### 4. Deploy en Railway/Render
```bash
# Railway
railway login
railway init
railway up

# O Render
# Conectar repo desde dashboard de Render
```

---

## 🎯 Resumen de Comandos Rápidos

```bash
# Setup inicial (solo una vez)
git remote remove origin
git remote add origin https://github.com/Lisandro1313/z-survival-v2.git

# Workflow normal (cada vez que subas cambios)
git add .
git commit -m "Descripción de cambios"
git push origin main

# Ver cambios antes de commitear
git diff
git status
```

---

**¡Listo para subir! 🚀**

Si tienes dudas, revisa: https://docs.github.com/es/get-started
