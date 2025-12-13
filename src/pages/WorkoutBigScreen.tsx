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
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  subscribeToSession,
  updateSessionState,
  clearRemoteAction,
  endSession,
  WorkoutSession,
  RemoteAction,
} from '@/lib/session';
import { useMediaPipePose } from '@/hooks/useMediaPipePose';
import { SkeletonOverlay } from '@/components/shared/SkeletonOverlay';
import BigScreenMusicPlayer from '@/components/music/BigScreenMusicPlayer';
import { getWorkoutStyle, getExercisesForStyle, WorkoutExercise } from '@/lib/workoutStyles';

// Map icon names to components
const exerciseIcons: Record<string, React.ReactNode> = {
  run: <PersonStanding className="w-20 h-20" />,
  muscle: <Dumbbell className="w-20 h-20" />,
  leg: <PersonStanding className="w-20 h-20" />,
  weight: <Dumbbell className="w-20 h-20" />,
  fire: <Flame className="w-20 h-20" />,
  yoga: <Heart className="w-20 h-20" />,
};

// Style icons for header
const styleIcons: Record<string, React.ReactNode> = {
  rhythm: <Music className="w-6 h-6" />,
  slow: <Wind className="w-6 h-6" />,
  stretch: <PersonStanding className="w-6 h-6" />,
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

  // Workout state
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [coachMessage, setCoachMessage] = useState(coachMessages[0]);
  
  // Initialize timeLeft when exercises change
  useEffect(() => {
    if (exercises.length > 0 && currentExercise < exercises.length) {
      setTimeLeft(exercises[currentExercise]?.duration || 0);
    }
  }, [exercises, currentExercise]);

  // Video ref for webcam
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string>('');
  
  // Skeleton overlay state
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showOpticalFlow, setShowOpticalFlow] = useState(true);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1920, height: 1080 });
  
  // MediaPipe pose detection
  const { landmarks, opticalFlowPoints, getFlowHistory, isLoading: poseLoading } = useMediaPipePose(
    videoRef,
    { enabled: showSkeleton || showOpticalFlow }
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
      }
    });

    // Set session as active
    updateSessionState(pairingCode, { status: 'active' });

    return () => unsubscribe();
  }, [pairingCode, lastAction, navigate]);

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

  const handleNext = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise((prev) => prev + 1);
      const nextExercise = exercises[currentExercise + 1];
      setTimeLeft(nextExercise.duration || 0);
    } else {
      handleStop();
    }
  };

  const handlePrevious = () => {
    if (currentExercise > 0) {
      setCurrentExercise((prev) => prev - 1);
      const prevExercise = exercises[currentExercise - 1];
      setTimeLeft(prevExercise.duration || 0);
    }
  };

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
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
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
          </>
        )}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        {/* Close Button */}
        <button
          onClick={handleStop}
          className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Skeleton Toggle */}
        <button
          onClick={() => setShowSkeleton(!showSkeleton)}
          className={cn(
            "w-12 h-12 rounded-xl backdrop-blur-sm flex items-center justify-center text-white transition-colors",
            showSkeleton ? "bg-primary/80 hover:bg-primary" : "bg-white/10 hover:bg-white/20"
          )}
          title={showSkeleton ? "ซ่อนโครงกระดูก" : "แสดงโครงกระดูก"}
        >
          {showSkeleton ? <Bone className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
        </button>

        {/* Connection Status */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
          {session?.status === 'active' ? (
            <>
              <Smartphone className="w-5 h-5 text-green-400" />
              <span className="text-white text-sm">Remote Connected</span>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </>
          ) : (
            <>
              <Wifi className="w-5 h-5 text-yellow-400" />
              <span className="text-white text-sm">Waiting for remote...</span>
            </>
          )}
        </div>

        {/* Total Time */}
        <div className="text-white text-2xl font-mono bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
          {formatTime(totalTime)}
        </div>
      </div>

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

      {/* Current Exercise Display */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-white/80 text-sm mb-2">
            <span>Progress</span>
            <span>{currentExercise + 1} / {exercises.length}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-end justify-between gap-8">
          {/* Exercise Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-orange-400/30 backdrop-blur-sm flex items-center justify-center text-primary border border-primary/20">
                {exerciseIcons[exercise.icon]}
              </div>
              <div>
                <p className="text-white/60 text-lg mb-1">Now Playing</p>
                <h1 className="text-5xl font-bold text-white mb-2">{exercise.name}</h1>
                <p className="text-white/60 text-xl mb-1">{exercise.nameTh}</p>
                <p className="text-white/80 text-xl">
                  {exercise.duration ? `${exercise.duration} seconds` : `${exercise.reps ?? 0} reps`}
                </p>
              </div>
            </div>

            {/* Coach Message */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 max-w-md">
              <p className="text-white/90 text-lg">{coachMessage}</p>
            </div>
          </div>

          {/* Timer/Rep Counter */}
          <div className="text-center">
            {exercise.duration ? (
              <div className="relative">
                <svg className="w-48 h-48 -rotate-90">
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
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - timeLeft / (exercise.duration || 1))}
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
                  <span className="text-6xl font-bold text-white font-mono">
                    {timeLeft}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 rounded-full bg-white/10 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl font-bold text-white">
                    {exercise.reps}
                  </span>
                  <p className="text-white/60 text-xl">reps</p>
                </div>
              </div>
            )}

            {/* Play/Pause Status */}
            {isPaused && (
              <div className="mt-4 text-2xl text-yellow-400 font-semibold">
                PAUSED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workout Style & Pairing Code */}
      <div className="absolute top-6 right-1/2 translate-x-1/2 z-10">
        <div className="flex items-center gap-4">
          {/* Workout Style Badge */}
          {selectedStyle && (
            <div className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl backdrop-blur-md border",
              `bg-gradient-to-r ${selectedStyle.bgGradient} border-white/20`
            )}>
              {styleIcons[selectedStyle.id] || <Dumbbell className="w-5 h-5" />}
              <span className="text-base font-semibold text-white">{selectedStyle.name}</span>
            </div>
          )}
          {/* Session Code */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="text-white/60 text-sm">Session Code</p>
            <p className="text-white font-mono font-bold text-xl tracking-widest">
              {pairingCode}
            </p>
          </div>
        </div>
      </div>

      {/* Music Player */}
      <BigScreenMusicPlayer 
        pairingCode={pairingCode}
        musicState={session?.musicState}
      />
    </div>
  );
}
