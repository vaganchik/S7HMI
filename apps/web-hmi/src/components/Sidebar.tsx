import React, { useState } from 'react';
import {
  Factory,
  Cpu,
  LineChart,
  Table2,
  Bell,
  FileCode2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Wind,
  Layers,
  Scissors,
  Gauge,
  Sliders,
  FileText,
  Users,
  FlaskConical,
  Server,
  Zap,
  ClipboardCheck
} from 'lucide-react';
import type { ScadaTab } from './Header';
import type { PlcStatus } from '../types/hmi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../types/auth';

interface SidebarProps {
  activeTab: ScadaTab;
  setActiveTab: (tab: ScadaTab) => void;
  activeAlarmCount: number;
  plcStatus: PlcStatus | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeAlarmCount,
  plcStatus,
  isCollapsed,
  onToggleCollapse
}) => {
  const isConnected = plcStatus?.isConnected ?? false;
  const { t, language, setLanguage, currentOption, availableLanguages } = useLanguage();
  const { currentUser, setIsLoginModalOpen } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const currentUserRole = USER_ROLES[currentUser.role];

  const techScreens: { id: ScadaTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: t('overview'), icon: <Factory className="w-4 h-4" /> },
    { id: 'spinner', label: t('spinners'), icon: <Wind className="w-4 h-4" /> },
    { id: 'kvo', label: t('kvo'), icon: <Layers className="w-4 h-4" /> },
    { id: 'crimper', label: t('crimper'), icon: <Sliders className="w-4 h-4" /> },
    { id: 'oven', label: t('curingOven'), icon: <Flame className="w-4 h-4 text-amber-400" /> },
    { id: 'cutting', label: t('cutting'), icon: <Scissors className="w-4 h-4" /> },
    { id: 'density', label: t('density'), icon: <Gauge className="w-4 h-4" /> }
  ];

  const systemScreens: { id: ScadaTab; label: string; icon: React.ReactNode; isAccent?: boolean; badge?: number }[] = [
    {
      id: 'recipes',
      label: t('recipes'),
      icon: <FileText className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'shiftReport',
      label: t('shiftReport'),
      icon: <ClipboardCheck className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'qc',
      label: t('qc'),
      icon: <FlaskConical className="w-4 h-4 text-teal-400" />
    },
    {
      id: 'equipment',
      label: t('equipment'),
      icon: <Server className="w-4 h-4 text-blue-400" />
    },
    {
      id: 'energy',
      label: t('energy'),
      icon: <Zap className="w-4 h-4 text-amber-400" />
    },
    {
      id: 'trends',
      label: t('trends'),
      icon: <LineChart className="w-4 h-4" />,
      isAccent: true
    },
    {
      id: 'tags',
      label: t('tags'),
      icon: <Table2 className="w-4 h-4" />
    },
    {
      id: 'users',
      label: t('users'),
      icon: <Users className="w-4 h-4 text-purple-400" />
    },
    {
      id: 'alarms',
      label: t('alarms'),
      icon: <Bell className="w-4 h-4" />,
      badge: activeAlarmCount
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: <Sliders className="w-4 h-4 text-indigo-400" />
    },
    {
      id: 'openness',
      label: t('openness'),
      icon: <FileCode2 className="w-4 h-4" />
    }
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-40 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Верхняя часть: Логотип и переключатель сворачивания */}
      <div>
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-3">
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5 overflow-hidden cursor-pointer" onClick={() => setActiveTab('overview')}>
              <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-500/20 flex-shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-xs font-black text-white tracking-wider flex items-center gap-1.5">
                  <span>MINERAL WOOL</span>
                  <span className="px-1 py-0.2 text-[8px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                    ISA-101
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">Siemens S7-1500 HMI</div>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto p-1.5 bg-blue-600 rounded-lg text-white shadow-md cursor-pointer" onClick={() => setActiveTab('overview')}>
              <Cpu className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-auto"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Навигация: Технологические экраны */}
        <div className="p-2 space-y-4">
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                {t('productionLine')}
              </div>
            )}
            <div className="space-y-0.5">
              {techScreens.map((screen) => {
                const isActive = activeTab === screen.id;
                return (
                  <button
                    key={screen.id}
                    onClick={() => setActiveTab(screen.id)}
                    title={isCollapsed ? screen.label : undefined}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <span className="flex-shrink-0">{screen.icon}</span>
                    {!isCollapsed && <span className="truncate">{screen.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Навигация: Системные модули (Тренды, Теги, Аварии, TIA) */}
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                {t('analytics')}
              </div>
            )}
            <div className="space-y-0.5">
              {systemScreens.map((screen) => {
                const isActive = activeTab === screen.id;
                return (
                  <button
                    key={screen.id}
                    onClick={() => setActiveTab(screen.id)}
                    title={isCollapsed ? screen.label : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      screen.isAccent
                        ? isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                          : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40'
                        : isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="flex-shrink-0">{screen.icon}</span>
                      {!isCollapsed && <span className="truncate">{screen.label}</span>}
                    </div>

                    {!isCollapsed && screen.badge !== undefined && screen.badge > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                        {screen.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* НИЖНЯЯ ПАНЕЛЬ СЛЕВА: ПРОФИЛЬ + ВЫБОР ЯЗЫКА + СТАТУС ПЛК  */}
      {/* ======================================================== */}
      <div className="border-t border-slate-800 bg-slate-950/80 divide-y divide-slate-800/60">
        {/* 1. Плашка активного пользователя */}
        <div
          onClick={() => setIsLoginModalOpen(true)}
          title={`Текущий пользователь: ${currentUser.fullName} (${currentUserRole.labelRu}). Нажмите для смены пользователя`}
          className={`p-2.5 flex items-center cursor-pointer hover:bg-slate-800/60 transition-colors ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                currentUser.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : currentUser.role === 'engineer'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : currentUser.role === 'technologist'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {currentUser.role === 'admin' ? '👑' : currentUser.fullName.slice(0, 2)}
            </div>

            {!isCollapsed && (
              <div className="truncate text-left">
                <div className="text-xs font-bold text-white truncate font-sans">
                  {currentUser.fullName}
                </div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold border font-mono ${currentUserRole.badgeClass}`}
                  >
                    {currentUserRole.labelRu}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    @{currentUser.username}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Выбор языка (Влево вниз: RU, EN, ZH, IT) */}
        <div className="p-2 bg-slate-950/60">
          {!isCollapsed ? (
            <div className="flex items-center justify-between bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
              {availableLanguages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  title={`${l.nativeLabel} (${l.label})`}
                  className={`flex-1 py-1 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                    language === l.code
                      ? 'bg-blue-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-xs leading-none">{l.flag}</span>
                  <span className="font-mono text-[10px] uppercase">{l.code}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="relative flex justify-center">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                title={`Язык: ${currentOption.nativeLabel}. Нажмите для смены`}
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-sm shadow transition-all"
              >
                {currentOption.flag}
              </button>

              {showLangMenu && (
                <div className="absolute left-14 bottom-0 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs font-medium space-y-1">
                  {availableLanguages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                        language === l.code
                          ? 'bg-blue-600/20 text-blue-400 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{l.flag}</span>
                        <span>{l.nativeLabel}</span>
                      </div>
                      {language === l.code && <span className="text-blue-400 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Статус связи с ПЛК */}
        <div className="p-2.5">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="truncate">
                <div className="text-white font-bold text-[11px] truncate">
                  {plcStatus?.name || 'Siemens S7-1500 Main'}
                </div>
                <div className="text-slate-400 text-[10px]">
                  {plcStatus?.ipAddress || '192.168.0.1'}:{plcStatus?.port || 102}
                </div>
              </div>
              <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[11px] font-bold text-slate-300">
                  {(plcStatus?.lastRoundTripTimeMs ?? 1.5).toFixed(1)}ms
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span
                title={`ПЛК: ${isConnected ? t('online') : t('offline')} (${(plcStatus?.lastRoundTripTimeMs ?? 1.5).toFixed(1)}ms)`}
                className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
