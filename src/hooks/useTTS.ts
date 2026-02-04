import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserSettings, DEFAULT_TTS_SETTINGS } from '@/lib/firestore';

export interface TTSSettings {
  enabled: boolean;
  speed: number;
  nfeSteps: number;
  useVajax: boolean;
  referenceAudioUrl?: string;
  referenceText?: string;
}

interface UseTTSReturn {
  settings: TTSSettings;
  isLoading: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
}

export function useTTS(userId?: string): UseTTSReturn {
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_TTS_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  // Load settings from Firebase
  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const userSettings = await getUserSettings(userId);
        if (userSettings?.tts) {
          setSettings({
            enabled: userSettings.tts.enabled ?? DEFAULT_TTS_SETTINGS.enabled,
            speed: userSettings.tts.speed ?? DEFAULT_TTS_SETTINGS.speed,
            nfeSteps: userSettings.tts.nfeSteps ?? DEFAULT_TTS_SETTINGS.nfeSteps,
            useVajax: userSettings.tts.useVajax ?? DEFAULT_TTS_SETTINGS.useVajax,
            referenceAudioUrl: userSettings.tts.referenceAudioUrl,
            referenceText: userSettings.tts.referenceText,
          });
        }
      } catch (err) {
        console.error('Error loading TTS settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [userId]);

  // Play audio from base64
  const playAudioBase64 = useCallback((base64: string): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const audioData = atob(base64);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          resolve();
        };
        audio.play().catch(() => resolve());
      } catch {
        resolve();
      }
    });
  }, []);

  // Web Speech API fallback
  const speakWithWebSpeech = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = settings.speed;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }, [settings.speed]);

  // Process queue
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    setIsSpeaking(true);

    while (queueRef.current.length > 0) {
      const text = queueRef.current.shift();
      if (!text) continue;

      console.log(`🔊 TTS Speaking: "${text.substring(0, 30)}..."`);

      try {
        // Try TTS API (VAJA)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 35000);

          const response = await fetch('/api/aift/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, speaker: 'nana' }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.audio_base64) {
              await playAudioBase64(result.audio_base64);
              continue;
            }
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.warn('TTS API error:', err);
          }
        }

        // Fallback: Web Speech API
        await speakWithWebSpeech(text);

      } catch (err) {
        console.error('TTS error:', err);
        await speakWithWebSpeech(text);
      }
    }

    isProcessingRef.current = false;
    setIsSpeaking(false);
  }, [settings, playAudioBase64, speakWithWebSpeech]);

  // Speak function
  const speak = useCallback(async (text: string) => {
    if (!settings.enabled || !text.trim()) {
      return;
    }

    queueRef.current.push(text);
    processQueue();
  }, [settings.enabled, processQueue]);

  // Stop function
  const stop = useCallback(() => {
    queueRef.current = [];

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    isProcessingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return {
    settings,
    isLoading,
    speak,
    stop,
    isSpeaking,
  };
}

export default useTTS;
