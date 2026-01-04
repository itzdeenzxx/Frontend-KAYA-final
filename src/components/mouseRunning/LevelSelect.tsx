import { Button } from '@/components/ui/button';
import { LEVELS, Level, GameMode } from '@/types/game';
import { PlayersIcon } from './icons/PlayersIcon';
import { MouseIcon } from './icons/MouseIcon';
import { CheeseIcon } from './icons/CheeseIcon';

interface LevelSelectProps {
  onSelectLevel: (level: Level) => void;
  onSelectMode: (mode: GameMode) => void;
  selectedMode: GameMode;
  onBack: () => void;
}

export function LevelSelect({ onSelectLevel, onSelectMode, selectedMode, onBack }: LevelSelectProps) {
  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-md flex items-center justify-center z-50 overflow-auto py-4">
      <div className="w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-3 mb-3">
            <MouseIcon className="w-12 h-16" />
            <CheeseIcon className="w-10 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-green-500 mb-2">
            Select Game Mode
          </h1>
        </div>

        {/* Player Mode Selection */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            onClick={() => onSelectMode('SINGLE')}
            variant={selectedMode === 'SINGLE' ? 'default' : 'outline'}
            size="lg"
            className={`flex-1 max-w-[200px] h-20 flex-col gap-1 ${
              selectedMode === 'SINGLE' ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30' : ''
            }`}
          >
            <PlayersIcon className="w-10 h-8" count={1} />
            <span className="font-bold">1 Player</span>
          </Button>
          <Button
            onClick={() => onSelectMode('MULTIPLAYER')}
            variant={selectedMode === 'MULTIPLAYER' ? 'default' : 'outline'}
            size="lg"
            className={`flex-1 max-w-[200px] h-20 flex-col gap-1 ${
              selectedMode === 'MULTIPLAYER' ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30' : ''
            }`}
          >
            <PlayersIcon className="w-12 h-8" count={2} />
            <span className="font-bold">2 Players</span>
          </Button>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {LEVELS.map((level) => {
            const difficultyStars = level.id === 'easy' ? 1 : level.id === 'medium' ? 2 : level.id === 'hard' ? 3 : 2;
            
            return (
              <button
                key={level.id}
                onClick={() => onSelectLevel(level)}
                className="group relative bg-card border-2 border-border hover:border-green-500 rounded-xl p-4 transition-all duration-300 hover:scale-105 text-left overflow-hidden"
                style={{ 
                  background: level.theme.bgGradient 
                }}
              >
                {/* Animated background for party mode */}
                {level.id === 'party' && (
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute w-20 h-20 rounded-full bg-pink-500 blur-xl animate-pulse" style={{ top: '20%', left: '10%' }} />
                    <div className="absolute w-16 h-16 rounded-full bg-cyan-500 blur-xl animate-pulse" style={{ top: '60%', right: '10%', animationDelay: '0.5s' }} />
                    <div className="absolute w-12 h-12 rounded-full bg-yellow-500 blur-xl animate-pulse" style={{ bottom: '20%', left: '30%', animationDelay: '1s' }} />
                  </div>
                )}
                
                {/* Hard mode skulls */}
                {level.id === 'hard' && (
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute text-4xl" style={{ top: '10%', right: '10%', transform: 'rotate(15deg)' }}>💀</div>
                    <div className="absolute text-2xl" style={{ bottom: '20%', left: '5%', transform: 'rotate(-10deg)' }}>☠️</div>
                  </div>
                )}
                
                {/* Level Icon */}
                <div className="text-4xl mb-2 relative z-10">{level.icon}</div>
                
                {/* Level Info */}
                <h3 className="font-bold text-lg text-foreground mb-1 relative z-10">
                  {level.name}
                </h3>
                <p className="text-xs text-muted-foreground relative z-10">
                  {level.description}
                </p>
                
                {/* Stats preview */}
                <div className="mt-3 space-y-1 text-xs relative z-10">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Speed</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-sm ${
                            i <= Math.ceil(level.config.speedMultiplier / 2)
                              ? 'bg-green-500'
                              : 'bg-muted/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Penalty</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-sm ${
                            i <= Math.ceil(level.config.penaltyPercent * 10)
                              ? 'bg-red-500'
                              : 'bg-muted/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Difficulty indicator */}
                <div className="mt-3 flex gap-1 relative z-10">
                  {[1, 2, 3].map((i) => (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      className={`w-4 h-4 ${i <= difficultyStars ? 'text-yellow-400' : 'text-muted/30'}`}
                      fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ 
                    boxShadow: `0 0 40px ${level.theme.primaryColor}60`
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Multiplayer note */}
        {selectedMode === 'MULTIPLAYER' && (
          <div className="text-center mb-4 p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
            <p className="text-blue-400 text-sm">
              🎮 <strong>2 Player Mode:</strong> Both players stand in front of the camera.
              <br />
              Left side controls <span className="text-blue-400">Blue Mouse</span>, 
              Right side controls <span className="text-pink-400">Pink Mouse</span>!
            </p>
          </div>
        )}

        {/* Back button */}
        <div className="text-center">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
