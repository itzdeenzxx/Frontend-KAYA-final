import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserSettings, getCustomCoach, DEFAULT_TTS_SETTINGS } from '@/lib/firestore';
import { getCoachById, buildCoachFromCustom, CustomCoach } from '@/lib/coachConfig';

export interface TTSSettings {
  enabled: boolean;
  speed: number;
  speaker: string;
  nfeSteps: number;
  useVajax: boolean;
  referenceAudioUrl?: string;
  referenceText?: string;
  // Custom voice fields (legacy single-ref)
  customVoiceEnabled?: boolean;
  customVoiceRefUrl?: string;
  customVoiceRefText?: string;
}

interface UseTTSReturn {
  settings: TTSSettings;
  isLoading: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
}

export function useTTS(userId?: string, coachId?: string): UseTTSReturn {
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_TTS_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [customCoachData, setCustomCoachData] = useState<CustomCoach | null>(null);
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
            speaker: userSettings.tts.speaker ?? DEFAULT_TTS_SETTINGS.speaker,
            nfeSteps: userSettings.tts.nfeSteps ?? DEFAULT_TTS_SETTINGS.nfeSteps,
            useVajax: userSettings.tts.useVajax ?? DEFAULT_TTS_SETTINGS.useVajax,
            referenceAudioUrl: userSettings.tts.referenceAudioUrl,
            referenceText: userSettings.tts.referenceText,
            customVoiceEnabled: userSettings.tts.customVoiceEnabled ?? false,
            customVoiceRefUrl: userSettings.tts.customVoiceRefUrl,
            customVoiceRefText: userSettings.tts.customVoiceRefText,
          });
        }
        
        // Load custom coach data if user has selected coach-custom
        if (coachId === 'coach-custom' || userSettings?.selectedCoachId === 'coach-custom') {
          const custom = await getCustomCoach(userId);
          setCustomCoachData(custom);
        }
      } catch (err) {
        console.error('Error loading TTS settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [userId, coachId]);

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

    // Resolve coach config for Gemini voice + instruction
    let coach = coachId ? getCoachById(coachId) : null;
    
    // For custom coach, build a Coach-like object
    const isCustomCoach = coachId === 'coach-custom' && customCoachData;
    if (isCustomCoach) {
      coach = buildCoachFromCustom(customCoachData);
    }
    
    // Check if custom coach has voice refs for VAJAX
    const hasCustomVoiceRefs = isCustomCoach && customCoachData.voiceRefs?.length > 0;
    // Pick the first voice ref for VAJAX cloning (use best quality ref)
    const primaryVoiceRef = hasCustomVoiceRefs ? customCoachData.voiceRefs[0] : null;

    while (queueRef.current.length > 0) {
      const text = queueRef.current.shift();
      if (!text) continue;

      console.log(`🔊 TTS Speaking: "${text.substring(0, 30)}..."`);

      try {
        // Path A: Custom voice via VAJAX (if custom coach has voice refs OR legacy custom voice)
        const useCustomVajax = 
          (hasCustomVoiceRefs && primaryVoiceRef) ||
          (settings.customVoiceEnabled && settings.customVoiceRefUrl && settings.customVoiceRefText);
          
        if (useCustomVajax) {
          const refUrl = primaryVoiceRef?.audioUrl || settings.customVoiceRefUrl;
          const refText = primaryVoiceRef?.refText || settings.customVoiceRefText;
          
          try {
            const vajaxController = new AbortController();
            const vajaxTimeout = setTimeout(() => vajaxController.abort(), 60000);

            const vajaxRes = await fetch('/api/aift/vajax-tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text,
                referenceAudioUrl: refUrl,
                referenceText: refText,
                speed: settings.speed,
                nfeSteps: settings.nfeSteps || 32,
              }),
              signal: vajaxController.signal,
            });

            clearTimeout(vajaxTimeout);

            if (vajaxRes.ok) {
              const result = await vajaxRes.json();
              if (result.success && result.audio_base64) {
                console.log('✅ VAJAX custom voice TTS success');
                await playAudioBase64(result.audio_base64);
                continue;
              }
            }
            console.warn('VAJAX custom voice failed, falling back to VAJA standard');
          } catch (err: any) {
            console.warn('VAJAX error:', err.name === 'AbortError' ? 'timeout' : err.message);
          }
        }

        // Path B: VAJA TTS (primary for all coaches)
        try {
          const vajaController = new AbortController();
          const vajaTimeout = setTimeout(() => vajaController.abort(), 12000);
          const vajaSpeaker = coach?.voiceId || settings.speaker || 'nana';

          const vajaRes = await fetch('/api/aift/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, speaker: vajaSpeaker }),
            signal: vajaController.signal,
          });

          clearTimeout(vajaTimeout);

          if (vajaRes.ok) {
            const result = await vajaRes.json();
            if (result.success && result.audio_base64) {
              console.log('✅ VAJA TTS success, speaker:', vajaSpeaker);
              await playAudioBase64(result.audio_base64);
              continue;
            }
          }
          console.warn('VAJA TTS response not ok:', vajaRes.status);
        } catch (err: any) {
          console.warn('VAJA TTS error:', err.name === 'AbortError' ? 'timeout' : err.message);
        }

        // Path C: Web Speech API (browser built-in)
        console.log('🔄 Using Web Speech API fallback');
        await speakWithWebSpeech(text);

      } catch (err) {
        console.error('TTS error:', err);
        await speakWithWebSpeech(text);
      }
    }

    isProcessingRef.current = false;
    setIsSpeaking(false);
  }, [settings, coachId, customCoachData, playAudioBase64, speakWithWebSpeech]);

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
