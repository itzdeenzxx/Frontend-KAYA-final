import { GameState } from '@/types/game';
import { MouseIcon } from './icons/MouseIcon';
import { RocketIcon } from './icons/RocketIcon';

interface MouseCharacterProps {
  position: number;
  isRunning: boolean;
  gameState: GameState;
  side?: 'LEFT' | 'RIGHT' | 'CENTER';
  color?: 'pink' | 'blue';
  rocketPosition?: { x: number; y: number };
}

export function MouseCharacter({ 
  position, 
  isRunning, 
  gameState, 
  side = 'CENTER',
  color = 'pink',
}: MouseCharacterProps) {
  const isHit = gameState === 'HIT';
  const isWin = gameState === 'WIN';
  const isWarning = (gameState === 'RED_LIGHT' || gameState === 'YELLOW_LIGHT') && isRunning;
  
  const yPercent = Math.min(position, 100);
  
  // Position based on side
  const getHorizontalPosition = () => {
    switch (side) {
      case 'LEFT': return '25%';
      case 'RIGHT': return '75%';
      default: return '50%';
    }
  };
  
  return (
    <>
      {/* Rocket attacking when hit - follows mouse position */}
      {isHit && (
        <div 
          className="absolute z-40"
          style={{ 
            bottom: `${10 + yPercent * 0.7}%`,
            left: side === 'LEFT' ? '10%' : side === 'RIGHT' ? '60%' : '30%',
            animation: 'rocketFlyToMouse 1s ease-out forwards'
          }}
        >
          <div className="relative">
            <RocketIcon className="w-16 h-20 rotate-[135deg]" animated />
            {/* Extra exhaust trail */}
            <div className="absolute -left-8 -bottom-4 w-12 h-4 bg-gradient-to-l from-orange-500 via-yellow-400 to-transparent rounded-full opacity-80 animate-pulse" />
            <div className="absolute -left-6 -bottom-2 w-8 h-3 bg-gradient-to-l from-yellow-300 to-transparent rounded-full opacity-60" />
          </div>
        </div>
      )}
      
      <div 
        className={`absolute transform -translate-x-1/2 transition-all duration-200 z-20 ${
          isRunning && (gameState === 'GREEN_LIGHT' || gameState === 'YELLOW_LIGHT') ? 'animate-bounce' : ''
        } ${isWarning ? 'animate-pulse' : ''} ${isWin ? 'animate-bounce' : ''} ${
          isHit ? 'opacity-50' : ''
        }`}
        style={{ 
          bottom: `${10 + yPercent * 0.7}%`,
          left: getHorizontalPosition()
        }}
      >
        <MouseIcon 
          className="w-16 h-22 md:w-20 md:h-28" 
          isRunning={isRunning && (gameState === 'GREEN_LIGHT' || gameState === 'YELLOW_LIGHT')}
          isHit={isHit}
          color={color}
        />
        
        {/* Win sparkles */}
        {isWin && (
          <div className="absolute -inset-6 pointer-events-none">
            <div className="absolute top-0 left-0 w-6 h-6 animate-ping">
              <svg viewBox="0 0 20 20" className="w-full h-full">
                <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="hsl(45 100% 60%)"/>
              </svg>
            </div>
            <div className="absolute top-0 right-0 w-5 h-5 animate-ping" style={{ animationDelay: '200ms' }}>
              <svg viewBox="0 0 20 20" className="w-full h-full">
                <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="hsl(45 100% 70%)"/>
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-4 h-4 animate-ping" style={{ animationDelay: '400ms' }}>
              <svg viewBox="0 0 20 20" className="w-full h-full">
                <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="hsl(142 76% 60%)"/>
              </svg>
            </div>
          </div>
        )}
        
        {/* Player indicator for multiplayer */}
        {side !== 'CENTER' && (
          <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold ${
            color === 'blue' ? 'bg-blue-500/80' : 'bg-pink-500/80'
          }`}>
            P{side === 'LEFT' ? '1' : '2'}
          </div>
        )}
      </div>
    </>
  );
}
