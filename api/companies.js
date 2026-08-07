const rawUniverse = {
  "United Kingdom":[["AstraZeneca","AZN.L","Healthcare","astrazeneca.com"],["Shell","SHEL.L","Energy","shell.com"],["HSBC","HSBA.L","Banks","hsbc.com"],["Unilever","ULVR.L","Consumer","unilever.com"],["BP","BP.L","Energy","bp.com"]],
  "United States":[["Microsoft","MSFT","Technology","microsoft.com"],["Apple","AAPL","Technology","apple.com"],["NVIDIA","NVDA","Semiconductors","nvidia.com"],["Amazon","AMZN","Consumer","amazon.com"],["Alphabet","GOOGL","Technology","google.com"]],
  "Euro Area":[["SAP","SAP.DE","Technology","sap.com"],["ASML","ASML.AS","Semiconductors","asml.com"],["LVMH","MC.PA","Consumer","lvmh.com"],["L'Oreal","OR.PA","Consumer","loreal.com"],["Siemens","SIE.DE","Industrials","siemens.com"]],
  Japan:[["Toyota","7203.T","Automotive","toyota.com"],["Sony","6758.T","Technology","sony.com"],["MUFG","8306.T","Banks","mufg.jp"],["SoftBank Group","9984.T","Technology","softbank.jp"],["Keyence","6861.T","Industrials","keyence.com"]],
  China:[["Tencent","0700.HK","Technology","tencent.com"],["Alibaba","9988.HK","Consumer","alibabagroup.com"],["ICBC","601398.SS","Banks","icbc.com.cn"],["Kweichow Moutai","600519.SS","Consumer","moutaichina.com"],["CATL","300750.SZ","Industrials","catl.com"]],
  India:[["Reliance Industries","RELIANCE.NS","Energy & Consumer","ril.com"],["Tata Consultancy Services","TCS.NS","Technology","tcs.com"],["HDFC Bank","HDFCBANK.NS","Banks","hdfcbank.com"],["Bharti Airtel","BHARTIARTL.NS","Telecoms","airtel.in"],["ICICI Bank","ICICIBANK.NS","Banks","icicibank.com"]],
  "South Korea":[["Samsung Electronics","005930.KS","Technology","samsung.com"],["SK Hynix","000660.KS","Semiconductors","skhynix.com"],["LG Energy Solution","373220.KS","Industrials","lgensol.com"],["Samsung Biologics","207940.KS","Healthcare","samsungbiologics.com"],["Hyundai Motor","005380.KS","Automotive","hyundai.com"]],
  Taiwan:[["TSMC","2330.TW","Semiconductors","tsmc.com"],["Hon Hai Precision","2317.TW","Technology","foxconn.com"],["MediaTek","2454.TW","Semiconductors","mediatek.com"],["Fubon Financial","2881.TW","Banks","fubon.com"],["Delta Electronics","2308.TW","Industrials","deltaww.com"]],
  Singapore:[["DBS Group","D05.SI","Banks","dbs.com"],["OCBC","O39.SI","Banks","ocbc.com"],["UOB","U11.SI","Banks","uobgroup.com"],["Singtel","Z74.SI","Telecoms","singtel.com"],["Singapore Airlines","C6L.SI","Transport","singaporeair.com"]],
  "Hong Kong":[["HSBC","0005.HK","Banks","hsbc.com"],["AIA Group","1299.HK","Insurance","aia.com"],["HKEX","0388.HK","Financials","hkex.com.hk"],["CK Hutchison","0001.HK","Conglomerate","ckh.com.hk"],["Sun Hung Kai Properties","0016.HK","Property","shkp.com"]],
  Australia:[["Commonwealth Bank","CBA.AX","Banks","commbank.com.au"],["BHP","BHP.AX","Mining","bhp.com"],["CSL","CSL.AX","Healthcare","csl.com"],["National Australia Bank","NAB.AX","Banks","nab.com.au"],["Westpac","WBC.AX","Banks","westpac.com.au"]],
  Canada:[["Royal Bank of Canada","RY.TO","Banks","rbc.com"],["TD Bank","TD.TO","Banks","td.com"],["Shopify","SHOP.TO","Technology","shopify.com"],["Enbridge","ENB.TO","Energy","enbridge.com"],["Canadian National Railway","CNR.TO","Transport","cn.ca"]],
  Brazil:[["Petrobras","PETR4.SA","Energy","petrobras.com.br"],["Vale","VALE3.SA","Mining","vale.com"],["Itau Unibanco","ITUB4.SA","Banks","itau.com.br"],["Ambev","ABEV3.SA","Consumer","ambev.com.br"],["Banco do Brasil","BBAS3.SA","Banks","bb.com.br"]],
  Mexico:[["Walmex","WALMEX.MX","Consumer","walmartmexico.com"],["America Movil","AMXL.MX","Telecoms","americamovil.com"],["FEMSA","FEMSAUBD.MX","Consumer","femsa.com"],["Grupo Mexico","GMEXICOB.MX","Mining","gmexico.com"],["Banorte","GFNORTEO.MX","Banks","banorte.com"]],
  Nigeria:[["Dangote Cement","DANGCEM.LG","Industrials","dangotecement.com"],["MTN Nigeria","MTNN.LG","Telecoms","mtn.ng"],["Airtel Africa","AAF.L","Telecoms","airtel.africa"],["BUA Foods","BUAFOODS.LG","Consumer","buafoodsplc.com"],["GTCO","GTCO.LG","Banks","gtcoplc.com"]],
  "South Africa":[["Naspers","NPN.JO","Technology","naspers.com"],["British American Tobacco","BTI.JO","Consumer","bat.com"],["Richemont","CFR.JO","Consumer","richemont.com"],["FirstRand","FSR.JO","Banks","firstrand.co.za"],["Standard Bank","SBK.JO","Banks","standardbank.com"]],
  Egypt:[["Commercial International Bank","COMI.CA","Banks","cibeg.com"],["Eastern Company","EAST.CA","Consumer","easternegypt.com"],["Elsewedy Electric","SWDY.CA","Industrials","elsewedyelectric.com"],["Talaat Moustafa Group","TMGH.CA","Property","talaatmoustafa.com"],["Fawry","FWRY.CA","Financial Technology","fawry.com"]],
  Kenya:[["Safaricom","SCOM.NR","Telecoms","safaricom.co.ke"],["Equity Group","EQTY.NR","Banks","equitygroupholdings.com"],["KCB Group","KCB.NR","Banks","kcbgroup.com"],["East African Breweries","EABL.NR","Consumer","eabl.com"],["Co-operative Bank","COOP.NR","Banks","co-opbank.co.ke"]],
  Ghana:[["MTN Ghana",null,"Telecoms","mtn.com.gh"],["GCB Bank",null,"Banks","gcbbank.com.gh"],["GOIL",null,"Energy","goil.com.gh"],["CalBank",null,"Banks","calbank.net"],["TotalEnergies Ghana",null,"Energy","totalenergies.com"]],
  Morocco:[["Maroc Telecom",null,"Telecoms","iam.ma"],["Attijariwafa Bank",null,"Banks","attijariwafabank.com"],["Banque Centrale Populaire",null,"Banks","groupebcp.com"],["LafargeHolcim Maroc",null,"Industrials","lafargeholcim.ma"],["Managem",null,"Mining","managemgroup.com"]],
  Angola:[["Banco Angolano de Investimentos",null,"Banks","bancobai.ao"],["Banco de Fomento Angola",null,"Banks","bfa.ao"],["ENSA",null,"Insurance","ensa.co.ao"],["Unitel",null,"Telecoms","unitel.ao"],["Sonangol",null,"Energy","sonangol.co.ao"]],
  Ethiopia:[["Ethio Telecom",null,"Telecoms","ethiotelecom.et"],["Safaricom Ethiopia",null,"Telecoms","safaricom.et"],["PRIDE Microfinance",null,"Financials","pridemicrofinance.com"],["Berhan Bank",null,"Banks","berhanbanksc.com"],["PRSC",null,"Industrials","esx.et"]],
  "Cote d'Ivoire":[["Sonatel",null,"Telecoms","sonatel.sn"],["Societe Generale Cote d'Ivoire",null,"Banks","societegenerale.ci"],["Orange Cote d'Ivoire",null,"Telecoms","orange.ci"],["SITAB",null,"Consumer","sitab.ci"],["SAPH",null,"Agriculture","saph.ci"]],
  Rwanda:[["Bank of Kigali",null,"Banks","bk.rw"],["MTN Rwanda",null,"Telecoms","mtn.co.rw"],["Bralirwa",null,"Consumer","bralirwa.co.rw"],["I&M Bank Rwanda",null,"Banks","imbankgroup.com"],["Cimerwa",null,"Industrials","cimerwa.rw"]]
};

const universe = Object.entries(rawUniverse).flatMap(([country, rows]) => rows.map(([name,symbol,sector,domain],rank) => ({ country, name, symbol, sector, domain, rank:rank+1, id:(symbol||`${country}-${name}`).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") })));

async function quote(company) {
  if (!company.symbol) return { ...company, unavailable:true, reason:"No stable free exchange feed" };
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(company.symbol)}?range=1mo&interval=1d`, { headers:{"User-Agent":"Mozilla/5.0"}, signal:AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`${response.status}`);
  const result=(await response.json()).chart?.result?.[0], meta=result?.meta||{}, raw=result?.indicators?.quote?.[0]||{};
  const chart=(raw.close||[]).map((value,index)=>({date:new Date((result.timestamp?.[index]||0)*1000).toISOString().slice(0,10),value})).filter(x=>Number.isFinite(x.value));
  const price=chart.at(-1)?.value??meta.regularMarketPrice, previousClose=meta.chartPreviousClose??meta.previousClose;
  return {...company,price,previousClose,changePct:previousClose?(price/previousClose-1)*100:null,currency:meta.currency,exchange:meta.exchangeName,marketTime:meta.regularMarketTime?new Date(meta.regularMarketTime*1000).toISOString():null,chart};
}

export default async function handler(request,response){
  response.setHeader("Access-Control-Allow-Origin","*"); response.setHeader("Cache-Control","s-maxage=300, stale-while-revalidate=1200");
  const country=String(request.query?.country||""); const id=String(request.query?.id||"");
  if(request.query?.mode==="universe") return response.status(200).json({generatedAt:new Date().toISOString(),universe});
  const selected=id?universe.find(x=>x.id===id):null; const targetCountry=selected?.country||country||"United Kingdom"; const peers=universe.filter(x=>x.country===targetCountry).slice(0,5);
  const quotes=await Promise.all(peers.map(async company=>{try{return await quote(company)}catch{return {...company,unavailable:true,reason:"Price feed unavailable"}}}));
  return response.status(200).json({generatedAt:new Date().toISOString(),country:targetCountry,company:selected||null,peers:quotes});
}
