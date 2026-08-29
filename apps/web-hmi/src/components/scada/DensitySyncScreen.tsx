import React, { useState } from 'react';

export const DensitySyncScreen: React.FC = () => {
  const [subTab, setSubTab] = useState<'density' | 'zc' | 'analog'>('density');

  const zc1Table = [
    { name: 'Хлопковые сборки (КВО)', setFreq: 27.5, actFreq: 27.5, amps: 18.4, ratio: 0.950 },
    { name: 'Сепарационный валик', setFreq: 27.8, actFreq: 27.8, amps: 2.4, ratio: 0.960 },
    { name: 'Конвейер 1', setFreq: 29.8, actFreq: 29.8, amps: 4.2, ratio: 1.030 },
    { name: '2# Ленточный конвейер', setFreq: 35.5, actFreq: 35.5, amps: 3.9, ratio: 1.225 },
    { name: '1# Маятниковый конвейер', setFreq: 43.4, actFreq: 43.4, amps: 3.1, ratio: 1.500 },
    { name: '2# Маятниковый пояс', setFreq: 42.6, actFreq: 42.5, amps: 3.2, ratio: 1.470 },
    { name: 'Конвейер 3', setFreq: 30.2, actFreq: 30.2, amps: 4.0, ratio: 1.045 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Шапка и выбор подрежима */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚙️ Контроль плотности и Параметризация ZC1 / ZC2</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">ПЛОТНОСТЬ: 96 кг/м³</span>
          </h2>
          <p className="text-xs text-slate-400">Синхронизация скоростей каскада приводов и расчет геометрии ковра</p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubTab('density')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'density' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            Контроль плотности
          </button>
          <button
            onClick={() => setSubTab('zc')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'zc' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            Синхронизация ZC
          </button>
          <button
            onClick={() => setSubTab('analog')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'analog' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            Калибровка 4-20mA
          </button>
        </div>
      </div>

      {subTab === 'density' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Геометрия изделия и плотность */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Параметры готовой плиты</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Плотность плиты</span>
                <span className="font-mono font-bold text-emerald-400 text-xl">96.0 кг/м³</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Толщина плиты</span>
                <span className="font-mono font-bold text-blue-400 text-xl">152.0 мм</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Длина изделия</span>
                <span className="font-mono font-bold text-white text-lg">2 400 мм</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Ширина изделия</span>
                <span className="font-mono font-bold text-white text-lg">1 205 мм</span>
              </div>
            </div>
          </div>

          {/* Холостой ток центрифуг и аномалии */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Токи холостого хода центрифуг</h3>
            <div className="grid grid-cols-4 gap-2 text-xs font-mono">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Вал #{n}</span>
                  <span className="text-amber-400 font-bold text-base">15.0 A</span>
                </div>
              ))}
            </div>
            <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold">
              Зарегистрировать ток холостого хода
            </button>
          </div>
        </div>
      )}

      {subTab === 'zc' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
            <h3 className="text-sm font-bold text-white">Каскадная таблица коэффициентов синхронизации (ZC1)</h3>
            <span className="text-xs text-blue-400 font-mono">Мастер-скорость: 66 м/мин</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Привод / Агрегат</th>
                  <th className="px-4 py-3">Уст. Гц</th>
                  <th className="px-4 py-3">Факт Гц</th>
                  <th className="px-4 py-3">Ток (А)</th>
                  <th className="px-4 py-3">Коэфф. ZC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {zc1Table.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-sans font-medium text-white">{row.name}</td>
                    <td className="px-4 py-3 text-blue-400 font-bold">{row.setFreq.toFixed(1)}</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">{row.actFreq.toFixed(1)}</td>
                    <td className="px-4 py-3 text-amber-400">{row.amps.toFixed(1)}</td>
                    <td className="px-4 py-3 text-purple-400 font-bold">{row.ratio.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'analog' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Калибровка аналоговых каналов (4-20 мА / 0-10V)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              { name: 'Давление на входе фильтра', val: -944.9, max: -5000, min: 0, low: -3000 },
              { name: 'Давление на выходе фильтра', val: -2826.0, max: -5000, min: 0, low: -3000 },
              { name: 'Температура газов КП', val: 245.0, max: 500, min: -40, low: 0 },
              { name: 'Положение оси X желоба', val: 133.6, max: 500, min: 0, low: 50 }
            ].map((ch, i) => (
              <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-200">{ch.name}</span>
                  <span className="text-blue-400 font-mono">{ch.val}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-mono">
                  <span>Шкала: {ch.min}..{ch.max}</span>
                  <span>Авария: {ch.low}</span>
                  <span className="text-emerald-400 text-right">Канал OK</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
