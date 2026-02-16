
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { GlobalEconomy } from './components/GlobalEconomy';
import { SectorData } from './components/SectorData';
import { CompanyData } from './components/CompanyData';
import { Portfolio } from './components/Portfolio';
import { Settings } from './components/Settings';
import { Language } from './types';
import { COUNTRIES as BASE_COUNTRIES } from './constants';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
}

interface CountryContextType {
  countries: { id: string; name: string }[];
  addCountries: (names: string[]) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
});

export const CountryContext = createContext<CountryContextType>({
  countries: [],
  addCountries: () => {},
});

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('fin_lang') as Language) || 'bi';
  });

  const [countries, setCountries] = useState(() => {
    const saved = localStorage.getItem('discovered_countries');
    const base = [...BASE_COUNTRIES];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.forEach((p: any) => {
          if (!base.find(m => m.id === p.id)) base.push(p);
        });
      } catch (e) { console.error("Cache corrupted"); }
    }
    return base;
  });

  useEffect(() => { localStorage.setItem('fin_lang', lang); }, [lang]);
  
  // 優化：只儲存非基礎國家，節省空間
  useEffect(() => { 
    const discovered = countries.filter(c => !BASE_COUNTRIES.find(b => b.id === c.id));
    localStorage.setItem('discovered_countries', JSON.stringify(discovered)); 
  }, [countries]);

  const addCountries = useCallback((names: string[]) => {
    setCountries(prev => {
      const next = [...prev];
      let changed = false;
      names.forEach(name => {
        // 優化：更安全的 ID 生成
        const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (id && !next.find(c => c.id === id || c.name.toLowerCase() === name.toLowerCase())) {
          next.push({ id, name: name.trim() });
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <CountryContext.Provider value={{ countries, addCountries }}>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<GlobalEconomy />} />
              <Route path="/sectors" element={<SectorData />} />
              <Route path="/companies" element={<CompanyData />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </HashRouter>
      </CountryContext.Provider>
    </LanguageContext.Provider>
  );
};

export default App;
