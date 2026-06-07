import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://ejdsuslapvzsseqotvhp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SVC_KEY || '';

function sbHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Webhook is active' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const providedToken = req.headers['asaas-access_token'] || req.headers['asaas-access-token'] || req.query['token'];

  if (webhookToken && providedToken !== webhookToken) {
    return res.status(401).json({ error: 'Invalid webhook token' });
  }

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
  }

  try {
    const { event, payment } = req.body || {};

    if (!event || !payment?.id) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return res.status(200).json({ received: true, message: `Event ${event} ignored` });
    }

    const payRes = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?charge_id=eq.${payment.id}&select=*&limit=1`,
      { headers: sbHeaders(), signal: AbortSignal.timeout(8000) },
    );
    const payData: any[] = await payRes.json();

    if (!payData || payData.length === 0) {
      return res.status(200).json({ received: true, message: 'Payment not found in database' });
    }

    const paymentRecord = payData[0];

    await fetch(`${SUPABASE_URL}/rest/v1/payments?charge_id=eq.${payment.id}`, {
      method: 'PATCH',
      headers: sbHeaders(),
      body: JSON.stringify({ status: 'confirmed', paid_at: new Date().toISOString() }),
    });

    const email = paymentRecord.email;
    const planId = paymentRecord.plan_id;

    if (email) {
      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,shop_id&limit=1`,
        { headers: sbHeaders(), signal: AbortSignal.timeout(8000) },
      );
      const profiles: any[] = await profileRes.json();

      if (profiles && profiles.length > 0) {
        const profile = profiles[0];

        if (profile.shop_id) {
          await fetch(`${SUPABASE_URL}/rest/v1/shops?id=eq.${profile.shop_id}`, {
            method: 'PATCH',
            headers: sbHeaders(),
            body: JSON.stringify({
              plan: planId,
              status: 'active',
              plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            }),
          });
        }

        await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
          method: 'POST',
          headers: { ...sbHeaders(), 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({
            email: email,
            shop_id: profile.shop_id,
            plan_id: planId,
            status: 'ACTIVE',
            value: paymentRecord.amount,
            cycle: 'MONTHLY',
            payment_method: 'PIX',
            asaas_customer_id: paymentRecord.customer_id,
            asaas_subscription_id: payment.id,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }),
        });
      }
    }

    return res.status(200).json({ received: true, success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(200).json({ received: true, error: error.message });
  }
}
