import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Music, 
  Flame, 
  Heart, 
  Dumbbell, 
  Sparkles, 
  Brain,
  Zap,
  Play,
  ChevronRight,
  PersonStanding,
  Waves,
  Footprints,
  Wind,
  Crown,
  Timer,
  TrendingUp,
  Monitor,
  Smartphone,
  Tv,
  Target,
  Users,
  Star,
  Clock,
  Volume2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMobileDevice } from '@/lib/session';
import { useTheme } from '@/contexts/ThemeContext';

// Workout styles data with images (restricted to KAYA options)
const workoutStyles: WorkoutStyle[] = [
  {
    id: 'kaya-stretch',
    name: 'KAYA เริ่มต้น',
    nameEn: 'KAYA Beginner',
    description: 'AI วิเคราะห์ท่าทาง + เสียงโค้ชแนะนำแบบ Real-time',
    icon: <Brain className="w-8 h-8" />,
    color: 'text-green-400',
    bgGradient: 'from-green-600/90 via-emerald-600/80 to-teal-800/90',
    duration: '10-20 นาที',
    calories: '80-150',
    level: 'ง่าย',
    features: ['AI Coach', 'TTS Voice', 'Pose Guide'],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    accentColor: 'green'
  },
  {
    id: 'kaya-intermediate',
    name: 'KAYA Intermediate',
    nameEn: 'KAYA Intermediate',
    description: 'สควอต + ยกแขน, สควอต + บิดลำตัว, ยกเข่าสูง',
    icon: <Brain className="w-8 h-8" />,
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-500/80 via-orange-400/70 to-amber-500/50',
    duration: '8-12 นาที',
    calories: '40-80',
    level: 'ปานกลาง',
    features: ['AI Coach', 'Visual Guide', 'TTS', 'Squat Combo'],
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    accentColor: 'yellow'
  },
  {
    id: 'kaya-advanced',
    name: 'KAYA ระดับสูง',
    nameEn: 'KAYA Advanced',
    description: 'กระโดดสควอต บิดลำตัวเร็ว วิ่งยกเข่า ฝึกพลังระเบิด',
    icon: <Zap className="w-8 h-8" />,
    color: 'text-orange-400',
    bgGradient: 'from-orange-600/90 via-red-500/80 to-rose-700/90',
    duration: '12-18 นาที',
    calories: '120-200',
    level: 'หนัก',
    features: ['AI Coach', 'Jump Detection', 'Speed Analysis', 'Cardio'],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    accentColor: 'orange'
  },
  {
    id: 'kaya-expert',
    name: 'KAYA ผู้เชี่ยวชาญ',
    nameEn: 'KAYA Expert',
    description: 'เบอร์พี กระโดดบิดลำตัว สปรินต์ยกเข่า ท้าทายขั้นสูงสุด!',
    icon: <Crown className="w-8 h-8" />,
    color: 'text-rose-400',
    bgGradient: 'from-rose-600/90 via-pink-500/80 to-purple-700/90',
    duration: '15-25 นาที',
    calories: '180-300',
    level: 'ผู้เชี่ยวชาญ',
    features: ['AI Coach', 'Multi-Phase', 'Air Movement', 'Sprint Mode'],
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80',
    accentColor: 'rose'
  }
];

// Level badge colors
const levelColors: Record<string, string> = {
  'ง่าย': 'bg-green-500/30 text-green-300 border-green-500/50',
  'ปานกลาง': 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
  'หนัก': 'bg-orange-500/30 text-orange-300 border-orange-500/50',
  'ผู้เชี่ยวชาญ': 'bg-rose-500/30 text-rose-300 border-rose-500/50'
};

// Group workouts by level
const workoutsByLevel = {
  'ง่าย': workoutStyles.filter(s => s.level === 'ง่าย'),
  'ปานกลาง': workoutStyles.filter(s => s.level === 'ปานกลาง'),
  'หนัก': workoutStyles.filter(s => s.level === 'หนัก'),
  'ผู้เชี่ยวชาญ': workoutStyles.filter(s => s.level === 'ผู้เชี่ยวชาญ'),
};

const levelInfo: Record<string, { icon: React.ReactNode; title: string; subtitle: string }> = {
  'ง่าย': { icon: <Sparkles className="w-5 h-5" />, title: 'Beginner', subtitle: 'เริ่มต้น' },
  'ปานกลาง': { icon: <TrendingUp className="w-5 h-5" />, title: 'Intermediate', subtitle: 'ระดับกลาง' },
  'หนัก': { icon: <Zap className="w-5 h-5" />, title: 'Advanced', subtitle: 'ระดับสูง' },
  'ผู้เชี่ยวชาญ': { icon: <Crown className="w-5 h-5" />, title: 'Expert', subtitle: 'ผู้เชี่ยวชาญ' },
};

export default function WorkoutSelection() {
  const navigate = useNavigate();
  const [isMobile] = useState(() => isMobileDevice());
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isDesktop, setIsDesktop] = useState(false);
  // Preselect the new intermediate KAYA style so it appears highlighted on load
  const [selectedStyle, setSelectedStyle] = useState<string | null>('kaya-intermediate');

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleStyleSelect = (styleId: string) => {
    localStorage.setItem('kaya_workout_style', styleId);
    navigate('/workout-intro');
  };

  const handleAIPersonalized = () => {
    navigate('/ai-workout-quiz');
  };

  // Desktop Layout - Gallery Style (Full Screen Duolingo Style)
  const DesktopLayout = () => (
    <div className={cn(
      "min-h-screen",
      isDark ? "bg-[#0a0a0f] text-white" : "bg-slate-100 text-gray-900"
    )}>
      {/* Top Navigation Bar */}
      <nav className={cn(
        "sticky top-0 z-50 backdrop-blur-xl border-b",
        isDark ? "bg-[#0a0a0f]/80 border-white/10" : "bg-white/80 border-gray-200"
      )}>
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Workout</span>
            </div>
          </div>
          
          {/* Big Screen Button */}
          <button
            onClick={() => navigate('/bigscreen-setup')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all hover:scale-[1.02]",
              isDark 
                ? "bg-green-500/20 border-green-500/40 hover:border-green-500/60" 
                : "bg-green-50 border-green-300 hover:border-green-400"
            )}
          >
            <Tv className="w-5 h-5 text-green-500" />
            <span className={cn("font-medium", isDark ? "text-green-400" : "text-green-700")}>Big Screen</span>
            <div className="flex items-center gap-1 ml-2">
              <Monitor className="w-4 h-4 text-green-500" />
              <span className="text-gray-500">+</span>
              <Smartphone className="w-4 h-4 text-green-500" />
            </div>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Hero Section - AI Workout */}
        <div className="mb-8">
          <button
            onClick={handleAIPersonalized}
            className="w-full group relative overflow-hidden rounded-3xl transition-all hover:scale-[1.01] hover:shadow-2xl"
          >
            {/* Background */}
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1200&q=80" 
                alt="AI Workout"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-primary/40 to-black/70" />
            </div>
            
            {/* Content */}
            <div className="relative p-10 flex items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-500/50 text-yellow-300 text-sm font-bold">
                    AI POWERED
                  </span>
                </div>
                <h2 className="text-4xl font-black mb-3">
                  <span className="text-white">PERSONALIZED</span>
                  {' '}
                  <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">WORKOUT</span>
                </h2>
                <p className="text-gray-300 text-base mb-5 max-w-lg">
                  ให้ AI วิเคราะห์และสร้างโปรแกรมที่เหมาะกับคุณโดยเฉพาะ
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <Brain className="w-5 h-5" />
                    <span>Smart Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Target className="w-5 h-5" />
                    <span>Goal Oriented</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl shadow-primary/30">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur">
                  <Play className="w-8 h-8 text-white" />
                  <span className="text-white font-bold">START</span>
                </div>
              </div>
            </div>
          </button>

        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-1">Choose Your Level</h2>
            <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-500")}>
              เลือกระดับความยากที่เหมาะกับคุณ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl",
              isDark ? "bg-white/5" : "bg-white shadow-sm"
            )}>
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">4 Levels</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl",
              isDark ? "bg-white/5" : "bg-white shadow-sm"
            )}>
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">12 Exercises</span>
            </div>
          </div>
        </div>

        {/* Workout Cards by Level */}
        <div className="space-y-8">
          {Object.entries(workoutsByLevel).map(([level, styles]) => (
            styles.length > 0 && (
              <div key={level} className="space-y-4">
                {/* Level Header */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    level === 'ง่าย' && "bg-green-500/20 text-green-400",
                    level === 'ปานกลาง' && "bg-yellow-500/20 text-yellow-400",
                    level === 'หนัก' && "bg-orange-500/20 text-orange-400",
                    level === 'ผู้เชี่ยวชาญ' && "bg-rose-500/20 text-rose-400"
                  )}>
                    {levelInfo[level]?.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{levelInfo[level]?.title}</h3>
                    <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                      {levelInfo[level]?.subtitle}
                    </p>
                  </div>
                  <div className={cn(
                    "ml-auto px-3 py-1 rounded-full text-xs font-bold border",
                    levelColors[level]
                  )}>
                    {styles.length} โปรแกรม
                  </div>
                </div>

                {/* Level Cards */}
                <div className="grid grid-cols-1 gap-4">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleSelect(style.id)}
                      onMouseEnter={() => setSelectedStyle(style.id)}
                      onMouseLeave={() => setSelectedStyle(null)}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl transition-all duration-500 text-left h-48",
                        selectedStyle === style.id ? "scale-[1.02] z-10 ring-2 ring-primary" : "hover:scale-[1.01]"
                      )}
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0">
                        <img 
                          src={style.image} 
                          alt={style.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className={cn(
                          "absolute inset-0 transition-all duration-500",
                          selectedStyle === style.id 
                            ? `bg-gradient-to-r ${style.bgGradient} opacity-90` 
                            : "bg-gradient-to-r from-black/90 via-black/60 to-black/30"
                        )} />
                      </div>
                      
                      {/* Content */}
                      <div className="relative h-full p-6 flex items-center gap-6">
                        {/* Icon */}
                        <div className={cn(
                          "w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm border transition-all duration-300 shrink-0",
                          "bg-white/10 border-white/20 group-hover:scale-110",
                          style.color
                        )}>
                          {style.icon}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-2xl font-black tracking-wide text-white">
                              {style.name}
                            </h3>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold border",
                              levelColors[style.level]
                            )}>
                              {style.level}
                            </span>
                          </div>
                          <p className="text-white/80 text-base mb-3 line-clamp-1">
                            {style.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-white/70">
                              <Clock className="w-4 h-4" /> {style.duration}
                            </span>
                            <span className="flex items-center gap-1 text-white/70">
                              <Flame className="w-4 h-4 text-orange-400" /> {style.calories} kcal
                            </span>
                            <span className="flex items-center gap-1 text-white/70">
                              <Target className="w-4 h-4 text-primary" /> 3 ท่า
                            </span>
                          </div>
                          {/* Features */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {style.features.slice(0, 4).map((feature, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Play Button */}
                        <div className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                          selectedStyle === style.id 
                            ? "bg-primary scale-110" 
                            : "bg-white/20 backdrop-blur-sm group-hover:bg-white/30"
                        )}>
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Bottom Stats */}
        <div className={cn(
          "mt-10 p-10 rounded-3xl",
          isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-lg"
        )}>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-5xl font-black text-green-500">4</p>
              <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-500")}>Levels</p>
            </div>
            <div className={cn("w-px h-20", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div className="text-center">
              <p className="text-5xl font-black text-orange-500">12</p>
              <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-500")}>Exercises</p>
            </div>
            <div className={cn("w-px h-20", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div className="text-center">
              <p className="text-5xl font-black text-primary">AI</p>
              <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-500")}>Powered</p>
            </div>
            <div className={cn("w-px h-20", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div className="text-center">
              <p className="text-5xl font-black text-purple-500">TTS</p>
              <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-500")}>Voice Coach</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  // Mobile Layout (Original)
  const MobileLayout = () => (
    <div className={cn(
      "min-h-screen relative overflow-x-hidden",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Animated Background - Dark Theme Only */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/3 -left-40 w-60 h-60 bg-purple-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
      )}

      <div className="relative z-10 px-4 pt-6 pb-24">
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
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">PRO</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black mb-3 tracking-tight">
            <span className={cn(
              "bg-clip-text text-transparent",
              isDark 
                ? "bg-gradient-to-r from-white via-gray-200 to-gray-400" 
                : "bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500"
            )}>
              CHOOSE YOUR
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              WORKOUT
            </span>
          </h1>
          <p className={cn("text-lg", isDark ? "text-gray-400" : "text-gray-600")}>
            เลือกสไตล์การออกกำลังกายที่เหมาะกับคุณ
          </p>
        </div>

        {/* AI Personalized Banner */}
        <div className="mb-8">
          <button
            onClick={handleAIPersonalized}
            className="w-full group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.02]"
          >
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1200&q=80" 
                alt="AI Workout"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-primary/50 to-black/80" />
            </div>
            
            <div className="relative p-6 flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/50 group-hover:scale-110 transition-transform">
                <Brain className="w-10 h-10 text-white" />
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-300">AI POWERED</span>
                </div>
                <h2 className="text-xl font-black text-white mb-1">PERSONALIZED</h2>
                <p className="text-gray-300 text-sm">ให้ AI สร้างโปรแกรมที่เหมาะกับคุณ</p>
              </div>
              
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className={cn("flex-1 h-px", isDark ? "bg-white/20" : "bg-gray-300")} />
          <span className={cn("text-sm font-medium", isDark ? "text-gray-500" : "text-gray-400")}>หรือเลือกสไตล์</span>
          <div className={cn("flex-1 h-px", isDark ? "bg-white/20" : "bg-gray-300")} />
        </div>

        {/* Workout Styles - Mobile List by Level */}
        <div className="space-y-6 pb-8">
          {Object.entries(workoutsByLevel).map(([level, styles]) => (
            styles.length > 0 && (
              <div key={level} className="space-y-3">
                {/* Level Header */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    level === 'ง่าย' && "bg-green-500/20 text-green-400",
                    level === 'ปานกลาง' && "bg-yellow-500/20 text-yellow-400",
                    level === 'หนัก' && "bg-orange-500/20 text-orange-400",
                    level === 'ผู้เชี่ยวชาญ' && "bg-rose-500/20 text-rose-400"
                  )}>
                    {levelInfo[level]?.icon}
                  </div>
                  <span className="font-bold">{levelInfo[level]?.title}</span>
                  <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
                    ({levelInfo[level]?.subtitle})
                  </span>
                </div>

                {/* Cards */}
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style.id)}
                    className="w-full group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="absolute inset-0">
                      <img 
                        src={style.image} 
                        alt={style.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className={cn("absolute inset-0 bg-gradient-to-r", style.bgGradient)} />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40" />
                    </div>
                    
                    <div className="relative p-4 flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center backdrop-blur-sm border",
                        "bg-white/10 border-white/20",
                        style.color
                      )}>
                        {style.icon}
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-black tracking-wide text-white">{style.name}</h3>
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", levelColors[style.level])}>
                            {style.level}
                          </span>
                        </div>
                        <p className="text-white/70 text-xs mb-2">{style.description}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-white/60">
                            <Timer className="w-3 h-3" /> {style.duration}
                          </span>
                          <span className="flex items-center gap-1 text-white/60">
                            <Flame className="w-3 h-3 text-orange-400" /> {style.calories} kcal
                          </span>
                          <span className="flex items-center gap-1 text-white/60">
                            <Target className="w-3 h-3 text-primary" /> 3 ท่า
                          </span>
                        </div>
                      </div>
                      
                      <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            )
          ))}
        </div>

        {/* Stats Footer */}
        <div className={cn(
          "p-4 rounded-2xl backdrop-blur-sm border",
          isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-green-400">4</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Levels</p>
            </div>
            <div className={cn("w-px h-10", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div>
              <p className="text-2xl font-bold text-orange-400">12</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Exercises</p>
            </div>
            <div className={cn("w-px h-10", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div>
              <p className="text-2xl font-bold text-primary">AI</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Powered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}
