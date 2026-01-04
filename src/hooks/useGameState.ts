import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameConfig, DEFAULT_GAME_CONFIG } from '@/types/game';

interface UseGameStateReturn {
  gameState: GameState;
  mousePosition: number;
  score: number;
  isWarning: boolean;
  elapsedTime: number;
  hitCount: number;
  startGame: () => void;
  resetGame: () => void;
  updatePosition: (steps: number) => void;
  checkViolation: (isRunning: boolean, movementAmount?: number) => boolean;
  onStateChange?: (state: GameState) => void;
}

interface UseGameStateOptions {
  config?: GameConfig;
  onStateChange?: (state: GameState) => void;
  onHit?: () => void;
  onWin?: () => void;
  onStep?: () => void;
}

export function useGameState(options: UseGameStateOptions = {}): UseGameStateReturn {
  const { 
    config = DEFAULT_GAME_CONFIG, 
    onStateChange, 
    onHit,
    onWin,
    onStep
  } = options;

  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [mousePosition, setMousePosition] = useState(0);
  const [score, setScore] = useState(0);
  const [isWarning, setIsWarning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  
  const lastStepCount = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const yellowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const redTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const hitCooldownRef = useRef<boolean>(false);
  const consecutiveMovementRef = useRef<number>(0);

  const getRandomDuration = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Game timer
  useEffect(() => {
    if (gameState === 'GREEN_LIGHT' || gameState === 'YELLOW_LIGHT' || gameState === 'RED_LIGHT') {
      gameTimerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    }
    
    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, [gameState]);

  // Handle state changes and sound effects
  useEffect(() => {
    onStateChange?.(gameState);
  }, [gameState, onStateChange]);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (yellowTimerRef.current) clearTimeout(yellowTimerRef.current);
    if (redTimerRef.current) clearTimeout(redTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
  }, []);

  const scheduleStateChange = useCallback(() => {
    clearAllTimers();

    if (gameState === 'GREEN_LIGHT') {
      const greenDuration = getRandomDuration(config.greenLightMinDuration, config.greenLightMaxDuration);
      
      // Schedule yellow light (warning)
      yellowTimerRef.current = setTimeout(() => {
        setGameState('YELLOW_LIGHT');
        setIsWarning(true);
      }, greenDuration);
      
    } else if (gameState === 'YELLOW_LIGHT') {
      // Yellow light for fixed duration, then red
      timerRef.current = setTimeout(() => {
        setIsWarning(false);
        setGameState('RED_LIGHT');
      }, config.yellowLightDuration);
      
    } else if (gameState === 'RED_LIGHT') {
      const redDuration = getRandomDuration(config.redLightMinDuration, config.redLightMaxDuration);
      
      redTimerRef.current = setTimeout(() => {
        consecutiveMovementRef.current = 0;
        setGameState('GREEN_LIGHT');
      }, redDuration);
    }
  }, [gameState, config, clearAllTimers]);

  useEffect(() => {
    if (gameState === 'GREEN_LIGHT' || gameState === 'YELLOW_LIGHT' || gameState === 'RED_LIGHT') {
      scheduleStateChange();
    }
    
    return clearAllTimers;
  }, [gameState, scheduleStateChange, clearAllTimers]);

  // Handle HIT state recovery
  useEffect(() => {
    if (gameState === 'HIT') {
      onHit?.();
      const hitTimer = setTimeout(() => {
        setGameState('RED_LIGHT');
        hitCooldownRef.current = false;
      }, 1500);
      
      return () => clearTimeout(hitTimer);
    }
  }, [gameState, onHit]);

  // Handle WIN state
  useEffect(() => {
    if (gameState === 'WIN') {
      onWin?.();
    }
  }, [gameState, onWin]);

  const startGame = useCallback(() => {
    setGameState('GREEN_LIGHT');
    setMousePosition(0);
    setScore(0);
    setIsWarning(false);
    setElapsedTime(0);
    setHitCount(0);
    lastStepCount.current = 0;
    startTimeRef.current = Date.now();
    hitCooldownRef.current = false;
    consecutiveMovementRef.current = 0;
  }, []);

  const resetGame = useCallback(() => {
    clearAllTimers();
    setGameState('IDLE');
    setMousePosition(0);
    setScore(0);
    setIsWarning(false);
    setElapsedTime(0);
    setHitCount(0);
    lastStepCount.current = 0;
    hitCooldownRef.current = false;
    consecutiveMovementRef.current = 0;
  }, [clearAllTimers]);

  const updatePosition = useCallback((steps: number) => {
    if (gameState !== 'GREEN_LIGHT' && gameState !== 'YELLOW_LIGHT') return;
    
    const newSteps = steps - lastStepCount.current;
    if (newSteps > 0) {
      onStep?.();
      setMousePosition(prev => {
        const newPosition = prev + (newSteps * config.speedMultiplier);
        if (newPosition >= config.goalDistance) {
          setGameState('WIN');
          setScore(s => s + 100);
          return config.goalDistance;
        }
        return newPosition;
      });
      setScore(s => s + newSteps);
      lastStepCount.current = steps;
    }
  }, [gameState, config, onStep]);

  const checkViolation = useCallback((isRunning: boolean, movementAmount: number = 0): boolean => {
    if (gameState !== 'RED_LIGHT' || hitCooldownRef.current) return false;
    
    // Less strict detection: require consistent movement above threshold
    if (isRunning && movementAmount > config.movementThreshold) {
      consecutiveMovementRef.current++;
      
      // Only trigger hit after 3 consecutive frames of detected movement
      if (consecutiveMovementRef.current >= 3) {
        hitCooldownRef.current = true;
        setHitCount(prev => prev + 1);
        
        // Mouse continues from reduced position (doesn't reset to 0)
        setMousePosition(prev => Math.max(0, prev * (1 - config.penaltyPercent)));
        setScore(prev => Math.max(0, prev - 10));
        
        consecutiveMovementRef.current = 0;
        setGameState('HIT');
        return true;
      }
    } else {
      // Reset counter if not moving
      consecutiveMovementRef.current = Math.max(0, consecutiveMovementRef.current - 1);
    }
    
    return false;
  }, [gameState, config]);

  return {
    gameState,
    mousePosition,
    score,
    isWarning,
    elapsedTime,
    hitCount,
    startGame,
    resetGame,
    updatePosition,
    checkViolation
  };
}
