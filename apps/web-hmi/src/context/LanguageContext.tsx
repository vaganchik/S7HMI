import React, { createContext, useContext, useState } from 'react';
import { LANGUAGES, TRANSLATIONS } from '../i18n/translations';
import type { Language, LanguageOption, TranslationKeys } from '../i18n/translations';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
  currentOption: LanguageOption;
  availableLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('scada_lang') as Language;
    if (saved && ['ru', 'en', 'zh', 'it'].includes(saved)) {
      return saved;
    }
    return 'ru';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('scada_lang', lang);
  };

  const t = (key: TranslationKeys): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.ru;
    return (dict as any)[key] || (TRANSLATIONS.ru as any)[key] || key;
  };

  const currentOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentOption,
        availableLanguages: LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
