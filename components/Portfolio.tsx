
import React, { useState, useEffect, useContext } from 'react';
import { Wallet, TrendingUp, TrendingDown, History, Info, Trash2, Loader2, Sparkles, PlusCircle } from 'lucide-react';
import { LanguageContext } from '../App';
import { useTranslation } from '../translations';
import { PortfolioState, Position, TradeRecord } from '../types';
import { getTradeFeedback } from '../services/geminiService';

export const Portfolio: React.FC = () => {
  const { lang } = useContext(LanguageContext);
  const t = useTranslation(lang);
  
  const [state, setState] = useState<PortfolioState>(() => {
    const saved = localStorage.getItem('fin_portfolio_v2');
    return saved ? JSON.parse(saved) : {
      balance: 100000,
      initialBalance: 100000,
      positions: [],
      history: []
    };
  });

  const [newCapital, setNewCapital] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('fin_portfolio_v2', JSON.stringify(state));
  }, [state]);

  const handleUpdateBalance = () => {
    const val = parseFloat(newCapital);
    if (!isNaN(val)) {
      setState(prev => ({
        ...prev,
        balance: val,
        initialBalance: val
      }));
      setNewCapital('');
    }
  };

  const sellPosition = async (pos: Position) => {
    // In a real app we'd fetch the latest price again, here we assume it's selling at a simulated "market" price
    // for now we'll just sell at averagePrice * random offset to simulate market change
    const marketPrice = pos.averagePrice * (1 + (Math.random() * 0.1 - 0.05));
    const profit = (marketPrice - pos.averagePrice) * pos.amount;
    
    const newRecord: TradeRecord = {
      id: Math.random().toString(36).substr(2, 9),
      ticker: pos.ticker,
      type: 'SELL',
      price: marketPrice,
      amount: pos.amount,
      timestamp: Date.now()
    };

    setAnalyzingId(newRecord.id);
    const feedback = await getTradeFeedback(pos.ticker, pos.averagePrice, marketPrice, lang);
    newRecord.aiAnalysis = feedback;

    setState(prev => ({
      ...prev,
      balance: prev.balance + (marketPrice * pos.amount),
      positions: prev.positions.filter(p => p.ticker !== pos.ticker),
      history: [newRecord, ...prev.history]
    }));
    setAnalyzingId(null);
  };

  const resetPortfolio = () => {
    if (confirm('Are you sure you want to reset your portfolio?')) {
      setState({
        balance: 100000,
        initialBalance: 100000,
        positions: [],
        history: []
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
            <Wallet size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">模擬投資資產 Portfolio</h2>
            <p className="text-4xl font-black text-white font-mono tracking-tighter">
              ${state.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="number" 
              placeholder="開始資金..."
              className="bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-4 text-sm w-40 focus:ring-2 focus:ring-blue-500 font-mono"
              value={newCapital}
              onChange={(e) => setNewCapital(e.target.value)}
            />
          </div>
          <button onClick={handleUpdateBalance} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl transition-all flex items-center gap-2 uppercase text-[10px]">
            <PlusCircle size={16} /> 設定資金
          </button>
          <button onClick={resetPortfolio} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/20">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Positions */}
        <section className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <TrendingUp size={16} /> 持有倉位 Active Positions
          </h3>
          <div className="space-y-3">
            {state.positions.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 rounded-3xl border border-dashed border-slate-800">
                <p className="text-xs text-slate-600 font-black uppercase tracking-widest">No Active Positions</p>
              </div>
            ) : state.positions.map((pos, i) => (
              <div key={i} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                   <div>
                     <p className="text-2xl font-black text-white">{pos.ticker}</p>
                     <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Avg: ${pos.averagePrice.toFixed(2)}</p>
                   </div>
                   <button 
                     onClick={() => sellPosition(pos)}
                     className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border border-rose-500/20"
                   >
                     Sell Now
                   </button>
                </div>
                <div className="mt-4 flex items-end justify-between relative z-10">
                  <div className="text-left">
                    <p className="text-[8px] text-slate-500 uppercase font-black">Quantity</p>
                    <p className="text-lg font-black font-mono text-slate-300">{pos.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-500 uppercase font-black">Market Value</p>
                    <p className="text-lg font-black font-mono text-blue-400">${(pos.averagePrice * pos.amount).toLocaleString()}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp size={80} className="text-blue-500" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trade History & AI Analysis */}
        <section className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <History size={16} /> 交易紀錄與 AI 回顧 Trade History
          </h3>
          <div className="space-y-4">
            {state.history.map((record) => (
              <div key={record.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${record.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {record.type === 'BUY' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">{record.ticker} <span className="text-[10px] text-slate-500 font-normal uppercase">{record.type}</span></p>
                      <p className="text-[10px] text-slate-500 font-mono">{new Date(record.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black font-mono text-white">${record.price.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Qty: {record.amount}</p>
                  </div>
                </div>
                {record.aiAnalysis && (
                  <div className="p-6 bg-slate-950/50">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600/10 p-1.5 rounded-lg border border-blue-500/20 mt-1">
                        <Sparkles size={14} className="text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI 交易分析建議 Analysis Feedback</p>
                        <p className="text-xs text-slate-300 leading-relaxed font-bold italic">"{record.aiAnalysis}"</p>
                      </div>
                    </div>
                  </div>
                )}
                {analyzingId === record.id && (
                  <div className="p-6 flex items-center justify-center bg-slate-950/50">
                    <Loader2 size={16} className="animate-spin text-blue-500 mr-2" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI analyzing trade strategy...</span>
                  </div>
                )}
              </div>
            ))}
            {state.history.length === 0 && (
              <div className="p-20 text-center bg-slate-900 rounded-3xl border border-slate-800 flex flex-col items-center gap-3">
                <History className="text-slate-700 w-12 h-12" />
                <p className="text-xs text-slate-600 font-black uppercase tracking-widest">No Trade History Available</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
