
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, Zap, Target, ShieldAlert, ArrowLeft, RefreshCw, Activity, TrendingUp, Gauge, PieChart, ExternalLink, Info, Building, Link2 } from 'lucide-react';
import { SECTORS, COUNTRIES } from '../constants';
import { getSectorStats, getLatestNews, getRelevantTickers } from '../services/geminiService';
import { LanguageContext } from '../App';
import { useTranslation } from '../translations';
import { SectorTechnicalStats, DetailedImpact, CyclePhase, NewsItem, SectorTicker } from '../types';

export const CycleIndicator: React.FC<{ phase?: CyclePhase }> = ({ phase }) => {
  const { lang } = useContext(LanguageContext);
  const t = useTranslation(lang);
  
  const phases = useMemo(() => [
    { id: 'Trough', label: t('cycle_trough'), color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30' },
    { id: 'Expansion', label: t('cycle_expansion'), color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/30' },
    { id: 'Peak', label: t('cycle_peak'), color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/30' },
    { id: 'Contraction', label: t('cycle_contraction'), color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/30' }
  ], [t]);

  const active = phases.find(p => p.id === phase) || phases[0];

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${active.border} ${active.bg} transition-all`}>
      <div className="relative w-12 h-12 flex items-center justify-center will-change-transform">
        <PieChart size={32} className={`${active.color} animate-pulse`} />
        <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full animate-[spin_15s_linear_infinite]" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-0.5">{t('volatility_cycle')}</p>
        <p className={`text-xs font-black uppercase ${active.color}`}>{active.label}</p>
      </div>
    </div>
  );
};

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

export const ImpactMatrix: React.FC<{ impact: DetailedImpact }> = ({ impact }) => {
  const categories = [
    { id: 'priceVolatility', label: 'Price', icon: <TrendingUp size={12} />, color: 'text-emerald-400' },
    { id: 'demandChange', label: 'Demand', icon: <Gauge size={12} />, color: 'text-blue-400' },
    { id: 'policyRisk', label: 'Policy', icon: <ShieldAlert size={12} />, color: 'text-amber-400' }
  ];

  return (
    <div className="mt-4 flex overflow-x-auto pb-2 gap-3 no-scrollbar snap-x">
      {categories.map((cat) => (
        <div key={cat.id} className="min-w-[260px] md:min-w-0 md:flex-1 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 snap-center">
          <div className={`flex items-center gap-2 mb-3 ${cat.color} text-[10px] font-black uppercase tracking-widest`}>
            {cat.icon} {cat.label}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['short', 'medium', 'long'].map((time) => (
              <div key={time} className="text-center space-y-1">
                <span className="text-[8px] text-slate-600 font-black uppercase">{time[0]}T</span>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/50 min-h-[36px] flex items-center justify-center">
                  <p className="text-[9px] text-slate-300 font-bold leading-tight line-clamp-2">
                    {(impact as any)[cat.id][time]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const SectorData: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useContext(LanguageContext);
  const t = useTranslation(lang);
  
  const countryId = params.get('country') || 'us';
  const paramSector = params.get('sector') || SECTORS[0].id;
  const countryName = useMemo(() => COUNTRIES.find(c => c.id === countryId)?.name ?? 'United States', [countryId]);

  const [selectedSector, setSelectedSector] = useState(paramSector);
  const [stats, setStats] = useState<SectorTechnicalStats | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [tickers, setTickers] = useState<SectorTicker[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (ignore: boolean, force = false) => {
    setLoading(true);
    try {
      const sectorLabel = SECTORS.find(s => s.id === selectedSector)?.name ?? 'Technology';
      const [statsRes, newsRes, tickersRes] = await Promise.all([
        getSectorStats(sectorLabel, countryName, lang),
        getLatestNews(`${countryName} ${sectorLabel} Industry Analysis`, lang, force),
        getRelevantTickers(selectedSector, countryName, lang)
      ]);
      if (ignore) return;
      setStats(statsRes.data);
      setNews(newsRes.data || []);
      setTickers(tickersRes || []);
    } catch (e) { console.error(e); } finally { if (!ignore) setLoading(false); }
  }, [selectedSector, countryName, lang]);

  useEffect(() => {
    let ignore = false;
    fetchData(ignore);
    return () => { ignore = true; };
  }, [fetchData]);

  const StatCard = ({ title, value, subValue, label, color, info }: any) => (
    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg relative group">
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none opacity-5">
         <Activity size={100} className={`absolute -right-4 -top-4 text-${color}-500 group-hover:scale-110 transition-transform`} />
      </div>
      <div className="flex items-center justify-between mb-3 relative z-10">
        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{title}</p>
        <IndicatorTooltip text={info} />
      </div>
      <div className="flex items-end justify-between relative z-10">
        <p className={`text-3xl font-mono font-black text-${color}-400 tracking-tighter`}>{value ?? '--'}</p>
        <div className="text-right">
          <p className="text-[8px] text-slate-600 font-bold uppercase">{label}</p>
          <p className="text-[10px] text-slate-400 font-mono font-bold">{subValue ?? '--'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative">
        <div className="flex items-center gap-6 w-full md:w-auto">
           <button onClick={() => navigate('/')} className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl border border-slate-700 transition-all active:scale-90"><ArrowLeft size={20} /></button>
           <div>
             <h2 className="text-xl font-black text-white uppercase tracking-tight">{countryName} {t('nav_sectors')}</h2>
             <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em]">Deep Industry Engine</p>
           </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {stats?.volatilityCycle && <CycleIndicator phase={stats.volatilityCycle} />}
          <button onClick={() => fetchData(false, true)} disabled={loading} className="p-4 bg-slate-800 text-white rounded-2xl border border-slate-700 active:bg-slate-700 transition-all flex items-center justify-center">
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 flex lg:flex-col overflow-x-auto gap-2 no-scrollbar">
          {SECTORS.map(s => (
            <button key={s.id} onClick={() => setSelectedSector(s.id)} className={`flex-shrink-0 lg:w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedSector === s.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
              <span className="font-black text-[11px] uppercase">{s.name}</span>
              <ChevronRight size={14} className={selectedSector === s.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </aside>

        <section className="flex-1 space-y-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Syncing Sector Leaders...</p></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="RSI Indicator" value={stats?.rsi?.toFixed(1)} subValue={stats?.median?.rsi?.toFixed(1)} label="Benchmark" color="blue" info={t('rsi_desc')} />
                <StatCard title="MACD Vector" value={stats?.macd?.toFixed(2)} subValue={stats?.dispersion?.macd?.toFixed(3)} label="Volatility" color="emerald" info={t('macd_desc')} />
                <StatCard title="ADX Trend" value={stats?.adx?.toFixed(1)} subValue={stats?.suggestedSensitivity} label="Strength" color="rose" info={t('adx_desc')} />
              </div>

              {/* Extended Tickers Section - Grid of 10 Cards */}
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-600/10 rounded-lg">
                    <Building className="text-blue-500" size={20} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Top 10 Leaders & Ecosystem</h3>
                    <p className="text-[8px] text-slate-500 uppercase font-bold mt-1">Cross-referencing related entities</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {tickers.map((item, i) => (
                    <button 
                      key={`${item.ticker}-${i}`}
                      onClick={() => navigate(`/companies?sector=${selectedSector}&country=${countryId}&ticker=${item.ticker}`)}
                      className="p-5 bg-slate-950/40 rounded-3xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-left group flex flex-col justify-between min-h-[140px] shadow-sm relative overflow-hidden"
                    >
                      <div className="relative z-10">
                         <p className="text-xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tighter">{item.ticker}</p>
                         <p className="text-[9px] text-slate-500 font-black uppercase truncate mt-1 leading-tight">{item.name}</p>
                      </div>
                      
                      {item.relatedTickers && item.relatedTickers.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-wrap gap-1 relative z-10">
                           {item.relatedTickers.slice(0, 2).map((rt, idx) => (
                             <span key={idx} className="inline-flex items-center gap-1 bg-blue-600/10 text-blue-400 text-[7px] font-black px-1.5 py-0.5 rounded border border-blue-500/10 uppercase"><Link2 size={7}/>{rt}</span>
                           ))}
                        </div>
                      )}
                      
                      {/* Background Decoration */}
                      <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                         <Activity size={60} className="text-blue-500" />
                      </div>
                    </button>
                  ))}
                  
                  {tickers.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-950/20 rounded-3xl border border-dashed border-slate-800">
                      <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Scanning for deep sector leaders...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3"><Target className="text-blue-500" size={18} /><h3 className="text-[11px] font-black uppercase tracking-widest text-white">Latest News Matrix Analysis</h3></div>
                <div className="divide-y divide-slate-800">
                  {news.map((n, i) => (
                    <div key={i} className="p-6 hover:bg-slate-800/10 transition-all group/news">
                       <div className="flex justify-between items-start gap-4 mb-3">
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                               <span className="text-[8px] font-black text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded border border-blue-400/10 uppercase">{n.source || 'GLOBAL SOURCE'}</span>
                               <span className="text-[8px] font-black text-slate-500 uppercase">{n.date || 'LATEST'}</span>
                            </div>
                            <h4 className="text-sm font-black text-white uppercase leading-snug group-hover/news:text-blue-400 transition-colors">{n.title}</h4>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black border ${n.sentimentScore > 0 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-400 border-rose-500/20 bg-rose-500/5'}`}>
                              {n.sentimentScore > 0 ? `+${n.sentimentScore}` : n.sentimentScore}
                            </div>
                            <a href={n.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-white transition-all shadow-lg border border-slate-700">
                               <ExternalLink size={14} />
                            </a>
                         </div>
                       </div>
                       <ImpactMatrix impact={n.expectedImpact} />
                       <p className="text-[10px] text-slate-500 font-bold mt-4 italic border-l-2 border-slate-800 pl-3">AI Context: {n.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => navigate(`/companies?sector=${selectedSector}&country=${countryId}`)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-3xl transition-all shadow-xl text-[11px] uppercase tracking-[0.2em] active:scale-[0.98]">View Deep Analysis</button>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
