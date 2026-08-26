module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});

  const has=v=>Boolean(String(v||'').trim());
  const instagramMeta = (has(process.env.META_INSTAGRAM_APP_ID)&&has(process.env.META_INSTAGRAM_APP_SECRET)) || (has(process.env.META_IG_USER_ID)&&(has(process.env.META_IG_ACCESS_TOKEN)||has(process.env.META_ACCESS_TOKEN)));
  const facebookMeta = (has(process.env.META_FACEBOOK_APP_ID)&&has(process.env.META_FACEBOOK_APP_SECRET)) || (has(process.env.META_PAGE_ID)&&(has(process.env.META_FB_ACCESS_TOKEN)||has(process.env.META_ACCESS_TOKEN)));
  const apify = has(process.env.APIFY_TOKEN);
  const tiktok = has(process.env.TIKTOK_ACCESS_TOKEN) || has(process.env.TIKTOK_CLIENT_KEY);

  return res.status(200).json({
    ok:true,
    checkedAt:new Date().toISOString(),
    providers:{
      instagram:{
        metaConfigured:instagramMeta,
        metaOAuthReady:has(process.env.META_INSTAGRAM_APP_ID)&&has(process.env.META_INSTAGRAM_APP_SECRET),
        apifyConfigured:apify,
        fallback:apify?'apify':'local-cache'
      },
      facebook:{
        metaConfigured:facebookMeta,
        metaOAuthReady:has(process.env.META_FACEBOOK_APP_ID)&&has(process.env.META_FACEBOOK_APP_SECRET),
        fallback:'local-cache'
      },
      tiktok:{
        configured:tiktok,
        apifyConfigured:apify,
        fallback:apify?'apify-ready':'local-cache'
      },
      localCache:{configured:true,alwaysAvailable:true}
    },
    missing:{
      instagram:[!has(process.env.META_INSTAGRAM_APP_ID)?'META_INSTAGRAM_APP_ID':null,!has(process.env.META_INSTAGRAM_APP_SECRET)?'META_INSTAGRAM_APP_SECRET':null,!apify?'APIFY_TOKEN':null].filter(Boolean),
      facebook:[!has(process.env.META_FACEBOOK_APP_ID)?'META_FACEBOOK_APP_ID':null,!has(process.env.META_FACEBOOK_APP_SECRET)?'META_FACEBOOK_APP_SECRET':null].filter(Boolean),
      tiktok:[!tiktok?'TIKTOK_ACCESS_TOKEN / TIKTOK_CLIENT_KEY':null,!apify?'APIFY_TOKEN (fallback)':null].filter(Boolean)
    }
  });
};