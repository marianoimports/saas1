import type { VercelRequest, VercelResponse } from '@vercel/node';

const ASAAS_API_URL = 'https://api.asaas.com/v3';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'ASAAS_API_KEY not configured' });
  }

  try {
    const { planId, planName, amount, email } = req.body;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    };

    // Step 1: Find or create customer
    let customerId = '';
    try {
      const custRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`, { headers, signal: AbortSignal.timeout(10000) });
      const custData: any = await custRes.json();
      if (custData.data && custData.data.length > 0) {
        customerId = custData.data[0].id;
      }
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Customer search failed: ' + e.message, step: 'search_customer' });
    }

    if (!customerId) {
      try {
        const createCustRes = await fetch(`${ASAAS_API_URL}/customers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: email.split('@')[0], email }),
          signal: AbortSignal.timeout(10000),
        });
        const createCustData: any = await createCustRes.json();
        if (!createCustData.id) {
          return res.status(200).json({ success: false, error: 'Asaas customer create failed', details: createCustData, step: 'create_customer' });
        }
        customerId = createCustData.id;
      } catch (e: any) {
        return res.status(200).json({ success: false, error: 'Customer create request failed: ' + e.message, step: 'create_customer_req' });
      }
    }

    // Step 2: Create PIX payment
    try {
      const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: amount / 100,
          description: `Plano ${planName} - Kernel Barber Shopper`,
          externalReference: planId,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const paymentData: any = await paymentRes.json();
      if (!paymentData.id) {
        return res.status(200).json({ success: false, error: 'Asaas payment create failed', details: paymentData, step: 'create_payment' });
      }

      // Step 3: Get PIX QR Code
      try {
        const qrRes = await fetch(`${ASAAS_API_URL}/payments/${paymentData.id}/pixQrCode`, { headers, signal: AbortSignal.timeout(10000) });
        const qrData: any = await qrRes.json();
        if (!qrData.payload) {
          return res.status(200).json({ success: false, error: 'PIX QR code failed', details: qrData, step: 'get_qr' });
        }

        return res.status(200).json({
          success: true,
          checkoutId: paymentData.id,
          brCode: qrData.payload,
          brCodeBase64: qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : null,
          expiresAt: qrData.expirationDate || null,
        });
      } catch (e: any) {
        return res.status(200).json({ success: false, error: 'QR code request failed: ' + e.message, step: 'get_qr_req' });
      }
    } catch (e: any) {
      return res.status(200).json({ success: false, error: 'Payment create request failed: ' + e.message, step: 'create_payment_req' });
    }
  } catch (error: any) {
    return res.status(200).json({ success: false, error: 'Outer catch: ' + error.message, step: 'catch' });
  }
}
