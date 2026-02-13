/**
 * Funciones auxiliares y utilidades
 */

export function log(message, type = 'info') {
    const logDiv = document.getElementById('log');
    if (!logDiv) return;

    const colors = {
        info: '#00ff00',
        warning: '#ffaa00',
        error: '#ff0000',
        combat: '#ff8800',
        success: '#00ffff'
    };

    const entry = document.createElement('div');
    entry.style.color = colors[type] || colors.info;
    entry.style.padding = '2px 0';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;

    // Limitar a 100 mensajes
    while (logDiv.children.length > 100) {
        logDiv.removeChild(logDiv.firstChild);
    }
}

export function worldLog(message, type = 'info') {
    const logDiv = document.getElementById('worldLog');
    if (!logDiv) return;

    const colors = {
        info: '#88ff88',
        warning: '#ffaa00',
        error: '#ff0000',
        player: '#00ffff',
        combat: '#ff8800',
        comercio: '#ffff00'
    };

    const entry = document.createElement('div');
    entry.style.color = colors[type] || colors.info;
    entry.style.padding = '3px 5px';
    entry.style.borderBottom = '1px solid #222';
    entry.textContent = message;

    logDiv.insertBefore(entry, logDiv.firstChild);

    // Limitar a 50 eventos
    while (logDiv.children.length > 50) {
        logDiv.removeChild(logDiv.lastChild);
    }
}

export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#00aa00' : type === 'error' ? '#aa0000' : '#0066aa'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    font-weight: bold;
  `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

export function showBadge(tabId) {
    const tab = document.getElementById(`tab-${tabId}`);
    if (!tab || tab.classList.contains('active')) return;

    const badge = document.createElement('span');
    badge.className = 'notification-badge';
    badge.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background: red;
    color: white;
    border-radius: 50%;
    width: 8px;
    height: 8px;
    animation: pulse 1s infinite;
  `;
    tab.style.position = 'relative';
    tab.appendChild(badge);
}

export function clearBadge(tabId) {
    const tab = document.getElementById(`tab-${tabId}`);
    if (!tab) return;

    const badge = tab.querySelector('.notification-badge');
    if (badge) badge.remove();
}

// Cache para renderizado optimizado
const renderCache = new Map();

export function cachedRender(key, renderFn, data) {
    const dataStr = JSON.stringify(data);
    const cached = renderCache.get(key);

    if (cached === dataStr) return; // Sin cambios

    renderCache.set(key, dataStr);
    renderFn();
}

export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateDistance(loc1, loc2, locations) {
    // BFS para encontrar distancia entre locaciones
    if (loc1 === loc2) return 0;

    const queue = [[loc1, 0]];
    const visited = new Set([loc1]);

    while (queue.length > 0) {
        const [current, dist] = queue.shift();
        const location = locations[current];

        if (!location) continue;

        for (const neighbor of location.conectado_a || []) {
            if (neighbor === loc2) return dist + 1;
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([neighbor, dist + 1]);
            }
        }
    }

    return -1; // No conectado
}
