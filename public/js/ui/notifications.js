/**
 * Sistema de notificaciones toast
 * Reemplaza alert() y mejora el feedback visual
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Crear contenedor de notificaciones
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: success, error, warning, info
     * @param {number} duration - Duración en ms (0 = permanente hasta click)
     */
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getIcon(type);
        const closeBtn = duration === 0 ? '<button class="toast-close">✕</button>' : '';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
            ${closeBtn}
        `;

        // Animación de entrada
        toast.style.animation = 'slideInRight 0.3s ease-out';

        this.container.appendChild(toast);

        // Auto-remover
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        // Click para cerrar
        const closeBtnEl = toast.querySelector('.toast-close');
        if (closeBtnEl) {
            closeBtnEl.onclick = () => this.remove(toast);
        }

        return toast;
    }

    remove(toast) {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    // Métodos de conveniencia
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    /**
     * Modal de confirmación personalizado
     */
    confirm(message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <div class="confirm-backdrop"></div>
            <div class="confirm-dialog">
                <div class="confirm-message">${message}</div>
                <div class="confirm-buttons">
                    <button class="btn-confirm btn-danger">Confirmar</button>
                    <button class="btn-cancel btn-secondary">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const backdrop = modal.querySelector('.confirm-backdrop');
        const confirmBtn = modal.querySelector('.btn-confirm');
        const cancelBtn = modal.querySelector('.btn-cancel');

        const cleanup = () => {
            modal.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 200);
        };

        confirmBtn.onclick = () => {
            cleanup();
            if (onConfirm) onConfirm();
        };

        cancelBtn.onclick = () => {
            cleanup();
            if (onCancel) onCancel();
        };

        backdrop.onclick = () => {
            cleanup();
            if (onCancel) onCancel();
        };

        // ESC para cancelar
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                cleanup();
                if (onCancel) onCancel();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * Loading spinner global
     */
    showLoading(message = 'Cargando...') {
        const existing = document.getElementById('global-loading');
        if (existing) return;

        const loader = document.createElement('div');
        loader.id = 'global-loading';
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hideLoading() {
        const loader = document.getElementById('global-loading');
        if (loader) {
            loader.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 200);
        }
    }
}

// Instancia global
export const notify = new NotificationSystem();

// Backward compatibility
window.notify = notify;
