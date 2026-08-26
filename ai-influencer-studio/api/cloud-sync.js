const MAX_BYTES = 900_000;
const TIMEOUT_MS = 12_000;

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, code: 'METHOD_NOT_ALLOWED' });

  const upstream = String(process.env.MAKE_CLOUD_SYNC_URL || '').trim();
  const action = String(req.body?.action || '').trim().toLowerCase();

  if (action === 'status') {
    return json(res, 200, {
      ok: true,
      service: 'ai-influencer-cloud-sync',
      configured: Boolean(upstream),
      provider: upstream ? 'Make + Google Sheets' : 'local-only',
      fallback: 'localStorage'
    });
  }

  if (!['push', 'pull'].includes(action)) {
    return json(res, 400, { ok: false, code: 'INVALID_ACTION', message: 'Dozwolone akcje: push, pull, status.' });
  }

  if (!upstream) {
    return json(res, 503, {
      ok: false,
      code: 'CLOUD_SYNC_NOT_CONFIGURED',
      message: 'Cloud Sync jest gotowy w aplikacji, ale MAKE_CLOUD_SYNC_URL nie jest jeszcze ustawiony.',
      fallback: 'localStorage'
    });
  }

  const body = {
    event: action === 'push' ? 'cloud_push' : 'cloud_pull',
    source: 'AI Influencer Studio',
    syncKey: String(req.body?.syncKey || 'default').slice(0, 120),
    updatedAt: new Date().toISOString(),
    payload: action === 'push' ? req.body?.payload ?? null : undefined
  };

  const serialized = JSON.stringify(body);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_BYTES) {
    return json(res, 413, { ok: false, code: 'PAYLOAD_TOO_LARGE', message: 'Snapshot Cloud Sync jest zbyt duży.' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: serialized,
      signal: controller.signal
    });

    const text = await upstreamResponse.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

    if (!upstreamResponse.ok) {
      return json(res, 502, {
        ok: false,
        code: 'CLOUD_SYNC_UPSTREAM_ERROR',
        upstreamStatus: upstreamResponse.status,
        message: 'Make Cloud Sync nie zwrócił poprawnej odpowiedzi.'
      });
    }

    if (action === 'pull') {
      const payload = data?.payload ?? data?.data?.payload ?? data?.result?.payload ?? data ?? null;
      return json(res, 200, { ok: true, action, payload });
    }

    return json(res, 200, { ok: true, action, saved: true });
  } catch (error) {
    const timeout = error?.name === 'AbortError';
    return json(res, 502, {
      ok: false,
      code: timeout ? 'CLOUD_SYNC_TIMEOUT' : 'CLOUD_SYNC_UNAVAILABLE',
      message: timeout ? 'Cloud Sync przekroczył limit czasu.' : 'Cloud Sync jest chwilowo niedostępny.',
      fallback: 'localStorage'
    });
  } finally {
    clearTimeout(timer);
  }
};
