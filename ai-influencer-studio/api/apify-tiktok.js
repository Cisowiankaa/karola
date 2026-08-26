function allowedOrigin(origin){
  if(origin==='https://cisowiankaa.github.io'||origin==='https://ai-influencer-studio-api.vercel.app'||/^https:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin||'')) return origin;
  return 'https://ai-influencer-studio-api.vercel.app';
}
function first(...values){return values.find(v=>v!==undefined&&v!==null&&v!=='')}
function number(...values){const v=first(...values);const n=Number(v);return Number.isFinite(n)?n:null}
function bool(...values){const v=first(...values);return v===true||v===1||String(v).toLowerCase()==='true'}
function usernameFrom(raw){
  let value=String(raw||'').trim();
  try{if(/^https?:\/\//i.test(value)){const u=new URL(value);value=u.pathname.split('/').filter(Boolean).find(x=>x.startsWith('@'))||u.pathname.split('/').filter(Boolean).pop()||''}}catch{}
  return value.replace(/^@/,'').replace(/[?#].*$/,'').replace(/\/$/,'').trim();
}

module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin',allowedOrigin(req.headers.origin));
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(!['GET','POST'].includes(req.method))return res.status(405).json({ok:false,error:'Method not allowed'});

  const token=String(process.env.APIFY_TOKEN||'').trim();
  if(!token)return res.status(503).json({ok:false,code:'APIFY_NOT_CONFIGURED',error:'APIFY_TOKEN is not configured on Vercel'});

  const username=usernameFrom(req.method==='GET'?req.query?.username:req.body?.username);
  if(!/^[A-Za-z0-9._]{2,30}$/.test(username))return res.status(400).json({ok:false,code:'INVALID_USERNAME',error:'Podaj poprawny nick TikToka'});

  const actorId='gopalakrishnan~tiktok-profile';
  const url=`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&clean=true&format=json&timeout=120&maxItems=1`;
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),125000);
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usernames:[username]}),signal:controller.signal}).finally(()=>clearTimeout(timer));
    const text=await response.text();
    let data=null;try{data=JSON.parse(text)}catch{}
    if(!response.ok){
      const message=data?.error?.message||data?.message||text.slice(0,240)||`Apify HTTP ${response.status}`;
      return res.status(response.status).json({ok:false,code:'APIFY_FAILED',error:message});
    }
    const item=Array.isArray(data)?data[0]:data;
    if(!item)return res.status(404).json({ok:false,code:'PROFILE_NOT_FOUND',error:'Nie znaleziono publicznego profilu TikTok'});

    const user=item.userInfo?.user||item.user||item.profile||item;
    const stats=item.userInfo?.stats||item.stats||item.statistics||item;
    const profile={
      platform:'TikTok',
      username:first(user.uniqueId,user.username,user.handle,item.uniqueId,item.username,username)||username,
      fullName:first(user.nickname,user.displayName,user.fullName,item.nickname,item.displayName,item.fullName)||'',
      biography:first(user.signature,user.bio,user.biography,item.signature,item.bio,item.biography)||'',
      followers:number(stats.followerCount,stats.followers,stats.followersCount,item.followerCount,item.followers,item.followersCount),
      following:number(stats.followingCount,stats.following,stats.followsCount,item.followingCount,item.following,item.followsCount),
      likes:number(stats.heartCount,stats.heart,stats.likes,stats.likesCount,item.heartCount,item.likes,item.likesCount),
      videos:number(stats.videoCount,stats.videos,stats.posts,item.videoCount,item.videos,item.posts),
      verified:bool(user.verified,user.isVerified,item.verified,item.isVerified),
      private:bool(user.privateAccount,user.isPrivate,item.privateAccount,item.private,item.isPrivate),
      region:first(user.region,item.region)||'',
      profilePicUrl:first(user.avatarLarger,user.avatarMedium,user.avatarThumb,user.avatar,item.avatarLarger,item.avatarMedium,item.avatar,item.profilePicUrl)||'',
      externalId:first(user.id,user.uid,user.secUid,item.id,item.userId,item.secUid)||'',
      url:`https://www.tiktok.com/@${encodeURIComponent(username)}`,
      scrapedAt:new Date().toISOString(),
      source:'Apify TikTok Profile Scraper'
    };
    return res.status(200).json({ok:true,profile});
  }catch(error){
    const timedOut=error?.name==='AbortError';
    return res.status(timedOut?504:500).json({ok:false,code:timedOut?'APIFY_TIMEOUT':'APIFY_ERROR',error:timedOut?'Apify TikTok lookup timed out':(error?.message||'Apify TikTok lookup failed')});
  }
};