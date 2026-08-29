import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Bell, Check, Clock, History, X } from 'lucide-react';
import type { AlarmEvent } from '../types/hmi';

export const AlarmPanel: React.FC = () => {
  const [activeAlarms, setActiveAlarms] = useState<AlarmEvent[]>([]);
  const [historyAlarms, setHistoryAlarms] = useState<AlarmEvent[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'history'>('active');
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmEvent | null>(null);
  const [occurrences, setOccurrences] = useState<AlarmEvent[]>([]);
  const [loadingOccurrences, setLoadingOccurrences] = useState(false);

  const fetchAlarms = async () => {
    try {
      const [resActive, resHistory] = await Promise.all([
        fetch('/api/alarms/active'),
        fetch('/api/alarms/history?limit=50')
      ]);

      if (resActive.ok) setActiveAlarms(await resActive.json());
      if (resHistory.ok) setHistoryAlarms(await resHistory.json());
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchAlarms();
    const interval = setInterval(fetchAlarms, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id: number) => {
    try {
      await fetch(`/api/alarms/${id}/ack`, { method: 'POST' });
      await fetchAlarms();
      if (selectedAlarm && selectedAlarm.id === id) {
        setSelectedAlarm({
          ...selectedAlarm,
          state: 2,
          acknowledgedTimestamp: new Date().toISOString(),
          acknowledgedBy: 'Operator-1'
        });
      }
    } catch {
      // ignore
    }
  };

  const handleOpenOccurrences = async (alarm: AlarmEvent) => {
    setSelectedAlarm(alarm);
    setLoadingOccurrences(true);
    try {
      const res = await fetch(`/api/alarms/${encodeURIComponent(alarm.alarmId)}/occurrences?limit=50`);
      if (res.ok) {
        setOccurrences(await res.json());
      } else {
        setOccurrences([alarm]);
      }
    } catch {
      setOccurrences([alarm]);
    } finally {
      setLoadingOccurrences(false);
    }
  };

  const getSeverityBadge = (sev: number) => {
    if (sev >= 700) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" /> АВАРИЯ (CRITICAL)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
        <AlertTriangle className="w-3.5 h-3.5" /> ПРЕДУПРЕЖДЕНИЕ
      </span>
    );
  };

  const formatDuration = (startStr: string, endStr?: string) => {
    const start = new Date(startStr).getTime();
    const end = endStr ? new Date(endStr).getTime() : Date.now();
    const diffSec = Math.floor((end - start) / 1000);
    if (diffSec < 60) return `${diffSec} сек`;
    const min = Math.floor(diffSec / 60);
    const sec = diffSec % 60;
    return `${min} мин ${sec} сек`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400" />
            Система противоаварийной защиты и тревог (Alarms & Events)
          </h2>
          <p className="text-xs text-slate-400">Мониторинг уставок, фиксация времени, квитирование и хронология инцидентов</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'active'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Активные тревоги</span>
            {activeAlarms.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-rose-600 rounded-full text-[10px] font-extrabold">
                {activeAlarms.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Журнал истории</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'active' ? (
        activeAlarms.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Все параметры в пределах нормы</h3>
            <p className="text-xs text-slate-400">Активных аварийных ситуаций и предупреждений не зафиксировано.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlarms.map((alarm) => (
              <div
                key={alarm.id}
                onClick={() => handleOpenOccurrences(alarm)}
                className="p-4 bg-slate-950/90 border border-rose-500/30 hover:border-rose-400 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg cursor-pointer transition-all"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg mt-0.5">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {getSeverityBadge(alarm.severity)}
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(alarm.activeTimestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">{alarm.message}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      Тег: <span className="text-blue-400">{alarm.tagId}</span> | Значение:{' '}
                      <strong className="text-rose-400">{alarm.triggerValue.toFixed(1)}</strong> | Уставка:{' '}
                      <span className="text-amber-400">{alarm.setpoint.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenOccurrences(alarm)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1">
                    <History className="w-3.5 h-3.5" />
                    <span>История</span>
                  </button>

                  {alarm.state === 2 ? (
                    <span className="text-xs font-semibold text-amber-400 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      Квитировано ({alarm.acknowledgedBy})
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(alarm.id)}
                      className="px-4 py-2 bg-rose-600 hover:bg-emerald-600 text-xs font-bold text-white rounded-lg border border-rose-500 transition-all flex items-center gap-1.5 shadow"
                    >
                      <Check className="w-4 h-4" />
                      <span>Квитировать</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Журнал истории */
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Время фиксации</th>
                <th className="px-4 py-3">Критичность</th>
                <th className="px-4 py-3">Сообщение об аварии</th>
                <th className="px-4 py-3">Тег</th>
                <th className="px-4 py-3">Значение / Уставка</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {historyAlarms.map((h) => (
                <tr key={h.id} className="hover:bg-slate-800/40 cursor-pointer" onClick={() => handleOpenOccurrences(h)}>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(h.activeTimestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{getSeverityBadge(h.severity)}</td>
                  <td className="px-4 py-3 font-sans text-white font-medium">{h.message}</td>
                  <td className="px-4 py-3 text-blue-400">{h.tagId}</td>
                  <td className="px-4 py-3 text-amber-300">
                    {h.triggerValue.toFixed(1)} / {h.setpoint.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    {h.state === 3 ? (
                      <span className="text-emerald-400 font-semibold">Норма (Cleared)</span>
                    ) : h.state === 2 ? (
                      <span className="text-amber-400 font-semibold">Квитировано ({h.acknowledgedBy})</span>
                    ) : (
                      <span className="text-rose-400 font-bold">Активно</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-blue-400 rounded border border-slate-700">
                      Хронология &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО: КАРТОЧКА ИНЦИДЕНТА И ПРЕДЫДУЩИЕ СРАБАТЫВАНИЯ АВАРИИ */}
      {selectedAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedAlarm.message}</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedAlarm.alarmId} &bull; Тег: {selectedAlarm.tagId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAlarm(null)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Текущий статус и метки времени */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Время возникновения:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {new Date(selectedAlarm.activeTimestamp).toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Время квитирования:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {selectedAlarm.acknowledgedTimestamp ? new Date(selectedAlarm.acknowledgedTimestamp).toLocaleString() : '— Не квитировано —'}
                  </span>
                  {selectedAlarm.acknowledgedBy && (
                    <span className="text-[10px] text-slate-500 block">Оператор: {selectedAlarm.acknowledgedBy}</span>
                  )}
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Время нормализации:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {selectedAlarm.clearedTimestamp ? new Date(selectedAlarm.clearedTimestamp).toLocaleString() : 'Активно сейчас'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Длительность: {formatDuration(selectedAlarm.activeTimestamp, selectedAlarm.clearedTimestamp)}
                  </span>
                </div>
              </div>

              {/* Таблица предыдущих срабатываний этой же аварии */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-blue-400" />
                    Предыдущие срабатывания и квитирования этой аварии ({occurrences.length})
                  </h4>
                  {loadingOccurrences && <span className="text-xs text-blue-400 animate-pulse font-mono">Загрузка из БД...</span>}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2.5">Дата/Время появления</th>
                        <th className="px-3 py-2.5">Квитирование</th>
                        <th className="px-3 py-2.5">Оператор</th>
                        <th className="px-3 py-2.5">Нормализация</th>
                        <th className="px-3 py-2.5">Длительность</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {occurrences.map((occ, idx) => (
                        <tr key={occ.id || idx} className="hover:bg-slate-800/40">
                          <td className="px-3 py-2 text-rose-400 font-bold">
                            {new Date(occ.activeTimestamp).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-amber-300">
                            {occ.acknowledgedTimestamp ? new Date(occ.acknowledgedTimestamp).toLocaleTimeString() : '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-300 font-sans">
                            {occ.acknowledgedBy || '—'}
                          </td>
                          <td className="px-3 py-2 text-emerald-400">
                            {occ.clearedTimestamp ? new Date(occ.clearedTimestamp).toLocaleTimeString() : '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-400">
                            {formatDuration(occ.activeTimestamp, occ.clearedTimestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/80">
              <span className="text-xs text-slate-500 font-mono">Хранилище: PostgreSQL TimescaleDB (alarm_history)</span>
              <div className="flex space-x-3">
                {selectedAlarm.state === 1 && (
                  <button
                    onClick={() => handleAcknowledge(selectedAlarm.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all">
                    ✓ Квитировать эту аварию
                  </button>
                )}
                <button
                  onClick={() => setSelectedAlarm(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all">
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
