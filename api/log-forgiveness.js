// Vercel Serverless Function - Forgiveness Log & Cross-Device Sync
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Date'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const timestamp = body.timestamp || new Date().toISOString();
      const choice = body.choice || 'YES - Forgiven! 💖';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
      const DEFAULT_WEBHOOK = 'https://discord.com/api/webhooks/1550963904719491123/nqeb1OHk6iOJTGLWMpMFP21YyIJ44jJhIz9vVxlWnQMe5Q60_ZRFhQe0p9yX33_w8dPf';
      const targetWebhook = body.webhookUrl || process.env.DISCORD_WEBHOOK_URL || process.env.WEBHOOK_URL || DEFAULT_WEBHOOK;

      const logPayload = {
        action: choice,
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        iso: timestamp,
        userAgent: userAgent,
        ip: ip
      };

      // 1. Log to Vercel System Logs
      console.log('==============================================');
      console.log('🎉 FORGIVENESS LOG EVENT RECEIVED! 🎉');
      console.log('Action:', logPayload.action);
      console.log('Timestamp:', logPayload.timestamp);
      console.log('IP / Device:', ip);
      console.log('Browser:', userAgent);
      console.log('==============================================');

      // 2. Send Notification to Discord Webhook
      if (targetWebhook && targetWebhook.startsWith('http')) {
        try {
          const isYes = choice.includes('YES');
          const messageContent = isYes
            ? `🎉 **Almika pressed YES to forgive Angel!** 💖\n🕒 **Time:** ${logPayload.timestamp}\n📱 **Device:** ${userAgent.slice(0, 90)}`
            : `💔 **Almika pressed NO / Not yet.** 🥺\n🕒 **Time:** ${logPayload.timestamp}\n📱 **Device:** ${userAgent.slice(0, 90)}`;

          await fetch(targetWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: messageContent })
          });
        } catch (webhookErr) {
          console.error('Webhook notification error:', webhookErr);
        }
      }

      // 3. Save to Upstash / Vercel KV if environment variables exist
      const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
      const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

      if (kvUrl && kvToken) {
        try {
          // Fetch current logs list from KV
          const getRes = await fetch(`${kvUrl}/get/almika_forgiveness_logs`, {
            headers: { Authorization: `Bearer ${kvToken}` }
          });
          const getData = await getRes.json();
          let logsList = [];
          if (getData.result) {
            logsList = JSON.parse(getData.result);
          }

          logsList.unshift(logPayload);

          // Save back to KV
          await fetch(`${kvUrl}/set/almika_forgiveness_logs`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${kvToken}` },
            body: JSON.stringify(logsList)
          });
        } catch (kvErr) {
          console.error('Vercel KV Error:', kvErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Forgiveness response logged successfully!',
        log: logPayload
      });
    } catch (err) {
      console.error('Error logging forgiveness:', err);
      return res.status(500).json({ error: 'Failed to process log' });
    }
  }

  return res.status(200).json({ status: 'Log API active' });
}
