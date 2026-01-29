import { useEffect, useState, useCallback, useRef } from 'react';
import { Hole } from './Hole';
import { Mole } from './Mole';
import { cn } from '@/lib/utils';
import { useWhackAMoleSounds } from '@/hooks/useWhackAMoleSounds';

interface HandPosition {
  x: number;
  y: number;
  isDetected: boolean;
  isSmashing?: boolean; // กำลังทุบอยู่
  isFist?: boolean; // กำมืออยู่
}

interface DifficultySettings {
  moleShowDuration: number;
  moleHideDuration: number;
  bombChance: number;
  label: string;
  emoji: string;
  color: string;
}

interface GameBoardProps {
  isPlaying: boolean;
  leftHand: HandPosition | null;
  rightHand: HandPosition | null;
  customMoleImage: string | null;
  onScoreChange: (score: number) => void;
  onTimeChange: (time: number) => void;
  gameDuration: number;
  onGameEnd: () => void;
  difficulty: 'easy' | 'medium' | 'hard';
  difficultySettings: DifficultySettings;
  onMoleHit?: () => void;
  onBombHit?: () => void;
}

const NUM_HOLES = 5;
const HIT_COOLDOWN = 300; // ms between hits

export function GameBoard({
  isPlaying,
  leftHand,
  rightHand,
  customMoleImage,
  onScoreChange,
  onTimeChange,
  gameDuration,
  onGameEnd,
  difficulty,
  difficultySettings,
  onMoleHit,
  onBombHit,
}: GameBoardProps) {
  const [activeMole, setActiveMole] = useState<number | null>(null);
  const [isBomb, setIsBomb] = useState(false); // ตุ่นหรือระเบิด
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [hitMoles, setHitMoles] = useState<Set<number>>(new Set());
  const [hitEffects, setHitEffects] = useState<{index: number, type: 'mole' | 'bomb'}[]>([]);
  
  const holeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastHitTime = useRef<number>(0);
  const gameLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitialized = useRef(false);
  
  // Sound effects
  const { initAudio, playHitSound, playBombSound, playPopSound, playGameOverSound } = useWhackAMoleSounds();
  
  // Initialize audio on first user interaction
  useEffect(() => {
    const handleClick = () => {
      initAudio();
      document.removeEventListener('click', handleClick);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [initAudio]);

  // Reset game state
  const resetGame = useCallback(() => {
    setScore(0);
    setTimeLeft(gameDuration);
    setActiveMole(null);
    setIsBomb(false);
    setHitMoles(new Set());
    setHitEffects([]);
    lastHitTime.current = 0;
  }, [gameDuration]);

  // Check if hand is hitting a mole
  const checkHit = useCallback((holeIndex: number, handX: number, handY: number): boolean => {
    const holeEl = holeRefs.current[holeIndex];
    if (!holeEl) return false;

    const rect = holeEl.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Convert normalized hand position to screen coordinates
    const handScreenX = handX * screenWidth;
    const handScreenY = handY * screenHeight;

    // คำนวณจุดกลางของ hole
    const holeCenterX = rect.left + rect.width / 2;
    const holeCenterY = rect.top + rect.height / 2;
    
    // ใช้ระยะทางจากจุดกลาง แทนการเช็ค bounding box
    const distance = Math.sqrt(
      Math.pow(handScreenX - holeCenterX, 2) + 
      Math.pow(handScreenY - holeCenterY, 2)
    );
    
    // ขยาย hit radius ให้ใหญ่ขึ้น (ใช้ขนาด hole + padding)
    const hitRadius = Math.max(rect.width, rect.height) / 2 + 60;
    
    return distance <= hitRadius;
  }, []);

  // Handle mole hit
  const handleMoleHit = useCallback((holeIndex: number) => {
    const now = Date.now();
    if (now - lastHitTime.current < HIT_COOLDOWN) return;
    
    if (activeMole === holeIndex && !hitMoles.has(holeIndex)) {
      lastHitTime.current = now;
      
      if (isBomb) {
        // Hit bomb - lose 5 points
        playBombSound(); // เล่นเสียงระเบิด
        onBombHit?.();
        setScore(prev => {
          const newScore = Math.max(0, prev - 5);
          onScoreChange(newScore);
          return newScore;
        });
        setHitEffects(prev => [...prev, {index: holeIndex, type: 'bomb'}]);
      } else {
        // Hit mole - gain 10 points
        playHitSound(); // เล่นเสียงตี
        onMoleHit?.();
        setScore(prev => {
          const newScore = prev + 10;
          onScoreChange(newScore);
          return newScore;
        });
        setHitEffects(prev => [...prev, {index: holeIndex, type: 'mole'}]);
      }
      
      setHitMoles(prev => new Set([...prev, holeIndex]));
      
      // Clear hit effect after 0.3 second
      setTimeout(() => {
        setHitEffects(prev => prev.filter(e => e.index !== holeIndex));
      }, 300);
      
      // Hide mole after hit
      setTimeout(() => {
        if (activeMole === holeIndex) {
          setActiveMole(null);
          setHitMoles(new Set());
        }
      }, 200);
    }
  }, [activeMole, hitMoles, isBomb, onScoreChange, playHitSound, playBombSound]);

  // Check hand collisions
  useEffect(() => {
    if (!isPlaying || activeMole === null) return;

    const checkHands = () => {
      // ต้องตรวจจับได้ + กำมือ + กำลังทุบ (เคลื่อนที่ลงเร็ว) ถึงจะนับว่าตี
      // if (leftHand?.isDetected && leftHand.isFist && leftHand.isSmashing) {
      if (leftHand?.isDetected && leftHand.isFist) {
        if (checkHit(activeMole, leftHand.x, leftHand.y)) {
          handleMoleHit(activeMole);
        }
      }
      // if (rightHand?.isDetected && rightHand.isFist && rightHand.isSmashing) {
      if (rightHand?.isDetected && rightHand.isFist) {
        if (checkHit(activeMole, rightHand.x, rightHand.y)) {
          handleMoleHit(activeMole);
        }
      }
    };

    checkHands();
  }, [isPlaying, activeMole, leftHand, rightHand, checkHit, handleMoleHit]);

  // Game loop - spawn moles
  useEffect(() => {
    if (!isPlaying) {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
      return;
    }

    const { moleShowDuration, moleHideDuration, bombChance } = difficultySettings;

    const spawnMole = () => {
      // Pick a random hole that's different from current
      let newHole: number;
      do {
        newHole = Math.floor(Math.random() * NUM_HOLES);
      } while (newHole === activeMole);
      
      // Determine if it's a bomb or mole
      const spawnBomb = Math.random() < bombChance;
      setIsBomb(spawnBomb);
      
      setActiveMole(newHole);
      setHitMoles(new Set());
      playPopSound(); // เล่นเสียงโผล่
      
      // Hide mole after duration (based on difficulty)
      gameLoopRef.current = setTimeout(() => {
        setActiveMole(null);
        
        // Wait before spawning next mole (based on difficulty)
        gameLoopRef.current = setTimeout(spawnMole, moleHideDuration);
      }, moleShowDuration);
    };

    // Start first mole
    gameLoopRef.current = setTimeout(spawnMole, 500);

    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [isPlaying, difficultySettings]);

  // Timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      isInitialized.current = false;
      return;
    }

    // Only reset game once when starting
    if (!isInitialized.current) {
      isInitialized.current = true;
      resetGame();
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        onTimeChange(newTime);
        
        if (newTime <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          if (gameLoopRef.current) {
            clearTimeout(gameLoopRef.current);
          }
          playGameOverSound(); // เล่นเสียง game over
          onGameEnd();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, resetGame, onTimeChange, onGameEnd]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[50%] sm:h-[45%] md:h-[40%] flex items-end justify-center pb-4 sm:pb-8">
      {/* Ground background */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-green-900 via-green-800 to-transparent" />
      
      {/* Holes container - responsive for mobile */}
      <div className="relative flex items-end justify-center gap-1 sm:gap-2 md:gap-4 lg:gap-6 px-2 sm:px-4 w-full max-w-4xl">
        {Array.from({ length: NUM_HOLES }).map((_, index) => (
          <div
            key={index}
            ref={el => holeRefs.current[index] = el}
            className={cn(
              "relative transition-transform duration-100 flex-1 max-w-[18%] sm:max-w-none",
              hitEffects.some(e => e.index === index) && "scale-110"
            )}
          >
            <Hole index={index}>
              <Mole
                isVisible={activeMole === index}
                customImage={isBomb ? null : customMoleImage}
                onHit={() => handleMoleHit(index)}
                wasHit={hitMoles.has(index)}
                isBomb={isBomb && activeMole === index}
              />
            </Hole>
            
            {/* Hit indicator */}
            {hitEffects.some(e => e.index === index) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <span className="text-2xl sm:text-4xl animate-bounce">
                  {hitEffects.find(e => e.index === index)?.type === 'bomb' ? '💨' : '💥'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
