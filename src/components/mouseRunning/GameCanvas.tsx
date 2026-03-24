import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameMediaPipe } from '@/hooks/useGameMediaPipe';
import { useMultiplayerGameMediaPipe } from '@/hooks/useMultiplayerGameMediaPipe';
import { useGameState } from '@/hooks/useGameState';
import { useSoundManager } from '@/hooks/useSoundManager';
import { useGameScores } from '@/hooks/useGameScores';
import { useAuth } from '@/contexts/AuthContext';
import { addGameToDailyStats } from '@/lib/firestore';
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
import { LevelScenery } from './LevelScenery';
import { VolumeIcon } from './icons/VolumeIcon';
import { GameMode, Level, LEVELS, GameState } from '@/types/game';

type Screen = 'MENU' | 'LEVEL_SELECT' | 'PLAYING';

export function GameCanvas({ onExit }: { onExit?: () => void }) {
  const [screen, setScreen] = useState<Screen>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('SINGLE');
  const [selectedLevel, setSelectedLevel] = useState<Level>(LEVELS[1]);
  const [isMuted, setIsMuted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hitTrigger, setHitTrigger] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  
  const gameStartTimeRef = useRef<number>(0);
  const scoreSavedRef = useRef(false); // Prevent double saving
  const statsSavedRef = useRef(false); // Prevent double saving stats
  
  const sound = useSoundManager();
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const { submitScore, personalBest, loadPersonalBest } = useGameScores();
  const { lineProfile } = useAuth();
  
  // Single player hooks
  const singlePlayer = useGameMediaPipe();
  
  // Multiplayer hooks
  const multiPlayer = useMultiplayerGameMediaPipe();
  
  // Use appropriate refs based on mode
  const videoRef = gameMode === 'MULTIPLAYER' ? multiPlayer.videoRef : singlePlayer.videoRef;
  const canvasRef = gameMode === 'MULTIPLAYER' ? multiPlayer.canvasRef : singlePlayer.canvasRef;
  const isLoading = gameMode === 'MULTIPLAYER' ? multiPlayer.isLoading : singlePlayer.isLoading;
  const error = gameMode === 'MULTIPLAYER' ? multiPlayer.error : singlePlayer.error;

  // Save score to database
  const saveGameScore = useCallback(async (
    score: number, 
    elapsedTime: number, 
    hitCount: number, 
    steps: number
  ) => {
    if (scoreSavedRef.current) return; // Already saved
    if (gameMode === 'MULTIPLAYER') return; // Don't save multiplayer for now
    
    scoreSavedRef.current = true;
    
    const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    
    // Map level ID to GameLevel type
    const levelMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      'easy': 'easy',
      'medium': 'medium',
      'hard': 'hard',
      'practice': 'easy',
      'intense': 'hard',
    };
    const level = levelMap[selectedLevel.id] || 'medium';
    
    const result = await submitScore({
      gameType: 'mouseRunning',
      level,
      score,
      duration,
      gameData: {
        steps,
        hitCount,
        maxCombo: steps > 0 ? Math.max(1, steps - hitCount) : 0,
      },
    });
    
    if (result.isNewPersonalBest) {
      setIsNewRecord(true);
    }
  }, [gameMode, selectedLevel.id, submitScore]);

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

  // Start BGM from mount (main menu)
  useEffect(() => {
    const audio = new Audio('/assets/music/mouse-game.mp3');
    audio.loop = true;
    audio.volume = 0.18;
    bgmRef.current = audio;

    const tryPlay = () => {
      if (bgmRef.current && bgmRef.current.paused) {
        bgmRef.current.play().catch(() => {});
      }
    };

    const events = ['click', 'touchstart', 'keydown'] as const;
    events.forEach(e => document.addEventListener(e, tryPlay, { once: true }));
    tryPlay();

    return () => {
      events.forEach(e => document.removeEventListener(e, tryPlay));
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Sync mute with BGM
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Update sound level when level changes
  useEffect(() => {
    sound.setLevel(selectedLevel.id);
  }, [selectedLevel.id, sound]);

  // Save score when player wins
  useEffect(() => {
    if (player1State.gameState === 'WIN' && !scoreSavedRef.current) {
      saveGameScore(
        player1State.score,
        player1State.elapsedTime,
        player1State.hitCount,
        singlePlayer.stepCount
      );
    }
  }, [player1State.gameState, player1State.score, player1State.elapsedTime, player1State.hitCount, singlePlayer.stepCount, saveGameScore]);

  // Save stats to daily stats when game ends (win or any completion)
  useEffect(() => {
    const saveStats = async () => {
      if (player1State.gameState === 'WIN' && !statsSavedRef.current && lineProfile?.userId) {
        statsSavedRef.current = true;
        const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        try {
          await addGameToDailyStats(
            lineProfile.userId,
            'mouseRunning',
            duration,
            player1State.score
          );
          console.log('Mouse Running stats saved!', { duration, score: player1State.score });
        } catch (error) {
          console.error('Error saving game stats:', error);
        }
      }
    };
    saveStats();
  }, [player1State.gameState, player1State.score, lineProfile?.userId]);

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
    setIsNewRecord(false);
    scoreSavedRef.current = false;
    gameStartTimeRef.current = Date.now();
    
    // Map level ID to GameLevel type for loading personal best
    const levelMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      'easy': 'easy',
      'medium': 'medium',
      'hard': 'hard',
      'practice': 'easy',
      'intense': 'hard',
    };
    const gameLevel = levelMap[level.id] || 'medium';
    loadPersonalBest('mouseRunning', gameLevel);
    
    if (gameMode === 'SINGLE') {
      singlePlayer.resetSteps();
    } else {
      multiPlayer.resetSteps();
    }
    
    player1State.startGame();
    if (gameMode === 'MULTIPLAYER') {
      player2State.startGame();
    }
    
  };

  const handleRestart = () => {
    sound.playClick();
    setShowConfetti(false);
    setIsNewRecord(false);
    scoreSavedRef.current = false;
    gameStartTimeRef.current = Date.now();
    
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
    }, 300);
  };

  const handleBackToMenu = () => {
    sound.playClick();
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
      <div className="flex items-center justify-center min-h-screen p-4"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2147 40%, #1a0a3e 100%)' }}>
        <div className="text-center p-8 rounded-3xl max-w-md"
          style={{
            background: 'rgba(15,23,42,0.9)',
            border: '2px solid rgba(239,68,68,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(239,68,68,0.1)',
          }}>
          <div className="mb-4">
            <svg viewBox="0 0 48 48" className="w-14 h-14 mx-auto text-red-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M46 38a4 4 0 01-4 4H6a4 4 0 01-4-4V16a4 4 0 014-4h8l4-6h12l4 6h8a4 4 0 014 4z"/>
              <circle cx="24" cy="26" r="8"/>
              <line x1="18" y1="20" x2="30" y2="32" strokeWidth="2.5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-red-400 mb-4"
            style={{ textShadow: '0 0 15px rgba(239,68,68,0.4)' }}>Camera Error</h2>
          <p className="text-white/60 mb-4 text-sm">{error}</p>
          <p className="text-white/30 text-xs">
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
          <div className="absolute inset-0 flex items-center justify-center z-50"
            style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2147 40%, #1a0a3e 100%)' }}>
            <div className="text-center">
              <div className="w-20 h-24 mx-auto mb-5">
                <div style={{ animation: 'loadBounce 1s ease-in-out infinite' }}>
                  <svg viewBox="0 0 100 140" className="w-full h-full drop-shadow-xl">
                    <ellipse cx="25" cy="20" rx="18" ry="22" fill="hsl(340 75% 70%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
                    <ellipse cx="75" cy="20" rx="18" ry="22" fill="hsl(340 75% 70%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
                    <ellipse cx="50" cy="45" rx="32" ry="28" fill="hsl(340 75% 70%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
                    <ellipse cx="38" cy="42" rx="8" ry="9" fill="hsl(220 20% 10%)"/>
                    <ellipse cx="62" cy="42" rx="8" ry="9" fill="hsl(220 20% 10%)"/>
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-black text-white mb-2"
                style={{ textShadow: '0 0 20px rgba(34,197,94,0.5)' }}>Loading...</h2>
              <p className="text-white/40 text-sm font-medium">Setting up camera and pose detection</p>
              <div className="mt-4 flex justify-center gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-green-400"
                    style={{ animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
            <style>{`
              @keyframes loadBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-12px); }
              }
              @keyframes dotPulse {
                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.2); }
              }
            `}</style>
          </div>
        )}

        {/* Sound toggle button – pro metallic style */}
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 z-50 group p-2.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            background: 'linear-gradient(180deg, rgba(30,36,52,0.88) 0%, rgba(14,18,32,0.94) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-2 right-2 h-px rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
          <VolumeIcon className="w-5 h-5 relative z-10 transition-colors" muted={isMuted} />
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
            {/* Per-level scenery decorations */}
            <LevelScenery level={selectedLevel} />

            {/* Game track – ground lane with edge markings */}
            {gameMode === 'SINGLE' ? (
              <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-40 pointer-events-none z-[2]">
                {/* Main track fill */}
                <div className="absolute inset-0" style={{
                  background: `linear-gradient(to top, ${selectedLevel.theme.primaryColor}18, transparent 60%)`,
                }} />
                {/* Left lane line */}
                <div className="absolute top-0 bottom-0 left-0 w-px" style={{
                  background: `repeating-linear-gradient(to bottom, ${selectedLevel.theme.primaryColor}30 0px, ${selectedLevel.theme.primaryColor}30 12px, transparent 12px, transparent 24px)`,
                }} />
                {/* Right lane line */}
                <div className="absolute top-0 bottom-0 right-0 w-px" style={{
                  background: `repeating-linear-gradient(to bottom, ${selectedLevel.theme.primaryColor}30 0px, ${selectedLevel.theme.primaryColor}30 12px, transparent 12px, transparent 24px)`,
                }} />
                {/* Center dashed guide */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2" style={{
                  background: `repeating-linear-gradient(to bottom, ${selectedLevel.theme.accentColor}15 0px, ${selectedLevel.theme.accentColor}15 8px, transparent 8px, transparent 20px)`,
                }} />
              </div>
            ) : (
              <>
                <div className="absolute inset-y-0 left-[25%] transform -translate-x-1/2 w-32 pointer-events-none z-[2]">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(59,130,246,0.12), transparent 60%)' }} />
                  <div className="absolute top-0 bottom-0 left-0 w-px" style={{ background: 'repeating-linear-gradient(to bottom, rgba(59,130,246,0.25) 0px, rgba(59,130,246,0.25) 12px, transparent 12px, transparent 24px)' }} />
                  <div className="absolute top-0 bottom-0 right-0 w-px" style={{ background: 'repeating-linear-gradient(to bottom, rgba(59,130,246,0.25) 0px, rgba(59,130,246,0.25) 12px, transparent 12px, transparent 24px)' }} />
                </div>
                <div className="absolute inset-y-0 left-[75%] transform -translate-x-1/2 w-32 pointer-events-none z-[2]">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(236,72,153,0.12), transparent 60%)' }} />
                  <div className="absolute top-0 bottom-0 left-0 w-px" style={{ background: 'repeating-linear-gradient(to bottom, rgba(236,72,153,0.25) 0px, rgba(236,72,153,0.25) 12px, transparent 12px, transparent 24px)' }} />
                  <div className="absolute top-0 bottom-0 right-0 w-px" style={{ background: 'repeating-linear-gradient(to bottom, rgba(236,72,153,0.25) 0px, rgba(236,72,153,0.25) 12px, transparent 12px, transparent 24px)' }} />
                </div>
                <div className="absolute inset-y-0 left-1/2 w-px pointer-events-none z-[2]"
                  style={{ background: `repeating-linear-gradient(to bottom, ${selectedLevel.theme.primaryColor}30 0px, ${selectedLevel.theme.primaryColor}30 8px, transparent 8px, transparent 20px)` }} />
              </>
            )}

            {/* Cheese goals */}
            {gameMode === 'SINGLE' ? (
              <CheeseGoal 
                progress={player1State.mousePosition} 
                goalDistance={selectedLevel.config.goalDistance}
                levelTheme={selectedLevel.theme} 
              />
            ) : (
              <>
                <CheeseGoal 
                  progress={player1State.mousePosition} 
                  goalDistance={selectedLevel.config.goalDistance}
                  side="LEFT" 
                  levelTheme={selectedLevel.theme} 
                />
                <CheeseGoal 
                  progress={player2State.mousePosition} 
                  goalDistance={selectedLevel.config.goalDistance}
                  side="RIGHT" 
                  levelTheme={selectedLevel.theme} 
                />
              </>
            )}

            {/* Mouse characters */}
            {gameMode === 'SINGLE' ? (
              <MouseCharacter 
                position={player1State.mousePosition} 
                goalDistance={selectedLevel.config.goalDistance}
                isRunning={singlePlayer.isRunning}
                gameState={player1State.gameState}
                levelId={selectedLevel.id}
              />
            ) : (
              <>
                <MouseCharacter 
                  position={player1State.mousePosition} 
                  goalDistance={selectedLevel.config.goalDistance}
                  isRunning={multiPlayer.leftPlayer.isRunning}
                  gameState={player1State.gameState}
                  side="LEFT"
                  color="blue"
                  levelId={selectedLevel.id}
                />
                <MouseCharacter 
                  position={player2State.mousePosition} 
                  goalDistance={selectedLevel.config.goalDistance}
                  isRunning={multiPlayer.rightPlayer.isRunning}
                  gameState={player2State.gameState}
                  side="RIGHT"
                  color="pink"
                  levelId={selectedLevel.id}
                />
              </>
            )}

            {/* Traffic light */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
              <TrafficLight gameState={player1State.gameState} isWarning={player1State.isWarning} levelTheme={selectedLevel.theme} levelId={selectedLevel.id} />
            </div>

            {/* State indicator */}
            <StateIndicator gameState={player1State.gameState} isWarning={player1State.isWarning} levelTheme={selectedLevel.theme} />

            {/* Game UI */}
            <GameUI 
              steps={gameMode === 'SINGLE' ? singlePlayer.stepCount : multiPlayer.leftPlayer.stepCount} 
              score={player1State.score} 
              isRunning={gameMode === 'SINGLE' ? singlePlayer.isRunning : multiPlayer.leftPlayer.isRunning} 
              elapsedTime={player1State.elapsedTime}
              hitCount={player1State.hitCount}
              player2Score={gameMode === 'MULTIPLAYER' ? player2State.score : undefined}
              player2Steps={gameMode === 'MULTIPLAYER' ? multiPlayer.rightPlayer.stepCount : undefined}
              levelTheme={selectedLevel.theme}
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
              isNewRecord={isNewRecord}
              personalBest={personalBest}
              levelId={selectedLevel.id}
            />

            {/* Warning flash: running during red light – edge danger vignette */}
            {(player1State.gameState === 'RED_LIGHT' && (
              (gameMode === 'SINGLE' && singlePlayer.isRunning) ||
              (gameMode === 'MULTIPLAYER' && (multiPlayer.leftPlayer.isRunning || multiPlayer.rightPlayer.isRunning))
            )) && (
              <div className="absolute inset-0 pointer-events-none z-40"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 55%, rgba(239,68,68,0.25) 100%)',
                  animation: 'warningPulse 0.6s ease-in-out infinite alternate',
                }}>
                {/* Top/bottom red bars for warning */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)', animation: 'warningBarFlicker 0.3s steps(2) infinite' }} />
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)', animation: 'warningBarFlicker 0.3s steps(2) infinite' }} />
              </div>
            )}
            
            {/* Hit flash – sharp red-edge pulse that fades */}
            {(player1State.gameState === 'HIT' || player2State.gameState === 'HIT') && (
              <div className="absolute inset-0 pointer-events-none z-40"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.05) 30%, rgba(220,38,38,0.4) 100%)',
                  animation: 'hitFlash 0.5s ease-out forwards',
                }} />
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
            onBack={onExit}
            gameMode={gameMode}
            levelId={selectedLevel.id}
          />
        )}

        {/* Gameplay animation keyframes */}
        <style>{`
          @keyframes warningPulse {
            from { opacity: 0.6; }
            to { opacity: 1; }
          }
          @keyframes warningBarFlicker {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
          }
          @keyframes hitFlash {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>
      </ScreenShake>
    </>
  );
}
