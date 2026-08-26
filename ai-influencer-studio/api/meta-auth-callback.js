const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v26.0';
const FRONTEND = process.env.META_FRONTEND_URL || 'https://ai-influencer-studio-api.vercel.app/';

function cookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((acc, part) => {
    const i = part.indexOf('=');
    if (i < 0) return acc;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    try { acc[key] = decodeURIComponent(value); } catch { acc[key] = value; }
    return acc;
  }, {});
}

async function fbGraph(path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Meta Graph HTTP ${r.status}`);
  return data;
}

function clearOauthCookies() {
  return [
    'aii_meta_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    'aii_meta_oauth_mode=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  ];
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const jar = cookies(req);
  const code = String(req.query.code || '');
  const state = String(req.query.state || '');
  const storedState = jar.aii_meta_oauth_state || '';
  const mode = jar.aii_meta_oauth_mode || '';

  if (!code) return res.status(400).send('Brak kodu autoryzacji Meta.');
  if (!state || !storedState || state !== storedState) return res.status(400).send('Nieprawidłowy stan sesji OAuth Meta. Uruchom połączenie ponownie z aplikacji.');
  if (!['instagram','facebook'].includes(mode)) return res.status(400).send('Brak informacji o trybie OAuth Meta. Uruchom połączenie ponownie z aplikacji.');

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/meta-auth-callback`;
  const cookieBase = 'Path=/; HttpOnly; Secure; SameSite=Lax';

  try {
    if (mode === 'instagram') {
      const appId = String(process.env.META_INSTAGRAM_APP_ID || '').trim();
      const appSecret = String(process.env.META_INSTAGRAM_APP_SECRET || '').trim();
      if (!appId || !appSecret) return res.status(503).send('Brak META_INSTAGRAM_APP_ID lub META_INSTAGRAM_APP_SECRET w Vercel.');

      const body = new URLSearchParams({client_id:appId,client_secret:appSecret,grant_type:'authorization_code',redirect_uri:redirectUri,code});
      const tokenRes = await fetch('https://api.instagram.com/oauth/access_token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
      const short = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !short.access_token) {
        res.setHeader('Set-Cookie', clearOauthCookies());
        return res.status(401).send(`Instagram nie zwrócił tokenu dostępu. ${short.error_message || short.error?.message || ''}`);
      }

      let accessToken = short.access_token;
      let expiresIn = 3600;
      try {
        const longUrl = new URL('https://graph.instagram.com/access_token');
        longUrl.searchParams.set('grant_type','ig_exchange_token');
        longUrl.searchParams.set('client_secret',appSecret);
        longUrl.searchParams.set('access_token',short.access_token);
        const longRes = await fetch(longUrl);
        const long = await longRes.json().catch(() => ({}));
        if (longRes.ok && long.access_token) { accessToken = long.access_token; expiresIn = Number(long.expires_in) || 60*24*60*60; }
      } catch {}

      const maxAge = Math.max(300, Math.min(expiresIn, 60*24*60*60));
      res.setHeader('Set-Cookie', [
        `aii_meta_token=${encodeURIComponent(accessToken)}; ${cookieBase}; Max-Age=${maxAge}`,
        `aii_meta_ig_user_id=${encodeURIComponent(String(short.user_id || ''))}; ${cookieBase}; Max-Age=${maxAge}`,
        `aii_meta_auth_mode=instagram; ${cookieBase}; Max-Age=${maxAge}`,
        ...clearOauthCookies()
      ]);
      const target = new URL(FRONTEND); target.searchParams.set('meta_connected','1');
      return res.redirect(302,target.toString());
    }

    const legacyId = String(process.env.META_APP_ID || '').trim();
    const legacySecret = String(process.env.META_APP_SECRET || '').trim();
    const appId = String(process.env.META_FACEBOOK_APP_ID || legacyId).trim();
    const appSecret = String(process.env.META_FACEBOOK_APP_SECRET || legacySecret).trim();
    if (!appId || !appSecret) return res.status(503).send('Brak META_FACEBOOK_APP_ID i META_FACEBOOK_APP_SECRET (lub jawnie META_APP_ID i META_APP_SECRET jako legacy Facebook App) w Vercel.');

    const tokenUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) {
      res.setHeader('Set-Cookie', clearOauthCookies());
      return res.status(401).send(`Facebook nie zwrócił tokenu dostępu. ${tokenData.error?.message || ''}`);
    }

    const accounts = await fbGraph('me/accounts?fields=id,name,access_token,instagram_business_account{id,username}', tokenData.access_token);
    const page = (accounts.data || []).find(x => x.instagram_business_account?.id) || (accounts.data || [])[0];
    if (!page) return res.status(400).send('Nie znaleziono strony Facebook powiązanej z kontem Instagram Business/Creator.');

    const ig = page.instagram_business_account || {};
    const pageToken = page.access_token || tokenData.access_token;
    const maxAge = 60*24*60*60;
    res.setHeader('Set-Cookie', [
      `aii_meta_token=${encodeURIComponent(pageToken)}; ${cookieBase}; Max-Age=${maxAge}`,
      `aii_meta_ig_user_id=${encodeURIComponent(String(ig.id || ''))}; ${cookieBase}; Max-Age=${maxAge}`,
      `aii_meta_page_id=${encodeURIComponent(String(page.id || ''))}; ${cookieBase}; Max-Age=${maxAge}`,
      `aii_meta_auth_mode=facebook; ${cookieBase}; Max-Age=${maxAge}`,
      ...clearOauthCookies()
    ]);

    const target = new URL(FRONTEND);
    target.searchParams.set('meta_connected','1');
    if (ig.username) target.searchParams.set('instagram',ig.username);
    return res.redirect(302,target.toString());
  } catch (e) {
    res.setHeader('Set-Cookie', clearOauthCookies());
    return res.status(500).send(`Błąd ponownej autoryzacji Meta: ${e.message || e}`);
  }
};