# FASE 16: FRONTEND RAIDS - CAMBIOS NECESARIOS

## 1. AGREGAR EN SIDEBAR (después de línea 2088 - sección de economía)

```html
<!-- 🛡️ Raids PvE (FASE 16) -->
<div class="sidebar-section">
  <h3>🛡️ RAIDS PvE</h3>
  <button
    class="quick-action-btn"
    onclick="openRaidPanel()"
    style="background: linear-gradient(135deg, #cc0000, #990000);"
  >
    <span>⚔️</span>
    <span>Raid Activo</span>
  </button>
  <button
    class="quick-action-btn"
    onclick="showRaidHistory()"
    style="background: linear-gradient(135deg, #0088ff, #0066cc);"
  >
    <span>📜</span>
    <span>Historial</span>
  </button>
  <button
    class="quick-action-btn"
    onclick="showRaidStats()"
    style="background: linear-gradient(135deg, #ff8800, #ff6600);"
  >
    <span>🏆</span>
    <span>Top Defensores</span>
  </button>
</div>
```

## 2. AGREGAR MODAL DE RAID (antes del cierre de </body>)

```html
<!-- Modal de Raid (FASE 16) -->
<div class="economy-modal" id="raidModal" style="display: none;">
  <div class="economy-modal-content" style="max-width: 900px;">
    <div class="modal-header">
      <h2 id="raidModalTitle">🛡️ RAID ACTIVO</h2>
      <button class="close-btn" onclick="closeRaidPanel()">✕</button>
    </div>

    <div class="raid-container">
      <div id="raidContent">
        <!-- Se llenará dinámicamente -->
      </div>
    </div>
  </div>
</div>
```

## 3. AGREGAR CSS PARA RAIDS (en el <style>)

```css
/* ================================
   🛡️ RAIDS PvE (FASE 16)
   ================================ */

.raid-container {
  min-height: 400px;
}

.raid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: linear-gradient(135deg, #cc0000, #880000);
  border-radius: var(--card-radius);
  margin-bottom: var(--space-md);
}

.raid-difficulty {
  font-size: 24px;
  letter-spacing: 2px;
}

.raid-status-badge {
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 12px;
}

.raid-status-badge.active {
  background: #ff0000;
  animation: pulse 1s infinite;
}

.raid-status-badge.preparing {
  background: #ff8800;
}

.raid-status-badge.announced {
  background: #ffff00;
  color: #000;
}

.raid-refuge-health {
  margin: var(--space-md) 0;
}

.refuge-health-bar {
  width: 100%;
  height: 30px;
  background: var(--gray-card);
  border-radius: 15px;
  border: 2px solid var(--green-dim);
  overflow: hidden;
  position: relative;
}

.refuge-health-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff00, #00cc00);
  transition: width 0.5s ease;
}

.refuge-health-fill.low {
  background: linear-gradient(90deg, #ff8800, #ff0000);
}

.refuge-health-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.wave-progress {
  text-align: center;
  padding: var(--space-md);
  background: var(--gray-card);
  border-radius: var(--card-radius-sm);
  margin: var(--space-md) 0;
}

.wave-progress h3 {
  font-size: 24px;
  margin-bottom: var(--space-sm);
}

.zombie-counter {
  font-size: 18px;
  color: var(--red-danger);
}

.defenders-list {
  margin: var(--space-md) 0;
}

.defender-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm);
  background: var(--gray-card);
  border: 1px solid var(--gray-border);
  border-radius: var(--card-radius-sm);
  margin-bottom: var(--space-xs);
  transition: var(--transition-fast);
}

.defender-card:hover {
  border-color: var(--green-dim);
  transform: translateX(4px);
}

.defender-name {
  font-weight: bold;
  color: var(--green-safe);
}

.defender-stats {
  font-size: 12px;
  color: var(--gray-text);
}

.raid-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.raid-results {
  text-align: center;
  padding: var(--space-xl);
}

.raid-results h2 {
  font-size: 48px;
  margin-bottom: var(--space-md);
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin: var(--space-lg) 0;
}

.stat-item {
  padding: var(--space-md);
  background: var(--gray-card);
  border-radius: var(--card-radius-sm);
  border: 1px solid var(--gray-border);
}

.loot-display {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.loot-item {
  padding: var(--space-sm);
  background: var(--gray-card);
  border: 2px solid var(--green-dim);
  border-radius: var(--card-radius-sm);
  text-align: center;
  transition: var(--transition-fast);
}

.loot-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
}

.loot-item.rare {
  border-color: #00bbff;
}

.loot-item.epic {
  border-color: #9900cc;
}

.loot-item.legendary {
  border-color: #ff8800;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 10px currentColor;
  }
  50% {
    box-shadow: 0 0 20px currentColor;
  }
}

.raid-countdown {
  font-size: 32px;
  font-weight: bold;
  color: var(--orange-warn);
  text-align: center;
  padding: var(--space-md);
  background: var(--gray-card);
  border-radius: var(--card-radius);
  margin: var(--space-md) 0;
}

.no-raid-message {
  text-align: center;
  padding: var(--space-xl);
  color: var(--gray-text);
  font-style: italic;
}

.scheduled-raid-card {
  padding: var(--space-md);
  background: var(--gray-card);
  border: 2px solid var(--gray-border);
  border-radius: var(--card-radius);
  margin-bottom: var(--space-sm);
}

.scheduled-raid-card h4 {
  margin-bottom: var(--space-sm);
  color: var(--orange-warn);
}
```

## 4. AGREGAR FUNCIONES JAVASCRIPT (al final del script)

```javascript
// ================================
// 🛡️ RAIDS PvE (FASE 16)
// ================================

function openRaidPanel() {
  document.getElementById("raidModal").style.display = "flex";
  requestRaidInfo();
}

function closeRaidPanel() {
  document.getElementById("raidModal").style.display = "none";
}

function requestRaidInfo() {
  sendMessage({ type: "raid:get_active" });
}

function showRaidHistory() {
  sendMessage({ type: "raid:get_history", limit: 10 });
}

function showRaidStats() {
  sendMessage({ type: "raid:get_my_stats" });
}

function renderRaidPanel(raid, scheduledRaids = []) {
  const content = document.getElementById("raidContent");

  if (!raid) {
    // No hay raid activo
    content.innerHTML = `
      <div class="no-raid-message">
        <h3>🛡️ No hay raids activos en este momento</h3>
        <p>Mantente alerta. Los raids se anuncian 5 minutos antes de comenzar.</p>
        ${
          scheduledRaids.length > 0
            ? `
          <div style="margin-top: 24px;">
            <h4>📅 Raids Programados:</h4>
            ${scheduledRaids
              .map(
                (r) => `
              <div class="scheduled-raid-card">
                <h4>${r.emoji} ${r.name}</h4>
                <p>Dificultad: ${"⭐".repeat(r.difficulty)}</p>
                <p>Comienza en: ${formatTime(r.scheduledFor - Date.now())}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `;
    return;
  }

  let statusBadge = "";
  if (raid.status === "active") {
    statusBadge = '<span class="raid-status-badge active">⚔️ EN CURSO</span>';
  } else if (raid.status === "preparing") {
    statusBadge =
      '<span class="raid-status-badge preparing">⏱️ PREPARANDO</span>';
  } else if (raid.status === "announced") {
    statusBadge =
      '<span class="raid-status-badge announced">🔔 ANUNCIADO</span>';
  }

  const healthPercent = (raid.refuge.health / raid.refuge.maxHealth) * 100;
  const healthClass = healthPercent < 30 ? "low" : "";

  content.innerHTML = `
    <div class="raid-header">
      <div>
        <h2>${raid.emoji} ${raid.name}</h2>
        <div class="raid-difficulty">${"⭐".repeat(raid.difficulty)}</div>
      </div>
      <div>
        ${statusBadge}
      </div>
    </div>

    ${
      raid.status === "announced"
        ? `
      <div class="raid-countdown">
        ⏰ Comienza en: <span id="raidCountdown">${formatTime(raid.timing.startsAt - Date.now())}</span>
      </div>
      <div class="raid-actions">
        <button class="shop-item-btn" onclick="requestNPCShop()">
          🛒 Comprar Suministros
        </button>
        <button class="shop-item-btn" onclick="openCraftingMenu()">
          🔨 Craftear Items
        </button>
      </div>
    `
        : ""
    }

    ${
      raid.status === "active"
        ? `
      <div class="raid-refuge-health">
        <label><strong>🏠 Integridad del Refugio</strong></label>
        <div class="refuge-health-bar">
          <div class="refuge-health-fill ${healthClass}" style="width: ${healthPercent}%"></div>
          <div class="refuge-health-text">${raid.refuge.health} / ${raid.refuge.maxHealth} HP</div>
        </div>
      </div>

      <div class="wave-progress">
        <h3>🌊 Oleada ${raid.progress.currentWave} / ${raid.progress.totalWaves}</h3>
        <div class="zombie-counter">🧟 ${raid.progress.zombiesAlive} zombies vivos</div>
        <div style="margin-top: 12px; color: #888;">
          Total eliminados: ${raid.progress.zombiesKilled}
        </div>
      </div>

      <div class="raid-actions">
        <button class="shop-item-btn" style="background: linear-gradient(135deg, #ff0000, #cc0000);" 
                onclick="attackRaidZombie()">
          ⚔️ Atacar Zombies
        </button>
        <button class="shop-item-btn" style="background: linear-gradient(135deg, #ff8800, #ff6600);" 
                onclick="placeDefense()">
          🎯 Colocar Trampa
        </button>
        <button class="shop-item-btn" style="background: linear-gradient(135deg, #00cc00, #009900);" 
                onclick="repairRefuge()">
          🔧 Reparar Refugio
        </button>
      </div>
    `
        : ""
    }

    <div class="defenders-list">
      <h3>👥 Defensores (${raid.defenders.length})</h3>
      ${raid.defenders
        .map(
          (d) => `
        <div class="defender-card">
          <span class="defender-name">${d.playerName}</span>
          <span class="defender-stats">
            💀 ${d.zombiesKilled} | 
            🗡️ ${d.damageDealt} | 
            🔧 ${d.repairsDone}
          </span>
        </div>
      `,
        )
        .join("")}
    </div>

    ${
      raid.status === "completed" || raid.status === "failed"
        ? `
      <div class="raid-results">
        <h2>${raid.successful ? "✅ VICTORIA" : "❌ DERROTA"}</h2>
        <div class="stats-summary">
          <div class="stat-item">
            <div>Zombies eliminados</div>
            <div style="font-size: 24px; color: var(--green-safe);">${raid.progress.zombiesKilled}</div>
          </div>
          <div class="stat-item">
            <div>Daño recibido</div>
            <div style="font-size: 24px; color: var(--red-danger);">${raid.refuge.damageTaken}</div>
          </div>
          <div class="stat-item">
            <div>Defensores</div>
            <div style="font-size: 24px; color: var(--blue-info);">${raid.defenders.length}</div>
          </div>
        </div>
      </div>
    `
        : ""
    }
  `;

  // Actualizar countdown si está anunciado
  if (raid.status === "announced") {
    updateRaidCountdown(raid.timing.startsAt);
  }
}

function updateRaidCountdown(startsAt) {
  const countdownEl = document.getElementById("raidCountdown");
  if (!countdownEl) return;

  const interval = setInterval(() => {
    const timeLeft = startsAt - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      countdownEl.textContent = "¡COMENZANDO!";
      return;
    }
    countdownEl.textContent = formatTime(timeLeft);
  }, 1000);
}

function formatTime(ms) {
  if (ms < 0) return "00:00";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function attackRaidZombie() {
  // Simplificado - atacar al primer zombie disponible
  const raid = window.currentRaid;
  if (!raid || !raid.progress.zombiesAlive) {
    showToast("No hay zombies para atacar", "error");
    return;
  }

  // En una implementación completa, habría un targeting system
  showToast("⚔️ Atacando zombie...", "info");
  sendMessage({
    type: "raid:attack_zombie",
    zombieId: "zombie_" + Date.now(), // Placeholder
  });
}

function placeDefense() {
  // Modal simple para elegir tipo de trampa
  const defenseType = prompt(
    "Tipo de defensa:\n1. Trampa de púas\n2. Mina terrestre\n3. Alambre de púas\n4. Molotov automático\n5. Red eléctrica",
  );

  const types = [
    "trampa_puas",
    "mina_terrestre",
    "alambre_puas",
    "molotov_auto",
    "red_electrica",
  ];
  const index = parseInt(defenseType) - 1;

  if (index < 0 || index >= types.length) {
    showToast("Tipo de defensa inválido", "error");
    return;
  }

  sendMessage({
    type: "raid:place_defense",
    defenseType: types[index],
    position: { x: Math.random() * 100, y: Math.random() * 100 },
  });
}

function repairRefuge() {
  const amount = prompt("¿Cuántos HP quieres reparar?");
  const hp = parseInt(amount);

  if (isNaN(hp) || hp <= 0) {
    showToast("Cantidad inválida", "error");
    return;
  }

  sendMessage({
    type: "raid:repair_refuge",
    amount: hp,
  });
}

// Handler de mensajes WebSocket
function handleRaidMessage(msg) {
  switch (msg.type) {
    case "raid:active":
      window.currentRaid = msg.activeRaid;
      renderRaidPanel(msg.activeRaid, msg.scheduledRaids);
      break;

    case "raid:announced":
      showToast(
        `🔔 ${msg.raid.name} anunciado! Comienza en 5 minutos`,
        "warning",
      );
      if (document.getElementById("raidModal").style.display === "flex") {
        renderRaidPanel(msg.raid);
      }
      break;

    case "raid:started":
      showToast(`🚨 ${msg.raid.name} INICIADO!`, "error");
      window.currentRaid = msg.raid;
      if (document.getElementById("raidModal").style.display === "flex") {
        renderRaidPanel(msg.raid);
      }
      break;

    case "raid:progress":
      window.currentRaid = msg.raid;
      if (document.getElementById("raidModal").style.display === "flex") {
        renderRaidPanel(msg.raid);
      }
      break;

    case "raid:zombie_attacked":
      if (msg.killed) {
        showToast(
          `💀 ${msg.playerName} eliminó a ${msg.zombieType}!`,
          "success",
        );
      }
      break;

    case "raid:defense_placed":
      showToast(`🎯 Defensa colocada exitosamente`, "success");
      break;

    case "raid:refuge_repaired":
      showToast(`🔧 ${msg.playerName} reparó +${msg.repaired} HP`, "success");
      break;

    case "raid:completed":
      showToast(`🎉 ¡RAID COMPLETADO!`, "success");
      window.currentRaid = msg.raid;
      if (document.getElementById("raidModal").style.display === "flex") {
        renderRaidPanel(msg.raid);
      }
      break;

    case "raid:failed":
      showToast(`💀 RAID FALLIDO - El refugio ha caído`, "error");
      window.currentRaid = msg.raid;
      if (document.getElementById("raidModal").style.display === "flex") {
        renderRaidPanel(msg.raid);
      }
      break;

    case "raid:rewards":
      displayRaidRewards(msg);
      break;
  }
}

function displayRaidRewards(msg) {
  const rewardsHTML = `
    <div class="raid-results">
      <h2>${msg.successful ? "🏆 ¡Victoria!" : "💀 Derrota"}</h2>
      <h3>Tu Rango: ${msg.participation.rank.toUpperCase()}</h3>
      <p>Participación: ${msg.participation.percent.toFixed(1)}%</p>
      
      <div class="stats-summary">
        <div class="stat-item">
          <div>💰 Caps</div>
          <div style="font-size: 24px;">+${msg.rewards.caps}</div>
        </div>
        <div class="stat-item">
          <div>💀 Zombies</div>
          <div style="font-size: 24px;">${msg.participation.stats.zombiesKilled}</div>
        </div>
        <div class="stat-item">
          <div>🗡️ Daño</div>
          <div style="font-size: 24px;">${msg.participation.stats.damageDealt}</div>
        </div>
      </div>
      
      <div class="loot-display">
        ${msg.rewards.items
          .map(
            (item) => `
          <div class="loot-item ${item.rarity}">
            <div>${item.category}</div>
            <div>x${item.quantity}</div>
            <small>${item.rarity}</small>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  document.getElementById("raidContent").innerHTML = rewardsHTML;
  showToast(`💰 +${msg.rewards.caps} caps obtenidos!`, "success");
}

// Agregar al switch del WebSocket handler principal
// En la función ws.onmessage, agregar:
// case 'raid:*': handleRaidMessage(msg); break;
```

## 5. INTEGRAR EN EL WEBSOCKET HANDLER

En la función `ws.onmessage`, agregar antes del `default`:

```javascript
// Raids PvE (FASE 16)
if (msg.type && msg.type.startsWith('raid:')) {
  handleRaidMessage(msg);
  break;
}
```

## RESUMEN

Este archivo contiene todos los cambios necesarios para implementar el frontend de la Fase 16 en survival.html:

1. ✅ Sección de raids en sidebar
2. ✅ Modal de raid con toda la UI
3. ✅ CSS completo para raids
4. ✅ Funciones JavaScript para manejar raids
5. ✅ Integración con WebSocket

**Total estimado:** ~600 líneas de código frontend
