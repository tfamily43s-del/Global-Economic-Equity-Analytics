
import { Language } from './types';

export const translations = {
  nav_economy: { en: 'Global Economy', zh: '全球經濟' },
  nav_sectors: { en: 'Sector Data', zh: '板塊資料' },
  nav_companies: { en: 'Company Analytics', zh: '公司資料' },
  nav_settings: { en: 'Alert Settings', zh: '技術指標設定' },
  search_placeholder: { en: 'Search...', zh: '搜尋...' },
  volatility_cycle: { en: 'Volatility Cycle', zh: '波幅周期階段' },
  cycle_expansion: { en: 'Expansion (Bullish)', zh: '擴張期 (看好)' },
  cycle_peak: { en: 'Peak (Overheated)', zh: '頂峰期 (過熱)' },
  cycle_contraction: { en: 'Contraction (Bearish)', zh: '收縮期 (看淡)' },
  cycle_trough: { en: 'Trough (Recovery)', zh: '谷底期 (復甦)' },
  revenue_regions: { en: 'Major Revenue Regions', zh: '主要收入地區' },
  expenditure_regions: { en: 'Major Supply/Expense Regions', zh: '主要支出/供應鏈地區' },
  discovered_link: { en: 'Sync to Economy Page', zh: '同步至國家頁面' },
  mode_en: { en: 'English', zh: '英文' },
  mode_zh: { en: 'Chinese', zh: '中文' },
  mode_bi: { en: 'Bilingual', zh: '中英對照' },
  last_updated: { en: 'Data Updated', zh: '數據最後更新' },
  searching_tickers: { en: 'Searching for local tickers', zh: '正在搜尋本地股票代碼' },
  notifications: { en: 'Notifications', zh: '通知設定' },
  save_config: { en: 'Save Configuration', zh: '儲存設定' },
  applied: { en: 'Applied', zh: '已套用' },
  macd_label: { en: 'MACD Condition', zh: 'MACD 條件' },
  adx_label: { en: 'ADX Strength', zh: 'ADX 強度' },
  language: { en: 'Language', zh: '語言設定' },
  sector_tickers: { en: 'Representative Tickers', zh: '板塊代表性股票' },
  related_ecosystem: { en: 'Corporate Ecosystem & Peer Analysis', zh: '企業關聯與生態系分析' },
  relation_type: { en: 'Relation', zh: '關聯類型' },
  relation_competitor: { en: 'Competitor', zh: '競爭對手' },
  relation_supplier: { en: 'Supplier', zh: '供應商' },
  relation_customer: { en: 'Customer', zh: '客戶' },
  relation_partner: { en: 'Partner', zh: '合作夥伴' },
  
  // 註釋說明
  impact_score_desc: {
    en: "AI-calculated composite score based on current macro events. >0 indicates growth momentum, <0 indicates risk of contraction.",
    zh: "AI 根據當前宏觀事件計算的綜合評分。>0 代表增長動能強勁，<0 代表經濟面臨收縮風險。"
  },
  rsi_desc: { 
    en: 'Relative Strength Index (0-100). >70 is Overbought (Sell signal), <30 is Oversold (Buy signal).', 
    zh: '相對強弱指數。>70 代表市場過熱（賣出訊號），<30 代表過度拋售（買入訊號）。' 
  },
  macd_desc: { 
    en: 'Moving Average Convergence Divergence. Positive values show upward momentum, negative show downward.', 
    zh: '指數平滑異同移動平均線。正數代表上升動能強勁，負數代表下跌壓力較大。' 
  },
  adx_desc: { 
    en: 'Average Directional Index. >25 indicates a strong trend is present, regardless of direction.', 
    zh: '平均趨向指數。>25 代表目前存在強勁趨勢（無論漲跌），低於 20 代表市場處於震盪。' 
  },
  bb_desc: { 
    en: 'Bollinger Bands. Measures volatility. Price touching the upper band may be overextended.', 
    zh: '布林通道。衡量波動率。價格觸及上軌代表過度擴張，觸及下軌代表可能跌深反彈。' 
  }
};

export const useTranslation = (lang: Language) => {
  return (key: keyof typeof translations) => {
    const item = translations[key];
    if (lang === 'en') return item.en;
    if (lang === 'zh') return item.zh;
    return `${item.en} / ${item.zh}`;
  };
};
