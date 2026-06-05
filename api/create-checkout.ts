export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'ASAAS_API_KEY not configured' });
  }

  const { planId, planName, amount, email } = req.body || {};

  if (!planId || !amount || !email) {
    return res.status(400).json({ success: false, error: 'Missing required fields', body: req.body });
  }

  return res.status(200).json({ success: true, debug: { planId, planName, amount, email, keyPrefix: apiKey.substring(0, 12) } });
}
