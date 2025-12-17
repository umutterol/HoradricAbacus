import { useState, useCallback } from 'react';
import type { Language } from '../constants';
import { TRANSLATIONS } from '../constants';

export function useLanguage(initialLang: Language = 'en') {
    const [language, setLanguage] = useState<Language>(initialLang);

    const t = useCallback((key: string): string => {
        return TRANSLATIONS[language][key] || key;
    }, [language]);

    const toggleLanguage = useCallback(() => {
        setLanguage(prev => prev === 'en' ? 'tr' : 'en');
    }, []);

    return { language, setLanguage, toggleLanguage, t };
}

export type TranslateFunction = (key: string) => string;
