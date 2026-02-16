
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Globe, LayoutGrid, Building2, Settings, TrendingUp, Languages, Briefcase } from 'lucide-react';
import { LanguageContext } from '../App';
import { useTranslation } from '../translations';
import { Language } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang, setLang } = useContext(LanguageContext);
  const t = useTranslation(lang);

  const navLinks = [
    { to: '/', icon: <Globe size={20} />, label: t('nav_economy') },
    { to: '/sectors', icon: <LayoutGrid size={20} />, label: t('nav_sectors') },
    { to: '/companies', icon: <Building2 size={20} />, label: t('nav_companies') },
    { to: '/portfolio', icon: <Briefcase size={20} />, label: lang === 'en' ? 'Investment' : '模擬投資' },
    { to: '/settings', icon: <Settings size={20} />, label: t('nav_settings') },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 pb-20 md:pb-0">
      <nav className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 p-4 sticky top-0 h-screen flex-col overflow-y-auto">
        <div className="flex items-center gap-2 mb-8 px-2">
          <TrendingUp className="text-blue-500 w-8 h-8" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">FinSight Pro</h1>
        </div>
        <div className="space-y-2 flex-1">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              {link.icon}<span className="text-sm font-medium">{link.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="mt-8 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 px-3 mb-3 text-slate-500 text-[10px] font-semibold uppercase tracking-wider"><Languages size={14} /><span>{t('language')}</span></div>
          <div className="flex flex-col gap-1">
            {(['en', 'zh', 'bi'] as Language[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`text-left px-3 py-1.5 rounded text-xs transition-colors ${lang === l ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-500 hover:bg-slate-800/50'}`}>{t(`mode_${l}` as any)}</button>
            ))}
          </div>
        </div>
      </nav>

      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
        <div className="flex items-center gap-2"><TrendingUp className="text-blue-500 w-6 h-6" /><h1 className="text-lg font-bold">FinSight</h1></div>
        <div className="flex gap-2">{(['en', 'zh', 'bi'] as Language[]).map((l) => (<button key={l} onClick={() => setLang(l)} className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] uppercase font-bold border ${lang === l ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{l}</button>))}</div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center h-16 z-30 px-2">
        {navLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex flex-col items-center justify-center gap-1 transition-colors flex-1 h-full ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
            {link.icon}<span className="text-[10px] font-medium text-center leading-tight truncate px-1 max-w-full">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 overflow-x-hidden bg-slate-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto pb-8">{children}</div>
      </main>
    </div>
  );
};
