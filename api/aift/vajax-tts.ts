export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
};

type VAJAXTTSRequest = {
  text: string;
  referenceAudioUrl?: string;  // URL to reference audio
  referenceText?: string;       // Text matching reference audio
  speed?: number;               // 0.5-2.0, default 1.0
  nfeSteps?: number;           // 16-64, default 32
  seed?: number;                // 0-65535, random if not set
  usePhoneme?: boolean;        // default false
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

  let body: VAJAXTTSRequest;
  try {
    body = (await req.json()) as VAJAXTTSRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const targetText = (body.text || '').trim();
  if (!targetText) {
    return new Response(JSON.stringify({ error: 'Missing text' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Reference audio is REQUIRED for VAJAX-TTS
  const referenceAudioUrl = body.referenceAudioUrl;
  const referenceText = body.referenceText;
  
  if (!referenceAudioUrl || !referenceText) {
    return new Response(JSON.stringify({ 
      error: 'VAJAX-TTS requires referenceAudioUrl and referenceText',
      message: 'Please provide a reference audio file and matching text'
    }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  
  // TTS parameters
  const speed = Math.max(0.5, Math.min(2.0, body.speed || 1.0));
  const nfeSteps = Math.max(16, Math.min(64, body.nfeSteps || 32));
  const seed = body.seed !== undefined ? body.seed : Math.floor(Math.random() * 65536);
  const usePhoneme = body.usePhoneme || false;

  const vajaxUrl = 'https://api.aiforthai.in.th/vajax';
  const downloadBaseUrl = 'https://api.aiforthai.in.th/vajax-download';

  try {
    // Step 1: Download reference audio
    console.log('Fetching reference audio from:', referenceAudioUrl);
    
    const refController = new AbortController();
    const refTimeout = setTimeout(() => refController.abort(), 15000);
    
    let referenceAudioBlob: Blob;
    try {
      const refResponse = await fetch(referenceAudioUrl, {
        signal: refController.signal,
      });
      clearTimeout(refTimeout);
      
      if (!refResponse.ok) {
        console.error('Failed to fetch reference audio:', refResponse.status);
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch reference audio',
          status: refResponse.status 
        }), {
          status: 502,
          headers: { 'content-type': 'application/json' },
        });
      }
      
      referenceAudioBlob = await refResponse.blob();
    } catch (refErr: any) {
      clearTimeout(refTimeout);
      console.error('Reference audio fetch error:', refErr);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch reference audio',
        details: refErr.message 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Step 2: Create FormData for VAJAX API
    const formData = new FormData();
    formData.append('reference_audio', referenceAudioBlob, 'reference.wav');
    formData.append('reference_text', referenceText);
    formData.append('target_text', targetText);
    formData.append('speed', speed.toString());
    formData.append('nfe_steps', nfeSteps.toString());
    formData.append('seed', seed.toString());
    formData.append('use_phoneme', usePhoneme.toString());

    // Step 3: Call VAJAX API
    console.log('Calling VAJAX API with params:', { targetText, speed, nfeSteps, seed });
    
    const synthController = new AbortController();
    const synthTimeout = setTimeout(() => synthController.abort(), 60000); // 60s for synthesis
    
    const synthResponse = await fetch(vajaxUrl, {
      method: 'POST',
      headers: {
        'Apikey': apiKey,
        'accept': 'application/json',
      },
      body: formData,
      signal: synthController.signal,
    });
    
    clearTimeout(synthTimeout);

    if (!synthResponse.ok) {
      const errText = await synthResponse.text();
      console.error('VAJAX API error:', synthResponse.status, errText);
      return new Response(JSON.stringify({ 
        error: 'VAJAX API error', 
        status: synthResponse.status, 
        details: errText 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const result = await synthResponse.json() as any;
    console.log('VAJAX API result:', result);

    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error || 'VAJAX synthesis failed',
        message: result.message 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const audioPath = result.audio_url;
    if (!audioPath) {
      return new Response(JSON.stringify({ 
        error: 'Missing audio_url from VAJAX', 
        details: JSON.stringify(result) 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Extract filename from audio_url (e.g., "/api/tts/download/tts_xxx.wav" -> "tts_xxx.wav")
    const filename = audioPath.split('/').pop();
    const downloadUrl = `${downloadBaseUrl}/${filename}`;

    // Step 4: Download synthesized audio
    console.log('Downloading audio from:', downloadUrl);
    
    const dlController = new AbortController();
    const dlTimeout = setTimeout(() => dlController.abort(), 20000);

    const audioRes = await fetch(downloadUrl, {
      headers: {
        'accept': 'audio/wav',
      },
      signal: dlController.signal,
    });

    clearTimeout(dlTimeout);

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

    // Convert to base64 for frontend
    const audioBuffer = await audioRes.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    return new Response(JSON.stringify({ 
      success: true, 
      audio_base64: base64Audio,
      duration: result.duration,
      processing_time: result.processing_time,
      seed_used: result.seed_used || seed,
      sample_rate: result.sample_rate || 24000,
    }), {
      status: 200,
      headers: { 
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });

  } catch (err: any) {
    console.error('VAJAX TTS error:', err);
    if (err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'VAJAX TTS request timeout' }), {
        status: 504,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'VAJAX TTS request failed', details: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
