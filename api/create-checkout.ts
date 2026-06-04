const ASAAS_API_URL = 'https://api.asaas.com/v3';
const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';

function getBaseUrl() {
  const key = process.env.ASAAS_API_KEY || '';
  if (key.startsWith('$aact_')) return ASAAS_SANDBOX_URL;
  return ASAAS_API_URL;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      success: false,
      error: 'ASAAS_API_KEY not configured'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { planId, planName, amount, email } = await req.json();
    const baseUrl = getBaseUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    };

    // Step 1: Create or find customer
    let customerId = '';
    try {
      const custRes = await fetch(`${baseUrl}/customers?email=${encodeURIComponent(email)}`, { headers });
      const custData = await custRes.json();
      if (custData.data && custData.data.length > 0) {
        customerId = custData.data[0].id;
      }
    } catch (_) { /* no existing customer, create new */ }

    if (!customerId) {
      const createCustRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: email.split('@')[0],
          email: email,
        }),
      });
      const createCustData = await createCustRes.json();
      if (!createCustData.id) {
        throw new Error('Failed to create Asaas customer: ' + JSON.stringify(createCustData));
      }
      customerId = createCustData.id;
    }

    // Step 2: Create PIX payment
    const paymentRes = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: amount / 100,
        description: `Plano ${planName} - Kernel Barber Shopper`,
        externalReference: planId,
      }),
    });
    const paymentData = await paymentRes.json();
    if (!paymentData.id) {
      throw new Error('Failed to create Asaas payment: ' + JSON.stringify(paymentData));
    }

    // Step 3: Get PIX QR Code
    const qrRes = await fetch(`${baseUrl}/payments/${paymentData.id}/pixQrCode`, { headers });
    const qrData = await qrRes.json();
    if (!qrData.payload) {
      throw new Error('Failed to get PIX QR code: ' + JSON.stringify(qrData));
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
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
