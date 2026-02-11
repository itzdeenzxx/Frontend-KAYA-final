export const config = { 
  runtime: 'edge',
  maxDuration: 55, // Keep buffer under Vercel limit
};

declare const process: {
  env: Record<string, string | undefined>;
};

type TTSRequest = {
  text: string;
  speaker?: string;
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

  // VAJA has a 400-character limit
  let text = (body.text || '').trim();
  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (text.length > 400) {
    text = text.substring(0, 397) + '...';
  }

  const speaker = body.speaker || 'nana';
  const vajaUrl = 'https://api.aiforthai.in.th/vaja';

  try {
    // Step 1: Request TTS synthesis (single attempt, 10s timeout)
    // VAJA normally responds in 2-5s; if >10s it's likely down
    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 10000);

    console.log(`[VAJA TTS] Synthesizing: speaker=${speaker}, text=${text.substring(0, 50)}...`);
    const synthRes = await fetch(vajaUrl, {
      method: 'POST',
      headers: {
        'Apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, speaker }),
      signal: ctrl1.signal,
    });
    clearTimeout(t1);

    if (!synthRes.ok) {
      const errText = await synthRes.text();
      console.error('[VAJA TTS] Synthesis error:', synthRes.status, errText);
      return new Response(JSON.stringify({ 
        error: 'VAJA API error', 
        status: synthRes.status, 
        details: errText 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const result = await synthRes.json() as { msg?: string; audio_url?: string };
    const audioUrl = result?.audio_url || '';

    if (!audioUrl) {
      console.error('[VAJA TTS] No audio_url in response:', JSON.stringify(result));
      return new Response(JSON.stringify({ 
        error: 'Missing audio_url from VAJA', 
        details: JSON.stringify(result) 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    console.log('[VAJA TTS] Got audio_url:', audioUrl);

    // Step 2: Download audio file (10s timeout)
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 10000);

    const audioRes = await fetch(audioUrl, {
      headers: { 'Apikey': apiKey },
      signal: ctrl2.signal,
    });
    clearTimeout(t2);

    if (!audioRes.ok) {
      const audioErr = await audioRes.text();
      console.error('[VAJA TTS] Audio download error:', audioRes.status, audioErr);
      return new Response(JSON.stringify({ 
        error: 'Failed to download audio', 
        status: audioRes.status, 
        details: audioErr 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Convert to base64 for frontend
    const audioBuffer = await audioRes.arrayBuffer();
    const bytes = new Uint8Array(audioBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);

    console.log('[VAJA TTS] Success, audio size:', bytes.length, 'bytes');

    return new Response(JSON.stringify({ 
      success: true, 
      audio_base64: base64Audio,
      audio_url: audioUrl 
    }), {
      status: 200,
      headers: { 
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[VAJA TTS] Error:', error.message);
    
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'TTS request timeout' }), {
        status: 504,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'TTS request failed', details: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
