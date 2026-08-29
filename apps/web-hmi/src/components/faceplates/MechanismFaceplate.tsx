import React, { useState } from 'react';
import { ShieldCheck, Cpu, Server } from 'lucide-react';
import type { MechanismTelemetry } from '../../types/scada';

interface MechanismFaceplateProps {
  mechanism: MechanismTelemetry | null;
  onClose: () => void;
  onCommand?: (id: string, command: string, payload?: any) => Promise<boolean> | void;
}

export const MechanismFaceplate: React.FC<MechanismFaceplateProps> = ({ mechanism, onClose, onCommand }) => {
  const [activeTab, setActiveTab] = useState<'control' | 'params' | 'interlocks' | 'siemens'>('control');
  const [setpoint, setSetpoint] = useState<number>(mechanism?.frequencySetpointHz ?? 50.0);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  if (!mechanism) return null;

  const isRunning = mechanism.state === 'running';
  const isFault = mechanism.state === 'fault';
  const isManual = mechanism.mode === 'manual';

  const handleAction = (cmd: string) => {
    if (onCommand) {
      onCommand(mechanism.id, cmd, { setpoint });
    }
    setConfirmAction(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Заголовок фейсплейта */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl text-white ${isFault ? 'bg-rose-600 animate-pulse' : isRunning ? 'bg-emerald-600' : 'bg-slate-700'}`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-wide">{mechanism.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{mechanism.id}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                {mechanism.cabinet && (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Server className="w-3 h-3" /> Шкаф {mechanism.cabinet}
                  </span>
                )}
                {mechanism.schemeName && (
                  <span className="text-cyan-400 font-bold">
                    Схема: {mechanism.schemeName}
                  </span>
                )}
                <span>&bull; {mechanism.section}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Статусная полоса */}
        <div className="px-5 py-2.5 bg-slate-950 flex items-center justify-between text-xs border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Состояние:</span>
            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
              isFault ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              isRunning ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {isFault ? 'АВАРИЯ' : isRunning ? 'В РАБОТЕ' : 'ОСТАНОВЛЕН'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Режим:</span>
            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${isManual ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
              {mechanism.mode.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex border-b border-slate-800 px-5 pt-2 bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('control')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'control' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            Ручное управление
          </button>
          <button
            onClick={() => setActiveTab('params')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'params' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            Телеметрия
          </button>
          <button
            onClick={() => setActiveTab('interlocks')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'interlocks' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            Межблокировки
          </button>
          <button
            onClick={() => setActiveTab('siemens')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'siemens' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            Siemens S7 (STW/ZSW)
          </button>
        </div>

        {/* Контент активной вкладки */}
        <div className="p-5 space-y-4">
          {activeTab === 'control' && (
            <div className="space-y-4">
              {/* Переключение режима */}
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300 font-semibold">Режим работы механизма</span>
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button
                    onClick={() => onCommand && onCommand(mechanism.id, 'set_mode', 'auto')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isManual ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                    АВТО
                  </button>
                  <button
                    onClick={() => onCommand && onCommand(mechanism.id, 'set_mode', 'manual')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isManual ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                    РУЧНОЙ
                  </button>
                </div>
              </div>

              {/* Уставка частоты / скорости */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Задание частоты (Гц):</span>
                  <span className="font-mono font-bold text-blue-400">{setpoint.toFixed(1)} Гц</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="0.5"
                    value={setpoint}
                    disabled={!isManual}
                    onChange={(e) => setSetpoint(parseFloat(e.target.value))}
                    className="flex-1 accent-blue-500 disabled:opacity-50"
                  />
                  <input
                    type="number"
                    value={setpoint}
                    disabled={!isManual}
                    onChange={(e) => setSetpoint(parseFloat(e.target.value))}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-xs text-white"
                  />
                </div>
              </div>

              {/* Кнопки команд */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <button
                  disabled={!isManual || isRunning}
                  onClick={() => setConfirmAction('start')}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black rounded-xl shadow-lg transition-all">
                  ▶ ПУСК
                </button>
                <button
                  disabled={!isManual || !isRunning}
                  onClick={() => setConfirmAction('stop')}
                  className="py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-black rounded-xl shadow-lg transition-all">
                  ⏹ СТОП
                </button>
                <button
                  disabled={!isManual}
                  onClick={() => onCommand && onCommand(mechanism.id, 'reset_fault')}
                  className="py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-400 text-xs font-black rounded-xl border border-slate-700 transition-all">
                  СБРОС АВАРИИ
                </button>
              </div>

              {/* Диалог подтверждения действия */}
              {confirmAction && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 animate-fade-in">
                  <p className="text-xs text-amber-300 font-bold">Подтвердите выполнение команды: {confirmAction.toUpperCase()}</p>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setConfirmAction(null)} className="px-3 py-1 bg-slate-800 text-xs rounded-lg text-slate-300">Отмена</button>
                    <button onClick={() => handleAction(confirmAction)} className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg shadow">Подтвердить</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'params' && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Фактическая частота</span>
                <span className="font-mono font-bold text-lg text-white">{mechanism.frequencyActualHz?.toFixed(1) ?? '48.5'} Гц</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Ток двигателя</span>
                <span className="font-mono font-bold text-lg text-amber-400">{mechanism.currentAmps?.toFixed(2) ?? (mechanism.nominalCurrentA ?? 12.4).toFixed(2)} А</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Скорость линии</span>
                <span className="font-mono font-bold text-lg text-blue-400">{mechanism.speedMPerMin?.toFixed(2) ?? '12.50'} м/мин</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Мощность агрегата</span>
                <span className="font-mono font-bold text-lg text-purple-400">{mechanism.powerKw ? `${mechanism.powerKw} кВт` : '5.5 кВт'}</span>
              </div>
            </div>
          )}

          {activeTab === 'interlocks' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Аварийный останов (E-Stop) цепи безопасности
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mechanism.eStopTripped ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {mechanism.eStopTripped ? 'НАЖАТ' : 'НОРМА'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Тепловое реле / Терморезистор обмотки (PTC)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  НОРМА (OK)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Разрешение от смежного узла (Permissive)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  ГОТОВ (READY)
                </span>
              </div>
            </div>
          )}

          {activeTab === 'siemens' && (
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold">Телеграмма Siemens Profinet (PZD1/2):</div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Слово управления STW1:</span>
                    <div className="text-cyan-400 font-bold text-sm">0x047E (RUN_EN)</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Слово состояния ZSW1:</span>
                    <div className="text-emerald-400 font-bold text-sm">0x0237 (READY_ON)</div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>&bull; Драйвер обмена: <span className="text-white font-mono">FC_G120_Exchange.scl</span></div>
                <div>&bull; Блок данных экземпляра: <span className="text-amber-400 font-mono">DB_{mechanism.cabinet || 'LINE'}_IO</span></div>
                <div>&bull; Циклический опрос: <span className="text-emerald-400 font-mono">OB1 (Main Cycle 1000ms)</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
