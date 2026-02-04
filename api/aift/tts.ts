export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
};

type TTSRequest = {
  text: string;
  speaker?: string;  // "nana", "nara", etc.
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

  // Use VAJA API (same as KAYA) - speaker name like "nana"
  const speaker = body.speaker || 'nana';
  const vajaUrl = 'https://api.aiforthai.in.th/vaja';

  // Helper function to make request with timeout
  async function makeRequestWithRetry(maxRetries = 2): Promise<Response> {
    let lastError: any = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const controller = new AbortController();
      // Increase timeout: 25 seconds for first attempt, 30 for retry
      const timeout = attempt === 0 ? 25000 : 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(vajaUrl, {
          method: 'POST',
          headers: {
            'Apikey': apiKey as string,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, speaker }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        if (err.name === 'AbortError' && attempt < maxRetries - 1) {
          console.log(`TTS attempt ${attempt + 1} timed out, retrying...`);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  try {
    // Step 1: Request TTS synthesis with retry
    const synthRes = await makeRequestWithRetry();

    if (!synthRes.ok) {
      const errText = await synthRes.text();
      console.error('VAJA API error:', synthRes.status, errText);
      return new Response(JSON.stringify({ 
        error: 'VAJA API error', 
        status: synthRes.status, 
        details: errText 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const result = await synthRes.json() as any;
    const audioUrl = result?.audio_url || '';

    if (!audioUrl) {
      return new Response(JSON.stringify({ 
        error: 'Missing audio_url from VAJA', 
        details: JSON.stringify(result) 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Step 2: Download audio file
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 10000);

    const audioRes = await fetch(audioUrl, {
      headers: {
        'Apikey': apiKey,
      },
      signal: controller2.signal,
    });

    clearTimeout(timeoutId2);

    if (!audioRes.ok) {
      const audioErr = await audioRes.text();
      return new Response(JSON.stringify({ 
        error: 'Failed to download audio', 
        status: audioRes.status, 
        details: audioErr 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Convert to base64 for easier handling in frontend
    const audioBuffer = await audioRes.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

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

  } catch (err: any) {
    console.error('TTS error:', err);
    if (err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'TTS request timeout' }), {
        status: 504,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'TTS request failed', details: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
