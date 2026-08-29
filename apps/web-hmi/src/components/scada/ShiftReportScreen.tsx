import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  PlusCircle,
  FileSpreadsheet,
  Clock,
  Users,
  Shield,
  Layers,
  Trash2,
  Edit3,
  Search,
  Check,
  Activity,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import type { ProductRecipe } from '../../types/recipe';
import type {
  ShiftReport,
  DowntimeRecord,
  DowntimeCategory
} from '../../types/shiftReport';
import { DEFAULT_SHIFT_REPORTS, calculateOee } from '../../data/defaultShiftReports';
import { PLANT_EQUIPMENT } from '../../data/plantEquipmentData';

interface ShiftReportScreenProps {
  activeRecipe?: ProductRecipe | null;
}

const CATEGORY_META: Record<DowntimeCategory, { label: string; color: string; badge: string }> = {
  MECHANICAL: { label: 'Аварийный механический', color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  ELECTRICAL: { label: 'Аварийный электр. / КИПиА', color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  PROCESS: { label: 'Технологический', color: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  SETUP_CHANGEOVER: { label: 'Плановый / Переналадка', color: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  EXTERNAL_LOGISTICS: { label: 'Организационный / Внешний', color: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
};

export const ShiftReportScreen: React.FC<ShiftReportScreenProps> = ({ activeRecipe }) => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();

  const [reports, setReports] = useState<ShiftReport[]>(() => {
    const saved = localStorage.getItem('scada_shift_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SHIFT_REPORTS;
      }
    }
    return DEFAULT_SHIFT_REPORTS;
  });

  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id ?? '');

  // Модалка добавления/редактирования простоя
  const [isDowntimeModalOpen, setIsDowntimeModalOpen] = useState(false);
  const [editingDowntimeId, setEditingDowntimeId] = useState<string | null>(null);
  const [dtStartTime, setDtStartTime] = useState('10:00');
  const [dtEndTime, setDtEndTime] = useState('10:30');
  const [dtCategory, setDtCategory] = useState<DowntimeCategory>('MECHANICAL');
  const [dtEquipmentId, setDtEquipmentId] = useState<string>('');
  const [dtEquipmentSearch, setDtEquipmentSearch] = useState<string>('');
  const [dtReason, setDtReason] = useState('');
  const [dtActionTaken, setDtActionTaken] = useState('');

  // Активный рапорт
  const activeReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) ?? reports[0];
  }, [reports, selectedReportId]);

  const saveReportsToStorage = (updated: ShiftReport[]) => {
    setReports(updated);
    localStorage.setItem('scada_shift_reports', JSON.stringify(updated));
  };

  // Создание нового рапорта смены
  const handleCreateNewReport = () => {
    const today = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours();
    const isDay = hour >= 8 && hour < 20;
    const shiftType = isDay ? 'DAY' : 'NIGHT';
    const newId = `REP-${today.replace(/-/g, '')}-${shiftType}-${Date.now().toString().slice(-4)}`;

    const newReport: ShiftReport = {
      id: newId,
      date: today,
      shiftType,
      crew: {
        shiftNumber: 1,
        shiftType,
        shiftSupervisor: currentUser?.fullName ?? 'Начальник смены',
        operatorKvo: 'Оператор КВО 1',
        operatorOven: 'Машинист печи 1',
        qcInspector: 'Морозова Анна Игоревна',
        dutyElectrician: 'Дежурный электрик',
        dutyMechanic: 'Дежурный механик'
      },
      activeRecipeName: activeRecipe?.name ?? 'ТЕХНОРУФ Н ЭКСТРА 1200x600x100',
      production: {
        packagesCount: 1380,
        palletsCount: 34.5,
        tonnage: 66.2,
        volumeM3: 576.0,
        areaM2: 5760,
        scrapTons: 1.5,
        energyKWh: 10560,
        secKWhPerTon: 155.0
      },
      downtimes: [],
      totalDowntimeMinutes: 0,
      operatingMinutes: settings.shiftDurationHours * 60,
      oee: {
        availability: 100.0,
        performance: 96.0,
        quality: 97.8,
        totalOee: 93.9
      },
      safetyIncidentsCount: 0,
      safetyNotes: 'Нарушений охраны труда и техники безопасности не зафиксировано.',
      handoverNotes: '',
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };

    const updated = [newReport, ...reports];
    saveReportsToStorage(updated);
    setSelectedReportId(newReport.id);
  };

  // Обновление полей активного рапорта
  const handleUpdateActiveReport = (updater: (prev: ShiftReport) => ShiftReport) => {
    const updated = reports.map((r) => (r.id === activeReport.id ? updater(r) : r));
    saveReportsToStorage(updated);
  };

  // Пересчет OEE при изменении простоев или выпуска
  const recomputeReportOee = (rep: ShiftReport): ShiftReport => {
    const calc = calculateOee(settings.shiftDurationHours, rep.downtimes, rep.production);
    return {
      ...rep,
      totalDowntimeMinutes: calc.totalDowntimeMinutes,
      operatingMinutes: calc.operatingMinutes,
      oee: calc.oee
    };
  };

  // Сохранение простоя (добавление или редактирование)
  const handleSaveDowntime = (e: React.FormEvent) => {
    e.preventDefault();

    // Расчет длительности в минутах
    const [startH, startM] = dtStartTime.split(':').map(Number);
    const [endH, endM] = dtEndTime.split(':').map(Number);
    let duration = (endH * 60 + endM) - (startH * 60 + startM);
    if (duration <= 0) duration += 24 * 60; // переход через полночь

    const selectedEquip = PLANT_EQUIPMENT.find((eq) => eq.id === dtEquipmentId);

    const newRecord: DowntimeRecord = {
      id: editingDowntimeId ?? `DT-${Date.now()}`,
      startTime: dtStartTime,
      endTime: dtEndTime,
      durationMinutes: duration,
      category: dtCategory,
      equipmentId: selectedEquip?.id,
      equipmentName: selectedEquip?.displayName,
      cabinet: selectedEquip?.cabinet,
      schemeName: selectedEquip?.schemeName,
      reason: dtReason,
      actionTaken: dtActionTaken
    };

    handleUpdateActiveReport((prev) => {
      let updatedDts: DowntimeRecord[];
      if (editingDowntimeId) {
        updatedDts = prev.downtimes.map((d) => (d.id === editingDowntimeId ? newRecord : d));
      } else {
        updatedDts = [...prev.downtimes, newRecord];
      }
      return recomputeReportOee({ ...prev, downtimes: updatedDts });
    });

    setIsDowntimeModalOpen(false);
    setEditingDowntimeId(null);
  };

  // Удаление простоя
  const handleDeleteDowntime = (dtId: string) => {
    if (window.confirm('Удалить запись о простое?')) {
      handleUpdateActiveReport((prev) => {
        const updatedDts = prev.downtimes.filter((d) => d.id !== dtId);
        return recomputeReportOee({ ...prev, downtimes: updatedDts });
      });
    }
  };

  // Подписание рапорта начальником смены
  const handleSubmitReport = () => {
    if (window.confirm('Подписать и зафиксировать рапорт смены? Дальнейшие правки потребуют прав администратора.')) {
      handleUpdateActiveReport((prev) => ({
        ...prev,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString()
      }));
    }
  };

  // Экспорт рапорта в Excel (XLSX)
  const handleExportXlsx = () => {
    if (!activeReport) return;

    // Лист 1: Паспорт и выпуск
    const summaryData = [
      { 'Параметр': 'Номер рапорта', 'Значение': activeReport.id },
      { 'Параметр': 'Дата смены', 'Значение': activeReport.date },
      { 'Параметр': 'Тип смены (12ч)', 'Значение': activeReport.shiftType === 'DAY' ? 'Дневная (08:00-20:00)' : 'Ночная (20:00-08:00)' },
      { 'Параметр': 'Бригада №', 'Значение': activeReport.crew.shiftNumber },
      { 'Параметр': 'Начальник смены', 'Значение': activeReport.crew.shiftSupervisor },
      { 'Параметр': 'Рецепт продукта', 'Значение': activeReport.activeRecipeName },
      { 'Параметр': 'Выпуск (упаковок)', 'Значение': activeReport.production.packagesCount },
      { 'Параметр': 'Выпуск (паллет)', 'Значение': activeReport.production.palletsCount },
      { 'Параметр': 'Выпуск (тонн)', 'Значение': activeReport.production.tonnage },
      { 'Параметр': 'Объем (м3)', 'Значение': activeReport.production.volumeM3 },
      { 'Параметр': 'Площадь (м2)', 'Значение': activeReport.production.areaM2 },
      { 'Параметр': 'Брак (тонн)', 'Значение': activeReport.production.scrapTons },
      { 'Параметр': 'Расход э/э (кВт·ч)', 'Значение': activeReport.production.energyKWh },
      { 'Параметр': 'Удельный расход SEC (кВт·ч/т)', 'Значение': activeReport.production.secKWhPerTon },
      { 'Параметр': 'Общий OEE (%)', 'Значение': `${activeReport.oee.totalOee}%` },
      { 'Параметр': 'Доступность A (%)', 'Значение': `${activeReport.oee.availability}%` },
      { 'Параметр': 'Производительность P (%)', 'Значение': `${activeReport.oee.performance}%` },
      { 'Параметр': 'Качество Q (%)', 'Значение': `${activeReport.oee.quality}%` },
      { 'Параметр': 'Время простоев (мин)', 'Значение': activeReport.totalDowntimeMinutes },
      { 'Параметр': 'Время работы (мин)', 'Значение': activeReport.operatingMinutes },
      { 'Параметр': 'Статус', 'Значение': activeReport.status },
      { 'Параметр': 'Замечания сменщику', 'Значение': activeReport.handoverNotes }
    ];

    // Лист 2: Журнал простоев
    const downtimesData = activeReport.downtimes.map((d, idx) => ({
      '№': idx + 1,
      'Начало': d.startTime,
      'Окончание': d.endTime,
      'Длительность (мин)': d.durationMinutes,
      'Категория': CATEGORY_META[d.category]?.label ?? d.category,
      'Оборудование': d.equipmentName ?? '—',
      'Шкаф': d.cabinet ?? '—',
      'Схема': d.schemeName ?? '—',
      'Причина простоя': d.reason,
      'Принятые меры': d.actionTaken
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    const ws2 = XLSX.utils.json_to_sheet(downtimesData);

    XLSX.utils.book_append_sheet(wb, ws1, 'Сводный рапорт смены');
    XLSX.utils.book_append_sheet(wb, ws2, 'Журнал простоев');

    XLSX.writeFile(wb, `Shift_Report_${activeReport.date}_${activeReport.shiftType}.xlsx`);
  };

  // Фильтрация оборудования в модалке
  const filteredEquipment = useMemo(() => {
    if (!dtEquipmentSearch) return PLANT_EQUIPMENT.slice(0, 30);
    const q = dtEquipmentSearch.toLowerCase();
    return PLANT_EQUIPMENT.filter(
      (eq) =>
        eq.name.toLowerCase().includes(q) ||
        eq.schemeName.toLowerCase().includes(q) ||
        eq.cabinet.toLowerCase().includes(q) ||
        eq.areaName.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [dtEquipmentSearch]);

  if (!activeReport) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Главный заголовок и панель управления рапортом */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-wide">
                СМЕННЫЙ РАПОРТ НАЧАЛЬНИКА СМЕНЫ
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MES &bull; ISO 22400 (OEE) &bull; 12-ЧАСОВАЯ СМЕНА
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Цифровой паспорт смены: выпуск в упаковках и тоннаже, классификация простоев по 255 агрегатам, расчет OEE
            </p>
          </div>
        </div>

        {/* Действия с рапортом */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Селектор смен */}
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
          >
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.date} &bull; {r.shiftType === 'DAY' ? '☀️ Дневная' : '🌙 Ночная'} (Бригада {r.crew.shiftNumber}) &bull; {r.status}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreateNewReport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Новый рапорт</span>
          </button>

          <button
            onClick={handleExportXlsx}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>Excel</span>
          </button>

          {activeReport.status === 'DRAFT' && (
            <button
              onClick={handleSubmitReport}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Подписать смену</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Сводные метрики OEE (Overall Equipment Effectiveness) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Итоговый OEE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Итоговая эффективность (OEE)</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {activeReport.oee.totalOee}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Стандарт класса: <strong className="text-white font-mono">&ge; 85.0%</strong>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Доступность (A) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Доступность (Availability)</div>
            <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
              {activeReport.oee.availability}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              Работа: <strong>{activeReport.operatingMinutes}</strong> мин / Простой: <strong>{activeReport.totalDowntimeMinutes}</strong> мин
            </div>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Производительность (P) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Производительность (Speed)</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {activeReport.oee.performance}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              Выпуск: <strong>{activeReport.production.tonnage}</strong> т (план ~70т)
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Качество (Q) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Качество (Quality Rate)</div>
            <div className="text-2xl font-black text-purple-400 font-mono mt-1">
              {activeReport.oee.quality}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              Брак / срезка: <strong>{activeReport.production.scrapTons}</strong> т ({((activeReport.production.scrapTons / (activeReport.production.tonnage + activeReport.production.scrapTons)) * 100).toFixed(1)}%)
            </div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Производственный баланс выпуска (Автосбор + Коррекция) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Выпуск готовой продукции и энергопотребление смены</h3>
              <p className="text-xs text-slate-400">Рецепт: <strong className="text-white font-mono">{activeReport.activeRecipeName}</strong></p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Длительность смены: <strong className="text-white">{settings.shiftDurationHours} ч (720 мин)</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-500">Упаковки</div>
            <input
              type="number"
              value={activeReport.production.packagesCount}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleUpdateActiveReport((prev) => ({
                  ...prev,
                  production: { ...prev.production, packagesCount: val }
                }));
              }}
              className="w-full bg-transparent text-emerald-400 font-bold text-lg mt-0.5 focus:outline-none"
            />
            <div className="text-[10px] text-slate-500">шт</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-500">Паллеты</div>
            <input
              type="number"
              step="0.5"
              value={activeReport.production.palletsCount}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleUpdateActiveReport((prev) => ({
                  ...prev,
                  production: { ...prev.production, palletsCount: val }
                }));
              }}
              className="w-full bg-transparent text-emerald-400 font-bold text-lg mt-0.5 focus:outline-none"
            />
            <div className="text-[10px] text-slate-500">поддонов</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-500">Тоннаж</div>
            <input
              type="number"
              step="0.1"
              value={activeReport.production.tonnage}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleUpdateActiveReport((prev) =>
                  recomputeReportOee({
                    ...prev,
                    production: { ...prev.production, tonnage: val }
                  })
                );
              }}
              className="w-full bg-transparent text-cyan-400 font-bold text-lg mt-0.5 focus:outline-none"
            />
            <div className="text-[10px] text-slate-500">тонн</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-500">Объем</div>
            <input
              type="number"
              step="0.1"
              value={activeReport.production.volumeM3}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleUpdateActiveReport((prev) => ({
                  ...prev,
                  production: { ...prev.production, volumeM3: val }
                }));
              }}
              className="w-full bg-transparent text-cyan-400 font-bold text-lg mt-0.5 focus:outline-none"
            />
            <div className="text-[10px] text-slate-500">м³</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-500">Площадь</div>
            <input
              type="number"
              value={activeReport.production.areaM2}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleUpdateActiveReport((prev) => ({
                  ...prev,
                  production: { ...prev.production, areaM2: val }
                }));
              }}
              className="w-full bg-transparent text-cyan-400 font-bold text-lg mt-0.5 focus:outline-none"
            />
            <div className="text-[10px] text-slate-500">м²</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-500">Брак / срезка</div>
            <input
              type="number"
              step="0.1"
              value={activeReport.production.scrapTons}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleUpdateActiveReport((prev) =>
                  recomputeReportOee({
                    ...prev,
                    production: { ...prev.production, scrapTons: val }
                  })
                );
              }}
              className="w-full bg-transparent text-rose-400 font-bold text-lg mt-0.5 focus:outline-none"
            />
            <div className="text-[10px] text-slate-500">тонн</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-500">Электроэнергия</div>
            <input
              type="number"
              value={activeReport.production.energyKWh}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleUpdateActiveReport((prev) => ({
                  ...prev,
                  production: { ...prev.production, energyKWh: val }
                }));
              }}
              className="w-full bg-transparent text-amber-400 font-bold text-lg mt-0.5 focus:outline-none"
            />
            <div className="text-[10px] text-slate-500">кВт·ч</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-500">SEC удельный</div>
            <div className="text-amber-400 font-bold text-lg mt-0.5">
              {activeReport.production.secKWhPerTon}
            </div>
            <div className="text-[10px] text-slate-500">кВт·ч / т</div>
          </div>
        </div>
      </div>

      {/* 4. Журнал учета и классификации простоев */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Журнал простоев и технологических остановок линии</h3>
              <p className="text-xs text-slate-400">
                Суммарный простой: <strong className="text-rose-400 font-mono">{activeReport.totalDowntimeMinutes} мин</strong> &bull; Чистая наработка: <strong className="text-emerald-400 font-mono">{activeReport.operatingMinutes} мин</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingDowntimeId(null);
              setDtStartTime('11:00');
              setDtEndTime('11:20');
              setDtCategory('MECHANICAL');
              setDtEquipmentId('');
              setDtReason('');
              setDtActionTaken('');
              setIsDowntimeModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Зафиксировать простой</span>
          </button>
        </div>

        {activeReport.downtimes.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
            За смену остановок и простоев не зафиксировано (100% Доступность).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Интервал</th>
                  <th className="px-3 py-2.5">Длит.</th>
                  <th className="px-3 py-2.5">Категория</th>
                  <th className="px-3 py-2.5">Оборудование / Шкаф</th>
                  <th className="px-3 py-2.5">Причина простоя</th>
                  <th className="px-3 py-2.5">Принятые меры</th>
                  <th className="px-3 py-2.5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {activeReport.downtimes.map((dt) => (
                  <tr key={dt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-white whitespace-nowrap">
                      {dt.startTime} &mdash; {dt.endTime}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-rose-400 whitespace-nowrap">
                      {dt.durationMinutes} мин
                    </td>
                    <td className="px-3 py-2.5 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${CATEGORY_META[dt.category]?.badge}`}>
                        {CATEGORY_META[dt.category]?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-sans">
                      {dt.equipmentName ? (
                        <div>
                          <div className="font-semibold text-slate-200">{dt.equipmentName}</div>
                          <div className="text-[10px] text-amber-400 font-mono">
                            Шкаф {dt.cabinet} &bull; {dt.schemeName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-sans text-slate-300 max-w-xs truncate">
                      {dt.reason}
                    </td>
                    <td className="px-3 py-2.5 font-sans text-emerald-400 max-w-xs truncate">
                      {dt.actionTaken}
                    </td>
                    <td className="px-3 py-2.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingDowntimeId(dt.id);
                          setDtStartTime(dt.startTime);
                          setDtEndTime(dt.endTime);
                          setDtCategory(dt.category);
                          setDtEquipmentId(dt.equipmentId ?? '');
                          setDtReason(dt.reason);
                          setDtActionTaken(dt.actionTaken);
                          setIsDowntimeModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDowntime(dt.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Бригада, Охрана труда (HSE) и Передача смены */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Состав бригады */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Состав смены и дежурный персонал (Бригада {activeReport.crew.shiftNumber})</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Начальник смены:</label>
              <input
                type="text"
                value={activeReport.crew.shiftSupervisor}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateActiveReport((prev) => ({
                    ...prev,
                    crew: { ...prev.crew, shiftSupervisor: val }
                  }));
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Оператор КВО:</label>
              <input
                type="text"
                value={activeReport.crew.operatorKvo}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateActiveReport((prev) => ({
                    ...prev,
                    crew: { ...prev.crew, operatorKvo: val }
                  }));
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Машинист печи КП:</label>
              <input
                type="text"
                value={activeReport.crew.operatorOven}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateActiveReport((prev) => ({
                    ...prev,
                    crew: { ...prev.crew, operatorOven: val }
                  }));
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Лаборант ОТК:</label>
              <input
                type="text"
                value={activeReport.crew.qcInspector}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateActiveReport((prev) => ({
                    ...prev,
                    crew: { ...prev.crew, qcInspector: val }
                  }));
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Дежурный электрик:</label>
              <input
                type="text"
                value={activeReport.crew.dutyElectrician}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateActiveReport((prev) => ({
                    ...prev,
                    crew: { ...prev.crew, dutyElectrician: val }
                  }));
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Дежурный механик:</label>
              <input
                type="text"
                value={activeReport.crew.dutyMechanic}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateActiveReport((prev) => ({
                    ...prev,
                    crew: { ...prev.crew, dutyMechanic: val }
                  }));
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Передача смены и Охрана труда */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Журнал передачи смены и охрана труда (HSE)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Охрана труда и промбезопасность:</label>
              <input
                type="text"
                value={activeReport.safetyNotes ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateActiveReport((prev) => ({
                    ...prev,
                    safetyNotes: val
                  }));
                }}
                placeholder="Замечания по охране труда..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Замечания и задачи следующей смене:</label>
              <textarea
                rows={3}
                value={activeReport.handoverNotes}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateActiveReport((prev) => ({
                    ...prev,
                    handoverNotes: val
                  }));
                }}
                placeholder="Укажите состояние оборудования, уровень связующего, задачи дежурным службам..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ / РЕДАКТИРОВАНИЯ ПРОСТОЯ    */}
      {/* ======================================================== */}
      {isDowntimeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>{editingDowntimeId ? 'Редактировать простой' : 'Зафиксировать простой линии'}</span>
              </h3>
              <button
                onClick={() => setIsDowntimeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveDowntime} className="space-y-4 text-xs">
              {/* Время начала и окончания */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Время начала:</label>
                  <input
                    type="time"
                    required
                    value={dtStartTime}
                    onChange={(e) => setDtStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Время окончания:</label>
                  <input
                    type="time"
                    required
                    value={dtEndTime}
                    onChange={(e) => setDtEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Категория простоя */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Категория простоя:</label>
                <select
                  value={dtCategory}
                  onChange={(e) => setDtCategory(e.target.value as DowntimeCategory)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="MECHANICAL">🛑 Аварийный механический (обрыв цепи, заклинивание, подшипник)</option>
                  <option value="ELECTRICAL">⚡ Аварийный электрический / КИПиА (сработка автомата, ошибка ЧРП, датчик)</option>
                  <option value="PROCESS">🧪 Технологический (обрыв ковра, летка, засор фильтров, чистка валов)</option>
                  <option value="SETUP_CHANGEOVER">🔄 Плановый / Переналадка / Замена дисковых пил</option>
                  <option value="EXTERNAL_LOGISTICS">📦 Организационный / Внешний (нет сырья, поддонов, склад)</option>
                </select>
              </div>

              {/* Выбор оборудования из 255 агрегатов */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">
                  Привязка к оборудованию (из 255 агрегатов и 24 шкафов):
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Поиск по названию, коду схемы (LX-31VC1) или шкафу..."
                    value={dtEquipmentSearch}
                    onChange={(e) => setDtEquipmentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="max-h-32 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-1 divide-y divide-slate-800/60 font-mono text-[11px]">
                  <div
                    onClick={() => setDtEquipmentId('')}
                    className={`p-2 rounded cursor-pointer flex items-center justify-between ${
                      dtEquipmentId === '' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span>— Без привязки к конкретному приводу (Общелинейный)</span>
                    {dtEquipmentId === '' && <Check className="w-3.5 h-3.5" />}
                  </div>

                  {filteredEquipment.map((eq) => (
                    <div
                      key={eq.id}
                      onClick={() => setDtEquipmentId(eq.id)}
                      className={`p-2 rounded cursor-pointer flex items-center justify-between ${
                        dtEquipmentId === eq.id ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <span className="font-sans font-semibold text-white">{eq.displayName}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">
                          [{eq.cabinet}] {eq.schemeName} &bull; {eq.powerKw} кВт
                        </span>
                      </div>
                      {dtEquipmentId === eq.id && <Check className="w-3.5 h-3.5" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Причина простоя */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Причина простоя (Root Cause):</label>
                <input
                  type="text"
                  required
                  placeholder="Опишите, что произошло..."
                  value={dtReason}
                  onChange={(e) => setDtReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Принятые меры */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Принятые меры и устраненные дефекты:</label>
                <input
                  type="text"
                  required
                  placeholder="Что было выполнено дежурным персоналом..."
                  value={dtActionTaken}
                  onChange={(e) => setDtActionTaken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Кнопки */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDowntimeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20"
                >
                  Сохранить запись
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
