import React from 'react';
import { Flame, Gauge, Power, RotateCw, Thermometer } from 'lucide-react';
import type { TagValue } from '../types/hmi';

interface ProcessSchemaProps {
  tagValues: Record<string, TagValue>;
  onWriteTag: (tagId: string, value: any) => Promise<boolean>;
}

export const ProcessSchema: React.FC<ProcessSchemaProps> = ({ tagValues, onWriteTag }) => {
  const temp = (tagValues['furnace.zone1.temperature']?.value as number) ?? 642.5;
  const pressure = (tagValues['furnace.zone1.pressure']?.value as number) ?? 3.4;
  const pumpRunning = Boolean(tagValues['furnace.pump.running']?.value ?? true);
  const valveOpen = Boolean(tagValues['furnace.valve.open']?.value ?? true);

  const togglePump = async () => {
    await onWriteTag('furnace.pump.running', !pumpRunning);
  };

  const toggleValve = async () => {
    await onWriteTag('furnace.valve.open', !valveOpen);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Главная мнемосхема процесса */}
      <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              Технологическая мнемосхема: Термопечь №1
            </h2>
            <p className="text-xs text-slate-400">ПЛК S7-1500 (DB1: Non-Optimized S7comm)</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              Цикл опроса: <strong className="text-emerald-400">200 мс</strong>
            </span>
          </div>
        </div>

        {/* SVG Мнемосхема */}
        <div className="relative w-full h-96 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-center p-4">
          <svg className="w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Трубопровод подачи */}
            <path d="M 50 150 L 250 150 L 250 200" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
            <path
              d="M 50 150 L 250 150 L 250 200"
              stroke={valveOpen ? "#38bdf8" : "#475569"}
              strokeWidth="6"
              strokeDasharray={valveOpen ? "8 6" : "none"}
              className={valveOpen ? "animate-[dash_1s_linear_infinite]" : ""}
            />

            {/* Клапан подачи */}
            <g transform="translate(130, 130)" className="cursor-pointer" onClick={toggleValve}>
              <polygon points="0,0 20,20 0,40" fill={valveOpen ? "#10b981" : "#ef4444"} />
              <polygon points="40,0 20,20 40,40" fill={valveOpen ? "#10b981" : "#ef4444"} />
              <circle cx="20" cy="20" r="4" fill="#ffffff" />
              <text x="-15" y="-8" fill="#94a3b8" fontSize="11" fontWeight="bold">Впускной клапан (DB1.DBX8.1)</text>
              <text x="5" y="55" fill={valveOpen ? "#34d399" : "#f87171"} fontSize="11" fontWeight="bold">
                {valveOpen ? "ОТКРЫТ" : "ЗАКРЫТ"}
              </text>
            </g>

            {/* Корпус реактора / печи */}
            <rect x="250" y="80" width="300" height="240" rx="24" fill="#1e293b" stroke="#475569" strokeWidth="4" />
            
            {/* Нагревательная зона внутри */}
            <rect x="270" y="140" width="260" height="160" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            
            {/* Огонь / Индикация нагрева */}
            <g transform="translate(360, 210)">
              <Flame className={`w-20 h-20 ${temp > 500 ? 'text-amber-500 animate-pulse' : 'text-slate-600'}`} />
            </g>

            {/* Датчик температуры (выноска) */}
            <g transform="translate(280, 100)">
              <rect width="130" height="34" rx="6" fill="#0284c7" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1.5" />
              <text x="10" y="16" fill="#93c5fd" fontSize="10" fontWeight="bold">T зоны 1 (DB1.DBD0)</text>
              <text x="10" y="28" fill="#ffffff" fontSize="14" fontWeight="bold">{temp.toFixed(1)} °C</text>
            </g>

            {/* Датчик давления (выноска) */}
            <g transform="translate(420, 100)">
              <rect width="120" height="34" rx="6" fill="#8b5cf6" fillOpacity="0.2" stroke="#8b5cf6" strokeWidth="1.5" />
              <text x="10" y="16" fill="#c4b5fd" fontSize="10" fontWeight="bold">Давление (DB1.DBD4)</text>
              <text x="10" y="28" fill="#ffffff" fontSize="14" fontWeight="bold">{pressure.toFixed(2)} bar</text>
            </g>

            {/* Трубопровод охлаждения на выходе */}
            <path d="M 550 250 L 680 250 L 680 320" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
            <path
              d="M 550 250 L 680 250 L 680 320"
              stroke={pumpRunning ? "#10b981" : "#475569"}
              strokeWidth="6"
              strokeDasharray={pumpRunning ? "8 6" : "none"}
            />

            {/* Насос охлаждения */}
            <g transform="translate(640, 210)" className="cursor-pointer" onClick={togglePump}>
              <circle cx="40" cy="40" r="28" fill="#1e293b" stroke={pumpRunning ? "#10b981" : "#ef4444"} strokeWidth="3" />
              <g className={pumpRunning ? "animate-spin origin-[680px_250px]" : ""}>
                <line x1="40" y1="20" x2="40" y2="60" stroke="#94a3b8" strokeWidth="4" />
                <line x1="20" y1="40" x2="60" y2="40" stroke="#94a3b8" strokeWidth="4" />
              </g>
              <text x="-10" y="-10" fill="#94a3b8" fontSize="11" fontWeight="bold">Насос (DB1.DBX8.0)</text>
              <text x="15" y="85" fill={pumpRunning ? "#34d399" : "#f87171"} fontSize="11" fontWeight="bold">
                {pumpRunning ? "РАБОТА" : "СТОП"}
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Панель оперативного управления и параметров */}
      <div className="space-y-6">
        {/* Карточка температуры */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Температура печи</h3>
                <p className="text-xs text-slate-400">Тег: furnace.zone1.temperature</p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Good
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {temp.toFixed(1)}
            </span>
            <span className="text-base font-semibold text-slate-400">°C</span>
          </div>

          {/* Прогресс-бар шкалы */}
          <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-amber-500 to-rose-500 h-2 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, (temp / 1200) * 100))}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0 °C</span>
            <span>Уставка: 650 °C</span>
            <span>1200 °C</span>
          </div>
        </div>

        {/* Карточка давления */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Давление в камере</h3>
                <p className="text-xs text-slate-400">Тег: furnace.zone1.pressure</p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Good
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {pressure.toFixed(2)}
            </span>
            <span className="text-base font-semibold text-slate-400">bar</span>
          </div>

          <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-500 h-2 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, (pressure / 10) * 100))}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0.0 bar</span>
            <span>Макс: 6.0 bar</span>
            <span>10.0 bar</span>
          </div>
        </div>

        {/* Быстрое управление агрегатами */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Оперативное управление (Запись в ПЛК)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={togglePump}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center space-y-2 transition-all ${
                pumpRunning
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <RotateCw className={`w-5 h-5 ${pumpRunning ? 'animate-spin' : ''}`} />
              <span className="text-xs font-semibold">Насос: {pumpRunning ? 'ВКЛ' : 'ВЫКЛ'}</span>
            </button>

            <button
              onClick={toggleValve}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center space-y-2 transition-all ${
                valveOpen
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Power className="w-5 h-5" />
              <span className="text-xs font-semibold">Клапан: {valveOpen ? 'ОТКР' : 'ЗАКР'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
