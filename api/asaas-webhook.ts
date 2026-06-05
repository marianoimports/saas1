import type { VercelRequest, VercelResponse } from '@vercel/node';

const FIREBASE_PROJECT = 'project-ff9afd94-4578-4636-904';
const FIREBASE_DB = 'ai-studio-8d78cf6c-ec2a-43c5-bafb-54a5035a2af8';
const FIREBASE_API_KEY = 'AIzaSyCpOTDbzwqiHyO3DEbg5Z4VKDSYa-1k3mA';

function firestoreUrl(path: string) {
  return `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents${path}`;
}

function toFields(obj: Record<string, any>) {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else fields[k] = { stringValue: JSON.stringify(v) };
  }
  return { fields };
}

function fromFields(doc: any): Record<string, any> | null {
  if (!doc?.fields) return null;
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    if ((v as any).stringValue !== undefined) result[k] = (v as any).stringValue;
    else if ((v as any).integerValue !== undefined) result[k] = Number((v as any).integerValue);
    else if ((v as any).booleanValue !== undefined) result[k] = (v as any).booleanValue;
  }
  return result;
}

async function getAccessToken(sa: any) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const b64 = (s: string) => Buffer.from(s).toString('base64url');
  const { createSign } = await import('crypto');
  const sigInput = `${b64(JSON.stringify(header))}.${b64(JSON.stringify(payload))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(sigInput);
  signer.end();
  const sig = signer.sign(sa.private_key, 'base64url');
  const jwt = `${sigInput}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data: any = await res.json();
  return data.access_token;
}

async function findUserByEmail(token: string, email: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'users' }],
      where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: email } } },
      limit: 1,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: any = await res.json();
  if (data[0]?.document?.fields) {
    return { name: data[0].document.name, fields: fromFields(data[0].document) };
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT not configured' });
  }

  let sa: any;
  try { sa = JSON.parse(serviceAccountJson); } catch {
    return res.status(500).json({ error: 'Invalid FIREBASE_SERVICE_ACCOUNT' });
  }

  try {
    const { event, payment } = req.body || {};

    if (!event || !payment?.id) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return res.status(200).json({ received: true, message: `Event ${event} ignored` });
    }

    const token = await getAccessToken(sa);
    const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const paymentDocRes = await fetch(firestoreUrl(`/payments/${payment.id}`), { headers: authHeaders });
    const paymentDocRaw: any = await paymentDocRes.json();
    const paymentDoc = fromFields(paymentDocRaw);

    if (!paymentDoc?.email) {
      return res.status(200).json({ received: true, message: 'No payment doc found, cannot identify user' });
    }

    const userResult = await findUserByEmail(token, paymentDoc.email);
    if (!userResult) {
      return res.status(200).json({ received: true, message: `No user found with email ${paymentDoc.email}` });
    }

    const uid = userResult.fields?.uid || userResult.name.split('/').pop();

    const updateFields: Record<string, any> = {
      plan: paymentDoc.planName || 'paid',
      planStatus: 'active',
      paymentId: payment.id,
      paymentStatus: 'confirmed',
      paidAt: new Date().toISOString(),
    };

    const mask = Object.keys(updateFields).map(k => `updateMask.fieldPaths=${k}`).join('&');
    await fetch(`${firestoreUrl(`/users/${uid}`)}?${mask}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(toFields(updateFields)),
    });

    await fetch(firestoreUrl(`/payments/${payment.id}`), {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(toFields({ status: 'confirmed', updatedAt: new Date().toISOString() })),
    });

    return res.status(200).json({ received: true, success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(200).json({ received: true, error: error.message });
  }
}
