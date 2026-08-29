import * as XLSX from 'xlsx';
import type { TrendPen, TrendPoint, TrendPenStats } from '../types/trends';

interface ExportXlsxParams {
  pens: TrendPen[];
  data: TrendPoint[];
  stats: Record<string, TrendPenStats>;
  timeRangeSec: number;
}

/**
 * Формирует и скачивает многостраничный отчет Excel (.xlsx) с историей трендов, статистикой и метаданными
 */
export const exportTrendDataToXlsx = ({
  pens,
  data,
  stats,
  timeRangeSec
}: ExportXlsxParams) => {
  if (data.length === 0 || pens.length === 0) return;

  const wb = XLSX.utils.book_new();

  // --- ЛИСТ 1: История измерений ---
  const historyHeaders = [
    'Метка времени (Unix)',
    'Дата',
    'Время',
    ...pens.map((p) => `${p.name} [${p.unit || ''}]`)
  ];

  const historyRows = data.map((pt) => {
    const d = new Date(pt.timestamp * 1000);
    const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

    const values = pens.map((p) => {
      const v = pt.values[p.tagId];
      return v !== undefined && v !== null ? Number(v.toFixed(2)) : '';
    });

    return [pt.timestamp, dateStr, timeStr, ...values];
  });

  const wsHistory = XLSX.utils.aoa_to_sheet([historyHeaders, ...historyRows]);

  // Автоподбор ширины колонок для Листа 1
  wsHistory['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    ...pens.map((p) => ({ wch: Math.max(20, p.name.length + 8) }))
  ];

  XLSX.utils.book_append_sheet(wb, wsHistory, 'История измерений');

  // --- ЛИСТ 2: Сводная статистика ---
  const statsHeaders = [
    'Идентификатор тега',
    'Наименование сигнала',
    'Ед. изм.',
    'Шкала Y',
    'Текущее значение',
    'Минимум (Min)',
    'Максимум (Max)',
    'Среднее (Avg)',
    'Дельта (Δ = Max - Min)'
  ];

  const statsRows = pens.map((p) => {
    const st = stats[p.tagId] || { min: 0, max: 0, avg: 0, last: 0, delta: 0 };
    return [
      p.tagId,
      p.name,
      p.unit || '—',
      p.axis === 'left' ? 'Левая (Y1)' : 'Правая (Y2)',
      Number(st.last.toFixed(2)),
      Number(st.min.toFixed(2)),
      Number(st.max.toFixed(2)),
      Number(st.avg.toFixed(2)),
      Number(st.delta.toFixed(2))
    ];
  });

  const wsStats = XLSX.utils.aoa_to_sheet([statsHeaders, ...statsRows]);
  wsStats['!cols'] = [
    { wch: 28 },
    { wch: 30 },
    { wch: 10 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, wsStats, 'Сводная статистика');

  // --- ЛИСТ 3: Параметры отчета ---
  const reportDate = new Date();
  const metadataRows = [
    ['Параметр отчета', 'Значение'],
    ['Система', 'SCADA S7 Industrial HMI (Линия минеральной ваты)'],
    ['Дата и время выгрузки', `${reportDate.toLocaleDateString()} ${reportDate.toLocaleTimeString()}`],
    ['Временной охват', `${Math.round(timeRangeSec / 60)} мин (${timeRangeSec} сек)`],
    ['Количество точек', data.length],
    ['Количество активных перьев', pens.length],
    ['Формат данных', 'RFC-4180 / OpenXML Excel (.xlsx)']
  ];

  const wsMetadata = XLSX.utils.aoa_to_sheet(metadataRows);
  wsMetadata['!cols'] = [{ wch: 30 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsMetadata, 'Параметры отчета');

  // Скачивание файла
  const fileName = `scada_trend_report_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
