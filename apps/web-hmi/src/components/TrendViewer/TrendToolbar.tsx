import React from 'react';
import { Play, Pause, Download, Camera, BookmarkPlus, RotateCcw, Hand, Crosshair, FileSpreadsheet } from 'lucide-react';

interface TrendToolbarProps {
  timeRangeSec: number;
  onSelectTimeRange: (sec: number) => void;
  isLive: boolean;
  onToggleLive: () => void;
  toolMode: 'crosshair' | 'pan';
  onSelectToolMode: (mode: 'crosshair' | 'pan') => void;
  onSavePreset: () => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
  onExportPng: () => void;
  onResetZoom: () => void;
}

export const TrendToolbar: React.FC<TrendToolbarProps> = ({
  timeRangeSec,
  onSelectTimeRange,
  isLive,
  onToggleLive,
  toolMode,
  onSelectToolMode,
  onSavePreset,
  onExportCsv,
  onExportXlsx,
  onExportPng,
  onResetZoom
}) => {
  const timeRanges = [
    { label: '1 мин', sec: 60 },
    { label: '5 мин', sec: 300 },
    { label: '15 мин', sec: 900 },
    { label: '1 час', sec: 3600 },
    { label: '8 ч (Смена)', sec: 28800 },
    { label: '24 часа', sec: 86400 }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md min-h-[52px]">
      {/* Левая группа: Диапазоны времени + Инструменты (Курсор/Рука) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Кнопки диапазонов времени */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 h-9">
          {timeRanges.map((r) => (
            <button
              key={r.sec}
              onClick={() => onSelectTimeRange(r.sec)}
              className={`px-2.5 h-7 flex items-center justify-center text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                timeRangeSec === r.sec
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Инструменты взаимодействия: Курсор-линейка и Рука (Pan) */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 h-9">
          <button
            onClick={() => onSelectToolMode('crosshair')}
            title="Инструмент: Курсор-линейка (значения под курсором)"
            className={`flex items-center space-x-1.5 px-3 h-7 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              toolMode === 'crosshair'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}>
            <Crosshair className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Курсор</span>
          </button>

          <button
            onClick={() => onSelectToolMode('pan')}
            title="Инструмент: Рука (Зажать мышь и двигать график по шкале времени)"
            className={`flex items-center space-x-1.5 px-3 h-7 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              toolMode === 'pan'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}>
            <Hand className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Рука (Pan)</span>
          </button>
        </div>
      </div>

      {/* Правая группа: Управление воспроизведением и Экспорт */}
      <div className="flex items-center space-x-2">
        {/* Кнопка Live / Pause */}
        <button
          onClick={onToggleLive}
          className={`flex items-center justify-center space-x-1.5 w-28 h-9 px-3 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
            isLive
              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
              : 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30'
          }`}>
          {isLive ? <Pause className="w-3.5 h-3.5 flex-shrink-0" /> : <Play className="w-3.5 h-3.5 flex-shrink-0" />}
          <span>{isLive ? 'ОНЛАЙН' : 'ПАУЗА'}</span>
        </button>

        {/* Сброс зума / Возврат в Real-time */}
        <button
          onClick={onResetZoom}
          title="Сбросить сдвиг и масштабирование (вернуться к текущему времени)"
          className="flex items-center justify-center space-x-1 px-3 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs transition-colors whitespace-nowrap">
          <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Сброс</span>
        </button>

        {/* Сохранить в пресет */}
        <button
          onClick={onSavePreset}
          className="flex items-center justify-center space-x-1.5 px-3 h-9 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-all whitespace-nowrap">
          <BookmarkPlus className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Сохранить пресет</span>
        </button>

        {/* Экспорт XLSX */}
        <button
          onClick={onExportXlsx}
          title="Экспортировать многостраничный отчет в Excel (XLSX)"
          className="flex items-center justify-center space-x-1.5 px-3 h-9 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm shadow-emerald-700/20">
          <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" />
          <span>XLSX</span>
        </button>

        {/* Экспорт CSV */}
        <button
          onClick={onExportCsv}
          title="Экспортировать данные в CSV"
          className="flex items-center justify-center space-x-1 px-2.5 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap">
          <Download className="w-3.5 h-3.5 flex-shrink-0" />
          <span>CSV</span>
        </button>

        {/* Экспорт PNG */}
        <button
          onClick={onExportPng}
          title="Снимок графика PNG"
          className="flex items-center justify-center w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs transition-colors whitespace-nowrap">
          <Camera className="w-4 h-4 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
};
