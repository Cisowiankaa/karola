const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v26.0';
const IG_GRAPH = `https://graph.instagram.com/${GRAPH_VERSION}`;

function cleanToken(value) {
  let token = String(value || '').trim().replace(/^Bearer\s+/i, '').trim();
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) token = token.slice(1,-1).trim();
  return token;
}

module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Method not allowed'});

  const token=cleanToken(process.env.META_ACCESS_TOKEN);
  if(!token) return res.status(503).json({ok:false,code:'META_TOKEN_MISSING',message:'META_ACCESS_TOKEN is not configured'});

  try{
    const url=`${IG_GRAPH}/me?fields=id,user_id,username,account_type&access_token=${encodeURIComponent(token)}`;
    const r=await fetch(url);
    const data=await r.json().catch(()=>({}));
    if(!r.ok){
      const msg=data?.error?.message||`Meta HTTP ${r.status}`;
      const blocked=data?.error?.type==='OAuthException' && Number(data?.error?.code)===200;
      return res.status(blocked?401:502).json({
        ok:false,
        code:blocked?'META_REAUTH_REQUIRED':'META_HEALTH_FAILED',
        message:blocked?'Meta odrzuca nawet podstawowe wywołanie /me. Problem dotyczy autoryzacji/aplikacji Meta, nie ID profilu.':msg,
        metaType:data?.error?.type||null,
        metaCode:data?.error?.code||null,
        tokenPresent:true,
        tokenPrefix:token.slice(0,4)
      });
    }
    return res.status(200).json({
      ok:true,
      code:'META_AUTH_OK',
      username:data?.username||null,
      accountType:data?.account_type||null,
      hasId:Boolean(data?.id||data?.user_id)
    });
  }catch(error){
    return res.status(500).json({ok:false,code:'META_HEALTH_EXCEPTION',message:error?.message||'Unexpected Meta health error'});
  }
};