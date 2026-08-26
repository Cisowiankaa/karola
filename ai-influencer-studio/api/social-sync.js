// Meta social sync via GitHub/Vercel
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v26.0';
const FB_GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const IG_GRAPH = `https://graph.instagram.com/${GRAPH_VERSION}`;

function cors(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Meta-Ig-User-Id');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
}

function normalizeToken(value) {
  let token = String(value || '').trim();
  token = token.replace(/^Bearer\s+/i, '').trim();
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) token = token.slice(1, -1).trim();
  return token;
}

function tokenDiagnostics(raw, normalized) {
  const original = String(raw || '');
  return {present:Boolean(original),rawLength:original.length,normalizedLength:normalized.length,prefix:normalized.slice(0,4),startsWithInstagramPrefix:normalized.startsWith('IG'),hadOuterWhitespace:original!==original.trim(),hadBearerPrefix:/^\s*Bearer\s+/i.test(original),hadWrappingQuotes:/^\s*["'].*["']\s*$/.test(original)};
}

async function graph(base, path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`${base}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data?.error?.message || `Meta Graph HTTP ${r.status}`);
    err.metaCode = data?.error?.code; err.metaType = data?.error?.type; err.httpStatus = r.status; throw err;
  }
  return data;
}

function mediaType(type){if(type==='VIDEO')return'Reels';if(type==='CAROUSEL_ALBUM')return'Carousel';return'Post';}
function authProblem(error){const message=String(error?.message||'');return error?.metaType==='OAuthException'||/access blocked|access token|oauth|session|permission/i.test(message);}

module.exports = async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});

  const headerToken = normalizeToken(req.headers.authorization || '');
  const rawToken = headerToken || process.env.META_ACCESS_TOKEN;
  const token = normalizeToken(rawToken);
  const igUserId = String(req.headers['x-meta-ig-user-id'] || process.env.META_IG_USER_ID || '').trim();
  const pageId = String(process.env.META_PAGE_ID || '').trim();

  if(!token||(!igUserId&&!pageId))return res.status(503).json({ok:false,service:'meta-social-sync',configured:false,code:'META_NOT_CONFIGURED',missing:[!token?'META_ACCESS_TOKEN':null,!igUserId?'META_IG_USER_ID':null,!pageId?'META_PAGE_ID':null].filter(Boolean),tokenDiagnostics:tokenDiagnostics(rawToken,token),message:'Meta API credentials are not configured on the server.'});

  try{
    const profiles=[],items=[],metrics={};
    if(igUserId){
      const ig=await graph(IG_GRAPH,`${igUserId}?fields=id,user_id,username,name,profile_picture_url,followers_count,media_count`,token);
      profiles.push({platform:'Instagram',handle:ig.username?`@${ig.username}`:'',active:true,connected:true,externalId:ig.id||ig.user_id,followers:ig.followers_count||0,mediaCount:ig.media_count||0,avatar:ig.profile_picture_url||''});
      metrics.instagram={followers:ig.followers_count||0,mediaCount:ig.media_count||0};
      const media=await graph(IG_GRAPH,`${igUserId}/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count&limit=25`,token);
      for(const m of media.data||[]){const dt=m.timestamp?new Date(m.timestamp):new Date();items.push({id:`ig-${m.id}`,externalId:`ig-${m.id}`,title:(m.caption||'Publikacja Instagram').split(/\n/)[0].slice(0,90),platform:ig.username?`Instagram @${ig.username}`:'Instagram',type:m.media_product_type==='REELS'?'Reels':mediaType(m.media_type),date:dt.toISOString().slice(0,10),time:dt.toTimeString().slice(0,5),status:'Opublikowany',notes:m.caption||'',permalink:m.permalink||'',likes:m.like_count||0,comments:m.comments_count||0,synced:true});}
    }
    if(pageId && !headerToken){
      const page=await graph(FB_GRAPH,`${pageId}?fields=id,name,username,picture{url},followers_count,fan_count`,token);
      profiles.push({platform:'Facebook',handle:page.username?`@${page.username}`:(page.name||''),active:true,connected:true,externalId:page.id,followers:page.followers_count||page.fan_count||0,avatar:page.picture?.data?.url||''});
      metrics.facebook={followers:page.followers_count||page.fan_count||0};
      const posts=await graph(FB_GRAPH,`${pageId}/posts?fields=id,message,created_time,permalink_url,shares,likes.summary(true),comments.summary(true)&limit=25`,token);
      for(const p of posts.data||[]){const dt=p.created_time?new Date(p.created_time):new Date();items.push({id:`fb-${p.id}`,externalId:`fb-${p.id}`,title:(p.message||'Publikacja Facebook').split(/\n/)[0].slice(0,90),platform:page.username?`Facebook @${page.username}`:`Facebook ${page.name||''}`.trim(),type:'Post',date:dt.toISOString().slice(0,10),time:dt.toTimeString().slice(0,5),status:'Opublikowany',notes:p.message||'',permalink:p.permalink_url||'',likes:p.likes?.summary?.total_count||0,comments:p.comments?.summary?.total_count||0,shares:p.shares?.count||0,synced:true});}
    }
    items.sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
    return res.status(200).json({ok:true,service:'meta-social-sync',provider:'Meta Graph API',graphVersion:GRAPH_VERSION,syncedAt:new Date().toISOString(),profiles,items,metrics,sessionToken:Boolean(headerToken)});
  }catch(error){const blocked=authProblem(error);return res.status(blocked?401:502).json({ok:false,configured:true,connected:false,code:blocked?'META_REAUTH_REQUIRED':'META_SYNC_FAILED',error:error?.message||'Meta synchronization failed',message:blocked?'Meta API jest podłączone, ale dostęp został zablokowany. Wymagane jest ponowne połączenie/autoryzacja Meta.':'Meta API jest podłączone, ale synchronizacja nie powiodła się.',metaCode:error?.metaCode||null,metaType:error?.metaType||null,tokenDiagnostics:tokenDiagnostics(rawToken,token)});}
};