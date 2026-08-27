export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const action = String(body.action || 'sync');
  const accountId = String(body.accountId || '');
  if (!accountId) return res.status(400).json({ ok: false, error: 'missing_accountId' });

  if (action === 'healthcheck' || action === 'sync') {
    return res.status(200).json({
      ok: true,
      backend: 'vercel-v1',
      action,
      accountId,
      receivedAt: new Date().toISOString(),
      accepted: {
        events: Array.isArray(body.events) ? body.events.length : 0,
        accessList: Array.isArray(body.accessList) ? body.accessList.length : 0,
        rules: body.rules && typeof body.rules === 'object'
      }
    });
  }

  return res.status(400).json({ ok: false, error: 'unsupported_action', action });
}
