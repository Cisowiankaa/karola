const crypto = require('crypto');
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v26.0';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const requested = String(req.query.mode || '').toLowerCase();
  const instagramId = String(process.env.META_INSTAGRAM_APP_ID || '').trim();
  const instagramSecret = String(process.env.META_INSTAGRAM_APP_SECRET || '').trim();
  const facebookId = String(process.env.META_FACEBOOK_APP_ID || '').trim();
  const facebookSecret = String(process.env.META_FACEBOOK_APP_SECRET || '').trim();

  const instagramReady = Boolean(instagramId && instagramSecret);
  const facebookReady = Boolean(facebookId && facebookSecret);
  const mode = requested === 'facebook' ? 'facebook' : requested === 'instagram' ? 'instagram' : instagramReady ? 'instagram' : facebookReady ? 'facebook' : '';

  if (!mode || (mode === 'instagram' && !instagramReady) || (mode === 'facebook' && !facebookReady)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      ok: false,
      code: 'META_OAUTH_NOT_CONFIGURED',
      message: mode === 'facebook'
        ? 'Facebook Login nie jest skonfigurowany. Ustaw META_FACEBOOK_APP_ID i META_FACEBOOK_APP_SECRET.'
        : 'Instagram Login nie jest skonfigurowany. Ustaw META_INSTAGRAM_APP_ID i META_INSTAGRAM_APP_SECRET.',
      mode: mode || null,
      instagramReady,
      facebookReady,
      callback: 'https://ai-influencer-studio-api.vercel.app/api/meta-auth-callback'
    });
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/meta-auth-callback`;
  const state = crypto.randomBytes(24).toString('hex');

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', [
    `aii_meta_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    `aii_meta_oauth_mode=${mode}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  ]);

  if (mode === 'instagram') {
    const params = new URLSearchParams({
      client_id: instagramId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'instagram_business_basic',
      state,
      force_authentication: '1',
      enable_fb_login: '0'
    });
    return res.redirect(302, `https://www.instagram.com/oauth/authorize?${params.toString()}`);
  }

  const params = new URLSearchParams({
    client_id: facebookId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'pages_show_list,pages_read_engagement,instagram_basic',
    state
  });
  return res.redirect(302, `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`);
};