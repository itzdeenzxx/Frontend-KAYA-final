export const config = {
  runtime: 'edge',
  maxDuration: 30,
};

declare const process: {
  env: Record<string, string | undefined>;
};

type TTSRequest = {
  text: string;
  voiceName?: string;     // Botnoi speaker ID (numeric string)
  speaker?: string;       // Alias for voiceName
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
  if (text.length > 1000) {
    text = text.substring(0, 997) + '...';
  }

  const speaker = body.voiceName || body.speaker || '29';
  const speed = body.speed || 1;
  const volume = body.volume || 1;
  const language = body.language || 'th';

  const botnoiUrl = 'https://api-genvoice2.botnoi.ai/openapi/v1/generate_audio';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    console.log(`[Botnoi TTS] Synthesizing: speaker=${speaker}, text=${text.substring(0, 50)}...`);
    const response = await fetch(botnoiUrl, {
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
        save_file: 'True',
        language,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Botnoi TTS] API error:', response.status, errText);
      return new Response(JSON.stringify({
        error: 'Botnoi TTS API error',
        status: response.status,
        details: errText,
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const result = await response.json() as { text?: string; audio_url?: string; point?: number };
    const audioUrl = result?.audio_url || '';

    if (!audioUrl) {
      return new Response(JSON.stringify({
        error: 'No audio_url in Botnoi response',
        details: JSON.stringify(result).substring(0, 500),
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    console.log('[Botnoi TTS] Got audio_url:', audioUrl);

    // Download audio file
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 10000);
    const audioRes = await fetch(audioUrl, { signal: ctrl2.signal });
    clearTimeout(t2);

    if (!audioRes.ok) {
      return new Response(JSON.stringify({
        error: 'Failed to download audio',
        status: audioRes.status,
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

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
      audio_url: audioUrl,
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });

  } catch (err: any) {
    console.error('[Botnoi TTS] Error:', err);
    if (err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Botnoi TTS request timeout' }), {
        status: 504,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Botnoi TTS request failed', details: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
