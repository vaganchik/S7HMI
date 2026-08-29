import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import type { ScadaTab } from './components/Header';
import { OverviewScreen } from './components/scada/OverviewScreen';
import { SpinnerScreen } from './components/scada/SpinnerScreen';
import { KvoScreen } from './components/scada/KvoScreen';
import { CrimperScreen } from './components/scada/CrimperScreen';
import { CuringOvenScreen } from './components/scada/CuringOvenScreen';
import { CuttingScreen } from './components/scada/CuttingScreen';
import { DensitySyncScreen } from './components/scada/DensitySyncScreen';
import { RecipesScreen } from './components/scada/RecipesScreen';
import { ShiftReportScreen } from './components/scada/ShiftReportScreen';
import { LabQualityScreen } from './components/scada/LabQualityScreen';
import { EquipmentScreen } from './components/scada/EquipmentScreen';
import { EnergyScreen } from './components/scada/EnergyScreen';
import { UserManagementScreen } from './components/scada/UserManagementScreen';
import { SystemSettingsScreen } from './components/scada/SystemSettingsScreen';
import { TrendViewer } from './components/TrendViewer/TrendViewer';
import { TagTable } from './components/TagTable';
import { AlarmPanel } from './components/AlarmPanel';
import { TiaOpennessImporter } from './components/TiaOpennessImporter';
import { MechanismFaceplate } from './components/faceplates/MechanismFaceplate';
import { AnalogMiniTrendModal } from './components/faceplates/AnalogMiniTrendModal';
import { LoginModal } from './components/auth/LoginModal';
import { usePlcTelemetry } from './hooks/usePlcTelemetry';
import { useAlarms } from './hooks/useAlarms';
import { DEFAULT_RECIPES } from './data/defaultRecipes';
import type { ProductRecipe } from './types/recipe';
import type { MechanismTelemetry } from './types/scada';
import type { PlcTagDefinition } from './types/hmi';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ScadaTab>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedMechanism, setSelectedMechanism] = useState<MechanismTelemetry | null>(null);
  const [selectedAnalogTag, setSelectedAnalogTag] = useState<PlcTagDefinition | null>(null);
  const [initialFocusTagId, setInitialFocusTagId] = useState<string | null>(null);

  // Реестр рецептов выпуска продуктов
  const [recipes, setRecipes] = useState<ProductRecipe[]>(DEFAULT_RECIPES);
  const [activeRecipeId, setActiveRecipeId] = useState<string>('TR-N-EXTRA-100');

  const { plcStatus, tags, tagValues, writeTag, addImportedTags } = usePlcTelemetry();
  const { activeAlarmCount } = useAlarms();

  // Реестр состояний механизмов
  const [mechanisms, setMechanisms] = useState<Record<string, MechanismTelemetry>>({
    'spinner.1': {
      id: 'spinner.1',
      name: 'Центрифуга вал #1',
      section: 'Центрифуги',
      type: 'motor',
      state: 'running',
      mode: 'auto',
      frequencyActualHz: 41.5,
      frequencySetpointHz: 42.0,
      currentAmps: 14.22
    },
    'kvo.drum': {
      id: 'kvo.drum',
      name: 'Барабан КВО',
      section: 'КВО',
      type: 'motor',
      state: 'running',
      mode: 'auto',
      frequencyActualHz: 27.5,
      frequencySetpointHz: 27.5,
      currentAmps: 18.4
    }
  });

  const handleMechanismCommand = async (id: string, command: string, payload?: any): Promise<boolean> => {
    // Отправка команды управления в ПЛК
    const cmdTag = `${id}.cmd.${command}`;
    const valueToWrite = payload !== undefined ? payload : true;
    
    try {
      await writeTag(cmdTag, valueToWrite);
    } catch (e) {
      console.warn(`Failed to send command ${command} to PLC for ${id}:`, e);
    }

    setMechanisms((prev) => {
      const current = prev[id] || {
        id,
        name: id,
        section: 'Линия',
        type: 'motor',
        state: 'running',
        mode: 'auto'
      };

      if (command === 'start') {
        return { ...prev, [id]: { ...current, state: 'running' } };
      } else if (command === 'stop') {
        return { ...prev, [id]: { ...current, state: 'stopped' } };
      } else if (command === 'set_mode') {
        return { ...prev, [id]: { ...current, mode: payload } };
      } else if (command === 'reset_fault') {
        return { ...prev, [id]: { ...current, state: 'stopped', faultMessage: undefined } };
      }
      return prev;
    });

    return true;
  };

  const handleOpenFullTrend = (tagId: string) => {
    setInitialFocusTagId(tagId);
    setActiveTab('trends');
    setSelectedAnalogTag(null);
  };

  const handleApplyRecipe = (recipe: ProductRecipe) => {
    setActiveRecipeId(recipe.id);
    setRecipes((prev) =>
      prev.map((r) => ({
        ...r,
        isActive: r.id === recipe.id
      }))
    );
  };

  const handleSaveRecipe = (recipe: ProductRecipe) => {
    setRecipes((prev) => {
      const exists = prev.some((r) => r.id === recipe.id);
      if (exists) {
        return prev.map((r) => (r.id === recipe.id ? recipe : r));
      }
      return [recipe, ...prev];
    });
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    if (activeRecipeId === recipeId && recipes.length > 1) {
      const fallback = recipes.find((r) => r.id !== recipeId);
      if (fallback) setActiveRecipeId(fallback.id);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeRecipe = recipes.find((r) => r.id === activeRecipeId) || recipes[0];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex selection:bg-blue-600 selection:text-white`}>
      {/* Левое вертикальное меню навигации (Sidebar) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlarmCount={activeAlarmCount}
        plcStatus={plcStatus}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Правая рабочая область: Верхняя плашка + Экраны */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          plcStatus={plcStatus}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeAlarmCount={activeAlarmCount}
          theme={theme}
          onToggleTheme={toggleTheme}
          activeRecipe={activeRecipe}
        />

        {/* Основной технологический контент экрана */}
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewScreen
              mechanisms={mechanisms}
              onSelectSection={(sec) => setActiveTab(sec as ScadaTab)}
              onSelectMechanism={setSelectedMechanism}
            />
          )}

          {activeTab === 'spinner' && (
            <SpinnerScreen mechanisms={mechanisms} onSelectMechanism={setSelectedMechanism} />
          )}

          {activeTab === 'kvo' && (
            <KvoScreen mechanisms={mechanisms} onSelectMechanism={setSelectedMechanism} />
          )}

          {activeTab === 'crimper' && (
            <CrimperScreen mechanisms={mechanisms} onSelectMechanism={setSelectedMechanism} />
          )}

          {activeTab === 'oven' && (
            <CuringOvenScreen
              mechanisms={mechanisms}
              onSelectMechanism={setSelectedMechanism}
              onSelectAnalogTag={setSelectedAnalogTag}
            />
          )}

          {activeTab === 'cutting' && (
            <CuttingScreen mechanisms={mechanisms} onSelectMechanism={setSelectedMechanism} />
          )}

          {activeTab === 'density' && <DensitySyncScreen />}

          {activeTab === 'recipes' && (
            <RecipesScreen
              recipes={recipes}
              activeRecipeId={activeRecipeId}
              onApplyRecipe={handleApplyRecipe}
              onSaveRecipe={handleSaveRecipe}
              onDeleteRecipe={handleDeleteRecipe}
            />
          )}

          {activeTab === 'shiftReport' && (
            <ShiftReportScreen activeRecipe={activeRecipe} />
          )}

          {activeTab === 'qc' && (
            <LabQualityScreen activeRecipe={activeRecipe} />
          )}

          {activeTab === 'equipment' && (
            <EquipmentScreen onSelectMechanism={setSelectedMechanism} />
          )}

          {activeTab === 'energy' && (
            <EnergyScreen activeRecipe={activeRecipe} />
          )}

          {activeTab === 'trends' && (
            <TrendViewer
              tags={tags}
              tagValues={tagValues}
              initialFocusTagId={initialFocusTagId}
            />
          )}

          {activeTab === 'tags' && (
            <TagTable
              tags={tags}
              tagValues={tagValues}
              onWriteTag={writeTag}
              onSelectAnalogTag={setSelectedAnalogTag}
              onOpenTrend={handleOpenFullTrend}
              plcStatus={plcStatus}
            />
          )}

          {activeTab === 'users' && <UserManagementScreen />}

          {activeTab === 'alarms' && <AlarmPanel />}

          {activeTab === 'settings' && <SystemSettingsScreen />}

          {activeTab === 'openness' && (
            <TiaOpennessImporter onImportComplete={addImportedTags} />
          )}
        </main>

        {/* Подвал */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-3 text-center text-xs text-slate-500">
          Industrial Web-HMI &bull; High-Performance ISA-101 &bull; Siemens S7-1500 &bull; 60 FPS Canvas
        </footer>
      </div>

      {/* Унифицированный фейсплейт ручного управления механизмом */}
      {selectedMechanism && (
        <MechanismFaceplate
          mechanism={selectedMechanism}
          onClose={() => setSelectedMechanism(null)}
          onCommand={handleMechanismCommand}
        />
      )}

      {/* Модальное окно аналогового сигнала: Минитренд, Пределы Min/Max и Выход в Тренды */}
      {selectedAnalogTag && (
        <AnalogMiniTrendModal
          tag={selectedAnalogTag}
          tagValue={tagValues[selectedAnalogTag.id]}
          onClose={() => setSelectedAnalogTag(null)}
          onOpenFullTrend={handleOpenFullTrend}
        />
      )}

      {/* Модальное окно авторизации и быстрого выбора пользователя */}
      <LoginModal />
    </div>
  );
};

export default App;
