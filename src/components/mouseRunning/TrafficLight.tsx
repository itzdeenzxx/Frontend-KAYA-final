import { GameState } from '@/types/game';
import { CatIcon } from './icons/CatIcon';

interface TrafficLightProps {
  gameState: GameState;
  isWarning: boolean;
}

export function TrafficLight({ gameState, isWarning }: TrafficLightProps) {
  const isGreen = gameState === 'GREEN_LIGHT';
  const isRed = gameState === 'RED_LIGHT' || gameState === 'HIT';
  const isYellow = isWarning && gameState === 'GREEN_LIGHT';
  const isAngry = isRed;
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Robot Cat Head */}
      <CatIcon className="w-20 h-20 md:w-24 md:h-24" isAngry={isAngry} />
      
      {/* Traffic light body */}
      <div className="bg-muted rounded-xl p-2 flex gap-2 -mt-2 border-4 border-background shadow-lg">
        {/* Green light */}
        <div 
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-300 ${
            isGreen && !isYellow 
              ? 'bg-green-500 shadow-lg shadow-green-500/50' 
              : 'bg-muted-foreground/30'
          }`}
        />
        {/* Yellow light */}
        <div 
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-300 ${
            isYellow 
              ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse' 
              : 'bg-muted-foreground/30'
          }`}
        />
        {/* Red light */}
        <div 
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-300 ${
            isRed 
              ? 'bg-red-500 shadow-lg shadow-red-500/50' 
              : 'bg-muted-foreground/30'
          }`}
        />
      </div>
    </div>
  );
}
