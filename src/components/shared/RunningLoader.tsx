// Running Person Loader Component
// SVG animation of a person running for loading screens

import { cn } from '@/lib/utils';

interface RunningLoaderProps {
  message?: string;
  progress?: number;
  className?: string;
}

export function RunningLoader({ message = 'กำลังโหลด...', progress, className }: RunningLoaderProps) {
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10",
      className
    )}>
      {/* Running Person SVG Animation */}
      <div className="relative w-48 h-48 mb-8">
        {/* Ground/Track */}
        <div className="absolute bottom-8 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full" />
        
        {/* Running Person */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full running-person"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head */}
          <circle
            cx="50"
            cy="25"
            r="8"
            className="fill-primary"
          />
          
          {/* Body */}
          <line
            x1="50"
            y1="33"
            x2="50"
            y2="55"
            className="stroke-primary"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Arms - animated */}
          <g className="arms">
            {/* Left Arm */}
            <line
              x1="50"
              y1="38"
              x2="35"
              y2="50"
              className="stroke-primary left-arm"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Right Arm */}
            <line
              x1="50"
              y1="38"
              x2="65"
              y2="45"
              className="stroke-primary right-arm"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          
          {/* Legs - animated */}
          <g className="legs">
            {/* Left Leg */}
            <line
              x1="50"
              y1="55"
              x2="35"
              y2="75"
              className="stroke-primary left-leg"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Right Leg */}
            <line
              x1="50"
              y1="55"
              x2="65"
              y2="70"
              className="stroke-primary right-leg"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        </svg>
        
        {/* Motion Lines */}
        <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 space-y-2">
          <div className="motion-line w-8 h-0.5 bg-primary/40 rounded-full" style={{ animationDelay: '0ms' }} />
          <div className="motion-line w-6 h-0.5 bg-primary/30 rounded-full" style={{ animationDelay: '100ms' }} />
          <div className="motion-line w-4 h-0.5 bg-primary/20 rounded-full" style={{ animationDelay: '200ms' }} />
        </div>
        
        {/* Dust Particles */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="dust-particle w-2 h-2 bg-primary/20 rounded-full" style={{ animationDelay: '0ms' }} />
          <div className="dust-particle w-1.5 h-1.5 bg-primary/15 rounded-full absolute -left-3" style={{ animationDelay: '150ms' }} />
          <div className="dust-particle w-1 h-1 bg-primary/10 rounded-full absolute -left-5" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{message}</h2>
        
        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {/* Loading Dots */}
        <div className="flex justify-center gap-1">
          <span className="loading-dot w-2 h-2 bg-primary rounded-full" style={{ animationDelay: '0ms' }} />
          <span className="loading-dot w-2 h-2 bg-primary rounded-full" style={{ animationDelay: '150ms' }} />
          <span className="loading-dot w-2 h-2 bg-primary rounded-full" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        .running-person {
          animation: bounce 0.5s ease-in-out infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .left-arm {
          transform-origin: 50px 38px;
          animation: swing-left-arm 0.4s ease-in-out infinite alternate;
        }
        
        .right-arm {
          transform-origin: 50px 38px;
          animation: swing-right-arm 0.4s ease-in-out infinite alternate;
        }
        
        @keyframes swing-left-arm {
          0% { transform: rotate(-20deg); }
          100% { transform: rotate(30deg); }
        }
        
        @keyframes swing-right-arm {
          0% { transform: rotate(20deg); }
          100% { transform: rotate(-30deg); }
        }
        
        .left-leg {
          transform-origin: 50px 55px;
          animation: swing-left-leg 0.4s ease-in-out infinite alternate;
        }
        
        .right-leg {
          transform-origin: 50px 55px;
          animation: swing-right-leg 0.4s ease-in-out infinite alternate;
        }
        
        @keyframes swing-left-leg {
          0% { transform: rotate(30deg); }
          100% { transform: rotate(-20deg); }
        }
        
        @keyframes swing-right-leg {
          0% { transform: rotate(-30deg); }
          100% { transform: rotate(20deg); }
        }
        
        .motion-line {
          animation: motion-fade 0.6s ease-in-out infinite;
        }
        
        @keyframes motion-fade {
          0%, 100% { opacity: 0.2; transform: translateX(0); }
          50% { opacity: 0.6; transform: translateX(-10px); }
        }
        
        .dust-particle {
          animation: dust-rise 0.8s ease-out infinite;
        }
        
        @keyframes dust-rise {
          0% { opacity: 0.5; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-15px) translateX(-10px) scale(0.5); }
        }
        
        .loading-dot {
          animation: dot-pulse 1s ease-in-out infinite;
        }
        
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export default RunningLoader;
