// Vercel Serverless Function - Fetch Cross-Device Logs
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Date'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (kvUrl && kvToken) {
      const getRes = await fetch(`${kvUrl}/get/almika_forgiveness_logs`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      const getData = await getRes.json();
      if (getData.result) {
        const logsList = typeof getData.result === 'string' ? JSON.parse(getData.result) : getData.result;
        return res.status(200).json({ success: true, source: 'cloud_kv', logs: logsList });
      }
    }

    return res.status(200).json({
      success: true,
      source: 'none',
      message: 'No cloud database configured yet. Logs can be sent to Discord Webhook or Vercel KV.',
      logs: []
    });
  } catch (err) {
    console.error('Error fetching logs:', err);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
}
