import { AbacatePay } from '@abacatepay/sdk';

const abacate = AbacatePay({ 
  secret: process.env.ABACATEPAY_API_KEY || '' 
});

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { planId, planName, amount, email } = await req.json();

    const pix = await abacate.pix.create({
      method: "PIX",
      data: {
        amount: amount, // valor em centavos
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      checkoutId: pix.id,
      brCode: pix.brCode,
      brCodeBase64: pix.brCodeBase64,
      expiresAt: pix.expiresAt
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('AbacatePay error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
}
