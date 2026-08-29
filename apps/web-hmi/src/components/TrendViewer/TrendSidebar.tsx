import React, { useState } from 'react';
import { Bookmark, ListTree, Search, Trash2, Check } from 'lucide-react';
import type { TrendPreset, TrendPen } from '../../types/trends';
import type { PlcTagDefinition, TagValue } from '../../types/hmi';

interface TrendSidebarProps {
  presets: TrendPreset[];
  activePresetId: string | null;
  onSelectPreset: (preset: TrendPreset) => void;
  onDeleteUserPreset: (id: string) => void;
  allTags: PlcTagDefinition[];
  tagValues: Record<string, TagValue>;
  activePens: TrendPen[];
  onToggleTag: (tag: PlcTagDefinition) => void;
}

export const TrendSidebar: React.FC<TrendSidebarProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onDeleteUserPreset,
  allTags,
  tagValues,
  activePens,
  onToggleTag
}) => {
  const [sidebarTab, setSidebarTab] = useState<'presets' | 'tags'>('presets');
  const [searchTag, setSearchTag] = useState('');

  const filteredTags = allTags.filter(
    (t) =>
      t.id.toLowerCase().includes(searchTag.toLowerCase()) ||
      t.name.toLowerCase().includes(searchTag.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full space-y-3">
      {/* Переключение табов Пресеты / Теги */}
      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setSidebarTab('presets')}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            sidebarTab === 'presets' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}>
          <Bookmark className="w-3.5 h-3.5" />
          <span>Пресеты ({presets.length})</span>
        </button>
        <button
          onClick={() => setSidebarTab('tags')}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            sidebarTab === 'tags' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}>
          <ListTree className="w-3.5 h-3.5" />
          <span>Теги ({allTags.length})</span>
        </button>
      </div>

      {sidebarTab === 'presets' ? (
        /* Список пресетов */
        <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
          {presets.map((p) => {
            const isActive = p.id === activePresetId;

            return (
              <div
                key={p.id}
                onClick={() => onSelectPreset(p)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}>
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">{p.icon || '📈'}</span>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-xs font-bold ${isActive ? 'text-blue-400' : 'text-white'}`}>
                        {p.name}
                      </span>
                      {p.isFactory && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                          Заводской
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">{p.section} &bull; Перьев: {p.pens.length}</p>
                  </div>
                </div>

                {!p.isFactory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteUserPreset(p.id);
                    }}
                    title="Удалить пресет"
                    className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:text-rose-300 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Дерево / поиск тегов */
        <div className="space-y-2.5 flex flex-col flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по ID или названию..."
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
            {filteredTags.map((t) => {
              const isSelected = activePens.some((pen) => pen.tagId === t.id);
              const val = tagValues[t.id]?.value;
              const displayVal = val !== undefined && val !== null ? (typeof val === 'number' ? val.toFixed(1) : String(val)) : '---';

              return (
                <div
                  key={t.id}
                  onClick={() => onToggleTag(t)}
                  className={`p-2 rounded-lg border cursor-pointer text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500/50 text-white'
                      : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}>
                  <div className="flex items-center space-x-2 truncate">
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 bg-slate-900'}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <div className="truncate">
                      <span className="font-semibold block truncate">{t.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 block truncate">{t.id}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono ml-2">
                    <span className="text-emerald-400 font-bold">{displayVal}</span>
                    <span className="text-[10px] text-slate-500 ml-1">{t.engineeringUnit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
