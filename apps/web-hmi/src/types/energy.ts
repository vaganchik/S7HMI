/**
 * Типы данных системы энергоменеджмента и учета затрат электроэнергии
 * Завод минераловатных изделий (ISO 50001 / ГОСТ Р ИСО 50001)
 */

import type { EquipmentAreaId } from './equipment';

export type TariffZone = 'T1_PEAK' | 'T2_HALFOFF' | 'T3_NIGHT';

export interface ElectricityTariffSettings {
  isMultiTariff: boolean; // Многоставочный или единый тариф
  singleTariffRubPerKWh: number; // Единый тариф (например, 5.80 руб/кВт*ч)
  t1PeakRubPerKWh: number; // Т1 Пик (07:00-10:00, 17:00-21:00) (например, 7.20 руб)
  t2HalfOffRubPerKWh: number; // Т2 Полупик (10:00-17:00, 21:00-23:00) (например, 5.50 руб)
  t3NightRubPerKWh: number; // Т3 Ночь (23:00-07:00) (например, 3.40 руб)
}

export interface AreaEnergyUsage {
  areaId: EquipmentAreaId;
  areaName: string;
  areaCode: string;
  currentPowerKw: number;
  shiftEnergyKWh: number;
  shiftCostRub: number;
  sharePercent: number;
  drivesCount: number;
  topConsumerName: string;
  topConsumerPowerKw: number;
}

export interface TopDriveConsumer {
  id: string;
  name: string;
  cabinet: string;
  schemeName: string;
  areaName: string;
  nominalPowerKw: number;
  currentPowerKw: number;
  currentAmps: number;
  shiftEnergyKWh: number;
  shiftCostRub: number;
  sharePercent: number;
}

export interface HourlyEnergyPoint {
  hour: number; // 0..23
  label: string; // '00:00', '01:00'...
  powerKw: number;
  energyKWh: number;
  costRub: number;
  tariffZone: TariffZone;
  productionTons: number;
  secKWhPerTon: number;
}

export interface EnergyKpiSummary {
  currentPowerKw: number; // Текущая активная мощность линии (кВт)
  shiftEnergyKWh: number; // Потребление за текущую смену (кВт*ч)
  shiftCostRub: number; // Затраты на э/э за текущую смену (руб)
  dayEnergyKWh: number; // Потребление за сутки (кВт*ч)
  dayCostRub: number; // Затраты за сутки (руб)
  hourlyCostRub: number; // Текущая стоимость часа работы линии (руб/час)
  specificEnergyPerTon: number; // Удельный расход на тонну (кВт*ч / т)
  specificEnergyPerM3: number; // Удельный расход на 1 м3 плиты (кВт*ч / м3)
  idlePowerKw: number; // Мощность холостого хода линии (кВт)
  idleCostPerShiftRub: number; // Стоимость холостого хода за смену (руб)
  currentTariffZone: TariffZone;
  currentTariffRateRub: number;
}
