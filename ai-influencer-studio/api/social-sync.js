const V=process.env.META_GRAPH_VERSION||'v26.0';
const FB=`https://graph.facebook.com/${V}`;
const IG=`https://graph.instagram.com/${V}`;

function parseCookies(req){return String(req.headers.cookie||'').split(';').reduce((a,p)=>{const i=p.indexOf('=');if(i<0)return a;const k=p.slice(0,i).trim();const v=p.slice(i+1).trim();try{a[k]=decodeURIComponent(v)}catch{a[k]=v}return a},{})}
function norm(v){return String(v||'').trim().replace(/^Bearer\s+/i,'').replace(/^['"]|['"]$/g,'').trim()}
function origin(o){if(o==='https://cisowiankaa.github.io'||o==='https://ai-influencer-studio-api.vercel.app'||/^https:\/\/[-a-z0-9]+\.vercel\.app$/i.test(o||''))return o;return 'https://ai-influencer-studio-api.vercel.app'}
function cors(req,res){res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Access-Control-Allow-Origin',origin(req.headers.origin));res.setHeader('Access-Control-Allow-Credentials','true');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, X-Meta-Ig-User-Id, X-Instagram-Username');res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');res.setHeader('Cache-Control','private, max-age=0, must-revalidate')}
async function graph(base,path,token){const s=path.includes('?')?'&':'?';const r=await fetch(`${base}/${path}${s}access_token=${encodeURIComponent(token)}`);const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d?.error?.message||`Meta Graph HTTP ${r.status}`);e.metaType=d?.error?.type;e.metaCode=d?.error?.code;throw e}return d}
function authErr(e){return e?.metaType==='OAuthException'||/access blocked|access token|oauth|session|permission/i.test(String(e?.message||''))}
function srcErr(e){return{provider:'Meta',ok:false,code:authErr(e)?'REAUTH_REQUIRED':'SYNC_FAILED',message:e?.message||'Meta sync failed',metaType:e?.metaType||null,metaCode:e?.metaCode||null}}

module.exports=async function(req,res){
  cors(req,res);if(req.method==='OPTIONS')return res.status(204).end();if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const c=parseCookies(req),session=norm(c.aii_meta_token),legacy=norm(process.env.META_ACCESS_TOKEN),header=norm(req.headers.authorization);
  const token=header||session||norm(process.env.META_IG_ACCESS_TOKEN)||legacy;
  const mode=String(c.aii_meta_auth_mode||'');
  const igId=String(req.headers['x-meta-ig-user-id']||c.aii_meta_ig_user_id||process.env.META_IG_USER_ID||'').trim();
  const pageId=String(c.aii_meta_page_id||process.env.META_PAGE_ID||'').trim();
  const base=(mode==='facebook'||session.startsWith('EAA'))?FB:IG;
  const profiles=[],items=[],metrics={},sources={instagram:[],facebook:[]};

  if(igId&&token){try{
    const fields=base===FB?'id,username,name,profile_picture_url,followers_count,media_count':'id,user_id,username,name,profile_picture_url,followers_count,media_count';
    const ig=await graph(base,`${igId}?fields=${fields}`,token);const u=ig.username||'';
    profiles.push({platform:'Instagram',handle:u?`@${u}`:'',active:true,connected:true,source:'Meta',externalId:ig.id||ig.user_id,followers:ig.followers_count||0,mediaCount:ig.media_count||0,avatar:ig.profile_picture_url||''});
    metrics.instagram={followers:ig.followers_count||0,mediaCount:ig.media_count||0,source:'Meta'};sources.instagram.push({provider:'Meta',ok:true,graph:base===FB?'facebook':'instagram',auth:session?'oauth-session':'server-token'});
    const media=await graph(base,`${igId}/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count&limit=25`,token);
    for(const m of media.data||[]){const dt=m.timestamp?new Date(m.timestamp):new Date();items.push({id:`ig-${m.id}`,externalId:`ig-${m.id}`,title:(m.caption||'Publikacja Instagram').split(/\n/)[0].slice(0,90),platform:u?`Instagram @${u}`:'Instagram',type:m.media_product_type==='REELS'?'Reels':m.media_type==='CAROUSEL_ALBUM'?'Carousel':'Post',date:dt.toISOString().slice(0,10),time:dt.toTimeString().slice(0,5),status:'Opublikowany',notes:m.caption||'',permalink:m.permalink||'',likes:m.like_count||0,comments:m.comments_count||0,synced:true,source:'Meta'})}
  }catch(e){sources.instagram.push(srcErr(e))}}else sources.instagram.push({provider:'Meta',ok:false,code:'NOT_CONFIGURED',message:!igId?'Instagram user ID missing':'Instagram token missing'});

  if(pageId&&(session||norm(process.env.META_FB_ACCESS_TOKEN)||legacy)){try{
    const ft=session||norm(process.env.META_FB_ACCESS_TOKEN)||legacy;const p=await graph(FB,`${pageId}?fields=id,name,username,picture{url},followers_count,fan_count`,ft);
    profiles.push({platform:'Facebook',handle:p.username?`@${p.username}`:(p.name||''),active:true,connected:true,source:'Meta',externalId:p.id,followers:p.followers_count||p.fan_count||0,avatar:p.picture?.data?.url||''});metrics.facebook={followers:p.followers_count||p.fan_count||0,source:'Meta'};sources.facebook.push({provider:'Meta',ok:true});
  }catch(e){sources.facebook.push(srcErr(e))}}else sources.facebook.push({provider:'Meta',ok:false,code:'NOT_CONFIGURED',message:'Facebook page connection missing'});

  items.sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  const instagramLive=sources.instagram.some(x=>x.ok),facebookLive=sources.facebook.some(x=>x.ok),live=instagramLive||facebookLive;
  const reauth=[...sources.instagram,...sources.facebook].some(x=>x.code==='REAUTH_REQUIRED');
  if(!live)return res.status(200).json({ok:true,degraded:true,partial:false,connected:false,service:'resilient-social-sync',provider:'local-cache',code:reauth?'META_REAUTH_REQUIRED':'SOCIAL_DEGRADED',message:reauth?'Meta wymaga ponownej autoryzacji.':'Źródła LIVE są obecnie niedostępne.',syncedAt:new Date().toISOString(),profiles:[],items:[],metrics:{},sources,fallback:'local-cache'});
  return res.status(200).json({ok:true,degraded:false,partial:!(instagramLive&&facebookLive),connected:true,service:'resilient-social-sync',provider:'Meta Graph API',graphVersion:V,syncedAt:new Date().toISOString(),profiles,items,metrics,sources,authSession:Boolean(session)});
};