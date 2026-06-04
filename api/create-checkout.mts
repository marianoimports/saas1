const ASAAS_API_URL = 'https://api.asaas.com/v3';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ success: false, error: 'ASAAS_API_KEY not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { planId, planName, amount, email } = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    };

    let customerId = '';

    try {
      const custRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`, { headers, signal: AbortSignal.timeout(10000) });
      const custData = await custRes.json() as any;
      if (custData.data && custData.data.length > 0) {
        customerId = custData.data[0].id;
      }
    } catch (_) { /* no existing customer */ }

    if (!customerId) {
      const createCustRes = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: email.split('@')[0], email }),
        signal: AbortSignal.timeout(10000),
      });
      const createCustData = await createCustRes.json() as any;
      if (!createCustData.id) {
        return new Response(JSON.stringify({ success: false, error: 'Asaas customer error: ' + JSON.stringify(createCustData), step: 'create_customer' }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
      customerId = createCustData.id;
    }

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
    const paymentData = await paymentRes.json() as any;
    if (!paymentData.id) {
      return new Response(JSON.stringify({ success: false, error: 'Asaas payment error: ' + JSON.stringify(paymentData), step: 'create_payment' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const qrRes = await fetch(`${ASAAS_API_URL}/payments/${paymentData.id}/pixQrCode`, { headers, signal: AbortSignal.timeout(10000) });
    const qrData = await qrRes.json() as any;
    if (!qrData.payload) {
      return new Response(JSON.stringify({ success: false, error: 'PIX QR error: ' + JSON.stringify(qrData), step: 'get_qr' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      checkoutId: paymentData.id,
      brCode: qrData.payload,
      brCodeBase64: qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : null,
      expiresAt: qrData.expirationDate || null,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Asaas error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message, step: 'catch' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
