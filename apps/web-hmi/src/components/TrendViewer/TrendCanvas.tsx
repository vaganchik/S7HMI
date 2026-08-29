import React, { useRef, useEffect, useState } from 'react';
import type { TrendPen, TrendPoint } from '../../types/trends';

interface TrendCanvasProps {
  pens: TrendPen[];
  data: TrendPoint[];
  timeRangeSec: number;
  toolMode: 'crosshair' | 'pan';
  timeOffsetSec: number;
  onTimeOffsetChange: (offset: number) => void;
  onZoomTimeRange: (newRange: number) => void;
}

export const TrendCanvas: React.FC<TrendCanvasProps> = ({
  pens,
  data,
  timeRangeSec,
  toolMode,
  timeOffsetSec,
  onTimeOffsetChange,
  onZoomTimeRange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverData, setHoverData] = useState<{ fullDateTimeStr: string; values: Record<string, number | null> } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; initialOffset: number } | null>(null);

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
    const padLeft = 65;
    const padRight = 65;
    const padTop = 25;
    const padBottom = 55; // Увеличенный отступ для двухстрочных меток (Время + Дата) и заголовка оси
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Фон
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Сетка
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + (plotH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
    }

    if (data.length < 2 || pens.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ожидание поступления точек телеметрии...', w / 2, h / 2);
      return;
    }

    // Расчет временного диапазона с учетом сдвига (Рука / Pan offset)
    const latestTime = data[data.length - 1].timestamp - timeOffsetSec;
    const startTime = latestTime - timeRangeSec;
    const timeSpan = timeRangeSec;

    // Раздельный расчет для Левой (Y1) и Правой (Y2) шкал
    const leftPens = pens.filter((p) => p.visible && p.axis === 'left');
    const rightPens = pens.filter((p) => p.visible && p.axis === 'right');

    const getAxisBounds = (axisPens: TrendPen[]) => {
      let min = Infinity;
      let max = -Infinity;

      axisPens.forEach((p) => {
        if (p.minRange !== undefined && p.maxRange !== undefined) {
          if (p.minRange < min) min = p.minRange;
          if (p.maxRange > max) max = p.maxRange;
          return;
        }

        data.forEach((d) => {
          if (d.timestamp >= startTime && d.timestamp <= latestTime) {
            const v = d.values[p.tagId];
            if (v !== undefined && v !== null) {
              if (v < min) min = v;
              if (v > max) max = v;
            }
          }
        });
      });

      if (min === Infinity) min = 0;
      if (max === -Infinity) max = 100;
      if (min === max) {
        min -= 5;
        max += 5;
      }
      return { min, max, span: max - min };
    };

    const leftBounds = getAxisBounds(leftPens.length > 0 ? leftPens : pens.filter((p) => p.visible));
    const rightBounds = getAxisBounds(rightPens.length > 0 ? rightPens : leftPens);

    // Отрисовка Левой шкалы Y
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = leftPens[0]?.color || '#94a3b8';
    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + (plotH / gridLines) * i;
      const v = leftBounds.max - (leftBounds.span / gridLines) * i;
      ctx.fillText(v.toFixed(1), padLeft - 8, y + 3);
    }

    // Отрисовка Правой шкалы Y
    if (rightPens.length > 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = rightPens[0]?.color || '#a855f7';
      for (let i = 0; i <= gridLines; i++) {
        const y = padTop + (plotH / gridLines) * i;
        const v = rightBounds.max - (rightBounds.span / gridLines) * i;
        ctx.fillText(v.toFixed(1), w - padRight + 8, y + 3);
      }
    }

    // Заголовки шкал Y
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.fillText('ЛЕВАЯ ШКАЛА (Y1)', padLeft - 8, padTop - 10);
    if (rightPens.length > 0) {
      ctx.textAlign = 'left';
      ctx.fillText('ПРАВАЯ ШКАЛА (Y2)', w - padRight + 8, padTop - 10);
    }

    // Линия оси OX
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + plotH);
    ctx.lineTo(w - padRight, padTop + plotH);
    ctx.stroke();

    // Засечки и Метки по оси OX (ВРЕМЯ + ДАТА)
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
      const x = padLeft + (plotW / xTicks) * i;
      const t = startTime + (timeSpan / xTicks) * i;
      const d = new Date(t * 1000);

      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
      const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

      // Вертикальная засечка
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(x, padTop + plotH);
      ctx.lineTo(x, padTop + plotH + 5);
      ctx.stroke();

      // Строка 1: Время (HH:mm:ss)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(timeStr, x, padTop + plotH + 17);

      // Строка 2: Дата (ДД.ММ.ГГГГ)
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText(dateStr, x, padTop + plotH + 28);
    }

    // ПОДПИСЬ ОСИ OX (Информационная полоса)
    const startD = new Date(startTime * 1000);
    const endD = new Date(latestTime * 1000);
    const dateRangeStr = `${startD.toLocaleDateString()} ${startD.toLocaleTimeString()} — ${endD.toLocaleTimeString()}`;

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    const offsetText = timeOffsetSec > 0 ? ` • [Сдвиг в прошлое: -${timeOffsetSec} сек]` : ' • [Онлайн]';
    ctx.fillText(`🕒 ОСЬ ВРЕМЕНИ OX • ${dateRangeStr}${offsetText}`, w / 2, h - 8);

    // Отрисовка перьев
    pens.forEach((p) => {
      if (!p.visible) return;

      const bounds = p.axis === 'right' ? rightBounds : leftBounds;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let hasStarted = false;

      data.forEach((pt) => {
        if (pt.timestamp < startTime - 10 || pt.timestamp > latestTime + 10) return;
        const v = pt.values[p.tagId];
        if (v === undefined || v === null) return;

        const x = padLeft + ((pt.timestamp - startTime) / timeSpan) * plotW;
        const y = padTop + plotH - ((v - bounds.min) / bounds.span) * plotH;

        if (!hasStarted) {
          ctx.moveTo(x, y);
          hasStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });

    // Курсор-линейка (Crosshair)
    if (toolMode === 'crosshair' && cursorPos && cursorPos.x >= padLeft && cursorPos.x <= w - padRight) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cursorPos.x, padTop);
      ctx.lineTo(cursorPos.x, padTop + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [data, pens, cursorPos, timeRangeSec, timeOffsetSec, toolMode]);

  // Обработка мыши: Курсор и Инструмент "Рука" (Pan)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (toolMode === 'pan') {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, initialOffset: timeOffsetSec };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });

    const padLeft = 65;
    const padRight = 65;
    const plotW = rect.width - padLeft - padRight;

    // Режим "Рука" (перетаскивание по времени)
    if (toolMode === 'pan' && isDragging && dragStartRef.current) {
      const deltaPx = e.clientX - dragStartRef.current.x;
      const timePerPixel = timeRangeSec / plotW;
      const deltaSec = deltaPx * timePerPixel;
      const newOffset = Math.max(0, dragStartRef.current.initialOffset + deltaSec);
      onTimeOffsetChange(Math.round(newOffset));
      return;
    }

    // Режим "Курсор-линейка"
    if (x >= padLeft && x <= rect.width - padRight) {
      const latestTime = data[data.length - 1].timestamp - timeOffsetSec;
      const startTime = latestTime - timeRangeSec;
      const hoverTime = startTime + ((x - padLeft) / plotW) * timeRangeSec;

      let closestPt = data[0];
      let minDiff = Infinity;
      data.forEach((d) => {
        const diff = Math.abs(d.timestamp - hoverTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestPt = d;
        }
      });

      const d = new Date(closestPt.timestamp * 1000);
      const fullDateTime = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
      setHoverData({
        fullDateTimeStr: fullDateTime,
        values: closestPt.values
      });
    } else {
      setHoverData(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
    const newRange = Math.min(86400, Math.max(30, Math.round(timeRangeSec * zoomFactor)));
    onZoomTimeRange(newRange);
  };

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col h-84">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full ${toolMode === 'pan' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'}`}
      />

      {/* Всплывающее окно значений под курсором с полной датой и временем */}
      {toolMode === 'crosshair' && hoverData && (
        <div className="absolute top-3 right-20 bg-slate-900/95 border border-slate-700 backdrop-blur-md rounded-xl p-3 shadow-2xl text-xs space-y-1.5 z-10 pointer-events-none font-mono">
          <div className="text-slate-400 font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between gap-3">
            <span>Метка времени:</span>
            <span className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {hoverData.fullDateTimeStr}
            </span>
          </div>
          {pens.map((p) => {
            if (!p.visible) return null;
            const val = hoverData.values[p.tagId];
            return (
              <div key={p.tagId} className="flex justify-between items-center space-x-3 text-[11px]">
                <span style={{ color: p.color }} className="font-sans font-semibold truncate max-w-[140px]">
                  {p.name} [{p.axis === 'left' ? 'Y1' : 'Y2'}]:
                </span>
                <span className="text-white font-bold">
                  {val !== undefined && val !== null ? `${val.toFixed(2)} ${p.unit}` : '---'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
