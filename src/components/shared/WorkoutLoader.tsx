// Workout Loader Component
// Shows loading screen while MediaPipe model is being loaded

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Camera, Cpu, CheckCircle2 } from 'lucide-react';

interface WorkoutLoaderProps {
  onComplete: () => void;
  className?: string;
}

export function WorkoutLoader({ onComplete, className }: WorkoutLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState('กำลังเตรียมกล้อง...');

  const steps = [
    { label: 'เตรียมกล้อง', icon: Camera },
    { label: 'โหลด AI Model', icon: Cpu },
  ];

  // Simulate fast loading progress
  useEffect(() => {
    const duration = 1500; // 1.5 seconds total
    const interval = 30; // Update every 30ms
    const increment = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment + Math.random() * 2; // Add some randomness
        
        // Update step based on progress
        if (next > 30 && currentStep === 0) {
          setCurrentStep(1);
          setMessage('กำลังโหลด AI Model...');
        }
        
        if (next >= 100) {
          clearInterval(timer);
          setMessage('พร้อมแล้ว!');
          // Small delay then complete
          setTimeout(onComplete, 300);
          return 100;
        }
        
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete, currentStep]);

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
            strokeDasharray={`${progress * 3.14} 314`}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dasharray 0.1s ease-out' }}
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
          const isDone = idx < currentStep || (idx === currentStep && progress >= 100);
          const isActive = idx === currentStep && progress < 100;
          
          return (
            <div 
              key={idx}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                isActive && "bg-primary/10 scale-105",
                isDone && "bg-green-500/10",
                !isActive && !isDone && "opacity-50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isActive && "bg-primary/20",
                isDone && "bg-green-500/20",
                !isActive && !isDone && "bg-muted"
              )}>
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <step.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary animate-pulse" : "text-muted-foreground"
                  )} />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium",
                isDone && "text-green-600 dark:text-green-400"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Message */}
      <p className="text-sm text-muted-foreground">{message}</p>

      {/* Progress Percentage */}
      <div className="mt-4 text-2xl font-bold text-primary">
        {Math.round(progress)}%
      </div>

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
