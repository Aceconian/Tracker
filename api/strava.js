export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://aceconian.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
  const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
  const { action, code, refresh_token } = req.query;

  try {
    if (action === 'exchange') {
      // Exchange auth code for tokens
      const r = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, grant_type: 'authorization_code' })
      });
      const data = await r.json();
      if (data.errors) { res.status(400).json({ error: 'Token exchange failed', detail: data }); return; }
      res.status(200).json({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        athlete: { name: data.athlete?.firstname, id: data.athlete?.id }
      });
    } else if (action === 'refresh') {
      // Refresh expired token
      const r = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token, grant_type: 'refresh_token' })
      });
      const data = await r.json();
      res.status(200).json({ access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at });
    } else if (action === 'activities') {
      // Fetch recent activities using valid access token
      const { access_token } = req.query;
      const r = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=20', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      const data = await r.json();
      res.status(200).json(data);
    } else {
      res.status(400).json({ error: 'Unknown action' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
