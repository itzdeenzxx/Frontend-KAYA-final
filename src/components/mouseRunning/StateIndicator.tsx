import { GameState } from '@/types/game';

interface StateIndicatorProps {
  gameState: GameState;
  isWarning: boolean;
}

export function StateIndicator({ gameState, isWarning }: StateIndicatorProps) {
  if (gameState === 'IDLE' || gameState === 'WIN') {
    return null;
  }

  const isGreen = gameState === 'GREEN_LIGHT' && !isWarning;
  const isYellow = isWarning;
  const isRed = gameState === 'RED_LIGHT' || gameState === 'HIT';

  return (
    <div className="absolute top-4 left-4 z-40">
      <div className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold text-lg md:text-2xl transition-all duration-300 border-4 ${
        isGreen 
          ? 'bg-green-500/90 border-green-400 text-white shadow-lg shadow-green-500/50' 
          : isYellow
          ? 'bg-yellow-500/90 border-yellow-400 text-black shadow-lg shadow-yellow-500/50 animate-pulse'
          : 'bg-red-500/90 border-red-400 text-white shadow-lg shadow-red-500/50'
      }`}>
        {isGreen && 'GO! GO! GO!'}
        {isYellow && 'GET READY...'}
        {isRed && 'FREEZE!!!'}
      </div>
    </div>
  );
}
