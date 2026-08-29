import React, { useState, useEffect } from 'react';
import { Search, Edit3, CheckCircle2, XCircle, RefreshCw, Database, Settings2, LineChart, Cpu } from 'lucide-react';
import { TagQuality } from '../types/hmi';
import type { PlcTagDefinition, TagValue, PlcStatus } from '../types/hmi';

interface TagTableProps {
  tags: PlcTagDefinition[];
  tagValues: Record<string, TagValue>;
  onWriteTag: (tagId: string, value: any) => Promise<boolean>;
  onSelectAnalogTag?: (tag: PlcTagDefinition) => void;
  onOpenTrend?: (tagId: string) => void;
  plcStatus?: PlcStatus | null;
}

export const TagTable: React.FC<TagTableProps> = ({
  tags,
  tagValues,
  onWriteTag,
  onSelectAnalogTag,
  onOpenTrend,
  plcStatus
}) => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<PlcTagDefinition | null>(null);
  const [writeValue, setWriteValue] = useState('');
  const [isWriting, setIsWriting] = useState(false);

  // Глобальная частота опроса / период архивации
  const [globalArchiveInterval, setGlobalArchiveInterval] = useState<number>(1000);
  const [isUpdatingGlobalInterval, setIsUpdatingGlobalInterval] = useState(false);

  // Состояние настройки архивации конкретного тега
  const [archiveConfigTag, setArchiveConfigTag] = useState<PlcTagDefinition | null>(null);
  const [archiveEnabled, setArchiveEnabled] = useState(true);
  const [archiveIntervalMs, setArchiveIntervalMs] = useState(1000);
  const [deadband, setDeadband] = useState(0.5);
  const [isSavingArchive, setIsSavingArchive] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/archiver/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.defaultIntervalMs) {
          setGlobalArchiveInterval(data.defaultIntervalMs);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectGlobalInterval = async (ms: number) => {
    setGlobalArchiveInterval(ms);
    setIsUpdatingGlobalInterval(true);
    try {
      await fetch('http://localhost:5000/api/archiver/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultIntervalMs: ms })
      });
    } catch (err) {
      console.warn('Failed to update archiver interval', err);
    } finally {
      setIsUpdatingGlobalInterval(false);
    }
  };

  const filteredTags = tags.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.plcId.toLowerCase().includes(search.toLowerCase())
  );

  const formatAddress = (addr: any) => {
    if (!addr) return '---';
    if (typeof addr === 'string') return addr;
    if (addr.dbNumber !== undefined) {
      if (addr.bitNumber !== undefined && addr.bitNumber >= 0 && addr.dataType === 1) {
        return `DB${addr.dbNumber}.DBX${addr.startByte}.${addr.bitNumber}`;
      }
      return `DB${addr.dbNumber}.DBD${addr.startByte}`;
    }
    return `Byte ${addr.startByte}`;
  };

  const handleWriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTag) return;

    setIsWriting(true);
    try {
      let parsedValue: any = writeValue;
      if (writeValue.toLowerCase() === 'true') parsedValue = true;
      else if (writeValue.toLowerCase() === 'false') parsedValue = false;
      else if (!isNaN(Number(writeValue))) parsedValue = Number(writeValue);

      await onWriteTag(selectedTag.id, parsedValue);
      setSelectedTag(null);
      setWriteValue('');
    } finally {
      setIsWriting(false);
    }
  };

  const handleOpenArchiveModal = (tag: PlcTagDefinition) => {
    setArchiveConfigTag(tag);
    setArchiveEnabled(tag.archiveEnabled ?? true);
    setArchiveIntervalMs(tag.archiveIntervalMs || globalArchiveInterval || 1000);
    setDeadband(tag.deadband || 0.5);
  };

  const handleSaveArchiveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveConfigTag) return;

    setIsSavingArchive(true);
    try {
      const res = await fetch(`http://localhost:5000/api/tags/${encodeURIComponent(archiveConfigTag.id)}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archiveEnabled,
          archiveIntervalMs,
          deadband
        })
      });

      if (res.ok) {
        archiveConfigTag.archiveEnabled = archiveEnabled;
        archiveConfigTag.archiveIntervalMs = archiveIntervalMs;
        archiveConfigTag.deadband = deadband;
        setArchiveConfigTag(null);
      }
    } finally {
      setIsSavingArchive(false);
    }
  };

  const getQualityBadge = (quality?: number) => {
    if (quality === TagQuality.Good) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Good
        </span>
      );
    }
    if (quality === TagQuality.Uncertain) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <RefreshCw className="w-3 h-3 animate-spin" /> Uncertain
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <XCircle className="w-3 h-3" /> Bad
      </span>
    );
  };

  const plcName = plcStatus?.name || 'Siemens S7-1500 Main';
  const plcIp = plcStatus?.ipAddress || '192.168.0.1';
  const plcPort = plcStatus?.port || 102;
  const isConnected = plcStatus?.isConnected ?? true;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
      {/* Шапка таблицы и инфо-блок опрашиваемого ПЛК */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Реестр переменных и тегов контроллера</h2>
          <p className="text-xs text-slate-400">Настройка частоты опроса, архивации (по умолч. 1000 мс) и запись значений</p>
        </div>

        {/* Блок настроек: Опрашиваемый ПЛК + Частота опроса */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Настройка глобальной частоты опроса/архивации */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Database className={`w-4 h-4 ${isUpdatingGlobalInterval ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
            <span className="text-slate-400 font-medium">Частота опроса:</span>
            <select
              value={globalArchiveInterval}
              onChange={(e) => handleSelectGlobalInterval(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 text-xs cursor-pointer hover:border-slate-600"
            >
              <option value={100}>100 мс (10 Гц)</option>
              <option value={250}>250 мс (4 Гц)</option>
              <option value={500}>500 мс (2 Гц)</option>
              <option value={1000}>1000 мс (1 Гц - Дефолт)</option>
              <option value={2000}>2000 мс (0.5 Гц)</option>
              <option value={5000}>5000 мс (0.2 Гц)</option>
            </select>
          </div>

          {/* Информационный бейдж опрашиваемого ПЛК */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">ПЛК:</span>
              <strong className="text-white font-bold">{plcName}</strong>
              <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px]">
                {plcStatus?.id || 'PLC-1'}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <span className="font-mono text-slate-400">{plcIp}:{plcPort}</span>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Поиск */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по тегам, DB или адресу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Идентификатор тега</th>
              <th className="px-4 py-3">ПЛК</th>
              <th className="px-4 py-3">Категория</th>
              <th className="px-4 py-3">S7 Адрес</th>
              <th className="px-4 py-3 text-right">Значение</th>
              <th className="px-4 py-3">Ед. изм.</th>
              <th className="px-4 py-3">Частота опроса / Архив</th>
              <th className="px-4 py-3">Качество</th>
              <th className="px-4 py-3 text-center">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredTags.map((tag) => {
              const val = tagValues[tag.id];
              const displayVal =
                val?.value !== undefined && val?.value !== null
                  ? typeof val.value === 'number'
                    ? val.value.toFixed(2)
                    : String(val.value)
                  : '---';

              return (
                <tr key={tag.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-blue-400">{tag.id}</div>
                    <div className="text-[11px] font-sans text-slate-400">{tag.name}</div>
                  </td>
                  {/* Колонка ПЛК */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-400 border border-slate-700">
                      <Cpu className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                      <span className="font-sans">{plcName.replace(' Main', '')}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-sans border border-slate-700">
                      {tag.category || 'Analog'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {formatAddress(tag.address)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-white text-sm">
                    {displayVal}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-sans">{tag.engineeringUnit || '—'}</td>
                  <td className="px-4 py-3">
                    {tag.archiveEnabled !== false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                        <Database className="w-3 h-3" /> {tag.archiveIntervalMs || globalArchiveInterval || 1000}мс
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-500 font-sans">
                        Откл.
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{getQualityBadge(val?.quality)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      {/* Кнопка "Перейти в тренды" */}
                      {onOpenTrend && (
                        <button
                          onClick={() => onOpenTrend(tag.id)}
                          title="Открыть тренд этой переменной"
                          className="p-1.5 bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors border border-slate-700/60"
                        >
                          <LineChart className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Кнопка "Мини-график" */}
                      {tag.category !== 'Discrete' && onSelectAnalogTag && (
                        <button
                          onClick={() => onSelectAnalogTag(tag)}
                          title="Просмотреть минитренд"
                          className="p-1.5 bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-400 rounded-lg transition-colors border border-slate-700/60"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Кнопка настройки архивации */}
                      <button
                        onClick={() => handleOpenArchiveModal(tag)}
                        title="Настройка параметров опроса и архивации"
                        className="p-1.5 bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-400 rounded-lg transition-colors border border-slate-700/60"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Кнопка записи */}
                      <button
                        onClick={() => {
                          setSelectedTag(tag);
                          setWriteValue(val?.value !== undefined ? String(val.value) : '');
                        }}
                        title="Записать значение в ПЛК"
                        className="p-1.5 bg-slate-800 hover:bg-amber-600/30 text-slate-300 hover:text-amber-400 rounded-lg transition-colors border border-slate-700/60"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Модальное окно записи значения в ПЛК */}
      {selectedTag && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              <span>Запись значения в контроллер</span>
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400 font-sans">Тег: <strong className="text-white font-mono">{selectedTag.id}</strong></div>
              <div className="text-slate-400 font-sans">Имя: <span className="text-slate-200">{selectedTag.name}</span></div>
              <div className="text-slate-400 font-sans">Категория: <span className="text-cyan-400 font-mono">{selectedTag.category || 'Analog'}</span></div>
              <div className="text-slate-400 font-sans">Адрес: <span className="text-amber-400 font-mono">{formatAddress(selectedTag.address)}</span></div>
            </div>

            <form onSubmit={handleWriteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Новое значение:
                </label>
                {selectedTag.category === 'Discrete' ? (
                  <select
                    value={writeValue}
                    onChange={(e) => setWriteValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="true">TRUE (1)</option>
                    <option value="false">FALSE (0)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    autoFocus
                    required
                    value={writeValue}
                    onChange={(e) => setWriteValue(e.target.value)}
                    placeholder="Введите значение..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isWriting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
                >
                  {isWriting ? 'Запись...' : 'Применить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно настройки архивации тега */}
      {archiveConfigTag && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              <span>Параметры архивации переменной</span>
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400 font-sans">Тег: <strong className="text-white font-mono">{archiveConfigTag.id}</strong></div>
              <div className="text-slate-400 font-sans">Описание: <span className="text-slate-200">{archiveConfigTag.name}</span></div>
            </div>

            <form onSubmit={handleSaveArchiveConfig} className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="archiveEnabled"
                  checked={archiveEnabled}
                  onChange={(e) => setArchiveEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 focus:ring-0"
                />
                <label htmlFor="archiveEnabled" className="text-xs font-semibold text-slate-200 cursor-pointer">
                  Включить циклическую архивацию в SQLite
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Период опроса / архивации (мс):
                </label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  required
                  value={archiveIntervalMs}
                  onChange={(e) => setArchiveIntervalMs(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  По умолчанию: {globalArchiveInterval} мс.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Зона нечувствительности (Deadband):
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  required
                  value={deadband}
                  onChange={(e) => setDeadband(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Запись в БД только при изменении значения более чем на указанную дельту.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setArchiveConfigTag(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSavingArchive}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20"
                >
                  {isSavingArchive ? 'Сохранение...' : 'Сохранить настройки'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
