import type { ShiftReport, ShiftOeeMetrics, DowntimeRecord, ShiftProductionData } from '../types/shiftReport';

// Расчет OEE по стандарту ISO 22400
export const calculateOee = (
  shiftDurationHours: number,
  downtimes: DowntimeRecord[],
  production: ShiftProductionData,
  nominalSpeedTonsPerHour: number = 6.2
): { totalDowntimeMinutes: number; operatingMinutes: number; oee: ShiftOeeMetrics } => {
  const totalShiftMinutes = shiftDurationHours * 60; // 720 мин для 12-часовой смены
  const totalDowntimeMinutes = downtimes.reduce((acc, d) => acc + d.durationMinutes, 0);
  const operatingMinutes = Math.max(0, totalShiftMinutes - totalDowntimeMinutes);

  // 1. Availability (Доступность A) = Время работы / Время смены
  const availability = Number(((operatingMinutes / totalShiftMinutes) * 100).toFixed(1));

  // 2. Performance (Производительность P) = Фактический выпуск / (Номинальная скорость * Время работы)
  const theoreticalOutputTons = (operatingMinutes / 60) * nominalSpeedTonsPerHour;
  const actualTotalOutputTons = production.tonnage + production.scrapTons;
  const performanceRaw = theoreticalOutputTons > 0 ? (actualTotalOutputTons / theoreticalOutputTons) * 100 : 95.0;
  const performance = Number(Math.min(100, Math.max(50, performanceRaw)).toFixed(1));

  // 3. Quality (Качество Q) = Годная продукция / Общий выпуск
  const qualityRaw = actualTotalOutputTons > 0 ? (production.tonnage / actualTotalOutputTons) * 100 : 98.0;
  const quality = Number(Math.min(100, Math.max(50, qualityRaw)).toFixed(1));

  // Итоговый OEE = A * P * Q
  const totalOee = Number(((availability * performance * quality) / 10000).toFixed(1));

  return {
    totalDowntimeMinutes,
    operatingMinutes,
    oee: {
      availability,
      performance,
      quality,
      totalOee
    }
  };
};

export const DEFAULT_SHIFT_REPORTS: ShiftReport[] = [
  {
    id: 'REP-20260828-DAY-1',
    date: '2026-08-28',
    shiftType: 'DAY',
    crew: {
      shiftNumber: 1,
      shiftType: 'DAY',
      shiftSupervisor: 'Ковалев Сергей Владимирович',
      operatorKvo: 'Иванов Иван Иванович',
      operatorOven: 'Петров Петр Сергеевич',
      qcInspector: 'Морозова Анна Игоревна',
      dutyElectrician: 'Сидоров Алексей Дмитриевич',
      dutyMechanic: 'Васильев Олег Павлович'
    },
    activeRecipeName: 'ТЕХНОРУФ Н ЭКСТРА 1200x600x100',
    production: {
      packagesCount: 1420,
      palletsCount: 35.5,
      tonnage: 68.4,
      volumeM3: 594.8,
      areaM2: 5948,
      scrapTons: 1.8,
      energyKWh: 10560,
      secKWhPerTon: 154.4
    },
    downtimes: [
      {
        id: 'DT-1',
        startTime: '10:15',
        endTime: '10:45',
        durationMinutes: 30,
        category: 'SETUP_CHANGEOVER',
        equipmentId: 'eq_22',
        equipmentName: 'Продольная дисковая пила №1 (11 кВт)',
        cabinet: '39VC1',
        schemeName: 'ZQ-31VC1',
        reason: 'Плановая замена комплекта дисковых пил резки ковра',
        actionTaken: 'Установлен свежезаточенный комплект пильных дисков Bosch Professional'
      },
      {
        id: 'DT-2',
        startTime: '14:20',
        endTime: '14:35',
        durationMinutes: 15,
        category: 'PROCESS',
        equipmentId: 'eq_2',
        equipmentName: 'Центрифуга волокнообразования. Вал №1 (30 кВт)',
        cabinet: '31VC1',
        schemeName: 'LX-31VC1',
        reason: 'Налипание расплава и биение вала №1',
        actionTaken: 'Очистка вала гидросмывом высокого давления, проверка балансировки'
      }
    ],
    totalDowntimeMinutes: 45,
    operatingMinutes: 675,
    oee: {
      availability: 93.8,
      performance: 96.2,
      quality: 97.4,
      totalOee: 87.9
    },
    safetyIncidentsCount: 0,
    safetyNotes: 'Нарушений требований охраны труда и промышленной безопасности не зафиксировано.',
    handoverNotes: 'Линия работает стабильно на рецепте ТЕХНОРУФ Н. Запас связующего в емкостях B1/B2 достаточен. Обратить внимание на температурный режим подшипника вала №3 центрифуги (Т=64°C).',
    status: 'SUBMITTED',
    createdAt: '2026-08-28T08:00:00.000Z',
    submittedAt: '2026-08-28T19:50:00.000Z'
  },
  {
    id: 'REP-20260827-NIGHT-4',
    date: '2026-08-27',
    shiftType: 'NIGHT',
    crew: {
      shiftNumber: 4,
      shiftType: 'NIGHT',
      shiftSupervisor: 'Соколов Андрей Михайлович',
      operatorKvo: 'Николаев Денис Олегович',
      operatorOven: 'Григорьев Максим Юрьевич',
      qcInspector: 'Морозова Анна Игоревна',
      dutyElectrician: 'Кузнецов Игорь Васильевич',
      dutyMechanic: 'Попов Роман Викторович'
    },
    activeRecipeName: 'ТЕХНОФАС СТАНДАРТ 1200x600x50',
    production: {
      packagesCount: 1580,
      palletsCount: 39.5,
      tonnage: 74.2,
      volumeM3: 550.0,
      areaM2: 11000,
      scrapTons: 1.2,
      energyKWh: 10240,
      secKWhPerTon: 138.0
    },
    downtimes: [
      {
        id: 'DT-3',
        startTime: '02:10',
        endTime: '02:30',
        durationMinutes: 20,
        category: 'ELECTRICAL',
        equipmentId: 'eq_7',
        equipmentName: 'Привод обдува вала №1 (4 кВт)',
        cabinet: '31VC1',
        schemeName: 'BD1-31VC1',
        reason: 'Ложное срабатывание автомата защиты привода',
        actionTaken: 'Протяжка клеммных соединений в шкафу 31VC1, перезапуск ЧРП'
      }
    ],
    totalDowntimeMinutes: 20,
    operatingMinutes: 700,
    oee: {
      availability: 97.2,
      performance: 97.8,
      quality: 98.4,
      totalOee: 93.5
    },
    safetyIncidentsCount: 0,
    safetyNotes: 'Смена отработала без инцидентов и травматизма.',
    handoverNotes: 'План по ТЕХНОФАС выполнен на 102%. Ночью перешли на льготный тариф Т3. Замечаний по оборудованию нет.',
    status: 'APPROVED',
    createdAt: '2026-08-27T20:00:00.000Z',
    submittedAt: '2026-08-28T07:45:00.000Z',
    approvedBy: 'Главный инженер Федоров В.А.'
  }
];
