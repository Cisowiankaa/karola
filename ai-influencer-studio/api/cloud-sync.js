const crypto = require('crypto');
const MAX_BYTES = 900_000;
const TIMEOUT_MS = 12_000;

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function sameSecret(a, b) {
  const aa = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  return aa.length > 0 && aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function config() {
  const upstream = String(process.env.MAKE_CLOUD_SYNC_URL || '').trim();
  const secret = String(process.env.CLOUD_SYNC_KEY || '').trim();
  return { upstream, secret, configured: Boolean(upstream && secret) };
}

function statusPayload() {
  const { upstream, secret, configured } = config();
  return {
    ok: true,
    service: 'ai-influencer-cloud-sync',
    configured,
    provider: configured ? 'Make + Google Sheets' : 'local-only',
    fallback: 'localStorage',
    missing: [!upstream ? 'MAKE_CLOUD_SYNC_URL' : null, !secret ? 'CLOUD_SYNC_KEY' : null].filter(Boolean)
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') return json(res, 200, statusPayload());
  if (req.method !== 'POST') return json(res, 405, { ok: false, code: 'METHOD_NOT_ALLOWED' });

  const action = String(req.body?.action || '').trim().toLowerCase();
  if (action === 'status') return json(res, 200, statusPayload());
  if (!['push', 'pull'].includes(action)) {
    return json(res, 400, { ok: false, code: 'INVALID_ACTION', message: 'Dozwolone akcje: push, pull, status.' });
  }

  const { upstream, secret, configured } = config();
  if (!configured) {
    return json(res, 503, {
      ok: false,
      code: 'CLOUD_SYNC_NOT_CONFIGURED',
      message: 'Cloud Sync jest gotowy w aplikacji, ale wymaga MAKE_CLOUD_SYNC_URL i CLOUD_SYNC_KEY.',
      missing: [!upstream ? 'MAKE_CLOUD_SYNC_URL' : null, !secret ? 'CLOUD_SYNC_KEY' : null].filter(Boolean),
      fallback: 'localStorage'
    });
  }

  const provided = String(req.headers['x-cloud-sync-key'] || '');
  if (!sameSecret(provided, secret)) {
    return json(res, 401, { ok: false, code: 'CLOUD_SYNC_UNAUTHORIZED', message: 'Nieprawidłowy klucz Cloud Sync.' });
  }

  const body = {
    event: action === 'push' ? 'cloud_push' : 'cloud_pull',
    source: 'AI Influencer Studio',
    syncKey: String(req.body?.syncKey || 'primary').slice(0, 120),
    updatedAt: new Date().toISOString(),
    payload: action === 'push' ? req.body?.payload ?? null : undefined
  };

  if (action === 'push' && (!body.payload || Number(body.payload?.version) < 1 || typeof body.payload?.data !== 'object')) {
    return json(res, 400, { ok: false, code: 'INVALID_SNAPSHOT', message: 'Nieprawidłowy snapshot Cloud Sync.' });
  }

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
