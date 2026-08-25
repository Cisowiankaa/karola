module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', 'https://cisowiankaa.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok:false, error:'Method not allowed' });

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) return res.status(503).json({ ok:false, stage:'auth', error:'AI Gateway authentication is unavailable' });

  try {
    const started = Date.now();
    const response = await fetch('https://ai-gateway.vercel.sh/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-image-2',
        prompt: 'Minimal abstract violet orb on a clean dark background, no text',
        size: '1024x1024',
        n: 1,
        response_format: 'b64_json'
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        ok:false,
        stage:'generation',
        status:response.status,
        error:data?.error?.message || data?.message || 'AI generation failed'
      });
    }
    const item = data?.data?.[0] || {};
    const hasImage = Boolean(item.b64_json || item.url);
    return res.status(hasImage ? 200 : 502).json({
      ok:hasImage,
      stage:hasImage ? 'complete' : 'generation',
      model:'openai/gpt-image-2',
      auth:process.env.AI_GATEWAY_API_KEY ? 'gateway-key' : 'vercel-oidc',
      imageReturned:hasImage,
      elapsedMs:Date.now()-started
    });
  } catch (error) {
    return res.status(500).json({ ok:false, stage:'request', error:error?.message || 'Unexpected server error' });
  }
};