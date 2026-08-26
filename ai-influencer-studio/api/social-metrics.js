// Fast resilient social metrics endpoint for dashboard KPIs.
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v26.0';
const IG_GRAPH = `https://graph.instagram.com/${GRAPH_VERSION}`;

function cors(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Meta-Ig-User-Id');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
}

function normalizeToken(value) {
  let token = String(value || '').trim();
  token = token.replace(/^Bearer\s+/i, '').trim();
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) token = token.slice(1, -1).trim();
  return token;
}

async function graph(path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`${IG_GRAPH}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(data?.error?.message || `Meta Graph HTTP ${r.status}`);
    e.metaType = data?.error?.type || null;
    e.metaCode = data?.error?.code || null;
    throw e;
  }
  return data;
}

function isAuthProblem(error) {
  return error?.metaType === 'OAuthException' || /access blocked|access token|oauth|session|permission/i.test(String(error?.message || ''));
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const headerAuth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const token = normalizeToken(headerAuth || process.env.META_ACCESS_TOKEN);
  const igUserId = String(req.headers['x-meta-ig-user-id'] || process.env.META_IG_USER_ID || '').trim();

  if (!token || !igUserId) {
    return res.status(200).json({
      ok: true,
      degraded: true,
      connected: false,
      configured: false,
      service: 'resilient-social-metrics',
      code: 'META_NOT_CONFIGURED',
      syncedAt: new Date().toISOString(),
      profile: null,
      metrics: {},
      message: 'Metryki Meta są chwilowo niedostępne. Dashboard działa na ostatnich danych lokalnych.'
    });
  }

  try {
    const ig = await graph(`${igUserId}?fields=id,user_id,username,name,profile_picture_url,followers_count,media_count`, token);
    return res.status(200).json({
      ok: true,
      degraded: false,
      connected: true,
      service: 'meta-social-metrics',
      syncedAt: new Date().toISOString(),
      profile: {
        platform: 'Instagram',
        handle: ig.username ? `@${ig.username}` : '',
        followers: ig.followers_count || 0,
        mediaCount: ig.media_count || 0,
        avatar: ig.profile_picture_url || ''
      },
      metrics: { instagram: { followers: ig.followers_count || 0, mediaCount: ig.media_count || 0 } }
    });
  } catch (error) {
    const auth = isAuthProblem(error);
    return res.status(200).json({
      ok: true,
      degraded: true,
      connected: false,
      service: 'resilient-social-metrics',
      code: auth ? 'META_REAUTH_REQUIRED' : 'META_METRICS_UNAVAILABLE',
      syncedAt: new Date().toISOString(),
      profile: null,
      metrics: {},
      message: auth ? 'Meta wymaga ponownej autoryzacji. Dashboard pozostaje dostępny na danych lokalnych.' : 'Metryki są chwilowo niedostępne. Dashboard pozostaje dostępny na danych lokalnych.'
    });
  }
};
