import type {
  ElectricityTariffSettings,
  TariffZone,
  AreaEnergyUsage,
  TopDriveConsumer,
  HourlyEnergyPoint,
  EnergyKpiSummary
} from '../types/energy';
import { PLANT_EQUIPMENT } from './plantEquipmentData';

export const DEFAULT_TARIFFS: ElectricityTariffSettings = {
  isMultiTariff: true,
  singleTariffRubPerKWh: 5.80,
  t1PeakRubPerKWh: 7.45, // Пиковая зона
  t2HalfOffRubPerKWh: 5.50, // Полупиковая зона
  t3NightRubPerKWh: 3.20 // Ночная льготная зона
};

export const getTariffZone = (hour: number): TariffZone => {
  // Т1 Пик: 07:00-10:00 и 17:00-21:00
  if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 21)) {
    return 'T1_PEAK';
  }
  // Т3 Ночь: 23:00-07:00
  if (hour >= 23 || hour < 7) {
    return 'T3_NIGHT';
  }
  // Т2 Полупик: 10:00-17:00 и 21:00-23:00
  return 'T2_HALFOFF';
};

export const getTariffRate = (tariffs: ElectricityTariffSettings, hour: number): number => {
  if (!tariffs.isMultiTariff) return tariffs.singleTariffRubPerKWh;
  const zone = getTariffZone(hour);
  if (zone === 'T1_PEAK') return tariffs.t1PeakRubPerKWh;
  if (zone === 'T3_NIGHT') return tariffs.t3NightRubPerKWh;
  return tariffs.t2HalfOffRubPerKWh;
};

// Генерация 24-часового профиля энергопотребления
export const generateHourlyProfile = (tariffs: ElectricityTariffSettings): HourlyEnergyPoint[] => {
  const points: HourlyEnergyPoint[] = [];

  for (let h = 0; h < 24; h++) {
    const zone = getTariffZone(h);
    const rate = getTariffRate(tariffs, h);

    // Базовая мощность ~ 820..950 кВт с небольшими технологическими колебаниями
    const baseKw = 860;
    const variation = Math.sin((h / 24) * Math.PI * 2) * 45 + (Math.random() * 20 - 10);
    const powerKw = Math.round(baseKw + variation);
    const energyKWh = powerKw; // за 1 час
    const costRub = Math.round(energyKWh * rate);
    const productionTons = Number((5.8 + Math.random() * 0.4).toFixed(2));
    const secKWhPerTon = Math.round(energyKWh / productionTons);

    points.push({
      hour: h,
      label: `${h.toString().padStart(2, '0')}:00`,
      powerKw,
      energyKWh,
      costRub,
      tariffZone: zone,
      productionTons,
      secKWhPerTon
    });
  }

  return points;
};

// Топ-10 самых энергоемких приводов завода из PLANT_EQUIPMENT
export const getTopDriveConsumers = (tariffs: ElectricityTariffSettings): TopDriveConsumer[] => {
  const rate = tariffs.isMultiTariff ? tariffs.t2HalfOffRubPerKWh : tariffs.singleTariffRubPerKWh;

  // Фильтруем реальные мощные агрегаты
  const powerful = PLANT_EQUIPMENT.filter(
    (e) => e.powerKw >= 11 && !e.name.includes('охлаждения') && !e.isStub
  );

  // Сортируем по мощности
  powerful.sort((a, b) => b.powerKw - a.powerKw);

  const topItems = powerful.slice(0, 10);
  const totalPower = topItems.reduce((acc, item) => acc + item.powerKw, 0);

  return topItems.map((item) => {
    const loadFactor = item.name.includes('Дымосос 355') ? 0.78 : 0.82;
    const currentPowerKw = Number((item.powerKw * loadFactor).toFixed(1));
    const shiftEnergyKWh = Math.round(currentPowerKw * 12); // 12-часовая смена
    const shiftCostRub = Math.round(shiftEnergyKWh * rate);
    const sharePercent = Number(((item.powerKw / totalPower) * 100).toFixed(1));

    return {
      id: item.id,
      name: item.displayName,
      cabinet: item.cabinet,
      schemeName: item.schemeName,
      areaName: item.areaName,
      nominalPowerKw: item.powerKw,
      currentPowerKw,
      currentAmps: Number((currentPowerKw * 1.95).toFixed(1)),
      shiftEnergyKWh,
      shiftCostRub,
      sharePercent
    };
  });
};

// Потребление по 5 технологическим участкам
export const getAreaEnergyBreakdown = (tariffs: ElectricityTariffSettings): AreaEnergyUsage[] => {
  const rate = tariffs.isMultiTariff ? tariffs.t2HalfOffRubPerKWh : tariffs.singleTariffRubPerKWh;

  const areas = [
    {
      areaId: 'kvo' as const,
      areaName: 'КВО и вытяжная тяга',
      areaCode: 'Z1_KVO',
      basePowerKw: 345.0,
      drivesCount: 53,
      topConsumerName: 'Главный дымосос КВО (355 кВт)',
      topConsumerPowerKw: 355.0
    },
    {
      areaId: 'oven' as const,
      areaName: 'Камера полимеризации (Печь КП)',
      areaCode: 'Z2_KP',
      basePowerKw: 245.0,
      drivesCount: 50,
      topConsumerName: 'Вентиляторы циркуляции 4 зон (4х45 кВт)',
      topConsumerPowerKw: 180.0
    },
    {
      areaId: 'spinner' as const,
      areaName: 'Центрифуга волокнообразования',
      areaCode: 'Z1_SPINNER',
      basePowerKw: 145.0,
      drivesCount: 32,
      topConsumerName: 'Валы центрифуг 1-4 (4х30 кВт)',
      topConsumerPowerKw: 120.0
    },
    {
      areaId: 'cutting' as const,
      areaName: 'Пилы и раскрой ковра',
      areaCode: 'Z2_CUTTING',
      basePowerKw: 130.0,
      drivesCount: 23,
      topConsumerName: 'Продольные пилы 1-10 (10х11 кВт)',
      topConsumerPowerKw: 110.0
    },
    {
      areaId: 'crimper' as const,
      areaName: 'Гофрировщик и конвейеры',
      areaCode: 'Z2_CRIMPER',
      basePowerKw: 115.0,
      drivesCount: 97,
      topConsumerName: 'Обжимные конвейеры 1-5 (10х5.5 кВт)',
      topConsumerPowerKw: 55.0
    }
  ];

  const totalKw = areas.reduce((acc, a) => acc + a.basePowerKw, 0);

  return areas.map((a) => {
    const shiftEnergyKWh = Math.round(a.basePowerKw * 12); // 12-часовая смена
    const shiftCostRub = Math.round(shiftEnergyKWh * rate);
    const sharePercent = Number(((a.basePowerKw / totalKw) * 100).toFixed(1));

    return {
      areaId: a.areaId,
      areaName: a.areaName,
      areaCode: a.areaCode,
      currentPowerKw: a.basePowerKw,
      shiftEnergyKWh,
      shiftCostRub,
      sharePercent,
      drivesCount: a.drivesCount,
      topConsumerName: a.topConsumerName,
      topConsumerPowerKw: a.topConsumerPowerKw
    };
  });
};

// Сводные KPI энергоэффективности
export const calculateEnergyKpis = (
  tariffs: ElectricityTariffSettings,
  targetDensityKgM3: number = 115,
  lineSpeedMPerMin: number = 12.5,
  thicknessMm: number = 100
): EnergyKpiSummary => {
  const currentHour = new Date().getHours();
  const zone = getTariffZone(currentHour);
  const rate = getTariffRate(tariffs, currentHour);

  // Текущая мощность линии
  const currentPowerKw = 880.0;
  const shiftEnergyKWh = Math.round(currentPowerKw * 12); // 12 часов смена
  const shiftCostRub = Math.round(shiftEnergyKWh * rate);

  const dayEnergyKWh = Math.round(currentPowerKw * 24);
  const avgDayRate = tariffs.isMultiTariff
    ? (tariffs.t1PeakRubPerKWh * 7 + tariffs.t2HalfOffRubPerKWh * 9 + tariffs.t3NightRubPerKWh * 8) / 24
    : tariffs.singleTariffRubPerKWh;
  const dayCostRub = Math.round(dayEnergyKWh * avgDayRate);

  const hourlyCostRub = Math.round(currentPowerKw * rate);

  // Производительность линии: скорость (м/мин) * ширина (1.2м) * толщина (м) * плотность (кг/м3) * 60 мин / 1000 = тонн/час
  const widthM = 1.2;
  const thicknessM = thicknessMm / 1000;
  const volumePerHourM3 = lineSpeedMPerMin * 60 * widthM * thicknessM;
  const tonsPerHour = (volumePerHourM3 * targetDensityKgM3) / 1000;

  const specificEnergyPerTon = Number((currentPowerKw / (tonsPerHour > 0 ? tonsPerHour : 5.8)).toFixed(1));
  const specificEnergyPerM3 = Number((currentPowerKw / (volumePerHourM3 > 0 ? volumePerHourM3 : 50.4)).toFixed(1));

  // Базовый холостой ход (приводы включены без подачи расплава)
  const idlePowerKw = 320.0;
  const idleCostPerShiftRub = Math.round(idlePowerKw * 12 * rate);

  return {
    currentPowerKw,
    shiftEnergyKWh,
    shiftCostRub,
    dayEnergyKWh,
    dayCostRub,
    hourlyCostRub,
    specificEnergyPerTon,
    specificEnergyPerM3,
    idlePowerKw,
    idleCostPerShiftRub,
    currentTariffZone: zone,
    currentTariffRateRub: rate
  };
};
