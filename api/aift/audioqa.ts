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

  const apiKey = process.env.AIFT_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing AIFT_API_KEY' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const form = await req.formData();
  const file = form.get('file');
  const instruction = String(form.get('instruction') ?? '').trim();

  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'Missing file' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!instruction) {
    return new Response(JSON.stringify({ error: 'Missing instruction' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const upstreamUrl = 'https://api.aiforthai.in.th/audioqa/inference/';
  const upstreamForm = new FormData();
  upstreamForm.append('file', file, file.name || 'audio');
  upstreamForm.append('instruction', instruction);

  const upstreamRes = await fetch(upstreamUrl, {
    method: 'POST',
    headers: {
      Apikey: apiKey,
    },
    body: upstreamForm,
  });

  const text = await upstreamRes.text();
  if (!upstreamRes.ok) {
    return new Response(JSON.stringify({ error: 'Upstream error', status: upstreamRes.status, details: text }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const json = JSON.parse(text);
    return new Response(JSON.stringify(json), {
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
