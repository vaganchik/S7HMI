import React, { useState, useMemo } from 'react';
import {
  Server,
  Layers,
  Search,
  Zap,
  Activity,
  CheckCircle2,
  FileSpreadsheet,
  Cpu,
  Eye,
  Sliders,
  Filter,
  Flame,
  Wind,
  Scissors
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PLANT_CABINETS, PLANT_EQUIPMENT } from '../../data/plantEquipmentData';
import type { PlantEquipmentNode, EquipmentAreaId, DriveControlType } from '../../types/equipment';
import type { MechanismTelemetry } from '../../types/scada';

interface EquipmentScreenProps {
  onSelectMechanism?: (mech: MechanismTelemetry) => void;
}

export const EquipmentScreen: React.FC<EquipmentScreenProps> = ({ onSelectMechanism }) => {
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState<EquipmentAreaId | 'all'>('all');
  const [selectedCabinet, setSelectedCabinet] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<DriveControlType | 'all'>('all');

  // Участки
  const areas: { id: EquipmentAreaId | 'all'; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Вся линия (255)', count: PLANT_EQUIPMENT.length, icon: <Layers className="w-4 h-4" /> },
    { id: 'spinner', label: 'Центрифуга (32)', count: PLANT_EQUIPMENT.filter(e => e.area === 'spinner').length, icon: <Wind className="w-4 h-4 text-cyan-400" /> },
    { id: 'kvo', label: 'КВО и Маятник (53)', count: PLANT_EQUIPMENT.filter(e => e.area === 'kvo').length, icon: <Layers className="w-4 h-4 text-blue-400" /> },
    { id: 'crimper', label: 'Гофрировщик (97)', count: PLANT_EQUIPMENT.filter(e => e.area === 'crimper').length, icon: <Sliders className="w-4 h-4 text-purple-400" /> },
    { id: 'oven', label: 'Печь КП (50)', count: PLANT_EQUIPMENT.filter(e => e.area === 'oven').length, icon: <Flame className="w-4 h-4 text-amber-400" /> },
    { id: 'cutting', label: 'Пилы и резка (23)', count: PLANT_EQUIPMENT.filter(e => e.area === 'cutting').length, icon: <Scissors className="w-4 h-4 text-emerald-400" /> },
  ];

  // Фильтрованные шкафы
  const filteredCabinets = useMemo(() => {
    if (selectedArea === 'all') return PLANT_CABINETS;
    return PLANT_CABINETS.filter((c) => c.area === selectedArea);
  }, [selectedArea]);

  // Фильтрованное оборудование
  const filteredEquipment = useMemo(() => {
    return PLANT_EQUIPMENT.filter((item) => {
      const matchArea = selectedArea === 'all' || item.area === selectedArea;
      const matchCabinet = selectedCabinet === 'all' || item.cabinet === selectedCabinet;
      const matchType = selectedType === 'all' || item.driveType === selectedType;
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.driveName.toLowerCase().includes(search.toLowerCase()) ||
        item.schemeName.toLowerCase().includes(search.toLowerCase()) ||
        item.cabinet.toLowerCase().includes(search.toLowerCase());

      return matchArea && matchCabinet && matchType && matchSearch;
    });
  }, [selectedArea, selectedCabinet, selectedType, search]);

  // Расчет KPI
  const totalPower = useMemo(() => {
    return PLANT_EQUIPMENT.reduce((sum, item) => sum + item.powerKw, 0).toFixed(1);
  }, []);

  const totalG120 = useMemo(() => {
    return PLANT_EQUIPMENT.filter((i) => i.driveType === 'G120').length;
  }, []);

  const totalDOL = useMemo(() => {
    return PLANT_EQUIPMENT.filter((i) => i.driveType === 'DOL' || i.driveType === 'Motor').length;
  }, []);

  const totalSensors = useMemo(() => {
    return PLANT_EQUIPMENT.filter((i) => i.driveType === 'Encoder' || i.driveType === 'Sensor').length;
  }, []);

  // Экспорт в Excel (XLSX)
  const handleExportXlsx = () => {
    const exportData = filteredEquipment.map((item, idx) => ({
      '№': idx + 1,
      'Участок': item.areaName,
      'Шкаф': item.cabinet,
      'Позиция схемы': item.schemeName,
      'Код привода': item.driveName,
      'Наименование агрегата': item.displayName,
      'Тип управления': item.driveType === 'G120' ? 'ЧРП Sinamics G120' : item.driveType === 'DOL' ? 'Контактор (Прямой пуск)' : item.driveType,
      'Мощность (кВт)': item.powerKw,
      'Номинальный ток (А)': item.nominalCurrentA,
      'Номинальные об/мин': item.nominalRpm,
      'ID узла': item.id
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Оборудование линии');
    XLSX.writeFile(wb, `Plant_Equipment_Tree_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleOpenMechanism = (item: PlantEquipmentNode) => {
    if (!onSelectMechanism) return;

    const mech: MechanismTelemetry = {
      id: item.driveName || item.id,
      name: item.displayName,
      section: item.areaName,
      type: 'motor',
      state: 'running',
      mode: 'auto',
      cabinet: item.cabinet,
      schemeName: item.schemeName,
      driveName: item.driveName,
      powerKw: item.powerKw,
      nominalCurrentA: item.nominalCurrentA,
      speedMPerMin: 12.5,
      frequencyActualHz: item.driveType === 'G120' ? 48.5 : 50.0,
      frequencySetpointHz: 50.0,
      currentAmps: item.nominalCurrentA,
      temperatureC: 42.5,
      runningHours: 1420.5
    };

    onSelectMechanism(mech);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Главный заголовок экрана */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-2xl text-blue-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-wide">
                ОБОРУДОВАНИЕ И ШКАФЫ УПРАВЛЕНИЯ ЛИНИИ
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                255 ЕДИНИЦ &bull; 24 ШКАФА
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Полный реестр электроприводов, шкафов Siemens S7-1500 / Sinamics G120 и датчиков завода минеральной ваты
            </p>
          </div>
        </div>

        {/* Экспорт в Excel */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportXlsx}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Экспорт спецификации в Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Сводные KPI парка оборудования */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Установленная мощность */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Установленная мощность</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{totalPower} <span className="text-xs text-slate-400 font-sans">кВт</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Всего 255 потребителей линии</div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* ЧРП Sinamics G120 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Частотные приводы (G120)</div>
            <div className="text-2xl font-black text-cyan-400 font-mono mt-1">{totalG120} <span className="text-xs text-slate-400 font-sans">шт.</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Векторное управление PZD1/2</div>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Прямой пуск (DOL) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Контакторные приводы (DOL)</div>
            <div className="text-2xl font-black text-purple-400 font-mono mt-1">{totalDOL} <span className="text-xs text-slate-400 font-sans">шт.</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Вентиляторы обдува и насосы</div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Энкодеры и датчики */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Энкодеры и датчики высоты</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{totalSensors} <span className="text-xs text-slate-400 font-sans">шт.</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Синхронизация скоростей и толщины</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Фильтрация по Участкам (Табы) */}
      <div className="flex flex-wrap items-center gap-2">
        {areas.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setSelectedArea(a.id);
              setSelectedCabinet('all');
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedArea === a.id
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {a.icon}
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* 4. Сетка шкафов управления (Шкафная матрица) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <span>Шкафы управления технологического участка ({filteredCabinets.length}):</span>
          </h3>
          {selectedCabinet !== 'all' && (
            <button
              onClick={() => setSelectedCabinet('all')}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              Сбросить фильтр по шкафу &times;
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredCabinets.map((cab) => {
            const isSelected = selectedCabinet === cab.id;
            return (
              <div
                key={cab.id}
                onClick={() => setSelectedCabinet(isSelected ? 'all' : cab.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono text-sm">{cab.id}</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-1">{cab.name}</div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{cab.drivesCount} приводов</span>
                  <span className="text-amber-400 font-bold">{cab.totalPowerKw} кВт</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Поиск, фильтры и реестр оборудования */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Реестр механизмов и приводов ({filteredEquipment.length} из {PLANT_EQUIPMENT.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Кликните на строку механизма для вызова фейсплейта ручного управления и проверки блокировок
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Фильтр по типу привода */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Тип:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DriveControlType | 'all')}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="all">Все типы</option>
                <option value="G120">Sinamics G120 (ЧРП)</option>
                <option value="DOL">Контактор (DOL)</option>
                <option value="Encoder">Энкодер</option>
                <option value="Sensor">Датчик высоты / Laser</option>
              </select>
            </div>

            {/* Строка поиска */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по названию, схеме (31VC1), шкафу..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Таблица оборудования */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Поз. схемы / Привод</th>
                <th className="px-4 py-3">Шкаф</th>
                <th className="px-4 py-3">Наименование механизма</th>
                <th className="px-4 py-3">Участок</th>
                <th className="px-4 py-3 text-center">Тип управления</th>
                <th className="px-4 py-3 text-right">Мощность</th>
                <th className="px-4 py-3 text-right">Ном. ток</th>
                <th className="px-4 py-3 text-center">Статус</th>
                <th className="px-4 py-3 text-center">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEquipment.map((item) => {
                return (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenMechanism(item)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{item.driveName || '---'}</div>
                      <div className="text-[11px] text-cyan-400 font-mono">Схема: {item.schemeName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-amber-400 border border-slate-700">
                        {item.cabinet}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <div className="font-semibold text-slate-200">{item.displayName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.id}</div>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className="text-slate-300 text-xs">{item.areaName}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-sans">
                      {item.driveType === 'G120' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Activity className="w-3 h-3" /> G120 (ЧРП)
                        </span>
                      )}
                      {item.driveType === 'DOL' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Cpu className="w-3 h-3" /> DOL (Контактор)
                        </span>
                      )}
                      {item.driveType === 'Encoder' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Энкодер
                        </span>
                      )}
                      {item.driveType === 'Sensor' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Eye className="w-3 h-3" /> Датчик высоты
                        </span>
                      )}
                      {item.driveType === 'Motor' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Zap className="w-3 h-3" /> Двигатель
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white">
                      {item.powerKw > 0 ? `${item.powerKw} кВт` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {item.nominalCurrentA > 0 ? `${item.nominalCurrentA} А` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Готов
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMechanism(item);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-[11px] font-sans font-semibold transition-colors"
                      >
                        Управление
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
