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

// Workout style types
interface WorkoutStyle {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  duration: string;
  calories: string;
  level: 'ง่าย' | 'ปานกลาง' | 'หนัก';
  features: string[];
  image: string;
  accentColor: string;
}

// Workout styles data with images
const workoutStyles: WorkoutStyle[] = [
  {
    id: 'rhythm',
    name: 'RHYTHM WORKOUT',
    nameEn: 'Dance to the Beat',
    description: 'ออกกำลังกายสนุกๆ พร้อมเพลงที่คุณชอบ',
    icon: <Music className="w-8 h-8" />,
    color: 'text-pink-400',
    bgGradient: 'from-pink-600/90 via-purple-600/80 to-violet-800/90',
    duration: '15-30 นาที',
    calories: '150-300',
    level: 'ปานกลาง',
    features: ['จังหวะเพลง', 'Cardio'],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    accentColor: 'pink'
  },
  {
    id: 'hiit',
    name: 'HIIT EXTREME',
    nameEn: 'Maximum Burn',
    description: 'เผาผลาญไขมันสูงสุดใน 20 นาที',
    icon: <Flame className="w-8 h-8" />,
    color: 'text-orange-400',
    bgGradient: 'from-orange-600/90 via-red-600/80 to-rose-800/90',
    duration: '15-25 นาที',
    calories: '200-400',
    level: 'หนัก',
    features: ['Fat Burn', 'Interval'],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    accentColor: 'orange'
  },
  {
    id: 'strength',
    name: 'POWER TRAINING',
    nameEn: 'Build Your Strength',
    description: 'สร้างกล้ามเนื้อและความแข็งแรง',
    icon: <Dumbbell className="w-8 h-8" />,
    color: 'text-purple-400',
    bgGradient: 'from-purple-600/90 via-indigo-600/80 to-blue-800/90',
    duration: '20-40 นาที',
    calories: '150-300',
    level: 'ปานกลาง',
    features: ['Muscle', 'Toning'],
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=800&q=80',
    accentColor: 'purple'
  },
  {
    id: 'yoga',
    name: 'YOGA FLOW',
    nameEn: 'Mind & Body Balance',
    description: 'ผสมผสานการหายใจ สมาธิ และการเคลื่อนไหว',
    icon: <Waves className="w-8 h-8" />,
    color: 'text-teal-400',
    bgGradient: 'from-teal-600/90 via-emerald-600/80 to-green-800/90',
    duration: '20-60 นาที',
    calories: '100-200',
    level: 'ง่าย',
    features: ['สมาธิ', 'Balance'],
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    accentColor: 'teal'
  },
  {
    id: 'cardio',
    name: 'CARDIO BLAST',
    nameEn: 'Heart Pumping Action',
    description: 'เพิ่มความแข็งแรงของหัวใจและปอด',
    icon: <Heart className="w-8 h-8" />,
    color: 'text-red-400',
    bgGradient: 'from-red-600/90 via-rose-600/80 to-pink-800/90',
    duration: '20-45 นาที',
    calories: '200-450',
    level: 'ปานกลาง',
    features: ['Endurance', 'Stamina'],
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80',
    accentColor: 'red'
  },
  {
    id: 'kaya-stretch',
    name: 'KAYA AI COACH',
    nameEn: 'Smart Stretch with AI',
    description: 'AI วิเคราะห์ท่าทาง + เสียงโค้ชแนะนำแบบ Real-time',
    icon: <Brain className="w-8 h-8" />,
    color: 'text-violet-400',
    bgGradient: 'from-violet-600/90 via-purple-600/80 to-indigo-800/90',
    duration: '10-20 นาที',
    calories: '80-150',
    level: 'ง่าย',
    features: ['AI Coach', 'TTS Voice', 'Pose Guide'],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    accentColor: 'violet'
  },
  {
    id: 'dance',
    name: 'DANCE FITNESS',
    nameEn: 'Move & Groove',
    description: 'เต้นสนุกๆ พร้อมออกกำลังกายไปด้วย',
    icon: <Footprints className="w-8 h-8" />,
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-600/90 via-amber-600/80 to-orange-800/90',
    duration: '20-45 นาที',
    calories: '200-400',
    level: 'ปานกลาง',
    features: ['Fun', 'Full Body'],
    image: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800&q=80',
    accentColor: 'yellow'
  },
  {
    id: 'slow',
    name: 'SLOW & CALM',
    nameEn: 'Relaxing Movement',
    description: 'เคลื่อนไหวช้าๆ เน้นการหายใจและผ่อนคลาย',
    icon: <Wind className="w-8 h-8" />,
    color: 'text-green-400',
    bgGradient: 'from-green-600/90 via-emerald-600/80 to-teal-800/90',
    duration: '20-40 นาที',
    calories: '80-150',
    level: 'ง่าย',
    features: ['Relax', 'Breathing'],
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    accentColor: 'green'
  },
  {
    id: 'kaya-stretch',
    name: 'KAYA AI COACH',
    nameEn: 'Smart Stretch with AI',
    description: 'AI วิเคราะห์ท่าทาง + เสียงโค้ชแนะนำแบบ Real-time',
    icon: <Brain className="w-8 h-8" />,
    color: 'text-violet-400',
    bgGradient: 'from-violet-600/90 via-purple-600/80 to-indigo-800/90',
    duration: '10-20 นาที',
    calories: '80-150',
    level: 'ง่าย',
    features: ['AI Coach', 'TTS Voice', 'Pose Guide'],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    accentColor: 'violet'
  }
];

// Level badge colors
const levelColors = {
  'ง่าย': 'bg-green-500/30 text-green-300 border-green-500/50',
  'ปานกลาง': 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
  'หนัก': 'bg-red-500/30 text-red-300 border-red-500/50'
};

export default function WorkoutSelection() {
  const navigate = useNavigate();
  const [isMobile] = useState(() => isMobileDevice());
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Choose Your Style</h2>
            <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-500")}>
              เลือกสไตล์การออกกำลังกายที่เหมาะกับคุณ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl",
              isDark ? "bg-white/5" : "bg-white shadow-sm"
            )}>
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">8 Styles</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl",
              isDark ? "bg-white/5" : "bg-white shadow-sm"
            )}>
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">50+ Exercises</span>
            </div>
          </div>
        </div>

        {/* Workout Grid - Desktop Gallery */}
        <div className="grid grid-cols-4 gap-6">
          {workoutStyles.map((style, index) => (
            <button
              key={style.id}
              onClick={() => handleStyleSelect(style.id)}
              onMouseEnter={() => setSelectedStyle(style.id)}
              onMouseLeave={() => setSelectedStyle(null)}
              className={cn(
                "group relative overflow-hidden rounded-3xl transition-all duration-500 text-left",
                selectedStyle === style.id ? "scale-105 z-10" : "hover:scale-[1.02]",
                index === 0 || index === 3 ? "row-span-2 h-[500px]" : "h-60"
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
                    ? `bg-gradient-to-t ${style.bgGradient} opacity-80` 
                    : "bg-gradient-to-t from-black/80 via-black/40 to-black/20"
                )} />
              </div>
              
              {/* Content */}
              <div className="relative h-full p-5 flex flex-col justify-between">
                {/* Top - Icon & Badge */}
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm border transition-all duration-300",
                    "bg-white/10 border-white/20 group-hover:scale-110",
                    style.color
                  )}>
                    {style.icon}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold border",
                      levelColors[style.level]
                    )}>
                      {style.level}
                    </span>
                    {/* KAYA AI Coach badges */}
                    {style.id === 'kaya-stretch' && (
                      <div className="flex flex-wrap gap-1 justify-end">
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/40 border border-violet-500/60 text-violet-200 text-[10px] font-bold flex items-center gap-1">
                          <Brain className="w-3 h-3" /> AI
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-pink-500/40 border border-pink-500/60 text-pink-200 text-[10px] font-bold flex items-center gap-1">
                          <Volume2 className="w-3 h-3" /> TTS
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bottom - Text */}
                <div className={cn(
                  "transition-all duration-500",
                  selectedStyle === style.id ? "transform translate-y-0" : ""
                )}>
                  <h3 className="text-xl font-black tracking-wide text-white mb-2">
                    {style.name}
                  </h3>
                  <p className={cn(
                    "text-white/70 text-sm mb-3 transition-all duration-300",
                    selectedStyle === style.id ? "opacity-100" : "opacity-0 lg:opacity-100"
                  )}>
                    {style.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-white/60">
                      <Clock className="w-3 h-3" /> {style.duration}
                    </span>
                    <span className="flex items-center gap-1 text-white/60">
                      <Flame className="w-3 h-3 text-orange-400" /> {style.calories} kcal
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover Play Button */}
              <div className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                selectedStyle === style.id ? "opacity-100" : "opacity-0"
              )}>
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-10 h-10 text-white fill-white" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className={cn(
          "mt-10 p-10 rounded-3xl",
          isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-lg"
        )}>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-5xl font-black text-primary">8+</p>
              <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-500")}>Workout Styles</p>
            </div>
            <div className={cn("w-px h-20", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div className="text-center">
              <p className="text-5xl font-black text-orange-500">50+</p>
              <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-500")}>Exercises</p>
            </div>
            <div className={cn("w-px h-20", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div className="text-center">
              <p className="text-5xl font-black text-green-500">AI</p>
              <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-500")}>Powered</p>
            </div>
            <div className={cn("w-px h-20", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div className="text-center">
              <p className="text-5xl font-black text-purple-500">∞</p>
              <p className={cn("text-base", isDark ? "text-gray-400" : "text-gray-500")}>Possibilities</p>
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

        {/* Workout Styles - Mobile List */}
        <div className="space-y-4 pb-8">
          {workoutStyles.map((style, index) => (
            <button
              key={style.id}
              onClick={() => handleStyleSelect(style.id)}
              className="w-full group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
              style={{ animationDelay: `${index * 100}ms` }}
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
                    {/* KAYA AI badges in mobile list */}
                    {style.id === 'kaya-stretch' && (
                      <>
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/40 border border-violet-500/60 text-violet-200 text-[10px] font-bold">AI</span>
                        <span className="px-2 py-0.5 rounded-full bg-pink-500/40 border border-pink-500/60 text-pink-200 text-[10px] font-bold">TTS</span>
                      </>
                    )}
                  </div>
                  <p className="text-white/70 text-xs mb-2">{style.description}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-white/60">
                      <Timer className="w-3 h-3" /> {style.duration}
                    </span>
                    <span className="flex items-center gap-1 text-white/60">
                      <Flame className="w-3 h-3 text-orange-400" /> {style.calories} kcal
                    </span>
                  </div>
                </div>
                
                <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white transition-all" />
              </div>
            </button>
          ))}
        </div>

        {/* Stats Footer */}
        <div className={cn(
          "p-4 rounded-2xl backdrop-blur-sm border",
          isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-primary">8+</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Styles</p>
            </div>
            <div className={cn("w-px h-10", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div>
              <p className="text-2xl font-bold text-orange-400">50+</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Exercises</p>
            </div>
            <div className={cn("w-px h-10", isDark ? "bg-white/10" : "bg-gray-200")} />
            <div>
              <p className="text-2xl font-bold text-green-400">AI</p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Powered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}
