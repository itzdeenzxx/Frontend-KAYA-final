export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
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

  const form = await req.formData();
  const file = form.get('file');
  const query = String(form.get('query') ?? '').trim();

  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'Missing file' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    // Convert file to base64 for Together AI vision
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Data = btoa(binary);
    const mimeType = file.type || 'image/jpeg';

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-E4B-it',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
                },
              },
              {
                type: 'text',
                text: query,
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
        top_p: 0.8,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Together AI VQA error:', response.status, errText);
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
    console.error('Together AI VQA request error:', err);
    return new Response(JSON.stringify({ error: 'Request failed', details: errorMessage }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
