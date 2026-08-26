const APP_ID = process.env.META_APP_ID || '2272021750228175';
const APP_SECRET = process.env.META_APP_SECRET || '';
const FRONTEND = process.env.META_FRONTEND_URL || 'https://cisowiankaa.github.io/karola/ai-influencer-studio/';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  const code = String(req.query.code || '');
  if (!code) return res.status(400).send('Brak kodu autoryzacji Meta.');
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
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body
    });
    const short = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !short.access_token) {
      return res.status(401).send(`Meta nie zwróciła tokenu dostępu. ${short.error_message || short.error?.message || ''}`);
    }

    let accessToken = short.access_token;
    try {
      const longUrl = new URL('https://graph.instagram.com/access_token');
      longUrl.searchParams.set('grant_type', 'ig_exchange_token');
      longUrl.searchParams.set('client_secret', APP_SECRET);
      longUrl.searchParams.set('access_token', short.access_token);
      const longRes = await fetch(longUrl);
      const long = await longRes.json().catch(() => ({}));
      if (longRes.ok && long.access_token) accessToken = long.access_token;
    } catch {}

    const fragment = new URLSearchParams({
      meta_token: accessToken,
      meta_user_id: String(short.user_id || ''),
      meta_connected: '1'
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, `${FRONTEND}#${fragment.toString()}`);
  } catch (e) {
    return res.status(500).send(`Błąd ponownej autoryzacji Meta: ${e.message || e}`);
  }
};