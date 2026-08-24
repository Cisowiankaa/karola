module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', 'https://cisowiankaa.github.io');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const auth = process.env.AI_GATEWAY_API_KEY
      ? 'gateway-key'
      : process.env.VERCEL_OIDC_TOKEN
        ? 'vercel-oidc'
        : 'missing';
    return res.status(auth === 'missing' ? 503 : 200).json({
      ok: auth !== 'missing',
      service: 'ai-influencer-image-generator',
      model: 'openai/gpt-image-2',
      auth
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, format = '4:5' } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!token) {
      return res.status(503).json({ error: 'Vercel AI Gateway authentication is unavailable' });
    }

    const size = format === '1:1' ? '1024x1024' : '1024x1536';
    const response = await fetch('https://ai-gateway.vercel.sh/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-image-2',
        prompt: prompt.trim().slice(0, 4000),
        size,
        n: 1,
        response_format: 'b64_json'
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.message || 'AI Gateway image generation failed'
      });
    }

    const item = data?.data?.[0];
    const b64 = item?.b64_json;
    const url = item?.url;
    const image = b64 ? `data:image/png;base64,${b64}` : url;

    if (!image) return res.status(502).json({ error: 'Image data was not returned' });

    return res.status(200).json({
      image,
      model: 'openai/gpt-image-2',
      size,
      auth: process.env.AI_GATEWAY_API_KEY ? 'gateway-key' : 'vercel-oidc'
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Unexpected server error' });
  }
};