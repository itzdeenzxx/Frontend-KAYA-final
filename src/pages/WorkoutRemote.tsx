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
  Eye,
  Music,
  Mic,
  MicOff,
  Loader2,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  Target,
} from 'lucide-react';
import RemoteMusicPlayer from '@/components/music/RemoteMusicPlayer';
import { cn } from '@/lib/utils';
import { getExercisesForStyle, getWorkoutStyle } from '@/lib/workoutStyles';
import {
  subscribeToSession,
  sendRemoteAction,
  updateTTSState,
  sendVoiceMessage,
  WorkoutSession,
  TTSState,
  VoiceMessage,
} from '@/lib/session';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, DEFAULT_TTS_SETTINGS } from '@/lib/firestore';
import { getCoachById, Coach, migrateSpeakerId, migrateCoachId } from '@/lib/coachConfig';

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
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [visualGuideEnabled, setVisualGuideEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Local timer / stats (runs independently, syncs on exercise change)
  const [localExerciseIndex, setLocalExerciseIndex] = useState(0);
  const [localTimeLeft, setLocalTimeLeft] = useState(0);
  const [localTotalTime, setLocalTotalTime] = useState(0);
  const [localIsPaused, setLocalIsPaused] = useState(false);
  const [localReps, setLocalReps] = useState(0);
  const lastSyncedExerciseRef = useRef<number>(-1);

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
  const [ttsCoachId, setTtsCoachId] = useState<string>('coach-aiko');
  const [customCoachForLLM, setCustomCoachForLLM] = useState<{ name: string; personality: string; gender: 'male' | 'female' } | null>(null);
  
  // Load TTS speaker setting from user preferences
  useEffect(() => {
    const loadTTSSettings = async () => {
      if (userProfile?.lineUserId) {
        try {
          const settings = await getUserSettings(userProfile.lineUserId);
          if (settings?.tts?.speaker) {
            setTtsSpeaker(migrateSpeakerId(settings.tts.speaker));
          }
          if (settings?.selectedCoachId) {
            const validCoachId = migrateCoachId(settings.selectedCoachId);
            setTtsCoachId(validCoachId);
            
            if (validCoachId === 'coach-custom') {
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
              const coach = getCoachById(validCoachId);
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

    const unsubscribe = subscribeToSession(pairingCode, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);
        const connected = ['waiting', 'connected', 'active'].includes(updatedSession.status);
        setIsConnected(connected);
        setConnectionError('');

        // Sync local state when exercise changes on desktop
        const remoteIdx = updatedSession.currentExercise ?? 0;
        if (remoteIdx !== lastSyncedExerciseRef.current) {
          lastSyncedExerciseRef.current = remoteIdx;
          setLocalExerciseIndex(remoteIdx);
          setLocalReps(0);
          // Reset timer for the new exercise
          const exs = getExercisesForStyle(updatedSession.workoutStyle || localStorage.getItem('kaya_workout_style'));
          setLocalTimeLeft(exs[remoteIdx]?.duration || 0);
        }

        // Sync pause state from desktop
        setLocalIsPaused(updatedSession.isPaused ?? false);

        // Sync reps from desktop (BigScreen sends occasionally)
        if (typeof updatedSession.reps === 'number') {
          setLocalReps(updatedSession.reps);
        }

        // Sync voice message status from BigScreen
        if (updatedSession.voiceMessage) {
          const vmStatus = updatedSession.voiceMessage.status;
          if (vmStatus === 'thinking') {
            setVoiceStatus('thinking');
          } else if (vmStatus === 'speaking') {
            setVoiceStatus('speaking');
          } else if (vmStatus === 'done') {
            setVoiceStatus('idle');
          }
        }

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

  // Local timer – counts down exercise time & counts up total time independently
  useEffect(() => {
    if (localIsPaused || !isConnected) return;
    const interval = setInterval(() => {
      setLocalTotalTime((prev) => prev + 1);
      setLocalTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [localIsPaused, isConnected]);

  // Send action to Big Screen
  const sendAction = async (type: 'play' | 'pause' | 'next' | 'previous' | 'end' | 'toggleSkeleton' | 'toggleCamera' | 'toggleVisualGuide' | 'toggleTTS' | 'captureScreenshot') => {
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
      
      // Update local toggle states
      if (type === 'toggleSkeleton') setSkeletonEnabled(prev => !prev);
      if (type === 'toggleCamera') setCameraEnabled(prev => !prev);
      if (type === 'toggleVisualGuide') setVisualGuideEnabled(prev => !prev);
      if (type === 'toggleTTS') setTtsEnabled(prev => !prev);
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
      
      console.log('Calling Botnoi TTS API...');
      // Use Botnoi TTS with coach voice
      const botnoiSpeaker = ttsCoach?.voiceId || ttsSpeaker || '26';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch('/api/aift/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker: botnoiSpeaker }),
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

  // Stop voice recording and process - sends transcript to BigScreen for LLM processing
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
      
      // Build user context to send along with the transcript
      const exerciseIndex = session?.currentExercise ?? 0;
      const exercise = exercises[exerciseIndex];
      const userContextRaw: Record<string, unknown> = {
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
      // Firestore rejects undefined values — strip them out
      const userContext = Object.fromEntries(
        Object.entries(userContextRaw).filter(([, v]) => v !== undefined)
      );
      
      // Send transcript to BigScreen via Firestore for LLM processing
      // BigScreen will: capture screenshot → LLM (with image) → TTS → play audio
      setVoiceStatus("thinking");
      console.log('Sending transcript to BigScreen:', transcript.substring(0, 50));
      
      const voiceMessage: VoiceMessage = {
        transcript,
        status: 'pending',
        timestamp: Date.now(),
        coachId: ttsCoachId,
        ...(customCoachForLLM ? { customCoach: customCoachForLLM } : {}),
        userContext,
      };
      
      await sendVoiceMessage(pairingCode, voiceMessage);
      console.log('Voice message sent to BigScreen');
      
      // Status will be updated by BigScreen as it processes (thinking → speaking → done)
      // We listen for these updates in the session subscription
      
    } catch (error) {
      console.error('Voice interaction error:', error);
      setVoiceStatus("idle");
    }
    
    setIsRecording(false);
  }, [isRecording, pcmToWav, exercises, session?.currentExercise, userProfile, healthData, session?.reps, pairingCode, ttsCoachId, customCoachForLLM, vibrationEnabled]);

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

  const currentExerciseIndex = localExerciseIndex;
  const exercise = exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;
  const isPaused = localIsPaused;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show error state
  if (connectionError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <WifiOff className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">การเชื่อมต่อขาดหาย</h2>
        <p className="text-white/50 text-center mb-6">{connectionError}</p>
        <Button variant="hero" onClick={() => navigate('/workout-mode')}>
          กลับไปเชื่อมต่อใหม่
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col text-white select-none">
      {/* Header */}
      <div className="px-4 pt-12 pb-2">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>

          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
            isConnected 
              ? "bg-green-500/20 text-green-400" 
              : "bg-yellow-500/20 text-yellow-400"
          )}>
            {isConnected ? (
              <><Wifi className="w-3 h-3" /><span>เชื่อมต่อแล้ว</span><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /></>
            ) : (
              <><WifiOff className="w-3 h-3" /><span>กำลังเชื่อมต่อ...</span></>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-white/40 bg-white/10 rounded-full px-2.5 py-1">{pairingCode}</span>
            <button
              onClick={() => setVibrationEnabled(!vibrationEnabled)}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center',
                vibrationEnabled ? 'bg-primary text-white' : 'bg-white/10 text-white/40'
              )}
            >
              <Vibrate className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* Current Exercise Card */}
        <div className="gradient-coral rounded-2xl p-5 shadow-coral relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative z-10">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5">กำลังเล่น</p>
            <h2 className="text-xl font-bold text-white leading-tight">
              {exercise?.nameTh || exercise?.name || 'Loading...'}
            </h2>
            <p className="text-xs text-white/50 mt-0.5">{exercise?.name}</p>
            <div className="flex items-end gap-4 mt-3">
              {exercise?.duration ? (
                <div>
                  <p className="text-4xl font-bold text-white tabular-nums">{formatTime(localTimeLeft)}</p>
                  <p className="text-[10px] text-white/50">เหลือ</p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl font-bold text-white tabular-nums">
                    {localReps}<span className="text-lg font-normal text-white/50 ml-1">/ {exercise?.reps ?? 10}</span>
                  </p>
                  <p className="text-[10px] text-white/50">ครั้ง</p>
                </div>
              )}
              {isPaused && (
                <div className="bg-white/20 rounded-lg px-2.5 py-1 flex items-center gap-1.5 mb-1">
                  <Pause className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-medium text-white">พัก</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-white/40">ความคืบหน้า</span>
            <span className="text-white/60 font-medium">{currentExerciseIndex + 1} / {exercises.length}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Stats — 2 col layout for bigger cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-white">{formatTime(localTotalTime)}</p>
            <p className="text-[10px] text-white/40 mt-1">เวลารวม</p>
          </div>
          <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-white">{localReps}</p>
            <p className="text-[10px] text-white/40 mt-1">ครั้ง (Reps)</p>
          </div>
        </div>
        {exercise?.duration && (
          <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-white">{formatTime(localTimeLeft)}</p>
            <p className="text-[10px] text-white/40 mt-1">เวลาเหลือ</p>
          </div>
        )}

        {/* Playback Controls — inline */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
          {lastActionSent && (
            <div className="text-center mb-3">
              <span className="bg-primary/20 text-primary px-3 py-0.5 rounded-full text-[10px] font-medium">
                {lastActionSent === 'play' && 'เล่น'}
                {lastActionSent === 'pause' && 'หยุดชั่วคราว'}
                {lastActionSent === 'next' && 'ท่าถัดไป'}
                {lastActionSent === 'previous' && 'ท่าก่อนหน้า'}
                {lastActionSent === 'captureScreenshot' && 'ถ่ายภาพแล้ว'}
              </span>
            </div>
          )}
          <div className="flex items-center justify-center gap-4">
            <button
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/15 transition-colors"
              onClick={handlePrevious}
              disabled={!isConnected || currentExerciseIndex === 0}
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              className={cn(
                'w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90',
                lastActionSent && 'scale-95'
              )}
              onClick={handlePlayPause}
              disabled={!isConnected}
            >
              {isPaused ? <Play className="w-7 h-7 ml-0.5" /> : <Pause className="w-7 h-7" />}
            </button>
            <button
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/15 transition-colors"
              onClick={handleNext}
              disabled={!isConnected || currentExerciseIndex >= exercises.length - 1}
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
              onClick={handleEnd}
              disabled={!isConnected}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BigScreen Controls */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">ควบคุมหน้าจอใหญ่</p>
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => sendAction('toggleSkeleton')}
              disabled={!isConnected}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all',
                skeletonEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/[0.06] text-white/40'
              )}
            >
              {skeletonEnabled ? <Bone className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              <span className="text-[9px]">โครงกระดูก</span>
            </button>
            <button
              onClick={() => sendAction('toggleCamera')}
              disabled={!isConnected}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all',
                cameraEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.06] text-white/40'
              )}
            >
              {cameraEnabled ? <Eye className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
              <span className="text-[9px]">กล้อง</span>
            </button>
            <button
              onClick={() => sendAction('toggleVisualGuide')}
              disabled={!isConnected}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all',
                visualGuideEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-white/[0.06] text-white/40'
              )}
            >
              <Target className="w-5 h-5" />
              <span className="text-[9px]">ไกด์</span>
            </button>
            <button
              onClick={() => sendAction('toggleTTS')}
              disabled={!isConnected}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all',
                ttsEnabled ? 'bg-orange-500/20 text-orange-400' : 'bg-white/[0.06] text-white/40'
              )}
            >
              {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="text-[9px]">เสียง</span>
            </button>
            <button
              onClick={() => sendAction('captureScreenshot')}
              disabled={!isConnected}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.06] text-white/40 hover:bg-white/10 hover:text-white/60 transition-all active:scale-90"
            >
              <Camera className="w-5 h-5" />
              <span className="text-[9px]">ถ่ายภาพ</span>
            </button>
          </div>
        </div>

        {/* Music */}
        <button
          onClick={() => setShowMusicPlayer(!showMusicPlayer)}
          className={cn(
            'w-full h-12 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm font-medium border',
            showMusicPlayer 
              ? 'bg-primary/20 text-primary border-primary/20' 
              : 'bg-white/[0.04] text-white/40 border-white/[0.08]'
          )}
        >
          <Music className="w-4 h-4" />
          {showMusicPlayer ? 'ซ่อนเพลง' : 'เปิดเพลง'}
        </button>
        {showMusicPlayer && (
          <RemoteMusicPlayer 
            pairingCode={pairingCode} 
            musicState={session?.musicState}
            compact 
          />
        )}

        {/* Voice Coach */}
        <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3 text-center">ถามน้องกาย</p>
          
          {voiceStatus !== "idle" && (
            <div className="text-center mb-4">
              <span className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-2",
                voiceStatus === "recording" && "bg-red-500/20 text-red-400",
                voiceStatus === "processing" && "bg-yellow-500/20 text-yellow-400",
                voiceStatus === "thinking" && "bg-blue-500/20 text-blue-400",
                voiceStatus === "speaking" && "bg-green-500/20 text-green-400"
              )}>
                {voiceStatus === "recording" && <><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />กำลังฟัง...</>}
                {voiceStatus === "processing" && <><Loader2 className="w-3.5 h-3.5 animate-spin" />กำลังถอดเสียง...</>}
                {voiceStatus === "thinking" && <><Loader2 className="w-3.5 h-3.5 animate-spin" />น้องกายกำลังคิด...</>}
                {voiceStatus === "speaking" && <><Volume2 className="w-3.5 h-3.5" />น้องกายกำลังพูดบนจอใหญ่...</>}
              </span>
            </div>
          )}

          <div className="flex justify-center">
            <button
              className={cn(
                "relative w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all",
                isRecording
                  ? "bg-red-500 scale-110 shadow-lg shadow-red-500/40"
                  : voiceStatus === "processing" || voiceStatus === "thinking"
                  ? "bg-white/10"
                  : voiceStatus === "speaking"
                  ? "bg-green-500/20"
                  : "bg-gradient-to-br from-primary to-orange-500 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
              )}
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              onTouchStart={startVoiceRecording}
              onTouchEnd={stopVoiceRecording}
              disabled={!isConnected || voiceStatus === "processing" || voiceStatus === "thinking" || voiceStatus === "speaking"}
            >
              {isRecording && (
                <>
                  <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30" />
                  <span className="absolute -inset-2 rounded-full border border-red-300 animate-ping opacity-20" style={{ animationDelay: '0.3s' }} />
                </>
              )}
              {voiceStatus === "processing" || voiceStatus === "thinking" ? (
                <Loader2 className="w-7 h-7 text-white/60 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-white" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-white/30 mt-2">
            {isRecording ? 'ปล่อยเพื่อส่ง' : 'กดค้างเพื่อพูดกับน้องกาย'}
          </p>
        </div>
      </div>
    </div>
  );
}