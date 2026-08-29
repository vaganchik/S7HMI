/**
 * Типы данных сменного рапорта начальника смены (Shift Handover & Production Dossier)
 * Соответствие стандартам MES / ISO 22400 (OEE)
 */

export type DowntimeCategory =
  | 'MECHANICAL' // Аварийный механический
  | 'ELECTRICAL' // Аварийный электрический / КИПиА
  | 'PROCESS' // Технологический (обрыв ковра, чистка валов, летка)
  | 'SETUP_CHANGEOVER' // Плановый / Переналадка / Замена пил
  | 'EXTERNAL_LOGISTICS'; // Внешний / Сырье / Поддоны / Склад

export interface DowntimeRecord {
  id: string;
  startTime: string; // '09:15'
  endTime: string; // '09:45'
  durationMinutes: number; // 30
  category: DowntimeCategory;
  equipmentId?: string; // ID из PLANT_EQUIPMENT
  equipmentName?: string; // Название механизма
  cabinet?: string; // Шкаф управления (напр. '31VC1')
  schemeName?: string; // Код на схеме (напр. 'LX-31VC1')
  reason: string; // Причина простоя
  actionTaken: string; // Предпринятые меры
}

export interface ShiftProductionData {
  packagesCount: number; // Выпуск в упаковках (напр. 1420)
  palletsCount: number; // Паллеты / поддоны (напр. 35.5)
  tonnage: number; // Выпуск в тоннах (напр. 68.4 т)
  volumeM3: number; // Объем в м3 (напр. 594.8 м3)
  areaM2: number; // Площадь ковра в м2 (напр. 5948 м2)
  scrapTons: number; // Брак / технологические обрезки в тоннах (напр. 1.8 т)
  energyKWh: number; // Расход электроэнергии за смену (кВт*ч)
  secKWhPerTon: number; // Удельный расход э/э (кВт*ч / т)
}

export interface ShiftCrew {
  shiftNumber: number; // Номер бригады (1..4)
  shiftType: 'DAY' | 'NIGHT'; // Дневная (08:00-20:00) или Ночная (20:00-08:00)
  shiftSupervisor: string; // ФИО начальника смены
  operatorKvo: string; // Оператор КВО
  operatorOven: string; // Машинист печи КП
  qcInspector: string; // Лаборант ОТК
  dutyElectrician: string; // Дежурный электрик
  dutyMechanic: string; // Дежурный механик
}

export interface ShiftOeeMetrics {
  availability: number; // Доступность (A, %)
  performance: number; // Производительность (P, %)
  quality: number; // Качество (Q, %)
  totalOee: number; // Итоговый OEE (%)
}

export interface ShiftReport {
  id: string;
  date: string; // '2026-08-28'
  shiftType: 'DAY' | 'NIGHT';
  crew: ShiftCrew;
  activeRecipeName: string; // Название рецепта
  production: ShiftProductionData;
  downtimes: DowntimeRecord[];
  totalDowntimeMinutes: number;
  operatingMinutes: number; // 720 - totalDowntimeMinutes
  oee: ShiftOeeMetrics;
  safetyIncidentsCount: number; // Инциденты по ОТ и ПБ (0)
  safetyNotes?: string;
  handoverNotes: string; // Замечания сменщику
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  createdAt: string;
  submittedAt?: string;
  approvedBy?: string;
}
