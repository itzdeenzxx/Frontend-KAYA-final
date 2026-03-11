import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWhackAMoleMediaPipe } from '@/hooks/useWhackAMoleMediaPipe';
import { useGameScores } from '@/hooks/useGameScores';
import { useAuth } from '@/contexts/AuthContext';
import { addGameToDailyStats } from '@/lib/firestore';
import { GameBoard } from './GameBoard';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Play, 
  Trophy, 
  Timer, 
  Upload, 
  X, 
  RotateCcw,
  Volume2,
  VolumeX,
  Loader2,
  ImageIcon,
  Zap
} from 'lucide-react';

type GameScreen = 'MENU' | 'DIFFICULTY_SELECT' | 'READY' | 'PLAYING' | 'GAME_OVER';
type Difficulty = 'easy' | 'medium' | 'hard';

const GAME_DURATION = 60; // seconds

// ความเร็วตุ่นตามระดับความยาก (ms)
const DIFFICULTY_SETTINGS = {
  easy: {
    moleShowDuration: 2000,   // ตุ่นโผล่นาน
    moleHideDuration: 800,    // รอนานก่อนโผล่ใหม่
    bombChance: 0.1,          // โอกาสเจอระเบิด 10%
    label: 'ง่าย',
    emoji: '🐢',
    color: 'from-green-500 to-emerald-600'
  },
  medium: {
    moleShowDuration: 1200,
    moleHideDuration: 500,
    bombChance: 0.2,          // โอกาสเจอระเบิด 20%
    label: 'ปานกลาง',
    emoji: '🐇',
    color: 'from-yellow-500 to-orange-500'
  },
  hard: {
    moleShowDuration: 700,
    moleHideDuration: 300,
    bombChance: 0.3,          // โอกาสเจอระเบิด 30%
    label: 'ยาก',
    emoji: '⚡',
    color: 'from-red-500 to-pink-600'
  }
};

// ===================================================================
// 📐 ปรับขนาด / ตำแหน่งเฟรมรูปคน
// viewBox = "0 0 640 360" (16:9)
// cx, cy = จุดกึ่งกลางเฟรม, scale = ขนาด (1.0=ปกติ)
// ===================================================================
const FRAME_CONFIG = { cx: 320, cy: 160, scale: 0.55 };

const buildPersonPath = (cx: number, cy: number, s: number) => {
  const p = (x: number, y: number) =>
    `${(cx + x * s).toFixed(1)},${(cy + y * s).toFixed(1)}`;
  // หัวกลม → คอ → ไหล่โค้ง → ลำตัว
  return [
    // --- หัว (head) ---
    `M ${p(0, -145)}`,
    `C ${p(44, -145)} ${p(72, -115)} ${p(72, -82)}`,
    `C ${p(72, -50)} ${p(52, -22)} ${p(28, -12)}`,
    // --- คอ → ไหล่ขวา ---
    `L ${p(22, 10)}`,
    `C ${p(60, 18)} ${p(100, 42)} ${p(125, 65)}`,
    `C ${p(142, 80)} ${p(148, 98)} ${p(148, 112)}`,
    `L ${p(148, 160)}`,
    // --- ก้นล่าง ---
    `L ${p(-148, 160)}`,
    `L ${p(-148, 112)}`,
    // --- ไหล่ซ้าย ---
    `C ${p(-148, 98)} ${p(-142, 80)} ${p(-125, 65)}`,
    `C ${p(-100, 42)} ${p(-60, 18)} ${p(-22, 10)}`,
    `L ${p(-28, -12)}`,
    // --- หัวซ้าย ---
    `C ${p(-52, -22)} ${p(-72, -50)} ${p(-72, -82)}`,
    `C ${p(-72, -115)} ${p(-44, -145)} ${p(0, -145)}`,
    `Z`,
  ].join(' ');
};

export function WhackAMoleGame() {
  const navigate = useNavigate();
  const { videoRef, canvasRef, leftHand, rightHand, isLoading, error, isBodyInFrame } = useWhackAMoleMediaPipe();
  const { submitScore, personalBest, loadPersonalBest } = useGameScores();
  const { lineProfile } = useAuth();
  
  const [screen, setScreen] = useState<GameScreen>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);

  // Background music
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/assets/music/mole-game.mp3');
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

  // ตรวจจับแนวจอ — บังคับเล่นแนวนอนเท่านั้น
  const [isPortrait, setIsPortrait] = useState(() => window.innerHeight > window.innerWidth);
  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('whackamole_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [customMoleImage, setCustomMoleImage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Sync mute state with BGM
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const statsSavedRef = useRef(false); // Prevent double saving stats
  
  // Track game stats
  const gameStatsRef = useRef({
    molesHit: 0,
    bombsHit: 0,
    totalAttempts: 0,
    bestCombo: 0,
    currentCombo: 0,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomMoleImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Remove custom image
  const removeCustomImage = useCallback(() => {
    setCustomMoleImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setScreen('DIFFICULTY_SELECT');
  }, []);

  // Start game with difficulty
  const startGameWithDifficulty = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setScreen('READY');
    setCountdown(null);
    setIsNewRecord(false);
    statsSavedRef.current = false; // Reset stats saved flag
    gameStatsRef.current = {
      molesHit: 0,
      bombsHit: 0,
      totalAttempts: 0,
      bestCombo: 0,
      currentCombo: 0,
    };
    loadPersonalBest('whackAMole', diff);
  }, [loadPersonalBest]);

  // READY screen: ตรวจจับว่าผู้ใช้อยู่ในเฟรม → countdown 3s → start
  useEffect(() => {
    if (screen !== 'READY') {
      setCountdown(null);
      return;
    }
    if (!isBodyInFrame) {
      setCountdown(null);
      return;
    }
    // Body detected — start 3-second countdown
    setCountdown(5);
    let current = 5;
    const interval = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(interval);
        setScreen('PLAYING');
        setCountdown(null);
      } else {
        setCountdown(current);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, isBodyInFrame]);

  // Handle game end
  const handleGameEnd = useCallback(async () => {
    setScreen('GAME_OVER');
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('whackamole_highscore', score.toString());
    }
    
    // Save score to database
    if (score > 0) {
      const stats = gameStatsRef.current;
      const accuracy = stats.totalAttempts > 0 
        ? Math.round((stats.molesHit / stats.totalAttempts) * 100) 
        : 0;
      
      const result = await submitScore({
        gameType: 'whackAMole',
        level: difficulty,
        score,
        duration: GAME_DURATION,
        gameData: {
          molesHit: stats.molesHit,
          bombsHit: stats.bombsHit,
          accuracy,
          bestCombo: stats.bestCombo,
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
            'whackAMole',
            GAME_DURATION,
            score
          );
          console.log('Whack-a-Mole stats saved!', { duration: GAME_DURATION, score });
        } catch (error) {
          console.error('Error saving game stats:', error);
        }
      }
    }
  }, [score, highScore, difficulty, submitScore, lineProfile?.userId]);

  // Handle mole hit - track stats
  const handleMoleHit = useCallback(() => {
    gameStatsRef.current.molesHit += 1;
    gameStatsRef.current.totalAttempts += 1;
    gameStatsRef.current.currentCombo += 1;
    if (gameStatsRef.current.currentCombo > gameStatsRef.current.bestCombo) {
      gameStatsRef.current.bestCombo = gameStatsRef.current.currentCombo;
    }
  }, []);

  // Handle bomb hit - track stats
  const handleBombHit = useCallback(() => {
    gameStatsRef.current.bombsHit += 1;
    gameStatsRef.current.totalAttempts += 1;
    gameStatsRef.current.currentCombo = 0; // Reset combo on bomb hit
  }, []);

  // Restart game
  const restartGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setScreen('READY');
    setCountdown(null);
    setIsNewRecord(false);
    gameStatsRef.current = {
      molesHit: 0,
      bombsHit: 0,
      totalAttempts: 0,
      bestCombo: 0,
      currentCombo: 0,
    };
  }, []);

  // Go to menu
  const goToMenu = useCallback(() => {
    setScreen('MENU');
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/game-mode')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            กลับไปหน้าเกม
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 overflow-hidden">
      {/* Portrait blocker — บังคับเล่นแนวนอน */}
      {isPortrait && (
        <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            {/* Rotate icon */}
            <div className="text-7xl mb-6 animate-pulse">📱↪️</div>
            <div className="relative w-24 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-3 border-white/60 rounded-lg animate-[spin_3s_ease-in-out_infinite]" 
                   style={{ transformOrigin: 'center', animation: 'none' }}>
                <svg viewBox="0 0 96 64" className="w-full h-full">
                  <rect x="4" y="4" width="56" height="88" rx="8" fill="none" stroke="white" strokeWidth="3"
                    transform="rotate(-90 48 48)" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-black text-white mb-3">
              กรุณาหมุนจอเป็นแนวนอน
            </h2>
            <p className="text-white/70 text-sm mb-6">
              เกมตีตัวตุ่นต้องเล่นในแนวนอน (Landscape) เท่านั้น<br />
              เพื่อประสบการณ์การเล่นที่ดีที่สุด
            </p>
            <div className="flex items-center justify-center gap-2 text-white/50 text-xs">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <span>รอการหมุนจอ...</span>
            </div>
            <button
              onClick={() => navigate('/game-mode')}
              className="mt-6 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 text-sm font-medium transition-colors"
            >
              ← กลับหน้าเกม
            </button>
          </div>
        </div>
      )}

      {/* Hidden video element */}
      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        playsInline
        muted
      />
      
      {/* Camera canvas (background) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        width={640}
        height={480}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">กำลังโหลดกล้อง...</p>
            <p className="text-gray-400 text-sm mt-2">กรุณาอนุญาตการเข้าถึงกล้อง</p>
          </div>
        </div>
      )}
      
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30">
        <button
          onClick={() => navigate('/game-mode')}
          className="p-3 bg-black/30 hover:bg-black/50 rounded-full transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        
        {screen === 'PLAYING' && (
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full backdrop-blur-sm">
              <Timer className="w-5 h-5 text-yellow-400" />
              <span className={cn(
                "text-xl font-bold text-white",
                timeLeft <= 10 && "text-red-400 animate-pulse"
              )}>
                {timeLeft}s
              </span>
            </div>
            
            {/* Score */}
            <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full backdrop-blur-sm">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-xl font-bold text-white">{score}</span>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 bg-black/30 hover:bg-black/50 rounded-full transition-colors backdrop-blur-sm"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
      
      {/* Main content based on screen */}
      {screen === 'MENU' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-5xl sm:text-6xl font-black text-white drop-shadow-lg mb-2">
              🔨 ตีตัวตุ่น
            </h1>
            <p className="text-xl text-white/80">Whack-a-Mole</p>
          </div>
          
          {/* High score */}
          <div className="flex items-center gap-2 px-6 py-3 bg-yellow-500/30 rounded-full backdrop-blur-sm mb-8">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span className="text-lg text-white">คะแนนสูงสุด: {highScore}</span>
          </div>
          
          {/* Custom mole image section */}
          <div className="mb-8 flex flex-col items-center">
            <p className="text-white/80 mb-3 text-sm">กำหนดรูปตัวตุ่นเอง (ไม่บังคับ)</p>
            
            {customMoleImage ? (
              <div className="relative">
                <div className="w-24 h-24 rounded-xl overflow-hidden border-4 border-white/30 shadow-lg">
                  <img
                    src={customMoleImage}
                    alt="Custom mole"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={removeCustomImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm border-2 border-dashed border-white/40"
              >
                <ImageIcon className="w-5 h-5 text-white" />
                <span className="text-white">อัพโหลดรูปตัวตุ่น</span>
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          {/* Start button */}
          <button
            onClick={startGame}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-2xl text-xl font-bold transition-all",
              "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
              "hover:scale-105 hover:shadow-xl hover:shadow-green-500/30",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            <Play className="w-7 h-7" />
            เริ่มเกม
          </button>
          
          {/* Instructions */}
          <div className="mt-8 text-center text-white/70 max-w-md">
            <p className="text-sm">
              ใช้มือตีตัวตุ่นที่โผล่ขึ้นมาจากหลุม <br />
              คุณมีเวลา {GAME_DURATION} วินาที ทำคะแนนให้ได้มากที่สุด!<br />
              <span className="text-red-300">⚠️ ระวัง! อย่าตีระเบิด 💣 จะถูกหักคะแนน!</span>
            </p>
          </div>
        </div>
      )}

      {/* Difficulty Select Screen */}
      {screen === 'DIFFICULTY_SELECT' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/30 backdrop-blur-sm p-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-white drop-shadow-lg mb-2">
              เลือกระดับความยาก
            </h2>
            <p className="text-white/80">Select Difficulty</p>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-sm">
            {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((diff) => {
              const settings = DIFFICULTY_SETTINGS[diff];
              return (
                <button
                  key={diff}
                  onClick={() => startGameWithDifficulty(diff)}
                  className={cn(
                    "flex items-center justify-between px-6 py-5 rounded-2xl text-xl font-bold transition-all",
                    "bg-gradient-to-r text-white",
                    settings.color,
                    "hover:scale-105 hover:shadow-xl"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{settings.emoji}</span>
                    <span>{settings.label}</span>
                  </div>
                  <div className="text-sm opacity-80">
                    💣 {Math.round(settings.bombChance * 100)}%
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={goToMenu}
            className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-colors"
          >
            ← กลับ
          </button>
        </div>
      )}

      {/* ============ READY Screen — เฟรมรูปคนก่อนเริ่มเกม ============ */}
      {screen === 'READY' && (() => {
        const { cx, cy, scale: s } = FRAME_CONFIG;
        const personPath = buildPersonPath(cx, cy, s);

        // Corner bracket positions
        const pad = 14;
        const bLen = 28 * s;
        const frameLeft = cx - 155 * s - pad;
        const frameRight = cx + 155 * s + pad;
        const frameTop = cy - 150 * s - pad;
        const frameBottom = cy + 168 * s + pad;
        const corners = [
          `M ${frameLeft + bLen},${frameTop} L ${frameLeft},${frameTop} L ${frameLeft},${frameTop + bLen}`,
          `M ${frameRight - bLen},${frameTop} L ${frameRight},${frameTop} L ${frameRight},${frameTop + bLen}`,
          `M ${frameLeft},${frameBottom - bLen} L ${frameLeft},${frameBottom} L ${frameLeft + bLen},${frameBottom}`,
          `M ${frameRight},${frameBottom - bLen} L ${frameRight},${frameBottom} L ${frameRight - bLen},${frameBottom}`,
        ];
        const scanLeft = cx - 148 * s;
        const scanW = 296 * s;
        const scanTop = cy - 145 * s;
        const scanBottom = cy + 160 * s;

        const strokeColor = isBodyInFrame ? '#4ade80' : 'rgba(255,255,255,0.6)';
        const strokeW = isBodyInFrame ? 3 : 2;

        return (
          <div className="absolute inset-0 z-20">
            {/* SVG overlay */}
            <svg
              viewBox="0 0 640 360"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              {/* Dark mask with person cutout */}
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d={`M -10,-10 L 650,-10 L 650,370 L -10,370 Z ${personPath}`}
                fill="rgba(0,0,0,0.65)"
              />

              {/* Person outline */}
              <path
                d={personPath}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              >
                {!isBodyInFrame && (
                  <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                )}
              </path>

              {/* Corner brackets */}
              {corners.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={isBodyInFrame ? '#4ade80' : '#5eead4'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Glow when detected */}
              {isBodyInFrame && (
                <path
                  d={personPath}
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="10"
                  strokeLinejoin="round"
                  opacity="0.15"
                />
              )}

              {/* Scanning line when not detected */}
              {!isBodyInFrame && (
                <rect
                  x={scanLeft} y={scanTop}
                  width={scanW} height="2"
                  fill="#5eead4" opacity="0.6" rx="1"
                >
                  <animate
                    attributeName="y"
                    values={`${scanTop};${scanBottom};${scanTop}`}
                    dur="3s" repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0.2;0.6"
                    dur="3s" repeatCount="indefinite"
                  />
                </rect>
              )}
            </svg>

            {/* Top instruction text */}
            <div className="absolute top-0 left-0 right-0 pt-14 pb-3 flex items-center justify-center" style={{ zIndex: 2 }}>
              <div className="bg-black/40 backdrop-blur-sm rounded-full px-6 py-2">
                <p className="text-base font-bold text-white">
                  📷 กรุณายืนให้ตัวอยู่ในกรอบ
                </p>
              </div>
            </div>

            {/* Status / Countdown at bottom */}
            <div className="absolute left-0 right-0 flex flex-col items-center" style={{ bottom: '10%', zIndex: 2 }}>
              {countdown !== null ? (
                <div className="text-center">
                  <div className="text-8xl font-black text-green-400 drop-shadow-[0_0_30px_rgba(74,222,128,0.5)] animate-bounce">
                    {countdown}
                  </div>
                  <p className="text-xl font-bold text-white mt-3 drop-shadow-lg">เตรียมตัว...</p>
                </div>
              ) : (
                <div className="text-center px-4">
                  {isBodyInFrame ? (
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-2xl px-6 py-3 border border-green-400/30">
                      <p className="text-xl font-bold text-green-400">
                        ✅ ตรวจพบแล้ว! เริ่มนับถอยหลัง...
                      </p>
                    </div>
                  ) : (
                    <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <p className="text-xl font-bold text-white/90">
                          ไม่พบผู้ใช้ในกรอบ
                        </p>
                      </div>
                      <p className="text-sm text-white/60">
                        กรุณาขยับตัวให้อยู่กึ่งกลางหน้าจอ
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {screen === 'PLAYING' && (
        <GameBoard
          isPlaying={true}
          leftHand={leftHand}
          rightHand={rightHand}
          customMoleImage={customMoleImage}
          onScoreChange={setScore}
          onTimeChange={setTimeLeft}
          gameDuration={GAME_DURATION}
          onGameEnd={handleGameEnd}
          difficulty={difficulty}
          difficultySettings={DIFFICULTY_SETTINGS[difficulty]}
          onMoleHit={handleMoleHit}
          onBombHit={handleBombHit}
        />
      )}
      
      {screen === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full text-center border border-white/20">
            {/* Game over title */}
            <h2 className="text-4xl font-black text-white mb-2">หมดเวลา!</h2>
            <p className="text-white/70 mb-6">Game Over</p>
            
            {/* Score display */}
            <div className="bg-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="w-10 h-10 text-yellow-400" />
                <span className="text-5xl font-black text-white">{score}</span>
              </div>
              
              {isNewRecord && (
                <div className="flex items-center justify-center gap-2 text-yellow-400 animate-pulse mb-2">
                  <span className="text-lg">🏆 สถิติใหม่ของคุณ! 🏆</span>
                </div>
              )}
              
              {score > highScore - 1 && score === highScore && (
                <div className="flex items-center justify-center gap-2 text-yellow-400 animate-pulse">
                  <span className="text-lg">🎉 คะแนนสูงสุดใหม่! 🎉</span>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
                <div>
                  <p className="text-white/60 text-sm">คะแนนสูงสุด (เครื่องนี้)</p>
                  <p className="text-white text-xl font-bold">{Math.max(score, highScore)}</p>
                </div>
                {personalBest > 0 && (
                  <div>
                    <p className="text-white/60 text-sm">สถิติส่วนตัว (ออนไลน์)</p>
                    <p className="text-amber-400 text-xl font-bold">{personalBest}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={restartGame}
                className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold hover:scale-[1.02] transition-transform"
              >
                <RotateCcw className="w-5 h-5" />
                เล่นอีกครั้ง
              </button>
              
              <button
                onClick={goToMenu}
                className="flex items-center justify-center gap-2 w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-colors"
              >
                กลับเมนู
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hand indicators (debug) */}
      {screen === 'PLAYING' && (
        <div className="absolute bottom-4 left-4 text-xs text-white/50 bg-black/30 rounded-lg p-2 z-40">
          <p>🟢 มือซ้าย: {leftHand?.isDetected ? '✓' : '✗'}</p>
          <p>🟠 มือขวา: {rightHand?.isDetected ? '✓' : '✗'}</p>
        </div>
      )}
    </div>
  );
}
