import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://ejdsuslapvzsseqotvhp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SVC_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId } = req.query;
  if (!paymentId || typeof paymentId !== 'string') {
    return res.status(400).json({ error: 'Missing paymentId' });
  }
  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
  }

  try {
    const sbHeaders: Record<string, string> = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    };

    const result = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?charge_id=eq.${paymentId}&select=status,plan_name&limit=1`,
      { headers: sbHeaders, signal: AbortSignal.timeout(8000) },
    );
    const data: any[] = await result.json();

    if (!data || data.length === 0) {
      return res.status(200).json({ status: 'unknown' });
    }

    const payment = data[0];
    return res.status(200).json({
      status: payment.status || 'pending',
      plan: payment.plan_name || '',
    });
  } catch (error: any) {
    return res.status(200).json({ status: 'unknown', error: error.message });
  }
}
