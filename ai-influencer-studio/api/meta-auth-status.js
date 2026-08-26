const FRONTEND = process.env.META_FRONTEND_URL || 'https://ai-influencer-studio-api.vercel.app/';
const BUILTIN_APP_ID = '2272021750228175';

module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});

  const legacyId = String(process.env.META_APP_ID || BUILTIN_APP_ID).trim();
  const legacySecret = String(process.env.META_APP_SECRET || '').trim();
  const instagramId = String(process.env.META_INSTAGRAM_APP_ID || legacyId).trim();
  const instagramSecret = String(process.env.META_INSTAGRAM_APP_SECRET || legacySecret).trim();
  const facebookId = String(process.env.META_FACEBOOK_APP_ID || legacyId).trim();
  const facebookSecret = String(process.env.META_FACEBOOK_APP_SECRET || legacySecret).trim();

  const instagram = {
    ready: Boolean(instagramId && instagramSecret),
    appIdConfigured: Boolean(instagramId),
    appSecretConfigured: Boolean(instagramSecret),
    appIdSource: process.env.META_INSTAGRAM_APP_ID ? 'META_INSTAGRAM_APP_ID' : process.env.META_APP_ID ? 'META_APP_ID' : 'built-in',
    missing: [!instagramSecret?'META_APP_SECRET':null].filter(Boolean)
  };
  const facebook = {
    ready: Boolean(facebookId && facebookSecret),
    appIdConfigured: Boolean(facebookId),
    appSecretConfigured: Boolean(facebookSecret),
    appIdSource: process.env.META_FACEBOOK_APP_ID ? 'META_FACEBOOK_APP_ID' : process.env.META_APP_ID ? 'META_APP_ID' : 'built-in',
    missing: [!facebookSecret?'META_APP_SECRET':null].filter(Boolean)
  };

  return res.status(200).json({
    ok:true,
    service:'meta-oauth',
    ready: instagram.ready || facebook.ready,
    recommendedMode: instagram.ready ? 'instagram' : facebook.ready ? 'facebook' : null,
    instagram,
    facebook,
    effectiveAppIdPresent:Boolean(legacyId),
    legacyMetaAppIdPresent:Boolean(String(process.env.META_APP_ID||'').trim()),
    legacyMetaAppSecretPresent:Boolean(legacySecret),
    frontend:FRONTEND,
    callback:'https://ai-influencer-studio-api.vercel.app/api/meta-auth-callback',
    authStart:'/api/meta-auth-start?mode=instagram'
  });
};