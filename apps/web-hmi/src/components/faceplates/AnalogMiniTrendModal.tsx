import React, { useRef, useEffect, useState } from 'react';
import { X, LineChart, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { PlcTagDefinition, TagValue } from '../../types/hmi';

interface AnalogMiniTrendModalProps {
  tag: PlcTagDefinition;
  tagValue?: TagValue;
  onClose: () => void;
  onOpenFullTrend: (tagId: string) => void;
}

export const AnalogMiniTrendModal: React.FC<AnalogMiniTrendModalProps> = ({
  tag,
  tagValue,
  onClose,
  onOpenFullTrend
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [history, setHistory] = useState<{ timestamp: number; value: number }[]>([]);

  // Текущее числовое значение
  const currentNumVal = typeof tagValue?.value === 'number' ? tagValue.value : 0;

  // Определение допустимых технологических пределов (Min/Max/Warning/Alarm)
  const minVal = tag.minValue ?? (
    tag.id.includes('pressure') ? -3500 :
    tag.id.includes('temperature') || tag.id.includes('temp') ? 100 :
    tag.id.includes('current') ? 0 :
    tag.id.includes('speed') ? 0 : 0
  );

  const maxVal = tag.maxValue ?? (
    tag.id.includes('pressure') ? 0 :
    tag.id.includes('temperature') || tag.id.includes('temp') ? 300 :
    tag.id.includes('current') ? 25 :
    tag.id.includes('speed') ? 3 : 100
  );

  const span = Math.max(0.1, maxVal - minVal);
  const percent = Math.min(100, Math.max(0, ((currentNumVal - minVal) / span) * 100));

  // Оценка состояния (Норма / Предупреждение / Авария)
  const isAlarm = currentNumVal < minVal || currentNumVal > maxVal;
  const isWarning = !isAlarm && (percent < 10 || percent > 90);

  // Накопление точек для мини-тренда
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    setHistory((prev) => {
      const updated = [...prev, { timestamp: now, value: currentNumVal }];
      const cutoff = now - 300; // 5 минут истории
      return updated.filter((pt) => pt.timestamp >= cutoff);
    });
  }, [currentNumVal]);

  // Отрисовка мини-тренда на Canvas (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = 12;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;

    // Фон
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Сетка
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = pad + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    // Линии допустимых пределов (красный пунктир)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // Верхний предел Max
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(w - pad, pad);
    ctx.stroke();

    // Нижний предел Min
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();
    ctx.setLineDash([]);

    if (history.length < 2) {
      // Отрисовка базовой линии если точек мало
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const yNorm = pad + plotH - ((currentNumVal - minVal) / span) * plotH;
      ctx.moveTo(pad, yNorm);
      ctx.lineTo(w - pad, yNorm);
      ctx.stroke();
      return;
    }

    const minT = history[0].timestamp;
    const maxT = history[history.length - 1].timestamp;
    const tSpan = Math.max(1, maxT - minT);

    // Отрисовка линии тренда
    ctx.strokeStyle = isAlarm ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    history.forEach((pt, idx) => {
      const x = pad + ((pt.timestamp - minT) / tSpan) * plotW;
      const y = pad + plotH - Math.min(plotH, Math.max(0, ((pt.value - minVal) / span) * plotH));

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [history, currentNumVal, minVal, maxVal, span, isAlarm, isWarning]);

  // Статистика за 5 минут
  const values = history.map((h) => h.value);
  const minHist = values.length ? Math.min(...values) : currentNumVal;
  const maxHist = values.length ? Math.max(...values) : currentNumVal;
  const avgHist = values.length ? values.reduce((a, b) => a + b, 0) / values.length : currentNumVal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">{tag.name}</h2>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  АНАЛОГОВЫЙ
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">{tag.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Тело модального окна */}
        <div className="p-5 space-y-4">
          {/* Блок текущего значения и статуса */}
          <div className="flex items-baseline justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Текущее значение:</span>
              <div className="flex items-baseline space-x-2">
                <span className={`text-3xl font-black font-mono ${isAlarm ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currentNumVal.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-slate-300">{tag.engineeringUnit || ''}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block mb-1">Статус сигнала:</span>
              <div className="flex items-center space-x-1.5">
                {isAlarm ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span className="text-xs font-bold text-rose-400">ВЫХОД ЗА ПРЕДЕЛЫ</span>
                  </>
                ) : isWarning ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">ПРЕДУПРЕЖДЕНИЕ</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">В НОРМЕ (GOOD)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Индикатор допустимого диапазона (Gauge Bar) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Мин. предел: <strong className="text-blue-400">{minVal} {tag.engineeringUnit}</strong></span>
              <span className="text-slate-400">Макс. предел: <strong className="text-rose-400">{maxVal} {tag.engineeringUnit}</strong></span>
            </div>

            <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${isAlarm ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Мини-тренд (Canvas 60 FPS) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold">Мини-тренд за последние 5 минут:</span>
              <span className="font-mono text-[10px]">Красный пунктир: пределы Min/Max</span>
            </div>
            <div className="h-32 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
          </div>

          {/* Сводные показатели за 5 минут */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Минимум:</span>
              <span className="font-bold text-blue-400">{minHist.toFixed(2)}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Среднее:</span>
              <span className="font-bold text-purple-400">{avgHist.toFixed(2)}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Максимум:</span>
              <span className="font-bold text-rose-400">{maxHist.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Нижняя панель действий */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors">
            Закрыть
          </button>

          <button
            onClick={() => {
              onOpenFullTrend(tag.id);
              onClose();
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all">
            <LineChart className="w-4 h-4" />
            <span>ОТКРЫТЬ В МОДУЛЕ ТРЕНДОВ 📈</span>
          </button>
        </div>
      </div>
    </div>
  );
};
