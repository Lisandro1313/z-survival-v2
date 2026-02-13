/**
 * 📻 RADIO SERVICE
 * 
 * Cliente WebSocket para sistema de radio
 */

import type { WSMessage } from '../types';

export class RadioService {
  private send: (message: WSMessage) => void;

  constructor(sendFn: (message: WSMessage) => void) {
    this.send = sendFn;
  }

  // ====================================
  // EQUIP / UNEQUIP
  // ====================================

  equipRadio(radioType: string, batteryType: string) {
    this.send({
      type: 'radio:equip',
      radioType,
      batteryType,
    });
  }

  unequipRadio() {
    this.send({
      type: 'radio:unequip',
    });
  }

  // ====================================
  // FREQUENCY MANAGEMENT
  // ====================================

  joinFrequency(frequency: string) {
    this.send({
      type: 'radio:join',
      frequency,
    });
  }

  leaveFrequency(frequency: string) {
    this.send({
      type: 'radio:leave',
      frequency,
    });
  }

  // ====================================
  // MESSAGING
  // ====================================

  sendMessage(frequency: string, text: string) {
    this.send({
      type: 'radio:message',
      frequency,
      text,
    });
  }

  sendPrivateMessage(targetPlayerId: string, text: string) {
    this.send({
      type: 'radio:private',
      targetPlayerId,
      text,
    });
  }

  // ====================================
  // SCANNER
  // ====================================

  enableScanner() {
    this.send({
      type: 'radio:scan',
      enable: true,
    });
  }

  disableScanner() {
    this.send({
      type: 'radio:scan',
      enable: false,
    });
  }

  getActiveFrequencies() {
    this.send({
      type: 'radio:frequencies',
    });
  }

  // ====================================
  // BATTERY
  // ====================================

  replaceBattery(batteryType: string) {
    this.send({
      type: 'radio:battery',
      batteryType,
    });
  }

  rechargeBattery(minutes: number) {
    this.send({
      type: 'radio:recharge',
      minutes,
    });
  }

  // ====================================
  // STATUS
  // ====================================

  getStatus() {
    this.send({
      type: 'radio:status',
    });
  }
}

export default RadioService;
