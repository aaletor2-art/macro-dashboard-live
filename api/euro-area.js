const euroMembers = {AT:"Austria",BE:"Belgium",BG:"Bulgaria",HR:"Croatia",CY:"Cyprus",EE:"Estonia",FI:"Finland",FR:"France",DE:"Germany",EL:"Greece",IE:"Ireland",IT:"Italy",LV:"Latvia",LT:"Lithuania",LU:"Luxembourg",MT:"Malta",NL:"Netherlands",PT:"Portugal",SK:"Slovakia",SI:"Slovenia",ES:"Spain",EA21:"Euro Area"};

function indexMap(dimension) {
  const index=dimension?.category?.index||{};
  return Array.isArray(index) ? Object.fromEntries(index.map((key,i)=>[key,i])) : index;
}

export default async function handler(request,response) {
  response.setHeader("Access-Control-Allow-Origin","*");
  response.setHeader("Cache-Control","s-maxage=21600, stale-while-revalidate=86400");
  try {
    const year=new Date().getUTCFullYear()-1;
    const url=`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr?lang=en&freq=M&unit=RCH_A&coicop=CP00&sinceTimePeriod=${year}-01`;
    const upstream=await fetch(url,{signal:AbortSignal.timeout(12000)});
    if(!upstream.ok) throw new Error(`Eurostat ${upstream.status}`);
    const data=await upstream.json(), geo=indexMap(data.dimension?.geo), time=indexMap(data.dimension?.time), timeCount=data.size?.[data.id.indexOf("time")]||Object.keys(time).length;
    const periods=Object.entries(time).sort((a,b)=>b[1]-a[1]);
    const rows=Object.entries(euroMembers).map(([code,market])=>{
      const geoIndex=geo[code]; let value=null, period=null;
      if(Number.isInteger(geoIndex)) for(const [label,timeIndex] of periods){const flat=geoIndex*timeCount+timeIndex;const candidate=Array.isArray(data.value)?data.value[flat]:data.value?.[flat];if(Number.isFinite(candidate)){value=candidate;period=label;break;}}
      return {code,market,inflation:value,period};
    });
    response.status(200).json({source:"Eurostat HICP",sourceUrl:"https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_manr/default/table",generatedAt:new Date().toISOString(),rows});
  } catch(error) { response.status(502).json({error:"Eurostat HICP unavailable",detail:error.message}); }
}
