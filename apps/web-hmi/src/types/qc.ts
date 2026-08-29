/**
 * Модели данных лабораторного контроля качества продукции (ОТК / Лаборатория)
 * Стандарты ГОСТ 9573-2012, ГОСТ 32314-2012 (EN 13162), ГОСТ EN 826, ГОСТ EN 1607
 */

import type { UserRole } from './auth';

export type QcSampleStatus = 'passed' | 'warning' | 'rejected' | 'rework';

export interface QcMeasurementRecord {
  id: string;
  timestamp: string; // ISO format or 'YYYY-MM-DD HH:mm'
  batchNumber: string; // Номер партии (например, L1-20260828-04)
  palletNumber: string; // Номер паллеты (например, PAL-142)
  recipeId: string; // ID рецепта (например, TR-N-EXTRA-100)
  recipeName: string; // Наименование марки (ТЕХНОРУФ Н ЭКСТРА 1200x600x100)
  shift: string; // Смена (Смена #1 Дневная / Смена #2 Ночная)
  inspectorName: string; // ФИО лаборанта или оператора
  inspectorUsername: string;
  inspectorRole: UserRole;

  // 1. Плотность
  densityActualKgM3: number; // Фактическая плотность (кг/м³)
  densityTargetKgM3: number; // Заданная плотность по рецепту (кг/м³)
  densityDeviationPercent: number; // Отклонение в %

  // 2. Геометрия
  thicknessActualMm: number; // Фактическая толщина (мм)
  thicknessTargetMm: number; // Заданная толщина по рецепту (мм)
  lengthActualMm: number; // Длина (мм)
  widthActualMm: number; // Ширина (мм)

  // 3. Механические свойства
  compressiveStrengthKPa: number; // Прочность на сжатие при 10% деформации (кПа, норма >= 35..60)
  tensileStrengthKPa: number; // Прочность на отрыв слоев (кПа, норма >= 7.5..15)

  // 4. Физико-химические показатели
  binderContentPercent: number; // Содержание органического связующего (%, норма 3.0 - 4.5%)
  waterAbsorptionKgM2: number; // Водопоглощение при кратковременном погружении (кг/м², норма <= 1.0)
  thermalConductivity: number; // Теплопроводность lambda 25 (Вт/(м*К), норма <= 0.038)
  moisturePercent: number; // Влажность по массе (%, норма <= 0.5%)

  // 5. Итоговое заключение
  status: QcSampleStatus;
  notes?: string; // Комментарии лаборанта / причины отбраковки
}

export interface QcStatSummary {
  totalSamples: number;
  passedCount: number;
  warningCount: number;
  rejectedCount: number;
  passRatePercent: number;
  avgDensityKgM3: number;
  avgThicknessMm: number;
  avgStrengthKPa: number;
  avgBinderPercent: number;
}
