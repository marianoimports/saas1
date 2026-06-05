export default async function handler(req: Request): Promise<Response> {
  return new Response(JSON.stringify({ success: true, message: 'API is working' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
