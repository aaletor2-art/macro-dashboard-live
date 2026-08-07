(() => {
  const flags = {
    "United Kingdom":"🇬🇧","United States":"🇺🇸","Euro Area":"🇪🇺",Japan:"🇯🇵",China:"🇨🇳",India:"🇮🇳","South Korea":"🇰🇷",Taiwan:"🇹🇼",Singapore:"🇸🇬","Hong Kong":"🇭🇰",Australia:"🇦🇺",Canada:"🇨🇦",Brazil:"🇧🇷",Mexico:"🇲🇽",Nigeria:"🇳🇬","South Africa":"🇿🇦",Egypt:"🇪🇬",Kenya:"🇰🇪",Ghana:"🇬🇭",Morocco:"🇲🇦",Angola:"🇦🇴",Ethiopia:"🇪🇹","Cote d'Ivoire":"🇨🇮",Rwanda:"🇷🇼"
  };
  const countryCodes = {
    "United Kingdom":"united-kingdom","United States":"united-states","Euro Area":"euro-area",Japan:"japan",China:"china",India:"india","South Korea":"south-korea",Taiwan:"taiwan",Singapore:"singapore","Hong Kong":"hong-kong",Australia:"australia",Canada:"canada",Brazil:"brazil",Mexico:"mexico",Nigeria:"nigeria","South Africa":"south-africa",Egypt:"egypt",Kenya:"kenya",Ghana:"ghana",Morocco:"morocco",Angola:"angola",Ethiopia:"ethiopia","Cote d'Ivoire":"cote-d-ivoire",Rwanda:"rwanda"
  };
  let hosted = { assets: [], news: [], generatedAt: null, date: null };
  let live = { companies: [], markets: [], generatedAt: null };
  let companySector = "All";

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
    if (parts[0] === "countries" && parts[1]) { pageName = "country"; value = parts.slice(1).join("-"); }
    else if (["markets","calendar","companies"].includes(parts[0])) pageName = parts[0];
    document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.dataset.page === pageName));
    document.querySelectorAll(".site-nav a").forEach(link => link.classList.toggle("active", link.dataset.route === (pageName === "country" ? "countries" : pageName)));
    if (pageName === "country") {
      const name = Object.entries(countryCodes).find(([,slug]) => slug === decodeURIComponent(value || ""))?.[0] || "United Kingdom";
      renderCountry(name);
    }
    if (pageName === "markets") renderMarkets();
    if (pageName === "calendar") renderFullCalendar();
    if (pageName === "companies") renderCompanies();
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
      filter.addEventListener("change", renderFullCalendar);
    }
    const selected = filter.value || "All";
    const fieldNames = [["Inflation", "cpi", "pp"], ["GDP", "gdp", "pp"], ["Manufacturing PMI", "man_pmi", "%"], ["Services PMI", "serv_pmi", "%"], ["Unemployment", "unemp", "pp"], ["Business confidence", "bus_conf", "%"]];
    const rows = templateIndicators.filter(row => selected === "All" || row.currency === selected).flatMap(row => fieldNames.map(([label,key,unit]) => ({...row[key], label, unit, currency:row.currency, market:row.market})));
    document.getElementById("full-calendar-body").innerHTML = rows.map(row => `<tr><td><strong>${row.currency}</strong></td><td><a class="country-link" href="/countries/${countryCodes[row.market] || row.market.toLowerCase().replaceAll(" ", "-")}">${row.market}</a></td><td>${row.label}</td><td>${number(row.previous,1)}</td><td><strong>${number(row.current,1)}</strong></td><td>${number(row.forecast,1)}</td><td><span class="badge ${signalClass(row.change || 0)}">${number(row.change,1)} ${row.unit}</span></td></tr>`).join("");
    const lines = (hosted.calendarLines || []).filter(line => selected === "All" || line[0] === selected);
    document.getElementById("calendar-summary").innerHTML = lines.length ? lines.map(line => `<article class="calendar-event"><span>${line[0]}</span><div><strong>${line[1]}</strong><small>${line[2]}</small><p>${line[3]}</p></div></article>`).join("") : `<div class="empty-state">No short calendar notes match this currency; the full release matrix remains below.</div>`;
  }

  function renderCompanies() {
    const root = document.getElementById("company-grid");
    const rows = (live.companies || []).filter(row => companySector === "All" || row.sector === companySector);
    if (!rows.length) { root.innerHTML = `<div class="empty-state">Connecting to the live company feed…</div>`; return; }
    root.innerHTML = rows.map(row => {
      const unavailable = row.unavailable || row.price == null;
      const direction = unavailable || Math.abs(row.changePct || 0) < .01 ? "flat" : row.changePct > 0 ? "up" : "down";
      return `<article class="company-card"><div class="company-card-head"><div class="company-avatar">${row.name.split(/\s+/).map(word => word[0]).slice(0,2).join("")}</div><div><span>${row.sector}</span><h3>${row.name}</h3><small>${flags[row.country] || "🌍"} ${row.country} · ${row.symbol}</small></div></div><div class="company-quote"><strong>${unavailable ? "Unavailable" : `${row.currency || ""} ${number(row.price,2)}`}</strong><span class="badge ${direction}">${unavailable ? "Retry later" : `${row.changePct >= 0 ? "+" : ""}${number(row.changePct)}%`}</span></div><div class="move-line"><span>${row.exchange || "Exchange feed"}</span><span>${row.marketTime ? new Date(row.marketTime).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}) : "Latest"}</span></div></article>`;
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
    renderMarkets(); renderNews(); renderLandingNews(); renderFullCalendar(); renderCompanies(); renderOverview(); route();
  }

  renderCountryGrid();
  document.querySelectorAll(".company-filter").forEach(button => button.addEventListener("click", () => {
    companySector = button.dataset.sector;
    document.querySelectorAll(".company-filter").forEach(item => item.classList.toggle("active", item === button));
    renderCompanies();
  }));
  route();
  hydrate();
})();
