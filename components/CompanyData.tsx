
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Activity, ShoppingCart, ArrowLeft, BarChart3, TrendingUp, Sparkles, Target, History, Bell, ArrowUpRight, CheckCircle2, Info, Clock, Share2, Building2, User2, Factory } from 'lucide-react';
import { getCompanyStats, getRelevantTickers } from '../services/geminiService';
import { checkTechnicalAlerts } from '../services/alertService';
import { PriceAreaChart, ComparisonBarChart } from './Charts';
import { CycleIndicator } from './SectorData';
import { COUNTRIES, SECTORS, INITIAL_ALERTS } from '../constants';
import { LanguageContext, CountryContext } from '../App';
import { useTranslation } from '../translations';
import { TradeRecord, BusinessSource, BacktestResult, CompanyStats, RelatedCompany } from '../types';

const IndicatorTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-1">
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

const BacktestBlock = ({ title, data, label }: { title: string, data: BacktestResult, label: string }) => {
  const alpha = data.strategyReturn - data.benchmarkReturn;
  return (
    <div className="flex-1 bg-slate-950/40 p-6 rounded-3xl border border-slate-800/50 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Clock size={12} className="text-blue-400" /> {label}
        </p>
        <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-black uppercase">{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Strategy Yield</p>
          <p className={`text-2xl font-black font-mono tracking-tighter ${data.strategyReturn > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {data.strategyReturn?.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Alpha (vs S&P)</p>
          <p className={`text-2xl font-black font-mono tracking-tighter ${alpha > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
            {alpha > 0 ? `+${alpha.toFixed(1)}` : alpha.toFixed(1)}%
          </p>
        </div>
      </div>
      <div className="pt-2 flex items-center justify-between border-t border-slate-800/50">
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] font-black text-slate-300">{data.winRate}%</span>
          <span className="text-[8px] font-bold text-slate-600 uppercase">Win Rate</span>
        </div>
        <span className="text-[8px] font-bold text-slate-600 uppercase">Trades: {data.tradesCount}</span>
      </div>
    </div>
  );
};

export const CompanyData: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useContext(LanguageContext);
  const { addCountries } = useContext(CountryContext);
  const t = useTranslation(lang);
  
  const sectorId = params.get('sector') || SECTORS[0].id;
  const countryId = params.get('country') || 'us';
  const paramTicker = params.get('ticker');
  const countryName = COUNTRIES.find(c => c.id === countryId)?.name ?? 'United States';

  const [tickerList, setTickerList] = useState<{ticker: string, name: string}[]>([]);
  const [selectedTicker, setSelectedTicker] = useState(paramTicker || '');
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(false);

  const alertSettings = React.useMemo(() => {
    const saved = localStorage.getItem('fin_settings');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  }, []);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      setInitLoading(true);
      try {
        const list = await getRelevantTickers(sectorId, countryName, lang);
        if (ignore) return;
        setTickerList(list);
        if (!selectedTicker && list.length > 0) {
          setSelectedTicker(list[0].ticker);
        }
      } catch (e) { console.error(e); } finally { if (!ignore) setInitLoading(false); }
    };
    init();
    return () => { ignore = true; };
  }, [sectorId, countryName, lang, selectedTicker]);

  const fetchData = useCallback(async (ticker: string) => {
    if (!ticker) return;
    setLoading(true);
    setSyncStatus(false);
    try {
      const statsRes = await getCompanyStats(ticker, lang);
      const data = statsRes.data;
      setStats(data);
      
      if (data) {
         checkTechnicalAlerts(ticker, {
           rsi: data.rsi || 50, macd: data.macd || 0, adx: data.adx || 20,
           bollingerUpper: data.bollingerUpper, bollingerLower: data.bollingerLower
         }, alertSettings, lang, data.currentPrice);

         const discovered: string[] = [];
         data.revenueSources?.forEach((s: BusinessSource) => s.countries?.forEach(c => discovered.push(c)));
         data.expenditureSources?.forEach((s: BusinessSource) => s.countries?.forEach(c => discovered.push(c)));
         
         if (discovered.length > 0) {
           addCountries([...new Set(discovered)]);
           setSyncStatus(true);
           setTimeout(() => setSyncStatus(false), 4000);
         }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [lang, addCountries, alertSettings]);

  useEffect(() => {
    fetchData(selectedTicker);
  }, [selectedTicker, fetchData]);

  const RegionPills = ({ sources, title, icon, color }: { sources: BusinessSource[], title: string, icon: any, color: string }) => (
    <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl space-y-4 relative">
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none opacity-5">
         <div className={`absolute top-0 right-0 p-4 ${color}`}>{icon}</div>
      </div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">{icon} {title}</p>
      <div className="flex flex-wrap gap-1.5">
        {sources?.flatMap(s => s.countries || []).map((c, ci) => (
          <button 
            key={ci} onClick={() => navigate(`/?country=${c.toLowerCase().replace(/[^a-z0-9]/g, '_')}`)}
            className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-[9px] font-black text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all active:scale-95"
          >
            {c} <ArrowUpRight size={10} />
          </button>
        ))}
      </div>
      <div className="space-y-1.5 pt-2 relative z-10">
        {sources?.map((s, i) => (
          <div key={i} className="flex justify-between items-center text-[9px] uppercase font-black">
            <span className="text-slate-500 truncate mr-4">{s.name}</span>
            <span className="text-slate-300 font-mono">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  const EcosystemCard = ({ companies }: { companies: RelatedCompany[] }) => (
    <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-blue-500/20 shadow-2xl space-y-6">
       <div className="flex items-center gap-3">
          <Share2 className="text-blue-400" size={20} />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-white">{t('related_ecosystem')}</h3>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {companies?.map((rel, i) => (
           <button 
             key={i}
             onClick={() => {
               setSelectedTicker(rel.ticker);
               navigate(`/companies?sector=${sectorId}&country=${countryId}&ticker=${rel.ticker}`);
             }}
             className="bg-slate-950/60 p-5 rounded-3xl border border-slate-800/80 hover:border-blue-500/40 transition-all text-left group"
           >
              <div className="flex justify-between items-start mb-4">
                <div>
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                     rel.relationType === 'Competitor' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                     rel.relationType === 'Supplier' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                     'bg-blue-500/10 text-blue-400 border-blue-500/20'
                   }`}>
                      {t(`relation_${rel.relationType.toLowerCase()}` as any)}
                   </span>
                   <p className="text-lg font-black text-white mt-2 group-hover:text-blue-400 transition-colors">{rel.ticker}</p>
                   <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{rel.name}</p>
                </div>
                {rel.relationType === 'Competitor' ? <Building2 size={16} className="text-slate-700" /> : 
                 rel.relationType === 'Supplier' ? <Factory size={16} className="text-slate-700" /> : <User2 size={16} className="text-slate-700" />}
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed border-t border-slate-800/50 pt-3 italic line-clamp-2">
                {rel.relationship}
              </p>
           </button>
         ))}
       </div>
    </div>
  );

  const handleSimulateBuy = () => {
    if (!stats) return;
    const portfolio = JSON.parse(localStorage.getItem('fin_portfolio_v2') ?? '{"balance": 100000, "positions": [], "history": []}');
    const price = stats.currentPrice || 100;
    const cost = price * 10;
    if (portfolio.balance < cost) { alert('Insufficient Balance!'); return; }
    
    const newTrade: TradeRecord = { id: Math.random().toString(36).substr(2, 9), ticker: selectedTicker, type: 'BUY', price, amount: 10, timestamp: Date.now() };
    const idx = portfolio.positions.findIndex((p: any) => p.ticker === selectedTicker);
    if (idx >= 0) {
      portfolio.positions[idx].averagePrice = (portfolio.positions[idx].averagePrice * portfolio.positions[idx].amount + cost) / (portfolio.positions[idx].amount + 10);
      portfolio.positions[idx].amount += 10;
    } else {
      portfolio.positions.push({ ticker: selectedTicker, averagePrice: price, amount: 10 });
    }
    portfolio.balance -= cost;
    portfolio.history.unshift(newTrade);
    localStorage.setItem('fin_portfolio_v2', JSON.stringify(portfolio));
    alert(`Success: Purchased 10 shares of ${selectedTicker} @ $${price.toFixed(2)}`);
  };

  if (initLoading) return <div className="h-[80vh] flex flex-col items-center justify-center gap-6"><Activity className="text-blue-600 w-10 h-10 animate-pulse" /><p className="text-slate-500 font-black text-[10px] tracking-widest uppercase">{t('searching_tickers')}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 space-y-3">
          <button onClick={() => navigate(`/sectors?country=${countryId}&sector=${sectorId}`)} className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"><ArrowLeft size={16} /> Sector Overview</button>
          <div className="flex lg:flex-col overflow-x-auto gap-2 no-scrollbar">
            {tickerList.map(item => (
              <button key={item.ticker} onClick={() => setSelectedTicker(item.ticker)} className={`flex-shrink-0 lg:w-full p-4 rounded-xl border text-left transition-all ${selectedTicker === item.ticker ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
                <p className="font-black text-sm">{item.ticker}</p>
                <p className="text-[10px] truncate mt-1 opacity-70 font-bold uppercase">{item.name}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          {loading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6 bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-800"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /><p className="text-[10px] font-black uppercase text-slate-500 tracking-widest animate-pulse">Analyzing Corporate Footprint...</p></div>
          ) : stats && (
            <>
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div>
                    <h3 className="text-5xl font-black tracking-tighter text-white uppercase">{selectedTicker}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      {syncStatus && <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded animate-bounce"><CheckCircle2 size={10} /> Macro Synced</span>}
                      <p className="text-[9px] text-slate-500 uppercase font-black flex items-center gap-1"><Bell size={10} className="text-blue-500" /> Watchdog Active</p>
                    </div>
                  </div>
                  {stats.volatilityCycle && <CycleIndicator phase={stats.volatilityCycle} />}
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="text-right font-mono"><p className="text-[9px] text-slate-500 font-black uppercase mb-1">Spot Price</p><p className="text-3xl font-black text-emerald-400">${stats.currentPrice?.toFixed(2)}</p></div>
                  <button onClick={handleSimulateBuy} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-2xl flex items-center gap-2 font-black uppercase text-xs shadow-2xl active:scale-95 transition-all"><ShoppingCart size={20} /> Buy</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <RegionPills title={t('revenue_regions')} sources={stats.revenueSources} icon={<TrendingUp size={16} />} color="text-emerald-400" />
                 <RegionPills title={t('expenditure_regions')} sources={stats.expenditureSources} icon={<Target size={16} />} color="text-rose-400" />
              </div>

              {/* Related Companies Ecosystem Section */}
              <EcosystemCard companies={stats.relatedCompanies} />

              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-blue-500/10 shadow-2xl space-y-6">
                  <div className="flex items-center gap-3">
                    <History className="text-blue-500" size={20} />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Dual-Period AI Backtesting Matrix</h3>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6">
                    {stats.backtest1Y && <BacktestBlock title="Short-term" data={stats.backtest1Y} label="1 Year Performance" />}
                    {stats.backtest3Y && <BacktestBlock title="Long-term" data={stats.backtest3Y} label="3 Year Performance" />}
                  </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
                 <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3"><BarChart3 size={20} className="text-blue-500" /><h3 className="text-[11px] font-black uppercase tracking-widest text-white">12-Quarter Performance Matrix</h3></div>
                   <div className="flex gap-4 text-[9px] font-black uppercase text-slate-500"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-blue-500" /> Revenue</div><div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-emerald-500" /> Net Income</div></div>
                 </div>
                 <div className="h-72 w-full"><ComparisonBarChart data={stats.financials || []} xKey="period" bars={[{ key: 'revenue', color: '#3b82f6' }, { key: 'netIncome', color: '#10b981' }]} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                 <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl h-80 relative overflow-hidden group">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">1Y Momentum Vector</p>
                    <PriceAreaChart data={stats.priceTrend || []} xKey="date" yKey="price" color="#3b82f6" />
                 </div>
                 <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Asset Health Indicators</p>
                    <div className="grid grid-cols-2 gap-4">
                      {[{l: 'RSI (14)', v: stats.rsi, c: stats.rsi > 70 ? 'text-rose-400' : stats.rsi < 30 ? 'text-emerald-400' : 'text-blue-400', info: t('rsi_desc')},
                        {l: 'ADX Trend', v: stats.adx, c: 'text-slate-300', info: t('adx_desc')}].map((ind, i) => (
                        <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center relative">
                          <div className="absolute top-2 right-2">
                             <IndicatorTooltip text={ind.info} />
                          </div>
                          <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{ind.l}</p>
                          <p className={`text-2xl font-black font-mono ${ind.c}`}>{ind.v?.toFixed(1)}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
