/**
 * 📻 RADIO DEVICE MODEL
 * 
 * Define tipos de dispositivos de radio con sus características:
 * - Alcance (local, regional, global)
 * - Capacidad de canales
 * - Consumo de batería
 * - Interceptabilidad
 * - Cifrado
 */

export const RADIO_TYPES = {
  NONE: {
    id: 'none',
    name: 'Sin Radio',
    range: 'local',
    maxChannels: 0,
    batteryConsumption: 0,
    interceptionChance: 0,
    encryption: 0,
    requiresBattery: false,
  },

  WALKIE_LV1: {
    id: 'walkie_lv1',
    name: 'Walkie-Talkie Básico',
    range: 'node', // Solo nodo actual
    maxChannels: 1,
    batteryConsumption: 0.5, // % por minuto
    batteryCapacity: 100,
    interceptionChance: 0.20, // 20% de ser interceptado
    encryption: 0,
    weight: 0.3,
    requiresBattery: true,
    compatibleBatteries: ['battery_aa_2x'],
  },

  WALKIE_LV2: {
    id: 'walkie_lv2',
    name: 'Walkie-Talkie Militar',
    range: 'region', // Toda la región
    maxChannels: 3,
    batteryConsumption: 1.0, // % por minuto
    batteryCapacity: 150,
    interceptionChance: 0.10,
    encryption: 1, // Cifrado básico
    weight: 0.5,
    requiresBattery: true,
    compatibleBatteries: ['battery_aa_2x', 'battery_rechargeable'],
  },

  WALKIE_LV3: {
    id: 'walkie_lv3',
    name: 'Radio de Largo Alcance',
    range: 'global', // Todas las regiones
    maxChannels: 5,
    batteryConsumption: 2.0,
    batteryCapacity: 200,
    interceptionChance: 0.03,
    encryption: 2, // Cifrado militar
    weight: 1.2,
    requiresBattery: true,
    compatibleBatteries: ['battery_rechargeable', 'power_cell'],
  },

  SCANNER: {
    id: 'radio_scanner',
    name: 'Escáner de Frecuencias',
    range: 'region',
    maxChannels: 0, // Solo escucha
    batteryConsumption: 1.5,
    batteryCapacity: 120,
    interceptionChance: 0, // No transmite
    encryption: 0,
    canIntercept: true, // Puede espiar
    scanRange: 'region',
    weight: 0.8,
    requiresBattery: true,
    compatibleBatteries: ['battery_aa_2x', 'battery_rechargeable'],
  },
};

export const BATTERY_TYPES = {
  BATTERY_AA_2X: {
    id: 'battery_aa_2x',
    name: 'Baterías AA (x2)',
    charge: 100,
    weight: 0.05,
    rechargeable: false,
    craftable: false,
    scavengeable: true,
  },

  BATTERY_RECHARGEABLE: {
    id: 'battery_rechargeable',
    name: 'Batería Recargable',
    charge: 150,
    weight: 0.1,
    rechargeable: true,
    rechargeRate: 10, // % por minuto con generador
    craftable: true,
    scavengeable: true,
  },

  POWER_CELL: {
    id: 'power_cell',
    name: 'Celda de Energía',
    charge: 300,
    weight: 0.2,
    rechargeable: true,
    rechargeRate: 15,
    craftable: true, // Requiere taller avanzado
    scavengeable: false,
  },
};

/**
 * Clase para manejar un dispositivo de radio en inventario
 */
export class RadioDevice {
  constructor(type, battery = null) {
    const radioType = RADIO_TYPES[type] || RADIO_TYPES.NONE;
    
    this.type = radioType.id;
    this.name = radioType.name;
    this.range = radioType.range;
    this.maxChannels = radioType.maxChannels;
    this.batteryConsumption = radioType.batteryConsumption;
    this.batteryCapacity = radioType.batteryCapacity;
    this.interceptionChance = radioType.interceptionChance;
    this.encryption = radioType.encryption;
    this.requiresBattery = radioType.requiresBattery;
    this.canIntercept = radioType.canIntercept || false;
    
    // Estado actual
    this.equipped = false;
    this.activeChannels = []; // Frecuencias a las que está sintonizado
    this.battery = battery; // Batería instalada
    this.batteryCharge = battery ? battery.charge : 0;
    this.condition = 100; // Durabilidad física del equipo
    this.lastUsed = Date.now();
  }

  /**
   * Equipar el radio
   */
  equip() {
    if (this.requiresBattery && this.batteryCharge <= 0) {
      return { success: false, error: 'Sin batería' };
    }
    this.equipped = true;
    return { success: true };
  }

  /**
   * Desequipar el radio
   */
  unequip() {
    this.equipped = false;
    this.activeChannels = [];
    return { success: true };
  }

  /**
   * Sintonizar una frecuencia
   */
  tuneToFrequency(frequency) {
    if (!this.equipped) {
      return { success: false, error: 'Radio no equipado' };
    }

    if (this.batteryCharge <= 0) {
      return { success: false, error: 'Batería agotada' };
    }

    if (this.activeChannels.length >= this.maxChannels) {
      return { success: false, error: 'Máximo de canales alcanzado' };
    }

    if (this.activeChannels.includes(frequency)) {
      return { success: false, error: 'Ya sintonizado a esta frecuencia' };
    }

    this.activeChannels.push(frequency);
    return { success: true, frequency };
  }

  /**
   * Dejar de escuchar una frecuencia
   */
  leaveFrequency(frequency) {
    this.activeChannels = this.activeChannels.filter(f => f !== frequency);
    return { success: true };
  }

  /**
   * Consumir batería
   */
  consumeBattery(minutes = 1) {
    if (!this.requiresBattery) return;
    if (!this.equipped) return;

    const consumption = this.batteryConsumption * minutes;
    this.batteryCharge = Math.max(0, this.batteryCharge - consumption);

    // Si se agota, desequipar automáticamente
    if (this.batteryCharge <= 0) {
      this.unequip();
    }
  }

  /**
   * Reemplazar batería
   */
  replaceBattery(newBattery) {
    if (!this.requiresBattery) {
      return { success: false, error: 'Este dispositivo no usa batería' };
    }

    const oldBattery = this.battery;
    this.battery = newBattery;
    this.batteryCharge = newBattery.charge;

    return { success: true, oldBattery };
  }

  /**
   * Recargar batería (requiere generador/solar)
   */
  rechargeBattery(minutes = 1) {
    if (!this.battery || !this.battery.rechargeable) {
      return { success: false, error: 'Batería no recargable' };
    }

    const rechargeAmount = this.battery.rechargeRate * minutes;
    this.batteryCharge = Math.min(this.battery.charge, this.batteryCharge + rechargeAmount);

    return { success: true, charge: this.batteryCharge };
  }

  /**
   * Obtener estado del dispositivo
   */
  getStatus() {
    return {
      type: this.type,
      name: this.name,
      equipped: this.equipped,
      batteryCharge: Math.round(this.batteryCharge),
      batteryPercent: this.battery ? Math.round((this.batteryCharge / this.battery.charge) * 100) : 0,
      condition: this.condition,
      activeChannels: this.activeChannels,
      maxChannels: this.maxChannels,
      range: this.range,
      canTransmit: this.equipped && this.batteryCharge > 0,
    };
  }

  /**
   * Serializar para guardar en DB
   */
  toJSON() {
    return {
      type: this.type,
      battery: this.battery,
      batteryCharge: this.batteryCharge,
      condition: this.condition,
      equipped: this.equipped,
      activeChannels: this.activeChannels,
    };
  }

  /**
   * Deserializar desde DB
   */
  static fromJSON(data) {
    const radio = new RadioDevice(data.type, data.battery);
    radio.batteryCharge = data.batteryCharge || 0;
    radio.condition = data.condition || 100;
    radio.equipped = data.equipped || false;
    radio.activeChannels = data.activeChannels || [];
    return radio;
  }
}

export default RadioDevice;
