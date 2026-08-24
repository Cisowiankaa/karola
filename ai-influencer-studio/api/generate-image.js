module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server' });
  }

  try {
    const { prompt, format = '4:5' } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const size = format === '1:1' ? '1024x1024' : '1024x1536';
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-2',
        prompt: prompt.trim().slice(0, 4000),
        size,
        output_format: 'png'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'OpenAI image generation failed'
      });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(502).json({ error: 'Image data was not returned' });
    }

    return res.status(200).json({
      image: `data:image/png;base64,${b64}`,
      model: 'gpt-image-2',
      size
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Unexpected server error' });
  }
};