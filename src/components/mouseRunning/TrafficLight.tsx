import { GameState, LevelTheme } from '@/types/game';
import { CatIcon } from './icons/CatIcon';

interface TrafficLightProps {
  gameState: GameState;
  isWarning: boolean;
  levelTheme?: LevelTheme;
  levelId?: string;
}

export function TrafficLight({ gameState, isWarning, levelTheme, levelId = '' }: TrafficLightProps) {
  const isGreen = gameState === 'GREEN_LIGHT';
  const isRed = gameState === 'RED_LIGHT' || gameState === 'HIT';
  const isYellow = isWarning && gameState === 'GREEN_LIGHT';
  const isAngry = isRed;

  const lightData = [
    { active: isGreen && !isYellow, color: '#22c55e', glow: 'rgba(34,197,94,0.8)', label: 'GO' },
    { active: isYellow, color: '#eab308', glow: 'rgba(234,179,8,0.8)', label: 'WAIT', pulse: true },
    { active: isRed, color: '#ef4444', glow: 'rgba(239,68,68,0.8)', label: 'STOP' },
  ];
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Robot Cat Head */}
      <CatIcon className="w-20 h-20 md:w-24 md:h-24" isAngry={isAngry} levelId={levelId} />
      
      {/* Traffic light housing */}
      <div className="relative -mt-2">
        {/* Outer metallic frame */}
        <div className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(180deg, #1c2541 0%, #0b1120 100%)',
            border: `2.5px solid ${levelTheme?.primaryColor ? levelTheme.primaryColor + '44' : '#3b4a6b'}`,
            boxShadow: `0 8px 0 #060b18, 0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 0 rgba(0,0,0,0.4)${levelTheme?.primaryColor ? `, 0 0 30px ${levelTheme.primaryColor}15` : ''}`,
            padding: '3px',
          }}>
          {/* Inner panel */}
          <div className="relative flex gap-3 px-4 py-3 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, #111827 0%, #0a0f1e 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.04)',
            }}>
            {/* Scanline overlay */}
            <div className="absolute inset-0 rounded-xl opacity-[0.04]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px)' }} />

            {lightData.map((light, i) => (
              <div key={i} className="relative">
                {/* Lamp socket ring */}
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, #1e293b, #0f172a)',
                    boxShadow: `inset 0 2px 4px rgba(0,0,0,0.6), inset 0 -1px 2px rgba(255,255,255,0.05), 0 0 0 2px ${light.active ? light.color + '33' : '#1e293b'}`,
                  }}>
                  {/* Bulb */}
                  <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full transition-all duration-200 ${light.pulse && light.active ? 'animate-pulse' : ''}`}
                    style={{
                      background: light.active
                        ? `radial-gradient(circle at 40% 35%, ${light.color}ee, ${light.color}88 60%, ${light.color}55 100%)`
                        : 'radial-gradient(circle at 40% 35%, #1a1a2e, #0d0d1a)',
                      boxShadow: light.active
                        ? `0 0 20px ${light.glow}, 0 0 40px ${light.glow.replace('0.8','0.3')}, inset 0 -3px 6px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.4)`
                        : 'inset 0 2px 6px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(255,255,255,0.02)',
                      border: `1.5px solid ${light.active ? light.color + '88' : '#1e293b'}`,
                    }}>
                    {/* Glass highlight */}
                    {light.active && (
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-full bg-white/50 blur-[1px]" />
                    )}
                  </div>
                </div>
                {/* Under-glow on surface */}
                {light.active && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full blur-md"
                    style={{ background: light.glow, opacity: 0.5 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mounting bracket */}
        <div className="mx-auto w-4 h-3 rounded-b-lg"
          style={{ background: 'linear-gradient(180deg, #1c2541, #0f1729)', boxShadow: '0 2px 0 #060b18' }} />
      </div>
    </div>
  );
}
