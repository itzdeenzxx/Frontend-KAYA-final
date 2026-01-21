import { useEffect, useRef, useState } from 'react';
import { useGameMediaPipe } from '@/hooks/useGameMediaPipe';
import { useMultiplayerGameMediaPipe } from '@/hooks/useMultiplayerGameMediaPipe';
import { useGameState } from '@/hooks/useGameState';
import { useSoundManager } from '@/hooks/useSoundManager';
import { TrafficLight } from './TrafficLight';
import { MouseCharacter } from './MouseCharacter';
import { CheeseGoal } from './CheeseGoal';
import { GameUI } from './GameUI';
import { GameOverlay } from './GameOverlay';
import { StateIndicator } from './StateIndicator';
import { LandscapePrompt } from './LandscapePrompt';
import { LevelSelect } from './LevelSelect';
import { Confetti } from './Confetti';
import { ScreenShake } from './ScreenShake';
import { VolumeIcon } from './icons/VolumeIcon';
import { GameMode, Level, LEVELS, GameState } from '@/types/game';

type Screen = 'MENU' | 'LEVEL_SELECT' | 'PLAYING';

export function GameCanvas() {
  const [screen, setScreen] = useState<Screen>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('SINGLE');
  const [selectedLevel, setSelectedLevel] = useState<Level>(LEVELS[1]);
  const [isMuted, setIsMuted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hitTrigger, setHitTrigger] = useState(0);
  
  const sound = useSoundManager();
  
  // Single player hooks
  const singlePlayer = useGameMediaPipe();
  
  // Multiplayer hooks
  const multiPlayer = useMultiplayerGameMediaPipe();
  
  // Use appropriate refs based on mode
  const videoRef = gameMode === 'MULTIPLAYER' ? multiPlayer.videoRef : singlePlayer.videoRef;
  const canvasRef = gameMode === 'MULTIPLAYER' ? multiPlayer.canvasRef : singlePlayer.canvasRef;
  const isLoading = gameMode === 'MULTIPLAYER' ? multiPlayer.isLoading : singlePlayer.isLoading;
  const error = gameMode === 'MULTIPLAYER' ? multiPlayer.error : singlePlayer.error;

  // Player 1 (or single player) game state
  const player1State = useGameState({
    config: selectedLevel.config,
    onStateChange: (state: GameState) => {
      if (state === 'GREEN_LIGHT') sound.playGreenLight();
      else if (state === 'YELLOW_LIGHT') sound.playYellowLight();
      else if (state === 'RED_LIGHT') sound.playRedLight();
    },
    onHit: () => {
      sound.playHit();
      setHitTrigger(prev => prev + 1);
    },
    onWin: () => {
      sound.playWin();
      sound.stopBgMusic();
      setShowConfetti(true);
    },
    onStep: () => sound.playStep()
  });

  // Player 2 game state (for multiplayer)
  const player2State = useGameState({
    config: selectedLevel.config,
    onHit: () => {
      sound.playHit();
      setHitTrigger(prev => prev + 1);
    },
    onWin: () => {
      sound.playWin();
      sound.stopBgMusic();
      setShowConfetti(true);
    },
    onStep: () => sound.playStep()
  });

  // Update sound level when level changes
  useEffect(() => {
    sound.setLevel(selectedLevel.id);
  }, [selectedLevel.id, sound]);

  const prevStepCount1 = useRef(0);
  const prevStepCount2 = useRef(0);

  // Update positions for single player
  useEffect(() => {
    if (gameMode === 'SINGLE' && screen === 'PLAYING') {
      const stepCount = singlePlayer.stepCount;
      if ((player1State.gameState === 'GREEN_LIGHT' || player1State.gameState === 'YELLOW_LIGHT') && stepCount > prevStepCount1.current) {
        player1State.updatePosition(stepCount);
      }
      prevStepCount1.current = stepCount;
    }
  }, [singlePlayer.stepCount, player1State.gameState, gameMode, screen, player1State]);

  // Update positions for multiplayer
  useEffect(() => {
    if (gameMode === 'MULTIPLAYER' && screen === 'PLAYING') {
      // Player 1 (left side)
      if ((player1State.gameState === 'GREEN_LIGHT' || player1State.gameState === 'YELLOW_LIGHT') && 
          multiPlayer.leftPlayer.stepCount > prevStepCount1.current) {
        player1State.updatePosition(multiPlayer.leftPlayer.stepCount);
      }
      prevStepCount1.current = multiPlayer.leftPlayer.stepCount;

      // Player 2 (right side)
      if ((player2State.gameState === 'GREEN_LIGHT' || player2State.gameState === 'YELLOW_LIGHT') && 
          multiPlayer.rightPlayer.stepCount > prevStepCount2.current) {
        player2State.updatePosition(multiPlayer.rightPlayer.stepCount);
      }
      prevStepCount2.current = multiPlayer.rightPlayer.stepCount;
    }
  }, [multiPlayer.leftPlayer.stepCount, multiPlayer.rightPlayer.stepCount, player1State.gameState, player2State.gameState, gameMode, screen, player1State, player2State]);

  // Check violations
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    
    if (gameMode === 'SINGLE') {
      if (player1State.gameState === 'RED_LIGHT') {
        const movementAmount = singlePlayer.poseData ? 
          Math.abs((singlePlayer.poseData.leftAnkleY || 0) - (singlePlayer.poseData.rightAnkleY || 0)) : 0;
        player1State.checkViolation(singlePlayer.isRunning, movementAmount);
      }
    } else {
      if (player1State.gameState === 'RED_LIGHT') {
        player1State.checkViolation(multiPlayer.leftPlayer.isRunning, multiPlayer.leftPlayer.movementAmount);
      }
      if (player2State.gameState === 'RED_LIGHT') {
        player2State.checkViolation(multiPlayer.rightPlayer.isRunning, multiPlayer.rightPlayer.movementAmount);
      }
    }
  }, [singlePlayer.isRunning, multiPlayer.leftPlayer.isRunning, multiPlayer.rightPlayer.isRunning, 
      player1State.gameState, player2State.gameState, gameMode, screen, singlePlayer.poseData,
      multiPlayer.leftPlayer.movementAmount, multiPlayer.rightPlayer.movementAmount, player1State, player2State]);

  const handleStart = () => {
    sound.playClick();
    setScreen('LEVEL_SELECT');
  };

  const handleSelectLevel = (level: Level) => {
    sound.playClick();
    setSelectedLevel(level);
    setScreen('PLAYING');
    
    if (gameMode === 'SINGLE') {
      singlePlayer.resetSteps();
    } else {
      multiPlayer.resetSteps();
    }
    
    player1State.startGame();
    if (gameMode === 'MULTIPLAYER') {
      player2State.startGame();
    }
    
    sound.playBgMusic();
  };

  const handleRestart = () => {
    sound.playClick();
    setShowConfetti(false);
    
    if (gameMode === 'SINGLE') {
      singlePlayer.resetSteps();
    } else {
      multiPlayer.resetSteps();
    }
    
    player1State.resetGame();
    player2State.resetGame();
    
    setTimeout(() => {
      player1State.startGame();
      if (gameMode === 'MULTIPLAYER') {
        player2State.startGame();
      }
      sound.playBgMusic();
    }, 300);
  };

  const handleBackToMenu = () => {
    sound.playClick();
    sound.stopBgMusic();
    setShowConfetti(false);
    player1State.resetGame();
    player2State.resetGame();
    setScreen('MENU');
  };

  const toggleMute = () => {
    sound.toggleMute();
    setIsMuted(!isMuted);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center bg-card p-8 rounded-2xl border-2 border-red-500 max-w-md">
          <svg viewBox="0 0 60 60" className="w-16 h-16 mx-auto mb-4">
            <rect x="10" y="15" width="40" height="30" rx="5" fill="hsl(220 25% 20%)" stroke="hsl(0 85% 55%)" strokeWidth="2"/>
            <circle cx="30" cy="30" r="8" fill="none" stroke="hsl(0 85% 55%)" strokeWidth="2"/>
            <circle cx="30" cy="30" r="3" fill="hsl(0 85% 55%)"/>
          </svg>
          <h2 className="text-2xl font-bold text-red-500 mb-4">Camera Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please allow camera access and refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LandscapePrompt />
      
      <ScreenShake trigger={hitTrigger > 0} intensity="heavy">
      <div className="relative w-full h-screen overflow-hidden bg-background" style={{ background: screen === 'PLAYING' ? selectedLevel.theme.bgGradient : undefined }}>
        {/* Hidden video element */}
        <video ref={videoRef} className="hidden" playsInline muted />

        {/* Camera canvas */}
        <canvas
          ref={canvasRef}
          width={gameMode === 'MULTIPLAYER' ? 1280 : 640}
          height={gameMode === 'MULTIPLAYER' ? 720 : 480}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Loading overlay */}
        {isLoading && screen === 'PLAYING' && (
          <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-20 h-24 mx-auto mb-4 animate-bounce">
                <svg viewBox="0 0 100 140" className="w-full h-full">
                  <ellipse cx="25" cy="20" rx="18" ry="22" fill="hsl(340 75% 70%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
                  <ellipse cx="75" cy="20" rx="18" ry="22" fill="hsl(340 75% 70%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
                  <ellipse cx="50" cy="45" rx="32" ry="28" fill="hsl(340 75% 70%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
                  <ellipse cx="38" cy="42" rx="8" ry="9" fill="hsl(220 20% 10%)"/>
                  <ellipse cx="62" cy="42" rx="8" ry="9" fill="hsl(220 20% 10%)"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-500 mb-2">Loading...</h2>
              <p className="text-muted-foreground">Setting up camera and pose detection</p>
            </div>
          </div>
        )}

        {/* Sound toggle button */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 z-50 p-2 bg-card/80 rounded-full border border-border hover:bg-card transition-colors"
        >
          <VolumeIcon className="w-6 h-6" muted={isMuted} />
        </button>

        {/* Level select screen */}
        {screen === 'LEVEL_SELECT' && (
          <LevelSelect
            onSelectLevel={handleSelectLevel}
            onSelectMode={setGameMode}
            selectedMode={gameMode}
            onBack={handleBackToMenu}
          />
        )}

        {/* Main game screen */}
        {screen === 'PLAYING' && (
          <>
            {/* Game track background */}
            {gameMode === 'SINGLE' ? (
              <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-32 bg-gradient-to-t from-muted/30 to-transparent pointer-events-none" />
            ) : (
              <>
                <div className="absolute inset-y-0 left-[25%] transform -translate-x-1/2 w-24 bg-gradient-to-t from-blue-500/20 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 left-[75%] transform -translate-x-1/2 w-24 bg-gradient-to-t from-pink-500/20 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 left-1/2 w-1 bg-white/20 pointer-events-none" />
              </>
            )}

            {/* Cheese goals */}
            {gameMode === 'SINGLE' ? (
              <CheeseGoal progress={player1State.mousePosition} />
            ) : (
              <>
                <CheeseGoal progress={player1State.mousePosition} side="LEFT" />
                <CheeseGoal progress={player2State.mousePosition} side="RIGHT" />
              </>
            )}

            {/* Mouse characters */}
            {gameMode === 'SINGLE' ? (
              <MouseCharacter 
                position={player1State.mousePosition} 
                isRunning={singlePlayer.isRunning}
                gameState={player1State.gameState}
              />
            ) : (
              <>
                <MouseCharacter 
                  position={player1State.mousePosition} 
                  isRunning={multiPlayer.leftPlayer.isRunning}
                  gameState={player1State.gameState}
                  side="LEFT"
                  color="blue"
                />
                <MouseCharacter 
                  position={player2State.mousePosition} 
                  isRunning={multiPlayer.rightPlayer.isRunning}
                  gameState={player2State.gameState}
                  side="RIGHT"
                  color="pink"
                />
              </>
            )}

            {/* Traffic light */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
              <TrafficLight gameState={player1State.gameState} isWarning={player1State.isWarning} />
            </div>

            {/* State indicator */}
            <StateIndicator gameState={player1State.gameState} isWarning={player1State.isWarning} />

            {/* Game UI */}
            <GameUI 
              steps={gameMode === 'SINGLE' ? singlePlayer.stepCount : multiPlayer.leftPlayer.stepCount} 
              score={player1State.score} 
              isRunning={gameMode === 'SINGLE' ? singlePlayer.isRunning : multiPlayer.leftPlayer.isRunning} 
              elapsedTime={player1State.elapsedTime}
              hitCount={player1State.hitCount}
              player2Score={gameMode === 'MULTIPLAYER' ? player2State.score : undefined}
              player2Steps={gameMode === 'MULTIPLAYER' ? multiPlayer.rightPlayer.stepCount : undefined}
            />

            {/* Win/Game overlays */}
            <GameOverlay 
              gameState={player1State.gameState}
              player2GameState={gameMode === 'MULTIPLAYER' ? player2State.gameState : undefined}
              score={player1State.score}
              player2Score={gameMode === 'MULTIPLAYER' ? player2State.score : undefined}
              elapsedTime={player1State.elapsedTime}
              hitCount={player1State.hitCount}
              onStart={handleStart}
              onRestart={handleRestart}
              onBack={handleBackToMenu}
              gameMode={gameMode}
            />

            {/* Warning/Hit flash overlay */}
            {(player1State.gameState === 'RED_LIGHT' && (
              (gameMode === 'SINGLE' && singlePlayer.isRunning) ||
              (gameMode === 'MULTIPLAYER' && (multiPlayer.leftPlayer.isRunning || multiPlayer.rightPlayer.isRunning))
            )) && (
              <div className="absolute inset-0 bg-red-500/30 animate-pulse pointer-events-none z-40" />
            )}
            
            {(player1State.gameState === 'HIT' || player2State.gameState === 'HIT') && (
              <div className="absolute inset-0 bg-red-500/50 pointer-events-none z-40 animate-pulse" />
            )}
            
            {/* Confetti on win */}
            {showConfetti && <Confetti />}
          </>
        )}

        {/* Main menu overlay */}
        {screen === 'MENU' && (
          <GameOverlay 
            gameState="IDLE"
            score={0}
            elapsedTime={0}
            hitCount={0}
            onStart={handleStart}
            onRestart={handleRestart}
            gameMode={gameMode}
          />
        )}
      </div>
      </ScreenShake>
    </>
  );
}
