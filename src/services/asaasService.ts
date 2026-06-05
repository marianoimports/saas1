const ASAAS_API_URL = 'https://api.asaas.com/v3';
const CORS_PROXY = 'https://corsproxy.io/?';

async function asaasFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${CORS_PROXY}${encodeURIComponent(ASAAS_API_URL + path)}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY,
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(url, { ...options, headers, signal: options.signal || AbortSignal.timeout(15000) });
  return res.json();
}

export const ASAAS_API_KEY = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJiOGM0NGVkLTFkZTEtNGExOC05OTEyLWQxOGM2ZGJmZTRmYzo6JGFhY2hfM2JkNTM3MWMtMjAxNC00NjY2LTg1ODItYzdhOGYyNThiNmE1';

export async function createPixCheckout(params: {
  planId: string;
  planName: string;
  amount: number;
  email: string;
}): Promise<{ success: boolean; brCode?: string; brCodeBase64?: string; checkoutId?: string; error?: string }> {
  const { planId, planName, amount, email } = params;

  try {
    let customerId = '';

    const custData = await asaasFetch(`/customers?email=${encodeURIComponent(email)}`);
    if (custData.data && custData.data.length > 0) {
      customerId = custData.data[0].id;
    }

    if (!customerId) {
      const createData = await asaasFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({ name: email.split('@')[0], email }),
      });
      if (!createData.id) {
        return { success: false, error: 'Asaas customer error: ' + JSON.stringify(createData) };
      }
      customerId = createData.id;
    }

    const paymentData = await asaasFetch('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: amount / 100,
        description: `Plano ${planName} - Kernel Barber Shopper`,
        externalReference: planId,
      }),
    });
    if (!paymentData.id) {
      return { success: false, error: 'Asaas payment error: ' + JSON.stringify(paymentData) };
    }

    const qrData = await asaasFetch(`/payments/${paymentData.id}/pixQrCode`);
    if (!qrData.payload) {
      return { success: false, error: 'PIX QR error: ' + JSON.stringify(qrData) };
    }

    return {
      success: true,
      checkoutId: paymentData.id,
      brCode: qrData.payload,
      brCodeBase64: qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : undefined,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
