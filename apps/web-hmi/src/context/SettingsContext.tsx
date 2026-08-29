import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ScadaSystemSettings } from '../types/settings';
import { DEFAULT_SCADA_SETTINGS } from '../types/settings';

interface SettingsContextType {
  settings: ScadaSystemSettings;
  updateSettings: (partial: Partial<ScadaSystemSettings>) => void;
  resetToDefaults: () => void;
  exportSettingsJson: () => void;
  importSettingsJson: (jsonString: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ScadaSystemSettings>(() => {
    const saved = localStorage.getItem('scada_system_settings_v2');
    if (saved) {
      try {
        return { ...DEFAULT_SCADA_SETTINGS, ...JSON.parse(saved) };
      } catch (err) {
        console.warn('Failed to parse saved settings, falling back to defaults', err);
        return DEFAULT_SCADA_SETTINGS;
      }
    }
    return DEFAULT_SCADA_SETTINGS;
  });

  // Сохраняем в localStorage при любых изменениях
  useEffect(() => {
    localStorage.setItem('scada_system_settings_v2', JSON.stringify(settings));

    // Синхронизируем с бэкендом период архивации/опроса
    fetch('http://localhost:5000/api/archiver/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultIntervalMs: settings.archiveIntervalMs })
    }).catch(() => {});
  }, [settings]);

  const updateSettings = (partial: Partial<ScadaSystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SCADA_SETTINGS);
  };

  const exportSettingsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `scada_settings_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importSettingsJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        setSettings((prev) => ({ ...prev, ...parsed }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetToDefaults,
        exportSettingsJson,
        importSettingsJson
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
