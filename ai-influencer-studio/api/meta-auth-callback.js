const APP_ID = process.env.META_APP_ID || '2272021750228175';
const APP_SECRET = process.env.META_APP_SECRET || '';
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v26.0';
const FRONTEND = process.env.META_FRONTEND_URL || 'https://cisowiankaa.github.io/karola/ai-influencer-studio/';

function cookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((acc, part) => {
    const i = part.indexOf('=');
    if (i < 0) return acc;
    acc[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    return acc;
  }, {});
}

async function graph(path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Meta Graph HTTP ${r.status}`);
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const code = String(req.query.code || '');
  const state = String(req.query.state || '');
  const storedState = cookies(req).aii_meta_oauth_state || '';

  if (!code) return res.status(400).send('Brak kodu autoryzacji Meta.');
  if (!state || !storedState || state !== storedState) return res.status(400).send('Nieprawidłowy stan sesji OAuth Meta. Uruchom połączenie ponownie z aplikacji.');
  if (!APP_SECRET) return res.status(503).send('Brak META_APP_SECRET w konfiguracji serwera Vercel.');

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/meta-auth-callback`;

  try {
    const tokenUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', APP_ID);
    tokenUrl.searchParams.set('client_secret', APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) {
      return res.status(401).send(`Meta nie zwróciła tokenu dostępu. ${tokenData.error?.message || ''}`);
    }

    const accounts = await graph('me/accounts?fields=id,name,access_token,instagram_business_account{id,username}', tokenData.access_token);
    const page = (accounts.data || []).find(x => x.instagram_business_account?.id) || (accounts.data || [])[0];
    if (!page) return res.status(400).send('Nie znaleziono strony Facebook powiązanej z kontem Instagram Business/Creator.');

    const ig = page.instagram_business_account || {};
    const pageToken = page.access_token || tokenData.access_token;
    const maxAge = 60 * 24 * 60 * 60;
    const cookieBase = 'Path=/; HttpOnly; Secure; SameSite=Lax';
    res.setHeader('Set-Cookie', [
      `aii_meta_token=${encodeURIComponent(pageToken)}; ${cookieBase}; Max-Age=${maxAge}`,
      `aii_meta_ig_user_id=${encodeURIComponent(String(ig.id || ''))}; ${cookieBase}; Max-Age=${maxAge}`,
      `aii_meta_page_id=${encodeURIComponent(String(page.id || ''))}; ${cookieBase}; Max-Age=${maxAge}`,
      `aii_meta_auth_mode=facebook; ${cookieBase}; Max-Age=${maxAge}`,
      'aii_meta_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    ]);
    res.setHeader('Cache-Control', 'no-store');

    const target = new URL(FRONTEND);
    target.searchParams.set('meta_connected', '1');
    if (ig.username) target.searchParams.set('instagram', ig.username);
    return res.redirect(302, target.toString());
  } catch (e) {
    return res.status(500).send(`Błąd ponownej autoryzacji Meta: ${e.message || e}`);
  }
};