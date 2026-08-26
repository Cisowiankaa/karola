const APP_ID = process.env.META_APP_ID || '2272021750228175';
const APP_SECRET = process.env.META_APP_SECRET || '';
const FRONTEND = process.env.META_FRONTEND_URL || 'https://ai-influencer-studio-api.vercel.app/';

module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});
  return res.status(200).json({
    ok:true,
    service:'meta-oauth',
    ready:Boolean(APP_ID&&APP_SECRET),
    appIdConfigured:Boolean(APP_ID),
    appSecretConfigured:Boolean(APP_SECRET),
    frontend:FRONTEND,
    authStart:'/api/meta-auth-start'
  });
};