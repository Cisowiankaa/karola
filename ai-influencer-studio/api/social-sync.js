// Resilient social sync: Meta Instagram + Meta Facebook -> Apify Instagram -> local-cache mode
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v26.0';
const FB_GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const IG_GRAPH = `https://graph.instagram.com/${GRAPH_VERSION}`;

function allowedOrigin(origin) {
  if (!origin) return 'https://ai-influencer-studio-api.vercel.app';
  if (origin === 'https://ai-influencer-studio-api.vercel.app') return origin;
  if (origin === 'https://cisowiankaa.github.io') return origin;
  if (/^https:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin)) return origin;
  return 'https://ai-influencer-studio-api.vercel.app';
}

function cors(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin(req.headers.origin));
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Meta-Ig-User-Id, X-Instagram-Username');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
}

function parseCookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((acc, part) => {
    const i = part.indexOf('=');
    if (i < 0) return acc;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    try { acc[key] = decodeURIComponent(value); } catch { acc[key] = value; }
    return acc;
  }, {});
}

function normalizeToken(value) {
  let token = String(value || '').trim();
  token = token.replace(/^Bearer\s+/i, '').trim();
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) token = token.slice(1, -1).trim();
  return token;
}

function normalizeUsername(value) {
  return String(value || '').trim().replace(/^@/, '').replace(/\/$/, '').split('/').filter(Boolean).pop() || '';
}

async function graph(base, path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`${base}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data?.error?.message || `Meta Graph HTTP ${r.status}`);
    err.metaCode = data?.error?.code;
    err.metaType = data?.error?.type;
    err.httpStatus = r.status;
    throw err;
  }
  return data;
}

function authProblem(error) {
  const message = String(error?.message || '');
  return error?.metaType === 'OAuthException' || /access blocked|access token|oauth|session|permission/i.test(message);
}

function mediaType(type) {
  if (type === 'VIDEO') return 'Reels';
  if (type === 'CAROUSEL_ALBUM') return 'Carousel';
  return 'Post';
}

function sourceError(provider, error) {
  return {
    provider,
    ok: false,
    code: authProblem(error) ? 'REAUTH_REQUIRED' : 'SYNC_FAILED',
    message: error?.message || 'Synchronization failed',
    metaType: error?.metaType || null,
    metaCode: error?.metaCode || null
  };
}

async function apifyInstagram(username) {
  const token = normalizeToken(process.env.APIFY_TOKEN);
  if (!token) return { ok: false, provider: 'Apify', code: 'NOT_CONFIGURED', message: 'APIFY_TOKEN is not configured' };
  if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) return { ok: false, provider: 'Apify', code: 'USERNAME_MISSING', message: 'Instagram username is not configured' };

  try {
    const actorId = 'apify~instagram-profile-scraper';
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&clean=true&format=json&timeout=90&maxItems=1`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], includeAboutSection: false })
    });
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    if (!r.ok) throw new Error(data?.error?.message || data?.message || text.slice(0, 180) || `Apify HTTP ${r.status}`);
    const item = Array.isArray(data) ? data[0] : data;
    if (!item) throw new Error('Instagram profile not found in Apify');

    const profile = {
      platform: 'Instagram',
      handle: `@${item.username || username}`,
      active: true,
      connected: true,
      connectionMode: 'fallback',
      source: 'Apify',
      followers: item.followersCount ?? item.followers ?? item.edge_followed_by?.count ?? 0,
      mediaCount: item.postsCount ?? item.posts ?? item.edge_owner_to_timeline_media?.count ?? 0,
      avatar: item.profilePicUrlHD || item.profilePicUrl || item.profile_pic_url_hd || item.profile_pic_url || ''
    };
    return { ok: true, provider: 'Apify', profile, metrics: { followers: profile.followers, mediaCount: profile.mediaCount } };
  } catch (error) {
    return { ok: false, provider: 'Apify', code: 'SYNC_FAILED', message: error?.message || 'Apify lookup failed' };
  }
}

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cookie = parseCookies(req);
  const headerToken = normalizeToken(req.headers.authorization || '');
  const sessionToken = normalizeToken(cookie.aii_meta_token || '');
  const legacyToken = normalizeToken(process.env.META_ACCESS_TOKEN);
  const igToken = headerToken || sessionToken || normalizeToken(process.env.META_IG_ACCESS_TOKEN) || legacyToken;
  const fbToken = normalizeToken(process.env.META_FB_ACCESS_TOKEN) || (!headerToken && !sessionToken ? legacyToken : '');
  const igUserId = String(req.headers['x-meta-ig-user-id'] || cookie.aii_meta_ig_user_id || process.env.META_IG_USER_ID || '').trim();
  const pageId = String(process.env.META_PAGE_ID || '').trim();
  const instagramUsername = normalizeUsername(
    req.query?.instagram || req.headers['x-instagram-username'] || process.env.META_IG_USERNAME || process.env.INSTAGRAM_USERNAME || process.env.META_IG_HANDLE
  );

  const profiles = [];
  const items = [];
  const metrics = {};
  const sources = { instagram: [], facebook: [] };

  if (igUserId && igToken) {
    try {
      const ig = await graph(IG_GRAPH, `${igUserId}?fields=id,user_id,username,name,profile_picture_url,followers_count,media_count`, igToken);
      const resolvedUsername = ig.username || instagramUsername;
      profiles.push({ platform: 'Instagram', handle: resolvedUsername ? `@${resolvedUsername}` : '', active: true, connected: true, connectionMode: 'live', source: 'Meta', externalId: ig.id || ig.user_id, followers: ig.followers_count || 0, mediaCount: ig.media_count || 0, avatar: ig.profile_picture_url || '' });
      metrics.instagram = { followers: ig.followers_count || 0, mediaCount: ig.media_count || 0, source: 'Meta' };
      sources.instagram.push({ provider: 'Meta', ok: true, auth: sessionToken ? 'oauth-session' : headerToken ? 'browser-token' : 'server-token' });

      const media = await graph(IG_GRAPH, `${igUserId}/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count&limit=25`, igToken);
      for (const m of media.data || []) {
        const dt = m.timestamp ? new Date(m.timestamp) : new Date();
        items.push({ id: `ig-${m.id}`, externalId: `ig-${m.id}`, title: (m.caption || 'Publikacja Instagram').split(/\n/)[0].slice(0, 90), platform: resolvedUsername ? `Instagram @${resolvedUsername}` : 'Instagram', type: m.media_product_type === 'REELS' ? 'Reels' : mediaType(m.media_type), date: dt.toISOString().slice(0, 10), time: dt.toTimeString().slice(0, 5), status: 'Opublikowany', notes: m.caption || '', permalink: m.permalink || '', likes: m.like_count || 0, comments: m.comments_count || 0, synced: true, source: 'Meta' });
      }
    } catch (error) {
      sources.instagram.push(sourceError('Meta', error));
    }
  } else {
    sources.instagram.push({ provider: 'Meta', ok: false, code: 'NOT_CONFIGURED', message: !igUserId ? 'META_IG_USER_ID missing' : 'Instagram access token missing' });
  }

  if (!sources.instagram.some(x => x.ok)) {
    const fallback = await apifyInstagram(instagramUsername);
    sources.instagram.push({ provider: fallback.provider, ok: fallback.ok, code: fallback.code || null, message: fallback.message || null });
    if (fallback.ok) {
      profiles.push(fallback.profile);
      metrics.instagram = { ...fallback.metrics, source: 'Apify' };
    }
  }

  if (pageId && fbToken) {
    try {
      const page = await graph(FB_GRAPH, `${pageId}?fields=id,name,username,picture{url},followers_count,fan_count`, fbToken);
      profiles.push({ platform: 'Facebook', handle: page.username ? `@${page.username}` : (page.name || ''), active: true, connected: true, connectionMode: 'live', source: 'Meta', externalId: page.id, followers: page.followers_count || page.fan_count || 0, avatar: page.picture?.data?.url || '' });
      metrics.facebook = { followers: page.followers_count || page.fan_count || 0, source: 'Meta' };
      sources.facebook.push({ provider: 'Meta', ok: true });

      const posts = await graph(FB_GRAPH, `${pageId}/posts?fields=id,message,created_time,permalink_url,shares,likes.summary(true),comments.summary(true)&limit=25`, fbToken);
      for (const p of posts.data || []) {
        const dt = p.created_time ? new Date(p.created_time) : new Date();
        items.push({ id: `fb-${p.id}`, externalId: `fb-${p.id}`, title: (p.message || 'Publikacja Facebook').split(/\n/)[0].slice(0, 90), platform: page.username ? `Facebook @${page.username}` : `Facebook ${page.name || ''}`.trim(), type: 'Post', date: dt.toISOString().slice(0, 10), time: dt.toTimeString().slice(0, 5), status: 'Opublikowany', notes: p.message || '', permalink: p.permalink_url || '', likes: p.likes?.summary?.total_count || 0, comments: p.comments?.summary?.total_count || 0, shares: p.shares?.count || 0, synced: true, source: 'Meta' });
      }
    } catch (error) {
      sources.facebook.push(sourceError('Meta', error));
    }
  } else {
    sources.facebook.push({ provider: 'Meta', ok: false, code: 'NOT_CONFIGURED', message: !pageId ? 'META_PAGE_ID missing' : 'Facebook access token missing' });
  }

  items.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const instagramLive = sources.instagram.some(x => x.ok);
  const facebookLive = sources.facebook.some(x => x.ok);
  const anyLive = instagramLive || facebookLive;
  const metaReauth = [...sources.instagram, ...sources.facebook].some(x => x.provider === 'Meta' && x.code === 'REAUTH_REQUIRED');

  if (!anyLive) {
    return res.status(200).json({
      ok: true,
      degraded: true,
      connected: false,
      service: 'resilient-social-sync',
      provider: 'local-cache',
      code: metaReauth ? 'META_REAUTH_REQUIRED' : 'SOCIAL_DEGRADED',
      message: metaReauth
        ? 'Meta wymaga ponownej autoryzacji. Apify jest niedostępne lub nieskonfigurowane — aplikacja zachowuje ostatnie dane lokalne.'
        : 'Źródła LIVE są obecnie niedostępne — aplikacja zachowuje ostatnie dane lokalne.',
      syncedAt: new Date().toISOString(),
      profiles: [],
      items: [],
      metrics: {},
      sources,
      fallback: 'local-cache',
      authSession: Boolean(sessionToken)
    });
  }

  return res.status(200).json({
    ok: true,
    degraded: !(instagramLive && facebookLive),
    connected: true,
    service: 'resilient-social-sync',
    provider: instagramLive && facebookLive ? 'Meta Graph API' : (metrics.instagram?.source === 'Apify' ? 'Meta + Apify' : 'Meta Graph API'),
    graphVersion: GRAPH_VERSION,
    syncedAt: new Date().toISOString(),
    profiles,
    items,
    metrics,
    sources,
    sessionToken: Boolean(headerToken),
    authSession: Boolean(sessionToken),
    fallback: metrics.instagram?.source === 'Apify' ? 'apify' : null
  });
};