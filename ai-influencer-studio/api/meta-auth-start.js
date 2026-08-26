const APP_ID = process.env.META_APP_ID || '2272021750228175';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/meta-auth-callback`;
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'instagram_business_basic',
    force_authentication: '1',
    enable_fb_login: '0'
  });
  res.setHeader('Cache-Control', 'no-store');
  return res.redirect(302, `https://www.instagram.com/oauth/authorize?${params.toString()}`);
};