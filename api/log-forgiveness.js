// Vercel Serverless Function to record forgiveness response
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const timestamp = body.timestamp || new Date().toISOString();
      const choice = body.choice || 'YES';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';

      // Log directly to Vercel System Logs (Visible in Vercel Dashboard -> Project -> Logs)
      console.log('==============================================');
      console.log('🎉 FORGIVENESS LOG EVENT RECEIVED! 🎉');
      console.log('Date & Time (UTC):', timestamp);
      console.log('User Action:', choice);
      console.log('Message:', 'Almika pressed YES to forgive Angel! ❤️');
      console.log('Browser/UserAgent:', userAgent);
      console.log('==============================================');

      return res.status(200).json({
        success: true,
        message: 'Forgiveness response logged in Vercel Dashboard Logs!',
        choice: choice,
        timestamp: timestamp
      });
    } catch (err) {
      console.error('Error logging forgiveness:', err);
      return res.status(500).json({ error: 'Failed to process log' });
    }
  }

  // GET request fallback info
  return res.status(200).json({
    status: 'Forgiveness Logging API is ready',
    instructions: 'Send a POST request to record a response.'
  });
}
