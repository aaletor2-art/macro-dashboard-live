(() => {
  const flags = {
    "United Kingdom":"🇬🇧","United States":"🇺🇸","Euro Area":"🇪🇺",Japan:"🇯🇵",China:"🇨🇳",India:"🇮🇳","South Korea":"🇰🇷",Taiwan:"🇹🇼",Singapore:"🇸🇬","Hong Kong":"🇭🇰",Australia:"🇦🇺",Canada:"🇨🇦",Brazil:"🇧🇷",Mexico:"🇲🇽",Nigeria:"🇳🇬","South Africa":"🇿🇦",Egypt:"🇪🇬",Kenya:"🇰🇪",Ghana:"🇬🇭",Morocco:"🇲🇦",Angola:"🇦🇴",Ethiopia:"🇪🇹","Cote d'Ivoire":"🇨🇮",Rwanda:"🇷🇼"
  };
  const countryCodes = {
    "United Kingdom":"united-kingdom","United States":"united-states","Euro Area":"euro-area",Japan:"japan",China:"china",India:"india","South Korea":"south-korea",Taiwan:"taiwan",Singapore:"singapore","Hong Kong":"hong-kong",Australia:"australia",Canada:"canada",Brazil:"brazil",Mexico:"mexico",Nigeria:"nigeria","South Africa":"south-africa",Egypt:"egypt",Kenya:"kenya",Ghana:"ghana",Morocco:"morocco",Angola:"angola",Ethiopia:"ethiopia","Cote d'Ivoire":"cote-d-ivoire",Rwanda:"rwanda"
  };
  const leaderPortraits = {
    "United States": { name:"Donald Trump", role:"President", image:"https://commons.wikimedia.org/wiki/Special:FilePath/Donald_Trump_official_portrait.jpg" },
    Nigeria: { name:"Bola Tinubu", role:"President", image:"https://commons.wikimedia.org/wiki/Special:FilePath/Bola_Tinubu_portrait.jpg" },
    China: { name:"Xi Jinping", role:"President", image:"https://commons.wikimedia.org/wiki/Special:FilePath/Xi_Jinping_2019.jpg" }
  };
  const indicatorGuides = {
    Inflation:"Shows how quickly consumer prices are changing. Higher-than-expected inflation can support interest rates and the currency, but squeeze households and company margins.",
    GDP:"Measures economic growth. Stronger growth can improve earnings but may delay rate cuts if demand is adding to inflation.",
    "Manufacturing PMI":"A survey of factories. Above 50 usually signals expansion; below 50 suggests contraction.",
    "Services PMI":"A survey of the service economy. It is especially important in countries such as the UK and US.",
    Unemployment:"Measures labour-market slack. A rising rate can weaken consumption and increase the case for easier policy.",
    "Business confidence":"Shows how firms view current and future conditions. It can lead investment, hiring and growth."
  };
  let hosted = { assets: [], news: [], generatedAt: null, date: null };
  let live = { companies: [], markets: [], generatedAt: null };
  let companyUniverse = [];
  let companyQuotes = [];
  let companySector = "All";
  let companyView = "cards";
  let calendarPage = 0;
  let historyRange = "25";
  let historyPayload = null;

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
    const parts = location.pathname.split("/").filter(Boolean);
    let pageName = "countries";
    let value = null;
    const historyView = parts[0] === "countries" && parts[1] && parts[2] === "history";
    if (parts[0] === "countries" && parts[1]) { pageName = "country"; value = parts[1]; }
    else if (parts[0] === "companies" && parts[1]) { pageName = "company"; value = parts[1]; }
    else if (["markets","calendar","companies","trading-plan"].includes(parts[0])) pageName = parts[0];
    document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.dataset.page === pageName));
    document.querySelectorAll(".site-nav a").forEach(link => link.classList.toggle("active", link.dataset.route === (pageName === "country" ? "countries" : pageName === "company" ? "companies" : pageName)));
    if (pageName === "country") {
      const name = Object.entries(countryCodes).find(([,slug]) => slug === decodeURIComponent(value || ""))?.[0] || "United Kingdom";
      historyView ? renderCountryHistory(name) : renderCountry(name);
    }
    if (pageName === "markets") renderMarkets();
    if (pageName === "calendar") renderFullCalendar();
    if (pageName === "companies") renderCompanies();
    if (pageName === "company") renderCompany(value);
    if (pageName === "trading-plan") renderTradingPlan();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderCountryGrid() {
    const grid = document.getElementById("country-grid");
    const select = document.getElementById("country-select");
    const overviewSelect = document.getElementById("overview-country-select");
    grid.innerHTML = markets.map(row => `
      <a class="country-card" href="/countries/${countryCodes[row.market] || row.market.toLowerCase().replaceAll(" ", "-")}">
        <div class="country-card-top"><span class="flag" aria-hidden="true">${flags[row.market] || "🌍"}</span><span class="badge ${badgeClass(row.temp)}">${row.temp}</span></div>
        <h3>${row.market}</h3><p>${row.bias} · ${row.watch}</p>
        <div class="country-mini-metrics"><span>Inflation<strong>${pct(row.inflation)}</strong></span><span>Policy rate<strong>${pct(row.rate)}</strong></span><span>Pressure<strong>${row.pressure}/100</strong></span></div>
      </a>`).join("");
    select.innerHTML = `<option value="">Choose country…</option>${markets.map(row => `<option value="${encodeURIComponent(row.market)}">${flags[row.market] || "🌍"} ${row.market}</option>`).join("")}`;
    select.addEventListener("change", event => { if (event.target.value) location.href = `/countries/${countryCodes[decodeURIComponent(event.target.value)] || "united-kingdom"}`; });
    overviewSelect.innerHTML = select.innerHTML;
    overviewSelect.addEventListener("change", event => { if (event.target.value) location.href = `/countries/${countryCodes[decodeURIComponent(event.target.value)] || "united-kingdom"}`; });
  }

  function renderOverview() {
    const priorities = [...markets].sort((a,b) => b.pressure - a.pressure).slice(0,3);
    document.getElementById("priority-watchlist").innerHTML = priorities.map(row => `<a class="priority-item" href="#country=${encodeURIComponent(row.market)}"><span class="flag">${flags[row.market] || "🌍"}</span><span><strong>${row.market}</strong><small>${row.watch}</small></span><span class="priority-score">${row.pressure}/100</span></a>`).join("");
    const hotCount = markets.filter(row => row.temp === "Hot").length;
    const leader = priorities[0];
    document.getElementById("overview-summary").textContent = `${hotCount} markets are in a high-pressure regime. ${leader.market} leads the risk ranking at ${leader.pressure}/100, while the latest tape and publisher updates below show where market attention is moving.`;
    document.getElementById("overview-asof").textContent = hosted.date ? `As of ${hosted.date}` : "Latest model view";

    const movers = [...(hosted.assets || [])].filter(row => row.open && row.close).map(row => ({...row, pct:(row.close / row.open - 1) * 100})).sort((a,b) => Math.abs(b.pct)-Math.abs(a.pct)).slice(0,3);
    document.getElementById("overview-movers").innerHTML = movers.length ? movers.map(row => `<a class="pulse-row" href="#markets"><span><strong>${row.asset}</strong><small>${row.date} · ${row.symbol}</small></span><span class="badge ${row.pct > 0 ? "up" : row.pct < 0 ? "down" : "flat"}">${row.pct >= 0 ? "+" : ""}${number(row.pct)}%</span></a>`).join("") : `<div class="empty-state">Loading market moves…</div>`;

    const headlines = (hosted.news || []).slice(0,2);
    document.getElementById("overview-news").innerHTML = headlines.length ? headlines.map(item => `<a class="headline-row" target="_blank" rel="noopener" href="${item.url}"><span>${item.source}</span><strong>${item.title}</strong></a>`).join("") : `<a class="headline-row" href="#updates"><span>UPDATES</span><strong>Open the latest macro context</strong></a>`;
  }

  function releaseRows(country) {
    const data = latestIndicator(country);
    if (!data) return `<div class="empty-state">No workbook release row is mapped for this market yet. Use the official source links below for the latest national release.</div>`;
    const fields = [["Inflation",data.cpi],["GDP",data.gdp],["Manufacturing PMI",data.man_pmi],["Services PMI",data.serv_pmi],["Unemployment",data.unemp],["Business confidence",data.bus_conf]];
    const slug = countryCodes[country] || country.toLowerCase().replaceAll(" ", "-");
    const historyKeys = { Inflation:"inflation", GDP:"gdp", Unemployment:"unemployment" };
    return `<div class="release-list">${fields.map(([label,item]) => `<a class="release-row" href="${historyKeys[label] ? `/countries/${slug}/history?indicator=${historyKeys[label]}` : `/calendar?indicator=${encodeURIComponent(label)}&country=${encodeURIComponent(country)}`}" title="${indicatorGuides[label]}"><div><strong>${label}</strong><small>Previous ${number(item.previous,1)} · Forecast ${number(item.forecast,1)} · Open detail →</small></div><span class="badge ${signalClass(item.change || 0)}">${number(item.current,1)}</span></a>`).join("")}</div>`;
  }

  function recentBriefHtml(row) {
    const portrait = leaderPortraits[row.market];
    const news = (hosted.news || []).filter(item => item.title?.toLowerCase().includes(row.market.toLowerCase()) || item.title?.toLowerCase().includes(row.currency?.toLowerCase?.() || "__none__")).slice(0,2);
    const links = news.length ? news.map(item => `<a target="_blank" rel="noopener" href="${item.url}"><span>${item.source}</span><strong>${item.title}</strong></a>`).join("") : `<a target="_blank" rel="noopener" href="https://www.reuters.com/site-search/?query=${sourceQuery(row.market)}"><span>REUTERS SEARCH</span><strong>Open the newest reporting on ${row.market}</strong></a><a target="_blank" rel="noopener" href="https://tradingeconomics.com/${countryCodes[row.market] || row.market.toLowerCase().replaceAll(" ","-")}/indicators"><span>DATA WATCH</span><strong>Review the latest releases and forecasts</strong></a>`;
    return `<section class="country-brief"><div class="country-brief-copy"><span class="eyebrow">MOST RECENT CONTEXT</span><h3>What has changed and why it matters</h3><p>${interpretation(row)}</p><div class="brief-links">${links}</div></div><aside class="need-to-know">${portrait ? `<img src="${portrait.image}" alt="${portrait.name}, ${portrait.role} of ${row.market}" loading="lazy"><strong>${portrait.name}</strong><small>${portrait.role}</small>` : `<span class="brief-flag">${flags[row.market] || "🌍"}</span><strong>${row.market}</strong><small>Country briefing</small>`}<h4>Need to know</h4><ul><li><b>Inflation:</b> ${pct(row.inflation)} and the main driver of the rate outlook.</li><li><b>Policy:</b> ${row.bias}.</li><li><b>Watch:</b> ${row.watch}.</li></ul></aside></section>`;
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
      ${recentBriefHtml(row)}
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
        <div class="insight-card"><div class="card-title-row"><h3>Latest mapped releases</h3><a href="/countries/${teSlug}/history">Historical data →</a></div>${releaseRows(row.market)}<div class="history-link-grid">${[["Inflation","inflation"],["GDP growth","gdp"],["Unemployment","unemployment"],["Inequality","gini"]].map(([label,key])=>`<a href="/countries/${teSlug}/history?indicator=${key}"><span>${label}</span><small>25 observations · interactive chart →</small></a>`).join("")}</div></div>
        <div class="insight-card"><h3>Decision checklist</h3><div class="note-list" style="padding:0"><div class="note red"><strong>Primary risk</strong><span>${row.watch}</span></div><div class="note amber"><strong>Policy signal</strong><span>${row.bias}</span></div><div class="note green"><strong>What changes the view</strong><span>A material inflation surprise, a central-bank communication shift, or a sharp currency move.</span></div></div></div>
      </div><section class="country-companies"><div class="card-title-row"><div><span class="eyebrow">COUNTRY BELLWETHERS</span><h3>Five companies carrying the macro signal</h3></div><a href="/companies?country=${encodeURIComponent(row.market)}">Open company hub →</a></div><div class="country-company-strip">${companyUniverse.filter(company=>company.country===row.market).slice(0,5).map(company=>`<a href="/companies/${company.id}"><img src="https://www.google.com/s2/favicons?domain=${company.domain}&sz=64" alt=""><span><strong>${company.name}</strong><small>${company.sector}${company.symbol?` · ${company.symbol}`:" · price feed not available"}</small></span></a>`).join("") || `<div class="empty-state">Loading country companies…</div>`}</div></section><div id="pair-pressure" class="comparison-mount"></div><div id="country-comparison" class="comparison-mount"></div>`;
    renderPairPressure("pair-pressure", row.market);
    renderComparison("country-comparison", [row.market,"United States","China"]);
  }

  function renderCountryHistory(name) {
    const row = markets.find(item => item.market === name) || markets[0];
    const slug = countryCodes[row.market] || row.market.toLowerCase().replaceAll(" ", "-");
    const requested = new URLSearchParams(location.search).get("indicator") || "inflation";
    const labels = { inflation:"Inflation", gdp:"GDP growth", unemployment:"Unemployment", gini:"Inequality" };
    const selectedLabel = labels[requested] || labels.inflation;
    document.getElementById("country-profile").innerHTML = `
      <a class="back-link" href="/countries/${slug}">← Back to ${row.market} summary</a>
      <div class="history-page-head"><div><span class="flag">${flags[row.market] || "🌍"}</span><span class="eyebrow">${row.region.toUpperCase()} · HISTORICAL DATA</span><h2>${row.market} <span id="history-heading">${selectedLabel.toLowerCase()}</span></h2><p>Verified public-source observations, with the latest 25 readings and five-year view.</p></div><div class="history-controls"><label>Dataset<select id="history-indicator">${Object.entries(labels).map(([key,label])=>`<option value="${key}" ${key===requested?"selected":""}>${label}</option>`).join("")}</select></label><div class="history-ranges" role="group" aria-label="History range"><button class="history-range active" data-history-range="25">Last 25</button><button class="history-range" data-history-range="5y">Last 5 years</button></div></div></div>
      <div class="history-stat-grid"><div><span>LATEST</span><strong id="history-stat-latest">—</strong><small id="history-stat-date">Loading</small></div><div><span>25-RELEASE HIGH</span><strong id="history-stat-high">—</strong><small id="history-stat-high-date">—</small></div><div><span>25-RELEASE LOW</span><strong id="history-stat-low">—</strong><small id="history-stat-low-date">—</small></div><div><span>LATEST CHANGE</span><strong id="history-stat-change">—</strong><small>percentage points</small></div></div>
      <section class="history-card" aria-labelledby="history-title"><div class="history-head"><div><span class="eyebrow">TREND</span><h3 id="history-title">${selectedLabel} over time</h3><p id="history-subtitle">Loading official historical observations…</p></div></div><div class="history-chart-wrap"><canvas id="history-chart" width="1100" height="390" aria-label="Interactive historical chart"></canvas><div id="history-tooltip" class="history-tooltip" hidden></div></div><div class="history-foot"><span id="history-latest">Latest: —</span><span id="history-source">Source: loading</span><a id="history-source-link" target="_blank" rel="noopener">Open source ↗</a></div></section>
      <section class="release-table-card"><div class="card-title-row"><div><span class="eyebrow">OBSERVATIONS</span><h3>Latest 25 observations</h3></div><span class="table-note">Newest first</span></div><div class="table-wrap"><table><thead><tr><th>Date</th><th id="history-value-head">Value</th><th>Change</th><th>Direction</th></tr></thead><tbody id="history-release-body"><tr><td colspan="4">Loading observations…</td></tr></tbody></table></div></section><div id="history-comparison" class="comparison-mount"></div>`;
    historyRange = "25"; historyPayload = null;
    document.querySelectorAll("[data-history-range]").forEach(button => button.addEventListener("click", () => { historyRange = button.dataset.historyRange; document.querySelectorAll("[data-history-range]").forEach(item => item.classList.toggle("active", item === button)); drawHistoryChart(); }));
    document.getElementById("history-indicator").addEventListener("change", event => { const query = new URLSearchParams(location.search); query.set("indicator",event.target.value); history.replaceState({},"",`${location.pathname}?${query}`); renderCountryHistory(row.market); });
    loadCountryHistory(slug, requested);
    renderComparison("history-comparison", [row.market,"United States","China"], selectedLabel === "GDP growth" ? "GDP" : selectedLabel === "Inequality" ? "Inflation" : selectedLabel);
  }

  function macroStrength(row) {
    const release = latestIndicator(row.market);
    const clamp = value => Math.max(0, Math.min(100, value));
    const real = realRateFor(row);
    const policy = clamp(50 + (real == null ? 0 : real * 5) + (/hawk|tight|restrict|hike/i.test(row.bias) ? 10 : /ease|cut|support/i.test(row.bias) ? -8 : 0));
    const gdp = release?.gdp?.current;
    const pmi = [release?.man_pmi?.current,release?.serv_pmi?.current].filter(Number.isFinite);
    const growth = clamp(50 + (Number.isFinite(gdp) ? (gdp - 2) * 7 : 0) + (pmi.length ? (pmi.reduce((a,b)=>a+b,0)/pmi.length - 50) * 2 : 0));
    const stability = clamp(100 - row.pressure);
    const releases = release ? clamp(50 + [[release.gdp,1],[release.man_pmi,1],[release.serv_pmi,1],[release.unemp,-1]].reduce((score,[item,direction])=>score + (Number.isFinite(item?.current)&&Number.isFinite(item?.forecast) ? Math.sign(item.current-item.forecast)*direction*8 : 0),0)) : 50;
    return { total:Math.round(policy*.4+growth*.3+stability*.2+releases*.1), policy:Math.round(policy), growth:Math.round(growth), stability:Math.round(stability), releases:Math.round(releases) };
  }

  function renderPairPressure(id, defaultCountry) {
    const mount = document.getElementById(id); if (!mount) return;
    const fallback = defaultCountry === "United States" ? "United Kingdom" : "United States";
    mount.innerHTML = `<section class="pair-pressure-card"><div class="comparison-head"><div><span class="eyebrow">RELATIVE MACRO WHEEL</span><h3>Compare two countries for a trade bias</h3><p>Positive data on one side plus weaker data on the other creates a relative macro edge. Confirm it with price, trend and your risk plan.</p></div></div><div class="pair-selectors"><label>Country A<select data-pair-a>${markets.map(row=>`<option ${row.market===defaultCountry?"selected":""}>${row.market}</option>`).join("")}</select></label><span>VERSUS</span><label>Country B<select data-pair-b>${markets.map(row=>`<option ${row.market===fallback?"selected":""}>${row.market}</option>`).join("")}</select></label></div><div class="pair-output"></div></section>`;
    const update = () => {
      const a = markets.find(row=>row.market===mount.querySelector("[data-pair-a]").value), b = markets.find(row=>row.market===mount.querySelector("[data-pair-b]").value);
      const sa=macroStrength(a), sb=macroStrength(b), difference=sa.total-sb.total;
      const leader=difference>=0?a:b, laggard=difference>=0?b:a, clear=Math.abs(difference)>=5;
      mount.querySelector(".pair-output").innerHTML=`<div class="pair-wheels"><div><div class="pressure-dial macro-dial" style="--score:${sa.total}"><div><strong>${sa.total}</strong><span>MACRO / 100</span></div></div><b>${flags[a.market]||"🌍"} ${a.market}</b><small>Pressure ${a.pressure}/100</small></div><div class="pair-verdict"><span>${clear?"RELATIVE EDGE":"NO CLEAR EDGE"}</span><strong>${clear?`${leader.market} over ${laggard.market}`:"Wait for divergence"}</strong><p>${clear?`Watch for long ${leader.market} exposure versus short ${laggard.market} exposure only when price action confirms.`:"The scores are too close to justify a directional macro preference."}</p></div><div><div class="pressure-dial macro-dial" style="--score:${sb.total}"><div><strong>${sb.total}</strong><span>MACRO / 100</span></div></div><b>${flags[b.market]||"🌍"} ${b.market}</b><small>Pressure ${b.pressure}/100</small></div></div><div class="pair-breakdown"><span>Driver</span><b>${a.market}</b><b>${b.market}</b>${[["Policy support",sa.policy,sb.policy],["Growth",sa.growth,sb.growth],["Stability",sa.stability,sb.stability],["Release surprises",sa.releases,sb.releases]].map(values=>values.map((value,index)=>index?`<strong>${value}</strong>`:`<span>${value}</span>`).join("")).join("")}</div><p class="pair-method">Scores are transparent relative fundamentals: policy 40%, growth 30%, stability 20%, release surprises 10%. This is a research filter, not investment advice or an automatic trade entry.</p>`;
    };
    mount.querySelectorAll("select").forEach(select=>select.addEventListener("change",update)); update();
  }

  async function loadCountryHistory(slug, indicator = "inflation") {
    try {
      const response = await fetch(`/api/history?country=${encodeURIComponent(slug)}&indicator=${encodeURIComponent(indicator)}`);
      if (!response.ok) throw new Error("History unavailable");
      historyPayload = await response.json();
      const formatValue = value => historyPayload.unit.includes("%") ? pct(value) : number(value,1);
      document.getElementById("history-heading").textContent = historyPayload.indicator.toLowerCase();
      document.getElementById("history-title").textContent = `${historyPayload.indicator} over time`;
      document.getElementById("history-value-head").textContent = historyPayload.indicator;
      document.getElementById("history-subtitle").textContent = `${historyPayload.frequency[0].toUpperCase()}${historyPayload.frequency.slice(1)} observations · ${historyPayload.unit}`;
      document.getElementById("history-source").textContent = `Source: ${historyPayload.source}`;
      const link = document.getElementById("history-source-link"); link.href = historyPayload.sourceUrl;
      const latest = historyPayload.observations.at(-1);
      document.getElementById("history-latest").textContent = latest ? `Latest: ${formatValue(latest.value)} · ${new Date(`${latest.date}T00:00:00Z`).toLocaleDateString("en-GB",{month:"short",year:"numeric"})}` : "Latest: unavailable";
      const recent = historyPayload.observations.slice(-25), previous = recent.at(-2);
      const high = recent.reduce((best,item) => item.value > best.value ? item : best, recent[0]);
      const low = recent.reduce((best,item) => item.value < best.value ? item : best, recent[0]);
      const dateLabel = item => new Date(`${item.date}T00:00:00Z`).toLocaleDateString("en-GB",{month:"short",year:"numeric"});
      document.getElementById("history-stat-latest").textContent = latest ? formatValue(latest.value) : "—";
      document.getElementById("history-stat-date").textContent = latest ? dateLabel(latest) : "—";
      document.getElementById("history-stat-high").textContent = formatValue(high.value); document.getElementById("history-stat-high-date").textContent = dateLabel(high);
      document.getElementById("history-stat-low").textContent = formatValue(low.value); document.getElementById("history-stat-low-date").textContent = dateLabel(low);
      document.getElementById("history-stat-change").textContent = latest && previous ? `${latest.value-previous.value>=0?"+":""}${(latest.value-previous.value).toFixed(2)}` : "—";
      document.getElementById("history-release-body").innerHTML = [...recent].reverse().map((item,index,array) => { const older=array[index+1]; const change=older ? item.value-older.value : null; return `<tr><td><strong>${new Date(`${item.date}T00:00:00Z`).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</strong></td><td>${formatValue(item.value)}</td><td>${change==null?"—":`${change>=0?"+":""}${change.toFixed(2)} ${historyPayload.unit.includes("%")?"pp":"pts"}`}</td><td><span class="badge ${change==null||Math.abs(change)<.01?"flat":change>0?"up":"down"}">${change==null?"Baseline":change>0?"Higher":change<0?"Lower":"Unchanged"}</span></td></tr>`; }).join("");
      drawHistoryChart();
    } catch {
      document.getElementById("history-subtitle").textContent = "Historical observations are temporarily unavailable. The latest dashboard value remains above.";
    }
  }

  function drawHistoryChart() {
    const canvas = document.getElementById("history-chart");
    if (!canvas || !historyPayload?.observations?.length) return;
    const cutoff = new Date(); cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 5);
    const all = historyPayload.observations;
    const points = historyRange === "5y" ? all.filter(item => new Date(`${item.date}T00:00:00Z`) >= cutoff) : all.slice(-25);
    const ctx = canvas.getContext("2d"), ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 900, height = canvas.clientHeight || 320;
    canvas.width = width * ratio; canvas.height = height * ratio; ctx.scale(ratio, ratio);
    const pad = { left:52, right:18, top:22, bottom:40 }, values = points.map(item => item.value);
    let min = Math.min(...values, 0), max = Math.max(...values, 0); const spread = Math.max(1, max - min); min -= spread * .12; max += spread * .12;
    const x = index => pad.left + index * ((width-pad.left-pad.right)/Math.max(1,points.length-1));
    const y = value => pad.top + (max-value) * ((height-pad.top-pad.bottom)/(max-min));
    ctx.clearRect(0,0,width,height); ctx.font="12px Inter, system-ui, sans-serif"; ctx.textBaseline="middle"; ctx.strokeStyle="#e2e7e4"; ctx.fillStyle="#65706b"; ctx.lineWidth=1;
    const suffix=historyPayload.unit.includes("%")?"%":"";
    for(let i=0;i<=4;i++){ const value=max-(max-min)*i/4, py=y(value); ctx.beginPath();ctx.moveTo(pad.left,py);ctx.lineTo(width-pad.right,py);ctx.stroke();ctx.fillText(`${value.toFixed(1)}${suffix}`,6,py); }
    const gradient=ctx.createLinearGradient(0,pad.top,0,height-pad.bottom);gradient.addColorStop(0,"rgba(8,122,85,.22)");gradient.addColorStop(1,"rgba(8,122,85,.015)");
    ctx.beginPath(); points.forEach((item,index)=>index?ctx.lineTo(x(index),y(item.value)):ctx.moveTo(x(index),y(item.value))); ctx.lineTo(x(points.length-1),height-pad.bottom);ctx.lineTo(x(0),height-pad.bottom);ctx.closePath();ctx.fillStyle=gradient;ctx.fill();
    ctx.beginPath();points.forEach((item,index)=>index?ctx.lineTo(x(index),y(item.value)):ctx.moveTo(x(index),y(item.value)));ctx.strokeStyle="#087a55";ctx.lineWidth=2.5;ctx.stroke();
    const labels=[0,Math.floor((points.length-1)/2),points.length-1];ctx.fillStyle="#65706b";ctx.textAlign="center";labels.forEach(index=>ctx.fillText(new Date(`${points[index].date}T00:00:00Z`).toLocaleDateString("en-GB",{month:"short",year:"2-digit"}),x(index),height-17));
    const tooltip=document.getElementById("history-tooltip");
    const showPoint = event => { const rect=canvas.getBoundingClientRect(); const px=(event.clientX??event.touches?.[0]?.clientX)-rect.left; const index=Math.max(0,Math.min(points.length-1,Math.round((px-pad.left)/((width-pad.left-pad.right)/Math.max(1,points.length-1))))); const point=points[index]; tooltip.hidden=false;tooltip.style.left=`${Math.min(width-145,Math.max(8,x(index)-55))}px`;tooltip.style.top=`${Math.max(5,y(point.value)-62)}px`;tooltip.innerHTML=`<strong>${number(point.value,2)}${suffix}</strong><span>${new Date(`${point.date}T00:00:00Z`).toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</span>`; };
    canvas.onpointermove=showPoint; canvas.onpointerleave=()=>{tooltip.hidden=true}; canvas.onclick=showPoint;
  }

  function renderMarkets() {
    const root = document.getElementById("market-cards");
    const liveRows = (live.markets || []).filter(row => !row.unavailable);
    if (liveRows.length) {
      root.innerHTML = liveRows.map(row => {
        const direction = Math.abs(row.changePct || 0) < .01 ? "flat" : row.changePct > 0 ? "up" : "down";
        return `<article class="market-card"><header><h3>${row.asset}</h3><span class="badge ${direction}">${row.changePct >= 0 ? "+" : ""}${number(row.changePct)}%</span></header><div class="market-price">${number(row.price, row.price > 100 ? 2 : 5)}</div><div class="move-line"><span>Previous ${number(row.previousClose, row.previousClose > 100 ? 2 : 5)}</span><span>${row.marketTime ? new Date(row.marketTime).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}) : "Latest"}</span></div><small>${row.symbol} · ${row.convention} · 5-minute cache</small></article>`;
      }).join("");
      return;
    }
    if (!hosted.assets.length) { root.innerHTML = `<div class="empty-state">Loading the latest market snapshot…</div>`; return; }
    root.innerHTML = hosted.assets.map(row => {
      const move = row.open ? (row.close / row.open - 1) * 100 : 0;
      const direction = Math.abs(move) < .01 ? "flat" : move > 0 ? "up" : "down";
      return `<article class="market-card"><header><h3>${row.asset}</h3><span class="badge ${direction}">${move >= 0 ? "+" : ""}${number(move)}%</span></header><div class="market-price">${number(row.close, row.close > 100 ? 2 : 5)}</div><div class="move-line"><span>Open ${number(row.open, row.open > 100 ? 2 : 5)}</span><span>${row.date}${row.stale ? " · stale fallback" : ""}</span></div><small>${row.symbol} · ${row.convention}</small></article>`;
    }).join("");
  }

  function renderLandingNews() {
    const root = document.getElementById("landing-news-grid");
    const items = (hosted.news || []).slice(0,6);
    root.innerHTML = items.length ? items.map(item => `<article class="news-card"><span class="publisher">${item.source}${item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}` : ""}</span><h3>${item.title}</h3><p><strong>Why it matters:</strong> ${whyItMatters(item.title)}</p><a target="_blank" rel="noopener" href="${item.url}">Read at ${item.source} ↗</a></article>`).join("") : `<div class="empty-state">Loading the latest macro context…</div>`;
  }

  function renderFullCalendar() {
    const filter = document.getElementById("calendar-filter");
    if (filter.options.length === 1) {
      templateIndicators.forEach(row => filter.add(new Option(`${row.currency} · ${row.market}`, row.currency)));
      filter.addEventListener("change", () => { calendarPage=0; renderFullCalendar(); });
      document.getElementById("calendar-impact")?.addEventListener("change", () => { calendarPage=0; renderFullCalendar(); });
      document.getElementById("calendar-search")?.addEventListener("input", () => { calendarPage=0; renderFullCalendar(); });
      document.getElementById("calendar-prev")?.addEventListener("click", () => { calendarPage=Math.max(0,calendarPage-1); renderFullCalendar(); });
      document.getElementById("calendar-next")?.addEventListener("click", () => { calendarPage+=1; renderFullCalendar(); });
    }
    const query = new URLSearchParams(location.search);
    const requestedIndicator = query.get("indicator");
    const selected = filter.value || "All";
    const fieldNames = [["Inflation", "cpi", "pp"], ["GDP", "gdp", "pp"], ["Manufacturing PMI", "man_pmi", "%"], ["Services PMI", "serv_pmi", "%"], ["Unemployment", "unemp", "pp"], ["Business confidence", "bus_conf", "%"]];
    const impactFor = label => ["Inflation","GDP","Unemployment"].includes(label) ? "High" : label.includes("PMI") ? "Medium" : "Low";
    const usefulness = {High:"Often moves currencies, rates and equity indices",Medium:"Useful confirmation of economic direction",Low:"Adds context; rarely a standalone trade trigger"};
    const impact=document.getElementById("calendar-impact")?.value||"All impact", search=(document.getElementById("calendar-search")?.value||"").trim().toLowerCase();
    const rows = templateIndicators.filter(row => selected === "All" || row.currency === selected).flatMap(row => fieldNames.filter(([label]) => !requestedIndicator || label === requestedIndicator).map(([label,key,unit]) => ({...row[key], label, unit, currency:row.currency, market:row.market, impact:impactFor(label)}))).filter(row=>(impact==="All impact"||row.impact===impact)&&(!search||`${row.label} ${row.market} ${row.currency}`.toLowerCase().includes(search)));
    const pages=Math.max(1,Math.ceil(rows.length/10)); calendarPage=Math.min(calendarPage,pages-1); const visible=rows.slice(calendarPage*10,calendarPage*10+10);
    document.getElementById("full-calendar-body").innerHTML = visible.length ? visible.map(row => `<tr><td><span class="impact-pill ${row.impact.toLowerCase()}">${row.impact}</span></td><td><a class="country-link" href="/countries/${countryCodes[row.market] || row.market.toLowerCase().replaceAll(" ", "-")}">${flags[row.market]||"🌍"} ${row.market}</a><small>${row.currency}</small></td><td><button class="metric-info" data-metric="${row.label}">${row.label}</button><small>${usefulness[row.impact]}</small></td><td>${number(row.previous,1)}</td><td><strong>${number(row.current,1)}</strong></td><td>${number(row.forecast,1)}</td><td><span class="badge ${signalClass(row.change || 0)}">${row.change>0?"Above":row.change<0?"Below":"In line"} · ${number(row.change,1)} ${row.unit}</span></td></tr>`).join("") : `<tr><td colspan="7">No releases match these filters.</td></tr>`;
    document.getElementById("calendar-result-count").textContent=`${rows.length} releases`;
    document.getElementById("calendar-page-label").textContent=`Page ${calendarPage+1} of ${pages}`;
    document.getElementById("calendar-prev").disabled=calendarPage===0; document.getElementById("calendar-next").disabled=calendarPage>=pages-1;
    const lines = (hosted.calendarLines || []).filter(line => selected === "All" || line[0] === selected);
    const keyRows=[...rows].sort((a,b)=>({High:3,Medium:2,Low:1}[b.impact]-{High:3,Medium:2,Low:1}[a.impact]||Math.abs(b.change||0)-Math.abs(a.change||0))).slice(0,6);
    document.getElementById("calendar-story").innerHTML=`<section><span class="eyebrow">TODAY'S STORY</span><h3>${keyRows.filter(x=>x.impact==="High").length} high-impact releases lead the watchlist</h3><p>${keyRows[0]?`${keyRows[0].market} ${keyRows[0].label.toLowerCase()} is the first priority. ${keyRows[0].change>0?"It is running above the comparison baseline":"It is at or below the comparison baseline"}, so check the currency and rate response before using it as a directional signal.`:"Choose a currency or metric to build today’s watchlist."}</p></section><div class="story-impact">${["High","Medium","Low"].map(level=>`<div class="${level.toLowerCase()}"><strong>${rows.filter(x=>x.impact===level).length}</strong><span>${level} impact</span><small>${usefulness[level]}</small></div>`).join("")}</div>`;
    document.getElementById("calendar-summary").innerHTML = keyRows.map(row => `<article class="calendar-event ${row.impact.toLowerCase()}"><span>${row.currency}</span><div><div class="event-impact"><b>${row.impact} impact</b><small>${row.market}</small></div><strong>${row.label}</strong><p>${indicatorGuides[row.label]} <a href="/countries/${countryCodes[row.market]}/history?indicator=${row.label==="GDP"?"gdp":row.label==="Unemployment"?"unemployment":"inflation"}">Open data →</a></p></div></article>`).join("") || `<div class="empty-state">No releases match this view.</div>`;
    const relatedNews=(hosted.news||[]).slice(0,3); document.getElementById("calendar-news").innerHTML=`<div><span class="eyebrow">CALENDAR + CONTEXT</span><h3>Why markets may care today</h3><p>Calendar data tells you what changed; reporting helps explain why and how markets are interpreting it.</p></div>${relatedNews.map(item=>`<a target="_blank" rel="noopener" href="${item.url}"><span>${item.source}</span><strong>${item.title}</strong><small>${whyItMatters(item.title)}</small></a>`).join("")}`;
    document.getElementById("metric-guide-grid").innerHTML=Object.entries(indicatorGuides).map(([label,guide])=>`<button data-guide="${label}"><span>${impactFor(label)} impact</span><strong>${label}</strong><small>${guide}</small><em>Click to filter calendar →</em></button>`).join("");
    document.querySelectorAll("[data-guide],.metric-info").forEach(button=>button.addEventListener("click",()=>{document.getElementById("calendar-search").value=button.dataset.guide||button.dataset.metric;calendarPage=0;renderFullCalendar();document.querySelector(".calendar-panel").scrollIntoView({behavior:"smooth"});}));
    document.getElementById("calendar-refresh").textContent=hosted.date?`Refreshed ${hosted.date}`:"Latest data";
    renderComparison("calendar-comparison", query.get("country") ? [query.get("country"),"United States","China"] : ["United Kingdom","United States","China"] , requestedIndicator || "Inflation");
  }

  function renderComparison(mountId, defaults = [], initialIndicator = "Inflation") {
    const mount = document.getElementById(mountId);
    if (!mount || mount.dataset.ready) return;
    mount.dataset.ready = "true";
    const id = mountId.replace(/[^a-z]/gi, "");
    const fields = [["Inflation","cpi"],["GDP","gdp"],["Manufacturing PMI","man_pmi"],["Services PMI","serv_pmi"],["Unemployment","unemp"],["Business confidence","bus_conf"]];
    mount.innerHTML = `<section class="comparison-card"><div class="comparison-head"><div><span class="eyebrow">CROSS-COUNTRY COMPARISON</span><h3>Compare releases</h3><p>Select two or more countries. Inflation covers all markets; other indicators show workbook-mapped countries.</p></div><label>Indicator<select id="${id}-indicator">${fields.map(([label])=>`<option ${label===initialIndicator?"selected":""}>${label}</option>`).join("")}</select></label></div><div class="comparison-selector" id="${id}-countries">${markets.map(row=>`<label><input type="checkbox" value="${row.market}" ${defaults.includes(row.market)?"checked":""}><span>${flags[row.market]||"🌍"} ${row.market}</span></label>`).join("")}</div><div class="comparison-chart-wrap"><canvas id="${id}-chart" width="1100" height="430" aria-label="Cross-country economic release comparison"></canvas></div><div class="comparison-links" id="${id}-links"></div></section>`;
    const update = () => {
      const checked = [...mount.querySelectorAll('input[type="checkbox"]:checked')];
      if (checked.length > 8) { checked.at(-1).checked=false; return; }
      const names = checked.map(input=>input.value);
      drawComparisonChart(document.getElementById(`${id}-chart`), names, document.getElementById(`${id}-indicator`).value, fields);
      document.getElementById(`${id}-links`).innerHTML = names.map(name=>`<a href="/countries/${countryCodes[name]}">${flags[name]||"🌍"} ${name} →</a>`).join("");
    };
    mount.querySelectorAll('input[type="checkbox"]').forEach(input=>input.addEventListener("change",update));
    document.getElementById(`${id}-indicator`).addEventListener("change",update); update();
  }

  function drawComparisonChart(canvas, names, indicator, fields) {
    if (!canvas) return; const ctx=canvas.getContext("2d"), ratio=window.devicePixelRatio||1, width=canvas.clientWidth||900, height=canvas.clientHeight||360;
    canvas.width=width*ratio;canvas.height=height*ratio;ctx.scale(ratio,ratio);ctx.clearRect(0,0,width,height);
    if(names.length<2){ctx.fillStyle="#66706b";ctx.font="14px sans-serif";ctx.fillText("Select at least two countries to compare.",24,38);return;}
    const key=fields.find(([label])=>label===indicator)?.[1]||"cpi"; const rows=names.map(name=>{const mapped=templateIndicators.find(row=>row.market===name),market=markets.find(row=>row.market===name);const data=mapped?.[key]||(key==="cpi"&&market?{previous:null,current:market.inflation,forecast:null}:null);return data?{market:name,data}:null}).filter(Boolean); const series=["previous","current","forecast"], colours=["#9aa49f","#087a55","#375a7f"];
    if(rows.length<2){ctx.fillStyle="#66706b";ctx.font="14px sans-serif";ctx.fillText("This indicator needs at least two countries with mapped data.",24,38);return;}
    const values=rows.flatMap(row=>series.map(field=>Number(row.data?.[field])).filter(Number.isFinite)); let min=Math.min(0,...values),max=Math.max(0,...values);const spread=Math.max(1,max-min);min-=spread*.1;max+=spread*.12;const pad={left:48,right:16,top:36,bottom:62};const y=value=>pad.top+(max-value)*(height-pad.top-pad.bottom)/(max-min);const zero=y(0), group=(width-pad.left-pad.right)/rows.length, bar=Math.min(24,group/5);
    ctx.font="11px sans-serif";ctx.strokeStyle="#e1e6e3";ctx.fillStyle="#65706b";ctx.textAlign="right";for(let i=0;i<=4;i++){const value=max-(max-min)*i/4,py=y(value);ctx.beginPath();ctx.moveTo(pad.left,py);ctx.lineTo(width-pad.right,py);ctx.stroke();ctx.fillText(value.toFixed(1),pad.left-7,py+3)}
    rows.forEach((row,i)=>{const centre=pad.left+group*(i+.5);series.forEach((field,j)=>{const value=Number(row.data?.[field]);if(!Number.isFinite(value))return;const x=centre+(j-1)*(bar+3)-bar/2,py=y(value);ctx.fillStyle=colours[j];ctx.fillRect(x,Math.min(py,zero),bar,Math.abs(zero-py));});ctx.save();ctx.translate(centre,height-16);ctx.rotate(-.35);ctx.fillStyle="#39433f";ctx.textAlign="right";ctx.fillText(row.market,0,0);ctx.restore();});
    series.forEach((label,i)=>{ctx.fillStyle=colours[i];ctx.fillRect(pad.left+i*105,10,12,12);ctx.fillStyle="#53605a";ctx.textAlign="left";ctx.fillText(label[0].toUpperCase()+label.slice(1),pad.left+17+i*105,20)});
  }

  function renderCompanies() {
    const root = document.getElementById("company-grid");
    const countryFilter=document.getElementById("company-country-filter");
    if(!countryFilter.dataset.bound&&companyUniverse.length){const requested=new URLSearchParams(location.search).get("country")||"United Kingdom";countryFilter.innerHTML=[...new Set(companyUniverse.map(x=>x.country))].map(country=>`<option value="${country}" ${country===requested?"selected":""}>${flags[country]||"🌍"} ${country}</option>`).join("");countryFilter.addEventListener("change",loadCompanyCountry);countryFilter.dataset.bound="true";loadCompanyCountry();}
    const search=(document.getElementById("company-search")?.value||"").toLowerCase(),sort=document.getElementById("company-sort")?.value||"rank";
    const rows = companyQuotes.filter(row => (companySector === "All" || row.sector === companySector)&&(!search||`${row.name} ${row.symbol||""} ${row.sector}`.toLowerCase().includes(search))).sort((a,b)=>sort==="move"?Math.abs(b.changePct||0)-Math.abs(a.changePct||0):sort==="name"?a.name.localeCompare(b.name):(a.rank||99)-(b.rank||99));
    if (!rows.length) { root.innerHTML = `<div class="empty-state">Select a country to load its five company bellwethers.</div>`; return; }
    root.innerHTML = rows.map(row => {
      const unavailable = row.unavailable || row.price == null;
      const direction = unavailable || Math.abs(row.changePct || 0) < .01 ? "flat" : row.changePct > 0 ? "up" : "down";
      const bar=Math.min(100,Math.max(4,50+(row.changePct||0)*12));
      return `<a class="company-card" href="/companies/${row.id}"><div class="company-rank">#${row.rank||"—"} macro bellwether</div><div class="company-card-head"><img class="company-logo" src="https://www.google.com/s2/favicons?domain=${row.domain}&sz=128" alt="${row.name} logo"><div><span>${row.sector}</span><h3>${row.name}</h3><small>${flags[row.country] || "🌍"} ${row.country} · ${row.symbol||"Private/local feed"}</small></div></div><div class="company-quote"><strong>${unavailable ? "Price unavailable" : `${row.currency || ""} ${number(row.price,2)}`}</strong><span class="badge ${direction}">${unavailable ? "Profile" : `${row.changePct >= 0 ? "+" : ""}${number(row.changePct)}% today`}</span></div><div class="company-move-bar"><i style="width:${bar}%" class="${direction}"></i></div><div class="move-line"><span>${row.exchange || row.reason || "Company profile"}</span><span>Price + macro analysis →</span></div></a>`;
    }).join("");
    root.classList.toggle("compact",companyView==="compact");
  }

  async function loadCompanyCountry(){const select=document.getElementById("company-country-filter");if(!select)return;document.getElementById("company-grid").innerHTML=`<div class="empty-state">Loading five company prices…</div>`;try{const response=await fetch(`/api/companies?country=${encodeURIComponent(select.value)}&ts=${Date.now()}`);const data=await response.json();companyQuotes=data.peers||[];document.getElementById("company-refresh").textContent=`Updated ${new Date(data.generatedAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`;}catch{companyQuotes=companyUniverse.filter(x=>x.country===select.value).slice(0,5).map(x=>({...x,unavailable:true}));}renderCompanies();}

  async function renderCompany(id){const root=document.getElementById("company-profile");if(!root)return;root.innerHTML=`<div class="empty-state">Loading company price and macro context…</div>`;try{const response=await fetch(`/api/companies?id=${encodeURIComponent(id)}&ts=${Date.now()}`);const data=await response.json(),company=data.company,peers=data.peers||[];if(!company)throw new Error("Company not found");const quote=peers.find(x=>x.id===company.id)||company,country=markets.find(x=>x.market===company.country),available=!quote.unavailable&&quote.price!=null;const monthStart=quote.chart?.[0]?.value,monthMove=available&&monthStart?(quote.price/monthStart-1)*100:null;root.innerHTML=`<a class="back-link" href="/companies?country=${encodeURIComponent(company.country)}">← ${company.country} company hub</a><div class="company-profile-head"><img src="https://www.google.com/s2/favicons?domain=${company.domain}&sz=256" alt="${company.name} logo"><div><span class="eyebrow">${company.sector.toUpperCase()} · ${company.country.toUpperCase()}</span><h2>${company.name}</h2><p>${company.symbol||"Local/private market feed"} · Ranked macro bellwether ${company.rank}/5 for this dashboard</p></div><div class="company-live-price"><span>LIVE / LATEST PRICE</span><strong>${available?`${quote.currency||""} ${number(quote.price,2)}`:"Unavailable"}</strong><small>${available?`${quote.changePct>=0?"+":""}${number(quote.changePct)}% today · ${new Date(quote.marketTime||data.generatedAt).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"})}`:quote.reason||"No stable free exchange feed"}</small></div></div><div class="company-data-grid"><section><span>30-DAY MOVE</span><strong>${pct(monthMove)}</strong><small>Price momentum, not a forecast</small></section><section><span>COUNTRY INFLATION</span><strong>${pct(country?.inflation)}</strong><small>Consumer-price environment</small></section><section><span>POLICY RATE</span><strong>${pct(country?.rate)}</strong><small>Financing and valuation pressure</small></section><section><span>MACRO PRESSURE</span><strong>${country?.pressure??"n/a"}/100</strong><small>${country?.temp||"Unmapped"} regime</small></section></div><div class="company-analysis-grid"><section class="insight-card"><h3>Fundamental and macro read-through</h3><p class="plain-language">${company.name} is a ${company.sector.toLowerCase()} bellwether. ${country?interpretation(country):"Country context is still loading."} For a beginner trader, compare its price direction with peers before deciding whether the move is company-specific or part of a wider ${company.country} trend.</p><div class="note-list" style="padding:0"><div class="note amber"><strong>Company exposure</strong><span>${sectorExplanation(company.sector,country)}</span></div><div class="note green"><strong>What confirms the signal</strong><span>Peer performance, earnings guidance, margins, currency moves and the next economic release.</span></div></div></section><aside class="insight-card"><h3>Need to know</h3><div class="release-list"><div class="release-row"><div><strong>Price</strong><small>What the market currently pays</small></div><span>${available?number(quote.price,2):"n/a"}</span></div><div class="release-row"><div><strong>Daily move</strong><small>Short-term sentiment</small></div><span>${pct(quote.changePct)}</span></div><div class="release-row"><div><strong>Country pressure</strong><small>Macro environment, not company quality</small></div><span>${country?.pressure??"n/a"}</span></div></div></aside></div><section class="peer-chart-card"><div class="card-title-row"><div><span class="eyebrow">PRICE COMPARISON</span><h3>${company.country} top-five peers · 30 days</h3></div><small>Indexed to 100</small></div><canvas id="peer-price-chart" width="1100" height="420" aria-label="Peer price comparison chart"></canvas><div class="peer-links">${peers.map(peer=>`<a href="/companies/${peer.id}"><img src="https://www.google.com/s2/favicons?domain=${peer.domain}&sz=32" alt="">${peer.name}</a>`).join("")}</div></section>`;drawPeerChart(peers);}catch{root.innerHTML=`<div class="empty-state">This company profile could not load. <a href="/companies">Return to companies</a>.</div>`;}}

  function sectorExplanation(sector,country){const rate=country?.rate; if(/bank|financial/i.test(sector))return `Banks are sensitive to interest margins, credit losses and loan growth. The listed policy rate is ${pct(rate)}.`;if(/energy|mining/i.test(sector))return "Revenue is strongly influenced by global commodity prices, exchange rates and capital spending.";if(/consumer|automotive/i.test(sector))return "Household income, inflation and borrowing costs affect demand and margins.";if(/technology|semiconductor/i.test(sector))return "Watch global demand, export controls, currency translation and valuation sensitivity to interest rates.";return "Watch domestic growth, input costs, financing conditions and currency exposure.";}

  function drawPeerChart(peers){const canvas=document.getElementById("peer-price-chart");if(!canvas)return;const ctx=canvas.getContext("2d"),ratio=window.devicePixelRatio||1,width=canvas.clientWidth||900,height=canvas.clientHeight||340;canvas.width=width*ratio;canvas.height=height*ratio;ctx.scale(ratio,ratio);ctx.clearRect(0,0,width,height);const usable=peers.filter(x=>x.chart?.length>1);if(!usable.length){ctx.fillStyle="#66706b";ctx.font="14px sans-serif";ctx.fillText("No comparable free price series are currently available.",24,40);return;}const colours=["#087a55","#375a7f","#d17b27","#8b5fbf","#c13b4a"],series=usable.map(x=>({...x,values:x.chart.map(p=>({date:p.date,value:p.value/x.chart[0].value*100}))})),values=series.flatMap(x=>x.values.map(p=>p.value)),min=Math.min(...values)-2,max=Math.max(...values)+2,pad={left:45,right:20,top:25,bottom:35},x=(i,n)=>pad.left+i*(width-pad.left-pad.right)/Math.max(1,n-1),y=v=>pad.top+(max-v)*(height-pad.top-pad.bottom)/(max-min);ctx.strokeStyle="#e1e6e3";[0,.25,.5,.75,1].forEach(step=>{const py=pad.top+step*(height-pad.top-pad.bottom);ctx.beginPath();ctx.moveTo(pad.left,py);ctx.lineTo(width-pad.right,py);ctx.stroke()});series.forEach((row,index)=>{ctx.strokeStyle=colours[index];ctx.lineWidth=2;ctx.beginPath();row.values.forEach((p,i)=>i?ctx.lineTo(x(i,row.values.length),y(p.value)):ctx.moveTo(x(i,row.values.length),y(p.value)));ctx.stroke();ctx.fillStyle=colours[index];ctx.fillText(row.name,pad.left+index*145,15)});}

  const planIndicators = [
    ["support-resistance","Support / resistance",3], ["trend","Trend",3], ["trendline","Trendline",1], ["channel","Channel",1], ["fib-50","Fibonacci 50%",1], ["fib-618","Fibonacci 61.8%",1], ["macd-obos","MACD overbought / oversold",1], ["macd-divergence","MACD divergence",2], ["macd-crossover","MACD crossover",1], ["bollinger-rejection","Bollinger Band rejection",1], ["stochastic-confirmation","Stochastic confirmation",1], ["round-number","Round-number support / resistance",2]
  ];

  function clamp(value) { return Math.max(0, Math.min(100, Math.round(value))); }
  function conviction(score) { return score < 40 ? "Low confidence" : score < 60 ? "Watch only" : score < 75 ? "Moderate confidence" : score < 85 ? "High confidence" : "Very high confidence"; }

  function drawPlanChart(item) {
    const canvas = document.getElementById("plan-chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const points = item?.chart || [];
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (points.length < 2) { ctx.fillStyle="#66706b"; ctx.font="16px sans-serif"; ctx.fillText("Waiting for live price history",28,46); return; }
    const band = item.technical?.bollinger;
    const values = [...points, band?.upper, band?.lower].filter(Number.isFinite);
    const min = Math.min(...values), max = Math.max(...values), range = max-min || 1;
    const pad = {x:42,y:26};
    const x = index => pad.x + index * ((canvas.width-pad.x*2)/(points.length-1));
    const y = value => canvas.height-pad.y-((value-min)/range)*(canvas.height-pad.y*2);
    ctx.strokeStyle="#e1e5e2"; ctx.lineWidth=1;
    [0,.25,.5,.75,1].forEach(step=>{const yy=pad.y+step*(canvas.height-pad.y*2);ctx.beginPath();ctx.moveTo(pad.x,yy);ctx.lineTo(canvas.width-pad.x,yy);ctx.stroke()});
    if (band) [[band.upper,"#9aa49f",[5,5]],[band.lower,"#9aa49f",[5,5]],[band.middle,"#087a55",[]]].forEach(([value,color,dash])=>{ctx.strokeStyle=color;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(pad.x,y(value));ctx.lineTo(canvas.width-pad.x,y(value));ctx.stroke()});
    ctx.setLineDash([]);ctx.strokeStyle="#111827";ctx.lineWidth=2.5;ctx.beginPath();points.forEach((value,index)=>index?ctx.lineTo(x(index),y(value)):ctx.moveTo(x(index),y(value)));ctx.stroke();
    ctx.fillStyle="#65706b";ctx.font="12px sans-serif";ctx.fillText(number(max,4),4,pad.y+4);ctx.fillText(number(min,4),4,canvas.height-pad.y+4);
  }

  function renderTradingPlan() {
    const assetSelect = document.getElementById("plan-asset");
    const countrySelect = document.getElementById("plan-country");
    if (!assetSelect || !countrySelect) return;
    if (!assetSelect.dataset.bound) {
      assetSelect.innerHTML = (live.markets || []).map(row => `<option value="${row.symbol}">${row.asset}</option>`).join("") || `<option>Waiting for live markets…</option>`;
      countrySelect.innerHTML = markets.map(row => `<option value="${encodeURIComponent(row.market)}">${flags[row.market] || "🌍"} ${row.market}</option>`).join("");
      document.getElementById("indicator-checklist").innerHTML = planIndicators.map(([id,label,points]) => `<label class="indicator-row"><input type="checkbox" data-indicator="${id}"><span>${label}</span><span>${points} pt${points===1?"":"s"}</span></label>`).join("");
      [assetSelect,countrySelect,document.getElementById("plan-direction")].forEach(input => input.addEventListener("change", renderTradingPlan));
      document.querySelectorAll("[data-indicator]").forEach(input => input.addEventListener("change", renderTradingPlan));
      assetSelect.dataset.bound="true";
    } else if (assetSelect.options.length <= 1 && live.markets?.length) {
      assetSelect.innerHTML = live.markets.map(row => `<option value="${row.symbol}">${row.asset}</option>`).join("");
    }
    const item = (live.markets || []).find(row => row.symbol === assetSelect.value) || live.markets?.[0];
    const countryName = decodeURIComponent(countrySelect.value || "United Kingdom");
    const country = markets.find(row => row.market === countryName) || markets[0];
    const direction = document.getElementById("plan-direction").value;
    const activePoints = [...document.querySelectorAll("[data-indicator]:checked")].reduce((sum,input) => sum + (planIndicators.find(([id])=>id===input.dataset.indicator)?.[2] || 0),0);
    const maxPoints = planIndicators.reduce((sum,item)=>sum+item[2],0);
    const technicalScore = clamp((activePoints/maxPoints)*100);
    const real = realRateFor(country);
    let macroTilt = 0;
    if (/hawk|hike|restrict/i.test(country.bias)) macroTilt += 15;
    if (/easing|support|cool/i.test(`${country.bias} ${country.temp}`)) macroTilt -= 15;
    if (real != null) macroTilt += real > 0 ? 8 : -8;
    if (country.inflation > 5) macroTilt += 7;
    const fundamentalScore = clamp(50 + (direction === "Buy" ? macroTilt : -macroTilt));
    const combined = clamp(technicalScore*.6 + fundamentalScore*.4);
    document.getElementById("point-total").textContent=`${activePoints} / ${maxPoints} points`;
    document.getElementById("technical-score").textContent=`${technicalScore}/100`;
    document.getElementById("fundamental-score").textContent=`${fundamentalScore}/100`;
    document.getElementById("combined-score").textContent=combined;
    document.getElementById("conviction-label").textContent=conviction(combined);
    document.getElementById("fundamental-country").textContent=`${country.market} context`;
    const edge=fundamentalScore>=60?`${direction} fundamentals supportive`:fundamentalScore<=40?`${direction} fundamentals opposed`:"Fundamentals broadly balanced";
    document.getElementById("plan-fundamental-banner").innerHTML=`<div><span>KEY FUNDAMENTAL VIEW</span><strong>${flags[country.market]||"🌍"} ${country.market}: ${edge}</strong><small>${country.bias} · ${country.watch}</small></div><div><span>INFLATION</span><strong>${pct(country.inflation)}</strong><small>${country.temp} regime</small></div><div><span>REAL RATE</span><strong>${pct(real)}</strong><small>Currency support gauge</small></div><div><span>NEXT EVENT RISK</span><strong>${hosted.calendarLines?.some(line=>line[0]===latestIndicator(country.market)?.currency)?"On calendar":"Check manually"}</strong><small><a href="/calendar?country=${encodeURIComponent(country.market)}">Open calendar →</a></small></div>`;
    document.getElementById("fundamental-read").innerHTML=`<div class="read-cell"><span>INFLATION</span><strong>${pct(country.inflation)}</strong><small>${country.temp} regime</small></div><div class="read-cell"><span>POLICY RATE</span><strong>${pct(country.rate)}</strong><small>${country.bias}</small></div><div class="read-cell"><span>REAL RATE</span><strong>${pct(real)}</strong><small>Policy minus CPI</small></div><div class="read-cell"><span>PRESSURE</span><strong>${country.pressure}/100</strong><small>${country.watch}</small></div><div class="read-cell"><span>DIRECTIONAL SCORE</span><strong>${fundamentalScore}/100</strong><small>${direction} rule result</small></div><div class="read-cell"><span>EVENT CHECK</span><strong>${hosted.calendarLines?.some(line=>line[0]===latestIndicator(country.market)?.currency)?"Mapped":"Manual"}</strong><small>Review calendar before entry</small></div>`;
    const bb=item?.technical?.bollinger, stoch=item?.technical?.stochastic;
    document.getElementById("technical-read").innerHTML=`<div class="read-cell"><span>BB POSITION</span><strong>${bb?.position || "Waiting"}</strong><small>20-period, 2 standard deviations</small></div><div class="read-cell"><span>BB MIDDLE</span><strong>${number(bb?.middle,5)}</strong><small>Upper ${number(bb?.upper,5)} · Lower ${number(bb?.lower,5)}</small></div><div class="read-cell"><span>STOCHASTIC</span><strong>${stoch?.state || "Waiting"}</strong><small>%K ${number(stoch?.k,1)} · %D ${number(stoch?.d,1)}</small></div>`;
    document.getElementById("plan-price").textContent=item?`${number(item.price,item.price>100?2:5)}`:"—";
    const change=document.getElementById("plan-change");change.textContent=item?`${item.changePct>=0?"+":""}${number(item.changePct)}%`:"—";change.className=`badge ${!item||Math.abs(item.changePct||0)<.01?"flat":item.changePct>0?"up":"down"}`;
    document.getElementById("plan-refresh").textContent=live.generatedAt?`Live ${new Date(live.generatedAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`:"Hosted fallback";
    drawPlanChart(item);
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
    try { const universeResponse=await fetch(`/api/companies?mode=universe&ts=${Date.now()}`,{cache:"no-store"}); if(universeResponse.ok) companyUniverse=(await universeResponse.json()).universe||[]; } catch {}
    try {
      const response = await fetch(`/data/latest-export.json?ui=${Date.now()}`, { cache:"no-store" });
      hosted = await response.json();
      const generated = new Date(hosted.generatedAt);
      const ageHours = Math.max(0, Math.floor((Date.now() - generated.getTime()) / 3600000));
      document.getElementById("refresh-number").textContent = `#${String(hosted.generatedAt || hosted.date).replace(/\D/g, "").slice(0, 12)}`;
      document.getElementById("refresh-date").textContent = generated.toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" });
      document.getElementById("refresh-age").textContent = ageHours < 1 ? "Updated less than an hour ago" : `Updated ${ageHours} hour${ageHours === 1 ? "" : "s"} ago`;
      document.getElementById("news-refresh").textContent = `Refreshed ${hosted.date}`;
      document.getElementById("landing-news-refresh").textContent = `Refreshed ${hosted.date}`;
    } catch {
      document.getElementById("refresh-age").textContent = "Live snapshot temporarily unavailable";
    }
    try {
      const liveResponse = await fetch(`/api/live?ts=${Date.now()}`, { cache:"no-store" });
      if (liveResponse.ok) live = await liveResponse.json();
      if (live.generatedAt) {
        const liveDate = new Date(live.generatedAt);
        document.getElementById("refresh-number").textContent = `#${String(live.generatedAt).replace(/\D/g, "").slice(0,12)}`;
        document.getElementById("refresh-date").textContent = liveDate.toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" });
        document.getElementById("refresh-age").textContent = "Live endpoint · five-minute cache";
        document.getElementById("company-refresh").textContent = `Updated ${liveDate.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`;
      }
    } catch {
      document.getElementById("company-refresh").textContent = "Hosted fallback";
    }
    renderMarkets(); renderNews(); renderLandingNews(); renderFullCalendar(); renderCompanies(); renderTradingPlan(); renderOverview(); route();
  }

  renderCountryGrid();
  document.querySelectorAll(".company-filter").forEach(button => button.addEventListener("click", () => {
    companySector = button.dataset.sector;
    document.querySelectorAll(".company-filter").forEach(item => item.classList.toggle("active", item === button));
    renderCompanies();
  }));
  document.getElementById("company-search")?.addEventListener("input",renderCompanies);
  document.getElementById("company-sort")?.addEventListener("change",renderCompanies);
  document.querySelectorAll("[data-company-view]").forEach(button=>button.addEventListener("click",()=>{companyView=button.dataset.companyView;document.querySelectorAll("[data-company-view]").forEach(item=>item.classList.toggle("active",item===button));renderCompanies();}));
  route();
  hydrate();
})();
