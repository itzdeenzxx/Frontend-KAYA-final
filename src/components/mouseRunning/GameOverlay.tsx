import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GameState, GameMode } from '@/types/game';
import { MouseIcon } from './icons/MouseIcon';
import { CheeseIcon } from './icons/CheeseIcon';
import { StarIcon } from './icons/StarIcon';
import { HowToPlay } from './HowToPlay';

interface GameOverlayProps {
  gameState: GameState;
  player2GameState?: GameState;
  score: number;
  player2Score?: number;
  elapsedTime: number;
  hitCount: number;
  onStart: () => void;
  onRestart: () => void;
  onBack?: () => void;
  gameMode?: GameMode;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function GameOverlay({ 
  gameState, 
  player2GameState,
  score, 
  player2Score,
  elapsedTime, 
  onStart, 
  onRestart,
  onBack,
  gameMode = 'SINGLE'
}: GameOverlayProps) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  
  // For multiplayer, check if either player has won
  const isMultiplayerWin = gameMode === 'MULTIPLAYER' && (gameState === 'WIN' || player2GameState === 'WIN');
  const player1Won = gameState === 'WIN';
  const player2Won = player2GameState === 'WIN';
  
  // แสดง HIT message เมื่อโดน missile
  if (gameState === 'HIT') {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="text-center animate-bounce">
          <div className="text-7xl md:text-8xl mb-2">💥</div>
          <div className="text-4xl md:text-5xl font-bold text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
            OUCH!
          </div>
          <div className="text-lg text-red-300 mt-2 animate-pulse">
            Don't move during red light!
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'GREEN_LIGHT' || gameState === 'YELLOW_LIGHT' || gameState === 'RED_LIGHT') {
    if (!isMultiplayerWin) return null;
  }

  if (showHowToPlay) {
    return <HowToPlay onClose={() => setShowHowToPlay(false)} onStart={onStart} />;
  }

  return (
    <div className="absolute inset-0 bg-background/85 backdrop-blur-md flex items-center justify-center z-50">
      <div className="text-center p-6 md:p-8 rounded-2xl bg-card border-4 border-green-500/30 max-w-md mx-4">
        {gameState === 'IDLE' && (
          <>
            <div className="flex justify-center items-center gap-2 mb-4">
              <MouseIcon className="w-16 h-20" />
              <CheeseIcon className="w-14 h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-green-500 mb-4">
              Run or Freeze!
            </h1>
            <p className="text-muted-foreground mb-4 text-sm md:text-base">
              Run in place to help the mouse reach the cheese!
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={onStart}
                size="lg"
                className="text-lg md:text-xl font-bold bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 mr-2" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Start Game
              </Button>
              <Button 
                onClick={() => setShowHowToPlay(true)}
                variant="outline"
                size="lg"
                className="text-lg font-bold"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                How to Play
              </Button>
              <p className="text-xs text-muted-foreground">
                Make sure your full body is visible
              </p>
            </div>
          </>
        )}

        {(gameState === 'WIN' || isMultiplayerWin) && (
          <>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <svg viewBox="0 0 60 60" className="w-20 h-20 animate-bounce">
                  <circle cx="30" cy="30" r="28" fill="hsl(45 100% 55%)" stroke="hsl(35 90% 45%)" strokeWidth="3"/>
                  <path d="M30 12 L34 24 L47 24 L36 32 L40 45 L30 37 L20 45 L24 32 L13 24 L26 24 Z" fill="hsl(45 100% 80%)"/>
                </svg>
                <MouseIcon className="absolute -bottom-2 -right-4 w-12 h-16" color={player1Won ? 'pink' : 'blue'} />
              </div>
            </div>
            
            {gameMode === 'MULTIPLAYER' ? (
              <>
                <h2 className="text-3xl md:text-4xl font-bold text-green-500 mb-4">
                  {player1Won ? '🔵 Player 1 Wins!' : '🩷 Player 2 Wins!'}
                </h2>
                <div className="flex justify-center gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-400">Player 1</p>
                    <p className="font-bold text-2xl text-yellow-500">{score}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-pink-400">Player 2</p>
                    <p className="font-bold text-2xl text-yellow-500">{player2Score}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl md:text-4xl font-bold text-green-500 mb-4">
                  YOU WIN!
                </h2>
                <p className="text-muted-foreground mb-2">
                  The mouse got the cheese!
                </p>
                <div className="flex justify-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-6 h-6" />
                    <span className="font-bold text-xl text-yellow-500">{score}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="hsl(200 90% 55%)">
                      <circle cx="12" cy="12" r="10" stroke="hsl(220 20% 30%)" strokeWidth="2"/>
                      <path d="M12 6v6l4 2" stroke="hsl(45 100% 55%)" strokeWidth="2" fill="none"/>
                    </svg>
                    <span className="font-bold text-xl text-blue-400">{formatTime(elapsedTime)}</span>
                  </div>
                </div>
              </>
            )}
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={onRestart}
                size="lg"
                className="text-lg md:text-xl font-bold bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
              >
                Play Again
              </Button>
              {onBack && (
                <Button 
                  onClick={onBack}
                  variant="outline"
                  size="lg"
                  className="text-lg font-bold"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back to Menu
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
