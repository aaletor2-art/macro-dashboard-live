const companies = [
  ["Apple", "AAPL", "Technology", "United States"],
  ["Microsoft", "MSFT", "Technology", "United States"],
  ["NVIDIA", "NVDA", "Technology", "United States"],
  ["TSMC", "TSM", "Technology", "Taiwan"],
  ["HSBC", "HSBA.L", "Banks", "United Kingdom"],
  ["Barclays", "BARC.L", "Banks", "United Kingdom"],
  ["JPMorgan Chase", "JPM", "Banks", "United States"],
  ["Shell", "SHEL.L", "Energy", "United Kingdom"],
  ["BP", "BP.L", "Energy", "United Kingdom"],
  ["Exxon Mobil", "XOM", "Energy", "United States"],
  ["BHP", "BHP.AX", "Mining", "Australia"],
  ["Rio Tinto", "RIO.L", "Mining", "United Kingdom"],
  ["Caterpillar", "CAT", "Industrials", "United States"],
  ["Siemens", "SIE.DE", "Industrials", "Euro Area"]
];

const marketAssets = [
  ["Australian Dollar", "AUDUSD=X", "USD per 1 AUD", false], ["Canadian Dollar", "CAD=X", "USD per 1 CAD", true], ["Swiss Franc", "CHF=X", "USD per 1 CHF", true], ["Euro", "EURUSD=X", "USD per 1 EUR", false], ["British Pound", "GBPUSD=X", "USD per 1 GBP", false], ["Japanese Yen", "JPY=X", "USD per 1 JPY", true], ["New Zealand Dollar", "NZDUSD=X", "USD per 1 NZD", false], ["US Dollar Index", "DX-Y.NYB", "Index points", false], ["Gold", "GC=F", "USD futures price", false], ["Silver", "SI=F", "USD futures price", false], ["WTI Crude", "CL=F", "USD futures price", false], ["Brent Crude", "BZ=F", "USD futures price", false], ["Natural Gas", "NG=F", "USD futures price", false], ["Copper", "HG=F", "USD futures price", false], ["Corn", "ZC=F", "USD futures price", false], ["Wheat", "ZW=F", "USD futures price", false], ["Soybeans", "ZS=F", "USD futures price", false], ["Coffee", "KC=F", "USD futures price", false], ["Cocoa", "CC=F", "USD futures price", false]
  ,["Chinese Yuan","CNY=X","USD per 1 CNY",true],["Indian Rupee","INR=X","USD per 1 INR",true],["South Korean Won","KRW=X","USD per 1 KRW",true],["Taiwan Dollar","TWD=X","USD per 1 TWD",true],["Singapore Dollar","SGD=X","USD per 1 SGD",true],["Hong Kong Dollar","HKD=X","USD per 1 HKD",true],["Brazilian Real","BRL=X","USD per 1 BRL",true],["Mexican Peso","MXN=X","USD per 1 MXN",true],["Nigerian Naira","NGN=X","USD per 1 NGN",true],["South African Rand","ZAR=X","USD per 1 ZAR",true],["Egyptian Pound","EGP=X","USD per 1 EGP",true],["Kenyan Shilling","KES=X","USD per 1 KES",true],["Ghanaian Cedi","GHS=X","USD per 1 GHS",true],["Moroccan Dirham","MAD=X","USD per 1 MAD",true],["Angolan Kwanza","AOA=X","USD per 1 AOA",true],["Ethiopian Birr","ETB=X","USD per 1 ETB",true],["West African CFA Franc","XOF=X","USD per 1 XOF",true],["Rwandan Franc","RWF=X","USD per 1 RWF",true]
];

function technicals(closes, highs, lows) {
  const clean = closes.filter(value => Number.isFinite(value));
  const window = clean.slice(-20);
  if (window.length < 14) return null;
  const middle = window.reduce((sum, value) => sum + value, 0) / window.length;
  const deviation = Math.sqrt(window.reduce((sum, value) => sum + (value - middle) ** 2, 0) / window.length);
  const upper = middle + deviation * 2;
  const lower = middle - deviation * 2;
  const last = clean.at(-1);
  const completeCandleIndices = closes
    .map((value, index) => Number.isFinite(value) ? index : -1)
    .filter(index => index >= 0)
    .slice(-3);
  const kValues = completeCandleIndices.map(index => {
    const start = Math.max(0, index - 13);
    const highWindow = highs.slice(start, index + 1).filter(Number.isFinite);
    const lowWindow = lows.slice(start, index + 1).filter(Number.isFinite);
    if (!highWindow.length || !lowWindow.length) return 50;
    const high = Math.max(...highWindow);
    const low = Math.min(...lowWindow);
    return high === low ? 50 : ((closes[index] - low) / (high - low)) * 100;
  });
  const stochasticK = kValues.at(-1);
  const stochasticD = kValues.reduce((sum, value) => sum + value, 0) / kValues.length;
  return { bollinger: { upper, middle, lower, position: last >= upper ? "Above upper" : last <= lower ? "Below lower" : last >= middle ? "Upper half" : "Lower half" }, stochastic: { k: stochasticK, d: stochasticD, state: stochasticK >= 80 ? "Overbought" : stochasticK <= 20 ? "Oversold" : "Neutral" } };
}

async function quote([name, symbol, sector, country], options = {}) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`${symbol}: ${response.status}`);
  const result = (await response.json()).chart?.result?.[0];
  const meta = result?.meta || {};
  const raw = result?.indicators?.quote?.[0] || {};
  const invertValue = value => options.invert && value ? 1 / value : value;
  const closes = (raw.close || []).map(invertValue);
  const highs = (raw.high || []).map((value, index) => options.invert && raw.low?.[index] ? 1 / raw.low[index] : value);
  const lows = (raw.low || []).map((value, index) => options.invert && raw.high?.[index] ? 1 / raw.high[index] : value);
  const price = [...closes].reverse().find(value => value != null) ?? invertValue(meta.regularMarketPrice);
  const previousClose = invertValue(meta.chartPreviousClose ?? meta.previousClose);
  return { name, symbol, sector, country, currency: meta.currency, exchange: meta.exchangeName, price, previousClose, changePct: previousClose ? (price / previousClose - 1) * 100 : null, marketTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null, ...(options.technical ? { technical: technicals(closes, highs, lows), chart: closes.filter(Number.isFinite).slice(-30) } : {}) };
}

async function marketQuote([asset, symbol, convention, invert]) {
  const item = await quote([asset, symbol, convention, "Market"], { invert, technical: true });
  if (item.unavailable) return item;
  return { asset, symbol, convention, price: item.price, previousClose: item.previousClose, changePct: item.changePct, marketTime: item.marketTime, technical: item.technical, chart: item.chart };
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");
  const results = await Promise.all(companies.map(async company => {
    try { return await quote(company); }
    catch { return { name: company[0], symbol: company[1], sector: company[2], country: company[3], unavailable: true }; }
  }));
  const markets = await Promise.all(marketAssets.map(async asset => {
    try { return await marketQuote(asset); }
    catch { return { asset: asset[0], symbol: asset[1], convention: asset[2], unavailable: true }; }
  }));
  response.status(200).json({ generatedAt: new Date().toISOString(), cadence: "5-minute cache", companies: results, markets });
}
