// Vercel Serverless Function - Forgiveness Log & Mobile-Resilient Discord Sync
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
      // Safe Body Parser (Handles Mobile Safari & Android Chrome string/buffer/object payloads)
      let body = {};
      if (typeof req.body === 'object' && req.body !== null) {
        body = req.body;
      } else if (typeof req.body === 'string' && req.body.trim().length > 0) {
        try {
          body = JSON.parse(req.body);
        } catch (e) {
          body = {};
        }
      }

      const timestamp = body.timestamp || new Date().toISOString();
      const choice = body.choice || 'YES - Forgiven! 💖';
      const userAgent = req.headers['user-agent'] || 'Mobile Browser';
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
      
      const DEFAULT_WEBHOOK = 'https://discord.com/api/webhooks/1550963904719491123/nqeb1OHk6iOJTGLWMpMFP21YyIJ44jJhIz9vVxlWnQMe5Q60_ZRFhQe0p9yX33_w8dPf';
      const targetWebhook = (body.webhookUrl && typeof body.webhookUrl === 'string' && body.webhookUrl.trim().startsWith('http'))
        ? body.webhookUrl.trim()
        : DEFAULT_WEBHOOK;

      const formattedTime = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      const logPayload = {
        action: choice,
        timestamp: formattedTime,
        iso: timestamp,
        userAgent: userAgent,
        ip: ip
      };

      // 1. Console Log to Vercel System Logs
      console.log('==============================================');
      console.log('🎉 FORGIVENESS EVENT LOGGED 🎉');
      console.log('Action:', logPayload.action);
      console.log('Time:', logPayload.timestamp);
      console.log('User Agent:', userAgent);
      console.log('==============================================');

      // 2. Dispatch to Discord Webhook with Mobile-Compatible Headers & Await
      if (targetWebhook && targetWebhook.startsWith('http')) {
        try {
          const isYes = choice.includes('YES');
          const messageContent = isYes
            ? `🎉 **Almika pressed YES to forgive Angel!** 💖\n🕒 **Time:** ${logPayload.timestamp}\n📱 **Device:** ${userAgent.slice(0, 90)}`
            : `💔 **Almika pressed NO / Not yet.** 🥺\n🕒 **Time:** ${logPayload.timestamp}\n📱 **Device:** ${userAgent.slice(0, 90)}`;

          const webhookRes = await fetch(targetWebhook, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AlmikaLoveBot/1.0'
            },
            body: JSON.stringify({ content: messageContent })
          });

          console.log('Discord Webhook Dispatch Status:', webhookRes.status);
        } catch (webhookErr) {
          console.error('Webhook notification error:', webhookErr);
        }
      }

      // 3. Save to Vercel KV / Upstash if configured
      const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
      const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

      if (kvUrl && kvToken) {
        try {
          const getRes = await fetch(`${kvUrl}/get/almika_forgiveness_logs`, {
            headers: { Authorization: `Bearer ${kvToken}` }
          });
          const getData = await getRes.json();
          let logsList = [];
          if (getData.result) {
            logsList = typeof getData.result === 'string' ? JSON.parse(getData.result) : getData.result;
          }
          logsList.unshift(logPayload);

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

  return res.status(200).json({ status: 'API active' });
}
