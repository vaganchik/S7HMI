/**
 * Типы данных оборудования завода минеральной ваты (255 единиц)
 * Структура по 5 участкам и 18 шкафам управления Siemens S7-1500
 */

export type EquipmentAreaId = 'spinner' | 'kvo' | 'crimper' | 'oven' | 'cutting';

export type DriveControlType = 'G120' | 'V90' | 'DOL' | 'Motor' | 'Encoder' | 'Sensor';

export interface PlantEquipmentNode {
  id: string; // stable_id (node_xxx)
  name: string; // Оригинальное наименование
  displayName: string; // Отображаемое чистое имя
  area: EquipmentAreaId; // spinner | kvo | crimper | oven | cutting
  areaName: string; // Центрифуга, КВО, Гофорировщик, КП, Продольные пилы
  areaCode: string; // Z1_SPINNER, Z1_KVO, Z2_CRIMPER, Z2_KP, Z2_CUTTING
  cabinet: string; // Шкаф управления: LX, JM, ZC1, ZC2B, HJG, ZQ и др.
  schemeName: string; // Позиция по схеме: 31VC1, 11KM1, 1R, Encoder 1
  driveName: string; // Обозначение привода: ZC2B-31VC1, SJ-11KM1
  driveType: DriveControlType; // G120 (ЧРП) | DOL (Контактор) | Encoder | Sensor | Motor
  powerKw: number; // Номинальная мощность (кВт)
  nominalCurrentA: number; // Номинальный ток (А)
  nominalRpm: number; // Номинальные обороты
  parentId?: string | null;
  isStub: boolean;
}

export interface ControlCabinetInfo {
  id: string; // Код шкафа (например, ZC2B, HJG)
  name: string; // Полное название
  area: EquipmentAreaId;
  areaName: string;
  ipAddress: string;
  profinetName: string;
  description: string;
  totalPowerKw: number;
  drivesCount: number;
}
