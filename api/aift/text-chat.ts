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

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing TOGETHER_API_KEY' }), {
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
  const context = (body.context || '').trim();
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.4;

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Missing prompt' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Build messages for Together AI (OpenAI-compatible)
  const messages: Array<{ role: string; content: string }> = [];
  if (context) {
    messages.push({ role: 'system', content: context });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-E4B-it',
        messages,
        temperature,
        max_tokens: 300,
        top_p: 0.8,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Together AI text-chat error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'Upstream error', status: response.status, details: errText }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const result = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const responseText = result?.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ response: responseText }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Together AI text-chat request error:', err);
    return new Response(JSON.stringify({ error: 'Request failed', details: errorMessage }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
