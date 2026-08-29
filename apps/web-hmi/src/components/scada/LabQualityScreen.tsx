import React, { useState } from 'react';
import {
  FlaskConical,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  X,
  Scale,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../types/auth';
import type { ProductRecipe } from '../../types/recipe';
import type { QcMeasurementRecord, QcSampleStatus } from '../../types/qc';
import { DEFAULT_QC_RECORDS } from '../../data/defaultQcRecords';

interface LabQualityScreenProps {
  activeRecipe?: ProductRecipe | null;
}

export const LabQualityScreen: React.FC<LabQualityScreenProps> = ({ activeRecipe }) => {
  const { currentUser } = useAuth();

  const [records, setRecords] = useState<QcMeasurementRecord[]>(() => {
    const saved = localStorage.getItem('scada_qc_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_QC_RECORDS;
      }
    }
    return DEFAULT_QC_RECORDS;
  });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Форма добавления нового замера
  const [formBatch, setFormBatch] = useState(`BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`);
  const [formPallet, setFormPallet] = useState(`PAL-${Math.floor(100 + Math.random() * 900)}`);
  const [formDensity, setFormDensity] = useState(activeRecipe?.targetDensityKgM3 ?? 115);
  const [formThickness, setFormThickness] = useState(activeRecipe?.thicknessMm ?? 100);
  const [formLength, setFormLength] = useState(1200);
  const [formWidth, setFormWidth] = useState(600);
  const [formCompressive, setFormCompressive] = useState(45.0);
  const [formTensile, setFormTensile] = useState(12.0);
  const [formBinder, setFormBinder] = useState(3.8);
  const [formWater, setFormWater] = useState(0.45);
  const [formThermal, setFormThermal] = useState(0.0365);
  const [formMoisture, setFormMoisture] = useState(0.2);
  const [formStatus, setFormStatus] = useState<QcSampleStatus>('passed');
  const [formNotes, setFormNotes] = useState('');

  const targetDensity = activeRecipe?.targetDensityKgM3 ?? 115;
  const targetThickness = activeRecipe?.thicknessMm ?? 100;

  // Сохранение в localStorage
  const saveRecords = (newRecords: QcMeasurementRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('scada_qc_records', JSON.stringify(newRecords));
  };

  const handleOpenAddModal = () => {
    setFormBatch(`BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0${records.length + 1}`);
    setFormPallet(`PAL-${Math.floor(100 + Math.random() * 900)}`);
    setFormDensity(targetDensity);
    setFormThickness(targetThickness);
    setFormLength(1200);
    setFormWidth(600);
    setFormCompressive(45.0);
    setFormTensile(12.0);
    setFormBinder(3.8);
    setFormWater(0.45);
    setFormThermal(0.0365);
    setFormMoisture(0.2);
    setFormStatus('passed');
    setFormNotes('Контроль качества пройден. Параметры в допуске.');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const deviation = Number((((formDensity - targetDensity) / targetDensity) * 100).toFixed(2));

    const newRecord: QcMeasurementRecord = {
      id: `QC-${Date.now().toString().slice(-8)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      batchNumber: formBatch.trim(),
      palletNumber: formPallet.trim(),
      recipeId: activeRecipe?.id || 'TR-N-EXTRA-100',
      recipeName: activeRecipe?.name || 'ТЕХНОРУФ Н ЭКСТРА 1200x600x100',
      shift: currentUser.shift || 'Смена #1 (Дневная)',
      inspectorName: currentUser.fullName,
      inspectorUsername: currentUser.username,
      inspectorRole: currentUser.role,
      densityActualKgM3: Number(formDensity),
      densityTargetKgM3: targetDensity,
      densityDeviationPercent: deviation,
      thicknessActualMm: Number(formThickness),
      thicknessTargetMm: targetThickness,
      lengthActualMm: Number(formLength),
      widthActualMm: Number(formWidth),
      compressiveStrengthKPa: Number(formCompressive),
      tensileStrengthKPa: Number(formTensile),
      binderContentPercent: Number(formBinder),
      waterAbsorptionKgM2: Number(formWater),
      thermalConductivity: Number(formThermal),
      moisturePercent: Number(formMoisture),
      status: formStatus,
      notes: formNotes.trim()
    };

    saveRecords([newRecord, ...records]);
    setIsAddModalOpen(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Удалить эту запись лабораторного контроля?')) {
      saveRecords(records.filter((r) => r.id !== id));
    }
  };

  // Экспорт в Excel (XLSX)
  const handleExportXlsx = () => {
    const exportData = filteredRecords.map((r, idx) => ({
      '№': idx + 1,
      'Дата и время': r.timestamp,
      'Партия': r.batchNumber,
      'Паллета': r.palletNumber,
      'Марка продукта': r.recipeName,
      'Смена': r.shift,
      'Контролер / Лаборант': `${r.inspectorName} (${USER_ROLES[r.inspectorRole]?.labelRu || r.inspectorRole})`,
      'Плотность факт (кг/м³)': r.densityActualKgM3,
      'Плотность уставка (кг/м³)': r.densityTargetKgM3,
      'Отклонение плотности (%)': r.densityDeviationPercent,
      'Толщина факт (мм)': r.thicknessActualMm,
      'Толщина уставка (мм)': r.thicknessTargetMm,
      'Сжатие 10% (кПа)': r.compressiveStrengthKPa,
      'Отрыв слоев (кПа)': r.tensileStrengthKPa,
      'Связующее (%)': r.binderContentPercent,
      'Водопоглощение (кг/м²)': r.waterAbsorptionKgM2,
      'Теплопроводность (Вт/м·К)': r.thermalConductivity,
      'Влажность (%)': r.moisturePercent,
      'Заключение':
        r.status === 'passed'
          ? 'ГОДЕН'
          : r.status === 'warning'
          ? 'УСЛОВНО ГОДЕН'
          : r.status === 'rejected'
          ? 'БРАК'
          : 'НА ДОРАБОТКУ',
      'Примечания': r.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Журнал ОТК');
    XLSX.writeFile(wb, `QC_Lab_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.palletNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.recipeName.toLowerCase().includes(search.toLowerCase()) ||
      r.inspectorName.toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // KPI Статистика
  const totalSamples = records.length;
  const passedSamples = records.filter((r) => r.status === 'passed').length;
  const warningSamples = records.filter((r) => r.status === 'warning').length;
  const rejectedSamples = records.filter((r) => r.status === 'rejected').length;
  const passRate = totalSamples > 0 ? ((passedSamples / totalSamples) * 100).toFixed(1) : '100';

  const avgDensity =
    totalSamples > 0
      ? (records.reduce((acc, r) => acc + r.densityActualKgM3, 0) / totalSamples).toFixed(1)
      : '0.0';

  const avgStrength =
    totalSamples > 0
      ? (records.reduce((acc, r) => acc + r.compressiveStrengthKPa, 0) / totalSamples).toFixed(1)
      : '0.0';

  const avgBinder =
    totalSamples > 0
      ? (records.reduce((acc, r) => acc + r.binderContentPercent, 0) / totalSamples).toFixed(2)
      : '0.00';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Главная шапка экрана лабораторного контроля */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-2xl text-teal-400">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-wide">
                ЛАБОРАТОРНЫЙ КОНТРОЛЬ И ОТК (QUALITY CONTROL)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                ГОСТ 9573 / ISO 9001
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Внесение и протоколирование замеров качества минераловатной продукции (Лаборанты, Операторы, ОТК)
            </p>
          </div>
        </div>

        {/* Кнопки действий: Добавить замер + Экспорт Excel */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportXlsx}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Экспорт в Excel</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-teal-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Внести замер качества</span>
          </button>
        </div>
      </div>

      {/* 2. Виджеты KPI и качества продукции */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Доля годности */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Доля годной продукции</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{passRate}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Годных: {passedSamples} &bull; Предупреждений: {warningSamples} &bull; Брак: {rejectedSamples}
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Средняя плотность */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Средняя плотность факт</div>
            <div className="text-2xl font-black text-cyan-400 font-mono mt-1">{avgDensity} <span className="text-xs text-slate-400 font-sans">кг/м³</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Уставка на линии: {targetDensity} кг/м³
            </div>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Средняя прочность на сжатие */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Прочность на сжатие (10%)</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{avgStrength} <span className="text-xs text-slate-400 font-sans">кПа</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Норматив ГОСТ: &ge; 40 кПа
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Содержание связующего */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Содержание связующего</div>
            <div className="text-2xl font-black text-purple-400 font-mono mt-1">{avgBinder}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Оптимум: 3.50% &ndash; 4.20%
            </div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <FlaskConical className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Фильтры и поиск */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по номеру партии, паллете, марке или ФИО..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Фильтр по статусу */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'Все замеры' },
            { id: 'passed', label: 'Годен' },
            { id: 'warning', label: 'Предупреждение' },
            { id: 'rejected', label: 'Брак' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filterStatus === st.id
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Таблица протоколов испытаний ОТК */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Дата / Партия</th>
                <th className="px-4 py-3">Марка продукта</th>
                <th className="px-4 py-3">Проверяющий (ОТК)</th>
                <th className="px-4 py-3 text-right">Плотность (факт / уставка)</th>
                <th className="px-4 py-3 text-right">Толщина (факт / уставка)</th>
                <th className="px-4 py-3 text-right">Сжатие 10%</th>
                <th className="px-4 py-3 text-right">Связующее</th>
                <th className="px-4 py-3 text-center">Заключение</th>
                <th className="px-4 py-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRecords.map((r) => {
                const isPassed = r.status === 'passed';
                const isWarning = r.status === 'warning';
                const isRejected = r.status === 'rejected';

                return (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Дата и партия */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{r.batchNumber}</span>
                        <span className="text-[10px] text-teal-400 font-mono bg-teal-500/10 px-1 py-0.2 rounded border border-teal-500/20">
                          {r.palletNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{r.timestamp}</div>
                    </td>

                    {/* Марка */}
                    <td className="px-4 py-3 font-sans">
                      <div className="font-semibold text-slate-200">{r.recipeName}</div>
                      <div className="text-[11px] text-slate-400">{r.shift}</div>
                    </td>

                    {/* Проверяющий */}
                    <td className="px-4 py-3 font-sans">
                      <div className="font-semibold text-white">{r.inspectorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {USER_ROLES[r.inspectorRole]?.labelRu || r.inspectorRole}
                      </div>
                    </td>

                    {/* Плотность */}
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-white text-sm">
                        {r.densityActualKgM3} <span className="text-[10px] text-slate-400">/ {r.densityTargetKgM3} кг/м³</span>
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          Math.abs(r.densityDeviationPercent) <= 2
                            ? 'text-emerald-400'
                            : Math.abs(r.densityDeviationPercent) <= 4
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {r.densityDeviationPercent > 0 ? `+${r.densityDeviationPercent}%` : `${r.densityDeviationPercent}%`}
                      </div>
                    </td>

                    {/* Толщина */}
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-white text-sm">
                        {r.thicknessActualMm} <span className="text-[10px] text-slate-400">/ {r.thicknessTargetMm} мм</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {r.lengthActualMm}x{r.widthActualMm}
                      </div>
                    </td>

                    {/* Сжатие */}
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-amber-400">{r.compressiveStrengthKPa} кПа</div>
                      <div className="text-[10px] text-slate-400">Отрыв: {r.tensileStrengthKPa} кПа</div>
                    </td>

                    {/* Связующее */}
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-purple-400">{r.binderContentPercent}%</div>
                      <div className="text-[10px] text-slate-400">Влажн: {r.moisturePercent}%</div>
                    </td>

                    {/* Заключение */}
                    <td className="px-4 py-3 text-center">
                      {isPassed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ГОДЕН
                        </span>
                      )}
                      {isWarning && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans">
                          <AlertTriangle className="w-3.5 h-3.5" /> УСЛОВНО
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-sans">
                          <XCircle className="w-3.5 h-3.5" /> БРАК
                        </span>
                      )}
                    </td>

                    {/* Действия */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteRecord(r.id)}
                        title="Удалить запись"
                        className="p-1.5 bg-slate-950 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. МОДАЛЬНОЕ ОКНО ВНЕСЕНИЯ ЗАМЕРА КАЧЕСТВА               */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-400" />
                <span>Протокол лабораторного контроля качества (ОТК)</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Инфо-блок автоподстановки */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <span className="text-slate-500">Проверяющий:</span>
                <div className="font-bold text-white font-sans">{currentUser.fullName}</div>
              </div>
              <div>
                <span className="text-slate-500">Роль:</span>
                <div className="text-teal-400">{USER_ROLES[currentUser.role]?.labelRu}</div>
              </div>
              <div>
                <span className="text-slate-500">Марка на линии:</span>
                <div className="text-cyan-400 truncate">{activeRecipe?.name || 'ТЕХНОРУФ Н ЭКСТРА 100'}</div>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* Партия и паллета */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Номер партии:</label>
                  <input
                    type="text"
                    required
                    value={formBatch}
                    onChange={(e) => setFormBatch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Номер паллеты:</label>
                  <input
                    type="text"
                    required
                    value={formPallet}
                    onChange={(e) => setFormPallet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Плотность и геометрия */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>1. Плотность и геометрические размеры:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Плотность (кг/м³):</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formDensity}
                      onChange={(e) => setFormDensity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Толщина (мм):</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formThickness}
                      onChange={(e) => setFormThickness(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Длина (мм):</label>
                    <input
                      type="number"
                      required
                      value={formLength}
                      onChange={(e) => setFormLength(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Ширина (мм):</label>
                    <input
                      type="number"
                      required
                      value={formWidth}
                      onChange={(e) => setFormWidth(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Механические и физико-химические свойства */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>2. Механическая прочность и лабораторные тесты:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Сжатие 10% (кПа):</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formCompressive}
                      onChange={(e) => setFormCompressive(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Отрыв слоев (кПа):</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formTensile}
                      onChange={(e) => setFormTensile(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Связующее (%):</label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={formBinder}
                      onChange={(e) => setFormBinder(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Теплопроводн. (Вт/м·К):</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formThermal}
                      onChange={(e) => setFormThermal(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Водопоглощ. (кг/м²):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formWater}
                      onChange={(e) => setFormWater(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Влажность (%):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formMoisture}
                      onChange={(e) => setFormMoisture(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Заключение и примечания */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Итоговое заключение:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as QcSampleStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-teal-500"
                  >
                    <option value="passed">ГОДЕН (Соответствует ГОСТ/ТУ)</option>
                    <option value="warning">УСЛОВНО ГОДЕН (Требует контроля)</option>
                    <option value="rejected">БРАК (Несоответствие нормам)</option>
                    <option value="rework">НА ДОРАБОТКУ</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Примечания / Комментарии:</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Замечания лаборанта или оператора..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-500/20"
                >
                  Сохранить протокол замера
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
