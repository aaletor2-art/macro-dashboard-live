const decode=value=>String(value||"").replace(/<!\[CDATA\[|\]\]>/g,"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");
const tag=(block,name)=>decode(block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,"i"))?.[1]);

export default async function handler(request,response){
  response.setHeader("Access-Control-Allow-Origin","*");response.setHeader("Cache-Control","s-maxage=600, stale-while-revalidate=1800");
  const country=String(request.query?.country||"global").slice(0,80),query=encodeURIComponent(`${country} economy inflation interest rates (site:reuters.com OR site:tradingeconomics.com)`);
  try{const upstream=await fetch(`https://news.google.com/rss/search?q=${query}&hl=en-GB&gl=GB&ceid=GB:en`,{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(10000)});if(!upstream.ok)throw new Error(`${upstream.status}`);const xml=await upstream.text();const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0,10).map(match=>{const block=match[1],title=tag(block,"title"),url=tag(block,"link"),publishedAt=tag(block,"pubDate"),source=tag(block,"source")||(/Reuters/i.test(title)?"Reuters":/Trading Economics/i.test(title)?"Trading Economics":"Google News");return{title:title.replace(/\s+-\s+(Reuters|Trading Economics)$/i,""),url,publishedAt,source};}).filter(item=>item.title&&item.url);response.status(200).json({country,generatedAt:new Date().toISOString(),items});}catch(error){response.status(502).json({error:"News feed unavailable",items:[]});}
}
