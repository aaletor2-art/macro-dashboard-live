const countries = {
  "united-kingdom": { name: "United Kingdom", iso: "GBR", fred: "GBRCPIALLMINMEI" },
  "united-states": { name: "United States", iso: "USA", fred: "CPIAUCSL" },
  "euro-area": { name: "Euro Area", iso: "EMU", fred: "CP0000EZ19M086NEST" },
  japan: { name: "Japan", iso: "JPN", fred: "JPNCPIALLMINMEI" }, china: { name: "China", iso: "CHN", fred: "CHNCPIALLMINMEI" },
  india: { name: "India", iso: "IND", fred: "INDCPIALLMINMEI" }, "south-korea": { name: "South Korea", iso: "KOR", fred: "KORCPIALLMINMEI" },
  taiwan: { name: "Taiwan", iso: "TWN" }, singapore: { name: "Singapore", iso: "SGP" }, "hong-kong": { name: "Hong Kong", iso: "HKG" },
  australia: { name: "Australia", iso: "AUS", fred: "AUSCPIALLQINMEI" }, canada: { name: "Canada", iso: "CAN", fred: "CANCPIALLMINMEI" },
  brazil: { name: "Brazil", iso: "BRA", fred: "BRACPIALLMINMEI" }, mexico: { name: "Mexico", iso: "MEX", fred: "MEXCPIALLMINMEI" },
  nigeria: { name: "Nigeria", iso: "NGA" }, "south-africa": { name: "South Africa", iso: "ZAF", fred: "ZAFCPIALLMINMEI" },
  egypt: { name: "Egypt", iso: "EGY" }, kenya: { name: "Kenya", iso: "KEN" }, ghana: { name: "Ghana", iso: "GHA" },
  morocco: { name: "Morocco", iso: "MAR" }, angola: { name: "Angola", iso: "AGO" }, ethiopia: { name: "Ethiopia", iso: "ETH" },
  "cote-d-ivoire": { name: "Cote d'Ivoire", iso: "CIV" }, rwanda: { name: "Rwanda", iso: "RWA" }
};

function csvRows(csv) {
  return csv.trim().split(/\r?\n/).slice(1).map(line => {
    const [date, raw] = line.split(","); const value = Number(raw);
    return Number.isFinite(value) ? { date, value } : null;
  }).filter(Boolean);
}

async function monthlyInflation(series) {
  const response = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}`, { signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error(`FRED ${response.status}`);
  const index = csvRows(await response.text());
  const byMonth = new Map(index.map(item => [item.date.slice(0, 7), item.value]));
  return index.map(item => {
    const date = new Date(`${item.date}T00:00:00Z`);
    const key = `${date.getUTCFullYear() - 1}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const prior = byMonth.get(key);
    return prior ? { date: item.date, value: (item.value / prior - 1) * 100 } : null;
  }).filter(Boolean).slice(-72);
}

async function annualInflation(iso) {
  const response = await fetch(`https://api.worldbank.org/v2/country/${iso}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=70`, { signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error(`World Bank ${response.status}`);
  const payload = await response.json();
  return (payload?.[1] || []).filter(item => Number.isFinite(item.value)).map(item => ({ date: `${item.date}-01-01`, value: item.value })).sort((a,b) => a.date.localeCompare(b.date)).slice(-25);
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
  const slug = String(request.query?.country || "china").toLowerCase();
  const country = countries[slug];
  if (!country) return response.status(404).json({ error: "Country not mapped" });
  let observations = [], frequency = "annual", source = "World Bank";
  if (country.fred) {
    try { observations = await monthlyInflation(country.fred); frequency = country.fred.includes("QIN") ? "quarterly" : "monthly"; source = "FRED / OECD CPI index"; } catch {}
  }
  if (!observations.length) observations = await annualInflation(country.iso);
  return response.status(200).json({ country: country.name, indicator: "Consumer price inflation", unit: "% year on year", frequency, source, sourceUrl: source.startsWith("FRED") ? `https://fred.stlouisfed.org/series/${country.fred}` : `https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=${country.iso}`, generatedAt: new Date().toISOString(), observations });
}
