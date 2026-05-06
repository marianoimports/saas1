import { AbacatePay } from '@abacatepay/sdk';

const abacate = AbacatePay({ 
  secret: process.env.ABACATEPAY_API_KEY || '' 
});

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { email, name, phone } = await req.json();

    const customer = await abacate.customers.create({
      email,
      name,
      phone,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      customerId: customer.data.id 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('AbacatePay customer error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
}
