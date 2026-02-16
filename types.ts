
export type Language = 'en' | 'zh' | 'bi';

export type CyclePhase = 'Expansion' | 'Peak' | 'Contraction' | 'Trough';

export interface ImpactTimeline {
  short: string;
  medium: string;
  long: string;
}

export interface DetailedImpact {
  priceVolatility: ImpactTimeline;
  demandChange: ImpactTimeline;
  policyRisk: ImpactTimeline;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: number;
  adx: number;
  bollingerUpper?: number;
  bollingerLower?: number;
  volatilityCycle?: CyclePhase;
}

export interface BusinessSource {
  name: string;
  percentage: number;
  countries: string[];
}

export interface BacktestResult {
  strategyReturn: number;
  benchmarkReturn: number;
  winRate: number;
  tradesCount: number;
}

export interface RelatedCompany {
  ticker: string;
  name: string;
  relationship: string;
  relationType: 'Competitor' | 'Supplier' | 'Customer' | 'Partner';
}

export interface CompanyStats extends TechnicalIndicators {
  financials: any[];
  priceTrend: { date: string; price: number }[];
  backtest1Y: BacktestResult;
  backtest3Y: BacktestResult;
  revenueSources: BusinessSource[];
  expenditureSources: BusinessSource[];
  relatedCompanies: RelatedCompany[];
  buyReasons: string[];
  sellReasons: string[];
  currentPrice: number;
}

export interface SectorTicker {
  ticker: string;
  name: string;
  relatedTickers?: string[];
}

export interface SectorTechnicalStats extends TechnicalIndicators {
  median: { rsi: number; macd: number; adx: number; };
  dispersion: { rsi: number; macd: number; adx: number; };
  suggestedSensitivity: 'High' | 'Normal' | 'Low';
}

export interface NewsItem {
  title: string;
  url: string;
  source: string; 
  date: string;
  sentimentScore: number;
  reason: string;
  expectedImpact: DetailedImpact;
}

export interface EconomicAnalysis {
  title: string;
  impactScore: number;
  description: string;
  policyFocus: string;
}

export interface AlertSettings {
  rsiLow: number;
  rsiHigh: number;
  rsiEnabled: boolean;
  macdHigh: number;
  macdEnabled: boolean;
  adxHigh: number;
  adxEnabled: boolean;
  bbEnabled: boolean;
}

export interface Position {
  ticker: string;
  averagePrice: number;
  amount: number;
}

export interface TradeRecord {
  id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  timestamp: number;
  aiAnalysis?: string;
}

export interface PortfolioState {
  balance: number;
  initialBalance: number;
  positions: Position[];
  history: TradeRecord[];
}
