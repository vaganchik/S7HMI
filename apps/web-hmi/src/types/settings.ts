/**
 * Глобальные параметры и конфигурация SCADA-системы
 * Единый источник правды (Single Source of Truth)
 */

export interface ScadaSystemSettings {
  // 1. Технологический процесс и график работы
  shiftDurationHours: number; // Длительность смены (по умолчанию 12 часов)
  shiftStartTimeDay: string; // Начало дневной смены (напр. '08:00')
  shiftStartTimeNight: string; // Начало ночной смены (напр. '20:00')
  nominalLineWidthMm: number; // Номинальная ширина ковра (1200 мм)
  targetSecKWhPerTon: number; // Целевой удельный расход э/э (165.0 кВт*ч/т)
  densityTolerancePercent: number; // Допустимое отклонение плотности (+-3.0 %)
  thicknessToleranceMm: number; // Допустимое отклонение толщины (+-1.5 мм)

  // 2. Сеть и связь с контроллером Siemens S7-1500
  plcIpAddress: string; // IP-адрес ПЛК ('192.168.0.1')
  plcPort: number; // TCP-порт (102)
  plcRack: number; // Номер стойки (0)
  plcSlot: number; // Номер слота CPU (1)
  pollingIntervalMs: number; // Базовый период опроса тегов (1000 мс)
  archiveIntervalMs: number; // Базовый период архивации в SQLite (1000 мс)
  deadbandDefault: number; // Зона нечувствительности по умолчанию (0.5)

  // 3. Тарифы на энергоносители
  isMultiTariff: boolean; // Использовать дифференцированный тариф
  singleTariffRub: number; // Единый тариф (5.80 руб/кВт*ч)
  tariffT1PeakRub: number; // Т1 Пик (7.45 руб)
  tariffT2HalfOffRub: number; // Т2 Полупик (5.50 руб)
  tariffT3NightRub: number; // Т3 Ночь (3.20 руб)

  // 4. Безопасность и интерфейс
  sessionTimeoutMinutes: number; // Таймаут автоблокировки сессии (30 мин)
  soundAlarmsEnabled: boolean; // Звуковой сигнал при авариях
  autoAcknowledgeWarnings: boolean; // Автоквитирование предупреждений
  defaultLanguage: 'ru' | 'en' | 'zh' | 'it'; // Язык системы
}

export const DEFAULT_SCADA_SETTINGS: ScadaSystemSettings = {
  // 1. Технология
  shiftDurationHours: 12,
  shiftStartTimeDay: '08:00',
  shiftStartTimeNight: '20:00',
  nominalLineWidthMm: 1200,
  targetSecKWhPerTon: 165.0,
  densityTolerancePercent: 3.0,
  thicknessToleranceMm: 1.5,

  // 2. Связь с ПЛК
  plcIpAddress: '192.168.0.1',
  plcPort: 102,
  plcRack: 0,
  plcSlot: 1,
  pollingIntervalMs: 1000,
  archiveIntervalMs: 1000,
  deadbandDefault: 0.5,

  // 3. Тарифы
  isMultiTariff: true,
  singleTariffRub: 5.80,
  tariffT1PeakRub: 7.45,
  tariffT2HalfOffRub: 5.50,
  tariffT3NightRub: 3.20,

  // 4. Безопасность
  sessionTimeoutMinutes: 30,
  soundAlarmsEnabled: true,
  autoAcknowledgeWarnings: false,
  defaultLanguage: 'ru'
};
