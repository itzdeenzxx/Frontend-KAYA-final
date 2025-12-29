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
  Hammer
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

  const handleGameSelect = (gameId: string) => {
    // Navigate to game - for now just log
    console.log('Selected game:', gameId);
    // TODO: Navigate to actual game page
    // navigate(`/game/${gameId}`);
  };

  return (
    <div className={cn(
      "min-h-screen relative overflow-x-hidden",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Animated Background - Dark Theme Only */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/3 -left-40 w-60 h-60 bg-pink-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
      )}

      <div className="relative z-10 px-4 md:px-6 pt-6 pb-28 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/dashboard"
            className={cn(
              "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all border",
              isDark 
                ? "bg-white/10 border-white/10" 
                : "bg-white border-gray-200 shadow-sm hover:bg-gray-100"
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

        {/* Hero Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-3 tracking-tight">
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
          <p className={cn("text-lg max-w-md mx-auto", isDark ? "text-gray-400" : "text-gray-600")}>
            เล่นเกมสนุกๆ ผ่อนคลายจากการออกกำลังกาย
          </p>
        </div>

        {/* Stats Bar */}
        <div className={cn(
          "mb-8 p-4 rounded-2xl border backdrop-blur-sm",
          isDark 
            ? "bg-white/5 border-white/10" 
            : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                <span className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>2</span>
              </div>
              <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>เกมทั้งหมด</span>
            </div>
            <div className={cn("w-px h-10", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>1,295</span>
              </div>
              <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>คะแนนรวม</span>
            </div>
            <div className={cn("w-px h-10", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-amber-400" />
                <span className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>3</span>
              </div>
              <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>ดาวที่ได้</span>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-4 mb-6">
          <div className={cn(
            "flex-1 h-px bg-gradient-to-r from-transparent to-transparent",
            isDark ? "via-white/20" : "via-gray-300"
          )} />
          <span className={cn(
            "text-sm font-medium uppercase tracking-wider flex items-center gap-2",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            <Zap className="w-4 h-4" />
            เลือกเกม
          </span>
          <div className={cn(
            "flex-1 h-px bg-gradient-to-r from-transparent to-transparent",
            isDark ? "via-white/20" : "via-gray-300"
          )} />
        </div>

        {/* Game Banners */}
        <div className="space-y-4">
          {games.map((game, index) => (
            <button
              key={game.id}
              onClick={() => handleGameSelect(game.id)}
              className="w-full group relative overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.99]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img 
                  src={game.image} 
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r",
                  game.bgGradient
                )} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/50" />
              </div>
              
              {/* Animated Glow on Hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent",
                  "translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                )} />
              </div>
              
              {/* Content */}
              <div className="relative p-5 md:p-8 flex items-center gap-4 md:gap-6">
                {/* Icon */}
                <div className={cn(
                  "w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-sm border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                  "bg-white/10 border-white/20",
                  game.color
                )}>
                  {game.icon}
                </div>
                
                {/* Text */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl md:text-2xl font-black tracking-wide text-white">
                      {game.name}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold border",
                      difficultyColors[game.difficulty]
                    )}>
                      {game.difficulty}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm md:text-base mb-3">{game.description}</p>
                  
                  {/* Features & Stats */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-1.5 text-white/60 text-xs md:text-sm">
                      <Timer className="w-3.5 h-3.5" />
                      <span>{game.duration}</span>
                    </div>
                    {game.features.map((feature, i) => (
                      <span 
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-xs border border-white/10"
                      >
                        {feature}
                      </span>
                    ))}
                    {game.highScore && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-yellow-400 text-xs md:text-sm font-bold">
                          {game.highScore.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Play Button */}
                <div className={cn(
                  "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                  "bg-white/20 backdrop-blur-sm border border-white/30",
                  "group-hover:bg-white/30 group-hover:border-white/50"
                )}>
                  <Play className="w-6 h-6 md:w-7 md:h-7 text-white fill-white" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "flex-1 h-px bg-gradient-to-r from-transparent to-transparent",
              isDark ? "via-white/20" : "via-gray-300"
            )} />
            <span className={cn(
              "text-sm font-medium uppercase tracking-wider",
              isDark ? "text-gray-500" : "text-gray-400"
            )}>เร็วๆ นี้</span>
            <div className={cn(
              "flex-1 h-px bg-gradient-to-r from-transparent to-transparent",
              isDark ? "via-white/20" : "via-gray-300"
            )} />
          </div>
          
          <div className={cn(
            "p-6 rounded-2xl border border-dashed text-center",
            isDark 
              ? "border-white/20 bg-white/5" 
              : "border-gray-300 bg-gray-100"
          )}>
            <Gamepad2 className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-400")} />
            <p className={cn("font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
              เกมใหม่กำลังมา...
            </p>
            <p className={cn("text-sm mt-1", isDark ? "text-gray-600" : "text-gray-400")}>
              คอยติดตามอัพเดทเกมสนุกๆ เพิ่มเติม
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
