
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Loader2, ChevronRight, Zap, RefreshCw, TrendingUp, BarChart3, Globe, ShieldCheck, Clock, ExternalLink, Info } from 'lucide-react';
import { getEconomicStats, getEconomicAnalysis, getLatestNews } from '../services/geminiService';
import { MultiLineChart } from './Charts';
import { ImpactMatrix } from './SectorData';
import { LanguageContext, CountryContext } from '../App';
import { useTranslation } from '../translations';
import { EconomicAnalysis, NewsItem } from '../types';

const IndicatorTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button 
        onMouseEnter={() => setShow(true)} 
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="p-1 text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
      >
        <Info size={14} />
      </button>
      <div className={`absolute z-[110] bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-[11px] text-slate-200 font-bold leading-relaxed transition-all duration-300 origin-bottom ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'}`}>
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
};

export const GlobalEconomy: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useContext(LanguageContext);
  const { countries } = useContext(CountryContext);
  const t = useTranslation(lang);
  
  // 從 URL 參數讀取初始國家 ID
  const urlCountryId = searchParams.get('country');
  const [selectedCountry, setSelectedCountry] = useState(urlCountryId || countries[0]?.id || 'hk');
  const [search, setSearch] = useState('');

  const [stats, setStats] = useState<any[]>([]);
  const [ecoAnalysis, setEcoAnalysis] = useState<EconomicAnalysis[]>([]);
  const [detailedNews, setDetailedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // 當 URL 參數改變時同步選取的國家
  useEffect(() => {
    if (urlCountryId && urlCountryId !== selectedCountry) {
      setSelectedCountry(urlCountryId);
    }
  }, [urlCountryId]);

  const country = useMemo(() => 
    countries.find(c => c.id === selectedCountry) || countries[0]
  , [countries, selectedCountry]);

  const countryName = country?.name || 'Hong Kong';

  const loadData = useCallback(async (ignore: boolean, force = false) => {
    setLoading(true);
    try {
      const [statsRes, analysisRes, newsRes] = await Promise.all([
        getEconomicStats(countryName, lang),
        getEconomicAnalysis(countryName, lang, force),
        getLatestNews(`${countryName} Financial Macro News`, lang, force)
      ]);
      
      if (!ignore) {
        setStats(statsRes.data || []);
        setEcoAnalysis(analysisRes.data || []);
        setDetailedNews(newsRes.data || []);
        setLastUpdated(analysisRes.timestamp);
      }
    } catch (e) { 
      console.error(e); 
      // 若發生錯誤，可能是因為新發現的國家數據不足，顯示清空狀態
      setStats([]);
      setEcoAnalysis([]);
      setDetailedNews([]);
    }
    finally { if (!ignore) setLoading(false); }
  }, [countryName, lang]);

  useEffect(() => {
    let ignore = false;
    loadData(ignore);
    return () => { ignore = true; };
  }, [selectedCountry, loadData]);

  const handleCountrySelect = (id: string) => {
    setSelectedCountry(id);
    setSearchParams({ country: id });
  };

  const macroScore = ecoAnalysis.length > 0 
    ? ecoAnalysis.reduce((acc, curr) => acc + (curr.impactScore || 0), 0) / ecoAnalysis.length 
    : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Globe className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t('nav_economy')}</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Real-time Macro Intelligence</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder={t('search_placeholder')}
            className="bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-6 text-xs w-full focus:ring-2 focus:ring-blue-500 transition-all outline-none text-white font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-1/4 flex lg:flex-col overflow-x-auto gap-2 no-scrollbar pb-2">
          {countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
            <button
              key={c.id}
              onClick={() => handleCountrySelect(c.id)}
              className={`p-4 rounded-2xl border text-sm transition-all flex-shrink-0 text-left relative overflow-hidden group ${selectedCountry === c.id ? 'bg-blue-600 border-blue-500 text-white font-black shadow-xl' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
            >
              {c.name}
              {selectedCountry === c.id && <Zap className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 animate-pulse" size={16} />}
            </button>
          ))}
        </aside>

        <section className="lg:flex-1 space-y-6">
            <div className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative">
               <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none opacity-5">
                  <Globe className="absolute -right-20 -top-20" size={300} />
               </div>

               <div className="relative z-10 w-full md:w-auto text-center md:text-left">
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase break-words max-w-md">{countryName}</h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                    <ShieldCheck className="text-blue-500" size={16} />
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black">AI Macro Dashboard</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-6 bg-slate-950/40 p-6 md:p-8 rounded-[2rem] border border-slate-800/50 relative z-10 w-full md:w-auto justify-center">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Impact Score</p>
                      <IndicatorTooltip text={t('impact_score_desc')} />
                    </div>
                    <p className={`text-5xl font-black font-mono tracking-tighter ${macroScore > 0 ? 'text-emerald-400' : macroScore < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {macroScore > 0 ? `+${macroScore.toFixed(1)}` : macroScore.toFixed(1)}
                    </p>
                  </div>
                  <div className={`p-5 rounded-2xl ${macroScore > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    <TrendingUp size={28} className={macroScore < 0 ? 'rotate-180' : ''} />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                  <BarChart3 size={14} className="text-blue-500" /> GDP Trend (5Y)
                </h3>
                {loading ? <div className="h-48 animate-pulse bg-slate-800/20 rounded-xl" /> : <MultiLineChart data={stats} xKey="period" lines={[{ key: 'gdp', color: '#3b82f6' }]} />}
                {!loading && stats.length === 0 && <p className="text-[10px] text-slate-500 font-bold text-center py-10 uppercase tracking-widest opacity-50">Historical data sync pending...</p>}
              </div>
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                  <Zap size={14} className="text-rose-500" /> Rates & Inflation
                </h3>
                {loading ? <div className="h-48 animate-pulse bg-slate-800/20 rounded-xl" /> : <MultiLineChart data={stats} xKey="period" lines={[{ key: 'inflation', color: '#ef4444' }, { key: 'interestRate', color: '#10b981' }]} />}
                {!loading && stats.length === 0 && <p className="text-[10px] text-slate-500 font-bold text-center py-10 uppercase tracking-widest opacity-50">Rate indicators sync pending...</p>}
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
              <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-600 rounded-xl">
                    <Zap className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Macro Analysis & News</h3>
                    {lastUpdated && <p className="text-[9px] text-slate-500 font-bold mt-1">Updated: {new Date(lastUpdated).toLocaleTimeString()}</p>}
                  </div>
                </div>
                <button onClick={() => loadData(false, true)} disabled={loading} className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-400">
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="divide-y divide-slate-800">
                {ecoAnalysis.map((ana, i) => (
                  <div key={`macro-${i}`} className="p-6 md:p-8 hover:bg-slate-800/40 transition-all flex flex-col md:flex-row gap-6 md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Macro Event</span>
                        <h4 className="text-sm font-black text-white uppercase">{ana.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 font-bold leading-relaxed">{ana.description}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-xs font-black border self-start md:self-auto ${ana.impactScore > 0 ? 'text-emerald-400 border-emerald-500/20' : 'text-rose-400 border-rose-500/20'}`}>
                      {ana.impactScore > 0 ? `+${ana.impactScore}` : ana.impactScore}
                    </div>
                  </div>
                ))}
                {detailedNews.map((n, i) => (
                  <div key={`news-${i}`} className="p-6 md:p-8 hover:bg-slate-800/40 transition-all group/news">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-blue-600/10 text-blue-400 border border-blue-500/30 text-[8px] font-black px-2 py-0.5 rounded uppercase">{n.source || 'VERIFIED SOURCE'}</span>
                          <span className="text-[9px] font-black text-slate-500 flex items-center gap-1 uppercase"><Clock size={10} /> {n.date}</span>
                        </div>
                        <h4 className="text-sm font-black text-white uppercase leading-tight group-hover/news:text-blue-400 transition-colors">{n.title}</h4>
                      </div>
                      <a href={n.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-950 hover:bg-blue-600 rounded-2xl border border-slate-800 text-white transition-all shadow-lg active:scale-90">
                         <ExternalLink size={18} />
                      </a>
                    </div>
                    <ImpactMatrix impact={n.expectedImpact} />
                  </div>
                ))}
                {!loading && ecoAnalysis.length === 0 && detailedNews.length === 0 && (
                  <div className="p-20 text-center opacity-40 grayscale">
                    <Globe size={48} className="mx-auto mb-4 text-slate-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No macro events detected for this region yet.</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => navigate(`/sectors?country=${selectedCountry}`)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-8 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl text-sm uppercase tracking-[0.3em] transition-all">
              Explore Industry Sectors <ChevronRight size={20} />
            </button>
        </section>
      </div>
    </div>
  );
};
