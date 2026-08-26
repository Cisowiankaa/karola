const GRAPH_VERSION=process.env.META_GRAPH_VERSION||'v26.0';
const IG_GRAPH=`https://graph.instagram.com/${GRAPH_VERSION}`;
const FB_GRAPH=`https://graph.facebook.com/${GRAPH_VERSION}`;

const has=v=>Boolean(String(v||'').trim());
const clean=v=>String(v||'').trim().replace(/^Bearer\s+/i,'').replace(/^['"]|['"]$/g,'').trim();

async function probeInstagram(){
  const token=clean(process.env.META_IG_ACCESS_TOKEN||process.env.META_ACCESS_TOKEN);
  if(!token)return {healthy:false,checked:false,code:'TOKEN_MISSING'};
  try{
    const r=await fetch(`${IG_GRAPH}/me?fields=id,user_id,username,account_type&access_token=${encodeURIComponent(token)}`);
    const d=await r.json().catch(()=>({}));
    if(!r.ok){
      const blocked=d?.error?.type==='OAuthException' || /access blocked|access token|oauth|permission/i.test(String(d?.error?.message||''));
      return {healthy:false,checked:true,code:blocked?'REAUTH_REQUIRED':'HEALTH_FAILED',message:d?.error?.message||`Meta HTTP ${r.status}`};
    }
    return {healthy:true,checked:true,code:'OK',username:d?.username||null};
  }catch(e){return {healthy:false,checked:true,code:'NETWORK_ERROR',message:e?.message||String(e)}}
}

async function probeFacebook(){
  const token=clean(process.env.META_FB_ACCESS_TOKEN||process.env.META_ACCESS_TOKEN);
  const pageId=String(process.env.META_PAGE_ID||'').trim();
  if(!token||!pageId)return {healthy:false,checked:false,code:!pageId?'PAGE_ID_MISSING':'TOKEN_MISSING'};
  try{
    const r=await fetch(`${FB_GRAPH}/${encodeURIComponent(pageId)}?fields=id,name&access_token=${encodeURIComponent(token)}`);
    const d=await r.json().catch(()=>({}));
    if(!r.ok){
      const blocked=d?.error?.type==='OAuthException'||/access token|oauth|permission/i.test(String(d?.error?.message||''));
      return {healthy:false,checked:true,code:blocked?'REAUTH_REQUIRED':'HEALTH_FAILED',message:d?.error?.message||`Meta HTTP ${r.status}`};
    }
    return {healthy:true,checked:true,code:'OK',name:d?.name||null};
  }catch(e){return {healthy:false,checked:true,code:'NETWORK_ERROR',message:e?.message||String(e)}}
}

module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});

  const instagramMetaConfigured=(has(process.env.META_INSTAGRAM_APP_ID)&&has(process.env.META_INSTAGRAM_APP_SECRET))||(has(process.env.META_IG_USER_ID)&&(has(process.env.META_IG_ACCESS_TOKEN)||has(process.env.META_ACCESS_TOKEN)));
  const facebookMetaConfigured=(has(process.env.META_FACEBOOK_APP_ID)&&has(process.env.META_FACEBOOK_APP_SECRET))||(has(process.env.META_PAGE_ID)&&(has(process.env.META_FB_ACCESS_TOKEN)||has(process.env.META_ACCESS_TOKEN)));
  const apify=has(process.env.APIFY_TOKEN);
  const tiktok=has(process.env.TIKTOK_ACCESS_TOKEN)||has(process.env.TIKTOK_CLIENT_KEY);

  const [igHealth,fbHealth]=await Promise.all([probeInstagram(),probeFacebook()]);

  return res.status(200).json({
    ok:true,
    checkedAt:new Date().toISOString(),
    providers:{
      instagram:{
        metaConfigured:instagramMetaConfigured,
        metaHealthy:Boolean(igHealth.healthy),
        metaHealthCode:igHealth.code,
        metaHealthMessage:igHealth.message||null,
        metaOAuthReady:has(process.env.META_INSTAGRAM_APP_ID)&&has(process.env.META_INSTAGRAM_APP_SECRET),
        apifyConfigured:apify,
        activeSource:igHealth.healthy?'meta':apify?'apify':'local-cache',
        fallback:apify?'apify':'local-cache'
      },
      facebook:{
        metaConfigured:facebookMetaConfigured,
        metaHealthy:Boolean(fbHealth.healthy),
        metaHealthCode:fbHealth.code,
        metaHealthMessage:fbHealth.message||null,
        metaOAuthReady:has(process.env.META_FACEBOOK_APP_ID)&&has(process.env.META_FACEBOOK_APP_SECRET),
        activeSource:fbHealth.healthy?'meta':'local-cache',
        fallback:'local-cache'
      },
      tiktok:{
        configured:tiktok,
        healthy:tiktok,
        apifyConfigured:apify,
        activeSource:tiktok?'tiktok-api':apify?'apify-ready':'local-cache',
        fallback:apify?'apify-ready':'local-cache'
      },
      localCache:{configured:true,healthy:true,alwaysAvailable:true}
    },
    missing:{
      instagram:[!has(process.env.META_INSTAGRAM_APP_ID)?'META_INSTAGRAM_APP_ID':null,!has(process.env.META_INSTAGRAM_APP_SECRET)?'META_INSTAGRAM_APP_SECRET':null,!apify?'APIFY_TOKEN':null].filter(Boolean),
      facebook:[!has(process.env.META_FACEBOOK_APP_ID)?'META_FACEBOOK_APP_ID':null,!has(process.env.META_FACEBOOK_APP_SECRET)?'META_FACEBOOK_APP_SECRET':null].filter(Boolean),
      tiktok:[!tiktok?'TIKTOK_ACCESS_TOKEN / TIKTOK_CLIENT_KEY':null,!apify?'APIFY_TOKEN (fallback)':null].filter(Boolean)
    }
  });
};