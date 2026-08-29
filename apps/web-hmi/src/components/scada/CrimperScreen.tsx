import React, { useState } from 'react';
import type { MechanismTelemetry } from '../../types/scada';

interface CrimperScreenProps {
  mechanisms: Record<string, MechanismTelemetry>;
  onSelectMechanism: (m: MechanismTelemetry) => void;
}

export const CrimperScreen: React.FC<CrimperScreenProps> = ({ mechanisms, onSelectMechanism }) => {
  const [subTab, setSubTab] = useState<'crimper' | 'lift'>('crimper');

  const crimperStages = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Шапка и переключение подрежима Гофрировщик / Лифт */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📐 Взвешивание, Плиссировка (Гофрировщик) и Подъемники</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">СКОРОСТЬ: 1.43 м/мин</span>
          </h2>
          <p className="text-xs text-slate-400">Продольно-вертикальная ориентация волокон и формирование ковра</p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubTab('crimper')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'crimper' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            Секции плиссировки
          </button>
          <button
            onClick={() => setSubTab('lift')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'lift' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            Подъемники (Лифт)
          </button>
        </div>
      </div>

      {subTab === 'crimper' ? (
        <div className="space-y-6">
          {/* Сетка ступеней плиссировки (верхний и нижний ряды) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {crimperStages.map((stage) => {
              const topId = `crimper.top.${stage}`;
              const botId = `crimper.bot.${stage}`;
              const mTop = mechanisms[topId] || {
                id: topId,
                name: `${stage}# Верхний этап`,
                section: 'Гофрировщик',
                type: 'motor',
                state: 'running',
                mode: 'auto',
                frequencyActualHz: 6.8 - stage * 0.5,
                currentAmps: 2.6
              };
              const mBot = mechanisms[botId] || {
                id: botId,
                name: `${stage}# Нижний этап`,
                section: 'Гофрировщик',
                type: 'motor',
                state: 'running',
                mode: 'auto',
                frequencyActualHz: 6.4 - stage * 0.4,
                currentAmps: 2.5
              };

              return (
                <div key={stage} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 block text-center border-b border-slate-800 pb-1">
                    Ступень #{stage}
                  </span>
                  {/* Верхний привод */}
                  <div
                    onClick={() => onSelectMechanism(mTop)}
                    className="p-2 bg-slate-950 hover:border-blue-500 border border-slate-800 rounded-lg cursor-pointer transition-all">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Верхний</span>
                      <span className="text-emerald-400 font-mono">{mTop.frequencyActualHz?.toFixed(1)} Hz</span>
                    </div>
                  </div>
                  {/* Нижний привод */}
                  <div
                    onClick={() => onSelectMechanism(mBot)}
                    className="p-2 bg-slate-950 hover:border-blue-500 border border-slate-800 rounded-lg cursor-pointer transition-all">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Нижний</span>
                      <span className="text-blue-400 font-mono">{mBot.frequencyActualHz?.toFixed(1)} Hz</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Показатели весового конвейера */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Мгновенная производительность</span>
              <span className="text-2xl font-black font-mono text-emerald-400">3 500 кг/ч</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Погонный вес ковра</span>
              <span className="text-2xl font-black font-mono text-blue-400">53.49 кг/м</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Скорость основной линии</span>
              <span className="text-2xl font-black font-mono text-purple-400">1.43 м/мин</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Машина под давлением</span>
              <span className="text-2xl font-black font-mono text-amber-400">5.06 Hz / 39.3 A</span>
            </div>
          </div>
        </div>
      ) : (
        /* Таблица концевиков подъемников Лифта */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Подъемно-опускные механизмы и концевые выключатели</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              '1# Подъемник формовочной машины',
              '2# Подъемник формовочной машины',
              '1# Подъемник плиссировки',
              '2# Подъемник плиссировки',
              'Подъемник нагнетателя',
              'Подъемник печи полимеризации',
              'Подъемник станции маркировки',
              'Подъемник передней двери',
              'Подъемник задней двери'
            ].map((name, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-200 block truncate">{name}</span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Верхний предел:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500">НЕ АКТИВЕН</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Нижний предел:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">АКТИВЕН</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
