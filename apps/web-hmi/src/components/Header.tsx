import React from 'react';
import {
  Bell,
  Flame,
  Wind,
  Layers,
  Sliders,
  Scissors,
  Gauge,
  Factory,
  LineChart,
  Table2,
  FileCode2,
  FileText,
  Package,
  Users,
  FlaskConical,
  Server,
  Zap,
  ClipboardCheck
} from 'lucide-react';
import type { PlcStatus } from '../types/hmi';
import type { ProductRecipe } from '../types/recipe';
import { useLanguage } from '../context/LanguageContext';

export type ScadaTab =
  | 'overview'
  | 'spinner'
  | 'kvo'
  | 'crimper'
  | 'oven'
  | 'cutting'
  | 'density'
  | 'recipes'
  | 'shiftReport'
  | 'qc'
  | 'equipment'
  | 'energy'
  | 'trends'
  | 'tags'
  | 'users'
  | 'alarms'
  | 'settings'
  | 'openness';

interface HeaderProps {
  plcStatus: PlcStatus | null;
  activeTab: ScadaTab;
  setActiveTab: (tab: ScadaTab) => void;
  activeAlarmCount?: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeRecipe?: ProductRecipe | null;
}

export const Header: React.FC<HeaderProps> = ({
  plcStatus,
  activeTab,
  setActiveTab,
  activeAlarmCount = 0,
  theme,
  onToggleTheme,
  activeRecipe
}) => {
  const isConnected = plcStatus?.isConnected ?? false;
  const { t } = useLanguage();

  // Параметры процесса
  const currentProduct = activeRecipe?.name || 'ТЕХНОРУФ Н ЭКСТРА 1200x600x100';
  const currentThickness = activeRecipe?.thicknessMm ?? 100;
  const currentDensity = activeRecipe?.targetDensityKgM3 ?? 115;
  const currentCrimping = activeRecipe?.crimpingRatio ?? 1.85;
  const currentKvoSpeed = activeRecipe?.kvoSpeedMPerMin ?? 24.5;
  const currentOvenSpeed = activeRecipe?.curingOvenSpeedMPerMin ?? 1.43;

  const getScreenDetails = (tab: ScadaTab) => {
    switch (tab) {
      case 'overview':
        return { title: t('overview'), icon: <Factory className="w-5 h-5 text-blue-400" />, section: t('productionLine') };
      case 'spinner':
        return { title: t('spinners'), icon: <Wind className="w-5 h-5 text-cyan-400" />, section: t('productionLine') };
      case 'kvo':
        return { title: t('kvo'), icon: <Layers className="w-5 h-5 text-amber-400" />, section: t('productionLine') };
      case 'crimper':
        return { title: t('crimper'), icon: <Sliders className="w-5 h-5 text-purple-400" />, section: t('productionLine') };
      case 'oven':
        return { title: t('curingOven'), icon: <Flame className="w-5 h-5 text-rose-500 animate-pulse" />, section: t('productionLine') };
      case 'cutting':
        return { title: t('cutting'), icon: <Scissors className="w-5 h-5 text-emerald-400" />, section: t('productionLine') };
      case 'density':
        return { title: t('density'), icon: <Gauge className="w-5 h-5 text-indigo-400" />, section: t('productionLine') };
      case 'recipes':
        return { title: t('recipes'), icon: <FileText className="w-5 h-5 text-emerald-400" />, section: t('analytics') };
      case 'shiftReport':
        return { title: t('shiftReport'), icon: <ClipboardCheck className="w-5 h-5 text-emerald-400" />, section: t('analytics') };
      case 'qc':
        return { title: t('qc'), icon: <FlaskConical className="w-5 h-5 text-teal-400" />, section: t('analytics') };
      case 'equipment':
        return { title: t('equipment'), icon: <Server className="w-5 h-5 text-blue-400" />, section: t('analytics') };
      case 'energy':
        return { title: t('energy'), icon: <Zap className="w-5 h-5 text-amber-400" />, section: t('analytics') };
      case 'trends':
        return { title: t('trends'), icon: <LineChart className="w-5 h-5 text-emerald-400" />, section: t('analytics') };
      case 'tags':
        return { title: t('tags'), icon: <Table2 className="w-5 h-5 text-blue-400" />, section: t('analytics') };
      case 'users':
        return { title: t('users'), icon: <Users className="w-5 h-5 text-purple-400" />, section: t('analytics') };
      case 'alarms':
        return { title: t('alarms'), icon: <Bell className="w-5 h-5 text-rose-400" />, section: t('analytics') };
      case 'settings':
        return { title: t('settings'), icon: <Sliders className="w-5 h-5 text-indigo-400" />, section: t('analytics') };
      case 'openness':
        return { title: t('openness'), icon: <FileCode2 className="w-5 h-5 text-amber-400" />, section: t('analytics') };
    }
  };

  const details = getScreenDetails(activeTab);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="px-3 sm:px-5 h-14 flex items-center justify-between gap-3">
        {/* Левая часть: Заголовок экрана */}
        <div className="flex items-center space-x-2.5 overflow-hidden flex-shrink-0">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex-shrink-0">
            {details.icon}
          </div>
          <div className="truncate hidden md:block">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs lg:text-sm font-black text-white tracking-wide truncate">{details.title}</h2>
              <span className="hidden xl:inline px-2 py-0.2 text-[9px] font-bold bg-slate-800 text-slate-400 rounded border border-slate-700">
                {details.section}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ЦЕНТРАЛЬНЫЙ СТАТУС-БАР ТЕХНОЛОГИЧЕСКОГО ПРОЦЕССА         */}
        {/* ======================================================== */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono select-none scrollbar-none">
          {/* 1. Продукт */}
          <button
            onClick={() => setActiveTab('recipes')}
            title="Текущий продукт на линии. Кликните для выбора или настройки рецепта"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 transition-all font-sans font-bold text-xs flex-shrink-0"
          >
            <Package className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{currentProduct}</span>
          </button>

          {/* 2. Толщина */}
          <div
            title="Толщина минераловатной плиты"
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 flex-shrink-0"
          >
            <span className="text-[10px] text-slate-500 font-sans">{t('thickness')}:</span>
            <strong className="text-white font-bold">{currentThickness} мм</strong>
          </div>

          {/* 3. Заданная плотность */}
          <div
            title="Заданная плотность готового продукта"
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 flex-shrink-0"
          >
            <span className="text-[10px] text-slate-500 font-sans">{t('densityLabel')}:</span>
            <strong className="text-emerald-400 font-bold">{currentDensity} кг/м³</strong>
          </div>

          {/* 4. Коэффициент гофрирования */}
          <div
            title="Коэффициент гофрирования ковра (КГ)"
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 flex-shrink-0"
          >
            <span className="text-[10px] text-slate-500 font-sans">{t('crimpingRatio')}:</span>
            <strong className="text-cyan-400 font-bold">{currentCrimping.toFixed(2)}</strong>
          </div>

          {/* 5. Скорость барабана КВО */}
          <div
            title="Текущая линейная скорость сетчатого барабана КВО"
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 flex-shrink-0"
          >
            <span className="text-[10px] text-slate-500 font-sans">{t('kvoSpeed')}:</span>
            <strong className="text-blue-300 font-bold">{currentKvoSpeed.toFixed(1)} м/мин</strong>
          </div>

          {/* 6. Скорость печи КП */}
          <div
            title="Текущая скорость движения прижимных цепей печи КП"
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 flex-shrink-0"
          >
            <span className="text-[10px] text-slate-500 font-sans">{t('ovenSpeed')}:</span>
            <strong className="text-amber-400 font-bold">{currentOvenSpeed.toFixed(2)} м/мин</strong>
          </div>
        </div>

        {/* Правая часть: Аварии, Тема, Диагностика ПЛК */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {/* Быстрая кнопка аварий */}
          <button
            onClick={() => setActiveTab('alarms')}
            title="Перейти к авариям"
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeAlarmCount > 0
                ? 'bg-rose-600/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{activeAlarmCount}</span>
          </button>

          {/* Тема */}
          <button
            onClick={onToggleTheme}
            title="Переключить тему оформления (Dark / Light)"
            className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          {/* Диагностика связи */}
          <div className="hidden xl:flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{(plcStatus?.lastRoundTripTimeMs ?? 1.5).toFixed(1)}ms</span>
          </div>
        </div>
      </div>
    </header>
  );
};
