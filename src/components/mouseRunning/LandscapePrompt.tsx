import { useState, useEffect } from 'react';

export function LandscapePrompt() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const mobile = window.innerWidth < 1024;
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(mobile && portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        {/* Rotating phone icon */}
        <div className="mb-6 relative">
          <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto">
            {/* Phone body */}
            <rect 
              x="30" y="15" width="40" height="70" rx="5" 
              fill="hsl(220 25% 20%)" 
              stroke="hsl(142 76% 50%)" 
              strokeWidth="3"
              className="origin-center animate-spin"
              style={{ animationDuration: '3s' }}
            />
            {/* Screen */}
            <rect 
              x="35" y="22" width="30" height="50" rx="2" 
              fill="hsl(220 20% 30%)"
              className="origin-center animate-spin"
              style={{ animationDuration: '3s' }}
            />
            {/* Home button */}
            <circle 
              cx="50" cy="78" r="4" 
              fill="hsl(220 20% 30%)"
              className="origin-center animate-spin"
              style={{ animationDuration: '3s' }}
            />
          </svg>
          
          {/* Rotation arrow */}
          <svg viewBox="0 0 40 40" className="w-10 h-10 absolute top-1/2 right-0 -translate-y-1/2 text-green-500 animate-pulse">
            <path 
              d="M8 20 A12 12 0 1 1 20 32" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
            <path 
              d="M15 28 L20 32 L24 26" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-green-500 mb-3">Rotate Your Device</h2>
        <p className="text-muted-foreground">
          Please rotate your phone to landscape mode for the best gaming experience!
        </p>
        
        {/* Game preview icons */}
        <div className="flex justify-center items-center gap-4 mt-6 opacity-50">
          <svg viewBox="0 0 40 50" className="w-8 h-10">
            <ellipse cx="20" cy="10" rx="12" ry="10" fill="hsl(340 75% 70%)"/>
            <rect x="12" y="20" width="16" height="20" rx="3" fill="hsl(0 85% 55%)"/>
          </svg>
          <svg viewBox="0 0 30 30" className="w-6 h-6">
            <path d="M15 2 L18 12 L28 12 L20 18 L23 28 L15 22 L7 28 L10 18 L2 12 L12 12 Z" fill="hsl(45 100% 55%)"/>
          </svg>
          <svg viewBox="0 0 40 30" className="w-8 h-6">
            <path d="M5 25 L20 5 L35 25 Z" fill="hsl(45 95% 55%)"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
