import { CheeseIcon } from './icons/CheeseIcon';
import { LevelTheme } from '@/types/game';

interface CheeseGoalProps {
  progress: number; // This is absolute distance (mousePosition)
  goalDistance?: number;
  side?: 'LEFT' | 'RIGHT' | 'CENTER';
  levelTheme?: LevelTheme;
}

export function CheeseGoal({ progress, goalDistance = 100, side = 'CENTER', levelTheme }: CheeseGoalProps) {
  const percentage = Math.min(100, (progress / goalDistance) * 100);
  const isNear = percentage > 80;
  const pct = Math.round(percentage);
  const primary = levelTheme?.primaryColor || '#fbbf24';
  
  const getHorizontalPosition = () => {
    switch (side) {
      case 'LEFT': return '25%';
      case 'RIGHT': return '75%';
      default: return '50%';
    }
  };
  
  return (
    <div 
      className={`absolute top-2 transform -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-300 ${
        isNear ? 'scale-110' : ''
      }`}
      style={{ left: getHorizontalPosition() }}
    >
      {/* Goal frame */}
      <div className="relative">
        {/* Outer glow when near */}
        {isNear && (
          <div className="absolute -inset-3 rounded-full blur-lg opacity-50"
            style={{ background: `radial-gradient(circle, #fbbf2466, transparent)`, animation: 'goalPulse 1.5s ease-in-out infinite' }} />
        )}

        {/* Hexagonal badge housing */}
        <div className="relative overflow-hidden rounded-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(10,14,30,0.85) 0%, rgba(6,8,20,0.95) 100%)',
            border: isNear ? '2px solid #fbbf2488' : `1.5px solid ${primary}33`,
            boxShadow: isNear
              ? '0 4px 20px rgba(251,191,36,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              : `0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px ${primary}08`,
            padding: '2px',
          }}>
          {/* Top shimmer bar */}
          <div className="absolute top-0 left-2 right-2 h-px" style={{ background: isNear ? 'linear-gradient(90deg, transparent, #fbbf2466, transparent)' : `linear-gradient(90deg, transparent, ${primary}33, transparent)` }} />
          
          <div className="relative flex items-center gap-2 px-3 py-1.5">
            {/* Cheese icon */}
            <div className={isNear ? '' : ''}
              style={{ filter: isNear ? 'drop-shadow(0 0 8px rgba(234,179,8,0.6))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
              <CheeseIcon className="w-8 h-6 md:w-10 md:h-7" />
            </div>

            {/* Progress */}
            <div className="flex flex-col items-end min-w-[40px]">
              <span className="font-black text-sm md:text-base tabular-nums leading-none"
                style={{
                  color: isNear ? '#fbbf24' : primary,
                  textShadow: isNear ? '0 0 10px rgba(251,191,36,0.5)' : `0 0 6px ${primary}33`,
                }}>
                {pct}%
              </span>
              {/* Mini progress bar */}
              <div className="w-full h-1 rounded-full mt-0.5 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    background: isNear
                      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      : `linear-gradient(90deg, ${primary}88, ${primary})`,
                    boxShadow: isNear ? '0 0 6px rgba(251,191,36,0.5)' : `0 0 4px ${primary}44`,
                  }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical guide line from goal to bottom */}
      <div className="w-px h-4 mt-0.5 opacity-20"
        style={{ background: `linear-gradient(180deg, ${primary}66, transparent)` }} />

      <style>{`
        @keyframes goalPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
