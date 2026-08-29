import React, { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import type { TagValue } from '../types/hmi';

interface TrendChartProps {
  tagValues: Record<string, TagValue>;
}

export const TrendChart: React.FC<TrendChartProps> = ({ tagValues }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

  // Хранилище временных рядов в памяти: [timestamps[], temps[], pressures[]]
  const dataRef = useRef<[number[], number[], number[]]>([[], [], []]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Инициализация начальных точек (последние 60 секунд)
    const nowSec = Math.floor(Date.now() / 1000);
    const times: number[] = [];
    const temps: number[] = [];
    const pressures: number[] = [];

    for (let i = 60; i >= 0; i--) {
      times.push(nowSec - i);
      temps.push(640 + Math.sin(i / 5) * 5 + Math.random() * 2);
      pressures.push(3.2 + Math.cos(i / 7) * 0.2 + Math.random() * 0.1);
    }

    dataRef.current = [times, temps, pressures];

    const opts: uPlot.Options = {
      width: chartContainerRef.current.clientWidth || 800,
      height: 380,
      title: 'Тренды реального времени (uPlot 60 FPS Engine)',
      cursor: {
        drag: { x: true, y: false },
        sync: { key: 'hmi-trends' }
      },
      scales: {
        x: { time: true },
        temp: { auto: true },
        press: { auto: true }
      },
      axes: [
        {
          stroke: '#94a3b8',
          grid: { stroke: '#334155', width: 1 }
        },
        {
          scale: 'temp',
          label: 'Температура (°C)',
          stroke: '#f59e0b',
          grid: { stroke: '#1e293b', width: 1 }
        },
        {
          scale: 'press',
          side: 1,
          label: 'Давление (bar)',
          stroke: '#8b5cf6',
          grid: { show: false }
        }
      ],
      series: [
        {},
        {
          label: 'Температура T1 (°C)',
          scale: 'temp',
          stroke: '#f59e0b',
          width: 2,
          points: { show: false }
        },
        {
          label: 'Давление P1 (bar)',
          scale: 'press',
          stroke: '#8b5cf6',
          width: 2,
          points: { show: false }
        }
      ]
    };

    const u = new uPlot(opts, dataRef.current, chartContainerRef.current);
    uplotRef.current = u;

    const handleResize = () => {
      if (chartContainerRef.current && uplotRef.current) {
        uplotRef.current.setSize({
          width: chartContainerRef.current.clientWidth,
          height: 380
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      u.destroy();
      uplotRef.current = null;
    };
  }, []);

  // Добавление новой точки по приходу данных из SignalR
  useEffect(() => {
    if (!uplotRef.current) return;

    const currentTemp = tagValues['furnace.zone1.temperature']?.value as number;
    const currentPress = tagValues['furnace.zone1.pressure']?.value as number;

    if (currentTemp !== undefined || currentPress !== undefined) {
      const nowSec = Math.floor(Date.now() / 1000);
      const [times, temps, pressures] = dataRef.current;

      times.push(nowSec);
      temps.push(currentTemp ?? temps[temps.length - 1] ?? 640);
      pressures.push(currentPress ?? pressures[pressures.length - 1] ?? 3.2);

      // Держим в памяти буфер последних 300 точек (5 минут истории)
      if (times.length > 300) {
        times.shift();
        temps.shift();
        pressures.shift();
      }

      uplotRef.current.setData(dataRef.current);
    }
  }, [tagValues]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white">Высокоскоростные тренды технологических параметров</h2>
          <p className="text-xs text-slate-400">Рендеринг на Canvas через uPlot без нагрузки на процессор клиента</p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            T1 (DB1.DBD0): <strong>{(tagValues['furnace.zone1.temperature']?.value as number ?? 642.5).toFixed(1)} °C</strong>
          </span>
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            P1 (DB1.DBD4): <strong>{(tagValues['furnace.zone1.pressure']?.value as number ?? 3.4).toFixed(2)} bar</strong>
          </span>
        </div>
      </div>

      <div ref={chartContainerRef} className="w-full h-96 flex items-center justify-center" />
    </div>
  );
};
