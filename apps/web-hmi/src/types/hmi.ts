export interface PlcTagAddress {
  area: number;
  dbNumber: number;
  startByte: number;
  bitNumber: number;
  dataType: number | string;
  stringLength: number;
}

export type TagCategory = 'Discrete' | 'Analog' | 'AlarmFlag';

export interface PlcTagDefinition {
  id: string;
  plcId: string;
  name: string;
  description: string;
  category?: TagCategory;
  engineeringUnit?: string;
  minValue?: number;
  maxValue?: number;
  deadband: number;
  archiveEnabled: boolean;
  archiveIntervalMs: number;
  readOnly: boolean;
  address: PlcTagAddress;
}

export interface TagValue {
  tagId: string;
  value: any;
  quality: number;
  timestamp: string;
  errorMessage?: string;
}

export interface TagValueUpdate {
  tagId: string;
  value: any;
  quality: number;
  timestamp: string;
}

export interface PlcStatus {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  cpuType: string;
  isConnected: boolean;
  lastRoundTripTimeMs: number;
}

export interface AlarmEvent {
  id: number;
  alarmId: string;
  tagId: string;
  severity: number;
  state: number; // 1 = Active, 2 = Acknowledged, 3 = Cleared
  message: string;
  triggerValue: number;
  setpoint: number;
  activeTimestamp: string;
  acknowledgedTimestamp?: string;
  clearedTimestamp?: string;
  acknowledgedBy?: string;
}

export const TagQuality = {
  Good: 192,
  Bad: 0,
  Uncertain: 64,
  Offline: 8,
  Timeout: 12,
  ConfigError: 16
} as const;

export type TagQuality = (typeof TagQuality)[keyof typeof TagQuality];
