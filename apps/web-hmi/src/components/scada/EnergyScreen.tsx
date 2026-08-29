import React, { useState, useMemo } from 'react';
import {
  Zap,
  DollarSign,
  TrendingDown,
  Clock,
  Sun,
  Moon,
  CloudSun,
  Activity,
  FileSpreadsheet,
  Settings2,
  Sliders,
  Server,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ProductRecipe } from '../../types/recipe';
import type { ElectricityTariffSettings } from '../../types/energy';
import {
  generateHourlyProfile,
  getTopDriveConsumers,
  getAreaEnergyBreakdown,
  calculateEnergyKpis
} from '../../data/defaultEnergyData';
import { useSettings } from '../../context/SettingsContext';

interface EnergyScreenProps {
  activeRecipe?: ProductRecipe | null;
}

export const EnergyScreen: React.FC<EnergyScreenProps> = ({ activeRecipe }) => {
  const { settings, updateSettings } = useSettings();

  const tariffs: ElectricityTariffSettings = useMemo(() => ({
    isMultiTariff: settings.isMultiTariff,
    singleTariffRubPerKWh: settings.singleTariffRub,
    t1PeakRubPerKWh: settings.tariffT1PeakRub,
    t2HalfOffRubPerKWh: settings.tariffT2HalfOffRub,
    t3NightRubPerKWh: settings.tariffT3NightRub
  }), [settings]);

  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);

  // Временные значения в модалке
  const [modalIsMulti, setModalIsMulti] = useState(settings.isMultiTariff);
  const [modalSingleRate, setModalSingleRate] = useState(settings.singleTariffRub);
  const [modalT1, setModalT1] = useState(settings.tariffT1PeakRub);
  const [modalT2, setModalT2] = useState(settings.tariffT2HalfOffRub);
  const [modalT3, setModalT3] = useState(settings.tariffT3NightRub);

  // Параметры калькулятора энергосбережения дымососа КВО (355 кВт)
  const [fanSpeedReductionPercent, setFanSpeedReductionPercent] = useState<number>(5);

  const density = activeRecipe?.targetDensityKgM3 ?? 115;
  const speed = activeRecipe?.curingOvenSpeedMPerMin ?? 12.5;
  const thickness = activeRecipe?.thicknessMm ?? 100;

  // Расчетные данные
  const kpis = useMemo(() => calculateEnergyKpis(tariffs, density, speed, thickness), [tariffs, density, speed, thickness]);
  const hourlyProfile = useMemo(() => generateHourlyProfile(tariffs), [tariffs]);
  const areaBreakdown = useMemo(() => getAreaEnergyBreakdown(tariffs), [tariffs]);
  const topConsumers = useMemo(() => getTopDriveConsumers(tariffs), [tariffs]);

  // Расчет экономии по закону подобия вентиляторов: P2 = P1 * (n2 / n1)^3
  const fanNominalPowerKw = 355;
  const fanActualPowerKw = fanNominalPowerKw * 0.78; // Текущая рабочая точка ~277 кВт
  const speedRatio = (100 - fanSpeedReductionPercent) / 100;
  const optimizedPowerKw = fanActualPowerKw * Math.pow(speedRatio, 3);
  const savedPowerKw = fanActualPowerKw - optimizedPowerKw;
  const yearlyWorkingHours = 7500; // Часов в год
  const avgKwhRate = tariffs.isMultiTariff ? tariffs.t2HalfOffRubPerKWh : tariffs.singleTariffRubPerKWh;
  const yearlySavingsRub = Math.round(savedPowerKw * yearlyWorkingHours * avgKwhRate);
  const yearlySavingsKWh = Math.round(savedPowerKw * yearlyWorkingHours);

  const handleSaveTariffs = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      isMultiTariff: modalIsMulti,
      singleTariffRub: Number(modalSingleRate),
      tariffT1PeakRub: Number(modalT1),
      tariffT2HalfOffRub: Number(modalT2),
      tariffT3NightRub: Number(modalT3)
    });
    setIsTariffModalOpen(false);
  };

  // Экспорт в Excel (XLSX)
  const handleExportXlsx = () => {
    // Лист 1: Сводный профиль по часам
    const profileData = hourlyProfile.map((p) => ({
      'Час': p.label,
      'Тарифная зона': p.tariffZone === 'T1_PEAK' ? 'Т1 Пик' : p.tariffZone === 'T3_NIGHT' ? 'Т3 Ночь' : 'Т2 Полупик',
      'Мощность (кВт)': p.powerKw,
      'Потребление (кВт·ч)': p.energyKWh,
      'Затраты (руб)': p.costRub,
      'Выпуск продукции (т)': p.productionTons,
      'Удельный расход (кВт·ч/т)': p.secKWhPerTon
    }));

    // Лист 2: По переделам
    const areasData = areaBreakdown.map((a) => ({
      'Участок': a.areaName,
      'Код зоны': a.areaCode,
      'Текущая мощность (кВт)': a.currentPowerKw,
      'Расход за смену (кВт·ч)': a.shiftEnergyKWh,
      'Затраты за смену (руб)': a.shiftCostRub,
      'Доля (%)': a.sharePercent,
      'Главный потребитель': a.topConsumerName,
      'Мощность главного (кВт)': a.topConsumerPowerKw
    }));

    // Лист 3: Топ потребителей
    const topData = topConsumers.map((c, idx) => ({
      'Рейтинг': idx + 1,
      'Агрегат': c.name,
      'Шкаф': c.cabinet,
      'Схема': c.schemeName,
      'Участок': c.areaName,
      'Номинал (кВт)': c.nominalPowerKw,
      'Текущая мощность (кВт)': c.currentPowerKw,
      'Ток (А)': c.currentAmps,
      'Расход за смену (кВт·ч)': c.shiftEnergyKWh,
      'Затраты за смену (руб)': c.shiftCostRub
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(profileData);
    const ws2 = XLSX.utils.json_to_sheet(areasData);
    const ws3 = XLSX.utils.json_to_sheet(topData);

    XLSX.utils.book_append_sheet(wb, ws1, 'Суточный профиль');
    XLSX.utils.book_append_sheet(wb, ws2, 'По участкам линии');
    XLSX.utils.book_append_sheet(wb, ws3, 'Топ потребителей');

    XLSX.writeFile(wb, `Energy_Report_MineralWool_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Главный заголовок экрана */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-wide">
                ЭНЕРГОУЧЕТ И РАСЧЕТ ЗАТРАТ ЭЛЕКТРОЭНЕРГИИ
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ISO 50001 &bull; СИСТЕМА ЭНЕРГОМЕНЕДЖМЕНТА
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Мониторинг активной мощности, дифференцированных тарифов (Т1/Т2/Т3), удельного расхода на тонну и м³ продукции
            </p>
          </div>
        </div>

        {/* Кнопки действий: Настройка тарифов + Экспорт Excel */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setModalIsMulti(tariffs.isMultiTariff);
              setModalSingleRate(tariffs.singleTariffRubPerKWh);
              setModalT1(tariffs.t1PeakRubPerKWh);
              setModalT2(tariffs.t2HalfOffRubPerKWh);
              setModalT3(tariffs.t3NightRubPerKWh);
              setIsTariffModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            <Settings2 className="w-4 h-4 text-amber-400" />
            <span>Настройка тарифов</span>
          </button>

          <button
            onClick={handleExportXlsx}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Экспорт энергоотчета</span>
          </button>
        </div>
      </div>

      {/* 2. Сводные KPI энергоэффективности */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Текущая мощность линии */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Текущая мощность линии</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {kpis.currentPowerKw} <span className="text-xs text-slate-400 font-sans">кВт</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Стоимость: <strong className="text-white font-mono">{kpis.hourlyCostRub.toLocaleString('ru-RU')}</strong> руб/час
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Затраты за смену */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Затраты за смену (12ч)</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {kpis.shiftCostRub.toLocaleString('ru-RU')} <span className="text-xs text-slate-400 font-sans">₽</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Потребление: <strong className="text-white font-mono">{kpis.shiftEnergyKWh.toLocaleString('ru-RU')}</strong> кВт·ч
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Удельный расход на тонну продукции (SEC) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Удельный расход на тонну (SEC)</div>
            <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
              {kpis.specificEnergyPerTon} <span className="text-xs text-slate-400 font-sans">кВт·ч/т</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Норма ГОСТ: &le; 165 кВт·ч/т</span>
            </div>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Тарифная зона в текущий час */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Текущая тарифная зона</div>
            <div className="text-xl font-black text-purple-400 font-mono mt-1 flex items-center gap-1.5">
              {kpis.currentTariffZone === 'T1_PEAK' && <Sun className="w-5 h-5 text-rose-400" />}
              {kpis.currentTariffZone === 'T2_HALFOFF' && <CloudSun className="w-5 h-5 text-amber-400" />}
              {kpis.currentTariffZone === 'T3_NIGHT' && <Moon className="w-5 h-5 text-blue-400" />}
              <span>
                {kpis.currentTariffZone === 'T1_PEAK' ? 'Т1 (Пик)' : kpis.currentTariffZone === 'T3_NIGHT' ? 'Т3 (Ночь)' : 'Т2 (Полупик)'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Ставка: <strong className="text-white font-mono">{kpis.currentTariffRateRub.toFixed(2)}</strong> ₽/кВт·ч
            </div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. График суточного профиля нагрузки (24 часа) с тарифными зонами */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Суточный профиль электрической нагрузки линии (24 часа)</span>
            </h3>
            <p className="text-xs text-slate-400">Динамика мощности, удельного расхода и дифференцированные тарифные интервалы</p>
          </div>

          {/* Легенда тарифов */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500" />
              <span className="text-slate-300">Т1 Пик ({tariffs.t1PeakRubPerKWh}₽)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500" />
              <span className="text-slate-300">Т2 Полупик ({tariffs.t2HalfOffRubPerKWh}₽)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500" />
              <span className="text-slate-300">Т3 Ночь ({tariffs.t3NightRubPerKWh}₽)</span>
            </div>
          </div>
        </div>

        {/* Столбчатая гистограмма нагрузки по часам */}
        <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-800">
          {hourlyProfile.map((p) => {
            const heightPercent = Math.min(100, Math.max(20, (p.powerKw / 1100) * 100));
            const isCurrent = p.hour === new Date().getHours();

            let barColor = 'bg-amber-500/30 border-amber-500';
            if (p.tariffZone === 'T1_PEAK') barColor = 'bg-rose-500/30 border-rose-500 text-rose-400';
            if (p.tariffZone === 'T3_NIGHT') barColor = 'bg-blue-500/30 border-blue-500 text-blue-400';

            return (
              <div
                key={p.hour}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                  <div className="bg-slate-950 text-white text-[10px] rounded-lg p-2 shadow-2xl border border-slate-700 whitespace-nowrap font-mono space-y-0.5">
                    <div className="font-bold text-cyan-400">{p.label} &bull; {p.tariffZone === 'T1_PEAK' ? 'Т1 Пик' : p.tariffZone === 'T3_NIGHT' ? 'Т3 Ночь' : 'Т2 Полупик'}</div>
                    <div>Мощность: <span className="text-white font-bold">{p.powerKw} кВт</span></div>
                    <div>Затраты: <span className="text-emerald-400 font-bold">{p.costRub.toLocaleString('ru-RU')} ₽</span></div>
                    <div>Удельный: <span className="text-amber-400 font-bold">{p.secKWhPerTon} кВт·ч/т</span></div>
                  </div>
                  <div className="w-2 h-2 bg-slate-950 rotate-45 border-r border-b border-slate-700 -mt-1" />
                </div>

                {/* Столбик */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t border transition-all duration-300 group-hover:brightness-125 ${barColor} ${
                    isCurrent ? 'ring-2 ring-white animate-pulse' : ''
                  }`}
                />
                <span className={`text-[9px] font-mono mt-1 ${isCurrent ? 'text-white font-bold' : 'text-slate-500'}`}>
                  {p.hour % 3 === 0 ? p.label.slice(0, 2) : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Структура затрат по 5 участкам + Топ потребителей */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Структура по переделам */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Распределение затрат по участкам линии (5 переделов)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">100% = {kpis.currentPowerKw} кВт</span>
          </div>

          <div className="space-y-3">
            {areaBreakdown.map((area) => (
              <div key={area.areaId} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>{area.areaName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({area.drivesCount} приводов)</span>
                  </span>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-amber-400 font-bold">{area.currentPowerKw} кВт</span>
                    <span className="text-slate-400">({area.sharePercent}%)</span>
                    <span className="text-emerald-400 font-bold">{area.shiftCostRub.toLocaleString('ru-RU')} ₽/смена</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${area.sharePercent}%` }}
                    className={`h-full rounded-full ${
                      area.areaId === 'kvo'
                        ? 'bg-amber-500'
                        : area.areaId === 'oven'
                        ? 'bg-rose-500'
                        : area.areaId === 'spinner'
                        ? 'bg-cyan-500'
                        : area.areaId === 'cutting'
                        ? 'bg-emerald-500'
                        : 'bg-purple-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                  <span>Главный узел: <strong className="text-slate-300">{area.topConsumerName}</strong></span>
                  <span className="text-slate-400">{area.topConsumerPowerKw} кВт</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Топ-10 потребителей линии */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              <span>Рейтинг самых энергоемких агрегатов (Топ-10)</span>
            </h3>
            <span className="text-xs text-slate-400">Потребление за смену (12ч)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2">№</th>
                  <th className="px-3 py-2">Агрегат / Шкаф</th>
                  <th className="px-3 py-2 text-right">Номинал</th>
                  <th className="px-3 py-2 text-right">Текущ. кВт</th>
                  <th className="px-3 py-2 text-right">За смену (₽)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {topConsumers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2 font-bold text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2 font-sans">
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        Шкаф {c.cabinet} &bull; {c.schemeName}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400">{c.nominalPowerKw} кВт</td>
                    <td className="px-3 py-2 text-right font-bold text-amber-400">{c.currentPowerKw} кВт</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-400">
                      {c.shiftCostRub.toLocaleString('ru-RU')} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Интерактивный калькулятор энергосбережения дымососа КВО (355 кВт) */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Калькулятор энергосбережения дымососа КВО (355 кВт, ЧРП Sinamics G120)
            </h3>
            <p className="text-xs text-slate-400">
              Оптимизация частоты вращения по закону подобия гидромашин: <code className="text-indigo-400 font-mono">P₂ = P₁ &times; (n₂ / n₁)³</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
          {/* Ползунок регулировки */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">Снижение оборотов дымососа:</span>
              <span className="font-mono font-bold text-cyan-400 text-sm">-{fanSpeedReductionPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={fanSpeedReductionPercent}
              onChange={(e) => setFanSpeedReductionPercent(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (50.0 Гц)</span>
              <span>10% (45.0 Гц)</span>
              <span>20% (40.0 Гц)</span>
            </div>
          </div>

          {/* Снижение мощности */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400">Снижение потребляемой мощности:</div>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {optimizedPowerKw.toFixed(1)} кВт <span className="text-xs text-slate-400 font-sans">(было {fanActualPowerKw.toFixed(1)} кВт)</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono">
              Экономия мощности: -{savedPowerKw.toFixed(1)} кВт (-{((savedPowerKw / fanActualPowerKw) * 100).toFixed(1)}%)
            </div>
          </div>

          {/* Годовая экономия в рублях */}
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-1">
            <div className="text-xs text-slate-400">Прогнозируемый годовой экономический эффект:</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              +{yearlySavingsRub.toLocaleString('ru-RU')} ₽ / год
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Сбережение: {yearlySavingsKWh.toLocaleString('ru-RU')} кВт·ч/год
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. МОДАЛЬНОЕ ОКНО НАСТРОЙКИ ТАРИФОВ ЭЛЕКТРОЭНЕРГИИ      */}
      {/* ======================================================== */}
      {isTariffModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-amber-400" />
                <span>Настройка тарифов на электроэнергию</span>
              </h3>
              <button
                onClick={() => setIsTariffModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTariffs} className="space-y-4 text-xs">
              <div className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="multiTariff"
                  checked={modalIsMulti}
                  onChange={(e) => setModalIsMulti(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="multiTariff" className="text-slate-200 font-bold cursor-pointer">
                  Дифференцированный тариф по зонам суток (Т1 / Т2 / Т3)
                </label>
              </div>

              {modalIsMulti ? (
                <div className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-rose-400" />
                      <span>Т1 Пик (07:00-10:00, 17:00-21:00) (₽/кВт·ч):</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={modalT1}
                      onChange={(e) => setModalT1(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Т2 Полупик (10:00-17:00, 21:00-23:00) (₽/кВт·ч):</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={modalT2}
                      onChange={(e) => setModalT2(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-blue-400" />
                      <span>Т3 Ночь (23:00-07:00) (₽/кВт·ч):</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={modalT3}
                      onChange={(e) => setModalT3(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Единый тариф (₽/кВт·ч):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={modalSingleRate}
                    onChange={(e) => setModalSingleRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTariffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20"
                >
                  Сохранить тарифы
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
