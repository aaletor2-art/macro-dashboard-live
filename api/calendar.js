// Licensed provider access stays server-side. This endpoint is not an archive.
export function normalizeRelease(row) {
  return {provider:'trading-economics',providerId:String(row.CalendarId),scheduledAt:row.Date,
    country:row.Country,event:row.Event,reference:row.Reference,currency:row.Currency,
    actual:row.Actual??null,forecast:row.Forecast??null,previous:row.Previous??null,
    revised:row.Revised??null,unit:row.Unit,importance:row.Importance,
    source:row.Source,sourceUrl:row.SourceURL,providerUpdatedAt:row.LastUpdate};
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const {from,to}=req.query||{};
  const valid=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
  if(!valid(from)||!valid(to)||Date.parse(to)<Date.parse(from)||Date.parse(to)-Date.parse(from)>31*86400000)return res.status(400).json({error:'Choose a valid date range of at most 31 days.'});
  if(!process.env.TRADING_ECONOMICS_API_KEY)return res.status(503).json({status:'setup_required',error:'Licensed calendar connection is not configured. No sample events are substituted.'});
  const country=String(req.query.country||'all').trim();
  if(!/^[a-zA-Z ,'-]{1,150}$/.test(country))return res.status(400).json({error:'Invalid country'});
  try {
    const url=new URL(`https://api.tradingeconomics.com/calendar/country/${encodeURIComponent(country)}/${from}/${to}`);
    url.searchParams.set('c',process.env.TRADING_ECONOMICS_API_KEY);url.searchParams.set('f','json');
    const upstream=await fetch(url,{signal:AbortSignal.timeout(10000)});
    if(!upstream.ok)throw Error('Provider unavailable');
    const payload=await upstream.json();if(!Array.isArray(payload))throw Error('Invalid response');
    return res.status(200).json({fetchedAt:new Date().toISOString(),archived:false,events:payload.filter(row=>row.CalendarId!=null).map(normalizeRelease)});
  }catch{return res.status(502).json({error:'Calendar provider unavailable. Previously archived data must remain available separately.'});}
}
