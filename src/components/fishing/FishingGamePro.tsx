import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFishingGame } from '@/hooks/useFishingGame';
import { useGameScores } from '@/hooks/useGameScores';
import { useAuth } from '@/contexts/AuthContext';
import { addGameToDailyStats } from '@/lib/firestore';
import { FishType, RARITY_COLORS, RARITY_BG, getRandomFish } from './fishTypes';
import { cn } from '@/lib/utils';
import { ArrowLeft, Play, Trophy, Volume2, VolumeX, Loader2 } from 'lucide-react';

type GamePhase = 
  | 'MENU'
  | 'WAITING_CAST'
  | 'CASTING'
  | 'WAITING_BITE'
  | 'FISH_BITE'
  | 'PULLING'
  | 'CAUGHT'
  | 'FISH_ESCAPED';

// SVG Components
const FishingSVG = ({ rodAngle = 0, lineLength = 100 }: { rodAngle?: number; lineLength?: number }) => (
  <svg className="absolute bottom-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax meet">
    {/* Fishing Rod */}
    <g transform={`rotate(${-15 + rodAngle}, 50, 280)`}>
      {/* Rod Handle */}
      <rect x="40" y="250" width="20" height="60" rx="3" fill="url(#handleGradient)" />
      {/* Reel */}
      <circle cx="50" cy="245" r="12" fill="url(#reelGradient)" stroke="#333" strokeWidth="2" />
      <circle cx="50" cy="245" r="6" fill="#666" />
      {/* Rod Body */}
      <path d="M 45 250 Q 100 200, 180 120" stroke="url(#rodGradient)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M 45 250 Q 100 200, 180 120" stroke="#2d1810" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Rod Tip */}
      <circle cx="180" cy="120" r="3" fill="#ff6b00" />
    </g>
    
    {/* Fishing Line */}
    <path 
      d={`M 180 120 Q 200 ${150 + lineLength * 0.3}, 200 ${Math.min(280, 150 + lineLength)}`} 
      stroke="#aaa" 
      strokeWidth="1.5" 
      fill="none"
      strokeDasharray="2,2"
    />
    
    {/* Hook */}
    <g transform={`translate(195, ${Math.min(275, 145 + lineLength)})`}>
      <path d="M 5 0 L 5 8 Q 5 15, 0 18 Q -5 20, -3 15 L 0 10" stroke="#888" strokeWidth="2" fill="none" />
      {/* Bait */}
      <ellipse cx="0" cy="20" rx="4" ry="6" fill="#ff6b6b" />
    </g>
    
    {/* Gradients */}
    <defs>
      <linearGradient id="handleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#4a3728" />
        <stop offset="50%" stopColor="#6b4423" />
        <stop offset="100%" stopColor="#4a3728" />
      </linearGradient>
      <linearGradient id="reelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e88e5" />
        <stop offset="100%" stopColor="#0d47a1" />
      </linearGradient>
      <linearGradient id="rodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8d6e63" />
        <stop offset="50%" stopColor="#d4a574" />
        <stop offset="100%" stopColor="#ffb74d" />
      </linearGradient>
    </defs>
  </svg>
);

const FishSVG = ({ 
  type, 
  x = 50, 
  y = 50, 
  scale = 1, 
  flip = false,
  animate = false 
}: { 
  type: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean;
  animate?: boolean;
}) => {
  const fishColors = {
    common: { body: '#6B8E23', fin: '#556B2F', eye: '#fff' },
    uncommon: { body: '#20B2AA', fin: '#008B8B', eye: '#fff' },
    rare: { body: '#4169E1', fin: '#1E90FF', eye: '#fff' },
    epic: { body: '#9932CC', fin: '#8B008B', eye: '#fff' },
    legendary: { body: '#FFD700', fin: '#FFA500', eye: '#fff' }
  };
  
  const colors = fishColors[type] || fishColors.common;
  
  return (
    <g 
      transform={`translate(${x}, ${y}) scale(${flip ? -scale : scale}, ${scale})`}
      className={animate ? 'animate-fish-swim' : ''}
    >
      {/* Fish Body */}
      <ellipse cx="0" cy="0" rx="30" ry="15" fill={colors.body} />
      {/* Tail */}
      <path d="M 25 0 L 45 -12 L 45 12 Z" fill={colors.fin} />
      {/* Dorsal Fin */}
      <path d="M -10 -15 Q 0 -25, 10 -15" fill={colors.fin} />
      {/* Pectoral Fin */}
      <ellipse cx="5" cy="8" rx="8" ry="4" fill={colors.fin} transform="rotate(20)" />
      {/* Eye */}
      <circle cx="-15" cy="-3" r="5" fill={colors.eye} />
      <circle cx="-16" cy="-3" r="2.5" fill="#000" />
      {/* Mouth */}
      <path d="M -28 2 Q -30 0, -28 -2" stroke="#000" strokeWidth="1.5" fill="none" />
      {/* Scales pattern */}
      <path d="M -5 0 Q 0 -5, 5 0 Q 10 -5, 15 0" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
    </g>
  );
};

const WaterBubbles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-white/20 animate-bubble"
        style={{
          width: `${Math.random() * 10 + 5}px`,
          height: `${Math.random() * 10 + 5}px`,
          left: `${Math.random() * 100}%`,
          bottom: `-20px`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${Math.random() * 3 + 4}s`,
        }}
      />
    ))}
  </div>
);

const WaterWaves = () => (
  <div className="absolute inset-x-0 top-1/3 h-8 overflow-hidden">
    <div className="wave-container">
      <svg className="wave wave1" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path d="M0,50 Q150,0 300,50 T600,50 T900,50 T1200,50 V100 H0 Z" fill="rgba(255,255,255,0.1)" />
      </svg>
      <svg className="wave wave2" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path d="M0,50 Q150,100 300,50 T600,50 T900,50 T1200,50 V100 H0 Z" fill="rgba(255,255,255,0.08)" />
      </svg>
    </div>
  </div>
);

const SceneryBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Sky */}
    <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200" />
    
    {/* Sun */}
    <div className="absolute top-8 right-12 w-20 h-20 bg-yellow-300 rounded-full blur-sm animate-pulse" />
    <div className="absolute top-10 right-14 w-16 h-16 bg-yellow-200 rounded-full" />
    
    {/* Clouds */}
    <div className="absolute top-12 left-[10%] animate-cloud-slow">
      <div className="flex">
        <div className="w-16 h-10 bg-white/80 rounded-full" />
        <div className="w-12 h-8 bg-white/80 rounded-full -ml-4 mt-1" />
        <div className="w-10 h-6 bg-white/80 rounded-full -ml-3 mt-2" />
      </div>
    </div>
    <div className="absolute top-20 left-[60%] animate-cloud-fast">
      <div className="flex">
        <div className="w-12 h-8 bg-white/70 rounded-full" />
        <div className="w-10 h-6 bg-white/70 rounded-full -ml-3 mt-1" />
      </div>
    </div>
    
    {/* Mountains/Islands */}
    <svg className="absolute bottom-1/2 left-0 w-full h-1/4" viewBox="0 0 400 100" preserveAspectRatio="none">
      <path d="M0,100 L50,60 L100,80 L150,40 L200,70 L250,30 L300,60 L350,45 L400,100 Z" fill="#2d5a27" />
      <path d="M0,100 L80,70 L160,85 L240,55 L320,75 L400,100 Z" fill="#3d7a37" />
    </svg>
    
    {/* Palm trees silhouette */}
    <svg className="absolute bottom-1/2 left-4 w-16 h-24" viewBox="0 0 50 80">
      <path d="M25,80 L25,40" stroke="#1a3d16" strokeWidth="4" />
      <path d="M25,40 Q10,30 5,35 Q15,35 25,40" fill="#1a3d16" />
      <path d="M25,40 Q40,30 45,35 Q35,35 25,40" fill="#1a3d16" />
      <path d="M25,40 Q25,20 20,25 Q22,32 25,40" fill="#1a3d16" />
      <path d="M25,40 Q25,20 30,25 Q28,32 25,40" fill="#1a3d16" />
    </svg>
    
    {/* Water surface line */}
    <div className="absolute top-1/3 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    
    {/* Underwater area */}
    <div className="absolute bottom-0 inset-x-0 top-1/3 bg-gradient-to-b from-cyan-500/80 via-blue-600/90 to-blue-900" />
    
    {/* Underwater light rays */}
    <div className="absolute top-1/3 left-1/4 w-8 h-48 bg-gradient-to-b from-white/20 to-transparent transform -skew-x-12" />
    <div className="absolute top-1/3 left-1/2 w-6 h-40 bg-gradient-to-b from-white/15 to-transparent transform skew-x-6" />
    <div className="absolute top-1/3 right-1/4 w-10 h-52 bg-gradient-to-b from-white/20 to-transparent transform -skew-x-6" />
    
    {/* Seabed */}
    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-amber-800/50 to-transparent" />
    
    {/* Seaweed */}
    <svg className="absolute bottom-0 left-8 w-12 h-24 animate-seaweed" viewBox="0 0 30 60">
      <path d="M15,60 Q5,45 15,30 Q25,15 15,0" stroke="#2d5a27" strokeWidth="4" fill="none" />
    </svg>
    <svg className="absolute bottom-0 right-12 w-10 h-20 animate-seaweed-delayed" viewBox="0 0 30 60">
      <path d="M15,60 Q25,45 15,30 Q5,15 15,0" stroke="#3d7a37" strokeWidth="3" fill="none" />
    </svg>
    
    <WaterBubbles />
    <WaterWaves />
  </div>
);

const ProgressBar = ({ 
  progress, 
  combo = 1, 
  fish 
}: { 
  progress: number; 
  combo?: number;
  fish?: FishType | null;
}) => {
  // กำหนดสีตาม % progress
  const getProgressColor = () => {
    if (progress >= 80) return 'from-green-400 via-green-300 to-green-400';
    if (progress >= 50) return 'from-cyan-400 via-cyan-300 to-cyan-400';
    if (progress >= 30) return 'from-yellow-400 via-yellow-300 to-yellow-400';
    return 'from-red-400 via-red-300 to-red-400';
  };

  // กำหนดสีข้อความ % ตาม progress
  const getTextColor = () => {
    if (progress >= 80) return 'text-green-400';
    if (progress >= 50) return 'text-cyan-400';
    if (progress >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="absolute top-14 sm:top-4 left-1/2 -translate-x-1/2 w-72 sm:w-80 md:w-96 max-w-[90%]">
      {/* Fish info and difficulty */}
      {fish && (
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">{fish.emoji}</span>
            <span className={cn("text-sm sm:text-base font-bold", RARITY_COLORS[fish.rarity])}>
              {fish.name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/70">
            <span className="bg-green-500/30 px-1.5 py-0.5 rounded">+{fish.pullGain}%</span>
            <span className="bg-red-500/30 px-1.5 py-0.5 rounded">-{fish.decayRate}%</span>
          </div>
        </div>
      )}
      
      <div className="relative">
        {/* Reel icon */}
        <div className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-2 sm:border-4 border-gray-700 flex items-center justify-center shadow-lg z-10">
          <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-gray-600 flex items-center justify-center">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-gray-400" />
          </div>
        </div>
        
        {/* Progress bar background */}
        <div className="ml-4 sm:ml-5 md:ml-6 h-8 sm:h-9 md:h-10 bg-gray-800/80 rounded-full overflow-hidden border-2 border-gray-600 shadow-inner relative">
          {/* Progress fill */}
          <div 
            className={cn(
              "h-full transition-all duration-100 relative",
              `bg-gradient-to-r ${getProgressColor()}`
            )}
            style={{ width: `${progress}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
            {/* Moving shine */}
            <div className="absolute inset-y-0 w-6 sm:w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shine" />
          </div>
          
          {/* Percentage text overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "text-lg sm:text-xl md:text-2xl font-black drop-shadow-lg",
              getTextColor(),
              "transition-all duration-100"
            )}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        
        {/* Combo text */}
        {combo > 1 && (
          <div className="absolute -right-1 sm:-right-2 -bottom-1 sm:-bottom-2 bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full animate-bounce">
            {combo}x COMBO
          </div>
        )}
      </div>
      
      {/* Progress status text */}
      <div className="mt-2 text-center">
        <span className={cn(
          "text-xs sm:text-sm font-bold",
          progress >= 80 ? "text-green-400" : 
          progress >= 50 ? "text-cyan-400" : 
          progress >= 30 ? "text-yellow-400" : "text-red-400"
        )}>
          {progress >= 90 ? "🎉 เกือบได้แล้ว!" :
           progress >= 70 ? "💪 ดึงต่อไป!" :
           progress >= 50 ? "👍 ไปได้สวย!" :
           progress >= 30 ? "⚡ เร่งมือหน่อย!" :
           progress > 0 ? "⚠️ ปลากำลังหนี!" : "👋 เริ่มโบกมือ!"}
        </span>
      </div>
    </div>
  );
};

export function FishingGamePro() {
  const navigate = useNavigate();
  const { videoRef, canvasRef, gesture, isLoading, error } = useFishingGame();
  const { submitScore, personalBest, loadPersonalBest } = useGameScores();
  const { lineProfile } = useAuth();
  
  const [phase, setPhase] = useState<GamePhase>('MENU');
  const [score, setScore] = useState(0);
  const [totalCaught, setTotalCaught] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('fishing_highscore_v3');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const gameStartTime = useRef<number>(0);
  const statsSavedRef = useRef(false); // Prevent double saving stats
  
  const [pullProgress, setPullProgress] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentFish, setCurrentFish] = useState<FishType | null>(null);
  const [caughtFishes, setCaughtFishes] = useState<FishType[]>([]);
  const [showCaughtPopup, setShowCaughtPopup] = useState(false);
  const [fishX, setFishX] = useState(70); // Fish X position (% from left)
  const [fishY, setFishY] = useState(60); // Fish Y position (% from top)
  const [isFishBiting, setIsFishBiting] = useState(false);
  const [combo, setCombo] = useState(1);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const castDetected = useRef(false);
  const lastSlapCount = useRef(0);
  const lastSlapTime = useRef(Date.now());

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    timerRef.current = null;
    phaseTimerRef.current = null;
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTotalCaught(0);
    setCaughtFishes([]);
    setPhase('WAITING_CAST');
    castDetected.current = false;
    statsSavedRef.current = false; // Reset for new game
    setCombo(1);
    setIsNewRecord(false);
    gameStartTime.current = Date.now();
    loadPersonalBest('fishing', 'medium');
  }, [loadPersonalBest]);

  const readyForCast = useCallback(() => {
    clearTimers();
    setPhase('WAITING_CAST');
    setCurrentFish(null);
    setShowCaughtPopup(false);
    castDetected.current = false;
    setPullProgress(0);
    setFishX(70);
    setIsFishBiting(false);
  }, [clearTimers]);

  const handleCast = useCallback(() => {
    if (castDetected.current) return;
    castDetected.current = true;
    
    setPullProgress(0);
    setPhase('CASTING');
    setFishX(85);
    
    // เลือกปลาก่อนเพื่อใช้ waitTime ตามความหายาก
    const fish = getRandomFish();
    setCurrentFish(fish);
    
    phaseTimerRef.current = setTimeout(() => {
      // ใช้ waitTime ตามความหายากของปลา
      const waitSeconds = Math.floor(Math.random() * (fish.waitTimeMax - fish.waitTimeMin + 1)) + fish.waitTimeMin;
      setWaitTime(waitSeconds);
      setTimeLeft(waitSeconds);
      setPhase('WAITING_BITE');
      
      // Fish approaches
      setFishY(50 + Math.random() * 20);
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearTimers();
            setPhase('FISH_BITE');
            setIsFishBiting(true);
            setFishX(50);
            
            phaseTimerRef.current = setTimeout(() => {
              setPhase('PULLING');
              lastSlapCount.current = gesture?.slapCount || 0;
              lastSlapTime.current = Date.now();
            }, 1200);
            
            return 0;
          }
          // Fish slowly approaches
          setFishX(prev => Math.max(55, prev - 3));
          return prev - 1;
        });
      }, 1000);
    }, 800);
  }, [clearTimers, gesture.slapCount]);

  const handleCaught = useCallback(() => {
    clearTimers();
    setPhase('CAUGHT');
    setShowCaughtPopup(true);
    
    if (currentFish) {
      const bonusScore = Math.floor(currentFish.score * (1 + (combo - 1) * 0.1));
      const newScore = score + bonusScore;
      setScore(newScore);
      setTotalCaught(prev => prev + 1);
      setCaughtFishes(prev => [...prev, currentFish]);
      setCombo(prev => prev + 1);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('fishing_highscore_v3', newScore.toString());
      }
    }
    
    phaseTimerRef.current = setTimeout(() => {
      readyForCast();
    }, 3000);
  }, [currentFish, score, highScore, combo, clearTimers, readyForCast]);

  const handleEscaped = useCallback(() => {
    clearTimers();
    setPhase('FISH_ESCAPED');
    setCurrentFish(null);
    setCombo(1);
    
    phaseTimerRef.current = setTimeout(() => {
      readyForCast();
    }, 2000);
  }, [clearTimers, readyForCast]);

  // Detect casting gesture
  useEffect(() => {
    if (phase === 'WAITING_CAST' && gesture?.isCasting && !castDetected.current) {
      handleCast();
    }
  }, [phase, gesture?.isCasting, handleCast]);

  // Pulling logic with regression - ใช้ difficulty ตามความหายากของปลา
  useEffect(() => {
    if (phase !== 'PULLING' || !gesture || !currentFish) return;

    // ใช้ค่า pullGain และ decayRate จากปลาที่จับได้
    const pullGain = currentFish.pullGain || 12;
    const decayRate = currentFish.decayRate || 0.5;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentSlapCount = gesture?.slapCount || 0;
      
      // Debug log
      console.log('🎣 Checking slaps:', {
        currentSlapCount,
        lastSlapCount: lastSlapCount.current,
        diff: currentSlapCount - lastSlapCount.current
      });
      
      // Check for new slap
      if (currentSlapCount > lastSlapCount.current) {
        const newSlaps = currentSlapCount - lastSlapCount.current;
        lastSlapCount.current = currentSlapCount;
        lastSlapTime.current = now;
        
        console.log('✅ Slap detected!', newSlaps, 'slaps, gain:', pullGain * newSlaps);
        
        setPullProgress(prev => {
          const newProgress = Math.min(100, prev + (pullGain * newSlaps));
          
          // Move fish closer
          setFishX(50 - (newProgress / 100) * 35);
          
          if (newProgress >= 100) {
            clearInterval(interval);
            handleCaught();
            return 100;
          }
          return newProgress;
        });
      } else {
        // No slap - fish pulls back (regression)
        const timeSinceLastSlap = now - lastSlapTime.current;
        
        if (timeSinceLastSlap > 800) { // ลดจาก 1000ms เป็น 800ms
          setPullProgress(prev => {
            const newProgress = Math.max(0, prev - decayRate);
            
            // Fish moves away
            setFishX(50 - (newProgress / 100) * 35);
            
            if (newProgress <= 0) {
              clearInterval(interval);
              handleEscaped();
              return 0;
            }
            return newProgress;
          });
        }
      }
    }, 100); // เปลี่ยนจาก 500ms เป็น 100ms เพื่อให้ responsive มากขึ้น!

    return () => clearInterval(interval);
  }, [phase, gesture?.slapCount, currentFish, handleCaught, handleEscaped]); // เปลี่ยน gesture เป็น gesture?.slapCount

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const goToMenu = useCallback(async () => {
    clearTimers();
    
    // Save score to database if player caught any fish
    if (totalCaught > 0 && score > 0) {
      const duration = Math.floor((Date.now() - gameStartTime.current) / 1000);
      const perfectCatches = caughtFishes.filter(f => f.rarity === 'legendary' || f.rarity === 'epic').length;
      
      const result = await submitScore({
        gameType: 'fishing',
        level: 'medium',
        score,
        duration,
        gameData: {
          fishCaught: totalCaught,
          perfectCatches,
          biggestFish: caughtFishes.length > 0 
            ? caughtFishes.reduce((a, b) => a.score > b.score ? a : b).name 
            : undefined,
        },
      });
      
      if (result.isNewPersonalBest) {
        setIsNewRecord(true);
      }
      
      // Save to daily stats (calories, workout time, points, streak)
      if (lineProfile?.userId && !statsSavedRef.current) {
        statsSavedRef.current = true;
        try {
          await addGameToDailyStats(
            lineProfile.userId,
            'fishing',
            duration,
            score
          );
          console.log('Fishing stats saved!', { duration, score });
        } catch (error) {
          console.error('Error saving game stats:', error);
        }
      }
    }
    
    setPhase('MENU');
  }, [clearTimers, totalCaught, score, caughtFishes, submitScore, lineProfile?.userId]);

  const getFishRarity = (): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' => {
    if (!currentFish) return 'common';
    return currentFish.rarity as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-blue-900 to-blue-950 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate('/game-mode')} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">
            กลับ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Game Scene */}
      <SceneryBackground />

      {/* User Camera Display with Skeleton - Right Side (Responsive) */}
      {/* ปรับขนาดกล้อง: แก้ไข w-32/w-48/w-64 เพื่อเปลี่ยนขนาด */}
      {/* ปรับตำแหน่ง: แก้ไข right-2/top-16 เพื่อเปลี่ยนตำแหน่ง */}
      <div className="absolute right-2 sm:right-4 top-16 sm:top-20 z-40">
        <div className="relative w-32 h-24 sm:w-40 sm:h-30 md:w-48 md:h-36 lg:w-56 lg:h-42 rounded-lg sm:rounded-xl overflow-hidden border-2 sm:border-4 border-white/30 shadow-xl sm:shadow-2xl bg-black/50">
          {/* Video feed */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
          />
          {/* Skeleton overlay canvas */}
          <canvas 
            ref={canvasRef} 
            width={640} 
            height={480}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Camera label - hidden on small screens */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] sm:text-xs text-center py-0.5 sm:py-1 hidden sm:block">
            📷 กล้องของคุณ
          </div>
        </div>
      </div>
      
      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">กำลังโหลดกล้อง...</p>
          </div>
        </div>
      )}
      
      {/* Top UI */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30">
        <button
          onClick={() => phase === 'MENU' ? navigate('/game-mode') : goToMenu()}
          className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        
        {phase !== 'MENU' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full backdrop-blur-sm">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-xl font-bold text-white">{score}</span>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-colors"
        >
          {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
        </button>
      </div>

      {/* Fishing Rod (First Person View) */}
      {phase !== 'MENU' && (
        <FishingSVG 
          rodAngle={phase === 'CASTING' ? 20 : phase === 'PULLING' ? Math.sin(Date.now() / 200) * 5 : 0}
          lineLength={phase === 'WAITING_CAST' ? 50 : phase === 'PULLING' ? 100 - pullProgress * 0.5 : 100}
        />
      )}

      {/* Fish in water - responsive size */}
      {(phase === 'WAITING_BITE' || phase === 'FISH_BITE' || phase === 'PULLING') && (
        <div 
          className="absolute transition-all duration-300"
          style={{ 
            left: `${fishX}%`, 
            top: `${fishY}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <svg width="80" height="53" viewBox="-60 -40 120 80" className={cn(
            "sm:w-[100px] sm:h-[67px] md:w-[120px] md:h-[80px]",
            phase === 'FISH_BITE' && 'animate-fish-bite',
            phase === 'PULLING' && 'animate-fish-struggle'
          )}>
            <FishSVG type={getFishRarity()} animate />
          </svg>
        </div>
      )}

      {/* Progress Bar during PULLING */}
      {phase === 'PULLING' && (
        <ProgressBar progress={pullProgress} combo={combo} fish={currentFish} />
      )}

      {/* MENU */}
      {phase === 'MENU' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/30 backdrop-blur-sm p-4">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white drop-shadow-lg mb-2">
              🎣 ตกปลา
            </h1>
            <p className="text-lg sm:text-xl text-white/80">Fishing Game Pro</p>
          </div>
          
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-yellow-500/30 rounded-full backdrop-blur-sm mb-6 sm:mb-8">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            <span className="text-base sm:text-lg text-white">คะแนนสูงสุด: {highScore}</span>
          </div>
          
          <button
            onClick={startGame}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-lg sm:text-xl font-bold transition-all",
              "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
              "hover:scale-105 hover:shadow-xl shadow-lg",
              "disabled:opacity-50"
            )}
          >
            <Play className="w-6 h-6 sm:w-7 sm:h-7" />
            เริ่มตกปลา
          </button>
          
          <div className="mt-6 sm:mt-8 text-center text-white/70 max-w-md text-xs sm:text-sm space-y-1 px-4">
            <p>🎣 สะบัดแขนลงเพื่อเขวี้ยงเบ็ด</p>
            <p>👋 โบกมือลงต่อเนื่องเพื่อดึงปลา</p>
            <p>⚠️ หยุดโบก = ปลาจะหลุด!</p>
          </div>
        </div>
      )}

      {/* WAITING_CAST */}
      {phase === 'WAITING_CAST' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 p-4">
          <div className="text-center bg-black/40 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-8">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4 animate-bounce">🎣</div>
            <h2 className="text-lg sm:text-2xl font-bold text-white">สะบัดแขนลงเพื่อเขวี้ยงเบ็ด!</h2>
          </div>
        </div>
      )}

      {/* CASTING */}
      {phase === 'CASTING' && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-3xl sm:text-4xl animate-ping">🎣</div>
        </div>
      )}

      {/* WAITING_BITE */}
      {phase === 'WAITING_BITE' && (
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-center">
            <p className="text-white/80 text-xs sm:text-sm">รอปลากินเบ็ด...</p>
            <p className="text-xl sm:text-2xl font-bold text-cyan-400">{timeLeft}s</p>
          </div>
        </div>
      )}

      {/* FISH_BITE */}
      {phase === 'FISH_BITE' && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none p-4">
          <div className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-red-500/90 border-2 sm:border-4 border-yellow-400 animate-bounce">
            <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🐟❗</div>
            <h2 className="text-xl sm:text-2xl font-black text-white">ปลากินเบ็ด!</h2>
            <p className="text-white/90 text-sm sm:text-base">โบกมือเร็ว!</p>
          </div>
        </div>
      )}

      {/* PULLING - Instructions */}
      {phase === 'PULLING' && (
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-20">
          <div className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-center transition-colors",
            gesture?.isSlapping ? "bg-green-500/80" : "bg-yellow-500/80"
          )}>
            <p className="text-white font-bold text-base sm:text-lg">
              {gesture?.isSlapping ? '✓ เยี่ยม! โบกต่อ!' : '👋 โบกมือลง!'}
            </p>
          </div>
        </div>
      )}

      {/* CAUGHT */}
      {phase === 'CAUGHT' && showCaughtPopup && currentFish && (
        <div className="absolute inset-0 flex items-center justify-center z-40 p-4">
          <div className={cn(
            "text-center p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl",
            RARITY_BG[currentFish.rarity],
            "border-2 sm:border-4 animate-scale-in",
            RARITY_COLORS[currentFish.rarity]
          )}>
            <div className="text-5xl sm:text-6xl md:text-7xl mb-2 sm:mb-4">{currentFish.emoji}</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 sm:mb-2">จับได้!</h2>
            <p className={cn("text-xl sm:text-2xl font-bold", RARITY_COLORS[currentFish.rarity])}>
              {currentFish.name}
            </p>
            <div className="mt-2 sm:mt-4 flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              <span className="text-xl sm:text-2xl font-bold text-yellow-400">
                +{Math.floor(currentFish.score * (1 + (combo - 1) * 0.1))}
              </span>
              {combo > 1 && <span className="text-orange-400 font-bold text-sm sm:text-base">(x{combo})</span>}
            </div>
          </div>
        </div>
      )}

      {/* FISH_ESCAPED */}
      {phase === 'FISH_ESCAPED' && (
        <div className="absolute inset-0 flex items-center justify-center z-40 p-4">
          <div className="text-center p-4 sm:p-6 md:p-8 bg-gray-500/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-gray-400">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-4">🐟💨</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">ปลาหลุด!</h2>
            <p className="text-white/70 mt-1 sm:mt-2 text-sm sm:text-base">ลองใหม่อีกครั้ง</p>
          </div>
        </div>
      )}

      {/* Caught fishes collection */}
      {phase !== 'MENU' && caughtFishes.length > 0 && (
        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black/40 backdrop-blur-sm rounded-lg p-1 sm:p-2 z-30">
          <div className="flex gap-0.5 sm:gap-1 flex-wrap max-w-24 sm:max-w-32">
            {caughtFishes.slice(-6).map((fish, i) => (
              <span key={i} className="text-lg sm:text-2xl">{fish.emoji}</span>
            ))}
          </div>
        </div>
      )}

      {/* Debug overlay (small) - hidden on very small screens */}
      {phase !== 'MENU' && (
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 text-[8px] sm:text-[10px] text-white/40 bg-black/20 rounded px-1 sm:px-2 py-0.5 sm:py-1 z-30 hidden xs:block">
          <p>Slap: {gesture?.slapCount || 0} | Progress: {pullProgress.toFixed(0)}%</p>
        </div>
      )}

      {/* Custom styles */}
      <style>{`
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-400px) scale(0.5); opacity: 0; }
        }
        .animate-bubble {
          animation: bubble 5s ease-in infinite;
        }
        
        @keyframes cloud-slow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(30px); }
        }
        .animate-cloud-slow {
          animation: cloud-slow 20s ease-in-out infinite;
        }
        
        @keyframes cloud-fast {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-40px); }
        }
        .animate-cloud-fast {
          animation: cloud-fast 15s ease-in-out infinite;
        }
        
        @keyframes seaweed {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-seaweed {
          animation: seaweed 3s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .animate-seaweed-delayed {
          animation: seaweed 3.5s ease-in-out infinite;
          animation-delay: 0.5s;
          transform-origin: bottom center;
        }
        
        @keyframes fish-bite {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(-50%, -50%) rotate(-10deg) translateX(-5px); }
          75% { transform: translate(-50%, -50%) rotate(10deg) translateX(5px); }
        }
        .animate-fish-bite {
          animation: fish-bite 0.3s ease-in-out infinite;
        }
        
        @keyframes fish-struggle {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-8deg) translateY(-3px); }
          75% { transform: rotate(8deg) translateY(3px); }
        }
        .animate-fish-struggle {
          animation: fish-struggle 0.4s ease-in-out infinite;
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .animate-shine {
          animation: shine 2s linear infinite;
        }
        
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        
        .wave-container {
          position: relative;
          width: 200%;
          height: 100%;
        }
        .wave {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .wave1 {
          animation: wave 8s linear infinite;
        }
        .wave2 {
          animation: wave 10s linear infinite reverse;
          margin-left: -50%;
        }
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
