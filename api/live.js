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
];

async function quote([name, symbol, sector, country]) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`${symbol}: ${response.status}`);
  const result = (await response.json()).chart?.result?.[0];
  const meta = result?.meta || {};
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const price = [...closes].reverse().find(value => value != null) ?? meta.regularMarketPrice;
  const previousClose = meta.chartPreviousClose ?? meta.previousClose;
  return { name, symbol, sector, country, currency: meta.currency, exchange: meta.exchangeName, price, previousClose, changePct: previousClose ? (price / previousClose - 1) * 100 : null, marketTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null };
}

async function marketQuote([asset, symbol, convention, invert]) {
  const item = await quote([asset, symbol, convention, "Market"]);
  if (item.unavailable) return item;
  const price = invert ? 1 / item.price : item.price;
  const previousClose = invert ? 1 / item.previousClose : item.previousClose;
  return { asset, symbol, convention, price, previousClose, changePct: previousClose ? (price / previousClose - 1) * 100 : null, marketTime: item.marketTime };
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
