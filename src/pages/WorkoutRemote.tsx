import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Vibrate,
  ArrowLeft,
  Wifi,
  WifiOff,
  X,
  Bone,
  EyeOff,
  Music,
  Mic,
  MicOff,
  Loader2,
  Volume2,
} from 'lucide-react';
import RemoteMusicPlayer from '@/components/music/RemoteMusicPlayer';
import { cn } from '@/lib/utils';
import { getExercisesForStyle, getWorkoutStyle } from '@/lib/workoutStyles';
import {
  subscribeToSession,
  sendRemoteAction,
  updateTTSState,
  WorkoutSession,
  TTSState,
} from '@/lib/session';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, DEFAULT_TTS_SETTINGS } from '@/lib/firestore';
import { getCoachById, Coach } from '@/lib/coachConfig';

// Voice status type
type VoiceStatus = "idle" | "recording" | "processing" | "thinking" | "speaking";

export default function WorkoutRemote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pairingCode = searchParams.get('code') || localStorage.getItem('kaya_pairing_code') || '';
  const { userProfile, healthData } = useAuth();

  // Session state
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Get exercises from session's workout style or localStorage fallback
  const workoutStyleId = session?.workoutStyle || localStorage.getItem('kaya_workout_style');
  const selectedStyle = getWorkoutStyle(workoutStyleId);
  const exercises = getExercisesForStyle(workoutStyleId);

  // Local state
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [lastActionSent, setLastActionSent] = useState<string>('');
  const [skeletonEnabled, setSkeletonEnabled] = useState(true);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);

  // Voice Coach state
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  // Raw PCM recording refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const pcmDataRef = useRef<Float32Array[]>([]);
  
  // TTS speaker setting
  const [ttsSpeaker, setTtsSpeaker] = useState(DEFAULT_TTS_SETTINGS.speaker);
  const [ttsCoach, setTtsCoach] = useState<Coach | null>(null);
  const [ttsCoachId, setTtsCoachId] = useState<string>('coach-nana');
  const [customCoachForLLM, setCustomCoachForLLM] = useState<{ name: string; personality: string; gender: 'male' | 'female' } | null>(null);
  
  // Load TTS speaker setting from user preferences
  useEffect(() => {
    const loadTTSSettings = async () => {
      if (userProfile?.lineUserId) {
        try {
          const settings = await getUserSettings(userProfile.lineUserId);
          if (settings?.tts?.speaker) {
            setTtsSpeaker(settings.tts.speaker);
          }
          if (settings?.selectedCoachId) {
            setTtsCoachId(settings.selectedCoachId);
            
            if (settings.selectedCoachId === 'coach-custom') {
              const { getCustomCoach } = await import('@/lib/firestore');
              const { buildCoachFromCustom } = await import('@/lib/coachConfig');
              const custom = await getCustomCoach(userProfile.lineUserId);
              if (custom) {
                setTtsCoach(buildCoachFromCustom(custom));
                setCustomCoachForLLM({
                  name: custom.name,
                  personality: custom.personality,
                  gender: custom.gender,
                });
              }
            } else {
              const coach = getCoachById(settings.selectedCoachId);
              if (coach) setTtsCoach(coach);
            }
          }
        } catch (err) {
          console.warn('Failed to load TTS settings:', err);
        }
      }
    };
    loadTTSSettings();
  }, [userProfile?.lineUserId]);

  // Subscribe to session updates
  useEffect(() => {
    if (!pairingCode) {
      navigate('/workout-mode');
      return;
    }

    console.log('WorkoutRemote: Subscribing to session', pairingCode);

    const unsubscribe = subscribeToSession(pairingCode, (updatedSession) => {
      console.log('WorkoutRemote: Session updated', updatedSession);
      if (updatedSession) {
        setSession(updatedSession);
        // Consider connected if status is waiting (just created), connected, or active
        const connected = ['waiting', 'connected', 'active'].includes(updatedSession.status);
        setIsConnected(connected);
        setConnectionError('');

        // Check if session ended
        if (updatedSession.status === 'ended') {
          navigate('/dashboard');
        }
      } else {
        setIsConnected(false);
        setConnectionError('Session หมดอายุหรือถูกปิดแล้ว');
      }
    });

    return () => unsubscribe();
  }, [pairingCode, navigate]);

  // Send action to Big Screen
  const sendAction = async (type: 'play' | 'pause' | 'next' | 'previous' | 'end' | 'toggleSkeleton') => {
    if (!pairingCode || !isConnected) return;

    // Vibrate on action
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(type === 'end' ? [100, 50, 100] : 50);
    }

    setLastActionSent(type);
    setTimeout(() => setLastActionSent(''), 500);

    try {
      await sendRemoteAction(pairingCode, {
        type,
        timestamp: Date.now(),
      });
      
      // Update local skeleton state if toggling
      if (type === 'toggleSkeleton') {
        setSkeletonEnabled(!skeletonEnabled);
      }
    } catch (error) {
      console.error('Failed to send action:', error);
    }
  };

  // Stop TTS immediately
  const stopAllTTS = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current = null;
    }
  }, []);

  // Send TTS to BigScreen for playback
  const sendTTSToBigScreen = useCallback(async (text: string, audioBase64: string): Promise<void> => {
    if (!pairingCode) {
      console.error('No pairing code, cannot send TTS');
      return;
    }
    
    console.log('sendTTSToBigScreen: pairingCode=', pairingCode, 'audioLength=', audioBase64.length);
    
    try {
      const ttsState: TTSState = {
        audioBase64,
        text,
        status: 'speaking',
        timestamp: Date.now(),
      };
      console.log('Updating TTS state in Firebase...');
      await updateTTSState(pairingCode, ttsState);
      console.log('TTS state updated successfully');
      setVoiceStatus("speaking");
      
      // Wait a bit for BigScreen to play, then reset status
      // BigScreen will clear the TTS state when done
    } catch (error) {
      console.error('Failed to send TTS to BigScreen:', error);
    }
  }, [pairingCode]);

  // Speak text using TTS - sends to BigScreen
  const speakTTS = useCallback(async (text: string): Promise<void> => {
    if (isRecording) return;
    
    console.log('speakTTS called with text:', text.substring(0, 50) + '...');
    
    try {
      setVoiceStatus("speaking");
      
      console.log('Calling VAJA TTS API...');
      // Use VAJA TTS with coach voice
      const vajaSpeaker = ttsCoach?.voiceId || ttsSpeaker || 'nana';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch('/api/aift/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker: vajaSpeaker }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      console.log('TTS API response status:', response.status);
      
      if (!response.ok) {
        console.error('TTS API failed:', response.status);
        setVoiceStatus("idle");
        return;
      }
      
      const result = await response.json();
      console.log('TTS API result has audio:', !!result.audio_base64);
      
      if (!result.audio_base64) {
        console.error('TTS API returned no audio');
        setVoiceStatus("idle");
        return;
      }
      
      // Send to BigScreen for playback
      console.log('Sending TTS to BigScreen, audio length:', result.audio_base64.length);
      await sendTTSToBigScreen(text, result.audio_base64);
      
      // Estimate speaking duration based on text length (roughly 150 chars/5 sec)
      const speakDuration = Math.max(3000, (text.length / 150) * 5000);
      setTimeout(() => {
        setVoiceStatus("idle");
      }, speakDuration);
      
    } catch (error) {
      console.error('TTS error:', error);
      setVoiceStatus("idle");
    }
  }, [isRecording, sendTTSToBigScreen]);

  // Convert raw PCM Float32Array to WAV File
  const pcmToWav = useCallback((pcmData: Float32Array[], sampleRate: number): File => {
    // Combine all chunks
    const totalLength = pcmData.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of pcmData) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log('PCM to WAV: samples=', combined.length, 'sampleRate=', sampleRate);
    
    // Create WAV file
    const numChannels = 1;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = combined.length * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (pos: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(pos + i, str.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write audio samples
    let pos = 44;
    for (let i = 0; i < combined.length; i++) {
      const sample = Math.max(-1, Math.min(1, combined[i]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      pos += 2;
    }
    
    return new File([buffer], 'voice.wav', { type: 'audio/wav' });
  }, []);

  // Start voice recording using raw PCM capture
  const startVoiceRecording = useCallback(async () => {
    // Prevent starting if already recording
    if (isRecording) {
      console.log('Already recording, ignoring start');
      return;
    }
    
    stopAllTTS();
    
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      // Store stream for cleanup
      audioStreamRef.current = stream;
      
      // Create AudioContext for raw PCM capture
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      // Resume AudioContext if suspended (required for user gesture)
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      // Create source from stream
      const source = audioCtx.createMediaStreamSource(stream);
      
      // Create ScriptProcessor to capture raw PCM
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      
      // Reset PCM data array
      const pcmChunks: Float32Array[] = [];
      pcmDataRef.current = pcmChunks;
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Copy and store the data
        pcmChunks.push(new Float32Array(inputData));
        if (pcmChunks.length === 1) {
          console.log('First audio chunk captured');
        }
      };
      
      // Connect: source -> processor -> destination (needed for processor to work)
      source.connect(processor);
      processor.connect(audioCtx.destination);
      
      // Store refs for cleanup
      mediaRecorderRef.current = { processor, source, pcmChunks } as unknown as MediaRecorder;
      
      setIsRecording(true);
      setVoiceStatus("recording");
      console.log('Voice recording started with raw PCM capture, sampleRate:', audioCtx.sampleRate);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [isRecording, stopAllTTS, vibrationEnabled]);

  // Stop voice recording and process
  const stopVoiceRecording = useCallback(async () => {
    if (!isRecording) return;
    
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
    
    setVoiceStatus("processing");
    
    // Small delay to capture remaining audio
    await new Promise(r => setTimeout(r, 200));
    
    try {
      // Get PCM data from refs before cleanup
      const refs = mediaRecorderRef.current as unknown as { processor: ScriptProcessorNode; source: MediaStreamAudioSourceNode; pcmChunks: Float32Array[] } | null;
      const pcmData = refs?.pcmChunks || pcmDataRef.current;
      const sampleRate = audioContextRef.current?.sampleRate || 16000;
      
      // Stop and cleanup audio nodes
      if (refs) {
        refs.processor.disconnect();
        refs.source.disconnect();
      }
      
      // Stop stream tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
        audioStreamRef.current = null;
      }
      
      // Close AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Clear refs
      mediaRecorderRef.current = null;
      pcmDataRef.current = [];
      
      if (pcmData.length === 0) {
        console.log('No audio data captured');
        setVoiceStatus("idle");
        setIsRecording(false);
        return;
      }
      
      const totalSamples = pcmData.reduce((acc, chunk) => acc + chunk.length, 0);
      console.log('Voice recording stopped, total samples:', totalSamples, 'chunks:', pcmData.length);
      
      // Check if audio is too short (less than 0.5 seconds = 8000 samples at 16kHz)
      if (totalSamples < 8000) {
        console.log('Audio too short (need 0.5s minimum), ignoring');
        setVoiceStatus("idle");
        setIsRecording(false);
        return;
      }
      
      // Convert to WAV
      const audioFile = pcmToWav(pcmData, sampleRate);
      console.log('Created WAV file, size:', audioFile.size);
      
      // Send to STT
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('instruction', 'ถอดเสียงเป็นข้อความภาษาไทย');
      
      const sttRes = await fetch('/api/aift/audioqa', {
        method: 'POST',
        body: formData,
      });
      
      if (!sttRes.ok) {
        const errText = await sttRes.text();
        console.error('STT error:', errText);
        throw new Error('STT failed');
      }
      
      const sttResult = await sttRes.json();
      // Handle different response formats
      let transcript = '';
      if (typeof sttResult === 'string') {
        transcript = sttResult;
      } else if (sttResult?.content) {
        transcript = typeof sttResult.content === 'string' ? sttResult.content : String(sttResult.content || '');
      } else if (sttResult?.text) {
        transcript = typeof sttResult.text === 'string' ? sttResult.text : String(sttResult.text || '');
      }
      console.log('STT transcript:', transcript);
      
      if (!transcript || !transcript.trim()) {
        console.log('Empty transcript, ignoring');
        setVoiceStatus("idle");
        setIsRecording(false);
        return;
      }
      
      // Build user context
      setVoiceStatus("thinking");
      
      const exerciseIndex = session?.currentExercise ?? 0;
      const exercise = exercises[exerciseIndex];
      const userContext = {
        name: userProfile?.nickname || userProfile?.displayName || 'ผู้ใช้',
        weight: healthData?.weight,
        height: healthData?.height,
        age: healthData?.age,
        gender: healthData?.gender,
        bmi: healthData?.bmi,
        activityLevel: healthData?.activityLevel,
        healthGoals: healthData?.healthGoals,
        currentExercise: exercise?.nameTh || exercise?.name,
        reps: session?.reps,
        targetReps: exercise?.reps || 10,
      };
      
      // Send to LLM (Gemma)
      console.log('Sending to LLM with transcript:', transcript.substring(0, 50));
      const llmRes = await fetch('/api/gemma/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript,
          userContext,
          coachId: ttsCoachId,
          customCoach: customCoachForLLM || undefined,
        }),
      });
      
      console.log('LLM response status:', llmRes.status);
      if (!llmRes.ok) {
        const errText = await llmRes.text();
        console.error('LLM failed:', errText);
        throw new Error('LLM failed');
      }
      
      const llmResult = await llmRes.json();
      const response = llmResult?.response || 'ขอโทษครับ ผมไม่เข้าใจคำถาม';
      console.log('LLM response:', response.substring(0, 50) + '...');
      
      // Speak response via TTS to BigScreen
      setVoiceStatus("speaking");
      await speakTTS(response);
      
      setVoiceStatus("idle");
    } catch (error) {
      console.error('Voice interaction error:', error);
      setVoiceStatus("idle");
    }
    
    setIsRecording(false);
  }, [isRecording, pcmToWav, exercises, session?.currentExercise, userProfile, healthData, session?.reps, speakTTS, vibrationEnabled]);

  const handlePlayPause = () => {
    if (session?.isPaused) {
      sendAction('play');
    } else {
      sendAction('pause');
    }
  };

  const handleNext = () => {
    sendAction('next');
  };

  const handlePrevious = () => {
    sendAction('previous');
  };

  const handleEnd = () => {
    sendAction('end');
  };

  const currentExerciseIndex = session?.currentExercise ?? 0;
  const exercise = exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;
  const isPaused = session?.isPaused ?? false;

  // Show error state
  if (connectionError) {
    return (
      <div className="min-h-screen bg-foreground flex flex-col items-center justify-center text-background p-6">
        <WifiOff className="w-16 h-16 mb-4 text-destructive" />
        <h2 className="text-xl font-bold mb-2">การเชื่อมต่อขาดหาย</h2>
        <p className="text-background/60 text-center mb-6">{connectionError}</p>
        <Button variant="hero" onClick={() => navigate('/workout-mode')}>
          กลับไปเชื่อมต่อใหม่
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground flex flex-col text-background">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">เชื่อมต่อแล้ว</span>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">กำลังเชื่อมต่อ...</span>
              </>
            )}
          </div>
          <button
            onClick={() => setVibrationEnabled(!vibrationEnabled)}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
              vibrationEnabled ? 'bg-primary' : 'bg-background/10'
            )}
          >
            <Vibrate className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-2">Remote Control</h1>
        <p className="text-background/60">
          ควบคุมการออกกำลังกายบนหน้าจอใหญ่
        </p>

        {/* Session Code Display */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="bg-background/10 rounded-xl px-4 py-2 inline-flex items-center gap-2">
            <span className="text-background/60 text-sm">รหัส:</span>
            <span className="font-mono font-bold tracking-widest">{pairingCode}</span>
          </div>
          
          {/* Skeleton Toggle Button */}
          <button
            onClick={() => sendAction('toggleSkeleton')}
            className={cn(
              'h-10 px-4 rounded-xl flex items-center gap-2 transition-colors',
              skeletonEnabled ? 'bg-primary text-white' : 'bg-background/10 text-background/60'
            )}
            disabled={!isConnected}
          >
            {skeletonEnabled ? <Bone className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            <span className="text-sm font-medium">{skeletonEnabled ? 'โครงกระดูก' : 'ซ่อน'}</span>
          </button>
          
          {/* Music Toggle Button */}
          <button
            onClick={() => setShowMusicPlayer(!showMusicPlayer)}
            className={cn(
              'h-10 px-4 rounded-xl flex items-center gap-2 transition-colors',
              showMusicPlayer ? 'bg-primary text-white' : 'bg-background/10 text-background/60'
            )}
          >
            <Music className="w-5 h-5" />
            <span className="text-sm font-medium">เพลง</span>
          </button>
        </div>
      </div>

      {/* Music Player */}
      {showMusicPlayer && (
        <div className="px-6 pb-4">
          <RemoteMusicPlayer 
            pairingCode={pairingCode} 
            musicState={session?.musicState}
            compact 
          />
        </div>
      )}

      {/* Current Exercise Card */}
      <div className="px-6 py-4">
        <div className="gradient-coral rounded-2xl p-6 shadow-coral">
          <p className="text-primary-foreground/80 text-sm mb-1">กำลังเล่น</p>
          <h2 className="text-2xl font-bold text-primary-foreground mb-1">
            {exercise?.nameTh || exercise?.name || 'Loading...'}
          </h2>
          <p className="text-sm text-primary-foreground/70 mb-2">
            {exercise?.name}
          </p>
          <p className="text-primary-foreground/80">
            {exercise?.duration
              ? `${exercise.duration} วินาที`
              : `${exercise?.reps ?? 0} ครั้ง`}
          </p>

          {/* Pause indicator */}
          {isPaused && (
            <div className="mt-3 bg-white/20 rounded-lg px-3 py-1 inline-flex items-center gap-2">
              <Pause className="w-4 h-4" />
              <span className="text-sm font-medium">หยุดชั่วคราว</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 py-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-background/60">ความคืบหน้า</span>
          <span>
            {currentExerciseIndex + 1} / {exercises.length}
          </span>
        </div>
        <div className="h-2 bg-background/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="px-6 py-4 flex-1">
        <h3 className="text-sm text-background/60 mb-4">สถิติ</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-background/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">12:34</p>
            <p className="text-xs text-background/60">เวลา</p>
          </div>
          <div className="bg-background/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">156</p>
            <p className="text-xs text-background/60">แคลอรี่</p>
          </div>
          <div className="bg-background/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">124</p>
            <p className="text-xs text-background/60">BPM</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-12 safe-area-inset-bottom">
        {/* Action feedback */}
        {lastActionSent && (
          <div className="text-center mb-4">
            <span className="bg-primary/20 text-primary px-4 py-1 rounded-full text-sm">
              {lastActionSent === 'play' && 'กำลังเล่น'}
              {lastActionSent === 'pause' && 'หยุดชั่วคราว'}
              {lastActionSent === 'next' && 'ท่าถัดไป'}
              {lastActionSent === 'previous' && 'ท่าก่อนหน้า'}
            </span>
          </div>
        )}

        {/* Voice Status */}
        {voiceStatus !== "idle" && (
          <div className="text-center mb-4">
            <span className={cn(
              "px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2",
              voiceStatus === "recording" && "bg-red-500/20 text-red-400",
              voiceStatus === "processing" && "bg-yellow-500/20 text-yellow-400",
              voiceStatus === "thinking" && "bg-blue-500/20 text-blue-400",
              voiceStatus === "speaking" && "bg-green-500/20 text-green-400"
            )}>
              {voiceStatus === "recording" && (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  กำลังฟัง...
                </>
              )}
              {voiceStatus === "processing" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  น้องกายกำลังวิเคราะห์ตัวคุณอยู่...
                </>
              )}
              {voiceStatus === "thinking" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  น้องกายกำลังคิด...
                </>
              )}
              {voiceStatus === "speaking" && (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  น้องกายกำลังพูด...
                </>
              )}
            </span>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          {/* Previous */}
          <Button
            variant="glass"
            size="icon"
            className="w-14 h-14 rounded-full bg-background/10 hover:bg-background/20 border-0"
            onClick={handlePrevious}
            disabled={!isConnected || currentExerciseIndex === 0}
          >
            <SkipBack className="w-6 h-6" />
          </Button>

          {/* Voice Coach - Hold to Talk */}
          <Button
            variant="glass"
            size="icon"
            className={cn(
              "w-14 h-14 rounded-full border-0 transition-all",
              isRecording 
                ? "bg-red-500 hover:bg-red-600 scale-110" 
                : voiceStatus === "speaking"
                ? "bg-green-500/20 hover:bg-green-500/30"
                : "bg-background/10 hover:bg-background/20"
            )}
            onMouseDown={startVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onTouchStart={startVoiceRecording}
            onTouchEnd={stopVoiceRecording}
            disabled={!isConnected || voiceStatus === "processing" || voiceStatus === "thinking"}
          >
            {voiceStatus === "processing" || voiceStatus === "thinking" ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {/* Play/Pause */}
          <Button
            variant="hero"
            size="icon"
            className={cn(
              'w-20 h-20 rounded-full transition-all',
              lastActionSent && 'scale-95'
            )}
            onClick={handlePlayPause}
            disabled={!isConnected}
          >
            {isPaused ? (
              <Play className="w-8 h-8" />
            ) : (
              <Pause className="w-8 h-8" />
            )}
          </Button>

          {/* End */}
          <Button
            variant="glass"
            size="icon"
            className="w-14 h-14 rounded-full bg-destructive/20 hover:bg-destructive/30 border-0 text-destructive"
            onClick={handleEnd}
            disabled={!isConnected}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Next */}
          <Button
            variant="glass"
            size="icon"
            className="w-14 h-14 rounded-full bg-background/10 hover:bg-background/20 border-0"
            onClick={handleNext}
            disabled={!isConnected || currentExerciseIndex >= exercises.length - 1}
          >
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}