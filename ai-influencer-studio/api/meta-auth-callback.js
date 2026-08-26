const APP_ID = process.env.META_APP_ID || '2272021750228175';
const APP_SECRET = process.env.META_APP_SECRET || '';
const FRONTEND = process.env.META_FRONTEND_URL || 'https://ai-influencer-studio-api.vercel.app/';

function cookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((acc, part) => {
    const i = part.indexOf('=');
    if (i < 0) return acc;
    acc[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    return acc;
  }, {});
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
    const body = new URLSearchParams({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code
    });

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const short = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !short.access_token) {
      return res.status(401).send(`Meta nie zwróciła tokenu dostępu. ${short.error_message || short.error?.message || ''}`);
    }

    let accessToken = short.access_token;
    let expiresIn = 60 * 60;
    try {
      const longUrl = new URL('https://graph.instagram.com/access_token');
      longUrl.searchParams.set('grant_type', 'ig_exchange_token');
      longUrl.searchParams.set('client_secret', APP_SECRET);
      longUrl.searchParams.set('access_token', short.access_token);
      const longRes = await fetch(longUrl);
      const long = await longRes.json().catch(() => ({}));
      if (longRes.ok && long.access_token) {
        accessToken = long.access_token;
        expiresIn = Number(long.expires_in) || 60 * 24 * 60 * 60;
      }
    } catch {}

    const maxAge = Math.max(300, Math.min(expiresIn, 60 * 24 * 60 * 60));
    const cookieBase = 'Path=/; HttpOnly; Secure; SameSite=Lax';
    res.setHeader('Set-Cookie', [
      `aii_meta_token=${encodeURIComponent(accessToken)}; ${cookieBase}; Max-Age=${maxAge}`,
      `aii_meta_ig_user_id=${encodeURIComponent(String(short.user_id || ''))}; ${cookieBase}; Max-Age=${maxAge}`,
      'aii_meta_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    ]);
    res.setHeader('Cache-Control', 'no-store');

    const target = new URL(FRONTEND);
    target.searchParams.set('meta_connected', '1');
    return res.redirect(302, target.toString());
  } catch (e) {
    return res.status(500).send(`Błąd ponownej autoryzacji Meta: ${e.message || e}`);
  }
};