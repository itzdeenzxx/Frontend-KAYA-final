import { StepsIcon } from './icons/StepsIcon';
import { StarIcon } from './icons/StarIcon';
import { TimerIcon } from './icons/TimerIcon';
import { RunningPersonIcon } from './icons/RunningPersonIcon';
import { RocketIcon } from './icons/RocketIcon';

interface GameUIProps {
  steps: number;
  score: number;
  isRunning: boolean;
  elapsedTime: number;
  hitCount: number;
  player2Score?: number;
  player2Steps?: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function GameUI({ steps, score, isRunning, elapsedTime, hitCount, player2Score, player2Steps }: GameUIProps) {
  const isMultiplayer = player2Score !== undefined;
  
  return (
    <div className="absolute top-4 right-16 flex flex-col gap-2 z-30">
      {/* Timer */}
      <div className="bg-background/80 backdrop-blur-sm rounded-xl p-2 border-2 border-blue-500/30">
        <div className="flex items-center gap-2">
          <TimerIcon className="w-5 h-5" />
          <p className="text-lg font-bold text-blue-400">{formatTime(elapsedTime)}</p>
        </div>
      </div>
      
      {/* Player 1 Stats */}
      <div className={`bg-background/80 backdrop-blur-sm rounded-xl p-2 border-2 ${isMultiplayer ? 'border-blue-500/50' : 'border-green-500/30'}`}>
        <div className="flex items-center gap-2">
          {isMultiplayer && <span className="text-xs text-blue-400 font-bold">P1</span>}
          <StepsIcon className="w-5 h-5" />
          <p className="text-lg font-bold text-green-500">{steps}</p>
        </div>
      </div>
      
      <div className={`bg-background/80 backdrop-blur-sm rounded-xl p-2 border-2 ${isMultiplayer ? 'border-blue-500/50' : 'border-yellow-500/30'}`}>
        <div className="flex items-center gap-2">
          {isMultiplayer && <span className="text-xs text-blue-400 font-bold">P1</span>}
          <StarIcon className="w-5 h-5" />
          <p className="text-lg font-bold text-yellow-500">{score}</p>
        </div>
      </div>
      
      {/* Player 2 Stats */}
      {isMultiplayer && (
        <>
          <div className="bg-background/80 backdrop-blur-sm rounded-xl p-2 border-2 border-pink-500/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-pink-400 font-bold">P2</span>
              <StepsIcon className="w-5 h-5" />
              <p className="text-lg font-bold text-green-500">{player2Steps}</p>
            </div>
          </div>
          <div className="bg-background/80 backdrop-blur-sm rounded-xl p-2 border-2 border-pink-500/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-pink-400 font-bold">P2</span>
              <StarIcon className="w-5 h-5" />
              <p className="text-lg font-bold text-yellow-500">{player2Score}</p>
            </div>
          </div>
        </>
      )}
      
      {/* Hit count */}
      {hitCount > 0 && (
        <div className="bg-background/80 backdrop-blur-sm rounded-xl p-2 border-2 border-red-500/30">
          <div className="flex items-center gap-2">
            <RocketIcon className="w-5 h-6" />
            <p className="text-lg font-bold text-red-500">{hitCount}</p>
          </div>
        </div>
      )}
      
      {/* Running indicator */}
      {!isMultiplayer && (
        <div className={`rounded-xl p-2 border-2 transition-all duration-200 ${
          isRunning 
            ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/30' 
            : 'bg-background/80 backdrop-blur-sm border-muted'
        }`}>
          <div className="flex items-center gap-2">
            <RunningPersonIcon className="w-5 h-7" isRunning={isRunning} />
            <p className={`text-xs font-bold ${isRunning ? 'text-green-500' : 'text-muted-foreground'}`}>
              {isRunning ? 'RUN!' : 'Stop'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
