import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Play,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Search,
  X
} from 'lucide-react';
import type { ProductRecipe } from '../../types/recipe';

interface RecipesScreenProps {
  recipes: ProductRecipe[];
  activeRecipeId: string;
  onApplyRecipe: (recipe: ProductRecipe) => void;
  onSaveRecipe: (recipe: ProductRecipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
}

export const RecipesScreen: React.FC<RecipesScreenProps> = ({
  recipes,
  activeRecipeId,
  onApplyRecipe,
  onSaveRecipe,
  onDeleteRecipe
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [editingRecipe, setEditingRecipe] = useState<ProductRecipe | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Список всех уникальных групп продуктов
  const groups = ['all', ...Array.from(new Set(recipes.map((r) => r.group)))];

  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.group.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || r.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const activeRecipe = recipes.find((r) => r.id === activeRecipeId) || recipes[0];

  const handleDuplicate = (recipe: ProductRecipe) => {
    const newId = `${recipe.id}-COPY-${Date.now().toString().slice(-4)}`;
    const duplicated: ProductRecipe = {
      ...recipe,
      id: newId,
      name: `${recipe.name} (Копия)`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isActive: false
    };
    onSaveRecipe(duplicated);
  };

  const handleStartCreate = () => {
    setEditingRecipe({
      id: `RECIPE-${Date.now().toString().slice(-4)}`,
      name: 'НОВАЯ МАРКА 1200x600x100',
      group: 'Кровельная изоляция (Нижний слой)',
      thicknessMm: 100,
      widthMm: 600,
      lengthMm: 1200,
      targetDensityKgM3: 110,
      crimpingRatio: 1.80,
      kvoSpeedMPerMin: 25.0,
      curingOvenSpeedMPerMin: 1.50,
      pendulumSpeedMPerMin: 50.0,
      ovenGapMm: 102,
      ovenZoneTempsC: [200, 245, 240, 240],
      binderContentPercent: 4.0,
      notes: '',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isActive: false
    });
    setIsCreatingNew(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe) return;
    onSaveRecipe(editingRecipe);
    setEditingRecipe(null);
    setIsCreatingNew(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Главная плашка экрана рецептов */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-wide">
                РЕЦЕПТЫ ВЫПУСКА ПРОДУКЦИИ (RECIPE MANAGEMENT)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ISA-88
              </span>
            </div>
            <p className="text-xs text-slate-400">
              База технологических параметров минераловатных изделий &bull; Быстрая загрузка уставок в ПЛК
            </p>
          </div>
        </div>

        {/* Кнопка создания нового рецепта */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleStartCreate}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Создать новый рецепт</span>
          </button>
        </div>
      </div>

      {/* 2. Карточка текущего активного рецепта на линии */}
      {activeRecipe && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wide">
                  АКТИВНЫЙ РЕЦЕПТ НА ЛИНИИ
                </span>
                <span className="text-xs font-mono text-slate-400">ID: {activeRecipe.id}</span>
              </div>
              <h3 className="text-lg font-black text-white">{activeRecipe.name}</h3>
              <p className="text-xs text-emerald-400 font-medium">{activeRecipe.group}</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4" /> Загружен в ПЛК S7-1500
              </span>
            </div>
          </div>

          {/* Параметры активного рецепта */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 text-xs font-mono">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-sans">Толщина / Габариты:</span>
              <span className="font-bold text-white text-sm">{activeRecipe.thicknessMm} мм</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{activeRecipe.lengthMm}x{activeRecipe.widthMm}</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-sans">Заданная плотность:</span>
              <span className="font-bold text-emerald-400 text-sm">{activeRecipe.targetDensityKgM3} кг/м³</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Связующее: {activeRecipe.binderContentPercent}%</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-sans">Коэф. гофрирования (КГ):</span>
              <span className="font-bold text-cyan-400 text-sm">{activeRecipe.crimpingRatio.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Диапазон: 1.00..5.00</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-sans">Скорость КВО / Маятник:</span>
              <span className="font-bold text-blue-400 text-sm">{activeRecipe.kvoSpeedMPerMin} м/мин</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Маятник: {activeRecipe.pendulumSpeedMPerMin} м/мин</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-sans">Скорость печи КП:</span>
              <span className="font-bold text-amber-400 text-sm">{activeRecipe.curingOvenSpeedMPerMin} м/мин</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Зазор цепей: {activeRecipe.ovenGapMm} мм</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-sans">Температуры зон КП (1..4):</span>
              <span className="font-bold text-rose-400 text-sm">
                {activeRecipe.ovenZoneTempsC.join(' / ')} °C
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">4 зоны нагрева</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Фильтры и поиск по каталогу рецептов */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        {/* Поиск */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск рецепта по марке, коду или группе..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Фильтр по группе */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-sans whitespace-nowrap">Группа:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Все группы ({recipes.length})</option>
            {groups.filter((g) => g !== 'all').map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Таблица / Каталог всех рецептов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((recipe) => {
          const isActive = recipe.id === activeRecipeId;

          return (
            <div
              key={recipe.id}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all shadow-xl flex flex-col justify-between ${
                isActive
                  ? 'border-emerald-500 shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Шапка карточки */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-slate-400">{recipe.id}</span>
                      {isActive && (
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950">
                          АКТИВЕН
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-white mt-1 leading-snug">{recipe.name}</h4>
                    <span className="text-[11px] text-blue-400 font-medium">{recipe.group}</span>
                  </div>
                </div>

                {/* Параметры рецепта */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">Толщина:</span>
                    <span className="font-bold text-white">{recipe.thicknessMm} мм</span>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">Плотность:</span>
                    <span className="font-bold text-emerald-400">{recipe.targetDensityKgM3} кг/м³</span>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">Гофрирование (КГ):</span>
                    <span className="font-bold text-cyan-400">{recipe.crimpingRatio.toFixed(2)}</span>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">Скорость КВО:</span>
                    <span className="font-bold text-blue-400">{recipe.kvoSpeedMPerMin} м/мин</span>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">Скорость КП:</span>
                    <span className="font-bold text-amber-400">{recipe.curingOvenSpeedMPerMin} м/мин</span>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">Зазор печи:</span>
                    <span className="font-bold text-purple-400">{recipe.ovenGapMm} мм</span>
                  </div>
                </div>

                {recipe.notes && (
                  <p className="text-[11px] text-slate-400 italic mt-2.5 line-clamp-2">{recipe.notes}</p>
                )}
              </div>

              {/* Кнопки действий */}
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-2">
                {/* Кнопка применения на линию */}
                <button
                  onClick={() => onApplyRecipe(recipe)}
                  disabled={isActive}
                  className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isActive ? 'Активен на линии' : 'Загрузить в ПЛК'}</span>
                </button>

                {/* Дополнительные действия */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingRecipe(recipe);
                      setIsCreatingNew(false);
                    }}
                    title="Редактировать рецепт"
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(recipe)}
                    title="Дублировать рецепт"
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {recipes.length > 1 && (
                    <button
                      onClick={() => onDeleteRecipe(recipe.id)}
                      title="Удалить рецепт"
                      className="p-2 bg-slate-950 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Модальное окно создания / редактирования рецепта */}
      {editingRecipe && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>{isCreatingNew ? 'Создание нового рецепта продукта' : 'Редактирование параметров рецепта'}</span>
              </h3>
              <button
                onClick={() => setEditingRecipe(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Основная информация */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Код / ID рецепта:</label>
                  <input
                    type="text"
                    required
                    value={editingRecipe.id}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Группа применения:</label>
                  <input
                    type="text"
                    required
                    value={editingRecipe.group}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, group: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Полное наименование продукта:</label>
                <input
                  type="text"
                  required
                  value={editingRecipe.name}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Геометрические и плотностные параметры */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Толщина (мм):</label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    required
                    value={editingRecipe.thicknessMm}
                    onChange={(e) =>
                      setEditingRecipe({ ...editingRecipe, thicknessMm: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Плотность (кг/м³):</label>
                  <input
                    type="number"
                    min="25"
                    max="220"
                    required
                    value={editingRecipe.targetDensityKgM3}
                    onChange={(e) =>
                      setEditingRecipe({ ...editingRecipe, targetDensityKgM3: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Гофрирование (КГ):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.00"
                    max="5.00"
                    required
                    value={editingRecipe.crimpingRatio}
                    onChange={(e) =>
                      setEditingRecipe({ ...editingRecipe, crimpingRatio: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Связующее (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="10.0"
                    required
                    value={editingRecipe.binderContentPercent}
                    onChange={(e) =>
                      setEditingRecipe({
                        ...editingRecipe,
                        binderContentPercent: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Скоростные уставки оборудования */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Скорость КВО (м/мин):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="5"
                    max="80"
                    required
                    value={editingRecipe.kvoSpeedMPerMin}
                    onChange={(e) =>
                      setEditingRecipe({ ...editingRecipe, kvoSpeedMPerMin: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Скорость КП (м/мин):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="10"
                    required
                    value={editingRecipe.curingOvenSpeedMPerMin}
                    onChange={(e) =>
                      setEditingRecipe({
                        ...editingRecipe,
                        curingOvenSpeedMPerMin: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Маятник (м/мин):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="10"
                    max="120"
                    required
                    value={editingRecipe.pendulumSpeedMPerMin}
                    onChange={(e) =>
                      setEditingRecipe({
                        ...editingRecipe,
                        pendulumSpeedMPerMin: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Зазор печи (мм):</label>
                  <input
                    type="number"
                    min="30"
                    max="320"
                    required
                    value={editingRecipe.ovenGapMm}
                    onChange={(e) =>
                      setEditingRecipe({ ...editingRecipe, ovenGapMm: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Примечание */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Примечание / Назначение:</label>
                <textarea
                  rows={2}
                  value={editingRecipe.notes || ''}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Дополнительные комментарии к рецепту..."
                />
              </div>

              {/* Кнопки */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRecipe(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20"
                >
                  Сохранить рецепт
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
