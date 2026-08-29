import React, { useState } from 'react';
import {
  Flame,
  Wind,
  Layers,
  Activity,
  Filter,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Power
} from 'lucide-react';
import type { MechanismTelemetry } from '../../types/scada';
import type { PlcTagDefinition } from '../../types/hmi';

interface CuringOvenScreenProps {
  mechanisms: Record<string, MechanismTelemetry>;
  onSelectMechanism: (m: MechanismTelemetry) => void;
  onSelectAnalogTag?: (tag: PlcTagDefinition) => void;
}

export const CuringOvenScreen: React.FC<CuringOvenScreenProps> = ({
  mechanisms,
  onSelectMechanism,
  onSelectAnalogTag
}) => {
  // Состояние активного контура для подсветки
  const [hoveredTract, setHoveredTract] = useState<string | null>(null);

  // Состояние щеток очистки ламелей
  const [upperBrushOn, setUpperBrushOn] = useState(true);
  const [lowerBrushOn, setLowerBrushOn] = useState(true);
  const [upperThermalRelayOk, setUpperThermalRelayOk] = useState(true);
  const [lowerThermalRelayOk, setLowerThermalRelayOk] = useState(true);

  // 4 Зоны камеры полимеризации с четким направлением продувки
  const zones = [
    {
      id: 1,
      title: 'Зона #1 (Вход / Прогрев)',
      flowDirection: 'up' as const, // СНИЗУ ВВЕРХ
      flowLabel: 'Продувка: СНИЗУ ВВЕРХ (↑)',
      tempSet: 200.0,
      tempAct: 190.5,
      tempBot: 195.8,
      tempTop: 165.2,
      burnerPower: 72,
      gasFlow: 145.2,
      fanFreq: 38.5,
      fanAmps: 120.9,
      fanPress: 1850
    },
    {
      id: 2,
      title: 'Зона #2 (Основной нагрев)',
      flowDirection: 'up' as const, // СНИЗУ ВВЕРХ
      flowLabel: 'Продувка: СНИЗУ ВВЕРХ (↑)',
      tempSet: 245.0,
      tempAct: 245.0,
      tempBot: 248.5,
      tempTop: 218.4,
      burnerPower: 88,
      gasFlow: 198.5,
      fanFreq: 44.5,
      fanAmps: 155.7,
      fanPress: 2200
    },
    {
      id: 3,
      title: 'Зона #3 (Полимеризация)',
      flowDirection: 'down' as const, // СВЕРХУ ВНИЗ
      flowLabel: 'Продувка: СВЕРХУ ВНИЗ (↓)',
      tempSet: 240.0,
      tempAct: 242.0,
      tempTop: 244.0,
      tempBot: 224.6,
      burnerPower: 84,
      gasFlow: 182.0,
      fanFreq: 47.6,
      fanAmps: 184.7,
      fanPress: 2350
    },
    {
      id: 4,
      title: 'Зона #4 (Стабилизация)',
      flowDirection: 'down' as const, // СВЕРХУ ВНИЗ
      flowLabel: 'Продувка: СВЕРХУ ВНИЗ (↓)',
      tempSet: 240.0,
      tempAct: 239.5,
      tempTop: 241.5,
      tempBot: 195.0,
      burnerPower: 79,
      gasFlow: 160.4,
      fanFreq: 47.5,
      fanAmps: 161.1,
      fanPress: 2150
    }
  ];

  // 3 Тракта газоочистки: Рукавный фильтр + Дымосос
  const exhaustTracts = [
    {
      id: 'moisture',
      title: 'Тракт #1: Удаление влаги (Зоны 1-2)',
      filterName: 'Рукавный фильтр ФР-1 (Влагоудаление)',
      fanId: 'oven.exhaust.moisture',
      fanName: 'Дымосос удаления влаги #1',
      fanFreq: 42.5,
      fanAmps: 68.4,
      tempIn: 135.2,
      pressIn: -1420,
      tempOut: 118.4,
      pressOut: -1900,
      deltaP: 480,
      cleaningStatus: 'Регенерация: Норма (Цикл 45с)'
    },
    {
      id: 'gases',
      title: 'Тракт #2: Удаление газов связующего (Зоны 2-4)',
      filterName: 'Рукавный фильтр ФР-2 (Фенольные газы)',
      fanId: 'oven.exhaust.gases',
      fanName: 'Дымосос отсоса газов #2',
      fanFreq: 46.0,
      fanAmps: 85.2,
      tempIn: 185.0,
      pressIn: -1750,
      tempOut: 162.3,
      pressOut: -2270,
      deltaP: 520,
      cleaningStatus: 'Регенерация: Норма (Цикл 30с)'
    },
    {
      id: 'cooling',
      title: 'Тракт #3: Охлаждение ковра на выходе',
      filterName: 'Рукавный фильтр ФР-3 (Секция охлаждения)',
      fanId: 'oven.exhaust.cooling',
      fanName: 'Дымосос секции охлаждения #3',
      fanFreq: 38.0,
      fanAmps: 44.5,
      tempIn: 85.4,
      pressIn: -950,
      tempOut: 64.8,
      pressOut: -1260,
      deltaP: 310,
      cleaningStatus: 'Регенерация: Норма (Цикл 60с)'
    }
  ];

  const handleTagClick = (tagId: string, name: string, unit: string, min: number, max: number) => {
    if (onSelectAnalogTag) {
      onSelectAnalogTag({
        id: tagId,
        plcId: 'PLC-1',
        name,
        description: `Технологический параметр: ${name}`,
        category: 'Analog',
        engineeringUnit: unit,
        minValue: min,
        maxValue: max,
        deadband: 0.5,
        archiveEnabled: true,
        archiveIntervalMs: 1000,
        readOnly: true,
        address: { area: 132, dbNumber: 10, startByte: 0, bitNumber: 0, dataType: 'Real', stringLength: 0 }
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Главная плашка статуса печи */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-wide">
                МНЕМОСХЕМА КАМЕРЫ ПОЛИМЕРИЗАЦИИ
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                РЕЖИМ: АВТОМАТ
              </span>
            </div>
            <p className="text-xs text-slate-400">
              4 зоны продувки (Зоны 1-2: снизу вверх ↑, Зоны 3-4: сверху вниз ↓) &bull; 2 круглые щетки очистки ламелей &bull; 3 рукавных фильтра &bull; 3 дымососа
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 text-[10px] block">Скорость ковра:</span>
            <span className="font-bold text-emerald-400">1.43 м/мин</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 text-[10px] block">Толщина ковра:</span>
            <span className="font-bold text-blue-400">100 мм</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 text-[10px] block">Тяговые цепи (Н/В):</span>
            <span className="font-bold text-cyan-400">7.15 / 7.15 Гц</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. ВЕРХНИЙ БЛОК: 4 КОНТУРА НАГРЕВА И ПРОДУВКИ ЗОН        */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            1. Контуры нагрева и циркуляции (4 Горелки + 4 Вентилятора продувки)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Зоны 1-2: продувка снизу вверх (↑) | Зоны 3-4: продувка сверху вниз (↓)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {zones.map((z) => {
            const burnerMech: MechanismTelemetry = mechanisms[`oven.burner.${z.id}`] || {
              id: `oven.burner.${z.id}`,
              name: `Горелка #${z.id} (Зона ${z.id})`,
              section: 'Печь КП',
              type: 'burner',
              state: 'running',
              mode: 'auto',
              temperatureC: z.tempAct,
              flameDetected: true
            };

            const fanMech: MechanismTelemetry = mechanisms[`oven.fan.${z.id}`] || {
              id: `oven.fan.${z.id}`,
              name: `Вентилятор продувки #${z.id}`,
              section: 'Печь КП',
              type: 'fan',
              state: 'running',
              mode: 'auto',
              frequencyActualHz: z.fanFreq,
              currentAmps: z.fanAmps
            };

            return (
              <div
                key={z.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all"
              >
                {/* Шапка зоны и плашка направления продувки */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-black text-white uppercase">{z.title}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      z.flowDirection === 'up'
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {z.flowDirection === 'up' ? '↑ СНИЗУ ВВЕРХ' : '↓ СВЕРХУ ВНИЗ'}
                  </span>
                </div>

                {/* Газовая горелка */}
                <div
                  onClick={() => onSelectMechanism(burnerMech)}
                  className="bg-slate-950 hover:border-amber-500/50 border border-slate-800 rounded-xl p-3 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-300 group-hover:text-amber-200">
                      <span className="text-sm animate-bounce">🔥</span>
                      <span>Горелка #{z.id}</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ПЛАМЯ OK
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Мощность:</span>
                      <span className="font-bold text-amber-400">{z.burnerPower} %</span>
                    </div>
                    <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Расход газа:</span>
                      <span className="font-bold text-white">{z.gasFlow} м³/ч</span>
                    </div>
                  </div>
                </div>

                {/* Вентилятор продувки */}
                <div
                  onClick={() => onSelectMechanism(fanMech)}
                  className="bg-slate-950 hover:border-cyan-500/50 border border-slate-800 rounded-xl p-3 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-cyan-300 group-hover:text-cyan-200">
                      <Wind className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span>Вентилятор продувки #{z.id}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-cyan-400">{z.fanFreq} Гц</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Ток:</span>
                      <span className="font-bold text-cyan-300">{z.fanAmps} А</span>
                    </div>
                    <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Напор:</span>
                      <span className="font-bold text-purple-300">{z.fanPress} Па</span>
                    </div>
                  </div>
                </div>

                {/* Температура зоны (Интерактивный клик) */}
                <div
                  onClick={() =>
                    handleTagClick(
                      `furnace.zone${z.id}.temperature`,
                      `Температура Зоны #${z.id} КП`,
                      '°C',
                      100,
                      300
                    )
                  }
                  title="Кликните для просмотра мини-тренда и истории"
                  className="bg-gradient-to-br from-amber-500/10 to-rose-500/10 hover:from-amber-500/20 hover:to-rose-500/20 border border-amber-500/30 rounded-xl p-2.5 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      Температура ({z.flowDirection === 'up' ? 'низ ↑ верх' : 'верх ↓ низ'}):
                    </span>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-amber-400 font-bold text-sm">{z.tempAct} °C</span>
                      <span className="text-slate-500 text-xs">/</span>
                      <span className="text-slate-300 font-bold text-xs">
                        {z.flowDirection === 'up' ? z.tempTop : z.tempBot} °C
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold font-sans">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Тренд</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. СРЕДНИЙ БЛОК: 4 ЗОНЫ ПРОДУВКИ И 2 ЩЁТКИ ОЧИСТКИ ЛАМЕЛЕЙ */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                2. Мнемосхема рабочего пространства печи (4 Зоны продувки + 2 Щётки ламелей на выходе)
              </h3>
              <p className="text-[11px] text-slate-400">
                Зоны 1-2 продув снизу вверх, Зоны 3-4 продув сверху вниз. На выходе: очистка верхней и нижней лент
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            Движение: Слева &rarr; Направо
          </span>
        </div>

        {/* Интерактивная 4-зонная мнемосхема камеры с щетками на выходе */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
          {/* Секции 4 зон продувки (4 колонки) */}
          <div className="xl:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            {/* Верхняя прижимная перфорированная цепь */}
            <div className="border-b-2 border-dashed border-cyan-500/40 pb-2 flex items-center justify-between text-[11px] font-mono text-cyan-400">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                ▲ ВЕРХНЯЯ ПРИЖИМНАЯ СЕТКА (Гусеница)
              </span>
              <span>Привод ВЦ: 7.15 Гц / 33.7 А</span>
            </div>

            {/* 4 ЗОНЫ ПРОДУВКИ КОВРА */}
            <div className="grid grid-cols-4 gap-2 my-2">
              {zones.map((z) => {
                const isUp = z.flowDirection === 'up';
                return (
                  <div
                    key={z.id}
                    className={`relative rounded-xl p-3 border flex flex-col justify-between items-center text-center transition-all ${
                      isUp
                        ? 'bg-gradient-to-t from-blue-950/40 via-amber-950/30 to-slate-900/50 border-blue-500/40'
                        : 'bg-gradient-to-b from-purple-950/40 via-amber-950/30 to-slate-900/50 border-purple-500/40'
                    }`}
                  >
                    {/* Название зоны */}
                    <div className="w-full flex items-center justify-between text-[10px] font-bold pb-1 border-b border-slate-800/60 font-mono">
                      <span className="text-white">ЗОНА #{z.id}</span>
                      <span className={isUp ? 'text-blue-400' : 'text-purple-400'}>
                        {isUp ? '↑ СНИЗУ' : '↓ СВЕРХУ'}
                      </span>
                    </div>

                    {/* Анимированные стрелки продувки */}
                    <div className="my-3 flex flex-col items-center justify-center space-y-1">
                      {isUp ? (
                        <>
                          <ArrowUp className="w-5 h-5 text-amber-400 animate-bounce" />
                          <div className="px-2 py-1 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold font-mono">
                            Горячий газ ↑
                          </div>
                          <span className="text-[10px] font-mono text-amber-300 font-bold">{z.tempAct} °C</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-mono text-amber-300 font-bold">{z.tempAct} °C</span>
                          <div className="px-2 py-1 rounded bg-purple-600/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold font-mono">
                            Горячий газ ↓
                          </div>
                          <ArrowDown className="w-5 h-5 text-amber-400 animate-bounce" />
                        </>
                      )}
                    </div>

                    {/* Инфо о горелке и вентиляторе */}
                    <div className="w-full text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/60 flex justify-between">
                      <span>Г#{z.id}: {z.burnerPower}%</span>
                      <span>В#{z.id}: {z.fanFreq}Гц</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Базальтовый ковер (Проход через все 4 зоны) */}
            <div className="py-2.5 bg-gradient-to-r from-amber-700/60 via-amber-600/70 to-yellow-800/80 rounded-lg border-y-2 border-amber-500/70 flex items-center justify-between px-4 text-xs font-black text-amber-100 shadow-inner">
              <div className="flex items-center space-x-1.5">
                <ArrowRight className="w-4 h-4 animate-pulse text-amber-300" />
                <span>Сырой ковер</span>
              </div>
              <div className="px-3 py-0.5 bg-black/40 rounded border border-amber-400/40 text-[10px] font-mono">
                Непрерывное спекание связующего ~245°C
              </div>
              <div className="flex items-center space-x-1.5">
                <span>Отвержденная плита</span>
                <ArrowRight className="w-4 h-4 animate-pulse text-amber-300" />
              </div>
            </div>

            {/* Нижняя тяговая перфорированная цепь */}
            <div className="border-t-2 border-dashed border-blue-500/40 pt-2 flex items-center justify-between text-[11px] font-mono text-blue-400">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                ▼ НИЖНЯЯ ТЯГОВАЯ СЕТКА (Гусеница)
              </span>
              <span>Привод НЦ: 7.15 Гц / 45.0 А</span>
            </div>
          </div>

          {/* Правая секция: 2 Круглые щётки очистки ламелей на выходе из КП */}
          <div className="xl:col-span-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <RotateCw className="w-4 h-4 text-cyan-400" />
                <span>Очистка ламелей КП</span>
              </div>
              <span className="text-[10px] text-slate-400">Выходная секция печи</span>
            </div>

            {/* 1. Верхняя круглая щетка */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      upperBrushOn
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 animate-spin'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">Верхняя щетка</div>
                    <div className="text-[9px] text-slate-400 font-sans">Круглый тип (лента ВЦ)</div>
                  </div>
                </div>

                <button
                  onClick={() => setUpperBrushOn(!upperBrushOn)}
                  title={upperBrushOn ? 'Остановить верхнюю щетку' : 'Запустить верхнюю щетку'}
                  className={`p-1.5 rounded-lg font-bold text-xs transition-all border ${
                    upperBrushOn
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Тепловое реле защиты верхней щетки */}
              <div
                onClick={() => setUpperThermalRelayOk(!upperThermalRelayOk)}
                title="Кликните для имитации состояния теплового реле защиты"
                className={`p-2 rounded-lg text-[10px] font-mono flex items-center justify-between cursor-pointer border transition-all ${
                  upperThermalRelayOk
                    ? 'bg-slate-950 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-950/60 text-rose-400 border-rose-500/40 animate-pulse'
                }`}
              >
                <div className="flex items-center gap-1">
                  {upperThermalRelayOk ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                  )}
                  <span>Тепловое реле:</span>
                </div>
                <span className="font-bold">{upperThermalRelayOk ? 'НОРМА (OK)' : 'ПЕРЕГРУЗКА'}</span>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Ток двигателя:</span>
                <span className="text-cyan-400 font-bold">{upperBrushOn ? '3.8 А' : '0.0 А'}</span>
              </div>
            </div>

            {/* 2. Нижняя круглая щетка */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      lowerBrushOn
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 animate-spin'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">Нижняя щетка</div>
                    <div className="text-[9px] text-slate-400 font-sans">Круглый тип (лента НЦ)</div>
                  </div>
                </div>

                <button
                  onClick={() => setLowerBrushOn(!lowerBrushOn)}
                  title={lowerBrushOn ? 'Остановить нижнюю щетку' : 'Запустить нижнюю щетку'}
                  className={`p-1.5 rounded-lg font-bold text-xs transition-all border ${
                    lowerBrushOn
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Тепловое реле защиты нижней щетки */}
              <div
                onClick={() => setLowerThermalRelayOk(!lowerThermalRelayOk)}
                title="Кликните для имитации состояния теплового реле защиты"
                className={`p-2 rounded-lg text-[10px] font-mono flex items-center justify-between cursor-pointer border transition-all ${
                  lowerThermalRelayOk
                    ? 'bg-slate-950 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-950/60 text-rose-400 border-rose-500/40 animate-pulse'
                }`}
              >
                <div className="flex items-center gap-1">
                  {lowerThermalRelayOk ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                  )}
                  <span>Тепловое реле:</span>
                </div>
                <span className="font-bold">{lowerThermalRelayOk ? 'НОРМА (OK)' : 'ПЕРЕГРУЗКА'}</span>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Ток двигателя:</span>
                <span className="text-blue-400 font-bold">{lowerBrushOn ? '4.1 А' : '0.0 А'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. НИЖНИЙ БЛОК: 3 ТРАКТА ГАЗООЧИСТКИ (ФИЛЬТРЫ + ДЫМОСОСЫ) */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Filter className="w-4 h-4" />
            3. Система аспирации и фильтрации (3 Рукавных фильтра + 3 Дымососа)
          </h3>
          <span className="text-xs text-slate-500 font-mono">Контроль T, P до/после рукавных фильтров и ΔP</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {exhaustTracts.map((tract) => {
            const fanMech: MechanismTelemetry = mechanisms[tract.fanId] || {
              id: tract.fanId,
              name: tract.fanName,
              section: 'Газоочистка печи',
              type: 'exhaust',
              state: 'running',
              mode: 'auto',
              frequencyActualHz: tract.fanFreq,
              currentAmps: tract.fanAmps
            };

            return (
              <div
                key={tract.id}
                onMouseEnter={() => setHoveredTract(tract.id)}
                onMouseLeave={() => setHoveredTract(null)}
                className={`bg-slate-900 border rounded-2xl p-4 space-y-4 transition-all shadow-xl ${
                  hoveredTract === tract.id ? 'border-purple-500/60 shadow-purple-500/10' : 'border-slate-800'
                }`}
              >
                {/* Шапка тракта */}
                <div className="border-b border-slate-800 pb-2">
                  <div className="text-xs font-black text-white tracking-wide">{tract.title}</div>
                  <div className="text-[11px] text-purple-400 font-mono mt-0.5">{tract.filterName}</div>
                </div>

                {/* Рукавный фильтр с датчиками ДО и ПОСЛЕ */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                      <Filter className="w-3.5 h-3.5 text-purple-400" />
                      <span>Рукавный фильтр (Baghouse)</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      ΔP: {tract.deltaP} Па
                    </span>
                  </div>

                  {/* Сравнение ДО и ПОСЛЕ фильтра */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {/* ДО ФИЛЬТРА */}
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                        ВХОД (ДО ФИЛЬТРА)
                      </div>
                      <div
                        onClick={() =>
                          handleTagClick(
                            `oven.filter.${tract.id}.temp_in`,
                            `Температура до фильтра (${tract.id})`,
                            '°C',
                            0,
                            250
                          )
                        }
                        title="Кликните для просмотра мини-тренда T_вх"
                        className="cursor-pointer hover:text-amber-300 transition-colors"
                      >
                        <span className="text-[10px] text-slate-500 block">Температура:</span>
                        <span className="font-bold text-amber-400">{tract.tempIn} °C 📈</span>
                      </div>
                      <div
                        onClick={() =>
                          handleTagClick(
                            `oven.filter.${tract.id}.press_in`,
                            `Разрежение до фильтра (${tract.id})`,
                            'Па',
                            -3000,
                            0
                          )
                        }
                        title="Кликните для просмотра мини-тренда P_вх"
                        className="cursor-pointer hover:text-purple-300 transition-colors"
                      >
                        <span className="text-[10px] text-slate-500 block">Разрежение:</span>
                        <span className="font-bold text-purple-400">{tract.pressIn} Па 📈</span>
                      </div>
                    </div>

                    {/* ПОСЛЕ ФИЛЬТРА */}
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                        ВЫХОД (ПОСЛЕ ФИЛЬТРА)
                      </div>
                      <div
                        onClick={() =>
                          handleTagClick(
                            `oven.filter.${tract.id}.temp_out`,
                            `Температура после фильтра (${tract.id})`,
                            '°C',
                            0,
                            250
                          )
                        }
                        title="Кликните для просмотра мини-тренда T_вых"
                        className="cursor-pointer hover:text-amber-300 transition-colors"
                      >
                        <span className="text-[10px] text-slate-500 block">Температура:</span>
                        <span className="font-bold text-amber-400">{tract.tempOut} °C 📈</span>
                      </div>
                      <div
                        onClick={() =>
                          handleTagClick(
                            `oven.filter.${tract.id}.press_out`,
                            `Разрежение после фильтра (${tract.id})`,
                            'Па',
                            -3500,
                            0
                          )
                        }
                        title="Кликните для просмотра мини-тренда P_вых"
                        className="cursor-pointer hover:text-purple-300 transition-colors"
                      >
                        <span className="text-[10px] text-slate-500 block">Разрежение:</span>
                        <span className="font-bold text-purple-400">{tract.pressOut} Па 📈</span>
                      </div>
                    </div>
                  </div>

                  {/* Статус регенерации рукавов */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {tract.cleaningStatus}
                    </span>
                    <span className="text-emerald-400 font-bold">Рукава чистые</span>
                  </div>
                </div>

                {/* Дымосос (Тягодутьевой агрегат) */}
                <div
                  onClick={() => onSelectMechanism(fanMech)}
                  className="bg-slate-950 hover:border-emerald-500/50 border border-slate-800 rounded-xl p-3.5 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-400 group-hover:text-emerald-300">
                      <Activity className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>{tract.fanName}</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      В РАБОТЕ
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Частота ПЧ:</span>
                      <span className="font-bold text-emerald-400 text-sm">{tract.fanFreq} Гц</span>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Ток двигателя:</span>
                      <span className="font-bold text-white text-sm">{tract.fanAmps} А</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
