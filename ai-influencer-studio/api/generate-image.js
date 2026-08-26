module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');

  const origin = String(req.headers.origin || '');
  const allowedOrigin = !origin
    || origin === 'https://ai-influencer-studio-api.vercel.app'
    || origin === 'https://cisowiankaa.github.io'
    || /^https:\/\/ai-influencer-studio(?:-api)?-[a-z0-9-]+\.vercel\.app$/i.test(origin)
    || /^https:\/\/ai-influencer-studio-api-git-[a-z0-9-]+\.vercel\.app$/i.test(origin);

  if (origin && !allowedOrigin) {
    return res.status(403).json({ error: 'Origin is not allowed' });
  }
  res.setHeader('Access-Control-Allow-Origin', origin || 'https://ai-influencer-studio-api.vercel.app');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  const auth = process.env.AI_GATEWAY_API_KEY
    ? 'gateway-key'
    : process.env.VERCEL_OIDC_TOKEN
      ? 'vercel-oidc'
      : 'missing';

  if (req.method === 'GET') {
    return res.status(auth === 'missing' ? 503 : 200).json({
      ok: auth !== 'missing',
      service: 'ai-influencer-image-generator',
      provider: 'openai',
      model: 'openai/gpt-image-2',
      auth,
      formats: ['1:1', '4:5', '9:16', '3:2', '16:9']
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, format = '4:5', quality = 'medium' } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    if (!token) {
      return res.status(503).json({ error: 'Vercel AI Gateway authentication is unavailable' });
    }

    const f = String(format || '4:5').toLowerCase();
    const size = ['1:1', 'square'].includes(f)
      ? '1024x1024'
      : ['3:2', '16:9', 'landscape', 'horizontal'].includes(f)
        ? '1536x1024'
        : '1024x1536';
    const safeQuality = ['low', 'medium', 'high'].includes(String(quality).toLowerCase())
      ? String(quality).toLowerCase()
      : 'medium';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    let response;
    try {
      response = await fetch('https://ai-gateway.vercel.sh/v1/images/generations', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-image-2',
          prompt: prompt.trim().slice(0, 4000),
          size,
          quality: safeQuality,
          n: 1,
          response_format: 'b64_json'
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.message || 'AI Gateway image generation failed',
        code: data?.error?.code || 'AI_GATEWAY_IMAGE_ERROR',
        provider: 'openai',
        model: 'openai/gpt-image-2'
      });
    }

    const item = data?.data?.[0];
    const b64 = item?.b64_json;
    const url = item?.url;
    const image = b64 ? `data:image/png;base64,${b64}` : url;

    if (!image) {
      return res.status(502).json({
        error: 'Image data was not returned',
        code: 'EMPTY_IMAGE_RESPONSE'
      });
    }

    return res.status(200).json({
      image,
      provider: 'openai',
      model: 'openai/gpt-image-2',
      size,
      quality: safeQuality,
      auth
    });
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    return res.status(timedOut ? 504 : 500).json({
      error: timedOut ? 'Image generation timed out' : (error?.message || 'Unexpected server error'),
      code: timedOut ? 'IMAGE_TIMEOUT' : 'IMAGE_GENERATION_ERROR'
    });
  }
};