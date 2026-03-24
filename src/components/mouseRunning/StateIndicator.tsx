import { GameState, LevelTheme } from '@/types/game';

interface StateIndicatorProps {
  gameState: GameState;
  isWarning: boolean;
  levelTheme?: LevelTheme;
}

export function StateIndicator({ gameState, isWarning, levelTheme }: StateIndicatorProps) {
  if (gameState === 'IDLE' || gameState === 'WIN') {
    return null;
  }

  const isGreen = gameState === 'GREEN_LIGHT' && !isWarning;
  const isYellow = isWarning;
  const isRed = gameState === 'RED_LIGHT' || gameState === 'HIT';

  const label = isGreen ? 'GO!' : isYellow ? 'READY...' : 'FREEZE!';
  const color = isGreen ? '#22c55e' : isYellow ? '#eab308' : '#ef4444';
  const bgFrom = isGreen ? '#064e3b' : isYellow ? '#713f12' : '#7f1d1d';
  const bgTo = isGreen ? '#052e16' : isYellow ? '#451a03' : '#450a0a';

  return (
    <div className="absolute top-3 left-3 z-40">
      <div className="relative" style={{ animation: isGreen ? 'stateSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' : isRed ? 'stateFlash 0.15s ease-out' : undefined }}>
        {/* Outer glow layer */}
        <div className="absolute -inset-1 rounded-2xl opacity-60 blur-md"
          style={{ background: color }} />

        {/* Main badge */}
        <div className="relative overflow-hidden rounded-2xl" style={{
          background: `linear-gradient(180deg, ${bgFrom} 0%, ${bgTo} 100%)`,
          border: `2px solid ${color}88`,
          boxShadow: `0 4px 0 ${bgTo}, 0 6px 24px ${color}44, inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3)`,
        }}>
          {/* Scanline pattern */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)' }} />
          {/* Horizontal shine */}
          <div className="absolute top-0 left-0 right-0 h-1/2 opacity-10"
            style={{ background: 'linear-gradient(180deg, white, transparent)' }} />

          <div className="relative flex items-center gap-2.5 px-5 py-2.5 md:px-7 md:py-3">
            {/* Pulsing dot */}
            <div className="relative flex items-center justify-center w-3 h-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
              {(isGreen || isRed) && (
                <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: color, opacity: 0.4 }} />
              )}
              {isYellow && (
                <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: color, opacity: 0.5 }} />
              )}
            </div>
            {/* Label */}
            <span className={`font-black text-lg md:text-2xl tracking-[0.15em] uppercase ${isYellow ? 'animate-pulse' : ''}`}
              style={{
                color: isYellow ? '#fef3c7' : '#fff',
                textShadow: `0 0 16px ${color}88, 0 2px 0 rgba(0,0,0,0.4)`,
              }}>
              {label}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes stateSlideIn {
          from { transform: translateX(-20px) scale(0.8); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes stateFlash {
          0% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
