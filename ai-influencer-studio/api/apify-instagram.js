module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', 'https://cisowiankaa.github.io');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.APIFY_TOKEN;
  if (!token) return res.status(503).json({ error: 'APIFY_TOKEN is not configured on Vercel' });

  const raw = req.method === 'GET' ? req.query?.username : req.body?.username;
  const username = String(raw || '').trim().replace(/^@/, '').replace(/\/$/, '').split('/').filter(Boolean).pop() || '';
  if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) return res.status(400).json({ error: 'Podaj poprawny nick Instagrama' });

  try {
    const actorId = 'apify~instagram-profile-scraper';
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&clean=true&format=json&timeout=120&maxItems=1`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], includeAboutSection: false })
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    if (!response.ok) {
      const message = data?.error?.message || data?.message || text.slice(0, 240) || `Apify HTTP ${response.status}`;
      return res.status(response.status).json({ error: message });
    }

    const item = Array.isArray(data) ? data[0] : data;
    if (!item) return res.status(404).json({ error: 'Nie znaleziono publicznego profilu Instagram' });

    const profile = {
      platform: 'Instagram',
      username: item.username || username,
      fullName: item.fullName || item.full_name || '',
      biography: item.biography || item.bio || '',
      followers: item.followersCount ?? item.followers ?? item.edge_followed_by?.count ?? null,
      following: item.followsCount ?? item.following ?? item.edge_follow?.count ?? null,
      posts: item.postsCount ?? item.posts ?? item.edge_owner_to_timeline_media?.count ?? null,
      verified: Boolean(item.verified ?? item.isVerified),
      private: Boolean(item.private ?? item.isPrivate),
      profilePicUrl: item.profilePicUrlHD || item.profilePicUrl || item.profile_pic_url_hd || item.profile_pic_url || '',
      externalUrl: item.externalUrl || item.external_url || '',
      url: item.url || `https://www.instagram.com/${username}/`,
      scrapedAt: new Date().toISOString(),
      source: 'Apify Instagram Profile Scraper'
    };

    return res.status(200).json({ ok: true, profile });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Apify Instagram lookup failed' });
  }
};