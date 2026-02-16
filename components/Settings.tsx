
import React, { useState, useContext } from 'react';
import { BellRing, Save, CheckCircle2, ShieldCheck, Activity, Info } from 'lucide-react';
import { INITIAL_ALERTS } from '../constants';
import { AlertSettings } from '../types';
import { LanguageContext } from '../App';
import { useTranslation } from '../translations';

export const Settings: React.FC = () => {
  const { lang } = useContext(LanguageContext);
  const t = useTranslation(lang);
  const [settings, setSettings] = useState<AlertSettings>(() => {
    const saved = localStorage.getItem('fin_settings');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });
  const [savedStatus, setSavedStatus] = useState(false);

  const handleSave = () => {
    localStorage.setItem('fin_settings', JSON.stringify(settings));
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
    
    if (Notification.permission === 'granted') {
      new Notification("FinSight Pro", { 
        body: lang === 'zh' ? "技術警報設定已同步。" : "Technical alert settings synced.",
        icon: 'https://cdn-icons-png.flaticon.com/512/2632/2632283.png'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  const handleTestNotification = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification("Test Success", { body: "Browser notifications are enabled!" });
        }
      });
    } else if (Notification.permission === 'granted') {
      new Notification("Test Success", { body: "Browser notifications are working!" });
    } else {
      alert("Please enable notifications in your browser settings for this site.");
    }
  };

  const ToggleField = ({ label, description, info, enabled, onToggle }: any) => (
    <div className={`p-6 rounded-3xl border transition-all ${enabled ? 'bg-slate-900 border-slate-700 shadow-xl' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-1">
          <label className="font-black text-xs uppercase tracking-widest text-slate-300 block">{label}</label>
          <p className="text-[10px] text-slate-500 font-bold uppercase">{description}</p>
        </div>
        <button 
          onClick={() => onToggle(!enabled)}
          className={`w-14 h-8 rounded-full p-1 transition-colors relative ${enabled ? 'bg-blue-600' : 'bg-slate-800'}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
      {enabled && <p className="text-[9px] text-blue-400 font-bold italic border-l border-blue-500/30 pl-3 mt-4">{info}</p>}
    </div>
  );

  const SliderField = ({ label, value, min, max, enabled, onToggle, onChange, info, step = 1 }: any) => (
    <div className={`p-6 rounded-3xl border transition-all ${enabled ? 'bg-slate-900 border-slate-700 shadow-xl' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}>
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-800'}`}>
            <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} className="hidden" />
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="font-black text-xs uppercase tracking-widest text-slate-300">{label}</span>
        </label>
        {enabled && <span className="text-2xl font-mono text-blue-400 font-black">{value}</span>}
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={!enabled} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-4" />
      {enabled && <p className="text-[9px] text-blue-400 font-bold italic border-l border-blue-500/30 pl-3">{info}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <BellRing size={100} />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
             {t('notifications')}
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Technical Indicator Alert Center</p>
        </div>
        <div className="flex gap-3 relative z-10">
           <button onClick={handleTestNotification} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase border border-slate-700 transition-all">
             Test Channel
           </button>
           <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase text-[10px] shadow-lg shadow-blue-600/20">
             {savedStatus ? <CheckCircle2 size={16} /> : <Save size={16} />}
             {savedStatus ? t('applied') : t('save_config')}
           </button>
        </div>
      </header>

      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <SliderField label={lang === 'zh' ? "RSI 超賣門檻 (買入)" : "RSI Oversold (Buy)"} value={settings.rsiLow} min={0} max={50} enabled={settings.rsiEnabled} onToggle={(v: any) => setSettings({...settings, rsiEnabled: v})} onChange={(v: any) => setSettings({...settings, rsiLow: v})} info={t('rsi_desc')} />
           <SliderField label={lang === 'zh' ? "RSI 超買門檻 (賣出)" : "RSI Overbought (Sell)"} value={settings.rsiHigh} min={50} max={100} enabled={settings.rsiEnabled} onToggle={(v: any) => setSettings({...settings, rsiEnabled: v})} onChange={(v: any) => setSettings({...settings, rsiHigh: v})} info={t('rsi_desc')} />
        </div>
        
        <ToggleField 
          label={lang === 'zh' ? "布林通道警報" : "Bollinger Bands Alert"} 
          description={lang === 'zh' ? "當價格觸及上軌或下軌時發送通知" : "Notify when price hits Upper/Lower bands"}
          info={t('bb_desc')}
          enabled={settings.bbEnabled} 
          onToggle={(v: any) => setSettings({...settings, bbEnabled: v})} 
        />

        <SliderField label={t('macd_label')} value={settings.macdHigh} min={-2} max={2} step={0.1} enabled={settings.macdEnabled} onToggle={(v: any) => setSettings({...settings, macdEnabled: v})} onChange={(v: any) => setSettings({...settings, macdHigh: v})} info={t('macd_desc')} />
        <SliderField label={t('adx_label')} value={settings.adxHigh} min={0} max={60} enabled={settings.adxEnabled} onToggle={(v: any) => setSettings({...settings, adxEnabled: v})} onChange={(v: any) => setSettings({...settings, adxHigh: v})} info={t('adx_desc')} />
      </div>

      <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-3xl flex items-start gap-4">
         <ShieldCheck className="text-blue-500 flex-shrink-0" size={24} />
         <div className="space-y-1">
           <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Alert Engine Context</p>
           <p className="text-xs text-slate-400 font-bold leading-relaxed">
             當您在板塊或公司頁面查看數據時，系統會自動在背景檢查技術指標。若符合設定條件，FinSight 會發送即時通知至您的設備。
           </p>
         </div>
      </div>
    </div>
  );
};
