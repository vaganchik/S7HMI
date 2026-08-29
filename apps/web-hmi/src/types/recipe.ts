/**
 * Модели рецептов выпуска минераловатных изделий (Recipe Management)
 */

export interface ProductRecipe {
  id: string;
  name: string; // Наименование продукта, напр. "ТЕХНОРУФ Н ЭКСТРА 1200x600x100"
  group: string; // Группа: Кровля, Фасад, Стены/Перегородки, Пол, Техническая изоляция
  thicknessMm: number; // Толщина продукта (мм), напр. 100
  widthMm: number; // Ширина (мм), напр. 600 или 1200
  lengthMm: number; // Длина (мм), напр. 1200
  targetDensityKgM3: number; // Заданная плотность (кг/м3), напр. 115
  crimpingRatio: number; // Коэффициент гофрирования (1.00 .. 5.00), напр. 1.85
  kvoSpeedMPerMin: number; // Скорость барабана КВО (м/мин), напр. 24.5
  curingOvenSpeedMPerMin: number; // Скорость КП (м/мин), напр. 1.43
  pendulumSpeedMPerMin: number; // Скорость маятника (м/мин), напр. 48.0
  ovenGapMm: number; // Зазор между гусеницами печи КП (мм), напр. 102
  ovenZoneTempsC: [number, number, number, number]; // Температуры зон 1-4 (°C)
  binderContentPercent: number; // Процент связующего (%), напр. 4.2
  notes?: string; // Примечания к рецепту
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

export interface LineProcessState {
  productName: string;
  thicknessMm: number;
  targetDensityKgM3: number;
  crimpingRatio: number;
  kvoSpeedMPerMin: number;
  curingOvenSpeedMPerMin: number;
}
