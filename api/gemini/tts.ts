export const config = {
  runtime: 'edge',
  maxDuration: 30,
};

declare const process: {
  env: Record<string, string | undefined>;
};

type TTSRequest = {
  text: string;
  voiceName?: string;     // Gemini voice name (Aoede, Kore, etc.) or VAJA speaker ID (nana, poom, etc.)
  instruction?: string;   // Speaking style instruction for Gemini TTS
};

// Map VAJA speaker IDs to Gemini TTS voice names
// Gemini voices: Zephyr, Puck, Charon, Kore, Fenrir, Aoede, Leda, Orus, Perseus
const VOICE_MAP: Record<string, string> = {
  // Female coaches
  nana: 'Kore',      // Cheerful female
  farsai: 'Leda',    // Gentle female
  prim: 'Aoede',     // Professional female
  noina: 'Fenrir',   // Strict/strong female
  // Male coaches
  poom: 'Puck',      // Friendly male
  thanwa: 'Charon',  // Intense male
  // Defaults
  default: 'Kore',
};

// Create WAV header for PCM data (s16le, 24000Hz, mono)
function createWavHeader(pcmLength: number): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  // "RIFF" chunk
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + pcmLength, true); // file size - 8
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // "fmt " sub-chunk
  view.setUint32(12, 0x666D7420, false); // "fmt "
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, pcmLength, true);

  return new Uint8Array(header);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing GOOGLE_API_KEY' }), {
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

  // Map speaker to Gemini voice — accept direct Gemini voice names or VAJA speaker IDs
  const speakerKey = body.voiceName || 'default';
  // If it's already a valid Gemini voice name (starts with uppercase), use as-is
  const GEMINI_VOICES = ['Aoede', 'Kore', 'Leda', 'Zephyr', 'Charon', 'Fenrir', 'Orus', 'Perseus', 'Puck'];
  const voiceName = GEMINI_VOICES.includes(speakerKey)
    ? speakerKey
    : (VOICE_MAP[speakerKey] || VOICE_MAP['default']);

  // Build instruction for speaking style
  const instruction = (body.instruction || '').trim();

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent`;

  // Preprocess text: replace ๆ (mai yamok) with repeated word
  const preprocessText = (input: string): string => {
    return input.replace(/(\S+)\u0e46/g, '$1$1');
  };
  const processedText = preprocessText(text);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    // TTS model only accepts plain text — no instructions, no prefixes
    // Voice personality comes from voiceName selection only
    const response = await fetch(`${geminiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: processedText }],
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini TTS API error:', response.status, errText);
      return new Response(JSON.stringify({
        error: 'Gemini TTS API error',
        status: response.status,
        details: errText,
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const result = await response.json() as any;
    const audioBase64 = result?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      return new Response(JSON.stringify({
        error: 'No audio data in Gemini response',
        details: JSON.stringify(result).substring(0, 500),
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Decode PCM base64 to binary
    const pcmBinary = atob(audioBase64);
    const pcmBytes = new Uint8Array(pcmBinary.length);
    for (let i = 0; i < pcmBinary.length; i++) {
      pcmBytes[i] = pcmBinary.charCodeAt(i);
    }

    // Create WAV by prepending header to PCM data
    const wavHeader = createWavHeader(pcmBytes.length);
    const wavBytes = new Uint8Array(wavHeader.length + pcmBytes.length);
    wavBytes.set(wavHeader, 0);
    wavBytes.set(pcmBytes, wavHeader.length);

    // Convert WAV to base64
    const wavBase64 = btoa(
      wavBytes.reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    return new Response(JSON.stringify({
      success: true,
      audio_base64: wavBase64,
      voice: voiceName,
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });

  } catch (err: any) {
    console.error('Gemini TTS error:', err);
    if (err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Gemini TTS request timeout' }), {
        status: 504,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Gemini TTS request failed', details: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
