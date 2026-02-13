/**
 * ⚡ PERFORMANCE MONITOR
 * Monitor de rendimiento con métricas en tiempo real
 */

class PerformanceMonitor {
  constructor() {
    // Métricas
    this.metrics = {
      requests: new Map(), // tipo -> { count, totalTime, avgTime, maxTime, minTime }
      memory: {
        history: [],
        maxHistory: 60 // últimos 60 registros
      },
      cpu: {
        history: [],
        maxHistory: 60
      },
      custom: new Map()
    };
    
    // Timers activos
    this.activeTimers = new Map();
    
    // Recolección automática cada minuto
    this.collectionInterval = setInterval(() => this.collect(), 60000);
    
    console.log('⚡ PerformanceMonitor inicializado');
  }

  /**
   * Inicia un timer de medición
   * @param {string} label - Etiqueta
   * @returns {string} Timer ID
   */
  start(label) {
    const id = `${label}_${Date.now()}_${Math.random()}`;
    this.activeTimers.set(id, {
      label,
      startTime: Date.now(),
      startMemory: process.memoryUsage().heapUsed
    });
    return id;
  }

  /**
   * Finaliza un timer y registra la métrica
   * @param {string} id - Timer ID
   */
  end(id) {
    const timer = this.activeTimers.get(id);
    if (!timer) return;
    
    const duration = Date.now() - timer.startTime;
    const memoryDelta = process.memoryUsage().heapUsed - timer.startMemory;
    
    this.recordMetric(timer.label, duration, memoryDelta);
    this.activeTimers.delete(id);
  }

  /**
   * Wrapper para medir una función
   * @param {string} label - Etiqueta
   * @param {Function} fn - Función a medir
   * @returns {Function} Función wrapped
   */
  measure(label, fn) {
    return async function(...args) {
      const id = this.start(label);
      try {
        return await fn.apply(this, args);
      } finally {
        this.end(id);
      }
    }.bind(this);
  }

  /**
   * Registra una métrica
   * @param {string} label - Etiqueta
   * @param {number} duration - Duración en ms
   * @param {number} memoryDelta - Delta de memoria
   */
  recordMetric(label, duration, memoryDelta = 0) {
    if (!this.metrics.requests.has(label)) {
      this.metrics.requests.set(label, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity,
        totalMemory: 0,
        avgMemory: 0
      });
    }
    
    const metric = this.metrics.requests.get(label);
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.minTime = Math.min(metric.minTime, duration);
    metric.totalMemory += memoryDelta;
    metric.avgMemory = metric.totalMemory / metric.count;
  }

  /**
   * Registra una métrica personalizada
   * @param {string} name - Nombre
   * @param {any} value - Valor
   */
  recordCustom(name, value) {
    if (!this.metrics.custom.has(name)) {
      this.metrics.custom.set(name, []);
    }
    
    const history = this.metrics.custom.get(name);
    history.push({
      value,
      timestamp: Date.now()
    });
    
    // Limitar historial
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Recolecta métricas del sistema
   */
  collect() {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    
    // Memoria
    this.metrics.memory.history.push({
      timestamp: Date.now(),
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss
    });
    
    if (this.metrics.memory.history.length > this.metrics.memory.maxHistory) {
      this.metrics.memory.history.shift();
    }
    
    // CPU
    this.metrics.cpu.history.push({
      timestamp: Date.now(),
      user: cpu.user,
      system: cpu.system
    });
    
    if (this.metrics.cpu.history.length > this.metrics.cpu.maxHistory) {
      this.metrics.cpu.history.shift();
    }
  }

  /**
   * Obtiene resumen de métricas
   * @returns {object} Resumen
   */
  getSummary() {
    const requests = {};
    for (const [label, data] of this.metrics.requests) {
      requests[label] = {
        count: data.count,
        avgTime: `${data.avgTime.toFixed(2)}ms`,
        maxTime: `${data.maxTime.toFixed(2)}ms`,
        minTime: data.minTime === Infinity ? '0ms' : `${data.minTime.toFixed(2)}ms`,
        avgMemory: this.formatBytes(data.avgMemory)
      };
    }
    
    const mem = process.memoryUsage();
    const lastMemory = this.metrics.memory.history[this.metrics.memory.history.length - 1];
    
    return {
      requests,
      memory: {
        current: {
          heapUsed: this.formatBytes(mem.heapUsed),
          heapTotal: this.formatBytes(mem.heapTotal),
          rss: this.formatBytes(mem.rss)
        },
        trend: lastMemory ? {
          heapUsed: this.formatBytes(lastMemory.heapUsed),
          timestamp: new Date(lastMemory.timestamp).toISOString()
        } : null
      },
      uptime: `${(process.uptime() / 60).toFixed(2)} minutos`,
      activeTimers: this.activeTimers.size
    };
  }

  /**
   * Obtiene reporte completo
   * @returns {object} Reporte
   */
  getReport() {
    return {
      summary: this.getSummary(),
      requests: Object.fromEntries(this.metrics.requests),
      memory: this.metrics.memory,
      cpu: this.metrics.cpu,
      custom: Object.fromEntries(this.metrics.custom)
    };
  }

  /**
   * Formatea bytes a legible
   * @param {number} bytes - Bytes
   * @returns {string} Formateado
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Resetea todas las métricas
   */
  reset() {
    this.metrics.requests.clear();
    this.metrics.memory.history = [];
    this.metrics.cpu.history = [];
    this.metrics.custom.clear();
    this.activeTimers.clear();
  }

  /**
   * Destruye el monitor
   */
  destroy() {
    clearInterval(this.collectionInterval);
    this.reset();
    console.log('⚡ PerformanceMonitor destruido');
  }
}

// Singleton
const performanceMonitor = new PerformanceMonitor();

export { performanceMonitor, PerformanceMonitor };
export default performanceMonitor;
