import React from 'react';
import type { MechanismTelemetry } from '../../types/scada';

interface OverviewScreenProps {
  mechanisms: Record<string, MechanismTelemetry>;
  onSelectSection: (section: string) => void;
  onSelectMechanism?: (m: MechanismTelemetry) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({ mechanisms: _mechanisms, onSelectSection }) => {
  const sections = [
    { id: 'spinner', title: '1. Прядение (Центрифуги)', icon: '🌪️', status: 'В РАБОТЕ', power: '185 кВт', alarms: 0 },
    { id: 'kvo', title: '2. КВО и Маятник', icon: '📦', status: 'В РАБОТЕ', power: '340 кВт', alarms: 0 },
    { id: 'crimper', title: '3. Гофрировщик и Лифт', icon: '📐', status: 'В РАБОТЕ', power: '95 кВт', alarms: 0 },
    { id: 'oven', title: '4. Печь полимеризации (КП)', icon: '🔥', status: 'В РАБОТЕ', power: '520 кВт', alarms: 0 },
    { id: 'cutting', title: '5. Резка и Упаковка', icon: '✂️', status: 'В РАБОТЕ', power: '110 кВт', alarms: 0 },
    { id: 'density', title: '6. Контроль плотности и ZC', icon: '⚙️', status: 'НОРМА', power: '---', alarms: 0 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Главный панорамный баннер всей линии */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-lg">🏭</span>
              <div>
                <h1 className="text-lg font-black text-white tracking-wide">Главный обзор линии минеральной ваты (Overview)</h1>
                <p className="text-xs text-slate-400">Производительность: 3 500 кг/ч &bull; Скорость линии: 1.43 м/мин &bull; Плотность: 96 кг/м³</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ЛИНИЯ В РАБОТЕ
            </span>
          </div>
        </div>
      </div>

      {/* Интерактивная векторная технологическая схема всей линии */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-hidden shadow-xl space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400">
          <span>Сводная технологическая схема переделов (нажмите на участок для перехода)</span>
          <span className="text-blue-400 font-mono text-[11px]">Стандарт ISA-101 &bull; 60 FPS Canvas</span>
        </div>

        <div className="overflow-x-auto">
          <svg className="w-full min-w-[760px] h-48" viewBox="0 0 800 180">
            {/* 1. Центрифуги */}
            <g className="cursor-pointer" onClick={() => onSelectSection('spinner')}>
              <rect x="10" y="30" width="110" height="120" rx="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="65" y="55" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">ЦЕНТРИФУГИ</text>
              <circle cx="65" cy="95" r="24" fill="#0f172a" stroke="#10b981" strokeWidth="3" />
              <text x="65" y="99" textAnchor="middle" fill="#fff" fontSize="10">42 Hz</text>
            </g>

            <path d="M 120 90 L 150 90" stroke="#475569" strokeWidth="6" strokeDasharray="4 2" />

            {/* 2. КВО */}
            <g className="cursor-pointer" onClick={() => onSelectSection('kvo')}>
              <rect x="150" y="30" width="110" height="120" rx="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="205" y="55" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">БАРАБАН КВО</text>
              <circle cx="205" cy="95" r="26" fill="#0f172a" stroke="#10b981" strokeWidth="3" />
              <text x="205" y="99" textAnchor="middle" fill="#fff" fontSize="10">-2.6 kPa</text>
            </g>

            <path d="M 260 90 L 290 90" stroke="#475569" strokeWidth="6" strokeDasharray="4 2" />

            {/* 3. Гофрировщик */}
            <g className="cursor-pointer" onClick={() => onSelectSection('crimper')}>
              <rect x="290" y="30" width="110" height="120" rx="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="345" y="55" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">ГОФРИРОВЩИК</text>
              <rect x="310" y="75" width="70" height="40" rx="6" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
              <text x="345" y="99" textAnchor="middle" fill="#fff" fontSize="10">1.43 m/min</text>
            </g>

            <path d="M 400 90 L 430 90" stroke="#475569" strokeWidth="6" strokeDasharray="4 2" />

            {/* 4. Печь КП */}
            <g className="cursor-pointer" onClick={() => onSelectSection('oven')}>
              <rect x="430" y="30" width="130" height="120" rx="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
              <text x="495" y="55" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold">ПЕЧЬ КП (4 ЗОНЫ)</text>
              <rect x="445" y="75" width="100" height="40" rx="6" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
              <text x="495" y="99" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold">🔥 245 °C</text>
            </g>

            <path d="M 560 90 L 590 90" stroke="#475569" strokeWidth="6" strokeDasharray="4 2" />

            {/* 5. Резка и упаковка */}
            <g className="cursor-pointer" onClick={() => onSelectSection('cutting')}>
              <rect x="590" y="30" width="190" height="120" rx="10" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
              <text x="685" y="55" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="bold">ПИЛЫ И УПАКОВКА</text>
              <circle cx="640" cy="95" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <text x="640" y="99" textAnchor="middle" fill="#38bdf8" fontSize="9">ПРОД.</text>
              <circle cx="730" cy="95" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <text x="730" y="99" textAnchor="middle" fill="#38bdf8" fontSize="9">ЛЕТУЧ.</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Карточки технологических переделов */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectSection(s.id)}
            className="bg-slate-900 hover:border-blue-500 border border-slate-800 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{s.icon}</span>
                <h3 className="font-bold text-sm text-white">{s.title}</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {s.status}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Мощность секции:</span>
              <span className="text-blue-400 font-bold">{s.power}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
