// Workout Loader Component
// Shows loading screen while resources (camera, MediaPipe) are being loaded

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Camera, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LoadingStatus {
  cameraReady: boolean;
  mediaPipeReady: boolean;
  cameraError?: string;
}

interface WorkoutLoaderProps {
  status: LoadingStatus;
  onComplete: () => void;
  className?: string;
}

// Timeout after 15 seconds
const LOADING_TIMEOUT = 15000;

export function WorkoutLoader({ status, onComplete, className }: WorkoutLoaderProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState('กำลังเตรียมกล้อง...');
  const [isComplete, setIsComplete] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const animationRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const steps = [
    { id: 'camera', label: 'เตรียมกล้อง', icon: Camera, isReady: status.cameraReady },
    { id: 'mediapipe', label: 'โหลด AI Model', icon: Cpu, isReady: status.mediaPipeReady },
  ];

  // Timeout fallback - allow skipping after 5 seconds (reduced from 15)
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (!isComplete) {
        setTimedOut(true);
        setMessage('กดข้ามเพื่อเริ่มออกกำลังกาย');
      }
    }, 5000); // 5 seconds

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isComplete]);

  // Smooth progress animation based on actual status
  useEffect(() => {
    // If camera ready, complete immediately (don't wait for MediaPipe)
    if (status.cameraReady && !isComplete) {
      setCurrentStep(1);
      setIsComplete(true);
      setMessage('พร้อมแล้ว!');
      setTimeout(onComplete, 500);
      return;
    }

    // Smooth animation to target
    const animate = () => {
      setDisplayProgress(prev => {
        // If not camera ready yet, slowly creep to 90%
        if (!status.cameraReady) {
          const next = prev + 0.5;
          return Math.min(next, 90);
        }
        
        // If camera ready, go to 100
        if (status.cameraReady) {
          const diff = 100 - prev;
          if (diff < 0.5) return 100;
          return prev + diff * 0.2;
        }
        
        return prev;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status.cameraReady, status.mediaPipeReady, currentStep, isComplete, onComplete]);

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-orange-500/10 via-background to-red-500/10",
      className
    )}>
      {/* Animated Fitness Person */}
      <div className="relative w-48 h-48 mb-8">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Progress Circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            className="stroke-primary/20"
            strokeWidth="3"
            strokeDasharray="8 4"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            className="stroke-primary"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${displayProgress * 3.14} 314`}
            transform="rotate(-90 60 60)"
          />
          
          {/* Running Person in Center */}
          <g className="workout-person" transform="translate(35, 25)">
            <circle cx="25" cy="10" r="7" className="fill-primary" />
            <line x1="25" y1="17" x2="25" y2="40" className="stroke-primary" strokeWidth="4" strokeLinecap="round" />
            <g className="workout-arms">
              <line x1="25" y1="22" x2="12" y2="32" className="stroke-primary workout-left-arm" strokeWidth="3" strokeLinecap="round" />
              <line x1="25" y1="22" x2="38" y2="28" className="stroke-primary workout-right-arm" strokeWidth="3" strokeLinecap="round" />
            </g>
            <g className="workout-legs">
              <line x1="25" y1="40" x2="15" y2="58" className="stroke-primary workout-left-leg" strokeWidth="3" strokeLinecap="round" />
              <line x1="25" y1="40" x2="35" y2="55" className="stroke-primary workout-right-leg" strokeWidth="3" strokeLinecap="round" />
            </g>
          </g>
          
          {/* Energy Particles */}
          <circle cx="30" cy="30" r="2" className="fill-yellow-400 energy-dot" style={{ animationDelay: '0s' }} />
          <circle cx="90" cy="40" r="2" className="fill-orange-400 energy-dot" style={{ animationDelay: '0.3s' }} />
          <circle cx="80" cy="85" r="2" className="fill-red-400 energy-dot" style={{ animationDelay: '0.6s' }} />
          <circle cx="35" cy="80" r="2" className="fill-pink-400 energy-dot" style={{ animationDelay: '0.9s' }} />
        </svg>
      </div>

      {/* Loading Steps */}
      <div className="w-72 space-y-3 mb-6">
        {steps.map((step, idx) => {
          const isDone = step.isReady;
          const isActive = idx === currentStep && !step.isReady;
          const isPending = idx > currentStep;
          
          return (
            <div 
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-500",
                isActive && "bg-primary/10 scale-105",
                isDone && "bg-green-500/10",
                isPending && "opacity-40"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                isActive && "bg-primary/20",
                isDone && "bg-green-500/20",
                isPending && "bg-muted"
              )}>
                {isDone ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <step.icon className={cn(
                    "w-6 h-6 transition-all",
                    isActive ? "text-primary animate-pulse" : "text-muted-foreground"
                  )} />
                )}
              </div>
              <div className="flex-1">
                <span className={cn(
                  "text-sm font-medium block",
                  isDone && "text-green-600 dark:text-green-400",
                  isActive && "text-primary"
                )}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-xs text-muted-foreground">กำลังดำเนินการ...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Message */}
      <p className={cn(
        "text-sm transition-all duration-300",
        isComplete ? "text-green-500 font-medium" : "text-muted-foreground"
      )}>
        {message}
      </p>

      {/* Progress Percentage */}
      <div className="mt-4 text-3xl font-bold text-primary tabular-nums">
        {Math.round(displayProgress)}%
      </div>

      {/* Skip Button (shows after timeout or error) */}
      {(timedOut || status.cameraError) && (
        <Button 
          onClick={onComplete}
          className="mt-4"
          variant="outline"
        >
          {status.cameraError ? 'ดำเนินการต่อโดยไม่ใช้กล้อง' : 'ข้ามและเริ่มออกกำลังกาย'}
        </Button>
      )}

      {/* Error message */}
      {status.cameraError && (
        <div className="mt-4 flex items-center gap-2 text-yellow-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{status.cameraError}</span>
        </div>
      )}

      {/* Tip */}
      <p className="mt-6 text-xs text-muted-foreground/60 max-w-xs text-center">
        💡 ยืนให้ห่างจากกล้องประมาณ 1.5-2 เมตร เพื่อให้ AI มองเห็นท่าทางได้ชัดเจน
      </p>

      {/* CSS Animations */}
      <style>{`
        .workout-person {
          animation: person-bounce 0.5s ease-in-out infinite;
        }
        
        @keyframes person-bounce {
          0%, 100% { transform: translate(35px, 25px) translateY(0); }
          50% { transform: translate(35px, 25px) translateY(-3px); }
        }
        
        .workout-left-arm {
          transform-origin: 25px 22px;
          animation: arm-swing 0.4s ease-in-out infinite alternate;
        }
        
        .workout-right-arm {
          transform-origin: 25px 22px;
          animation: arm-swing 0.4s ease-in-out infinite alternate-reverse;
        }
        
        @keyframes arm-swing {
          0% { transform: rotate(-25deg); }
          100% { transform: rotate(25deg); }
        }
        
        .workout-left-leg {
          transform-origin: 25px 40px;
          animation: leg-swing 0.4s ease-in-out infinite alternate;
        }
        
        .workout-right-leg {
          transform-origin: 25px 40px;
          animation: leg-swing 0.4s ease-in-out infinite alternate-reverse;
        }
        
        @keyframes leg-swing {
          0% { transform: rotate(20deg); }
          100% { transform: rotate(-20deg); }
        }
        
        .energy-dot {
          animation: energy-float 1.5s ease-in-out infinite;
        }
        
        @keyframes energy-float {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}

export default WorkoutLoader;
