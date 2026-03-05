export const config = { 
  runtime: 'edge',
  maxDuration: 30,
};

declare const process: {
  env: Record<string, string | undefined>;
};

type TTSRequest = {
  text: string;
  speaker?: string;
  speed?: number;
  volume?: number;
  language?: string;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const botnoiToken = process.env.BOTNOI_TOKEN;
  if (!botnoiToken) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing BOTNOI_TOKEN' }), {
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

  let text = (body.text || '').trim();
  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  // Botnoi has a generous limit, but cap at 1000 chars for safety
  if (text.length > 1000) {
    text = text.substring(0, 997) + '...';
  }

  // Validate speaker is a numeric Botnoi ID; fallback to '26' (YingAiko) if old VAJA name
  const rawSpeaker = body.speaker || '26';
  const speaker = /^\d+$/.test(rawSpeaker) ? rawSpeaker : '26';
  const speed = body.speed || 1;
  const volume = body.volume || 1;
  const language = body.language || 'th';

  const botnoiUrl = 'https://api-voice.botnoi.ai/openapi/v1/generate_audio';

  try {
    // Step 1: Request TTS synthesis from Botnoi (15s timeout)
    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 15000);

    console.log(`[Botnoi TTS] Synthesizing: speaker=${speaker}, text=${text.substring(0, 50)}...`);
    const synthRes = await fetch(botnoiUrl, {
      method: 'POST',
      headers: {
        'botnoi-token': botnoiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        speaker,
        volume,
        speed,
        type_media: 'mp3',
        save_file: 'true',
        language,
        page: 'user',
      }),
      signal: ctrl1.signal,
    });
    clearTimeout(t1);

    if (!synthRes.ok) {
      const errText = await synthRes.text();
      console.error('[Botnoi TTS] API error:', synthRes.status, errText);
      return new Response(JSON.stringify({ 
        error: 'Botnoi API error', 
        status: synthRes.status, 
        details: errText 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const result = await synthRes.json() as { text?: string; audio_url?: string; point?: number };
    const audioUrl = result?.audio_url || '';

    if (!audioUrl) {
      console.error('[Botnoi TTS] No audio_url in response:', JSON.stringify(result));
      return new Response(JSON.stringify({ 
        error: 'Missing audio_url from Botnoi', 
        details: JSON.stringify(result) 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    console.log('[Botnoi TTS] Got audio_url:', audioUrl);

    // Step 2: Download audio file (10s timeout)
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 10000);

    const audioRes = await fetch(audioUrl, {
      signal: ctrl2.signal,
    });
    clearTimeout(t2);

    if (!audioRes.ok) {
      const audioErr = await audioRes.text();
      console.error('[Botnoi TTS] Audio download error:', audioRes.status, audioErr);
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

    console.log('[Botnoi TTS] Success, audio size:', bytes.length, 'bytes');

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
    console.error('[Botnoi TTS] Error:', error.message);
    
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
