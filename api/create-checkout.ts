const ASAAS_API_URL = 'https://api.asaas.com/v3';

export default async function handler(req: Request) {
  console.log('[create-checkout] Handler invoked, method:', req.method);

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.ASAAS_API_KEY;
  console.log('[create-checkout] API key present:', !!apiKey, 'length:', apiKey?.length);
  console.log('[create-checkout] API key prefix:', apiKey?.substring(0, 10));

  if (!apiKey) {
    return new Response(JSON.stringify({
      success: false,
      error: 'ASAAS_API_KEY not configured'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { planId, planName, amount, email } = await req.json();
    console.log('[create-checkout] Request:', { planId, planName, amount, email });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    };

    let customerId = '';

    try {
      console.log('[create-checkout] Searching customer...');
      const custRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`, { headers, signal: AbortSignal.timeout(10000) });
      const custData = await custRes.json();
      console.log('[create-checkout] Customer search response:', JSON.stringify(custData).substring(0, 200));
      if (custData.data && custData.data.length > 0) {
        customerId = custData.data[0].id;
      }
    } catch (e: any) {
      console.log('[create-checkout] Customer search failed:', e.message);
    }

    if (!customerId) {
      console.log('[create-checkout] Creating new customer...');
      const createCustRes = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: email.split('@')[0], email }),
        signal: AbortSignal.timeout(10000),
      });
      const createCustData = await createCustRes.json();
      console.log('[create-checkout] Customer create response:', JSON.stringify(createCustData).substring(0, 200));
      if (!createCustData.id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Asaas customer error: ' + JSON.stringify(createCustData),
          step: 'create_customer'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      customerId = createCustData.id;
    }

    console.log('[create-checkout] Creating PIX payment for customer:', customerId);
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
    const paymentData = await paymentRes.json();
    console.log('[create-checkout] Payment response:', JSON.stringify(paymentData).substring(0, 200));

    if (!paymentData.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Asaas payment error: ' + JSON.stringify(paymentData),
        step: 'create_payment'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('[create-checkout] Getting PIX QR code for payment:', paymentData.id);
    const qrRes = await fetch(`${ASAAS_API_URL}/payments/${paymentData.id}/pixQrCode`, { headers, signal: AbortSignal.timeout(10000) });
    const qrData = await qrRes.json();
    console.log('[create-checkout] QR response keys:', Object.keys(qrData));

    if (!qrData.payload) {
      return new Response(JSON.stringify({
        success: false,
        error: 'PIX QR error: ' + JSON.stringify(qrData),
        step: 'get_qr'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('[create-checkout] Success!');
    return new Response(JSON.stringify({
      success: true,
      checkoutId: paymentData.id,
      brCode: qrData.payload,
      brCodeBase64: qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : null,
      expiresAt: qrData.expirationDate || null,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[create-checkout] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      step: 'catch'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
