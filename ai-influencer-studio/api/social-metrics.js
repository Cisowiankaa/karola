// Fast Meta metrics endpoint for dashboard KPIs.
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v26.0';
const IG_GRAPH = `https://graph.instagram.com/${GRAPH_VERSION}`;

function cors(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
}

function normalizeToken(value) {
  let token = String(value || '').trim();
  token = token.replace(/^Bearer\s+/i, '').trim();
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1).trim();
  }
  return token;
}

async function graph(path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`${IG_GRAPH}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Meta Graph HTTP ${r.status}`);
  return data;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const token = normalizeToken(process.env.META_ACCESS_TOKEN);
  const igUserId = String(process.env.META_IG_USER_ID || '').trim();
  if (!token || !igUserId) {
    return res.status(503).json({ ok: false, configured: false, error: 'META_ACCESS_TOKEN or META_IG_USER_ID missing' });
  }

  try {
    const ig = await graph(`${igUserId}?fields=id,user_id,username,name,profile_picture_url,followers_count,media_count`, token);
    return res.status(200).json({
      ok: true,
      service: 'meta-social-metrics',
      syncedAt: new Date().toISOString(),
      profile: {
        platform: 'Instagram',
        handle: ig.username ? `@${ig.username}` : '',
        followers: ig.followers_count || 0,
        mediaCount: ig.media_count || 0,
        avatar: ig.profile_picture_url || ''
      }
    });
  } catch (error) {
    return res.status(502).json({ ok: false, error: error?.message || 'Meta metrics failed' });
  }
};
