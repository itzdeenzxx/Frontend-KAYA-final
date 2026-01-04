import { CheeseIcon } from './icons/CheeseIcon';
import { SparkleIcon } from './icons/SparkleIcon';

interface CheeseGoalProps {
  progress: number;
  side?: 'LEFT' | 'RIGHT' | 'CENTER';
}

export function CheeseGoal({ progress, side = 'CENTER' }: CheeseGoalProps) {
  const isNear = progress > 80;
  
  const getHorizontalPosition = () => {
    switch (side) {
      case 'LEFT': return '25%';
      case 'RIGHT': return '75%';
      default: return '50%';
    }
  };
  
  return (
    <div 
      className={`absolute top-4 transform -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-300 ${
        isNear ? 'scale-125' : ''
      }`}
      style={{ left: getHorizontalPosition() }}
    >
      {/* Cheese icon */}
      <div className={isNear ? 'animate-bounce' : 'animate-pulse'}>
        <CheeseIcon className="w-14 h-10 md:w-18 md:h-12" />
      </div>
      
      {/* Progress text */}
      <div className="mt-1 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full border-2 border-yellow-500/50">
        <span className="font-bold text-sm md:text-base text-yellow-500">
          {Math.round(progress)}%
        </span>
      </div>
      
      {/* Sparkle effects */}
      {isNear && (
        <div className="absolute -inset-4 pointer-events-none">
          <SparkleIcon className="absolute -top-2 -left-2 w-5 h-5 opacity-80 animate-ping" />
          <div className="absolute top-0 -right-3 w-4 h-4 opacity-60 animate-ping" style={{ animationDelay: '200ms' }}>
            <SparkleIcon className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
