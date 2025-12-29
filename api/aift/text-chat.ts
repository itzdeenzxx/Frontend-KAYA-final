export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
};

type TextChatRequest = {
  prompt: string;
  sessionId: string;
  context?: string;
  temperature?: number;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiKey = process.env.AIFT_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing AIFT_API_KEY' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: TextChatRequest;
  try {
    body = (await req.json()) as TextChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const prompt = (body.prompt || '').trim();
  const sessionId = (body.sessionId || '').trim();
  const context = (body.context || '').trim();
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.4;

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Missing prompt' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const upstreamUrl = 'https://api.aiforthai.in.th/pathumma-chat';
  const payload = new URLSearchParams({
    context,
    prompt,
    sessionid: sessionId,
    temperature: String(temperature),
  });

  const upstreamRes = await fetch(upstreamUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      Apikey: apiKey,
    },
    body: payload,
  });

  const text = await upstreamRes.text();
  if (!upstreamRes.ok) {
    return new Response(JSON.stringify({ error: 'Upstream error', status: upstreamRes.status, details: text }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const json = JSON.parse(text) as any;
    const responseText = json?.response ?? json?.content ?? json?.result ?? '';
    return new Response(JSON.stringify({ response: responseText, raw: json }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid upstream JSON', details: text }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
