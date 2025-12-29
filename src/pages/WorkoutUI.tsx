import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack, X, Volume2, MessageCircle, Dumbbell, Flame, PersonStanding, Heart, Brain, Sparkles, Target, Zap, Camera, CameraOff, Activity, Bone, EyeOff, Music, Wind, Waves, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaPipePose } from "@/hooks/useMediaPipePose";
import { SkeletonOverlay } from "@/components/shared/SkeletonOverlay";
import { getWorkoutStyle, getExercisesForStyle, WorkoutExercise } from "@/lib/workoutStyles";
import MusicPlayer from "@/components/music/MusicPlayer";

// Map icon names to components
const exerciseIcons: Record<string, React.ReactNode> = {
  run: <PersonStanding className="w-16 h-16" />,
  muscle: <Dumbbell className="w-16 h-16" />,
  leg: <PersonStanding className="w-16 h-16" />,
  weight: <Dumbbell className="w-16 h-16" />,
  fire: <Flame className="w-16 h-16" />,
  yoga: <Heart className="w-16 h-16" />,
};

// Larger icons for big screen
const exerciseIconsLarge: Record<string, React.ReactNode> = {
  run: <PersonStanding className="w-20 h-20" />,
  muscle: <Dumbbell className="w-20 h-20" />,
  leg: <PersonStanding className="w-20 h-20" />,
  weight: <Dumbbell className="w-20 h-20" />,
  fire: <Flame className="w-20 h-20" />,
  yoga: <Heart className="w-20 h-20" />,
};

// Style icons for header
const styleIcons: Record<string, React.ReactNode> = {
  rhythm: <Music className="w-5 h-5" />,
  slow: <Wind className="w-5 h-5" />,
  stretch: <PersonStanding className="w-5 h-5" />,
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

export default function WorkoutUI() {
  const navigate = useNavigate();
  
  // Get selected workout style from localStorage
  const [selectedStyleId] = useState(() => localStorage.getItem('kaya_workout_style'));
  const selectedStyle = getWorkoutStyle(selectedStyleId);
  const exercises = getExercisesForStyle(selectedStyleId);
  
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exercises[0]?.duration || 0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCoach, setShowCoach] = useState(true);
  const [coachMessage, setCoachMessage] = useState(coachMessages[0]);
  const [totalTime, setTotalTime] = useState(0);
  
  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Skeleton overlay state
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showOpticalFlow, setShowOpticalFlow] = useState(true);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1920, height: 1080 });
  
  // Music player state
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  
  // MediaPipe pose detection
  const { landmarks, opticalFlowPoints, getFlowHistory } = useMediaPipePose(
    videoRef,
    { enabled: cameraEnabled && (showSkeleton || showOpticalFlow) }
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

  // Initialize webcam
  useEffect(() => {
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
        setCameraError('');
      } catch (error) {
        console.error('Camera error:', error);
        setCameraError('ไม่สามารถเข้าถึงกล้องได้');
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
  }, [cameraEnabled]);

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

  const handleNext = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise((prev) => prev + 1);
      const nextExercise = exercises[currentExercise + 1];
      setTimeLeft(nextExercise.duration || 0);
    } else {
      navigate("/dashboard");
    }
  };

  const handlePrevious = () => {
    if (currentExercise > 0) {
      setCurrentExercise((prev) => prev - 1);
      const prevExercise = exercises[currentExercise - 1];
      setTimeLeft(prevExercise.duration || 0);
    }
  };

  const handleStop = () => {
    navigate("/dashboard");
  };

  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled);
  };

  const exercise = exercises[currentExercise];
  const progress = ((currentExercise + 1) / exercises.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Desktop/Tablet View with Camera
  if (!isMobile) {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
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
                className="w-full h-full object-cover scale-x-[-1]"
              />
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
            </>
          )}
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

        {/* AI Powered Badge */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-3">
            {/* Workout Style Badge */}
            {selectedStyle && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border",
                `bg-gradient-to-r ${selectedStyle.bgGradient} border-white/20`
              )}>
                {styleIcons[selectedStyle.id] || <Dumbbell className="w-4 h-4" />}
                <span className="text-sm font-medium text-white">{selectedStyle.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-orange-400/20 backdrop-blur-md border border-primary/30">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white">AI Pose Detection Active</span>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
          {/* Close Button */}
          <button
            onClick={handleStop}
            className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* AI Features Indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-white/80 text-sm">Pose Tracking</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-white/80 text-sm">Rep Counter</span>
            </div>
          </div>

          {/* Total Time & Camera Toggle */}
          <div className="flex items-center gap-3">
            {/* Music Toggle */}
            <button
              onClick={() => setShowMusicPlayer(!showMusicPlayer)}
              className={cn(
                "w-12 h-12 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors",
                showMusicPlayer ? "bg-primary/80 text-white hover:bg-primary" : "bg-white/10 text-white/60 hover:bg-white/20"
              )}
              title={showMusicPlayer ? "ซ่อนเพลง" : "เปิดเพลง"}
            >
              <Music className="w-5 h-5" />
            </button>
            {/* Skeleton Toggle */}
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={cn(
                "w-12 h-12 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors",
                showSkeleton ? "bg-primary/80 text-white hover:bg-primary" : "bg-white/10 text-white/60 hover:bg-white/20"
              )}
              title={showSkeleton ? "ซ่อนโครงกระดูก" : "แสดงโครงกระดูก"}
            >
              {showSkeleton ? <Bone className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleCamera}
              className={cn(
                "w-12 h-12 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors",
                cameraEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              )}
            >
              {cameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
            </button>
            <div className="text-white text-2xl font-mono bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              {formatTime(totalTime)}
            </div>
          </div>
        </div>

        {/* Music Player Panel */}
        {showMusicPlayer && (
          <div className="absolute top-24 right-6 z-20 w-80">
            <MusicPlayer className="text-white" />
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
                className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-8">
            {/* Exercise Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-orange-400/30 backdrop-blur-sm flex items-center justify-center text-primary border border-primary/20">
                  {exerciseIconsLarge[exercise.icon]}
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
              {showCoach && (
                <div className="bg-gradient-to-r from-white/10 to-primary/10 backdrop-blur-sm rounded-2xl p-4 max-w-md border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium">AI Coach</span>
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-white/90 text-lg">{coachMessage}</p>
                </div>
              )}
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
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-white/10 to-primary/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <div className="text-center">
                    <span className="text-6xl font-bold text-white">
                      {exercise.reps}
                    </span>
                    <p className="text-white/60 text-xl">reps</p>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={handlePrevious}
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                  disabled={currentExercise === 0}
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-orange-400 flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
                >
                  {isPaused ? <Play className="w-10 h-10 ml-1" /> : <Pause className="w-10 h-10" />}
                </button>
                <button
                  onClick={handleNext}
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              {/* Pause Status */}
              {isPaused && (
                <div className="mt-4 text-2xl text-yellow-400 font-semibold animate-pulse">
                  PAUSED
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile View with Camera
  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
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
            {/* Skeleton Overlay for Mobile */}
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
              <button 
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={cn(
                  "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors",
                  showSkeleton ? "bg-primary/80 text-white" : "bg-white/10 text-white/60"
                )}
                title={showSkeleton ? "ซ่อนโครงกระดูก" : "แสดงโครงกระดูก"}
              >
                {showSkeleton ? <Bone className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
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
    </div>
  );
}