import React from 'react';
import type { MechanismTelemetry } from '../../types/scada';

interface KvoScreenProps {
  mechanisms: Record<string, MechanismTelemetry>;
  onSelectMechanism: (m: MechanismTelemetry) => void;
}

export const KvoScreen: React.FC<KvoScreenProps> = ({ mechanisms, onSelectMechanism }) => {
  const fans = [
    { id: 'kvo.fan.1', name: '1# Вентилятор отсоса', freq: 43.0, amps: 187.1 },
    { id: 'kvo.fan.2', name: '2# Вентилятор отсоса', freq: 43.3, amps: 179.9 },
    { id: 'kvo.fan.dry', name: 'Сухой вентилятор', freq: 50.0, amps: 23.3 },
    { id: 'kvo.fan.purge', name: 'Продувочный вентилятор', freq: 50.0, amps: 32.2 },
    { id: 'kvo.fan.neg', name: 'Вентилятор разрежения', freq: 40.2, amps: 413.4 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Верхняя статусная панель */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📦 Камера волокноосаждения (КВО) и Маятниковый раскладчик</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">РАЗРЕЖЕНИЕ: -2684 Pa</span>
          </h2>
          <p className="text-xs text-slate-400">Сбор базальтового волокна на сетчатый барабан и укладка слоев</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all">
            Автозапуск промывки
          </button>
          <button className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all">
            Аварийный останов КВО
          </button>
        </div>
      </div>

      {/* Линейка вентиляторов и дымососов */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {fans.map((f) => {
          const m = mechanisms[f.id] || {
            id: f.id,
            name: f.name,
            section: 'КВО Вентиляция',
            type: 'fan',
            state: 'running',
            mode: 'auto',
            frequencyActualHz: f.freq,
            currentAmps: f.amps
          };

          return (
            <div
              key={f.id}
              onClick={() => onSelectMechanism(m)}
              className="bg-slate-900 hover:border-blue-500 border border-slate-800 p-3 rounded-xl cursor-pointer transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200 truncate">{f.name}</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="flex justify-between items-baseline text-xs font-mono">
                <span className="text-blue-400 font-bold">{f.freq} Hz</span>
                <span className="text-amber-400">{f.amps} A</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Мнемосхема КВО + Маятник */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Мнемосхема барабана КВО */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
            <span>Мнемосхема барабана КВО и конвейеров</span>
            <div className="flex gap-4 font-mono text-[11px]">
              <span className="text-purple-400">Давление: -2 684 Pa</span>
              <span className="text-amber-400">Температура: 33.7 °C</span>
            </div>
          </div>

          <svg className="w-full h-72" viewBox="0 0 540 240">
            {/* Барабан КВО */}
            <circle cx="200" cy="110" r="75" fill="#1e293b" stroke="#38bdf8" strokeWidth="4" />
            <circle cx="200" cy="110" r="45" fill="#0f172a" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />
            <text x="200" y="115" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="bold">БАРАБАН КВО</text>

            {/* Щеточные валики */}
            <circle cx="200" cy="25" r="14" fill="#334155" stroke="#10b981" strokeWidth="2" />
            <text x="200" y="28" textAnchor="middle" fill="#fff" fontSize="8">Верх.вал</text>
            <circle cx="200" cy="195" r="14" fill="#334155" stroke="#10b981" strokeWidth="2" />
            <text x="200" y="198" textAnchor="middle" fill="#fff" fontSize="8">Нижн.вал</text>

            {/* Конвейеры отвода ваты */}
            <path d="M 275 110 L 400 80" stroke="#475569" strokeWidth="10" strokeLinecap="round" />
            <path d="M 275 110 L 400 80" stroke="#10b981" strokeWidth="4" strokeDasharray="8 4" />
            <text x="340" y="70" fill="#94a3b8" fontSize="10">Конвейер 1 (29.8 Hz)</text>

            {/* Маятниковый раскладчик */}
            <g transform="translate(430, 40)">
              <rect x="0" y="0" width="90" height="150" rx="8" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
              <line x1="45" y1="10" x2="30" y2="120" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
              <circle cx="30" cy="120" r="12" fill="#10b981" />
              <text x="45" y="142" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">МАЯТНИК</text>
            </g>
          </svg>
          <div className="text-[11px] text-slate-500">Интерактивный узел: кликните по механизму для ручного пуска/регулировки</div>
        </div>

        {/* Параметры маятникового раскладчика (Pendulum) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Параметры раскладки слоев</h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Амплитуда хода</span>
              <span className="font-mono font-bold text-blue-400">990 мм / 1035 мм</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Физическое положение</span>
              <span className="font-mono font-bold text-emerald-400">-376 мм</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Скорость маятника</span>
              <span className="font-mono font-bold text-purple-400">65 м/мин</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Ток привода маятника</span>
              <span className="font-mono font-bold text-amber-400">13.0 А</span>
            </div>
          </div>

          <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all">
            Настройка синхронизации ZC1 &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
