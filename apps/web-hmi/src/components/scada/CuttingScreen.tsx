import React, { useState } from 'react';
import type { MechanismTelemetry } from '../../types/scada';

interface CuttingScreenProps {
  mechanisms: Record<string, MechanismTelemetry>;
  onSelectMechanism: (m: MechanismTelemetry) => void;
}

export const CuttingScreen: React.FC<CuttingScreenProps> = ({ mechanisms, onSelectMechanism }) => {
  const [cutSubTab, setCutSubTab] = useState<'longitudinal' | 'flying'>('longitudinal');

  const longSaws = [
    { id: 'saw.long.1', name: '1# Продольная пила', freq: 50.4, amps: 5.44 },
    { id: 'saw.long.2', name: '2# Продольная пила', freq: 50.3, amps: 4.96 },
    { id: 'saw.long.3', name: '3# Продольная пила', freq: 50.3, amps: 5.07 },
    { id: 'saw.trimmer', name: '1# Рубильная машина', freq: 40.5, amps: 22.5 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Шапка секции резки */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>✂️ Участок резки ковра: Продольные пилы и ЧПУ Летучая пила</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">РЕЗ В РАЗМЕР</span>
          </h2>
          <p className="text-xs text-slate-400">Форматирование плиты: обрезка кромок, продольный роспуск и поперечный раскрой</p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCutSubTab('longitudinal')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${cutSubTab === 'longitudinal' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            Продольная обрезка
          </button>
          <button
            onClick={() => setCutSubTab('flying')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${cutSubTab === 'flying' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            ЧПУ Летучая пила
          </button>
        </div>
      </div>

      {cutSubTab === 'longitudinal' ? (
        <div className="space-y-6">
          {/* Дисковые продольные пилы и рубильная машина */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {longSaws.map((s) => {
              const m = mechanisms[s.id] || {
                id: s.id,
                name: s.name,
                section: 'Продольная обрезка',
                type: 'saw',
                state: 'running',
                mode: 'auto',
                frequencyActualHz: s.freq,
                currentAmps: s.amps
              };

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectMechanism(m)}
                  className="bg-slate-900 hover:border-blue-500 border border-slate-800 p-4 rounded-xl cursor-pointer transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white truncate">{s.name}</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Частота</span>
                      <span className="text-blue-400 font-bold">{s.freq} Hz</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Ток</span>
                      <span className="text-amber-400 font-bold">{s.amps} A</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Транспортеры обрезков и охлаждения */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">1# Охлаждающий конвейер</span>
              <span className="text-xl font-bold font-mono text-emerald-400">7.29 Hz / 3.54 A</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Транспортер стружки</span>
              <span className="text-xl font-bold font-mono text-blue-400">7.09 Hz / 2.55 A</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Щелевой конвейер</span>
              <span className="text-xl font-bold font-mono text-purple-400">7.20 Hz / 1.97 A</span>
            </div>
          </div>
        </div>
      ) : (
        /* ЧПУ Летучая пила и система пылеулавливания */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Карточка летучей пилы */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Обоеострая летучая пила</h3>
              <div className="space-y-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Привод пилы:</span>
                  <span className="font-mono font-bold text-emerald-400">7.29 Hz / 5.02 A</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Конвейер после пилы:</span>
                  <span className="font-mono font-bold text-blue-400">11.43 Hz / 3.54 A</span>
                </div>
              </div>
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all">
                ТЕСТОВЫЙ РЕЗ В РАЗМЕР
              </button>
            </div>

            {/* Система аспирации и пылесборник */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Магистральный пылеуловитель</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-300">Вентилятор пылесборника:</span>
                  <span className="font-mono font-bold text-emerald-400">50.2 Hz / 104.8 A</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-300">Импульсное дутье:</span>
                  <span className="font-mono text-purple-400 font-bold">160 мс</span>
                </div>
              </div>
            </div>

            {/* Упаковочные линии 1# и 2# */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Упаковка готовой продукции</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                  <span className="text-slate-400">1# Упаковочная машина:</span>
                  <span className="font-mono font-bold text-blue-400">0 кг / 0 упак</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                  <span className="text-slate-400">2# Упаковочная машина:</span>
                  <span className="font-mono font-bold text-blue-400">0 кг / 0 упак</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
