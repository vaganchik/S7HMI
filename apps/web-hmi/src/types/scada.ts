/**
 * Типы данных и модели оборудования промышленной SCADA-системы
 * Стандарт ISA-101 (High-Performance HMI)
 */

export type MechanismType = 'motor' | 'fan' | 'saw' | 'conveyor' | 'lift' | 'burner' | 'pump' | 'valve' | 'exhaust';

export type MechanismState = 'stopped' | 'running' | 'fault' | 'warning' | 'starting' | 'stopping';

export type ControlMode = 'auto' | 'manual' | 'remote' | 'local';

export interface MechanismTelemetry {
  id: string;
  name: string;
  section: string;
  type: MechanismType;
  state: MechanismState;
  mode: ControlMode;
  cabinet?: string; // Шкаф: LX, JM, ZC1, ZC2B, HJG, ZQ и др.
  schemeName?: string; // Позиция схемы: 31VC1, 11KM1, 1R
  driveName?: string; // Имя привода: ZC2B-31VC1
  powerKw?: number;
  nominalCurrentA?: number;
  frequencySetpointHz?: number;
  frequencyActualHz?: number;
  currentAmps?: number;
  speedMPerMin?: number;
  syncRatio?: number;
  temperatureC?: number;
  pressurePa?: number;
  positionMm?: number;
  flameDetected?: boolean;
  limitUp?: boolean;
  limitDown?: boolean;
  runningHours?: number;
  faultMessage?: string;
  eStopTripped?: boolean;
  stw1?: number; // Siemens Control Word (PZD1)
  zsw1?: number; // Siemens Status Word (PZD1)
  interlocks?: Record<string, boolean>;
}

export interface ScadaZoneSummary {
  id: string;
  title: string;
  icon: string;
  activeAlarmsCount: number;
  isRunning: boolean;
  activePowerKw: number;
}
