import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Vibrate,
  ArrowLeft,
  Wifi,
  WifiOff,
  X,
  Bone,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  subscribeToSession,
  sendRemoteAction,
  WorkoutSession,
} from '@/lib/session';

const exercises = [
  { name: 'Jumping Jacks', duration: 30 },
  { name: 'Push-ups', reps: 15 },
  { name: 'High Knees', duration: 30 },
  { name: 'Squats', reps: 20 },
  { name: 'Burpees', duration: 30 },
  { name: 'Plank', duration: 45 },
];

export default function WorkoutRemote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pairingCode = searchParams.get('code') || localStorage.getItem('kaya_pairing_code') || '';

  // Session state
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Local state
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [lastActionSent, setLastActionSent] = useState<string>('');
  const [skeletonEnabled, setSkeletonEnabled] = useState(true);

  // Subscribe to session updates
  useEffect(() => {
    if (!pairingCode) {
      navigate('/workout-mode');
      return;
    }

    const unsubscribe = subscribeToSession(pairingCode, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);
        setIsConnected(updatedSession.status === 'active' || updatedSession.status === 'connected');

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

  const currentExercise = session?.currentExercise ?? 0;
  const exercise = exercises[currentExercise];
  const progress = ((currentExercise + 1) / exercises.length) * 100;
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
        </div>
      </div>

      {/* Current Exercise Card */}
      <div className="px-6 py-4">
        <div className="gradient-coral rounded-2xl p-6 shadow-coral">
          <p className="text-primary-foreground/80 text-sm mb-1">กำลังเล่น</p>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">
            {exercise?.name || 'Loading...'}
          </h2>
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
            {currentExercise + 1} / {exercises.length}
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

        <div className="flex items-center justify-center gap-4">
          {/* Previous */}
          <Button
            variant="glass"
            size="icon"
            className="w-14 h-14 rounded-full bg-background/10 hover:bg-background/20 border-0"
            onClick={handlePrevious}
            disabled={!isConnected || currentExercise === 0}
          >
            <SkipBack className="w-6 h-6" />
          </Button>

          {/* Volume */}
          <Button
            variant="glass"
            size="icon"
            className="w-14 h-14 rounded-full bg-background/10 hover:bg-background/20 border-0"
          >
            <Volume2 className="w-6 h-6" />
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
            disabled={!isConnected || currentExercise >= exercises.length - 1}
          >
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}