
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const CACHE_KEY_PREFIX = 'fins_v25_'; 

const withSmartCache = async (key: string, duration: 'weekly' | 'hourly' | 'none', fetcher: () => Promise<any>) => {
  if (duration !== 'none') {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const ttl = duration === 'weekly' ? 7 * 24 * 3600000 : 3600000;
      if (Date.now() - timestamp < ttl) return { data, timestamp };
    }
  }
  const freshData = await fetcher();
  const updateTime = Date.now();
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({ data: freshData, timestamp: updateTime }));
  } catch (e) { localStorage.clear(); } 
  return { data: freshData, timestamp: updateTime };
};

const getLangPrompt = (l: Language) => l === 'en' ? "Return English." : l === 'zh' ? "回傳繁體中文。" : "Use Bilingual (Eng/CHT).";

const businessSourceSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    percentage: { type: Type.NUMBER },
    countries: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};

const relatedCompanySchema = {
  type: Type.OBJECT,
  properties: {
    ticker: { type: Type.STRING },
    name: { type: Type.STRING },
    relationship: { type: Type.STRING },
    relationType: { type: Type.STRING, enum: ['Competitor', 'Supplier', 'Customer', 'Partner'] }
  },
  required: ["ticker", "name", "relationship", "relationType"]
};

const backtestSchema = {
  type: Type.OBJECT,
  properties: {
    strategyReturn: { type: Type.NUMBER },
    benchmarkReturn: { type: Type.NUMBER },
    winRate: { type: Type.NUMBER },
    tradesCount: { type: Type.INTEGER }
  },
  required: ["strategyReturn", "benchmarkReturn", "winRate", "tradesCount"]
};

const technicalsSchema = {
  type: Type.OBJECT,
  properties: {
    rsi: { type: Type.NUMBER },
    macd: { type: Type.NUMBER },
    adx: { type: Type.NUMBER },
    bollingerUpper: { type: Type.NUMBER },
    bollingerLower: { type: Type.NUMBER },
    volatilityCycle: { type: Type.STRING, enum: ["Expansion", "Peak", "Contraction", "Trough"] }
  },
  required: ["rsi", "macd", "adx", "bollingerUpper", "bollingerLower", "volatilityCycle"]
};

export const getSectorStats = async (sector: string, country: string, lang: Language) => {
  return withSmartCache(`sec_${country}_${sector}_${lang}`, 'weekly', async () => {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Industry analysis for ${country} ${sector}. Determine Volatility Cycle. ${getLangPrompt(lang)}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            technicals: technicalsSchema,
            median: { type: Type.OBJECT, properties: { rsi: { type: Type.NUMBER }, macd: { type: Type.NUMBER }, adx: { type: Type.NUMBER } } },
            dispersion: { type: Type.OBJECT, properties: { rsi: { type: Type.NUMBER }, macd: { type: Type.NUMBER }, adx: { type: Type.NUMBER } } },
            suggestedSensitivity: { type: Type.STRING, enum: ["High", "Normal", "Low"] }
          }
        }
      }
    });
    return JSON.parse(res.text);
  });
};

export const getCompanyStats = async (ticker: string, lang: Language) => {
  return withSmartCache(`com_v15_${ticker}_${lang}`, 'weekly', async () => {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Deep dive for ${ticker}. Provide 1Y/3Y backtesting. Analyze related listed companies (competitors/supply chain). ${getLangPrompt(lang)}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentPrice: { type: Type.NUMBER },
            rsi: { type: Type.NUMBER },
            macd: { type: Type.NUMBER },
            adx: { type: Type.NUMBER },
            bollingerUpper: { type: Type.NUMBER },
            bollingerLower: { type: Type.NUMBER },
            volatilityCycle: { type: Type.STRING, enum: ["Expansion", "Peak", "Contraction", "Trough"] },
            backtest1Y: backtestSchema,
            backtest3Y: backtestSchema,
            financials: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { period: { type: Type.STRING }, revenue: { type: Type.NUMBER }, netIncome: { type: Type.NUMBER } } } },
            priceTrend: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, price: { type: Type.NUMBER } } } },
            revenueSources: { type: Type.ARRAY, items: businessSourceSchema },
            expenditureSources: { type: Type.ARRAY, items: businessSourceSchema },
            relatedCompanies: { type: Type.ARRAY, items: relatedCompanySchema },
            buyReasons: { type: Type.ARRAY, items: { type: Type.STRING } },
            sellReasons: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["currentPrice", "backtest1Y", "backtest3Y", "financials", "priceTrend", "relatedCompanies"]
        }
      }
    });
    return JSON.parse(res.text);
  });
};

export const getEconomicStats = async (country: string, lang: Language) => {
  return withSmartCache(`eco_stats_v8_${country}_${lang}`, 'weekly', async () => {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `GDP%, Inflation%, Interest Rate% for ${country} last 5 years. ${getLangPrompt(lang)}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { period: { type: Type.STRING }, gdp: { type: Type.NUMBER }, inflation: { type: Type.NUMBER }, interestRate: { type: Type.NUMBER } }
          }
        }
      }
    });
    return JSON.parse(res.text);
  });
};

export const getEconomicAnalysis = async (country: string, lang: Language, force = false) => {
  return withSmartCache(`eco_analysis_v5_${country}_${lang}`, force ? 'none' : 'hourly', async () => {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Key macro events for ${country}. ${getLangPrompt(lang)}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { title: { type: Type.STRING }, impactScore: { type: Type.INTEGER }, description: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(res.text);
  });
};

export const getLatestNews = async (subject: string, lang: Language, force = false) => {
  return withSmartCache(`news_v5_${subject}_${lang}`, force ? 'none' : 'hourly', async () => {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search real-time news for ${subject}. Provide source and URL. ${getLangPrompt(lang)}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { 
              title: { type: Type.STRING }, 
              url: { type: Type.STRING }, 
              source: { type: Type.STRING },
              sentimentScore: { type: Type.INTEGER }, 
              date: { type: Type.STRING },
              expectedImpact: {
                type: Type.OBJECT,
                properties: {
                  priceVolatility: { type: Type.OBJECT, properties: { short: { type: Type.STRING }, medium: { type: Type.STRING }, long: { type: Type.STRING } } },
                  demandChange: { type: Type.OBJECT, properties: { short: { type: Type.STRING }, medium: { type: Type.STRING }, long: { type: Type.STRING } } },
                  policyRisk: { type: Type.OBJECT, properties: { short: { type: Type.STRING }, medium: { type: Type.STRING }, long: { type: Type.STRING } } }
                }
              },
              reason: { type: Type.STRING }
            },
            required: ["title", "url", "source", "date", "expectedImpact"]
          }
        }
      }
    });
    return JSON.parse(res.text);
  });
};

export const getRelevantTickers = async (sector: string, country: string, lang: Language) => {
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `CRITICAL: List exactly 10 leading listed companies in ${country} ${sector}. 
    For each, identify 1-2 major related listed tickers.
    STRICT: Do NOT include any conversational text, explanations, or sentences inside the JSON fields. 
    The 'ticker' field must contain ONLY the stock code (e.g. "0700.HK").
    The 'name' field must contain ONLY the company name.
    ${getLangPrompt(lang)}`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { 
          type: Type.OBJECT, 
          properties: { 
            ticker: { type: Type.STRING }, 
            name: { type: Type.STRING },
            relatedTickers: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["ticker", "name"]
        }
      }
    }
  });
  return JSON.parse(res.text);
};

export const getTradeFeedback = async (ticker: string, buy: number, sell: number, lang: Language) => {
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Critique trade for ${ticker}. ${getLangPrompt(lang)}`,
  });
  return res.text;
};
