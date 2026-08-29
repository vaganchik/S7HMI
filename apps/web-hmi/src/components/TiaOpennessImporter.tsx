import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import type { PlcTagDefinition } from '../types/hmi';

interface TiaOpennessImporterProps {
  onImportComplete: (newTags: PlcTagDefinition[]) => void;
}

export const TiaOpennessImporter: React.FC<TiaOpennessImporterProps> = ({ onImportComplete }) => {
  const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
<Document>
  <Engineering version="V18" />
  <SW.Blocks.GlobalDB ID="0">
    <AttributeList>
      <Header.Number>20</Header.Number>
      <Name>DB_ReactorData</Name>
      <IsOptimized>false</IsOptimized>
    </AttributeList>
    <Interface>
      <Sections xmlns="http://www.siemens.com/automation/Openness/SW/Interface/v4">
        <Section Name="Static">
          <Member Name="Agitator_Speed" Datatype="Real">
            <Comment><MultiLanguageText Lang="en-US">Скорость вращения мешалки (об/мин)</MultiLanguageText></Comment>
          </Member>
          <Member Name="Cooling_Jacket_Temp" Datatype="Real">
            <Comment><MultiLanguageText Lang="en-US">Температура рубашки охлаждения (°C)</MultiLanguageText></Comment>
          </Member>
          <Member Name="pH_Level" Datatype="Real">
            <Comment><MultiLanguageText Lang="en-US">Уровень pH раствора</MultiLanguageText></Comment>
          </Member>
          <Member Name="Agitator_Ready" Datatype="Bool" />
          <Member Name="Emergency_Stop" Datatype="Bool" />
          <Member Name="Batch_Number" Datatype="DInt">
            <Comment><MultiLanguageText Lang="en-US">Номер партии продукции</MultiLanguageText></Comment>
          </Member>
        </Section>
      </Sections>
    </Interface>
  </SW.Blocks.GlobalDB>
</Document>`;

  const [xmlText, setXmlText] = useState(sampleXml);
  const [importing, setImporting] = useState(false);
  const [importedResult, setImportedResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setErrorMessage(null);
    setImportedResult(null);

    try {
      const res = await fetch('/api/openness/import-db-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlText
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка импорта XML');
      }

      setImportedResult(data);
      if (data.tags) {
        onImportComplete(data.tags);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setXmlText(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Импорт тегов и блоков DB из Siemens TIA Portal Openness
          </h2>
          <p className="text-xs text-slate-400">
            Вставьте XML, экспортированный через TIA Openness API. Сервер автоматически рассчитает смещения байт для S7comm!
          </p>
        </div>

        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 transition-colors shadow">
          <Upload className="w-4 h-4 text-blue-400" />
          <span>Загрузить XML файл</span>
          <input type="file" accept=".xml" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Редактор XML */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400">Содержимое XML файла:</label>
        <textarea
          value={xmlText}
          onChange={(e) => setXmlText(e.target.value)}
          rows={10}
          className="w-full p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-blue-300 font-mono focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
          placeholder="Вставьте XML экспорта блока данных..."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleImport}
          disabled={importing || !xmlText.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          <FileCode className="w-4 h-4" />
          <span>{importing ? 'Парсинг и импорт...' : 'Распарсить и добавить теги в опрос'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Сообщения об ошибках */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start space-x-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <div className="font-bold">Ошибка обработки XML:</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Результат импорта */}
      {importedResult && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Успешно импортирован блок данных: {importedResult.dbName} (DB{importedResult.dbNumber})</span>
          </div>

          <div className="text-xs text-slate-300">
            Добавлено тегов в опрос: <strong>{importedResult.tagCount}</strong>
          </div>

          <div className="overflow-x-auto rounded border border-slate-800 mt-3">
            <table className="w-full text-left text-[11px] text-slate-300 font-mono">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-3 py-2">ID тега</th>
                  <th className="px-3 py-2">Имя в TIA</th>
                  <th className="px-3 py-2">Смещение (Offset)</th>
                  <th className="px-3 py-2">Тип данных</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {importedResult.tags?.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 text-blue-400 font-semibold">{t.id}</td>
                    <td className="px-3 py-2 text-white">{t.name}</td>
                    <td className="px-3 py-2 text-amber-300">
                      DB{t.address.dbNumber}.{t.address.startByte}
                      {t.address.bitNumber > 0 ? `.${t.address.bitNumber}` : ''}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{t.address.dataType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
