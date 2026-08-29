import type { TrendPreset } from '../types/trends';

export const FACTORY_PRESETS: TrendPreset[] = [
  {
    id: 'preset.oven.temp',
    name: 'Печь КП: Температуры 4 зон',
    icon: '🔥',
    section: 'Печь полимеризации',
    isFactory: true,
    timeRangeSec: 300,
    pens: [
      { tagId: 'furnace.zone1.temperature', name: 'Зона #1 Температура', color: '#f59e0b', unit: '°C', axis: 'left', visible: true },
      { tagId: 'furnace.zone2.temperature', name: 'Зона #2 Температура', color: '#ef4444', unit: '°C', axis: 'left', visible: true },
      { tagId: 'furnace.zone3.temperature', name: 'Зона #3 Температура', color: '#ec4899', unit: '°C', axis: 'left', visible: true },
      { tagId: 'furnace.zone4.temperature', name: 'Зона #4 Температура', color: '#8b5cf6', unit: '°C', axis: 'left', visible: true }
    ]
  },
  {
    id: 'preset.spinners.current',
    name: 'Центрифуги: Токи валов 1-4',
    icon: '🌪️',
    section: 'Центрифуги',
    isFactory: true,
    timeRangeSec: 300,
    pens: [
      { tagId: 'spinner.1.current', name: 'Центрифуга вал #1 Ток', color: '#38bdf8', unit: 'A', axis: 'left', visible: true },
      { tagId: 'spinner.2.current', name: 'Центрифуга вал #2 Ток', color: '#10b981', unit: 'A', axis: 'left', visible: true },
      { tagId: 'spinner.3.current', name: 'Центрифуга вал #3 Ток', color: '#f59e0b', unit: 'A', axis: 'left', visible: true },
      { tagId: 'spinner.4.current', name: 'Центрифуга вал #4 Ток', color: '#a855f7', unit: 'A', axis: 'left', visible: true }
    ]
  },
  {
    id: 'preset.kvo.pressure',
    name: 'КВО: Разрежение и отсос',
    icon: '📦',
    section: 'КВО',
    isFactory: true,
    timeRangeSec: 300,
    pens: [
      { tagId: 'kvo.drum.pressure', name: 'Разрежение барабана', color: '#a855f7', unit: 'Pa', axis: 'left', visible: true },
      { tagId: 'kvo.fan.1.freq', name: '1# Вентилятор отсоса Гц', color: '#38bdf8', unit: 'Hz', axis: 'right', visible: true },
      { tagId: 'kvo.fan.2.freq', name: '2# Вентилятор отсоса Гц', color: '#10b981', unit: 'Hz', axis: 'right', visible: true }
    ]
  },
  {
    id: 'preset.crimper.stages',
    name: 'Гофрировщик: Ступени 1-5',
    icon: '📐',
    section: 'Гофрировщик',
    isFactory: true,
    timeRangeSec: 300,
    pens: [
      { tagId: 'crimper.top.1.freq', name: '1# Ступень верх Гц', color: '#38bdf8', unit: 'Hz', axis: 'left', visible: true },
      { tagId: 'crimper.top.2.freq', name: '2# Ступень верх Гц', color: '#10b981', unit: 'Hz', axis: 'left', visible: true },
      { tagId: 'crimper.top.3.freq', name: '3# Ступень верх Гц', color: '#f59e0b', unit: 'Hz', axis: 'left', visible: true },
      { tagId: 'crimper.top.4.freq', name: '4# Ступень верх Гц', color: '#ec4899', unit: 'Hz', axis: 'left', visible: true },
      { tagId: 'crimper.top.5.freq', name: '5# Ступень верх Гц', color: '#8b5cf6', unit: 'Hz', axis: 'left', visible: true }
    ]
  },
  {
    id: 'preset.cutting.saws',
    name: 'Резка: Продольные пилы',
    icon: '✂️',
    section: 'Резка',
    isFactory: true,
    timeRangeSec: 300,
    pens: [
      { tagId: 'saw.long.1.freq', name: '1# Продольная пила', color: '#38bdf8', unit: 'Hz', axis: 'left', visible: true },
      { tagId: 'saw.long.2.freq', name: '2# Продольная пила', color: '#10b981', unit: 'Hz', axis: 'left', visible: true },
      { tagId: 'saw.long.3.freq', name: '3# Продольная пила', color: '#f59e0b', unit: 'Hz', axis: 'left', visible: true },
      { tagId: 'saw.flying.freq', name: 'Летучая пила ЧПУ', color: '#ec4899', unit: 'Hz', axis: 'left', visible: true }
    ]
  },
  {
    id: 'preset.speed.density',
    name: 'Главная скорость и Плотность',
    icon: '⚙️',
    section: 'Линия',
    isFactory: true,
    timeRangeSec: 300,
    pens: [
      { tagId: 'line.main.speed', name: 'Скорость линии', color: '#38bdf8', unit: 'm/min', axis: 'left', visible: true },
      { tagId: 'line.carpet.density', name: 'Плотность ковра', color: '#a855f7', unit: 'kg/m³', axis: 'right', visible: true },
      { tagId: 'furnace.zone1.pressure', name: 'Давление печи', color: '#10b981', unit: 'bar', axis: 'right', visible: true }
    ]
  }
];

export const PEN_COLORS = [
  '#38bdf8', // sky-400
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // rose-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#f97316'  // orange-500
];
