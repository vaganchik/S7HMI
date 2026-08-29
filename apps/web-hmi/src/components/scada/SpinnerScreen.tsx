import React from 'react';
import type { MechanismTelemetry } from '../../types/scada';

interface SpinnerScreenProps {
  mechanisms: Record<string, MechanismTelemetry>;
  onSelectMechanism: (m: MechanismTelemetry) => void;
}

export const SpinnerScreen: React.FC<SpinnerScreenProps> = ({ mechanisms, onSelectMechanism }) => {
  const spinners = ['spinner.1', 'spinner.2', 'spinner.3', 'spinner.4'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Верхний статус-бар секции */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🌪️ Центрифуги и прядильная машина (Spinner Section)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">4 ВАЛА В СИНХРОНЕ</span>
          </h2>
          <p className="text-xs text-slate-400">Формирование базальтового микроволокна из расплава 1450°C</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all">
            Смазка открытого коллектора
          </button>
          <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all">
            Сброс отказов приводов
          </button>
        </div>
      </div>

      {/* Основная зона: Мнемосхема центрифуг и карточки валов */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Карточки 4 валов центрифуги */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Приводы валов (ЧРП)</h3>
          {spinners.map((id, index) => {
            const m = mechanisms[id] || {
              id,
              name: `Центрифуга вал #${index + 1}`,
              section: 'Центрифуги',
              type: 'motor',
              state: 'running',
              mode: 'auto',
              frequencyActualHz: 41.5 + index * 1.2,
              frequencySetpointHz: 42.0 + index,
              currentAmps: 14.2 + index * 0.8
            };

            const isFault = m.state === 'fault';
            const isRun = m.state === 'running';

            return (
              <div
                key={id}
                onClick={() => onSelectMechanism(m)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                  isFault ? 'bg-rose-950/40 border-rose-600 shadow-lg shadow-rose-900/30' :
                  isRun ? 'bg-slate-900 border-slate-700 hover:border-blue-500' :
                  'bg-slate-950 border-slate-800 opacity-70'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isFault ? 'bg-rose-500 animate-ping' : isRun ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                    <span className="font-bold text-sm text-white">{m.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">{m.id}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Уставка</span>
                    <span className="text-blue-400 font-bold">{m.frequencySetpointHz?.toFixed(1)} Hz</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Факт</span>
                    <span className="text-emerald-400 font-bold">{m.frequencyActualHz?.toFixed(1)} Hz</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Ток</span>
                    <span className="text-amber-400 font-bold">{m.currentAmps?.toFixed(1)} A</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Интерактивная векторная SVG схема 4 валов центрифуги */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs font-bold text-slate-400 absolute top-4 left-4">Мнемосхема прядильной головки</span>
          <svg className="w-full max-w-sm h-72" viewBox="0 0 320 280">
            {/* Станина и корпус */}
            <circle cx="160" cy="140" r="120" fill="#0f172a" stroke="#334155" strokeWidth="4" />
            <circle cx="160" cy="140" r="110" fill="#1e293b" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />

            {/* Вал 1 */}
            <g transform="translate(110, 85)" className="cursor-pointer">
              <circle cx="25" cy="25" r="28" fill="#334155" stroke="#10b981" strokeWidth="3" />
              <line x1="25" y1="0" x2="25" y2="50" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="0" y1="25" x2="50" y2="25" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />
              <text x="25" y="29" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">В1</text>
            </g>

            {/* Вал 2 */}
            <g transform="translate(170, 75)" className="cursor-pointer">
              <circle cx="32" cy="32" r="34" fill="#334155" stroke="#10b981" strokeWidth="3" />
              <text x="32" y="36" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">В2</text>
            </g>

            {/* Вал 3 */}
            <g transform="translate(90, 145)" className="cursor-pointer">
              <circle cx="36" cy="36" r="38" fill="#334155" stroke="#10b981" strokeWidth="3" />
              <text x="36" y="40" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">В3</text>
            </g>

            {/* Вал 4 */}
            <g transform="translate(165, 140)" className="cursor-pointer">
              <circle cx="40" cy="40" r="42" fill="#334155" stroke="#10b981" strokeWidth="3" />
              <text x="40" y="45" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">В4</text>
            </g>

            {/* Поток расплава */}
            <path d="M 160 10 L 160 65 L 140 85" stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 3" />
          </svg>
          <div className="text-[11px] text-slate-400 mt-2">Кликните по любому валу для ручного управления</div>
        </div>

        {/* Координаты желоба и позиционирование осей X/Y */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Позиционирование желоба расплава</h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Положение Оси X</span>
                <span className="font-mono font-bold text-blue-400">133.6 мм</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Положение Оси Y</span>
                <span className="font-mono font-bold text-purple-400">228.2 мм</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button className="py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
              В РАБОЧУЮ ТОЧКУ
            </button>
            <button className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold">
              В НЕРАБОЧУЮ ТОЧКУ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
