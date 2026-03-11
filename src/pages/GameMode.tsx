import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Gamepad2,
  Trophy,
  Star,
  Play,
  Timer,
  Zap,
  Target,
  MousePointer2,
  Hammer,
  Crown,
  Medal,
  Flame,
  Users,
  TrendingUp,
  Fish,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAllPersonalBests, type AllGameBests } from '@/lib/gameScores';

// Game types
interface Game {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  bgGradient: string;
  duration: string;
  difficulty: 'ง่าย' | 'ปานกลาง' | 'ยาก';
  features: string[];
  image: string;
  accentColor: string;
}

// Games data
const games: Game[] = [
  {
    id: 'mouse-running',
    name: 'MOUSE RUNNING',
    nameEn: 'Escape the Cat!',
    description: 'วิ่งหนีแมว! เก็บชีสให้ได้มากที่สุด',
    icon: <MousePointer2 className="w-8 h-8" />,
    color: 'text-amber-400',
    glowColor: 'rgba(251,191,36,0.4)',
    bgGradient: 'from-amber-600/90 via-orange-600/80 to-red-800/90',
    duration: 'ไม่จำกัด',
    difficulty: 'ปานกลาง',
    features: ['Endless Run', 'Collect Cheese'],
    image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=80',
    accentColor: 'amber'
  },
  {
    id: 'whack-a-mole',
    name: 'ตีตัวตุ่น',
    nameEn: 'Whack-a-Mole',
    description: 'ตีตัวตุ่นให้เร็วที่สุด! ทดสอบความเร็วมือของคุณ',
    icon: <Hammer className="w-8 h-8" />,
    color: 'text-green-400',
    glowColor: 'rgba(74,222,128,0.4)',
    bgGradient: 'from-green-600/90 via-emerald-600/80 to-teal-800/90',
    duration: '60 วินาที',
    difficulty: 'ง่าย',
    features: ['Reflex Test', 'Time Attack'],
    image: 'https://plus.unsplash.com/premium_photo-1725408008366-390dfe32d0a6?q=80&w=1120&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    accentColor: 'green'
  },
  {
    id: 'fishing',
    name: 'ตกปลา',
    nameEn: 'Fishing Game',
    description: 'ตกปลาสุดสนุก! ใช้ท่าทางจริงในการตกปลา',
    icon: <Fish className="w-8 h-8" />,
    color: 'text-cyan-400',
    glowColor: 'rgba(34,211,238,0.4)',
    bgGradient: 'from-cyan-600/90 via-blue-600/80 to-indigo-800/90',
    duration: 'ไม่จำกัด',
    difficulty: 'ปานกลาง',
    features: ['Motion Control', 'Collect Fish'],
    image: 'https://plus.unsplash.com/premium_photo-1723575688585-d9bf8959f7f7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    accentColor: 'cyan'
  }
];

// Difficulty badge colors
const difficultyColors = {
  'ง่าย': 'bg-green-500/30 text-green-300 border-green-500/50',
  'ปานกลาง': 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
  'ยาก': 'bg-red-500/30 text-red-300 border-red-500/50'
};

export default function GameMode() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { lineProfile } = useAuth();
  const isDark = theme === 'dark';
  const [isDesktop, setIsDesktop] = useState(false);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [highScores, setHighScores] = useState<AllGameBests>({
    mouseRunning: 0,
    whackAMole: 0,
    fishing: 0,
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch high scores from database
  useEffect(() => {
    const fetchHighScores = async () => {
      if (!lineProfile?.userId) return;
      
      try {
        const scores = await getAllPersonalBests(lineProfile.userId);
        setHighScores(scores);
      } catch (error) {
        console.error('Failed to fetch high scores:', error);
      }
    };
    
    fetchHighScores();
  }, [lineProfile?.userId]);

  // Helper to get high score for a game
  const getHighScore = (gameId: string): number => {
    // Don't show fishing scores
    if (gameId === 'fishing') return 0;
    
    const gameIdMap: Record<string, keyof AllGameBests> = {
      'mouse-running': 'mouseRunning',
      'whack-a-mole': 'whackAMole',
      'fishing': 'fishing',
    };
    const key = gameIdMap[gameId];
    return key ? highScores[key] : 0;
  };

  // Computed stats
  const totalScore = highScores.mouseRunning + highScores.whackAMole;
  const gamesPlayed = [highScores.mouseRunning, highScores.whackAMole].filter(s => s > 0).length;
  const starsEarned = gamesPlayed; // 1 star per game with a high score

  const handleGameSelect = (gameId: string) => {
    if (gameId === 'mouse-running') {
      navigate('/mouse-running-game');
    } else if (gameId === 'whack-a-mole') {
      navigate('/whack-a-mole-game');
    } else if (gameId === 'fishing') {
      navigate('/fishing-game');
    } else {
      console.log('Selected game:', gameId);
    }
  };

  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, name: "ProGamer99", score: 12500, avatar: "🏆" },
    { rank: 2, name: "FitQueen", score: 11200, avatar: "👑" },
    { rank: 3, name: "SpeedRunner", score: 10800, avatar: "⚡" },
    { rank: 4, name: "CheeseHunter", score: 9500, avatar: "🧀" },
    { rank: 5, name: "You", score: 1295, avatar: "😎", isUser: true },
  ];

  // Desktop Layout - Premium Gaming UI
  const DesktopLayout = () => (
    <div className={cn(
      "min-h-screen",
      isDark ? "bg-[#080810] text-white" : "bg-slate-100 text-gray-900"
    )}>
      {/* Animated Background */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[180px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />
        </div>
      )}

      {/* Main Content */}
      <div className="p-6 lg:p-10 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <span className={cn("text-sm font-semibold tracking-widest uppercase", isDark ? "text-purple-400" : "text-purple-600")}>
                  Game Center
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  SELECT GAME
                </span>
              </h1>
              <p className={cn("text-lg mt-2", isDark ? "text-gray-500" : "text-gray-500")}>
                เลือกเกมที่ต้องการเล่น แล้วออกกำลังกายไปพร้อมกัน
              </p>
            </div>
            
            {/* Stats Badges */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all",
                isDark ? "bg-yellow-500/10 border-yellow-500/20" : "bg-white shadow-lg border-yellow-200"
              )}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black text-yellow-400">{totalScore.toLocaleString()}</p>
                  <p className={cn("text-[10px] font-bold tracking-wider uppercase", isDark ? "text-yellow-600" : "text-yellow-700")}>Total Score</p>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all",
                isDark ? "bg-purple-500/10 border-purple-500/20" : "bg-white shadow-lg border-purple-200"
              )}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black text-purple-400">{games.length}</p>
                  <p className={cn("text-[10px] font-bold tracking-wider uppercase", isDark ? "text-purple-600" : "text-purple-700")}>Games</p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Game (First game large) */}
          <div className="grid grid-cols-12 gap-6">
            {/* Main Featured Card */}
            <button
              onClick={() => handleGameSelect(games[0].id)}
              onMouseEnter={() => setHoveredGame(games[0].id)}
              onMouseLeave={() => setHoveredGame(null)}
              className={cn(
                "col-span-7 group relative overflow-hidden rounded-3xl transition-all duration-500 text-left",
                hoveredGame === games[0].id ? "scale-[1.01] ring-2 ring-amber-500/50" : ""
              )}
              style={{ height: '420px' }}
            >
              {/* Background */}
              <div className="absolute inset-0">
                <img 
                  src={games[0].image} 
                  alt={games[0].name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
                <div className={cn(
                  "absolute inset-0 transition-all duration-500",
                  hoveredGame === games[0].id ? `bg-gradient-to-t ${games[0].bgGradient} opacity-60` : "opacity-0"
                )} />
              </div>
              
              {/* Shimmer */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </div>
              
              {/* Featured Badge */}
              <div className="absolute top-6 left-6 z-10">
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 rounded-full shadow-lg shadow-amber-500/30">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-black tracking-wider">FEATURED</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative h-full p-8 flex flex-col justify-end">
                <div className="flex items-center gap-3 mb-3">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", difficultyColors[games[0].difficulty])}>
                    {games[0].difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs text-white/60 bg-white/10 border border-white/10">
                    <Timer className="w-3 h-3 inline mr-1" />{games[0].duration}
                  </span>
                  {getHighScore(games[0].id) > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      <Trophy className="w-3 h-3 inline mr-1" />{getHighScore(games[0].id).toLocaleString()}
                    </span>
                  )}
                </div>
                <h3 className="text-5xl font-black tracking-tight text-white mb-2">
                  {games[0].name}
                </h3>
                <p className="text-white/70 text-lg mb-6 max-w-lg">{games[0].description}</p>
                
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300",
                    "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/30",
                    "group-hover:shadow-2xl group-hover:shadow-amber-500/40 group-hover:scale-105"
                  )}>
                    <Play className="w-6 h-6 fill-white" />
                    PLAY NOW
                  </div>
                  {games[0].features.map((f, i) => (
                    <span key={i} className="px-4 py-3 rounded-xl bg-white/10 text-white/60 text-sm border border-white/10 backdrop-blur-sm">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </button>

            {/* Side Cards */}
            <div className="col-span-5 flex flex-col gap-6">
              {games.slice(1).map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  onMouseEnter={() => setHoveredGame(game.id)}
                  onMouseLeave={() => setHoveredGame(null)}
                  className={cn(
                    "group relative overflow-hidden rounded-3xl transition-all duration-500 text-left flex-1",
                    hoveredGame === game.id ? "scale-[1.02] ring-2" : ""
                  )}
                  style={hoveredGame === game.id ? { boxShadow: `0 0 40px ${game.glowColor}`, ringColor: game.glowColor } : {}}
                >
                  {/* Background */}
                  <div className="absolute inset-0">
                    <img 
                      src={game.image} 
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
                    <div className={cn(
                      "absolute inset-0 transition-all duration-500",
                      hoveredGame === game.id ? `bg-gradient-to-r ${game.bgGradient} opacity-50` : "opacity-0"
                    )} />
                  </div>
                  
                  {/* Content */}
                  <div className="relative h-full p-6 flex items-center gap-5">
                    {/* Icon */}
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md border transition-all duration-300 flex-shrink-0",
                      "bg-white/10 border-white/20 group-hover:scale-110 group-hover:bg-white/20",
                      game.color
                    )}>
                      <div className="w-8 h-8 [&>svg]:w-8 [&>svg]:h-8">{game.icon}</div>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", difficultyColors[game.difficulty])}>
                          {game.difficulty}
                        </span>
                        {getHighScore(game.id) > 0 && (
                          <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                            <Trophy className="w-3 h-3" /> {getHighScore(game.id).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black tracking-tight text-white mb-1 truncate">
                        {game.name}
                      </h3>
                      <p className="text-white/60 text-sm line-clamp-1">{game.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-white/40 text-xs"><Timer className="w-3 h-3 inline mr-1" />{game.duration}</span>
                        {game.features.map((f, i) => (
                          <span key={i} className="text-white/40 text-xs px-2 py-0.5 rounded bg-white/5">{f}</span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Play */}
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0",
                      "bg-white/10 border border-white/20 backdrop-blur-sm",
                      "group-hover:bg-white/20 group-hover:scale-110"
                    )}>
                      <ChevronRight className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className={cn(
            "mt-8 p-8 rounded-3xl border-2 border-dashed text-center relative overflow-hidden",
            isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-300 bg-gray-100"
          )}>
            {isDark && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5" />
            )}
            <div className="relative">
              <Gamepad2 className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-gray-700" : "text-gray-400")} />
              <p className={cn("font-bold text-xl mb-1", isDark ? "text-gray-500" : "text-gray-500")}>
                เกมใหม่กำลังมา...
              </p>
              <p className={cn("text-sm", isDark ? "text-gray-700" : "text-gray-400")}>
                คอยติดตามอัพเดทเกมสนุกๆ เพิ่มเติม
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Layout - Premium Gaming UI
  const MobileLayout = () => (
    <div className={cn(
      "min-h-screen relative overflow-x-hidden",
      isDark ? "bg-[#080810] text-white" : "bg-gray-50 text-gray-900"
    )}>
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/40 via-transparent to-transparent" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/15 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/3 -left-40 w-60 h-60 bg-cyan-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      <div className="relative z-10 px-4 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/dashboard"
            className={cn(
              "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-all border",
              isDark 
                ? "bg-white/10 border-white/10" 
                : "bg-white border-gray-200 shadow-sm"
            )}
          >
            <ArrowLeft className={cn("w-5 h-5", isDark ? "text-white" : "text-gray-700")} />
          </Link>
          <div className="flex-1" />
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border",
            isDark 
              ? "bg-yellow-500/10 border-yellow-500/20" 
              : "bg-white border-gray-200 shadow-sm"
          )}>
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">{totalScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className={cn("text-xs font-bold tracking-widest uppercase", isDark ? "text-purple-400" : "text-purple-600")}>
              Game Center
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            <span className={cn(
              "bg-clip-text text-transparent",
              isDark 
                ? "bg-gradient-to-r from-white via-purple-200 to-pink-200" 
                : "bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500"
            )}>
              SELECT GAME
            </span>
          </h1>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          {games.map((game, index) => (
            <button
              key={game.id}
              onClick={() => handleGameSelect(game.id)}
              className="w-full group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0">
                <img 
                  src={game.image} 
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
              </div>
              
              <div className="relative p-5 flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md border transition-all duration-300 group-hover:scale-110 flex-shrink-0",
                  "bg-white/10 border-white/20",
                  game.color
                )}>
                  {game.icon}
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-black tracking-tight text-white truncate">{game.name}</h3>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border flex-shrink-0", difficultyColors[game.difficulty])}>
                      {game.difficulty}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mb-2 line-clamp-1">{game.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs"><Timer className="w-3 h-3 inline mr-1" />{game.duration}</span>
                    {getHighScore(game.id) > 0 && (
                      <span className="flex items-center gap-1 ml-auto text-yellow-400 text-xs font-bold">
                        <Trophy className="w-3 h-3" />{getHighScore(game.id).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all flex-shrink-0">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-6">
          <div className={cn(
            "p-6 rounded-2xl border border-dashed text-center",
            isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-300 bg-gray-100"
          )}>
            <Gamepad2 className={cn("w-10 h-10 mx-auto mb-2", isDark ? "text-gray-700" : "text-gray-400")} />
            <p className={cn("font-bold text-base", isDark ? "text-gray-500" : "text-gray-500")}>
              เกมใหม่กำลังมา...
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}
