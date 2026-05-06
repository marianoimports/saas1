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

    const checkout = await abacate.checkouts.create({
      items: [{ id: planId, quantity: 1 }],
      customerId: email,
      returnUrl: `${process.env.URL || 'https://seu-site.vercel.app'}/dashboard`,
      completionUrl: `${process.env.URL || 'https://seu-site.vercel.app'}/dashboard?success=true`,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      url: checkout.data.url,
      checkoutId: checkout.data.id 
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
