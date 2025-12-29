export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
};

type TTSRequest = {
  text: string;
  speaker?: number;
  phrase_break?: number;
  audiovisual?: number;
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

  let body: TTSRequest;
  try {
    body = (await req.json()) as TTSRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const text = (body.text || '').trim();
  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const speaker = typeof body.speaker === 'number' ? body.speaker : 0;
  const phrase_break = typeof body.phrase_break === 'number' ? body.phrase_break : 0;
  const audiovisual = typeof body.audiovisual === 'number' ? body.audiovisual : 0;

  const synthUrl = 'https://api.aiforthai.in.th/vaja9/synth_audiovisual';

  const synthRes = await fetch(synthUrl, {
    method: 'POST',
    headers: {
      Apikey: apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      speaker,
      phrase_break,
      audiovisual,
      input_text: text,
    }),
  });

  const synthText = await synthRes.text();
  if (!synthRes.ok) {
    return new Response(JSON.stringify({ error: 'Upstream error', status: synthRes.status, details: synthText }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  let wavUrl = '';
  try {
    const json = JSON.parse(synthText) as any;
    wavUrl = json?.wav_url || '';
  } catch {
    // ignore
  }

  if (!wavUrl) {
    return new Response(JSON.stringify({ error: 'Missing wav_url from upstream', details: synthText }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  const wavRes = await fetch(wavUrl, {
    headers: {
      Apikey: apiKey,
    },
  });

  if (!wavRes.ok) {
    const wavErr = await wavRes.text();
    return new Response(JSON.stringify({ error: 'Failed to fetch wav', status: wavRes.status, details: wavErr }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(wavRes.body, {
    status: 200,
    headers: {
      'content-type': wavRes.headers.get('content-type') || 'audio/wav',
      'cache-control': 'no-store',
    },
  });
}
