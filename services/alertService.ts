
import { AlertSettings, TechnicalIndicators } from "../types";

const ALERTS_COOLDOWN = 3600000; // 1 hour in ms

export const checkTechnicalAlerts = (
  symbol: string, 
  data: TechnicalIndicators, 
  settings: AlertSettings,
  lang: 'en' | 'zh' | 'bi',
  currentPrice?: number
) => {
  const lastAlertKey = `last_alert_${symbol}`;
  const lastAlert = localStorage.getItem(lastAlertKey);
  
  if (lastAlert && Date.now() - parseInt(lastAlert) < ALERTS_COOLDOWN) {
    return; // Still in cooldown
  }

  const signals: string[] = [];

  // 1. RSI Checks
  if (settings.rsiEnabled) {
    if (data.rsi <= settings.rsiLow) {
      signals.push(lang === 'zh' ? `買入訊號：RSI 超賣 (${data.rsi.toFixed(1)})` : `BUY SIGNAL: RSI Oversold (${data.rsi.toFixed(1)})`);
    } else if (data.rsi >= settings.rsiHigh) {
      signals.push(lang === 'zh' ? `賣出訊號：RSI 超買 (${data.rsi.toFixed(1)})` : `SELL SIGNAL: RSI Overbought (${data.rsi.toFixed(1)})`);
    }
  }

  // 2. Bollinger Bands Checks
  if (settings.bbEnabled && currentPrice && data.bollingerUpper && data.bollingerLower) {
    if (currentPrice <= data.bollingerLower) {
      signals.push(lang === 'zh' ? `買入訊號：價格觸及布林下軌 (${currentPrice.toFixed(2)})` : `BUY SIGNAL: Price hit BB Lower (${currentPrice.toFixed(2)})`);
    } else if (currentPrice >= data.bollingerUpper) {
      signals.push(lang === 'zh' ? `賣出訊號：價格觸及布林上軌 (${currentPrice.toFixed(2)})` : `SELL SIGNAL: Price hit BB Upper (${currentPrice.toFixed(2)})`);
    }
  }

  // 3. MACD Checks
  if (settings.macdEnabled && data.macd >= settings.macdHigh) {
    signals.push(lang === 'zh' ? `警告：MACD 轉強 (${data.macd.toFixed(2)})` : `ALERT: MACD Strengthening (${data.macd.toFixed(2)})`);
  }

  // 4. ADX Strength
  if (settings.adxEnabled && data.adx >= settings.adxHigh) {
    signals.push(lang === 'zh' ? `趨勢確認：ADX 強勁 (${data.adx.toFixed(1)})` : `TREND CONFIRMED: ADX Strong (${data.adx.toFixed(1)})`);
  }

  if (signals.length > 0) {
    triggerNotification(symbol, signals.join('\n'));
    localStorage.setItem(lastAlertKey, Date.now().toString());
  }
};

const triggerNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(`FinSight Alert: ${title}`, {
      body,
      icon: 'https://cdn-icons-png.flaticon.com/512/2632/2632283.png'
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        triggerNotification(title, body);
      }
    });
  }
};
