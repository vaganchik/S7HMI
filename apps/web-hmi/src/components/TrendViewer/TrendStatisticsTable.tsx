import React, { useState } from 'react';
import { Eye, EyeOff, SlidersHorizontal } from 'lucide-react';
import type { TrendPen, TrendPenStats } from '../../types/trends';

interface TrendStatisticsTableProps {
  pens: TrendPen[];
  stats: Record<string, TrendPenStats>;
  onTogglePenVisibility: (tagId: string) => void;
  onChangePenColor: (tagId: string, color: string) => void;
  onChangePenAxis: (tagId: string, axis: 'left' | 'right') => void;
  onChangePenRange: (tagId: string, minRange?: number, maxRange?: number) => void;
  onRemovePen: (tagId: string) => void;
}

export const TrendStatisticsTable: React.FC<TrendStatisticsTableProps> = ({
  pens,
  stats,
  onTogglePenVisibility,
  onChangePenColor,
  onChangePenAxis,
  onChangePenRange,
  onRemovePen
}) => {
  const [editingRangeTagId, setEditingRangeTagId] = useState<string | null>(null);
  const [minInput, setMinInput] = useState<string>('');
  const [maxInput, setMaxInput] = useState<string>('');

  if (pens.length === 0) return null;

  const handleOpenRangeModal = (pen: TrendPen) => {
    setEditingRangeTagId(pen.tagId);
    setMinInput(pen.minRange !== undefined ? String(pen.minRange) : '');
    setMaxInput(pen.maxRange !== undefined ? String(pen.maxRange) : '');
  };

  const handleSaveRange = (tagId: string) => {
    const min = minInput.trim() !== '' && !isNaN(Number(minInput)) ? Number(minInput) : undefined;
    const max = maxInput.trim() !== '' && !isNaN(Number(maxInput)) ? Number(maxInput) : undefined;
    onChangePenRange(tagId, min, max);
    setEditingRangeTagId(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
        <span>Легенда перьев, выбор шкалы Y и расчетные показатели</span>
        <span className="text-slate-500 font-mono text-[10px]">Количество перьев: {pens.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="px-3 py-2 w-10 text-center">Вид</th>
              <th className="px-3 py-2">Цвет / Тег</th>
              <th className="px-3 py-2">Ед. изм.</th>
              <th className="px-3 py-2 text-center">Шкала Y (L/R)</th>
              <th className="px-3 py-2 text-right">Текущее</th>
              <th className="px-3 py-2 text-right">Минимум</th>
              <th className="px-3 py-2 text-right">Максимум</th>
              <th className="px-3 py-2 text-right">Среднее</th>
              <th className="px-3 py-2 text-right">Дельта (Δ)</th>
              <th className="px-3 py-2 text-center w-10">✕</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {pens.map((pen) => {
              const st = stats[pen.tagId] || { min: 0, max: 0, avg: 0, last: 0, delta: 0 };
              const hasCustomRange = pen.minRange !== undefined && pen.maxRange !== undefined;

              return (
                <tr key={pen.tagId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onTogglePenVisibility(pen.tagId)}
                      title={pen.visible ? 'Скрыть перо' : 'Показать перо'}
                      className="text-slate-400 hover:text-white">
                      {pen.visible ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-2.5">
                      {/* Интерактивный выбор цвета */}
                      <label title="Нажмите, чтобы изменить цвет пера" className="relative cursor-pointer flex-shrink-0 group">
                        <span
                          className="w-4 h-4 rounded-full block border-2 border-slate-700 group-hover:scale-110 transition-transform shadow"
                          style={{ backgroundColor: pen.color }}
                        />
                        <input
                          type="color"
                          value={pen.color}
                          onChange={(e) => onChangePenColor(pen.tagId, e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </label>

                      <div>
                        <span className="font-sans font-bold text-white block">{pen.name}</span>
                        <span className="text-[10px] text-slate-500 block">{pen.tagId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-sans text-slate-400">{pen.unit}</td>

                  {/* Интерактивный выбор шкалы Y (Левая / Правая + Границы) */}
                  <td className="px-3 py-2 text-center">
                    <div className="inline-flex items-center space-x-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      {/* Кнопка переключения Левая / Правая */}
                      <button
                        onClick={() => onChangePenAxis(pen.tagId, pen.axis === 'left' ? 'right' : 'left')}
                        title={`Текущая шкала: ${pen.axis === 'left' ? 'Левая (Y1)' : 'Правая (Y2)'}. Нажмите для смены.`}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          pen.axis === 'left'
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-purple-600 text-white shadow'
                        }`}>
                        {pen.axis === 'left' ? 'Y1 (Левая)' : 'Y2 (Правая)'}
                      </button>

                      {/* Настройка пределов шкалы */}
                      <button
                        onClick={() => handleOpenRangeModal(pen)}
                        title={hasCustomRange ? `Фикс. пределы: ${pen.minRange}..${pen.maxRange}` : 'Авто-масштаб. Нажмите для задания Min..Max'}
                        className={`p-1 rounded text-[10px] transition-colors ${
                          hasCustomRange ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                        }`}>
                        <SlidersHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  <td className="px-3 py-2 text-right font-bold text-emerald-400">{st.last.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-blue-400">{st.min.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-rose-400">{st.max.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-purple-400">{st.avg.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-amber-400 font-bold">{st.delta.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onRemovePen(pen.tagId)}
                      title="Удалить перо с графика"
                      className="text-slate-500 hover:text-rose-400 font-sans">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Модальное окно настройки пределов шкалы Y */}
      {editingRangeTagId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Границы шкалы Y для тега: {editingRangeTagId}</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Нижний предел (Min):</label>
                <input
                  type="number"
                  placeholder="Авто"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Верхний предел (Max):</label>
                <input
                  type="number"
                  placeholder="Авто"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setMinInput('');
                  setMaxInput('');
                  handleSaveRange(editingRangeTagId);
                }}
                className="text-[11px] text-slate-400 hover:text-white underline">
                Сбросить на Авто
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingRangeTagId(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg">
                  Отмена
                </button>
                <button
                  onClick={() => handleSaveRange(editingRangeTagId)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow">
                  Применить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
