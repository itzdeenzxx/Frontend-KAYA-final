import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  SkipForward, 
  X, 
  Volume2, 
  Dumbbell, 
  Flame, 
  PersonStanding, 
  Heart,
  Smartphone,
  Wifi,
  Bone,
  EyeOff,
  Music,
  Wind,
  Waves,
  Footprints,
  Brain,
  Target,
  ArrowUp,
  RotateCcw,
  ArrowUpFromLine,
  Activity,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  subscribeToSession,
  updateSessionState,
  clearRemoteAction,
  clearTTSState,
  updateRepsCount,
  endSession,
  WorkoutSession,
  RemoteAction,
} from '@/lib/session';
import { useMediaPipePose } from '@/hooks/useMediaPipePose';
import { SkeletonOverlay } from '@/components/shared/SkeletonOverlay';
import BigScreenMusicPlayer from '@/components/music/BigScreenMusicPlayer';
import { getWorkoutStyle, getExercisesForStyle, WorkoutExercise } from '@/lib/workoutStyles';
import { useExerciseAnalysis } from '@/hooks/useExerciseAnalysis';
import { VisualPoseGuide, StageIndicator, BeatCounter } from '@/components/workout/VisualPoseGuide';
import { AICoachPopup } from '@/components/workout/AICoachPopup';
import { ExerciseType } from '@/lib/exerciseConfig';

// Map icon names to components
const exerciseIcons: Record<string, React.ReactNode> = {
  run: <PersonStanding className="w-20 h-20" />,
  muscle: <Dumbbell className="w-20 h-20" />,
  leg: <PersonStanding className="w-20 h-20" />,
  weight: <Dumbbell className="w-20 h-20" />,
  fire: <Flame className="w-20 h-20" />,
  yoga: <Heart className="w-20 h-20" />,
  'kaya-arm': <ArrowUp className="w-20 h-20" />,
  'kaya-torso': <RotateCcw className="w-20 h-20" />,
  'kaya-knee': <ArrowUpFromLine className="w-20 h-20" />,
};

// Style icons for header
const styleIcons: Record<string, React.ReactNode> = {
  rhythm: <Music className="w-6 h-6" />,
  slow: <Wind className="w-6 h-6" />,
  stretch: <PersonStanding className="w-6 h-6" />,
  'kaya-stretch': <Target className="w-6 h-6" />,
  'kaya-intermediate': <Target className="w-6 h-6" />,
  hiit: <Flame className="w-6 h-6" />,
  strength: <Dumbbell className="w-6 h-6" />,
  cardio: <Heart className="w-6 h-6" />,
  yoga: <Waves className="w-6 h-6" />,
  dance: <Footprints className="w-6 h-6" />,
  'ai-personalized': <Brain className="w-6 h-6" />,
};

const coachMessages = [
  'ทำได้ดีมาก! เกร็งกล้ามเนื้อแกนกลางไว้!',
  'เยี่ยมไปเลย! สู้ๆ อีกนิด!',
  'เกือบเสร็จแล้ว! อย่ายอมแพ้!',
  'จังหวะดีมาก! ทำต่อไป!',
  'อย่าลืมหายใจให้สม่ำเสมอ!',
];

// Voice status type for display
type VoiceStatus = "idle" | "processing" | "thinking" | "speaking";

export default function WorkoutBigScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pairingCode = searchParams.get('code') || '';

  // Session state - will contain workout style from remote
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [lastAction, setLastAction] = useState<RemoteAction | null>(null);
  const [showActionIndicator, setShowActionIndicator] = useState(false);

  // Get selected workout style from session (sent by mobile) or fallback to localStorage
  const selectedStyleId = session?.workoutStyle || localStorage.getItem('kaya_workout_style');
  const selectedStyle = getWorkoutStyle(selectedStyleId);
  const exercises = getExercisesForStyle(selectedStyleId);

  // Check if this is a KAYA workout (treat intermediate the same as kaya-stretch)
  const isKayaWorkout = selectedStyleId === 'kaya-stretch' || selectedStyleId === 'kaya-intermediate';

  // Workout state
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [coachMessage, setCoachMessage] = useState(coachMessages[0]);
  
  // Visual guide state for KAYA - hidden by default for clean UI
  const [showVisualGuide, setShowVisualGuide] = useState(false);
  
  // Voice/TTS state
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastTtsTimestampRef = useRef<number>(0);
  
  // Rep counter animation state
  const [showRepCounter, setShowRepCounter] = useState(false);
  const [displayRep, setDisplayRep] = useState(0);
  const lastRepRef = useRef(0);
  
  // Initialize timeLeft when exercises change
  useEffect(() => {
    if (exercises.length > 0 && currentExercise < exercises.length) {
      setTimeLeft(exercises[currentExercise]?.duration || 0);
    }
  }, [exercises, currentExercise]);

  // Video ref for webcam
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  
  // Skeleton overlay state - hidden by default for clean UI
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showOpticalFlow, setShowOpticalFlow] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1920, height: 1080 });
  
  // MediaPipe pose detection
  const { landmarks, opticalFlowPoints, getFlowHistory, isLoading: poseLoading } = useMediaPipePose(
    videoRef,
    { enabled: showSkeleton || showOpticalFlow || isKayaWorkout }
  );

  // Current KAYA exercise type
  const currentKayaExercise = exercises[currentExercise]?.kayaExercise as ExerciseType | undefined;
  
  // KAYA exercise analysis hook
  const kayaAnalysis = useExerciseAnalysis(
    isKayaWorkout ? landmarks : [],
    {
      enabled: isKayaWorkout && !!currentKayaExercise,
      difficulty: 'beginner',
      exerciseType: currentKayaExercise,
    }
  );

  // Initialize webcam
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'user',
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Ensure video plays
          try {
            await videoRef.current.play();
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
            console.log('BigScreen video playing');
            setAutoplayBlocked(false);
          } catch (playError) {
            console.log('BigScreen auto-play blocked');
            setAutoplayBlocked(true);
          }

          // Track video dimensions when metadata loads
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              setVideoDimensions({
                width: videoRef.current.videoWidth || 1920,
                height: videoRef.current.videoHeight || 1080,
              });
            }
          };
        }
      } catch (error) {
        console.error('Camera error:', error);
        setCameraError('ไม่สามารถเข้าถึงกล้องได้');
      }
    };

    startCamera();
    
    // Update dimensions on window resize
    const handleResize = () => {
      if (videoRef.current) {
        setVideoDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
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
  }, []);

  // Subscribe to session updates
  useEffect(() => {
    if (!pairingCode) return;

    const unsubscribe = subscribeToSession(pairingCode, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);

        // Handle remote actions
        if (updatedSession.remoteAction && 
            updatedSession.remoteAction.timestamp !== lastAction?.timestamp) {
          handleRemoteAction(updatedSession.remoteAction);
          setLastAction(updatedSession.remoteAction);
        }

        // Check if session ended
        if (updatedSession.status === 'ended') {
          navigate('/dashboard');
        }
        
        // Handle TTS from remote
        if (updatedSession.ttsState && 
            updatedSession.ttsState.timestamp !== lastTtsTimestampRef.current &&
            updatedSession.ttsState.audioBase64) {
          console.log('BigScreen: Received TTS from remote, timestamp:', updatedSession.ttsState.timestamp);
          lastTtsTimestampRef.current = updatedSession.ttsState.timestamp;
          playTTSAudio(updatedSession.ttsState.audioBase64);
        }
      }
    });

    // Set session as active
    updateSessionState(pairingCode, { status: 'active' });

    return () => unsubscribe();
  }, [pairingCode, lastAction, navigate]);

  // Play TTS audio from base64
  const playTTSAudio = useCallback(async (audioBase64: string) => {
    console.log('BigScreen playTTSAudio: audio length=', audioBase64.length);
    try {
      setVoiceStatus("speaking");
      
      // Stop any existing audio
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      
      // Convert base64 to audio
      console.log('BigScreen: Converting base64 to audio...');
      const audioData = atob(audioBase64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('BigScreen: Audio blob created, size:', audioBlob.size);
      
      const audio = new Audio(audioUrl);
      ttsAudioRef.current = audio;
      
      audio.onended = async () => {
        URL.revokeObjectURL(audioUrl);
        ttsAudioRef.current = null;
        setVoiceStatus("idle");
        
        // Clear TTS state after playing
        if (pairingCode) {
          await clearTTSState(pairingCode);
        }
      };
      
      audio.onerror = (e) => {
        console.error('BigScreen: Audio play error:', e);
        setVoiceStatus("idle");
      };
      
      console.log('BigScreen: Playing audio...');
      await audio.play();
      console.log('BigScreen: Audio started playing');
    } catch (error) {
      console.error('Failed to play TTS audio:', error);
      setVoiceStatus("idle");
    }
  }, [pairingCode]);

  // Handle remote actions
  const handleRemoteAction = useCallback(async (action: RemoteAction) => {
    setShowActionIndicator(true);
    setTimeout(() => setShowActionIndicator(false), 1000);

    switch (action.type) {
      case 'play':
        setIsPaused(false);
        break;
      case 'pause':
        setIsPaused(true);
        break;
      case 'next':
        handleNext();
        break;
      case 'previous':
        handlePrevious();
        break;
      case 'end':
        handleStop();
        break;
      case 'toggleSkeleton':
        setShowSkeleton((prev) => !prev);
        break;
    }

    // Clear the action after processing
    if (pairingCode) {
      await clearRemoteAction(pairingCode);
    }
  }, [pairingCode]);

  // Timer effect
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

  // Coach message rotation
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCoachMessage(coachMessages[Math.floor(Math.random() * coachMessages.length)]);
    }, 8000);

    return () => clearInterval(messageInterval);
  }, []);

  // Sync state with session
  useEffect(() => {
    if (pairingCode) {
      updateSessionState(pairingCode, {
        currentExercise,
        isPaused,
      });
    }
  }, [currentExercise, isPaused, pairingCode]);

  // Update reps count to session for Remote to display
  useEffect(() => {
    if (isKayaWorkout && pairingCode && kayaAnalysis.reps > 0) {
      updateRepsCount(pairingCode, kayaAnalysis.reps);
    }
  }, [isKayaWorkout, pairingCode, kayaAnalysis.reps]);

  // Show rep counter animation when rep increases
  useEffect(() => {
    const targetReps = exercises[currentExercise]?.reps || 10;
    
    if (isKayaWorkout && kayaAnalysis.reps > lastRepRef.current && kayaAnalysis.reps > 0 && kayaAnalysis.reps <= targetReps) {
      setDisplayRep(kayaAnalysis.reps);
      setShowRepCounter(true);
      
      // Hide after animation
      const timeout = setTimeout(() => {
        setShowRepCounter(false);
      }, 800);
      
      lastRepRef.current = kayaAnalysis.reps;
      return () => clearTimeout(timeout);
    }
  }, [isKayaWorkout, kayaAnalysis.reps, currentExercise, exercises]);

  // Reset lastRepRef when exercise changes
  useEffect(() => {
    lastRepRef.current = 0;
  }, [currentExercise]);

  // Auto-advance when KAYA exercise reps are complete
  useEffect(() => {
    if (isKayaWorkout && kayaAnalysis.reps >= (exercises[currentExercise]?.reps || 10)) {
      const timeout = setTimeout(() => {
        if (currentExercise < exercises.length - 1) {
          kayaAnalysis.nextExercise();
          setCurrentExercise((prev) => prev + 1);
        } else {
          handleStop();
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isKayaWorkout, kayaAnalysis.reps, currentExercise, exercises]);

  const handleNext = useCallback(() => {
    if (currentExercise < exercises.length - 1) {
      if (isKayaWorkout) {
        kayaAnalysis.nextExercise();
      }
      setCurrentExercise((prev) => prev + 1);
      const nextExercise = exercises[currentExercise + 1];
      setTimeLeft(nextExercise.duration || 0);
    } else {
      handleStop();
    }
  }, [currentExercise, exercises, isKayaWorkout, kayaAnalysis]);

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

  const handleStop = async () => {
    if (pairingCode) {
      await endSession(pairingCode);
    }
    navigate('/dashboard');
  };

  const exercise = exercises[currentExercise];
  const progress = ((currentExercise + 1) / exercises.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Fullscreen Camera View */}
      <div className="absolute inset-0">
        {cameraError ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <p className="text-white text-xl">{cameraError}</p>
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
            {/* Skeleton Overlay */}
            {(showSkeleton || showOpticalFlow) && (
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
            {isKayaWorkout && showVisualGuide && currentKayaExercise && (
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

      {/* KAYA Beat Counter */}
      {isKayaWorkout && kayaAnalysis.tempoAnalysis && (
        <div className="absolute top-24 right-24 z-20">
          <BeatCounter
            beatCount={kayaAnalysis.tempoAnalysis.beatCount}
            tempoQuality={kayaAnalysis.tempoAnalysis.tempoQuality}
          />
        </div>
      )}

      {/* Rep Counter Animation - Big number popup */}
      {showRepCounter && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="animate-rep-popup">
            <span className="text-[200px] font-black text-primary drop-shadow-2xl" style={{
              textShadow: '0 0 80px rgba(221, 110, 83, 0.8), 0 0 160px rgba(221, 110, 83, 0.4)'
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

        {/* Right side - Connection & Controls */}
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
            {session?.status === 'active' || session?.status === 'connected' ? (
              <>
                <Smartphone className="w-4 h-4 text-green-400" />
                <span className="text-white text-xs">Connected</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-yellow-400" />
                <span className="text-white text-xs">Waiting...</span>
              </>
            )}
          </div>
          
          {/* Session Code */}
          <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="text-white font-mono text-xs tracking-widest">{pairingCode}</span>
          </div>

          {/* Time */}
          <div className="text-white text-lg font-mono bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
            {formatTime(totalTime)}
          </div>
          
          {/* Skeleton Toggle */}
          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={cn(
              "w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors",
              showSkeleton ? "bg-primary text-white" : "bg-black/30 text-white/70 hover:bg-black/50"
            )}
          >
            {showSkeleton ? <Bone className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          
          {/* Visual Guide Toggle (KAYA only) */}
          {isKayaWorkout && (
            <button
              onClick={() => setShowVisualGuide(!showVisualGuide)}
              className={cn(
                "w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors",
                showVisualGuide ? "bg-primary text-white" : "bg-black/30 text-white/70 hover:bg-black/50"
              )}
            >
              <Target className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Voice Status Indicator - Top Center */}
      {voiceStatus !== "idle" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className={cn(
            "px-6 py-3 rounded-full backdrop-blur-md text-lg font-medium inline-flex items-center gap-3",
            voiceStatus === "processing" && "bg-yellow-500/80 text-white",
            voiceStatus === "thinking" && "bg-blue-500/80 text-white",
            voiceStatus === "speaking" && "bg-green-500/80 text-white"
          )}>
            {voiceStatus === "processing" && (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                น้องกายกำลังวิเคราะห์...
              </>
            )}
            {voiceStatus === "thinking" && (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                น้องกายกำลังคิด...
              </>
            )}
            {voiceStatus === "speaking" && (
              <>
                <Volume2 className="w-5 h-5" />
                น้องกายกำลังพูด...
              </>
            )}
          </div>
        </div>
      )}

      {/* Remote Action Indicator */}
      {showActionIndicator && lastAction && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white/20 backdrop-blur-md rounded-3xl p-8 animate-pulse">
            {lastAction.type === 'play' && <Play className="w-24 h-24 text-white" />}
            {lastAction.type === 'pause' && <Pause className="w-24 h-24 text-white" />}
            {lastAction.type === 'next' && <SkipForward className="w-24 h-24 text-white" />}
          </div>
        </div>
      )}

      {/* Current Exercise Display - Simplified like WorkoutUI */}
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
            <div className="flex items-center gap-4 mb-3">
              <div className="w-20 h-20 rounded-xl bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30">
                <Activity className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{exercise?.nameTh || exercise?.name}</h2>
                {isKayaWorkout ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-4xl font-bold text-primary">{Math.min(kayaAnalysis.reps, exercise?.reps || 10)}</span>
                    <span className="text-white/60 text-lg">/ {exercise?.reps || 10} ครั้ง</span>
                  </div>
                ) : (
                  <p className="text-white/60 text-lg">
                    {exercise?.duration ? `${formatTime(timeLeft)} เหลือ` : `${exercise?.reps} ครั้ง`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Timer/Rep Counter Ring */}
          <div className="text-center">
            {exercise?.duration ? (
              <div className="relative">
                <svg className="w-32 h-32 -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="white"
                    strokeOpacity="0.2"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - timeLeft / (exercise.duration || 1))}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#dd6e53" />
                      <stop offset="100%" stopColor="#ef8b6c" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white font-mono">
                    {timeLeft}
                  </span>
                </div>
              </div>
            ) : isKayaWorkout ? (
              <div className="relative">
                <svg className="w-32 h-32 -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="white"
                    strokeOpacity="0.2"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - kayaAnalysis.reps / (exercise?.reps || 10))}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {kayaAnalysis.reps}
                  </span>
                  <p className="text-white/60 text-sm">/ {exercise?.reps}</p>
                </div>
              </div>
            ) : null}

            {/* Pause Status */}
            {isPaused && (
              <div className="mt-2 text-lg text-yellow-400 font-semibold">
                PAUSED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Music Player */}
      <BigScreenMusicPlayer 
        pairingCode={pairingCode}
        musicState={session?.musicState}
      />
      
      {/* CSS for rep counter animation */}
      <style>{`
        @keyframes rep-popup {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-rep-popup {
          animation: rep-popup 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
