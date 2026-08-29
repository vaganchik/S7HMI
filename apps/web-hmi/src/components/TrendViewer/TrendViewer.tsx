import React, { useState, useEffect, useRef } from 'react';
import { TrendToolbar } from './TrendToolbar';
import { TrendSidebar } from './TrendSidebar';
import { TrendCanvas } from './TrendCanvas';
import { TrendStatisticsTable } from './TrendStatisticsTable';
import { FACTORY_PRESETS, PEN_COLORS } from '../../utils/defaultPresets';
import { exportTrendDataToXlsx } from '../../utils/xlsxExport';
import type { TrendPreset, TrendPen, TrendPoint, TrendPenStats } from '../../types/trends';
import type { PlcTagDefinition, TagValue } from '../../types/hmi';

interface TrendViewerProps {
  tags: PlcTagDefinition[];
  tagValues: Record<string, TagValue>;
  initialFocusTagId?: string | null;
}

export const TrendViewer: React.FC<TrendViewerProps> = ({ tags, tagValues, initialFocusTagId }) => {
  // 1. Состояние пресетов (заводские + сохраненные пользователем)
  const [presets, setPresets] = useState<TrendPreset[]>(() => {
    const saved = localStorage.getItem('s7_trend_presets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...FACTORY_PRESETS, ...parsed.filter((p: TrendPreset) => !p.isFactory)];
      } catch {
        return FACTORY_PRESETS;
      }
    }
    return FACTORY_PRESETS;
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(FACTORY_PRESETS[0].id);
  const [activePens, setActivePens] = useState<TrendPen[]>(FACTORY_PRESETS[0].pens);
  const [timeRangeSec, setTimeRangeSec] = useState<number>(300);
  const [timeOffsetSec, setTimeOffsetSec] = useState<number>(0);
  const [toolMode, setToolMode] = useState<'crosshair' | 'pan'>('crosshair');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [dataPoints, setDataPoints] = useState<TrendPoint[]>([]);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');

  const dataBufferRef = useRef<TrendPoint[]>([]);
  const tagValuesRef = useRef(tagValues);
  tagValuesRef.current = tagValues;

  // Авто-фокус на запрошенном теге из минитренда
  useEffect(() => {
    if (!initialFocusTagId) return;
    const tag = tags.find((t) => t.id === initialFocusTagId);
    if (tag) {
      setActivePens((prev) => {
        const exists = prev.find((p) => p.tagId === initialFocusTagId);
        if (exists) {
          return prev.map((p) => (p.tagId === initialFocusTagId ? { ...p, visible: true } : p));
        }
        const color = PEN_COLORS[prev.length % PEN_COLORS.length];
        const newPen: TrendPen = {
          tagId: tag.id,
          name: tag.name,
          color,
          unit: tag.engineeringUnit || '',
          axis: 'left',
          visible: true
        };
        return [...prev, newPen];
      });
      setActivePresetId(null);
    }
  }, [initialFocusTagId, tags]);

  // Загрузка начальной истории точек из SQLite / Backend API
  useEffect(() => {
    const fetchHistoryFromDb = async () => {
      const activeTagIds = activePens.filter((p) => p.visible).map((p) => p.tagId);
      if (activeTagIds.length === 0) return;

      try {
        const fromUtc = new Date(Date.now() - 86400 * 1000).toISOString();
        const toUtc = new Date().toISOString();
        const historyMap: Record<number, Record<string, number | null>> = {};

        for (const tagId of activeTagIds) {
          try {
            const res = await fetch(`/api/tags/${encodeURIComponent(tagId)}/history?from=${fromUtc}&to=${toUtc}&limit=1000`);
            if (res.ok) {
              const data = await res.json();
              data.forEach((item: any) => {
                const ts = Math.floor(new Date(item.timestamp).getTime() / 1000);
                if (!historyMap[ts]) historyMap[ts] = {};
                historyMap[ts][tagId] = item.valueNumeric;
              });
            }
          } catch {}
        }

        const loadedPoints: TrendPoint[] = Object.keys(historyMap)
          .map(Number)
          .sort((a, b) => a - b)
          .map((ts) => ({ timestamp: ts, values: historyMap[ts] }));

        if (loadedPoints.length > 0) {
          dataBufferRef.current = loadedPoints;
          setDataPoints(loadedPoints);
        }
      } catch (err) {
        console.warn('Failed to load initial history points', err);
      }
    };

    fetchHistoryFromDb();
  }, [activePresetId, activePens.length]);

  // 2. Сбор непрерывной телеметрии (стабильный интервал 1с без сброса таймера при апдейте тегов)
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const ptValues: Record<string, number | null> = {};
      const currentTagValues = tagValuesRef.current;

      // Заполняем актуальными значениями из tagValuesRef
      Object.keys(currentTagValues).forEach((tagId) => {
        const val = currentTagValues[tagId]?.value;
        ptValues[tagId] = typeof val === 'number' ? val : val === true ? 1 : val === false ? 0 : null;
      });

      // Синтетические данные для демонстрации если ПЛК оффлайн
      if (Object.keys(ptValues).length === 0) {
        ptValues['furnace.zone1.temperature'] = 190 + Math.sin(now / 5) * 5;
        ptValues['furnace.zone2.temperature'] = 245 + Math.cos(now / 7) * 4;
        ptValues['furnace.zone3.temperature'] = 242 + Math.sin(now / 6) * 3;
        ptValues['furnace.zone4.temperature'] = 239 + Math.cos(now / 8) * 3;
        ptValues['spinner.1.current'] = 14.2 + Math.sin(now / 4) * 1.5;
        ptValues['spinner.2.current'] = 14.2 + Math.cos(now / 4) * 1.2;
        ptValues['spinner.3.current'] = 14.6 + Math.sin(now / 3) * 1.8;
        ptValues['spinner.4.current'] = 14.9 + Math.cos(now / 3) * 1.6;
        ptValues['line.main.speed'] = 1.43 + Math.sin(now / 10) * 0.05;
        ptValues['line.carpet.density'] = 96.0 + Math.cos(now / 12) * 2.0;
        ptValues['kvo.drum.pressure'] = -2684 + Math.sin(now / 5) * 40;
      }

      const newPoint: TrendPoint = { timestamp: now, values: ptValues };
      dataBufferRef.current.push(newPoint);

      // Ограничиваем буфер размером окна (храним историю на 3 часа)
      const cutoff = now - Math.max(timeRangeSec * 3, 10800);
      dataBufferRef.current = dataBufferRef.current.filter((p) => p.timestamp >= cutoff);

      setDataPoints([...dataBufferRef.current]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, timeRangeSec]);

  // 3. Выбор пресета
  const handleSelectPreset = (p: TrendPreset) => {
    setActivePresetId(p.id);
    setActivePens(p.pens);
    setTimeRangeSec(p.timeRangeSec);
    setTimeOffsetSec(0);
  };

  // 4. Добавление/удаление тега вручную
  const handleToggleTag = (tag: PlcTagDefinition) => {
    const existing = activePens.find((p) => p.tagId === tag.id);
    if (existing) {
      setActivePens(activePens.filter((p) => p.tagId !== tag.id));
    } else {
      const color = PEN_COLORS[activePens.length % PEN_COLORS.length];
      const newPen: TrendPen = {
        tagId: tag.id,
        name: tag.name,
        color,
        unit: tag.engineeringUnit || '',
        axis: 'left',
        visible: true
      };
      setActivePens([...activePens, newPen]);
    }
    setActivePresetId(null);
  };

  // 5. Видимость, цвета, шкалы перьев
  const handleTogglePenVisibility = (tagId: string) => {
    setActivePens(activePens.map((p) => (p.tagId === tagId ? { ...p, visible: !p.visible } : p)));
  };

  const handleChangePenColor = (tagId: string, color: string) => {
    setActivePens((prev) => prev.map((p) => (p.tagId === tagId ? { ...p, color } : p)));
  };

  const handleChangePenAxis = (tagId: string, axis: 'left' | 'right') => {
    setActivePens((prev) => prev.map((p) => (p.tagId === tagId ? { ...p, axis } : p)));
  };

  const handleChangePenRange = (tagId: string, minRange?: number, maxRange?: number) => {
    setActivePens((prev) => prev.map((p) => (p.tagId === tagId ? { ...p, minRange, maxRange } : p)));
  };

  const handleRemovePen = (tagId: string) => {
    setActivePens(activePens.filter((p) => p.tagId !== tagId));
  };

  // 6. Сдвиг времени при панорамировании «Рукой»
  const handleTimeOffsetChange = (offset: number) => {
    setTimeOffsetSec(offset);
    if (offset > 0 && isLive) {
      setIsLive(false); // Авто-пауза при скролле в прошлое
    }
  };

  const handleResetZoom = () => {
    setTimeOffsetSec(0);
    setTimeRangeSec(300);
    setIsLive(true);
  };

  // 7. Сохранение нового пользовательского пресета
  const handleSaveUserPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: TrendPreset = {
      id: `user.preset.${Date.now()}`,
      name: newPresetName.trim(),
      icon: '⭐',
      section: 'Пользовательский',
      isFactory: false,
      timeRangeSec,
      pens: activePens
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    setActivePresetId(newPreset.id);

    const userOnly = updatedPresets.filter((p) => !p.isFactory);
    localStorage.setItem('s7_trend_presets', JSON.stringify(userOnly));

    setShowSaveModal(false);
    setNewPresetName('');
  };

  const handleDeleteUserPreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    const userOnly = updated.filter((p) => !p.isFactory);
    localStorage.setItem('s7_trend_presets', JSON.stringify(userOnly));
  };

  // 8. Экспорт CSV
  const handleExportCsv = () => {
    if (dataPoints.length === 0) return;
    const headers = ['Timestamp', 'DateTime', ...activePens.map((p) => `${p.name} [${p.unit}]`)].join(',');
    const rows = dataPoints.map((pt) => {
      const dt = new Date(pt.timestamp * 1000).toISOString();
      const vals = activePens.map((p) => pt.values[p.tagId] ?? '');
      return [pt.timestamp, dt, ...vals].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `scada_trend_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 9. Экспорт XLSX
  const handleExportXlsx = () => {
    exportTrendDataToXlsx({
      pens: activePens.filter((p) => p.visible),
      data: dataPoints,
      stats,
      timeRangeSec
    });
  };

  // 10. Экспорт PNG
  const handleExportPng = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const imgUri = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.setAttribute('href', imgUri);
    link.setAttribute('download', `scada_trend_snapshot_${Date.now()}.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 11. Расчет статистических показателей перьев
  const stats: Record<string, TrendPenStats> = {};
  activePens.forEach((p) => {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let count = 0;
    let last = 0;

    dataPoints.forEach((d) => {
      const v = d.values[p.tagId];
      if (v !== undefined && v !== null) {
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
        count++;
        last = v;
      }
    });

    stats[p.tagId] = {
      tagId: p.tagId,
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max,
      avg: count > 0 ? sum / count : 0,
      last,
      delta: min === Infinity || max === -Infinity ? 0 : max - min
    };
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Верхняя панель инструментов */}
      <TrendToolbar
        timeRangeSec={timeRangeSec}
        onSelectTimeRange={(sec) => {
          setTimeRangeSec(sec);
          setTimeOffsetSec(0);
        }}
        isLive={isLive}
        onToggleLive={() => setIsLive(!isLive)}
        toolMode={toolMode}
        onSelectToolMode={setToolMode}
        onSavePreset={() => setShowSaveModal(true)}
        onExportCsv={handleExportCsv}
        onExportXlsx={handleExportXlsx}
        onExportPng={handleExportPng}
        onResetZoom={handleResetZoom}
      />

      {/* Основная рабочая область: Двухоконная компоновка */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Левая панель: Пресеты и теги */}
        <div className="lg:col-span-1">
          <TrendSidebar
            presets={presets}
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
            onDeleteUserPreset={handleDeleteUserPreset}
            allTags={tags}
            tagValues={tagValues}
            activePens={activePens}
            onToggleTag={handleToggleTag}
          />
        </div>

        {/* Центральная часть: График и таблица статистики */}
        <div className="lg:col-span-3 space-y-4">
          <TrendCanvas
            pens={activePens}
            data={dataPoints}
            timeRangeSec={timeRangeSec}
            toolMode={toolMode}
            timeOffsetSec={timeOffsetSec}
            onTimeOffsetChange={handleTimeOffsetChange}
            onZoomTimeRange={setTimeRangeSec}
          />

          <TrendStatisticsTable
            pens={activePens}
            stats={stats}
            onTogglePenVisibility={handleTogglePenVisibility}
            onChangePenColor={handleChangePenColor}
            onChangePenAxis={handleChangePenAxis}
            onChangePenRange={handleChangePenRange}
            onRemovePen={handleRemovePen}
          />
        </div>
      </div>

      {/* Модальное окно сохранения пресета */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Сохранить текущую группу тегов в пресет</h3>
            <div className="space-y-2 text-xs">
              <label className="text-slate-400 block">Название пресета:</label>
              <input
                type="text"
                placeholder="Например: Температуры печи и вентиляторы"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                Будет сохранено перьев: <strong>{activePens.length}</strong>, интервал: <strong>{timeRangeSec} сек</strong>.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">
                Отмена
              </button>
              <button
                onClick={handleSaveUserPreset}
                disabled={!newPresetName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
