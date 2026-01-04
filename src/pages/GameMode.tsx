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
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

// Game types
interface Game {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  duration: string;
  difficulty: 'ง่าย' | 'ปานกลาง' | 'ยาก';
  features: string[];
  image: string;
  accentColor: string;
  highScore?: number;
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
    bgGradient: 'from-amber-600/90 via-orange-600/80 to-red-800/90',
    duration: 'ไม่จำกัด',
    difficulty: 'ปานกลาง',
    features: ['Endless Run', 'Collect Cheese'],
    image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=80',
    accentColor: 'amber',
    highScore: 1250
  },
  {
    id: 'whack-a-mole',
    name: 'ตีตัวตุ่น',
    nameEn: 'Whack-a-Mole',
    description: 'ตีตัวตุ่นให้เร็วที่สุด! ทดสอบความเร็วมือของคุณ',
    icon: <Hammer className="w-8 h-8" />,
    color: 'text-green-400',
    bgGradient: 'from-green-600/90 via-emerald-600/80 to-teal-800/90',
    duration: '60 วินาที',
    difficulty: 'ง่าย',
    features: ['Reflex Test', 'Time Attack'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    accentColor: 'green',
    highScore: 45
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
  const isDark = theme === 'dark';
  const [isDesktop, setIsDesktop] = useState(false);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleGameSelect = (gameId: string) => {
    if (gameId === 'mouse-running') {
      navigate('/mouse-running-game');
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

  // Desktop Layout - No sidebar (handled by AppLayout)
  const DesktopLayout = () => (
    <div className={cn(
      "min-h-screen",
      isDark ? "bg-[#0a0a0f] text-white" : "bg-slate-100 text-gray-900"
    )}>
      {/* Animated Background */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      {/* Main Content */}
      <div className="p-8 relative z-10">
        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black">
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                  GAME MODE
                </span>
              </h1>
              <p className={cn("text-lg", isDark ? "text-gray-400" : "text-gray-500")}>
                เล่นเกมสนุกๆ ผ่อนคลายจากการออกกำลังกาย
              </p>
            </div>
            
            {/* User Stats */}
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center gap-3 px-5 py-3 rounded-2xl",
                isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-lg"
              )}>
                <Trophy className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">1,295</p>
                  <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>Total Score</p>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-3 px-5 py-3 rounded-2xl",
                isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-lg"
              )}>
                <Star className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>Stars Earned</p>
                </div>
              </div>
            </div>
          </div>

          {/* Games Grid - Large Cards */}
          <div className="grid grid-cols-2 gap-8">
            {games.map((game, index) => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
                className={cn(
                  "group relative overflow-hidden rounded-3xl transition-all duration-500 text-left",
                  hoveredGame === game.id ? "scale-[1.02] shadow-2xl" : ""
                )}
                style={{ height: '400px' }}
              >
                {/* Background */}
                <div className="absolute inset-0">
                  <img 
                    src={game.image} 
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className={cn(
                    "absolute inset-0 transition-all duration-500",
                    hoveredGame === game.id 
                      ? `bg-gradient-to-t ${game.bgGradient} opacity-90` 
                      : "bg-gradient-to-t from-black/90 via-black/50 to-black/30"
                  )} />
                </div>
                
                {/* Glow Effect */}
                <div className={cn(
                  "absolute inset-0 transition-opacity duration-500",
                  hoveredGame === game.id ? "opacity-100" : "opacity-0"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>
                
                {/* Content */}
                <div className="relative h-full p-8 flex flex-col justify-between">
                  {/* Top */}
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm border transition-all duration-300 group-hover:scale-110",
                      "bg-white/10 border-white/20",
                      game.color
                    )}>
                      <div className="w-10 h-10 [&>svg]:w-10 [&>svg]:h-10">{game.icon}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold border",
                        difficultyColors[game.difficulty]
                      )}>
                        {game.difficulty}
                      </span>
                      {game.highScore && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur">
                          <Trophy className="w-5 h-5 text-yellow-400" />
                          <span className="text-yellow-400 font-bold text-lg">{game.highScore.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom */}
                  <div>
                    <h3 className="text-4xl font-black tracking-wide text-white mb-3">
                      {game.name}
                    </h3>
                    <p className="text-white/80 text-lg mb-6 max-w-md line-clamp-2">{game.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm">
                          <Timer className="w-5 h-5" />
                          <span>{game.duration}</span>
                        </div>
                        {game.features.slice(0, 2).map((feature, i) => (
                          <span 
                            key={i}
                            className="px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm border border-white/10"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                      
                      {/* Play Button */}
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
                        "bg-white/20 backdrop-blur-sm border border-white/30",
                        "group-hover:bg-white/30 group-hover:scale-110 group-hover:border-white/50"
                      )}>
                        <Play className="w-10 h-10 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Coming Soon */}
          <div className={cn(
            "mt-8 p-8 rounded-3xl border-2 border-dashed text-center",
            isDark ? "border-white/20 bg-white/5" : "border-gray-300 bg-gray-100"
          )}>
            <Gamepad2 className={cn("w-16 h-16 mx-auto mb-4", isDark ? "text-gray-600" : "text-gray-400")} />
            <p className={cn("font-bold text-2xl mb-2", isDark ? "text-gray-400" : "text-gray-500")}>
              เกมใหม่กำลังมา...
            </p>
            <p className={cn("text-base", isDark ? "text-gray-600" : "text-gray-400")}>
              คอยติดตามอัพเดทเกมสนุกๆ เพิ่มเติม
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Layout (Original)
  const MobileLayout = () => (
    <div className={cn(
      "min-h-screen relative overflow-x-hidden",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/3 -left-40 w-60 h-60 bg-pink-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
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
            "flex items-center gap-2 px-3 py-1.5 rounded-full border",
            isDark 
              ? "bg-white/10 border-white/10" 
              : "bg-white border-gray-200 shadow-sm"
          )}>
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">GAMES</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black mb-3 tracking-tight">
            <span className={cn(
              "bg-clip-text text-transparent",
              isDark 
                ? "bg-gradient-to-r from-white via-gray-200 to-gray-400" 
                : "bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500"
            )}>
              GAME
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              MODE
            </span>
          </h1>
          <p className={cn("text-lg", isDark ? "text-gray-400" : "text-gray-600")}>
            เล่นเกมสนุกๆ ผ่อนคลายจากการออกกำลังกาย
          </p>
        </div>

        {/* Stats Bar */}
        <div className={cn(
          "mb-8 p-4 rounded-2xl border backdrop-blur-sm",
          isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                <span className="text-2xl font-bold">2</span>
              </div>
              <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>เกมทั้งหมด</span>
            </div>
            <div className={cn("w-px h-10", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-2xl font-bold">1,295</span>
              </div>
              <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>คะแนนรวม</span>
            </div>
            <div className={cn("w-px h-10", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-bold">3</span>
              </div>
              <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>ดาวที่ได้</span>
            </div>
          </div>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          {games.map((game, index) => (
            <button
              key={game.id}
              onClick={() => handleGameSelect(game.id)}
              className="w-full group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]"
            >
              <div className="absolute inset-0">
                <img 
                  src={game.image} 
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={cn("absolute inset-0 bg-gradient-to-r", game.bgGradient)} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/50" />
              </div>
              
              <div className="relative p-5 flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border transition-all duration-300 group-hover:scale-110",
                  "bg-white/10 border-white/20",
                  game.color
                )}>
                  {game.icon}
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-black tracking-wide text-white">{game.name}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", difficultyColors[game.difficulty])}>
                      {game.difficulty}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm mb-3">{game.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-white/60 text-xs">
                      <Timer className="w-3.5 h-3.5" />
                      <span>{game.duration}</span>
                    </div>
                    {game.highScore && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-yellow-400 text-xs font-bold">{game.highScore.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-8">
          <div className={cn(
            "p-6 rounded-2xl border border-dashed text-center",
            isDark ? "border-white/20 bg-white/5" : "border-gray-300 bg-gray-100"
          )}>
            <Gamepad2 className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-400")} />
            <p className={cn("font-medium text-lg", isDark ? "text-gray-400" : "text-gray-500")}>
              เกมใหม่กำลังมา...
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}
