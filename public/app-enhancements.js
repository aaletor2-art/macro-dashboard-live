(() => {
  const flags = {
    "United Kingdom":"🇬🇧","United States":"🇺🇸","Euro Area":"🇪🇺",Japan:"🇯🇵",China:"🇨🇳",India:"🇮🇳","South Korea":"🇰🇷",Taiwan:"🇹🇼",Singapore:"🇸🇬","Hong Kong":"🇭🇰",Australia:"🇦🇺",Canada:"🇨🇦",Brazil:"🇧🇷",Mexico:"🇲🇽",Nigeria:"🇳🇬","South Africa":"🇿🇦",Egypt:"🇪🇬",Kenya:"🇰🇪",Ghana:"🇬🇭",Morocco:"🇲🇦",Angola:"🇦🇴",Ethiopia:"🇪🇹","Cote d'Ivoire":"🇨🇮",Rwanda:"🇷🇼"
  };
  const countryCodes = {
    "United Kingdom":"united-kingdom","United States":"united-states","Euro Area":"euro-area",Japan:"japan",China:"china",India:"india","South Korea":"south-korea",Taiwan:"taiwan",Singapore:"singapore","Hong Kong":"hong-kong",Australia:"australia",Canada:"canada",Brazil:"brazil",Mexico:"mexico",Nigeria:"nigeria","South Africa":"south-africa",Egypt:"egypt",Kenya:"kenya",Ghana:"ghana",Morocco:"morocco",Angola:"angola",Ethiopia:"ethiopia","Cote d'Ivoire":"cote-d-ivoire",Rwanda:"rwanda"
  };
  let hosted = { assets: [], news: [], generatedAt: null, date: null };

  const pct = value => value == null ? "n/a" : `${Number(value).toFixed(2).replace(/\.00$/, "")}%`;
  const number = (value, digits = 2) => value == null ? "n/a" : Number(value).toLocaleString("en-GB", { maximumFractionDigits: digits });
  const realRateFor = row => row.rate == null ? null : row.rate - row.inflation;
  const latestIndicator = name => templateIndicators.find(item => item.market === name);
  const sourceQuery = name => encodeURIComponent(`${name} economy inflation central bank`);

  function interpretation(row) {
    const real = realRateFor(row);
    if (row.temp === "Hot") return `${row.market} is in a high-pressure macro regime. ${real != null && real < 0 ? "The policy rate is still below inflation in real terms, so credibility and currency stability remain central." : "Policy is restrictive, but inflation or currency risk still limits room to ease."} The immediate watch list is ${row.watch.toLowerCase()}.`;
    if (row.temp === "Cool") return `${row.market} has relatively subdued inflation pressure. The balance of risk leans toward demand support, but policymakers still need to watch ${row.watch.toLowerCase()}.`;
    if (row.temp === "Special") return `${row.market} does not fit a simple policy-rate comparison because monetary conditions are managed primarily through the exchange-rate framework. Focus on ${row.watch.toLowerCase()}.`;
    return `${row.market} sits in a ${row.temp.toLowerCase()} policy regime. The current bias is ${row.bias.toLowerCase()}, with ${row.watch.toLowerCase()} likely to determine the next shift.`;
  }

  function route() {
    const raw = location.hash.slice(1) || "overview";
    const [key, value] = raw.split("=");
    const pageName = key === "country" ? "country" : ["overview","countries","markets","updates"].includes(key) ? key : "overview";
    document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.dataset.page === pageName));
    document.querySelectorAll(".site-nav a").forEach(link => link.classList.toggle("active", link.dataset.route === (pageName === "country" ? "countries" : pageName)));
    if (pageName === "country") renderCountry(decodeURIComponent(value || "United Kingdom"));
    if (pageName === "markets") renderMarkets();
    if (pageName === "updates") renderNews();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderCountryGrid() {
    const grid = document.getElementById("country-grid");
    const select = document.getElementById("country-select");
    grid.innerHTML = markets.map(row => `
      <a class="country-card" href="#country=${encodeURIComponent(row.market)}">
        <div class="country-card-top"><span class="flag" aria-hidden="true">${flags[row.market] || "🌍"}</span><span class="badge ${badgeClass(row.temp)}">${row.temp}</span></div>
        <h3>${row.market}</h3><p>${row.bias} · ${row.watch}</p>
        <div class="country-mini-metrics"><span>Inflation<strong>${pct(row.inflation)}</strong></span><span>Policy rate<strong>${pct(row.rate)}</strong></span><span>Pressure<strong>${row.pressure}/100</strong></span></div>
      </a>`).join("");
    select.innerHTML = `<option value="">Choose country…</option>${markets.map(row => `<option value="${encodeURIComponent(row.market)}">${flags[row.market] || "🌍"} ${row.market}</option>`).join("")}`;
    select.addEventListener("change", event => { if (event.target.value) location.hash = `country=${event.target.value}`; });
  }

  function releaseRows(country) {
    const data = latestIndicator(country);
    if (!data) return `<div class="empty-state">No workbook release row is mapped for this market yet. Use the official source links below for the latest national release.</div>`;
    const fields = [["Inflation",data.cpi],["GDP",data.gdp],["Manufacturing PMI",data.man_pmi],["Services PMI",data.serv_pmi],["Unemployment",data.unemp],["Business confidence",data.bus_conf]];
    return `<div class="release-list">${fields.map(([label,item]) => `<div class="release-row"><div><strong>${label}</strong><small>Previous ${number(item.previous,1)} · Forecast ${number(item.forecast,1)}</small></div><span class="badge ${signalClass(item.change || 0)}">${number(item.current,1)}</span></div>`).join("")}</div>`;
  }

  function renderCountry(name) {
    const row = markets.find(item => item.market === name) || markets[0];
    const real = realRateFor(row);
    const gini = giniData[row.market];
    const teSlug = countryCodes[row.market] || row.market.toLowerCase().replaceAll(" ", "-");
    document.getElementById("country-profile").innerHTML = `
      <div class="profile-hero">
        <div class="profile-title"><span class="flag" aria-hidden="true">${flags[row.market] || "🌍"}</span><div><span class="eyebrow">${row.region.toUpperCase()}</span><h2>${row.market}</h2><p>${row.bias} · Last dashboard refresh ${hosted.date || "pending"}</p></div></div>
        <div class="pressure-dial" style="--score:${row.pressure}"><div><strong>${row.pressure}</strong><span>PRESSURE / 100</span></div></div>
      </div>
      <div class="profile-grid">
        <div class="insight-card"><h3>Macro snapshot</h3><div class="profile-metrics">
          <div class="profile-metric"><span>INFLATION</span><strong>${pct(row.inflation)}</strong><small>Annual CPI baseline</small></div>
          <div class="profile-metric"><span>POLICY RATE</span><strong>${pct(row.rate)}</strong><small>${row.rate == null ? "FX framework" : "Listed policy rate"}</small></div>
          <div class="profile-metric"><span>REAL RATE</span><strong>${pct(real)}</strong><small>Policy minus inflation</small></div>
          <div class="profile-metric"><span>GINI</span><strong>${gini ? number(gini.value,1) : "n/a"}</strong><small>${gini ? `World Bank ${gini.year}` : "Not mapped"}</small></div>
          <div class="profile-metric"><span>TEMPERATURE</span><strong>${row.temp}</strong><small>Rule-based regime</small></div>
          <div class="profile-metric"><span>POLICY BIAS</span><strong style="font-size:14px">${row.bias}</strong><small>Dashboard assessment</small></div>
        </div></div>
        <div class="insight-card"><h3>What this means</h3><div class="plain-language">${interpretation(row)}</div><div class="source-links">
          <a target="_blank" rel="noopener" href="https://tradingeconomics.com/${teSlug}/indicators">Trading Economics indicators ↗</a>
          <a target="_blank" rel="noopener" href="https://www.reuters.com/site-search/?query=${sourceQuery(row.market)}">Reuters search ↗</a>
          <a target="_blank" rel="noopener" href="https://data.worldbank.org/country/${teSlug}">World Bank ↗</a>
        </div></div>
        <div class="insight-card"><h3>Latest mapped releases</h3>${releaseRows(row.market)}</div>
        <div class="insight-card"><h3>Decision checklist</h3><div class="note-list" style="padding:0"><div class="note red"><strong>Primary risk</strong><span>${row.watch}</span></div><div class="note amber"><strong>Policy signal</strong><span>${row.bias}</span></div><div class="note green"><strong>What changes the view</strong><span>A material inflation surprise, a central-bank communication shift, or a sharp currency move.</span></div></div></div>
      </div>`;
  }

  function renderMarkets() {
    const root = document.getElementById("market-cards");
    if (!hosted.assets.length) { root.innerHTML = `<div class="empty-state">Loading the latest market snapshot…</div>`; return; }
    root.innerHTML = hosted.assets.map(row => {
      const move = row.open ? (row.close / row.open - 1) * 100 : 0;
      const direction = Math.abs(move) < .01 ? "flat" : move > 0 ? "up" : "down";
      return `<article class="market-card"><header><h3>${row.asset}</h3><span class="badge ${direction}">${move >= 0 ? "+" : ""}${number(move)}%</span></header><div class="market-price">${number(row.close, row.close > 100 ? 2 : 5)}</div><div class="move-line"><span>Open ${number(row.open, row.open > 100 ? 2 : 5)}</span><span>${row.date}${row.stale ? " · stale fallback" : ""}</span></div><small>${row.symbol} · ${row.convention}</small></article>`;
    }).join("");
  }

  function whyItMatters(title) {
    const text = title.toLowerCase();
    if (text.includes("inflation") || text.includes("price")) return "Inflation changes the likely path of interest rates, real incomes and currency pressure.";
    if (text.includes("rate") || text.includes("central bank")) return "A policy shift changes borrowing costs, bond yields and the relative appeal of the currency.";
    if (text.includes("oil") || text.includes("gold") || text.includes("commodity")) return "Commodity moves feed into inflation, trade balances and the fiscal outlook of exporters and importers.";
    if (text.includes("growth") || text.includes("gdp") || text.includes("pmi")) return "Growth momentum helps determine whether policymakers prioritise inflation control or economic support.";
    return "This development may change the balance between growth, inflation, policy and market risk.";
  }

  function renderNews() {
    const root = document.getElementById("news-grid");
    const items = hosted.news?.length ? hosted.news : [
      { source:"Reuters", title:"Open Reuters markets coverage", url:"https://www.reuters.com/markets/", publishedAt:null },
      { source:"Trading Economics", title:"Open the latest economic calendar and country releases", url:"https://tradingeconomics.com/calendar", publishedAt:null }
    ];
    root.innerHTML = items.map(item => `<article class="news-card"><span class="publisher">${item.source || "SOURCE"}${item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}` : ""}</span><h3>${item.title}</h3><p><strong>Why it matters:</strong> ${item.explanation || whyItMatters(item.title)}</p><a target="_blank" rel="noopener" href="${item.url}">Read at ${item.source || "source"} ↗</a></article>`).join("");
  }

  async function hydrate() {
    try {
      const response = await fetch(`data/latest-export.json?ui=${Date.now()}`, { cache:"no-store" });
      hosted = await response.json();
      const generated = new Date(hosted.generatedAt);
      const ageHours = Math.max(0, Math.floor((Date.now() - generated.getTime()) / 3600000));
      document.getElementById("refresh-number").textContent = `#${String(hosted.generatedAt || hosted.date).replace(/\D/g, "").slice(0, 12)}`;
      document.getElementById("refresh-date").textContent = generated.toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" });
      document.getElementById("refresh-age").textContent = ageHours < 1 ? "Updated less than an hour ago" : `Updated ${ageHours} hour${ageHours === 1 ? "" : "s"} ago`;
      document.getElementById("news-refresh").textContent = `Refreshed ${hosted.date}`;
    } catch {
      document.getElementById("refresh-age").textContent = "Live snapshot temporarily unavailable";
    }
    renderMarkets(); renderNews(); route();
  }

  renderCountryGrid();
  window.addEventListener("hashchange", route);
  hydrate();
})();
