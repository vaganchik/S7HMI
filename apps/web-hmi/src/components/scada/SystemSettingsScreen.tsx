import React, { useState } from 'react';
import {
  Sliders,
  Cpu,
  Zap,
  Shield,
  Save,
  RotateCcw,
  Download,
  Upload,
  Clock,
  Sun,
  Moon,
  CloudSun,
  Volume2,
  VolumeX,
  CheckCircle2
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import type { ScadaSystemSettings } from '../../types/settings';

export const SystemSettingsScreen: React.FC = () => {
  const { settings, updateSettings, resetToDefaults, exportSettingsJson, importSettingsJson } = useSettings();
  const { setLanguage } = useLanguage();

  const [activeTab, setActiveTab] = useState<'tech' | 'plc' | 'tariffs' | 'system'>('tech');
  const [formData, setFormData] = useState<ScadaSystemSettings>(settings);
  const [isSavedToast, setIsSavedToast] = useState(false);

  const handleInputChange = <K extends keyof ScadaSystemSettings>(key: K, value: ScadaSystemSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    if (formData.defaultLanguage) {
      setLanguage(formData.defaultLanguage);
    }
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Сбросить все параметры SCADA к заводским настройкам по умолчанию?')) {
      resetToDefaults();
      setFormData(settings);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importSettingsJson(content);
        if (ok) {
          alert('Параметры успешно импортированы!');
        } else {
          alert('Ошибка формата файла конфигурации.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Главный заголовок экрана */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-wide">
                ПАРАМЕТРЫ И НАСТРОЙКИ СИСТЕМЫ SCADA
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ (CONFIG)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Централизованное управление параметрами линии (12ч смены), связью с ПЛК Siemens, тарифами и допусками
            </p>
          </div>
        </div>

        {/* Действия с конфигурацией */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Импорт JSON</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={exportSettingsJson}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Экспорт JSON</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Сброс по умолч.</span>
          </button>
        </div>
      </div>

      {/* Форма параметров с вкладками */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Вкладки разделов параметров */}
        <div className="flex border-b border-slate-800 bg-slate-900 rounded-2xl p-1.5 gap-2 overflow-x-auto">
          {[
            { id: 'tech', label: '1. Технологический процесс и график смен', icon: <Clock className="w-4 h-4 text-cyan-400" /> },
            { id: 'plc', label: '2. Связь с ПЛК Siemens & Архивация', icon: <Cpu className="w-4 h-4 text-purple-400" /> },
            { id: 'tariffs', label: '3. Тарифы на электроэнергию', icon: <Zap className="w-4 h-4 text-amber-400" /> },
            { id: 'system', label: '4. Безопасность и интерфейс', icon: <Shield className="w-4 h-4 text-emerald-400" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 1. Технологический процесс и график смен */}
        {activeTab === 'tech' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Регламент рабочих смен завода</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Базовая продолжительность смены используется во всех расчетах производительности, энергоучета и протоколах ОТК
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Длительность рабочей смены (часов):
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  required
                  value={formData.shiftDurationHours}
                  onChange={(e) => handleInputChange('shiftDurationHours', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">По регламенту завода: 12 часов</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Начало дневной смены (время):
                </label>
                <input
                  type="time"
                  required
                  value={formData.shiftStartTimeDay}
                  onChange={(e) => handleInputChange('shiftStartTimeDay', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Начало ночной смены (время):
                </label>
                <input
                  type="time"
                  required
                  value={formData.shiftStartTimeNight}
                  onChange={(e) => handleInputChange('shiftStartTimeNight', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border-b border-slate-800 pb-3 pt-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Технологические допуски и геометрия ковра</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ширина линии ковра (мм):
                </label>
                <input
                  type="number"
                  required
                  value={formData.nominalLineWidthMm}
                  onChange={(e) => handleInputChange('nominalLineWidthMm', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Допуск по плотности (&plusmn; %):
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.densityTolerancePercent}
                  onChange={(e) => handleInputChange('densityTolerancePercent', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Допуск по толщине (&plusmn; мм):
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.thicknessToleranceMm}
                  onChange={(e) => handleInputChange('thicknessToleranceMm', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Норматив расхода э/э (кВт&middot;ч/т):
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={formData.targetSecKWhPerTon}
                  onChange={(e) => handleInputChange('targetSecKWhPerTon', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Связь с ПЛК Siemens & Архивация */}
        {activeTab === 'plc' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Сетевой интерфейс ПЛК Siemens S7-1500 (ISO-on-TCP)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  IP-адрес контроллера:
                </label>
                <input
                  type="text"
                  required
                  value={formData.plcIpAddress}
                  onChange={(e) => handleInputChange('plcIpAddress', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  TCP-порт:
                </label>
                <input
                  type="number"
                  required
                  value={formData.plcPort}
                  onChange={(e) => handleInputChange('plcPort', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rack (Стойка):
                </label>
                <input
                  type="number"
                  required
                  value={formData.plcRack}
                  onChange={(e) => handleInputChange('plcRack', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Slot (Слот CPU):
                </label>
                <input
                  type="number"
                  required
                  value={formData.plcSlot}
                  onChange={(e) => handleInputChange('plcSlot', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="border-b border-slate-800 pb-3 pt-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Тайминги опроса и архивации данных (SQLite)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Базовый период опроса (мс):
                </label>
                <input
                  type="number"
                  step="50"
                  min="50"
                  required
                  value={formData.pollingIntervalMs}
                  onChange={(e) => handleInputChange('pollingIntervalMs', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Период архивации в БД (мс):
                </label>
                <input
                  type="number"
                  step="50"
                  min="50"
                  required
                  value={formData.archiveIntervalMs}
                  onChange={(e) => handleInputChange('archiveIntervalMs', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Зона нечувствительности (Deadband):
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={formData.deadbandDefault}
                  onChange={(e) => handleInputChange('deadbandDefault', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Тарифы на электроэнергию */}
        {activeTab === 'tariffs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Энергетические тарифы и дифференциация</span>
              </h3>
            </div>

            <div className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="isMultiTariff"
                checked={formData.isMultiTariff}
                onChange={(e) => handleInputChange('isMultiTariff', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
              />
              <label htmlFor="isMultiTariff" className="text-slate-200 font-bold cursor-pointer text-xs">
                Использовать трехставочный тариф по зонам суток (Т1 Пик / Т2 Полупик / Т3 Ночь)
              </label>
            </div>

            {formData.isMultiTariff ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                    <Sun className="w-4 h-4" />
                    <span>Т1 Пик (07:00-10:00, 17:00-21:00)</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.tariffT1PeakRub}
                    onChange={(e) => handleInputChange('tariffT1PeakRub', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-base focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[11px] text-slate-500">Руб / кВт&middot;ч</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <CloudSun className="w-4 h-4" />
                    <span>Т2 Полупик (10:00-17:00, 21:00-23:00)</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.tariffT2HalfOffRub}
                    onChange={(e) => handleInputChange('tariffT2HalfOffRub', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-base focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-500">Руб / кВт&middot;ч</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                    <Moon className="w-4 h-4" />
                    <span>Т3 Ночь (23:00-07:00)</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.tariffT3NightRub}
                    onChange={(e) => handleInputChange('tariffT3NightRub', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-base focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-500">Руб / кВт&middot;ч (Льготный)</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Единая ставка тарифа (Руб / кВт&middot;ч):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.singleTariffRub}
                  onChange={(e) => handleInputChange('singleTariffRub', Number(e.target.value))}
                  className="w-full max-w-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>
        )}

        {/* 4. Безопасность и интерфейс */}
        {activeTab === 'system' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Параметры безопасности и пользовательского интерфейса</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Таймаут автоблокировки сессии (минут):
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  required
                  value={formData.sessionTimeoutMinutes}
                  onChange={(e) => handleInputChange('sessionTimeoutMinutes', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Язык интерфейса по умолчанию:
                </label>
                <select
                  value={formData.defaultLanguage}
                  onChange={(e) => handleInputChange('defaultLanguage', e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="ru">Русский (RU)</option>
                  <option value="en">English (EN)</option>
                  <option value="zh">中文 (ZH)</option>
                  <option value="it">Italiano (IT)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="soundAlarms"
                  checked={formData.soundAlarmsEnabled}
                  onChange={(e) => handleInputChange('soundAlarmsEnabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                />
                <label htmlFor="soundAlarms" className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-1.5">
                  {formData.soundAlarmsEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  <span>Звуковая сигнализация при авариях</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Кнопка сохранения параметров */}
        <div className="flex items-center justify-between pt-2">
          {isSavedToast ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Параметры успешно сохранены и применены!</span>
            </span>
          ) : <div />}

          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить параметры SCADA</span>
          </button>
        </div>
      </form>
    </div>
  );
};
