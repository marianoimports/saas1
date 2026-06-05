import type { VercelRequest, VercelResponse } from '@vercel/node';

const ASAAS_API_URL = 'https://api.asaas.com/v3';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId } = req.query;
  if (!paymentId || typeof paymentId !== 'string') {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ASAAS_API_KEY not configured' });
  }

  try {
    const paymentRes = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      signal: AbortSignal.timeout(8000),
    });
    const paymentData: any = await paymentRes.json();

    if (!paymentData.id) {
      return res.status(200).json({ status: 'unknown' });
    }

    const isConfirmed = paymentData.status === 'RECEIVED' || paymentData.status === 'CONFIRMED';

    return res.status(200).json({
      status: isConfirmed ? 'confirmed' : paymentData.status?.toLowerCase() || 'pending',
      plan: paymentData.description || '',
      value: paymentData.value || 0,
    });
  } catch (error: any) {
    return res.status(200).json({ status: 'unknown', error: error.message });
  }
}
