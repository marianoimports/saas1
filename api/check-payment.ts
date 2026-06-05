import type { VercelRequest, VercelResponse } from '@vercel/node';

const FIREBASE_PROJECT = 'project-ff9afd94-4578-4636-904';
const FIREBASE_API_KEY = 'AIzaSyCpOTDbzwqiHyO3DEbg5Z4VKDSYa-1k3mA';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId } = req.query;
  if (!paymentId || typeof paymentId !== 'string') {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/payments/${paymentId}?key=${FIREBASE_API_KEY}`;
    const docRes = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const docData: any = await docRes.json();

    if (!docData.fields) {
      return res.status(200).json({ status: 'unknown' });
    }

    const status = docData.fields.status?.stringValue || 'pending';

    return res.status(200).json({
      status: status,
      plan: docData.fields.planName?.stringValue || '',
      paidAt: docData.fields.paidAt?.stringValue || '',
    });
  } catch (error: any) {
    return res.status(200).json({ status: 'unknown', error: error.message });
  }
}
