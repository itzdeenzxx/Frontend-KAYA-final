import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack, X, Volume2, MessageCircle, Dumbbell, Flame, PersonStanding, Heart, Brain, Sparkles, Target, Zap, Camera, CameraOff, Activity, Bone, Eye, EyeOff, Music, Wind, Waves, Footprints, ArrowUp, RotateCcw, ArrowUpFromLine, Mic, MicOff, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaPipePose } from "@/hooks/useMediaPipePose";
import { SkeletonOverlay } from "@/components/shared/SkeletonOverlay";
import { getWorkoutStyle, getExercisesForStyle, WorkoutExercise } from "@/lib/workoutStyles";
import MusicPlayer from "@/components/music/MusicPlayer";
import { useExerciseAnalysis } from "@/hooks/useExerciseAnalysis";
import { VisualPoseGuide, StageIndicator, BeatCounter } from "@/components/workout/VisualPoseGuide";
import { AICoachPopup } from "@/components/workout/AICoachPopup";
import { ExerciseType } from "@/lib/exerciseConfig";
import { WorkoutLoader } from "@/components/shared/WorkoutLoader";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSettings, DEFAULT_TTS_SETTINGS } from "@/lib/firestore";
import { getCoachById, Coach } from "@/lib/coachConfig";

// Rep count messages - only speak at 1, 5, 9, 10
const REP_MESSAGES: Record<number, string> = {
  1: "หนึ่ง! เริ่มต้นดีครับ!",
  5: "ห้า! ครึ่งทางแล้ว สู้ๆ ครับ!",
  9: "เก้า! อีกครั้งสุดท้ายแล้วครับ!",
  10: "สิบ! เสร็จสิ้นท่านี้แล้ว เก่งมากๆ ครับ!",
};

// Voice status type
type VoiceStatus = "idle" | "recording" | "processing" | "thinking" | "speaking";

// Map icon names to components
const exerciseIcons: Record<string, React.ReactNode> = {
  run: <PersonStanding className="w-16 h-16" />,
  muscle: <Dumbbell className="w-16 h-16" />,
  leg: <PersonStanding className="w-16 h-16" />,
  weight: <Dumbbell className="w-16 h-16" />,
  fire: <Flame className="w-16 h-16" />,
  yoga: <Heart className="w-16 h-16" />,
  // Beginner KAYA icons
  'kaya-arm': <ArrowUp className="w-16 h-16" />,
  'kaya-torso': <RotateCcw className="w-16 h-16" />,
  'kaya-knee': <ArrowUpFromLine className="w-16 h-16" />,
  // Intermediate KAYA icons
  'kaya-squat-arm': <Dumbbell className="w-16 h-16" />,
  'kaya-pushup': <Dumbbell className="w-16 h-16" />,
  'kaya-lunge': <PersonStanding className="w-16 h-16" />,
  // Advanced KAYA icons
  'kaya-jump-squat': <Zap className="w-16 h-16" />,
  'kaya-plank': <Activity className="w-16 h-16" />,
  'kaya-mountain': <Flame className="w-16 h-16" />,
  // Expert KAYA icons
  'kaya-pistol': <Target className="w-16 h-16" />,
  'kaya-pushup-tap': <Dumbbell className="w-16 h-16" />,
  'kaya-burpee': <Flame className="w-16 h-16" />,
};

// Larger icons for big screen
const exerciseIconsLarge: Record<string, React.ReactNode> = {
  run: <PersonStanding className="w-20 h-20" />,
  muscle: <Dumbbell className="w-20 h-20" />,
  leg: <PersonStanding className="w-20 h-20" />,
  weight: <Dumbbell className="w-20 h-20" />,
  fire: <Flame className="w-20 h-20" />,
  yoga: <Heart className="w-20 h-20" />,
  // Beginner KAYA icons
  'kaya-arm': <ArrowUp className="w-20 h-20" />,
  'kaya-torso': <RotateCcw className="w-20 h-20" />,
  'kaya-knee': <ArrowUpFromLine className="w-20 h-20" />,
  // Intermediate KAYA icons
  'kaya-squat-arm': <Dumbbell className="w-20 h-20" />,
  'kaya-pushup': <Dumbbell className="w-20 h-20" />,
  'kaya-lunge': <PersonStanding className="w-20 h-20" />,
  // Advanced KAYA icons
  'kaya-jump-squat': <Zap className="w-20 h-20" />,
  'kaya-plank': <Activity className="w-20 h-20" />,
  'kaya-mountain': <Flame className="w-20 h-20" />,
  // Expert KAYA icons
  'kaya-pistol': <Target className="w-20 h-20" />,
  'kaya-pushup-tap': <Dumbbell className="w-20 h-20" />,
  'kaya-burpee': <Flame className="w-20 h-20" />,
};

// Style icons for header
const styleIcons: Record<string, React.ReactNode> = {
  rhythm: <Music className="w-5 h-5" />,
  slow: <Wind className="w-5 h-5" />,
  stretch: <PersonStanding className="w-5 h-5" />,
  'kaya-stretch': <Target className="w-5 h-5" />,
  'kaya-intermediate': <Target className="w-5 h-5" />,
  'kaya-advanced': <Zap className="w-5 h-5" />,
  'kaya-expert': <Flame className="w-5 h-5" />,
  hiit: <Flame className="w-5 h-5" />,
  strength: <Dumbbell className="w-5 h-5" />,
  cardio: <Heart className="w-5 h-5" />,
  yoga: <Waves className="w-5 h-5" />,
  dance: <Footprints className="w-5 h-5" />,
  'ai-personalized': <Brain className="w-5 h-5" />,
};

const coachMessages = [
  "ทำได้ดีมาก! เกร็งกล้ามเนื้อแกนกลางไว้!",
  "เยี่ยมไปเลย! สู้ๆ อีกนิด!",
  "เกือบเสร็จแล้ว! อย่ายอมแพ้!",
  "จังหวะดีมาก! ทำต่อไป!",
  "อย่าลืมหายใจให้สม่ำเสมอ!",
  "ท่าทางดีมาก! AI กำลังวิเคราะห์!",
];

const REST_DURATION = 30; // 30 seconds rest

export default function WorkoutUI() {
  const navigate = useNavigate();
  const { userProfile, healthData } = useAuth();
  
  // Get selected workout style from localStorage
  const [selectedStyleId] = useState(() => localStorage.getItem('kaya_workout_style'));
  const selectedStyle = getWorkoutStyle(selectedStyleId);
  const exercises = getExercisesForStyle(selectedStyleId);
  
  // Check if this is a KAYA workout (all KAYA levels)
  const isKayaWorkout = selectedStyleId === 'kaya-stretch' || selectedStyleId === 'kaya-intermediate' || selectedStyleId === 'kaya-advanced' || selectedStyleId === 'kaya-expert';
  
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exercises[0]?.duration || 0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCoach, setShowCoach] = useState(true);
  const [coachMessage, setCoachMessage] = useState(coachMessages[0]);
  const [totalTime, setTotalTime] = useState(0);
  
  // Rest period state
  const [showRestScreen, setShowRestScreen] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(REST_DURATION);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  
  // Rep counter animation state
  const [showRepCounter, setShowRepCounter] = useState(false);
  const [displayRep, setDisplayRep] = useState(0);
  const lastRepRef = useRef(0);
  const lastSpokenRepRef = useRef(0);
  
  // TTS audio ref
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenExerciseRef = useRef(-1);
  const coachIntroSpokenRef = useRef(false);
  const isTtsSpeakingRef = useRef(false);
  
  // Voice Coach state
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  // Raw PCM recording refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const pcmDataRef = useRef<Float32Array[]>([]);
  
  // Track exercise results for summary
  const exerciseResultsRef = useRef<Array<{
    name: string;
    nameTh: string;
    reps: number;
    targetReps: number;
    formScore: number;
    duration: number;
  }>>([]);
  const exerciseStartTimeRef = useRef(Date.now());
  const screenshotsRef = useRef<string[]>([]);
  
  // Simple loading state - auto skip after 3 seconds
  const [showLoader, setShowLoader] = useState(true);
  const [showScreenshotFlash, setShowScreenshotFlash] = useState(false);
  
  // Auto-skip loader after 3 seconds regardless of status
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  // Skeleton overlay state - hidden by default for clean UI
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showOpticalFlow, setShowOpticalFlow] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1920, height: 1080 });
  
  // MediaPipe toggle - enabled by default for KAYA workouts
  const [mediaPipeEnabled, setMediaPipeEnabled] = useState(true);
  
  // Music player state
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  
  // Visual guide state for KAYA - hidden by default for clean UI
  const [showVisualGuide, setShowVisualGuide] = useState(false);
  
  // TTS settings
  const [ttsEnabled, setTtsEnabled] = useState(DEFAULT_TTS_SETTINGS.enabled);
  const [ttsSpeed, setTtsSpeed] = useState(DEFAULT_TTS_SETTINGS.speed);
  const [ttsSpeaker, setTtsSpeaker] = useState(DEFAULT_TTS_SETTINGS.speaker);
  const [ttsCoach, setTtsCoach] = useState<Coach | null>(null);
  const [ttsCoachId, setTtsCoachId] = useState<string>('coach-nana');
  const [customCoachForLLM, setCustomCoachForLLM] = useState<{ name: string; personality: string; gender: 'male' | 'female' } | null>(null);
  const ttsSettingsLoadedRef = useRef(false);
  
  // Load TTS speaker setting from user preferences
  useEffect(() => {
    const loadTTSSettings = async () => {
      if (userProfile?.lineUserId) {
        try {
          const settings = await getUserSettings(userProfile.lineUserId);
          if (settings?.tts) {
            const loadedEnabled = settings.tts.enabled ?? DEFAULT_TTS_SETTINGS.enabled;
            const loadedSpeed = settings.tts.speed ?? DEFAULT_TTS_SETTINGS.speed;
            const loadedSpeaker = settings.tts.speaker || DEFAULT_TTS_SETTINGS.speaker;
            
            setTtsEnabled(loadedEnabled);
            setTtsSpeed(loadedSpeed);
            if (settings.tts.speaker) {
              setTtsSpeaker(loadedSpeaker);
            }
            
            console.log('🔊 [TTS] Loaded settings (VAJA only):', { enabled: loadedEnabled, speed: loadedSpeed, speaker: loadedSpeaker });
          }
          if (settings?.selectedCoachId) {
            setTtsCoachId(settings.selectedCoachId);
            
            if (settings.selectedCoachId === 'coach-custom') {
              // Load custom coach data
              const { getCustomCoach, } = await import('@/lib/firestore');
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
          ttsSettingsLoadedRef.current = true;
          console.log('🔊 [TTS] Settings fully loaded, ttsSettingsLoaded = true');
        } catch (err) {
          console.warn('Failed to load TTS settings:', err);
          ttsSettingsLoadedRef.current = true; // mark as loaded even on error so we don't wait forever
        }
      } else {
        ttsSettingsLoadedRef.current = true; // no user profile, use defaults
      }
    };
    loadTTSSettings();
  }, [userProfile?.lineUserId]);
  
  // MediaPipe pose detection - can be toggled on/off
  const { landmarks, opticalFlowPoints, getFlowHistory, isLoading: mediaPipeLoading, error: mediaPipeError } = useMediaPipePose(
    videoRef,
    { enabled: cameraReady && cameraEnabled && isKayaWorkout && mediaPipeEnabled }
  );
  
  // Current KAYA exercise type
  const currentKayaExercise = exercises[currentExercise]?.kayaExercise as ExerciseType | undefined;
  
  // KAYA exercise analysis hook
  const kayaAnalysis = useExerciseAnalysis(
    isKayaWorkout && mediaPipeEnabled ? landmarks : [],
    {
      enabled: isKayaWorkout && mediaPipeEnabled && !!currentKayaExercise && !showLoader,
      difficulty: 'beginner',
      exerciseType: currentKayaExercise,
    }
  );

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize webcam - wait until loader is hidden
  useEffect(() => {
    // Don't start camera while loader is showing (videoRef won't be mounted)
    if (showLoader) return;
    
    if (!cameraEnabled) {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    const startCamera = async () => {
      try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
        console.log('Camera stream obtained:', stream);
        
          if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Ensure video plays
          try {
            await videoRef.current.play();
            console.log('Video playing');
            setAutoplayBlocked(false);
          } catch (playError) {
            console.log('Auto-play blocked, user interaction needed');
            setAutoplayBlocked(true);
          }

          // Mark camera as ready
          setCameraReady(true);
          
          // Track video dimensions when metadata loads
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              setVideoDimensions({
                width: videoRef.current.videoWidth || 1280,
                height: videoRef.current.videoHeight || 720,
              });
              console.log('Video dimensions:', videoRef.current.videoWidth, videoRef.current.videoHeight);
            }
          };
        }
        setCameraError('');
      } catch (error) {
        console.error('Camera error:', error);
        setCameraError('ไม่สามารถเข้าถึงกล้องได้ - กรุณาอนุญาตการใช้กล้อง');
      }
    };

    startCamera();
    
    // Update dimensions on window resize
    const handleResize = () => {
      setVideoDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [cameraEnabled, showLoader]);

  // Draw a small debug thumbnail from the video to a canvas for troubleshooting
  useEffect(() => {
    let interval: number | null = null;
    const drawFrame = () => {
      const video = videoRef.current;
      const canvas = debugCanvasRef.current;
      if (!video || !canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        // ignore if video not ready
      }
    };

    if (isKayaWorkout && cameraEnabled) {
      interval = window.setInterval(drawFrame, 250);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isKayaWorkout, cameraEnabled]);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTotalTime((prev) => prev + 1);

      if (exercises[currentExercise].duration) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNext();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, currentExercise]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCoachMessage(coachMessages[Math.floor(Math.random() * coachMessages.length)]);
    }, 8000);

    return () => clearInterval(messageInterval);
  }, []);

  // Save exercise result when moving to next exercise
  const saveCurrentExerciseResult = useCallback(() => {
    const exerciseData = exercises[currentExercise];
    if (!exerciseData) return;

    const duration = Math.floor((Date.now() - exerciseStartTimeRef.current) / 1000);
    
    exerciseResultsRef.current[currentExercise] = {
      name: exerciseData.name,
      nameTh: exerciseData.nameTh,
      reps: isKayaWorkout ? kayaAnalysis.reps : (exerciseData.reps || 0),
      targetReps: exerciseData.reps || 10,
      formScore: isKayaWorkout ? kayaAnalysis.formScore : 80,
      duration,
    };
    
    // Reset timer for next exercise
    exerciseStartTimeRef.current = Date.now();
  }, [currentExercise, exercises, isKayaWorkout, kayaAnalysis]);

  // Navigate to workout complete with results
  const finishWorkout = useCallback(() => {
    // Save last exercise
    saveCurrentExerciseResult();
    
    // Calculate totals
    const results = exerciseResultsRef.current;
    const totalReps = results.reduce((sum, e) => sum + (e?.reps || 0), 0);
    const avgFormScore = results.length > 0 
      ? Math.round(results.reduce((sum, e) => sum + (e?.formScore || 0), 0) / results.length)
      : 80;
    const completionPct = Math.round(
      (results.reduce((sum, e) => sum + Math.min(e?.reps || 0, e?.targetReps || 10), 0) /
       results.reduce((sum, e) => sum + (e?.targetReps || 10), 0)) * 100
    );

    navigate('/workout-complete', {
      state: {
        results: {
          styleName: selectedStyle?.name || 'Workout',
          styleNameTh: selectedStyle?.nameTh || 'ออกกำลังกาย',
          exercises: results.filter(Boolean),
          totalTime,
          totalReps,
          averageFormScore: avgFormScore,
          caloriesBurned: 0, // Will be calculated in WorkoutComplete
          completionPercentage: completionPct,
          screenshots: screenshotsRef.current,
        }
      }
    });
  }, [navigate, saveCurrentExerciseResult, selectedStyle, totalTime]);

  // Show rest screen between exercises
  const showRestPeriod = useCallback(() => {
    setShowRestScreen(true);
    setRestTimeLeft(REST_DURATION);
    setIsPaused(true);
  }, []);

  // Skip rest and go to next exercise
  const skipRest = useCallback(() => {
    setShowRestScreen(false);
    setIsPaused(false);
    if (currentExercise < exercises.length - 1) {
      kayaAnalysis.nextExercise();
      setCurrentExercise((prev) => prev + 1);
      setExerciseCompleted(false);
    } else {
      finishWorkout();
    }
  }, [currentExercise, exercises.length, kayaAnalysis, finishWorkout]);

  // Rest timer countdown
  useEffect(() => {
    if (!showRestScreen) return;
    
    if (restTimeLeft <= 0) {
      skipRest();
      return;
    }

    const timer = setInterval(() => {
      setRestTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showRestScreen, restTimeLeft, skipRest]);

  // Stop all TTS immediately
  const stopAllTTS = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current = null;
    }
    isTtsSpeakingRef.current = false;
  }, []);

  // Use refs to avoid stale closures in speakTTS
  const ttsCoachRef = useRef(ttsCoach);
  const ttsSpeakerRef = useRef(ttsSpeaker);
  const ttsEnabledRef = useRef(ttsEnabled);
  const ttsSpeedRef = useRef(ttsSpeed);
  useEffect(() => { ttsCoachRef.current = ttsCoach; }, [ttsCoach]);
  useEffect(() => { ttsSpeakerRef.current = ttsSpeaker; }, [ttsSpeaker]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { ttsSpeedRef.current = ttsSpeed; }, [ttsSpeed]);

  // Speak text using TTS (returns Promise)
  // forcePlay = true will play even if user is recording (used for LLM response)
  const speakTTS = useCallback(async (text: string, forcePlay: boolean = false): Promise<void> => {
    // Don't speak if TTS is disabled in settings
    if (!ttsEnabledRef.current) {
      console.log('🔇 [TTS] Skipped: TTS is disabled in settings');
      return;
    }

    // Don't speak if user is recording (unless forced)
    if (isRecording && !forcePlay) {
      console.log('TTS skipped: user is recording');
      return;
    }
    
    // If forced, stop recording first (for raw PCM capture)
    if (forcePlay && isRecording) {
      console.log('TTS force play: stopping recording first');
      // Stop audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
        audioStreamRef.current = null;
      }
      // Close AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsRecording(false);
    }
    
    console.log('TTS speaking:', text.substring(0, 50) + '...');
    
    try {
      isTtsSpeakingRef.current = true;
      
      // Read current coach/speaker from refs (avoids stale closure)
      const currentCoach = ttsCoachRef.current;
      const currentSpeaker = currentCoach?.voiceId || ttsSpeakerRef.current || 'nana';
      
      console.log('🔊 [TTS] VAJA speaking with speaker:', currentSpeaker, '| coach:', currentCoach?.name || 'none', '| speed:', ttsSpeedRef.current);

      // Call VAJA TTS API (12s timeout — fallback to Web Speech if slow)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch('/api/aift/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker: currentSpeaker }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      if (!response?.ok) {
        console.error('🔊 [TTS] VAJA API error:', response.status);
        isTtsSpeakingRef.current = false;
        return;
      }
      
      const result = await response.json();
      console.log('🔊 [TTS] VAJA response:', result.audio_base64 ? 'has audio' : 'no audio');
      
      if (!result.audio_base64) {
        console.error('🔊 [TTS] VAJA returned no audio');
        isTtsSpeakingRef.current = false;
        return;
      }
      
      // Check again if user started recording (skip this check if forcePlay)
      if (isRecording && !forcePlay) {
        console.log('TTS cancelled: user started recording');
        isTtsSpeakingRef.current = false;
        return;
      }
      
      const audioData = atob(result.audio_base64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('TTS playing audio...');
      
      // Stop any existing audio
      stopAllTTS();
      
      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        ttsAudioRef.current = audio;
        
        // Apply speed setting from user preferences
        audio.playbackRate = ttsSpeedRef.current || 1.0;
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          ttsAudioRef.current = null;
          isTtsSpeakingRef.current = false;
          resolve();
        };
        
        audio.onerror = () => {
          isTtsSpeakingRef.current = false;
          resolve();
        };
        
        audio.play().catch(() => {
          isTtsSpeakingRef.current = false;
          resolve();
        });
      });
    } catch (error) {
      isTtsSpeakingRef.current = false;
      console.error('TTS error:', error);
    }
  }, [isRecording, stopAllTTS]);

  // Speak rep count (only 1,3,5,7,9,10)
  const speakRepCount = useCallback(async (rep: number) => {
    const message = REP_MESSAGES[rep];
    if (message && rep > lastSpokenRepRef.current) {
      lastSpokenRepRef.current = rep;
      await speakTTS(message);
    }
  }, [speakTTS]);

  // Show rep counter animation when rep increases (only up to target)
  useEffect(() => {
    const targetReps = exercises[currentExercise]?.reps || 10;
    
    // Only show animation if we haven't reached target yet
    if (isKayaWorkout && kayaAnalysis.reps > lastRepRef.current && kayaAnalysis.reps > 0 && kayaAnalysis.reps <= targetReps) {
      setDisplayRep(kayaAnalysis.reps);
      setShowRepCounter(true);
      
      // Speak rep count (only 1,3,5,7,9,10)
      if (REP_MESSAGES[kayaAnalysis.reps]) {
        speakRepCount(kayaAnalysis.reps);
      }
      
      // Hide after animation
      const timeout = setTimeout(() => {
        setShowRepCounter(false);
      }, 800);
      
      lastRepRef.current = kayaAnalysis.reps;
      return () => clearTimeout(timeout);
    }
  }, [isKayaWorkout, kayaAnalysis.reps, currentExercise, exercises, speakRepCount]);

  // Reset lastRepRef and lastSpokenRepRef when exercise changes
  useEffect(() => {
    lastRepRef.current = 0;
    lastSpokenRepRef.current = 0;
  }, [currentExercise]);

  // Capture screenshot for voice interaction
  const captureScreenshotForVoice = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Mirror the video
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

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
    
    // Stop any TTS that's playing
    stopAllTTS();
    
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
      // Use smaller buffer for more responsive capture
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
      console.log('Voice recording started with raw PCM capture, sampleRate:', audioCtx.sampleRate, 'state:', audioCtx.state);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [isRecording, stopAllTTS]);

  // Stop voice recording and process
  const stopVoiceRecording = useCallback(async () => {
    if (!isRecording) return;
    
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
        
        // Capture screenshot
        const screenshot = captureScreenshotForVoice();
        
        // Build user context
        setVoiceStatus("thinking");
        
        const exercise = exercises[currentExercise];
        
        // Get next exercises list
        const nextExercises = exercises
          .slice(currentExercise + 1)
          .map(e => e.nameTh || e.name);
        
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
          reps: isKayaWorkout ? kayaAnalysis.reps : undefined,
          targetReps: exercise?.reps || 10,
          nextExercises,
        };
        
        // Send to LLM
        const llmRes = await fetch('/api/gemma/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: transcript,
            imageBase64: screenshot,
            userContext,
            coachId: ttsCoachId,
            customCoach: customCoachForLLM || undefined,
          }),
        });
        
        if (!llmRes.ok) {
          throw new Error('LLM failed');
        }
        
        const llmResult = await llmRes.json();
        const response = llmResult?.response || 'ขอโทษครับ ผมไม่เข้าใจคำถาม';
        console.log('LLM response:', response);
        
        // Speak response (force play)
        setVoiceStatus("speaking");
        await speakTTS(response, true);
        
        setVoiceStatus("idle");
    } catch (error) {
      console.error('Voice interaction error:', error);
      setVoiceStatus("idle");
    }
    
    setIsRecording(false);
    mediaRecorderRef.current = null;
  }, [isRecording, pcmToWav, captureScreenshotForVoice, exercises, currentExercise, userProfile, healthData, isKayaWorkout, kayaAnalysis.reps, speakTTS]);

  // Speak exercise instruction when exercise changes
  const speakExerciseInstruction = useCallback(async (exercise: WorkoutExercise) => {
    if (!exercise) return;
    
    // Build instruction text
    const instruction = `ท่า${exercise.nameTh || exercise.name}. ${exercise.description || 'ทำตามท่าที่แสดง'}`;
    
    console.log('TTS: Calling API with text:', instruction);
    
    try {
      // Use refs for current coach/speaker (avoid stale closure)
      const currentCoach = ttsCoachRef.current;
      const currentSpeaker = currentCoach?.voiceId || ttsSpeakerRef.current || 'nana';
      
      // Skip if TTS disabled
      if (!ttsEnabledRef.current) {
        console.log('🔇 [TTS] Exercise instruction skipped: TTS disabled');
        return;
      }

      console.log('🔊 [ExerciseInstruction] VAJA speaker:', currentSpeaker, '| coach:', currentCoach?.name || 'none');

      // Call VAJA TTS API (12s timeout — fallback to Web Speech if slow)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch('/api/aift/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: instruction, speaker: currentSpeaker }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response || !response.ok) {
        console.error('🔊 [ExerciseInstruction] VAJA API error:', response?.status);
        return;
      }
      
      console.log('TTS: Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS API error:', response.status, errorText);
        return;
      }
      
      // API returns JSON with base64 audio
      const result = await response.json();
      console.log('TTS: Got response, has audio_base64:', !!result.audio_base64);
      
      if (!result.audio_base64) {
        console.error('TTS: No audio_base64 in response');
        return;
      }
      
      // Convert base64 to audio blob
      const audioData = atob(result.audio_base64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('TTS: Created audio blob, size:', audioBlob.size);
      
      // Stop previous audio if playing
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      ttsAudioRef.current = audio;
      
      // Apply speed setting from user preferences
      audio.playbackRate = ttsSpeedRef.current || 1.0;
      
      audio.oncanplaythrough = () => {
        console.log('TTS: Audio ready to play');
      };
      
      audio.onerror = (e) => {
        console.error('TTS: Audio error:', e);
      };
      
      audio.play().then(() => {
        console.log('TTS: Audio playing at speed:', audio.playbackRate);
      }).catch((err) => {
        console.error('TTS: Play error:', err);
      });
      
      // Cleanup URL after audio ends
      audio.onended = () => {
        console.log('TTS: Audio ended');
        URL.revokeObjectURL(audioUrl);
        ttsAudioRef.current = null;
      };
    } catch (error) {
      console.error('TTS error:', error);
    }
  }, []);

  // Fallback: Use Web Speech API when TTS API fails
  const speakWithWebSpeechFallback = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 1.0;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Speak coach introduction
  const speakCoachIntroduction = useCallback(async () => {
    // Skip if TTS disabled
    if (!ttsEnabledRef.current) {
      console.log('🔇 [TTS] Coach intro skipped: TTS disabled');
      // Still speak the first exercise instruction (it will also check ttsEnabled)
      const exercise = exercises[0];
      if (exercise) setTimeout(() => speakExerciseInstruction(exercise), 500);
      return;
    }

    const currentCoach = ttsCoachRef.current;
    const speakerFromSettings = ttsSpeakerRef.current;
    const userName = userProfile?.nickname || userProfile?.displayName || 'คุณ';
    const coachName = currentCoach?.nameTh || 'น้องกาย';
    const introText = `สวัสดีครับ ผมชื่อ${coachName} วันนี้จะมาเป็นโค้ชให้คุณ${userName}นะครับ พร้อมออกกำลังกายไปด้วยกันไหมครับ เริ่มกันเลย!`;
    
    console.log('TTS Coach Intro: Calling API with text:', introText);
    
    // Helper function to speak first exercise after intro
    const speakFirstExercise = () => {
      const exercise = exercises[0];
      if (exercise) {
        setTimeout(() => {
          speakExerciseInstruction(exercise);
        }, 500);
      }
    };
    
    try {
      const currentSpeaker = currentCoach?.voiceId || speakerFromSettings || 'nana';
      
      console.log('🔊 [CoachIntro] VAJA speaker:', currentSpeaker, '| coach:', currentCoach?.name || 'none');

      // Call VAJA TTS API (12s timeout — fallback to Web Speech if slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const response = await fetch('/api/aift/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: introText, speaker: currentSpeaker }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!response || !response.ok) {
        console.warn('🔊 [CoachIntro] VAJA API error:', response?.status, '- using Web Speech fallback');
        await speakWithWebSpeechFallback(introText);
        speakFirstExercise();
        return;
      }
      
      const result = await response.json();
      if (!result.audio_base64) {
        console.warn('TTS Coach Intro: No audio_base64 - using fallback');
        await speakWithWebSpeechFallback(introText);
        speakFirstExercise();
        return;
      }
      
      const audioData = atob(result.audio_base64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      ttsAudioRef.current = audio;
      
      // Apply speed setting from user preferences
      audio.playbackRate = ttsSpeedRef.current || 1.0;
      
      audio.play().then(() => {
        console.log('TTS Coach Intro: Playing at speed:', audio.playbackRate);
      }).catch(console.error);
      
      audio.onended = () => {
        console.log('TTS Coach Intro: Ended');
        URL.revokeObjectURL(audioUrl);
        ttsAudioRef.current = null;
        speakFirstExercise();
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('TTS Coach Intro timeout - using fallback');
      } else {
        console.error('TTS Coach Intro error:', error);
      }
      // Use Web Speech API as fallback
      await speakWithWebSpeechFallback(introText);
      speakFirstExercise();
    }
  }, [userProfile, exercises, speakExerciseInstruction, speakWithWebSpeechFallback]);

  // Speak coach introduction when workout starts
  useEffect(() => {
    if (showLoader) return;
    if (coachIntroSpokenRef.current) return;
    
    coachIntroSpokenRef.current = true;
    
    // Wait for TTS settings to load before speaking intro
    // This prevents race condition where coach speaker ref is still default
    const waitAndSpeak = async () => {
      // Wait up to 3 seconds for settings to load
      let waited = 0;
      while (!ttsSettingsLoadedRef.current && waited < 3000) {
        await new Promise(r => setTimeout(r, 100));
        waited += 100;
      }
      console.log('🔊 [CoachIntro] Settings loaded after', waited, 'ms, speaker:', ttsCoachRef.current?.voiceId || ttsSpeakerRef.current);
      speakCoachIntroduction();
    };
    
    const timeout = setTimeout(() => {
      waitAndSpeak();
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [showLoader, speakCoachIntroduction]);

  // Speak instruction when exercise changes (after first exercise)
  useEffect(() => {
    // Don't speak while loader is showing
    if (showLoader) return;
    
    // Skip first exercise (handled by coach intro)
    if (currentExercise === 0) return;
    
    // Skip if already spoken for this exercise
    if (lastSpokenExerciseRef.current === currentExercise) return;
    
    const exercise = exercises[currentExercise];
    if (exercise) {
      console.log('Speaking instruction for exercise:', currentExercise, exercise.nameTh);
      lastSpokenExerciseRef.current = currentExercise;
      
      // Small delay to ensure UI is ready
      const timeout = setTimeout(() => {
        speakExerciseInstruction(exercise);
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [currentExercise, showLoader, exercises, speakExerciseInstruction]);

  // Auto-advance when KAYA exercise reps are complete
  useEffect(() => {
    if (!isKayaWorkout || exerciseCompleted || showRestScreen) return;
    
    const targetReps = exercises[currentExercise]?.reps || 10;
    
    if (kayaAnalysis.reps >= targetReps) {
      setExerciseCompleted(true);
      saveCurrentExerciseResult();
      
      // Go directly to next exercise after short delay
      const timeout = setTimeout(() => {
        if (currentExercise < exercises.length - 1) {
          // Reset for next exercise
          kayaAnalysis.nextExercise();
          setCurrentExercise((prev) => prev + 1);
          setExerciseCompleted(false);
          lastRepRef.current = 0;
          // Reset spoken ref to trigger TTS for new exercise
          lastSpokenExerciseRef.current = -1;
        } else {
          finishWorkout();
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isKayaWorkout, kayaAnalysis.reps, currentExercise, exercises, exerciseCompleted, showRestScreen, saveCurrentExerciseResult, kayaAnalysis, finishWorkout]);

  const handleNext = useCallback(() => {
    saveCurrentExerciseResult();
    if (currentExercise < exercises.length - 1) {
      if (isKayaWorkout) {
        kayaAnalysis.nextExercise();
      }
      setCurrentExercise((prev) => prev + 1);
      const nextExercise = exercises[currentExercise + 1];
      setTimeLeft(nextExercise.duration || 0);
    } else {
      finishWorkout();
    }
  }, [currentExercise, exercises, isKayaWorkout, kayaAnalysis, saveCurrentExerciseResult, finishWorkout]);

  const handlePrevious = useCallback(() => {
    if (currentExercise > 0) {
      if (isKayaWorkout) {
        kayaAnalysis.previousExercise();
      }
      setCurrentExercise((prev) => prev - 1);
      const prevExercise = exercises[currentExercise - 1];
      setTimeLeft(prevExercise.duration || 0);
    }
  }, [currentExercise, exercises, isKayaWorkout, kayaAnalysis]);

  const handleStop = () => {
    navigate("/dashboard");
  };

  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled);
  };

  // Capture screenshot function
  const captureScreenshot = useCallback(() => {
    if (!videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Mirror the video like it's displayed
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Add overlay text
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.textAlign = 'left';
      
      // Exercise name - use exercises[currentExercise] directly
      const currentEx = exercises[currentExercise];
      const text = `${currentEx?.nameTh || 'ออกกำลังกาย'}`;
      ctx.strokeText(text, 20, 40);
      ctx.fillText(text, 20, 40);
      
      // Reps if KAYA workout
      if (isKayaWorkout) {
        const repsText = `${kayaAnalysis.reps} ครั้ง`;
        ctx.strokeText(repsText, 20, 70);
        ctx.fillText(repsText, 20, 70);
      }
      
      // Add to screenshots (max 5)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      if (screenshotsRef.current.length < 5) {
        screenshotsRef.current.push(dataUrl);
      }
      
      // Show flash effect
      setShowScreenshotFlash(true);
      setTimeout(() => setShowScreenshotFlash(false), 200);
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  }, [exercises, currentExercise, isKayaWorkout, kayaAnalysis.reps]);

  const exercise = exercises[currentExercise];
  const progress = ((currentExercise + 1) / exercises.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Show loading screen while resources load
  if (showLoader) {
    return (
      <WorkoutLoader 
        status={{ 
          cameraReady, 
          mediaPipeReady: !mediaPipeLoading,
          cameraError: cameraError || undefined
        }} 
        onComplete={() => setShowLoader(false)} 
      />
    );
  }

  // Rest Period Screen
  if (showRestScreen) {
    const nextExercise = exercises[currentExercise + 1];
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-6">
        {/* Rest Timer Circle */}
        <div className="relative w-48 h-48 mb-8">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="white"
              strokeOpacity="0.2"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="url(#restGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - restTimeLeft / REST_DURATION)}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="restGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white">{restTimeLeft}</span>
            <span className="text-white/60 text-sm">วินาที</span>
          </div>
        </div>

        {/* Rest Message */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">🎉 เยี่ยมมาก!</h2>
          <p className="text-white/70">พักสักครู่แล้วไปท่าต่อไปกัน</p>
        </div>

        {/* Next Exercise Preview */}
        {nextExercise && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 w-full max-w-sm">
            <p className="text-white/60 text-sm mb-2">ท่าถัดไป</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center text-3xl">
                {nextExercise.icon || "🏃"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{nextExercise.nameTh || nextExercise.name}</h3>
                <p className="text-white/60">{nextExercise.reps} ครั้ง</p>
              </div>
            </div>
          </div>
        )}

        {/* Music Player during rest */}
        <div className="w-full max-w-sm mb-8">
          <MusicPlayer className="text-white" autoPlay={true} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={skipRest}
            className="px-8 py-4 bg-primary rounded-xl text-white font-semibold text-lg hover:bg-primary/90 transition-colors"
          >
            ข้ามพัก →
          </button>
          <button
            onClick={finishWorkout}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-xl text-white font-medium hover:bg-white/20 transition-colors"
          >
            จบการออกกำลังกาย
          </button>
        </div>

        {/* Progress */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex justify-between text-white/60 text-sm mb-2">
            <span>ความคืบหน้า</span>
            <span>{currentExercise + 1} / {exercises.length}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${((currentExercise + 1) / exercises.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop/Tablet View with Camera
  if (!isMobile) {
    return (
      <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden">
        {/* Screenshot Flash Effect */}
        {showScreenshotFlash && (
          <div className="absolute inset-0 bg-white z-50 animate-flash" />
        )}
        {/* Fullscreen Camera View */}
        <div className="absolute inset-0">
          {!cameraEnabled ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <CameraOff className="w-12 h-12 text-white/50" />
              </div>
              <p className="text-white/70 text-xl">กล้องปิดอยู่</p>
              <button 
                onClick={toggleCamera}
                className="mt-4 px-6 py-3 bg-primary rounded-xl text-white font-medium hover:bg-primary/90 transition-colors"
              >
                เปิดกล้อง
              </button>
            </div>
          ) : cameraError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
              <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <CameraOff className="w-12 h-12 text-red-400" />
              </div>
              <p className="text-white/70 text-xl">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onCanPlay={() => {
                  console.log('Video can play');
                  setCameraReady(true);
                }}
                onLoadedData={() => console.log('Video data loaded')}
                className="w-full h-full object-cover scale-x-[-1]"
                style={{ backgroundColor: '#000' }}
              />
                {/* Autoplay blocked overlay */}
                {autoplayBlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={async () => {
                        try {
                          await videoRef.current?.play();
                          setAutoplayBlocked(false);
                          setCameraError('');
                        } catch (e) {
                          setCameraError('ไม่สามารถเริ่มวิดีโอได้ กรุณาแตะหน้าจออีกครั้ง');
                        }
                      }}
                      className="px-6 py-3 bg-primary text-white rounded-xl shadow-lg"
                    >
                      เปิดกล้อง (แตะเพื่อเริ่ม)
                    </button>
                  </div>
                )}
              {/* Skeleton Overlay */}
              {cameraEnabled && (showSkeleton || showOpticalFlow) && (
                <SkeletonOverlay
                  landmarks={landmarks}
                  opticalFlowPoints={opticalFlowPoints}
                  getFlowHistory={getFlowHistory}
                  showSkeleton={showSkeleton}
                  showOpticalFlow={showOpticalFlow}
                  width={videoDimensions.width}
                  height={videoDimensions.height}
                  mirrored={true}
                />
              )}
              {/* KAYA Visual Pose Guide */}
              {isKayaWorkout && cameraEnabled && showVisualGuide && currentKayaExercise && (
                <VisualPoseGuide
                  exerciseType={currentKayaExercise}
                  landmarks={landmarks}
                  currentStage={kayaAnalysis.stage}
                  targetStage={kayaAnalysis.targetStage}
                  corrections={kayaAnalysis.corrections}
                  formScore={kayaAnalysis.formScore}
                  width={videoDimensions.width}
                  height={videoDimensions.height}
                  mirrored={true}
                />
              )}
            </>
          )}
        </div>

        {/* KAYA AI Coach Popup */}
        {isKayaWorkout && (
          <AICoachPopup
            currentMessage={kayaAnalysis.coachMessage}
            speaker={ttsCoach?.voiceId || ttsSpeaker}
            ttsEnabled={ttsEnabled}
            ttsSpeed={ttsSpeed}
          />
        )}

        {/* KAYA Stage Indicator */}
        {isKayaWorkout && currentKayaExercise && (
          <div className="absolute top-24 left-6 z-20">
            <StageIndicator 
              exerciseType={currentKayaExercise}
              currentStage={kayaAnalysis.stage}
              targetStage={kayaAnalysis.targetStage}
              formScore={kayaAnalysis.formScore}
              reps={kayaAnalysis.reps}
            />
          </div>
        )}

        {/* Rep Counter Animation - Big number popup */}
        {showRepCounter && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="animate-rep-popup">
              <span className="text-[150px] font-black text-primary drop-shadow-2xl" style={{
                textShadow: '0 0 60px rgba(221, 110, 83, 0.8), 0 0 120px rgba(221, 110, 83, 0.4)'
              }}>
                {displayRep}
              </span>
            </div>
          </div>
        )}

        {/* Overlay gradient - lighter for clean look */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Top Bar - Simplified */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          {/* Close Button */}
          <button
            onClick={handleStop}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Center - Workout Style (small) */}
          {selectedStyle && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs",
              `bg-gradient-to-r ${selectedStyle.bgGradient} border-white/20`
            )}>
              {styleIcons[selectedStyle.id] || <Dumbbell className="w-3 h-3" />}
              <span className="font-medium text-white">{selectedStyle.name}</span>
            </div>
          )}

          {/* Right side - Time & Controls */}
          <div className="flex items-center gap-2">
            {/* Time */}
            <div className="text-white text-lg font-mono bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
              {formatTime(totalTime)}
            </div>
            {/* Skeleton Toggle - Desktop */}
            {isKayaWorkout && (
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={cn(
                  "w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors",
                  showSkeleton ? "bg-green-500 text-white" : "bg-black/30 text-white/70 hover:bg-black/50"
                )}
                title={showSkeleton ? "ซ่อนโครงกระดูก" : "แสดงโครงกระดูก"}
              >
                {showSkeleton ? <Bone className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            )}
            {/* Music Toggle */}
            <button
              onClick={() => setShowMusicPlayer(!showMusicPlayer)}
              className={cn(
                "w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors",
                showMusicPlayer ? "bg-primary text-white" : "bg-black/30 text-white/70 hover:bg-black/50"
              )}
            >
              <Music className="w-4 h-4" />
            </button>
            <button
              onClick={captureScreenshot}
              className="w-10 h-10 rounded-full bg-black/30 text-white/70 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Music Player Panel */}
        {showMusicPlayer && (
          <div className="absolute top-16 right-4 z-20 w-72">
            <MusicPlayer className="text-white" />
          </div>
        )}

        {/* Voice Status Indicator - Desktop */}
        {voiceStatus !== "idle" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className={cn(
              "px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium inline-flex items-center gap-2",
              voiceStatus === "recording" && "bg-red-500/80 text-white",
              voiceStatus === "processing" && "bg-yellow-500/80 text-white",
              voiceStatus === "thinking" && "bg-blue-500/80 text-white",
              voiceStatus === "speaking" && "bg-green-500/80 text-white"
            )}>
              {voiceStatus === "recording" && (
                <>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
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
                  <Volume2 className="w-4 h-4" />
                  น้องกายกำลังพูด...
                </>
              )}
            </div>
          </div>
        )}

        {/* Current Exercise Display - Simplified */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-white/60 text-xs mb-1">
              <span>{currentExercise + 1} / {exercises.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            {/* Exercise Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-xl bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30">
                  <Activity className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{exercise?.nameTh || exercise?.name}</h2>
                  {isKayaWorkout ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-primary">{Math.min(kayaAnalysis.reps, exercise?.reps || 10)}</span>
                      <span className="text-white/60 text-sm">/ {exercise?.reps || 10} ครั้ง</span>
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">
                      {exercise?.duration ? `${formatTime(timeLeft)} เหลือ` : `${exercise?.reps} ครั้ง`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Voice Coach Button - Desktop */}
              <button
                onMouseDown={startVoiceRecording}
                onMouseUp={stopVoiceRecording}
                disabled={voiceStatus === "processing" || voiceStatus === "thinking" || voiceStatus === "speaking"}
                className={cn(
                  "w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all",
                  isRecording 
                    ? "bg-red-500 animate-pulse scale-110" 
                    : voiceStatus === "processing" || voiceStatus === "thinking"
                      ? "bg-yellow-500"
                      : voiceStatus === "speaking"
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
                  (voiceStatus === "processing" || voiceStatus === "thinking" || voiceStatus === "speaking") && "opacity-70"
                )}
                title={isRecording ? "กำลังฟัง..." : voiceStatus === "processing" ? "น้องกายกำลังวิเคราะห์..." : voiceStatus === "thinking" ? "น้องกายกำลังคิด..." : voiceStatus === "speaking" ? "น้องกายตอบ..." : "กดค้างเพื่อถาม AI"}
              >
                {voiceStatus === "processing" || voiceStatus === "thinking" ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : voiceStatus === "speaking" ? (
                  <Volume2 className="w-5 h-5 text-white" />
                ) : isRecording ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={handlePrevious}
                disabled={currentExercise === 0}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
              >
                {isPaused ? <Play className="w-6 h-6 ml-1" /> : <Pause className="w-6 h-6" />}
              </button>
              <button
                onClick={handleNext}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile View with Camera
  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Screenshot Flash Effect */}
      {showScreenshotFlash && (
        <div className="absolute inset-0 bg-white z-50 animate-flash" />
      )}
      {/* Camera Background */}
      <div className="absolute inset-0">
        {!cameraEnabled ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <CameraOff className="w-16 h-16 text-white/30 mb-4" />
            <p className="text-white/50">กล้องปิดอยู่</p>
          </div>
        ) : cameraError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <CameraOff className="w-16 h-16 text-red-400/50 mb-4" />
            <p className="text-white/50">{cameraError}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
              {/* Skeleton Overlay for Mobile (temporarily disabled for kaya-intermediate diagnostics) */}
            {cameraEnabled && (showSkeleton || showOpticalFlow) && selectedStyleId !== 'kaya-intermediate' && (
              <SkeletonOverlay
                landmarks={landmarks}
                opticalFlowPoints={opticalFlowPoints}
                getFlowHistory={getFlowHistory}
                showSkeleton={showSkeleton}
                showOpticalFlow={showOpticalFlow}
                width={videoDimensions.width}
                height={videoDimensions.height}
                mirrored={true}
              />
            )}
          </>
        )}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={handleStop} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
              <X className="w-5 h-5" />
            </button>
            
            {/* AI Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-orange-400/20 backdrop-blur-sm border border-primary/30">
              <Brain className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-white">AI Active</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>

            <div className="flex items-center gap-2">
              {/* Music Toggle for Mobile */}
              <button 
                onClick={() => setShowMusicPlayer(!showMusicPlayer)}
                className={cn(
                  "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors",
                  showMusicPlayer ? "bg-primary/80 text-white" : "bg-white/10 text-white/60"
                )}
                title={showMusicPlayer ? "ซ่อนเพลง" : "เปิดเพลง"}
              >
                <Music className="w-5 h-5" />
              </button>
              {/* Skeleton Toggle for Mobile */}
              {isKayaWorkout && (
                <button 
                  onClick={() => setShowSkeleton(!showSkeleton)}
                  className={cn(
                    "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors",
                    showSkeleton ? "bg-green-500/80 text-white" : "bg-white/10 text-white/60"
                  )}
                  title={showSkeleton ? "ซ่อนโครงกระดูก" : "แสดงโครงกระดูก"}
                >
                  {showSkeleton ? <Bone className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              )}
              {/* Screenshot Button for Mobile */}
              <button
                onClick={captureScreenshot}
                className="w-10 h-10 rounded-xl bg-pink-500/80 text-white backdrop-blur-sm flex items-center justify-center transition-colors"
                title="ถ่ายรูป"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleCamera}
                className={cn(
                  "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors",
                  cameraEnabled ? "bg-white/10 text-white" : "bg-red-500/20 text-red-400"
                )}
              >
                {cameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
              </button>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                <p className="text-white font-bold text-lg">{formatTime(totalTime)}</p>
              </div>
            </div>
          </div>
          {/* Debug overlay for KAYA intermediate to diagnose black screen */}
          {selectedStyleId === 'kaya-intermediate' && (
            <div className="absolute top-6 right-6 z-50 p-3 bg-white/10 backdrop-blur rounded-lg text-xs text-white border border-white/10">
              <div className="font-medium mb-1">Debug</div>
              <div>cameraEnabled: {String(cameraEnabled)}</div>
              <div>autoplayBlocked: {String(autoplayBlocked)}</div>
              <div>cameraReady: {String(cameraReady)}</div>
              <div>videoReadyState: {videoRef.current?.readyState ?? 'null'}</div>
              <div>landmarks: {landmarks.length}</div>
              <div>opticalFlow: {opticalFlowPoints.length}</div>
              <div>mediaPipeLoading: {String(mediaPipeLoading)}</div>
              <div>mediaPipeError: {String(mediaPipeError ?? '')}</div>
              <div className="mt-2">
                <canvas ref={debugCanvasRef} width={160} height={120} className="border border-white/20" />
              </div>
              <div className="mt-2 text-red-300">{cameraError}</div>
            </div>
          )}

          {/* Music Player for Mobile */}
          {showMusicPlayer && (
            <div className="mt-3">
              <MusicPlayer compact className="text-white" />
            </div>
          )}

          {/* Progress Bar */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-white/60 mt-2 text-center">
            Exercise {currentExercise + 1} of {exercises.length}
          </p>
        </div>

        {/* Spacer to push content down */}
        <div className="flex-1" />

        {/* Main Exercise Display */}
        <div className="px-4 pb-4">
          <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-orange-400/30 flex items-center justify-center text-primary border border-primary/20">
                {exerciseIcons[exercise.icon] || <Dumbbell className="w-12 h-12" />}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
                {exercise.duration ? (
                  <p className="text-white/60">{exercise.duration} seconds</p>
                ) : (
                  <p className="text-white/60">{exercise.reps} reps</p>
                )}
              </div>
              {exercise.duration ? (
                <div className="text-4xl font-bold text-primary font-mono">{timeLeft}s</div>
              ) : (
                <div className="text-4xl font-bold text-primary font-mono">{exercise.reps}</div>
              )}
            </div>

            {/* Progress ring for timed exercises */}
            {exercise.duration && (
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-1000"
                  style={{ width: `${(timeLeft / exercise.duration) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* AI Coach Bubble */}
        {showCoach && (
          <div className="px-4 mb-4 animate-slide-up">
            <div className="bg-gradient-to-r from-white/10 to-primary/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-white">AI Coach</span>
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  </div>
                  <p className="text-sm text-white/80">{coachMessage}</p>
                </div>
                <button onClick={() => setShowCoach(false)} className="text-white/50 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="px-4 pb-8 safe-area-inset-bottom">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={handlePrevious}
              disabled={currentExercise === 0}
            >
              <SkipBack className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-orange-400 shadow-lg shadow-primary/30"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="w-8 h-8 ml-1" /> : <Pause className="w-8 h-8" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={handleNext}
            >
              <SkipForward className="w-6 h-6" />
            </Button>
          </div>

          {isPaused && (
            <p className="text-center text-yellow-400 font-semibold mt-4 animate-pulse">PAUSED</p>
          )}

          {/* Voice Coach Button */}
          <div className="fixed bottom-28 left-4 flex flex-col items-center gap-2">
            <button
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              onTouchStart={startVoiceRecording}
              onTouchEnd={stopVoiceRecording}
              disabled={voiceStatus === "processing" || voiceStatus === "thinking" || voiceStatus === "speaking"}
              className={cn(
                "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
                isRecording 
                  ? "bg-red-500 animate-pulse scale-110" 
                  : voiceStatus === "processing" || voiceStatus === "thinking"
                    ? "bg-yellow-500"
                    : voiceStatus === "speaking"
                      ? "bg-green-500"
                      : "bg-gradient-to-r from-blue-500 to-purple-500",
                (voiceStatus === "processing" || voiceStatus === "thinking" || voiceStatus === "speaking") && "opacity-70"
              )}
            >
              {voiceStatus === "processing" || voiceStatus === "thinking" ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : voiceStatus === "speaking" ? (
                <Volume2 className="w-6 h-6 text-white" />
              ) : isRecording ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>
            <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded-full">
              {isRecording ? "กำลังฟัง..." : 
               voiceStatus === "processing" ? "น้องกายวิเคราะห์..." :
               voiceStatus === "thinking" ? "น้องกายกำลังคิด..." :
               voiceStatus === "speaking" ? "น้องกายตอบ..." :
               "กดค้างเพื่อถาม"}
            </span>
          </div>

          {!showCoach && (
            <button
              onClick={() => setShowCoach(true)}
              className="fixed bottom-28 right-4 w-12 h-12 rounded-full bg-gradient-to-r from-primary to-orange-400 shadow-lg shadow-primary/30 flex items-center justify-center animate-scale-in"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>
      
      {/* CSS for flash animation */}
      <style>{`
        @keyframes flash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}